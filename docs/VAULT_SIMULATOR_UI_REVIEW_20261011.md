# Vault and clinical studio review

Status: implemented and committed locally; not pushed or deployed. GitHub publishing was rejected by automatic approval review, which requires explicit approval to publish changed source to the user's public repository Sabharivarshan111/gmck.

## Changes available for review

| Request | Implementation |
| --- | --- |
| Notes → Vault | Display label changed; existing internal Notes route retained for imports/deep links. |
| Four boxes | Notes; Simulator & Anatomy; Case proformas; Anki flashcards. |
| Normal exploration without a case | Simulator studio opens on a healthy adult baseline. Skills are independently accessible. |
| Skills | Auscultation, ECG, POCUS, pupil examination, general examination, clubbing and monitor. |
| Normal breathing | Explicit normal vesicular breath sound shortcut; normal S1/S2 shortcut; normal tracheal sounds remain site-dependent. |
| Movement | Source chest meshes move using audio timing markers during listening. Movement is a simplified teaching animation, with pause and reduced-motion support. |
| Bone selection | Skeletal taps preserve the exact mesh identity. Muscle origins/insertions and muscle nerve supply are shown where documented in the existing collection. |
| Clinical clarity | Removed exact hemoglobin claims derived from pallor and a cyanosis label incorrectly describing capillary refill. |
| Mobile accessibility | Responsive skills cards, 44–48 px controls, background scroll lock, keyboard focus containment, Escape closure, fixed anatomy/skills navigation and bottom safe-area spacing. |
| Performance | Full anatomy catalog/renderer are not loaded when only the skills studio is opened. Idle studio pauses physiology updates. |

## Validation

Passed: Android production JavaScript bundle (using a temporary Metro configuration for reused dependency paths), root TypeScript, mobile TypeScript, changed component ESLint, combined native-browser/simulator production build, actual source chest mesh integrity, simulator UI regression, Notes schema check, 645 case/action regression and rendered Web Audio routing/timing/preset/stop tests.

Prepared but not executed: mobile-width studio browser regression. Local Chromium could not be installed; preview deployment is blocked by publishing approval. Cloud browser opened the unchanged production simulator and reported WebGL unavailable, so live 3D movement cannot be claimed visually verified.

## Limits

- This is not an exhaustive anatomy-content release. Many individual bone dossiers still require verified attachment, arterial and sensory-innervation content. Missing coverage is shown explicitly.
- The Android Vault simulator entry opens the hosted simulator in the browser. No native 3D simulator port, APK release or Play upload is claimed.
- The separate source-reconstructed POCUS pilot branch is not included in this change. Existing POCUS remains a teaching simulation.
- Previous competitor screenshots were not all recovered for direct visual comparison in this turn.

## Next action after approval

Push the local feature branch to the confirmed existing repository; create its PR and preview deployment; run the mobile-width studio checks and inspect Vault/tool screenshots; fix any observed problems before merging and verifying the production deployment.
