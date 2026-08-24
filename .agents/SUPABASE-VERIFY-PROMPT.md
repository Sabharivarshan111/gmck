# Task for Antigravity — verify the notes pipeline against Supabase

Claude Code wrote the native side of this but **could not reach Supabase**: the
connector is off for its chat and the sandbox proxy denies `supabase.co` by
policy. You can connect. Everything below is a check it could not run, in the
order that matters. Report findings before changing anything.

Repo: `Sabharivarshan111/gmck`, branch `claude/native-app-sync`, head `7f6420ee`.
Read `HANDOFF.md`, then `CLAUDE.md`, then `.agents/rules/00-working-agreement.md`.

**The two-app trap:** the React Native app is in `mobile/`. The repo root is the
old Vite web app. `npm run dev` at the root serves the wrong application.

---

## 0. Do not deploy `supabase/functions/` from this repo

The copy here is **behind what is live** and pushing it is a downgrade, not a
no-op:

| | repo copy | deployed |
|---|---|---|
| textbooks | 2, bundled in `textbook.ts` (Park's, Vision Forensic) | 4, read at runtime from the private `textbooks` Storage bucket |
| subjects grounded | Community Medicine, Forensic Medicine | those plus 2nd-year Pharmacology |

`supabase functions deploy generate-handwritten-notes` silently drops two books
and the Storage loader. Nothing errors — notes for those subjects just get
vaguer, which nobody would trace back to a deploy.

**First job:** pull the deployed source down (`supabase functions download
generate-handwritten-notes`, or read it in Lovable), diff it against
`supabase/functions/generate-handwritten-notes/`, and commit the *deployed*
version so the repo stops being a trap. Do not deploy in the other direction.

---

## 1. Why the shotgun-cartridge diagram does not appear

This is the live complaint. A third-year triple tap generates a note correctly
but with **no diagram**, on a question that has one.

Question, exactly as it is in the bank:

```
Define Firearm. Draw and describe the parts of the Shotgun Cartridge. Describe the pattern of entrance wounds produced by a Shotgun at various ranges. (June 2023) ★
```

### 1a. Does a row exist?

```sql
select id, question_text, public_url
from question_diagrams
where question_text ilike '%Define Firearm. Draw and %';
```

That `ilike` pattern is not arbitrary — it is exactly what
`attachDiagramToContent` builds (`clean.slice(0, 25)` after stripping `[0-9]+\.`,
`\(.*?\)` and `[*#]`). If this returns nothing, the lookup is the problem and
the fix is the mapping, not the app.

### 1b. The prime suspect — `alreadyHasDiagram`

In the deployed `generate-handwritten-notes`:

```js
const alreadyHasDiagram = rawContent.sections.some((s) =>
  s.title?.toLowerCase().includes("diagram") || s.icon === "🎨" ||
  (typeof s.payload?.text === "string" && s.payload.text.includes("supabase.co/storage"))
);
if (alreadyHasDiagram) return rawContent;
```

The question says **"Draw and describe"**. Gemini very plausibly titles a
section "Diagram of the Shotgun Cartridge" — and that title match then
suppresses the real image. If so, the guard silently kills the diagram on
exactly the questions that ask you to draw, which are exactly the questions that
have one.

Confirm by logging the section titles for one generation, or by reading the
cached row (§1c). If confirmed, the fix is to narrow the test to the two signals
that actually mean "we already attached one":

```js
const alreadyHasDiagram = rawContent.sections.some((s) =>
  s.icon === "🎨" ||
  (typeof s.payload?.text === "string" && s.payload.text.includes("supabase.co/storage"))
);
```

Apply it in Lovable, on top of the deployed source, not on this repo's stale copy.

### 1c. Read the cached note

```sql
select subtopic_key, jsonb_path_query_array(content->'sections', '$[*].title') as titles
from handwritten_notes
where subtopic_key = 'single::forensic-medicine::s3cwd9';
```

`s3cwd9` is the key the phone now sends. If the row is missing, generation is
not being cached under it — say so. If it exists, its section titles answer §1b
outright.

### 1d. Is the bucket public?

`DiagramCard` now shows *"This diagram could not be loaded"* on an image error,
so a 403 is visible on the phone from the next build. Confirm it directly:

```
curl -sI "<public_url from 1a>"
```

200 is fine. 400/403 means the `diagrams` bucket is private and every
`public_url` is dead — make the bucket public, or switch the column to signed
URLs and have the app request them.

---

## 2. Confirm the cache key actually matches

Claude Code found and fixed a real bug here: native hashed the question with the
★ markers stripped, the web app hashes them intact, so the phone missed **every**
pre-seeded row — including the 75+ that already have a diagram in them.

Verify both keys resolve the way this predicts:

| question | key the phone now sends | key it sent before the fix |
|---|---|---|
| Gustafson's method… | `single::forensic-medicine::201qgi` | `single::forensic-medicine::66wfte` |
| Define Firearm… | `single::forensic-medicine::s3cwd9` | `single::forensic-medicine::zaunt4` |

```sql
select subtopic_key, updated_at
from handwritten_notes
where subtopic_key in (
  'single::forensic-medicine::201qgi', 'single::forensic-medicine::66wfte',
  'single::forensic-medicine::s3cwd9', 'single::forensic-medicine::zaunt4'
);
```

Expected: the `201qgi` / `s3cwd9` rows are the ones the **web app** created, and
the `66wfte` / `zaunt4` rows are junk the phone created before the fix.

- If the web-app rows are under the *other* hash, the prediction is backwards —
  say so, do not adjust the app to match without checking `mobile/scripts/note-key-check.mjs` first.
- The junk rows can be deleted once confirmed. Check `updated_at` before you do.

---

## 3. Verify the edit box's contract

`mobile/src/components/NotesAiEditBox.tsx` is new and **has never made a real
request** — it was written against the contract read out of the web app's
`src/components/handwritten/NotesAiEditBox.tsx`. Confirm the deployed function
actually honours it:

- `proposeOnly: true` returns `{ source, found, summary, content }` and **writes
  nothing**
- `source` is one of `textbook` / `knowledge` / `web`
- `useWeb: true` is a separate path
- `saveContent: true` with `content` persists under the same `subtopicKey`

The "writes nothing" part is the one that matters. The whole design is that a
proposal is not applied until the reader taps yes; if `proposeOnly` writes
anyway, a rejected answer has already overwritten their notes and the No button
is a lie. Test it: call with `proposeOnly`, then re-read the row and confirm
`updated_at` did not move.

---

## 4. Report, then fix

Report each of §1a–1d, §2, §3 as **confirmed / ruled out / could not tell**, with
the query output. Then fix what you found, smallest change first.

Before pushing, from `mobile/`:

```sh
npx tsc --noEmit          # clean
npx eslint .              # 0 errors (warnings are inline-style noise)
npm run check:note-key    # the cache key still matches the web app
npm run check:notes-schema
npm run check:android-res # a duplicate colour here has broken the release twice
npm run check:smoke       # 21 flows, and **0 runtime errors** — not just 21 green
```

`check:smoke` reports passing steps and runtime errors separately. Eighteen green
steps with eleven runtime errors underneath is how a gesture bug survived three
rounds of "it's fixed". Read both numbers.

Update `HANDOFF.md` with what you found. Claude Code cannot see your chat, and
you cannot see its — `HANDOFF.md` is the only channel.
