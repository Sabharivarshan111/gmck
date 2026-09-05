# Waiting on Lovable credits — wire the diagram into the triple-tap note

**Status:** still blocked, retried 2026-09-02. `send_message` rejected again with
*"Your workspace is out of credits"* (workspace `SsJFPAW9Fet3beeN2YWW`, project
`89df4dbc-89e6-4e44-a7b1-76b9de94066e`). Add credits at
https://lovable.dev/settings/billing, then send the message below through the
Lovable connector and ask the project to publish afterwards.

**The data is no longer the blocker.** As of 2026-09-02 the 60 orphaned plates
have rows in `question_diagrams` (see `diagram-rows-2026-09-02.md`), so the
lookup returns pictures for brachial plexus, shoulder, ulnar/median/radial nerve
and the rest. The ONLY thing left for the live Lovable site is this wiring — its
reader never calls the lookup. The native app and the Vercel `src/` app already
show the pictures; they read the table live and their readers call the lookup.
The message below now also names the shoulder and ulnar questions, which have
rows now too.

## Why this is still outstanding

Three earlier messages were accepted and completed, and they were the wrong
three. They fixed `src/hooks/use-question-diagrams.ts` and
`src/lib/diagram-lookup.ts` — the lookup is now correct identity matching with
error inspection, confirmed by reading the files at commit
`06e7beed64f9ad55fcebf15907efc3dcb52e09ce`.

But **nothing calls them on the reader's path.** Lovable's
`src/components/handwritten/SingleQuestionNoteOverlay.tsx` fetches the note and
renders `HandwrittenNotesView`; neither file imports `useQuestionDiagrams`,
`DiagramChip` or `DiagramViewer`. The only way an image can appear in a note
there is if the model happens to write an image URL into the note text. So the
fixed hook is dead code and triple-tapping brachial plexus shows nothing —
which is exactly what was reported.

Lovable's tree has diverged from this repo: it has `components/diagrams/` and
`admin/AdminDiagramsPanel.tsx`, and lacks `ExamDiagramCard.tsx`. A push to
`main` does not reach it.

## The message to send

The diagram lookup you fixed is correct, but nothing on screen calls it — that
is why triple-tapping a brachial plexus question still shows no picture.

`SingleQuestionNoteOverlay.tsx` fetches the note and renders
`HandwrittenNotesView`. Neither ever imports `useQuestionDiagrams`,
`DiagramChip` or `DiagramViewer`.

1. The triple-tap note must look the question's own diagrams up and show them.
   The overlay already has the question text and the subject in its payload —
   pass both down and call `useQuestionDiagrams([question], subject)`.
2. Show the picture ABOVE the note body, full width, `object-contain`, then the
   note's sections underneath. Keep `DiagramViewer` as the zoom you get when the
   image is clicked; a chip that has to be clicked to reveal it is not wanted.
3. Show ALL of a question's rows, not just the first — `build()` currently keeps
   one per question. Label them "High-Yield Visual Exam Diagram (1/3)" etc. when
   there is more than one; no counter when there is exactly one.
4. A question answers to two strings: the bank's raw text and the same text with
   its leading "12. " stripped. Screens strip it before opening a note, and 53
   rows are filed under the numbered form. Ask identity about both.
5. Captions and alt text go through `sanitizeDiagramCaption`. No textbook title,
   edition or author name may ever reach a reader.
6. Nothing keyword-based. No matching row means no picture.

Verify by triple-tapping these in Anatomy — all three have real rows with a
public URL, verified in the database:
  - "Formation, branches and clinical anatomy of brachial plexus /Erb's point. ***"
  - "Brachial plexus - Formation, variation (pre and post fixed), branches and applied anatomy. ***"
  - "Draw a labeled diagram of the brachial plexus."
Open the note and look at it rather than reporting it done from the code. Then
publish — the published site is what the owner is looking at.

---

## 2026-09-05 — the credits block is gone

`send_message` to workspace `SsJFPAW9Fet3beeN2YWW`, project
`89df4dbc-89e6-4e44-a7b1-76b9de94066e` was **accepted** today (a WhatsApp-links
message, `status: "accepted"`), where every attempt since 2026-09-02 was
rejected outright for want of credits.

So this note is no longer blocked on the owner. **Send the message above.** One
practical detail learned today: the MCP `send_message` tool times out at 60
seconds while the Lovable agent keeps working, so a timeout is not a failure —
check `list_messages` and look at the message's `status` before resending, or a
retry will queue the same work twice and spend the credits twice.
