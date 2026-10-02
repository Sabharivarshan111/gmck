import { GOOGLE_SIGN_IN_ENABLED } from './authMode';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';
import { rememberGuestSession, retryGuestMerge } from './guestMerge';

export const GOOGLE_AUTH_FLAG_KEY = '@orbit:google_authenticated_v1';
export const GOOGLE_AUTH_EMAIL_KEY = '@orbit:google_authenticated_email';

/**
 * Google sign-in, exchanged for a Supabase session.
 *
 * The Web Client ID below is the one the published app already uses. It must
 * stay in sync with Supabase → Auth → Providers → Google, which validates the
 * ID token's audience against it.
 *
 * Android additionally needs its own OAuth client in Google Cloud whose SHA-1
 * matches the signing certificate — the upload key for internal testing, and
 * the Play App Signing certificate for production. That client is not
 * referenced here; only its existence matters.
 */
export const GOOGLE_WEB_CLIENT_ID =
  '358287134961-24qidem5pd6qhtkq43b3a9cfcp87c49p.apps.googleusercontent.com';

let configured = false;

export function configureGoogleSignIn(): void {
  if (!GOOGLE_SIGN_IN_ENABLED || configured) {
    return;
  }
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
  });
  configured = true;
}

export class GoogleSignInCancelled extends Error {
  constructor() {
    super('Sign-in cancelled.');
    this.name = 'GoogleSignInCancelled';
  }
}

export interface GoogleAccount {
  email: string | null;
  name: string | null;
}

/** True only for a live Supabase anonymous session on this device. */
export async function isCurrentUserAnonymous(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.is_anonymous === true;
}

/**
 * Runs the Google flow and upgrades the current Supabase session.
 *
 * For an anonymous account we first attempt Supabase's native identity-linking
 * flow, which keeps the same user id and therefore needs no data move. If
 * manual linking is unavailable or the Google identity already belongs to an
 * existing Orbit account, we fall back to a normal Google sign-in and the
 * verified guest-merge backend transfers progress into that account.
 */
export async function signInWithGoogle(): Promise<GoogleAccount> {
  if (!GOOGLE_SIGN_IN_ENABLED) throw new GoogleSignInCancelled();
  configureGoogleSignIn();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    // v16 returns a discriminated result rather than throwing on cancel.
    if (response.type === 'cancelled') {
      throw new GoogleSignInCancelled();
    }

    const idToken = response.data?.idToken;
    if (!idToken) {
      throw new Error('Google did not return an ID token.');
    }

    const { data: before } = await supabase.auth.getSession();
    const wasAnonymous = before.session?.user?.is_anonymous === true;

    if (wasAnonymous) {
      await rememberGuestSession();

      // Native linking keeps the same Supabase user id when manual linking is
      // enabled. GoogleSignin.getTokens() supplies the access token required by
      // Supabase's native ID-token linking API.
      try {
        const googleTokens = await GoogleSignin.getTokens();
        const linked = await supabase.auth.linkIdentity({
          provider: 'google',
          token: idToken,
          access_token: googleTokens.accessToken,
        });

        if (!linked.error) {
          // Refresh so is_anonymous and identities reflect the linked account
          // immediately in the UI and in RLS checks.
          await supabase.auth.refreshSession();
          const { data: linkedUser } = await supabase.auth.getUser();
          if (linkedUser.user?.is_anonymous === false) {
            const email = response.data?.user?.email ?? linkedUser.user.email ?? null;
            const name = response.data?.user?.name ?? null;
            try {
              await AsyncStorage.setItem(GOOGLE_AUTH_FLAG_KEY, 'true');
              if (email) await AsyncStorage.setItem(GOOGLE_AUTH_EMAIL_KEY, email);
            } catch {}
            return { email, name };
          }
        }
      } catch {
        // Fall through to verified sign-in + merge. This also covers projects
        // where manual identity linking has not been enabled yet.
      }
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) {
      throw new Error(error.message);
    }

    // If this started as an anonymous session, rememberGuestSession() stored a
    // one-time proof before the account switch. The Edge Function validates
    // both identities before moving any rows.
    if (wasAnonymous) {
      await retryGuestMerge();
    }

    const email = response.data?.user?.email ?? null;
    const name = response.data?.user?.name ?? null;

    // Persist authenticated flag in local phone storage so offline works forever after 1-time auth
    try {
      await AsyncStorage.setItem(GOOGLE_AUTH_FLAG_KEY, 'true');
      if (email) {
        await AsyncStorage.setItem(GOOGLE_AUTH_EMAIL_KEY, email);
      }
    } catch {}

    return { email, name };
  } catch (error) {
    if (error instanceof GoogleSignInCancelled) {
      throw error;
    }
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new GoogleSignInCancelled();
    }
    if (isErrorWithCode(error) && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services is unavailable on this device.');
    }
    throw error instanceof Error ? error : new Error('Google sign-in failed.');
  }
}

export async function signOutGoogle(): Promise<void> {
  try {
    configureGoogleSignIn();
    await GoogleSignin.signOut();
  } catch {
    // Signing out of Supabase is what actually matters.
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  await Promise.all([
    AsyncStorage.removeItem(GOOGLE_AUTH_FLAG_KEY),
    AsyncStorage.removeItem(GOOGLE_AUTH_EMAIL_KEY),
  ]);
}

export async function getSignedInEmail(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  // Anonymous sessions have no email; check local storage fallback for offline support
  if (user?.email) {
    return user.email;
  }
  try {
    return await AsyncStorage.getItem(GOOGLE_AUTH_EMAIL_KEY);
  } catch {
    return null;
  }
}

/**
 * Returns true if the user has authenticated with Google at least once.
 * On non-Android platforms (e.g. Vercel web, browser preview), returns true
 * so web readers are not blocked by native Google sign-in.
 * On native Android, reads local AsyncStorage so all features work 100% offline.
 */
export async function hasAuthenticatedGoogleOnce(): Promise<boolean> {
  // Debug APKs bypass the gate without storing a fake authenticated flag.
  if (!GOOGLE_SIGN_IN_ENABLED || Platform.OS !== 'android') {
    return true;
  }
  try {
    const flag = await AsyncStorage.getItem(GOOGLE_AUTH_FLAG_KEY);
    if (flag === 'true') {
      return true;
    }
    const email = await getSignedInEmail();
    if (email) {
      await AsyncStorage.setItem(GOOGLE_AUTH_FLAG_KEY, 'true');
      return true;
    }
  } catch {}
  return false;
}
