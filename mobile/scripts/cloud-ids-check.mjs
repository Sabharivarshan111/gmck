// A row created locally must adopt the id the database gave it.
//
// calendar_events.id and user_notes.id are `uuid` columns with a
// gen_random_uuid() default, so the database always mints its own. A hook that
// inserts without `.select()` never learns that id, and the row now has two:
// the local `cal_…`/`note_…` one it made up, and the uuid in the database.
//
// Nothing looks wrong at that point. It goes wrong afterwards:
//
//   • update .eq("id", "cal_17...")  matches nothing — the edit is local-only
//   • delete .eq("id", "cal_17...")  matches nothing — the row survives, and
//     the next refetch brings the "deleted" event back
//
// and both are invisible, because supabase-js *returns* errors rather than
// throwing them: a try/catch around the call never fires, and Postgres
// rejecting a non-uuid for a uuid column is discarded along with everything
// else.
//
// This is not something tsc, eslint or check:smoke can see — the preview has
// no signed-in Supabase session, so the whole cloud path is skipped there.
//
//   node scripts/cloud-ids-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const check = (ok, message) => {
  if (!ok) {
    failures.push(message);
  }
};
const strip = text =>
  text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');

/** Hooks that write rows the database keys by uuid. */
const HOOKS = [
  { file: 'src/hooks/useCalendarEvents.ts', table: 'calendar_events', prefix: 'cal_' },
];

/**
 * Things that must never reach a server, and the file that decides.
 *
 * Personal study notes are on-device only — the app owner's decision, and the
 * whole point of the feature: a ward-round scribble or a photograph of somebody
 * else's textbook is not this app's to keep a copy of. `useUserNotes` used to
 * be in HOOKS above, syncing to `user_notes`; it is here now because "we do not
 * upload this" is only true for as long as somebody keeps it true, and a rule
 * that lives in a chat message is a rule that lasts one session.
 *
 * The pictures follow the note: `lib/noteImages` keeps each one under its own
 * AsyncStorage key and must not learn to upload either.
 */
const LOCAL_ONLY = [
  { file: 'src/hooks/useUserNotes.ts', what: 'personal study notes' },
  { file: 'src/lib/noteImages.ts', what: 'pictures attached to a study note' },
];

for (const { file, what } of LOCAL_ONLY) {
  const raw = await fs.readFile(path.join(root, file), 'utf8').catch(() => null);
  if (raw === null) {
    check(false, `${file} is missing`);
    continue;
  }
  const body = strip(raw);
  check(
    !/from\s*\(\s*["'`]/.test(body) && !/supabase\s*\./.test(body),
    `${file} talks to Supabase, but ${what} are on-device only. Nothing here may ` +
      `read, write or upload — see the note at the top of the file.`,
  );
  check(
    !/storage\s*\.\s*from/.test(body),
    `${file} uploads to Supabase Storage, but ${what} are on-device only.`,
  );
}

for (const { file, table, prefix } of HOOKS) {
  const raw = await fs.readFile(path.join(root, file), 'utf8').catch(() => null);
  if (raw === null) {
    check(false, `${file} is missing`);
    continue;
  }
  const body = strip(raw);

  // It may mint a local id — that is how an offline row exists at all — but it
  // must then adopt the real one.
  if (body.includes(`\`${prefix}`)) {
    check(
      /\.insert\([\s\S]*?\)\s*\.select\(/.test(body),
      `${file} inserts into ${table} without .select(), so the row keeps its local ${prefix}… id and the cloud copy is unreachable`,
    );
    check(
      /isCloudId/.test(body),
      `${file} has no guard for locally-created ids — an update or delete would send ${prefix}… to a uuid column`,
    );
    check(
      /if \(userId && isCloudId\(id\)\)/.test(body),
      `${file} does not gate its cloud update/delete on the id being one the database issued`,
    );
  }

  // supabase-js resolves with { error }. A try/catch around it is a comment
  // that looks like error handling.
  check(
    !/try\s*\{\s*await supabase/.test(body),
    `${file} wraps a supabase call in try/catch; supabase-js returns errors rather than throwing, so that block never runs`,
  );
}

if (failures.length > 0) {
  for (const failure of failures) {
    process.stdout.write(`  FAIL  ${failure}\n`);
  }
  process.stdout.write(`\n${failures.length} problem(s) — cloud rows would drift from local ones.\n`);
  process.exit(1);
}
process.stdout.write('OK  locally-created rows adopt their database id before any cloud write\n');
