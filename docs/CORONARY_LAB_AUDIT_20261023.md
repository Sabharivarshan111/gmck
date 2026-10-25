# ORBIT Coronary Lab — real WebGL implementation and audit

23 October 2026. Supersedes the first schematic/SVG implementation in PR #123.
The owner explicitly requested real-time 3D and permitted open-source reuse.

## Result

Clinical Studio → Learn a skill → Coronary Lab opens native React Native
controls around a locally bundled Three.js WebGL scene in react-native-webview.
The browser harness and browser product adapter render that exact same trusted
HTML document. The 3D scene contains no SVG, screenshot textures, external model
requests or alternate mock renderer. Native app icons may still use the app's
existing icon library.

Actual BodyParts3D heart surfaces and 54 coronary source meshes are loaded from
an unchanged, pinned GLB. OrbitControls performs real camera rotation/pinch;
raycasting selects vessel groups. Detector sliders reposition the source,
detector and C-arm in 3D. An orthographic camera renders the same coronary
triangle geometry in Projection mode. This is a geometry projection, not an
acquired angiogram or an attenuation/contrast-flow simulation.

## Source and licence

- Model integration source: https://github.com/organui/heart-3d
- Pinned source commit: c72ce6654ff8e282942f97750d3104f55ef4fc3d
- `heart.glb`: 2,524,400 bytes; SHA256
  b80a727d022a4ab07ccfcf15caccc228eaccb6d69ec0e72923324946ac35a946
- BodyParts3D 4.0, © The Database Center for Life Science, CC Attribution 4.0
  International under the current official archive grant. The upstream notice
  explicitly records the older BY-SA 2.1 Japan OBJ-header discrepancy. Both that
  explanation and upstream dated official licence snapshot are preserved.
- Original OrganUI application code is MIT; Three.js is MIT and fflate is MIT.
  Licence/provenance files are in `mobile/coronary-renderer/assets/`. ORBIT's
  renderer and interface are independently authored. No OrganUI UI was copied.

The model and manifest are bundled unchanged. Runtime splits each merged
coronary mesh at the original manifest's vertex/index ranges, deinterleaving
positions and normals correctly, preserving every source triangle. The source
parts are assigned to 11 named selection groups using ORBIT's matching atlas
FJ/FMA metadata. Materials, selection, visibility and presentation change;
anatomical coordinates do not. The source contains 27,348 coronary triangles.

Ventricular cavity casts are omitted rather than displayed as cardiac muscle.
The real ventricular wall and atria provide translucent spatial context.
This fixed reference has an RCA-supplied PDA. It has no authored left-dominant
variant, invented clinical segment boundaries, guessed D1/D2 labels, numeric
shortening/overlap metrics, simulated stenoses or haemodynamic claims. The old
procedural surface/centreline generator has been deleted.

## UI independence audit

The reference screenshots established capabilities only. No competitor code,
stylesheets, meshes, coordinates, images, text, data or branding were included.
ORBIT uses its purple/magenta native design, one switchable workspace, learning
goals, four learning tabs, explicit bottom angle readouts and accessible native
controls. It does not reproduce the reference's amber controls, Cartesian angle
pad, detector inset or stacked accordion layout. Ordinary anatomical names and
standard projection terminology remain. This is a provenance/design audit,
not legal clearance or a guarantee against a third-party claim.

## Runtime and mobile safeguards

The generated self-contained document is approximately 2.75 MB and includes a
gzipped model. It needs no network after installation. Rendering is on demand,
with DPR fixed to 1, no antialiasing, no continuous animation loop and app/page
visibility suspension. No WebGL context is created until the tool mounts.
Geometry, materials, textures and controls are disposed when its document exits.
A failed/lost context reports an error with a native Retry control.

The WebView accepts only its trusted local document/base URL, disables file
access and mixed content, and enables nested touch handling so Android's outer
ScrollView does not steal orbit gestures. Browser hosting accepts only the same
constant document and validates postMessage source/channel. Anatomy inspection
rotation is independent of detector acquisition angles. In room mode the body
and C-arm share a supine transform above the table; the room is an illustrative
arrangement, without a physical clearance or collision claim.

## Verification

- Pinned hash, 54 unique source IDs mapped exactly once, all source vertex/index
  ranges, finite coordinates, unit normals, 27,348 triangles and bounded presets.
- Native, browser-harness and renderer TypeScript checks; full mobile source ESLint.
- Actual SimulatorScreen discovery → tool → back, not a standalone facsimile.
- Chromium at 360/390/430/900 px: real WebGL readiness/mesh count, zero SVG in the
  3D document, pixel changes from orbit drag, live projection/angle controls,
  source-backed PDA selection, shell controls, quiz feedback, C-arm, theme,
  reset, offline interaction, no uncaught errors and no horizontal overflow.
- Short landscape controls remain reachable. Screenshots are actual browser
  captures of native components with the production WebGL document.

Android release JavaScript and the browser product must also build. Browser
checks use software WebGL in this environment; they do not establish GPU FPS,
RAM usage, pinch/scroll behavior on a physical Android device, or a signed APK.
A target 3 GB Android device remains required for release performance signoff.
No clinical or collision validation is claimed. An existing unrelated digestive
atlas coverage failure in the general web gate must not be hidden or weakened.

Teaching links remain in Learn; the model repository, official source licence
and CC BY 4.0 links are also accessible there. Required DBCLS attribution stays
visible on the 3D scene and applies to its screenshots.
