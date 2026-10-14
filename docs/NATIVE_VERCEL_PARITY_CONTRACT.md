# ORBIT — Vercel → REAL Native Android 1:1 parity contract

**Reference:** production `https://orbitmbbs.vercel.app`, GitHub `src/` at the same commit.
**Target:** existing published Android package `com.aistudio.mbbsqbank.aycxvd`, React Native `mobile/`.
**User directive:** preserve all existing Vercel screen layouts, wording, icons, animations, clinical data, interaction flows and feature completeness. Do **not** invent a simplified substitute.

## Definition of "ported"

A feature is **native** only if its actual interactive UI and relevant computation run inside the installed Android app using React Native and/or a real Android graphics/media module. A WebView that points at Vercel is a compatibility fallback, **not** a completed native port. Merely displaying remote HTML, a still image of a 3D model, or a menu that opens a URL is not parity. Avoid claiming offline support unless it works with airplane mode enabled after a fresh cold launch.

**Data synchronization:** where safe, share pure TS constants/data with web; when source uses DOM/WebGL, port the interaction and renderer while preserving the same model/clinical content. Backend-only AI/chat/network calls cannot be made to work offline without an explicit offline inference replacement; show honest connectivity errors instead of mock clinical results.

**Do not release on partial parity:** version name alone proves nothing; require signed release APK/AAB, emulator screenshots at 360×800 and 393×852, an actual Android-device test, and functional assertions for every interactive element.

## Required module-by-module parity

| Surface | Web source | Real native target | State on this branch |
|---|---|---|---|
| Vault dashboard & all cards | Web app shell / Notes and simulator entry | `mobile/src/screens/NotesScreen.tsx` | Existing native variant; pixel/flow parity NOT verified |
| Clinical studio home | `src/simulator/controls/SimulatorStudio.tsx` + CSS | `mobile/src/components/NativeClinicalStudio.tsx` | RN port coded; screenshot/interaction QA pending |
| Skills catalog | `SimulatorStudio.tsx` | `nativeClinicalCatalog.ts` | 7 source-aligned entries coded; parity check pending |
| Clinical cases catalog | `PhysiologyKernel.ts` | `nativeClinicalCatalog.ts` | 43 source-aligned entries coded; parity check pending |
| Full body, anatomy layers & camera | `AnatomicalBody3D.tsx` & asset atlas | Native accelerated 3D renderer, model loading, orbit/zoom/pan | NOT PORTED; hosted renderer still used |
| Region isolation, organ relations, scalpel, peeling | `src/simulator/view`, `controls`, `data` | Native mesh picking, state, hit testing, tap targets | NOT PORTED |
| ECG studio, moving waveform, 12 leads | `src/simulator/instruments/DiagnosticTools.tsx` | Native Canvas/SVG/Skia waveform & teaching tools | 12-lead calibrated ECG, lead-group selector and six teaching wave segments ported in SVG with matching descriptions; magnified cutout and full ECG specialist tutorial pending |
| Auscultation & heart murmurs/breath sounds | Simulator tools and audio assets | Native accurate audio selection, loop, audio focus | NOT PORTED |
| POCUS/ultrasound interactive teaching | Simulator tools and imaging assets | Native probe, plane controls, labeled views | NOT PORTED |
| Annotated X-ray/MRI | Simulator tools and radiology assets | Native image/volume viewers with arrows and tooltips | NOT PORTED |
| Pupils, cranial nerves, general examination | Simulator tools | Native exam UI, physiology state, case response | NOT PORTED |
| Clubbing trainer | `ClubbingTrainer.tsx` | Native visual and Schamroth-exam interactions | NOT PORTED |
| ICU monitor | `IcuMonitor.tsx` + `PhysiologyKernel.ts` | Native animated traces and vital-driven alarms | Functional 4-channel native SVG port with shared Vercel PhysiologyKernel; web-specific ECG tutorials/audio still pending |
| Interventions/case debrief | `InterventionPanel.tsx`, `PhysiologyKernel.ts` | Native scenario state/interventions/history | Native case screen with shared PhysiologyKernel and all 27 intervention actions; expanded visual parity and clinical debrief pending |
| Handwritten notes, diagrams, audio, PDFs | `src/components/handwritten/` and native Notes | Native modules exist | Full web parity NOT verified |
| NEET PG practice & explanation fidelity | Web PG/quiz surfaces | Native PG bank modules exist | Content/UI parity NOT verified |
| Flashcards & Anki import/media | `src/components/flashcards/` | Native `FlashcardsScreen` | Full deck/media/gesture parity NOT verified |
| Clinical proformas, cases, patient records | Web studio/proformas | Native modals/modules exist | Full parity NOT verified |
| AI chat and study bot | Web Ask AI | Native AskAiScreen | Full parity NOT verified |
| Attendance, calendar and reminders | Web progress/settings | Native Progress and attendance components | Full parity NOT verified |
| Home, progress, quiz and settings | Web shell | Existing native screens | Full parity NOT verified |

## Visual/functional regression protocol

1. Pin a single reference Git SHA and a single Vercel deployment. Record both in the evidence.
2. For each card, tab, modal, anatomy layer, scanner tool and scenario, script an identical click/tap sequence on Vercel Chromium mobile and native Android. Save two screenshots with identical viewport/insets, font scale, state, theme and selected content.
3. Compare layout and content positions. **Zero missing content, zero clipped labels, no overlapping buttons or inaccurate anatomy callouts.** Screenshot mismatches should have documented tolerances only for OS status/navigation bars and font rasterization.
4. Execute offline test after clearing data/reinstalling, and after assets are cached, separately. List exactly which tools need network and why.
5. Verify taps, search, gestures, audio, 3D interactions, ECG waves, annotations, UI navigation, background/foreground, memory use and low-end device stability.
6. Only then label 100% native parity and cut/upload a Play build.

## WIP checkpoint (2026-10-14)

- **Implemented in this branch:** real RN clinical-studio discovery screen; source-mirrored 7 skills and 43 clinical case metadata records; native search/segments/case choice/theme mode; checks to catch Vercel catalog drift.
- **Implemented during continuation:** native 4-channel ICU monitor with live SVG traces and same Vercel PhysiologyKernel, native clinical-case intervention screen using the same actual simulation state, 27 matching web interventions, shareable engine injection so case changes remain visible in monitor, keyboard-safe search input, and shared TS module alias across Babel/Metro/TypeScript.
- **Implemented during continuation:** native 12-lead ECG teaching canvas with all web lead names, standard calibration, STEMI and other rhythm waveforms, ECG segment selection, capture and tour mode. It uses native SVG and works offline. Advanced web ECG cutout, heart 3D visualization and ICU ECG tutorial still need native ports.
- **Not implemented:** native Three.js-equivalent 3D dissection, renderer, organ labeling, interactive radiology, auscultation, full 12-lead ECG tutorial, POCUS and many other modules.
- **Temporary behavior:** anatomy and non-ECG diagnostic tools still open the hosted Vercel renderer as a compatibility fallback, **not** an offline native port. Case interventions and bedside telemetry now use React Native and the shared Vercel physiology engine.
- **Release policy:** this branch is a draft, NOT an all-feature parity release. Never merge solely because it compiles.
