# Brain source registration repair — 2026-10-16

Raw Android and Vercel overview-brain screenshots from successful baseline group6 showed the model offscreen. Functional bright-pixel assertions had not detected this. Publication was explicitly blocked in c47bcc567b08a4478ce3f4710e28c9ad91251afb; do not remove that blocker until a rebuilt candidate has device screenshots reviewed.

Measured original brain_reference.glb has104 source meshes. Right orbital inferior frontal gyrus shares geometry with its left counterpart but has ~943x scale and metre-scale translation; corpus callosum and hippocampal commissure sit at the origin rather than the head near1.6m. No positions have been invented or mirrored. These three original source meshes are quarantined from display AND camera bounds, with a visible source-registration notice. All101 other captured meshes remain. Source assets/hashes are unchanged.

Geometry regression reads the real GLB, checks the exact quarantine names and retained count, verifies brain-sized registered bounds and projects all bounding corners into portrait/landscape cameras. TypeScript root/mobile, mobile ESLint, existing source resolver/assets checks and local canonical renderer build passed. Root AnatomicalBody3D ESLint still has five pre-existing errors at lines1774,1973,2149,2261; this repair does not alter those statements.

New branch codex/v27-brain-registration-20261016 triggers debug/internal/release+AAB builds as artifacts only, plus exact-source installed Android verification of all26 Z-Anatomy reference targets against the corrected canonical source in local mobile Chromium. The browser reference is NOT live Vercel; production Vercel still has the observed brain issue until the fix is deployed. The original97ee457 runtime and its APK hashes do NOT include this repair.

Original anatomy groups0,5,6,7 passed; complete error-attributed replacements1(run38872622681) and3(run38873046013) passed. Groups2/4 timed out; all140 connections are now covered by six partition jobs in38892788662 at67f2dc2b63fe8d30e5f19a595f3467e201f51dc0. Publisher c43 required those plus source/checksum/coverage checks, then was blocked by screenshot review. Do not cancel or duplicate those partitions. They qualify old runtime scopes only; final provenance must distinguish the corrected brain candidate.

User authorized debug/internal/release APKs and release AAB publication after verification; no more confirmation is needed. No Play upload has occurred. Do not claim every simulator component is native RN or certify physical speakers.
