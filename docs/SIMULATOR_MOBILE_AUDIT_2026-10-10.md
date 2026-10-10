# Simulator mobile audit — 10 October 2026

Base: d4d3b60874b43c0edbe8f01e4c1b83ad6e177616 (matches production deployment dpl_9rJCKPPvG8txXDwTgmJP24HWjmDR).

## Findings and repairs

- Actual GLTFLoader sanitizes node names (spaces become underscores, periods are removed). Offline source-name audits passed, but runtime nerve/organ matching failed. Restore canonical source names retained by GLTFLoader in node.userData.name before traversal for all supplemental models. Actual loader test reproduces sympathetic failure (zero matches before; six afterward), checks all nerve groups, selective Z references, HRA organs and internal heart.
- Camera buttons moved the camera without updating React region state. Buttons now update region, selected styling and inventory, clear stale isolation and reassemble before selecting another region.
- Regional labels and atlas visibility now use registered source bounds. Regional spread packs only the region's components. Long boundary-crossing structures are assigned by source mesh centre; this is regional navigation, not a histological cutting plane.
- Searchable region -> system -> exact named source structure inventory. All 2,234 atlas entries are discoverable; rendered search results are bounded at 80, system counts/search and selection work independently of WebGL availability. Head contains 573 source entries, thorax 973, abdomen/pelvis 295. Supplementary organ-specific component strips remain available through their existing overview routes.
- Details sheet: header cannot shrink out of view, all five tabs fit without horizontal scrolling, long breadcrumbs truncate, short screen content owns a scroll area, autonomic prose/actions stack on mobile, touch targets and reduced-motion support added. Invalid location breadcrumbs cannot open unrelated heart details.
- Exact source mesh selections show the source name/FMA identity. Existing related-region dossiers are explicitly labelled as contextual. Structures without a dedicated dossier show source metadata and a truthful unavailable state rather than an unrelated heart dossier.
- Browser APKG SQL initializer union narrowed to its callable member to clear the pre-existing root TypeScript blocker; no import/scheduler semantics changed.
- Service-worker shell version advanced for installed app updates.

## Research/provenance

- Z-Anatomy: https://github.com/Z-Anatomy/Models-of-human-anatomy — existing licensed source assets already contain the sympathetic trunks/ganglia and named cranial/peripheral branches. A new model download is unnecessary for the reproduced missing-sympathetic issue.
- Open Anatomy SPL head/neck: https://www.openanatomy.org/atlas-pages/atlas-spl-head-and-neck.html — CT-derived skull, jaw, neck, vessels and glands; candidate for future head/neck coverage, separate reference body.
- Open Anatomy SPL/NAC brain: https://www.openanatomy.org/atlas-pages/atlas-spl-nac-brain.html — over 300 MRI-derived structures; complementary brain source.
- Human Reference Atlas: https://humanatlas.io/ — existing HRA same-source organ components retained; do not imply registration of separate donor reference bodies.
- BodyParts3D and Z-Anatomy retain their existing attribution and model licences. No third-party asset was newly imported or licence reassigned in this repair.

## Verification

Passed: combined Vercel build; root TypeScript; actual GLTFLoader runtime regression; existing model/provenance checks (2,234 atlas meshes, 15 streamed chunks, 272 nerve source objects, 26 HRA organ files and five selective Z files); organ resolver, dossier formatting, all-organ coverage classification, mobile-layout source guards, lifecycle and repository integrity.

Hosted clicks verified region transitions, system counts, diagnostic pupil stimuli, POCUS probes/modes and ECG explanations. Every clinical control and dedicated dossier has not been individually certified. The cloud browser cannot create a WebGL context, so physical phone GPU rendering, pinch/rotate/scalpel picking and memory performance cannot be certified here. Model decode/matching is tested with the real loader separately. Phrenic and splanchnic courses remain clearly labelled schematics. Dedicated per-mesh clinical dossiers do not yet exist for every muscle, small artery or nerve branch; metadata/contextual dossiers are not a claim of complete clinical coverage.

## Final inventory and diagnostic repairs

- Added 147 deterministic Z-Anatomy nerve groups covering all 272 source meshes to regional search, exact isolation and source metadata. All 147 IDs and all 272 mesh memberships are verified with the real GLTFLoader. No innervation prose was generated from mesh names.
- Added Front/Back/Side camera actions that preserve structure focus and zoom; phone region buttons have 44px targets.
- Removed duplicate All department, prevented an empty diagnostic modal behind the ward examination, made manual murmur overrides explicit and assigned selected cardiac presets to a cardiac auscultation site. Synthesized audio is labelled educational.
- Competitor images supplied by the user informed hierarchical browsing, compact structure labels, spread/reassemble and view direction. Additional interaction references: https://github.com/ashemag/human-atlas and https://www.biodigital.com/.

## Hosted case/action audit

Clicked all 42 case options; each produced its matching case heading. Clicked all 27 intervention buttons, with visible event feedback. Tested the five dossier tabs, exact optic-nerve dissection and undo, anatomy search/no-result state, region transitions and four ward examination sections.

The intervention audit found off-case specialized actions incorrectly reporting case-specific resolution. Added a model-coverage guard for 15 specialized effects, preserving existing lethal-trigger logic. Regression checks cover 630 case/action pairs; 607 unsupported combinations leave vitals and pathology unchanged after a physiology tick. Correct snakebite antivenom, VF shock and RV-infarction nitrate critical-error paths remain active. This checks simulation consistency; it does not certify therapeutic guidelines or all clinical prose.
