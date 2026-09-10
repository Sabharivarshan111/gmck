---
description: Whether a patient simulator can be built without teaching a medical student something wrong — what this repo already knows about grounded generation, what grounding does and does not buy, and the scope at which the feature is safe
---

# Clinical AI safety — can a patient simulator ship?

Research note for the agent designing the patient simulator. Nothing here is
implemented; no application source was touched.

Repo claims carry `file:line`. Clinical, legal and licensing claims say plainly
where they come from. Where I am reasoning from general knowledge rather than a
source I could open, it says so. **This sandbox cannot reach Supabase**
(`.agents/rules/70-supabase.md`) and the egress proxy blocked
`support.google.com`, `developers.google.com`, `ncbi.nlm.nih.gov` and
`pubmed.ncbi.nlm.nih.gov`, so Play policy and some literature below are
summarised from search results rather than from the primary page. Those are
marked.

---

## 0. The answer, before the reasoning

**Do not build a simulator that generates a case per student on demand and
marks their answers with a model.** That design has no failure mode that is
visible to the student, and every safety mechanism available to it (a second
model pass, a rubric, a schema) checks a different thing from the one that
matters.

**Do build a fixed library of human-reviewed cases** — written by the model,
reviewed one by one by the doctor-owner, stored as data, shipped as data,
identical for every student and correctable in a row rather than in a build.
This is the same shape as `question_diagrams`: a table where the safety
property is "the row is right", not "the matcher is clever". At roughly three
carefully reviewed cases per hour (reasoning below, §5), a 60-case launch
library is about twenty hours of the owner's time, once.

The middle option — generate freely, verify with a second model, ship
unreviewed — is the one that looks responsible and is not. §4 says exactly what
that pass catches and what it structurally cannot.

There is also a **stale premise in the brief**, and it changes the shape of the
problem: final year is no longer ungrounded. See §2.

---

## 1. What "grounded" means in this app today, mechanically

### 1.1 The retrieval

`generate-handwritten-notes` grounds a note by pulling paragraphs out of an
OCR'd textbook in the private `textbooks` bucket. The whole of it is
`supabase/functions/generate-handwritten-notes/textbook.ts`:

- `BOOK_FILES` (line 5) maps a book key to `.txt` chunks in storage — **16
  books**, listed by author filename (`vishram_singh_anatomy_part1.txt`,
  `manipal_medicine_part1.txt`, `op_ghai_paediatrics_part1.txt` …).
- `pickBookKeys(subject, subtopicName, questions)` (line 161) chooses the book
  by **substring match on the subject string**, in a fixed order, because the
  matches overlap.
- `buildTextbookContext` (line 244) loads every paragraph of the chosen book(s),
  tokenises the subtopic name and the questions, drops stopwords (line 91), and
  **scores each paragraph by how many query tokens it contains** (lines
  276–284), with a +6 bonus for containing the subtopic name literally. It
  takes the top paragraphs up to 22,000 characters (lines 293–303).

That is bag-of-words retrieval over OCR text. No embeddings, no chunk metadata,
no page identity, no reranking.

### 1.2 What is done with it

`index.ts:305` calls it, and `index.ts:319` splices the result into the prompt:

```
${refText ? `\nTEXTBOOK REFERENCE (OCR extract; treat as PRIMARY source of truth):\n"""\n${refText}\n"""\n` : ""}
```

Two properties of that line decide everything:

- **When retrieval finds nothing, the block is simply absent.** `textbook.ts`
  returns `""` at lines 250, 263, 271 and 291 — no book for the subject, no
  paragraphs loaded, no query tokens, no scoring matches. The request then
  proceeds *identically to an ungrounded one*, and the note is badged, cached
  and rendered exactly the same. Nothing on screen, in the row, or in the cache
  distinguishes a grounded note from one where retrieval scored zero.
- **"treat as PRIMARY source of truth" is an instruction, not a constraint.**
  The model is free to add anything, and at `temperature: 0.55` with
  `maxOutputTokens: 16000` (`index.ts:113–115`) and a prompt that *demands*
  volume — "at least 10–14 rich, highly detailed sections … clinical staging
  systems (e.g. TNM, CEAP, Child-Pugh, NYHA), emergency and definitive
  step-by-step management protocols" (`index.ts:70`) — the retrieved 22,000
  characters cannot possibly supply all of it. The overflow comes from the
  model's own weights, and reads exactly like the grounded part.

### 1.3 So: what does grounding buy, and what does it not

**It buys:**

- **Vocabulary and framing that match the book the student is examined from.**
  This is the real, large win, and it is not a safety win — it is a relevance
  win. An Indian MBBS student is marked against Park, Ghai, Dhingra, and a note
  in that idiom is more useful than a correct note in an American idiom.
- **A pull towards the local standard of care** where it differs from the
  international one, which for this audience is the correct standard.
- **A reduction in confabulated specifics** for facts that happen to be in the
  retrieved window. If the paragraph about a drug is on screen, the model is
  much less likely to invent its class.

