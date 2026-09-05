// Keeps the two agents' entry files listing each other's material.
//
// Claude Code auto-loads CLAUDE.md and .claude/skills/. Antigravity auto-loads
// AGENTS.md, GEMINI.md and .agents/rules/. Neither loads the other's folder,
// so a skill added while working in one tool is invisible from the other —
// which is how "I added it in Antigravity and Claude does not know about it"
// happens even though both are looking at the same git checkout.
//
// The fix is not to copy the material (that drifts). It is that each tool's
// auto-loaded file carries a generated **index** of the other's, so whichever
// tool you are in can see what exists and open it. Add a skill or a rule in
// either place, run this, and both sides know.
//
//   node scripts/sync-agent-docs.mjs           rewrite the generated blocks
//   node scripts/sync-agent-docs.mjs --check   fail if they are stale
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const checkOnly = process.argv.includes('--check');

/** `description:` out of a markdown file's YAML frontmatter. */
function frontmatter(body, field) {
  const match = body.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return null;
  }
  const line = match[1].match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
  return line ? line[1].trim().replace(/^["']|["']$/g, '') : null;
}

/** First sentence, so a long description does not become a paragraph. */
function firstSentence(text) {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  const stop = trimmed.search(/\.\s/);
  return stop === -1 ? trimmed : trimmed.slice(0, stop + 1);
}

/**
 * The "Use when ..." clause of a skill's description — the TRIGGER.
 *
 * Every vendored skill's frontmatter says what it is for and then, in a second
 * sentence, when to reach for it. Claude Code reads the whole description and
 * decides for itself; Antigravity never sees the file at all, only the table
 * this script writes — and that table was keeping the first sentence and
 * throwing the trigger away.
 *
 * The effect was an alphabetical list of thirteen subjects with no way to tell
 * which one applied without opening all thirteen, which is the same as having
 * none. This is the column that makes them usable from the other tool.
 *
 * Returns null when a skill does not state one, rather than inventing a
 * trigger from the first sentence: a guessed "use when" is worse than an
 * honest blank, because it reads as authoritative.
 */
function useWhen(text) {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  /*
   * The preposition varies and the first version of this only caught "Use
   * when", which silently blanked the trigger on three skills that had one —
   * "Use at the very start of any session", "Use whenever finishing a
   * feature", "Use at the start of any session that touches Supabase". A
   * blank that looks like "this skill has no trigger" when it has one is
   * worse than no column, because nobody re-checks it.
   */
  const match = trimmed.match(
    /\bUse (?:this skill |this )?(when\b|whenever\b|at\b|for\b|before\b|after\b|during\b|on\b)(.*)$/i,
  );
  if (!match) {
    return null;
  }
  const clause = `${match[1]}${match[2]}`.replace(/^[\s:,]+/, '').trim().replace(/\.$/, '');
  return clause.length > 0 ? clause : null;
}

async function skillIndex() {
  const dir = path.join(root, '.claude', 'skills');
  const names = await fs.readdir(dir).catch(() => []);
  const rows = [];
  for (const name of names.sort()) {
    const file = path.join(dir, name, 'SKILL.md');
    // eslint-disable-next-line no-await-in-loop
    const body = await fs.readFile(file, 'utf8').catch(() => null);
    if (body === null) {
      continue;
    }
    const description = frontmatter(body, 'description') ?? '';
    const trigger = useWhen(description);
    rows.push(
      `| \`.claude/skills/${name}/\` | ${firstSentence(description)} | ${
        trigger ?? '—'
      } |`,
    );
  }
  return [
    'Vendored reference material. Claude Code loads these automatically from the',
    'skill\'s own frontmatter; **Antigravity never sees these files**, so this table',
    'is the whole of its access to them.',
    '',
    'Read the third column first. It is the `Use when ...` clause out of each',
    "skill's frontmatter, and it is there because a list of thirteen subjects with",
    'no triggers is a list you would have to open thirteen times to use. When the',
    'work matches a trigger, **open that SKILL.md and follow it** — these are not',
    'summaries, the file is the material.',
    '',
    '| Skill | What it is for | Open it when |',
    '|---|---|---|',
    ...rows,
  ].join('\n');
}

async function ruleIndex() {
  const dir = path.join(root, '.agents', 'rules');
  const names = await fs.readdir(dir).catch(() => []);
  const rows = [];
  for (const name of names.sort()) {
    if (!name.endsWith('.md')) {
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    const body = await fs.readFile(path.join(dir, name), 'utf8').catch(() => '');
    const description = frontmatter(body, 'description') ?? '';
    rows.push(`| \`.agents/rules/${name}\` | ${firstSentence(description)} |`);
  }
  return [
    'Antigravity loads these automatically; Claude Code does not, so **read them**',
    'when picking up work that was last touched from the other tool.',
    '',
    '| Rules file | What it covers |',
    '|---|---|',
    ...rows,
  ].join('\n');
}

const BLOCKS = [
  { file: '.agents/rules/30-reference.md', marker: 'skills', build: skillIndex },
  { file: 'CLAUDE.md', marker: 'rules', build: ruleIndex },
];

const stale = [];
for (const { file, marker, build } of BLOCKS) {
  const full = path.join(root, file);
  const body = await fs.readFile(full, 'utf8');
  const start = `<!-- ${marker}:start — generated by mobile/scripts/sync-agent-docs.mjs, do not edit by hand -->`;
  const end = `<!-- ${marker}:end -->`;
  // eslint-disable-next-line no-await-in-loop
  const generated = `${start}\n${await build()}\n${end}`;

  const from = body.indexOf(start);
  const to = body.indexOf(end);
  if (from === -1 || to === -1) {
    stale.push(`${file} has no ${marker} block — run without --check to insert one`);
    continue;
  }
  const current = body.slice(from, to + end.length);
  if (current === generated) {
    continue;
  }
  if (checkOnly) {
    stale.push(`${file}'s ${marker} index is out of date`);
    continue;
  }
  await fs.writeFile(full, body.slice(0, from) + generated + body.slice(to + end.length));
  process.stdout.write(`updated the ${marker} index in ${file}\n`);
}

if (stale.length > 0) {
  for (const message of stale) {
    process.stdout.write(`  FAIL  ${message}\n`);
  }
  process.stdout.write(
    '\nA skill or rules file was added or renamed without the other agent being told.\n' +
      'Run:  cd mobile && npm run sync:agent-docs\n',
  );
  process.exit(1);
}

process.stdout.write(checkOnly ? 'OK  both indexes are current\n' : 'OK  indexes written\n');
