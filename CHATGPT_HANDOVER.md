# Orbit MBBS — Comprehensive Project Handover & System Reference for ChatGPT

## Executive Summary for ChatGPT
This document provides the complete, authoritative record of architecture, design systems, rules, skills, bug fixes, and development status for the **Orbit MBBS** repository (`gmck`). If you are ChatGPT (or another LLM continuing this project), this file is your primary orientation guide. Read this document thoroughly to understand how the system is structured, how to read rules and skills at appropriate times, and how to execute changes safely and effectively without regressions.

---

## 1. System Architecture & Tech Stack

Orbit is a dual-client medical education and clinical simulation platform:

```
                                  ORBIT MBBS PLATFORM
                                           │
         ┌─────────────────────────────────┴─────────────────────────────────┐
         ▼                                                                   ▼
┌─────────────────────────────────┐                         ┌─────────────────────────────────┐
│        Vite + React (Web)       │                         │       React Native (Mobile)     │
│   src/                          │                         │   mobile/                       │
│   • 3D Virtual Patient Sim      │                         │   • 16 MBBS Subjects QBank      │
│   • WebGL Three.js Engine       │                         │   • Rich Markdown Note Editor   │
│   • 100 Hz Physiology Kernel    │                         │   • 24-Frame Botanical Trees    │
│   • Dynamic POCUS & Auscultation│                         │   • Flashcard Spaced Repetition │
│   • Real-Time Wiggers / PV Loop │                         │   • Holographic Subject Cards   │
└────────────────┬────────────────┘                         └────────────────┬────────────────┘
                 │                                                           │
                 └─────────────────────────┬─────────────────────────────────┘
                                           ▼
                            ┌───────────────────────────────┐
                            │    Supabase Backend & Edge    │
                            │   • Auth & PostgreSQL DB      │
                            │   • Storage: diagrams, audio  │
                            │   • 4,500+ Question Diagrams  │
                            │   • 16 Grounded Textbooks     │
                            └───────────────────────────────┘
```

### Core Technologies
- **Web App**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons.
- **3D & Graphics**: Three.js, WebGL2 custom shaders, GLTF/GLB loaders, BodyParts3D & Z-Anatomy anatomical atlases.
- **Audio & Signal Processing**: Web Audio API (procedural bioacoustic stethoscope synthesis, QRS pitch tracking).
- **Mobile App**: React Native 0.74, Expo SDK 51, TypeScript, Reanimated, Gesture Handler.
- **Backend & Cloud**: Supabase (PostgreSQL, Storage buckets `diagrams`, `textbooks`, `audio`, Edge Functions).
- **Quality Assurance**: Playwright (headless browser screenshots, WebGL canvas testing), Vitest, TypeScript typechecking.

---

## 2. Directory Structure & Key Files

```
gmck/
├── .agents/
│   ├── rules/                 # Mandatory operating rules (00-99)
│   │   ├── 00-working-agreement.md
│   │   ├── 92-verify.md       # Verification & screenshot rules
│   │   ├── 94-textbook-grounded-diagram-engine.md  # Medical diagram rules
│   │   └── 95-release-and-pipeline-engine.md       # Release pipeline
│   └── skills/                # Specialized domain execution skills
│       ├── open-source-3d-anatomy/SKILL.md
│       ├── motion-doctrine/SKILL.md
│       ├── step-verification-screenshot/SKILL.md
│       └── ...
├── src/                       # Vite Web Application & 3D Simulator
│   ├── pages/
│   │   └── Simulator.tsx      # Main virtual patient simulator shell
│   ├── simulator/
│   │   ├── types.ts           # Core clinical & physiological interfaces
│   │   ├── engine/
│   │   │   └── PhysiologyKernel.ts    # 100 Hz differential cardiovascular & ICU kernel
│   │   ├── view/
│   │   │   └── AnatomicalBody3D.tsx   # Three.js 3D WebGL anatomy rendering engine
│   │   ├── instruments/
│   │   │   ├── IcuMonitor.tsx         # 25 mm/s multiparameter ICU telemetry canvas
│   │   │   ├── DiagnosticTools.tsx    # Stethoscope, Pupillometer, 12-Lead ECG, POCUS
│   │   │   ├── StethoscopeSynthesizer.ts # Web Audio bioacoustic heart/lung murmur engine
│   │   │   ├── cardiac-engine/        # High-fidelity Wiggers & cardiac mechanics
│   │   │   └── pocus/                 # 60 FPS dynamic B-mode ultrasound engine
│   │   └── controls/
│   │       ├── DissectionToolbar.tsx  # Inspect, Scalpel, Isolate, Peel tools
│   │       ├── OrganDetailDrawer.tsx  # Mobile-responsive slide-out clinical dossier
│   │       └── InterventionPanel.tsx  # Resuscitation actions & medication triggers
├── mobile/                    # React Native Expo Mobile App
│   ├── src/
│   │   ├── components/        # FocusTree, NoteToolbar, HoloCard, etc.
│   │   ├── screens/           # HomeScreen, BrowseHomeScreen, TimerScreen, etc.
│   │   └── lib/               # handwrittenNotes.ts, textbooks.ts, progress.ts
├── public/
│   ├── atlas/                 # 1,840-part BodyParts3D binary chunks & atlas.json
│   └── models/                # Supplementary GLB models (heart, lungs, brain, skeleton)
└── scripts/                   # Auditing, diagram uploading, and verification scripts
```

