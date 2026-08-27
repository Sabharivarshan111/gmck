// The chapter list promises a deck size before the deck exists.
//
// `TopicsView` renders `deckTargetFor(topic.questions.length)` cards under each
// chapter. The reader taps it, and `generate-flashcards` decides — on a server,
// from its own constants — how many cards to actually build. Those are two
// implementations of one number, in two languages, in two places, and only one
// of them is on the phone.
//
// When they disagree the reader is the one who finds out: a chapter advertised
// as 15 questions opened as an 11-card deck, and there was no way to tell
// whether cards had failed to generate, failed to load, or never existed.
//
// So this asserts the two agree — the constants, and the formula that combines
// them. It reads the edge function from `supabase/functions/`, which is the
// deployed source: the repo's copy of an edge function has gone stale before
// (the notes function was two versions behind for weeks, and reading it agreed
// with a bug), so the file being checked is the file being deployed.
//
//   node scripts/flashcard-size-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLIENT = 'mobile/src/lib/flashcards.ts';
const SERVER = 'supabase/functions/generate-flashcards/index.ts';

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

const read = file => fs.readFile(path.join(root, file), 'utf8');

const client = await read(CLIENT).catch(() => null);
const server = await read(SERVER).catch(() => null);

check(client !== null, `${CLIENT} is missing — the chapter list has no deck size to show`);
check(server !== null, `${SERVER} is missing — the repo no longer carries the deployed function`);

if (client && server) {
  const num = (body, name) => {
    const match = body.match(new RegExp(`${name}\\s*=\\s*(\\d+(?:\\.\\d+)?)`));
    return match ? Number(match[1]) : null;
  };

  const pairs = [
    ['MIN_DECK_CARDS', 'MIN_CARDS', 'the floor — how small a deck is allowed to be'],
    ['MAX_DECK_CARDS', 'MAX_CARDS', 'the ceiling — how large a deck is allowed to be'],
    ['CARDS_PER_QUESTION', 'CARDS_PER_QUESTION', 'cards per exam question'],
  ];

  for (const [clientName, serverName, what] of pairs) {
    const a = num(client, clientName);
    const b = num(server, serverName);
    check(a !== null, `${CLIENT} no longer defines ${clientName}`);
    check(b !== null, `${SERVER} no longer defines ${serverName}`);
    check(
      a !== null && b !== null && a === b,
      `${what}: ${clientName} is ${a} but ${serverName} is ${b}. ` +
        `The chapter list would promise ${a} cards and the server would build ${b}.`,
    );
  }

  // The formula, not just the numbers. Same shape both sides:
  //   max(MIN, min(MAX, questionCount))
  check(
    /Math\.max\(\s*MIN_DECK_CARDS\s*,\s*Math\.min\(\s*MAX_DECK_CARDS\s*,\s*wanted\s*\)\s*\)/.test(client) &&
      /Math\.round\(\s*questionCount\s*\*\s*CARDS_PER_QUESTION\s*\)/.test(client),
    `${CLIENT}: deckTargetFor is no longer clamp(MIN, MAX, round(questions * CARDS_PER_QUESTION))`,
  );
  check(
    /Math\.max\(\s*MIN_CARDS\s*,\s*Math\.min\(\s*MAX_CARDS\s*,\s*Math\.round\(\s*questions\.length\s*\*\s*CARDS_PER_QUESTION\s*\)\s*\)\s*\)/.test(
      server,
    ),
    `${SERVER}: target is no longer clamp(MIN, MAX, round(questions.length * CARDS_PER_QUESTION))`,
  );

  // Images are a ceiling, never a quota: theory has to make up the difference,
  // or a chapter with two diagrams builds a two-card deck.
  check(
    /const\s+wantTheory\s*=\s*target\s*-\s*selectedDiagrams\.length/.test(server),
    `${SERVER}: theory no longer fills the space images did not use, so a ` +
      `chapter with few diagrams will build a short deck`,
  );

  // The client may send `limit`, and the server reads `limit ?? <floor>` — so a
  // limit the client invents *replaces* the floor instead of being clamped by
  // it. This has already happened once: a `Math.max(10, questions.length)` here
  // rebuilt exactly the undersized decks the floor exists to prevent, and
  // nothing failed. Whatever is sent has to come from deckTargetFor.
  const limitLine = /limit:\s*([^,\n]+)/.exec(client);
  if (limitLine) {
    check(
      /deckTargetFor\(/.test(limitLine[1]),
      `${CLIENT} sends limit: ${limitLine[1].trim()} — a limit that is not ` +
        `deckTargetFor(...) overrides the 20-card floor on the server`,
    );
  }

  // A cached deck smaller than the floor is a deck built by an older version.
  // Serving it is how a stale row outlives the fix that replaced it.
  check(
    /cached\.cards\.length\s*>=\s*target/.test(server),
    `${SERVER}: a cached deck built before the sizing algorithm is served even ` +
      `when it is smaller than today's target — that is how a 44-card deck ` +
      `outlived a move to 50`,
  );

  // ...but "too small, rebuild it" without an escape hatch is a Gemini call on
  // every open, for ever, for any chapter that cannot reach the floor. The
  // `card_count` marker is what makes the rebuild happen once instead.
  check(
    /builtByThisVersion/.test(server) && /deck_target:\s*target/.test(server),
    `${SERVER}: nothing marks a row as built by the current sizing algorithm, ` +
      `so either a stale deck is served for ever or a short one regenerates on ` +
      `every open. It must be deck_target — card_count predates the algorithm ` +
      `and every legacy row already has one.`,
  );
}

if (failures.length > 0) {
  for (const failure of failures) {
    process.stdout.write(`  FAIL  ${failure}\n`);
  }
  process.stdout.write(
    `\n${failures.length} problem(s) — the chapter list and the server disagree about deck size.\n`,
  );
  process.exit(1);
}

process.stdout.write(
  'OK  client and server agree on deck size; theory fills for missing diagrams; stale decks rebuild\n',
);
