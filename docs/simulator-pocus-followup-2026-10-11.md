# POCUS and pupil screenshot follow-up

The supplied ORBIT screenshots expose clipped canvas captions, crowded gain/depth controls and schematic sonograms. The competitor screenshots establish the intended realism and compact interaction pattern; they are inspiration only, not licensed assets.

## Changes
- Grayscale scan appearance with fixed, cached correlated texture. This is an appearance model, not an acoustic propagation engine.
- Freeze stores the latest live cine phase and case inputs; subsequent vital updates do not alter the held scan. M-mode history does not advance while held.
- Depth changes the displayed field of view and measurement calibration. Gain modifies scan brightness. Depth/M-mode/view changes clear calipers; points outside the displayed acoustic field are ignored.
- Canvas captions moved below the scan, depth ticks remain inside bounds, gain and depth each occupy a full mobile row, teaching notes are collapsed. No fixed 60 FPS promise.
- Abdominal fluid follows the case ascites field rather than elevated lactate. Interpretations no longer call free fluid proof of blood or absent lung sliding proof of tension pneumothorax. Cardiac/lung pattern selection still uses simplified signals and is identified as such.
- Pupil right/left placement now faces the examiner; pupil-to-iris proportions agree across screen sizes. The light response cannot enlarge a small baseline pupil. The pupil view remains schematic; an animated face has not been added.

## References and attribution
External media are displayed unmodified in a separate Reference scans mode and do not represent the active simulated patient. Loading failure produces an explicit fallback message. Animated references begin held; reduced motion holds a still frame.

| View | Source | Author | License |
|---|---|---|---|
| PLAX | https://commons.wikimedia.org/wiki/File:LeftParasternalLongAxis.gif | Patrick J. Lynch & C. Carl Jaffe | https://creativecommons.org/licenses/by/2.5/ |
| Subcostal | https://commons.wikimedia.org/wiki/File:Subcostal_view_of_heart.gif | Patrick J. Lynch & C. Carl Jaffe | https://creativecommons.org/licenses/by/2.5/ |
| Morison free fluid | https://commons.wikimedia.org/wiki/File:Morison003.jpg | Drahreg01 | https://creativecommons.org/licenses/by-sa/3.0/ |
| Lung/M-mode (fibrosis) | https://commons.wikimedia.org/wiki/File:Sea_shore_sign_on_a_lung_ultrasound.jpg | Tinss | https://creativecommons.org/licenses/by-sa/4.0/ |

Clinical wording checked against ACEP Sonoguide: https://www.acep.org/sonoguide/basic/fast and https://www.acep.org/sonoguide/basic/lung. Blender is not installed; this change creates no Blender models. No amniotic-fluid feature exists in the inspected simulator.

## Validation
`ORBIT_CANVAS_PATH=/tmp/orbit-canvas-check/node_modules/@napi-rs/canvas node scripts/simulator-pocus-check.mjs` uses the real renderer at 310/340/380 px, exercising frozen pixel stability (including altered inputs), M-mode history, gain/depth changes, fluid routing and two-centimeter calibration at 8/16/22 cm depths. The canvas package is installed temporarily, not added to production dependencies. TypeScript, targeted ESLint, mobile UI guard and web build passed. Deployed mobile screenshots pending at this checkpoint. Physical-device performance and clinical fidelity remain unverified.
