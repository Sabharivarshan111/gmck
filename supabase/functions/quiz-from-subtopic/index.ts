import { secureEndpoint } from '../_shared/endpointSecurity.ts';
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const Body = z.object({
  subject: z.string().min(1).max(120),
  questions: z.array(z.string().min(1).max(800)).min(3).max(40),
});

interface Mcq { question: string; options: string[]; correctIndex: number; explanation: string; }

const GEMINI_MODEL = "gemini-3.1-flash-lite";
const QUIZ_COUNT = 5;

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const stripJsonFence = (value: string) => {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) return fenced[1].trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
};

const extractBalancedJson = (value: string) => {
  const stripped = stripJsonFence(value);
  const start = stripped.indexOf("{");
  if (start < 0) return stripped;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let idx = start; idx < stripped.length; idx += 1) {
    const char = stripped[idx];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return stripped.slice(start, idx + 1);
    }
  }

  return stripped.slice(start);
};

const normalizeMcq = (item: unknown): Mcq | null => {
  const raw = item as Partial<Mcq> & { answerIndex?: unknown; correct?: unknown; answer?: unknown };
  if (!raw || typeof raw.question !== "string" || !Array.isArray(raw.options)) return null;

  const options = raw.options
    .map((option) => String(option ?? "").replace(/^\s*[A-D](?:[).:-]\s+|\s+-\s+)/i, "").trim())
    .filter(Boolean)
    .slice(0, 4);

  let correctIndex = Number.isInteger(raw.correctIndex) ? Number(raw.correctIndex) : -1;
  if (correctIndex < 0 && Number.isInteger(raw.answerIndex)) correctIndex = Number(raw.answerIndex);
  if (correctIndex < 0 && typeof raw.correct === "string") {
    const letter = raw.correct.trim().match(/^[A-D]/i)?.[0]?.toUpperCase();
    if (letter) correctIndex = letter.charCodeAt(0) - 65;
  }
  if (correctIndex < 0 && typeof raw.answer === "string") {
    const answer = raw.answer.trim();
    const letter = answer.match(/^[A-D]/i)?.[0]?.toUpperCase();
    if (letter) correctIndex = letter.charCodeAt(0) - 65;
    else correctIndex = options.findIndex((option) => option.toLowerCase() === answer.toLowerCase());
  }

  const explanation = typeof raw.explanation === "string" && raw.explanation.trim()
    ? raw.explanation.trim()
    : "Review this concept from your ticked questions.";

  const mcq = { question: raw.question.trim(), options, correctIndex, explanation };
  return isValidMcq(mcq) ? mcq : null;
};

const isValidMcq = (item: unknown): item is Mcq => {
  const mcq = item as Mcq;
  return Boolean(
    mcq &&
    typeof mcq.question === "string" &&
    Array.isArray(mcq.options) &&
    mcq.options.length === 4 &&
    mcq.options.every((option) => typeof option === "string" && option.trim().length > 0) &&
    Number.isInteger(mcq.correctIndex) &&
    mcq.correctIndex >= 0 &&
    mcq.correctIndex <= 3 &&
    typeof mcq.explanation === "string",
  );
};

const mapGeminiError = (status: number, text: string) => {
  let providerMsg = "";
  try {
    const parsed = JSON.parse(text);
    providerMsg = parsed?.error?.message || parsed?.message || "";
  } catch { /* ignore */ }
  if (status === 429) return "Gemini is rate-limited right now. Please try again in a minute.";
  if (status === 403) return providerMsg || "Gemini API key is not authorized. Check that the key is valid.";
  if (status === 400) return providerMsg || "Gemini rejected the quiz request. Please try again.";
  return providerMsg ? providerMsg.slice(0, 220) : `Gemini service error (${status}).`;
};

Deno.serve(secureEndpoint(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const bearer = req.headers.get("Authorization") ?? "";
  const token = bearer.startsWith("Bearer ") ? bearer.slice(7) : "";
  if (!token) return json({ error: "Sign in to create a quiz." }, 401);
  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authClient = createClient(url, anonKey, { auth: { persistSession: false } });
  let userId: string | null = null;
  if (token !== anonKey) {
    const { data: userData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !userData.user) return json({ error: "Invalid session." }, 401);
    userId = userData.user.id;
  }
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
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
    if (error) return json({ error: "AI quota temporarily unavailable." }, 503);
    if (!allowed) return json({ error: "AI usage limit reached. Try again later." }, 429);
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    console.error("quiz-from-subtopic: missing GEMINI_API_KEY");
    return json({ error: "AI quiz is not configured yet. Please set GEMINI_API_KEY." }, 500);
  }

  let parsed;
  try { parsed = Body.safeParse(await req.json()); }
  catch { return json({ error: "Invalid quiz request." }, 400); }
  if (!parsed.success) {
    return json({ error: "Select at least 3 studied questions before starting a quiz." }, 400);
  }

  const { subject, questions } = parsed.data;
  console.log(`quiz-from-subtopic: generating quiz`, { subject, questionCount: questions.length });

  const sample = questions.slice(0, 12).map((q, i) => `${i + 1}. ${q}`).join("\n");
  const prompt = `You are an MBBS examiner. Create EXACTLY ${QUIZ_COUNT} high-quality MCQs for an undergraduate medical student studying "${subject}".
Base them on these study questions the student has already revised:
${sample}

Rules:
- Each MCQ must have exactly 4 options (A,B,C,D).
- Only ONE correct option.
- "correctIndex" is 0-based (0=A, 1=B, 2=C, 3=D).
- Add a concise explanation under 22 words.
- Cover different concepts from the list.
- Return compact JSON only — no prose, no markdown fence.

Required JSON shape:
{"mcqs":[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]}`;

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.35,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          mcqs: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                question: { type: "STRING" },
                options: { type: "ARRAY", items: { type: "STRING" } },
                correctIndex: { type: "INTEGER" },
                explanation: { type: "STRING" },
              },
              required: ["question", "options", "correctIndex", "explanation"],
            },
          },
        },
        required: ["mcqs"],
      },
      maxOutputTokens: 8192,
    },
  };

  let aiRes: Response;
  try {
    aiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
  } catch (err) {
    console.error("quiz-from-subtopic: network error", err);
    return json({ error: "Could not reach Gemini. Please check your connection and retry." }, 502);
  }

  if (!aiRes.ok) {
    const txt = await aiRes.text();
    const message = mapGeminiError(aiRes.status, txt);
    console.error(`quiz-from-subtopic: gemini failed`, { status: aiRes.status, message });
    return json({ error: message }, aiRes.status === 429 ? 429 : 502);
  }

  const data = await aiRes.json();
  const content: string = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("") ?? "";
  const finishReason = data?.candidates?.[0]?.finishReason;

  let mcqs: Mcq[] = [];
  try {
    const obj = JSON.parse(extractBalancedJson(content));
    mcqs = (obj?.mcqs ?? []).map(normalizeMcq).filter(Boolean).slice(0, QUIZ_COUNT) as Mcq[];
  } catch {
    console.error("quiz-from-subtopic: could not parse Gemini response", { finishReason, length: content.length, preview: content.slice(0, 300) });
    return json({ error: finishReason === "MAX_TOKENS" ? "Gemini quiz response was cut off. Please retry." : "Gemini returned an unreadable quiz. Please retry." }, 502);
  }

  if (mcqs.length === 0) {
    console.error("quiz-from-subtopic: no valid MCQs returned", { finishReason, length: content.length, preview: content.slice(0, 300) });
    return json({ error: "AI did not return valid MCQs. Please try again." }, 502);
  }

  return json({ mcqs });
}));
