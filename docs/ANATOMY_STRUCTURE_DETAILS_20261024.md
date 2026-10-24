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

Production web build, simulator resolution/mobile guards, focused anatomy-component ESLint and the default ES2020 TypeScript configuration pass. Canonical Android simulator assets build passes: 3,939,927-byte entry and 110 pinned public assets. Browser uses a desktop software GPU; it does not establish physical Android performance.

Baseline limitations: Simulator.tsx has existing any lint errors; unrelated digestive comprehensive-dossier coverage remains 92% against 95%. No gate was weakened. Do not claim a globally green repository.

Source saved in PR #123. Dedicated CI verifies data, actual browser navigation and builds and uploads screenshots.

## Follow-up: hosted checks and scrolling

The first hosted normal-anatomy run stopped before navigation because the development-only Lovable plugin attempted to rewrite a protected server function. The browser harness now selects Vite test mode, preserving the production configuration and server function. Test-only paid-account fixtures run the real website entitlement gate; no runtime access bypass was added. The same fixture is used in the existing anatomy route/browser tests.

The two default-configuration type errors are fixed by using Object.prototype.hasOwnProperty.call instead of Object.hasOwn, preserving own-property semantics on ES2020 targets. Existing source-extension, 2,078 NEET year-join and 303 recall/offline integrity checks pass; question content is unchanged.

Visual inspection found a real scroll-position defect: entering a vessel from a link near the bottom retained the parent panel's scroll position. The detail body now resets to the beginning on structure/tab changes. The actual browser regression asserts this behavior; coronary → LAD → child, portal, muscle and vein flows pass with six updated screenshots. Capture timeout accommodates software-rendered WebGL. Navigation waits for DOM readiness and then asserts the actual anatomy fields, avoiding dependence on third-party advertising load completion. Direct real-organ taps, reopening details, coronary heart context default/hide and celiac context toggling also pass; two additional coronary screenshots show that behavior. All eight screenshots were visually inspected and saved.

The broader legacy mobile E2E still fails on expectations predating the current Clinical Studio entry, eye/auscultation controls and sheet layout, plus a software-rendered capture timeout. Its last local result was 2 passed / 10 failed; this is not reported as a globally green simulator. Connected-anatomy navigation checks now explicitly close the selected detail panel to view geometry and reopen the selected structure, preserving the new behavior. Hosted receipts remain authoritative for their final status. No comprehensive-dossier coverage floor was lowered: nine digestive meshes (seven oral structures, esophagus and rectum) still lack comprehensive-dossier reach; broadening abdominal camera framing to hide that gap would be incorrect.
