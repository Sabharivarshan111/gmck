// The preview harness renders its own tree, and it drifts.
//
// `mobile/preview/main.tsx` is not `App.tsx`. It builds its own
// NavigationContainer so a screen can be opened directly by query string, and
// it therefore has its own copy of the list of components mounted at the app
// root. Anything added to one and not the other is simply ABSENT from every
// screenshot and every smoke run — and absent in the direction that looks like
// success, because the suite goes on passing.
//
// That is not hypothetical. `FirstRun` — the gate that asks a new reader which
// year they are in — was added to `App.tsx` and not here, and the smoke step
// written to prove the year is asked for failed on a component that was never
// rendered. CLAUDE.md has warned about this drift for months ("When you add a
// provider to App.tsx, add it to preview/main.tsx too"); a warning in prose is
// what this replaces.
//
//   node scripts/preview-parity-check.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const mobile = path.join(here, '..');
const read = p => readFileSync(p, 'utf8');

const app = read(path.join(mobile, 'App.tsx'));
const preview = read(path.join(mobile, 'preview', 'main.tsx'));

/**
 * Components App.tsx mounts as siblings of the navigator.
 *
 * Read off the JSX rather than listed here, because a list would be the third
 * copy of the same thing and would go stale the same way. Self-closing
 * PascalCase elements only: that is the shape every root-level overlay in this
 * app has, and it excludes the providers, which the preview deliberately
 * arranges differently (its own SafeAreaProvider metrics, its own navigation
 * state).
 */
const rooted = source => {
  const start = source.indexOf('<RootNavigator />');
  if (start < 0) {
    return null;
  }
  const end = source.indexOf('</NavigationContainer>', start);
  const block = source.slice(start, end < 0 ? source.length : end);
  return new Set([...block.matchAll(/<([A-Z][A-Za-z0-9]*)\s*\/>/g)].map(m => m[1]));
};

const failures = [];
const inApp = rooted(app);
const inPreview = rooted(preview);

if (!inApp) {
  failures.push('App.tsx no longer renders <RootNavigator /> — this check cannot find the root overlays');
} else if (!inPreview) {
  failures.push('preview/main.tsx no longer renders <RootNavigator />');
} else {
  for (const name of inApp) {
    if (name === 'RootNavigator' || name === 'StatusBar') {
      continue;
    }
    if (!inPreview.has(name)) {
      failures.push(
        `<${name} /> is mounted at the root of App.tsx but not in preview/main.tsx — ` +
          'it is invisible to every screenshot and every smoke step, and the suite ' +
          'will keep passing without it',
      );
    }
  }
  // The reverse is allowed and deliberate: the preview mounts fixtures and
  // debug screens the app has no business shipping. Only the app's own root
  // overlays are required to be present in both.
}

if (failures.length > 0) {
  console.error('preview parity check failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

const shared = [...(inApp ?? [])].filter(n => n !== 'RootNavigator' && n !== 'StatusBar');
console.log(`OK  ${shared.length} root overlay(s) mounted in both App.tsx and the preview: ${shared.join(', ')}`);