---

## 3. How to Read Rules and Skills at the Right Times

Orbit contains a comprehensive rule and skill directory located in `.agents/`. When ChatGPT works on this repository, you must consult the appropriate rule or skill based on the task:

| Task / Context | Rule / Skill to Read | Where to Find | Key Instruction |
|---|---|---|---|
| **Medical Diagram Generation** | Rule 94 | `.agents/rules/94-textbook-grounded-diagram-engine.md` | Pure `#FFFFFF` background, bold centered title, colored-pencil medical exam style, NO author names or watermarks. Check Supabase before generating. |
| **3D Anatomy & WebGL Shaders** | `open-source-3d-anatomy` | `.agents/skills/open-source-3d-anatomy/SKILL.md` | Chunk streaming limits (2 for mobile, 4 for desktop), avoid over-illumination, use depthWrite: false on transparent meshes. |
| **Testing & UI Verification** | Rule 92 & `step-verification-screenshot` | `.agents/rules/92-verify.md` & `.agents/skills/step-verification-screenshot/` | Always verify with automated Playwright screenshots before concluding any visual task. |
| **Animation & Micro-interactions** | `motion-doctrine` & Rule 10 | `.agents/skills/motion-doctrine/SKILL.md` & `.agents/rules/10-motion.md` | Non-linear easing, 60fps frame budgeting, hardware acceleration. |
| **Mobile Releases & APK/AAB** | Rule 95 | `.agents/rules/95-release-and-pipeline-engine.md` | Dispatch GitHub Actions workflow `.github/workflows/android-release.yml`. |
| **Note Editor & Formatting** | Rule 50 | `.agents/rules/50-notes.md` | Whitespace trimming on text selection, multi-color highlighting, dynamic preview. |
| **Supabase Data Architecture** | Rule 70 & Rule 97 | `.agents/rules/70-supabase.md` & `rules/97-diagram-rows.md` | Database schemas, storage paths, strict identity matching on question IDs. |

---

## 4. Complete Project Progress: Sections 1 to 22

### Section 1: 24-Frame Cinematic Botanical Growth Engine
- **What Was Built**: 16 species (*oak, pine, cherry blossom, maple, willow, apple, bamboo, palm, saguaro, sequoia, bonsai, sprout, sapling, ginkgo, jacaranda, mushroom*) each with 24 distinct developmental stages (384 keyframes total).
- **Core Algorithm**: Dynamic vertical-projection density valley detector centering trees horizontally ($X = 50\%$) and locking the ground baseline ($Y = 84\%$) across all stages.
- **Animation**: Continuous 60fps sub-pixel `requestAnimationFrame` interpolator with harmonic sinusoidal cross-dissolve (`blendT = 0.5 * (1 - cos(π * t))`) in `FocusTree.tsx`.

