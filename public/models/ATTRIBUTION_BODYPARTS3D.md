# Anatomy data attribution

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.

- License: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html (updated 2025-02-27)
- Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- License terms: https://creativecommons.org/licenses/by/4.0/
- Source geometry: `isa_BP3D_4.0_obj_99.zip`, BodyParts3D 4.0.
- English names and relationships: IS-A and PART-OF concept, element, and inclusion tables from the same archive.
- Publication: Mitsuhashi et al. (2009), BodyParts3D: 3D structure database for anatomical concepts. https://doi.org/10.1093/nar/gkn613

Adaptations: axes and units converted from millimeters/Z-up to meters/Y-up; translated to rest at the stage; geometry simplified using meshoptimizer with 0.2% relative error limit per structure; normals quantized to signed 16-bit; packed into binary chunks; curated display system groupings and colors. The source contains 2,234 individual OBJ meshes; all remain represented. The combined hierarchy contains 3,432 named FMA concepts, which may reference multiple meshes. Original source identity is preserved in the manifest.

Source OBJ comments mention an older CC BY-SA 2.1 Japan license. The official current database license linked above supersedes that legacy text and explicitly permits redistribution and adaptation under CC BY 4.0.

BodyParts3D represents an adult male reference anatomy based on TARO MRI and anatomical illustration refinements. It is not a complete model of every possible human anatomical structure or variation. This interface is educational and is not a clinical tool.

## Historical assets (not included in the current release)

Earlier repository revisions included female reference anatomy: Kristen Browne and Heidi Schlehlein, Human Reference Atlas / HuBMAP, *3D Reference Organ Set for Female v1.5* (2023). CC BY 4.0. Geometry adapted for this viewer.

- Source DOI: https://doi.org/10.48539/HBM352.BTSQ.586
- Dataset: https://lod.humanatlas.io/ref-organ/united-female/v1.5
- Original GLB: https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb
- License: https://creativecommons.org/licenses/by/4.0/

Adaptations: translated native meter/Y-up coordinates onto the stage, coincident vertices welded and source normals averaged, geometry simplified with a 0.2% per-structure relative error bound, and normals quantized. Colors and display systems are curated for this interface. All 888 source meshes are represented, with 1,073 source nodes available as selectable individual or compound concepts.

This is a reference assembly with whole-body surface and selected organs, including female reproductive anatomy. Its skeleton and muscle coverage is partial. It is not a complete model of every human structure or a single-person scan. Eight placenta/umbilical structures are classified under Pregnancy reference and hidden by default.


## Z-Anatomy lung parenchyma supplement

The runtime lung parenchyma used by the patient simulator is the separately
exported `lungs_candidate_zanatomy_full.glb`. It supplements BodyParts3D
because the BodyParts3D export in this repository contains the
tracheobronchial tree but no pulmonary-lobe parenchyma.

- Source project: Z-Anatomy — Models of Human Anatomy
- Source repository: https://github.com/Z-Anatomy/Models-of-human-anatomy
- Project: https://simtk.org/projects/z-anatomy
- License: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
- License terms: https://creativecommons.org/licenses/by-sa/4.0/
- Runtime adaptation: exported only the pulmonary structures needed by ORBIT,
  converted/registered to the BodyParts3D metre/Y-up reference space, and
  reduced to a mobile-friendly GLB while preserving the five lung lobes and
  named segmental bronchi.

The Z-Anatomy supplement remains separately identifiable from the BodyParts3D
core so its CC BY-SA terms and provenance are not obscured. Do not replace
missing atlas structures with synthetic geometry and present it as source
anatomy; procedural anatomy in the simulator is an explicitly schematic
overlay only.


## Z-Anatomy peripheral nerve supplement

The optional mobile peripheral-nerve layer is generated from:
`LluisV/Z-Anatomy` → `PC-Version/Resources/Models/FBX/NervousSystem100.fbx`.

- Z-Anatomy project / aggregate licence: CC BY-SA 4.0.
- Runtime file: `public/models/zanatomy_peripheral_nerves.glb`.
- Build manifest: `public/models/zanatomy_peripheral_nerves.manifest.json`.
- ORBIT adaptation: only named nerve/plexus/ganglion structures are exported;
  CNS tissue, inner-ear structures and other non-nerve geometry are excluded;
  the remaining meshes are normalised to the BodyParts3D body scale, assigned
  one lightweight clinical material and selectively decimated for mobile use.
- The source FBX is not shipped in ORBIT. The runtime GLB is lazy-loaded only
  when the learner opens Peripheral Nerves or an individual nerve.

Z-Anatomy is an aggregate project. Component attribution must be preserved:
cranial-nerve/foramina geometry in the upstream nervous-system file is credited
to the University of Dundee / CAHID under CC BY 4.0. ORBIT intentionally
excludes the separately identified inner-ear content from this export. Future
changes to the filter must review upstream component licensing before adding
new geometry.

This supplement is educational reference anatomy, not a diagnostic or
patient-specific anatomical model.


## Derived phrenic nerve course

ORBIT includes a tiny, explicitly **schematic** bilateral phrenic-nerve course
for teaching because neither BodyParts3D nor the Z-Anatomy
`NervousSystem100.fbx` used by this project contains a captured phrenic nerve.

