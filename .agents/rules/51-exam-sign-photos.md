# Photographs for the general examination

Every case sheet opens with the same line — Pallor, Icterus, Cyanosis,
Clubbing, Koilonychia, Lymphadenopathy, Edema — and that part of clerking
cannot be taught in words. Nobody has learned what koilonychia looks like by
reading "spoon-shaped nails". So each sign in `mobile/src/lib/generalExamSigns.ts`
carries a **photograph**, and a sign with none stays text-only rather than
borrowing a drawing.

## Only two licences, and the attribution is shown

Public domain, or a Creative Commons licence permitting **commercial use**.
NC and ND are refused. This app ships on Play under a real developer account
and a clinical photograph is usually of a real patient and usually somebody's
copyrighted work, so a wrong licence is a takedown and possibly the account.

`credit` and `licence` are displayed under the picture. A CC-BY attribution
nobody displays is a licence nobody is keeping.

## The sandbox cannot fetch. The runner can.

The egress gateway blocks `commons.wikimedia.org` outright, the same way it
blocks the Supabase host. The split is:

- the **agent** decides *which* picture — `search`, `commonsFiles` and
  `titleMustContain` in `generalExamSigns.ts`;
- `.github/workflows/exam-sign-images.yml` on a **runner** fetches it;
- `supabase-tasks.yml` uploads whatever lands in `public/diagrams/`.

Do not try to download one from a sandbox and do not work around the block.

## Namespace 6 is *files*, not images — say `filetype:bitmap`

This is the rule that cost seven signs their photographs, and it looked
exactly like "Commons has nothing suitable".

Commons is full of Internet Archive scans of 19th-century medical textbooks.
They are files, they are in namespace 6, and their OCR'd text mentions every
clinical word there is. Searching `palmar erythema liver` returned **eight
PDFs and no photograph**; `moon facies cushing` returned a 1657 polyglot bible
and a 1914 issue of *The Billboard*. The result window was full before a
photograph could compete, the MIME check then refused all of them correctly,
and the sign was recorded as having nothing available.

That conclusion was wrong. `File:Palmar erythema.jpg` exists, is CC BY-SA 3.0,
and this app already uses it through `curatedExamPhotos.ts`. It never appeared
in its own search.

**Every search must carry `filetype:bitmap`.** It narrows the corpus and
weakens nothing: the title gate and the licence gate both still run on
whatever comes back.

## A blank is a correct outcome, and must stay actionable

Three things may never be done to fill one:

- **Do not loosen `titleMustContain`.** Commons full-text search ranks the
  file *page*, so a page that merely mentions a word ranks for it. The first
  run of this workflow took the first freely-licensed hit and was wrong for
  five signs of nineteen: "clubbing" returned a portrait of a film-maker,
  "platonychia" a Roman bronze nail cleaner, "palmar erythema" chemotherapy
  hand-foot syndrome. A plausible wrong picture is worse than a blank, because
  the student is looking at it precisely because they cannot yet tell.
- **Do not take an NC or ND image.**
- **Do not substitute a drawing.** A drawing is the right answer for the
  anatomy plates and the wrong one here: a sign has to be recognised against a
  real hand in an exam hall.

What may be done: name the file. `commonsFiles` on a sign lists candidate
Commons titles tried **before** the search, still subject to the same licence
and MIME checks. Naming a file *is* the corroboration, and a stronger one than
a substring of a title, so the title gate is not applied to those. A title
that does not exist prints a `miss` line and falls through.

A sign that comes back blank prints **what was on offer** and whether each hit
was refused by the title gate or by its licence. Keep that. A run that prints
only `NONE` leaves the next person repeating the search by hand to find out
whether the problem is the gate, the licence, or the corpus — which is exactly
how the `filetype:bitmap` bug survived.

## Where a photograph ends up

- `public/diagrams/signs/<id>.jpg` and the generated manifest
  `mobile/src/lib/examSignImages.ts` (attribution lives here).
- `mobile/src/lib/curatedExamPhotos.ts` — files a human reviewed by eye,
  with a caption saying what the picture does and does not show. The caption
  matters: the peripheral-cyanosis plate is Raynaud's, not central cyanosis,
  and the oral one is angular cheilitis, not Koplik spots. Say so rather than
  letting the heading imply otherwise.
- **Nothing is bundled into the APK.** Fourteen photographs were, and that put
  5.4 MB of JPEG into every install for pictures most readers open a handful of
  times. They are served from the `diagrams` bucket like every other plate now;
  React Native caches one on disk after the first view, so a sign is fetched
  once per device instead of shipped to every device. Do not re-bundle them
  without a reason that is worth 5.4 MB to every reader.

- `REVIEWED_SIGNS` in `curatedExamPhotos.ts` is the list that decides what the
  app displays. An id is in it because a person opened the image and confirmed
  it shows the sign. Adding one without doing that defeats the whole
  arrangement.

## A fetched picture is a candidate. Only a reviewed one is shown.

This rule was learned the expensive way, three times in one afternoon, on the
single word **pallor**. Each round tightened the gates and each round produced
a different wrong picture that passed every mechanical check — licence, MIME
type, title corroboration, and finally a filter that rejects artwork:

1. a Harper's magazine engraving of two men at a table, from a novel whose
   caption reads "face assumed a deadly pallor";
2. an Ancient Egyptian carved stone relief (for cachexia);
3. **a photograph of a professional wrestler whose ring name is Pallor.**

None of those is a near miss that a cleverer regular expression would catch.
The word is not evidence about the picture. `question_diagrams` taught this
repo the same thing once already, and the sentence is still true: *a keyword
search cannot choose a clinical picture, and a plausible wrong one is worse
than a blank, because the reader trusts it.*

So the trust is inverted rather than tuned:

- `examSignImages.ts` (generated by the workflow) is a list of **candidates**.
  The workflow may fetch and commit freely; nothing it writes is displayed on
  its own.
- `GeneralExamSigns.tsx` shows a picture only when a person has reviewed it —
  that is, when it is in `CURATED_EXAM_PHOTOS` or bundled in
  `BUNDLED_EXAM_PHOTOS`.
- Promoting a candidate means **opening the image and looking at it**, then
  adding it to the curated list with a caption saying what it does and does
  not show.

The cost is that a genuinely good fetch waits for review. That is the right way
round. A student cannot tell a wrong clinical photograph from a right one —
which is exactly why they are looking at it.
