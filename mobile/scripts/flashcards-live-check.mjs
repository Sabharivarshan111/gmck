// Generates one real flashcard deck against the live project, and reports what
// came back.
//
// This exists because the development sandboxes cannot reach Supabase — the
// egress gateway refuses CONNECT — so `generate-flashcards` shipped with its
// Gemini half never once executed. A GitHub runner has open network, which
// makes this the only place the function can actually be exercised.
//
// No secrets. The anon key is a public client key already inside the APK and
// the web bundle. Do NOT add a service-role key here: it bypasses RLS, and this
// check is meant to run as an ordinary client does.
//
//   node scripts/flashcards-live-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const client = await fs.readFile(path.join(root, 'src/lib/supabase.ts'), 'utf8');
const url = client.match(/SUPABASE_URL\s*=\s*'([^']+)'/)?.[1];
const anon = client.match(/SUPABASE_ANON_KEY\s*=\s*'([^']+)'/)?.[1];
if (!url || !anon) {
  process.stdout.write('  FAIL  could not read the project URL and anon key from src/lib/supabase.ts\n');
  process.exit(1);
}

// A chapter that is known to have both plenty of questions and plenty of
// diagrams, so the half-and-half mix is actually exercised.
const bank = await fs.readFile(path.join(root, '..', 'src/data/topics/communityMedicine.ts'), 'utf8');
const at = bank.indexOf('"epidemiology-of-communicable-diseases"');
const questions = [...bank.slice(at, at + 60000).matchAll(/^\s{14,}"(\d+\.[^"]+)"/gm)]
  .map(m => m[1])
  .slice(0, 60);

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

process.stdout.write(`sending ${questions.length} questions…\n`);
const started = Date.now();
const res = await fetch(`${url}/functions/v1/generate-flashcards`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', apikey: anon, Authorization: `Bearer ${anon}` },
  body: JSON.stringify({
    year: 'Third Year',
    subject: 'Community Medicine',
    subtopicKey: 'epidemiology-of-communicable-diseases',
    subtopicName: 'Epidemiology of Communicable Diseases',
    questions,
    // Always rebuild: a cache hit would prove only that a row exists, which is
    // the one thing that is not in doubt.
    regenerate: true,
    limit: 12,
  }),
});
const took = Math.round((Date.now() - started) / 1000);
const body = await res.json().catch(() => null);
process.stdout.write(`HTTP ${res.status} in ${took}s\n`);

if (res.status === 429) {
  process.stdout.write(`\nQUOTA: ${body?.error}\nNot a failure — the free tier is the binding constraint.\n`);
  process.exit(0);
}
check(res.ok, `the function returned ${res.status}: ${JSON.stringify(body?.error ?? body).slice(0, 300)}`);

const cards = Array.isArray(body?.cards) ? body.cards : [];
check(cards.length > 0, 'no cards came back');

const theory = cards.filter(c => c.kind === 'theory');
const images = cards.filter(c => c.kind === 'image');
process.stdout.write(`cards: ${cards.length} (${theory.length} theory, ${images.length} image)\n`);

check(theory.length > 0, 'the deck has no theory cards — the Gemini half produced nothing usable');
check(images.length > 0, 'the deck has no image cards — the question_diagrams half found nothing');

// Every card must be answerable.
for (const card of theory) {
  check(
    typeof card.front === 'string' && card.front.trim().length > 2,
    `a theory card has no front: ${JSON.stringify(card).slice(0, 120)}`,
  );
  check(
    typeof card.back === 'string' && card.back.trim().length > 1,
    `a theory card has no back: ${JSON.stringify(card).slice(0, 120)}`,
  );
}
for (const card of images) {
  check(
    typeof card.imageUrl === 'string' && card.imageUrl.startsWith('http'),
    `an image card has no picture: ${JSON.stringify(card).slice(0, 120)}`,
  );
}

// The same diagram three times in one sitting is what the dedupe prevents.
const urls = images.map(c => c.imageUrl);
check(
  new Set(urls).size === urls.length,
  `image cards repeat a diagram: ${urls.length} cards, ${new Set(urls).size} distinct pictures`,
);

// One fact per card. A paragraph-length back means the prompt is not landing,
// and it is the difference between a flashcard and a page of notes.
const words = b => b.trim().split(/\s+/).length;
const long = theory.filter(c => words(c.back) > 40);
check(
  long.length === 0,
  `${long.length} of ${theory.length} theory backs are over 40 words — the "one fact per card" rule is not landing. Longest: "${
    long.sort((a, b) => words(b.back) - words(a.back))[0]?.back.slice(0, 160)
  }…"`,
);

// A card whose answer is yes or no teaches nothing.
const binary = theory.filter(c => /^(yes|no)\b/i.test(c.back.trim()));
check(binary.length === 0, `${binary.length} cards have a yes/no answer`);

process.stdout.write('\n--- sample ---\n');
for (const card of cards.slice(0, 6)) {
  process.stdout.write(
    `[${card.kind}] ${card.front.slice(0, 70)}\n    ${(card.back || `(diagram: ${card.imageUrl?.slice(-40)})`).slice(0, 90)}\n`,
  );
}

if (failures.length > 0) {
  process.stdout.write('\n');
  for (const failure of failures) {
    process.stdout.write(`  FAIL  ${failure}\n`);
  }
  process.stdout.write(`\n${failures.length} problem(s) with the generated deck.\n`);
  process.exit(1);
}
process.stdout.write(`\nOK  ${cards.length} cards, ${theory.length} theory and ${images.length} image, all answerable and distinct\n`);
