---
description: Handwritten notes — which textbook grounds which subject, and the two ways that goes silently wrong
---

# Handwritten notes and their textbooks

`generate-handwritten-notes` (Supabase project `pmtgeydtqypwrypshhsx`) writes
every note, on `gemini-3.1-flash-lite`, grounded in an OCR'd textbook from the
private `textbooks` storage bucket.

**It picks that textbook by SUBJECT, never by year.**

| Subject matches | Book | Year |
|---|---|---|
| anatom / embryo / histolog / osteolog | Vishram Singh + Langman's | 1st |
| physiolog | Sembulingam | 1st |
| biochem | Vasudevan | 1st |
| pharmac / drug | KD Tripathi (classification only) + Tara Shanbhag (the rest) | 2nd |
| patholog | Ramadas Nayak | 2nd |
| microbio / bacterio / virolog / mycolog / parasitolog / immunolog | Apurba Sastry | 2nd |
| community / psm / preventive / social medicine | Sia's Park | 3rd |
| forensic / fmt / toxicology | Vision | 3rd |

Final year matches nothing — there are no books for it, and it must keep
falling through to Ask AI. A note badged "handwritten" that is really the
generic answer is worse than no button, because nothing on screen says which
one arrived.

`mobile/src/lib/textbooks.ts` mirrors the function's `pickBookKey`, and
`npm run check:textbooks` pins them together. **Keep the rules in the same
order** — the matches overlap, and testing "drug" before "microbio" sends an
antimicrobial subject to the wrong book.

## Never gate this on the year

The triple tap was gated on `year === 'third-year'`, written when Community and
Forensic were the only two books. Six more arrived and the gate did not move:
803 triple-tap notes were third year, one was second, none were first. Students
were being turned away from an answer that already existed, and nothing said so.

Two things hid it, both worth recognising elsewhere:

- **The repo's copy of the edge function was two versions behind.** Reading the
  code agreed with the gate. It is deleted now — `supabase/functions/
  generate-handwritten-notes/README.md` says where the real one lives. Read the
  deployed function with the Supabase MCP connector, never a local copy.
- **`subject` had a `|| 'Community Medicine'` fallback.** Harmless while the
  feature was third-year-only. It would now ground an Anatomy question in Park
  and return it with a textbook's confidence. There is no fallback subject: with
  none, the function uses general MBBS knowledge, which is at least not false.

## Never name a textbook to the reader

The table above is for choosing a book, not for showing one. A student is
studying, not being handed a bibliography, and the notes function is told the
same thing in its own prompt: *"DO NOT include page numbers or textbook
citations"*, *"never mention OCR/pages/edition inside the notes"*.

The diagram card carried a hardcoded `Park & Vision FMT` caption. Two problems
in one string: it named the books, and it named **third year's** two books —
so it sat above an Anatomy diagram claiming a forensic textbook the moment first
and second year were switched on.

`check:textbooks` now fails if an author or title appears anywhere in a string
under `mobile/src/`. Comments may name them; the interface may not.

The web app has the same caption at `src/components/handwritten/
ExamDiagramCard.tsx` (`"Vision FMT Grounded"` / `"Park PSM Grounded"`) and needs
the same removal in Lovable.

## The cache is keyed on the question, and shared with the web app

`single::{subjectKey}::{hash(question)}`. The web app builds the identical key,
so a note generated in either app appears instantly in the other, and **changing
the key shape orphans every existing note.** `check:note-key` pins it.

The function returns the cache on the first batch unless `regenerate` is set, so
a note generated before its textbook existed never refreshes itself. That
happened: 75 first- and second-year notes predated their books and were serving
ungrounded answers for ever. They were backed up to
`handwritten_notes_pre_textbook_backup` and deleted so they regenerate.

**If you upload a new textbook, clear the notes for that subject** — otherwise
the topics people already opened keep the ungrounded version permanently.

## Notes render objects, not strings

Every list section holds objects — a bullet is `{ label, description }`, a step
is `{ title, description, keyTrigger? }`. Only `revision.items` is `string[]`.
`String(item)` prints `[object Object]`. `**bold**` is a highlight, not literal
asterisks, and diagrams arrive as image markdown inside ordinary prose, so
`RichText` has to split every run. `check:notes-schema` pins the renderer and
the fixture to each other.
