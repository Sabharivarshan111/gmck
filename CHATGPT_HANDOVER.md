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

---

## 7. Release v23 — Definitive General Medicine Case Proformas & Clinical Media Overhaul

### 7.1 What Changed in v23
The General Medicine case proforma was recognized as insufficient for post-graduate and final-year undergraduate MBBS clinical practical examinations. Grounded in the 4 authoritative college proforma materials (CVS, RS, Abdomen, and CNS) provided in Google Drive, `mobile/src/lib/clinicalProformas.ts` was expanded from 1,473 lines to 3,267 lines (+2,440 insertions):

1. **Cardiovascular System (`cvs_proforma`)**:
   - Comprehensive HPI with SOCRATES chest pain breakdown.
   - Rigorous negative history (RHF, LHF, RF, CHD, PHT).
   - All 10 arterial pulse characteristics and 4-limb blood pressure with postural drop.
   - JVP waveform analysis: 'a', 'c', 'x', 'v', 'y' waves, cannon 'a', Kussmaul sign, abdominojugular reflux.
   - All 12 peripheral signs of severe Aortic Regurgitation: Hill, Lighthouse, Locomotor brachii, Collapsing/Corrigan, Pulsus bisferiens, Landolfi, Müller, Quincke, Duroziez, Traube, Becker, Gerhardt/Sailer.
   - Precordial inspection, palpation (tapping vs. heaving vs. hyperdynamic apex, parasternal heave grades I-III, thrills, palpable P2/S1), percussion, and dynamic auscultation maneuvers (bell in left lateral decubitus for MS; sitting forward in expiratory apnea for AR; Carvallo sign for TR).
   - 5-part anatomical, valvular, functional (NYHA), rhythm, and complication diagnosis formulation rubric.

2. **Respiratory System (`respiratory_proforma`)**:
   - Detailed symptom profiling: cough, sputum (3-layered in bronchiectasis, rusty in pneumonia), mMRC dyspnea grading 0-4, hemoptysis (MS pulmonary apoplexy vs. TB vs. malignancy).
   - Systematic negative history (TB B-symptoms, CVS, malignancy).
   - Aspiration risk factors (ABCDEF mnemonic) and abdominal triggers for sympathetic effusion.
   - Clubbing (grades 1-4, Lovibond, Schamroth; rule: absent in COPD alone), Horner syndrome, Hoover sign, Trail sign, Campbell sign.
   - Objective tape chest expansion (>= 5 cm) and 9-region comparative TVF.
   - Bilateral 9-region comparative percussion (+/- mapping), Traube space, tidal percussion.
   - Auscultation across all 9 regions (vesicular, tubular/cavernous/amphoric bronchial breathing, fine/coarse crackles, wheezes, pleural rub, bronchophony, whispering pectoriloquy, egophony E-to-A, succussion splash, coin percussion test).
   - Etiological, anatomical, pathological, and functional diagnostic formulation rubric.

3. **Abdomen & Hepatobiliary (`abdomen_proforma`)**:
   - SOCRATES abdominal pain, distension (6 Fs), jaundice, upper GI bleed, encephalopathy.
   - Viral hepatitis risks & vaccines, metabolic liver diseases (Wilson, Hemochromatosis, AAT deficiency).
   - Complete head-to-toe stigmata of chronic liver disease & portal HT (temporal wasting, KF ring, parotid enlargement, fetor hepaticus, spider angiomas in SVC territory, gynecomastia, asterixis, palmar erythema, Dupuytren, Terry nails, Muehrcke lines, caput medusae, testicular atrophy, Spider-man habitus).
   - Supine, head-rising, and standing inspection. Two-finger milking test for venous flow direction.
   - Liver span in MCL, spleen palpation from RIF with Hackett grading 0-5 and Middleton maneuver, bimanual kidney ballottement.
   - Ascites evaluation: fluid thrill (> 1500 mL), shifting dullness (> 500 mL), puddle sign (~ 100 mL).
   - Cruveilhier-Baumgarten venous hum, arterial bruits, friction rubs, succussion splash, and Child-Turcotte-Pugh scoring (PABAE criteria).

