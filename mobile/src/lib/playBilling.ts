import NativeOrbitBilling, {
  type BillingProduct,
  type BillingPurchase,
} from '@/native/NativeOrbitBilling';
import { supabase } from '@/lib/supabase';
import { syncPremiumCache } from '@/lib/premium';

/**
 * Buying through Google Play.
 *
 * This is the JavaScript half of `OrbitBilling`. It owns every call to that
 * module and to `play-verify-purchase`, the same way `askAi.ts` owns every call
 * to `ask-gemini` — one door, so the rules below hold everywhere rather than in
 * whichever screen remembered them.
 *
 * ## The rules, and each is a way this goes wrong
 *
 * 1. **Nothing is granted here.** `buy` returns a purchase token and this file
 *    posts it to the server; the entitlement appears because the server wrote
 *    a row, never because a call resolved. A client cannot verify a purchase.
 * 2. **No price is ever written down.** Every amount shown comes from
 *    `products()`, which is Play's own localised, tax-inclusive string. That is
 *    a real improvement on Razorpay, where `razorpay.ts` carries "₹50" as a
 *    label and `check:payments` exists to stop it drifting from the server's
 *    amount.
 * 3. **`restore()` runs on launch and on foreground, not only behind a button.**
 *    It is the only way a purchase made on another phone, or one that settled
 *    while the app was closed, is ever seen. It is also restore-purchases, free.
 * 4. **A PENDING purchase grants nothing.** India's deferred methods settle
 *    later; the reader owes nothing yet.
 *
 * ## Nothing here has been through a real payment
 *
 * Same standing as `razorpay-untested`, and for the same reason: no emulator
 * with Play services in these sandboxes, no Play account, no card. Play returns
 * no products at all for a build it did not install, so every APK this repo's
 * CI produces sees an empty catalogue and `isBillingAvailable()` false. The
 * first real proof is a licence tester on the internal testing track — the
 * owner's half is `mobile/PLAY-BILLING-SETUP.md`.
 */

/**
 * Whether the Play path is the one the app should use.
 *
 * **Off.** Razorpay is still what ships, and stays what ships until a licence
 * tester has taken a real purchase end to end on a phone and a
 * `premium_subscriptions` row appeared with `source = 'play'`. Turning this on
 * before that swaps a payment path that has at least been built and reviewed
 * for one that has never been run at all.
 *
 * Flipping it is one line, deliberately: there is no remote flag and no
 * environment variable, because "which payment system is live" changing without
 * a build is exactly the kind of thing that should not be possible from a
 * console at two in the morning.
 */
export const PLAY_BILLING_ENABLED = false;

/** Subscription product. One product, three base plans — see PLAY-BILLING-SETUP.md. */
export const ADFREE_SUBSCRIPTION = 'orbit_adfree';

/** The base plan ids inside that subscription, longest last. */
export const ADFREE_BASE_PLANS = ['adfree-monthly', 'adfree-6months', 'adfree-yearly'] as const;

/** One-off, non-consumable products. Bought once, kept for ever. */
export const NOTES_PRODUCTS = ['notes_fmspm', 'notes_pharmac'] as const;

/**
 * Play's base plan id maps to the plan key the rest of the app already speaks.
 *
 * The server does this too, and this copy exists only so the UI can label a
 * tier before anything has been bought. `check:billing` pins the two together —
 * a base plan the server does not know is a purchase Play would take and the
 * server would refuse.
 */
export const BASE_PLAN_TO_KEY: Record<string, string> = {
  'adfree-monthly': 'adfree_monthly',
  'adfree-6months': 'adfree_6months',
  'adfree-yearly': 'adfree_yearly',
};

export type PlayOutcome =
  | { status: 'done'; expiresAt: string | null }
  | { status: 'pending' }
  | { status: 'cancelled' }
  | { status: 'unavailable' }
  | { status: 'failed'; message: string };

/** Is the module there at all, and did Play answer? */
export async function isBillingAvailable(): Promise<boolean> {
  if (!NativeOrbitBilling) {
    return false;
  }
  try {
    return await NativeOrbitBilling.available();
  } catch {
    return false;
  }
}

function parse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * What Play will sell, with Play's own prices.
 *
 * An empty list is the honest answer for a sideloaded build, a device with no
 * Play Store, or a product that has not finished propagating after being
 * created in the console. The caller shows nothing rather than a price.
 */
export async function loadProducts(): Promise<BillingProduct[]> {
  if (!NativeOrbitBilling) {
    return [];
  }
  try {
    const [subs, oneOff] = await Promise.all([
      NativeOrbitBilling.products(JSON.stringify([ADFREE_SUBSCRIPTION]), 'subs'),
      NativeOrbitBilling.products(JSON.stringify([...NOTES_PRODUCTS]), 'inapp'),
    ]);
    return [
      ...parse<BillingProduct[]>(subs, []),
      ...parse<BillingProduct[]>(oneOff, []),
    ];
  } catch {
    return [];
  }
}

