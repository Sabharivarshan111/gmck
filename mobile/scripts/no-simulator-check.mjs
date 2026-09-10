// The Patient Simulator is not in the native app yet, and that is deliberate.
//
// It arrived in `mobile/` through a merge from `main`, where the *web* app's
// `src/simulator/` is being actively built. The app's owner asked for it to be
// kept out of the Android app until they have finished with it — "i need to fix
// a lot, i will tell you when to implement" — so this is a hold, not a
// rejection, and the web copy on `main` is untouched.
//
// A hold that lives only in a commit message lasts one session. The next merge
// from `main` brings the screen back, nothing says it should not be there, and
// it ships. So the hold is a check.
//
// **Delete this file when the owner says the simulator may ship.** Do not
// weaken it in the meantime: half-wiring it in is how a screen ends up in a
// release nobody meant to publish.
//
//   node scripts/no-simulator-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Every file under these, recursively. The native app and its preview only. */
const ROOTS = ['src', 'preview', 'android'];

const OFFENDING = [
  // The screen itself, by name, however it is imported.
  /PatientSimulatorScreen/,
  // The card that opens it, and the prop that card is handed.
  /onPatientSimulator/,
  // The route, in any casing a navigator might use.
  /['"`]patient-simulator['"`]/i,
];

async function* walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'build' || entry.name === '.gradle') {
        continue;
      }
      yield* walk(full);
    } else if (/\.(tsx?|jsx?|kt|java)$/.test(entry.name)) {
      yield full;
    }
  }
}

const failures = [];
for (const dir of ROOTS) {
  for await (const file of walk(path.join(root, dir))) {
    const text = await fs.readFile(file, 'utf8');
    for (const pattern of OFFENDING) {
      if (pattern.test(text)) {
        failures.push(`${path.relative(root, file)} references the Patient Simulator (${pattern})`);
        break;
      }
    }
  }
}

if (failures.length > 0) {
  console.error(
    'The Patient Simulator is back in the native app, and it is on hold:\n',
  );
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error(
    '\nThe app owner asked for it to stay out of the Android app until they say\n' +
      'otherwise. It is almost certainly here from a merge with `main`, where the\n' +
      'web app is building it — leave that copy alone and take this one out.\n' +
      'When the hold is lifted, delete scripts/no-simulator-check.mjs.',
  );
  process.exit(1);
}

console.log('OK  the Patient Simulator is still out of the native app, as asked');
