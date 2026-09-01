import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { buildTextbookContext, pickBookKeys, pickBookKey } from "./textbook.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = "gemini-3.1-flash-lite";
const GEMINI_TIMEOUT_MS = 60_000;
const EST_SECONDS_PER_BATCH = 15;

const SectionTypeSchema = z.enum([
  "definition", "text", "bullets", "steps", "morphology",
  "comparison", "table", "flowchart", "outcome", "revision"
]);

const SectionSchema = z.object({
  type: SectionTypeSchema,
  title: z.string(),
  icon: z.string().optional(),
  payload: z.record(z.any()),
});

const NotesContentSchema = z.object({
  highYieldTip: z.string().optional(),
  pyqYears: z.array(z.string()).optional(),
  sections: z.array(SectionSchema),
  diagramUrl: z.string().optional(),
});

const BodySchema = z.object({
  subtopicKey: z.string(),
  year: z.string(),
  subject: z.string(),
  subtopicName: z.string(),
  questions: z.array(z.string()).default([]),
  batchIndex: z.number().int().min(0).default(0),
  batchSize: z.number().int().min(1).max(30).default(10),
  regenerate: z.boolean().default(false),
  saveContent: z.boolean().default(false),
  content: NotesContentSchema.optional(),
  singleMode: z.boolean().default(false),
  proposeOnly: z.boolean().default(false),
  instruction: z.string().optional(),
});

const SYSTEM_PROMPT = `You are a distinguished medical professor and top-ranking MBBS university examiner creating high-yield, handwritten-style clinical notes.
You synthesize exam-ready notes based on the provided MBBS previous year questions (PYQs) and grounded in standard textbooks.

CRITICAL RULES:
1. Synthesize comprehensive, structured notes formatted into clean JSON sections.
2. Section Types allowed:
   - "definition" { text: string }
   - "text" { paragraph: string }
   - "bullets" { items: string[] }
   - "steps" { items: string[] }
   - "morphology" { subtitle?: string, items: string[] }
   - "comparison" { left: string, right: string, rows: { aspect: string, left: string, right: string }[] }
   - "table" { columns: string[], rows: string[][] }
   - "flowchart" { steps: string[] }
   - "outcome" { text: string }
   - "revision" { items: string[] }
3. Grounding: Rely strictly on the provided textbook excerpts as primary source of truth. Do NOT mention OCR errors, editions, or page numbers in the output.
4. Depth:
   - Essays: In-depth clinical features, etiopathogenesis, classifications, investigations, management algorithms, tables/flowcharts.
   - Short Notes: Crisp bullet points, high-yield numbers, diagnostic criteria, key drug regimens.
5. Response MUST be valid JSON only matching the schema:
{
  "highYieldTip": "string",
  "pyqYears": ["2023", "2022"],
  "sections": [
    { "type": "definition", "title": "Definition & Overview", "icon": "📌", "payload": { "text": "..." } },
    ...
  ]
}`;

function classifyQuestion(q: string): "essay" | "short" | "standard" {
  const s = q.toLowerCase();
  if (/\bshort\s+note|write\s+short\s+notes?|brief\s+note|short\s+account\b/.test(s)) return "short";
  if (/\bdiscuss\b|\bclassify\b|\bwrite\s+an?\s+essay\b|\bexplain\s+in\s+detail\b|\bdefine\s+.+\band\s+describe\b|\bdescribe\s+.+\band\s+/i.test(s)) return "essay";
  if (q.length > 90 && /(?:^|[\s(])(?:a\)|b\)|c\)|1\.|2\.)/.test(q)) return "essay";
  return "standard";
}

class UpstreamError extends Error {
  status: number;
  kind: "quota" | "auth" | "timeout" | "provider" | "invalid";
  constructor(status: number, msg: string, kind: UpstreamError["kind"] = "provider") {
    super(msg);
    this.status = status;
    this.kind = kind;
  }
}

async function callGeminiDirect(apiKey: string, userPrompt: string, useWeb = false): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        ...(useWeb ? { tools: [{ google_search: {} }] } : {}),
        generationConfig: {
          temperature: 0.55,
          topP: 0.9,
          maxOutputTokens: 16000,
          ...(useWeb ? {} : { responseMimeType: "application/json" }),
        },
      }),
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      throw new UpstreamError(504, `Gemini request timed out after ${Math.round(GEMINI_TIMEOUT_MS / 1000)} seconds`, "timeout");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    const t = await res.text();
    const kind: UpstreamError["kind"] =
      res.status === 429 ? "quota" :
      res.status === 400 || res.status === 401 || res.status === 403 ? "auth" :
      "provider";
    let retrySec = 0;
    try {
      const m = t.match(/"retryDelay"\s*:\s*"(\d+)s"/);
      if (m) retrySec = parseInt(m[1], 10);
    } catch { /* ignore */ }
    const suffix = retrySec ? ` retry_in=${retrySec}s` : "";
    throw new UpstreamError(res.status, `Gemini ${res.status}${suffix}: ${t.slice(0, 700)}`, kind);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
  if (!text) throw new UpstreamError(500, "Empty response from Gemini", "invalid");
  return text;
}

