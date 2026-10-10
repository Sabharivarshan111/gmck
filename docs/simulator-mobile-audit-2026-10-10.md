# Patient simulator mobile audit — 2026-10-10

## Implemented

- Anatomy viewport precedes the component browser and reference shortcuts on phones.
- Head, thorax and abdomen use scoped component inventories; mobile system filtering uses a native select.
- Anatomy sheet grows from 38dvh to min(62dvh,540px), expands to 88dvh, and uses full height in short landscape viewports.
- Simulator light/dark styling is independent of the surrounding question-bank theme. Titles are readable in both modes.
- Phone header is compact; buttons meet a 44px minimum through the mobile/tablet breakpoint. Form text uses 16px; diagnostic prose is readable.
- Isolated-part Dossier opens the exact selected source item. Reference strips are hidden on mobile Monitor/Case tabs.
- Pupil controls, ECG tutorial header, legends and cardiac subsystem controls fit phones. Graph phases use a numbered key on narrow canvases.
- Tricuspid/pulmonic auscultation sites explain missing scenario-specific findings instead of displaying an empty area.
- Source vestibular nerve is withheld from the peripheral overview and isolated rendering: catalog bounds place it at y=0.0798–0.0841m, unlike registered cranial meshes. Source identity remains searchable, with an explicit registration notice; no invented transform or substitute is used.
- Service-worker version includes both simulator and concurrently updated PG offline content.

## Evidence and validation

Actual application rendered in the source-owned `/simulator-responsive-audit.html` iframe at 360×800, 390×844, 430×932 and 844×390. Classic browser scrollbars reduce content width by 15px. This is responsive browser testing, not physical-device testing.

- Portrait sheet checks: no page-level horizontal overflow, no visible button below 44px. Landscape final check: content width/scroll width both 829px, detail height 390px, no undersized visible buttons.
- Light title measured rgb(15,23,42), dark title rgb(255,255,255); collapsed sheet at 390×844 measured 523px.
- All 147 named Z-Anatomy nerve entries were searched, selected and compared to the exact detail h2; zero mismatches (first 48 in the earlier browser session; remaining 99 in the resumed session).
- All 42 scenario options selected with matching scenario headings; all 27 intervention buttons produced nonempty feedback. Off-scenario procedure guards explained their limits.
- Pupil four stimuli; POCUS four probes, freeze, M-mode, cardiac Doppler and caliper; stethoscope six sites/eight presets/two chestpiece modes; PICCLED four sections; ECG seven wave-guide controls; tutorial four tiers, twelve lead angles, three views and six presets exercised.
- Final anatomy overview, supply, relations, clinical and lymph tabs each expose selected state; sheet expansion and independent theme toggles exercised. Head & neck shows 595 entries, full catalog 2,381 entries.
- TypeScript, `check:simulator-mobile`, actual GLTFLoader runtime model checks (147 nerve identities, six sympathetic meshes, 153 organ targets), `all-organ-anatomy-audit`, and combined web/native-web production build passed.

## Limits and outstanding anatomical coverage

The cloud browser cannot create WebGL. Screenshots therefore show the real fallback if the anatomy viewport is visible; they are not proof of 3D GPU rendering, raycast selection, physical pinch/drag, FPS or sound output. Native APK/physical iPhone or Android verification was not performed.

The source catalog contains 2,234 atlas parts and 147 supplemental nerve entries, but only 36 dedicated clinical dossiers. Related-region text is explicitly identified as context, not individual verified innervation. Every organ, muscle and nerve's clinical prose has not been independently medically reviewed. Phrenic and splanchnic courses remain explicit schematics, and vestibular registration remains unresolved upstream.

## Sources researched

- BodyParts3D official downloads: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- Z-Anatomy original model repository: https://github.com/Z-Anatomy/Models-of-human-anatomy
- NIH/HRA reference organs: https://3d.nih.gov/collections/hra
- HRA object library: https://humanatlas.io/3d-reference-library
- AnatomyTOOL Open3DModel: https://anatomytool.org/open3dmodel-about

These are candidates/source references, not blanket endorsements of their meshes. Individual licensing, hierarchy and registration must be validated before integrating a replacement. Competitor screenshots informed region/system browsing, isolation and spread/reassemble organization; no competitor assets were copied.
