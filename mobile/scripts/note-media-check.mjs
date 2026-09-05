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

// And saving one keeps them.
//
// createNote built the note field by field and updateNote's patch type listed
// the editable fields by hand; neither mentioned `files`, so every attachment
// was silently dropped on save. TypeScript said nothing — the caller passes a
// variable rather than an object literal, so the excess-property check that
// would have caught it never runs.
//
// Naming `files` in both places fixed that instance and left the next field to
// be forgotten the same way, so what is checked now is the shape of the fix:
// one editable type derived from `UserNote`, spread into the new note and used
// as the patch. A field added to the note is editable by construction.
check(
  /type NoteEdit = Partial<Omit<UserNote,/.test(hook),
  'the editable fields are listed by hand again — the next one added will be dropped on save',
);
const createBlock = hook.slice(hook.indexOf('const createNote'), hook.indexOf('const updateNote'));
check(
  /initial\?: NoteEdit/.test(createBlock) && /\.\.\.initial,/.test(createBlock),
  'createNote no longer spreads the whole edit, so a field it does not name is lost on save',
);
const patchBlock = hook.slice(hook.indexOf('const updateNote'), hook.indexOf('const deleteNote'));
check(
  /patch: NoteEdit/.test(patchBlock),
  "updateNote's patch is no longer the editable type, so editing a note can strip fields",
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
// ---------------------------------------------------------------------------
// 4b. The player.
//
// It is built on react-native-video, which this app already ships for the
// video wallpaper — so it costs no size at all. libVLC would carry its own
// decoders, tens of megabytes per ABI, to play formats the phone's own picker
// could never have handed us in the first place.
// ---------------------------------------------------------------------------
const player = code(read(path.join(mobile, 'src/components/NoteMediaPlayer.tsx')));
check(
  /from 'react-native-video'/.test(player),
  'the note player is no longer built on react-native-video, which the app already ships',
);
check(
  /paused=\{!playing\}/.test(player),
  'attached media autoplays — opening a note would start a lecture recording out loud',
);
check(
  /controls=\{false\}/.test(player),
  "the player uses ExoPlayer's own controls — a different typeface, accent and gesture set " +
    'dropped into the middle of a note',
);
check(
  /scrubbing === null/.test(player),
  'progress events overwrite the thumb during a drag again, which reads as a control fighting you',
);
check(
  /player\.current\?\.seek\(/.test(player),
  'the scrubber no longer seeks, so it is a progress bar wearing a thumb',
);
// Specifically inside onProgress: `seeking.current` appears in the release
// handler and in onSeek too, so merely finding it anywhere proves nothing.
const onProgressBlock = player.slice(
  player.indexOf('onProgress='),
  player.indexOf('onSeek='),
);
check(
  /!seeking\.current/.test(onProgressBlock) && /onSeek=/.test(player),
  'progress is written back before the seek has landed — the thumb springs to the old ' +
    'position and then jumps forward, which is the jitter on release',
);
check(
  /const onScrub = useCallback/.test(player) && /const onScrubEnd = useCallback/.test(player),
  'the scrubber callbacks are inline again — a drag re-renders this forty times a second, ' +
    'and an unstable handler is what rebuilds a gesture underneath the finger',
);
check(
  /volume=\{volume\}/.test(player) && /muted=\{muted\}/.test(player),
  'the player has no volume control',
);
check(
  /audioTracks\?\.length/.test(player),
  'nothing checks whether the file has an audio track, so a silent screen recording is ' +
    'indistinguishable from a broken player',
);

// And the primitive underneath it. Every slider in the app is driven by inline
// arrows from JSX; the responder must not depend on them.
const slider = code(read(path.join(mobile, 'src/components/Slider.tsx')));
check(
  /onChangeRef\.current/.test(slider) && /onCommitRef\.current/.test(slider),
  'Slider calls its props directly again, so its memoised PanResponder depends on them and ' +
    'is rebuilt mid-drag — the control moves a little and then hangs',
);
const responderDeps = slider.slice(slider.lastIndexOf('PanResponder.create'));
check(
  !/\[[^\]]*\bonChange\b[^\]]*\]/.test(responderDeps),
  "Slider's responder memo depends on onChange again",
);

