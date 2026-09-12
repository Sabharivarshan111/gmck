// Print every ad script as prose, from the source the renderer actually uses.
//
// ## Why this exists instead of a document
//
// `.agents/video/AD-SCRIPTS.md` held the scripts written out by hand. It was
// accurate on the day it was written and then described three ads while the
// repo grew to twenty-nine, prescribed three voices where there is now one,
// and — worst — carried a table headed "Claim you may use" listing "2,025
// questions", "5,545 questions" and "915 plates".
//
// Those are the exact statistics that were taken out of the ads twice, and
// the word "plates" is the one that leaked into a spoken line. A stale copy of
// a rule is not neutral: it is an instruction to undo the fix. `CLAUDE.md`
// says a distilled copy that has gone stale is worse than no copy, and this is
// what that looks like in practice.
//
// So the prose view is generated on demand and never stored. It cannot drift,
// because there is nothing to drift from.
//
//   npm run scripts:print              every ad
//   npm run scripts:print -- <id-part> just the ones whose id matches
import { ALL_SCRIPTS } from '../src/scripts/index.ts';

const filter = process.argv[2] ?? '';
const shown = ALL_SCRIPTS.filter(s => !filter || s.id.includes(filter));

if (shown.length === 0) {
  process.stderr.write(`No script id contains "${filter}".\n`);
  process.exit(1);
}

const wrap = (text, width, indent) => {
  const words = String(text).split(/\s+/);
  const out = [];
  let line = '';
  for (const w of words) {
    if (line && (line + ' ' + w).length > width) {
      out.push(line);
      line = w;
    } else {
      line = line ? line + ' ' + w : w;
    }
  }
  if (line) out.push(line);
  return out.map((l, i) => (i === 0 ? l : indent + l)).join('\n');
};

for (const script of shown) {
  const kind = script.format === 'reel' ? 'reel, 60s' : 'long form, 90s';
  process.stdout.write(`\n${'='.repeat(78)}\n`);
  process.stdout.write(`${script.title}\n`);
  process.stdout.write(`${script.id} — ${kind}`);
  if (script.look && script.look !== 'device') process.stdout.write(` — ${script.look} look`);
  process.stdout.write(`\n${script.voice ? `voice ${script.voice}` : 'no voice'}`);
  if (script.music) process.stdout.write(` · bed ${script.music.split('/').pop()}`);
  process.stdout.write(`\n${'='.repeat(78)}\n\n`);

  for (const shot of script.shots) {
    const where = shot.endCard
      ? 'END CARD'
      : shot.openCard
        ? 'OPEN CARD'
        : (shot.screen ?? 'no screen');
    process.stdout.write(`${String(shot.n).padStart(2)}. [${where}]\n`);
    if (shot.vo) process.stdout.write(`    spoken : ${wrap(shot.vo, 66, '             ')}\n`);
    if (shot.silentText) process.stdout.write(`    muted  : ${shot.silentText}\n`);
    else if (!shot.vo && shot.text) process.stdout.write(`    caption: ${shot.text}\n`);
    process.stdout.write('\n');
  }
}

const reels = shown.filter(s => s.format === 'reel').length;
process.stdout.write(
  `${shown.length} ad(s): ${reels} reel(s), ${shown.length - reels} long form. ` +
    'Generated from src/scripts/ — never edit a pasted copy of this.\n',
);
