# Native Android / Vercel mobile verification — 2026-10-15

Status: **unfinished; exact visual and full functional parity are not certified**.

User authorized native fixes, mobile screenshots, comparison, signed builds and release. No further approval is needed for that scope. Source `src/` remains unchanged. Advanced anatomy and teaching tools use the locally bundled canonical WebGL renderer; they are not native OpenGL geometry.

## Implemented

Build 547 (7f597c0f27a03b7734fb61560dcecff6b82fbead) contains native ECG magnified cutouts generated from the frozen canonical drawing body, native case tool routing, patient continuity and the source-aligned native ICU/ECG/radiology/clubbing views.

Build 548 (8a0bf81c9f471beb37344dc70715736b7aedff85) fixes Android WebView panels computing to zero height for `dvh` values. The renderer measures the viewport, converts CSS declaration values and the three canonical inline height expressions at bundle time, without changing frozen source files or Tailwind selectors. Android build, typecheck, lint and build checks passed; APK was published as debug-548. Actual Android548 ICU screenshot now confirms the full-height lesson/heart diagram renders. The read-only inspector then timed out; this is fixed on the evidence branches, and complete control verification remains pending.

## Actual evidence

- Vault run https://github.com/Sabharivarshan111/gmck/actions/runs/38735968837 passed notes navigation, proformas, PG routes, flashcard creation/reveal/scheduling and simulator entry on installed Android and Vercel MOBILE (393×852). All 16 pairs were captured and visually reviewed. Spacing, bottom-navigation selection and modal sizing differ. Initial PG/proforma-library captures show different modal positions, but the source capture did not wait for the 250 ms web slide animation. A follow-up waits1000ms before interpreting modal layout. Do not change Android to match a transient web frame. Diagram area is blank in both captured proforma guide images; image loading is not verified. Synthetic QA data only.
- Delivered `Vault-Mobile-16-Comparisons.zip` (Library libfile_859780a2ff488191b7775d430d1e7296), gallery plus original screenshots and truthful per-pair notes. Preview libfile_da12c0a0e4008191b84263f92ee91c4f. Current local directory `/workspace/scratch/9722bfb4a6c4/vault-review`.
- Build547 controls run 38734987432: patient IV saline intervention, ICU waveform/readings, PCM frames/mute and independent radiology/clubbing checks partly passed. Actual ICU tutorial dialog had zero height; fixed in548, pending actual verification. After returning to ICU a SWEEP check targeted an offscreen horizontal status item; return itself worked. Coronal MRI image check targeted the slider instead of scrolling to the image. Both harness issues are fixed in the separate548 controls branch.
- Definitive Android layout probe run38734702070: native and live Vercel in the same WebView both computed anatomy detail-sheet height0 despite viewport393×800. Using that broken WebView as a source layout reference would hide the defect. New source references use a real mobile Chromium browser.

## Running / next verification

1. Native UI run38736944349, exact548 APK; old after-tutorial SWEEP expectation may fail when the status bar is scrolled horizontally. Inspect screenshots and DOM before attributing failure to app.
2. Corrected controls run38738944344, branch `codex/native-548-controls-evidence-20261015`. Uses exact548 APK with strict evidence-only diff. Covers ICU tutorial and native ECG inline cutouts plus radiology all MRI planes.
3. Anatomy run38737559836, branch `codex/native-548-anatomy-evidence-20261015`: real Vercel MOBILE393×800 DPR3 references, installed native39 target overviews, Supply/Relations and venous-drainage screenshots where teaching dossiers exist. Must inspect results before certifying anatomy appearance or interactions.
4. Advanced branch `codex/native-548-advanced-evidence-20261015`: actual Android + Vercel mobile eye gaze/penlight, auscultation listen/pause/back/Xray, POCUS freeze/resume/gain/depth/reference and general examination tab/lid/tilt controls. Inspector reads state/canvas hashes only; all interactions use actual Android UI. Physical speaker audibility, every pathology preset and transient blink are not certified by these checks.
5. Signed candidate branch `codex/native-v27-candidate-20261015` at4b83fa246a8c2e2853ab0bd892a47a98ee228ab9 includes548runtime. Internal run38737075854 succeeded and published internal-516/app-internal.apk; release AAB/APK run38737075756 succeeded and published release-700. These are candidates, not a completed parity release or Play upload.

## Remaining

Review actual548 panels and anatomy target coverage; resolve observed app failures; compare screenshots; review native cutout labels and ECG source control behavior. Fix outstanding Vault layout differences if exact parity is required. AI generation, file import/export, cloud sync, all note contents, every PG answer/filter and all simulated clinical presets are not covered by the current route audit. Main PR98 has not been merged; main remains9a5c0698d3f919843c53d097da0d8326b8f9b59c. Never call everything perfect from partial passing checks.

## 13:20 UTC follow-up

Live Vercel inspection confirmed production deployment dpl_7SFKiprfPtUxTkzDUhCTZa1SbVyf at b87bb7d9e0a6138c88b3f776908eae98d793410f; `git diff` of its frozen simulator source against the checkpoint is empty. The homepage is built from mobile/react-native-web, while /simulator is the frozen Vite bundle.

