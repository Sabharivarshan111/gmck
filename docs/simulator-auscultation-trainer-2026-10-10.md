# Mobile auscultation trainer — 2026-10-10

The owner requested MedNotes-style body listening points, a moving stethoscope, sound timing visualization, exploration and training, and one-hand mobile controls in the live web simulator.

## Implementation

- Dedicated lazy 3D chest loads a registered, cropped BodyParts3D subset (587 parts grouped into seven meshes, CC BY 4.0) and registered Z-Anatomy lungs (34 meshes, CC BY-SA 4.0). Skin, ribs, heart and vessels retain source coordinates; procedural capsule/ribs and SVG anatomy are removed. Explicitly labelled static anatomical renders of the same geometry cover WebGL-unavailable browsers, with four real front/back and surface/X-ray views.
- Five cardiac listening areas including Erb's point; tracheal, bilateral upper and lower lung targets. Front/back flip patient laterality. DOM targets are 44 px, with a native select alternative and moving stethoscope overlay.
- Explore and blind heart-sound training; searchable nine-sound cardiac library, six lung demonstrations and current-case restoration. Added an explicitly simplified tricuspid holosystolic example; respiratory augmentation is described, not simulated.
- Real Web Audio analyser after the master gain samples the output. Rolling signal and S1–S4 labels use AudioContext time and the actual scheduler events. The waveform is not an ECG or a recorded patient phonocardiogram. Stop cancels queued sources and clears markers. Freeze control and reduced-motion default stop scrolling; renderer is demand-driven, with no persistent animation loop.
- Fixed mobile Listen/Pause and volume controls, safe-area padding, scroll clearance; light/dark surfaces. Desktop keeps a two-column layout.
- Existing case routing and diagnostic tools retained. Side-specific lung pathology, auscultatory radiation, maneuvers and irregular AF acoustic timing remain outside this simplified engine. No abdominal sound mode is advertised.

## Research and license decisions

The supplied MedNotes screenshots show surface points, stethoscope placement, X-ray views, waveform, Explore/Train and a sound library. Official product: https://www.mednotes.cloud/ . This implementation uses that interaction idea, not their code, models or recordings.

Clinical timing/findings: Merck Manual professional cardiac auscultation and tricuspid regurgitation references:
https://www.merckmanuals.com/professional/cardiovascular-disorders/approach-to-the-cardiac-patient/cardiac-auscultation
https://www.merckmanuals.com/professional/cardiovascular-disorders/valvular-disorders/tricuspid-regurgitation

Open-source references researched: https://github.com/Kumar-laxmi/Auscultation-Simulator-Application (GPL-3.0, Django/Raspberry Pi hardware trainer); https://github.com/GCY/Digital-Stethoscope-for-Heart-and-Lung-sounds (MIT hardware/filtering). Neither is copied into this web application.

PhysioNet 2016 https://physionet.org/content/challenge-2016/1.0.0/ is useful open data, but normal/abnormal labels do not establish a disease-specific valve recording. No mislabeled recording imports. Existing model attribution remains at public/models/ATTRIBUTION_BODYPARTS3D.md; adapted organs remain identifiable with visible credits.

## Verification

TypeScript application check; full web/native-preview production build; mobile simulator guard. Actual OfflineAudioContext renders 16 presets through both filter modes (32 combinations), checks finite output versus arrest silence, atrial-dependence, source cancellation, bronchial phase bounds, tricuspid envelope routing and scheduler-to-S3 marker timing. Actual GLTFLoader confirms both models' source meshes and positive fit bounds. Listening-point separation is checked at a 360 px layout.

Offline test compressor is a passthrough in web-audio-engine: these renders do not certify hardware loudness, subjective realism or clinical diagnostic accuracy. Browser UI and deployment checks follow publication. Cloud WebGL was unavailable in prior tests; physical GPU rendering and listening on iPhone/Android remain necessary before any claim of complete device/clinical verification.