4. **Central Nervous System (`cns_proforma` — M.D. Grade)**:
   - Handedness & hemisphere dominance.
   - Motor weakness functional task breakdown: upper limb proximal (combing hair) vs. distal (buttoning/writing); lower limb proximal (squatting) vs. distal (slipping chappals/tripping toes); neck flexion vs. extension; Beevor sign; single breath count < 20.
   - ABCDEFM involuntary movements and sensory positive vs. negative symptoms.
   - Folstein 30-point MMSE scoring rubric and aphasia/dysarthria evaluation.
   - Bilateral Cranial Nerves I to XII testing protocol with UMN vs. LMN VII distinction.
   - Circumferential tape measurements from fixed bony landmarks.
   - Tone, MRC Grade 0-5 power, complete superficial and deep tendon reflexes (inverted supinator, pendular knee jerk), primitive/frontal release reflexes (glabellar tap, palmomental, snout, grasp, Hoffmann).
   - Cerebellar VANISHED signs, gait analysis, sensory modalities, meningeal signs, peripheral nerve thickening.
   - Dual-tier master diagnostic formulation (Anatomical localization + Pathological diagnosis).

5. **Tooling & Release Gates**:
   - `PdfViewerModal.tsx` aspect-ratio bounding and pinch-zoom stabilization.
   - `NoteLinkCard.tsx` enhanced note preview rendering.
   - All 7 verification checks pass: `typecheck`, `check:version` (v23), `check:apkg`, `check:anki`, `check:mcq-card`, `check:keyboard`, `check:repo-intact`.

---

## 8. Handover to ChatGPT — 2026-09-18 (Claude Code session)

Branch: `claude/continue-previous-z98gdv`. Everything below is committed and
pushed. Read §8.5 before you trust any of it — a significant amount was not
typechecked.

### 8.1 What this session did

| Area | Outcome |
|---|---|
| Case proformas | **12 → 40** across 7 departments |
| General examination | 19 signs defined, **10 with real photographs** live in the bucket |
| Rewarded ad | Four defects root-caused and fixed; `check:ads` added |
| Broken diagrams | **39 questions were showing a broken image**; now 0 |
| Picker UI | Grouped by department, empty state, two reference buttons above the search |
| New checks | `check:ads`, `check:exam-signs`, `check:proformas` |
| Fixed your v23 code | `NoteLinkCard.tsx` full-screen modal padded its bar by a hardcoded 48 |

### 8.2 THE FIRST THING TO DO — the depth gap, measured

**Your four system proformas are four times deeper than the other thirty-six,
and that gap is now the main quality problem in this feature.**

```
cns_proforma           757 lines   49 checklists   6 viva
abdomen_proforma       552         37              6
respiratory_proforma   526         34              6
cvs_proforma           498         31              6
------------------------------------------------------ median 539
csom_proforma          243         14              5
cataract_proforma      206         10              4
swelling_proforma      175         10              2
...
dermoid_cyst_proforma   69          3              1
------------------------------------------------------ median 136
```

The 28 cases added this session are written to the standard of the EXISTING
short proformas (thyroid 120, breast 116, hernia 164), not to the standard you
set in v23. They are exam-correct and they carry the discriminating findings,
but they do not have the "all 12 peripheral signs of AR, named" density.

**Deepen them in this order** — commonest long cases first:

1. `cld_portal_htn_proforma` (136) — commonest medicine long case with a big abdomen
2. `dm_complications_proforma` (139)
3. `ckd_nephrotic_proforma` (136)
4. `stroke_hemiplegia_proforma` (140)
5. `obstetrics_anc_proforma` (144)
6. `ortho_fracture_proforma` (149) — **and see §8.4, its source could not be read**
7. `anaemia_proforma` (115)
8. `pyrexia_tb_proforma` (134)

Run `npm run check:proformas` after each; it prints the per-department counts
and validates structure, unique ids, the system union and every `diagramPath`.

### 8.3 Two bug classes worth internalising, because both will recur

**A row pointing at nothing.** 25 plates behind 39 `question_diagrams` rows had
a `public_url` for a file the bucket did not hold. Cause: writing a row and
uploading the plate go by **two different routes and only one works from a
sandbox**. The MCP connector gives SQL; the egress gateway blocks the project
host, so an agent writes a row for a URL it cannot create. `supabase-tasks.yml`
now has a generic idempotent upload step — **dispatch it after any session that
adds plates to `public/diagrams/`**. It reports every row still pointing at a
missing plate whether or not it uploads anything.

