import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { buildTextbookContext, buildPharmContext, pickBookKey, BOOK_LABELS } from "./textbook.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Handwritten Notes generator.
 *
 * Current root cause from production logs: notes can create several sequential
 * Gemini calls for one topic. With a free-tier Google AI Studio key, that can
 * hit `generate_content_free_tier_requests` and return 429. This function now
 * uses the user's direct GEMINI_API_KEY only (no Lovable AI Gateway) and targets
 * Gemini 3.1 Flash-Lite for lower latency/cost.
 */
const BodySchema = z.object({
  subtopicKey: z.string().min(1).max(300),
  year: z.string().min(1).max(40),
  subject: z.string().min(1).max(120),
  subtopicName: z.string().min(1).max(200),
  questions: z.array(z.string().max(1000)).min(1).max(400),
  batchIndex: z.number().int().min(0).max(200).optional(),
  batchSize: z.number().int().min(1).max(20).optional(),
  regenerate: z.boolean().optional(),
  saveContent: z.boolean().optional(),
  content: z.any().optional(),
  editInstruction: z.string().trim().min(1).max(2500).optional(),
  singleMode: z.boolean().optional(),
  // Chat-modification workflow: propose a change (with a summary) instead of
  // applying it straight away. The client shows Yes / No before committing.
  proposeOnly: z.boolean().optional(),
  // Second pass after the user rejects the textbook-based proposal.
  useWeb: z.boolean().optional(),
});

const GEMINI_MODEL = "gemini-3.1-flash-lite";
const DEFAULT_BATCH_SIZE = 10;
const EST_SECONDS_PER_BATCH = 25;
const GEMINI_TIMEOUT_MS = 55_000;