**It does not buy:**

- **Any guarantee that an output sentence came from the source.** There is no
  attribution, no span alignment, no faithfulness check anywhere in the
  pipeline. A note is a single opaque JSON blob; nothing in it points at a
  paragraph.
- **Coverage.** Token-overlap retrieval over OCR misses on synonymy and on OCR
  damage. Zero-match is silent (§1.2).
- **Correctness of the source.** The corpus is OCR'd scans. OCR reliably
  destroys exactly the characters that matter clinically: digits, decimal
  points, units, superscripts, subscripts, and table structure. `5 mg` and
  `5 mcg`, `0.1` and `0.l`, `mmol/L` and `mmoI/L`. `splitParagraphs`
  (`textbook.ts:107`) drops any run under 60 characters and hard-splits at 800,
  so a dosing **table** arrives as decontextualised fragments with the column
  headings possibly in a different chunk. A retrieved fragment that has lost its
  header is worse than nothing: it is a number with a confident book behind it
  and no unit attached to it.
- **Currency.** A book is a snapshot. Nothing in the pipeline knows the edition
  or the year, and by design nothing may say (§1.5).

This is the honest summary: **grounding here is a relevance and register
mechanism that has a modest correctness side-effect. It is not a correctness
mechanism, and it was never architected as one.** For a note, that trade is
defensible — the student reads it as revision alongside their own book. For a
simulated patient whose management the student is *marked* on, it is not
equivalent, because the student has no second source open and the app is
asserting a right answer.

### 1.4 The precedent that says grounding is not currently a gate

`supabase/functions/quiz-from-subtopic/index.ts:135` already ships **ungrounded
MCQs with authoritative correct answers**: no textbook context at all, just the
student's own revised question strings, `temperature: 0.35`, a `responseSchema`,
and a `correctIndex`. Whatever is decided for the simulator, this exists today
and is the closest live analogue to "AI marks the student".

### 1.5 The rule that no book may ever be named, and what it costs

