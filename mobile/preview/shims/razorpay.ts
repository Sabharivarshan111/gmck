/**
 * The preview harness is react-native-web and has no Razorpay SDK.
 *
 * It rejects the way the real one does when a user backs out — `{ code: 0 }`
 * — so the cancel path is what gets exercised in the preview rather than a
 * fake success. A shim that pretended a payment had succeeded would let
 * `check:smoke` walk a purchase flow that grants a month of ad-free to nobody.
 */
const RazorpayCheckout = {
  open(): Promise<never> {
    return Promise.reject({
      code: 0,
      description: 'Payment cancelled — Razorpay is not available in the preview.',
    });
  },
};

export default RazorpayCheckout;
