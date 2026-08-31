# Orbit MBBS — Comprehensive Claude Handover (Past 3 Days & Latest State)

Welcome Claude! Here is the complete record of everything built, fixed, refined, and deployed over the last 3 days so you can seamlessly continue development.

---

## 1. 🌿 24-Frame Cinematic Botanical Growth Engine (16 Species, 384 Keyframes)
- **Problem Solved**:
  - Trees originally had discrete 4-stage jumps, left-leaning centroids, and jumping ground baselines when morphing.
  - Slicing tool was using static grids that sliced through trees or left previous stage fragments.
  - Timers started at a clamped 20% growth, skipping the authentic Stage 1 seed/pot state.
- **Implementation**:
  - `slice_growth_stages.mjs`: Built a dynamic vertical-projection density valley detector that slices exactly 24 frames per species.
  - **Stationary Ground Baseline Lock**: The soil mound, pot, and root flare of all 384 frames across all 16 species (*oak, pine, cherry blossom, maple, willow, apple, bamboo, palm, saguaro, sequoia, bonsai, sprout, sapling, ginkgo, jacaranda, mushroom*) are locked to a single baseline ($Y = 84\%$) with horizontal centering ($X = 50\%$) on $256 \times 256$ canvases.
  - `mobile/src/components/FocusTree.tsx`: Built a continuous 60fps sub-pixel `requestAnimationFrame` interpolator with harmonic sinusoidal cross-dissolve (`blendT = 0.5 * (1 - cos(π * t))`) and sub-pixel scaling ($0.98 \rightarrow 1.01$). Even during short 1-minute timers, trees grow continuously without stepping.
  - `mobile/src/screens/TimerScreen.tsx`: Removed the legacy `Math.max(0.2, ...)` clamp so all species start authentically at Stage 1 (bare seed/pot) at 0% session launch.
  - `mobile/src/lib/forest.ts`: Implemented `clearTodayForest()` and added an interactive Reset button with tactile haptic press feedback in Today's Plot card header.

---

## 2. 🎨 Medical Diagram Engine & Strict Anti-Collision Architecture
- **Problem Solved**:
  - Questions like "Types of synovial joint" and "Cartilaginous joint" were showing "Rotator Cuff" diagrams.
  - "Blood supply of a long bone" was showing "AML vs CML" blood smear pathology plates due to low keyword match thresholds on words like `"joint"`, `"blood"`, and `"bone"`.
- **Implementation**:
  - `mobile/src/lib/handwrittenNotes.ts`:
    - Added dedicated exclusive entity families in `EXCLUSIVE_ENTITIES` for synovial joints, cartilaginous joints, fibrous joints, nutrient arteries, ossification centers, and compact bone Haversian systems.
    - Raised the matching threshold to require strict specific-noun overlap and excluded cross-subject storage prefixes.
  - **Generated & Uploaded 10 New Authentic Diagrams** to Supabase Storage (`https://pmtgeydtqypwrypshhsx.supabase.co/storage/v1/object/public/diagrams/`):
    1. `anatomy/types_of_synovial_joints.jpg` — 6 geometric joint classifications with clinical examples (Plane, Hinge, Pivot, Condyloid, Saddle, Ball & Socket).
    2. `anatomy/cartilaginous_joints_primary_vs_secondary.jpg` — Primary synchondrosis vs Secondary symphysis.
    3. `anatomy/blood_supply_of_a_long_bone.jpg` — Nutrient artery, epiphyseal & metaphyseal hairpin loops, periosteal network.
    4. `anatomy/endochondral_ossification_growth_plate_zones.jpg` — 5 histological growth plate zones (Resting $\rightarrow$ Proliferating $\rightarrow$ Hypertrophic $\rightarrow$ Calcification $\rightarrow$ Ossification).
    5. `anatomy/microscopic_structure_compact_bone_haversian_system.jpg` — Central canal, concentric lamellae, lacunae with osteocytes, canaliculi, Volkmann canals.
    6. `pharmacology/protein_synthesis_inhibitors_30s_50s.jpg` — 30S vs 50S ribosomal targets.
    7. `pharmacology/antifungal_drugs_sites_of_action.jpg` — Cell wall, membrane ergosterol, and nucleic acid targets.
    8. `pharmacology/antimalarial_drugs_sites_of_action.jpg` — Plasmodium life cycle clinical targets.
    9. `pharmacology/antiretroviral_haart_regimen_targets.jpg` — HIV replication cycle targets.
    10. `pharmacology/cancer_chemotherapy_cell_cycle_sites.jpg` — Cell cycle specific (CCS) vs non-specific (CCNS) oncology drugs.
  - **Database Mapping**: Upserted all rows into Supabase `question_diagrams` with active URLs and purged cross-subject legacy placeholders.

---

## 3. 🚀 GitHub Release & Pipeline Automation
- **GitHub Workflow**: `.github/workflows/android-release.yml` compiles signed `app-release.aab` and `app-release.apk` and publishes them to GitHub Releases.
- **Latest Live Release**:
  - **Release Name**: `Release build 101` (tag: `release-101`)
  - **URL**: [https://github.com/Sabharivarshan111/gmck/releases/tag/release-101](https://github.com/Sabharivarshan111/gmck/releases/tag/release-101)
  - **Assets**:
    - `app-release.aab` (70.69 MB)
    - `app-release.apk` (94.95 MB)
- **Pre-Release Check Suite**: All 22 pre-release scripts pass (`check:fanout`, `check:mcq`, `check:notes-limits`, `check:notes-schema`, `check:sync`, `check:cloud-ids`, `check:android-res`, `check:theme-from-image`, `check:glass`, `check:sounds`, `check:agent-docs`, `check:payments`, `check:native-sound`, `check:subject-cards`, `check:contrast`, `check:anki`, `check:textbooks`, `check:one-app`, `check:flashcard-size`, `check:streak`, `check:supabase-queue`, `check:keyboard`).

---

## 4. 📚 Agent Rules & Skill Index
- `.agents/rules/94-textbook-grounded-diagram-engine.md`: Mandatory protocol for researching benchmark Indian MBBS textbooks (*BD Chaurasia, Vishram Singh, K. Sembulingam, DM Vasudevan, Ramadas Nayak, KD Tripathi, Apurba Sastry, K. Park*) prior to diagram generation.
- `.agents/rules/95-release-and-pipeline-engine.md`: Instructions for triggering GitHub Actions workflows and releasing signed APKs and AABs.
- `CLAUDE.md`: Fully synchronized rules index.

Everything is committed to the `main` branch on `https://github.com/Sabharivarshan111/gmck.git`.