const SYSTEM_PROMPT = `You are an expert MBBS professor generating exam-ready HANDWRITTEN-STYLE study notes.
Given a SUBTOPIC and its previous-year essay + short-note questions, synthesise ONE unified study page.

Output MUST be VALID JSON only (no markdown fence, no prose) matching this exact schema:

{
  "highYieldTip": string,
  "pyqYears": string[],
  "sections": [
    {
      "type": "definition" | "bullets" | "steps" | "morphology" | "comparison" | "table" | "flowchart" | "outcome" | "text" | "revision",
      "title": string,
      "icon": string,
      "pyqYears": string[]?,
      "payload": object
    }
  ]
}

Payload shapes by type:
- definition:  { "text": string }
- text:        { "paragraph": string }
- bullets:     { "items": [ { "label": string, "description": string } ] }
- steps:       { "items": [ { "title": string, "description": string, "keyTrigger"?: string } ] }
- morphology:  { "subtitle"?: string, "items": [ { "title": string, "tag"?: "CLASSIC" | "PATHOGNOMONIC" | "COMMON", "details": string[] } ] }
- comparison:  { "left": string, "right": string, "rows": [ { "label": string, "left": string, "right": string } ] }
- table:       { "columns": string[], "rows": string[][] }
- flowchart:   { "steps": [ { "label": string, "detail": string } ] }
- outcome:     { "text": string }
- revision:    { "items": string[] }  // 3–4 short bullet points the student MUST write on paper

Strict rules:
- Every section MUST include a suitable emoji icon. Use these fallbacks if unsure: 📌 definition, 🧠 concept, 📋 bullets, 🔁 cycle/flowchart, 🧬 morphology/pathology, ⚖️ comparison, 📊 table, 💡 high yield.
- DO NOT include page numbers or textbook citations.
- Cover ALL the essay + short-note questions inside the sections; don't leave any question un-addressed.
- Prefer comparison and table sections wherever two entities are contrasted or classified.
- Add mnemonics and high-yield exam points where useful.
- If the question asks for a cycle, pathway, steps, mechanism, life cycle, demographic cycle, disease cycle, or flow of events, include a flowchart section.
- NATIONAL HEALTH PROGRAMMES — whenever a programme is named or implied (NTEP/RNTCP, DOTS, NVBDCP, NLEP, NACP, RMNCH+A, ICDS, IMNCI/F-IMNCI, Pulse Polio, UIP, Anaemia Mukt Bharat, Mission Indradhanush, NPCDCS, RBSK, RKSK, NMHP, NPCB, etc.) create a dedicated bullets section that FULLY explains it with these labelled items (skip only if truly not applicable): Objective / Goals; Year of launch & implementing agency; Target population; Strategy / Pillars (list each pillar in one line); Diagnostic tools / Case definitions; Treatment regimen with drug doses and duration (e.g. HRZE 2 months + HRE 4 months for TB Cat-I); Monitoring & Reporting (e.g. Ni-kshay portal for NTEP); Newer initiatives (e.g. Ni-kshay Poshan Yojana, active case finding, private-sector engagement, TB-Mukt Bharat 2025). For DOTS specifically ALWAYS include: full form (Directly Observed Treatment, Short-course), 5 components (political commitment, sputum microscopy/CBNAAT, standardised SCC under direct observation, uninterrupted drug supply, recording & reporting), category-wise regimens, DOT provider role, thrice-weekly vs daily regimen shift.
- IMNCI CLASSIFICATION — whenever IMNCI, "assess and classify", ARI/pneumonia, diarrhoea, fever, ear problem, malnutrition, or "sick young infant" appears, produce a table section titled with the condition (e.g. "IMNCI — Cough or Difficult Breathing"). Use columns EXACTLY: ["Severity", "Signs", "Classify As", "Treatment"]. The FIRST cell of every row MUST be one of the words PINK, YELLOW or GREEN (uppercase, single word) — the app color-codes rows from this cell. Include ALL THREE rows in this order: PINK (severe — refer urgently, pre-referral treatment in bold-like wording), YELLOW (moderate — treat at home/OPD with a specific antibiotic/ORS/antimalarial + follow-up date), GREEN (mild — home care advice, when to return immediately). Fill signs and treatment fully as per IMNCI chartbook (general danger signs, chest indrawing, fast breathing cutoffs by age, dehydration signs, etc.).
- For Community Medicine "Epidemiology of Communicable Diseases" topics, for EVERY named disease (typhoid, cholera, TB, malaria, dengue, measles, polio, hepatitis, HIV, leprosy, etc.) create a dedicated bullets section titled with the disease name and include ALL of these labelled items IN ORDER (skip an item ONLY if truly not applicable):
  1. Agent Factors — agent (organism), source of infection, mode of transmission (short), period of communicability
  2. Host Factors — age most affected, sex most affected, immunity
  3. Environmental Factors
  4. Mode of Transmission (detailed)
  5. Incubation Period
  6. Clinical Features (and stages, if the disease has classical stages)
  7. Complications
  8. Treatment
  9. Prevention & Control (personal, community, immunization/vaccination schedule)
  10. National Health Programme (if any — e.g. RNTCP/NTEP, NVBDCP, Pulse Polio, NLEP, NACP, Anaemia Mukt Bharat, etc.)
- Keep language crisp, exam-ready. No markdown asterisks.
- If a "TEXTBOOK REFERENCE" block is provided, treat it as the PRIMARY source of truth. Prefer facts, definitions, classifications, schedules, doses, national-programme names, section numbers and numbers from it verbatim. Reconstruct obviously OCR-garbled words silently. Never say the reference is incomplete — if a listed question is not covered by the reference, fall back to standard MBBS knowledge and answer it fully.
- DEFINITIONS: keep canonical wording. Do not paraphrase textbook definitions. You may modify surrounding explanation, mnemonics and structure.
- DEPTH by question type (each question is tagged [ESSAY], [SHORT NOTE] or [STANDARD]) — depth is NON-NEGOTIABLE, an essay MUST be pass-worthy for a 10–15 mark question:
  • [ESSAY] → 10–14 sections minimum. Cover: (1) Definition (canonical, from textbook if given), (2) Classification/Types (as a table or comparison), (3) Etiology / Epidemiology (agent, host, environment triad where relevant), (4) Pathogenesis / Mechanism (flowchart), (5) Clinical Features / Stages (bullets or steps, list every stage), (6) Investigations / Diagnosis (bullets — specific tests, cut-offs, gold standard), (7) Differential Diagnosis (comparison table where relevant), (8) Management / Treatment split into medical + surgical/definitive (drug names, doses, duration, category-wise regimens), (9) Complications (early and late), (10) Prognosis / Follow-up, (11) Prevention / Programme (full expansion as per the NATIONAL HEALTH PROGRAMMES rule above), (12) Mnemonic + high-yield recall points. Each bullet section carries 8–12 bullets, and every bullet is a full exam sentence with a concrete fact (a number, drug, dose, duration, agency, year, staging criterion). NEVER compress: the total content MUST be enough for the student to write a MINIMUM 8-page (long-essay, 15–20 mark) handwritten answer. If you are unsure whether it is long enough, add another section rather than shortening.
  • [SHORT NOTE] → 3–4 sections per question (definition + 8–10 substantial bullets + a small table/flowchart + high-yield points). Must include the disease/programme's key numbers (incubation period, drug doses, launch year). Enough content for a 2–3 page written answer.
  • [STANDARD] → 1 section, 8–10 focused bullets with numbers/drugs where relevant.
- Response MUST be a SINGLE JSON object only, starting with { and ending with }. Do NOT append any text, code fence, or a second JSON object after the closing brace.`;

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
        // Google Search grounding cannot be combined with a forced JSON mime
        // type, so in web mode we parse the JSON out of the raw text instead.
        ...(useWeb ? { tools: [{ google_search: {} }] } : {}),
        generationConfig: {
          temperature: 0.55,
          topP: 0.9,
          maxOutputTokens: 32000,
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
    // Extract Google's retryDelay hint (e.g. "48s") for a friendlier ETA.
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
      // 429 means the Google project/key is quota-limited. Retrying immediately
      // burns more attempts and returns the same answer, so surface it clearly.
      if (kind === "quota" || kind === "auth" || (status && status < 500)) throw e;
      if (attempt < delays.length) await new Promise((r) => setTimeout(r, delays[attempt]));
      else throw e;
    }
  }
  throw new Error("Gemini model call failed");
}

