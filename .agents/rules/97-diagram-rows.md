---
description: Fixing question_diagrams rows — why a text rule may never bulk-fix them in either direction, and what to do when a plate is wrong
---

# Never bulk-fix a diagram row by a text rule

`question_diagrams` decides which picture a question shows. `CLAUDE.md` already
says the **lookup** must stay an identity join and never become a keyword
search. This file is about the other direction, which is easier to talk yourself
into: **cleaning up wrong rows with a text rule is the same mistake.**

## What happened on 2026-09-03

A dengue plate (`dengue_pathogenesis_ade_and_serology.jpg`) was attached to 41
questions. About 29 were wrong — something had matched the substring **"ADE"**
(the plate is about antibody-dependent enhancement) against:

> cardiac tampon**ade** · coagulation casc**ade** · nephron block**ade** ·
> Gr**ade**nigo's syndrome · intr**ade**rmal naevus · "in**ade**quate
> treatment" · aden**oma** · adenoid facies · adenosine · **Breast Carcinoma**

So the obvious cleanup: delete any row whose question shares no distinctive
whole word with its plate's filename. **220 rows matched. Sampling them first
showed almost all were CORRECT:**

| Question | Plate | Verdict |
|---|---|---|
| What is the management of Hepatitis B? | `hbv_virion_and_serological_markers` | right |
| Ghon's Complex | `tuberculous_granuloma_histology` | right |
| Atropine | `cholinergic_neurotransmission_receptors` | right |
| Isoniazid | `antitubercular_drugs_ripe_moa` | right |
| Faucial diphtheria | `corynebacterium_diphtheriae_morphology` | right |
| Abnormal Immunoglobulin**s** | the immunoglobulin plate | right — failed on the plural |
| Extra Intestinal Amoebiasis | `entamoeba_histolytica_life_cycle` | right |

Medicine is full of questions whose correct plate shares no word with them —
a drug and its receptor, an eponym and its histology, an abbreviation and its
expansion. **No vocabulary rule separates a right plate from a wrong one.** That
is the same premise `CLAUDE.md` proves wrong for the lookup, and it does not
become true because you are deleting instead of selecting.

## What to do instead

1. **Read the rows.** `npm run audit:diagrams` compares stored rows against
   filenames and prints disagreements. `scripts/orphan-diagram-candidates.mjs`
   proposes a question for a plate nothing points at. Both **propose**; a person
   decides. Neither may ever run in the app.
2. **When a plate is wrong and no right one exists, clear the picture** — set
   `public_url` and `storage_path` to NULL and leave the row. No picture is the
   correct answer; a plausible neighbour is worse than a blank. That is what
   Breast Carcinoma got.
3. **When adding a plate:** `question_id` is UNIQUE, so exactly **one** plate per
   question can hold the bank key (`question-` + first 50 chars, whitespace
   dashed). Extra plates for the same question are reachable **only** through the
   `question_text` query, so set that column to the bank's exact string —
   including its stars and spacing.
4. **Read the bank with `scripts/bank-strings.mjs`**, never a fresh regex. Two
   bugs in a hand-rolled one lost 631 questions and made plates look like they
   had no matching question at all.

## Still outstanding

57 plates are attached to more than 5 questions each — 562 rows. Some of that is
a plate legitimately answering a family of questions; some is collision damage
like the dengue case. It needs reading, one plate at a time. Do not script it.
