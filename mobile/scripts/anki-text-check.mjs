// Anki text/CSV/TSV import regression check.
//
// "HTML import" in current Anki/AnkiDroid means HTML inside delimited text
// fields. This drives Orbit's shared parser with those exact shapes and also
// pins the Android bridge/UI wiring so a future APKG refactor cannot silently
// remove text support.
//
// Run: npm run check:anki-text
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const mobile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(mobile, '..');
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const bundled = await build({
  entryPoints: [path.join(repo, 'src/lib/ankiText.ts')],
  bundle: true,
  format: 'esm',
  write: false,
  platform: 'neutral',
});
const mod = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`
);

const htmlTsv = [
  '#separator:Tab',
  '#html:true',
  '#deck:Cardiology HTML',
  '#tags:medicine imported',
  '#columns:Front\tBack\tTags',
  '<b>Most common cause</b> of MI?\t<div>Atherosclerotic plaque<br>rupture &amp; thrombosis</div>\tcardio',
  'Identify this vessel <img src="aorta.jpg">\t<b>Aorta</b>\tanatomy',
  '',
].join('\n');

const parsed = mod.parseAnkiText(htmlTsv, 'cardiology.txt');
check(parsed.cards.length === 2, `HTML TSV should make 2 cards, got ${parsed.cards.length}`);
check(parsed.deckName === 'Cardiology HTML', `#deck was lost: ${parsed.deckName}`);
check(parsed.html === true, '#html:true was not honoured');
check(parsed.separator === 'tab', `tab separator reported as ${parsed.separator}`);
check(
  parsed.cards[0]?.front === 'Most common cause of MI?',
  `front HTML was not flattened safely: ${JSON.stringify(parsed.cards[0]?.front)}`,
);
check(
  parsed.cards[0]?.back === 'Atherosclerotic plaque\nrupture & thrombosis',
  `back HTML/entities were not flattened: ${JSON.stringify(parsed.cards[0]?.back)}`,
);
check(parsed.cards[0]?.tags.includes('medicine') && parsed.cards[0]?.tags.includes('cardio'), 'default + row tags did not merge');
check(parsed.missingMedia.includes('aorta.jpg'), 'HTML image reference was not detected');
check(parsed.cards[1]?.frontMedia.length === 0, 'text import attached media bytes it does not possess');
check(/media reference/i.test(parsed.warnings[0] ?? ''), 'missing text-export media is not explained');

const csv = [
  '#separator:Comma',
  '#html:true',
  '#columns:Front,Back',
  '"Question with, comma","Line one',
  'Line two"',
  '"2 + 2?","<strong>4</strong>"',
].join('\n');
const parsedCsv = mod.parseAnkiText(csv, 'quoted.csv');
check(parsedCsv.cards.length === 2, `quoted CSV should make 2 cards, got ${parsedCsv.cards.length}`);
check(parsedCsv.cards[0]?.front === 'Question with, comma', 'quoted comma split the front field');
check(parsedCsv.cards[0]?.back === 'Line one\nLine two', 'quoted multiline field was not preserved');
check(parsedCsv.cards[1]?.back === '4', 'CSV HTML field was not flattened');

const literal = [
  '#separator:Tab',
  '#html:false',
  '<b>literal</b>\t<i>also literal</i>',
].join('\n');
const parsedLiteral = mod.parseAnkiText(literal, 'literal.tsv');
check(parsedLiteral.cards[0]?.front === '<b>literal</b>', '#html:false should preserve literal markup');
check(parsedLiteral.cards[0]?.back === '<i>also literal</i>', '#html:false changed the answer');

const cloze = [
  '#separator:Tab',
  '#html:true',
  '#notetype:Cloze',
  '#columns:Text\tExtra',
  'The {{c1::<b>SA node</b>}} is the pacemaker.\tNormal physiology',
].join('\n');
const parsedCloze = mod.parseAnkiText(cloze, 'cloze.txt');
check(parsedCloze.cards.length === 1, `cloze export should make 1 card, got ${parsedCloze.cards.length}`);
check(/\[\.\.\.\]/.test(parsedCloze.cards[0]?.front ?? ''), 'cloze question did not hide c1');
check(/SA node/.test(parsedCloze.cards[0]?.back ?? ''), 'cloze answer did not reveal c1');
check(/Normal physiology/.test(parsedCloze.cards[0]?.back ?? ''), 'cloze extra field was lost');