`mobile/scripts/textbooks-check.mjs:150–193` fails the build if any of eleven
author/title strings appears in a rendered string anywhere under `mobile/src`
(comments exempt). `.agents/rules/96-walkthrough.md` extends the same forbidden
list to the tour, and the notes prompt carries it too ("Do NOT mention OCR
errors, editions, or page numbers", `index.ts:66`).

**Consequence for the simulator: you cannot cite your source to the student.**
Not "Ghai, 9th ed., p. 412", not "per the standard paediatrics text". The one
sanctioned phrasing is the tour's: *"grounded in a standard reference for that
subject"*.

That removes the cheapest safety mechanism in existence — letting the reader
check. Two workarounds, both compatible with the rule:

- **Say what kind of thing it is, not which book.** "Model answer, reviewed"
  vs "AI-generated, not reviewed" is a distinction about *provenance in this
  app*, not a bibliography. Nothing forbids it, and it is the single most
  valuable label the feature can carry.
- **Use the page-reference feature, which already names books.**
  `.agents/rules/98-page-references.md`: readers name a book and edition
  themselves, and a page is shown only once three distinct readers agree
  (`reference_books`, `question_page_refs`, `page_ref_quorum()`). Those are
  books *readers* own — the app ships knowing none of them. A case could carry
  the same affordance without the app ever asserting a source.

Note the tension, and do not paper over it: a rule that the app never names its
source, plus a feature that asserts correct clinical management, means the app
is asking to be trusted on nothing but its own say-so. The mitigation is not a
citation; it is that a human actually checked, and that the app says whether one
did.

---

## 2. Correction: final year is grounded now. The brief's crux is stale.

The brief says "final year has no textbook and must fall through to Ask AI —
this is the crux: the simulator's subjects are the ones with NO grounding
available." **That is no longer true**, and three files in the repo still say it
is:

| Says final year has no book | Evidence it is stale |
|---|---|
| `CLAUDE.md:207` — "Eight books cover all of first, second and third year; final year has none" | `src/lib/textbooks.ts:21–29` declares eight more |
| `.agents/rules/50-notes.md:24` — "Final year matches nothing" | `textbook.ts:44–89` lists their storage paths |
| `supabase/functions/generate-handwritten-notes/README.md:50` | contradicted by its own lines 76–80 |

What is actually there, per `supabase/functions/generate-handwritten-notes/textbook.ts:44–89`
and mirrored in `src/lib/textbooks.ts:81–111`:

| Final-year subject | Book (from the storage filenames) |
|---|---|
| Obstetrics | DC Dutta |
| Gynaecology | Shaw's |
| General Surgery | Manipal Manual |
| Orthopaedics | Maheshwari |
| General Medicine | Manipal Prep Manual |
| Paediatrics | OP Ghai |
| ENT | PL Dhingra |
| Ophthalmology | AK Khurana |

`README.md:76–80` states it outright: *"the deployed function is version 52, not
47, and `pickBookKey` now matches the final-year subjects … so 'final year
matches nothing' is no longer true of the deployed code."*
`mobile/scripts/textbooks-check.mjs:33–50` carries all sixteen as the deployed
server's rules and `:97` asserts every final-year subject in the bank matches
one.

**Three caveats before the design leans on this:**

1. **I could not verify the deployed function.** No Supabase route from this
   sandbox. The repo copy at `supabase/functions/generate-handwritten-notes/`
   was re-added in commit `e7a5a1b0` ("integrate all 16 textbooks…"), *against*
   that folder's own README rule that no copy may live here. The exact failure
   this repo has been bitten by twice is a local copy that disagrees with
   production. Read the deployed function through the Supabase MCP connector
   before building on it.
2. **The final-year book selection is doing something the others are not.**
   `pickBookKeys` (`textbook.ts:161`) disambiguates Obstetrics-vs-Gynaecology
   and Surgery-vs-Orthopaedics with **regex keyword lists over the subtopic name
   and the question text** (lines 195–212). That is a keyword heuristic choosing
   a source of truth — precisely the pattern `check:diagrams` exists to forbid
   in the diagram lookup. Getting it wrong grounds an obstetric emergency in a
   gynaecology text. It is more defensible than the diagram case (both books are
   at least in the right specialty, and it falls back to searching both), but it
   is worth knowing it is there before a simulator inherits it.
3. **These are exactly the subjects where OCR damage is most dangerous** (§7).
   Anatomy prose survives OCR. A paediatric dosing table does not.

So the crux is not "the clinical subjects have no grounding". It is: **the
clinical subjects now have grounding of the same quality as everything else,
and that quality was designed for revision notes, not for marked clinical
decisions.**

---

## 3. `parseMcqs`, and the principle worth generalising

`mobile/src/lib/askAi.ts:130–178`. It takes the outermost `[`…`]`, parses it,
and for each item requires a non-empty `question`, four string options
`A`–`D`, and a `correct` in `A`–`D`. Anything else is `continue`d past (line
166). If nothing survives it returns `undefined`, and the caller
(`askAi.ts:226–233`) shows the model's prose instead of rendering cards.
`mobile/src/lib/flashcards.ts:125–143` applies the same rule to deck cards and
names it: *"a broken card in a study deck teaches the wrong thing or nothing,
and there is no way for the reader to tell which."*

**The generalisable principle is the fallback, not the validator.** Precisely:

> When output is not verifiably well-formed, degrade to a mode where the app is
> not asserting anything — and make degrading cheap enough that it is the
> obvious branch to take.

Prose is safe because prose does not claim to be a marked quiz. That is the
whole trick, and it is available to the simulator: a case that fails validation
can be shown as *reading material about a presentation*, or not shown at all,
rather than as a case with a scored answer.

**The ceiling is equally important and is not stated anywhere in the repo.**
`parseMcqs` validates **shape, never truth**. An MCQ whose `correct` points at
the wrong option passes every check in that function and renders as a card. The
existing checks are therefore a defence against *rendering* bugs, not against
*clinical* ones — and no amount of schema work extends them. Anyone reaching for
`parseMcqs` as precedent for "we already handle bad AI output" should be shown
this sentence.

---

## 4. Identity over keyword — does the reasoning carry to clinical content?

The diagram rule is `src/lib/questionDiagrams.ts`: a question's picture is found
by equality on `question_id` (built by `questionDiagramId`, line 71) and by
equality on `question_text`, and by nothing else. The file's own header (lines
9–32) records why every looser test was reverted, ending: *"**No row means no
picture.** A plausible neighbour is worse than a blank."*
`mobile/scripts/diagram-match-check.mjs:268–300` pins it against the real
regression — TCA cycle showing Glycolysis.

**Yes, the reasoning carries, and it carries harder.** The transferable claim is
not about pictures. It is:

> When a wrong answer is *indistinguishable in presentation* from a right one,
> a system that produces a plausible answer for every input is worse than one
> that produces an answer only where it has grounds, because the reader has no
> signal to be sceptical with.

A wrong diagram is at least visibly a diagram of something else — a student who
knows the topic sees it. A wrong investigation sequence in a case *the student
does not yet understand* has no tell at all. That is why the feature is
described in the brief as higher-stakes than anything shipped so far, and it is
correct.

Two consequences for the design:

- **Cases must be looked up by identity, not assembled by similarity.** A case
  belongs to a specific presentation, chosen deliberately. Do not build "find me
  a case like this question" — that is the keyword search returning through the
  side door, with clinical content instead of JPEGs.
- **"No case" must be a first-class outcome.** Most of the 5,700-odd bank
  questions should have no case, exactly as most have no diagram (855 pictures
  across 5,435 rows — `CLAUDE.md:326`).

One thing that does **not** carry: `sectionFor`/`sectionIndexForQuestion`
(`CLAUDE.md:245–258`) allow a heuristic for *placement*, because misplacing a
correct picture costs a paragraph of ordering. There is no clinical equivalent
of that concession. Every part of a case — the vignette, the findings, the
results, the diagnosis, the marking — is content, not ordering. There is no
"safe to be approximately right" layer to put a heuristic in.

