import { createClient } from "npm:@supabase/supabase-js@2";
import { playAccessToken } from "./googlePlayAuth.ts";

/**
 * Verify a Google Play purchase, then grant the entitlement.
 *
 * The client sends ONE thing: a purchase token. Not the plan, not the price,
 * not the duration -- every one of those is something a tampered client could
 * lie about, so all of them are derived from what the Play Developer API says
 * the token really is. This is the same rule `razorpay-verify-payment` follows
 * with its HMAC, and it is the only reason either function can be trusted.
 *
 * ## Why acknowledgement happens here and not on the phone
 *
 * Play AUTO-REFUNDS an unacknowledged purchase after three days and revokes the
 * entitlement with it. So acknowledgement is a receipt for a grant that has
 * actually happened -- acknowledging from the client would be the app promising
 * Play that a grant occurred before anything had checked whether it should.
 * BillingModule.kt therefore has no acknowledge call at all.
 *
 * ## A subscription keeps ONE purchase token for its whole life
 *
 * Every renewal reports the same token. That is why the row is upserted on
 * `play_purchase_token` rather than inserted: the row is written once and then
 * updated with whatever expiry Play currently reports. It is also what makes
 * this function safe to call as often as the client likes -- `restore()` posts
 * every token Play knows about on every launch, by design.
 *
 * ## Nothing here has been run against a real purchase
 *
 * There is no Play account, no card and no emulator with Play services in the
 * sandboxes this was written in. `PLAY_SERVICE_ACCOUNT_JSON` is not set on the
 * project yet, and until it is this function returns 500 and grants nothing --
 * which is the correct failure. See mobile/PLAY-BILLING-SETUP.md.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Must match `applicationId` in build.gradle, or every lookup 404s. */
const PACKAGE_NAME = "com.aistudio.mbbsqbank.aycxvd";
const API = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications";

/**
 * The subscription, and the base plans inside it.
 *
 * Play reports which base plan was bought; this maps it to the plan key both
 * apps already read. A base plan missing from here is a purchase Play would
 * take and this function would refuse, so `npm run check:billing` pins these
 * against the client's copy.
 */
const ADFREE_SUBSCRIPTION = "orbit_adfree";
const BASE_PLAN_TO_KEY: Record<string, string> = {
  "adfree-monthly": "adfree_monthly",
  "adfree-6months": "adfree_6months",
  "adfree-yearly": "adfree_yearly",
};

const NOTES_PRODUCTS = new Set(["notes_fmspm", "notes_pharmac"]);

/** A hundred years out. The notes are bought once and kept -- same as Razorpay's. */
const lifetime = () =>
  new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();

interface Verified {
  /** The plan key both apps already read. */
  planKey: string;
  /** When ad-free should run out, from Play. Null for a one-off product. */
  expiresAt: string | null;
  orderId: string;
  /** Play's own subscription state, verbatim. Empty for a one-off product. */
  state: string;
  autoRenewing: boolean | null;
  /** Whose purchase Play thinks this is -- set from setObfuscatedAccountId. */
  accountId: string;
  /** Play has not been told yet that this was honoured. */
  needsAcknowledgement: boolean;
  /** The subscription id acknowledgement has to be addressed to. */
  subscriptionId: string;
}

async function verifySubscription(token: string, bearer: string): Promise<Verified> {
  const response = await fetch(
    `${API}/${PACKAGE_NAME}/purchases/subscriptionsv2/tokens/${encodeURIComponent(token)}`,
    { headers: { Authorization: `Bearer ${bearer}` } },
  );
  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    throw new Error(
      `Play did not recognise this subscription (${response.status}). ` +
        `${(body?.error as { message?: string } | undefined)?.message ?? ""}`,
    );
  }

  const state = String(body?.subscriptionState ?? "");
  /*
   * Which states are worth an entitlement.
   *
   * ACTIVE and IN_GRACE_PERIOD both mean the reader should have the thing --
   * grace period is Play retrying a failed card while the subscription is still
   * meant to work. CANCELED is NOT excluded: cancelling stops the renewal, it
   * does not end the month already paid for, and Play keeps reporting an expiry
   * in the future until that month runs out. ON_HOLD, PAUSED and EXPIRED are
   * the ones where nothing is owed.
   */
  const entitled = state === "SUBSCRIPTION_STATE_ACTIVE" ||
    state === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" ||
    state === "SUBSCRIPTION_STATE_CANCELED";
  if (!entitled) {
    throw new Error(`This subscription is not active (${state || "unknown state"}).`);
  }

  const lineItems = Array.isArray(body?.lineItems) ? body.lineItems as Record<string, unknown>[] : [];
  // The furthest expiry across the line items. A single-product subscription
  // has exactly one; taking the max is what keeps this correct if a second is
  // ever added rather than silently entitling to the shorter one.
  let expiry = 0;
  let basePlanId = "";
  for (const item of lineItems) {
    const at = Date.parse(String(item?.expiryTime ?? ""));
    if (Number.isFinite(at) && at > expiry) {
      expiry = at;
    }
    const offer = item?.offerDetails as { basePlanId?: string } | undefined;
    if (offer?.basePlanId) {
      basePlanId = offer.basePlanId;
    }
  }
  if (!expiry) {
    throw new Error("Play reported no expiry for this subscription.");
  }

  return {
    // Every tier writes the `adfree_monthly` ENTITLEMENT -- see the long comment
    // in razorpay-verify-payment. The base plan only says which was bought.
    planKey: BASE_PLAN_TO_KEY[basePlanId] ?? "adfree_monthly",
    expiresAt: new Date(expiry).toISOString(),
    orderId: String(body?.latestOrderId ?? ""),
    state,
    autoRenewing: lineItems.some((item) => Boolean(item?.autoRenewingPlan)),
    accountId: String(
      (body?.externalAccountIdentifiers as { obfuscatedExternalAccountId?: string } | undefined)
        ?.obfuscatedExternalAccountId ?? "",
    ),
    needsAcknowledgement: String(body?.acknowledgementState ?? "") ===
      "ACKNOWLEDGEMENT_STATE_PENDING",
    subscriptionId: ADFREE_SUBSCRIPTION,
  };
}

