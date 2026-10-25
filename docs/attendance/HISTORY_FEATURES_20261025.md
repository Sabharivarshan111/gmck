# Attendance history and lab tracking — 25 October 2026

Implements the visible behavior in the two supplied attendance-app screenshots using independently authored ORBIT components, tokens, icons and controls. No reference artwork, fonts, branding, layouts or executable code was imported. This is a feature mapping from visible screens, not a claim of exhaustive APK parity.

| Visible reference feature | ORBIT implementation |
| --- | --- |
| Date and weekday | Local date/day label above the category tabs |
| Theory / lab switch | Independent Theory, Labs and Postings collections; existing records remain in their original category |
| Total, attended, missed, required percentage | Existing per-card summary and target controls; explicit missed count added |
| +/- class counts | Edit counts with steppers and numeric entry for a specified month or earlier balance |
| Recovery / allowance | Existing attendance arithmetic retained; target zero now explicitly means no minimum requirement |
| Last updated | Persisted local timestamp for successful writes |
| Swipe to delete | Horizontal swipe reveals a delete action; removal requires confirmation; accessible explicit removal remains |
| Subject editing | Rename without replacing the subject id, records or timetable links |
| History summary | Total held classes, attended, missed, explicitly recorded off-days, current percentage |
| Colored activity | Month grid with distinct Present, Absent, Mixed, Off-day and Unmarked states plus text markers and legend |
| Tap a date | Enter/correct per-date present/absent counts, record multiple classes, choose off-day, or clear the date |
| Routine/projects/tasks/games | Existing college organizer retained |

Overview cards keep advanced monthly totals, rotation calendars and the simulator in an expandable planning section. Quick attendance, history, count editing and targets remain directly accessible.

## Data and arithmetic

`orbit:attendance-v1` remains the storage key. Optional daily records and updatedAt are added; no old totals are assigned fictitious dates. Per-date edits apply deltas to aggregate and relevant monthly totals. Off-days add no held classes. Posting dates are constrained to the rotation, and future dates cannot be marked.

A separate option moves existing undated attendance into a date without increasing the overall counts. It consumes available undated counts in the same month, then the unallocated earlier balance, while leaving other months unchanged. Counts with dated evidence cannot be reduced by editing a month total; the user edits the date instead.

Actual recorded classes override a planned posting closure for that date. Explicit diary off-days are excluded from posting working days. The official holiday calendar itself is unchanged.

All attendance writes serialize. Storage errors are surfaced, preserve the last persisted state and leave the operation retryable. Unreadable storage is never replaced with an empty list. Undo uses persisted last date and status, including after restarting and across midnight/month boundaries; old undated totals remain editable through the count editor.

Recovery and skip allowances use integer-percent comparisons to avoid floating-point ceil/floor errors. The boundary 6/8 at 80% needs exactly 2 classes; exact thresholds such as 29/50 at 58% are safe.

## Verification

- `check:attendance-history`: legacy preservation, mixed/off-day delta edits, invalid/future/out-of-rotation rejection, no-double-count balance migration, monthly totals, concurrent rapid taps, storage failure/retry, restart, lab-kind persistence, zero-target persistence, cross-month Undo, recorded off-days and Sunday overrides.
- `preview/attendance-history-check.mjs`: actual RN-web create/edit flow, old-balance migration, steppers, persistence/reload/Undo, rename, lab creation and separation, CDP touch swipe reveal, cancellation/confirmation of deletion, disabled future/out-of-range dates and calendar bounds at 360/390/412 px. Screenshots are in `screenshots/attendance-history/` and use sample data.
- Existing arithmetic, organizer, local-only, reminder, version, XP, edge, diagram, Kotlin declaration and APKG checks were run. Native/preview TypeScript, quiet ESLint and Android production JS bundle checked. Final receipts are in the session's resume note.

These are source and browser checks. No Android device rendering, native touch timing, keyboard or signed APK was verified. The older full smoke suite still has unrelated Themes/Settings selectors documented in the preceding handoff; this task adds a focused actual-component flow rather than claiming that legacy suite is green. Class-time alarms remain outside this change.