function extractFirstJsonObject(raw: string): string {
  // Walk the string tracking string/escape state and brace depth so we return
  // exactly the first complete {...} object, ignoring anything Gemini may have
  // appended after the closing brace (extra prose, a second JSON block, ``` etc.)
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

function sectionPayloadFromTopLevel(section: any): any {
  const type = section?.type;
  const existing = section?.payload && typeof section.payload === "object" ? section.payload : {};
  if (Object.keys(existing).length > 0) return existing;
  switch (type) {
    case "definition": return { text: section?.text ?? "" };
    case "text": return { paragraph: section?.paragraph ?? section?.text ?? "" };
    case "bullets": return { items: Array.isArray(section?.items) ? section.items : [] };
    case "steps": return { items: Array.isArray(section?.items) ? section.items : [] };
    case "morphology": return { subtitle: section?.subtitle, items: Array.isArray(section?.items) ? section.items : [] };
    case "comparison": return { left: section?.left ?? "", right: section?.right ?? "", rows: Array.isArray(section?.rows) ? section.rows : [] };
    case "table": return { columns: Array.isArray(section?.columns) ? section.columns : [], rows: Array.isArray(section?.rows) ? section.rows : [] };
    case "flowchart": return { steps: Array.isArray(section?.steps) ? section.steps : [] };
    case "outcome": return { text: section?.text ?? "" };
    case "revision": return { items: Array.isArray(section?.items) ? section.items : [] };
    default: return existing;
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
        payload: sectionPayloadFromTopLevel(section),
      }))
    : [];
  return {
    highYieldTip: content.highYieldTip ?? "",
    pyqYears: Array.isArray(content.pyqYears) ? content.pyqYears : [],
    sections,
  };
}