Actual548 tutorial PNG is saved at `/workspace/scratch/9722bfb4a6c4/vault-review/Android-548-ICU-Tutorial.png`, Library libfile_0fac23ddecc08191ba0f93ce56969178. UI run38736944349 failed after this screenshot because the inspector CLI stayed alive; the actual overlay is visibly working. Bounded fetch plus exit-after-write fixes the inspector and the primary screenshot hook records a probe timeout without aborting real control checks.

Current retries: controls38741062187; advanced38741001018; drawer probe38741010447; settled Vault38740284912; full browser smoke38740522958. Full39 anatomy38737559836 remains running, do not cancel. A separate live Vercel mobile ECG details branch captures ICU lessons and all six cutouts.


## 2026-10-15 18:18 UTC — Back fix persisted; actual anatomy mismatch under investigation
### DONE
- Downloaded and reviewed completed548 evidence. Settled Vault run38740284912 passes all5 suites/16 mobile pairs. Signed internal516/release700 remain candidates, not Play publication or parity certification.
- Full anatomy run38737559836 timed out at180min: source39 overviews+108 detail captures; Android20 overviews+27 detail captures. Native heart drawer visibly800px versus Vercel mobile496px. Venous-drainage gestures fail; some Relations captures succeed, others fail. Do not claim39 native organ checks completed.
- Actual548 controls38741062187 confirms native ICU tutorial/axis lesson, waveform and PCM mute interactions. Android Back then exits to launcher, a real defect. MainActivity now installs an API33–35 dispatcher bridge and excludes it from JS default-exit fallback. Kotlin contract check passes; actual Kotlin compilation/device Back still pending.
- UI PR98 branch now236498568a01f550f156de3e671d9ee6a419a88b. First Back-fix build549/38782711502 stopped at lint from unqualified inspector matchMedia; corrected to window.matchMedia. Build550/38783233733 and exact-source UI evidence38783233968 now running. Six actual native cutout screenshots and exact enabled-button targeting added; no source src edits.
- Local14 simulator navigation cases,154800 native/source waveform coordinates across43 cases,100-phase R-wave sampling,1161 actions across43 cases, native clinical/layout/ECG contracts, TypeScript, renderer build and Kotlin contract checks pass. Full browser smoke is still red; never imply device or all-app certification.
### HALF-DONE
- Drawer probe38782851246 at d616d2563ee2bd3fe1d115ad61a299a01612c9aa reuses548 with strict evidence-only comparison. Added actual CSS media matches and matched height-rule diagnostics. Inspect its artifact before speculative CSS changes. Current read_android_webview.mjs fixes explicit window APIs; running probe version uses valid runtime globals but lacks that lint-only qualification.
- Advanced548 actual emulator died opening Eyes; host had ~15GB available, kernel read denied, logs show ColorBuffer errors before emulator vanishes. Source all4 suites pass. Branch b3e21c001b9ce08a9d59c1dded444381be213e2f run38782933345 now gives each skill its own emulator (matrix, fail-fast false), uses supported -gpu software instead of deprecated swiftshader_indirect. Do not certify any advanced native tool until artifacts reviewed.
- Browser smoke latest548 initially18 failed steps,0 runtime errors. Corrected10 personal-notes tests that navigated to Vault AI Notes instead of Progress Notes. Branch7e4be0639cff10ea9235748c8a5c019d760d0d9c triggers another full suite. Other tests and possible defects still unresolved.
- Vercel mobile ECG details38743011617 successful:8 actual screenshots including6 centered canvas cutouts. Downloaded /workspace/scratch/9722bfb4a6c4/ecg-source. Native6-cutout screenshots pending550.
### NEXT
- Inspect drawer probe CSS/media metadata and fix the observed native full-height anatomy drawer. Fix actual scroll gesture targeting using real drawer-body bounds rather than generic whole-screen swipes. Avoid another3h anatomy job unchanged; split coverage after focused checks pass.
- Monitor build550, UI evidence38783233968, advanced matrix38782933345 and corrected smoke. Review actual screenshots, classify app bugs separately from harness failures. Then merge PR98/release updated signed candidates under existing user authorization only when concrete checks support readiness; no repeat approval question.
- Local workspace gmck recovered; deps installed, no local SDK/KVM. Existing16-pair deliverables persisted under Library IDs documented in prior session; scratch paths from older session may be gone. Repo code is Git backed. Do not push source src changes or claim physical audio/full cloud/import/AI verification.
### DO NOT
- No subagents authorized. Do not label canonical WebGL modules native OpenGL. Do not say all anatomy/venous layers verified from query screenshots: vascular/skeletal query overviews currently resemble the default body on both platforms; verify actual layer UI and visibility before claims.
- Do not merge known defects or call debug548/release700 final. No Play upload has occurred. Never re-use an APK after runtime changes without exact source provenance.
