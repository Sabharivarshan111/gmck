# Mobile Vault parity audit

The comparison target is the production Vercel **mobile** UI. Desktop previews
and react-native-web screenshots are not Android evidence.

The studio, patient interventions, ICU, ECG, radiology and clubbing have React
Native views. Radiology uses Android bitmap rendering and packaged source films /
MRI voxels. Their UI differences still need review against mobile screenshots.

Anatomy and the remaining diagnostic instruments now have a dedicated **local
WebGL view** in the native app. This is not a separate native OpenGL rewrite.
The renderer imports the canonical `src/pages/Simulator.tsx` without changing
the live website. Its build, teaching data, styles and metadata occupy about
3.44 MB before APK compression. Exact model files are downloaded on demand,
verified against the build's SHA-256 manifest, and stored in private persistent
device storage. A first connection is required for each previously unseen model.
The full atlas's compressed geometry alone is about 31.4 MiB, so exact geometry
cannot honestly be described as a cold-offline sub-10 MB addition.

The native surface uses a virtual HTTPS asset origin. File access, content URI
access, mixed content, redirects and unlisted asset requests are blocked. It
loads JS/CSS from the APK, not the deployed website. Model downloads contain only
public reference files, never account sessions. Back closes the current tool or
drawer before returning to the RN studio. Host background visibility pauses the
canonical frame loop, and the surface remains mounted to preserve camera state.

`native-anatomy-parity-manifest.mjs` inventories 2,381 structures, 15 systems and
36 organ/teaching targets. The Android capture script exercises the actual view
using a debug-only route intent and waits for loaded geometry. The Vercel capture
script uses each Android renderer's reported mobile viewport. Capture alone is
not certification: review shape, vessels, nerves, labels, relations, animations,
zoom/rotation, dissection, restoration, teaching details and offline reload.

Current status: **NOT CERTIFIED**. Do not label a build "all functionality
identical" until installed-device evidence and the functional audit pass.

The native patient-case surface now includes the source mobile header/HUD,
department filters, searchable 43-case selector, compact Rx/error badges,
anatomy layers, diagnostic entry points and bottom tabs. The latest six events
remain visible after repeated treatments. A validated patient snapshot transfers
the complete kernel (including internal targets and waveform phases) into the
local anatomy/tool surface and back. Node tests confirm forward/backward
continuity for every scenario after treatments; this still requires device QA.

Debug builds have a read-only reference-browser intent for the same Vercel
simulator on the same Android WebView, viewport, fonts and GPU. Production
builds cannot enable it. Third-party requests, including live ad scripts and
service-worker ad requests, are blocked. The separate QA helper APK reads the
actual accessibility tree without waiting for continuously updating vitals to
become idle; it never restarts or freezes the native app. It is not part of the
user APK.

Prior build: debug-530 built Kotlin and APK successfully. The initial reference
capture stopped at ICU; the following audit commit makes emulator capture
independent of a Vercel reference failure. The timer fixes avoid pre-advancing a
patient during ICU initialization and pause duplicate case timers while ICU is
open. Nested hardware Back returns to the same patient engine.

Debug-531 also built successfully. Its genuine Android studio screenshots reveal
spacing, inset and emoji-font differences. Its case did open: the failure image
shows it, but `uiautomator dump` failed with "could not get idle state". This is
why the next capture uses the live-tree helper rather than the idle-waiting CLI.
Those captures are baseline evidence, not a successful parity audit.

The first cached-renderer device capture was blank before geometry loaded. The
DOM entry resolved mobile React 19 while source hooks resolved web React 18.
The renderer now explicitly aliases and deduplicates React/React DOM to the
canonical web packages; the build rejects any mobile React dependency in its
module graph. Bundle size dropped by about 195 KB. A root render boundary and
startup error reporting prevent a silent white screen. Latest device proof is
still required.