// ---------------------------------------------------------------------------
// 4c. Two ways to attach, and the one that must never delete anything.
//
// A linked file belongs to the reader and lives outside this app. Detaching it
// gives up our permission to read it and touches nothing else — pass an id
// where a record belongs and the wrong branch deletes somebody's only copy of
// their own recording.
// ---------------------------------------------------------------------------
const lib = code(read(path.join(mobile, 'src/lib/noteFiles.ts')));
check(
  /export function removeNoteFile\(file: NoteFile\)/.test(lib),
  'removeNoteFile takes an id again — it cannot tell a copy from a link, and one of those ' +
    'branches deletes a file that is not ours',
);
check(
  /if \(file\.linked\)[\s\S]{0,200}release\(/.test(lib),
  'detaching a linked file no longer releases the grant — or worse, deletes the original',
);
check(
  /adoptNoteFile/.test(lib) && /linkIsAlive/.test(lib),
  'a link can no longer be checked or copied in, which is the whole way out of a broken one',
);
check(
  /takePersistableUriPermission/.test(module_),
  'the link takes no persistable permission, so it would expire on the next reboot — the ' +
    'worst failure, because nobody notices it until a week later',
);
check(
  /FLAG_GRANT_PERSISTABLE_URI_PERMISSION/.test(module_),
  'the pick intent does not request a persistable grant, so taking one throws',
);
check(
  !/delete\(\)/.test(module_.slice(module_.indexOf('fun release'), module_.indexOf('fun pathFor'))),
  'release() deletes something — a linked file is the reader\'s own and must never be touched',
);
/*
 * The choice has to be explained where it is made, not discovered a month
 * later when the file stops playing.
 *
 * This asserted the literal sentence "Works even if you delete the original",
 * which was the wording until 1fdbf17c reworded both options to say what a
 * copy and a link ARE — because the consequences alone assumed the reader
 * already knew the difference, which is a filesystem distinction dressed in
 * ordinary English. `check:music` was updated for that and this was not, so it
 * has been failing ever since on a screen that is correct.
 *
 * It now asserts the two consequences that actually have to be stated, in
 * whatever words: that a copy survives the original being deleted, and that a
 * link does not. Reworded again and this still holds; the guarantee removed
 * and it does not.
 */
check(
  /still opens (it|the file) even if you delete/.test(tab),
  'the attach chooser no longer says a copy survives the original being deleted',
);
check(
  /stops (opening it|working) if you delete/.test(tab),
  'the attach chooser no longer says a link stops working if the original goes',
);
for (const phrase of ['Save a copy', 'Just link it']) {
  check(
    tab.includes(phrase) || read(path.join(mobile, 'src/components/ProgressNotesTab.tsx')).includes(phrase),
    `the attach chooser no longer says "${phrase}"`,
  );
}
check(
  /moved or deleted/.test(read(path.join(mobile, 'src/components/ProgressNotesTab.tsx'))),
  'a broken link no longer says so, and shows a dead player instead',
);

// ---------------------------------------------------------------------------
// 4d. Fullscreen is ours, and it keeps the controls.
//
// The library's `fullscreen` prop on Android hands the surface to ExoPlayer's
// own dialog, which draws *its* built-in controls — so with controls={false} a
// reader got a fullscreen with no play button, no scrubber, no time and no
// volume, still in portrait. `fullscreenOrientation` is iOS-only.
// ---------------------------------------------------------------------------
check(
  !/fullscreen=\{/.test(player),
  "the player is back on react-native-video's own fullscreen, which on Android is a dialog " +
    'with ExoPlayer\'s controls — and this app turns those off, so it has none at all',
);
check(
  /<Modal/.test(player) && /supportedOrientations/.test(player),
  'fullscreen is not the app\'s own modal any more',
);
check(
  /OrbitScreen\?\.setLandscape/.test(player),
  'nothing turns the phone sideways, so fullscreen is a portrait letterbox',
);
check(
  /const transport = /.test(player) && (player.match(/transport\(/g) ?? []).length >= 2,
  'the transport is not shared between the note and fullscreen — two copies is how one of ' +
    'them ends up missing a button again',
);
check(
  /resumeAt\.current/.test(player),
  'nothing carries the position across the remount, so entering fullscreen restarts the video',
);
check(
  /onRequestClose=\{leaveFull\}/.test(player),
  'the back gesture no longer leaves fullscreen, so it closes the note instead',
);

// The size rule, from the other side.
const deps = JSON.parse(read(path.join(mobile, 'package.json'))).dependencies ?? {};
for (const heavy of Object.keys(deps)) {
  check(
    !/vlc|ffmpeg|libav/i.test(heavy),
    `${heavy} is a bundled media stack — tens of megabytes per ABI, on phones chosen for ` +
      'having no space, to decode files the phone can already decode',
  );
}

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
/*
 * No *manifest* permission. A URI grant is a different thing and the link path
 * legitimately takes one: `takePersistableUriPermission` is the reader handing
 * over one file they chose, not this app asking for their storage.
 */
check(
  !/Manifest\.permission|requestPermissions|READ_MEDIA|READ_EXTERNAL_STORAGE|INTERNET/.test(
    code(module_),
  ),
  'FilesModule asks for a runtime or manifest permission — ACTION_OPEN_DOCUMENT runs out of ' +
    'process and returns the one item chosen, so it needs none',
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
