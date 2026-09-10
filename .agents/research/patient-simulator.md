---
description: Research and design proposal for a patient simulator / clinical case proforma — where cases come from, how an answer is marked, what it costs, and why most of it must not be a model call
---

# Patient simulator / clinical case proforma — research and proposal

**Status: research only.** Nothing here is implemented. No application source
file was changed to produce it. Read it as a proposal to argue with, not a
plan to execute.

Written 2026-09-05. Every claim about this repo carries a file and line.
Everything about Indian MBBS clinical examinations is marked as such — it is
general medical-education knowledge plus the sources listed at the end, not
something read out of this codebase.

---

## 1. What the app already is, in the six places this feature touches

This section exists because the proposal below is shaped by these facts rather
than by what a patient simulator "should" be.

### 1a. `askAi.ts` is the only route to the model, and the model is told the intent

`mobile/src/lib/askAi.ts` owns every request to `ask-gemini`; it is the only
file under `mobile/src` that invokes it (`askAi.ts:192` — the only match for
`ask-gemini` outside comments). The function **does not infer intent from the
prompt**; it reads flags off the request body:

| Body flag | Set at | What it selects |
|---|---|---|
| `isMCQRequest` | `askAi.ts:188` | `supabase/functions/ask-gemini/index.ts:429` — the MCQ system prompt, temp 0.8, `maxOutputTokens` 4000 (`index.ts:470-471`) |
| `isTripleTap` / `isDoubleTap` | `askAi.ts:186-187` | strips the marker prefix (`index.ts:401`) |
| `isImportantQuestionsRequest`, `isNeedingClarification` | `askAi.ts:199-200` | history inclusion, `index.ts:414-421` |

Two consequences the proposal has to respect:

- **The medical-vs-generic system prompt is a keyword match on the prompt
  text** — `index.ts:363-376` tests for `medical`, `medicine`, `disease`,
  `pathology`, `symptom`, `treatment`, `diagnosis`, `patient`, `hospital`,
  `clinic`. That is why `tripleTapPrompt` says "MBBS medical exam question"
  on purpose (`askAi.ts:62-71`). A prompt like "Mark this student's
  management plan" happens to contain `patient` and `treatment`, so it would
  land in the medical branch — **by accident**, and the medical branch demands
  3-5 PubMed URLs at the end of every answer (`index.ts:497-513`). That is
  wrong for a marking call. A case marker must not go through `ask-gemini`.
- **`ask-gemini` rate-limits 5 requests per minute keyed on
  `x-forwarded-for`** (`index.ts:34-35`, `index.ts:276`). On a shared college
  NAT that is *five requests a minute for the whole college*. Any new function
  must key its limit on the Supabase user id, not the IP.

### 1b. `parseMcqs` throws away a half-valid response rather than repairing it

`askAi.ts:130-179`. It takes the outermost bracket pair (`indexOf('[')` /
`lastIndexOf(']')`, lines 131-132) because models add fences and a preamble
whatever the prompt says. Then, per item, it requires a non-empty `question`,
all four of `options.A|B|C|D` as strings, and `correct` in `A|B|C|D`
(`:156-167`); anything else is `continue`d. If nothing survives it returns
`undefined` and the caller shows the prose instead (`askAi.ts:226-232`).

The reasoning is written down in `mobile/scripts/mcq-parse-check.mjs:8-11`: *"A
quiz card with three options, or with `correct` pointing at an option that does
not exist, is worse than falling back to prose: it silently teaches the wrong
answer."*

**This is the single most important precedent for the whole feature.** A
partially-valid clinical case is worse than a quiz card with three options, by
a lot. The same discipline — validate hard, discard whole, never repair —
is the spine of §4 below.

### 1c. The rule about the reader's own work

`CLAUDE.md` ("My Progress → Notes and Calendar never leave the phone") and
`mobile/scripts/cloud-ids-check.mjs`. The `LOCAL_ONLY` list currently holds
`src/hooks/useUserNotes.ts`, `src/lib/noteImages.ts`,
`src/hooks/useCalendarEvents.ts`, `src/lib/forest.ts`,
`src/lib/importedDecks.ts`, `../src/lib/importedDecksWeb.ts`,
`src/lib/music.ts`, `src/tour/store.ts`.

The check is stricter than it looks: it fails on the **import** of the Supabase
client, not just on a call (`cloud-ids-check.mjs`, the
`import[^;]*from ... supabase` test and the note above it — "the import is the
honest line to draw"). A file in that list may not name the client at all.

The counterweight is `.agents/rules/60-flashcards.md:91-100`: a *generated
deck* is shared and cached server-side because "the same chapter produces the
same cards, which is the whole reason the cache is worth having", while the
**schedule** stays on the device. That split — shared artefact, private
performance — is exactly the split a case simulator needs.

### 1d. XP is one ladder and it counts ticked questions

`mobile/src/lib/xp.ts`. `XP_PER_LEVEL = 50` (`:18`), six badges at
10/50/100/250/500/1000 (`:21-28`), `levelFor` is `floor(xp/50)+1` (`:31`), and
`yearXp(year)` is literally *the number of bank questions ticked in that year*
— `countDone(collectAllQuestions(subject.node))` summed over subjects
(`:49-55`). It mirrors `src/lib/rewards.ts` in the web app and
`npm run check:xp` fails if they part company
(`.agents/rules/90-xp.md:14-28`). The failure this prevents already happened:
60 XP was level 2 in a browser and level 3 on the phone.

`milestoneFor(before, after)` reads a milestone from the *crossing*, so there
is no stored list of what has been announced (`xp.ts:69-84`).

`.agents/rules/93-focus-trees.md` settles the general question: the focus trees
unlock on lifetime focused minutes and **not on a currency**, because "a second
economy is a second set of numbers to disagree with the first".

### 1e. The question bank

`src/data/questionBankData.ts:40-66` — four years; final year is
`general-medicine`, `obstetrics-gynaecology`, `general-surgery` (displayed as
"General Surgery and Orthopaedics"), `paediatrics`, `ent`, `ophthalmology`.
Shape is `{ name, subtopics }` down to leaf buckets keyed `essay` /
`short-notes` / `short-note` holding `questions: string[]`
(`mobile/src/lib/questionBank.ts:9-14`, `:49-50`, `:82-101`). It is shared with
the web app through the `@data` alias and must never be duplicated into
`mobile/` (`CLAUDE.md`, "The question bank is shared, not copied").

Approximate question counts in the clinical subjects, counted from the source
files: General Medicine 691, General Surgery 574, OBG 491, Paediatrics 357,
ENT 250, Ophthalmology 199.

**The bank already contains case vignettes.** Not many, but they are real
university questions and they are the right shape:

- 153 questions contain "year old", 42 "presented with", 9 "came with", 6
  "brought with", 34 "differential diagnosis" (counted across
  `src/data/topics/`).
- `src/data/topics/generalMedicine.ts:41-43` is a full three-part case:
  *"Clinical Case: An 18-year-old female … alleged history of poisoning … a)
  What is the first line of management? b) What are the clinical features and
  complications you expect …? c) How to manage the complications"*.
