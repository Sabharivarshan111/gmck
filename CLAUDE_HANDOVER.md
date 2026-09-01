# Orbit MBBS — Comprehensive 3-Day Project Handover & System Reference

## Executive Summary for Claude
This document contains the complete record of architecture, features, bugs solved, release pipelines, and database state across the last 3 days for the **Orbit MBBS** repository. When continuing in Claude, refer to this document for full context.

---

## 1. 🌿 24-Frame Cinematic Botanical Growth Engine (16 Species, 384 Keyframes)
- **Problem**:
  - Trees had abrupt 4-stage discrete stepping, left-leaning offset centers, and jumping ground baselines.
  - Slicing tool originally used naive fixed grids that cut through tree trunks and left stage artifacts.
  - The focus timer had a legacy `Math.max(0.2, growth)` clamp that skipped the Stage 1 seed/soil mound at 0% session start.
- **Completed Work**:
  - `slice_growth_stages.mjs`: Built a dynamic vertical-projection density valley detector that extracts exactly 24 stages per species with horizontal centering ($X = 50\%$) and **locked ground baseline ($Y = 84\%$)** across all 384 frames for all 16 species (*oak, pine, cherry blossom, maple, willow, apple, bamboo, palm, saguaro, sequoia, bonsai, sprout, sapling, ginkgo, jacaranda, mushroom*).
  - `mobile/src/components/FocusTree.tsx`: Built a continuous 60fps sub-pixel `requestAnimationFrame` interpolator with harmonic sinusoidal cross-dissolve (`blendT = 0.5 * (1 - cos(π * t))`) and sub-pixel scaling ($0.98 \rightarrow 1.01$). Even during short 1-minute sessions, growth morphs continuously with zero jerking.
  - `mobile/src/screens/TimerScreen.tsx`: Removed the 20% growth floor so sessions start authentically at Stage 1 (bare seed / potted soil) at 0% progress.
  - `mobile/src/lib/forest.ts`: Implemented `clearTodayForest()` and added an interactive Reset button with tactile feedback in Today's Plot card header.

---

## 2. 📝 User Notes Live Preview & Rich Real-Time Formatting
- **Problem**:
  - When typing notes or using formatting tools (Bold, Heading, Highlight, Bullets, Numbers), the editor was a raw `TextInput`. Users saw raw markdown tags (`# Heading`, `**bold**`, `==highlight==`, `- bullet`) while writing and had no way to view the formatted result in real time.
  - Heading and list parsing was fragile if trailing spaces or formatting markers varied.
  - When long-pressing on a mobile phone to select text, Android frequently selects trailing whitespace (`"word "`), which broke markdown tags into invalid strings like `**word **`.
- **Completed Work**:
  - `mobile/src/components/NoteToolbar.tsx`:
    - **Long-Press Selection Formatting**: Long-pressing or double-tapping any text in the note editor and tapping **`B`**, **`I`**, or **`Highlighter`** immediately wraps the selected text.
    - **Whitespace Trimming**: `toggleWrap` automatically detects and excludes leading/trailing whitespace from the selection bounds so formatting is always syntactically valid (`**word** ` instead of `**word **`).
    - **Multi-Color Highlight Switching & Toggle**: Selecting an already-highlighted phrase and tapping a new swatch switches colors (`==y:text==` $\rightarrow$ `==p:text==`), or tapping the same color un-highlights it.
    - Added visual active state indicators on toolbar buttons when palettes are open.
  - `mobile/src/components/NoteText.tsx`:
    - Upgraded `parseNote` to leniently parse `#` to `######` headings (including `#Heading`), bullets (`-`, `*`, `•`, `+`, `–`, `—`), numbers (`1.`, `1)`, `1:`, `1]`), and bold line headers.
    - Upgraded `parseInlineTokens` to support markdown and HTML inline markers (`**bold**`, `__bold__`, `<b>`, `<strong>`, `*italic*`, `_italic_`, `<i>`, `<em>`, `==highlight==`, `==y:yellow==`, `==g:green==`, `==b:blue==`, `==p:pink==`, `<mark>`, `~~strike~~`, `<del>`, `<s>`).
    - Made `plainPreview` clean and robust so card previews strip markdown tags cleanly without showing raw `#` or `*`.
  - `mobile/src/components/ProgressNotesTab.tsx`:
    - Added a **Segmented Mode Switcher** at the top of the editor: **[Edit Mode (Pencil)] | [Live Preview (Eye)]**.
    - In **Live Preview Mode**: Renders a dedicated live card displaying real-time formatted `<NoteText content={editContent} font={editFont} />` with exact bold styling, multi-color highlighters, hierarchical headings, indented bullets, and attached media/drawings.
  - `mobile/src/components/NoteToolbar.tsx`: Added an instant toggle button to switch between editing and live preview directly from the toolbar.