**A picture that is plausible and wrong.** The first sign-image fetch took the
first freely-licensed Commons hit and was wrong for 5 of 19 — a portrait of a
real filmmaker for "clubbing", a Roman bronze nail cleaner for "platonychia",
hand-foot syndrome for "palmar erythema". Commons full-text search matches the
file PAGE, so any page mentioning the word ranks. Every sign now carries
`titleMustContain` and the gate runs BEFORE the licence check. **Do not loosen
it**; `check:exam-signs` fails on a generic word ("nail", "hand", "eye") in a
gate, and all five wrong hits would have passed a generic gate.

This is the same lesson `CLAUDE.md` records for `question_diagrams`: a keyword
search cannot choose a clinical picture, and a plausible wrong one is worse
than a blank because the reader trusts it.

### 8.4 Source material is now in the repo

`.agents/sources/proformas/` holds the owner's 15 proforma PDFs extracted to
**plain text** (not SVG — nothing here is a drawing), plus
`extract-pdf-text.py`, a dependency-free extractor written because
`pdftotext`, `pypdf` and `pip` are all unreachable from an agent sandbox. It
decodes per-font ToUnicode CMaps, which is the part that matters — Word subsets
its fonts, so one merged table turns "Breast" into "BreaVt".

**Two files could not be read**: `ortho_casesheets-1.pdf` and
`proforma_medicine.pdf` are image-only CamScanner scans with no text layer, and
OCR needs a package this sandbox cannot install. `ortho_fracture_proforma` was
therefore written from the standard sequence (Apley, Maheshwari) rather than
from the owner's sheet. **If you can OCR them, do — and if his sheet differs,
his sheet wins.**

### 8.5 NOT VERIFIED — read before you build on this

**Nothing this session was typechecked, linted or screenshotted.** `npm ci`
fails here: the proxy returns 403 for registry tarballs, so `node_modules` does
not exist and `tsc`, `eslint`, `check:smoke` and the preview harness could not
run. Only the dependency-free checks ran, and those are green:
`check:ads`, `check:exam-signs`, `check:proformas`, `check:edges`,
`check:keyboard`, `check:repo-intact`, `check:agent-docs`,
`check:supabase-queue`.

**Your first command should be:**

```sh
cd mobile && npm ci && npx tsc --noEmit && npx eslint . --quiet
```

The three changes most worth a real typecheck:
- `src/lib/ads.ts` — rewritten state machine
- `src/components/ClinicalProformaModal.tsx` — regrouped list, two new sheets
- `src/components/LabValuesSheet.tsx`, `GeneralExamSheet.tsx` — new files

Then screenshot the picker: the quick-reference row, the grouped list and the
two new pages have never been rendered.

### 8.6 Still outstanding

- **47 plates sit in the bucket with no `question_diagrams` row**, so they are
  invisible in all three apps. Same class as the 2026-09-02 fix. Each needs
  matching to its bank question BY HAND — never by keyword, never blind.
- **9 of 19 signs have no photograph** because nothing passed the title gate.
  That is the correct outcome. Re-dispatch `exam-sign-images.yml` with better
  `search` terms if you want to try again; do not widen `titleMustContain`.
- The depth gap in §8.2.

### 8.7 Conventions this session added, which `CLAUDE.md` now assumes

- **A department per file** under `mobile/src/lib/proformas/`, spread into
  `CLINICAL_PROFORMAS`. `clinicalProformas.ts` had passed 290 KB in one array.
  Import the type with `import type` — the cycle is then erased at compile time.
- **The general examination is never repeated inside a proforma's `sections`.**
  Every source sheet recites the same PICCKLE line; the app draws it once from
  `generalExamSigns.ts`, with photographs. Fourteen copies is fourteen things
  to keep in step.
- **`swelling_proforma` holds the lump framework once.** Eight short cases are
  the same examination on a different site.
- **Readiness belongs to an instance, not to a module.** The ad bug was a
  module-level boolean beside a module-level instance describing different ads.