- `src/data/topics/paediatrics.ts` has *"A 3 year old girl child is brought
  its history of not acquiring age appropriate milestones. Describe what is
  normal at this age and how to evaluate for the development delay."* and
  *"A four year old child has been brought to the hospital with swollen face
  and limbs. Enumerate the causes. What investigations are to be done? Discuss
  the management of Nephrotic Syndrome."*
- `src/data/topics/pharmacology.ts` carries "Probable Cases:" blocks appended
  to drug questions — *"A 15 year old girl admitted with complaints of high
  fever, head ache and stomach pain. She revealed that she had visited marina
  beach last week end and ate from roadside food stall"*.

Two facts about the bank that constrain this feature badly and are already
documented in `CLAUDE.md`: final year carries a repeat marker on only **23%**
of its questions and **General Medicine is 0 of 660**, because those questions
were transcribed as `What is Leptospirosis? (Page No: 370)` — a page number
and nothing else. So for most of General Medicine, anchoring a case to a
question gives the generator a *topic*, not a case.

### 1f. There ARE final-year textbooks now, and two documents in this repo say there are not

This is the fact the whole feature's feasibility rests on, so it was verified
three ways.

- `mobile/src/lib/textbooks.ts:86-110` returns book keys for `obstetrics`,
  `gynaecology`, `orthopaedics`, `surgery`, `medicine`, `paediatrics`, `ent`,
  `ophthalmology`.
- The private `textbooks` storage bucket holds **42 files, ~40 MB**, including
  `medicine/manipal_medicine_part1-3.txt`,
  `surgery/manipal_surgery_part1-4.txt`,
  `paediatrics/op_ghai_paediatrics_part1-3.txt`,
  `obgyn/shaws_gynaecology_part1-2.txt`,
  `obgyn/dc_dutta_gynaecology_part1-2.txt`,
  `orthopaedics/maheshwari_orthopaedics_part1-2.txt`,
  `ent/dhingra_ent_part1-2.txt`,
  `ophthalmology/khurana_ophthalmology_part1-2.txt` — all uploaded
  2026-08-31. (Queried against production through the Supabase MCP connector,
  `storage.objects where bucket_id='textbooks'`.)
- The **deployed** `generate-handwritten-notes` (v56) maps all of them, and
  labels them: *"Manipal Prep Manual of Medicine 3rd ed."*, *"Shaw's Textbook
  of Gynaecology 17e"*, *"DC Dutta's Textbook of Obstetrics"*, *"Manipal Manual
  of Surgery 5th ed."*, *"J Maheshwari — Essential Orthopaedics 5th ed."*,
  *"OP Ghai — Essential Pediatrics 8th ed."*, *"PL Dhingra — Diseases of Ear,
  Nose and Throat 7th ed."*, *"AK Khurana — Comprehensive Ophthalmology 6th
  ed."* (read through the connector, not from the repo copy).
- `mobile/scripts/textbooks-check.mjs:97` already lists all six final-year
  subjects as having books.

But **`CLAUDE.md` says "final year has none and must keep falling through to
Ask AI"**, and **`.agents/rules/50-notes.md:24-27` says "Final year matches
nothing — there are no books for it"**. Both are stale. This is the same class
of defect as the `year === 'third-year'` gate those very documents were written
about: the rule stopped being true and the document did not move. It should be
fixed regardless of whether this feature is ever built.

**One unresolved defect found on the way.** The deployed function and the repo
copy (`supabase/functions/generate-flashcards/textbook.ts:49-52`) both map the
`obstetrics` key to `obgyn/dc_dutta_gynaecology_part1.txt` /
`part2.txt` — a *gynaecology* filename — while labelling it "DC Dutta's
Textbook of Obstetrics". The bucket has no file whose name says obstetrics.
Either the OCR of Dutta's Obstetrics was saved under a gynaecology filename, or
every obstetric question in the app is being grounded in a gynaecology text.
One download settles it. **Settle it before building any obstetric case.**

### 1g. The other things that will constrain the screens

- **Five tabs, and the fifth is at its limit.** `RootNavigator.tsx:49-53`;
  `BottomNav.tsx:16-22` positions the selection blob from `width / 5` as
  arithmetic rather than measurement (`:24-32`); and `CLAUDE.md` records that
  the in-app text-size ceiling of 1.15 is set by "My Progress" having to fit
  inside a fifth of the bar. **There is no room for a sixth tab.**
- **The precedent for a big new mode is a takeover, not a tab.**
  `NotesScreen.tsx:71-76` — *"Flashcards take over the whole tab rather than
  becoming another `view`"* — and it is rendered at `NotesScreen.tsx:141`,
  entered from a row at `:304`.
- **Text input drags in real rules.** `.agents/rules/80-keyboard.md`:
  `adjustResize` is inert at targetSdk 35+, `KeyboardSafe` is the only file
  allowed to use `KeyboardAvoidingView`, `npm run check:keyboard` fails on a
  `<TextInput` outside it, and `keyboardShouldPersistTaps="handled"` plus
  `Keyboard.dismiss()` in the commit handler are both required. A case proforma
  is the most input-heavy screen in the app.
- **A full-screen `<Modal>` needs `insets.top` itself** — `check:edges`
  (`.agents/rules` and `CLAUDE.md`, "A full-screen Modal is its own window").
- **Every `Touchable` requires a `label`** and `check:smoke` selects by
  accessibility label, so an unlabelled pick is one that cannot be tested
  either (`.agents/rules/92-verify.md`).
- **Dictation already exists.** `mobile/src/lib/speech.ts` over
  `SpeechModule.kt` / Android `SpeechRecognizer`, degrading to hidden when the
  module is absent. Relevant to a viva station later; not needed in v1.
- **A new native-free feature still needs a check script.**
  `.agents/rules/92-verify.md` §3.
- **`check:one-app`** forbids growing a second copy of native logic in the web
  app (`mobile/scripts/one-app-check.mjs:1-25`).
- **`generate-flashcards` is deployed with `verify_jwt: true`** (listed through
  the connector) while `ask-gemini` is `false`. A new function should follow
  flashcards.

---

## 2. What a clinical case actually is, in an Indian MBBS exam

*General medical-education knowledge, plus the sources at the end. Not from
this repo. Anyone building this should have a real proforma from the college
in front of them — the app owner is a student and can supply one, which is
worth more than any of the below.*

Four assessment formats, and they are genuinely different exercises:

| Format | Roughly | What is being tested |
|---|---|---|
| **Long case** | ~45 min with the patient, then presentation and grilling; ~60 marks in the Medicine practical | Complete history, complete examination, a defended diagnosis, a plan |
| **Short case** | ~15 min each, usually two; ~30 marks each | One system or one lesion. Focused examination, spot diagnosis |
| **OSCE / OSPE station** | 3-7 min, timed, structured checklist | One skill: read this ECG, counsel this mother, demonstrate this manoeuvre |
| **Viva voce** | Examiner-led | Anything, but anchored on the case just presented |