### Section 2: User Notes Live Preview & Rich Real-Time Formatting
- **Toolbar & Parser**: Long-press text selection in `NoteToolbar.tsx` with automatic whitespace trimming to prevent broken markdown tags like `**word **`.
- **Live Preview Segmented Control**: Segmented switcher between Edit Mode (Pencil) and Live Preview (Eye) rendering `<NoteText />` with multi-color highlighters (`==y:yellow==`, `==p:pink==`, etc.), hierarchical headings, and media attachments.

### Section 3: Android Memory Optimization & App Size Reduction
- **Asset Compression**: Purged 7MB of redundant `.jpg` files, re-deflated all 384 PNG frames with zlib level 9 compression.
- **R8 / Proguard Rules**: Added comprehensive keep rules in `mobile/android/app/proguard-rules.pro` for React Native TurboModules and JNI reflection safety.

### Section 4: Medical Diagram Engine & Database Synchronization
- **Strict Identity Matching**: Eradicated false-positive keyword overlap matching in `handwrittenNotes.ts`. Joined strictly on `question_diagrams.question_id`.
- **Supabase Synchronization**: Uploaded high-yield plates across Anatomy, Physiology, Biochemistry, and Pharmacology with active public URLs.

### Section 5: GitHub Release & Pipeline Automation
- **Automated Workflow**: `.github/workflows/android-release.yml` produces signed `app-release.aab` and `app-release.apk` with all 22 verification checks passing (`check:mcq`, `check:notes-schema`, `check:textbooks`, etc.).

### Section 6: Agent Rules & Conventions
- Codified `.agents/rules/94-textbook-grounded-diagram-engine.md` and `CLAUDE.md` to prevent historical knowledge drift across agent sessions.

### Section 7: Home Screen Component Resizing & Custom Subject Media
- **Real-Time Responsive Scaling**: 50% width halving (`HOME_SCALE_MIN = 0.50`) with pure Flexbox reflow. Halved quick actions gracefully transform into a clean 2x2 grid.
- **Custom Subject Backgrounds**: Allowed students to attach personalized background photos or video frames (<20MB) to subject cards with persistent caching in `useSubjectBackgrounds.ts`.

### Section 8: Android Process Resume Crash Fix & Diagram Regeneration Safety
- **Android Lifecycle Fix**: Passed `super.onCreate(null)` in `MainActivity.kt` to prevent native Fragment restoration crashes when Android OS resumes a backgrounded process.
- **Diagram Preservation**: Pinned authentic visual exam diagrams during AI edits and note regeneration.

### Section 9: Real-Time 3D Interactive Patient Simulator Specification
- **Master Blueprint**: Created `docs/patient_simulator_spec.md` (Version `8.0.0-UNIVERSAL-BIOMEDICAL-SIMULATION-COMPLETE`), detailing the Longtin-Milton pupillary reflex delay differential equation, 6-step ABG solver, Wiggers cardiac cycle, and clinical OSCE rubrics.

### Section 10: Computational Physiology & Open-Source Medical Blueprints
- Evaluated Kitware Pulse, BioGears, HumMod, and CellML. Designed the 100 Hz differential numerical kernel running in lockstep with the 60 FPS Three.js rendering loop.

### Section 11: Critical Care Life Support, Dialysis & Neuro-ICU (v7.0.0)
- Formalized mathematical models for ECMO hydraulic pump curves, Harlequin syndrome, IABP counterpulsation, CRRT transmembrane pressures, and Monro-Kellie intracranial compliance.

### Section 12: Universal Biomedical Simulator Frontier Ingestion (v8.0.0)
- Codified NRP 8th Edition neonatal transition mechanics, cardiopulmonary bypass hypothermic hemodynamics, and laparoscopic soft-tissue mechanics.

### Section 13: Interactive 3D Patient Simulator Live Scaffolding
- Built the live production simulator at `/simulator` in React/Three.js with 100 Hz `PhysiologyKernel.ts`, 25 mm/s `IcuMonitor.tsx`, and procedural PBR anatomical layers.

