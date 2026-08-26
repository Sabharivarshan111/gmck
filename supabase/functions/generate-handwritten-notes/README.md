# `generate-handwritten-notes` lives in Supabase, not here

The source that used to sit in this folder was **two versions behind what is
deployed**, and it cost real work: it declared two textbooks (Community and
Forensic), so the native app gated its triple-tap handwritten note on
`year === 'third-year'` and left first- and second-year students with a generic
Ask AI answer. The deployed function had eight books by then, all uploaded,
covering every subject in first and second year. Reading the repo agreed with
the bug, which is the worst way for a copy to be wrong.

It also carried ~2.4 MB of OCR text as `.text.ts` string modules — an approach
the deployed function abandoned in favour of the private `textbooks` storage
bucket, so that was duplicated dead weight as well.

Deleted rather than refreshed, because a copy nothing deploys is a copy nobody
updates, and this is the second time it has misled someone.

## Where the real thing is

Project `pmtgeydtqypwrypshhsx`, function `generate-handwritten-notes`. Read it
with the Supabase MCP connector (`get_edge_function`) or:

```sh
supabase functions download generate-handwritten-notes --project-ref pmtgeydtqypwrypshhsx
```

Edit and deploy it from Lovable or the Supabase dashboard. **Do not re-add a
copy here** unless something deploys from it.

## What it does, as of 2026-08-25 (function version 47)

- Model `gemini-3.1-flash-lite`, direct Google AI Studio key (`GEMINI_API_KEY`),
  no Lovable gateway. Google Search grounding only in `useWeb` mode, where the
  forced JSON mime type has to be dropped because the two cannot be combined.
- Grounds every answer in an OCR'd textbook chosen by **subject**, never by
  year, via `pickBookKey`. `mobile/src/lib/textbooks.ts` mirrors that function
  exactly and `npm run check:textbooks` fails if the two drift.

| Subject match | Book | Year |
|---|---|---|
| anatomy / embryo / histolog / osteolog | Vishram Singh + Langman's Embryology | 1st |
| physiolog | K Sembulingam | 1st |
| biochem | DM Vasudevan | 1st |
| pharmac / drug | KD Tripathi (classification only) + Tara V Shanbhag (everything else) | 2nd |
| patholog | Ramadas Nayak | 2nd |
| microbio / bacterio / virolog / mycolog / parasitolog / immunolog | Apurba S Sastry | 2nd |
| community / psm / preventive / social medicine | Sia's Park | 3rd |
| forensic / fmt / toxicology | Vision | 3rd |

Final year matches nothing, on purpose — there are no books for it yet. Adding
one means uploading the chunks to the `textbooks` bucket, adding the path to
`BOOK_FILES`, adding the match to `pickBookKey`, and mirroring both in
`mobile/src/lib/textbooks.ts`.

- `singleMode: true` is the triple tap: one question, forced to essay depth
  unless it is explicitly a short note, always ending in a "Must-Write Points"
  revision section. The result is cached in `handwritten_notes` under its
  `subtopic_key`, so only the first tap on a question costs a Gemini call —
  which is what keeps the free tier from 429ing.
- `proposeOnly: true` is the "fix these notes with AI" box: it returns
  `{ found, source, summary, content }` and persists nothing until the reader
  says yes.
