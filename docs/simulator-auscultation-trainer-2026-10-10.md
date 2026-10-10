# Mobile auscultation trainer — 2026-10-10

The owner requested MedNotes-style body listening points, a moving stethoscope, sound timing visualization, exploration and training, and one-hand mobile controls in the live web simulator.

## Implementation

- Dedicated lazy 3D chest view loads the existing attributed HRA male heart (14 meshes, CC BY 4.0) and Z-Anatomy lungs (34 meshes, CC BY-SA 4.0). Chest/ribs and organ placement are explicitly illustrative; no clinical registration is claimed. Surface guide fallback is visibly labeled when WebGL/model loading fails.
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