NMC's CBME 2024 guidelines put theory and practical at 200 marks each for
Medicine, Surgery and OBG, and require ≥40% separately in theory and practical
with a 50% aggregate. The practical is assembled from the four formats above
against structured rubrics tied to competency codes.

**The long case proforma is the document to model.** It is standardised enough
that students buy printed pads of it. Its spine, common to all four clinical
subjects:

```
Identification      name / age / sex / occupation / residence / DOA, DOE
Chief complaints    in the patient's own words, WITH DURATION, in chronological order
History of present illness
                    onset, duration, progression; for each symptom its character,
                    site, radiation, aggravating and relieving factors, associated
                    symptoms; negative history that rules out the differentials
Past history        similar episodes, TB/DM/HTN/asthma/epilepsy, surgery, transfusion
Personal history    diet, appetite, sleep, bowel and bladder, smoking, alcohol,
                    (in a woman) menstrual history
Family history      similar illness, consanguinity, hereditary disease
Treatment history   drugs taken, compliance, allergies
Summary             one paragraph: complaint, system, onset, likely aetiology
General examination built / nutrition / consciousness; pallor, icterus, cyanosis,
                    clubbing, lymphadenopathy, oedema (the "PICCLE" sweep);
                    vitals — pulse, BP, RR, temperature; JVP; anthropometry
Systemic examination
                    the involved system in full — inspection, palpation, percussion,
                    auscultation — then the other three in brief
Provisional diagnosis   one line, with the reasoning
Differential diagnosis  each with the feature for and the feature against it
Investigations      what, and WHY, in order of priority
Management          immediate / definitive / supportive / follow-up / advice
```

Each subject then bends that spine, and the bends are the whole point — a
proforma that does not bend is not a proforma:

- **General Medicine.** The systemic examination is the load: CVS, RS,
  abdomen, CNS each with their own sequence (for CNS: higher functions,
  cranial nerves, motor, sensory, cerebellar, gait, skull and spine). A
  medicine long case is graded largely on the *negative* history and the
  differential.
- **General Surgery.** The centre of gravity moves to **local examination** of
  a lump, ulcer or swelling: site, size, shape, surface, edge, consistency,
  fluctuation, transillumination, fixity to skin / muscle / bone, regional
  nodes. Plus a fitness-for-anaesthesia strand that pure medicine does not
  have.
- **Obstetrics & Gynaecology.** A different header entirely: the **obstetric
  formula** (G/P/L/A), LMP, EDD by Naegele's rule, period of gestation, then
  menstrual, marital, obstetric (each previous pregnancy: outcome, mode,
  complications), and contraceptive history. Examination is per abdomen —
  symphysio-fundal height in weeks, fundal grip, lateral grips, pelvic grips,
  lie, presentation, engagement, FHS — then per vaginum where appropriate. A
  gynaecology case swaps the obstetric block for the menstrual and fertility
  one.
- **Paediatrics.** The header is **BINDS** — Birth history (gestation, birth
  weight, cry, resuscitation, NICU), Immunisation (against the national
  schedule, with the card seen), Nutrition (exclusive breastfeeding, weaning
  age, current 24-hour recall), Development (gross motor, fine motor, language,
  social, against age), and Social/family (income, siblings, consanguinity,
  housing). Examination is anthropometry-first — weight, length/height, head
  circumference, MUAC — plotted, then the systemic exam. The history is taken
  from the parent, and the case is often as much about the *feeding and
  immunisation* as about the presenting complaint.

**One thing worth naming, because it decides the interaction model:** a real
long case is not a form the student fills from a paragraph. It is a
*conversation* — the student asks, the patient answers, and the marks are for
having asked. A simulator that shows a paragraph and then asks for a diagnosis
is testing reading comprehension. A simulator where the student has to *elicit*
the history is testing the thing the exam tests. That distinction drives §3.

---

## 3. Proposed data shape

One case is one row. TypeScript-shaped, but it is what the edge function
returns and what the table stores as `jsonb`.

```ts
/** The identity of a case. Mirrors the notes key shape in
 *  handwrittenNotes.ts:342 — `single::{subjectKey}::{hash(question)}`. */
type CaseKey = string;   // `case::{subjectKey}::{hash(anchorQuestion)}`

interface ClinicalCase {
  key: CaseKey;
  year: YearKey;                 // questionBank.ts:16
  subjectKey: string;            // 'general-medicine'
  subjectName: string;           // 'General Medicine'
  subtopicKey: string;           // the chapter path, as flashcards uses
  proforma: 'medicine' | 'surgery' | 'obstetric' | 'gynaec' | 'paediatric';
  format: 'long' | 'short';      // v1 is 'long' only

  /** The bank question this case was built from. NOT optional. §4a. */
  anchorQuestion: string;
  /** The bank's raw string too, for the same reason SingleNoteRequest carries
   *  rawQuestion (handwrittenNotes.ts:318-329): the diagram lookup and the
   *  notes hash disagree about the leading "12. ". */
  anchorRawQuestion?: string;

  /** The answer, decided BEFORE generation. §4b. */
  diagnosis: {
    label: string;               // 'Nephrotic syndrome'
    keyFeatures: string[];       // what makes it this and not the differentials
  };

  stem: {
    /** What the student is shown on arrival. Two or three lines, no more —
     *  everything else has to be asked for. */
    presentation: string;        // '4-year-old boy, brought by mother, swelling of face for 10 days'
    ageYears: number; ageMonths?: number;
    sex: 'M' | 'F';
    setting: string;             // 'District hospital OPD'
  };

  /** ---- The elicited layers. Every entry is a thing the student can ask,
   *       and the patient's answer to it. No model call at answer time. ---- */

  history: HistoryItem[];        // 40-70 items
  examination: ExamItem[];       // 30-60 items
  investigations: InvestigationItem[];  // 15-30 offered, of which 4-8 are right

  /** ---- The marked half ---- */
  rubric: {
    provisionalDiagnosis: RubricPoint[];   // 1 required + reasoning points
    differential: RubricPoint[];           // each DD with its for/against
    management: RubricPoint[];             // principles only in v1. §4c
  };

  /** Verbatim textbook paragraphs the case was built from, so a reviewer can
   *  check it without re-reading the book. Shown to the reader after marking,
   *  never before. §7 flags the conflict with "never name a textbook". */
  grounding: { text: string; bookKey: string }[];

  /** ---- Provenance and safety ---- */
  status: 'draft' | 'approved' | 'rejected';
  generatedBy: string;           // 'gemini-3.1-flash-lite@2026-09-05'
  reviewedBy?: string;           // profile id of the admin who approved it
  reviewedAt?: string;
  reportCount: number;
}

interface HistoryItem {
  id: string;
  /** Which proforma heading it sits under — this is what the student navigates. */
  section: 'chief-complaint' | 'hpi' | 'past' | 'personal' | 'family'
         | 'treatment' | 'birth' | 'immunisation' | 'nutrition'
         | 'development' | 'menstrual' | 'obstetric' | 'contraceptive';
  /** The question as the student would ask it. */
  ask: string;                   // 'Any blood in the urine?'
  /** The patient's answer. May be a normal / negative answer — the negatives
   *  are half the marks in a real long case. */
  reply: string;                 // 'No, the urine has been normal in colour.'
  weight: 'essential' | 'useful' | 'irrelevant';
  /** Why it mattered. Shown in the debrief, never before. */
  teaching?: string;
}

interface ExamItem {
  id: string;
  section: 'general' | 'vitals' | 'anthropometry' | 'cvs' | 'rs' | 'abdomen'
         | 'cns' | 'local' | 'per-abdomen' | 'per-vaginum';
  /** The manoeuvre or sign, as an examiner would name it. */
  ask: string;                   // 'Check for pedal oedema'
  finding: string;               // 'Pitting oedema to mid-shin, bilateral'
  /** Present when the finding is a number, so it can be validated. §4d */
  value?: Measurement;
  weight: 'essential' | 'useful' | 'irrelevant';
  teaching?: string;
}

interface InvestigationItem {
  id: string;
  name: string;                  // 'Urine routine — 24h protein'
  result: string;                // '4.2 g/24h'
  value?: Measurement;
  /** appropriate = the case needs it; reasonable = defensible; wasteful =
   *  costs marks. A real examiner deducts for a CT on a clinically obvious
   *  diagnosis, and that IS the teaching point. */
  weight: 'appropriate' | 'reasonable' | 'wasteful';
  teaching?: string;
}

interface Measurement {
  quantity: string;              // 'haemoglobin'
  value: number;
  unit: string;                  // 'g/dL'
  refLow: number; refHigh: number;
}

interface RubricPoint {
  id: string;
  text: string;                  // 'Minimal change disease is the commonest cause at this age'
  marks: number;                 // 1 or 2
  required: boolean;             // a required point missed = the case is failed
}
```

