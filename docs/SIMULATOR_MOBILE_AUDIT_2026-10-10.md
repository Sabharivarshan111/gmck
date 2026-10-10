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

Hosted click audit pending at initial checkpoint. The cloud browser cannot create a WebGL context, so physical phone GPU rendering, pinch/rotate/scalpel picking and memory performance cannot be certified here. Model decode/matching is tested with the real loader separately. Phrenic and splanchnic courses remain clearly labelled schematics. Dedicated per-mesh clinical dossiers do not yet exist for every muscle, small artery or nerve branch; metadata/contextual dossiers are not a claim of complete clinical coverage.
