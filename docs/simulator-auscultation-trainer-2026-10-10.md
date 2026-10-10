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