And, on the phone only, one row per attempt:

```ts
interface CaseAttempt {
  caseKey: CaseKey;
  startedAt: number; finishedAt?: number;
  askedHistory: string[];        // HistoryItem ids, in the order asked
  didExam: string[];
  orderedInvestigations: string[];
  provisionalDiagnosis: string;  // free text
  differential: string;          // free text
  management: string;            // free text
  result?: MarkedResult;         // what came back from the marking call
}
```

### Why this shape and not a simpler one

- **`history`/`examination`/`investigations` are lists of *offers*, not
  prose.** That is what makes the simulator test elicitation rather than
  reading, and it is what makes the whole middle of the exercise cost **zero
  model calls at answer time** — the replies are already in the row. §5.
- **`weight` is on every item**, including the irrelevant ones. A list of only
  the right questions is a list you can pass by tapping everything.
- **`Measurement` is separate from the human-readable string.** A lab value
  buried in `result: 'Hb 4.2'` cannot be validated. Split out, it can be
  checked against a hardcoded range table before the case is ever shown. §4d.
- **`rubric` is generated *with* the case and stored.** That means (i) a human
  reviewing the case is reviewing the marking scheme too, and (ii) marking an
  attempt is the much easier question "which of these points does this answer
  contain?" rather than "mark this". §5b.
- **`grounding` is stored.** A reviewer should not have to trust the model
  about what the book said.
- **`status` and `reviewedBy` are on the row, not in a side table**, because
  the read path must be able to filter on them in one query.

---

## 4. Where the cases come from, and what stops one being wrong

**This is the question that decides whether the feature should exist.** A
generated case that is subtly wrong teaches a student something false, and
they will write it in an exam or say it on a ward. The answer below is five
mechanisms, not a better prompt.

### 4a. A case is *anchored to a bank question*. It is never freely invented.

`caseKey = case::{subjectKey}::{hash(anchorQuestion)}`, mirroring the notes key
at `handwrittenNotes.ts:342`.

The generator is not asked "invent a medicine case". It is asked: *"This is a
past-year university question. Build the patient it is about."* For
`"A four year old child has been brought to the hospital with swollen face and
limbs … Discuss the management of Nephrotic Syndrome."`
(`src/data/topics/paediatrics.ts`) the diagnosis is given, the age is given,
the presenting complaint is given. The model is elaborating a known case, not
choosing one.

This removes the degree of freedom where a hallucination does the most damage
— *which disease this is* — and it has three side benefits:

- The case set is **enumerable offline**. You can list every question that can
  become a case, which is what makes pre-generation possible (§6).
- The case inherits the bank's exam relevance. A case built from a question
  that has been asked four times is a case worth working.
- It gives the anchor question something to do for XP (§8).

The honest cost: for much of General Medicine the anchor is
`"What is Leptospirosis? (Page No: 370)"` — a topic, not a case, because
General Medicine carries a repeat marker on 0 of 660 questions and was
transcribed as page numbers (`CLAUDE.md`). Anchoring there fixes the
*diagnosis* and nothing else. That is still the important half.

### 4b. The diagnosis is an input, and a case whose diagnosis drifted is discarded

`ClinicalCase.diagnosis.label` is decided from the anchor **before** the
generation call and passed in. The function then checks the returned case
states the same diagnosis; if not, the whole case is thrown away.

This is `parseMcqs` discipline (`askAi.ts:143-178`,
`mcq-parse-check.mjs:8-11`) applied to a bigger object: **validate hard,
discard whole, never repair.** Specifically, a returned case is rejected — not
patched — if any of:

- `diagnosis.label` is not the one that was sent;
- fewer than 25 `history` items, or none with `weight: 'essential'`;
- fewer than 15 `examination` items, or no `vitals` section;
- fewer than 3 rubric points under `provisionalDiagnosis`, or none `required`;
- any `Measurement` fails §4d;
- the stem's age or sex contradicts the anchor question's;
- `management` rubric contains a number followed by `mg`, `mcg`, `ml`,
  `mg/kg`, `units` (§4c).

