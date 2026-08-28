// A full-screen page must step around the status bar itself.
//
// Android 15 forces edge-to-edge on `targetSdk 35+`: the app is drawn behind
// the status bar and the gesture bar, and nothing insets it for you. Every
// screen reached through the navigator is padded by `SafeAreaView` up in the
// navigator — but a `<Modal>` is a *new window*, outside that tree, so a page
// presented as one starts at pixel zero with the clock and the battery drawn
// over the top of it.
//
// That is what happened to the drawing canvas: the title and the **Keep**
// button — the one control that finishes a drawing — sat underneath the system
// clock. It is invisible in the preview harness, which is a browser with no
// status bar, and invisible in a diff, because the missing thing is a line
// that was never written.
//
// So: any component that presents an *opaque* full-screen Modal has to read
// `useSafeAreaInsets` and apply `insets.top`. Transparent modals are exempt —
// a dialog, a menu or a sheet floats over the page rather than replacing it,
// and centres or bottom-anchors its own content.
//
//   node scripts/edge-to-edge-check.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

/** Source with comments and strings' contents removed, so prose cannot pass. */
function code(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.name.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

/** Find the JSX a `<Modal …>` wraps, so a page can be checked where it lives. */
function modalRegions(source) {
  const out = [];
  const open = /<Modal\b([\s\S]*?)>/g;
  let match;
  while ((match = open.exec(source)) !== null) {
    const close = source.indexOf('</Modal>', open.lastIndex);
    out.push({ props: match[1], body: source.slice(open.lastIndex, close === -1 ? undefined : close) });
  }
  return out;
}

const sources = new Map();
for (const file of walk(path.join(root, 'src'))) {
  sources.set(file, code(fs.readFileSync(file, 'utf8')));
}

/** `<DrawCanvas …>` -> src/components/DrawCanvas.tsx, where it exists. */
function fileFor(component) {
  for (const folder of ['components', 'screens']) {
    const candidate = path.join(root, 'src', folder, `${component}.tsx`);
    if (sources.has(candidate)) {
      return candidate;
    }
  }
  return null;
}

for (const [file, source] of sources) {
  const name = path.relative(root, file);
  // A guessed status-bar height is the same bug with a number in it.
  const guessed = source.match(/paddingTop:\s*(3[2-9]|[4-9]\d|1\d\d)\b/);
  if (guessed && /<Modal\b/.test(source)) {
    failures.push(
      `${name} pads its top by a hardcoded ${guessed[1]} — the status bar is not a constant`,
    );
  }

  for (const region of modalRegions(source)) {
    // Transparent modals are exempt: a dialog, a menu or a sheet floats over
    // the page rather than replacing it, and places its own content.
    if (/\btransparent\b/.test(region.props)) {
      continue;
    }
    // A player that goes fullscreen landscape hides the bar instead, which is
    // the other correct answer.
    if (/StatusBar\s+hidden/.test(region.body)) {
      continue;
    }
    // The page may inset itself here…
    if (/insets\.top/.test(region.body)) {
      continue;
    }
    // …or be a component that insets itself, which is where the drawing
    // canvas hid: the file holding the Modal padded its *other* pages, so a
    // whole-file check passed while the canvas sat under the clock.
    const children = [...region.body.matchAll(/<([A-Z]\w*)/g)].map(hit => hit[1]);
    const inset = children.some(child => {
      const childFile = fileFor(child);
      return childFile && /insets\.top/.test(sources.get(childFile));
    });
    if (!inset) {
      const named = children.length > 0 ? ` (renders ${[...new Set(children)].join(', ')})` : '';
      failures.push(`${name} presents a full-screen Modal that never applies insets.top${named}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Edge-to-edge check failed:\n');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  console.error('\nA full-screen Modal is its own window: pad it by insets.top.');
  process.exit(1);
}

console.log('OK  every full-screen page steps around the status bar');
