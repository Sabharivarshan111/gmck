# Patient simulator: one-hand mobile follow-up — 2026-10-10

The mobile follow-up uses a fixed bottom navigation and a separate thumb toolbar (Browse, Layers, zoom in/out, Reset). Browse exposes source structures and system/search filters; its new region selector keeps regional discovery in the bottom panel. Layers contains quality, single-tap pan directions and an explicit full-body camera reset, inspection/dissection/X-ray and depth controls. Range controls have a 44px touch height. The scene stays mounted across mobile tabs.

Artery, vein and named nerve cards retain their titles, parents/roots and 3D actions, with longer territory, drainage and innervation notes inside native expandable details. The phone sheet has a persistent View model / Read more / Close footer. Existing source registration and anatomical coverage safeguards remain in place. Clinical data and source models were not replaced during this follow-up.

## Reference comparison

Reviewed the supplied Astra screenshots, BioDigital's official anatomy-tree documentation, Visible Body's official structure-information guidance, and Biosphera's official mobile tutorial and its actual mobile-interface image. The useful patterns were hierarchical regional discovery, context/isolate actions, explicit image-quality controls and making space for the model. This was documentation/image inspection, not an installation or hands-on audit of competitors' native apps.

- https://support.biodigital.com/hc/en-us/articles/360005542733-What-is-the-Anatomy-Tree
- https://biosphera3d.com/tutorials/tutorial-how-to-use-biospheras-3d-human-anatomy-app-mobile-devices-version/
- https://biosphera3d.com/wp-content/uploads/2020/01/aplicativo-introducao-anatomia-humana-3d-01.jpg

## Overview clarity

The mobile renderer previously used DPR 1 with MSAA disabled. Crisp now caps DPR at 1.5 (1.25 on devices reporting <=4 GB memory); Smooth retains DPR 1. All quality modes obey a 3-million-pixel drawing-buffer budget. Resizing applies the current quality without recreating the scene. Antialiasing stays disabled on phones. This addresses a plausible overview edge-softness contributor; it does not establish that every reported blur symptom is resolved on actual GPUs.

## Verification

- TypeScript, simulator mobile source guards, actual GLTFLoader regional/nerve/153 organ target regression, render-quality phone/memory/pixel-budget tests, headless execution of the actual camera effect (zoom clamps, pan round trips and same-region/spread Reset) and combined Vercel build passed.
- Hosted preview fae2c2b0: actual responsive browser viewports 360x800, 390x844, 430x932 and 844x390; no document horizontal overflow. Classic browser scrollbar yields inner CSS widths 345/375/415/829.
- At 390x844 the five thumb controls measured 65x44px, at y725. Tested Browse open/close, tools open/close, Smooth/Crisp, four pan command buttons, zoom +/- commands, Reset, Inspect/Scalpel/Isolate/X-ray selection, ICU/Case/3D bottom navigation.
- Heart Supply notes opened/closed through native details; Read more/less changed sheet state; View model removed the drawer. Footer stayed at y775-844 with the body independently scrollable.
- Final region selector/range-height refinements require the final deployment check recorded in resume notes.

## Limits

Cloud browser WebGL context creation is unavailable: actual camera motion, rendered sharpness, mobile GPU allocation, FPS, pinch/pan gestures and audio were not visually or physically certified. A physical-phone session and clinical review remain necessary. Prior full audit remains in simulator-mobile-audit-2026-10-10.md: 147 named nerve title routes, 42 scenarios and 27 interventions were checked there. This follow-up does not claim a new individual clinical review of every muscle/nerve; 36 clinical dossiers and the quarantined vestibular registration gap remain unchanged.

## Final source grouping / sheet refinements

The hosted head/skeleton filter exposed four mislabeled source entries: FJ1252/FJ1253 (gingiva) and FJ1532/FJ1532M (levator scapulae). Runtime correction moves oral mucosa to the digestive/oral group and levator scapulae to muscles; source identities/geometry remain unchanged. Checked the actual atlas for named muscles under other systems: these were the two explicit muscle misfiles; deltoid arterial branches remain arteries. This is a targeted source classification repair, not certification of every ontology grouping. References: https://www.ncbi.nlm.nih.gov/books/NBK553120/ (levator scapulae muscles); https://www.ncbi.nlm.nih.gov/books/NBK572115/ (gingival oral mucosa).

The redundant 44px sheet expand pill is hidden on phones; header and footer expand actions remain. Phone vessel/nerve card buttons show a compact 3D label while their accessible names retain the full selected structure. The resulting layout gives longer anatomy names and scroll content more space. SW cache advances to v16.

The legacy organ guard originally required literal DPR 1.0 and failed after the deliberate quality change. It now calls the real quality-budget tests and checks the renderer uses that bounded policy. Actual-atlas assertions also ensure the four corrected source structures keep their exact metadata instead of opening unrelated bone/abdominal dossiers. Generic muscles without dedicated dossiers retain source identity before attachment-name skeletal fallbacks. Final cache version v17.

## Release status at session end

