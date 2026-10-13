# Connected anatomy delivery — 13 October 2026

Supply and Relations now flow from named dossier controls through a reviewed catalog to explicit BodyParts3D IDs, or to an explicitly labelled teaching schematic when the registered atlas lacks the structure. Raw sentences no longer go through the broad organ keyword resolver.

| Coverage | Count |
|---|---:|
| Anatomy dossiers | 36 |
| Connection controls | 430 |
| Registered atlas views | 225 |
| Labelled teaching schematics | 205 |

Heart and kidney external views default to the same registered atlas frame as their vessels. Explicit HRA cutaways remain separate reference views; their overview materials use opaque anatomical tissue colours. Source surface vertices anchor SVG leaders that follow rotation and zoom. The heart shading defect came from sharing the default Three.js function-text cache key across system-specific GLSL closures; each system now has its own cache key. Fully hidden atlas systems skip draw calls. Supply/Relations expand on phones, and detailed vascular/nerve notes remain available in an accordion.

## Verification

Focused CI run 38393246612 passed all four batches on d1ba1f54c5d5e800485bd3a38f44b4fc6003ca4e:

| Batch | Dossiers | Registered routes |
|---|---:|---:|
| 0 | 9 | 66 |
| 1 | 9 | 50 |
| 2 | 9 | 71 |
| 3 | 9 | 38 |
| Total | 36 | 225 |

Batch 0 also verified real heart/kidney renderings at 360/390/430px, no horizontal overflow, and five drainage/relation camera-rotation and parent-reopening flows. Every dossier's complete control set and a missing-mesh diagram fallback were exercised. The catalog check verifies every registered part ID and arterial/venous source system, unique IDs, kidney vessel targets, and regressions for thoracic duct, accessory nerve, celiac ganglion, interventricular septum, renal pelvis and colonic marginal arteries incorrectly matching coronary branches.

TypeScript, web build, simulator resolution, mobile layout, source/provenance and asset checks passed. Final seven partial/region label clarifications on 013cdd0e12b56fab254f82ad7a1c742c97ecc25e retain every connection and geometry ID; the build/type/source checks and an inspected clarified-region callout without overflow passed afterwards.

## Limits

This verifies browser rendering and interaction routes, not physical Android hardware or TalkBack. The 205 schematic entries are explicit atlas gaps, not source meshes. Partial views name their actual components, including heart walls without pericardium and intercostal vessels without nerves. Source assets and existing attribution remain in the app; no generated anatomy images or forced co-registration of different reference bodies was introduced.

Wider legacy simulator tests retain older Bell, ECG inspection and collapsed-drawer expectation failures. The focused connected-anatomy results above do not claim the unrelated full simulator suite is green.

## Release

Runtime PR: https://github.com/Sabharivarshan111/gmck/pull/81
Merge: d4adea057ddd825166159b9ab7a1d866a7431a73
Production deployment dpl_41eA2KCdZby7Y5tPpWS3sJkPaWsD is READY. Live kidney Supply and Relations controls and the renal-pelvis schematic were verified at https://orbitmbbs.vercel.app/simulator?organ=kidney&isolate=kidney. The cloud verification browser lacks WebGL; actual3D rendering is evidenced by the mobile browser harness screenshots and passed routes above.