// ---------------------------------------------------------------------------
// Physiology always gets a flowchart — verified, not merely asked for
// ---------------------------------------------------------------------------
//
// Physiology is the mechanism subject: reflex arcs, feedback loops, conduction
// pathways, cascades. A student writing a Physiology answer draws the sequence,
// so a note without one is missing the part they came for.
//
// The system prompt already says "if the question asks for a cycle, pathway,
// steps, mechanism … include a flowchart". That is a hope, not a guarantee: it
// is one line among forty, it is conditional on the model's own reading of the
// question, and 3 of the 11 Physiology notes in the cache came back without
// one. A prompt cannot be checked; output can.
//
// So there are two halves, and the second is the one that makes it reliable:
//
//   1. PHYSIOLOGY_FLOWCHART_RULE — a subject-scoped block in the user prompt,
//      so the ordinary path produces the flowchart on the first call and costs
//      nothing extra.
//   2. ensurePhysiologyFlowchart() — run at every point that PERSISTS a note.
//      If the content has no usable flowchart it makes ONE targeted call that
//      asks for that section and nothing else, and splices the result in.
//
// **The repair is allowed to say no.** An empty or invented flowchart is worse
// than none — a fabricated sequence is a wrong answer a student would copy onto
// paper — so the repair returns `applicable: false` with a reason for a question
// that genuinely has no sequence in it (a definition, a list of normal values,
// an enumeration), and the note is persisted unchanged. Coverage is the goal;
// truth outranks it.
//
// It is scoped by `pickBookKey(subject) === "physiology"` rather than a fresh
// string test, so it can never drift from the matcher that chooses the textbook.

/**
 * Does this content already carry a flowchart a student could copy?
 *
 * Three labelled steps is the bar. Two boxes and an arrow is not a mechanism,
 * and a `flowchart` section with an empty `steps` array is exactly what a model
 * emits when it is satisfying a rule rather than answering — counting that as a
 * pass would make the guarantee self-defeating.
 */
function hasUsableFlowchart(content: any): boolean {
  const sections = Array.isArray(content?.sections) ? content.sections : [];
  return sections.some((section: any) => {
    if (section?.type !== "flowchart") return false;
    const steps = Array.isArray(section?.payload?.steps) ? section.payload.steps : [];
    const labelled = steps.filter((step: any) => {
      const label = typeof step?.label === "string" ? step.label : step?.title;
      return typeof label === "string" && label.trim().length > 0;
    });
    return labelled.length >= 3;
  });
}

/** Keep "Must-Write Points" last — it is the section the student writes from. */
function insertFlowchart(content: any, section: any): any {
  const sections = Array.isArray(content?.sections) ? [...content.sections] : [];
  const revisionAt = sections.findIndex((s: any) => s?.type === "revision");
  if (revisionAt >= 0) sections.splice(revisionAt, 0, section);
  else sections.push(section);
  return { ...content, sections };
}

/**
 * Ask for one flowchart section, or for a refusal.
 *
 * Returns the section, or null when the model says a flowchart would be
 * meaningless here (or when anything at all goes wrong — a note that is missing
 * a flowchart is a worse note, but a note that failed to save is no note).
 */
async function buildFlowchartSection(
  subject: string,
  subtopicName: string,
  questionList: string,
  refText: string,
): Promise<any | null> {
  const prompt = `SUBJECT: ${subject}
TOPIC: ${subtopicName}
${refText ? `\nTEXTBOOK REFERENCE (source of truth — OCR extract, silently repair garbled words):\n"""\n${refText.slice(0, 12000)}\n"""\n` : ""}
QUESTION(S) THIS NOTE ANSWERS:
${questionList}

The student's notes for this question have no flowchart. Physiology answers are
graded on the mechanism, so decide whether one belongs here, and build it if it
does.

Return ONE JSON object ONLY, no prose and no code fence:
{
  "applicable": boolean,
  "reason": string,
  "section": {
    "type": "flowchart",
    "title": string,
    "icon": "🔁",
    "payload": { "steps": [ { "label": string, "detail": string } ] }
  }
}

Rules:
- Set "applicable": false and OMIT "section" ONLY if the question contains no
  sequence, mechanism, pathway, reflex arc, feedback loop, cascade, cycle or
  chain of events at all — for example a bare definition, a list of normal
  values, or a pure enumeration. Say why in "reason". Do NOT invent a sequence
  to satisfy this request: a fabricated flowchart is a wrong answer the student
  will copy onto paper.
- If it is applicable, give 4–8 steps in physiological order. "label" is the
  stage in a few words; "detail" is one exam sentence carrying the concrete
  fact — the ion, the receptor, the nerve, the hormone, the pressure, the
  latency, the numeric value.
- Title it for what it traces, e.g. "Mechanism — Impulse Conduction Through the
  Heart" or "Reflex Arc — Baroreceptor Response to a Fall in BP".
- Build it from the TEXTBOOK REFERENCE where it covers the mechanism; otherwise
  from standard MBBS Physiology. Never mention the textbook, OCR, pages or
  editions.`;
  try {
    const parsed = parseJson(await callModel(prompt, false));
    if (parsed?.applicable === false) {
      console.log(`[notes] flowchart declined for "${subtopicName}": ${parsed?.reason ?? "no reason given"}`);
      return null;
    }
    const section = {
      type: "flowchart",
      title: typeof parsed?.section?.title === "string" && parsed.section.title.trim()
        ? parsed.section.title
        : "Mechanism — Flowchart",
      icon: parsed?.section?.icon || "🔁",
      payload: sectionPayloadFromTopLevel({ ...parsed?.section, type: "flowchart" }),
    };
    // The same bar the detector uses. A repair that comes back thin is a
    // refusal the model did not label as one.
    if (!hasUsableFlowchart({ sections: [section] })) {
      console.log(`[notes] flowchart repair returned too few steps for "${subtopicName}" — left as is`);
      return null;
    }
    return section;
  } catch (e) {
    console.error("[notes] flowchart repair failed:", e);
    return null;
  }
}

