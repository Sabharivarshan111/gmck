// Where the work stopped — derived from the repo, not remembered.
//
// This project is worked on from Claude Code and from Antigravity, on
// different accounts, in containers that are thrown away. A session can end
// three ways that all look the same from the next one: the internet drops,
// somebody deletes the session, the account signs out. In every case the chat
// history is gone and **the repo is the only thing that survived**.
//
// HANDOFF.md is the long prose answer to that and it is worth keeping, but it
// has the disease it was meant to cure: it is hand-written, so it is true on
// the day it is written and quietly wrong a week later. Twice that has cost
// this project real work — flashcards were built twice (HANDOFF §8f) and a
// blocked Supabase deploy was announced only in a chat message and forgotten
// for weeks (§8j).
//
// So this report is **mostly derived**. Git says what the branch is, whether
// the tree is dirty, and what the last commits did. The Supabase queue file
// says what is parked. `.agents/queue/` says which long-form notes are still
// open. The only hand-written parts are `.agents/state/blocked.json` and
// `.agents/state/resume-notes.md`, both stamped, and both of which this
// script *ages* — an entry older than the last commit that touched the repo
// is printed as history, not as status, because that is what it is.
//
// It runs entirely offline. No network call, no Supabase, no GitHub API:
// a report that needs a route is a report the sandbox cannot print, and this
// one has to work in the worst case, which is a fresh clone on a new account.
//
//   node scripts/resume-status.mjs              the report
//   node scripts/resume-status.mjs --no-checks  skip the integrity checks (faster)
//   node scripts/resume-status.mjs --json       the same facts, machine-readable
//   node scripts/resume-status.mjs --write      also refresh .agents/state/session-state.json
//
// The snapshot written by --write exists for the reader who never runs
// anything — Antigravity opening files, or a human on github.com. It carries
// `generatedAt` and every consumer of it is expected to compare that against
// the last commit date, which `--write` records alongside it for exactly that
// purpose. A snapshot older than HEAD is a snapshot that has been overtaken.
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = new Set(process.argv.slice(2));
const asJson = args.has('--json');
const runChecks = !args.has('--no-checks');
const write = args.has('--write');

const STATE_DIR = '.agents/state';
const SNAPSHOT = `${STATE_DIR}/session-state.json`;
const NOTES = `${STATE_DIR}/resume-notes.md`;
const BLOCKED = `${STATE_DIR}/blocked.json`;
const SUPABASE_QUEUE = '.agents/tasks/supabase-pending.json';
const QUEUE_DIR = '.agents/queue';

const out = [];
const say = line => out.push(line);

const readFile = rel => fs.readFile(path.join(root, rel), 'utf8').catch(() => null);
const readJson = async rel => {
  const body = await readFile(rel);
  if (body === null) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};
const exists = rel =>
  fs.stat(path.join(root, rel)).then(
    () => true,
    () => false,
  );

