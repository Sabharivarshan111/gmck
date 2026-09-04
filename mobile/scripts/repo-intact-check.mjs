// Nothing load-bearing has been deleted.
//
// **This cannot stop anyone deleting the repository on github.com.** That is an
// owner-only setting and no script, and no agent, can reach it — the agent
// proxy denies the GitHub admin API outright (HANDOFF §2.1). What can be
// protected is everything short of that: a wipe, a bad merge, a "tidy-up" that
// removes a folder nobody recognised, a rebase that drops a directory, an
// agent that decides the question bank is generated and can be regenerated.
// `.agents/REPO-PROTECTION.md` is the human half — what actually protects the
// repo itself, and who has to click it.
//
// It exists because of the specific ways this project loses things:
//
//   - The question bank in `src/data/` is 570 KB of hand-transcribed exam
//     questions with no upstream. It is not generated, it cannot be rebuilt,
//     and it is consumed by the native app through an alias rather than by a
//     copy — so it looks, from `mobile/`, like a folder belonging to a frozen
//     web app that nobody works on.
//   - The rules and the skills ARE the project's memory. HANDOFF §8f records
//     flashcards being built twice because one session could not see the
//     other's chat; the files under `.agents/` and `.claude/` are the fix, and
//     deleting them re-opens exactly that hole.
//   - The workflows are the only way a build gets cut. There is no emulator
//     and no Android SDK in the sandbox, so a deleted workflow is not "CI is
//     red", it is "no APK can be produced from any machine anyone here has".
//
// Floors, not exact counts. Files are added and removed here every day; the
// number below each entry is set well under what is present so ordinary churn
// never trips it, and a directory that falls under it has not been edited, it
// has been emptied. Raising or lowering one is a deliberate act — say why in
// the commit.
//
//   node scripts/repo-intact-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Files that must exist, and what is lost with each. */
const FILES = [
  ['CLAUDE.md', 'Claude Code loses every rule and the reasoning behind it'],
  ['AGENTS.md', 'Antigravity, Cursor and Codex lose the shared rules'],
  ['GEMINI.md', "Antigravity loses its pointer to AGENTS.md, and it is the file that wins conflicts"],
  ['HANDOFF.md', 'the state of the work exists only in chat histories nobody else can read'],
  ['README.md', 'the repo stops explaining itself to a human who lands on it'],
  ['package.json', 'the web app and the root convenience scripts stop existing'],
  ['mobile/package.json', 'every check:* — the repo\'s entire regression memory — is gone'],
  ['mobile/android/app/build.gradle', 'applicationId and versionCode, both of which cost a Play listing to get wrong'],
  ['mobile/metro.config.js', 'the @data alias breaks and the native app cannot see the question bank'],
  ['mobile/babel.config.js', 'same alias, second of the four places that must agree'],
  ['mobile/tsconfig.json', 'same alias, third'],
  ['mobile/preview/vite.config.ts', 'same alias, fourth — and the preview harness dies'],
  ['src/data/questionBankData.ts', 'the bank index'],
  ['supabase/config.toml', 'the Supabase project this repo belongs to'],
  ['.agents/tasks/supabase-pending.json', 'work parked for Supabase is forgotten — the §8j failure, exactly'],
  ['.agents/rules/00-working-agreement.md', 'the contract that stops two agents producing two truths'],
  ['.claude/skills/supabase-resume/SKILL.md', 'the protocol for a connector that has dropped'],
  ['vercel.json', 'the live web app loses its build command, output dir and SPA rewrite'],
];

/** Directories that must exist and hold at least this many files (recursively). */
const DIRS = [
  ['src/data/topics', 20, 'the question bank itself — hand-transcribed, no upstream, unrebuildable'],
  ['mobile/src/components', 40, 'the native app\'s UI'],
  ['mobile/src/screens', 5, 'the native app\'s screens'],
  ['mobile/src/lib', 25, 'the native app\'s logic — progress, anki, xp, notes, music, trees'],
  ['mobile/src/theme', 5, 'themes, motion, tokens, type — the whole design system'],
  ['mobile/src/native', 4, 'the TurboModule specs; without them the Kotlin is unreachable'],
  ['mobile/android/app/src/main/java', 10, 'the Kotlin: sound, files, glass, notifications, apkg'],
  ['mobile/scripts', 30, 'the checks — this repo remembers its bugs in these and nowhere else'],
  ['.agents/rules', 15, 'the rules the non-Claude tools read'],
  ['.claude/skills', 6, 'the vendored reference material Claude Code loads'],
  ['supabase/functions', 8, 'the edge functions; the deployment source'],
  ['supabase/migrations', 15, 'the schema history'],
  ['.github/workflows', 5, 'the only way a build gets cut — there is no local Android SDK'],
];

/** Workflows named individually: each is a build or a check nobody else runs. */
const WORKFLOWS = [
  ['.github/workflows/android-debug.yml', 'the sideloadable poke-at-it build'],
  ['.github/workflows/android-internal.yml', 'the only build Google Sign-In works in'],
  ['.github/workflows/android-release.yml', 'the .aab that goes to Play'],
  ['.github/workflows/supabase-tasks.yml', 'the runner that can actually reach Supabase'],
];

