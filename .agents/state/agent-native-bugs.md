# agent-native-bugs — state log

## 2026-09-04, session start
Picked up the three-item task (page-ref design pass, current-textbook selection,
two Android-only rendering fixes).

**First finding: items 1 and 2 already landed** in commit `fd217a6`
"feat(pages): show the quorum instead of describing it, and remember your book"
— `QuorumPips.tsx`, `myBookId`/`myBookLabel` in `lib/settings.ts`, the book-filter
argument on `confirmed_page_refs`, chip changes in `QuestionRow.tsx`. Working tree
is clean; that was an earlier run of this same task before it was cut off.

- **Next:** read QuorumPips for motion/reduced-motion compliance, then audit item 3
  (ThinBar `<Svg width="100%">`, SuccessCheckmark `strokeDashoffset` native driver)
  before touching anything.

## Verification of the inherited work (all on HEAD, working tree clean)
- `npx tsc --noEmit` — clean (needed `npm ci` first; node_modules was empty).
- `npx eslint . --quiet` — no output.
- `npm run check:cloud-ids` — OK, 7 local-only stores.
- `npm run check:page-refs` — OK, 6 screenshots in `/home/user/gmck/screenshots/`.
- `npm run check:smoke` — **1 pre-existing failure**: "a note filed under a chapter
  shows up on that chapter" (locator timeout). Nothing of mine is in the tree yet,
  so it is on HEAD already. Re-running to see whether it is flaky.

**Item 3 was already executed, in both halves:**
- `ThinBar` in `src/components/ProgressRing.tsx` draws the gradient once at the
  measured track width and clips it; the comment records the Android repaint bug.
- `SuccessCheckmark.tsx` runs every `strokeDashoffset`/SVG-opacity timing on
  `useNativeDriver: false`, with the note about `Platform.OS !== 'web'` being
  backwards. Only the glow (transform + style opacity) is native.
Nothing to fix. Not touching either.

## In progress
Item 1's third named ask — entrance motion — is only half met: the pips animate
when a vote *lands*, but on the sheet opening they snap into place (`first.current`
suppresses the first render). Adding a staggered rise+fade to the claim rows and
letting the pips fill as the row arrives.