/** git, but never fatal. A checkout with no .git is a real case (a zip, a Lovable sandbox). */
function git(...argv) {
  try {
    return execFileSync('git', argv, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

const DAY = 86_400_000;
function ageOf(iso) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const days = Math.floor((Date.now() - then) / DAY);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

// ---------------------------------------------------------------- 1. git

const head = git('rev-parse', '--short', 'HEAD');
const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
const dirty = (git('status', '--porcelain') ?? '')
  .split('\n')
  .filter(Boolean);
const headDate = git('log', '-1', '--format=%cI');
const commits = (git('log', '-8', '--format=%h\t%cr\t%s') ?? '')
  .split('\n')
  .filter(Boolean)
  .map(line => {
    const [hash, when, ...rest] = line.split('\t');
    return { hash, when, subject: rest.join('\t') };
  });

const remotes = (git('remote') ?? '').split('\n').filter(Boolean);
/*
 * Compared against the LAST FETCHED ref, and said so.
 *
 * This never fetches. The sandboxes go through an egress proxy and a report
 * that hangs on the network is a report nobody waits for — but a comparison
 * against a stale remote ref that *claims* to be current is worse than none,
 * so each row carries how old the ref is.
 */
const tracking = [];
for (const remote of remotes) {
  const ref = `${remote}/${branch}`;
  if (git('rev-parse', '--verify', '--quiet', ref) === null) {
    tracking.push({ ref, state: 'no such branch on this remote (never pushed, or pushed under another name)' });
    continue;
  }
  const counts = git('rev-list', '--left-right', '--count', `${ref}...HEAD`);
  const [behind, ahead] = (counts ?? '0\t0').split('\t').map(Number);
  tracking.push({
    ref,
    ahead,
    behind,
    fetched: git('log', '-1', '--format=%cr', ref),
    state:
      ahead === 0 && behind === 0
        ? 'level'
        : `${ahead} commit(s) here are not on it, ${behind} on it are not here`,
  });
}

say('WHERE THE WORK STOPPED');
say(`  generated ${new Date().toISOString()} — offline, from this checkout only`);
say('');
say('1. GIT');
if (head === null) {
  say('  ! this is not a git checkout — every derived fact below is missing');
} else {
  say(`  branch        ${branch}`);
  say(`  HEAD          ${head}  (${ageOf(headDate)})`);
  say(
    dirty.length === 0
      ? '  working tree  clean'
      : `  working tree  ${dirty.length} uncommitted path(s) — SOMEONE WAS MID-EDIT:`,
  );
  for (const line of dirty.slice(0, 12)) say(`                  ${line}`);
  if (dirty.length > 12) say(`                  … and ${dirty.length - 12} more`);
  say('  remotes:');
  if (tracking.length === 0) say('                  (none configured in this container)');
  for (const t of tracking) {
    say(`    ${t.ref.padEnd(38)} ${t.state}${t.fetched ? `  [ref last fetched ${t.fetched}]` : ''}`);
  }
  say('  last commits:');
  for (const c of commits) say(`    ${c.hash}  ${c.when.padEnd(16)} ${c.subject}`);
}

// ------------------------------------------------- 2. the hand-written half

say('');
say('2. WHAT THE LAST SESSION SAID (hand-written — check its age before believing it)');

const notes = await readFile(NOTES);
let latestNote = null;
if (notes === null) {
  say(`  ! ${NOTES} is missing. Nobody has written down where they stopped.`);
} else {
  /*
   * Entries are `## <ISO date> — <title>`, newest first is NOT assumed: the
   * file is append-only, so the last heading in the file is the newest one.
   * Parsing the date out of the heading is what lets this be aged against
   * HEAD; a note with no date in its heading is reported as undateable rather
   * than silently trusted.
   */
  const headings = [...notes.matchAll(/^##\s+(\d{4}-\d{2}-\d{2})?\s*(.*)$/gm)];
  const last = headings.at(-1);
  if (!last) {
    say(`  ! ${NOTES} has no "## <date> — <title>" entries in it.`);
  } else {
    const [, date, rawTitle] = last;
    // The heading is `## <date> — <title>`; the em dash belongs to the format,
    // not to the title, and printing it back gives "2026-09-04 — — Claude Code".
    const title = rawTitle.replace(/^[\s—-]+/, '');
    const body = notes
      .slice(last.index + last[0].length)
      .split('\n')
      .filter(line => line.trim().length > 0)
      .slice(0, 14);
    latestNote = { date: date ?? null, title, lines: body };
    const stale =
      date && headDate && new Date(date).getTime() < new Date(headDate).getTime() - DAY
        ? '  <-- OLDER THAN HEAD. Read it as history; the commits above are newer.'
        : '';
    say(`  latest entry: ${date ?? '(undated)'} — ${title}   [${ageOf(date) ?? 'undateable'}]${stale}`);
    for (const line of body) say(`    ${line}`);
  }
}

// ---------------------------------------------------------- 3. what is blocked

say('');
say('3. BLOCKED, AND ON WHOM');

const blockedFile = await readJson(BLOCKED);
const blockers = Array.isArray(blockedFile?.blockers) ? blockedFile.blockers : [];
const openBlockers = blockers.filter(b => b.status !== 'cleared');

/**
 * Does this blocker still look blocked?
 *
 * A blocker file is hand-written, which means it rots — the whole failure this
 * script exists for. So each entry may declare a cheap, offline probe of what
 * would be *observably different* once it is unblocked, and the report says
 * "MAY BE CLEAR" when the probe fires. It never edits the file: a probe can be
 * right about the file system and wrong about the world (a job marked done in
 * the queue does not prove the function is deployed), so clearing an entry
 * stays a person's decision, taken with the verify line in front of them.
 */
async function probe(clearsWhen) {
  if (!clearsWhen || clearsWhen.kind === 'manual') return { fired: false, detail: 'no probe — only its date says anything' };
  if (clearsWhen.kind === 'pathExists') {
    const there = await exists(clearsWhen.path);
    return { fired: there, detail: `${clearsWhen.path} ${there ? 'now exists' : 'is still absent'}` };
  }
  if (clearsWhen.kind === 'pathMissing') {
    const there = await exists(clearsWhen.path);
    return { fired: !there, detail: `${clearsWhen.path} ${there ? 'is still there' : 'is gone'}` };
  }
  if (clearsWhen.kind === 'grepPresent' || clearsWhen.kind === 'grepAbsent') {
    const body = (await readFile(clearsWhen.path)) ?? '';
    const hit = new RegExp(clearsWhen.pattern).test(body);
    const fired = clearsWhen.kind === 'grepPresent' ? hit : !hit;
    return { fired, detail: `/${clearsWhen.pattern}/ ${hit ? 'matches' : 'does not match'} in ${clearsWhen.path}` };
  }
  if (clearsWhen.kind === 'supabaseJobDone') {
    const queue = await readJson(SUPABASE_QUEUE);
    const job = queue?.jobs?.find(j => j.id === clearsWhen.id);
    const done = job?.status === 'done';
    return { fired: done, detail: `queue job ${clearsWhen.id} is ${job ? job.status : 'not in the queue'}` };
  }
  return { fired: false, detail: `unknown probe kind "${clearsWhen.kind}" — treated as still blocked` };
}

if (blockedFile === null) {
  say(`  ! ${BLOCKED} is missing or is not valid JSON.`);
} else if (openBlockers.length === 0) {
  say('  (nothing recorded as blocked)');
} else {
  say(
    `  ${openBlockers.length} open: ` +
      openBlockers.map(b => b.id).join(', '),
  );
  say('');
  for (const b of openBlockers) {
    const p = await probe(b.clearsWhen); // eslint-disable-line no-await-in-loop
    say(`  ${p.fired ? 'MAY BE CLEAR' : 'BLOCKED     '} ${b.id}   [since ${b.since ?? '?'}, ${ageOf(b.since) ?? 'undateable'}]`);
    say(`      what:   ${b.what}`);
    say(`      on:     ${b.blockedOn}`);
    say(`      WHO:    ${b.owner}`);
    if (b.remedy) say(`      how:    ${b.remedy}`);
    if (b.source) say(`      source: ${b.source}`);
    say(`      probe:  ${p.detail}`);
  }
  say('');
  say('  "WHO" is the point of this section. An agent cannot flip a connector, paste a');
  say('  GitHub secret, buy Lovable credits or make a payment — saying "blocked" without');
  say('  naming who can unblock it is what turns a blocker into a permanent one.');
}

// ----------------------------------------------------------- 4. supabase queue

say('');
say('4. SUPABASE QUEUE');
const queue = await readJson(SUPABASE_QUEUE);
const jobs = Array.isArray(queue?.jobs) ? queue.jobs : [];
const FINISHED = new Set(['done', 'declined']);
const pending = jobs.filter(j => !FINISHED.has(j.status));
const declined = jobs.filter(j => j.status === 'declined');
say(`  ${pending.length} pending, ${declined.length} declined, ${jobs.filter(j => j.status === 'done').length} done   (${SUPABASE_QUEUE})`);
for (const job of pending) {
  say(`    ! ${job.id}  ${job.kind}   [queued ${ageOf(job.queuedAt) ?? '?'}]`);
  say(`        ${job.summary}`);
  if (job.file) say(`        apply: ${job.file}`);
}
for (const job of declined) say(`    x ${job.id} — DECLINED, do not do it: ${job.summary}`);
if (pending.length > 0) {
  say('  A route is an MCP connector or a GitHub runner; the sandbox network is not one.');
  say('  Full protocol: cd mobile && npm run supabase:status, and .claude/skills/supabase-resume/.');
}

// ------------------------------------------------------- 5. long-form queue notes

say('');
say('5. OPEN NOTES IN .agents/queue/');
const queueFiles = await fs.readdir(path.join(root, QUEUE_DIR)).catch(() => []);
if (queueFiles.length === 0) {
  say('  (none)');
}
for (const name of queueFiles.sort()) {
  if (!name.endsWith('.md')) continue;
  const body = (await readFile(`${QUEUE_DIR}/${name}`)) ?? ''; // eslint-disable-line no-await-in-loop
  const title = body.split('\n').find(l => l.startsWith('# '))?.slice(2) ?? name;
  const status = body.match(/^\*\*Status:\*\*\s*(.+)$/m)?.[1] ?? '';
  say(`  ${QUEUE_DIR}/${name}`);
  say(`      ${title}`);
  if (status) say(`      status: ${status}`);
}

// -------------------------------------------------------------- 6. integrity

say('');
say('6. IS THE REPO STILL COHERENT');

const INTEGRITY = [
  ['check:repo-intact', 'scripts/repo-intact-check.mjs', 'every load-bearing path is still here'],
  ['check:agent-docs', 'scripts/agent-docs-check.mjs', 'both agents are reading one set of rules'],
  ['check:supabase-queue', 'scripts/supabase-queue.mjs', 'every parked job still points at a real file'],
];
const checkResults = [];
if (!runChecks) {
  say('  (skipped — --no-checks)');
} else {
  for (const [name, script, what] of INTEGRITY) {
    const argv = name === 'check:supabase-queue' ? [script, 'check'] : [script];
    let ok = true;
    let detail = '';
    try {
      detail = execFileSync('node', [path.join(root, 'mobile', ...argv[0].split('/')), ...argv.slice(1)], {
        cwd: path.join(root, 'mobile'),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim();
    } catch (error) {
      ok = false;
      detail = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
    }
    checkResults.push({ name, ok });
    say(`  ${ok ? 'OK  ' : 'FAIL'} ${name.padEnd(22)} ${what}`);
    if (!ok) for (const line of detail.split('\n').filter(Boolean).slice(0, 6)) say(`         ${line}`);
  }
}

// Every other check, listed rather than run: they are minutes, not seconds,
// and which of them matters depends on what you are about to touch.
const mobilePkg = await readJson('mobile/package.json');
const allChecks = Object.keys(mobilePkg?.scripts ?? {}).filter(k => k.startsWith('check:'));
say(`  ${allChecks.length} check:* scripts exist in mobile/package.json. Run the ones that cover what you`);
say('  change — each names, in its header, the bug it exists for. `cd mobile && npm run <name>`.');

// ------------------------------------------------------------------ 7. next

say('');
say('7. FIRST FOUR THINGS TO DO');
say('  1. Read HANDOFF.md from the END — the newest section is the last one.');
say('  2. git fetch --all and re-read this report; the remote rows above are as old as');
say('     your last fetch, and both remotes can be at different commits.');
say('  3. Anything under BLOCKED with your name against it, or nothing if it is the owner\'s.');
say('  4. Before you stop: append to .agents/state/resume-notes.md and update');
say('     .agents/state/blocked.json. That file, not this chat, is what the next session reads.');

// ------------------------------------------------------------------- output

const snapshot = {
  generatedAt: new Date().toISOString(),
  git: { branch, head, headCommittedAt: headDate, dirtyPaths: dirty.length, tracking, commits },
  handWritten: { notes: latestNote, blockers: openBlockers.map(b => ({ id: b.id, owner: b.owner, since: b.since })) },
  supabaseQueue: { pending: pending.map(j => j.id), declined: declined.map(j => j.id) },
  openQueueNotes: queueFiles.filter(n => n.endsWith('.md')),
  integrity: checkResults,
};

if (write) {
  await fs.mkdir(path.join(root, STATE_DIR), { recursive: true });
  await fs.writeFile(
    path.join(root, SNAPSHOT),
    `${JSON.stringify(
      {
        _README:
          'GENERATED by mobile/scripts/resume-status.mjs --write. Do not hand-edit. It is a ' +
          'convenience for a reader who cannot run anything (Antigravity opening files, a ' +
          'human on github.com). Compare generatedAt against git.headCommittedAt: if the ' +
          'snapshot is older, it has been overtaken and you should re-run the script.',
        ...snapshot,
      },
      null,
      2,
    )}\n`,
  );
}

if (asJson) {
  process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
} else {
  process.stdout.write(`${out.join('\n')}\n`);
  if (write) process.stdout.write(`\n(snapshot written to ${SNAPSHOT})\n`);
}

/*
 * Exit 0 even when an integrity check failed.
 *
 * This is a *report*, and a report that exits non-zero is one a SessionStart
 * hook or a shell `&&` chain will treat as a broken tool rather than as bad
 * news. The failing check is printed, loudly, in section 6; the check itself
 * is what fails a build, and it is wired into the workflows separately.
 */
process.exit(0);