/**
 * The guarantee, applied wherever a note is written to `handwritten_notes`.
 *
 * Idempotent and cheap: a note that already has a flowchart costs nothing, and
 * a subject that is not Physiology is returned untouched.
 */
async function ensurePhysiologyFlowchart(
  content: any,
  subject: string,
  subtopicName: string,
  questions: string[],
  // A thunk, not a string: the save path has no textbook context in hand, and
  // fetching one for the 90%+ of notes that already have a flowchart would pay
  // for a Sembulingam lookup on every save to answer a question already settled.
  getRefText: () => Promise<string> = async () => "",
): Promise<any> {
  if (pickBookKey(subject) !== "physiology") return content;
  if (!content || !Array.isArray(content.sections) || content.sections.length === 0) return content;
  if (hasUsableFlowchart(content)) return content;
  const questionList = questions.map((q, i) => `${i + 1}. ${q}`).join("\n").slice(0, 6000);
  let refText = "";
  try {
    refText = await getRefText();
  } catch (e) {
    console.error("[notes] flowchart repair could not load the textbook context:", e);
  }
  const section = await buildFlowchartSection(subject, subtopicName, questionList, refText);
  if (!section) return content;
  console.log(`[notes] flowchart added to "${subtopicName}" (${section.payload.steps.length} steps)`);
  return insertFlowchart(content, section);
}

/**
 * The physiology block for the generation prompt.
 *
 * The cheap half of the guarantee: getting the flowchart on the first call
 * means the repair above never runs and never costs a second call.
 */
