// Guards the wiring that makes sound audible at all.
//
// The first version of the sound module shipped completely silent on every
// device, and nothing in the app said so. It was registered the way native
// modules were registered before the New Architecture — a plain ReactPackage
// returning it from createNativeModules — and under the New Architecture the
// TurboModule manager only reads packages of that shape when the
// `useTurboModuleInterop` feature flag is on. That flag is `false` in every
// stable React Native release, so `NativeModules.OrbitSound` was always
// undefined, `soundAvailable` was always false, and Settings hid the sound
// switches rather than showing ones that did nothing. Correct-looking code,
// no error, no sound.
//
// It cannot be caught by tsc, eslint, or the preview harness — the harness is
// react-native-web, where the module is legitimately absent. So the wiring is
// asserted here instead, along with the codegen spec actually parsing.
//
//   node scripts/native-sound-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import os from 'node:os';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFile(path.join(root, file), 'utf8');

/**
 * The same file with its comments removed.
 *
 * The negative checks below are "this file must not mention X", and every one
 * of these files explains in a comment *why* it must not — which is exactly
 * the string being searched for. Reading the prose as if it were code makes
 * the check fail on the very files that got it right.
 */
const code = text =>
  text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');

const failures = [];
const check = (ok, message) => {
  if (!ok) {
    failures.push(message);
  }
};

const pkg = JSON.parse(await read('package.json'));
const codegen = pkg.codegenConfig;
check(codegen !== undefined, 'package.json has no codegenConfig — the spec is never generated');
check(codegen?.type === 'modules', `codegenConfig.type is ${codegen?.type}, expected "modules"`);

const specDir = codegen?.jsSrcsDir ?? 'src/native';
const specPath = path.join(specDir, 'NativeOrbitSound.ts');
const spec = await read(specPath).catch(() => null);
check(spec !== null, `${specPath} is missing — codegen has nothing to read`);
check(
  spec?.includes("TurboModuleRegistry.get<Spec>('OrbitSound')") === true,
  'the spec does not resolve OrbitSound through TurboModuleRegistry',
);
check(
  spec !== null && !code(spec).includes('getEnforcing'),
  'the spec uses getEnforcing — a missing sound module would then crash the app',
);

// The JS side must not reach for NativeModules: that is the lookup that
// silently found nothing.
const sound = await read('src/lib/sound.ts');
check(
  !code(sound).includes('NativeModules'),
  'src/lib/sound.ts still reads NativeModules, which is empty under the New Architecture',
);
check(
  sound.includes("from '@/native/NativeOrbitSound'"),
  'src/lib/sound.ts does not import the TurboModule spec',
);

const kotlin_dir = 'android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd';
const module = await read(`${kotlin_dir}/SoundModule.kt`);
check(
  module.includes('NativeOrbitSoundSpec(reactContext)'),
  'SoundModule does not extend the generated NativeOrbitSoundSpec',
);
check(
  module.includes('override fun play('),
  'SoundModule does not override the spec\'s play()',
);

const pack = await read(`${kotlin_dir}/SoundPackage.kt`);
check(
  pack.includes('BaseReactPackage()'),
  'SoundPackage is not a BaseReactPackage — the TurboModule manager will never ask it for anything',
);
check(
  !code(pack).includes('createNativeModules'),
  'SoundPackage still registers through createNativeModules, which the New Architecture ignores',
);
check(
  /isTurboModule = \*\/ true/.test(pack) || /true,\s*\)/.test(pack),
  'SoundPackage does not declare the module as a TurboModule',
);

const application = await read(`${kotlin_dir}/MainApplication.kt`);
check(application.includes('SoundPackage()'), 'MainApplication does not add SoundPackage');

// The clips have to be in the APK, not merely on the author's disk: the RN
// template's .gitignore excludes res/raw, and they were left untracked once
// already.
const tracked = execFileSync('git', ['ls-files', 'android/app/src/main/res/raw'], {
  cwd: root,
  encoding: 'utf8',
});
for (const clip of ['tap.wav', 'chime.wav']) {
  check(tracked.includes(clip), `${clip} is not tracked by git — it will not be in the APK`);
}

// The four places that list the clips must agree. A preset named in Settings
// but not loaded in Kotlin is a menu entry that plays nothing, and there is no
// error anywhere — SoundModule returns early on an unknown name, exactly as it
// does for a clip that failed to decode.
const generator = await read('scripts/make-sounds.py');
const kotlin = await read(`${kotlin_dir}/SoundModule.kt`);
const settingsSrc = await read('src/lib/settings.ts');
if (generator && kotlin && settingsSrc) {
  const generated = [...generator.matchAll(/'([a-z_]+)\.wav':/g)].map(match => match[1]);
  check(generated.length >= 2, 'make-sounds.py renders fewer than two clips');
  for (const clip of generated) {
    check(
      kotlin.includes(`R.raw.${clip}`),
      `${clip}.wav is generated but SoundModule never loads R.raw.${clip} — choosing it would be silent`,
    );
    check(
      tracked.includes(`${clip}.wav`),
      `${clip}.wav is generated but not tracked by git — it will not be in the APK`,
    );
  }
  const listed = [...settingsSrc.matchAll(/id: '([a-z_]+)'/g)].map(match => match[1]);
  for (const preset of listed) {
    check(
      generated.includes(preset),
      `Settings offers the preset "${preset}", which make-sounds.py does not produce`,
    );
  }
  check(listed.length > 0, 'settings.ts lists no sound presets');
}

// And the spec has to actually produce a schema. This is the part that would
// otherwise only fail inside a Gradle build nobody runs locally.
const cli = path.join(
  root,
  'node_modules/@react-native/codegen/lib/cli/combine/combine-js-to-schema-cli.js',
);
if (await fs.stat(cli).then(() => true, () => false)) {
  const outFile = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'orbit-codegen-')), 'schema.json');
  try {
    execFileSync('node', [cli, '--platform', 'android', outFile, specDir], { cwd: root });
    const schema = JSON.parse(await fs.readFile(outFile, 'utf8'));
    const moduleName = schema.modules?.NativeOrbitSound?.moduleName;
    check(
      moduleName === 'OrbitSound',
      `codegen read the spec as "${moduleName}", not "OrbitSound" — the Kotlin side would never be found`,
    );
    const method = schema.modules?.NativeOrbitSound?.spec?.methods?.[0];
    check(method?.name === 'play', 'codegen did not find a play() method on the spec');
  } catch (error) {
    check(false, `codegen could not parse the spec: ${String(error.message).split('\n')[0]}`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    process.stdout.write(`  FAIL  ${failure}\n`);
  }
  process.stdout.write(`\n${failures.length} problem(s) — sound would be silent on device.\n`);
  process.exit(1);
}

process.stdout.write('OK  sound module is a TurboModule, registered, with its clips committed\n');
