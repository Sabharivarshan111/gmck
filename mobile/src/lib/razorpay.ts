import RazorpayCheckout from 'react-native-razorpay';
import { supabase } from '@/lib/supabase';
import { syncPremiumCache } from '@/lib/premium';

/**
 * Buying a month without ads.
 *
 * The money is never decided here. `razorpay-create-order` holds the price
 * table server-side and `razorpay-verify-payment` checks the HMAC signature
 * before it writes anything — so a tampered client can ask for an order and
 * can lie about having paid, and neither gets it anything. This file's whole
 * job is: ask the server for an order, hand it to Razorpay's checkout, and
 * hand what comes back to the server to be verified.
 *
 * Ported from src/components/premium/* in the web app, against the same two
 * edge functions, so a purchase made on the phone and one made in the browser
 * land in the same `premium_subscriptions` row shape and extend the same
 * expiry.
 */

/** The plan bought when nothing else is chosen. */
export const ADFREE_MONTHLY = 'adfree_monthly';

/**
 * The three lengths of ad-free the app sells.
 *
 * **The prices here are labels, not amounts.** Nothing in this file is ever
 * sent as a price: the client posts a plan KEY and `razorpay-create-order`
 * looks the amount up in its own table. That is the whole reason the server
 * holds it — a client that could name its own amount could buy a year for one
 * rupee, and checking afterwards does not help, because the order Razorpay
 * charges against was already created with whatever it said.
 *
 * So if a number here disagrees with the server, the reader is shown the wrong
 * price and charged the right one. `npm run check:payments` pins the two
 * together for exactly that reason.
 */
export interface AdFreeTier {
  plan: string;
  /** What the button says. */
  label: string;
  price: string;
  /** The per-month cost, so a longer tier can show what it saves. */
  note?: string;
}

export const ADFREE_TIERS: AdFreeTier[] = [
  { plan: 'adfree_monthly', label: '1 month', price: '₹50' },
  { plan: 'adfree_6months', label: '6 months', price: '₹150', note: '₹25 a month' },
  { plan: 'adfree_yearly', label: '1 year', price: '₹300', note: '₹25 a month' },
];

/** ₹50, and only ever for display — the server sets what is charged. */
export const ADFREE_PRICE_LABEL = '₹50';

export type PurchaseOutcome =
  | { status: 'done'; expiresAt: string | null }
  | { status: 'cancelled' }
  | { status: 'failed'; message: string };

interface CreatedOrder {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  plan: string;
  label: string;
}

interface CheckoutResult {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

/**
 * Razorpay's SDK rejects with a shape rather than an Error, and a user tapping
 * the back button out of the sheet is one of those rejections. Telling that
 * apart from a real failure is the difference between silence and an error
 * message nobody caused.
 */
function isCancellation(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const shape = error as { code?: unknown; description?: unknown };
  // 0 / 2 are Razorpay's "payment cancelled by user" and "network error before
  // anything was charged"; the description is checked too because the code has
  // moved between SDK versions.
  const description = typeof shape.description === 'string' ? shape.description.toLowerCase() : '';
  return shape.code === 0 || description.includes('cancelled') || description.includes('canceled');
}

function message(error: unknown): string {
  if (error && typeof error === 'object') {
    const shape = error as { description?: unknown; message?: unknown };
    if (typeof shape.description === 'string' && shape.description) {
      return shape.description;
    }
    if (typeof shape.message === 'string' && shape.message) {
      return shape.message;
    }
  }
  return 'Payment could not be completed.';
}

/**
 * Buy a stretch without ads.
 *
 * Requires a signed-in Supabase user: the edge function refuses an anonymous
 * caller, because a purchase that cannot be attributed to an account is a
 * purchase that cannot be restored on the next phone.
 *
 * @param plan one of `ADFREE_TIERS`. Defaults to the month, which is what the
 *   ad prompt buys when the reader taps the price rather than choosing.
 *
 * Every tier writes the SAME entitlement — a `premium_subscriptions` row whose
 * plan is `adfree_monthly`, with `expires_at` moved further out. That is why no
 * reader of the entitlement had to change for this: `premium.ts` here and the
 * web app both ask "is there an unexpired adfree_monthly row", and a year is
 * that same row with a later date.
 */
export async function buyAdFree(
  plan: string = ADFREE_MONTHLY,
  email?: string,
  name?: string,
): Promise<PurchaseOutcome> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { status: 'failed', message: 'Sign in first so the purchase stays with your account.' };
  }

  const { data, error } = await supabase.functions.invoke<CreatedOrder>('razorpay-create-order', {
    body: { plan },
  });
  if (error || !data?.order_id || !data.key_id) {
    return { status: 'failed', message: error?.message ?? 'Could not start the payment.' };
  }

  let result: CheckoutResult;
  try {
    result = await RazorpayCheckout.open({
      key: data.key_id,
      order_id: data.order_id,
      amount: data.amount,
      currency: data.currency,
      name: 'Orbit MBBS',
      description: data.label,
      theme: { color: '#E879F9' },
      prefill: {
        ...(email ? { email } : null),
        ...(name ? { name } : null),
      },
    });
  } catch (caught) {
    return isCancellation(caught)
      ? { status: 'cancelled' }
      : { status: 'failed', message: message(caught) };
  }

  if (!result?.razorpay_payment_id || !result.razorpay_signature) {
    // Reaching here means the sheet closed claiming success without the fields
    // the server needs. Never treat that as paid.
    return { status: 'failed', message: 'Payment did not complete. You have not been charged.' };
  }

  const { error: verifyError } = await supabase.functions.invoke('razorpay-verify-payment', {
    body: {
      razorpay_order_id: result.razorpay_order_id ?? data.order_id,
      razorpay_payment_id: result.razorpay_payment_id,
      razorpay_signature: result.razorpay_signature,
      plan,
    },
  });
  if (verifyError) {
    // The money may well have been taken — Razorpay has it either way. Say so
    // plainly rather than implying it failed, and point at the restore path.
    return {
      status: 'failed',
      message:
        'Payment went through but could not be confirmed. Reopen My Progress in a minute — it restores automatically.',
    };
  }

  const expiresAt = await syncPremiumCache().catch(() => null);
  return { status: 'done', expiresAt };
}