---

## 5. Grounding options for the simulator, with licensing

The app is **commercial**: it is on Play, it serves AdMob (`src/lib/adsMode.ts`)
and it takes payments through Razorpay (`mobile/scripts/payments-check.mjs`).
"Free for non-commercial use" is therefore out, everywhere, without exception —
including for text that only ever enters a prompt, since building a product
feature on it is a commercial use of it.

### 5.1 The corpus already in the bucket

The sixteen books in `textbooks` are commercial Indian medical textbooks — DC
Dutta, OP Ghai, Dhingra, Khurana, Park, KD Tripathi, Robbins-adjacent
pathology — OCR'd and stored whole. **State it plainly rather than routing
around it:** this is verbatim reproduction of copyrighted books, and generating
new derivative works (cases) from them at scale is a materially larger exposure
than retrieving a paragraph to inform a revision note. It is also directly
adjacent to a rule this repo already enforces for a much smaller risk — the
Anki licence rule at `.agents/rules/63-anki-import.md:88–95` refuses to copy
AGPL code *at all* because it would relicense the app.

I am not the right agent to give a legal opinion, and I will not pretend to one:
Indian copyright law's fair-dealing provisions and the international position on
training/retrieval are both unsettled and I could not open a primary source from
this sandbox. What I can say without hedging is the engineering consequence:
**the simulator's corpus choice is a decision the owner should make knowingly,
not one an agent should make for him by extending an existing pipeline.**

### 5.2 Corpora that are lawfully usable commercially

Verified this session via search (primary pages were egress-blocked; links at
the end):

| Corpus | Licence | Commercial? | Fit for MBBS-India |
|---|---|---|---|
| **PMC Open Access — commercial-use subset** (CC0 / CC BY / CC BY-SA / CC BY-ND), bulk via NCBI FTP | per-article, machine-readable | **Yes**, that subset only | Good for pathophysiology and evidence; poor for "what an Indian examiner wants written" |
| **MedlinePlus** health-topic summaries, US federal work | public domain (with labelled exceptions) | **Yes** | Patient-level, too shallow for MBBS |
| **CDC / NIH / NLM** federal content | generally public domain | **Yes** | US practice; useful for definitions, wrong for local protocols |
| **data.gov.in** and Indian government open data under **GODL-India** | explicit worldwide royalty-free licence covering commercial derivative works, attribution required | **Yes** | Epidemiology, national programme data — directly relevant to Community Medicine |
| **StatPearls** | CC BY-NC-ND 4.0 | **No** — NC *and* ND | Would be ideal on content grounds. Excluded. |
| **WHO publications** | CC BY-NC-SA 3.0 IGO by default | **No** without written permission | Excluded unless permission is obtained per title |
| **NICE guidelines** | own licence, commercial re-use needs a NICE licence | **No** by default | Not verified this session; assume no |
| **MIMIC / PhysioNet clinical notes** | credentialed access + DUA forbidding redistribution | **No** | Cannot ship |
| **UpToDate, MSD/Merck Manual, Amboss, Osmosis** | proprietary | **No** | Do not scrape |

Two more worth naming because they will be suggested:

- **Wikipedia / WikiDoc** — CC BY-SA. Commercial use *is* allowed, but ShareAlike
  is viral over derivative text, and the medical-accuracy variance is exactly
  the wrong variance for this feature.
- **MedQA / USMLE-style question datasets** — the dataset wrapper may be
  permissively licensed while the underlying exam items are not. Do not treat a
  GitHub `LICENSE` file as clearance for the content inside it.

### 5.3 The third option, and the one actually recommended

**Neither retrieve nor free-generate: author.** The safest corpus for this
feature is a small one the owner writes or approves himself, stored as rows.
Generation becomes drafting assistance for a doctor, not a content source for a
student — which is the only configuration where "the model was wrong" has a
human between it and the exam.

---

## 6. Verification — what a second pass catches, and what it will not

### 6.1 The three mechanisms, honestly ranked

**A structured schema** (`responseSchema`, as `quiz-from-subtopic` already uses)
catches: missing fields, wrong arity, an out-of-range index, a malformed stage.
It catches **zero** clinical errors. It is necessary and worth ~0% of the safety
budget.

**A rubric / deterministic checks** catch a narrow but genuinely valuable band,
because some clinical wrongness is *structural*:

- a drug named in management that is not in the app's own allow-list;
- a numeric value with no unit, or a unit that is not in an allow-list for that
  analyte;
- a paediatric case with a weight-based dose anywhere in it (should be refused
  outright, §7);
- internal contradiction: the stated diagnosis does not appear in the marking
  key; an investigation result contradicts the diagnosis; the age in the
  vignette contradicts the age in the stem;
- **any number at all** — because most catastrophic errors in this domain are
  numeric, a rule of "a case containing a dose, a rate or a threshold is
  quarantined for review" is a cheap, high-recall filter with no cleverness in
  it.

