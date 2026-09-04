import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { buildTextbookContext, pickBookKeys } from "./textbook.ts";

/**
 * Anki-style flashcards for one MBBS chapter.
 *
 * Two halves:
 *  - IMAGE cards (at most half the deck): built from `question_diagrams`.
 *    Each carries the diagram AND a written answer, so revealing one is not
 *    just a picture.
 *  - THEORY cards: written by Gemini from the chapter's real university exam
 *    questions, prioritised by how often they have been asked.
 *
 * Cached per chapter in `flashcards`.
 *
 * ## Grounded in the textbook, never in the model's memory
 *
 * `buildTextbookContext` is the same retrieval `generate-handwritten-notes`
 * uses, over the same private `textbooks` bucket, chosen by the same
 * `pickBookKeys`. A card is a sentence a student will memorise verbatim and
 * then write in an exam; a hallucinated one is worse than no card, because
 * there is nothing on its face to tell the reader which it is. So the chapter's
 * own book is retrieved first and the model is told to write from it.
 *
 * The book is never named to the reader. That rule is the notes function's too
 * — a student is studying, not being handed a bibliography.
 *
 * ## First year gets a different kind of deck
 *
 * Anatomy, Physiology and Biochemistry are examined as *chains and reasons*:
 * "Glycolysis — sequence of reaction, energetics, regulation", "Prolonged
 * starvation leads to ketosis. Why?", "a 4-year-old with night blindness — which
 * vitamin, and its role in Wald's cycle". A deck of "define X" cards is not
 * that paper. So when the chapter's book is a first-year one the model is asked
 * for a deliberate mix — recall, reasoning, applied vignette — and the plates
 * the chapter owns that are *flowcharts* become PATHWAY cards, which answer
 * with the picture and with the ordered steps it draws.
 *
 * Which year a subject belongs to is read off `pickBookKeys`, never off a fresh
 * string test: there is one place in this codebase that decides what a subject
 * is, and a second one drifts.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  year: z.string().min(1).max(40),
  subject: z.string().min(1).max(120),
  subtopicKey: z.string().min(1).max(300),
  subtopicName: z.string().min(1).max(200),
  questions: z.array(z.string().max(1000)).min(1).max(400),
  regenerate: z.boolean().optional(),
  limit: z.number().int().min(6).max(60).optional(),
  /**
   * Build it, return it, keep nothing.
   *
   * For a personal deck: someone asking for their own extra pass at a chapter
   * is not producing a second deck for everybody, and the result belongs on the
   * phone that asked for it. Without this the upsert below would write it into
   * the shared cache under whatever key it was asked for.
   *
   * The client also sends a suffixed `subtopicKey` (`personalDeckKey`), which
   * is belt and braces on purpose: it is what protects the shared row on any
   * deployment that predates this flag, and unknown keys are stripped here
   * rather than rejected, so an old client and a new one both behave.
   */
  noCache: z.boolean().optional(),
});

const GEMINI_MODEL = "gemini-3.1-flash-lite";
const GEMINI_TIMEOUT_MS = 55_000;

/**
 * Deck size.
 *
 * MIN_CARDS is a floor, not a default. A chapter with 15 questions still owes
 * the reader a full sitting: a good essay question is worth several cards, so
 * "fewer questions" does not mean "less to learn". Chapters used to inherit
 * their question count directly, which is why a 15-question chapter produced a
 * 15-card deck and a 7-question one produced almost nothing.
 *
 * MAX_CARDS caps the other end: a 44-question chapter does not need 44 cards in
 * one deck, and the model's output budget is finite.
 */
const MIN_CARDS = 20;
const MAX_CARDS = 50;
/**
 * A university exam question is worth more than one card.
 *
 * "Classify mechanical injuries and describe the medicolegal importance of
 * each" is a dozen facts, and the model is told to split a question into its
 * parts rather than restate it. Deck size used to *be* the question count, so a
 * 44-question chapter capped out at 44 when it had material for a full fifty.
 *
 * Flat rather than weighted on purpose: the client computes the identical
 * number in deckTargetFor(), and every extra term is another way for the two to
 * disagree about a number the chapter list has already promised.
 */
const CARDS_PER_QUESTION = 1.2;

/**
 * Ask for more theory cards than the deck needs.
 *
 * The model routinely returns fewer than it was asked for, and cards are then
 * dropped again for being duplicates or too short. Asking for exactly the
 * target is how a deck asked for 20 arrives with 11. The surplus is discarded.
 */
