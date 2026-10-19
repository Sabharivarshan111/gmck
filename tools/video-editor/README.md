# Open-source video editing (separate from Orbit)

This is an **optional video-production tool**, not an Orbit MBBS app screen or Android dependency. The OpenReel source is included as a pinned Git submodule at `openreel/`, under its upstream **MIT license**.

- Upstream: https://github.com/Augani/openreel-video
- Browser editor: https://openreel.video
- Pinned revision: `367d7e90b61b5181f9861b852bb8b9d7a7d2954a` (17 Oct 2026)

## Install and run on your computer / development machine

1. Install Node.js and pnpm (with Corepack, if applicable).
2. From the **repository root** run:

   ```bash
   bash tools/video-editor/start.sh
   ```

This initializes the exact OpenReel revision into `tools/video-editor/openreel` with Git, installs its JavaScript dependencies and starts its browser UI. Open the local Vite URL shown in the terminal (typically http://localhost:5173). First install needs internet access.

Alternatively use the upstream hosted editor at https://openreel.video directly, without installing anything. Clips stay local in the browser for the core editor workflow; optional connected/AI features may send data to their selected providers. For a **public online instance**, deploy this subproject separately and protect access rather than adding an anonymous media-upload endpoint to the medical app.

## Reproduce the two natural colour edits

With FFmpeg on your PATH and both original videos on your machine:

```bash
bash tools/video-editor/render-natural.sh /path/to/1000517862.mp4 /path/to/1000517831.mp4 ./video-exports
```

- Video 1: source is 4K portrait (display rotation); exports 1080 × 1920 at 30 fps using subtle gamma/contrast/saturation adjustment and mild noise reduction.
- Video 2: exports at original 360 × 640 and 30 fps; gentle noise reduction, highlight restraint and very light sharpening. The source is blurry; upscaling would not recover real detail.
- No AI face alteration, portrait substitution, cropping, captions, music or transitions; source sound is retained if present. All frames are preserved.

## Privacy and maintenance

The original and edited personal video files must **not** be committed to this repository. The parent `.gitignore` already excludes `*.mp4`. Script outputs live under the chosen local export directory. Submodule is pinned rather than automatically following main; inspect updates and licenses before changing revisions.

The editor is independent of the Vite web app (`src/`) and native Android app (`mobile/`). Do not add OpenReel dependencies to either app's package.json or include it in APK/AAB builds.

## Basic verification

```bash
git submodule status tools/video-editor/openreel
cd tools/video-editor/openreel && pnpm install --frozen-lockfile && pnpm build
```

This verifies the separate editor on the developer machine. The GitHub source pin and the FFmpeg recipes have been prepared; browser installation/build validation must be run in an environment with npm package access.
