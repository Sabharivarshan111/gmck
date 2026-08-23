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

/** The only plan the app sells from the ad prompt. Others exist server-side. */
export const ADFREE_MONTHLY = 'adfree_monthly';

/** ₹50, in paise, and only ever for display — the server sets what is charged. */
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
 * Buy a month without ads.
 *
 * Requires a signed-in Supabase user: the edge function refuses an anonymous
 * caller, because a purchase that cannot be attributed to an account is a
 * purchase that cannot be restored on the next phone.
 */
export async function buyAdFreeMonth(email?: string, name?: string): Promise<PurchaseOutcome> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { status: 'failed', message: 'Sign in first so the purchase stays with your account.' };
  }

  const { data, error } = await supabase.functions.invoke<CreatedOrder>('razorpay-create-order', {
    body: { plan: ADFREE_MONTHLY },
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
      plan: ADFREE_MONTHLY,
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
