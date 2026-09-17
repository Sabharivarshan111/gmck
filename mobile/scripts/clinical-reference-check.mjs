#!/usr/bin/env node
/**
 * Guards the clinical proforma UI against the four defects it shipped with,
 * and the reference data against going hollow.
 *
 * None of this is reachable from the preview harness in a useful way: the
 * harness is react-native-web, so it cannot tell you that two adjacent touch
 * targets overlap on a phone, and it renders `colors.primary` as white on the
 * dark theme exactly as a device does — which is precisely how the white-on-
 * white bug survived review. These are source assertions for that reason.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8');

const failures = [];
const fail = (what, why) => failures.push(`${what}\n    ${why}`);
let checks = 0;
const ok = () => { checks += 1; };

/* ─────────────────────────── 1. no white ink on colors.primary ────────── */
{
  const files = [
    'src/components/ClinicalProformaModal.tsx',
    'src/components/BedsideChatDrawer.tsx',
    'src/components/GeneralExamReference.tsx',
  ];
  for (const f of files) {
    const src = read(f);
    const lines = src.split('\n');
    lines.forEach((line, i) => {
      if (!/#FFFFFF|#ffffff|'white'/.test(line)) return;
      /*
       * White IS right over a fixed black ground — a lightbox, a scrim badge —
       * and wrong everywhere else. Which of the two it is cannot be read off
       * the surrounding lines, because the background is usually declared in
       * the StyleSheet rather than inline. So the rule is an explicit opt-out:
       * mark the line `over-black: ok` and say what the black is. That is also
       * better documentation than anything this script could infer.
       */
      const window = lines.slice(Math.max(0, i - 2), i + 2).join('\n');
      if (!/over-black: ok/.test(window)) {
        fail(
          `${f}:${i + 1} hardcodes white ink with no justification`,
          `On the dark themes colors.primary IS white, so white-on-primary is invisible. Use colors.primaryText (or colors.onAccent on an accent fill). If this really does sit on a fixed black ground, add a "// over-black: ok — <what the black is>" comment.`,
        );
      }
    });
    ok();
  }
}

/* ────────────────── 2. the chat header's buttons are not nested ────────── */
{
  const src = read('src/components/BedsideChatDrawer.tsx');
  // The expand and reset buttons must be siblings of the title Touchable, not
  // children of it — a missed inner press otherwise becomes an outer press,
  // i.e. "expand" silently collapses the drawer.
  const header = src.slice(src.indexOf('<View style={styles.header}>'), src.indexOf('</View>', src.indexOf('styles.iconBtn')));
  const titleArea = src.indexOf('styles.headerTitleArea');
  const expandBtn = src.indexOf('onPress={onToggleExpanded}');
  const titleClose = src.indexOf('</Touchable>', titleArea);
  if (!(titleClose > 0 && expandBtn > titleClose)) {
    fail(
      'BedsideChatDrawer: the expand button is inside the header toggle',
      'Nested pressables mean a missed inner press becomes an outer press. Keep the icon buttons as siblings of the title Touchable.',
    );
  }
  if (!header) fail('BedsideChatDrawer: header block not found', 'The check needs styles.header to exist.');
  ok();
}

/* ──────────────── 3. adjacent icon buttons meet the 44dp minimum ───────── */
{
  const src = read('src/components/BedsideChatDrawer.tsx');
  const m = src.match(/iconBtn: \{([^}]*)\}/);
  if (!m) {
    fail('BedsideChatDrawer: styles.iconBtn missing', 'The header buttons need an explicit 44dp target.');
  } else {
    const w = /width:\s*(\d+)/.exec(m[1]);
    const h = /height:\s*(\d+)/.exec(m[1]);
    if (!w || !h || Number(w[1]) < 44 || Number(h[1]) < 44) {
      fail(
        'BedsideChatDrawer: header icon buttons are under 44dp',
        'They sit side by side. Under 44dp they need hit slop to be usable, and slop on adjacent targets overlaps — which is what made "expand" fire "reset".',
      );
    }
  }
  ok();
}