**A second-model pass ("LLM as judge")** catches: fluent nonsense, gross
category errors, obvious internal inconsistency, and cases where the writer
model was uncertain and it shows. It is real and it is worth doing. What it will
not catch:

- **Errors both models share.** The judge and the writer are trained on
  overlapping corpora and fail in correlated ways. This is the central
  limitation and no amount of prompt engineering removes it: the errors that
  survive a second pass are precisely the *plausible* ones — the subtly wrong
  diagnostic threshold, the investigation in the wrong order, the drug that is
  second-line in India and first-line in the source the model learned from.
  Those are also the errors that do the most damage to a student, because a
  student cannot tell them from the truth either.
- **Local standard-of-care mismatches**, unless it is explicitly given the local
  guideline to compare against — which returns you to the corpus problem.
- **Its own confidence being wrong.** Judge models are systematically more
  confident than accurate, and a high verifier score is not evidence.

Published evidence, honestly caveated: an evaluation of AI-generated medical
MCQs with expert review reported roughly **87% factually accurate, ~9% minor
inaccuracies, ~4% misleading**, with realism and distractor quality lower still.
I could not open the paper (NCBI/PubMed egress-blocked) and could not confirm
which of two candidate 2025 papers those figures belong to, so treat the exact
numbers as indicative, not citable. Separately, *Academic Medicine* 2025;
100(10):1163–1166 published an evaluation of LLM clinical vignettes and MCQs for
postgraduate education — that citation I confirmed from two independent search
results but could not read. Work published on self-verification also reports
that models detect well under two thirds of their own hallucinations; I saw that
claim in search results with arXiv identifiers I could not verify, so **do not
cite a number for it** — the qualitative point (self-checking is materially
weaker than independent checking) is safe; the figure is not.

Take the ~4% "misleading" figure at face value for a moment, because the
arithmetic is the argument: a 60-case library, each case carrying perhaps 40
checkable clinical assertions, is ~2,400 assertions. At even 1% misleading after
a verifier pass, that is ~24 wrong clinical statements shipped, each one read by
every student who opens that case, each one indistinguishable from the other
2,376.

### 6.2 The one verification idea in this repo that actually generalises

`.agents/rules/98-page-references.md`: a page number is shown to everybody only
once **three distinct readers** have submitted the same one, and the quorum
lives in Postgres — a `unique (question_id, book_id, user_id)` so a second
submission corrects rather than adds, non-anonymous sessions only, counts behind
a `SECURITY DEFINER` function so nobody can watch for a value one vote short.

Applied to the simulator this is the strongest mechanism available that does not
cost the owner's time: **let students flag a case, and take a flagged case
down** — not out of correctness by vote, but as a fast quarantine. The
asymmetry is right: three readers cannot make a case correct, but three readers
saying "this is wrong" is more than enough grounds to hide it pending review.
`.agents/rules/99-admin.md` notes the quorum's own limit ("it does not stop three
people being wrong"), which is why it feeds moderation rather than replacing it.

---

## 7. Human review — what a workable queue looks like, and its real rate

### 7.1 The queue

Everything needed for this exists already and should be reused rather than
rebuilt:

- **The gate.** `hooks/useIsAdmin.ts` → `is_admin()` reading `user_roles`, with
  every admin function `SECURITY DEFINER` and checking the role itself
  (`.agents/rules/99-admin.md`). Never an email compared in the client — the app
  ships as an APK from a public GitHub release.
- **The surface.** `mobile/src/components/AdminPanel.tsx` at the bottom of My
  Progress; and per the same rule, **generation belongs in the web panel, not
  the phone** — diagram generation already stays there because it needs a key
  pasted in. Review on the phone (reading, approving, rejecting) is fine.
- **The states.** A case row wants exactly: `draft` (generated, invisible),
  `approved` (visible), `rejected`, `quarantined` (was visible, flagged). Only
  `approved` is ever fetched by the app. Default `draft`, enforced by RLS, so a
  forgotten step fails closed.

The single most important property: **a case is a row, so a wrong case is fixed
by editing a row, and every install picks it up with no build.** That is the
diagram table's healing property (`CLAUDE.md:279–281`) and it is worth more here
than anywhere else in the app.

### 7.2 The rate — reasoning from general knowledge, not a source

A simulator case as the brief describes it (history, examination,
investigations, diagnosis, management, plus a marking key) is on the order of
800–1,500 words and perhaps 30–60 discrete checkable clinical assertions.
Reviewing that properly means checking the ones that matter against a reference
the reviewer trusts, not reading it for plausibility — reading for plausibility
is what the model already did.

My honest estimate, and I want the uncertainty on the record:

| Mode | Per case | Per hour | What it catches |
|---|---|---|---|
| Skim for plausibility | 3–5 min | 12–20 | Gross errors only. Roughly the same class the verifier already caught. Close to worthless as a *safety* step, and dangerous because it produces an "approved" badge. |
| **Proper review** — every number, drug, criterion and sequence checked | 15–25 min | **~3** | The band that matters |
| Review + rewrite of the wrong parts | 30–45 min | 1.5–2 | — |

