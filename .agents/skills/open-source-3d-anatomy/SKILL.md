---
name: open-source-3d-anatomy
description: Authoritative guide and engineering reference for the Orbit 3D Virtual Patient Simulator, covering open-source anatomical datasets (BodyParts3D, Z-Anatomy, ashemag/human-atlas), chunk streaming, WebGL custom shaders, mobile Jetsam crash prevention, and instructions for Claude and Gemini agents.
---

# Open-Source 3D Anatomy Architecture & Engineering Skill

This skill documents the open-source anatomical 3D assets, rendering pipelines, shader mathematics, mobile stability guardrails, and agent collaboration protocols powering Orbit's 3D Virtual Patient Simulator.

---

## 1. Open-Source Anatomical Datasets: Evaluation & Selection

When architecting a production-grade 3D anatomical simulator for medical students and clinicians, four primary open-source ecosystems were evaluated:

| Dataset / Project | Source & Provenance | Anatomical Coverage & Fidelity | License | Technical Assessment & Orbit Decision |
|---|---|---|---|---|
| **BodyParts3D / Anatomography** | Database Center for Life Science (DBCLS), University of Tokyo | 2,234 segmented anatomical structures mapped to Foundational Model of Anatomy (FMA) ontology IDs. | CC BY-SA 2.1 Japan | **CHOSEN FOR RUNTIME CORE**. Unequaled clinical accuracy, verified organ boundaries, standard FMA naming, and clean manifold meshes that can be compressed and streamed as gzip binary buffers. |
| **Z-Anatomy** | Open-source Blender community project | Complete macroscopic human body, high-resolution muscle fascicles, neurovascular arborizations. | CC BY-SA 4.0 | **REFERENCE FOR HIGH-RES ASSETS**. Exceptionally detailed, but total raw polygon count (>5M faces) causes WebGL Out-Of-Memory (OOM) on mobile without aggressive decimation. Utilized as morphological benchmark. |
| **ashemag/human-atlas** | GitHub open-source repository | Clean web-first React/Three.js architecture, studio lighting, system hierarchy. | MIT | **CHOSEN FOR UI/STUDIO LIGHTING INSPIRATION**. Demonstrated clean hospital/clinical studio lighting, breadcrumb navigation, and soft ambient illumination. |
| **OpenAnatomy / SPL Atlas** | Brigham and Women's Hospital / Harvard Medical School | Volumetric segmented CT/MRI scans of head, abdomen, and thoracic structures. | Custom Academic Open | **SUPPLEMENTAL REFERENCE**. High diagnostic realism, but dense irregular voxel-derived meshes require complex simplification. |

### Why BodyParts3D Was Chosen
1. **Ontological Rigor**: Every part maps to an official FMA ID (e.g., FMA7088 for Left Ventricle), enabling direct database linkages to textbooks, clinical cases, and SNOMED-CT.
2. **Modular Segmentation**: Allows independent isolation of blood supply (coronary arteries, portal vein) and lymphatic drainage without intersecting mesh tears.
3. **Streamable Topology**: Can be serialized into quantized Float32 position, normal, and partIndex arrays, reducing a 200MB 3D model into just ~12MB of compressed binary chunks.

### What this export does NOT contain — measured, not assumed

Point 2 above used to end "…lymphatic drainage, **and peripheral innervation**",
and that sentence is the reason the element resolver was written as though
nerves were there to find. They are not, and the resolver quietly substituted
the nerves of the orbit for the vagus for months.

Run the numbers against `public/models/atlas.json` before believing any claim
about coverage. As shipped, of 2,234 meshes:

| Expected | Present? | What is actually there |
|---|---|---|
| **Peripheral nerves** | **None at all** | Search the part names for vagus, phrenic, splanchnic, sympathetic, recurrent laryngeal, intercostal, pectoral, axillary, median, ulnar, radial, sciatic, femoral or peroneal: every count is **zero**. The 139 `nervous` parts are the cerebrum, cerebellum, brainstem, deep grey matter, the optic pathway and the nerves of the orbit (CN II, III, IV and the V1 branches). Nothing below the foramen magnum but a stub of cord. |
| **Lung parenchyma** | **None** | The 119 `respiratory` parts are the tracheobronchial tree, the nasal cartilages and conchae, the pharyngeal constrictors and the epiglottis. No lobe, no pleural surface. Lobes are loaded separately from a Z-Anatomy mesh — see §1b. |
| **Liver** | Yes, but not by that name | There is no part called "Liver". The parenchyma is the nine Couinaud **hepatovenous segments** (II–IX), and the ontology files them under the **venous** system, which painted the largest organ in the abdomen vein-blue and kept it out of the abdominal view entirely. `correctPartSystem` in `src/simulator/data/atlasResolver.ts` re-files them as digestive. |
| **Cerebral ventricles** | Yes, filed as **cardiac** | Because `ventricle`. Same table corrects them to nervous. |
| Muscles | Yes, 402 | A full musculature including the limbs. |
| Skeleton | Yes, 296 | Skull to phalanges, with teeth. |
| Arteries / veins | Yes, 639 / 395 | Named to segmental branches — the coronaries, the portal tree, the renal segments. |
| Thyroid, parathyroid, uterus, ovary | **None** | Adrenals, thymus, prostate and testes are present. |

