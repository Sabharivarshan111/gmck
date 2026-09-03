// Every text input has to sit above the keyboard.
//
// `android:windowSoftInputMode="adjustResize"` stopped doing this. The app
// targets SDK 36, and from Android 15 edge-to-edge is enforced for anything
// targeting 35+: the window no longer shrinks when the IME appears, the app
// draws behind it, and adjustResize is inert. An input near the bottom of a
// screen sits *under* the keyboard, and you cannot see what you are typing.
//
// It was found on Ask AI, fixed on Ask AI, and left there. Eleven other inputs
// still had it a month later — the study-note editor, the calendar's event
// field, every search box, every sheet. Nobody re-checked, because the fix
// looked done.
//
// So: a file that renders a TextInput must either use KeyboardSafe itself, or
// name the ancestor that does. The allowlist is the point — it forces whoever
// adds an input to answer "what lifts this?" rather than assume something does.
//
//   node scripts/keyboard-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'src');

/**
 * Files whose inputs are lifted by an ancestor, and which one.
 *
 * Adding a name here is a claim that the ancestor wraps this component's
 * inputs. It is not a way to silence the check — if the ancestor changes, this
 * is the note that says what to re-verify.
 */
const LIFTED_BY_ANCESTOR = {
  'components/ProgressCalendarTab.tsx': 'ProgressScreen wraps its ScrollView in KeyboardSafe',
  'components/ProfileSheet.tsx': 'Sheet wraps its body in KeyboardSafe',
  'components/ColorPicker.tsx': 'Sheet (ThemeEditor is presented in one) wraps its body in KeyboardSafe',
  'components/ExamCountdownCard.tsx': 'ProgressScreen wraps its ScrollView in KeyboardSafe',
  'components/FilterField.tsx': 'rendered by BrowseNode/Flashcards screens, both KeyboardSafe',
  'components/NotesAiEditBox.tsx': 'NotesScreen wraps its ScrollView in KeyboardSafe',
  'components/PageRefSheet.tsx': 'Sheet wraps its body in KeyboardSafe',
};

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (/\.tsx?$/.test(entry.name)) {
      yield full;
    }
  }
}

const failures = [];
const unusedAllowances = new Set(Object.keys(LIFTED_BY_ANCESTOR));
let covered = 0;

for await (const file of walk(SRC)) {
  const body = await fs.readFile(file, 'utf8');
  // `<TextInput` only — a bare mention in a comment or a type import is not a
  // rendered input.
  if (!/<TextInput[\s/>]/.test(body)) {
    continue;
  }
  const rel = path.relative(SRC, file).split(path.sep).join('/');

  if (/KeyboardSafe/.test(body)) {
    covered += 1;
    continue;
  }
  if (LIFTED_BY_ANCESTOR[rel]) {
    unusedAllowances.delete(rel);
    covered += 1;
    continue;
  }
  failures.push(
    `${rel} renders a TextInput but neither uses KeyboardSafe nor is listed as ` +
      `lifted by an ancestor. On Android 15+ that input sits under the keyboard.`,
  );
}

// A stale allowance is a file that no longer has an input, or was renamed. It
// is not harmful, but it is a lie about the codebase, and the next person will
// trust it.
for (const stale of unusedAllowances) {
  failures.push(
    `${stale} is listed as lifted by an ancestor but renders no TextInput — ` +
      `remove the entry rather than leaving a note nobody can check.`,
  );
}

// KeyboardSafe is the only place that knows how. A second KeyboardAvoidingView
// is a second opinion, and the one that is wrong will not be this one.
for await (const file of walk(SRC)) {
  const rel = path.relative(SRC, file).split(path.sep).join('/');
  if (rel === 'components/KeyboardSafe.tsx') {
    continue;
  }
  const body = await fs.readFile(file, 'utf8');
  if (/<KeyboardAvoidingView/.test(body)) {
    failures.push(
      `${rel} uses KeyboardAvoidingView directly — use KeyboardSafe, which ` +
        `carries the behavior and the no-offset rule that took a month to find.`,
    );
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    process.stdout.write(`  FAIL  ${failure}\n`);
  }
  process.stdout.write(`\n${failures.length} input(s) can end up under the keyboard.\n`);
  process.exit(1);
}

process.stdout.write(
  `OK  ${covered} file(s) with text inputs, all lifted above the keyboard; one KeyboardAvoidingView in the codebase\n`,
);
