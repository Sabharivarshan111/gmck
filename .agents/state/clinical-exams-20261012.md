# Clinical simulator audit — 2026-10-12

DONE: Draft code fixes View 3D to explicitly isolate source-backed organ, replaces floating direction strip with collapsible Views control, adds interactive deformable 3D lower-leg edema and source-head scleral tint/lid examination. Removes unsupported inference of edema from CVP/ascites and bilirubin measurement from visual colour. Adds acquired CC0 chest film and RAS OpenNeuro brain MRI slice viewer with measurements, pan, zoom and contrast. Hosts all four credited ultrasound references locally. Root TypeScript, new component lint and build checked locally.

HALF-DONE: Full GitHub phone rendering/interaction tests and screenshot review pending. Do not merge or claim published until checked. All changes on codex/clinical-exams-20261012; simulator-clinical-e2e covers 360/390/430 and heart View3D. Sparse local checkout excludes legacy atlas assets; use full CI checkout for real heart rendering.

NEXT: Run focused browser workflow, inspect screenshots and fix failures, merge and verify exact production READY. Android simulator uses shared hosted screen, internet required. Verify actual release APK/AAB bytes from latest GitHub release.

DO NOT: Alter separate PG work. No physical-device or Play-upload claim. Edema is a schematic teaching model; MRI is a real brain reference, not lumbar study or diagnostic image software. Original image credits/licences retained. Prior local drafts were removed by workspace cleanup; remote checkpoints now hold recovered work.