`npm run check:simulator` asserts the ones that matter, and
`npm run sheets:simulator` draws every organ from the real geometry so a gap is
visible rather than argued about. **A structure this atlas does not hold must
resolve to nothing** — a plausible substitute is worse than a blank, because
the student looking at it is the one person who cannot tell them apart.

### 1b. Where the lungs come from, and which candidate

Because the atlas has no lung tissue, `createLungParenchymaSystem()` loads a
Z-Anatomy mesh. Three candidates are in `public/models/`, measured with
`scripts/lib/glb.mjs`:

| File | Size | Meshes | Triangles | Anatomy |
|---|---|---|---|---|
| `lungs_candidate_zanatomy_baked.glb` | 314 KB | 6 | 17,064 | 5 lobes + trachea |
| **`lungs_candidate_zanatomy_full.glb`** | **925 KB** | **34** | **48,332** | **5 lobes + named segmental bronchi** |
| `lungs_candidate_bodyparts3d.glb` | 14.7 MB | 5 | 204,408 | 5 lobes, no airway |

`zanatomy_full` is the default: three times the triangles of the baked mesh for
600 KB more, and it carries the bronchopulmonary segments **by name**, which is
what a student opens a lung to learn. The BodyParts3D export is twelve times
the triangles and sixteen times the bytes for smoother lobes and *less*
anatomy, so it is excluded from the deploy rather than served. `?lung_model=baked`
switches back for comparison.

### 1c. Filling the peripheral-nerve gap — the route, and why it is not done here

**Z-Anatomy is the answer and it is already partly in use.** It is a modified,
extended BodyParts3D that adds vessels and nerves (the nerves converted to
curves), covering 5,000+ structures across skeleton, muscles, vessels and
nerves, under **CC BY-SA 4.0** — share-alike, where BodyParts3D is
attribution-only, so anything derived from it carries that forward and the
attribution file has to say so.

- Models: https://github.com/Z-Anatomy/Models-of-human-anatomy
- Blender template: https://github.com/Z-Anatomy/The-blend
- Project: https://simtk.org/projects/z-anatomy

**No agent sandbox can fetch it.** The egress proxy refuses `github.com`,
`raw.githubusercontent.com` (connection closed), `codeload.github.com` (403)
and `dbarchive.biosciencedbc.jp` (connection closed). A GitHub Actions runner
does have a route — that is how `supabase-tasks.yml` and
`exam-sign-images.yml` do their network work — so the import belongs in a
workflow, not in a session. It is queued in `.agents/queue/`.

Do not approximate it in the meantime. A hand-drawn vagus is a line somebody
invented, shown to a student who is looking at it precisely because they do not
know where it runs.

---

## 2. High-Performance WebGL Pipeline & Shader Architecture

To run smoothly on both desktop and constrained mobile devices (smartphones with 2GB-4GB RAM), Orbit uses a specialized WebGL rendering architecture:

### A. Compressed Chunk Streaming (`fetchChunksWithLimit`)
- Chunks are stored as `body-0.bin.gz` through `body-14.bin.gz`, and **only** gzipped: the uncompressed `body-N.bin` beside them was the same 2.2M triangles twice and is gone (see `.vercelignore` and `npm run check:deploy`).
- **Desktop**: Fetches 4 concurrent chunks.
- **Mobile (`navigator.maxTouchPoints > 0`)**: Strictly bounded to **2 concurrent downloads and `DecompressionStream` pipelines** to prevent memory spikes that trigger mobile WebKit Jetsam OOM crashes.
- Temporary `BufferGeometry` instances are immediately merged into system-level geometries (`mergeGeometries`) and disposed from CPU memory.

### B. Dynamic Shader Discard (Zero-Cost Organ Isolation)
Instead of allocating and deallocating thousands of Three.js `Mesh` instances when the user selects or isolates an organ (which triggers massive garbage collection pauses and frame drops), Orbit uploads a single dynamic attribute `partIndex` per vertex and passes active visibility masks to custom GLSL shaders:

