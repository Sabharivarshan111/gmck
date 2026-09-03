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
];
// Screens the harness does not produce, kept in the repo's screenshots/ dir.
const fromRepo = [
  'glass-home', 'single-note-diagram', 'chapter-diagrams', 'apkg-1-hub',
  'music-06-playing',
];

for (const name of fromShoot) {
  await fs.copyFile(path.join(tmp, `${name}.png`), path.join(out, `${name}.png`));
}
for (const name of fromRepo) {
  await fs.copyFile(path.join(repo, 'screenshots', `${name}.png`), path.join(out, `${name}.png`));
}
await fs.rm(tmp, { recursive: true, force: true });
process.stdout.write(`\n${fromShoot.length + fromRepo.length} screens staged\n`);