const PHYSIOLOGY_FLOWCHART_RULE = `
PHYSIOLOGY — MECHANISM IS THE ANSWER:
- This is Physiology, which is examined on mechanism. Include AT LEAST ONE
  section of type "flowchart" tracing the sequence the question turns on: the
  reflex arc, the feedback loop, the conduction pathway, the cascade, the cycle,
  the stimulus-to-response chain, or the step-by-step mechanism.
- Its payload is { "steps": [ { "label": string, "detail": string } ] } with 4–8
  steps in physiological order. "label" is the stage in a few words; "detail" is
  one exam sentence carrying the concrete fact — ion, receptor, nerve, hormone,
  pressure, latency, numeric value.
- Put the flowchart before the "Must-Write Points" revision section.
- The ONE exception: if the question genuinely contains no sequence — a bare
  definition, a list of normal values, a pure enumeration — omit it rather than
  inventing one. A made-up sequence is a wrong answer the student copies onto
  paper.
`;

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
      batchIndex, batchSize, regenerate, saveContent, content, editInstruction,
      singleMode, proposeOnly, useWeb,
    } = parsed.data;

    // ---------- Mode 3: AI edit existing notes ----------
    if (editInstruction) {
      if (!content || typeof content !== "object") {
        return new Response(JSON.stringify({ error: "Existing notes content is required before AI editing." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const refText = useWeb ? "" : await buildTextbookContext(subject, subtopicName, questions, 12000);

      // ----- 3a: propose (chat workflow) — never persists, waits for Yes -----
      if (proposeOnly) {
        const proposePrompt = `SUBJECT: ${subject}
YEAR: ${year}
SUBTOPIC: ${subtopicName}
${refText ? `\nTEXTBOOK REFERENCE (source of truth — prefer facts from here):\n"""\n${refText}\n"""\n` : ""}
CURRENT NOTES JSON:
${JSON.stringify(content)}

STUDENT REQUEST:
${editInstruction}

${useWeb
  ? "The reference textbook did not satisfy the student. Use Google Search grounding to find accurate, current medical//national-programme information, then apply the change."
  : "FIRST search the TEXTBOOK REFERENCE above for the requested topic. If it is covered there, build the change strictly from it. If it is not covered, fall back to standard MBBS knowledge and say so."}

Return ONE JSON object ONLY with this schema:
{
  "found": boolean,               // true if the requested content was located in the textbook reference (or, in web mode, on the web)
  "source": "textbook" | "knowledge" | "web",
  "summary": string[],            // 3-6 short bullet points describing EXACTLY what you will add/change, with the key facts
  "content": { ...full updated notes JSON, same schema as CURRENT NOTES... }
}
Modify ONLY the relevant part(s) of the notes; preserve everything else verbatim. Add emoji icons where missing. JSON only, no prose, no code fence.`;
        const rawProposal = await callModel(proposePrompt, !!useWeb);
        const proposal = parseJson(rawProposal);
        const nextContent = normalizeNotesContent(proposal?.content);
        if (!nextContent || !Array.isArray(nextContent.sections) || nextContent.sections.length === 0) {
          throw new UpstreamError(500, "Gemini returned an invalid proposal", "invalid");
        }
        return new Response(JSON.stringify({
          proposed: true,
          found: proposal?.found !== false,
          source: proposal?.source ?? (useWeb ? "web" : refText ? "textbook" : "knowledge"),
          summary: Array.isArray(proposal?.summary) ? proposal.summary.slice(0, 8) : [],
          content: nextContent,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const editPrompt = `SUBJECT: ${subject}
YEAR: ${year}
SUBTOPIC: ${subtopicName}
${refText ? `\nTEXTBOOK REFERENCE (source of truth — prefer facts from here):\n"""\n${refText}\n"""\n` : ""}
CURRENT NOTES JSON:
${JSON.stringify(content)}

USER EDIT REQUEST:
${editInstruction}

Modify ONLY the relevant part(s) requested by the user. Preserve everything else. If icons are missing or blank, add suitable emoji icons. Return the complete updated notes JSON using the same schema. JSON only.`;
      const raw = await callModel(editPrompt, !!useWeb);
      let edited = normalizeNotesContent(parseJson(raw));
      if (!edited || !Array.isArray(edited.sections)) {
        throw new UpstreamError(500, "Gemini returned an invalid edited notes structure", "invalid");
      }
      // An edit can drop the flowchart the note was guaranteed. This is a write
      // to the cache, so the guarantee is re-applied here as well.
      edited = await ensurePhysiologyFlowchart(
        edited, subject, subtopicName, questions, async () => refText,
      );
      await admin.from("handwritten_notes").upsert({
        subtopic_key: subtopicKey,
        year, subject, subtopic_name: subtopicName,
        content: edited,
        updated_at: new Date().toISOString(),
      });
      return new Response(JSON.stringify({ edited: true, content: edited }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---------- Mode 2: SAVE merged ----------
    if (saveContent === true) {
      if (!content || typeof content !== "object") {
        return new Response(JSON.stringify({ error: "content required to save" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // The merged multi-batch note is written HERE, not by the generation
      // path — the client merges the batches and posts the result back. So this
      // is where a topic-level Physiology note gets its flowchart; leaving the
      // guarantee out of this branch is exactly how
      // `physiology::paper-1/general-physiology` reached the cache without one.
      const merged = await ensurePhysiologyFlowchart(
        normalizeNotesContent(content), subject, subtopicName, questions,
        () => buildTextbookContext(subject, subtopicName, questions, 12000),
      );
      await admin.from("handwritten_notes").upsert({
        subtopic_key: subtopicKey,
        year, subject, subtopic_name: subtopicName,
        content: merged,
        updated_at: new Date().toISOString(),
      });
      return new Response(JSON.stringify({ saved: true, content: merged }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---------- Mode 1: batch generation ----------
    const size = batchSize ?? DEFAULT_BATCH_SIZE;
    const totalBatches = Math.max(1, Math.ceil(questions.length / size));
    const idx = batchIndex ?? 0;

    // Cache hit on first batch. In singleMode we ALSO honour cache — this is the
    // whole point of persisting single-question notes: the first tap pays the
    // Gemini cost, every subsequent tap on the same question is instant and
    // never hits the free-tier quota. Only skip the cache read when the caller
    // explicitly asked to regenerate.
    if (idx === 0 && !regenerate) {
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

    if (idx >= totalBatches) {
      return new Response(JSON.stringify({ error: `batchIndex ${idx} out of range (total ${totalBatches})` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const batch = questions.slice(idx * size, idx * size + size);
    const tagged = batch.map((q) => ({ q, kind: classifyQuestion(q) }));
    // In singleMode, force ESSAY depth unless the question is explicitly a "short note".
    const essayList = tagged.map((t, i) => {
      const kind = singleMode
        ? (t.kind === "short" ? "SHORT NOTE" : "ESSAY")
        : (t.kind === "short" ? "SHORT NOTE" : t.kind === "essay" ? "ESSAY" : "STANDARD");
      return `${i + 1}. [${kind}] ${t.q}`;
    }).join("\n");
    const bookKey = pickBookKey(subject);
    let refText = "";
    let pharmBlock = "";
    if (bookKey === "pharmacology") {
      const { classification, general } = await buildPharmContext(subtopicName, batch);
      const parts: string[] = [];
      if (classification) {
        parts.push(`KD TRIPATHI — "Pharmacological Classification of Drugs with Doses and Preparations" (THE ONLY allowed source for drug CLASSIFICATION, drug groups, doses and preparations — OCR extract, silently repair broken words):\n"""\n${classification}\n"""`);
      }
      if (general) {
        parts.push(`TARA V SHANBHAG — "Pharmacology for Medical Graduates" 5th ed. (source for everything EXCEPT classification: definitions, mechanism of action, pharmacokinetics, uses, adverse effects, contraindications, points and answers):\n"""\n${general}\n"""`);
      }
      refText = parts.join("\n\n");
      pharmBlock = `
PHARMACOLOGY SOURCE RULES (NON-NEGOTIABLE):
- CLASSIFICATION of drugs comes STRICTLY from the KD Tripathi block. Never build a classification from Tara Shanbhag or from memory when the KD Tripathi block covers the group. Keep KD Tripathi's group headings, subgroup order, drug names and doses verbatim (repair OCR typos only).
- Render EVERY classification as its own section of type "table" titled "Classification — <drug group> (KD Tripathi)" with columns EXACTLY ["Class / Group", "Subgroup", "Drugs (with dose)"]. One row per subgroup; put drug names comma-separated with doses where KD Tripathi gives them. This keeps classifications inside a clean boxed table on the page.
- If a group has no subgroups, repeat the class name in the "Subgroup" cell.
- Use Tara V Shanbhag for all NON-classification content: definitions, mechanism of action (flowchart section), pharmacokinetics, therapeutic uses, adverse effects, contraindications, drug interactions, preferred drug of choice, and short-note bullet points.
- Add a "bullets" section titled "Mechanism & Uses" and an "outcome"/high-yield line with the exam-favourite drug of choice wherever relevant.
- Never mix the two sources inside one section, and never cite page numbers or edition text inside the notes.
`;
    } else {
      refText = await buildTextbookContext(subject, subtopicName, batch, 18000);
    }
    console.log(`[notes] subject=${subject} subtopic="${subtopicName}" batch=${idx + 1}/${totalBatches} questions=${batch.length} refChars=${refText.length} singleMode=${!!singleMode}`);
    const singleModeBlock = singleMode
      ? `\nSINGLE-QUESTION MODE — this is ONE past-year question the student triple-tapped to study in depth.
- If the question is an ESSAY: produce 10–14 sections carrying enough content for a MINIMUM 8-page handwritten answer. Follow the [ESSAY] depth rules from the system prompt without ANY compression — long bullets, full sentences, every number/dose/criterion spelled out.
- If the question is a SHORT NOTE: match the textbook depth and go beyond it (8–10 substantive bullets minimum, plus a table or flowchart). Never stop early.
- If the textbook reference is missing this topic, fall back to standard MBBS knowledge and answer fully — do not say the reference is incomplete.
- ALWAYS end with a section of type "revision" titled "Must-Write Points" with icon "🏆" listing 3–4 short crisp bullet-point sentences the student must write on paper to score. These points should carry the highest-yield keywords, numbers, drug names, launch years, or classifications from the answer.
`
      : "";
    const userPrompt = `SUBJECT: ${subject}
YEAR: ${year}
SUBTOPIC: ${subtopicName}
${refText
  ? bookKey === "pharmacology"
    ? `\nTEXTBOOK REFERENCES (treat as PRIMARY sources of truth):\n${refText}\n${pharmBlock}`
    : `\nTEXTBOOK REFERENCE (${BOOK_LABELS[bookKey ?? ""] ?? "prescribed MBBS textbook"} — OCR extract, may contain typos, broken spacing or gibberish characters; treat it as the PRIMARY source of truth, silently repair the garbled words into correct medical terminology, and never mention OCR/pages/edition inside the notes):\n"""\n${refText}\n"""\n`
  : ""}
${bookKey === "physiology" ? PHYSIOLOGY_FLOWCHART_RULE : ""}${singleModeBlock}${totalBatches > 1 ? `\nBATCH ${idx + 1} of ${totalBatches} — produce sections covering ONLY these questions (each tagged with depth):` : "\nPREVIOUS YEAR QUESTIONS (each tagged with required depth):"}
${essayList}

Follow the DEPTH rules from the system prompt strictly. Essays get long multi-section coverage worth a minimum 8-page written answer; short notes get 8–10 solid bullets. Ensure every listed question is answered and never compress to save space.`;

    const raw = await callModel(userPrompt);
    let batchContent = normalizeNotesContent(parseJson(raw));
    if (!batchContent || !Array.isArray(batchContent.sections)) {
      throw new Error("Model returned invalid structure");
    }

    // A whole Physiology note is one batch only in singleMode; a multi-batch
    // topic gets its guarantee at the save that merges the batches, because a
    // per-batch check would demand a flowchart from each ten-question slice.
    if (singleMode || totalBatches === 1) {
      batchContent = await ensurePhysiologyFlowchart(
        batchContent, subject, subtopicName, batch, async () => refText,
      );
    }

    // Persist single-question notes so every future tap on the same question is
    // an instant cache hit and never re-hits the Gemini quota.
    if (singleMode && totalBatches === 1) {
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
    // Pull the retry-after hint (e.g. "retry_in=48s") from the upstream error so
    // the client can show a real ETA instead of a vague "please try again".
    const retryMatch = msg.match(/retry_in=(\d+)s/);
    const retrySeconds = retryMatch ? parseInt(retryMatch[1], 10) : 0;
    const etaText = retrySeconds
      ? retrySeconds >= 3600
        ? `about ${Math.round(retrySeconds / 3600)} hour(s)`
        : retrySeconds >= 60
          ? `about ${Math.round(retrySeconds / 60)} minute(s)`
          : `${retrySeconds} seconds`
      : "";
    return new Response(
      JSON.stringify({
        error: isQuota
          ? `Gemini free-tier quota reached for today. ${etaText ? `Try again in ${etaText}.` : "Try again after the daily quota resets (Pacific midnight)."} We're caching every answer so returning users don't hit this — the first tap on each question is the only one that costs a call.`
          : isAuth
            ? "Gemini API key/model access issue. Please verify GEMINI_API_KEY and access to gemini-3.1-flash-lite."
            : isTimeout
              ? "Gemini took too long to generate this section. Please try again with fewer questions or retry later."
              : msg,
        retryAfterSeconds: retrySeconds || undefined,
      }),
      { status: isQuota ? 429 : isAuth ? 400 : isTimeout ? 504 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