So: **~3 cases per hour, sustained for maybe two to three hours before attention
degrades.** A 60-case launch library is roughly 20 hours; 200 cases is a
part-time month. That is the number the feature's scope has to be designed
around, and it is why on-demand generation is not merely risky but arithmetically
unreviewable — one student can generate more cases in an evening than the owner
can review in a week.

Three things that raise the rate without lowering the bar:

- **Review the assertions, not the prose.** If the case is stored as structured
  fields, the reviewer can be shown only the checkable ones (diagnosis, each
  investigation and its result, each management step, every number) as a list.
  Most of the word count is vignette narrative and needs a glance, not a check.
- **Quarantine-by-rule before review** (§6.1) so the reviewer's scarce attention
  lands on the cases that contain numbers.
- **Batch by subject.** Ten cardiology cases in a row is far faster than ten
  across ten specialties, because the reference is already open.

---

## 8. Scope limits as the primary safety mechanism

The brief asks whether a version exists that is useful and much less risky. Yes
— several, ordered by risk.

### 8.1 The one I would build: a reviewed case library

Fixed set. Human-approved. Identical for every student. Structured rows.
Flaggable. Correctable without a build. Everything above applies to this and
this is the recommendation.

### 8.2 Genuinely lower-risk variants, if the library is too much work

These are worth taking seriously rather than treated as consolation prizes:

- **History-taking and examination *technique*, not diagnosis.** "Which
  questions would you ask?", "which manoeuvre, and what are you feeling for?"
  Being marked on *asking about drug history* is safe in a way that being marked
  on *choosing amoxicillin* is not: technique is stable, non-numeric, examined
  as such in every OSCE, and the failure mode of a wrong item is a student who
  asks a redundant question.
- **Ordering and reasoning without asserting a threshold.** "Which of these
  would you do first, and why" over a fixed, reviewed list of steps.
- **The viva rehearsal.** The app already generates worked answers to real
  past-year questions. A conversational layer over an *existing, already-cached*
  note is a smaller step than a new clinical content pipeline, and inherits
  whatever review that note has.
- **A case that is entirely the student's own reasoning**, where the app never
  states a right answer, only structures the encounter and asks the student to
  justify. Useless for marks; genuinely useful for practice; carries almost no
  clinical risk. Worth prototyping first precisely because it is cheap to build
  and reveals whether students want the *interaction* or the *marking*.

### 8.3 On "cases drawn only from the 5,634-question bank"

I checked this specifically, because it is the most attractive-sounding scope
limit in the brief and **it does not do what it appears to do.**

The bank is question **strings only**. `src/data/topics/generalMedicine.ts:9–29`
is representative:

```
"Quinolones (Page No: 0446)",
"Management of Shock (Page No: 0171)",
"Anaphylactic Shock (Page No: 170, 1408)",
```

No answers. No model answers. No clinical content of any kind. (Question count:
my crude count over `src/data/topics/` gives **~5,703**; `HANDOFF.md` says
5,523; the brief says 5,634. All three are in circulation and none is verified —
worth settling before any of them appears on screen.)

So "drawn from the bank" constrains only the **topic**. Every clinical fact in
the case — the vignette, the findings, the results, the correct diagnosis, the
management, the marking key — is still generated. **The bank narrows what a case
is about; it does not make any statement in the case true.** It is a useful
scope limit for relevance and for keeping the library finite and exam-aligned,
and it should be used. It is not a safety mechanism, and it should not be
presented to the owner as one.

---

## 9. What must never be generated at all

Concrete list. These are refusals to build, not prompt instructions —
implemented as a rejection of the generated case, in the same spirit as
`isDeckCard` (`mobile/src/lib/flashcards.ts:125–143`) dropping a card rather
than showing it.

**Never, under any grounding:**

1. **Any drug dose, and every component of one** — amount, units, frequency,
   route, duration, infusion rate, titration step, maximum. Including "usual",
   "typical" and "e.g.".
2. **Weight-based or body-surface-area dosing of any kind.** Paediatrics is the
   named danger and the one the app has a textbook for; the mg/kg error is the
   canonical harm case in this domain, the arithmetic is exactly what an LLM
   does unreliably, and OCR of a dosing table is exactly where the source is
   most damaged.
3. **Neonatal and obstetric numerics** — gestational thresholds tied to an
   action, birth-weight cut-offs, oxytocin/magnesium regimens, resuscitation
   parameters.
4. **Emergency and resuscitation protocols** — ACLS/BLS/NALS/ATLS sequences,
   defibrillation energies, adrenaline in anaphylaxis or arrest, RSI drugs,
   fluid-resuscitation volumes, transfusion triggers.
5. **Anything anticoagulant, insulin, chemotherapy, opioid, or radiotherapy**
   dosed or scheduled. The classic ten-fold and unit errors live here.
