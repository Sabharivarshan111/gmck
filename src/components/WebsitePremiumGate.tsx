import { useEffect, useState, useRef, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { readWebsitePremium, type PremiumClient } from '@/lib/website-premium';

import { SimulatorAccessContext } from '@/simulator/SimulatorAccess';

/** Protect direct website simulator URLs as well as the Vault cards. */
export function WebsitePremiumGate({ children }: { children: ReactNode }) {
  const [feature, setFeature] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (feature) dialog.current?.showModal(); else dialog.current?.close(); }, [feature]);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try { const until = await readWebsitePremium(supabase as unknown as PremiumClient); if (alive) setActive(!!until); }
      catch { if (alive) setActive(false); }
      finally { if (alive) setLoading(false); }
    };
    void refresh();
    const visible = () => { if (!document.hidden) void refresh(); };
    const timer = setInterval(visible, 30000);
    const { data } = supabase.auth.onAuthStateChange(() => { setActive(false); setTimeout(() => { if (alive) void refresh(); }, 0); });
    document.addEventListener('visibilitychange', visible);
    return () => { alive = false; clearInterval(timer); data.subscription.unsubscribe(); document.removeEventListener('visibilitychange', visible); };
  }, []);
  useEffect(() => { if (active) setFeature(null); }, [active]);
  return <SimulatorAccessContext.Provider value={{ active: active && !loading, requestPurchase: setFeature }}>
    {children}
    <dialog ref={dialog} className="rounded-2xl border border-primary/40 bg-background text-foreground p-6 max-w-sm w-[90vw] backdrop:bg-black/70" onCancel={() => setFeature(null)} aria-labelledby="simulator-premium-title">
      <h2 id="simulator-premium-title" className="text-xl font-bold">Unlock {feature ?? 'Premium'}</h2>
      <p className="my-4 text-sm text-muted-foreground">Keep exploring the free preview, or get Premium for all organs, sounds, patient cases and tools.</p>
      <a className="block rounded-xl bg-primary text-primary-foreground text-center p-3 font-semibold" href="/unlock">View Premium plans</a>
      <button className="w-full p-3 mt-2" onClick={() => setFeature(null)}>Continue free preview</button>
    </dialog>
  </SimulatorAccessContext.Provider>;
}
