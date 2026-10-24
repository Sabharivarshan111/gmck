import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { readWebsitePremium, type PremiumClient } from '@/lib/website-premium';

/** Protect direct website simulator URLs as well as the Vault cards. */
export function WebsitePremiumGate({ children }: { children: ReactNode }) {
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
  if (active) return <>{children}</>;
  return <main className="min-h-screen bg-background text-foreground grid place-items-center px-6 py-12"><section className="w-full max-w-sm rounded-2xl border border-primary/30 bg-card p-6 text-center space-y-4">
    <h1 className="text-2xl font-bold">{loading ? 'Checking Premium access…' : 'Unlock Simulator & Anatomy'}</h1>
    {!loading && <><p className="text-muted-foreground">Explore 3D Anatomy, Patient Simulator, Auscultation and more with ORBIT Premium.</p><p className="text-sm text-muted-foreground">Notes remain free to read.</p><a href="/unlock" className="block rounded-xl bg-primary text-primary-foreground px-4 py-3 font-semibold">View Premium plans</a><a href="/notes" className="block px-4 py-3 text-sm text-muted-foreground">Back to free Notes</a></>}
  </section></main>;
}
