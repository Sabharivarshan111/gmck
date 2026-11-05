import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { supabase } from './supabase';
import { syncPremiumCache } from './premium';

/**
 * Mirrors website SimulatorAccess: paid access is based on the authenticated
 * premium_subscriptions entitlement, never on pressing the Buy button.
 *
 * syncPremiumCache reads the same server plan as readWebsitePremium and falls
 * back only to the expiry previously verified and bound to this account in
 * Android secure storage. Do not claim premium while the first check runs.
 */
export function useSimulatorEntitlement(enabled = true): { loading: boolean; active: boolean } {
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    let generation = 0;
    const refresh = () => {
      const current = ++generation;
      return syncPremiumCache().then(until => {
        if (mounted && generation === current) {
          setActive(!!until && new Date(until).getTime() > Date.now());
          setLoading(false);
        }
      }).catch(() => {
        if (mounted && generation === current) {
          setActive(false);
          setLoading(false);
        }
      });
    };
    setLoading(true);
    void refresh();
    const { data } = supabase.auth.onAuthStateChange(() => {
      setActive(false);
      setLoading(true);
      // Defer the query until Supabase finishes updating its session.
      setTimeout(() => { if (mounted) void refresh(); }, 0);
    });
    const app = AppState.addEventListener('change', state => {
      if (state === 'active') void refresh();
    });
    // Detect a purchase completed on the website while the native studio stays open.
    const interval = setInterval(() => { void refresh(); }, 30000);
    return () => {
      mounted = false;
      generation++;
      clearInterval(interval);
      data.subscription.unsubscribe();
      app.remove();
    };
  }, [enabled]);

  return { loading, active: active && enabled };
}
