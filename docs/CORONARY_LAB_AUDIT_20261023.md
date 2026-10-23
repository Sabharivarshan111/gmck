# ORBIT Coronary Lab — implementation and audit

23 October 2026. Base: `806d4aa9dbb6d4d5fa7ce720e4c72e37e5f46c69`.

## Result and location

Clinical Studio → Learn a skill → Coronary Lab opens a local native React
Native/SVG module. It requires no backend, downloaded model, hosted page, new
dependency, API key or account. The legacy `src/` simulator is unchanged.
This is a new schematic teaching module, not a replacement for the registered
BodyParts3D atlas or a clinically validated angiography workstation.

## Independence audit

The owner's reference screenshots were used to understand the requested
capabilities. No reference-site JavaScript, CSS, meshes, centreline coordinates,
images, measured data, writing or branding were downloaded or included.
All new geometry, engine code, layout, illustrations, captions and questions
were authored for ORBIT. Dependencies were already installed by the app.

The reference's stacked rectangular panels, amber controls, overlaid detector
inset and Cartesian angle pad are absent. ORBIT uses its purple/magenta visual
language, one switchable workspace, goal-based view choices, four learning
tabs, explicit bottom angle values and thumb-accessible native controls.
On larger screens anatomy and projection can be seen together. Ordinary
medical terminology is retained for understandable teaching.

This records implementation provenance and visual differences. It is not a
legal clearance or a guarantee against a third-party claim.

## Capabilities actually implemented

- An original 3D ventricular envelope with attached, smoothed coronary
  centrelines, rendered through an orthonormal camera basis into native SVG.
  It is a mathematical 3D view, without claiming an acquired patient mesh.
- LM, three LAD sections, two diagonals, two deep septals, circumflex, two
  obtuse marginals, three RCA sections, acute marginal, conus, PDA and PL.
  Left dominance adds distal circumflex and changes PDA/PL parentage; the
  non-dominant RCA terminates earlier. Co-dominance is explicitly excluded.
- Detector rotation RAO90–LAO90 and caudal45–cranial45, with a separate
  inspection viewpoint, numerical readouts, one-degree buttons and sliders.
- Six learning-goal presets, neutral AP and left lateral. Presets are examples,
  not patient-specific optimal projections.
- A synchronized parallel projection, labelled selected vessel, source and
  detector geometry, a schematic C-arm/table view, zoom, shell and label
  toggles, left/right system selection, light/dark controls and reset.
- Explanatory branch notes, a three-question quiz with correction feedback,
  model foreshortening and apparent centreline crossing counts.

## Projection and measurement audit

Axes: x patient-left, y superior, z anterior. LAO is positive detector rotation;
cranial is positive detector tilt. The source is opposite the detector. In AP,
the patient's left is displayed on the image's right. Inspection rotation
does not silently change the acquisition angle.

Foreshortening is `100 × (1 − projected arc length / 3D arc length)` using
the same sampled centrelines rendered on screen. Length is in arbitrary model
units. Crossing counts consider other visible branches once each and exclude
shared endpoints. They are not overlap percentages, stenosis percentages or
patient measurements. There is no invented fluoroscopy noise or acquired
angiogram implied by the projection.

Teaching references, linked from Learn:

- Di Mario and Sutaria, *Heart*, 2005:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC1768997/
- *Tools & Techniques: angiographic views*, *EuroIntervention*, 2010:
  https://eurointervention.pcronline.com/article/tools-and-techniques-angiographic-views

No figures or prose from those publications are reproduced. The examples
reflect standard teaching conventions; a cardiologist has not reviewed the
authored geometry.

## Verification and limits

Geometry regression tests exercise 91 angle combinations, orthogonality,
projection reconstruction, parallel/perpendicular limiting cases, finite
bounded foreshortening, branch attachment, PDA parent changes, and exclusion
of shared junctions from crossing counts.

The real native components are exercised in Chromium at 360/390/430/900 px:
presets and AP, actual slider drag, keyboard-operable angle buttons, shell
visibility, left dominance/PDA selection, calculated shortening, correct and
incorrect quiz feedback, C-arm, theme, reset and offline interactions. The
actual SimulatorScreen discovery/open/back path and a short landscape
viewport are also exercised. Screenshots are captured from these components
and visually inspected, not generated mockups.

Native and preview TypeScript, full mobile source ESLint, native Android
JavaScript release bundling, browser build, simulator navigation, safe-area,
version consistency, repository integrity and preview parity checks pass.
The first browser build needed the root dependencies installed for the
existing sql.js WASM; it passed after that normal installation.

The pre-existing broad `check:smoke` cannot start in this environment:
`uv_interface_addresses` fails during Vite's interface enumeration. The
focused test starts on loopback and passes; the broad suite is not reported
green. A dedicated workflow repeats the geometry/UI checks and JS bundle.

No new APK/AAB, Android native compilation, physical-device gestures,
TalkBack, low-end frame-rate measurement, cardiologist sign-off or Play
publication has been completed. SVG preview evidence proves layout/state,
not Android performance. No stenosis, catheter insertion, contrast bolus,
haemodynamics, dose or equipment collision model is implemented. Patient
specific realism and anatomy validation remain future work; do not describe
this first version as perfect or clinically certified.

Question-bank data, subscriptions, authentication, signing, ads and version28
remain untouched. Preserve concurrent research work.