6. **Antimicrobial regimens as authoritative**, and national-programme regimens
   in particular (RNTCP/NTEP, NACO, NVBDCP). These are jurisdictional, change on
   a policy cycle, and are examined *as* the national schedule — a stale one is
   wrong twice over.
7. **Numeric diagnostic thresholds stated as the criterion** — cut-offs,
   staging boundaries, scoring-system thresholds. A named criterion may be
   *referred to*; its numbers must come from a reviewed row, not a model.
8. **Contraindications and interactions**, in either direction. "Safe in
   pregnancy" is the most dangerous sentence the model can produce, and its
   absence is not detectable by any check in §6.
9. **Anything that could read as advice for a real person.** No "if your
   patient…", no free-text symptom entry that the case then reasons about. The
   moment a student can type a real presentation in, the feature has changed
   category — legally, in Play's eyes, and in fact.
10. **Named real individuals, institutions, or real patient data.** Cases are
    fictional and must say so.

**Allowed to be generated (still reviewed):** the vignette narrative;
demographics and social history; the *names* of examination findings and
investigations; the *shape* of a reasoning sequence; distractors and
non-clinical prose.

**The rule that makes the list enforceable:** if a case must contain a number to
be a good case, the number comes from a **reviewed field on the row**, not from
generation. A case with a `null` there is a draft, not a case.

---

## 10. Play policy, disclaimers, and where they go

All Play claims below are from search-result summaries of Play Console Help
pages — `support.google.com` and `developers.google.com` are both egress-blocked
here, so **verify each against the live policy page before relying on it.**

### 10.1 Is the app in scope?

**Yes, already** — the simulator does not put it in scope, it deepens an
existing obligation.

- Google Play's **Health apps declaration** is required of every published app
  and includes a **"Medical reference and education"** category, described as
  educational resources for healthcare professionals and patients, including
  medical encyclopedias, treatment guidelines and symptom checkers. A qbank with
  AI notes and quizzes sits in it today. Nothing in the repo records this
  declaration having been made — no `.md` in the repo mentions it — which is
  worth confirming in the Console.
- The **Health Content and Services** policy prohibits misleading health claims
  that contradict existing medical consensus or could cause harm, and requires
  regulatory proof **or a disclaimer** for apps offering medical functionality.
  Where an app makes a health/medical claim it must disclose the claimed
  benefit, the basis of the claim, the intended users, and required disclaimers.
  Reporting summarised a January 2026 enforcement phase adding a "medical device"
  labelling dimension — unverified, and worth checking, because "a tool that
  assesses clinical decision-making" is a phrase that sits closer to that
  boundary than anyone would like.
- The **AI-Generated Content** policy requires generative-AI apps to provide an
  **in-app way to report offensive AI-generated content**. **I found no
  reporting or flagging affordance anywhere in this app** (searched
  `mobile/src/` and `src/` for report/flag strings — no matches), and the app
  already ships four generative features (Ask AI, notes, flashcards, quizzes).
  This looks like a live compliance gap independent of the simulator, and the
  flag control §6.2 wants for quarantine would close it.

**Framing matters and is cheap.** "Exam practice for medical students" is a
different regulatory object from "clinical decision support". Every string in
the app, the listing and the screenshots should say the former. Do not use
"diagnose", "assess", "recommend", or "clinical decision" in user-facing copy
about this feature.

### 10.2 What the app must say, and where

What exists now:

- `mobile/src/screens/AskAiScreen.tsx:594–598` — a `Sparkles` icon and the
  words **"AI-generated content"** under the composer. That is the entire
  in-app disclosure.
- `src/pages/TermsOfService.tsx:44–52, 75–86` — the web app's Terms carry
  "educational purposes only … not a substitute for professional medical advice"
  and an AI Disclaimer ("AI responses may not always be accurate or complete").
  The **native app has no Terms screen**, so on the phone none of that is
  reachable.

For a simulator, the minimum is:

1. **On the case itself, persistently visible** — not a one-time modal, not
   buried in Settings. One line, at the point of use: *"Simulated case for exam
   practice. Not a real patient and not clinical guidance."* The app's own
   precedent for this is Settings' note that DND mutes tap sounds
   (`CLAUDE.md:549–551`) — the explanation lives where the confusion happens.
2. **A provenance badge per case**: reviewed vs not. If the answer is "not
   reviewed", the case should not be shipped (§0), which makes this badge
   trivially "Reviewed" — and that is the point of having it.
3. **A first-run acknowledgement** for the feature, once, that says it is
   fictional and for exam practice.
4. **A flag control on every case** — Play requires one for generative content
   anyway, and it is the quarantine trigger.
5. **A Terms/About screen in the native app** carrying the web app's clauses.
   Its absence is a gap today.
6. **Play listing text** naming it as exam practice, plus the declaration form
   updated. `.agents/rules/63-anki-import.md:99–103` is the precedent for
   recording a listing-level obligation in the rules files, since no check can
   enforce a Console field.