const THEORY_MARGIN = 8;

/**
 * The books that make a chapter a first-year one.
 *
 * Derived from `pickBookKeys`, which is the single place that maps a subject to
 * a textbook. A separate `subject.includes('anatomy')` here would be a second
 * answer to a question already answered, and the two would part company the
 * first time a subject was renamed.
 */
const FIRST_YEAR_BOOKS = new Set(["anatomy", "physiology", "biochemistry"]);

/**
 * The `diagram_kind` values that describe an ordered process.
 *
 * This is a **column**, written when the plate was made, not a guess from its
 * filename or its question's words. It decides only how a plate the question
 * already owns is *presented* — as a pathway card with its steps, or as an
 * ordinary image card. Which plate a question gets is settled long before this,
 * by identity, and nothing here can change that.
 */
const PATHWAY_KINDS = new Set(["flowchart", "lifecycle", "algorithm"]);

/**
 * How many pathway cards one sitting can carry.
 *
 * A pathway card is the most expensive card in the deck — a plate, four to
 * eight steps, and real reading — so a deck made mostly of them is a deck
 * nobody finishes. Six is roughly one every eight cards at the 50-card ceiling.
 */
const MAX_PATHWAY_CARDS = 6;

/** A chain shorter than this is a sentence; longer than this is a page. */
const MIN_PATHWAY_STEPS = 3;
const MAX_PATHWAY_STEPS = 7;

const SYSTEM_PROMPT = `You write high-yield Anki-style flashcards for MBBS medical students.

A good card obeys the minimum information principle: ONE fact per card, phrased so the answer is short enough to recall in a few seconds.

Output VALID JSON only — no markdown fences, no preamble — matching exactly:

{
  "theoryCards": [
    {
      "front": string,          // The prompt or question
      "back": string,           // Concise 1-2 line answer. Maximum 25 words.
      "hint": string?,          // Optional short hint
      "mode": string?,          // "recall" | "reasoning" | "applied" — what the card asks for
      "tags": string[]          // 1-3 lowercase medical keywords
    }
  ],
  "diagramCards": [             // Explanations for each diagram question provided
    {
      "back": string,           // Concise takeaway explaining what the diagram demonstrates (max 25 words).
      "hint": string?           // Optional short hint
    }
  ]
}

Rules:
- ONE fact per card.
- The back must be crisp, high-yield, and easy to recall (<= 25 words).
- Prioritize high-yield numbers: doses, incubation periods, diagnostic cut-offs, hallmarks.
- Never write binary yes/no questions.
- A single exam question is usually worth SEVERAL cards — split it into its parts rather than writing one card that restates the whole question.
- Return AT LEAST the number of theory cards requested. Never return fewer.
- Return ONLY the JSON object.`;

/**
 * What a first-year deck is asked for on top of the above.
 *
 * Written from the shape of the real papers rather than from a description of
 * them: the examples below are actual university questions, and quoting them is
 * what makes the model produce that register instead of textbook headings with
 * question marks on the end.
 *
 * The three modes are not decoration — they are three different acts of recall,
 * and a deck of only the first is the deck that already existed.
 */
const FIRST_YEAR_SYSTEM_PROMPT = `

FIRST YEAR (Anatomy / Physiology / Biochemistry) — the paper you are writing for.

These papers do not only ask students to define things. Write a deliberate MIX, and set "mode" on every theory card:

1. "recall" — a single high-yield fact. Enzyme, value, structure, nerve supply.
2. "reasoning" — a CLAIM, then "Why?". This is the signature question of these papers. Real examples:
   • "Emulsification is a prerequisite in lipid digestion. Why?"
   • "When the Rapoport-Luebering cycle operates in RBCs there is no net ATP generation. Why?"
   • "Prolonged starvation leads to ketosis. Why?"
   • "Symptoms of beta thalassemia major appear only after 6 months of age. Why?"
   • "Lack of vitamin B12 causes methylmalonic acidemia. Why?"
   The back gives the MECHANISM, not a restatement of the claim.
3. "applied" — a one-line clinical vignette, then the question. Real examples:
   • "A 52-year-old man has total cholesterol 465 mg/dL and LDL 178 mg/dL. He is started on atorvastatin — what is its mechanism of action?"
   • "A 4-year-old presents with night blindness and dry, wrinkled conjunctiva. Which vitamin is deficient, and what is its role in the visual cycle?"
   Keep the vignette to ONE sentence with the numbers that matter. The question must be answerable in a few seconds.

The user prompt states EXACTLY how many cards of each mode to write. Those counts are requirements, not suggestions: meet them before you write a single extra "recall" card.

Anatomy applies just as much: a nerve lesion and the deformity it causes, a fracture and the vessel at risk, a triangle and what crosses it.`;

