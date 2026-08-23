/**
 * react-native-razorpay ships JavaScript with no type declarations, so this
 * describes the one call the app makes rather than letting the module in as
 * `any`.
 *
 * Deliberately narrow: only the fields `src/lib/razorpay.ts` sends. Anything
 * the checkout supports and this app does not is not typed here, so adding a
 * field is a decision rather than an accident.
 */
declare module 'react-native-razorpay' {
  export interface CheckoutOptions {
    /** The publishable key id, handed back by razorpay-create-order. */
    key: string;
    /** The order created server-side. Never build one on the client. */
    order_id: string;
    /** In paise, and only for display — the order already fixes the amount. */
    amount: number;
    currency: string;
    name: string;
    description?: string;
    image?: string;
    theme?: { color?: string };
    prefill?: { email?: string; contact?: string; name?: string };
    notes?: Record<string, string>;
  }

  export interface CheckoutSuccess {
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }

  /**
   * Resolves on a completed payment and **rejects on cancellation**, with a
   * `{ code, description }` shape rather than an Error.
   */
  const RazorpayCheckout: {
    open(options: CheckoutOptions): Promise<CheckoutSuccess>;
  };
  export default RazorpayCheckout;
}
