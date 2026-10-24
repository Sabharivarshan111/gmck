import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { readWebsitePremium, type PremiumClient } from '@shared/website-premium';
import './checkout/checkout.css';

type Access = { active: boolean; loading: boolean; expiresAt: string | null; requestPurchase(feature: string): void };
const Context = createContext<Access>({ active: false, loading: true, expiresAt: null, requestPurchase() {} });
export function useVaultAccess() { return useContext(Context); }
export function VaultPaywall({ onBack }: { onBack?: () => void }) {
  return <main className="orbit-checkout vault-paywall"><div className="checkout-shell"><h1>Unlock ORBIT Vault</h1><p>Get 3D Anatomy, Patient Simulator, Auscultation, PG Practice and more with Premium.</p><p>Notes remain free to read.</p><a className="vault-pay-button" href="/unlock">View Premium plans</a><button className="checkout-secondary" onClick={onBack ?? (() => location.assign('/notes'))}>Back to free Notes</button></div></main>;
}
export function VaultAccessProvider({ children }: { children: React.ReactNode }) {
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feature, setFeature] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try { const expiry = await readWebsitePremium(supabase as unknown as PremiumClient); if (alive) setExpiresAt(expiry); }
      catch { if (alive) setExpiresAt(null); }
      finally { if (alive) setLoading(false); }
    };
    void refresh();
    const visible = () => { if (!document.hidden) void refresh(); };
    const timer = setInterval(visible, 30000);
    const { data } = supabase.auth.onAuthStateChange(() => { setExpiresAt(null); setTimeout(() => { if (alive) void refresh(); }, 0); });
    document.addEventListener('visibilitychange', visible);
    return () => { alive = false; clearInterval(timer); data.subscription.unsubscribe(); document.removeEventListener('visibilitychange', visible); };
  }, []);
  useEffect(() => { if (feature) dialog.current?.showModal(); else dialog.current?.close(); }, [feature]);
  const requestPurchase = useCallback((name: string) => setFeature(name), []);
  const active = !!expiresAt && new Date(expiresAt).getTime() > Date.now();
  useEffect(() => { if (active) setFeature(null); }, [active]);
  return <Context.Provider value={{ active, loading, expiresAt, requestPurchase }}>
    {children}
    <dialog ref={dialog} className="vault-purchase-dialog" aria-labelledby="vault-paywall-title" onCancel={() => setFeature(null)}>
      <h2 id="vault-paywall-title">Unlock {feature ?? 'ORBIT Vault'}</h2><p>This feature is included with ORBIT Premium. Notes remain free.</p>
      <a className="vault-pay-button" href="/unlock">View Premium plans</a><button className="checkout-secondary" onClick={() => setFeature(null)}>Not now</button>
    </dialog>
  </Context.Provider>;
}
