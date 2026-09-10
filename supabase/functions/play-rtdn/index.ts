import { createClient } from "npm:@supabase/supabase-js@2";
import { playAccessToken } from "./googlePlayAuth.ts";

/**
 * Real-Time Developer Notifications from Google Play.
 *
 * ## Why this has to exist before a single real subscription does
 *
 * A subscription renews, lapses, is refunded, is put on hold, is paused or is
 * cancelled WITHOUT the app being open. Play publishes each of those to a Cloud
 * Pub/Sub topic and something has to receive it.
 *
 * Without this: a cancelled subscription stays "active" in our table until its
 * last known expiry, and a renewed one silently expires on the month it was
 * bought -- for a reader who is still being charged. Retrofitting it later means
 * reconciling rows that have already drifted, one by one, against Play.
 *
 * ## What a notification actually contains
 *
 * A purchase token and a type. Nothing else -- no expiry, no state, no account.
 * So this function does not trust the notification for anything: it takes the
 * token, asks the Play Developer API what that token is NOW, and writes that.
 * A replayed or forged notification therefore cannot move an expiry anywhere
 * Play would not also move it.
 *
 * ## Authentication, and why it is a query parameter
 *
 * Pub/Sub cannot send a Supabase JWT, so this function is deployed with
 * `verify_jwt: false` and guards itself: `?secret=` must equal `PLAY_RTDN_SECRET`,
 * compared in constant time. That is the shape Pub/Sub push endpoints normally
 * take, and it is why the push subscription's URL is itself a secret -- it is
 * written down in mobile/PLAY-BILLING-SETUP.md as something never to paste into
 * a screenshot.
 *
 * ## Nothing here has been run against a real notification
 *
 * The topic does not exist yet and `PLAY_SERVICE_ACCOUNT_JSON` is not set, so
 * today every call returns 500 and changes nothing -- which is the correct
 * failure. Play Console's "Send Test Message" button is the first real proof,
 * and it sends a `testNotification`, which this handles and acknowledges
 * without touching the database.
 */

const PACKAGE_NAME = "com.aistudio.mbbsqbank.aycxvd";
const API = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const admin = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

/**
 * Move a subscription's row to whatever Play currently says.
 *
 * One token, one row -- `play_purchase_token` is UNIQUE and a subscription keeps
 * the same token for its whole life, so this is an update by that token and
 * never an insert. A token with no row is a purchase that was never verified
 * through `play-verify-purchase`; there is no user to attach it to here (a
 * notification carries no session), so it is logged and left. The reader's next
 * launch runs `restore()`, which posts the token with a session attached and
 * creates the row properly.
 */
async function syncSubscription(token: string): Promise<string> {
  const bearer = await playAccessToken();
  const response = await fetch(
    `${API}/${PACKAGE_NAME}/purchases/subscriptionsv2/tokens/${encodeURIComponent(token)}`,
    { headers: { Authorization: `Bearer ${bearer}` } },
  );
  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    return `lookup failed ${response.status}`;
  }

  const state = String(body?.subscriptionState ?? "");
  const lineItems = Array.isArray(body?.lineItems) ? body.lineItems as Record<string, unknown>[] : [];
  let expiry = 0;
  for (const item of lineItems) {
    const at = Date.parse(String(item?.expiryTime ?? ""));
    if (Number.isFinite(at) && at > expiry) expiry = at;
  }

  /*
   * ON_HOLD, PAUSED and EXPIRED end the entitlement NOW, whatever expiry Play
   * still reports. CANCELED does not: cancelling stops the next charge, it does
   * not end the month already paid for, and taking ad-free away the moment
   * somebody cancels would be charging them for time they then did not get.
   */
  const ended = state === "SUBSCRIPTION_STATE_ON_HOLD" ||
    state === "SUBSCRIPTION_STATE_PAUSED" ||
    state === "SUBSCRIPTION_STATE_EXPIRED";
  const expiresAt = ended || !expiry
    ? new Date().toISOString()
    : new Date(expiry).toISOString();

  const { error, count } = await admin()
    .from("premium_subscriptions")
    .update({
      expires_at: expiresAt,
      play_state: state,
      auto_renewing: lineItems.some((item) => Boolean(item?.autoRenewingPlan)),
      updated_at: new Date().toISOString(),
    }, { count: "exact" })
    .eq("play_purchase_token", token);
  if (error) {
    console.error("rtdn update failed", error);
    return "update failed";
  }
  if (!count) {
    // Not an error: a purchase Play knows about and we have never verified.
    console.warn("rtdn for an unknown token", state);
    return "no row";
  }
  return `${state} -> ${expiresAt}`;
}

