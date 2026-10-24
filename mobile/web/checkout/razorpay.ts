import { supabase } from '@/lib/supabase';

export type PlanCode = 'adfree_6m' | 'adfree_1y' | 'notes_fmspm' | 'notes_pharmac';
const PLAN_PRICES: Record<PlanCode, number> = { adfree_6m: 15000, adfree_1y: 30000, notes_fmspm: 15000, notes_pharmac: 15000 };
export type PaymentReceipt = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
export type PaymentResult = { success?: boolean; plan?: PlanCode; error?: string; expires_at?: string; adfree_until?: string; restored?: boolean; payment_id?: string; order_id?: string };
export type CheckoutOrder = { order_id: string; amount: number; currency: string; key_id: string; plan: PlanCode; label: string };
type Options = { key: string; order_id: string; amount: number; currency: string; name: string; description: string; prefill: { email: string }; theme: { color: string }; handler: (receipt: PaymentReceipt) => void; modal: { ondismiss: () => void } };
type RazorpayInstance = { open(): void; on(event: string, listener: (event: { error?: { description?: string } }) => void): void };
declare global { interface Window { Razorpay?: new (options: Options) => RazorpayInstance; } }

const PENDING = 'orbit:pending-payment-v1';
const PENDING_ORDER = 'orbit:pending-order-v1';
export function pendingOrder(userId: string): string | null {
  try { const item = JSON.parse(localStorage.getItem(PENDING_ORDER) ?? 'null'); return item?.userId === userId ? item.orderId : null; } catch { return null; }
}
export function clearOrder(userId: string, orderId: string) {
  try { if (pendingOrder(userId) === orderId) localStorage.removeItem(PENDING_ORDER); } catch { /* Access is already saved. */ }
}
export function pendingReceipt(userId: string): PaymentReceipt | null {
  try { const item = JSON.parse(localStorage.getItem(PENDING) ?? 'null'); return item?.userId === userId ? item.receipt : null; } catch { return null; }
}
export function clearReceipt(userId: string, paymentId: string) {
  try { if (pendingReceipt(userId)?.razorpay_payment_id === paymentId) localStorage.removeItem(PENDING); } catch { /* Server access is already saved. */ }
}
function rememberReceipt(userId: string, receipt: PaymentReceipt) {
  try { localStorage.setItem(PENDING, JSON.stringify({ userId, receipt })); } catch { /* Restore remains available. */ }
}
export async function invokePayment<T>(name: string, body?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error || data?.error) {
    let message = data?.error;
    if (!message && error && 'context' in error) {
      try { message = (await (error.context as Response).clone().json()).error; } catch { /* generic fallback */ }
    }
    throw new Error(message ?? 'Could not confirm payment. Please retry or restore your purchase.');
  }
  return data as T;
}
export async function verifyReceipt(userId: string, receipt: PaymentReceipt): Promise<PaymentResult> {
  const current = (await supabase.auth.getUser()).data.user;
  if (!current || current.is_anonymous || current.id !== userId) throw new Error('Sign in with the account used for this payment to finish verification.');
  const result = await invokePayment<PaymentResult>('razorpay-verify-payment', receipt);
  if (!result.success) throw new Error('Payment verification is pending. Retry verification; do not pay again.');
  clearReceipt(userId, receipt.razorpay_payment_id);
  clearOrder(userId, receipt.razorpay_order_id);
  return result;
}
let scriptPromise: Promise<void> | null = null;
function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    const timer = setTimeout(() => fail(), 15000);
    const fail = () => { clearTimeout(timer); script.remove(); scriptPromise = null; reject(new Error('The payment window could not load. Check your connection and retry.')); };
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.async = true;
    script.onload = () => { clearTimeout(timer); if (window.Razorpay) resolve(); else fail(); };
    script.onerror = fail; document.head.appendChild(script);
  });
  return scriptPromise;
}
export async function pay(plan: PlanCode): Promise<PaymentResult> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user || user.is_anonymous) throw new Error('Sign in with Google before paying.');
  const old = pendingReceipt(user.id);
  if (old) return verifyReceipt(user.id, old);
  await loadRazorpay();
  const order = await invokePayment<CheckoutOrder>('razorpay-create-order', { plan, ...(plan.startsWith('notes_') ? { catalog_version: '2' } : {}) });
  if (!/^order_[A-Za-z0-9]+$/.test(order.order_id) || !order.key_id || order.currency !== 'INR' || order.plan !== plan || order.amount !== PLAN_PRICES[plan]) throw new Error('The checkout order is invalid. No payment was started.');
  try { localStorage.setItem(PENDING_ORDER, JSON.stringify({ userId: user.id, orderId: order.order_id })); } catch { /* Older payments remain recoverable via Restore. */ }
  return new Promise((resolve, reject) => {
    let verifying = false;
    const checkout = new window.Razorpay!({ key: order.key_id, order_id: order.order_id, amount: order.amount, currency: order.currency,
      name: 'ORBIT MBBS', description: order.label, prefill: { email: user.email ?? '' }, theme: { color: '#b78bfa' },
      modal: { ondismiss: () => { if (!verifying) reject(new Error('Payment cancelled. You can choose a plan again.')); } },
      handler: receipt => {
        verifying = true;
        if (receipt.razorpay_order_id !== order.order_id) { reject(new Error('Payment order does not match. Contact support.')); return; }
        rememberReceipt(user.id, receipt);
        void verifyReceipt(user.id, receipt).then(resolve, reject);
      },
    });
    // A failed attempt can be retried within the same Razorpay window.
    // Wait for success or dismissal rather than releasing the purchase lock early.
    checkout.open();
  });
}
