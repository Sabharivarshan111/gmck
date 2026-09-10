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
2. **Modular Segmentation**: Allows independent isolation of blood supply (coronary arteries, portal vein), lymphatic drainage, and peripheral innervation without intersecting mesh tears.
3. **Streamable Topology**: Can be serialized into quantized Float32 position, normal, and partIndex arrays, reducing a 200MB 3D model into just ~12MB of compressed binary chunks.

---

## 2. High-Performance WebGL Pipeline & Shader Architecture

To run smoothly on both desktop and constrained mobile devices (smartphones with 2GB-4GB RAM), Orbit uses a specialized WebGL rendering architecture:

### A. Compressed Chunk Streaming (`fetchChunksWithLimit`)
- Chunks are stored as `chunk_0.bin.gz` through `chunk_14.bin.gz`.
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
