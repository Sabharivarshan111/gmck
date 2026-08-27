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
import { readFileSync, readdirSync, existsSync } from 'node:fs';
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

if (failures.length > 0) {
  console.error('Kotlin override check failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error('\nThis is a Gradle compile error six minutes into a release build.');
  process.exit(1);
}

console.log(`OK  ${checked} override(s) match the React Native declarations they claim`);