A rejection is one retry, then a hard failure. **A case that cannot be
generated is simply not offered**, exactly as a question with no
`question_diagrams` row shows no picture (`CLAUDE.md`, "No row means no
picture. A plausible neighbour is worse than a blank.")

### 4c. No drug doses. At all, in v1.

The management rubric is marked on **principles, drug names and classes,
sequence, and disposition** — "IV fluids, empirical ceftriaxone, admit,
monitor urine output" — and never on mg, mg/kg, ml or units. The validator in
§4b enforces it by regex, so it cannot come back by accident through a prompt
change.

Reasoning, and it is the sharpest line in this document: a wrong differential
loses a student marks; a wrong paediatric dose has a path to a dead child. The
two are not the same category of error and should not be given the same
mitigation. Omitting doses costs the feature very little — Indian long-case
vivas ask "what will you give" far more often than "how much" — and it removes
the worst outcome available.

If doses are wanted later, they need a hand-authored formulary keyed by drug
and indication, not a model.

### 4d. Numbers are validated against a hand-written table, not trusted

Every `Measurement` is checked in the edge function against a hardcoded table
of ~40 common investigations, authored by hand once:

```
haemoglobin      g/dL     plausible 2.0-22.0    normal 12.0-16.0
serum creatinine mg/dL    plausible 0.2-20.0    normal 0.6-1.2
serum albumin    g/dL     plausible 0.5-6.0     normal 3.5-5.5
random glucose   mg/dL    plausible 20-900      normal 70-140
...
```

Two checks, both cheap and both catching real failure modes:

- **Plausibility.** A value outside the plausible envelope (Hb 45 g/dL) is a
  transcription or unit error. Reject the case.
- **Self-consistency of the stated reference range.** If the model returns
  `refLow`/`refHigh` that disagree with the table by more than a tolerance, it
  has invented a range, and a student reading an invented normal range learns
  it. Reject the case.

Unit errors are the specific thing this catches, and they are the commonest
numeric error a language model makes on lab data.

### 4e. A shared case is human-approved before anyone else sees it

Table `clinical_cases`, RLS shaped like `flashcards`: **service-role write
only**, public read, and the read is filtered `status = 'approved'`. The
reasoning is already written for flashcards
(`.agents/rules/60-flashcards.md:93-98`): "a client that could write there
could replace a chapter's cards for every student."

Review happens in the existing admin surface — the gate is a role in
`user_roles` (1 row today) and never an email compared in the client
(`.agents/rules/99-admin.md`). The reviewer sees the case, the rubric and the
`grounding` paragraphs side by side. Approve / reject / edit-and-approve.

This is the mechanism that actually carries the safety claim. Everything above
reduces how often the reviewer has to say no; nothing above removes the need
for one.

The precedent for "a thing shown to everyone needs more than one person behind
it" is already in the repo and is stronger than what is proposed here:
`.agents/rules/98-page-references.md` — a page number is shown only once
**three different readers** agree, and that quorum lives in Postgres rather
than in the app because "the app ships as an APK anyone can unpack". A
three-reader quorum is not available for cases (there is nothing for a reader
to independently submit), which is exactly why the admin review is not
optional.

### 4f. A reader-generated case never becomes a shared one

If on-demand generation is ever offered (it is deferred out of v1, §9), it
follows `generate-flashcards`'s `noCache` flag
(`supabase/functions/generate-flashcards/index.ts:59-72`): built, returned,
**nothing written to the shared cache**, and the case is labelled on screen as
unreviewed practice. That label is not a disclaimer in settings; it is on the
case.

### 4g. One tap to report a case, and a reported case leaves the shared cache

`reportCount` on the row; three reports pulls it back to `status: 'draft'`
pending review. Cheap, and it is the only mechanism that scales past what one
person can review. It also gives the honest answer to "what if you approve a
wrong one": it comes back.

### 4h. And say plainly that this will still sometimes be wrong

The mitigation of last resort is **what the app claims**. Concretely, the case
result screen says *what the marking scheme expected*, not *what is correct*.
It shows the rubric so the student can disagree with it. It never says
"incorrect" about a management plan; it says "the rubric expected: …". And
every case screen carries, in the header and not in a settings page:

> Simulated case for exam practice. Not clinical guidance.

---

## 5. How the answer is marked

**Both structured and free text, split so that the structured half is free and
the free-text half is one call.**

### 5a. History, examination and investigations: structured, zero model calls

The student picks from the case's own `history` / `examination` /
`investigations` lists. Each pick reveals the stored reply. Marking is
arithmetic over the ids they picked:

```
historyScore = essential asked / essential total          (weighted 2)
             − irrelevant asked × small penalty
examScore    = same shape
investScore  = appropriate ordered / appropriate total
             − wasteful ordered × penalty
```

This is faithful (a long case IS marked on whether you asked about the fever
pattern), instant, works offline once the case is cached, costs nothing, and
is fully deterministic — so `check:smoke` can drive it end to end.

The penalty for irrelevant picks is what stops "tap everything". It has to be
small enough that curiosity is not punished and large enough that a full sweep
scores worse than a directed one. Suggest: asking every item scores ~55%, a
clean directed history scores ~90%.

### 5b. Diagnosis, differential and management: free text, one model call

The only place the model touches an attempt. And the call is **not** "mark this
answer". It is:

> Here are 9 rubric points. Here is what the student wrote. For each point,
> does the student's answer contain it? Return
> `[{ "id": "...", "present": true|false, "quote": "..." }]` and nothing else.

Three reasons that framing matters:

- It is a far easier question than open marking, so it is far more reliable.
- The rubric was human-approved at §4e, so the *standard* the student is
  marked against has been seen by a person even though the marking has not.
- The response is trivially validatable — a fixed set of ids, booleans — and
  therefore gets the `parseMcqs` treatment: if the array does not parse, or
  any id is unknown, **the whole marking is discarded** and the student is
  shown the rubric with "mark this yourself" rather than a fabricated score.
  A wrong score is worse than no score.

`quote` is required and must appear in the student's own text; a point claimed
present with a quote that is not in the answer is dropped. That is a cheap,
effective check on the model agreeing with itself.

This goes to a **new edge function** (`mark-clinical-case`), not `ask-gemini`,
for the reasons in §1a: the medical branch of `ask-gemini` would demand PubMed
references, and its 5-per-minute IP limit would break a college wifi.

### 5c. What the student sees when they are wrong

Not a number alone. In order down the debrief screen:

1. **The proforma they filled, with the gaps shown.** The essential history
   questions they never asked, in red, in the section they belong to — "you
   did not ask about periorbital swelling on waking". This is the single most
   useful thing on the screen and it costs no model call.
2. **The findings they never elicited**, same treatment.
3. **Investigations**: what they missed, and what they ordered that they should
   not have, each with its `teaching` line.
4. **The rubric**, point by point, with a tick or a cross and the quote that
   earned each tick. Missed points shown in the case's own words.
5. **The differential they should have carried**, each with its for/against —
   which is the specific thing a long case is failed on.
6. A one-line **"what an examiner would ask next"**, stored on the case.
7. Retry. The same case, ids cleared. A case is worth working twice.

---

## 6. What it costs, and whether a free app with ads can afford it

Two different calls with two different economics.

### Generation — once per case, shared by everyone

Modelled on the existing functions:

| Component | Size | Source |
|---|---|---|
| Retrieved textbook context | up to 22,000 chars ≈ **5,500 tokens** | `generate-flashcards/textbook.ts:246` default `maxChars`, capped at 80 paragraphs (`:305`) |
| Instructions + schema + anchor | ~1,500 tokens | comparable to the notes prompt |
| Output — full case + rubric | ~3,500-5,000 tokens | the notes function allows `maxOutputTokens: 32000` (deployed v56); a case is smaller than a note |

So roughly **7k in / 4.5k out per case**, on `gemini-3.1-flash-lite` — the
same model the notes and flashcards functions use
(`ask-gemini/index.ts:398`, `generate-flashcards/index.ts:74`).

In money that is negligible. **The binding constraint is not money, it is the
free tier**, which `.agents/rules/60-flashcards.md:137-139` states directly:
*"The free tier is the binding constraint and a deck is one call"*, and
HANDOFF.md records the same for notes. Free-tier limits are requests-per-minute
and requests-per-day, not spend. So the cost question is really a **scheduling**
question: 200 cases is 200 calls, which is a batch run over an evening, not a
burst.

Latency is the harder number. `generate-flashcards` allows 55 s
(`index.ts:75`); the notes function estimates 25 s per batch
(`EST_SECONDS_PER_BATCH`, deployed v56) and `handwrittenNotes.ts:40` waits
25 s *between* batches. A case is a bigger single object than a flashcard deck.
**Expect 20-50 seconds for a first generation.**

That number settles the design: **generation is never on the reader's critical
path.** Cases are pre-generated in batches by a script the owner runs, reviewed,
and then served from the table as an ordinary row read. Opening a case is a
`select`, not a generation. This is the one place this feature differs
structurally from notes and flashcards, and it differs because of §4e — a case
has to be reviewed before it is shown, so it could never have been generated on
demand anyway.

### Marking — once per attempt, per reader

~1,200 tokens in (rubric + three free-text answers), ~500 out. **3-8 seconds.**
Roughly a tenth of a flashcard deck. With 1,176 profiles in production and a
realistic few hundred case attempts a week, this is not a cost problem.

### Does it need an ad?

`mobile/src/lib/dailyAd.ts:28-33` has three independent buckets —
`progress`, `theme`, `questions` — at most one rewarded ad each per day. A
fourth bucket for cases is technically easy and **should not be added.** The
marginal server cost of a case attempt is one small marking call; the expensive
half is amortised across every reader by the shared cache. Putting a rewarded
ad in front of a 15-minute exam simulation buys very little revenue and taxes
the app's most serious feature. If ad load ever needs to rise, `questions` is
the bucket to argue about, not this.

---

## 7. What lives on the phone and what lives in Supabase

Following the rule as it is already applied, not a new one.

| Thing | Where | Why |
|---|---|---|
| The case, its rubric, its grounding | **Supabase** — `clinical_cases`, service-role write, public read filtered `status='approved'` | Identical argument to `flashcards` (`.agents/rules/60-flashcards.md:91-100`): the same case serves everyone, one generation is worth amortising, and it **must be reviewable by a person**, which is impossible if it only exists on one phone |
| Which cases the reader worked, what they typed, their scores | **The phone only** — `mobile/src/lib/caseAttempts.ts`, AsyncStorage, added to `LOCAL_ONLY` in `cloud-ids-check.mjs` | It is the reader's own clinical reasoning, usually clumsy, often wrong on the way to being right. There is no shared cost to amortise and nobody else's revision is improved by it. Same argument as `useUserNotes` and `customDecks` |
| The XP from finishing a case | **Supabase, through the existing path** | Because it is not new data — it is the anchor question being ticked. §8 |
| A report on a bad case | **Supabase**, one RPC, `reportCount` | It is a fact about the shared row, not about the reader |

**One trap, and it will be hit by whoever implements this.** Marking needs the
student's free text to reach the server. That is not the same as *storing* it —
the request is transient and nothing is written. But `check:cloud-ids` bans a
`LOCAL_ONLY` file from so much as **importing** the Supabase client, not just
from calling it (`cloud-ids-check.mjs`, and the comment above the import test:
*"The import is the honest line to draw"*). So the split has to be two files:

- `mobile/src/lib/caseAttempts.ts` — storage. In `LOCAL_ONLY`. Never names
  supabase.
- `mobile/src/lib/caseMarking.ts` — the request to `mark-clinical-case`. Not in
  `LOCAL_ONLY`. Takes the answers as arguments, returns the result, writes
  nothing.

Writing that down here is the point: without it the first implementation trips
`check:cloud-ids` and the tempting fix is to loosen the check, which is exactly
the failure the check exists to prevent.

Say the transient bit out loud on screen too, once, where the free-text field
is: *"Your answer is sent to be marked and is not stored on our servers."*
That is true and worth being true.

---

## 8. XP, and why cases must not get their own

`xp.ts` is one file because it was three, and it had already drifted once
(`.agents/rules/90-xp.md:24-28`). `yearXp` counts ticked bank questions
(`xp.ts:49-55`) and the web app computes the same number from
`src/lib/rewards.ts`. **Do not add a case XP.**

Proposal, in two parts:

1. **Finishing a case ticks its anchor question.** The case is anchored to a
   real bank question (§4a); completing it is at least as much evidence of
   having done that question as tapping its checkbox. Route it through the
   existing `markDone` path, which already syncs
   (`progress.ts:211`, `record_questions_done` at `:243`). XP, the level, the
   badges, the streak, the leaderboard and the web app all follow with no new
   code and `check:xp` still passes.
2. **Show a case count that is explicitly not XP.** "14 cases worked · 9
   passed" on My Progress. The number people want from this feature is how many
   cases they have done, and a count is that. It carries no economy and nothing
   has to agree with it.

The obvious objection is that a 15-minute case is then worth the same 1 XP as a
tap. That is real. But the alternative — cases worth 5 XP — makes the phone and
the browser disagree about a shared number for anyone with both installed,
which is precisely the bug `90-xp.md` was written about. **If the owner wants
cases to be worth more, that is a change to `src/lib/rewards.ts` and
`mobile/src/lib/xp.ts` in one commit, with `check:xp` extended to cover it, and
the web app has to learn what a case is.** It is not a native-side decision.

A milestone toast on finishing a case is fine and needs no new economy —
`XpToast` already fires from the root on any tick (`.agents/rules/90-xp.md:44`).

---

## 9. Navigation

**Not a sixth tab.** `BottomNav.tsx:16-22` is five items and positions its
selection blob from `width / 5` arithmetically (`:24-32`); `CLAUDE.md` records
that the 1.15 text-size ceiling is set by "My Progress" fitting in a fifth of
the bar. A sixth item breaks the geometry and the accessibility ceiling
together.

**Three entry points, in order of how much they will be used:**

1. **From the question row itself.** This is the one that matters. A question
   that has an approved case gets a small marker (the same treatment as the
   repeat-count circle and the page-ref chip) and offers **"Work this as a
   case"**. Because every case is anchored to a question (§4a), a case
   *belongs* to a row — the navigation already exists, it just needs a
   destination. It also makes the feature discoverable to someone who was not
   looking for it, which a new tab never does.
   The batch fetch has to follow `pageRefs`' rule: one query per screen keyed
   by question id, never one per row (`.agents/rules/98-page-references.md`,
   "A topic can hold five hundred questions").
2. **Notes tab → "Clinical cases"**, a third row beside Notes and Anki
   flashcards, taking over the tab exactly as flashcards does
   (`NotesScreen.tsx:71-76`, rendered `:141`, entered `:304`). Then year →
   subject → chapter → case list, reusing the drill-down that already exists.
   This is where someone goes when they want to *practise cases*, as opposed to
   practising a question.
3. **`HomeMenuSheet` → STUDY** (`HomeMenuSheet.tsx:104-137`), one row. Free.

Rejected, with reasons:

- **A sixth tab** — geometry and text scale, above.
- **Inside Ask AI** — Ask AI is a chat, a case is a structured multi-step form,
  and `askAi.ts` owns that request shape. Putting a case there would mean
  either a second request builder (forbidden by the file's own contract) or
  routing a case through `ask-gemini`'s medical branch, which appends PubMed
  references to everything (`index.ts:497-513`).
- **A new stack under Home** — Home's stack is the bank drill-down
  (`RootNavigator.tsx:29-35`). A case list is a sibling of flashcards, not of
  BrowseNode.

**Screen by screen, for the long case.** Each is a screen in a small stack
inside the Notes-tab takeover, with a persistent progress strip at the top
(`HISTORY · EXAMINATION · INVESTIGATIONS · DIAGNOSIS · MANAGEMENT`) and the
"Simulated case" line under it.

| # | Screen | What is on it | What the student does | What happens next |
|---|---|---|---|---|
| 1 | **Case list** | Cards: subject, chapter, one-line stem, `long case · 45 min`, a tick if worked | Tap one | Push the stem |
| 2 | **The stem** | Two or three lines only — "4-year-old boy, brought by mother, swelling of face for 10 days. District hospital OPD." A timer, optional, off by default. "Begin history" | Tap Begin | Push history |
| 3 | **History** | Proforma headings as collapsible sections (Chief complaint, HPI, Past, Personal, Family, Treatment — or BINDS for paediatrics, the obstetric block for OBG). Inside each, the `ask` strings as tappable rows. A search field at the top, because 60 items is too many to scroll. Asked questions move into a **transcript** pane above with the patient's reply. | Taps questions; reads replies. No typing. | "Done — examine the patient" |
| 4 | **Examination** | Same interaction, sections General / Vitals / (Anthropometry) / CVS / RS / Abdomen / CNS / Local. Findings accumulate into the same transcript. Numeric findings render as a value with its normal range. | Taps manoeuvres | "Done — investigations" |
| 5 | **Investigations** | A list with no weights shown. Ordered ones reveal their result. A running "3 ordered" count, no cost shown (showing cost would be teaching the answer). | Taps a few | "Done — my diagnosis" |
| 6 | **Diagnosis** | Two text fields: *Provisional diagnosis* (one line) and *Differential diagnosis, with the point for and against each* (multi-line). The transcript is reachable from a button — a real student has their own notes in front of them. `KeyboardSafe`, `keyboardShouldPersistTaps="handled"`. | Types | "Management" |
| 7 | **Management** | One multi-line field. Placeholder names the expected shape: "Immediate / definitive / supportive / follow-up." A line under it: *"Name drugs and principles. Do not write doses — this case does not mark them."* | Types | Tap **Submit**, which calls `Keyboard.dismiss()` first (`.agents/rules/80-keyboard.md`) |
| 8 | **Marking** | A spinner with an honest line: "Marking your answer — a few seconds." Everything except the free-text half is already scored locally, so the two halves can be shown as they arrive. | waits 3-8 s | Debrief |
| 9 | **Debrief** | §5c, in that order. Bottom: **Work it again**, **Report this case**, and if the reader is done, the anchor question is ticked with the usual toast. | | Pop back to the list |

Reduced motion, `Touchable` labels on every pick row, and `check:edges` if any
of this is presented as a `<Modal>` rather than pushed — all non-negotiable and
all covered by existing rules.

---

## 10. The smallest first version

**v1: General Medicine, 20 hand-reviewed long cases, no on-demand generation.**

Why General Medicine: most questions (691), a real textbook in the bucket
(`medicine/manipal_medicine_part1-3.txt`, three parts), one proforma variant,
and it is the subject where the long case is the highest-stakes part of the
practical.

What ships:

1. **Table** `clinical_cases` + RLS shaped like `flashcards` (service-role
   write, `status='approved'` read) + one migration. Queued through
   `.agents/tasks/supabase-pending.json` if the session has no Supabase route
   (`.agents/rules/70-supabase.md`).
2. **Edge function `generate-clinical-case`** — anchor in, validated case out,
   `noCache` honoured, reusing `textbook.ts`'s `buildTextbookContext` and
   `pickBookKeys` verbatim rather than a second copy (the same reason
   `generate-flashcards` reuses them).
3. **A batch script** the owner runs — pick 20 anchors, generate, write as
   `status: 'draft'`.
4. **Admin review** in the existing panel: case + rubric + grounding, approve /
   reject.
5. **Edge function `mark-clinical-case`** — rubric-point matching only, keyed
   rate limit on the user id, `verify_jwt: true` like `generate-flashcards`.
6. **Client**: `lib/clinicalCases.ts` (fetch + cache), `lib/caseAttempts.ts`
   (AsyncStorage, `LOCAL_ONLY`), `lib/caseMarking.ts` (the one request),
   `screens/CaseScreen.tsx` + the six step views, entered from
   `NotesScreen` and from the question row.
7. **`npm run check:cases`** — that the row shape validates, that a case with a
   bad `Measurement` is rejected, that a malformed marking response is
   discarded rather than half-rendered (the `check:mcq` pattern), that
   `caseAttempts.ts` does not import supabase, and that no rubric string
   matches the dose regex.
8. **`check:smoke` flow** — open a case, ask three history questions, do two
   examinations, order one investigation, type a diagnosis, submit with a
   stubbed marker, assert the debrief names a missed essential question.
   Selected by accessibility label.
9. Screenshots through `preview/shoot.mjs`, delivered, per
   `.agents/rules/92-verify.md`.

**Explicitly deferred, and each for a stated reason:**

| Deferred | Why |
|---|---|
| Surgery, OBG, Paediatrics proformas | Each is a genuinely different form — local examination of a lump; the obstetric formula and per-abdomen grips; BINDS and anthropometry. Three more forms, three more rubric shapes, three more validators. And OBG is blocked on §1f's unresolved book question |
| Short cases and OSCE stations | A different exercise with a timer and a checklist. Worth doing *second*, because a short case is much cheaper to generate and to mark than a long one — arguably it should be v2 |
| On-demand generation by the reader | 20-50 s latency, and it skips the review that carries the safety claim. Only ever as `noCache` + an unreviewed label |
| Images — ECGs, X-rays, films in the investigation step | Wants the `question_diagrams` pipeline and its identity rules (`CLAUDE.md`, "A question's diagram is looked up by identity, never by words"). A whole second project, and a *wrong* ECG is a serious error |
| Drug doses | §4c |
| Voice viva through `lib/speech.ts` | Real, and a good v3. Needs the dictation module on a device, which no sandbox has |
| A case leaderboard | Second economy (§8) |
| Web app parity | `check:one-app`. Build it natively, once |
| Timed mode | Off by default; a stopwatch is one line but a countdown that fails a student mid-answer is a design decision the owner should make |

---

## 11. Honest objections

Listed because the owner asked for them, roughly in order of how likely each is
to sink the feature.

1. **This is the biggest feature in the app after the question bank, and it is
   not close.** A new table with moderation, two new edge functions, a batch
   script, an admin surface, a six-screen stack that is the most input-heavy
   thing in the app, one new check script, new smoke flows, and four proformas
   if it is ever finished. Notes and flashcards each took multiple sessions
   with far less surface. Judge it against what else the same effort buys.

2. **Medico-legal, and it is not theoretical.** The app would be presenting a
   patient and marking a management plan. It is a study aid for students, and
   the entire distinction between that and clinical guidance is carried by
   framing and by what the app refuses to output. Concretely: the "Simulated
   case — not clinical guidance" line has to be on the case, not in settings;
   no dose ever leaves the server (§4c); generated patients must not name real
   people, hospitals or places; and the app is in Play's medical category,
   where AI-generated management advice presented as authoritative is exactly
   the shape of thing that draws a policy review. None of that is expensive.
   All of it is easy to drop in a later refactor, which is why it belongs in a
   rules file, not a code comment.

3. **The marking of free text is the weakest link and cannot be fully fixed.**
   Rubric-point matching is much better than open marking, but a student who
   writes the right thing in unusual words is still marked down, and one who
   writes fluent nonsense containing the rubric's words is marked up. The
   mitigations — show the rubric, require a quote, let the score feed nothing
   permanent — reduce the harm without removing it. Anyone who claims this is
   solved has not used it.

4. **The bank is thinner grounding than it looks.** Final year carries repeat
   markers on 23% of questions and General Medicine on 0 of 660, and those
   questions were transcribed as "What is X? (Page No: 370)"
   (`CLAUDE.md`). Anchoring fixes the diagnosis and very little else. The
   feature would be substantially better if the ~150 genuinely case-shaped
   questions were used first and the rest deferred.

5. **The obstetrics textbook may not be an obstetrics textbook** (§1f). Both
   the repo copy and the deployed function point the `obstetrics` key at
   `dc_dutta_gynaecology_part{1,2}.txt`. Until one file is downloaded and
   read, every obstetric case would be built on an unknown book.

6. **Two documents in this repo state the opposite of the fact this feature
   depends on** (§1f) — `CLAUDE.md` and `.agents/rules/50-notes.md` both say
   final year has no textbooks. That is exactly the failure mode those
   documents were written about. It should be fixed whether or not this is
   built, and if it is not fixed, the next agent to read the rules will
   correctly conclude this feature is impossible.

7. **Review does not scale, and there is one admin.** `user_roles` has one row.
   Twenty cases is an evening. Two hundred is not. The report mechanism (§4g)
   helps after the fact; nothing helps before it. The realistic ceiling on this
   feature is the number of cases one person will read carefully, and that
   number should be decided before the generator is written, not after.

8. **Latency makes on-demand generation impossible, which makes the feature
   inventory-shaped.** Cases have to exist before anyone wants them. That is a
   different operational posture from every other AI feature in the app, all of
   which generate lazily and cache.

9. **`ask-gemini`'s 5-per-minute IP limit is a live hazard nearby.**
   `index.ts:34-35`, `:276`, keyed on `x-forwarded-for`. On a hostel or college
   NAT that is five requests a minute shared by everyone on it. This feature
   must not copy it, and it is probably worth fixing where it is.

10. **A tapping interface can be gamed and a real long case cannot.** Tapping
    every history question gets the whole history. The irrelevant-item penalty
    is a workaround, not a solution; the honest fix is a cap on how many
    questions may be asked, which is closer to the real exam anyway (you have
    45 minutes) and should probably be in v1 rather than deferred.

11. **It may simply not be what these students want.** The app's traffic is a
    question bank, notes and flashcards — all of them *reading* tools used in
    the days before a written paper. A patient simulator is a *practice* tool
    for a practical exam that happens once. Worth asking a few readers before
    building it, and worth noting that the same effort spent on short cases
    and OSCE stations would produce something used more often, in shorter
    sittings, on a phone.

---

## 12. Open questions for the owner

1. Can you supply a real long-case proforma pad from your college — Medicine
   and Paediatrics at least? Every section heading in §2 should come from that
   rather than from the general literature.
2. How many cases would you personally review before the feature ships, and how
   many a month after? That number is the feature's real size.
3. Should a case be worth more than 1 XP? If yes, it is a change to
   `src/lib/rewards.ts` and `mobile/src/lib/xp.ts` in one commit and the web app
   has to learn what a case is (§8).
4. Long case first, or short case / OSCE first? The short case is cheaper on
   every axis and may be the better v1 (§11.11).
5. `.agents/rules/50-notes.md` forbids naming a textbook to the reader
   (`:52-65`, enforced by `check:textbooks`). The debrief wants to show the
   passage a case was grounded in. Show the passage without naming the book, or
   relax the rule for this one surface?
6. Is the `obstetrics` → `dc_dutta_gynaecology_*.txt` mapping correct (§1f)?

---

## Sources

Repo claims are cited inline by file and line. For §2, which is general
medical-education knowledge rather than anything in this codebase:

- [MBBS DOCTORS — Clinical History Taking and Examination Format](https://medicforyou.blogspot.com/2016/04/clinical-history-taking-mbbs.html)
- [PSM Made Easy — Format for Clinical History Taking](https://ihatepsm.com/blog/format-clinical-history-taking)
- [PSM Made Easy — History taking in a paediatric patient](https://ihatepsm.com/blog/history-taking-paediatric-patient)
- [Geeky Medics — Paediatric History Taking (OSCE guide)](https://geekymedics.com/paediatric-history-taking/)
- [NMC — Competency Based Medical Education Curriculum 2024 (PDF)](https://medicaldialogues.in/pdf_upload/cbme-guidelines-2024-250434.pdf)
- [Medical Dialogues — NMC releases CBME Guidelines 2024](https://medicaldialogues.in/health-news/nmc/mbbs-curriculum-nmc-releases-cbme-guidelines-2024-details-134177)
- [Merck Manual — Evaluation of the Obstetric Patient](https://www.merckmanuals.com/professional/gynecology-and-obstetrics/approach-to-the-pregnant-woman-and-prenatal-care/evaluation-of-the-obstetric-patient)
- [NHM India — Recommended maternity case sheet (L3 facility, PDF)](https://nhm.gov.in/images/pdf/Dakshata_Implementation/GoI_Recommended_Casesheets_LR_Register_Reporting_Tool/Case-sheet-L3.pdf)
