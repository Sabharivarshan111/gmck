import { useEffect, useSyncExternalStore } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { secureStorage } from './secureStorage';
import { supabase } from './supabase';

/**
 * Ad-free (premium) state, ported from src/hooks/use-premium.ts.
 *
 * The ad layer needs a *synchronous* answer — it decides whether to prompt
 * before any await is possible — but AsyncStorage is async. So the expiry is
 * held in memory, hydrated once at launch and refreshed whenever the session
 * or foreground state changes.
 *
 * The storage key matches the web app's, so a user who paid on the web is
 * ad-free in the native app without buying again.
 */

const OWNER_KEY = 'orbit:premium-owner-v1';
let cachedOwner: string | null = null;

const STORAGE_KEY = 'orbit:premium-until';

let expiresAt: string | null = null;
let checkedAt = 0;
let known = false;
const listeners = new Set<() => void>();
export function subscribePremium(listener: () => void): () => void { listeners.add(listener); return () => { listeners.delete(listener); }; }
const notify = () => { for (const listener of listeners) listener(); };
export function usePremiumStatus(): string | null { return useSyncExternalStore(subscribePremium, premiumExpiresAt); }
/** Unknown membership defers ads; an existing paid cache stays usable offline. */
export async function mayShowAds(): Promise<boolean> {
  if (isPremiumCached()) return false;
  if (!known || Date.now() - checkedAt > 30000) await syncPremiumCache();
  return known && !isPremiumCached();
}

/** Synchronous check used by the ad layer. */
export function isPremiumCached(): boolean {
  if (!expiresAt) {
    return false;
  }
  return new Date(expiresAt).getTime() > Date.now();
}

export function premiumExpiresAt(): string | null {
  return isPremiumCached() ? expiresAt : null;
}

async function cache(value: string | null, userId: string | null = null): Promise<void> {
  expiresAt = value;
  cachedOwner = value ? userId : null;
  notify();
  try {
    if (value) {
      await secureStorage.setItem(OWNER_KEY, userId!);
      await secureStorage.setItem(STORAGE_KEY, value);
    } else {
      await secureStorage.removeItem(STORAGE_KEY);
      await secureStorage.removeItem(OWNER_KEY);
    }
  } catch {
    // In-memory value still applies for this session.
  }
}

/** Load the last known expiry so the first ad check is correct offline. */
export async function hydratePremium(): Promise<void> {
  try {
    const [{ data }, owner, until] = await Promise.all([supabase.auth.getSession(), secureStorage.getItem(OWNER_KEY), secureStorage.getItem(STORAGE_KEY)]);
    // A late disk read must not replace a freshly verified purchase.
    if (known) return;
    cachedOwner = owner;
    expiresAt = owner && owner === data.session?.user.id ? until : null;
  } catch { if (!known) expiresAt = null; }
  finally { notify(); }
}

/**
 * Refresh the expiry from the server. Safe to call from anywhere; a failure
 * leaves the cached value alone rather than silently un-premiuming a paying
 * user because the network was down.
 */
export async function syncPremiumCache(): Promise<string | null> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      // Signed out — no entitlement to speak of.
      known = true; checkedAt = Date.now();
      await cache(null);
      return null;
    }

    if (cachedOwner !== userId) {
      expiresAt = null;
      cachedOwner = userId;
      known = false; notify();
    }
    const { data, error } = await supabase
      .from('premium_subscriptions')
      .select('expires_at')
      .eq('user_id', userId)
      .eq('plan', 'adfree_monthly')
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      known = false;
      // Keep whatever was cached; do not punish a paying user for a bad request.
      return premiumExpiresAt();
    }

    const expiry = (data as { expires_at?: string } | null)?.expires_at ?? null;
    const active = !!expiry && new Date(expiry).getTime() > Date.now();
    const current = (await supabase.auth.getSession()).data.session?.user.id;
    if (current !== userId) return null;
    known = true; checkedAt = Date.now();
    await cache(active ? expiry : null, userId);
    return active ? expiry : null;
  } catch {
    known = false;
    return premiumExpiresAt();
  }
}

/**
 * Mount once at the app root so the ad layer always knows about paid users.
 * Refreshes on sign-in/out and whenever the app returns to the foreground —
 * the native equivalent of the web version's visibilitychange listener.
 */
export function usePremiumSync(): void {
  useEffect(() => {
    syncPremiumCache().catch(() => undefined);

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cachedOwner !== session?.user.id) { expiresAt = null; cachedOwner = session?.user.id ?? null; known = false; notify(); }
      setTimeout(() => { void syncPremiumCache(); }, 0);
    });

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        syncPremiumCache().catch(() => undefined);
      }
    };
    const appSub = AppState.addEventListener('change', onAppState);
    const timer = setInterval(() => { notify(); if (AppState.currentState === 'active') void syncPremiumCache(); }, 30000);

    return () => {
      authSub.subscription.unsubscribe();
      appSub.remove();
      clearInterval(timer);
    };
  }, []);
}