/**
 * The extra output a pathway plate needs.
 *
 * A pathway card answers with the plate AND the chain it draws, because a JPEG
 * on a phone held at arm's length does not teach "which step is
 * rate-limiting" — and because the steps are what is left on the card when the
 * picture fails to load.
 */
const PATHWAY_SYSTEM_PROMPT = `

PATHWAY DIAGRAM CARDS.

Some of the diagram questions are marked [PATHWAY]. For each of those, the matching entry in "diagramCards" must ALSO carry:

  "steps": [ { "label": string, "detail": string? } ],   // ${MIN_PATHWAY_STEPS}-${MAX_PATHWAY_STEPS} entries, in order
  "caption": string?                                      // ONE line: the rate-limiting step, the block, or the clinical hook

Rules for steps:
- "label" is the transformation itself, short enough to read at a glance: "Glucose → Glucose-6-phosphate", "Citrate → Isocitrate".
- "detail" is the ONE examinable thing about that step: the enzyme, the cofactor, the ATP spent or made, the enzyme whose deficiency blocks it.
- Give the EXAMINABLE SPINE, not every reaction. The irreversible steps, where energy is spent and made, and the step a disease blocks.
- Do not exceed ${MAX_PATHWAY_STEPS} steps. A pathway needing more than that is two cards.`;

class UpstreamError extends Error {
  status: number;
  kind: "quota" | "auth" | "timeout" | "provider" | "invalid";
  constructor(status: number, msg: string, kind: UpstreamError["kind"] = "provider") {
    super(msg);
    this.status = status;
    this.kind = kind;
  }
}

async function callGemini(
  apiKey: string,
  userPrompt: string,
  systemPrompt: string = SYSTEM_PROMPT,
): Promise<string> {
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
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          topP: 0.9,
          maxOutputTokens: 12000,
          responseMimeType: "application/json",
        },
      }),
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      throw new UpstreamError(504, "Gemini timed out building this deck", "timeout");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    const t = await res.text();
    const kind: UpstreamError["kind"] =
      res.status === 429 ? "quota" : res.status < 500 ? "auth" : "provider";
    throw new UpstreamError(res.status, `Gemini ${res.status}: ${t.slice(0, 500)}`, kind);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
  if (!text) throw new UpstreamError(500, "Empty response from Gemini", "invalid");
  return text;
}

