// The instructions two different agents read have to stay one set of rules.
//
// This repo is worked on from Claude Code and from Antigravity. They read
// different files:
//
//   AGENTS.md          both (Antigravity natively, Claude Code via CLAUDE.md)
//   CLAUDE.md          Claude Code natively
//   GEMINI.md          Antigravity natively, and it WINS conflicts with AGENTS.md
//   .agents/rules/*.md Antigravity natively
//   .claude/skills/**  Claude Code natively
//
// Two ways that goes wrong, both silent:
//
//   1. A rules file grows past Antigravity's 12,000-character cap, and the
//      back half is quietly ignored — you get a file that looks complete and
//      is half-loaded.
//   2. GEMINI.md accumulates rules of its own. Because it takes precedence, a
//      stale copy there beats the maintained one in AGENTS.md, and the rule
//      nobody updates is the one that wins.
//
// It also checks that every repo path the rules point at still exists, since
// pointing rather than copying is the whole anti-drift strategy and a dead
// pointer turns a rule into a dead end.
//
//   node scripts/agent-docs-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LIMIT = 12000;

const failures = [];
const check = (ok, message) => {
  if (!ok) {
    failures.push(message);
  }
};
const read = file => fs.readFile(path.join(root, file), 'utf8').catch(() => null);
const exists = file =>
  fs.stat(path.join(root, file)).then(
    () => true,
    () => false,
  );

// 1. The files each tool needs must be there.
for (const file of ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'HANDOFF.md']) {
  check(await exists(file), `${file} is missing — one of the two agents loses its instructions`);
}

// 2. Size caps. Antigravity truncates, it does not warn.
const ruleFiles = ['AGENTS.md'];
const rulesDir = '.agents/rules';
if (await exists(rulesDir)) {
  for (const entry of await fs.readdir(path.join(root, rulesDir))) {
    if (entry.endsWith('.md')) {
      ruleFiles.push(path.join(rulesDir, entry));
    }
  }
}
check(ruleFiles.length > 1, '.agents/rules/ has no rule files — Antigravity gets AGENTS.md only');

for (const file of ruleFiles) {
  const body = await read(file);
  if (body === null) {
    continue;
  }
  check(
    body.length <= LIMIT,
    `${file} is ${body.length} chars, over Antigravity's ${LIMIT} cap — the end of it is silently ignored`,
  );
}

// 3. GEMINI.md must stay a pointer. It beats AGENTS.md on conflict, so any
//    rule stated there is a rule with two homes and one maintainer.
const gemini = (await read('GEMINI.md')) ?? '';
check(
  gemini.includes('AGENTS.md'),
  'GEMINI.md does not point at AGENTS.md, so Antigravity has no route to the shared rules',
);
check(
  gemini.length < 3000,
  `GEMINI.md is ${gemini.length} chars. It takes precedence over AGENTS.md, so it holds pointers and Antigravity-specific notes — not rules.`,
);

// 4. CLAUDE.md has to hand Claude Code over to the shared file.
const claude = (await read('CLAUDE.md')) ?? '';
check(
  claude.includes('AGENTS.md'),
  'CLAUDE.md never mentions AGENTS.md, so Claude Code never reads the rules Antigravity is following',
);

// 5. Every repo path the rules point at must exist.
const pointerPattern = /`((?:\.claude|\.agents|mobile|src|supabase)\/[A-Za-z0-9_./*-]+)`/g;
for (const file of [...ruleFiles, 'GEMINI.md']) {
  const body = (await read(file)) ?? '';
  for (const [, pointer] of body.matchAll(pointerPattern)) {
    if (pointer.includes('*')) {
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    check(await exists(pointer), `${file} points at ${pointer}, which does not exist`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    process.stdout.write(`  FAIL  ${failure}\n`);
  }
  process.stdout.write(`\n${failures.length} problem(s) — the two agents would be following different rules.\n`);
  process.exit(1);
}

process.stdout.write(
  `OK  ${ruleFiles.length} rules file(s) within ${LIMIT} chars, GEMINI.md still a pointer, all paths resolve\n`,
);
