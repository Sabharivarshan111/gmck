import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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

const SYSTEM_PROMPT = `You write high-yield Anki-style flashcards for MBBS medical students.

A good card obeys the minimum information principle: ONE fact per card, phrased so the answer is short enough to recall in a few seconds.

Output VALID JSON only — no markdown fences, no preamble — matching exactly:

{
  "theoryCards": [
    {
      "front": string,          // The prompt or question
      "back": string,           // Concise 1-2 line answer. Maximum 25 words.
      "hint": string?,          // Optional short hint
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

class UpstreamError extends Error {
  status: number;
  kind: "quota" | "auth" | "timeout" | "provider" | "invalid";
  constructor(status: number, msg: string, kind: UpstreamError["kind"] = "provider") {
    super(msg);
    this.status = status;
    this.kind = kind;
  }
}

async function callGemini(apiKey: string, userPrompt: string): Promise<string> {
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

    // ---- 1. Diagrams for this chapter ----
    const { data: subjectDiagrams } = await admin
      .from("question_diagrams")
      .select("question_text, public_url, diagram_kind, subtopic_key")
      .ilike("subject", `%${subject}%`)
      .not("public_url", "is", null)
      .limit(300);

    const matchedDiagrams: any[] = [];
    const seenUrls = new Set<string>();

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

    let userPrompt = `SUBJECT: ${subject}\nYEAR: ${year}\nCHAPTER: ${subtopicName}\n\nWrite AT LEAST ${askTheory} theory flashcards covering these high-yield university exam questions from this chapter (prioritized by exam repetition frequency):\n\n${list}\n\nThere are only ${questions.length} questions listed, and you must still produce at least ${askTheory} cards — split each question into its individual examinable facts. Strictly one fact per card. Concise, recallable answers (<= 25 words). High-yield textbook facts only.`;

    if (selectedDiagrams.length > 0) {
      const diagList = selectedDiagrams.map((d, i) => `${i + 1}. ${cleanQuestion(d.question_text || subtopicName)}`).join("\n");
      userPrompt += `\n\nALSO, for each of the following ${selectedDiagrams.length} diagram questions, write a short, high-yield written answer/takeaway for diagramCards explaining the key clinical/anatomical feature shown in the diagram (max 25 words each):\n\n${diagList}`;
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) throw new UpstreamError(500, "GEMINI_API_KEY is not configured in Supabase", "auth");

    const raw = await callGemini(geminiKey, userPrompt);
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
      return {
        kind: "image" as const,
        front: `[Visual Recall] Identify key structures & clinical points: ${cleanQuestion(d.question_text || subtopicName)}`,
        back,
        hint,
        imageUrl: d.public_url as string,
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
        diagramsAvailable: matchedDiagrams.length,
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