/** Content floors: a file that is present but emptied is a deletion with a stub left behind. */
const BYTES = [
  ['src/data', 400_000, 'the bank is ~570 KB; under this it has been truncated, not edited'],
  ['CLAUDE.md', 40_000, 'CLAUDE.md is ~95 KB of reasoning; under this it has been gutted'],
  ['HANDOFF.md', 20_000, 'HANDOFF.md is ~74 KB of session history'],
];

const failures = [];
const rows = [];

const statOf = rel => fs.stat(path.join(root, rel)).catch(() => null);

async function countFiles(rel) {
  let total = 0;
  const walk = async dir => {
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      if (entry.isDirectory()) await walk(path.join(dir, entry.name));
      else total += 1;
    }
  };
  await walk(path.join(root, rel));
  return total;
}

async function bytesOf(rel) {
  const stat = await statOf(rel);
  if (!stat) return 0;
  if (stat.isFile()) return stat.size;
  let total = 0;
  const walk = async dir => {
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else total += (await fs.stat(full).catch(() => ({ size: 0 }))).size;
    }
  };
  await walk(path.join(root, rel));
  return total;
}

for (const [file, loss] of [...FILES, ...WORKFLOWS]) {
  const stat = await statOf(file);
  if (stat === null) {
    failures.push(`${file} is GONE — ${loss}`);
    rows.push(['MISSING', file, loss]);
  } else if (stat.size === 0) {
    failures.push(`${file} is EMPTY — ${loss}`);
    rows.push(['EMPTY', file, loss]);
  } else {
    rows.push(['ok', file, `${stat.size} bytes`]);
  }
}

for (const [dir, floor, loss] of DIRS) {
  const stat = await statOf(dir);
  if (stat === null) {
    failures.push(`${dir}/ is GONE — ${loss}`);
    rows.push(['MISSING', `${dir}/`, loss]);
    continue;
  }
  const count = await countFiles(dir);
  if (count < floor) {
    failures.push(`${dir}/ holds ${count} files, under its floor of ${floor} — ${loss}`);
    rows.push(['SHRUNK', `${dir}/`, `${count} files, floor ${floor}`]);
  } else {
    rows.push(['ok', `${dir}/`, `${count} files (floor ${floor})`]);
  }
}

for (const [target, floor, why] of BYTES) {
  const size = await bytesOf(target);
  if (size < floor) {
    failures.push(`${target} is ${size} bytes, under its floor of ${floor} — ${why}`);
    rows.push(['SHRUNK', target, `${size} bytes, floor ${floor}`]);
  } else {
    rows.push(['ok', target, `${size} bytes (floor ${floor})`]);
  }
}

/*
 * The queue has to still be readable, not merely present.
 *
 * A JSON file that no longer parses is the same loss as a deleted one — every
 * consumer of it silently falls back to an empty queue, which is precisely the
 * "the work is forgotten" failure the queue was built to prevent, wearing the
 * costume of a file that exists.
 */
try {
  const queue = JSON.parse(await fs.readFile(path.join(root, '.agents/tasks/supabase-pending.json'), 'utf8'));
  if (!Array.isArray(queue.jobs)) {
    failures.push('.agents/tasks/supabase-pending.json has no jobs array — every reader of it sees an empty queue');
  } else {
    rows.push(['ok', '.agents/tasks/supabase-pending.json', `${queue.jobs.length} job(s), parses`]);
  }
} catch (error) {
  failures.push(`.agents/tasks/supabase-pending.json does not parse (${error.message}) — readers fall back to an empty queue silently`);
}

/*
 * A deletion staged but not yet committed is the one this catches EARLY.
 *
 * Everything above answers "is it gone from disk". This answers "is somebody
 * about to remove it", which is the only moment at which the answer is cheap.
 */
let staged = [];
try {
  staged = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=D'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
    .split('\n')
    .filter(Boolean);
} catch {
  staged = [];
}
const GUARDED_PREFIXES = ['src/data/', '.agents/', '.claude/', '.github/workflows/', 'supabase/migrations/'];
const stagedDeletions = staged.filter(f => GUARDED_PREFIXES.some(p => f.startsWith(p)));
if (stagedDeletions.length > 0) {
  failures.push(
    `${stagedDeletions.length} staged deletion(s) under a guarded path: ${stagedDeletions.slice(0, 8).join(', ')}` +
      ' — if this is deliberate, say so in the commit message and remove the path from GUARDED_PREFIXES',
  );
}

const width = Math.max(...rows.map(r => r[1].length));
for (const [state, target, detail] of rows) {
  process.stdout.write(`  ${state.padEnd(8)} ${target.padEnd(width)}  ${detail}\n`);
}

if (failures.length > 0) {
  process.stdout.write('\n');
  for (const failure of failures) process.stdout.write(`  FAIL  ${failure}\n`);
  process.stdout.write(
    `\n${failures.length} load-bearing path(s) are missing, empty or shrunk.\n` +
      'Nothing here is regenerable: the question bank was transcribed by hand, the rules\n' +
      'and skills are what stop two agents redoing each other\'s work, and the workflows are\n' +
      'the only machine that can build an APK. Restore from git (`git checkout -- <path>`)\n' +
      'or from the last release before doing anything else.\n',
  );
  process.exit(1);
}

process.stdout.write(
  `\nOK  ${rows.length} load-bearing path(s) intact.` +
    ' This guard cannot stop the GitHub repo itself being deleted —\n' +
    '    that is an owner-only setting; see .agents/REPO-PROTECTION.md for what does.\n',
);
