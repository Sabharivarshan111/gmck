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

/*
 * The destination is CLEARED first, and that is the fix rather than tidiness.
 *
 * This used to copy the real plates in over whatever was already there, and
 * `preview/public/plates/` had collected three 4,843-byte PNGs named `.jpg` —
 * hand-made stand-ins from a session where the download had failed. A stale
 * one is worse than a missing one: `plate-tca-cycle.jpg` existed, so the note
 * screen asked for it, got a grey ramp, and photographed it. That capture is
 * what every note shot in every ad is built on, and a grey ramp inside a card
 * headed "High-Yield Visual Exam Diagram" reads as our diagrams being broken.
 *
 * Wiping the directory means the staged set is exactly what `fetch-plates`
 * downloaded this run and nothing else, so a plate is either the real picture
 * or absent — and absent draws the stand-in that says "Renderer stand-in" on
 * its face, which nobody can mistake for a diagram.
 */
await fs.rm(plateDst, { recursive: true, force: true });
await fs.mkdir(plateDst, { recursive: true });

// A JPEG starts FF D8 FF. Anything else under this name is a stand-in wearing
// a plate's filename, which is the whole failure above.
const isJpeg = (buf) => buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;

let staged = 0;
const staged_names = new Set();
const rejected = [];
for (const name of await fs.readdir(plateSrc).catch(() => [])) {
  if (!name.startsWith('plate-') || !name.endsWith('.jpg')) continue;
  const buf = await fs.readFile(path.join(plateSrc, name));
  if (!isJpeg(buf) || buf.length < 50_000) {
    rejected.push(`${name} (${buf.length} bytes, ${isJpeg(buf) ? 'JPEG' : 'not a JPEG'})`);
    continue;
  }
  await fs.writeFile(path.join(plateDst, name), buf);
  staged_names.add(name);
  staged += 1;
}
for (const r of rejected) {
  process.stdout.write(`  not a plate, left out: ${r}\n`);
}
process.stdout.write(`${staged} plate(s) staged for the preview harness\n`);

/*
 * Every plate, or none of these screens are worth photographing.
 *
 * This used to accept any number above zero, and the gap it left is the bug
 * the app's owner reported: `plate-tca-cycle.jpg` was not among the plates on
 * disk, so the single-note screen asked for a file that was not there and
 * photographed a grey rectangle inside a card headed "High-Yield Visual Exam
 * Diagram". Three plates were staged, the check passed, and the capture went
 * on to produce a screen no ad should ever use.
 *
 * The expected set is read out of `fetch-plates.mjs` rather than written here,
 * so adding a plate there cannot leave this behind.
 */
const expected = [
  ...(await fs.readFile(path.join(root, 'scripts', 'fetch-plates.mjs'), 'utf8'))
    .matchAll(/'(plate-[a-z0-9-]+\.jpg)':/g),
].map((m) => m[1]);
const absent = expected.filter((name) => !staged_names.has(name));
if (absent.length > 0) {
  process.stdout.write(
    `\n${absent.length} plate(s) are not on disk: ${absent.join(', ')}\n` +
      'Run `npm run plates` first. Without them the note screens photograph an\n' +
      'empty picture box, and that capture is what every note shot in every ad\n' +
      'is built on. The storage bucket is unreachable from an agent sandbox, so\n' +
      'these screens can only be captured in CI.\n',
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
  // Behind a control rather than a URL — the harness taps them open by their
  // accessibility label, which is also proof that TalkBack can reach them.
  'attendance', 'attendance-postings', 'settings', 'settings-bottom',
  'browse-first', 'browse-second', 'browse-third', 'notes-bottom', 'flashcards-decks-bottom',
  'attendance-empty', 'attendance-critical',
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
  // The walkthroughs the new ads are made of. Each is a real capture from its
  // own harness (apkg-shot, page-ref-shots, homeedit-shot); none is a mockup.
  'apkg-2-instructions', 'apkg-4-narrowed', 'apkg-5-share', 'apkg-6-shared',
  'pageref-2-toggle-on', 'pageref-3-sheet', 'pageref-4-add-book', 'pageref-6-quorum',
  'tour-01-welcome', 'tour-02-spotlight', 'tour-04-pomodoro',
  'homeedit-5-taller', 'glass-notes', 'notetoolbar-both-preview',
];

for (const name of fromShoot) {
  await fs.copyFile(path.join(tmp, `${name}.png`), path.join(out, `${name}.png`));
}
for (const name of fromRepo) {
  await fs.copyFile(path.join(repo, 'screenshots', `${name}.png`), path.join(out, `${name}.png`));
}
await fs.rm(tmp, { recursive: true, force: true });
process.stdout.write(`\n${fromShoot.length + fromRepo.length} screens staged\n`);
