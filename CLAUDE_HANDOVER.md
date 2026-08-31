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

## 2. 🎨 Medical Diagram Engine & Database Synchronization
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

## 3. 🚀 GitHub Release & Pipeline Automation
- **How Releases Work**:
  - Releases are built automatically by GitHub Actions workflow `.github/workflows/android-release.yml`.
  - The workflow runs full checks, lints, typechecks, builds signed `app-release.aab` and `app-release.apk`, and attaches both binaries to a new GitHub Release.
- **Latest Live Release on GitHub**:
  - **Release Name**: `Release build 101` (tag: `release-101`)
  - **URL**: [https://github.com/Sabharivarshan111/gmck/releases/tag/release-101](https://github.com/Sabharivarshan111/gmck/releases/tag/release-101)
  - **Assets Attached**:
    - `app-release.aab` (**70.69 MB**) — Google Play Console signed bundle.
    - `app-release.apk` (**94.95 MB**) — Standalone signed APK for direct device installation.
- **Pre-Release Check Suite**: All 22 pre-release scripts pass (`check:fanout`, `check:mcq`, `check:notes-limits`, `check:notes-schema`, `check:sync`, `check:cloud-ids`, `check:android-res`, `check:theme-from-image`, `check:glass`, `check:sounds`, `check:agent-docs`, `check:payments`, `check:native-sound`, `check:subject-cards`, `check:contrast`, `check:anki`, `check:textbooks`, `check:one-app`, `check:flashcard-size`, `check:streak`, `check:supabase-queue`, `check:keyboard`).

---

## 4. 📚 Agent Rules & Conventions
- `.agents/rules/94-textbook-grounded-diagram-engine.md`: Standard protocol for pre-generation textbook research from Indian MBBS textbooks (*BD Chaurasia, Vishram Singh, K. Sembulingam, DM Vasudevan, Ramadas Nayak, KD Tripathi, Apurba Sastry, K. Park*). **Note**: Native `generate_image` is an Antigravity-specific tool.
- `.agents/rules/95-release-and-pipeline-engine.md`: Instructions for dispatching release workflows and building APK/AAB binaries.
- `CLAUDE.md`: Synchronized rule index.

---

## 5. Next Steps for Upcoming Sessions
1. **Next Medical Diagram Batch (Queue of 10)**:
   - When Gemini image generation quota resets (~3 hours), the next 10 high-yield missing Anatomy diagrams from the catalog are:
     1. `Bronchopulmonary segments****`
     2. `Blood supply & lymphatic drainage of stomach ****`
     3. `Blood supply of spinal cord****`
     4. `Carotid triangle – Boundaries, Contents, Clinical anatomy ***`
     5. `Ciliary ganglion****`
     6. `Events at the level of sternal angle***`
     7. `Development of tongue****`
     8. `Descent of testes ***`
     9. `Azygos vein***`
     10. `Caudate Nucleus & Basal Ganglia Relations ***`
2. **Always Check Supabase First**: Query `question_diagrams` before generating to prevent duplicates.