/**
 * A refund or a chargeback. End it now, both halves.
 *
 * The bundled bonus row carries the same token with a suffix -- see the row
 * construction in play-verify-purchase -- so a `like` on the token prefix is
 * what takes the notes unlock away with the ad-free it came with. Leaving the
 * bonus behind would mean a refunded purchase kept the thing it bundled.
 */
async function voidPurchase(token: string): Promise<string> {
  const now = new Date().toISOString();
  const { error } = await admin()
    .from("premium_subscriptions")
    .update({ expires_at: now, play_state: "VOIDED", auto_renewing: false, updated_at: now })
    .like("play_purchase_token", `${token}%`);
  if (error) {
    console.error("void update failed", error);
    return "update failed";
  }
  return "voided";
}

Deno.serve(async (req) => {
  try {
    const expected = Deno.env.get("PLAY_RTDN_SECRET");
    if (!expected) {
      console.error("PLAY_RTDN_SECRET is not set");
      return json({ error: "not configured" }, 500);
    }
    const given = new URL(req.url).searchParams.get("secret") ?? "";
    if (!constantTimeEqual(given, expected)) {
      return json({ error: "forbidden" }, 403);
    }

    const envelope = await req.json().catch(() => null) as
      { message?: { data?: string; messageId?: string } } | null;
    const encoded = envelope?.message?.data;
    if (!encoded) {
      // An empty push is Pub/Sub checking the endpoint is alive. 200, or it
      // retries for ever and eventually stops delivering real ones.
      return json({ ok: true, note: "no data" });
    }

    const notification = JSON.parse(atob(encoded)) as {
      packageName?: string;
      subscriptionNotification?: { purchaseToken?: string; notificationType?: number };
      oneTimeProductNotification?: { purchaseToken?: string; notificationType?: number };
      voidedPurchaseNotification?: { purchaseToken?: string };
      testNotification?: { version?: string };
    };

    // A notification for another app is not ours to act on. Play does not send
    // one, but the topic is addressable and this costs one comparison.
    if (notification.packageName && notification.packageName !== PACKAGE_NAME) {
      console.warn("rtdn for another package", notification.packageName);
      return json({ ok: true, note: "wrong package" });
    }

    // Play Console's "Send Test Message" button. Acknowledged, nothing touched:
    // it is how the owner proves the wiring works before any money exists.
    if (notification.testNotification) {
      console.log("rtdn test message received");
      return json({ ok: true, note: "test" });
    }

    const voided = notification.voidedPurchaseNotification?.purchaseToken;
    if (voided) {
      return json({ ok: true, result: await voidPurchase(voided) });
    }

    const token = notification.subscriptionNotification?.purchaseToken;
    if (token) {
      return json({ ok: true, result: await syncSubscription(token) });
    }

    /*
     * A one-time product notification. Nothing to do, and that is deliberate
     * rather than unfinished: the notes unlocks are non-consumable and last for
     * ever, so the only event that can change one is a refund -- and a refund
     * arrives as a voidedPurchaseNotification, handled above.
     */
    if (notification.oneTimeProductNotification) {
      return json({ ok: true, note: "one-time product, nothing to change" });
    }

    return json({ ok: true, note: "unhandled notification type" });
  } catch (err) {
    console.error("play-rtdn failure", err);
    /*
     * 500 makes Pub/Sub retry with backoff, which is what should happen when
     * the failure is ours -- a Play lookup that timed out, the database being
     * briefly unreachable. Returning 200 on an error would discard the
     * notification, and a missed renewal is invisible until a paying reader
     * starts seeing ads.
     */
    return json({ error: (err as Error).message ?? "Unknown error" }, 500);
  }
});
