// Work that is waiting for Supabase.
//
// Supabase is unreachable from the development sandboxes — the egress gateway
// answers 403 to CONNECT for both api.supabase.com and the project host — so
// the only routes to it are an MCP connector (Claude Code, Antigravity) or a
// GitHub runner. Connectors come and go mid-session: one dropped halfway
// through a task in August, which is what this file exists for.
//
// The failure it prevents is not "the work could not be done". It is that the
// work is *forgotten*: an agent finds the connector missing, writes the change
// into the repo, says so once in a chat message the next session cannot see,
// and the deploy never happens. Weeks later the deployed function and the
// repo's copy disagree and reading the code agrees with the bug. That has
// already happened once here, to the notes function.
//
// So a blocked job goes in .agents/tasks/supabase-pending.json, which is
// committed. Any agent, in any tool, on any day, can ask what is outstanding
// and do it the moment it has a route.
//
//   node scripts/supabase-queue.mjs status          what is pending, and is there a route
//   node scripts/supabase-queue.mjs add   <file>    enqueue a job described by a JSON file
//   node scripts/supabase-queue.mjs done  <id>      mark one applied
//   node scripts/supabase-queue.mjs check           CI: every pending job still resolves
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const QUEUE = path.join(root, '.agents', 'tasks', 'supabase-pending.json');
const REL = '.agents/tasks/supabase-pending.json';

/** The project every job here targets. Public — it is in the shipped app. */
export const PROJECT_REF = 'pmtgeydtqypwrypshhsx';

const KINDS = new Set(['deploy_function', 'sql', 'storage', 'check']);

async function readQueue() {
  try {
    const raw = await fs.readFile(QUEUE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.jobs) ? parsed : { jobs: [] };
  } catch {
    return { jobs: [] };
  }
}

async function writeQueue(queue) {
  await fs.mkdir(path.dirname(QUEUE), { recursive: true });
  await fs.writeFile(QUEUE, `${JSON.stringify(queue, null, 2)}\n`);
}

/**
 * Can this machine reach Supabase directly?
 *
 * True on a GitHub runner, false in every agent sandbox. It is deliberately
 * **not** the only signal: an agent with the MCP connector has a route even
 * though this returns false, which is why `status` reports the probe and the
 * queue separately and tells the caller to check its own tools too.
 */
