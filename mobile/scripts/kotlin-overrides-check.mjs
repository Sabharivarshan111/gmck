// Kotlin has no local compiler here. This is the nearest thing.
//
// A wrong override signature in this app's Kotlin is invisible to everything
// that runs in this sandbox — tsc, eslint, the checks, the preview harness and
// the release bundle are all green — and surfaces six minutes into a Gradle
// step on CI, as a failed release. It has now cost two of them:
//
//   FilesModule.kt: `override fun onActivityResult(activity: Activity?, …)`
//     → "'onActivityResult' overrides nothing". BaseActivityEventListener
//       declares `activity` non-null, and a nullable parameter is a different
//       signature rather than a looser one.
//   NotifyModule.kt: the `currentActivity` property instead of
//     `getCurrentActivity()`, which Kotlin does not synthesise through the
//     generated spec.
//
// React Native ships its Android sources inside node_modules, so the real
// declarations are right there to read. Every `override fun` in this app's own
// Kotlin is matched against the base class it claims to come from, and a name
// that exists with a different parameter list is the failure worth naming.
//
//   node scripts/kotlin-overrides-check.mjs
import { readFileSync, readdirSync, existsSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const mobile = path.join(here, '..');
const appKotlin = path.join(mobile, 'android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd');
const rnJava = path.join(mobile, 'node_modules/react-native/ReactAndroid/src/main/java');

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

if (!existsSync(rnJava)) {
  console.log('SKIP  react-native Android sources are not installed');
  process.exit(0);
}

/** Every RN class source, by simple class name. */
const rnSources = new Map();
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name.endsWith('.kt') || entry.name.endsWith('.java')) {
      rnSources.set(entry.name.replace(/\.(kt|java)$/, ''), full);
    }
  }
})(rnJava);

/**
 * The parameter *types* of a function declaration, normalised.
 *
 * Nullability is kept — `Activity` and `Activity?` are what this exists to tell
 * apart. Names are dropped: they may differ between an override and its base
 * without changing anything.
 */
function paramTypes(signature) {
  const inner = signature.slice(signature.indexOf('(') + 1, signature.lastIndexOf(')'));
  if (!inner.trim()) return [];
  const parts = [];
  let depth = 0;
  let current = '';
  for (const ch of inner) {
    if (ch === '<' || ch === '(') depth++;
    if (ch === '>' || ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current);
  return parts
    .map(part => part.split(':').slice(1).join(':').trim())
    .map(type => type.split('=')[0].trim())
    .filter(Boolean);
}

/** Balanced-paren slice starting at the '(' after `fun name`. */
function declarationAt(source, index) {
  const open = source.indexOf('(', index);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '(') depth++;
    else if (source[i] === ')') {
      depth--;
      if (depth === 0) return source.slice(index, i + 1);
    }
  }
  return null;
}

function functionsNamed(source, name) {
  const found = [];
  const pattern = new RegExp(`fun\\s+${name}\\s*\\(`, 'g');
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const declaration = declarationAt(source, match.index);
    if (declaration) found.push(declaration);
  }
  return found;
}

