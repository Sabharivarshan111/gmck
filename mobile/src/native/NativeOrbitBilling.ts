import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Google Play Billing, wrapped for JavaScript.
 *
 * `com.android.billingclient:billing`. This exists because Play's Payments
 * policy requires Play Billing for digital content consumed inside the app,
 * and both things this app sells — ad-free, and the notes unlocks — are
 * exactly that. Razorpay is fine for physical goods and for services consumed
 * outside the app; it is not fine for either of these.
 *
 * ## Why this is hand-written rather than a library
 *
 * `react-native-iap` was archived on 26 April 2026 and points at `expo-iap`,
 * which is an Expo module: its JS calls `requireNativeModule` from `expo` and
 * its Gradle applies `ExpoModulesCorePlugin.gradle`. Adopting it means adding
 * the whole Expo module system to a shipped bare-RN Play app for one feature —
 * the same trade this repo already refused for `@uginy/react-native-liquid-glass`
 * (CLAUDE.md, "The two Liquid Glass packages, and why neither is here").
 *
 * And the New Architecture makes the stakes higher than usual: a module
 * registered the old way is *silently* absent — `NativeModules.X` is undefined,
 * nothing crashes, nothing logs. The sound module shipped that way and was mute
 * on every device for weeks. A payments module that is silently absent is a Buy
 * button that does nothing, for money.
 *
 * So it is the same four pieces every other native module here has, and
 * `npm run check:billing` asserts all four.
 *
 * ## What this module deliberately does NOT do
 *
 * * **It never grants anything.** It returns a purchase token and stops. The
 *   client cannot verify a purchase, and treating a returned token as proof is
 *   the same mistake as trusting a client-supplied amount — which
 *   `razorpay-verify-payment` already refuses to make.
 * * **It never acknowledges.** Play auto-refunds an unacknowledged purchase
 *   after three days, so acknowledgement is the receipt for a grant that has
 *   actually happened. `play-verify-purchase` does it, server-side, after it has
 *   asked the Play Developer API what the token really is.
 * * **It never invents a price.** Every amount shown to a reader comes from
 *   `ProductDetails`, localised and tax-inclusive, as Play returns it.
 *
 * ## It cannot be tested from this repo
 *
 * No emulator with Play services, no Play account, no card. Billing answers
 * nothing for a build Play did not install — every APK this repo's CI produces.
 * The first real proof is a licence tester on the internal testing track, on a
 * phone. `mobile/PLAY-BILLING-SETUP.md` is the owner's half.
 */

/** One product, as Play describes it. Prices are Play's strings, never ours. */
export interface BillingProduct {
  productId: string;
  /** 'inapp' or 'subs'. */
  kind: string;
  title: string;
  description: string;
  /** Localised and tax-inclusive, e.g. "₹50.00". Show this, never a constant. */
  formattedPrice: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
  /**
   * Subscriptions only: the base plan this offer is for, and the token that
   * `buy` must be given to charge it. An empty string on a one-off product.
   */
  basePlanId: string;
  offerToken: string;
  /** Subscriptions only: ISO 8601, e.g. "P1M". Empty on a one-off product. */
  billingPeriod: string;
}

/** What `buy` resolves. A cancellation is an outcome, never a rejection. */
export interface BillingPurchase {
  /**
   * 'purchased'   — Play took the money; `token` is real and must be verified.
   * 'pending'     — a deferred payment method (cash, UPI mandate). Nothing is
   *                 owed yet and nothing may be granted; Play will report it
   *                 again through `restore` when it settles.
   * 'cancelled'   — the reader backed out. Not an error.
   * 'owned'       — this account already owns it; `restore` has the token.
   * 'unavailable' — no Play Billing on this device or build.
   * 'failed'      — anything else; `message` says what Play said.
   */
  status: string;
  productId: string;
  /** The only thing worth sending to the server. Empty unless 'purchased'. */
  token: string;
  /** Play's own order id, for the admin panel. Empty on a test purchase. */
  orderId: string;
  /** Play has already been told this purchase was honoured. */
  acknowledged: boolean;
  /** Opaque, and echoed back by Play — this app puts the Supabase user id here. */
  obfuscatedAccountId: string;
  message: string;
}

export interface Spec extends TurboModule {
  /**
   * Whether Play Billing answered at all on this device.
   *
   * Resolves false rather than rejecting on a device with no Play Store, an
   * out-of-date Play services, or a sideloaded build. All three are ordinary
   * answers, and the Buy button is hidden for all three — an enabled button
   * whose only outcome is an error is worse than no button.
   */
  available(): Promise<boolean>;

  /**
   * Ask Play what these products cost.
   *
   * @param productIdsJson a JSON array of product ids.
   * @param kind 'inapp' or 'subs'. Play will not mix them in one query.
   * @returns JSON `BillingProduct[]`. A product Play does not know about is
   *   simply absent — never a placeholder, because a placeholder is a price
   *   this app made up.
   */
  products(productIdsJson: string, kind: string): Promise<string>;

  /**
   * Launch Play's purchase sheet.
   *
   * @param productId the product.
   * @param offerToken from `products`, for a subscription. Empty for one-off.
   * @param accountId an opaque account identifier Play echoes back on the
   *   purchase, so the server can tell whose it is even when the notification
   *   arrives days later with no session attached.
   * @returns JSON `BillingPurchase`. Never rejects.
   */
  buy(productId: string, offerToken: string, accountId: string): Promise<string>;

  /**
   * Everything this Google account currently owns, from Play rather than from
   * our table.
   *
   * This is restore-purchases, and it is also how a purchase that completed
   * while the app was killed, or on the reader's other phone, is ever seen. Call
   * it on launch and on every foreground.
   *
   * @param kind 'inapp' or 'subs'.
   * @returns JSON `BillingPurchase[]`.
   */
  restore(kind: string): Promise<string>;
}

/*
 * `get`, never `getEnforcing`. The module is legitimately absent in the preview
 * harness and on any device without Play services; turning that into a crash
 * takes the whole app down for a screen most readers never open.
 */
export default TurboModuleRegistry.get<Spec>('OrbitBilling');
