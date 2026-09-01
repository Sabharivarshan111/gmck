// The AGSL glass pane is additive, gated, and never load-bearing.
//
// None of this can be executed here: there is no emulator, the preview harness
// is a browser with no `RuntimeShader`, and the shader itself only compiles
// inside Android's own Skia. So what is checked is the *shape* of the thing —
// the gates that decide whether it mounts, the order it is drawn in, and the
// promise that every failure lands on the drawn bevel rather than on a hole.
//
// Each assertion below is a bug that would ship silently. A missing API gate
// is a crash on Android 12; a full-size capture is ten megabytes and nine
// times the draw on the cheapest phone this app runs on; a pane that does not
// stand down during a capture refracts its own last frame and smears a little
// further every time; and the wrong draw order is a card with no fill under it
// on every phone the shader does not reach, which is most of them.
//
//   node scripts/glass-shader-check.mjs
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(path.join(root, file), 'utf8');

/**
 * The same file with its comments removed.
 *
 * Needed because this check is about what the code does, and every rule here
 * is *explained* somewhere in a comment that quotes the very pattern being
 * looked for. Matching prose reported the wallpaper bug as still present
 * immediately after it was fixed, and put the bevel underneath the shader
 * because the class docstring mentions `pointerEvents` before the JSX does.
 */
const code = file =>
  read(file)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const failures = [];
const check = (ok, what) => {
  if (!ok) failures.push(what);
};

const gate = read('src/native/OrbitGlass.tsx');
const surface = read('src/components/GlassSurface.tsx');
const view = read('android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd/GlassView.kt');
const manager = read('android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd/GlassViewManager.kt');
const application = read('android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd/MainApplication.kt');

/* ---- the gate ---- */

check(
  /Platform\.Version\s*>=\s*33/.test(gate),
  'OrbitGlass does not check Platform.Version >= 33 — RuntimeShader is API 33, and minSdkVersion here is 24',
);
check(
  /hasViewManagerConfig\(\s*'OrbitGlass'\s*\)/.test(gate),
  'OrbitGlass does not ask hasViewManagerConfig before using the component — a missing native view would be indistinguishable from a working one that draws nothing',
);
check(
  /requireNativeComponent/.test(gate) && /GLASS_SHADER_AVAILABLE\s*\n?\s*\?/.test(gate),
  'requireNativeComponent is called unconditionally — it must be behind the availability flag',
);

/* ---- what makes it affordable enough to run everywhere ---- */

// The wallpaper gate is gone on purpose: what is behind a card is the page,
// and bending that is the effect. What the gate was really protecting was
// cost, and these three are the things that answer it properly. Lose any one
// and this becomes a full-screen rasterisation on a cheap phone, every frame.
check(
  /CAPTURE_SCALE/.test(view) && /canvas\.scale\(CAPTURE_SCALE, CAPTURE_SCALE\)/.test(view),
  'the capture is not downscaled — a full-size ARGB_8888 bitmap is about 10MB and nine times the draw, per refresh',
);
check(
  /captureScale/.test(view),
  'the shader is not told the capture scale, so its sampling window will drift away from the card as the page scrolls',
);
check(
  /MIN_INTERVAL_MS/.test(view) && /lastCaptureAt/.test(view),
  'captures are not throttled — every pane on screen would re-rasterise independently',
);
check(
  /@Volatile\s*\n\s*private var capturing/.test(view) && /if \(capturing\) return/.test(view),
  'panes do not stand down while the screen is captured, so each capture contains the previous refraction and the smear compounds',
);

check(
  !/useWallpaper\(\)\s*!==\s*null/.test(code('src/theme/index.tsx')),
  'theme/index compares the useWallpaper hook object against null, which is always true',
);

/* ---- video wallpapers ---- */

check(
  /viewType=\{ViewType\.TEXTURE\}/.test(code('src/components/WallpaperBackground.tsx')),
  'the video wallpaper is not a TextureView. A SurfaceView cannot be read into a canvas, so the shader would stand down on every video wallpaper',
);
check(
  /is TextureView/.test(view) && /getBitmap\(/.test(view),
  'GlassView has no TextureView path, so a video wallpaper cannot reach the shader',
);
check(
  /bestTexture \?: bestImage/.test(view),
  'a TextureView must win the background search — it is the whole page and it is the one thing that moves',
);

/* ---- the draw order ---- */

const surfaceCode = code('src/components/GlassSurface.tsx');
const shaderAt = surfaceCode.indexOf('<OrbitGlass');
const bevelAt = surfaceCode.indexOf('pointerEvents="none"');
const fillAt = surfaceCode.indexOf('backgroundColor: glass');
check(shaderAt > 0, 'GlassSurface never renders OrbitGlass');
check(
  fillAt > 0 && fillAt < shaderAt,
  'the fill must be painted before the shader, so a phone that cannot draw the shader still has a card',
);
check(
  bevelAt > shaderAt,
  'the bevel must be drawn over the shader, not under it — it is the part that follows the theme and the part that is known to work',
);

/* ---- the native fallbacks ---- */

check(
  /Build\.VERSION\.SDK_INT\s*>=\s*Build\.VERSION_CODES\.TIRAMISU/.test(view),
  'GlassView does not gate on TIRAMISU',
);
check(
  /if \(!supported\(\)[^)]*\) return/.test(view),
  'GlassView.onDraw must return early when unsupported, leaving the card already painted underneath',
);
check(
  /MAX_ATTEMPTS/.test(view) && /gaveUp\s*=\s*true/.test(view),
  'GlassView retries the capture without a bound. A video wallpaper can never be captured, and re-rasterising a full-screen bitmap forever is worse than the bug it is fixing',
);
check(
  /looksReal/.test(view),
  'GlassView does not test whether the capture produced anything — a SurfaceView draws nothing, and refracting an empty bitmap replaces a card with a hole',
);
check(
  /removeOnPreDrawListener/.test(view),
  'GlassView adds a pre-draw listener it never removes',
);

/* ---- registration ---- */

check(/SimpleViewManager<GlassView>/.test(manager), 'GlassViewManager is not a SimpleViewManager');
check(
  /const val NAME = "OrbitGlass"/.test(manager) && gate.includes("'OrbitGlass'"),
  'the native view name and the JS component name have parted company',
);
check(
  /createViewManagers/.test(read('android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd/GlassPackage.kt')),
  'GlassPackage does not return a view manager',
);
check(/add\(GlassPackage\(\)\)/.test(application), 'GlassPackage is not registered in MainApplication');

/* ---- the preview harness knows it is absent ---- */

const shim = read('preview/shims/orbit-glass.tsx');
check(
  /GLASS_SHADER_AVAILABLE\s*=\s*false/.test(shim),
  'the preview shim claims the shader exists. It does not: the harness is a browser, and pretending otherwise shows a reviewer an effect no device produces',
);

if (failures.length > 0) {
  console.error('Glass shader check failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  'OK  the glass shader is gated on Android 13, downscaled, throttled and self-excluding, ' +
    'reads a video wallpaper, and every failure path lands on the bevel',
);
