/**
 * Build both films, then render whichever ones built.
 *
 * Rendering is `hyperframes render`, which drives Chromium a frame at a time
 * and hands the PNGs to FFmpeg. Both have to be present: Node 22 or newer, and
 * a real FFmpeg with `ffprobe` beside it.
 *
 *   node scripts/render.mjs            # both, draft
 *   node scripts/render.mjs --high     # both, delivery quality
 *   node scripts/render.mjs the-year   # one of them
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const quality = args.includes('--high') ? 'high' : 'draft';
const only = args.filter((a) => !a.startsWith('--'));

const env = {
  ...process.env,
  HYPERFRAMES_NO_TELEMETRY: '1',
};
/*
 * The sandbox ships Chromium for Playwright rather than a system Chrome, and
 * the CLI will not find it on its own. Naming it here is what lets a render
 * run in the same container that captured the screenshots.
 */
const chrome = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
if (!env.HYPERFRAMES_BROWSER_PATH && fs.existsSync(chrome)) {
  env.HYPERFRAMES_BROWSER_PATH = chrome;
}

const run = (exe, argv) => execFileSync(exe, argv, { cwd: root, env, stdio: 'inherit' });

run(process.execPath, ['scripts/build.mjs']);

for (const exe of ['ffmpeg', 'ffprobe']) {
  try {
    execFileSync(exe, ['-version'], { stdio: 'ignore' });
  } catch {
    throw new Error(
      `${exe} is not on PATH. HyperFrames renders the frames itself and hands ` +
        'them to FFmpeg to encode; without it there is no file at the end.',
    );
  }
}

const films = ['ask-it', 'the-year']
  .filter((f) => only.length === 0 || only.includes(f))
  .filter((f) => {
    const built = fs.existsSync(path.join(root, f, 'index.html'));
    if (!built) {
      process.stdout.write(
        `\n  skipping ${f} — it did not build. The reason is above, and it is ` +
          'almost always a screenshot that is not on disk.\n',
      );
    }
    return built;
  });

if (films.length === 0) throw new Error('Nothing to render.');

fs.mkdirSync(path.join(root, 'renders'), { recursive: true });
for (const film of films) {
  const out = path.join(root, 'renders', `orbit-${film}.mp4`);
  run(process.execPath, [
    'node_modules/hyperframes/bin/hyperframes.mjs',
    'render',
    film,
    '--quality',
    quality,
    '--workers',
    '2',
    // Software rasterisation: there is no GPU in the container, and letting it
    // probe for one costs a minute and then falls back anyway.
    '--no-browser-gpu',
    '--output',
    out,
  ]);

  const { size } = fs.statSync(out);
  if (size < 200_000) throw new Error(`${out} is only ${size} bytes — that is not a film.`);
  const probe = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out],
    { encoding: 'utf8' },
  ).trim();
  const seconds = Number(probe);
  // Sixty seconds, give or take a frame. The platform holds the stopwatch, and
  // a film that runs long is one whose call to action is trimmed off.
  if (!(seconds > 59.8 && seconds < 60.2)) {
    throw new Error(`${out} runs ${seconds}s, not 60s.`);
  }
  process.stdout.write(`  ${out}  ${(size / 1e6).toFixed(1)}MB  ${seconds.toFixed(2)}s\n`);
}