## Correction after visual feedback

The owner rejected the initial schematic chest. It has been replaced with the actual source anatomy above; no MedNotes imagery is copied. Offline EGL rendering was used to inspect the real source geometry. Export checks pin mesh count, 587 source IDs, complete triangles, valid vertex indices and metre/Y-up crop bounds. The small source-model WebP references total about 180 KB, and the compressed mesh is about 5.3 MB. Each source render shares the chest camera crop. Clinical listening markers remain approximate surface-area overlays, with 44 px hit areas and the selector alternative.

The frozen waveform now waits for the first available analyser frame before freezing, including when reduced motion is enabled. Disabled controls are visibly dimmed. Browser actions exercised all five cardiac sites, all nine cardiac demonstrations, six lung demonstrations, left/right lung selection, front/back, train/check/next/reset, volume mute, Listen/Pause and Freeze/Animate. Dark mode browser audit found that DiagnosticTools did not receive the simulator theme; Simulator now passes it. Light-theme shorthand padding had also overridden fixed-footer scroll clearance; both themes now share 155 px bottom clearance. Cloud WebGL remains unavailable; a live GPU render and physical headphone playback have not been certified.

## Deployed preview audit

Preview fdf5b016 was READY and visually inspected at 390 px in light/dark. At 360/390/430 and landscape there was no horizontal overflow, and all trainer buttons measured at least 44 px. Four source-model reference views loaded correctly; dark theme propagation and 155 px scroll clearance were verified. A follow-up preserves waveform sample history across Freeze/Animate, preventing timing labels from remaining over an almost empty trace. Production a82b8a4a is building at this checkpoint; the final follow-up needs its own deployed waveform screenshot check.


## Final deployed browser verification — 2026-10-10 18:28 UTC

DONE: PR #52 and #53 merged; production main 91c3c7194bf7a3ecb7185558d384460cfa0da435 READY (dpl_5DM3oiP4Zn6gcKLgzcxF75amZQv6). Refreshed orbitmbbs.vercel.app responsive harness, verified full 2.5-second S3 waveform survives Freeze, remains stable, Animate resumes and Stop resets. All 42 case selections matched rendered headings. Mitral/apex button and selector work; dark-mode mobile screenshot inspected. Two screenshots saved: orbit-mitral-dark-20261010.jpg and orbit-frozen-s3-trace-20261010.jpg.

HALF-DONE: Cloud browser lacks WebGL; verified labelled source-geometry static references, not live device GPU. Synthesized teaching audio routing/timing tested, but clinical acoustic fidelity and physical headphone output are not certified.

NEXT: Physical mobile WebGL rendering and clinical listening review; evaluate the new cranial-nerve trainer references separately before adding a new feature scope.

DO NOT: Claim perfect clinical accuracy, live GPU verification from static screenshots, or exhaustive intervention correctness from case-selection tests. Do not replace registered anatomy with drawings or copy competitor assets.


## Supplied competitor screenshot review — 2026-10-11 IST

The six atlas screenshots show a large viewport, restrained structure labels, isolated organs over a muted whole-body context, a compact selection strip, and a view-controls sheet. The four MedNotes examination screenshots show an animated patient, finger/light/cotton tools, eyelid and gaze commands, enlarged pupil measurements, and separate exploration/study/training modes. Screenshots establish the visible design, not behavior outside the captured state.

Applied in PR #54: mobile isolation name opens anatomy details, information icon replaces the separate Dossier action, Restore remains an explicit 44px target; long names wrap in a compact strip. Pupil tool puts the result above its penlight controls and collapses the explanatory text. Existing input semantics and pupil calculation were preserved. TypeScript, mobile UI guard, and production web build passed.

Remaining feature gap: ORBIT has a schematic pupil examination and an anatomical nerve browser, not an animated facial patient or a complete twelve-cranial-nerve examination trainer. The supplied face screenshots are a direction for a separately designed and clinically validated feature; they are not an implemented claim. No competitor images, face model, or source code were imported.


