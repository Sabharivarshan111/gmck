// Capture the app screens the ads use, from the real React Native screens.
//
// Runs mobile/preview/shoot.mjs (react-native-web through Chromium) and copies
// the results in. Screens are captured fresh on every render rather than
// committed, so an ad can never show a UI the app no longer has.
//
// Note this needs network access to Supabase: the notes screens fetch their
// diagrams, and without it they render the "this diagram could not be loaded"
// placeholder. `preflight.mjs` catches the resulting blank captures.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const repo = path.join(root, '..');
const tmp = path.join(root, '.screens-tmp');

/*
 * The plates go in BEFORE the screens are captured, and the order is the fix.
 *
 * Two of the screens are note screens that draw a medical plate. The preview
 * harness cannot reach the storage bucket, so on its own it draws a stand-in —
 * a white rectangle with the diagram's name written on it — or, when the
 * fixture points at the real URL, the "this diagram could not be loaded"
 * placeholder. Both of those reached a published advertisement, because the
 * two screens were captured by hand months ago and copied out of
 * `screenshots/`.
 *
 * `fetch-plates.mjs` has already downloaded the real ones into
 * `public/app_screens/`. Copying them where Vite serves them, first, means the
 * capture photographs the plate.
 */
const plateSrc = path.join(root, 'public', 'app_screens');
const plateDst = path.join(repo, 'mobile', 'preview', 'public', 'plates');
await fs.mkdir(plateDst, { recursive: true });
let staged = 0;
for (const name of await fs.readdir(plateSrc).catch(() => [])) {
  if (!name.startsWith('plate-') || !name.endsWith('.jpg')) continue;
  await fs.copyFile(path.join(plateSrc, name), path.join(plateDst, name));
  staged += 1;
}
process.stdout.write(`${staged} plate(s) staged for the preview harness\n`);
if (staged === 0) {
  process.stdout.write(
    'No plates on disk. Run `npm run plates` first — without them the note\n' +
      'screens fall back to the drawn stand-ins, which must not reach an ad.\n',
  );
  process.exit(1);
}

execFileSync('node', ['preview/shoot.mjs', tmp], {
  cwd: path.join(repo, 'mobile'),
  stdio: 'inherit',
});

const out = path.join(root, 'public', 'app_screens');
await fs.mkdir(out, { recursive: true });

// Freshly captured screens.
const fromShoot = [
  'home', 'home-light', 'browse', 'browse-final', 'questions', 'notes-renderer',
  'notes-renderer-bottom', 'askai', 'chatdemo', 'flashcards-decks',
  'anki-study', 'notes', 'usernotes-edit', 'usernotes-preview', 'timer',
  'timer-bottom', 'growthshowcase', 'treegallery', 'progress', 'progress-bottom',
  // Captured fresh rather than copied from `screenshots/`: these two carry a
  // medical plate, and the committed copies held a stand-in and a failed image.
  'single-note-diagram', 'chapter-diagrams',
  // Named by a shot's `imageName` prop and produced by nothing until now.
  'tca-note',
  /*
   * Named by SCREENS entries and produced by nothing either — they survived
   * only because 100 generated screens were committed to `public/app_screens/`
   * despite `.gitignore` forbidding exactly that, so the checkout supplied
   * them. They are untracked now, which is what makes this list load-bearing:
   * anything not produced here is now genuinely absent, and preflight says so.
   */
  'questions-chapters', 'questions-leaf', 'home-edit',
];
// Screens the harness does not produce, kept in the repo's screenshots/ dir.
const fromRepo = [
  'glass-home', 'apkg-1-hub', 'music-06-playing',
  /*
   * Named by `imageName=` props on ad shots and produced by none of the steps
   * above. Each was a broken image in a finished cut, and preflight was blind
   * to all of them because it only reads the SCREENS registry's `file:`
   * entries — never the props.
   */
  'glass-progress', 'tour-03-gestures', 'bot-liquidglass', 'apkg-3-chooser',
  'homeedit-7-picture',
];

for (const name of fromShoot) {
  await fs.copyFile(path.join(tmp, `${name}.png`), path.join(out, `${name}.png`));
}
for (const name of fromRepo) {
  await fs.copyFile(path.join(repo, 'screenshots', `${name}.png`), path.join(out, `${name}.png`));
}
await fs.rm(tmp, { recursive: true, force: true });
process.stdout.write(`\n${fromShoot.length + fromRepo.length} screens staged\n`);