/* ─────── 4. the drawer moves by transform, never by animated height ────── */
{
  const src = read('src/components/BedsideChatDrawer.tsx');
  if (!/transform: \[\{ translateY: slide \}\]/.test(src)) {
    fail(
      'BedsideChatDrawer: the panel is not driven by translateY',
      'CLAUDE.md: layout properties are never animated. Height forces layout, paint and composite on the JS thread every frame.',
    );
  }
  if (/Animated\.(timing|spring)\(\s*\w*[Hh]eight/.test(src)) {
    fail('BedsideChatDrawer: an animated height snuck back in', 'Use a transform.');
  }
  // Every timing must name an easing — RN's default ease-in-out delays the
  // exact moment the user is watching.
  const timings = src.match(/Animated\.timing\(/g)?.length ?? 0;
  const easings = src.match(/easing: EASE\./g)?.length ?? 0;
  if (timings > easings) {
    fail(
      `BedsideChatDrawer: ${timings - easings} Animated.timing without an easing`,
      "CLAUDE.md: omitting `easing` is the bug, not the default. Name one from EASE.",
    );
  }
  ok();
}

/* ─────────────── 5. the reference is reachable above the search ────────── */
{
  const src = read('src/components/ClinicalProformaModal.tsx');
  const card = src.indexOf('styles.referenceCard');
  const search = src.indexOf('styles.searchBox,');
  if (card < 0) {
    fail('ClinicalProformaModal: the clinical reference entry card is gone', 'It is the only way into the general examination reference.');
  } else if (!(card < search)) {
    fail(
      'ClinicalProformaModal: the reference card is below the search bar',
      'It belongs above it — the general survey is common to every case in the list.',
    );
  }
  if (!/<GeneralExamReference/.test(src)) {
    fail('ClinicalProformaModal: GeneralExamReference is never rendered', 'The entry card would open nothing.');
  }
  ok();
}

/* ───────────────── 6. the reference data has not gone hollow ───────────── */
{
  const sign = read('src/lib/clinical/generalExamination.ts');
  const survey = read('src/lib/clinical/generalExamSurvey.ts');
  const labs = read('src/lib/clinical/labValues.ts');
  const scores = read('src/lib/clinical/scoringSystems.ts');

  const piccle = ['pallor', 'icterus', 'cyanosis', 'clubbing', 'lymphadenopathy', 'edema'];
  for (const id of piccle) {
    if (!sign.includes(`id: '${id}'`)) fail(`generalExamination: '${id}' is missing`, 'PICCLE is six signs.');
  }
  // Every sign carries the technique, not just the findings — that is the
  // whole reason this module exists beside the case sheets.
  const mnemonicCount = (sign.match(/mnemonics: \[/g) ?? []).length;
  if (mnemonicCount < 6) {
    fail(`generalExamination: only ${mnemonicCount} of 6 signs carry a mnemonic`, 'Each PICCLE sign has one.');
  }
  // A mnemonic without its caveat teaches the gap as if it were the whole.
  const words = (sign.match(/word: '/g) ?? []).length;
  const caveats = (sign.match(/caveat:/g) ?? []).length;
  if (caveats < words) {
    fail(
      `generalExamination: ${words - caveats} mnemonic(s) with no caveat`,
      'Every one of these mnemonics leaves something out; say what.',
    );
  }
  if (!/central/i.test(sign) || !/peripheral/i.test(sign)) {
    fail('generalExamination: the central vs peripheral cyanosis comparison is gone', 'It is the question that sign is asked about.');
  }
  if (!survey.includes("id: 'vitals'") || !survey.includes("id: 'jvp'")) {
    fail('generalExamSurvey: vitals or JVP missing', 'The survey is what PICCLE omits.');
  }

  const panels = (labs.match(/^  \{\n    id: '/gm) ?? []).length;
  if (panels < 10) fail(`labValues: only ${panels} panels`, 'Expected at least ten.');
  // A range with no caveat is quoted as if it were a law of nature.
  const panelIds = (labs.match(/\n    id: '/g) ?? []).length;
  const panelCaveats = (labs.match(/\n    caveat:/g) ?? []).length;
  if (panelCaveats < panelIds) {
    fail(`labValues: ${panelIds - panelCaveats} panel(s) with no caveat`, 'Reference ranges are conditional; say on what.');
  }

  const scoreCount = (scores.match(/\n    id: '/g) ?? []).length;
  if (scoreCount < 20) fail(`scoringSystems: only ${scoreCount} scores`, 'Expected at least twenty.');
  const changes = (scores.match(/whatItChanges:/g) ?? []).length;
  if (changes < scoreCount) {
    fail(
      `scoringSystems: ${scoreCount - changes} score(s) do not say what they change`,
      'A score that changes no decision is a number.',
    );
  }
  ok();
}

/* ──────────────── 7. every proforma diagram path is a real file ────────── */
{
  const src = read('src/lib/clinical/../clinicalProformas.ts');
  const paths = [...src.matchAll(/diagramPath: '([^']+)'/g)].map(m => m[1]);
  // The bucket cannot be reached from a sandbox, so this is a shape check: a
  // path must name one of the folders that exists. `pediatrics/` does not.
  const folders = ['clinical', 'anatomy', 'pathology', 'physiology', 'biochemistry',
                   'microbiology', 'pharmacology', 'community', 'forensic', 'ent',
                   'ophthalmology', 'orthopaedics', 'references'];
  for (const p of paths) {
    const folder = p.replace(/^\/?diagrams\//, '').split('/')[0];
    if (!folders.includes(folder)) {
      fail(
        `clinicalProformas: diagramPath '${p}' names folder '${folder}'`,
        `The diagrams bucket has no such folder. It has: ${folders.join(', ')}.`,
      );
    }
  }
  ok();
}

if (failures.length) {
  console.error(`\ncheck:clinical-reference — ${failures.length} problem(s):\n`);
  for (const f of failures) console.error(`  ✗ ${f}\n`);
  process.exit(1);
}
console.log(`check:clinical-reference — ${checks} groups passed.`);
