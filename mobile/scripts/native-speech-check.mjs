// The dictation module has to be reachable, or the microphone never appears.
//
// This app has already shipped a native module that did not exist. The Kotlin
// was correct, the package was registered, and `NativeModules.OrbitSound` was
// undefined on every device — because under the New Architecture the
// TurboModule manager only reads packages that are `BaseReactPackage` and
// declare `isTurboModule = true`. Nothing warns. There is no crash and no log
// line; the feature is simply absent, and the code that hides it when it is
// absent does its job perfectly.
//
// Speech has the same four requirements, plus two of its own that fail just as
// quietly:
//
//   RECORD_AUDIO       without it, every session ends in ERROR_INSUFFICIENT_
//                      PERMISSIONS regardless of what the runtime prompt said
//   <queries> for      Android 11 hid packages from each other. The recogniser
//   RecognitionService is a separate app, so without declaring the intent
//                      isRecognitionAvailable() is false on every device and
//                      the mic is hidden with nothing to say why
//
//   node scripts/native-speech-check.mjs
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const check = (ok, message) => {
  if (!ok) {
    failures.push(message);
  }
};
const read = file => fs.readFile(path.join(root, file), 'utf8').catch(() => null);

const pkg = JSON.parse((await read('package.json')) ?? '{}');
const specDir = pkg.codegenConfig?.jsSrcsDir ?? 'src/native';

// 1. A spec, resolved with get() so a missing module is not a crash.
const specPath = `${specDir}/NativeOrbitSpeech.ts`;
const spec = await read(specPath);
check(spec !== null, `${specPath} is missing — codegen has nothing to read`);
if (spec) {
  check(
    /TurboModuleRegistry\.get</.test(spec),
    'the spec uses getEnforcing — a build without the module would crash instead of hiding the mic',
  );
  for (const method of ['isAvailable', 'start', 'stop', 'cancel']) {
    check(new RegExp(`\\b${method}\\(`).test(spec), `the spec declares no ${method}()`);
  }
}

// 2. Kotlin extending the generated spec.
const moduleKt = await read(
  'android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd/SpeechModule.kt',
);
check(moduleKt !== null, 'SpeechModule.kt is missing');
if (moduleKt) {
  check(
    /:\s*NativeOrbitSpeechSpec\(/.test(moduleKt),
    'SpeechModule does not extend NativeOrbitSpeechSpec — it would not be a TurboModule',
  );
  // SpeechRecognizer throws if it is touched off the main looper, and React
  // Native calls TurboModule methods on the JS thread.
  check(
    /Looper\.getMainLooper\(\)/.test(moduleKt) && /main\.post/.test(moduleKt),
    'SpeechModule does not hop to the main looper — SpeechRecognizer throws off it',
  );
  check(
    /destroy\(\)/.test(moduleKt),
    'SpeechModule never destroys its recogniser — one is created per session and leaks',
  );
}

// 3. A BaseReactPackage declaring isTurboModule.
const packageKt = await read(
  'android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd/SpeechPackage.kt',
);
check(packageKt !== null, 'SpeechPackage.kt is missing');
if (packageKt) {
  check(
    /:\s*BaseReactPackage\(\)/.test(packageKt),
    'SpeechPackage is not a BaseReactPackage — the TurboModule manager never asks it for modules',
  );
  check(
    /isTurboModule\s*=\s*\*\/\s*true/.test(packageKt.replace(/\s+/g, ' ')) ||
      /true,\s*\)\s*\)\s*\}/.test(packageKt),
    'SpeechPackage does not declare isTurboModule = true',
  );
}

// 4. Registered in MainApplication.
const mainApp = await read(
  'android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd/MainApplication.kt',
);
check(
  mainApp !== null && /add\(SpeechPackage\(\)\)/.test(mainApp),
  'SpeechPackage is not added in MainApplication — nothing registers the module',
);