/**
 * Hand a purchase token to the server and let it decide what was bought.
 *
 * The token is the whole payload. Nothing about the plan, the price or the
 * duration is sent, because every one of those is something a tampered client
 * could lie about — the server asks the Play Developer API what the token
 * really is and derives the rest from Play's answer.
 */
async function verify(token: string, productId: string, kind: 'subs' | 'inapp'): Promise<PlayOutcome> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    // The function refuses an anonymous caller: a purchase that cannot be
    // attributed to an account is one that cannot be restored on the next phone.
    return { status: 'failed', message: 'Sign in before buying, so this can be restored later.' };
  }
  const { data, error } = await supabase.functions.invoke('play-verify-purchase', {
    body: { purchase_token: token, product_id: productId, kind },
  });
  if (error) {
    return { status: 'failed', message: error.message ?? 'Purchase could not be verified.' };
  }
  const result = data as { success?: boolean; expires_at?: string; error?: string } | null;
  if (!result?.success) {
    return { status: 'failed', message: result?.error ?? 'Purchase could not be verified.' };
  }
  await syncPremiumCache();
  return { status: 'done', expiresAt: result.expires_at ?? null };
}

/**
 * Buy something.
 *
 * @param productId `ADFREE_SUBSCRIPTION` or one of `NOTES_PRODUCTS`.
 * @param offerToken the base plan's token from `loadProducts`, for the
 *   subscription. Empty for a one-off product.
 */
export async function buy(productId: string, offerToken = ''): Promise<PlayOutcome> {
  if (!NativeOrbitBilling) {
    return { status: 'unavailable' };
  }
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id ?? '';
  if (!userId) {
    return { status: 'failed', message: 'Sign in before buying, so this can be restored later.' };
  }

  let purchase: BillingPurchase;
  try {
    purchase = parse<BillingPurchase>(
      // The account id is echoed back by Play on the purchase AND on every
      // Real-Time Developer Notification about it, which is how a renewal that
      // arrives weeks later — no session, app not running — is attributed at all.
      await NativeOrbitBilling.buy(productId, offerToken, userId),
      { status: 'failed', productId, token: '', orderId: '', acknowledged: false, obfuscatedAccountId: '', message: 'unreadable response' },
    );
  } catch (error) {
    return { status: 'failed', message: (error as Error).message ?? 'Purchase failed.' };
  }

  const kind = productId === ADFREE_SUBSCRIPTION ? 'subs' : 'inapp';
  switch (purchase.status) {
    case 'purchased':
      return verify(purchase.token, purchase.productId || productId, kind);
    // Deferred payment. Play will report it through `restore` once it settles,
    // and granting now would be giving away the thing before it is paid for.
    case 'pending':
      return { status: 'pending' };
    case 'cancelled':
      return { status: 'cancelled' };
    // Already owned on this Google account — which is the normal shape of
    // "I paid on my old phone". Verifying what Play already holds is exactly
    // the restore path.
    case 'owned':
      return restore();
    case 'unavailable':
      return { status: 'unavailable' };
    default:
      return { status: 'failed', message: purchase.message || 'Purchase failed.' };
  }
}

/**
 * Ask Play what this Google account owns, and verify anything it has that the
 * server has not seen.
 *
 * Safe to call repeatedly — the server keys on the purchase token and a token
 * it has already granted is a no-op rather than a second month.
 */
export async function restore(): Promise<PlayOutcome> {
  if (!NativeOrbitBilling) {
    return { status: 'unavailable' };
  }
  let held: BillingPurchase[];
  try {
    const [subs, oneOff] = await Promise.all([
      NativeOrbitBilling.restore('subs'),
      NativeOrbitBilling.restore('inapp'),
    ]);
    held = [...parse<BillingPurchase[]>(subs, []), ...parse<BillingPurchase[]>(oneOff, [])];
  } catch {
    return { status: 'unavailable' };
  }

  let last: PlayOutcome = { status: 'cancelled' };
  for (const purchase of held) {
    if (purchase.status !== 'purchased' || !purchase.token) {
      continue;
    }
    const kind = purchase.productId === ADFREE_SUBSCRIPTION ? 'subs' : 'inapp';
    // Sequential rather than parallel: each one writes the same account's
    // entitlement, and two extensions racing would both read the same
    // pre-existing expiry and both extend from it.
    // eslint-disable-next-line no-await-in-loop
    last = await verify(purchase.token, purchase.productId, kind);
  }
  return last;
}
