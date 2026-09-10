// The admin panel must never state something it did not read.
//
// Every fetch in `lib/admin.ts` used to swallow its error into a `warn()` and
// hand back an empty list or a null, and the panel rendered that as zeros. So
// three different situations produced one identical screen:
//
//   1. there is genuinely nothing yet
//   2. the RPC failed
//   3. this session is not an admin, and `where public.is_admin()` returned
//      NO ROWS rather than an error
//
// On a phone there is no console, so the only way to tell them apart was a log
// nobody could read. The textbook-pages section said "Nobody has entered a
// textbook page yet" in all three cases — a sentence about the data, when the
// truth was about the caller.
//
// This is the same shape as the sound module and the flashcard parser: a thing
// that is absent rather than broken, with nothing anywhere saying which.
//
//   node scripts/admin-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFile(path.join(root, file), 'utf8').catch(() => null);
/** Comments stripped: this file's prose names everything it forbids. */
const code = text =>
  (text ?? '').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

const lib = await read('src/lib/admin.ts');
const panel = await read('src/components/AdminPanel.tsx');
check(lib !== null, 'src/lib/admin.ts is missing');
check(panel !== null, 'src/components/AdminPanel.tsx is missing');

const libCode = code(lib);
const panelCode = code(panel);

// ---------------------------------------------------------------------------
// 1. Every read carries its own error.
// ---------------------------------------------------------------------------
check(
  /export interface AdminRead<T>/.test(libCode),
  'AdminRead is gone — a read that cannot report a failure will be rendered as an empty one',
);
for (const fn of ['listSubscribers', 'pageRefStats', 'listPageRefs']) {
  const signature = new RegExp(`export async function ${fn}[\\s\\S]{0,200}?Promise<AdminRead<`);
  check(signature.test(libCode), `${fn} no longer returns an AdminRead, so its failure is invisible`);
}

// ---------------------------------------------------------------------------
// 2. No row is not no data.
//
//    `admin_page_ref_stats` is `select ... where public.is_admin()` with no
//    FROM clause, so a non-admin gets zero rows and no error at all. Reading
//    that as "the table is empty" is the specific mistake this exists for.
// ---------------------------------------------------------------------------
check(
  /if \(!row\)[\s\S]{0,300}?failed\(/.test(libCode),
  'pageRefStats treats a missing row as empty data; a non-admin gets no row and no error',
);

// ---------------------------------------------------------------------------
// 3. The panel prints what it could not read.
// ---------------------------------------------------------------------------
check(/readErrors/.test(panelCode), 'the panel no longer tracks per-section read errors');
check(
  (panelCode.match(/Could not read the/g) ?? []).length >= 2,
  'fewer than two sections say when their read failed',
);

// ---------------------------------------------------------------------------
// 4. A number is only printed when it was read, and an emptiness sentence is
//    only printed when the read succeeded.
// ---------------------------------------------------------------------------
check(
  !/pageStats\?\.\w+ \?\? 0/.test(panelCode),
  'a page-ref stat still falls back to 0; "0" is a claim about the data and may only be made once it was read',
);
check(
  /pageStats \? String\(pageStats\.totalRefs\) : '—'/.test(panelCode),
  'the page-ref stats no longer show a dash when unread',
);
for (const [sentence, guard] of [
  ['Nobody has entered a textbook page yet', 'readErrors.pageRefs'],
  ['No purchases yet', 'readErrors.subscribers'],
]) {
  const at = panelCode.indexOf(sentence);
  check(at !== -1, `the "${sentence}" empty state is gone`);
  if (at !== -1) {
    // The guard has to be the thing that decides whether the sentence renders,
    // so it must appear in the branch immediately above it.
    const before = panelCode.slice(Math.max(0, at - 400), at);
    check(
      before.includes(guard),
      `"${sentence}" is printed without checking ${guard} — it would claim emptiness after a failed read`,
    );
  }
}

// ---------------------------------------------------------------------------
// 5. The filter chip says what it filters, not what mode it is in.
// ---------------------------------------------------------------------------
check(
  !/'Pending only' : 'All claims'/.test(panelCode),
  'the filter chip swaps its own label again — unhighlighted and reading "All claims" looks like a button that shows all claims, and does the opposite',
);

if (failures.length > 0) {
  console.error('admin check failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  'OK  every admin read carries its error, no row is not no data, and the panel never ' +
    'prints a number or an emptiness it did not read',
);
