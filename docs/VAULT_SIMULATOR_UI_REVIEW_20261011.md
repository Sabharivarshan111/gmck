# Vault and clinical studio review

Status: published to PR #61 after explicit owner approval. Initial preview browser checks passed; two follow-up accessibility/navigation fixes are awaiting rebuilt preview verification and production merge.

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

Cloud browser preview checks: all six independent skills open with normal baseline; normal breath playback, S1/S2 selection and sinus ECG pass; widths 360/390/430 have no horizontal overflow; case search, comparison/reset and all four Vault destinations pass. General Examination dialog semantics and full-document Back to Vault navigation were corrected after browser inspection. Local Playwright script remains unexecuted; cloud browser WebGL is unavailable, so live 3D movement is not visually verified.

## Limits

- This is not an exhaustive anatomy-content release. Many individual bone dossiers still require verified attachment, arterial and sensory-innervation content. Missing coverage is shown explicitly.
- The Android Vault simulator entry opens the hosted simulator in the browser. No native 3D simulator port, APK release or Play upload is claimed.
- The separate source-reconstructed POCUS pilot branch is not included in this change. Existing POCUS remains a teaching simulation.
- Previous competitor screenshots were not all recovered for direct visual comparison in this turn.

## Remaining release verification

Verify the rebuilt preview for dialog focus and full-document Vault return, merge PR #61, and verify the exact production deployment.