### Section 14: BodyParts3D & Z-Anatomy 1,840-Part Atlas Integration
- **Atlas Architecture**: Segmented 1,840 human anatomical parts mapped to Foundational Model of Anatomy (FMA) IDs in `public/atlas/atlas.json`.
- **Binary Chunk Streaming**: Chunked into 13 streamable binary files (`chunk-0.bin` to `chunk-12.bin`) loaded progressively via `fetchChunksWithLimit` with zero UI freezing.

### Section 15: Mobile Organ Isolation, Depth-Write Occlusion & Floating HUD
- **Drawer Monopolization Fix**: Replaced the 95vh screen-blocking drawer on mobile with a compact bottom floating pill / 20vh peek card with a "📖 View Clinical Dossier" button.
- **Occlusion Peeling**: When an internal organ is selected (e.g. Heart), occluding superficial structures (pectoralis major, rectus abdominis, intercostals, ribs, sternum) are automatically peeled away or ghosted so internal viscera are 100% visible.

### Section 16: Real-Time Wiggers Diagram, Pressure-Volume Loop & Cardiac Engine
- **Continuous Physics Engine**: Built `src/simulator/instruments/cardiac-engine/` featuring continuous real-time Left Ventricular Pressure (0-120 mmHg), Aortic Pressure (80-120 mmHg), and Left Atrial Pressure (2-12 mmHg) along with Ventricular Volume (50-120 mL).
- **Synchronized Valve Actions**: Real-time sweeps across all 7 Wiggers phases (Isovolumetric contraction, Rapid ejection, Reduced ejection, Isovolumetric relaxation, Rapid filling, Diastasis, Atrial systole) with 2.5D interactive myocardial cross-section contours and fluid velocity vectors.

### Section 17: Bioacoustic Web Audio Stethoscope Engine
- **Hardened Web Audio Graph**: In `StethoscopeSynthesizer.ts`, resolved sound dropouts and `InvalidStateError` crashes when switching valves or murmurs (Mitral Stenosis, Aortic Regurgitation, VSD pansystolic, etc.).
- **WebKit Autoplay Compliance**: Guaranteed synchronous `AudioContext.resume()` within direct touch/click events to satisfy iOS/Android browser autoplay policies.

### Section 18: Dynamic 60 FPS Point-of-Care Ultrasound (POCUS)
- **Authentic B-Mode Simulation**: Built `src/simulator/instruments/pocus/` replacing flat static graphics with dynamic ultrasound physics: 60-90° acoustic cone, time-gain compensation (TGC), and procedural speckle noise.
- **Clinical Views**: Parasternal Long Axis (PLAX) with dynamic contracting myocardium, Subxiphoid 4-Chamber with pericardial effusion stripe and RV collapse in tamponade, Lung Ultrasound with pleural sliding vs barcode sign, and Morison's pouch hemoperitoneum.

### Section 19: Dissection Toolbar, Scalpel & Radiographic X-Ray Shader
- **Dissection Tools**: Fixed pointer raycasting and overlay z-index blocking for Inspect, Scalpel, and Isolate tools. Scalpel mode hides clicked parts by adding them to `hiddenSet`.
- **Authentic Radiography**: Replaced flat 0.25 opacity with a true radiographic X-ray shader featuring Fresnel edge glow (`pow(1.0 - abs(dot(normal, viewDir)), power)`), high-density cortical bone luminescence, and inverted film monochrome styling.

### Section 20: 42 Clinical Scenarios & Comprehensive Pharmacology Engine
- **Expanded Case Database**: Upgraded from 4 to 42 fully realized clinical scenarios in `PhysiologyKernel.ts` spanning Cardiovascular, Emergency & Trauma, Toxicology, Pulmonology, GI/Hepatology, Neurology, Obstetrics, and Pediatrics.
- **Dynamic Pharmacodynamics**: Full medication regimens, dosages, routes, and physiological receptor interactions (e.g. Nitroglycerin venodilation collapsing RV preload in inferior RV infarction).

