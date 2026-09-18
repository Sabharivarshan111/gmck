// What a `vercel deploy` would upload, measured, against a budget.
//
//   npm run check:deploy
//
// This is the check that was missing. Vercel caps the source files a CLI
// deployment may upload — 100 MB on Hobby — and this repo drifted to 728 MB
// without `.git` while nothing measured it. Every CLI deploy was rejected, and
// because a push to `main` goes through the Git integration instead (Vercel
// clones on its own side and uploads nothing), the site kept updating on merges
// and could not be published any other way. That is the shape of "the site is
// live but an agent cannot deploy to it": not a build failure, not a
// credential, not a permission.
//
// It asserts four things:
//
//   1. `.vercelignore` still lists everything `scripts/deploy-excludes.mjs`
//      does. Two lists that must agree, in a repo three tools work on, do not
//      stay agreed on their own.
//   2. What is left is under budget, with the biggest remaining directories
//      printed so the next thing to grow is obvious before it is a problem.
//   3. Nothing in `src/` references a path the Vite plugin deletes from
//      `dist/`. This is what makes "unserved" a fact rather than a belief:
//      add an `<img src="/diagrams/...">` and this fails.
//   4. `public/models/` ships one encoding per chunk, not two. It carried both
//      `body-N.bin` and `body-N.bin.gz` for all fifteen — the same 2.2 million
//      triangles twice, 57 MB of it redundant.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { UPLOAD_EXCLUDES, PUBLIC_EXCLUDES, UPLOAD_BUDGET_MB } from './deploy-excludes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const fail = (m) => failures.push(m);

// -- 1. The two lists agree -------------------------------------------------

const ignoreFile = path.join(root, '.vercelignore');
if (!fs.existsSync(ignoreFile)) {
  fail('.vercelignore is missing — every CLI deployment uploads the whole 728 MB working tree and is refused');
} else {
  const listed = new Set(
    fs.readFileSync(ignoreFile, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
  );
  // Both lists: the CLI uploads the working tree, so a path excluded from
  // `dist/` by the Vite plugin still has to be kept out of the upload.
  const required = [...UPLOAD_EXCLUDES, ...PUBLIC_EXCLUDES.map((p) => `public/${p}`)];
  for (const entry of required) {
    if (!listed.has(entry)) fail(`.vercelignore does not list "${entry}", which scripts/deploy-excludes.mjs says it must`);
  }
  for (const entry of listed) {
    if (!required.includes(entry)) fail(`.vercelignore lists "${entry}", which scripts/deploy-excludes.mjs does not — add it there, with the reason`);
  }
}

// -- 2. What is left, and how big it is -------------------------------------

/** Every ignore rule, as a predicate against a repo-relative path. */
const ALL_EXCLUDES = [...UPLOAD_EXCLUDES, ...PUBLIC_EXCLUDES.map((p) => `public/${p}`)];

function isExcluded(rel) {
  for (const rule of ALL_EXCLUDES) {
    if (rule.startsWith('/')) {
      const glob = rule.slice(1);
      if (!rel.includes('/') && matchGlob(rel, glob)) return true;
    } else if (rel === rule || rel.startsWith(`${rule}/`)) {
      return true;
    }
  }
  // Never uploaded by the CLI, whatever the ignore file says.
  return rel === '.git' || rel.startsWith('.git/') || rel.split('/').includes('node_modules') || rel === 'dist' || rel.startsWith('dist/');
}

function matchGlob(name, glob) {
  const rx = new RegExp(`^${glob.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`);
  return rx.test(name);
}

const perTop = new Map();
let total = 0;
let files = 0;

function walk(dir, rel) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const childRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (isExcluded(childRel)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(abs, childRel);
    } else if (entry.isFile()) {
      const { size } = fs.statSync(abs);
      total += size;
      files += 1;
      const top = childRel.split('/').slice(0, 2).join('/');
      perTop.set(top, (perTop.get(top) ?? 0) + size);
    }
  }
}
walk(root, '');

const mb = total / 1024 / 1024;

// -- 3. Nothing asks for what the build deletes ------------------------------

let tracked = [];
try {
  tracked = execFileSync('git', ['-C', root, 'ls-files', 'src', 'index.html'], { encoding: 'utf8' })
    .split('\n').filter(Boolean);
} catch {
  fail('could not list tracked source files with git');
}

for (const rel of PUBLIC_EXCLUDES) {
  const needle = `/${rel}`;
  const hits = tracked.filter((f) => {
    const abs = path.join(root, f);
    if (!fs.existsSync(abs) || fs.statSync(abs).size > 4_000_000) return false;
    const text = fs.readFileSync(abs, 'utf8');
    // The Supabase bucket's public URL also contains `/diagrams/`, and that is
    // a different thing entirely — it is fetched from the bucket, not from here.
    return text.split('\n').some((line) => line.includes(needle) && !line.includes('supabase.co/storage'));
  });
  if (hits.length) {
    fail(`public/${rel} is deleted from dist/ by vite.config.ts, but ${hits.length} source file(s) reference it: ${hits.slice(0, 3).join(', ')}`);
  }
  if (!fs.existsSync(path.join(root, 'public', rel))) {
    fail(`public/${rel} is in PUBLIC_EXCLUDES but does not exist — drop the entry`);
  }
}

// -- 4. One encoding per anatomy chunk ---------------------------------------

const atlasPath = path.join(root, 'public/models/atlas.json');
if (fs.existsSync(atlasPath)) {
  const atlas = JSON.parse(fs.readFileSync(atlasPath, 'utf8'));
  for (const [i, chunk] of atlas.chunks.entries()) {
    const gz = path.join(root, 'public', chunk.gzip ?? '');
    const raw = path.join(root, 'public', chunk.url ?? '');
    if (!chunk.gzip || !fs.existsSync(gz)) {
      fail(`anatomy chunk ${i} has no gzipped file at ${chunk.gzip} — the loader fetches only that one`);
    }
    if (fs.existsSync(raw)) {
      fail(`anatomy chunk ${i} still ships the uncompressed ${chunk.url} beside its .gz — the same triangles twice, and 57 MB of the upload budget`);
    }
  }
}

// -- Report ------------------------------------------------------------------

const rows = [...perTop.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
const w = Math.max(...rows.map(([k]) => k.length));
console.log('\n  what a `vercel deploy` would upload\n');
for (const [k, v] of rows) {
  console.log(`  ${k.padEnd(w)}  ${(v / 1024 / 1024).toFixed(1).padStart(7)} MB`);
}
console.log(`\n  ${files} files, ${mb.toFixed(1)} MB, budget ${UPLOAD_BUDGET_MB} MB (Vercel Hobby refuses above 100 MB)\n`);

if (mb > UPLOAD_BUDGET_MB) {
  fail(`the upload is ${mb.toFixed(1)} MB, over the ${UPLOAD_BUDGET_MB} MB budget — add what grew to scripts/deploy-excludes.mjs, or take it out of the repo`);
}

if (failures.length) {
  console.error(`${failures.length} problem(s):\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error('');
  process.exit(1);
}
console.log('  deploy size OK\n');