async function reachable(timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/`, {
      method: 'HEAD',
      signal: controller.signal,
    });
    /*
     * **A 403 here is the gateway, not Supabase.**
     *
     * The first version of this probe treated any HTTP answer as success and
     * cheerfully reported "reachable (HTTP 403)" from a sandbox that cannot
     * reach Supabase at all — the egress proxy denies the CONNECT and answers
     * 403 itself, before a single byte goes anywhere. A check that passes on
     * the exact condition it exists to detect is worse than no check.
     *
     * PostgREST with no apikey answers **401**; a bad path answers 404. Both
     * mean the host answered, which is what is being tested. 403 is the
     * documented denial and is treated as blocked.
     */
    if (res.status === 403) {
      return { ok: false, detail: 'HTTP 403 — the egress gateway denied the CONNECT' };
    }
    return { ok: true, detail: `HTTP ${res.status}` };
  } catch (error) {
    return { ok: false, detail: (error?.cause?.code ?? error?.message ?? 'unreachable').toString() };
  } finally {
    clearTimeout(timer);
  }
}

function describe(job) {
  const mark = { done: '·', declined: '×' }[job.status] ?? '!';
  const lines = [`  ${mark} ${job.id}  ${job.kind}`];
  lines.push(`      ${job.summary}`);
  if (job.file) lines.push(`      apply: ${job.file}`);
  if (job.why) lines.push(`      why:   ${job.why}`);
  return lines.join('\n');
}

const [, , command = 'status', arg] = process.argv;

if (command === 'status' || command === 'check') {
  const queue = await readQueue();
  /*
   * `declined` is a finished state, not a waiting one.
   *
   * A job the app's owner has said no to must stop being advertised as work,
   * or every future session reads "1 job waiting" and does the thing that was
   * refused. It stays in the file rather than being deleted, because the
   * decision and its reasoning are the useful part — a job that vanishes gets
   * re-queued by whoever next notices the same tidy-up.
   */
  const FINISHED = new Set(['done', 'declined']);
  const pending = queue.jobs.filter(job => !FINISHED.has(job.status));
  const declined = queue.jobs.filter(job => job.status === 'declined');

  if (command === 'check') {
    // CI: a job that points at a file nobody kept is a job nobody can do.
    const missing = [];
    for (const job of pending) {
      if (!job.file) continue;
      // eslint-disable-next-line no-await-in-loop
      const exists = await fs.stat(path.join(root, job.file)).then(() => true, () => false);
      if (!exists) missing.push(`${job.id} points at ${job.file}, which does not exist`);
    }
    if (missing.length > 0) {
      for (const problem of missing) process.stdout.write(`  FAIL  ${problem}\n`);
      process.stdout.write(`\n${missing.length} queued Supabase job(s) cannot be applied.\n`);
      process.exit(1);
    }
    process.stdout.write(
      `OK  ${pending.length} Supabase job(s) queued in ${REL}, all still applicable\n`,
    );
    process.exit(0);
  }

  const probe = await reachable();
  process.stdout.write(`Supabase direct network: ${probe.ok ? 'reachable' : 'blocked'} (${probe.detail})\n`);
  if (!probe.ok) {
    process.stdout.write(
      '  Expected in an agent sandbox. A connector is still a route — check whether\n' +
        '  your own Supabase tools are loaded before concluding you cannot do this.\n',
    );
  }
  process.stdout.write(`\n${pending.length} job(s) waiting:\n`);
  if (pending.length === 0) {
    process.stdout.write('  (nothing)\n');
  } else {
    for (const job of pending) process.stdout.write(`${describe(job)}\n`);
  }

  /*
   * Listed, but plainly not as work. A refused job that is invisible gets
   * proposed again by the next person who spots the same loose end.
   */
  if (declined.length > 0) {
    process.stdout.write(
      `\n${declined.length} declined — do NOT do these, the reason is in each one:\n`,
    );
    for (const job of declined) process.stdout.write(`${describe(job)}\n`);
  }
  process.exit(0);
}

if (command === 'add') {
  if (!arg) {
    process.stdout.write('usage: supabase-queue.mjs add <path-to-job.json>\n');
    process.exit(1);
  }
  const job = JSON.parse(await fs.readFile(path.resolve(arg), 'utf8'));
  if (!KINDS.has(job.kind)) {
    process.stdout.write(`kind must be one of: ${[...KINDS].join(', ')}\n`);
    process.exit(1);
  }
  if (!job.summary || !job.why) {
    process.stdout.write('a job needs a summary and a why — the next agent has no other context\n');
    process.exit(1);
  }
  const queue = await readQueue();
  job.id = job.id ?? `sb-${Date.now().toString(36)}`;
  job.status = 'pending';
  job.queuedAt = new Date().toISOString();
  queue.jobs.push(job);
  await writeQueue(queue);
  process.stdout.write(`queued ${job.id}\n`);
  process.exit(0);
}

if (command === 'done') {
  const queue = await readQueue();
  const job = queue.jobs.find(j => j.id === arg);
  if (!job) {
    process.stdout.write(`no job with id ${arg}\n`);
    process.exit(1);
  }
  job.status = 'done';
  job.appliedAt = new Date().toISOString();
  await writeQueue(queue);
  process.stdout.write(`${arg} marked done\n`);
  process.exit(0);
}

process.stdout.write('usage: supabase-queue.mjs [status|add <file>|done <id>|check]\n');
process.exit(1);