### Section 21: Multi-Organ 3D Completeness Audit & Artifact Eradication
- **Heart & Aorta**: Added all 5 subvalvular papillary muscles, whitelisted 44 cardiac veins, conus arteries, septal perforators, and clamped abdominal IVC at $y \ge 1.24$ for tight, dramatic cardiac framing.
- **Brain & Cranium**: Fixed calvarium occlusion (`depthWrite: false` on transparent bone meshes), expanded matching to all 116 cerebral gyri, deep nuclei (thalamus, basal ganglia, hippocampus, amygdala), cerebellum, brainstem, and cranial nerves.
- **Liver & Biliary**: Added intrahepatic portal venous tree and hepatic veins; removed yellow sympathetic ganglia and lymph node legs.
- **Stomach**: Pruned trailing epigastric vessel legs into thighs; preserved gastric arcades and clamped GE junction.
- **Pancreas**: Cradled pancreatic head in Duodenum C-loop (`FJ2573`), removing accidental colon IDs.
- **Spleen**: Bound parenchyma with tortuous splenic artery and hilar vein.
- **Kidneys**: Excluded distal pelvic ureters from default bounding box to prevent pulling camera into pelvis.
- **Skeleton**: Explicit `key === 'skeletal'` branch resolving all 296 bones. Verified with 29 Playwright WebGL screenshots (`cmp_01` to `cmp_29`).

### Section 22: Autonomous Textbook-Grounded Medical Diagram Pipeline
- Standardized image generation conforming to Rule 94: centered bold headers, solid `#FFFFFF` paper background, colored-pencil university exam aesthetic, zero author watermarks.
- Automated registration and Supabase database linking via `scripts/upload_new_anatomy_ent_opthal_diagrams.mjs`.

### Section 23: Version 22 Release, Clinical Proformas Master Suite & Anti-Spam Authentication
- **Version 22 Release**:
  - Pinned `versionCode 22` and `versionName "0.0.0.22"` across `mobile/android/app/build.gradle`, `mobile/src/lib/appVersion.ts`, `mobile/scripts/version-check.mjs`. Verified with `npm --prefix mobile run check:version`.
- **Anti-Spam Google Authentication Gating**:
  - On native Android (`Platform.OS === 'android'`), onboarding in `FirstRun.tsx` displays an anti-spam safeguard banner (*"To prevent spam attacks and safeguard your progress & rankings, please sign in with Google to continue."*) and gates the Display Name and Year inputs until verified.
  - On `ProgressScreen.tsx`, unauthenticated users see a security card and tapping progress metrics prompts Google sign-in.
  - **One-Time Offline Guarantee**: Authentication status is saved locally in `AsyncStorage` under `@orbit:google_authenticated_v1`. Once authenticated, the app continues to operate 100% offline without needing internet.
  - Gating strictly targets native Android; Vercel web and preview test runners are exempted (`Platform.OS !== 'android'`).
- **Comprehensive Clinical Case Proformas Master Suite (12 Proformas)**:
  - Canonical Indian MBBS examination proformas covering all 5 core subjects:
    1. Cardiovascular System (CVS) - RHD, MS, MR, AS, AR, CHF
    2. Respiratory System (RS) - Pneumonia, Consolidation, Pleural Effusion, Bronchiectasis
    3. Abdomen - Chronic Liver Disease / Cirrhosis, Portal HTN, Ascites, Splenomegaly
    4. Central Nervous System (CNS) - Acute Ischemic Stroke, MCA territory, Spastic Hemiplegia
    5. Inguinal & Ventral Hernia - Direct vs Indirect, Deep Ring Occlusion, Zieman test, Invagination, Hesselbach triangle, Lichtenstein mesh repair
    6. Varicose Veins - SFJ incompetence, Brodie-Trendelenburg, Perthes test, Pratt test, CEAP
    7. Gastric Outlet Obstruction (GOO) - Duodenal ulcer cicatrization, succussion splash, VGP
    8. Breast Lump - Fibroadenoma vs Carcinoma, Triple Assessment, Axillary levels I-III
    9. Thyroid Gland Swelling - Deglutition, Berry sign, Pemberton sign, Bethesda classification
    10. Pediatrics - Acute Gastroenteritis, WHO/IMNCI Dehydration Plan B, National Immunization Schedule
    11. Orthopaedics - Supracondylar fracture humerus, 3-point bony triangle, neurovascular status
    12. Obstetrics & Gynaecology - Term primigravida, obstetric grips (Leopold), gestational hypertension
