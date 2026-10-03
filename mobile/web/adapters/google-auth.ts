import { supabase } from '@/lib/supabase';
import storage from './storage';
import { rememberGuestSession, retryGuestMerge } from '@/lib/guestMerge';
export const GOOGLE_AUTH_FLAG_KEY = '@orbit:google_authenticated_v1';
export const GOOGLE_AUTH_EMAIL_KEY = '@orbit:google_authenticated_email';
export const GOOGLE_WEB_CLIENT_ID = '358287134961-24qidem5pd6qhtkq43b3a9cfcp87c49p.apps.googleusercontent.com';
export class GoogleSignInCancelled extends Error { constructor() { super('Sign-in cancelled.'); } }
export function configureGoogleSignIn() {}
export async function isCurrentUserAnonymous() { return (await supabase.auth.getSession()).data.session?.user?.is_anonymous === true; }
export async function completeBrowserAuth() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (data.session?.user && !data.session.user.is_anonymous) {
    await storage.setItem(GOOGLE_AUTH_FLAG_KEY, 'true');
    if (data.session.user.email) await storage.setItem(GOOGLE_AUTH_EMAIL_KEY, data.session.user.email);
    await retryGuestMerge();
  }
}
export async function signInWithGoogle() {
  if (await isCurrentUserAnonymous()) await rememberGuestSession();
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/`, skipBrowserRedirect: true } });
  if (error) throw error;
  if (!data.url) throw new Error('Google sign-in could not start.');
  location.assign(data.url);
  // Keep the native dialog pending until the redirect; never report a fake account.
  return await new Promise<{ email: string | null; name: string | null }>(() => {});
}
export async function signOutGoogle() {
  const { error } = await supabase.auth.signOut(); if (error) throw error;
  await storage.removeMany([GOOGLE_AUTH_FLAG_KEY, GOOGLE_AUTH_EMAIL_KEY]);
}
export async function getSignedInEmail() { return (await supabase.auth.getSession()).data.session?.user?.email ?? await storage.getItem(GOOGLE_AUTH_EMAIL_KEY); }
export async function hasAuthenticatedGoogleOnce() {
  const { data } = await supabase.auth.getSession();
  return !!(data.session?.user && !data.session.user.is_anonymous) || (await storage.getItem(GOOGLE_AUTH_FLAG_KEY)) === 'true';
}
