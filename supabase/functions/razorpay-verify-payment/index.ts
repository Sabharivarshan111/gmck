import { createClient } from "npm:@supabase/supabase-js@2";

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

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const isStr = (v: unknown, min: number, max: number) =>
  typeof v === "string" && v.length >= min && v.length <= max;

/**
 * The three ad-free tiers: how long each buys, and what it costs.
 *
 * These MUST agree with `PLANS` in razorpay-create-order. They are separate
 * tables in separate functions on purpose -- this one never trusts an amount
 * the client sent, and re-deriving it from the plan key is what makes a client
 * that lies about the amount pointless. The plan key itself is safe to trust
 * only because the signature check below has already proved the payment is a
 * real one for the order this function is about to record.
 */
const ADFREE_TIERS: Record<string, { days: number; paise: number; label: string }> = {
  adfree_monthly: { days: 30, paise: 5000, label: "1 month" },
  adfree_6months: { days: 180, paise: 15000, label: "6 months" },
  adfree_yearly: { days: 365, paise: 30000, label: "1 year" },
};

const NOTES_PLANS = new Set(["notes_fmspm", "notes_pharmac"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keySecret) return json({ error: "Razorpay keys are not configured." }, 500);

    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const orderId = body?.razorpay_order_id;
    const paymentId = body?.razorpay_payment_id;
    const signature = body?.razorpay_signature;
    const rawPlan = typeof body?.plan === "string" ? body.plan : "";
    const planKey = NOTES_PLANS.has(rawPlan) || ADFREE_TIERS[rawPlan]
      ? rawPlan
      : "adfree_monthly";

    if (!isStr(orderId, 5, 120) || !isStr(paymentId, 5, 120) || !isStr(signature, 10, 200)) {
      return json({ error: "Missing or invalid payment fields." }, 400);
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

    const expected = await hmacSha256Hex(keySecret, `${orderId}|${paymentId}`);
    if (!constantTimeEqual(expected, signature as string)) {
      console.warn("signature mismatch for order", orderId);
      return json({ error: "Payment signature could not be verified." }, 400);
    }

    // Signature is valid -> record / extend the purchase.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const user = userData.user;

    // Both plans are bundled: notes purchase includes 1 month ad-free,
    // and the ad-free purchase includes lifetime access to the FM+SPM notes.
    const lifetimeAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();

    /*
     * Every ad-free tier writes a row whose plan is `adfree_monthly`, and that
     * is deliberate rather than laziness.
     *
     * `adfree_monthly` is the ENTITLEMENT -- "this account has no ads until
     * expires_at" -- and both apps already read exactly that: `premium.ts` in
     * the native app and the web app's own check both filter on that plan and
     * compare the date. A six-month purchase is the same entitlement bought
     * further into the future, so writing a new plan string would mean editing
     * every reader, and any one missed would be somebody who paid three hundred
     * rupees and still saw ads.
     *
     * Which tier was bought is not lost: `amount_paise` says, and it is what
     * the admin dashboard already displays.
     */
    const tier = ADFREE_TIERS[planKey];
    const adfreeDays = tier ? tier.days : ADFREE_TIERS.adfree_monthly.days;

    const { data: existing } = await admin
      .from("premium_subscriptions")
      .select("id, expires_at")
      .eq("user_id", user.id)
      .eq("plan", "adfree_monthly")
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Buying again while still covered EXTENDS from the existing expiry rather
    // than from today, so nobody loses time they have already paid for.
    const base = existing?.expires_at && new Date(existing.expires_at) > new Date()
      ? new Date(existing.expires_at)
      : new Date();
    const adfreeAt = new Date(base.getTime() + adfreeDays * 24 * 60 * 60 * 1000).toISOString();

    const common = {
      user_id: user.id,
      email: user.email ?? null,
      razorpay_order_id: orderId as string,
      razorpay_payment_id: paymentId as string,
    };

    const isAdfreePurchase = Boolean(tier);
    const adfreePaise = isAdfreePurchase ? tier.paise : 0;

    // NOTE: razorpay_payment_id is unique, so bundled bonus rows get a suffixed id.
    const rows = planKey === "notes_pharmac"
      ? [
        { ...common, plan: "notes_pharmac", amount_paise: 5000, expires_at: lifetimeAt },
        { ...common, plan: "adfree_monthly", amount_paise: 0, expires_at: adfreeAt,
          razorpay_payment_id: `${paymentId}:adfree` },
      ]
      : [
        { ...common, plan: "notes_fmspm", amount_paise: planKey === "notes_fmspm" ? 5000 : 0, expires_at: lifetimeAt,
          razorpay_payment_id: planKey === "notes_fmspm" ? (paymentId as string) : `${paymentId}:notes` },
        { ...common, plan: "adfree_monthly", amount_paise: adfreePaise, expires_at: adfreeAt,
          razorpay_payment_id: isAdfreePurchase ? (paymentId as string) : `${paymentId}:adfree` },
      ];

    let saved = 0;
    for (const row of rows) {
      const { error } = await admin.from("premium_subscriptions").insert(row);
      if (error) console.error("subscription insert failed", row.plan, error);
      else saved++;
    }
    if (saved === 0) {
      return json({ error: "Payment verified but the plan could not be saved. Contact support." }, 500);
    }

    /*
     * Tell the app's owner that money arrived.
     *
     * Written with the service role, and there is no client-insert policy on
     * `admin_notifications` -- so a "you got paid" row cannot be forged from an
     * app. It is deliberately AFTER the entitlement is saved and its failure is
     * swallowed: a notification that does not appear is an annoyance, and a
     * purchase that is refused because a notification failed is somebody's
     * money.
     */
    const rupees = (isAdfreePurchase ? tier.paise : 5000) / 100;
    const what = isAdfreePurchase
      ? `Ad-free — ${tier.label}`
      : planKey === "notes_pharmac"
        ? "Pharmacology notes"
        : "FM + SPM notes";
    const { error: noticeError } = await admin.from("admin_notifications").insert({
      kind: "purchase",
      title: `₹${rupees} — ${what}`,
      body: `${user.email ?? "a reader with no email on file"} bought ${what}.` +
        (isAdfreePurchase ? ` Ad-free until ${adfreeAt.slice(0, 10)}.` : ""),
      meta: {
        plan: planKey,
        amount_paise: isAdfreePurchase ? tier.paise : 5000,
        user_id: user.id,
        email: user.email ?? null,
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        adfree_until: adfreeAt,
      },
    });
    if (noticeError) console.error("admin notification insert failed", noticeError);

    console.log("payment verified + bundle granted", planKey, paymentId, `${adfreeDays}d`);
    return json({
      success: true,
      payment_id: paymentId,
      order_id: orderId,
      plan: planKey,
      expires_at: isAdfreePurchase ? adfreeAt : lifetimeAt,
      adfree_until: adfreeAt,
      notes_unlocked: true,
    });

  } catch (err) {
    console.error("verify-payment failure", err);
    return json({ error: (err as Error).message ?? "Unknown error" }, 500);
  }
});