---

## 3. 📱 Android Memory Optimization & App Size Reduction (Google Guidelines)
- **Problem**:
  - App assets had 7MB of redundant uncompressed `.jpg` duplicates alongside `.png` frames in `mobile/src/assets/trees/`.
  - Proguard / R8 minification and resource shrinking were missing keep rules for TurboModules.
- **Completed Work**:
  - Removed 7MB of unused `.jpg` tree assets in `mobile/src/assets/trees/`.
  - Re-deflated all 384 PNG frames with maximum zlib compression level 9 and optimal filter type.
  - `mobile/android/app/proguard-rules.pro`: Added comprehensive keep rules for React Native TurboModules, JNI bindings, and app namespaces so R8 can safely minify code and shrink resources in release builds without runtime reflection regressions.

---

## 4. 🎨 Medical Diagram Engine & Database Synchronization
- **Problem**:
  - Questions like "Types of synovial joint" and "Cartilaginous joint" showed "Rotator Cuff" diagrams.
  - "Blood supply of a long bone" showed "AML vs CML" blood smear pathology plates due to low keyword match thresholds on common words like `"joint"`, `"blood"`, and `"bone"`.
- **Completed Work**:
  - `mobile/src/lib/handwrittenNotes.ts`:
    - Added dedicated exclusive entity families in `EXCLUSIVE_ENTITIES` for synovial joints, cartilaginous joints, fibrous joints, nutrient arteries, ossification centers, and compact bone Haversian systems.
    - Raised the matching threshold to require strict specific-noun overlap and excluded cross-subject storage prefixes.
  - **Uploaded 10 High-Yield Diagrams to Active Supabase Storage (`pmtgeydtqypwrypshhsx`)**:
    1. `anatomy/types_of_synovial_joints.jpg` — 6 geometric joint classifications (Plane, Hinge, Pivot, Condyloid, Saddle, Ball & Socket).
    2. `anatomy/cartilaginous_joints_primary_vs_secondary.jpg` — Primary synchondrosis vs Secondary symphysis.
    3. `anatomy/blood_supply_of_a_long_bone.jpg` — Nutrient artery, epiphyseal & metaphyseal hairpin loops, periosteal network.
    4. `anatomy/endochondral_ossification_growth_plate_zones.jpg` — 5 histological growth plate zones (Resting $\rightarrow$ Proliferating $\rightarrow$ Hypertrophic $\rightarrow$ Calcification $\rightarrow$ Ossification).
    5. `anatomy/microscopic_structure_compact_bone_haversian_system.jpg` — Central canal, concentric lamellae, lacunae with osteocytes, canaliculi, Volkmann canals.
    6. `pharmacology/protein_synthesis_inhibitors_30s_50s.jpg` — 30S vs 50S ribosomal targets.
    7. `pharmacology/antifungal_drugs_sites_of_action.jpg` — Cell wall, membrane ergosterol, and nucleic acid targets.
    8. `pharmacology/antimalarial_drugs_sites_of_action.jpg` — Plasmodium life cycle clinical targets.
    9. `pharmacology/antiretroviral_haart_regimen_targets.jpg` — HIV replication cycle targets.
    10. `pharmacology/cancer_chemotherapy_cell_cycle_sites.jpg` — Cell cycle specific (CCS) vs non-specific (CCNS) oncology drugs.
  - **Database Mapping**: Upserted all rows in `question_diagrams` table with `status = 'approved'` and active public URLs, purging bad cross-subject placeholders.

---

## 5. 🚀 GitHub Release & Pipeline Automation
- **How Releases Work**:
  - Releases are built automatically by GitHub Actions workflow `.github/workflows/android-release.yml`.
  - The workflow runs full checks, lints, typechecks, builds signed `app-release.aab` and `app-release.apk`, and attaches both binaries to a new GitHub Release.