async function callModel(prompt: string, useWeb = false): Promise<string> {
  const gemini = Deno.env.get("GEMINI_API_KEY");
  if (!gemini) {
    throw new UpstreamError(500, "GEMINI_API_KEY is not configured for handwritten notes", "auth");
  }
  const delays = [2500, 7000];
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      return await callGeminiDirect(gemini, prompt, useWeb);
    } catch (e) {
      const status = e instanceof UpstreamError ? e.status : 0;
      const kind = e instanceof UpstreamError ? e.kind : "provider";
      if (kind === "quota" || kind === "auth" || (status && status < 500)) throw e;
      if (attempt < delays.length) await new Promise((r) => setTimeout(r, delays[attempt]));
      else throw e;
    }
  }
  throw new Error("Gemini model call failed");
}

function extractFirstJsonObject(raw: string): string {
  let start = -1;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start >= 0) return raw.slice(start, i + 1);
    }
  }
  throw new Error("Model did not return a complete JSON object");
}

function parseJson(raw: string): any {
  let jsonText = raw.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?/i, "").replace(/```\s*$/g, "").trim();
  }
  try {
    return JSON.parse(jsonText);
  } catch {
    return JSON.parse(extractFirstJsonObject(jsonText));
  }
}

function normalizeNotesContent(content: any): any {
  if (!content || typeof content !== "object") return content;
  const fallbackIcon: Record<string, string> = {
    definition: "📌",
    text: "🧠",
    bullets: "📋",
    steps: "🪜",
    morphology: "🧬",
    comparison: "⚖️",
    table: "📊",
    flowchart: "🔁",
    outcome: "💡",
    revision: "🏆",
  };
  const sections = Array.isArray(content.sections)
    ? content.sections.map((section: any) => ({
        ...section,
        icon: section?.icon || fallbackIcon[section?.type] || "📌",
        payload: section?.payload || {},
      }))
    : [];
  return {
    highYieldTip: content.highYieldTip ?? "",
    pyqYears: Array.isArray(content.pyqYears) ? content.pyqYears : [],
    sections,
    diagramUrl: content.diagramUrl,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const body = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      subtopicKey, year, subject, subtopicName, questions,
      batchIndex: idx, batchSize: size, regenerate, saveContent,
      content: incomingContent, singleMode, proposeOnly, instruction,
    } = parsed.data;

    // Direct save content (e.g. after merging client batches)
    if (saveContent && incomingContent) {
      await admin.from("handwritten_notes").upsert({
        subtopic_key: subtopicKey,
        year, subject, subtopic_name: subtopicName,
        content: incomingContent,
        updated_at: new Date().toISOString(),
      });
      return new Response(JSON.stringify({ saved: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalBatches = singleMode ? 1 : Math.max(1, Math.ceil(questions.length / size));

    // Check cache if not regenerating
    if (idx === 0 && !regenerate && !proposeOnly) {
      const { data: cached } = await admin
        .from("handwritten_notes")
        .select("content")
        .eq("subtopic_key", subtopicKey)
        .maybeSingle();
      if (cached?.content) {
        return new Response(JSON.stringify({
          cached: true,
          content: cached.content,
          batchIndex: 0,
          totalBatches: 1,
          hasMore: false,
          estSecondsPerBatch: EST_SECONDS_PER_BATCH,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    if (idx >= totalBatches && !singleMode) {
      return new Response(JSON.stringify({ error: `batchIndex ${idx} out of range (total ${totalBatches})` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const batch = singleMode ? questions : questions.slice(idx * size, idx * size + size);
    const tagged = batch.map((q) => ({ q, kind: classifyQuestion(q) }));
    const essayList = tagged.map((t, i) => {
      const kind = singleMode
        ? (t.kind === "short" ? "SHORT NOTE" : "ESSAY")
        : (t.kind === "short" ? "SHORT NOTE" : t.kind === "essay" ? "ESSAY" : "STANDARD");
      return `${i + 1}. [${kind}] ${t.q}`;
    }).join("\n");

    const refText = await buildTextbookContext(subject, subtopicName, batch, 22000, admin);
    const bookKeys = pickBookKeys(subject, subtopicName, batch);
    console.log(`[notes] subject=${subject} subtopic="${subtopicName}" books=[${bookKeys.join(",")}] batch=${idx + 1}/${totalBatches} questions=${batch.length} refChars=${refText.length} singleMode=${!!singleMode}`);

    const singleModeBlock = singleMode
      ? `\nSINGLE-QUESTION MODE — this is ONE past-year question the student triple-tapped to study in depth.
- If the question is an ESSAY: produce comprehensive, deeply structured sections filling >= 2 handwritten pages of content.
- If the question is a SHORT NOTE: match the textbook depth exactly (5–8 substantive bullets minimum).
- ALWAYS end with a section of type "revision" titled "Must-Write Points" with icon "🏆" listing 3–4 short crisp bullet-point sentences the student must write on paper to score.`
      : "";

    const userPrompt = `SUBJECT: ${subject}
YEAR: ${year}
SUBTOPIC: ${subtopicName}
${refText ? `\nTEXTBOOK REFERENCE (OCR extract; treat as PRIMARY source of truth):\n"""\n${refText}\n"""\n` : ""}
${instruction ? `\nUSER EDIT INSTRUCTION:\n${instruction}\n` : ""}
${singleModeBlock}${totalBatches > 1 ? `\nBATCH ${idx + 1} of ${totalBatches} — produce sections covering ONLY these questions (each tagged with depth):` : "\nPREVIOUS YEAR QUESTIONS (each tagged with required depth):"}
${essayList}

Follow the DEPTH rules strictly. Essays get multi-section deep coverage; short notes stay tight (4–6 bullets). Ensure every listed question is answered.`;

    const raw = await callModel(userPrompt);
    const batchContent = normalizeNotesContent(parseJson(raw));
    if (!batchContent || !Array.isArray(batchContent.sections)) {
      throw new Error("Model returned invalid structure");
    }

    // Attach high-yield diagram from question_diagrams if available
    try {
      const { data: diagrams } = await admin
        .from("question_diagrams")
        .select("question_text, public_url")
        .limit(200);
      if (diagrams && diagrams.length > 0) {
        const queryText = `${subtopicName} ${batch.join(" ")}`.toLowerCase();
        const matched = diagrams.find((d: any) =>
          d.public_url && d.question_text && queryText.includes(d.question_text.toLowerCase())
        );
        if (matched) {
          batchContent.diagramUrl = matched.public_url;
          batchContent.sections.unshift({
            type: "definition",
            title: "High-Yield Visual Exam Diagram",
            icon: "🎨",
            payload: {
              text: `![High-Yield Exam Diagram](${matched.public_url})\n\n💡 High-Yield Continuous Visual Mnemonic (Standard Textbook Grounded)`
            }
          });
        }
      }
    } catch (e) {
      console.warn("[notes] diagram attachment warning:", e);
    }

    // Persist single-question notes so every future tap on the same question is an instant cache hit
    if (singleMode && totalBatches === 1 && !proposeOnly) {
      try {
        await admin.from("handwritten_notes").upsert({
          subtopic_key: subtopicKey,
          year, subject, subtopic_name: subtopicName,
          content: batchContent,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.error("[notes] single-mode cache save failed:", e);
      }
    }

    const hasMore = idx + 1 < totalBatches;
    return new Response(JSON.stringify({
      cached: false,
      content: batchContent,
      batchIndex: idx,
      totalBatches,
      hasMore,
      estSecondsPerBatch: EST_SECONDS_PER_BATCH,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    const msg = (err as Error).message ?? "Unknown error";
    console.error("generate-handwritten-notes error:", err);
    const upstream = err instanceof UpstreamError ? err : null;
    const isQuota = upstream?.kind === "quota" || /429/.test(msg) || /quota/i.test(msg) || /rate/i.test(msg);
    const isAuth = upstream?.kind === "auth";
    const isTimeout = upstream?.kind === "timeout" || /timed out/i.test(msg);
    return new Response(
      JSON.stringify({
        error: isQuota
          ? "Gemini free-tier quota reached for today. We're caching every answer so returning users don't hit this."
          : isAuth
            ? "Gemini API key/model access issue. Please verify GEMINI_API_KEY and access to gemini-3.1-flash-lite."
            : isTimeout
              ? "Gemini took too long to generate this section. Please try again with fewer questions or retry later."
              : msg,
      }),
      { status: isQuota ? 429 : isAuth ? 400 : isTimeout ? 504 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