## Competitor-inspired mobile UI — final checkpoint 2026-10-10 15:57 UTC

DONE: PR #54, #55 and #56 merged. Production main 36fcad128c164d5d1335374601f0c772db3669f4 is READY (dpl_6hjfJ9fMHYEfHEZ52V3SNHeBEoiS). Compact mobile selection name/info opens anatomy details; Restore clears selection. Pupil results precede penlight controls and clinical explanation is collapsed. WebGL-unavailable notice no longer blocks selection/spread controls. At 360px, selection width and scroll width are both 299px, dark background is rgb(15,23,42), selection/spread gap is 8px and buttons meet 44px targets. Details/Restore and pupil left/right/both/off plus disclosure verified in browser. TypeScript, mobile guard and web build passed. Final screenshots: orbit-pupil-mobile-inspired-20261011.jpg and orbit-selection-gap-fixed-20261011.jpg.

HALF-DONE: Cloud browser lacks WebGL, so live GPU anatomy rendering on a physical mobile device remains unverified. Clinical audio fidelity remains unverified. Current pupil tool is schematic; animated facial patient and complete cranial-nerve examination trainer are not implemented.

NEXT: Physical-device GPU/audio verification. If requested, design and clinically validate the separate facial/cranial-nerve examination feature.

DO NOT: Claim an animated facial trainer, perfect clinical fidelity or live GPU verification from these screenshots. Do not import competitor assets or replace registered anatomy with drawings. Do not alter Android releases, PG, billing or security.


## Auscultation playback and training follow-up — 2026-10-11

DONE: New sound presets cancel queued old sources and schedule the replacement at currentTime + 40ms; routine rate updates retain cycle timing. Absent lung sounds stop sources and idle scheduler. Preset setters use the same transition path. Added regression assertions for these transitions; all 32 bell/diaphragm offline sound renders remain finite, audible (except intended silence), with routing/timing/stop checks passed. Training hides timing labels until Check answer; frozen trace keeps its original time/events when revealing labels. TypeScript, targeted ESLint, mobile UI guard, source-model check and web build passed.

HALF-DONE: Publishing and deployed browser verification of answer reveal/frozen trace remain pending. Physical phone GPU and clinical acoustic fidelity remain unverified.

NEXT: Verify training and reveal on the deployed 360px phone harness, save screenshot, record deployment result.

DO NOT: Claim physical headphone output or clinically certified recordings; do not substitute drawn anatomy or add the separate facial trainer in this patch.


## Auscultation follow-up — deployed verification 2026-10-11

DONE: PR #57 merged at main d4b38d0856d71fd4fc986394a1f485d94f50d46c. Production dpl_3dGVJcF7zuaL5E2BzAcJDBWakUHo READY. Real 360x800 browser: training initially hides timing labels and findings; selecting an answer and Check answer reveals S4 feedback and S1/S2/S4 timing labels on the visually preserved frozen trace. Next sound clears answer, disables Check answer and hides labels/findings again. Explore restores labels; Stop switches trace to Stopped. Trainer clientWidth equals scrollWidth (310px). BodyParts3D reference decoded at 720px and Mitral/apex is available. Screenshot orbit-training-reveal-20261011.jpg saved and inspected. Audio preset-transition regression checks, 32 offline audio renders, TypeScript, targeted ESLint, source model check, mobile guard and web build passed.

HALF-DONE: No physical device WebGL or headphone/clinical acoustic fidelity verification. Schematic pupil tool remains; no animated facial trainer implemented.

NEXT: Physical phone rendering/listening review. Check narrow chest point hit-target separation against actual rendered body width (288–303px), rather than the model check's assumed 336px.

DO NOT: Infer a live 3D GPU from the labelled static reference, claim clinical certification, or claim exhaustive intervention correctness. Keep competitor assets out and native releases/PG/billing/security untouched.