let checked = 0;
for (const file of readdirSync(appKotlin).filter(f => f.endsWith('.kt'))) {
  const source = readFileSync(path.join(appKotlin, file), 'utf8');

  // Which RN types this file extends or implements. Generated specs
  // (Native…Spec) are produced by codegen at build time and are not on disk,
  // so they are out of reach here — check:native-sound and check:reminder
  // cover those by parsing the TypeScript spec through the real codegen.
  const bases = new Set();
  for (const match of source.matchAll(/(?::|,)\s*([A-Z][A-Za-z0-9]*)\s*\(/g)) {
    bases.add(match[1]);
  }
  for (const match of source.matchAll(/object\s*:\s*([A-Z][A-Za-z0-9]*)\s*\(/g)) {
    bases.add(match[1]);
  }

  for (const overrideMatch of source.matchAll(/override\s+fun\s+([A-Za-z0-9_]+)\s*\(/g)) {
    const name = overrideMatch[1];
    const mine = declarationAt(source, overrideMatch.index + 'override '.length);
    if (!mine) continue;
    const mineTypes = paramTypes(mine);

    for (const base of bases) {
      const basePath = rnSources.get(base);
      if (!basePath) continue;
      const baseSource = readFileSync(basePath, 'utf8');
      const candidates = functionsNamed(baseSource, name);
      if (candidates.length === 0) continue;

      checked += 1;
      const shapes = candidates.map(paramTypes);
      const matches = shapes.some(
        shape =>
          shape.length === mineTypes.length &&
          shape.every((type, i) => type === mineTypes[i]),
      );
      check(
        matches,
        `${file}: override fun ${name}(${mineTypes.join(', ')}) matches nothing on ${base}. ` +
          `It declares: ${shapes.map(s => `${name}(${s.join(', ')})`).join(' | ')}`,
      );
    }
  }
}


/*
 * The generated TurboModule specs, which this script could not see before.
 *
 * The comment above says generated specs "are produced by codegen at build time
 * and are not on disk, so they are out of reach here". They are not out of
 * reach — the codegen CLI is in node_modules and runs in a second. So the one
 * class of Kotlin error this check could not catch is the one it now catches
 * first: an `override fun` whose parameters do not match the abstract method
 * codegen wrote, which is a compile error fourteen minutes into a Gradle step
 * and invisible everywhere else.
 *
 * The mapping is codegen's own, from
 * ReactNativeCodegen's Kotlin generator:
 *
 *   string            -> String            boolean -> Boolean
 *   number / double   -> Double            int32   -> Int
 *   a Promise return  -> a trailing `promise: Promise`, returning Unit
 *   void return       -> Unit
 */
const codegenCli = path.join(
  mobile,
  'node_modules/@react-native/codegen/lib/cli/combine/combine-js-to-schema-cli.js',
);
let specsChecked = 0;
if (existsSync(codegenCli)) {
  const outFile = path.join(
    mkdtempSync(path.join(tmpdir(), 'orbit-specs-')),
    'schema.json',
  );
  try {
    execFileSync('node', [codegenCli, '--platform', 'android', outFile, 'src/native'], {
      cwd: mobile,
      stdio: 'pipe',
    });
    const schema = JSON.parse(readFileSync(outFile, 'utf8'));

    /** One codegen type as the Kotlin generator writes it. */
    const kotlinType = annotation => {
      switch (annotation?.type) {
        case 'StringTypeAnnotation':
          return 'String';
        case 'BooleanTypeAnnotation':
          return 'Boolean';
        case 'Int32TypeAnnotation':
          return 'Int';
        case 'NumberTypeAnnotation':
        case 'DoubleTypeAnnotation':
        case 'FloatTypeAnnotation':
          return 'Double';
        default:
          // Objects, arrays and callbacks map to types this check does not try
          // to name. Skipping one method is right; guessing at it would report
          // a mismatch that is not there.
          return null;
      }
    };

    for (const [specName, module] of Object.entries(schema.modules ?? {})) {
      // NativeOrbitSound -> OrbitSound -> SoundModule.kt
      const bare = specName.replace(/^Native/, '');
      const kotlinName = `${bare.replace(/^Orbit/, '')}Module.kt`;
      const kotlinPath = path.join(appKotlin, kotlinName);
      if (!existsSync(kotlinPath)) {
        continue;
      }
      const source = readFileSync(kotlinPath, 'utf8');
      check(
        source.includes(`${specName}Spec(`),
        `${kotlinName} does not extend the generated ${specName}Spec, so none of its methods are the ones codegen declared`,
      );

      for (const method of module.spec?.methods ?? []) {
        const params = method.typeAnnotation?.params ?? [];
        const expected = params.map(param => kotlinType(param.typeAnnotation));
        if (expected.some(type => type === null)) {
          continue;
        }
        const returns = method.typeAnnotation?.returnTypeAnnotation?.type;
        if (returns === 'PromiseTypeAnnotation') {
          expected.push('Promise');
        }

        const overrides = functionsNamed(source, method.name).filter(declaration =>
          /(^|\s)override\s/.test(
            source.slice(Math.max(0, source.indexOf(declaration) - 40), source.indexOf(declaration)),
          ),
        );
        if (overrides.length === 0) {
          check(
            false,
            `${kotlinName} never overrides ${method.name}(), which ${specName}Spec declares abstract`,
          );
          continue;
        }
        specsChecked += 1;
        const shapes = overrides.map(paramTypes);
        check(
          shapes.some(
            shape =>
              shape.length === expected.length &&
              shape.every((type, i) => type === expected[i]),
          ),
          `${kotlinName}: override fun ${method.name}(${shapes[0].join(', ')}) does not match ` +
            `the generated ${specName}Spec, which declares ${method.name}(${expected.join(', ')})`,
        );
      }
    }
  } catch (error) {
    check(false, `codegen could not read the native specs: ${String(error.message).split('\n')[0]}`);
  }
}

/*
 * A block comment that closes itself.
 *
 * `*` followed by `/` ends a block comment wherever it appears, including in
 * the middle of a sentence. Writing the MIME wildcard `*` `/` `*` into a
 * comment about it therefore ended the comment on its own first line and left
 * the rest of the paragraph to be parsed as Kotlin — forty-one errors, all of
 * them "Unresolved reference 'can'", "'relied'", "'derives'", because the
 * compiler was reading English prose as code.
 *
 * Nothing in this sandbox can compile Kotlin, so this class of bug costs a
 * fourteen-minute Gradle step to discover.
 *
 * The rule has to be narrow, because the obvious version is wrong: this
 * codebase is full of `/* isTurboModule = *``/ true,` — a block comment used
 * as an argument label, which closes mid-line on purpose and is correct
 * Kotlin. What separates the two is that the label idiom opens and closes on
 * **one line**. A comment that ran over several lines and then ends in the
 * middle of one is prose that stopped being prose.
 */
let commentsChecked = 0;
for (const name of readdirSync(appKotlin).filter(f => f.endsWith('.kt'))) {
  const text = readFileSync(path.join(appKotlin, name), 'utf8');
  const lines = text.split('\n');
  let inBlock = false;
  /** The line the open block comment started on. */
  let openedAt = -1;
  lines.forEach((line, index) => {
    // Strings can hold the pair legitimately — `type = "*/*"` is the very
    // thing that has to keep working — so only comment bodies are examined.
    let at = 0;
    while (at < line.length) {
      if (!inBlock) {
        const open = line.indexOf('/*', at);
        const lineComment = line.indexOf('//', at);
        const quote = line.indexOf('"', at);
        if (open < 0 || (lineComment >= 0 && lineComment < open) || (quote >= 0 && quote < open)) {
          break;
        }
        inBlock = true;
        openedAt = index;
        at = open + 2;
        continue;
      }
      const close = line.indexOf('*/', at);
      if (close < 0) {
        break;
      }
      inBlock = false;
      commentsChecked += 1;
      const after = line.slice(close + 2).trim();
      // A one-line `/* label = */ value` is the argument-label idiom and is
      // fine. Only a comment that spanned lines and then stopped mid-line is
      // prose being compiled.
      if (after.length > 0 && openedAt !== index) {
        check(
          false,
          `${name}:${index + 1}: a block comment ends mid-line, and ` +
            `everything after it — ${JSON.stringify(after.slice(0, 48))} — is compiled as code. ` +
            'Write it with // line comments instead.',
        );
      }
      at = close + 2;
    }
  });
}

if (failures.length > 0) {
  console.error('Kotlin override check failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error('\nThis is a Gradle compile error six minutes into a release build.');
  process.exit(1);
}

console.log(
  `OK  ${checked} override(s) match the React Native declarations they claim, ` +
    `${specsChecked} match the generated TurboModule specs, ` +
    `${commentsChecked} block comment(s) end where they should`,
);
