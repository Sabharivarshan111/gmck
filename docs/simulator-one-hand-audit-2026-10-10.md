# Patient simulator: one-hand mobile follow-up — 2026-10-10

The mobile follow-up uses a fixed bottom navigation and a separate thumb toolbar (Browse, Layers, zoom in/out, Reset). Browse exposes source structures and system/search filters; its new region selector keeps regional discovery in the bottom panel. Layers contains quality, single-tap pan directions, inspection/dissection/X-ray and depth controls. Range controls have a 44px touch height. The scene stays mounted across mobile tabs.

Artery, vein and named nerve cards retain their titles, parents/roots and 3D actions, with longer territory, drainage and innervation notes inside native expandable details. The phone sheet has a persistent View model / Read more / Close footer. Existing source registration and anatomical coverage safeguards remain in place. Clinical data and source models were not replaced during this follow-up.

## Reference comparison

Reviewed the supplied Astra screenshots, BioDigital's official anatomy-tree documentation, Visible Body's official structure-information guidance, and Biosphera's official mobile tutorial and its actual mobile-interface image. The useful patterns were hierarchical regional discovery, context/isolate actions, explicit image-quality controls and making space for the model. This was documentation/image inspection, not an installation or hands-on audit of competitors' native apps.

- https://support.biodigital.com/hc/en-us/articles/360005542733-What-is-the-Anatomy-Tree
- https://biosphera3d.com/tutorials/tutorial-how-to-use-biospheras-3d-human-anatomy-app-mobile-devices-version/
- https://biosphera3d.com/wp-content/uploads/2020/01/aplicativo-introducao-anatomia-humana-3d-01.jpg

## Overview clarity

The mobile renderer previously used DPR 1 with MSAA disabled. Crisp now caps DPR at 1.5 (1.25 on devices reporting <=4 GB memory); Smooth retains DPR 1. All quality modes obey a 3-million-pixel drawing-buffer budget. Resizing applies the current quality without recreating the scene. Antialiasing stays disabled on phones. This addresses a plausible overview edge-softness contributor; it does not establish that every reported blur symptom is resolved on actual GPUs.

## Verification

- TypeScript, simulator mobile source guards, actual GLTFLoader regional/nerve/153 organ target regression, render-quality phone/memory/pixel-budget tests and combined Vercel build passed.
- Hosted preview fae2c2b0: actual responsive browser viewports 360x800, 390x844, 430x932 and 844x390; no document horizontal overflow. Classic browser scrollbar yields inner CSS widths 345/375/415/829.
- At 390x844 the five thumb controls measured 65x44px, at y725. Tested Browse open/close, tools open/close, Smooth/Crisp, four pan command buttons, zoom +/- commands, Reset, Inspect/Scalpel/Isolate/X-ray selection, ICU/Case/3D bottom navigation.
- Heart Supply notes opened/closed through native details; Read more/less changed sheet state; View model removed the drawer. Footer stayed at y775-844 with the body independently scrollable.
- Final region selector/range-height refinements require the final deployment check recorded in resume notes.

## Limits

Cloud browser WebGL context creation is unavailable: actual camera motion, rendered sharpness, mobile GPU allocation, FPS, pinch/pan gestures and audio were not visually or physically certified. A physical-phone session and clinical review remain necessary. Prior full audit remains in simulator-mobile-audit-2026-10-10.md: 147 named nerve title routes, 42 scenarios and 27 interventions were checked there. This follow-up does not claim a new individual clinical review of every muscle/nerve; 36 clinical dossiers and the quarantined vestibular registration gap remain unchanged.
