# Patient Simulator deployed verification — 2026-10-05

Runtime commit: 2bcea7fa21471c6d98daa650290562730b93ac41.
Vercel deployment: dpl_3Pc1LLTaQKQFjx849xDpgVAVWPy2, READY.
Public alias: https://orbitmbbs.vercel.app/simulator now assigned to this build.

Verified in the deployed browser: WebGL initialization failure shows an in-view alert without blanking the application. ICU vitals and waveforms remain rendered. Sound toggle changes to Tone ON and back to Muted. ECG tutorial opens its cardiac simulation and closes. Switching from snakebite to STEMI updates case title, rhythm and monitor vitals. Verified the public canonical URL after assigning the alias.

Local checks: build:vercel, mobile typecheck:web, check:simulator, check:simulator-assets, check:simulator-mobile, check:dossiers, check:deploy, check:repo-intact and simulator-lifecycle-check.mjs passed. Simulator TypeScript errors are cleared; root tsc still reports the pre-existing src/lib/apkgWeb.ts callable-union issue.

Limitations: the cloud browser disables WebGL. Actual 3D rendering, graphics context recovery under GPU memory pressure, iPhone audio playback and device FPS/battery measurements have not been verified on hardware. No medical scenario or drug dosing calibration was changed. Do not claim all simulator functionality or native device performance has been verified.

The prior Notes shortcut, native web shell, model provenance and all source assets are preserved. Continue on codex/native-web-parity for this deployed web work; no Android release was published by this change.