- **Interactive Bedside Patient Clerking (`ClinicalProformaModal.tsx`)**:
  - Segmented 3-tab workspace: `[ 📖 Guide ]` | `[ ✍️ Clerk Patient ]` | `[ 🎓 Viva Q&A ]`.
  - Comprehensive editable fields: Demographics, Chief Complaints, HPI, Past/Personal History, Vitals, General Survey, Systemic Examination, Provisional Diagnosis, Differentials, Investigations & Plan.
  - Auto-saved locally on-device in `AsyncStorage` (`@orbit_proforma_case_${proformaId}`) with offline privacy guarantee.
  - Action buttons for Reset/Clear and local draft management.
- **Night-Before-Presentation AI Auto-Fill Engine (`clinicalAutoFill.ts`)**:
  - Students clerking half-completed cases can tap "AI Auto-Fill Case".
  - Connects to `askAi` (`ask-gemini`) with an expert MBBS examiner prompt if online.
  - Falls back seamlessly to rich, authentic, textbook-grade clinical templates if offline in hospital wards.
- **Persistent Bottom AI Chatbox**:
  - Docked at the bottom of the proforma modal with quick prompt chips (*"Top Viva Qs"*, *"Differentials"*, *"Case Summary"*, *"Clinical Signs"*), message history, send button, and reset button (`RotateCcw`).
- **Professor's Bedside Viva Q&A Accordion**:
  - Dedicated section rendering authentic questions asked by professors during practical case presentations, complete with detailed answers and highlighted *Examiner Tips & Marking Traps*.
- **Keyboard Safety**:
  - Wrapped modal in `KeyboardSafe` ensuring all text inputs stay above the IME keyboard on Android 15+. Verified with `npm --prefix mobile run check:keyboard`.

---

## 5. Critical Technical Invariants & Gotchas

1. **Three.js Translucency & `depthWrite`**:
   - In Three.js, setting `opacity < 1.0` with `depthWrite: true` causes the transparent mesh to write into the depth buffer, occluding opaque meshes rendered behind it.
   - For skull calvarium and peeling chest wall layers, either set `depthWrite: false` or completely discard/hide the occluding mesh (`visible = false`).

2. **Web Audio API Node Reuse**:
   - Web Audio `AudioBufferSourceNode` and `OscillatorNode` can only have `.start()` called **once**. Calling `.start()` a second time throws an uncatchable `InvalidStateError` that permanently silences the audio context.
   - Always instantiate a new node or node factory on every sound trigger or preset change.

3. **WebKit / iOS Autoplay Policy**:
   - `audioContext.resume()` **must** be called synchronously inside the user's direct `touchend` or `click` handler.
   - If there is an `await` before `resume()`, the browser treats it as an asynchronous call outside the user gesture and permanently blocks audio output.

4. **Mobile WebGL Tile Memory**:
   - On mobile devices, always clamp `devicePixelRatio` to `Math.min(window.devicePixelRatio, 1.0)`. A 3x Retina display will exhaust GPU memory and crash the browser tab (Jetsam crash).

5. **Strict Identity Join for Diagrams**:
   - Never use loose keyword search or substring matching to pair questions with diagrams.
   - Join strictly on `question_diagrams.question_id` (`question-` + first 50 characters dashed).

---

## 6. How ChatGPT Should Continue Development

When the user asks you to implement a feature or fix a bug:
1. **Locate Target Files**: Check whether the task is web (`src/`) or mobile (`mobile/`).
2. **Consult Relevant Rules**: If it involves diagrams, read Rule 94. If it involves releases, read Rule 95. If it involves 3D, read `open-source-3d-anatomy`.
3. **Verify Clean Builds**:
   - Web: `npm run build`
   - Mobile: `npm --prefix mobile run typecheck`
4. **Capture Automated Screenshots**: Run Playwright verification scripts in `scripts/` to confirm visual changes.
5. **Update Documentation**: Keep `CHATGPT_HANDOVER.md` and `CLAUDE.md` synchronized whenever a major architectural milestone is completed.