The course is adapted from the open Clinical Neuroanatomy Atlas
(`aycibatuhan/nervous-system-atlas`), whose pipeline code is Apache-2.0 and
whose generated public atlas data is CC BY-SA 4.0. Its
`pipeline/config/derived_nerves.yaml` documents waypoints read from named
Z-Anatomy landmarks: the C4 spinal ganglion, scalenus anterior, subclavian
vessels, brachiocephalic vein, aortic arch/SVC, atrial/ventricular surfaces and
the diaphragm. ORBIT converts those Z-Anatomy Z-up coordinates into its
Three.js Y-up frame and sweeps each side as a ~1.5 mm radius tube.

This geometry is always labelled **SCHEMATIC COURSE** in the UI. It is not
presented as specimen-derived or patient-specific anatomy.

Credits:
- Clinical Neuroanatomy Atlas, Batuhan Ayci — Apache-2.0 code / CC BY-SA 4.0 generated data.
- Z-Anatomy — CC BY-SA 4.0 aggregate anatomy source used for the referenced landmarks.


## HRA internal-heart reference

ORBIT uses the HuBMAP / Human Reference Atlas male heart reference only as an
**on-demand internal-heart supplement** for structures that are not separately
represented by the BodyParts3D heart. It is not merged into the normal startup
atlas and is not presented as the same donor/reference body.

- Runtime file: `public/models/hra_heart_male_v1.3.glb`
- Source: HuBMAP / Human Reference Atlas `VH_M_Heart.glb`, HRA release v1.3
- Source repository: `hubmapconsortium/ccf-releases`
- License: Creative Commons Attribution 4.0 International (CC BY 4.0)
- Visible Human male reference organ. ORBIT exposes only structures that are
  verified as real meshes in this source: both atria, both ventricles, the
  interventricular septum, mitral/tricuspid/aortic/pulmonary valves, and the
  five named papillary-muscle meshes.
- These HRA structures are presented together as a same-source cutaway/reference
  mode. They are not mixed with BodyParts3D geometry as if the two reference
  bodies were spatially registered.
- Mobile behavior: the ~4 MB GLB is lazy-loaded only when the learner opens an
  HRA internal-heart target. Ordinary simulator startup is unchanged.

Because HRA and BodyParts3D are different reference bodies, ORBIT does not
force HRA internal meshes to overlay the BodyParts3D myocardium. HRA structures
are shown in their own internally consistent reference view.


## HRA-anchored schematic cardiac conduction

ORBIT includes an explicitly **schematic** cardiac-conduction teaching overlay
inside the HRA internal-heart reference mode.

The HRA male heart v1.3 contains source-derived chamber, valve, papillary-muscle
and interventricular-septum meshes, but it does **not** contain captured meshes
for the sinoatrial node, atrioventricular node, bundle of His, bundle branches
or Purkinje network. ORBIT therefore does not present those structures as HRA
source anatomy.

Instead, the runtime derives a lightweight educational overlay from the actual
bounding boxes and relative positions of the verified HRA right/left atria,
right/left ventricles and interventricular septum. The overlay includes:

- sinoatrial node marker,
- atrioventricular node marker,
- atrial conduction path,
- bundle of His,
- right and left bundle branches,
- simplified right and left Purkinje arborisation.

This geometry is generated by ORBIT at runtime and is always labelled
**SCHEMATIC CONDUCTION**. It is not specimen-derived, histology-derived, or
patient-specific conduction anatomy.

Reference frame / landmarks:
- HuBMAP Human Reference Atlas male heart v1.3 — CC BY 4.0.
- Runtime file: `public/models/hra_heart_male_v1.3.glb`.

The conduction course follows standard gross teaching relationships only; it
must not be interpreted as a microscopic conduction-system reconstruction.


## HRA-anchored schematic chordae tendineae

ORBIT includes an explicitly **schematic** chordae-tendineae teaching overlay
inside the HRA internal-heart reference mode.

The HRA male heart v1.3 provides the mitral and tricuspid valve meshes and five
papillary-muscle meshes but does not provide captured chordae tendineae. ORBIT
therefore does not present the generated cords as HRA source anatomy.

Runtime method:
- use the HRA mitral/tricuspid valve meshes and the five verified HRA
  papillary-muscle meshes;
- infer each papillary tip as the papillary-surface point closest to its AV
  valve;
- sample ventricular-facing valve surface points;
- generate a short primary trunk and small fan of terminal branches from each
  papillary tip toward those valve-surface points;
- generate chordae only for the atrioventricular valves. No chordae are drawn
  for the aortic or pulmonary semilunar valves.

The branching concept is inspired by SlicerHeart's open Valve FEM Export
workflow, which generates chordae from papillary-muscle tips to leaflet
surfaces with fan/radial branching.

Credits:
- HuBMAP Human Reference Atlas male heart v1.3 — CC BY 4.0, used for the
  source chamber/valve/papillary geometry and spatial landmarks.
- SlicerHeart contributors — BSD 3-Clause software; algorithmic inspiration
  from the Valve FEM Export chord-generation workflow.
  Repository: https://github.com/SlicerHeart/SlicerHeart

This ORBIT overlay is always labelled **SCHEMATIC CHORDAE**. It is not
specimen-derived, patient-specific, or a replacement for real chordal
segmentation.
