import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
export const PLANS: Record<string, { amount: number; days: number; label: string }> = {
  adfree_monthly: { amount: 5000, days: 30, label: 'Ad-free — 1 month' },
  adfree_6m: { amount: 15000, days: 180, label: 'Ad-free — 6 months' },
  adfree_1y: { amount: 30000, days: 365, label: 'Ad-free — 1 year' },
  notes_fmspm: { amount: 5000, days: 30, label: 'FM + SPM revision notes' },
  notes_pharmac: { amount: 5000, days: 30, label: 'Pharmacology full-subject notes' },
};
const ALIASES: Record<string, string> = { adfree_1m: 'adfree_monthly', adfree_6months: 'adfree_6m', adfree_yearly: 'adfree_1y' };
export const planFor = (key: unknown) => typeof key === 'string' ? ALIASES[key] ?? key : '';
export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
export function adminClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function signedInUser(req: Request) {
  const token = req.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1];
  if (!token) return null;
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.getUser(token);
  return !error && data.user?.is_anonymous === false ? data.user : null;
}
export async function provider(path: string, body?: unknown) {
  const id = Deno.env.get('RAZORPAY_KEY_ID'), secret = Deno.env.get('RAZORPAY_KEY_SECRET');
  if (!id || !secret) throw new Error('Payment provider is unavailable');
  const response = await fetch('https://api.razorpay.com/v1/' + path, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: 'Basic ' + btoa(id + ':' + secret), 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Payment provider lookup failed');
  return response.json();
}
/** Exact paid status, amount, currency, order, purpose and server-recorded owner. */
export function verifiedPurchase(order: any, payment: any, userId: string) {
  const plan = planFor(order?.notes?.purpose);
  if (!Object.hasOwn(PLANS, plan) || order.notes.user_id !== userId ||
      !/^order_[A-Za-z0-9]+$/.test(order.id) || !/^pay_[A-Za-z0-9]+$/.test(payment?.id ?? '') ||
      payment.order_id !== order.id || payment.status !== 'captured' || payment.captured !== true ||
      order.status !== 'paid' || order.currency !== 'INR' || payment.currency !== 'INR' ||
      order.amount !== PLANS[plan].amount || order.amount_paid !== order.amount || payment.amount !== order.amount ||
      (payment.amount_refunded ?? 0) !== 0 || payment.refund_status ||
      !Number.isSafeInteger(payment.created_at) || payment.created_at <= 0 || payment.created_at > Date.now() / 1000 + 300) return null;
  return { plan, purchasedAt: new Date(payment.created_at * 1000).toISOString() };
}
export async function grantPurchase(user: { id: string; email?: string }, order: any, payment: any, proof: { plan: string; purchasedAt: string }) {
  const { data, error } = await adminClient().rpc('save_verified_razorpay_purchase', {
    _user_id: user.id, _email: user.email ?? null, _order_id: order.id, _payment_id: payment.id,
    _plan: proof.plan, _amount: payment.amount, _purchased_at: proof.purchasedAt,
  });
  if (error) return json({ error: 'Payment access could not be saved. Please retry or contact support.' }, error.code === '42501' ? 403 : 503);
  const rows = data ?? [];
  const adfree = rows.find((row: any) => row.plan === 'adfree_monthly')?.expires_at;
  return json({ success: true, restored: true, payment_id: payment.id, order_id: order.id,
    plan: proof.plan, adfree_until: adfree, expires_at: proof.plan.startsWith('notes_') ? rows.find((row: any) => row.plan === proof.plan)?.expires_at : adfree, notes_unlocked: true });
}
