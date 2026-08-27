// One account, one level — whichever app is open.
//
// The storage keys are deliberately shared with the web app so a reader with
// both installed sees one state (CLAUDE.md, "Storage keys are shared with the
// web app"). XP is the number that rule matters most for, and it has already
// drifted once: the web levels every 50 questions (`floor(xp / 50) + 1` in
// src/lib/rewards.ts) while the native card levelled off the *badge*
// thresholds, so 60 XP was level 2 in a browser and level 3 on the phone.
//
// Nothing else could catch that. tsc, eslint and the preview harness are all
// happy with two correct-looking ladders, and the two screens are in different
// apps so no test ever renders them side by side. So this reads the numbers out
// of both and refuses to let them disagree:
//
//   node scripts/xp-check.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ts from 'typescript';

const here = path.dirname(fileURLToPath(import.meta.url));
const mobile = path.join(here, '..');
const web = path.join(mobile, '..', 'src');

const read = p => readFileSync(p, 'utf8');

/**
 * Source with its comments removed.
 *
 * Every assertion below is about what the code *does*, and a comment
 * explaining a bug names the bug — the note about the old `rows.slice(0, 10)`
 * matched the check written to forbid it. Strings are left alone; none of
 * these patterns can appear in one.
 */
const code = source =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

// ---------------------------------------------------------------------------
// The web app is the reference. Read its numbers rather than restating them:
// a copy of a constant is a copy that goes stale.
// ---------------------------------------------------------------------------
const rewards = read(path.join(web, 'lib', 'rewards.ts'));

const webPerLevel = rewards.match(/Math\.floor\(\s*xp\s*\/\s*(\d+)\s*\)\s*\+\s*1/);
check(webPerLevel !== null, 'could not find the web app\'s level formula in src/lib/rewards.ts');
const XP_PER_LEVEL = webPerLevel ? Number(webPerLevel[1]) : null;

const webBadges = [...rewards.matchAll(/kind:\s*"xp",\s*threshold:\s*(\d+)/g)].map(m =>
  Number(m[1]),
);
check(webBadges.length >= 4, `expected the web app to define XP badges, found ${webBadges.length}`);

// ---------------------------------------------------------------------------
// 1. The native level ladder is the web's ladder, and there is only one of it.
// ---------------------------------------------------------------------------
const progressScreen = read(path.join(mobile, 'src', 'screens', 'ProgressScreen.tsx'));
const xpLib = read(path.join(mobile, 'src', 'lib', 'xp.ts'));

const nativePerLevel = xpLib.match(/export const XP_PER_LEVEL = (\d+);/);
check(nativePerLevel !== null, 'src/lib/xp.ts no longer declares XP_PER_LEVEL');
if (nativePerLevel && XP_PER_LEVEL !== null) {
  check(
    Number(nativePerLevel[1]) === XP_PER_LEVEL,
    `level band is ${nativePerLevel[1]} XP on the phone and ${XP_PER_LEVEL} on the web — ` +
      'the same account would show two different levels',
  );
}

check(
  /Math\.floor\(xp \/ XP_PER_LEVEL\) \+ 1/.test(xpLib),
  'levelFor no longer computes floor(xp / XP_PER_LEVEL) + 1, which is the web app\'s formula',
);

const nativeMilestones = [...xpLib.matchAll(/\{ label: '[^']+', xp: (\d+), medal:/g)].map(m =>
  Number(m[1]),
);
check(
  JSON.stringify(nativeMilestones) === JSON.stringify(webBadges),
  `XP milestones differ: phone ${JSON.stringify(nativeMilestones)} vs web ${JSON.stringify(webBadges)}`,
);

// One copy, not three. The ladder lived in ProgressScreen, the badges beside
// it, and a third set of thresholds in the toast — which is how the phone and
// the browser came to disagree in the first place.
for (const [name, source] of [
  ['ProgressScreen.tsx', progressScreen],
  ['XpToast.tsx', read(path.join(mobile, 'src', 'components', 'XpToast.tsx'))],
]) {
  check(
    /from '@\/lib\/xp'/.test(source),
    `${name} does not read the XP model from @/lib/xp — a second copy is how this drifted`,
  );
  check(
    !/const XP_PER_LEVEL = \d+/.test(code(source)),
    `${name} declares its own XP_PER_LEVEL again`,
  );
}

// The toast counts the same questions the card does. Counting every question
// ever ticked instead would announce "Bronze Scholar unlocked" over a card
// still showing that badge locked, for anyone who has browsed another year.
check(
  /yearXp\(/.test(read(path.join(mobile, 'src', 'components', 'XpToast.tsx'))),
  'the toast no longer counts year XP, so it can disagree with the card it is announcing',
);

// ---------------------------------------------------------------------------
// 2. An earned badge has to *look* earned.
//
// The four tiles under the bar were a hairline border on nothing with the
// number in textMuted, and only the trophy icon changed colour — so on the
// black theme an earned badge and an unearned one were the same dim grey
// rectangle. The reader's own words were "i cant see anything i think it's
// fake". A reward you cannot tell you have won is not a reward.
// ---------------------------------------------------------------------------
const badgeTiles = code(progressScreen).slice(
  code(progressScreen).indexOf('styles.badgeRow'),
  code(progressScreen).indexOf('<Leaderboard'),
);
check(
  /const earned = xp >= milestone;/.test(badgeTiles),
  'the badge tiles no longer distinguish earned from unearned',
);
check(
  /backgroundColor: colors\.accent/.test(badgeTiles),
  'an earned badge tile has no fill — a border on the page background is what was unreadable',
);
check(
  /onColor\(colors\.accent\)/.test(badgeTiles),
  'badge ink is not computed from the accent — hardcoded white is unreadable on amber and cyan',
);
check(
  !/color: colors\.textMuted \}\]}>\s*\{milestone\}/.test(badgeTiles),
  'the badge number is back to textMuted, which is the grey that could not be read',
);

