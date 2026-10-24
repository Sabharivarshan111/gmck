import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { syncPremiumCache } from '@/lib/premium';
import { clearOrder, clearReceipt, invokePayment, pay, pendingOrder, pendingReceipt, verifyReceipt, type PaymentResult, type PlanCode } from './razorpay';
import { NOTE_PRODUCTS, type NotesPlan } from '../../../src/lib/note-products';
import './checkout.css';

const OFFER_END = new Date('2026-11-30T23:59:59+05:30').getTime();
export default function CheckoutPage() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [ownedNotes, setOwnedNotes] = useState<NotesPlan[]>([]);
  const [expiry, setExpiry] = useState<string | null>(null);
  const locked = useRef(false);
  const resumed = useRef<string | null>(null);
  const offerOpen = Date.now() <= OFFER_END;

  useEffect(() => {
    document.title = 'ORBIT Premium — Secure checkout';
    const robots = document.createElement('meta'); robots.name = 'robots'; robots.content = 'noindex, nofollow'; document.head.appendChild(robots);
    let mounted = true;
    const refresh = async () => {
      const current = (await supabase.auth.getUser()).data.user;
      if (!mounted) return;
      setUser(current && !current.is_anonymous ? current : null); setReady(true);
      const until = await syncPremiumCache();
      const { data: notes, error: notesError } = current && !current.is_anonymous
        ? await supabase.from('premium_subscriptions').select('plan, expires_at').eq('user_id', current.id).in('plan', ['notes_fmspm', 'notes_pharmac']).gt('expires_at', new Date().toISOString())
        : { data: [], error: null };
      if (!mounted) return;
      const latest = (await supabase.auth.getUser()).data.user;
      if (latest?.id !== current?.id) return;
      setExpiry(until);
      setOwnedNotes(notesError ? [] : (notes ?? []).map(row => row.plan as NotesPlan));
    };
    void refresh().catch(() => { if (mounted) { setReady(true); setError('Could not check your account. Check your connection and reload.'); } });
    const { data: subscription } = supabase.auth.onAuthStateChange(() => { setOwnedNotes([]); setExpiry(null); setMessage(''); setTimeout(() => { if (mounted) void refresh(); }, 0); });
    const visible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener('visibilitychange', visible);
    return () => { mounted = false; robots.remove(); subscription.subscription.unsubscribe(); document.removeEventListener('visibilitychange', visible); };
  }, []);

  const run = useCallback(async (label: string, operation: () => Promise<PaymentResult>) => {
    if (locked.current) return;
    locked.current = true; setBusy(label); setError(''); setMessage('');
    try {
      const buyer = (await supabase.auth.getUser()).data.user;
      if (!buyer || buyer.is_anonymous) throw new Error('Sign in before confirming a purchase.');
      const result = await operation();
      const account = (await supabase.auth.getUser()).data.user;
      if (account?.id !== buyer.id) throw new Error('Your account changed. Sign in with the purchasing account and restore.');
      if (!result.success) throw new Error('Access is not confirmed yet. Restore your purchase before paying again.');
      const until = await syncPremiumCache();
      const isNotes = result.plan === 'notes_fmspm' || result.plan === 'notes_pharmac';
      const confirmed = isNotes ? result.expires_at : until ?? result.adfree_until;
      if (!confirmed || new Date(confirmed).getTime() <= Date.now()) throw new Error('This purchase has expired. You can choose a new plan.');
      const current = (await supabase.auth.getUser()).data.user;
      if (isNotes) setOwnedNotes(previous => [...new Set([...previous, result.plan as NotesPlan])]);
      if (current && result.payment_id) clearReceipt(current.id, result.payment_id);
      if (current && result.order_id) clearOrder(current.id, result.order_id);
      setExpiry(isNotes ? until : confirmed);
      setMessage(isNotes ? 'Payment confirmed. Your notes are ready — use Open notes below.' : 'Payment confirmed. Your Premium access is active. Reopen ORBIT with this same Google account.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not confirm access. Please retry.'); }
    finally { locked.current = false; setBusy(null); }
  }, []);

  useEffect(() => {
    if (!user || resumed.current === user.id) return;
    const receipt = pendingReceipt(user.id);
    const orderId = pendingOrder(user.id);
    if (receipt || orderId) {
      resumed.current = user.id;
      void run('Confirming payment', () => receipt ? verifyReceipt(user.id, receipt) : invokePayment<PaymentResult>('razorpay-restore-purchase', { order_id: orderId! }));
    }
  }, [user, run]);

  const signIn = async () => {
    setError(''); setBusy('Signing in');
    try {
      // The established root callback is already used by the study app. Boot
      // returns to this checkout after Supabase has consumed the OAuth result.
      sessionStorage.setItem('orbit:checkout-return', '1');
      const { error: authError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/` } });
      if (authError) throw authError;
    } catch (e) { setBusy(null); setError(e instanceof Error ? e.message : 'Google sign-in could not start.'); }
  };
  const purchase = (plan: PlanCode) => void run('Processing payment', () => pay(plan));
  return <main className="orbit-checkout">
    <div className="checkout-shell">
      <a href="/" className="checkout-back">← Back to ORBIT</a>
      <header><div className="checkout-brand"><div className="checkout-mark">O</div><p className="checkout-eyebrow">ORBIT MBBS</p><span>Secure checkout</span></div><h1>Unlock Premium</h1><p>Learn by exploring. Practise with confidence.</p><div className="checkout-features" aria-label="Premium features"><span>3D Anatomy</span><span>Patient Simulator</span><span>Auscultation</span><span>PG Practice & more</span></div></header>
      <section className="checkout-account" aria-label="Payment account">
        {ready ? user ? <><span>Buying for</span><strong>{user.email}</strong><p>Use this same Google account in the Android app.</p><button className="checkout-text-button" disabled={!!busy} onClick={() => { void supabase.auth.signOut().then(({ error: signOutError }) => { if (signOutError) setError(signOutError.message); else { setUser(null); setExpiry(null); setOwnedNotes([]); setMessage(''); } }); }}>Use another account</button></> : <><strong>Sign in before paying</strong><p>Your purchase will sync to this Google account.</p><button className="checkout-primary" disabled={!!busy} onClick={() => void signIn()}>Continue with Google</button></> : <p>Checking your account…</p>}
      </section>
      {expiry && <p className="checkout-success">Premium access active until {new Date(expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>}
      <section aria-label="Premium plans">
        <div className="checkout-offer"><strong>{offerOpen ? 'Limited-time launch offer' : 'Launch offer ended'}</strong><span>Ends 30 November 2026 · 11:59 PM IST</span></div>
        <div className="checkout-plans">
          <button disabled={!user || !!busy || !offerOpen} onClick={() => purchase('adfree_6m')}><span>Premium · 6 months</span><strong>₹150 <em>₹25 / month</em></strong><small>180 days · all Premium Vault tools</small><b>Choose 6 months →</b></button>
          <button disabled={!user || !!busy || !offerOpen} onClick={() => purchase('adfree_1y')}><span>Premium · 1 year</span><strong>₹300 <em>₹25 / month</em></strong><small>365 days · all Premium Vault tools</small><b>Choose 1 year →</b></button>
        </div>
        <p className="checkout-detail">One-time payment. No automatic renewal. Paid time is added to existing access. General Vault Notes remain free. Premium also includes lifetime FM + SPM revision notes.</p>
      </section>
      <section className="checkout-notes" aria-label="Revision notes">
        <div className="checkout-section-title"><span>STUDY COLLECTIONS</span><h2>Revision notes</h2><p>Separate one-time purchases. Yours to revisit.</p></div>
        <div className="checkout-note-plans">
          {(Object.entries(NOTE_PRODUCTS) as [NotesPlan, typeof NOTE_PRODUCTS[NotesPlan]][]).map(([plan, product]) => <article key={plan}>
            <div className="checkout-note-heading"><span className="checkout-note-icon" aria-hidden="true">{plan === 'notes_fmspm' ? 'FM' : 'Rx'}</span><strong>₹150</strong></div>
            <h3>{product.title}</h3><p>{product.detail}</p>
            {ownedNotes.includes(plan) ? <a className="checkout-note-open" href={product.url} target="_blank" rel="noopener noreferrer">Open notes ↗</a> : <button className="checkout-secondary" disabled={!user || !!busy} onClick={() => purchase(plan)}>Buy notes · ₹150</button>}
          </article>)}
        </div>
        <p className="checkout-detail">Each note pack also includes 30 days of Premium access. Use the same Google account to access your purchases.</p>
      </section>
      <div role="status" aria-live="polite">{busy && <p>{busy}…</p>}{message && <p className="checkout-success">{message}</p>}</div>
      {error && <p className="checkout-error" role="alert">{error}</p>}
      <section className="checkout-restore"><h2>Already paid?</h2><p>Restore with the Google account you used at checkout. If payment succeeded but access is pending, restore before paying again.</p><button className="checkout-secondary" disabled={!user || !!busy} onClick={() => void run('Restoring access', () => { const orderId = user ? pendingOrder(user.id) : null; return invokePayment<PaymentResult>('razorpay-restore-purchase', orderId ? { order_id: orderId } : undefined); })}>Restore access</button></section>
      <footer>Payments securely processed by Razorpay.<br />Having trouble? <a href="https://wa.me/919080220563">Contact support</a><br /><a href="/privacy-policy">Privacy</a> · <a href="/terms-of-service">Terms</a></footer>
    </div>
  </main>;
}