- **Latest Live Release on GitHub**:
  - **Release Name**: `Release build 105` (tag: `release-105`)
  - **URL**: [https://github.com/Sabharivarshan111/gmck/releases/tag/release-105](https://github.com/Sabharivarshan111/gmck/releases/tag/release-105)
  - **Assets Attached**:
    - `app-release.aab` (**69.54 MB**) — Google Play Console signed bundle.
    - `app-release.apk` (**87.82 MB**) — Standalone signed APK with full R8 bytecode minification and Dual-Axis Home Resizing.
- **Pre-Release Check Suite**: All 22 pre-release scripts pass (`check:fanout`, `check:mcq`, `check:notes-limits`, `check:notes-schema`, `check:sync`, `check:cloud-ids`, `check:android-res`, `check:theme-from-image`, `check:glass`, `check:sounds`, `check:agent-docs`, `check:payments`, `check:native-sound`, `check:subject-cards`, `check:contrast`, `check:anki`, `check:textbooks`, `check:one-app`, `check:flashcard-size`, `check:streak`, `check:supabase-queue`, `check:keyboard`).

---

## 6. 📚 Agent Rules & Conventions
- `.agents/rules/94-textbook-grounded-diagram-engine.md`: Standard protocol for pre-generation live Supabase duplicate check across all 228 diagrams. **Note**: Native `generate_image` is an Antigravity-specific tool operating in batches of 10.
- `.agents/rules/95-release-and-pipeline-engine.md`: Instructions for dispatching release workflows and building APK/AAB binaries.
- `CLAUDE.md`: Synchronized rule index.

---

## 7. 🎛️ Home Screen Component Resizing, Drag-and-Drop & Custom Subject Media
- **Real-Time Responsive Component Resizing (Zero Clipping, 50% Halving & Pure Flexbox Reflow)**:
  - **50% Scaling Range**: Allows resizing cards down to 50% width (`HOME_SCALE_MIN = 0.50`), enabling users to halve components (like the Welcome hero card or Quick Actions) smoothly.
  - **Real-Time Layout Reflow**:
    - When `hero` is halved, the card centers gracefully, body text & creator badge shed, title font scales down responsively, and carousel dots remain centered.
    - When `quick` actions are halved, the 4 buttons automatically reflow into a clean **2x2 grid** (`width: '48%'`), displaying full labels (*Progress, Search, Timer, Ask AI*) with zero truncation or text clipping.
    - When `stats` and `whatsapp` are narrowed, they adjust their padding and font sizes into crisp single-column / compact badges.
  - **Precision-Aligned Glowing Slider Handles**:
    - Right-side vertical handle (`↔`): centered directly along the right card border (`top: 50%`, `right: -11`, glowing pill `44x5.5dp`).
    - Bottom horizontal handle (`↕`): centered directly along the bottom card border (`left: 50%`, `bottom: -11`, glowing pill `44x5.5dp`).
    - Corner 2D grip (`⤡`): glowing circular target badge (`bottom: -8`, `right: -8`).
    - Floating pill toolbar: docked cleanly at the top-right corner (`top: -24`, `right: 0`).
- **Custom Subject Card Background Image & Media (<20MB)**:
  - `mobile/src/hooks/useSubjectBackgrounds.ts`:
    - Manages user-uploaded custom pictures / video frames per subject with persistent AsyncStorage cache (`orbit:subject-backgrounds-v1`).
    - Enforces a strict **20 MB size limit** (`MAX_SUBJECT_MEDIA_BYTES = 20 * 1024 * 1024`), rejecting oversized files with a friendly user dialog.
  - `mobile/src/components/HoloCard.tsx`:
    - When `bgImageUri` is set, renders the user's custom photo/video frame with a dark glass scrim (`rgba(0,0,0,0.45)`) and iridescent holographic sheen over it.
    - Preserves subject emoji icon, uppercase name, percentage, and progress bar with 100% readability.
  - `mobile/src/screens/HomeScreen.tsx`:
    - In edit mode, each subject card displays an **Image Upload Button (`ImagePlus`)** to choose an image from the photo gallery, and an **`X` Reset Button** to revert to the default holographic foil gradient.

---

## 8. 🧬 Medical Diagram Precise Entity Matching & Android Background Crash Fix
- **Diagram False-Positive Mismatches (Transport Mechanisms & TCA Cycle)**:
  - **Problem**:
    - Opening "Transport mechanisms a) Passive..." showed unrelated "Lipoprotein Metabolism (Reverse Cholesterol Transport)" and "Bilirubin Metabolism (Formation, transport and fate)" diagrams.
    - Opening "TCA cycle – definition, sequence of reaction, energetics, regulation" showed "Glycolysis" and "Gluconeogenesis" diagrams.
  - **Root Cause**:
    - `findAllDiagramsForQuery` in `handwrittenNotes.ts` used generic word matching (`score += 1` for common words like `transport`, `definition`, `sequence`, `reaction`, `energetics`, `regulation`, `cycle`) with a low match threshold ($\ge 2$).
  - **Fix**:
    - Added all generic query terms (`definition`, `sequence`, `reaction`, `energetics`, `regulation`, `mechanism`, `transport`, `metabolism`, etc.) to `DIAGRAM_STOP_WORDS`.
    - Added dedicated exclusive entity families in `EXCLUSIVE_ENTITIES` for all Biochemistry pathways (*TCA cycle, Glycolysis, Gluconeogenesis, Glycogen storage, HMP shunt, Urea cycle, Beta-oxidation, Ketogenesis, Lipoprotein/RCT, Bilirubin/Jaundice, Purine/Gout, Pyrimidine, SPEP Electrophoresis, ETC complexes, Visual cycle, Translation, Membrane transport*) and Physiology systems.
    - Upgraded `findAllDiagramsForQuery` to require strict entity family matching with zero false positives.
    - Upgraded `ensureSingleNoteDiagram` to automatically validate and strip any existing mismatched/corrupted diagram sections from previously cached notes.

- **Android App Resume / Background Crash Fix**:
  - **Problem**:
    - Leaving the app in the background for a while caused the app to crash on the first resume attempt, while the second launch worked normally.
  - **Root Cause**:
    - When Android OS kills a backgrounded process to reclaim RAM, it saves the Activity state (`savedInstanceState`). On resume, Android attempts to replay the native Fragment transactions from the bundle before the React Native JavaScript engine and navigation tree have hydrated, triggering a native Fragment restoration crash.
  - **Fix**:
    - In `mobile/android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd/MainActivity.kt`, updated `onCreate(savedInstanceState: Bundle?)` to pass `super.onCreate(null)` per official React Navigation / React Native Android guidelines. This discards stale native Fragment state and ensures every process restoration boots cleanly without crashes.

- **Diagram Preservation on Note Regenerate & AI Edits**:
  - **Problem**:
    - Tapping "Write this note again" (Regenerate) or using "Fix notes with AI" (`NotesAiEditBox`) caused attached visual diagrams to disappear.
  - **Root Cause**:
    - The AI edge function returns text-only sections. When applying edits or replacing notes, the proposal wiped the `🎨 High-Yield Visual Exam Diagram` section and `diagramUrl`.
  - **Fix**:
    - In `mobile/src/lib/handwrittenNotes.ts` (`mergeProposal`), extracted and pinned all existing diagram sections at the top of the notes.
    - In `mobile/src/components/NotesAiEditBox.tsx` (`apply`), preserved authentic diagram sections when replacing note contents.

- **Batch 1 & Batch 2 Anatomy Diagrams Added (Total: 115 Complete Anatomy Diagrams in Supabase)**:
  - **Batch 1 (10 Diagrams)**:
    1. `ulnar_nerve_course_branches.jpg` (Medial cord, cubital tunnel, Guyon canal, claw hand)
    2. `radial_nerve_spiral_groove.jpg` (Posterior cord, spiral groove with profunda brachii, PIN, wrist drop)
    3. `median_nerve_course_branches.jpg` (Cubital fossa, pronator teres, carpal tunnel, LOAF, ape thumb)
    4. `sciatic_nerve_course_branches.jpg` (Piriformis, hamstrings, popliteal bifurcation, foot drop)
    5. `femoral_nerve_course_branches.jpg` (L2-L4, psoas groove, femoral triangle, quadriceps)
    6. `rectus_sheath_cross_sections.jpg` (3 levels, arcuate line, rectus abdominis, epigastric vessels)
    7. `trigeminal_nerve_divisions_ganglia.jpg` (V1-V3, Ciliary, Pterygopalatine, Otic, Submandibular ganglia)
    8. `thoracic_duct_course_tributaries.jpg` (Cisterna chyli, T5 crossing, left Pirogoff angle)
    9. `stomach_bed_posterior_relations.jpg` (Lesser sac, pancreas, left kidney, splenic artery, spleen)
    10. `spleen_visceral_surfaces_relations.jpg` (Gastric, renal, colic, pancreatic impressions, hilum)
  - **Batch 2 (10 Diagrams)**:
    11. `thyroid_gross_relations_blood_supply.jpg` (Pretracheal fascia, Berry ligament, recurrent laryngeal nerve)
    12. `kidney_anterior_relations_impressions.jpg` (Right vs Left kidney organ impressions & peritoneal coverage)
    13. `anal_canal_interior_pectinate_line.jpg` (Morgagni columns, pectinate line, internal & external sphincters)
    14. `tongue_muscles_nerve_supply_lymphatics.jpg` (Papillae, genioglossus, CN V3/VII/IX/XII innervation)
    15. `lateral_wall_of_nose_meatuses_sinuses.jpg` (Conchae, meatuses, paranasal air sinus openings)
    16. `submandibular_gland_relations_mylohyoid.jpg` (Mylohyoid border wrap, Wharton duct lingual nerve sling)
    17. `pharynx_constrictor_muscles_killians.jpg` (Superior/middle/inferior constrictors, Killian's dehiscence)
    18. `uterus_supports_ligaments_blood_supply.jpg` (Mackenrodt cardinal ligaments, uterine artery 'water under bridge')
    19. `venous_drainage_heart_coronary_sinus.jpg` (Coronary sinus tributaries, cardiac veins, Thebesian veins)
    20. `duodenum_parts_interior_arterial_arcade.jpg` (4 parts, major/minor duodenal papillae of Vater, SMA arcade)

---

## 11. 🏥 Final Year Triple-Tap & Textbook Grounding Integration (16 Textbooks Across 4 MBBS Years)
- **Problem**:
  - Final Year textbooks were uploaded to Supabase storage bucket `textbooks` on August 31, but `mobile/src/lib/textbooks.ts`, `QuestionCard.tsx`, and `generate-handwritten-notes` had not been mapped to them.
  - Triple-tapping any Final Year question previously routed to generic Ask AI with no textbook grounding.
  - In `BrowseHomeScreen.tsx`, search results were hardcoded to `item.year === 'third-year'` for handwritten notes.
  - In `QuestionRow.tsx`, `TAP_WINDOW_MS` was set to `280ms`, causing fast 3-tap gestures on Android touchscreens to prematurely time out into double-tap MCQs.
- **Completed Work**:
  - **16 Textbooks Configured Across All 4 MBBS Years**:
    - **1st Year**: Anatomy (*Vishram Singh + Langman's*), Physiology (*K. Sembulingam*), Biochemistry (*DM Vasudevan*).
    - **2nd Year**: Pharmacology (*KD Tripathi + Tara Shanbhag*), Pathology (*Ramadas Nayak*), Microbiology (*Apurba S. Sastry*).
    - **3rd Year**: Community Medicine (*Sia's Park*), Forensic Medicine (*Vision*).
    - **Final Year**:
      - **Obstetrics**: Grounded in **DC Dutta** (`obgyn/dc_dutta_gynaecology_part1.txt` & `part2.txt`).
      - **Gynaecology**: Grounded in **Shaw's** (`obgyn/shaws_gynaecology_part1.txt` & `part2.txt`).
      - **General Surgery**: Grounded in **Manipal Manual of Surgery** (`surgery/manipal_surgery_part1.txt`..`part4.txt`).
      - **Orthopaedics**: Grounded in **Maheshwari Essential Orthopaedics** (`orthopaedics/maheshwari_orthopaedics_part1.txt` & `part2.txt`).
      - **General Medicine**: Grounded in **Manipal Prep Manual of Medicine** (`medicine/manipal_medicine_part1.txt`..`part3.txt`).
      - **Paediatrics**: Grounded in **OP Ghai Essential Pediatrics** (`paediatrics/op_ghai_paediatrics_part1.txt`..`part3.txt`).
      - **ENT**: Grounded in **PL Dhingra** (`ent/dhingra_ent_part1.txt` & `part2.txt`).
      - **Ophthalmology**: Grounded in **AK Khurana** (`ophthalmology/khurana_ophthalmology_part1.txt` & `part2.txt`).
  - **Dynamic Multi-Year Triple-Tap Gate**:
    - `src/components/QuestionCard.tsx`: Replaced hardcoded `yearKey === "third-year"` with `hasTextbook(subjectKey, subjectName)` and adjusted tap window to 380ms.
    - `mobile/src/lib/textbooks.ts` & `src/lib/textbooks.ts`: Full mirror of `pickBookKey` across all 16 subjects.
    - `mobile/src/screens/BrowseHomeScreen.tsx`: Updated search result `onNote` to use `hasTextbook(item.subjectKey, item.subjectName)`.
    - `mobile/src/components/QuestionRow.tsx`: Increased `TAP_WINDOW_MS` from `280ms` to `380ms` for seamless touch responsiveness on Android.
  - **Server Edge Function**:
    - Created `supabase/functions/generate-handwritten-notes/index.ts` and `textbook.ts` supporting dynamic storage chunk downloading, tokenized paragraph relevance ranking, and single-mode question caching in `handwritten_notes`.
  - **Validation**:
    - `npm --prefix mobile run check:textbooks`: **PASSED** (16 books verified across all 4 MBBS years).
    - `npm --prefix mobile run typecheck`: **PASSED** (0 errors).
    - `npm run build`: **PASSED** (Vite web build clean).

