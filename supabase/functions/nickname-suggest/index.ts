import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const GEMINI_MODEL = "gemini-3.1-flash-lite";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const FALLBACK = [
  "Dr. Scalpel", "Dr. Synapse", "Cardio Kid", "Dr. Nephron",
  "Neuro Ninja", "Dr. Alveoli", "Pharma Pro", "Dr. Mitochondria",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const seed = typeof body.seed === "string" ? body.seed.slice(0, 60) : "";
    const year = typeof body.year === "string" ? body.year.slice(0, 20) : "";

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return json({ names: FALLBACK.slice(0, 6) });

    // Keep onboarding open; excess usage or unavailable checks use the existing
    // local names instead of spending provider quota or blocking profile creation.
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
    let userId: string | null = null;
    if (token && token !== anonKey) {
      const caller = createClient(url, anonKey, { auth: { persistSession: false } });
      const { data, error } = await caller.auth.getUser(token);
      if (error || !data.user) return json({ names: FALLBACK.slice(0, 6) });
      userId = data.user.id;
    }
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });
    const hash = async (value: string) => Array.from(new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
    )).map(b => b.toString(16).padStart(2, "0")).join("");
    const now = new Date();
    const minute = new Date(Math.floor(now.getTime() / 60000) * 60000).toISOString();
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown";
    const quotaSubject = userId ? "user:" + userId : "guest:" + ip;
    for (const check of [
      { subject: await hash(quotaSubject), action: "ai_minute", bucket: minute, limit: 10 },
      { subject: await hash(quotaSubject), action: "ai_day", bucket: day, limit: 150 },
      { subject: await hash("ip:" + ip), action: "ip_day", bucket: day, limit: 500 },
    ]) {
      const { data: allowed, error } = await admin.rpc("consume_edge_quota", {
        _subject_hash: check.subject, _action: check.action,
        _bucket_start: check.bucket, _limit: check.limit,
      });
      if (error || !allowed) return json({ names: FALLBACK.slice(0, 6) });
    }

    const prompt =
      `Suggest 6 short, fun, clean medical-student nicknames for an MBBS ${year || ""} student` +
      (seed ? ` whose name/hint is "${seed}"` : "") +
      `. Max 18 characters each, no numbers, no offensive words, no explanations. ` +
      `Reply with ONLY a JSON array of 6 strings.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 1.1, maxOutputTokens: 200 },
        }),
      },
    );
    if (!res.ok) {
      console.error("gemini nickname failed", res.status, await res.text());
      return json({ names: FALLBACK.slice(0, 6) });
    }
    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("") ?? "";
    let names: string[] = [];
    try {
      const m = text.match(/\[[\s\S]*\]/);
      if (m) names = JSON.parse(m[0]);
    } catch { /* ignore */ }
    names = (Array.isArray(names) ? names : [])
      .filter((n) => typeof n === "string")
      .map((n) => n.trim().slice(0, 18))
      .filter((n) => n.length >= 2)
      .slice(0, 6);
    if (!names.length) names = FALLBACK.slice(0, 6);
    return json({ names });
  } catch (err) {
    console.error("nickname-suggest failure", err);
    return json({ names: FALLBACK.slice(0, 6) });
  }
});