function parseJson(raw: string): any {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?/i, "").replace(/```\s*$/g, "").trim();
  }
  return JSON.parse(text);
}

function cleanQuestion(q: string): string {
  return q
    .replace(/^\d+\.\s*/, "")
    .replace(/[*★☆⭐]/g, "")
    .replace(/\(Pg\.?No:?[^)]*\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A card's id, derived from what is written on it.
 *
 * It used to be the card's index in the deck (`{subtopicKey}::0`, `::1`, …).
 * The schedule is keyed on this id and lives on the phone, so regenerating a
 * chapter handed card 0's review history — its ease, its interval, its lapses —
 * to whatever question happened to land in slot 0 next time. Nothing looked
 * wrong; the deck simply started lying about what the reader had learned.
 *
 * Hashing the front means an unchanged question keeps its history and a new one
 * starts new, which is what the reader would expect if they thought about it.
 */
/**
 * The identity of a question, as `question_diagrams.question_id` stores it.
 *
 * `question-` plus the first 50 characters with whitespace dashed — the same
 * string both apps use as their per-question progress key, and the string every
 * row in that table was filed under. It is duplicated from
 * `src/lib/questionDiagrams.ts` because an edge function cannot import the
 * browser tree; `npm run check:pathway-cards` fails if the two ever differ.
 *
 * **The 50 and the dashing are load-bearing.** Change either and this matches
 * nothing, which looks exactly like the chapter having no diagrams.
 */
function diagramQuestionId(question: string): string {
  return `question-${question.trim().slice(0, 50).replace(/\s+/g, "-")}`;
}

/**
 * The strings a question can legitimately be known by.
 *
 * Screens strip the leading `"12. "` before they use a question and the diagram
 * pipeline filed its rows under the bank's raw text, so the same question has
 * two forms and only one of them will be in hand. Asking about both is what
 * reaches the 53 plates that were unreachable from all three apps.
 *
 * Both forms are used in `.in(...)`, which is `.eq` repeated — an equality, not
 * a search.
 */
function questionForms(question: string): string[] {
  const clean = question.trim();
  const stripped = clean.replace(/^\d+\.\s/, "");
  return clean === stripped ? [clean] : [clean, stripped];
}

/**
 * A named field off a model-returned item — by name, never by coercion.
 *
 * `String(item)` on an object writes the literal text `[object Object]` onto a
 * card, and the model returns an object *usually* and a bare string
 * *sometimes*, so some cards would look perfect and others would be gibberish
 * with nothing in between to suggest the reader was the problem. That exact bug
 * shipped in the notes renderer.
 */
function field(item: unknown, ...names: string[]): string {
  if (typeof item === "string") return item.trim();
  if (item && typeof item === "object") {
    for (const name of names) {
      const value = (item as Record<string, unknown>)[name];
      if (typeof value === "string" && value.trim()) return value.trim();
      if (typeof value === "number" && Number.isFinite(value)) return String(value);
    }
  }
  return "";
}

/**
 * The chain the model wrote for a pathway plate, validated into the shape the
 * two apps read.
 *
 * **This must stay field-for-field identical to `normalizePathway` in
 * `src/lib/pathwayCards.ts`**, which is the one reader both apps use;
 * `npm run check:pathway-cards` fails if the names drift. It is written twice
 * only because an edge function cannot import the browser tree.
 *
 * Returns null rather than a short chain: an arrow pointing at nothing looks
 * like a rendering bug, and the card still has its written back.
 */
function readPathway(value: unknown): { steps: { label: string; detail?: string }[]; caption?: string } | null {
  if (!value || typeof value !== "object") return null;
  const raw = (value as Record<string, unknown>).steps;
  if (!Array.isArray(raw)) return null;
  const steps: { label: string; detail?: string }[] = [];
  for (const item of raw) {
    const label = field(item, "label", "title", "step", "name");
    if (!label) continue;
    const detail = field(item, "detail", "description", "note", "enzyme");
    steps.push(detail && detail !== label ? { label, detail } : { label });
    if (steps.length >= MAX_PATHWAY_STEPS) break;
  }
  if (steps.length < MIN_PATHWAY_STEPS) return null;
  const caption = field(value, "caption", "takeaway");
  return caption ? { steps, caption } : { steps };
}

/** PostgREST puts an `.in(...)` list in the URL, so it is asked in mouthfuls. */
function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function cardId(subtopicKey: string, front: string): string {
  let h = 5381;
  for (let i = 0; i < front.length; i++) {
    h = ((h << 5) + h + front.charCodeAt(i)) >>> 0;
  }
  return `${subtopicKey}::${h.toString(36)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { year, subject, subtopicKey, subtopicName, questions, regenerate, limit, noCache } =
      parsed.data;

    /*
     * The floor applies before anything else, so a small chapter is a full deck
     * rather than a short one. The client mirrors this in deckTargetFor(); the
     * two are pinned together by `npm run check:flashcard-size`, because the
     * chapter list promises a number that this function has to deliver.
     */
    const target =
      limit ??
      Math.max(MIN_CARDS, Math.min(MAX_CARDS, Math.round(questions.length * CARDS_PER_QUESTION)));
    const deckKey = `${year}::${subject}::${subtopicKey}`;

    // A personal deck neither reads nor writes the shared cache: reading it
    // would hand back the very deck this is meant to be an alternative to.
    if (!regenerate && !noCache) {
      const { data: cached } = await admin
        .from("flashcards")
        .select("cards, deck_target")
        .eq("deck_key", deckKey)
        .maybeSingle();
      /*
       * Serve the cache unless it was built before this sizing existed and is
       * smaller than what today's algorithm would produce.
       *
       * `deck_target` is the marker, and it has to be a column of its own.
       * `card_count` cannot do the job: it has been written since long before
       * the algorithm, so every legacy row already carries one and would be
       * mistaken for current — which is how a 44-card Toxicology deck would
       * have gone on being served after the target moved to 50.
       *
       * A row that *has* a target is always served. That is what stops this
       * becoming a regeneration loop: a chapter can legitimately fall short —
       * the model returns what it returns — and re-asking on every open would
       * be one Gemini call per open, for ever, for a deck that will never get
       * any bigger.
       */
      const builtByThisVersion = typeof cached?.deck_target === "number";
      if (
        cached?.cards &&
        Array.isArray(cached.cards) &&
        cached.cards.length > 0 &&
        (builtByThisVersion || cached.cards.length >= target)
      ) {
        return new Response(JSON.stringify({ cached: true, deckKey, cards: cached.cards }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    /*
     * Which book this chapter is grounded in, and therefore which year it is.
     *
     * One call, two answers, and no second string test anywhere in this file.
     */
    const bookKeys = pickBookKeys(subject, subtopicName, questions);
    const isFirstYear = bookKeys.some((k) => FIRST_YEAR_BOOKS.has(k));

    // ---- 1. Diagrams for this chapter ----

    /*
     * The identity join, first and separately.
     *
     * `question_diagrams` holds one row per question and files it under the
     * app's own per-question key, so a plate found this way is *provably* this
     * question's. Everything below it is the older subject-wide scan, which
     * matches on substrings and on the chapter slug — and that difference is
     * why only identity matches are allowed to become pathway cards. A pathway
     * card asserts that the chain written under the picture is the chain the
     * picture draws; making that claim about a plate found by a substring is
     * how "TCA cycle" opened with a glycolysis diagram.
     *
     * Nothing here attaches a plate to a question. It reads the attachment that
     * is already in the table. A text rule may never do either job, in either
     * direction — see .agents/rules/97-diagram-rows.md.
     */
    const identityRows: any[] = [];
    try {
      const forms: string[] = [];
      for (const q of questions) {
        for (const form of questionForms(q)) {
          if (form.length >= 3 && !forms.includes(form)) forms.push(form);
        }
      }
      const ids = forms.map(diagramQuestionId);
      const batches = await Promise.all([
        ...chunk(ids, 40).map((slice) =>
          admin
            .from("question_diagrams")
            .select("question_id, question_text, public_url, diagram_kind, subtopic_key")
            .in("question_id", slice)
            .not("public_url", "is", null)
        ),
        ...chunk(forms, 40).map((slice) =>
          admin
            .from("question_diagrams")
            .select("question_id, question_text, public_url, diagram_kind, subtopic_key")
            .in("question_text", slice)
            .not("public_url", "is", null)
        ),
      ]);
      for (const batch of batches) {
        // supabase-js RETURNS errors rather than throwing them, so a failed
        // query here is an empty list and a chapter that silently loses its
        // pictures. Say so in the logs at least.
        if (batch.error) console.warn("[flashcards] identity join failed:", batch.error.message);
        for (const row of batch.data ?? []) identityRows.push(row);
      }
    } catch (e) {
      console.warn("[flashcards] identity join warning:", e);
    }

    const matchedDiagrams: any[] = [];
    const seenUrls = new Set<string>();

    /*
     * In the chapter's own question order, so the deck follows the syllabus
     * rather than the table's insertion order.
     */
    const identityByForm = new Map<string, any[]>();
    for (const row of identityRows) {
      const byId = String(row.question_id ?? "");
      const byText = String(row.question_text ?? "").trim();
      for (const key of [byId, byText]) {
        if (!key) continue;
        const list = identityByForm.get(key) ?? [];
        list.push(row);
        identityByForm.set(key, list);
      }
    }
    for (const q of questions) {
      for (const form of questionForms(q)) {
        for (const key of [diagramQuestionId(form), form]) {
          for (const row of identityByForm.get(key) ?? []) {
            if (!row.public_url || seenUrls.has(row.public_url)) continue;
            seenUrls.add(row.public_url);
            matchedDiagrams.push({ ...row, identity: true, question: q });
          }
        }
      }
    }

    const { data: subjectDiagrams } = await admin
      .from("question_diagrams")
      .select("question_text, public_url, diagram_kind, subtopic_key")
      .ilike("subject", `%${subject}%`)
      .not("public_url", "is", null)
      .limit(300);

    if (subjectDiagrams && subjectDiagrams.length > 0) {
      const cleanedQuestionsLower = questions.map(q => cleanQuestion(q).toLowerCase());
      const lastSlug = (subtopicKey.split("/").pop() || "").toLowerCase();

      for (const d of subjectDiagrams) {
        if (!d.public_url || seenUrls.has(d.public_url)) continue;
        const dText = cleanQuestion(d.question_text || "").toLowerCase();
        const dSubKey = (d.subtopic_key || "").toLowerCase();

        const matchesQuestion = cleanedQuestionsLower.some(q =>
          q.length > 8 && dText.length > 8 && (q.includes(dText.slice(0, 30)) || dText.includes(q.slice(0, 30)))
        );
        const matchesSubKey = lastSlug.length > 4 && dSubKey.includes(lastSlug);

        if (matchesQuestion || matchesSubKey) {
          seenUrls.add(d.public_url);
          matchedDiagrams.push(d);
        }
      }
    }

    /*
     * Half the deck at most, and only as many as actually exist.
     *
     * "50% images" is a ceiling, not a quota. A chapter with four diagrams gets
     * four image cards and sixteen theory ones; a chapter with none gets twenty
     * theory cards. Theory always makes up the difference, so the deck is the
     * size it promised either way.
     */
    const maxImageCards = Math.floor(target / 2);
    const selectedDiagrams = matchedDiagrams.slice(0, maxImageCards);
    const wantTheory = target - selectedDiagrams.length;

    /*
     * Which of the chosen plates get drawn as a pathway.
     *
     * Two conditions, and both are facts rather than guesses: the row reached
     * this deck through the identity join, and its own `diagram_kind` column
     * says it draws a process. A plate that is a labelled cross-section is an
     * ordinary image card, because there is no chain in it to write down.
     *
     * First year only. The other years' decks are unchanged by everything in
     * this file, which is deliberate — they are cached, they were checked, and
     * "improve first year" is not a licence to rewrite what already works.
     */
    const pathwayIndices = new Set<number>();
    if (isFirstYear) {
      for (let i = 0; i < selectedDiagrams.length; i++) {
        if (pathwayIndices.size >= MAX_PATHWAY_CARDS) break;
        const d = selectedDiagrams[i];
        if (d?.identity && PATHWAY_KINDS.has(String(d.diagram_kind ?? "").toLowerCase())) {
          pathwayIndices.add(i);
        }
      }
    }

    // ---- 2. Theory cards, and a written answer for each diagram ----
    function questionPriority(q: string): number {
      const stars = (q.match(/[★*⭐]/g) || []).length;
      const sessions = (q.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{2,4}/gi) || []).length;
      const isEssay = /essay|classify|describe|discuss|enumerate/i.test(q) ? 3 : 0;
      return stars * 5 + sessions * 3 + isEssay;
    }

    const prioritizedQuestions = [...questions].sort((a, b) => questionPriority(b) - questionPriority(a));
    const askTheory = wantTheory + THEORY_MARGIN;
    const list = prioritizedQuestions.slice(0, 100).map((q, i) => `${i + 1}. ${cleanQuestion(q)}`).join("\n");

    /*
     * The chapter's own textbook, retrieved before the model is asked anything.
     *
     * Same retrieval, same bucket, same book choice as the notes function. It
     * returns "" for a subject with no book (final year), and the prompt then
     * simply omits the block rather than claiming a grounding it does not have.
     */
    let refText = "";
    try {
      refText = await buildTextbookContext(
        subject,
        subtopicName,
        prioritizedQuestions.slice(0, 60),
        18000,
        admin,
      );
    } catch (e) {
      console.warn("[flashcards] textbook context unavailable:", e);
    }
    console.log(
      `[flashcards] subject=${subject} chapter="${subtopicName}" books=[${bookKeys.join(",")}] ` +
        `firstYear=${isFirstYear} refChars=${refText.length} identityPlates=${identityRows.length} ` +
        `plates=${selectedDiagrams.length} pathways=${pathwayIndices.size}`,
    );

    let userPrompt = `SUBJECT: ${subject}\nYEAR: ${year}\nCHAPTER: ${subtopicName}\n`;
    if (refText) {
      /*
       * "Treat as the primary source of truth" is the notes function's wording,
       * and it is the whole of the owner's instruction: our textbook only. The
       * book is never named to the reader — that rule holds here too, and the
       * line below is what says so to the model.
       */
      userPrompt += `\nTEXTBOOK REFERENCE (OCR extract from this chapter's own textbook; treat as the PRIMARY source of truth, and write every card from it):\n"""\n${refText}\n"""\n\nNever name a textbook, an author, an edition or a page number on a card.\n`;
    }
    userPrompt += `\nWrite AT LEAST ${askTheory} theory flashcards covering these high-yield university exam questions from this chapter (prioritized by exam repetition frequency):\n\n${list}\n\nThere are only ${questions.length} questions listed, and you must still produce at least ${askTheory} cards — split each question into its individual examinable facts. Strictly one fact per card. Concise, recallable answers (<= 25 words). High-yield textbook facts only.`;

    /*
     * The mode split, as counts, here rather than in the system prompt.
     *
     * `FIRST_YEAR_SYSTEM_PROMPT` asked for "roughly half recall, a quarter
     * reasoning, a quarter applied" and the model obeyed the taxonomy while
     * ignoring the quota: two live runs of v11 returned 32 cards carrying
     * `recall`, `reasoning` and `pathway`, and **zero** `applied` — the mode
     * the owner asked for by name, modelled on their own papers.
     *
     * Two things are different here and both are deliberate. It is a **count**
     * rather than a fraction, because "at least ${askTheory} theory cards" is
     * the one numeric demand this function has ever reliably got obeyed. And it
     * sits in the *user* prompt beside that demand rather than in the tail of a
     * long system prompt, which is where the instructions that get followed
     * already live.
     *
     * If a run still comes back with no applied cards, the next step is
     * structural rather than persuasive — ask for `appliedCards` as its own
     * array, the way `diagramCards` already is. Do not close the gap by
     * relabelling recall cards: a card with no vignette is not an applied card,
     * and mislabelling it would make the measurement stop working.
     */
    if (isFirstYear) {
      const wantApplied = Math.max(3, Math.round(askTheory * 0.25));
      const wantReasoning = Math.max(3, Math.round(askTheory * 0.25));
      const wantRecall = Math.max(0, askTheory - wantApplied - wantReasoning);
      userPrompt +=
        `\n\nMODE QUOTA — count them before you answer. Of those ${askTheory} theory cards, EXACTLY ` +
        `${wantApplied} must have "mode": "applied" (a one-line clinical vignette, then the question), ` +
        `EXACTLY ${wantReasoning} must have "mode": "reasoning" (a claim, then "Why?", answered with the mechanism), ` +
        `and the remaining ${wantRecall} are "mode": "recall". A deck that is short on "applied" is a failed answer, ` +
        `however good its recall cards are. Write the ${wantApplied} applied cards FIRST, then the reasoning ones, then fill up with recall.`;
    }

    if (selectedDiagrams.length > 0) {
      const diagList = selectedDiagrams
        .map((d, i) =>
          `${i + 1}. ${pathwayIndices.has(i) ? "[PATHWAY] " : ""}${cleanQuestion(d.question_text || subtopicName)}`
        )
        .join("\n");
      userPrompt += `\n\nALSO, for each of the following ${selectedDiagrams.length} diagram questions, write a short, high-yield written answer/takeaway for diagramCards explaining the key clinical/anatomical feature shown in the diagram (max 25 words each):\n\n${diagList}`;
      if (pathwayIndices.size > 0) {
        userPrompt += `\n\n${pathwayIndices.size} of those are marked [PATHWAY]. Their diagramCards entries must also carry "steps" (${MIN_PATHWAY_STEPS}-${MAX_PATHWAY_STEPS} ordered { label, detail } objects) and a one-line "caption". Keep the diagramCards array in the SAME ORDER as the list above, one entry per diagram question.`;
      }
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) throw new UpstreamError(500, "GEMINI_API_KEY is not configured in Supabase", "auth");

    const systemPrompt =
      SYSTEM_PROMPT +
      (isFirstYear ? FIRST_YEAR_SYSTEM_PROMPT : "") +
      (pathwayIndices.size > 0 ? PATHWAY_SYSTEM_PROMPT : "");

    const raw = await callGemini(geminiKey, userPrompt, systemPrompt);
    const generated = parseJson(raw);

    const generatedTheory = Array.isArray(generated?.theoryCards)
      ? generated.theoryCards
      : (Array.isArray(generated?.cards) ? generated.cards : []);

    const generatedDiagrams = Array.isArray(generated?.diagramCards)
      ? generated.diagramCards
      : (Array.isArray(generated?.diagramAnswers) ? generated.diagramAnswers : []);

    const seenFront = new Set<string>();
    const theoryCards = generatedTheory
      .map((c: any) => ({
        kind: "theory" as const,
        front: String(c?.front ?? "").trim(),
        back: String(c?.back ?? "").trim(),
        hint: c?.hint ? String(c.hint).trim().slice(0, 60) : undefined,
        /*
         * What the card asks for — recall, reasoning, or an applied vignette.
         *
         * Kept only when the model named one of the three. A card with no mode
         * shows no chip, which is what every deck built before this looks like,
         * so an older or sloppier response degrades to today's card rather than
         * to a chip reading "undefined".
         */
        ...(["recall", "reasoning", "applied"].includes(String(c?.mode ?? "").toLowerCase())
          ? { mode: String(c.mode).toLowerCase() }
          : null),
        tags: Array.isArray(c?.tags) ? c.tags.map(String).slice(0, 3) : [subject.toLowerCase()],
      }))
      .filter((c: any) => {
        const key = c.front.toLowerCase();
        if (c.front.length < 5 || c.back.length < 2 || seenFront.has(key)) return false;
        seenFront.add(key);
        return true;
      })
      .slice(0, wantTheory);

    const imageCards = selectedDiagrams.map((d: any, i: number) => {
      const diagAns = generatedDiagrams[i];
      let back = "";
      if (typeof diagAns?.back === "string" && diagAns.back.trim().length > 0) {
        back = diagAns.back.trim();
      } else if (typeof diagAns === "string" && diagAns.trim().length > 0) {
        back = diagAns.trim();
      } else {
        back = `Key diagnostic landmarks and clinical mechanisms demonstrated in diagram.`;
      }
      const hint = diagAns?.hint ? String(diagAns.hint).trim().slice(0, 60) : undefined;

      /*
       * A pathway card, when the plate is provably this question's, its own
       * `diagram_kind` says it draws a process, and the model actually returned
       * a usable chain. All three, or it is an ordinary image card — the chain
       * is an assertion about the picture and a half-built one is worse than
       * none.
       */
      const pathway = pathwayIndices.has(i) ? readPathway(diagAns) : null;

      const questionText = cleanQuestion(d.question_text || subtopicName);
      return {
        kind: "image" as const,
        /*
         * A pathway card asks for the chain, not for a game of "spot the
         * label". "[Visual Recall] Identify key structures…" is the right
         * prompt over a cross-section and the wrong one over a metabolic map:
         * what the paper asks is the sequence, the energetics and the block.
         */
        front: pathway
          ? `Trace the pathway: ${questionText}\n\nName the steps in order, the enzyme at each, and where it is blocked.`
          : `[Visual Recall] Identify key structures & clinical points: ${questionText}`,
        back,
        hint,
        imageUrl: d.public_url as string,
        ...(pathway ? { mode: "pathway" as const, pathway } : null),
        tags: ["diagram", subject.toLowerCase(), String(d.diagram_kind ?? "schematic")],
      };
    });

    // ---- 3. Interleave, so a sitting alternates reading and looking ----
    const cards: any[] = [];
    const maxLen = Math.max(theoryCards.length, imageCards.length);
    for (let i = 0; i < maxLen; i++) {
      if (theoryCards[i]) cards.push(theoryCards[i]);
      if (imageCards[i]) cards.push(imageCards[i]);
    }
    const seenIds = new Set<string>();
    for (const c of cards) {
      let id = cardId(subtopicKey, c.front);
      // Two cards can hash alike only if their fronts match, which the dedupe
      // above already prevents — but an id collision would silently merge two
      // cards' schedules, so it is made impossible rather than unlikely.
      while (seenIds.has(id)) id = `${id}x`;
      seenIds.add(id);
      c.id = id;
    }

    if (!noCache) {
      await admin.from("flashcards").upsert({
        deck_key: deckKey,
        year,
        subject,
        subtopic_key: subtopicKey,
        subtopic_name: subtopicName,
        cards,
        card_count: cards.length,
        // The marker that this row came from the current sizing algorithm, and
        // the reason it is a column rather than a comparison. See the cache
        // check above.
        deck_target: target,
        updated_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({
      cached: false,
      deckKey,
      cards,
      stats: {
        total: cards.length,
        target,
        imageCards: imageCards.length,
        theoryCards: theoryCards.length,
        pathwayCards: imageCards.filter((c: any) => c.pathway).length,
        diagramsAvailable: matchedDiagrams.length,
        identityDiagrams: matchedDiagrams.filter((d: any) => d.identity).length,
        firstYear: isFirstYear,
        books: bookKeys,
        textbookChars: refText.length,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const isUpstream = err instanceof UpstreamError;
    const status = isUpstream ? (err as UpstreamError).status : 500;
    const msg = isUpstream && (err as UpstreamError).kind === "quota"
      ? "AI quota exceeded. The free tier is currently rate-limited, please try again shortly."
      : ((err as Error).message ?? "Unknown error");
    console.error("generate-flashcards error:", err);
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