// 5. The manifest, both halves.
const manifest = await read('android/app/src/main/AndroidManifest.xml');
check(manifest !== null, 'AndroidManifest.xml is missing');
if (manifest) {
  check(
    /android\.permission\.RECORD_AUDIO/.test(manifest),
    'RECORD_AUDIO is not declared — every session fails with a permissions error',
  );
  check(
    /android\.speech\.RecognitionService/.test(manifest),
    'the manifest has no <queries> for RecognitionService — isRecognitionAvailable() is false on Android 11+',
  );
}

// 6. The JS side degrades rather than throwing, and the preview has a shim.
const lib = await read('src/lib/speech.ts');
check(lib !== null, 'src/lib/speech.ts is missing');
if (lib) {
  check(
    /OrbitSpeech \?\? undefined/.test(lib),
    'speech.ts does not fall back when the module is absent — the preview would throw',
  );
  check(
    /RECORD_AUDIO/.test(lib),
    'speech.ts never requests RECORD_AUDIO — the recogniser would reject every session',
  );
}
const viteConfig = await read('preview/vite.config.ts');
check(
  viteConfig !== null && /NativeOrbitSpeech/.test(viteConfig),
  'the preview has no alias for NativeOrbitSpeech — importing the real spec reaches for TurboModuleRegistry',
);

// 7. And the spec has to produce a schema — the part that would otherwise only
//    fail inside a Gradle build nobody runs locally.
const cli = path.join(
  root,
  'node_modules/@react-native/codegen/lib/cli/combine/combine-js-to-schema-cli.js',
);
if (await fs.stat(cli).then(() => true, () => false)) {
  const outFile = path.join(
    await fs.mkdtemp(path.join(os.tmpdir(), 'orbit-speech-codegen-')),
    'schema.json',
  );
  try {
    execFileSync('node', [cli, '--platform', 'android', outFile, specDir], { cwd: root });
    const schema = JSON.parse(await fs.readFile(outFile, 'utf8'));
    const moduleName = schema.modules?.NativeOrbitSpeech?.moduleName;
    check(
      moduleName === 'OrbitSpeech',
      `codegen read the spec as "${moduleName}", not "OrbitSpeech" — the Kotlin side would never be found`,
    );

  /*
   * The microphone-level emitter must survive codegen.
   *
   * `EventEmitter` is declared locally in the spec rather than imported,
   * because React Native's package exports block the deep import its own docs
   * use — tsc cannot resolve it, codegen does not care, and the two only agree
   * because of that local declaration. That is a fragile agreement held
   * together by a type name, so it is asserted here: without the emitter the
   * generated Kotlin has no emitOnRms, SpeechModule stops compiling, and the
   * first thing that finds out is a six-minute Gradle build.
   */
  const emitters = schema.modules?.NativeOrbitSpeech?.spec?.eventEmitters ?? [];
  const rms = emitters.find(e => e.name === 'onRms');
  check(
    rms !== undefined,
    'the spec no longer declares an onRms EventEmitter — the listening visualiser loses its audio input and goes back to being a decoration',
  );
  check(
    rms?.typeAnnotation?.typeAnnotation?.type === 'NumberTypeAnnotation',
    'onRms is not a number emitter — emitOnRms would be generated with the wrong signature',
  );
  check(
    /emitOnRms\(/.test(moduleKt ?? ''),
    'SpeechModule never calls emitOnRms — Android delivers the microphone level and it is being thrown away again',
  );
    const names = (schema.modules?.NativeOrbitSpeech?.spec?.methods ?? []).map(m => m.name);
    for (const method of ['isAvailable', 'start', 'stop', 'cancel']) {
      check(names.includes(method), `codegen did not find ${method}() on the spec`);
    }
  } catch (error) {
    check(false, `codegen could not parse the spec: ${String(error.message).split('\n')[0]}`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    process.stdout.write(`  FAIL  ${failure}\n`);
  }
  process.stdout.write(`\n${failures.length} problem(s) — the mic would be missing on device.\n`);
  process.exit(1);
}
process.stdout.write('OK  speech module is a TurboModule, registered, with its manifest entries\n');