// Current Anki exports can route special fields with one-based "column:N"
// directives, and one file can mix built-in note types. This mirrors the shape
// of a real public Anki import sample that CI downloads below independently.
const mixed = [
  '#separator:Tab',
  '#html:true',
  '#columns:Front\tBack\tExtra\tNote Type\tDeck\tTags\tGUID',
  '#notetype column:4',
  '#deck column:5',
  '#tags column:6',
  '#guid column:7',
  'What starts normal cardiac conduction?\tSA node\t<em>Right atrium</em>\tBasic\tMedicine::Cardiology\tcardio conduction\tg1',
  'Largest artery?\tAorta\tSystemic outflow\tBasic (and reversed card)\tMedicine::Cardiology\tanatomy\tg2',
  '{{c1::Insulin}} lowers {{c2::blood glucose}}.\tEndocrine\tTwo clozes\tCloze\tMedicine::Endocrine\thormones\tg3',
].join('\n');
const parsedMixed = mod.parseAnkiText(mixed, 'mixed.txt');
check(parsedMixed.cards.length === 5, `mixed notetypes should make 5 cards, got ${parsedMixed.cards.length}`);
check(
  parsedMixed.cards.filter(card => card.deck === 'Medicine::Cardiology').length === 3,
  '#deck column did not route Basic + reversed cards',
);
check(
  parsedMixed.cards.filter(card => card.deck === 'Medicine::Endocrine').length === 2,
  '#deck column did not route Cloze cards',
);
check(
  parsedMixed.cards.some(card => card.id.endsWith('-rev') && /Aorta/.test(card.front)),
  'built-in reversed note did not make a reverse card',
);
check(parsedMixed.cards.some(card => card.id.endsWith('-c1')), 'mixed Cloze row did not make c1');
check(parsedMixed.cards.some(card => card.id.endsWith('-c2')), 'mixed Cloze row did not make c2');
check(!parsedMixed.cards.some(card => /Basic|Cloze/.test(card.back)), 'notetype metadata leaked into card answers');
check(!parsedMixed.cards.some(card => /g[123]/.test(card.back)), 'GUID metadata leaked into card answers');

// Optional real-world fixture. CI downloads this from a pinned public commit so
// the parser is checked against a file Orbit did not generate itself.
const externalSample = process.env.ANKI_EXTERNAL_SAMPLE;
if (externalSample) {
  const externalText = fs.readFileSync(externalSample, 'utf8');
  const external = mod.parseAnkiText(externalText, path.basename(externalSample));
  check(external.cards.length === 6, `real Anki sample should render 6 cards, got ${external.cards.length}`);
  const deckCounts = new Map();
  for (const card of external.cards) {
    deckCounts.set(card.deck, (deckCounts.get(card.deck) ?? 0) + 1);
  }
  check(deckCounts.size === 2, `real Anki sample should contain 2 decks, got ${deckCounts.size}`);
  check([...deckCounts.values()].every(count => count === 3), 'real Anki sample deck routing/reversed/cloze counts drifted');
  check(external.cards.some(card => card.id.endsWith('-rev')), 'real Anki sample lost its reversed card');
  check(external.cards.some(card => card.id.endsWith('-c1')), 'real Anki sample lost cloze c1');
  check(external.cards.some(card => card.id.endsWith('-c2')), 'real Anki sample lost cloze c2');
}


let htmlRejected = false;
try {
  mod.parseAnkiText('<html><body>not a deck</body></html>', 'deck.html');
} catch (error) {
  htmlRejected = error?.code === 'standaloneHtml' && /HTML inside/i.test(error.message);
}
check(htmlRejected, 'standalone .html was incorrectly accepted as an Anki deck');

const imported = fs.readFileSync(path.join(mobile, 'src/lib/importedDecks.ts'), 'utf8');
const nativeSpec = fs.readFileSync(path.join(mobile, 'src/native/NativeOrbitApkg.ts'), 'utf8');
const kotlin = fs.readFileSync(
  path.join(mobile, 'android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd/ApkgModule.kt'),
  'utf8',
);
const screen = fs.readFileSync(path.join(mobile, 'src/screens/FlashcardsScreen.tsx'), 'utf8');
const web = fs.readFileSync(path.join(repo, 'src/components/flashcards/FlashcardsHub.tsx'), 'utf8');

check(/parseAnkiText/.test(imported) && /\(txt\|csv\|tsv\)/.test(imported), 'native import path is not wired to the shared text parser');
check(/readText\(path: string\)/.test(nativeSpec), 'TurboModule spec has no UTF-8 text reader');
check(/override fun readText/.test(kotlin) && /MAX_TEXT_BYTES/.test(kotlin), 'Kotlin text reader or safety limit is missing');
check(/\.txt \/ \.csv/.test(screen) && /HTML is not a deck file/.test(screen), 'native picker does not explain text/HTML support');
check(/importTextDeck/.test(web) && /\.txt,\.csv,\.tsv/.test(web), 'web picker does not accept text exports');
check(/MAX_IMPORT_CARDS = 50_?000/.test(fs.readFileSync(path.join(repo, 'src/lib/importedDecksWeb.ts'), 'utf8')), 'web/native import caps drifted');

if (failures.length) {
  process.stderr.write(`FAIL anki text import (${failures.length})\n- ${failures.join('\n- ')}\n`);
  process.exit(1);
}
process.stdout.write(
  'OK   Anki text import: TSV/CSV, quoted multiline fields, HTML flattening, mixed note types,\n' +
    '     column directives, cloze/reverse, media warning, standalone-HTML rejection and wiring\n',
);