// ---------------------------------------------------------------------------
// 3. The leaderboard shows everyone it fetched.
//
// It asked for 50 rows and rendered `rows.slice(0, 10)`, so anyone ranked
// eleventh or lower could not find themselves on a board they were on — while
// the web app scrolled all 50 in a `max-h-72 overflow-y-auto`.
// ---------------------------------------------------------------------------
const leaderboard = code(read(path.join(mobile, 'src', 'components', 'Leaderboard.tsx')));
check(
  !/rows\.slice\(/.test(leaderboard),
  'the leaderboard slices its rows again — it fetches 50 and must render all of them',
);
check(
  /nestedScrollEnabled/.test(leaderboard),
  'the leaderboard list is not nested-scrollable, so inside the Progress ScrollView it cannot scroll on Android',
);
check(
  /selfId\s*\?\s*row\.id === selfId/.test(leaderboard),
  'the leaderboard identifies "you" by display name again — two readers sharing a name highlights a stranger',
);
check(
  /Resets in \$\{formatCountdown/.test(leaderboard),
  'the weekly board no longer says when it resets',
);

// ---------------------------------------------------------------------------
// 4. Ticking a question says so.
//
// The web app has toasted every tick since XP existed; the phone had no toast
// component at all, so a tick fed a number that only appeared if you walked to
// My Progress. Two behaviours are load-bearing and neither is visible to tsc.
// ---------------------------------------------------------------------------
const toastSource = read(path.join(mobile, 'src', 'components', 'XpToast.tsx'));

check(
  /if \(!isHydrated\(\)\)/.test(toastSource),
  'the toast no longer waits for hydration — loading 400 ticked questions at launch would announce "+400 XP"',
);
check(
  /previous\.current = -1|const previous = useRef\(-1\)/.test(toastSource),
  'the toast baseline no longer starts unknown, so the first reading after hydration is treated as a tick',
);
check(
  /pointerEvents="none"/.test(toastSource),
  'the toast can take a press — it floats over the list people are ticking',
);
check(
  /useReducedMotion/.test(toastSource) && /reduced\s*\?\s*\[\]/.test(toastSource),
  'the toast ignores reduced motion',
);
check(
  /easing: EASE\.out/.test(toastSource) && !/Animated\.loop|keyframes/.test(toastSource),
  'the toast is not a house-eased timing — it can fire twice a second and must retarget, not restart',
);

// `milestoneFor` is pure, so its behaviour can actually be exercised rather
// than pattern-matched. Announcing a badge twice is the failure that matters:
// it is what a stored "already announced" list gets wrong, and the reason this
// reads the crossing instead.
const js = ts
  .transpileModule(xpLib, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  })
  .outputText.replace(/import[^;]+;/g, '')
  .replace(/export function yearXp[\s\S]*?\n\}/, '');
const mod = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const { milestoneFor } = mod;

const announced = [];
for (let xp = 0; xp < 1200; xp++) {
  const hit = milestoneFor(xp, xp + 1);
  if (hit) announced.push(`${xp + 1}:${hit.kind}`);
}
for (const threshold of webBadges) {
  const times = announced.filter(a => a.startsWith(`${threshold}:`)).length;
  check(times === 1, `badge ${threshold} announced ${times} times over one climb, expected once`);
}
check(
  milestoneFor(0, 0) === null && milestoneFor(60, 59) === null,
  'a tick worth nothing, or an untick, should announce nothing',
);
// A single tick that crosses both a badge and a level reports the badge: it is
// the rarer of the two and the one worth the card.
check(
  milestoneFor(49, 50)?.kind === 'badge',
  'crossing a badge and a level at once should announce the badge',
);
check(
  milestoneFor(99, 100)?.kind === 'badge' && milestoneFor(149, 150)?.kind === 'level',
  'level crossings are not being announced between badges',
);

if (failures.length > 0) {
  console.error('XP model check failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `OK  one ladder (${XP_PER_LEVEL} XP/level), ${webBadges.length} shared badges, ` +
    'leaderboard unsliced, ticks announced once',
);
