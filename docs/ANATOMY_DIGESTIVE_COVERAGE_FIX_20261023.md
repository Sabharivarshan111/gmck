# Digestive dossier coverage regression — 23 October 2026

Web CI failed `scripts/dossier-format-check.mjs`: only 99 of 108 digestive atlas parts were reachable from an organ teaching dossier (91.67%), below the existing 95% floor. This is an anatomy-selection/content-link measurement, separate from PG question counts and not a clinical-accuracy certification.

The cause was a legitimate abdominal-camera correction: `selectAbdomen` excludes gingiva, tongue, oral salivary glands, thoracic oesophagus and pelvic rectum. Counting these as abdominal content used to inflate coverage and pull the view toward the head/pelvis. The exclusions should stay. Four oral glands had no appropriate dossier, and their generic digestive mapping still opened the abdomen.

Added `oral_salivary_glands`, a teaching dossier for the paired submandibular and sublingual glands. An exact resolver selects FJ2765–FJ2768 and gland taps now map to that dossier. Its original text covers landmarks, supply, drainage, innervation, histology, clinical examination and relevant surgery. No anatomical mesh is fabricated. Gingiva and unrelated source structures retain their existing exact-part behaviour.

Digestive dossier coverage is now **103/108 = 95.37%**; the 95% floor is unchanged. Five digestive meshes remain outside a full dossier: two gingiva meshes, tongue, oesophagus and rectum. This fix does not claim complete anatomy coverage. `scripts/simulator-organ-check.mjs` asserts all four real gland meshes are selected/mapped, unrelated organs are excluded, and mouth/thoracic structures remain excluded from abdomen.

References checked:

- https://www.ncbi.nlm.nih.gov/books/NBK542272/ — submandibular gland, duct and neurovascular relations.
- https://www.ncbi.nlm.nih.gov/books/NBK535426/ — sublingual gland supply, position and drainage.
- https://pmc.ncbi.nlm.nih.gov/articles/PMC6251248/ — salivary spaces, contents and imaging.

Verification: actual atlas resolver, dossier formatting/coverage, all-organ source coverage, mobile simulator UI guards, repository/deployment guards and production builds pass. Browser screenshot confirms the new dossier opens at 390 px; software raster images independently inspect the four selected atlas meshes (924 triangles). These are browser/text and source-geometry checks, not Android device or full WebGL visual certification. The anatomy gate was not weakened; exact remote CI outcome belongs in PR #122.
