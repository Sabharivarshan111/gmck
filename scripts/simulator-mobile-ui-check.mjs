import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(root, p), 'utf8');

const simulator = read('src/pages/Simulator.tsx');
const diagnostics = read('src/simulator/instruments/DiagnosticTools.tsx');
const ecg = read('src/simulator/instruments/Ecg12LeadCanvas.tsx');
const pocus = read('src/simulator/instruments/pocus/PocusCanvas.tsx');
const ward = read('src/simulator/controls/WardExamModal.tsx');
const tutorial = read('src/simulator/instruments/EcgIcuTutorialModal.tsx');
const toolbar = read('src/simulator/controls/DissectionToolbar.tsx');
const drawer = read('src/simulator/controls/OrganDetailDrawer.tsx');
const anatomy3d = read('src/simulator/view/AnatomicalBody3D.tsx');
const spreadControl = read('src/simulator/controls/AnatomySpreadControl.tsx');

const failures = [];
const fail = (message) => failures.push(message);

const requireText = (source, needle, label) => {
  if (!source.includes(needle)) fail(label);
};

const forbidText = (source, needle, label) => {
  if (source.includes(needle)) fail(label);
};

// The screenshot regression: the ECG must not force the old desktop-width
// canvas or put the control deck above the tracing on a phone.
forbidText(
  ecg,
  'min-w-[760px]',
  'ECG reintroduced the 760px desktop minimum width that caused horizontal overflow on phones.'
);
requireText(
  ecg,
  'order-2 md:order-1',
  'ECG mobile control deck is no longer ordered after the tracing.'
);
requireText(
  ecg,
  'order-1 md:order-2',
  'ECG tracing is no longer prioritized before controls on mobile.'
);
requireText(
  ecg,
  'overflow-x-auto no-scrollbar',
  'ECG wave chips must scroll horizontally instead of wrapping into a tall control block.'
);

// Diagnostic modules are true phone sheets, not a desktop modal card squeezed
// into a narrow viewport.
requireText(
  diagnostics,
  'h-[100dvh]',
  'Diagnostic tools lost their 100dvh mobile sheet.'
);
requireText(
  diagnostics,
  'pb-[calc(16px+env(safe-area-inset-bottom))]',
  'Diagnostic tools lost bottom safe-area padding.'
);
forbidText(
  diagnostics,
  'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4',
  'Diagnostic tools reverted to the old padded desktop modal shell on mobile.'
);

// Major visual tools must receive most of the phone viewport.
requireText(
  pocus,
  'h-[46dvh]',
  'POCUS lost its adaptive mobile viewport height.'
);
requireText(
  simulator,
  "mobileTab === 'interventions' ? 'block' : 'hidden lg:block'",
  'InterventionPanel is leaking underneath the 3D/telemetry mobile stages.'
);
requireText(
  simulator,
  "mobileTab === '3d' && explodeAmount <= 0.02 ? 'flex' : 'hidden'",
  'Deep Inspector is no longer scoped to assembled mobile 3D mode.'
);
requireText(
  simulator,
  "'max(360px, calc(100dvh - 292px))'",
  '3D anatomy stage lost its assembled-mode adaptive mobile height.'
);
requireText(
  simulator,
  "'max(360px, calc(100dvh - 180px))'",
  'Spread anatomy no longer reclaims vertical space for the mobile 3D stage.'
);
requireText(
  simulator,
  'data-testid="mobile-dissection-toolbar-shell"',
  'Spread anatomy no longer suppresses competing mobile controls.'
);
requireText(
  simulator,
  "style={{ display: explodeAmount > 0.02 ? 'none' : 'block' }}",
  'Spread anatomy lost its explicit mobile toolbar visibility rule.'
);

requireText(
  anatomy3d,
  'onChangeRegion?.(',
  'Regional camera controls must update the selected region, including during spread mode.'
);
requireText(
  anatomy3d,
  'portraitInventory ? 0.62 : 0.92',
  'Portrait exploded-inventory framing lost its bottom-dock compensation.'
);
requireText(
  anatomy3d,
  'portraitInventory ? fitDistance * 0.78 : fitDistance',
  'Portrait full-spread view lost its readable tighter-fit behavior.'
);

// Dense secondary surfaces must behave like sheets/decks instead of desktop
// cards with wrapped controls.
requireText(
  ward,
  'h-[100dvh]',
  'Bedside/PICCLED examination lost its full-height mobile sheet.'
);
requireText(
  ward,
  'overflow-x-auto no-scrollbar',
  'Bedside examination tabs must remain horizontally scrollable on phones.'
);
requireText(
  tutorial,
  'h-[100dvh]',
  'ECG/ICU tutorial lost its full-height mobile sheet.'
);
requireText(
  toolbar,
  'overflow-x-auto no-scrollbar',
  'Anatomy dissection controls must remain horizontally scrollable on phones.'
);
requireText(
  drawer,
  "isMobileExpanded ? 'h-[88dvh]' : 'h-[min(62dvh,540px)]'",
  'Organ detail drawer lost its dvh-based mobile bottom-sheet sizing.'
);

// Competitor-inspired anatomy exploration stays GPU-driven and mobile-safe:
// one bottom slider, per-source-mesh translation in the existing atlas texture,
// and a deliberately small clickable label pool rather than thousands of DOM nodes.
requireText(
  simulator,
  '<AnatomySpreadControl',
  'Simulator lost the Spread anatomy exploration control.'
);
requireText(
  spreadControl,
  'data-testid="anatomy-spread"',
  'Spread anatomy control lost its range input.'
);
requireText(
  anatomy3d,
  'buildExplodedInventoryTargets',
  '3D anatomy lost its real-mesh exploded inventory layout.'
);
requireText(
  anatomy3d,
  'transformed += state.xyz',
  'Atlas shader lost per-structure GPU translation.'
);
requireText(
  anatomy3d,
  'findNearestExplodedPart',
  'Exploded structures are no longer touch-selectable on mobile.'
);
requireText(
  anatomy3d,
  'anatomy-label-',
  'Clickable floating anatomy labels were removed.'
);

// Touch target floor for critical dismiss/navigation actions.
for (const [name, source] of [
  ['DiagnosticTools', diagnostics],
  ['WardExamModal', ward],
  ['EcgIcuTutorialModal', tutorial],
]) {
  if (!source.includes('min-h-[44px]') || !source.includes('min-w-[44px]')) {
    fail(`${name} is missing a 44px critical touch target.`);
  }
}

if (failures.length) {
  console.error(`\nORBIT mobile simulator UI check: ${failures.length} problem(s)\n`);
  for (const problem of failures) console.error(`  ✗ ${problem}`);
  process.exit(1);
}

console.log('\nORBIT mobile simulator UI check OK');
console.log('  ECG: tracing-first mobile order, horizontally scrolling wave controls, no 760px regression');
console.log('  Diagnostics/PICCLED/Tutorial: 100dvh mobile sheets with touch-safe controls');
console.log('  3D/POCUS: adaptive viewport heights, including expanded focused spread mode');
console.log('  Mobile tabs: anatomy, telemetry, and interventions stay mutually focused');
console.log('  Organ drawer/dissection controls: compact non-blocking mobile sheet and horizontal-control behavior preserved');
console.log('  Spread anatomy: focused mobile mode + GPU exploded inventory + touch selection + collision-safe labels preserved');