Live production is e558afe, deployment dpl_9ar7t8ATEn8wLJHFtEMLqbUYhqis (READY): thumb controls, bottom navigation, regional picker, quality modes, camera reset, progressive supply notes and footer actions. Captured the actual live 390x844 browser UI as ORBIT_One_Hand_Mobile_UI.jpg. Head→Skeleton→Frontal bone, a 44px spread slider and LAD Inspect-in-3D-to-model-state were checked on production. WebGL remains unavailable in the audit browser.

Additional source grouping/compact-sheet/exact-metadata refinements are merged in main through e2cc0289. Their local TypeScript, actual-atlas organ resolution (57 targets/2234 meshes), render-quality, camera, GLTFLoader and combined build checks pass. They could not be released: Vercel returned HTTP 402 api-deployments-free-per-day (>100 deployments), with retryAfter 86400 seconds. The superseded queued previews and older superseded simulator build were cancelled; unrelated PG deployments were not touched. The final merge did not receive an automatic deployment, and an explicit exact-commit production request confirmed the quota block. No installed CLI fallback is available. Do not represent these final refinements as live. The next session should deploy current main after quota reset, retaining newer concurrent work.

## Rotation, framing, dark mode and auscultation follow-up

The selected right sternocleidomastoid remains anatomically right during camera rotation. Its selection identity is a fixed UI control, not a world-space mesh label. Moved the mobile identity control above the lower spread control, preserved full names with wrapping and replaced raw HRA identifiers with source display labels. Reduced the mobile spread panel by hiding redundant explanatory/end-point lines. All touch sliders remain at least 44px high. Isolated source camera fitting now considers horizontal field of view, depth and viewport height with clearance for controls, including narrow portrait and short landscape layouts.

Found and corrected concrete audio defects:

- The ms_afib scenario declared a systolic murmur and played the aortic-stenosis preset while describing mitral stenosis. Its source finding is now mitral_stenosis; playback and explanation use the same resolver.
- Suppressed S4 and mitral presystolic accentuation when modeled atrial contraction is absent. Explicit educational overrides retain their demonstration sounds.
- Cyanosis alone no longer selects stridor. Tracheal stridor is restricted to the explicit anaphylaxis, laryngeal foreign-body and epiglottitis cases. Giving oxygen alone no longer falsely resolves an anatomical obstruction.
- High CVP/hypotension alone no longer selects tamponade. Attenuation belongs to the tamponade case and resolves after its modeled drainage lowers CVP.
- Cardiac arrest no longer produces the scheduler's minimum-30bpm heartbeat. No organized cardiac sound is generated for zero heart rate/VF, and zero respiratory rate generates no spontaneous airflow.
- Pause and site transitions cancel scheduled sources, not only future scheduling; stale asynchronous initialization cannot restart playback after effect cancellation. Dispose clears the old graph before reinitialization.
- Bronchial expiration is longer and more prominent than inspiration. Respiratory phase lengths plus the pause stay inside even a 60/min cycle.
- Audio startup failure produces a visible retry message. Teaching audio is labeled as synthesized with simplified rhythm/acoustic detail.

Verification: actual production 390x844 iframe in dark mode, eight manual presets, all six exposed sites, both bell/diaphragm buttons, volume adjustment, start/stop and close/reopen responded. Screenshot ORBIT_Dark_Auscultation_Audit_20261010.jpg records the actual existing production UI, not these unpublished fixes. Offline web-audio-engine rendered the actual synthesizer for all 15 heart/lung presets in both modes (30 combinations); non-silent signals were finite/nonzero, silent lung output was zero. Actual scheduler event routing tests cover absent atrial accentuation, silent cardiac output, bronchial timing and source cancellation. All 42 scenario literals across seven resolver sites produce supported sound mappings. Three.js projection tests place all eight bounding-box corners inside the usable viewport at 360/390/430 portrait, 844 landscape and desktop widths. TypeScript, mobile UI, organ resolution, camera navigation and production build pass.

Limits: offline web-audio-engine's compressor DSP is a passthrough; its measured peaks are not evidence of browser compressor/headphone loudness or clipping. The cloud browser cannot initialize WebGL and offers no audio capture/listening capability. Physical phone speakers/headphones, real touch rotation/occlusion, frame rate and visual sharpness remain unverified. These are synthesized demonstrations, not clinically validated recordings. Regional radiation/intensity, irregular AF cadence, respiratory variation of S2 and unilateral lung findings are not fully modeled; do not certify all clinical acoustics or every source muscle's innervation. Publication remains blocked by the existing Vercel daily deployment quota; deploy current main after reset, preserving unrelated PG changes.

Clinical references used for timing and interpretation:
- NCBI Clinical Methods, Systolic Murmurs: https://www.ncbi.nlm.nih.gov/books/NBK345/
- NCBI Cardiology Explained, Cardiovascular examination (S3 after S2, S4 before S1): https://www.ncbi.nlm.nih.gov/books/NBK2213/
- NCBI Mitral Stenosis: https://www.ncbi.nlm.nih.gov/books/NBK430742/
- NCBI Lung Sounds: https://www.ncbi.nlm.nih.gov/sites/books/NBK537253/
- Merck Manual, Cardiac Tamponade: https://www.merckmanuals.com/professional/injuries-poisoning/thoracic-trauma/cardiac-tamponade
- Merck Manual, Stridor: https://www.merckmanuals.com/professional/pulmonary-disorders/symptoms-of-pulmonary-disorders/stridor
