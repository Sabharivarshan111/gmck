# Normal anatomy selected structure details

Normal anatomy now follows heart → supply → coronary artery → LAD → registered branch without substituting the owning heart dossier. Isolation and reopening retain selected identity, including grouped atlas fragments and mobile selection.

The panel shows artery origin/branches; vein formation/tributaries/drainage; and muscle origin/insertion/action/innervation. Registered atlas children open directly. Missing information is explicitly marked.

## Coverage and limits

The catalog binds 1,436 mesh identities: 402 muscular, 639 arterial and 395 venous meshes. These are mesh counts, not distinct muscle counts or proof of complete clinical review. Nine liver-parenchymal segments misclassified as veins in the atlas are excluded. Bindings include 869 exact, 74 whole-muscle, 289 regional, 127 parent and 77 label-scoped references; scope remains visible. All muscular bindings resolve attachments/innervation, arterial bindings resolve origins and venous bindings resolve destinations. Finer branches remain undocumented for 177 arterial bindings.

This is reference coverage, not comprehensive clinical validation. Existing comprehensive organ dossiers remain separate. No physical-device testing, signed APK, production release, clinical certification or legal clearance is claimed.

Existing normal anatomy uses real meshes. Preceding Coronary Lab work uses Three.js/WebGL and attributed BodyParts3D geometry. This change adds normal anatomy details. No competitor code, assets, text or layout was copied. Independent design does not establish legal immunity.

## Sources and rebuilding

Text snapshots and attribution: docs/anatomy-reference-snapshots/. Runtime attribution and limits: src/simulator/data/structureDetails/NOTICE.md. Adapted reference data is CC BY-SA 4.0; app-code licensing is separate.

Rebuild in order:

```sh
python3 scripts/anatomy-details/curate-vessels.py
python3 scripts/anatomy-details/build-catalog.py
python3 scripts/anatomy-details/add-scoped-references.py
node scripts/structure-details-check.mjs
```

## Verification

Resolver regression passes all 1,436 identities, attachment/nerve/origin/destination checks, coronary/portal fixtures, grouped branch origins and stale-selection protection. Actual normal-simulator browser test passes heart → coronary → LAD → grouped branch, portal vein, infraspinatus and great saphenous vein, including phone overflow checks. Six screenshots capture these states.

Production web build, simulator resolution/mobile guards, focused anatomy-component ESLint and TypeScript with ES2022 library definitions pass. Canonical Android simulator assets build passes: 3,939,764-byte entry and 110 pinned public assets. Browser uses a desktop software GPU; it does not establish physical Android performance.

Baseline limitations: default ES2020 configuration has existing Object.hasOwn errors in neetPgOffline.ts; Simulator.tsx has existing any lint errors; unrelated digestive comprehensive-dossier coverage remains 92% against 95%. No gate was weakened. Do not claim a globally green repository.

Source saved in PR #123. Dedicated CI verifies data, actual browser navigation and builds and uploads screenshots.