```glsl
// Vertex Shader: Pass partIndex and visibility to fragment stage
attribute float partIndex;
varying float vPartIndex;
varying float vVisibility;

void main() {
    vPartIndex = partIndex;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment Shader: Instant GPU Discard
varying float vVisibility;
void main() {
    if (vVisibility < 0.5) {
        discard; // Pixel rejected at early-Z/rasterization with 0 draw call overhead
    }
    // High-fidelity anatomical shading...
}
```

### C. Direct Attribute-Based Raycasting ($O(1)$)
Traditional Three.js applications create separate invisible `Mesh` objects for every organ to detect pointer clicks, creating 2,200+ mesh allocations. Orbit performs raycasting directly on the merged system meshes, reading the `face.a` vertex index and looking up `partIndex.getX(face.a)` in $O(1)$ time with zero memory overhead.

---

## 3. Color Fidelity & Studio Lighting Calibration

### The "Bleached / Clay Model" Root Cause
A critical failure mode in WebGL anatomical viewers is the progressive desaturation of colors over iterations:
1. **Lumen Over-illumination**: Combining ambient light (0.8), hemispheric light (1.2), key light (1.8), and fill light (0.75) generates $>4.5$ lumens.
2. **ACESFilmic Tone Mapping Desaturation**: Under ACESFilmic tone mapping, high luminance values are mapped along an S-curve that desaturates specular highlights toward pure white (`#ffffff`), washing out tissue pigments.
3. **Excessive Background Translucency**: High transparency ($<0.20$ alpha) allows the bright studio background (`#f8fafc`) to wash through the internal organ myocardium.

### Calibrated Anatomical Material Standard
Always adhere to these calibrated lighting and color thresholds in `AnatomicalBody3D.tsx`:

```typescript
// Calibrated Lighting Rig (~2.2 Lumens Total)
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.40);
const keyLight  = new THREE.DirectionalLight(0xffffff, 1.05); // Anterior key
const rimLight  = new THREE.DirectionalLight(0x93c5fd, 0.45); // Subtle anatomical edge
const fillLight = new THREE.DirectionalLight(0xffffff, 0.30); // Soft posterior fill

// Calibrated Anatomical Pigments
const VASCULAR_PALETTE = {
  artery:     '#dc2626', // Deep saturated scarlet red (vec3(0.96, 0.02, 0.02))
  vein:       '#1d4ed8', // Vivid royal cobalt blue   (vec3(0.04, 0.18, 0.88))
  nerve:      '#f59e0b', // Luminous golden amber    (vec3(1.00, 0.72, 0.02))
  myocardium: '#991b1b', // Rich anatomical crimson  (alpha: 0.44, warm rim: 0.25)
  lymphatic:  '#10b981', // Crisp emerald green      (vec3(0.06, 0.72, 0.50))
};
```

---

## 4. Mobile Stability & Crash Prevention Checklist

When maintaining or extending the mobile 3D simulator:
1. **Clamp `devicePixelRatio`**: Always clamp `Math.min(window.devicePixelRatio, 1.0)` on mobile devices. Rendering a 2000x3000 buffer on a 3x Retina display exhausts GPU tile memory and causes instantaneous Safari WebGL reloads.
2. **Tab Lifecycle Persistence**: In `Simulator.tsx`, preserve the `<AnatomicalBody3D />` canvas in the DOM using CSS `display: none` / `display: flex` rather than unmounting React components when students switch between "3D Body" and "ICU Monitor".
3. **Bypass Raycasting on Drag**: During touch drags (`touchmove` with distance $>5\text{px}$), disable raycaster calculations to keep the main thread locked at 60–120 FPS.
4. **WebGL Context Loss Recovery**: Always register `webglcontextlost` (calling `event.preventDefault()`) and `webglcontextrestored` on the canvas to gracefully recover if the OS briefly suspends the GPU context.

---

## 5. Agent Instructions for Claude & Gemini

When prompt engineers or autonomous agents extend the 3D anatomy simulator:
1. **Never Revert to Toy Lightings**: Do not add extra ambient lights or raise directional lights above `1.2`. Always check tone mapping exposure (`0.90` light / `1.05` dark).
2. **Preserve Bounded Concurrency**: Keep `fetchChunksWithLimit` set to 2 for mobile and 4 for desktop. Never revert to unbounded `Promise.all(atlas.chunks.map(...))`.
3. **Maintain FMA Metadata Linkage**: When adding new anatomical relationships (origin, insertion, arterial supply, innervation), reference the structures by their standard canonical anatomical names and FMA IDs.
4. **Verify Auscultation & Diagnostic Alignment**: If an anatomical organ is tapped (e.g., Aortic Valve), verify that stethoscope acoustics (`StethoscopeSynthesizer.ts`) and 12-Lead ECG patterns (`Ecg12LeadCanvas.tsx`) match the hemodynamic state of the active clinical case.