async function verifyProduct(token: string, productId: string, bearer: string): Promise<Verified> {
  const response = await fetch(
    `${API}/${PACKAGE_NAME}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(token)}`,
    { headers: { Authorization: `Bearer ${bearer}` } },
  );
  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    throw new Error(
      `Play did not recognise this purchase (${response.status}). ` +
        `${(body?.error as { message?: string } | undefined)?.message ?? ""}`,
    );
  }
  // 0 purchased, 1 cancelled, 2 pending. A PENDING purchase is a deferred
  // payment method that has not settled -- the reader owes nothing yet.
  const purchaseState = Number(body?.purchaseState ?? -1);
  if (purchaseState !== 0) {
    throw new Error(purchaseState === 2 ? "This payment has not completed yet." : "This purchase was cancelled.");
  }
  return {
    planKey: productId,
    expiresAt: null,
    orderId: String(body?.orderId ?? ""),
    state: "",
    autoRenewing: null,
    accountId: String(body?.obfuscatedExternalAccountId ?? ""),
    // 0 = yet to be acknowledged.
    needsAcknowledgement: Number(body?.acknowledgementState ?? 1) === 0,
    subscriptionId: "",
  };
}

/**
 * Tell Play the purchase was honoured. Failure is logged and swallowed.
 *
 * Deliberately AFTER the entitlement is written. If acknowledgement fails, Play
 * refunds in three days and the reader loses something they paid for -- which
 * is bad. If the GRANT fails and we acknowledged first, the reader has paid,
 * cannot be refunded automatically, and has nothing. That is worse, so the
 * grant goes first and this is best-effort.
 */
