// Everything a note carries stays on the phone, and stays uncapped.
//
// Two promises made to the app's owner, in their own words: notes and anything
// attached to them are "local or on-device itself not cloud or supabase", and
// "storage pictures are unlimited coz its stored locally on ur phone so no caps
// only". Both are the kind of rule that lasts exactly one session when it lives
// in a commit message.
//
// `check:cloud-ids` guards the first from the network side. This guards the
// shape of the storage: that a video is a file rather than base64 in the store
// that also holds the note list, that nothing invents a size limit, and that
// the native module Android needs is actually wired up — none of which tsc,
// eslint or the preview harness can see, since react-native-web has no Storage
// Access Framework and no app storage.
//
//   node scripts/note-media-check.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const mobile = path.join(here, '..');
const kotlin = path.join(mobile, 'android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd');

const read = p => readFileSync(p, 'utf8');
const code = source =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

// ---------------------------------------------------------------------------
// 1. No cap. Not on one file, not on how many.
// ---------------------------------------------------------------------------
const files = code(read(path.join(mobile, 'src/lib/noteFiles.ts')));
const images = code(read(path.join(mobile, 'src/lib/noteImages.ts')));
for (const [name, source] of [['noteFiles', files], ['noteImages', images]]) {
  check(
    !/MAX_[A-Z_]*(BYTES|SIZE|COUNT|FILES|MB)\b/.test(source),
    `${name} declares a size or count cap — these live on the reader's own phone and the ` +
      'limit is their free space, which is theirs to spend',
  );
  check(
    !/\.size\s*>\s*\d|length\s*>\s*\d{5,}/.test(source),
    `${name} compares a size against a literal — that is a cap by another name`,
  );
}

// ---------------------------------------------------------------------------
// 2. A video is a file. A picture is a row. Neither is the other.
// ---------------------------------------------------------------------------
check(
  !/AsyncStorage/.test(files),
  'noteFiles puts bytes in AsyncStorage — the same store holds the note list, and forty ' +
    'megabytes of base64 video in it makes reading the note *titles* a multi-megabyte parse',
);
check(
  /pathFor\(/.test(files) && /file:\/\//.test(read(path.join(mobile, 'src/lib/noteFiles.ts'))),
  'noteFiles no longer resolves a file:// path, so nothing can play what it stored',
);
check(
  /AsyncStorage/.test(images),
  'noteImages no longer uses AsyncStorage — a downscaled picture belongs in a row, and the ' +
    'per-key layout is what keeps the note list cheap to read',
);

// ---------------------------------------------------------------------------
// 3. Deleting a note takes its media with it.
//
// Without this a deleted note's video sits on the device for ever, taking
// space nothing on screen accounts for — the reader deleted the only thing
// that referenced it.
// ---------------------------------------------------------------------------
const hook = code(read(path.join(mobile, 'src/hooks/useUserNotes.ts')));
check(
  /removeNoteImages\(/.test(hook),
  'deleting a note no longer deletes its pictures',
);
check(
  /removeNoteFiles\(/.test(hook),
  'deleting a note no longer deletes its files — a forgotten video is a great deal of space',
);

// ---------------------------------------------------------------------------
// 4. Every kind the picker offers, the reader can actually use.
//
// Offering a .zip in the picker and then having nothing that can open it is
// worse than not offering it.
// ---------------------------------------------------------------------------
const module_ = read(path.join(kotlin, 'FilesModule.kt'));
for (const mime of ['image/*', 'video/*', 'audio/*', 'application/pdf']) {
  check(module_.includes(`"${mime}"`), `the picker no longer offers ${mime}`);
}
const tab = code(read(path.join(mobile, 'src/components/ProgressNotesTab.tsx')));
for (const [kind, expectation] of [
  ['video', /kind === "video"/],
  ['audio', /kind === "audio"/],
  ['pdf', /Linking\.openURL/],
]) {
  check(expectation.test(tab), `the note reader has no way to open a ${kind}`);
}
check(
  /paused=\{!playing/.test(tab),
  'attached media autoplays — opening a note would start a lecture recording out loud',
);

// ---------------------------------------------------------------------------
// 5. A note can be read, not only edited.
//
// The card carried a pencil and a bin, and the title was the only way in — a
// title that looks like a title beside two icons that look like buttons. The
// report was that there was no way to view a note at all.
// ---------------------------------------------------------------------------
check(
  /Read note/.test(tab),
  'the note card no longer says how to open it, which is how it read as a card with two ' +
    'actions and no way in',
);
check(
  (tab.match(/setReading\(n\)/g) ?? []).length >= 2,
  'only one part of the note card opens it — the body is where a finger goes',
);

// ---------------------------------------------------------------------------
// 6. Nothing here reaches the network. Ever.
// ---------------------------------------------------------------------------
for (const file of ['src/lib/noteFiles.ts', 'src/lib/noteImages.ts']) {
  // Comment-stripped: both files spend a paragraph each explaining that they
  // never upload anything, and the words they use to say so are the words this
  // forbids.
  const source = code(read(path.join(mobile, file)));
  for (const forbidden of ['supabase', 'storage.from', 'fetch(', 'upload']) {
    check(
      !source.toLowerCase().includes(forbidden.toLowerCase()),
      `${file} mentions "${forbidden}" — note media never leaves the phone`,
    );
  }
}
check(
  !/INTERNET|permission/i.test(code(module_)),
  'FilesModule asks for a permission — ACTION_OPEN_DOCUMENT runs out of process and needs none',
);

// ---------------------------------------------------------------------------
// 7. The native module exists at all under the New Architecture.
// ---------------------------------------------------------------------------
const spec = read(path.join(mobile, 'src/native/NativeOrbitFiles.ts'));
check(
  /TurboModuleRegistry\.get</.test(spec),
  'the spec uses getEnforcing, which turns a missing module into a crash instead of a hidden button',
);
for (const method of ['pick', 'pathFor', 'remove', 'totalBytes']) {
  check(new RegExp(`\\b${method}\\b`).test(spec), `the spec has no ${method}`);
  check(
    new RegExp(`override fun ${method}\\b`).test(module_),
    `FilesModule does not implement ${method} — the generated spec would not compile`,
  );
}
const pkg = read(path.join(kotlin, 'FilesPackage.kt'));
check(/BaseReactPackage/.test(pkg), 'FilesPackage is a plain ReactPackage, which the New Architecture never reads');
check(/isTurboModule\s*=?\s*\*?\/?\s*true/.test(pkg), 'FilesPackage does not declare isTurboModule');
check(
  read(path.join(kotlin, 'MainApplication.kt')).includes('FilesPackage()'),
  'FilesPackage is not registered — the module would simply not exist, silently, on every device',
);
check(
  read(path.join(mobile, 'preview/vite.config.ts')).includes('orbit-files'),
  'the preview has no shim for the files module, so the harness fails to build',
);

if (failures.length > 0) {
  console.error('Note media check failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('OK  pictures, video, audio and PDFs stay on the phone, uncapped, and open');
