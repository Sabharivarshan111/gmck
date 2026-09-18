import { GOOGLE_SIGN_IN_ENABLED } from './authMode';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';

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

/**
 * Runs the Google flow and upgrades the current Supabase session to that
 * identity. Progress already stored anonymously is reconciled by the caller.
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

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) {
      throw new Error(error.message);
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
  await supabase.auth.signOut();
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