A disclaimer does not make wrong content safe. Its honest function is to set the
student's expectation and to keep the app on the right side of a policy line —
it is the last layer, not a substitute for the first four.

---

## 11. Recommendation

**Build:** a fixed, human-reviewed library of structured cases; identity lookup;
draft/approved/quarantined states behind the existing `is_admin()` gate; a flag
control; hard refusal of every category in §9; a persistent per-case disclaimer;
a native Terms screen. Start at 20–40 cases in two or three subjects the owner
is most confident in, and let the flag rate over a release decide whether it
grows.

**Do not build:** per-student on-demand case generation; AI marking of free-text
clinical answers as right or wrong; anything that emits a dose; anything that
accepts a real presentation as input.

**If the reviewed library is more work than the owner wants**, build §8.2's
technique-and-reasoning version instead. It is genuinely useful, students will
recognise it as exam-shaped, and it does not require anyone to certify a
clinical fact.

**What I would not do is ship generated-and-verified-only.** It is the option
that looks like diligence, and §6 is the reason it is not: the errors that
survive a verifier are the plausible ones, which are the ones that teach.

---

## 12. Things the design agent should check that I could not

1. **Read the deployed `generate-handwritten-notes` through the Supabase MCP
   connector** and confirm the sixteen books are live and their storage objects
   exist. The repo copy contradicts its own README's rule about existing.
2. **Fix the stale claim** in `CLAUDE.md:207`, `.agents/rules/50-notes.md:24`
   and `README.md:50` once (1) is confirmed. Three files currently tell the next
   agent something false about which subjects are grounded, and the brief for
   this research inherited it.
3. **Settle the question count** — ~5,703 / 5,523 / 5,634.
4. **Confirm the Health apps declaration** is filed in the Play Console and
   which categories are ticked.
5. **Verify every Play claim in §10** against the live policy pages; they were
   unreachable from this sandbox.
6. **Decide the corpus question at owner level** (§5.1) before any pipeline is
   written that depends on the answer.

---

## Sources

Repo (all verified this session): `src/lib/textbooks.ts`,
`src/lib/questionDiagrams.ts`, `src/data/topics/generalMedicine.ts`,
`src/pages/TermsOfService.tsx`, `mobile/src/lib/askAi.ts`,
`mobile/src/lib/flashcards.ts`, `mobile/src/screens/AskAiScreen.tsx`,
`mobile/scripts/textbooks-check.mjs`, `mobile/scripts/diagram-match-check.mjs`,
`mobile/scripts/payments-check.mjs`,
`supabase/functions/generate-handwritten-notes/{index.ts,textbook.ts,README.md}`,
`supabase/functions/quiz-from-subtopic/index.ts`, `CLAUDE.md`, `HANDOFF.md`,
`.agents/rules/{50-notes,60-flashcards,63-anki-import,70-supabase,96-walkthrough,98-page-references,99-admin}.md`.

Web (search-result summaries; the primary pages listed were egress-blocked from
this sandbox — verify before relying on them):

- [Health Content and Services — Play Console Help](https://support.google.com/googleplay/android-developer/answer/16679511?hl=en)
- [Health app categories and additional information — Play Console Help](https://support.google.com/googleplay/android-developer/answer/13996367?hl=en)
- [Provide information for the Health apps declaration form — Play Console Help](https://support.google.com/googleplay/android-developer/answer/14738291?hl=en)
- [Developer Program Policy — Play Console Help](https://support.google.com/googleplay/android-developer/answer/16944162?hl=en)
- [Understanding Google Play's AI-Generated Content policy](https://support.google.com/googleplay/android-developer/answer/14094294?hl=en)
- [Google Play requiring gen AI apps to let you easily report offensive content — 9to5Google](https://9to5google.com/2023/10/25/google-play-gen-ai-policy/)
- [StatPearls — NCBI Bookshelf](https://www.ncbi.nlm.nih.gov/books/NBK430685/) (CC BY-NC-ND 4.0)
- [CC BY-NC-ND 4.0 deed — Creative Commons](https://creativecommons.org/licenses/by-nc-nd/4.0/deed.en)
- [WHO copyright, licensing and permissions](https://www.who.int/about/policies/publishing/copyright) (CC BY-NC-SA 3.0 IGO default)
- [MedlinePlus — linking to and using content](https://medlineplus.gov/about/using/usingcontent/)
- [Government Open Data License — India](https://www.data.gov.in/Godl)
- [PubMed Central FTP service — OA subset by licence group](https://pmc.ncbi.nlm.nih.gov/tools/ftp/)
- [Large Language Model Clinical Vignettes and Multiple-Choice Questions for Postgraduate Medical Education, *Academic Medicine* 2025;100(10):1163–1166](https://academic.oup.com/academicmedicine/article/100/10/1163/8361638) — citation confirmed, full text not read
- [Evaluating the ability of AI models to generate level-specific medical MCQs with variable difficulty — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12934029/) — likely source of the 87%/9%/4% figures; **not confirmed**
