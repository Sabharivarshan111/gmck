# Native Android / Vercel mobile verification — 2026-10-15

Status: **unfinished; exact visual and full functional parity are not certified**.

User authorized native fixes, mobile screenshots, comparison, signed builds and release. No further approval is needed for that scope. Source `src/` remains unchanged. Advanced anatomy and teaching tools use the locally bundled canonical WebGL renderer; they are not native OpenGL geometry.

## Implemented

Build 547 (7f597c0f27a03b7734fb61560dcecff6b82fbead) contains native ECG magnified cutouts generated from the frozen canonical drawing body, native case tool routing, patient continuity and the source-aligned native ICU/ECG/radiology/clubbing views.

Build 548 (8a0bf81c9f471beb37344dc70715736b7aedff85) fixes Android WebView panels computing to zero height for `dvh` values. The renderer measures the viewport, converts CSS declaration values and the three canonical inline height expressions at bundle time, without changing frozen source files or Tailwind selectors. Android build, typecheck, lint and build checks passed; APK was published as debug-548. Actual-device panel verification is still pending.

## Actual evidence

- Vault run https://github.com/Sabharivarshan111/gmck/actions/runs/38735968837 passed notes navigation, proformas, PG routes, flashcard creation/reveal/scheduling and simulator entry on installed Android and Vercel MOBILE (393×852). All 16 pairs were captured and visually reviewed. Spacing, bottom-navigation selection and modal sizing differ. PG/proforma library is a Vercel bottom sheet versus Android full screen. Diagram area is blank in both captured proforma guide images; image loading is not verified. Synthetic QA data only.
- Delivered `Vault-Mobile-16-Comparisons.zip` (Library libfile_859780a2ff488191b7775d430d1e7296), gallery plus original screenshots and truthful per-pair notes. Preview libfile_da12c0a0e4008191b84263f92ee91c4f. Current local directory `/workspace/scratch/9722bfb4a6c4/vault-review`.
- Build547 controls run 38734987432: patient IV saline intervention, ICU waveform/readings, PCM frames/mute and independent radiology/clubbing checks partly passed. Actual ICU tutorial dialog had zero height; fixed in548, pending actual verification. After returning to ICU a SWEEP check targeted an offscreen horizontal status item; return itself worked. Coronal MRI image check targeted the slider instead of scrolling to the image. Both harness issues are fixed in the separate548 controls branch.
- Definitive Android layout probe run38734702070: native and live Vercel in the same WebView both computed anatomy detail-sheet height0 despite viewport393×800. Using that broken WebView as a source layout reference would hide the defect. New source references use a real mobile Chromium browser.

## Running / next verification

1. Native UI run38736944349, exact548 APK; old after-tutorial SWEEP expectation may fail when the status bar is scrolled horizontally. Inspect screenshots and DOM before attributing failure to app.
2. Corrected controls run38738944344, branch `codex/native-548-controls-evidence-20261015`. Uses exact548 APK with strict evidence-only diff. Covers ICU tutorial and native ECG inline cutouts plus radiology all MRI planes.
3. Anatomy run38737559836, branch `codex/native-548-anatomy-evidence-20261015`: real Vercel MOBILE393×800 DPR3 references, installed native39 target overviews, Supply/Relations and venous-drainage screenshots where teaching dossiers exist. Must inspect results before certifying anatomy appearance or interactions.
4. Advanced branch `codex/native-548-advanced-evidence-20261015`: actual Android + Vercel mobile eye gaze/penlight, auscultation listen/pause/back/Xray, POCUS freeze/resume/gain/depth/reference and general examination tab/lid/tilt controls. Inspector reads state/canvas hashes only; all interactions use actual Android UI. Physical speaker audibility, every pathology preset and transient blink are not certified by these checks.
5. Signed candidate branch `codex/native-v27-candidate-20261015` at4b83fa246a8c2e2853ab0bd892a47a98ee228ab9 includes548runtime. Internal run38737075854 succeeded and published internal-516/app-internal.apk; release AAB/APK run38737075756 is pending. These are candidates, not a completed parity release or Play upload.

## Remaining

Review actual548 panels and anatomy target coverage; resolve observed app failures; compare screenshots; review native cutout labels and ECG source control behavior. Fix outstanding Vault layout differences if exact parity is required. AI generation, file import/export, cloud sync, all note contents, every PG answer/filter and all simulated clinical presets are not covered by the current route audit. Main PR98 has not been merged; main remains9a5c0698d3f919843c53d097da0d8326b8f9b59c. Never call everything perfect from partial passing checks.
