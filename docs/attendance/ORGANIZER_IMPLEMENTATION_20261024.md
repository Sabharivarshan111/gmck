# ORBIT attendance organizer — 24 October 2026

This implementation was written independently for ORBIT's React Native app. The supplied APK was used to identify its package and asset inventory, without decompiling or copying its executable code. Its Android manifest identifies `com.sirmaur.attendance_tracker` (SIRMAUR College Attendance Tracker). The published feature description was read at https://play.google.com/store/apps/details?id=com.sirmaur.attendance_tracker . No reference APK, logos, fonts, images, text, UI layouts or game code are included in this change.

## Implemented

Open My Progress → Attendance → Your college week.

- Weekly class schedule, with weekday, 24-hour start/end times, room and optional link to an existing attendance subject. Overlapping times on the same day are rejected. Editing and deletion are supported.
- User-supplied timetable image, stored as a persistent local data URI using ORBIT's existing photo picker. The image is a reference, not OCR or automatic schedule import.
- Tasks with completion, optional due dates, overdue highlighting and optional project links.
- Projects with optional due dates and completion derived from linked tasks. Deleting a project keeps its tasks.
- Editable quick notes; deletion requires an explicit confirmation.
- An original asset-free matching game, Ion recall, as an optional short break. This is not a recreation of the reference app's mini-games.
- Custom whole-number attendance targets (1–100%) alongside existing presets, for both new and existing attendance cards.
- New data is local-only under `orbit:attendance-organizer-v1`; existing attendance data and key are preserved. Writes serialize; failed writes show an error and retain the prior state. Unreadable JSON is never replaced by empty data.

## Existing features retained

Present/absent marking, percentages, safe-miss and recovery calculations, monthly theory totals, finite clinical rotations, calendars, holiday overrides, what-if calculations, theme support, and opt-in daily attendance warnings. Timetable subjects are links; adding a weekly class never marks attendance automatically.

## Limitations

There are no class-time alarms or task-deadline notifications in this change. ORBIT's existing daily warning remains the only attendance notification. The UI states this explicitly. No claim of complete APK feature parity or live-device verification is made. The attachment is a Flutter base APK with no bundled `lib/` native libraries, and was not installed or run here. Published features cannot establish exact behavior of every uploaded APK version.

Copyright generally protects expression rather than ideas or methods: https://www.wipo.int/en/web/copyright/activities/software . Independent implementation and distinct design reduce copying risk; this record is not a legal clearance or a guarantee against claims.

## Validation

- Domain tests: time conflicts and adjacent slots; calendar-date validation; project linking; rapid concurrent writes; failed save/retry; restart persistence; corrupt JSON preserved.
- RN-web UI test: create class, reject overlap, create project and linked task, complete task, display 100% project progress, create/edit/reload/delete note, confirm/cancel deletion, preserve tasks on project deletion, attach/remove timetable image through the picker shim, operate the game, and check organizer control bounds at 360/390/412px. Screenshots under `screenshots/attendance-organizer/` are browser previews, not Android screenshots.
- Native/preview TypeScript, quiet ESLint, production Android JS bundle and existing attendance/local-storage/reminder/version/XP/edge/diagram/APKG/Kotlin/repository checks run for this change. See session handoff for final results.
- Full legacy smoke was attempted and stopped after existing Themes/Settings selector failures, consistent with the previous branch handoff. Its suite is not green. The focused organizer test passes.
- No signed APK, Play publication, actual Android notification delivery or native photo-picker behavior was verified here.

Run `npm run check:attendance-organizer` from `mobile/` for domain tests. For the focused browser test, supply a Chromium binary in `CHROME_PATH` and run `node preview/attendance-organizer-check.mjs` from `mobile/`. It starts its own RN-web preview server.