async function acknowledge(verified: Verified, token: string, bearer: string): Promise<void> {
  if (!verified.needsAcknowledgement) {
    return;
  }
  const url = verified.subscriptionId
    ? `${API}/${PACKAGE_NAME}/purchases/subscriptions/${verified.subscriptionId}/tokens/${encodeURIComponent(token)}:acknowledge`
    : `${API}/${PACKAGE_NAME}/purchases/products/${encodeURIComponent(verified.planKey)}/tokens/${encodeURIComponent(token)}:acknowledge`;
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!response.ok) {
    console.error("acknowledge failed", response.status, await response.text().catch(() => ""));
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const token = typeof body?.purchase_token === "string" ? body.purchase_token : "";
    const productId = typeof body?.product_id === "string" ? body.product_id : "";
    const kind = body?.kind === "subs" ? "subs" : "inapp";
    if (token.length < 10 || token.length > 4000) {
      return json({ error: "Missing or invalid purchase token." }, 400);
    }
    if (kind === "inapp" && !NOTES_PRODUCTS.has(productId)) {
      return json({ error: "Unknown product." }, 400);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return json({ error: "Not signed in." }, 401);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return json({ error: "Session expired. Sign in again." }, 401);
    const user = userData.user;

    const bearer = await playAccessToken();
    const verified = kind === "subs"
      ? await verifySubscription(token, bearer)
      : await verifyProduct(token, productId, bearer);

    /*
     * Whose purchase is this?
     *
     * `setObfuscatedAccountId` put the buyer's Supabase user id on the purchase
     * and Play echoes it back here. Refusing a mismatch is what stops one
     * reader's token being posted from another reader's session to get a free
     * month -- a token is not a secret once it has been on a device.
     *
     * An EMPTY id is allowed through: purchases made before this function
     * existed, and any made by a client that did not set it, have none. It is
     * checked when it is there rather than demanded, because demanding it would
     * refuse a legitimate restore for somebody who paid.
     */
    if (verified.accountId && verified.accountId !== user.id) {
      console.warn("account mismatch", verified.accountId, user.id);
      return json({ error: "This purchase belongs to a different account." }, 403);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const isAdfree = kind === "subs";
    /*
     * Ad-free's expiry comes from PLAY, never from adding days here.
     *
     * The Razorpay function has to compute one -- it extends from the existing
     * expiry so nobody loses time they paid for. Play already knows: the token
     * is the same across every renewal, and `expiryTime` is the current answer.
     * Computing our own would drift the moment Play granted a grace period, a
     * refund or a free trial, and ours would be the one on screen.
     */
    const adfreeAt = isAdfree ? verified.expiresAt! : (() => {
      // A notes purchase carries a free month, as it does on Razorpay. This one
      // IS computed, because there is no subscription behind it to ask.
      const base = new Date();
      return new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    })();

    const common = {
      user_id: user.id,
      email: user.email ?? null,
      source: "play",
      play_product_id: isAdfree ? ADFREE_SUBSCRIPTION : productId,
      play_order_id: verified.orderId || null,
      play_state: verified.state || null,
      auto_renewing: verified.autoRenewing,
      // Amount is not recorded for Play: Play took the money, in the reader's
      // own currency, minus a service fee this function has no way to know.
      // A number here would be a guess, and the admin panel would print it as
      // if it were what arrived.
      amount_paise: 0,
      updated_at: new Date().toISOString(),
    };

    /*
     * The rows, and why the bonus ones get a suffixed token.
     *
     * `play_purchase_token` is UNIQUE, which is what stops one token being
     * redeemed twice -- so the bundled bonus row cannot carry the same token as
     * the row it came with. The suffix is the same trick razorpay-verify-payment
     * uses on `razorpay_payment_id`, for the same constraint.
     */
    const rows = isAdfree
      ? [
        { ...common, plan: "adfree_monthly", expires_at: adfreeAt, play_purchase_token: token },
        // Ad-free carries the FM+SPM notes, as it does on Razorpay.
        { ...common, plan: "notes_fmspm", expires_at: lifetime(), play_purchase_token: `${token}:notes` },
      ]
      : [
        { ...common, plan: productId, expires_at: lifetime(), play_purchase_token: token },
        { ...common, plan: "adfree_monthly", expires_at: adfreeAt, play_purchase_token: `${token}:adfree` },
      ];

    let saved = 0;
    for (const row of rows) {
      /*
       * Upsert, not insert. A subscription reports the SAME token for its whole
       * life, so this row is written once and updated on every renewal; and
       * `restore()` posts every token Play knows about on every launch, so an
       * insert would collide on the second call of the first day.
       */
      const { error } = await admin
        .from("premium_subscriptions")
        .upsert(row, { onConflict: "play_purchase_token" });
      if (error) console.error("play subscription upsert failed", row.plan, error);
      else saved++;
    }
    if (saved === 0) {
      return json({ error: "Purchase verified but the plan could not be saved. Contact support." }, 500);
    }

    await acknowledge(verified, token, bearer);

    /*
     * Tell the owner money arrived -- but only the first time.
     *
     * `restore()` calls this function on every launch with the same token, and
     * a renewal reuses it too. Without this guard the owner's notifications
     * would fill with the same purchase every time the reader opened the app.
     */
    const { data: alreadyTold } = await admin
      .from("admin_notifications")
      .select("id")
      .eq("kind", "purchase")
      .contains("meta", { play_purchase_token: token })
      .limit(1)
      .maybeSingle();
    if (!alreadyTold) {
      const what = isAdfree
        ? "Ad-free (Google Play)"
        : productId === "notes_pharmac"
          ? "Pharmacology notes (Google Play)"
          : "FM + SPM notes (Google Play)";
      const { error: noticeError } = await admin.from("admin_notifications").insert({
        kind: "purchase",
        title: what,
        body: `${user.email ?? "a reader with no email on file"} bought ${what}.` +
          ` Ad-free until ${adfreeAt.slice(0, 10)}.`,
        meta: {
          plan: verified.planKey,
          source: "play",
          user_id: user.id,
          email: user.email ?? null,
          play_purchase_token: token,
          play_order_id: verified.orderId,
          play_state: verified.state,
          adfree_until: adfreeAt,
        },
      });
      if (noticeError) console.error("admin notification insert failed", noticeError);
    }

    console.log("play purchase verified", verified.planKey, verified.state, verified.orderId);
    return json({
      success: true,
      plan: verified.planKey,
      source: "play",
      expires_at: isAdfree ? adfreeAt : lifetime(),
      adfree_until: adfreeAt,
      notes_unlocked: true,
      state: verified.state,
      auto_renewing: verified.autoRenewing,
    });
  } catch (err) {
    console.error("play-verify-purchase failure", err);
    return json({ error: (err as Error).message ?? "Unknown error" }, 500);
  }
});
