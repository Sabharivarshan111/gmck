/**
 * An ad may not say something its own screenshot contradicts.
 *
 * This exists because of one frame the app's owner sent back: the caption read
 * **"General Medicine alone is 660"** over a screenshot of **Pathology → Cell
 * Injury**. Three things wrong in one shot — the subject was not the subject on
 * screen, the number did not match the number on screen (the real figure is
 * 680), and "660" had no unit at all.
 *
 * None of the existing checks could see it. `preflight` proves every screenshot
 * EXISTS; nothing proved a line belonged on the one it was given.
 *
 *   node scripts/ad-truth-check.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const { ALL_SCRIPTS } = await import(
  pathToFileURL(path.join(root, 'src', 'scripts', 'index.ts')).href
);

const problems = [];
const check = (ok, message) => {
  if (!ok) problems.push(message);
};

/*
 * What each screenshot ACTUALLY depicts, read off the real files.
 *
 * Only the screens whose content can contradict a line are listed. A screen
 * that shows the timer cannot really be wrong under a line about the timer;
 * a screen showing one YEAR's subjects can be very wrong indeed.
 */
const DEPICTS = {
  browse: { year: 'final', subjects: /General Medicine|Obstetric|Surgery|Paediatric|ENT|Ophthalmolog/i },
  browseFirst: { year: 'first' },
  browseSecond: { year: 'second' },
  browseThird: { year: 'third' },
  questionsLeaf: { subject: 'Pathology' },
};

/** Which year an ad is about, from its id. Null for the ads that span all four. */
const yearOf = (id) =>
  /first-year/.test(id) ? 'first'
  : /second-year/.test(id) ? 'second'
  : /third-year/.test(id) ? 'third'
  : /final-year/.test(id) ? 'final'
  : null;

const OTHER_SUBJECTS = /General Medicine|Forensic|Community Medicine|Anatomy|Physiolog|Biochem|Paediatric|Ophthalmolog/i;

for (const script of ALL_SCRIPTS) {
  const adYear = yearOf(script.id);

  for (const shot of script.shots) {
    const depicts = DEPICTS[shot.screen];
    const line = shot.vo ?? shot.text ?? '';
    if (!depicts || !line) continue;

    // 1. A year-specific ad must not show another year's subject list.
    check(
      !(depicts.year && adYear && depicts.year !== adYear),
      `${script.id} shot ${shot.n}: the screen is the ${depicts.year}-year subject ` +
        `list and this ad is about ${adYear} year. "${line}"`,
    );

    // 2. A line must not name a subject the screen is not showing.
    if (depicts.subject && OTHER_SUBJECTS.test(line)) {
      problems.push(
        `${script.id} shot ${shot.n}: the screen shows ${depicts.subject}, but the ` +
          `line names a different subject. "${line}"`,
      );
    }

    // 3. A number in a line must be a number on that screen.
    if (shot.screen === 'browse' && /six hundred and sixty|\b660\b/.test(line)) {
      problems.push(
        `${script.id} shot ${shot.n}: says 660, and that screen reads 680. "${line}"`,
      );
    }
  }
}

/*
 * ---- A reel is not a slideshow of one screenshot ------------------------
 *
 * The attendance reel held ONE screenshot for eight consecutive shots, about
 * thirty seconds, varying only which part of it was in frame. That reads as a
 * broken video rather than as a feature. Different data, not a different crop,
 * is what makes a second shot worth having.
 */
const MAX_TOTAL = 4;
const MAX_RUN = 3;
for (const script of ALL_SCRIPTS) {
  if (script.format !== 'reel') continue;

  const counts = new Map();
  let run = 1;
  script.shots.forEach((shot, i) => {
    if (!shot.screen) return;
    counts.set(shot.screen, (counts.get(shot.screen) ?? 0) + 1);
    if (i > 0 && shot.screen === script.shots[i - 1].screen) {
      run += 1;
      check(
        run <= MAX_RUN,
        `${script.id}: ${run} consecutive shots on "${shot.screen}". More than ` +
          `${MAX_RUN} in a row is a still image, whatever the focus is set to.`,
      );
    } else {
      run = 1;
    }
  });

  for (const [screen, n] of counts) {
    check(
      n <= MAX_TOTAL,
      `${script.id}: "${screen}" is used ${n} times. Past ${MAX_TOTAL} the reel ` +
        'stops looking like a tour of an app and starts looking like one screenshot.',
    );
  }
}

/*
 * ---- No line tells the viewer what their own life is --------------------
 *
 * "First year is a drawing exam" is the shape being banned: it performs an
 * insight about the audience rather than naming something they recognise. A
 * medical student does not need to be told what their year is, and being told
 * wrongly is worse. Write the moment, not the characterisation.
 */
for (const script of ALL_SCRIPTS) {
  for (const shot of script.shots) {
    const line = shot.vo ?? '';
    check(
      !/^(First|Second|Third|Final) year is\b/i.test(line),
      `${script.id} shot ${shot.n}: "${line}" tells the viewer what their year ` +
        'IS. Write a moment they would recognise instead.',
    );
  }
}

/*
 * ---- No digit reaches the screen, and no "plate" reaches the script --------
 *
 * ## The numbers
 *
 * The statistics came out of the SPOKEN lines once, on the owner's
 * instruction, and stayed in the captions — so a muted viewer, which is most
 * of them, still read "3,463 already asked", "5,634 questions" and "Four
 * years, 25 subjects" in the cut that gets watched more. That was fixed by
 * editing five files and adding nothing to stop it.
 *
 * It came back the next day, the moment a new set of scripts was written, and
 * nobody could have noticed: a caption is not compared to anything. A rule
 * that lives in a commit message lasts one session, which this repo has
 * written down in four other places and learned again here.
 *
 * So: no digit in anything a viewer reads or hears. A spoken line has to spell
 * its numbers out anyway or the synthesiser reads "25" as a year, and a
 * caption with a figure in it is a claim somebody has to be able to defend.
 * Write "twelve species" if it must be said at all.
 *
 * ## The word "plate"
 *
 * `plate` is this repo's internal word for the image file behind a diagram,
 * and it leaked into an ad: "A real labelled plate, not a stock drawing."
 * No medical student calls it that — they call it a diagram, which is also
 * what the app's own UI calls it. Screen KEYS like `plateBrachial` are fine;
 * they are never spoken.
 */
for (const script of ALL_SCRIPTS) {
  for (const shot of script.shots) {
    for (const [field, value] of [
      ['vo', shot.vo],
      ['text', shot.text],
      ['silentText', shot.silentText],
    ]) {
      if (!value) continue;
      const digit = String(value).match(/\d/);
      check(
        !digit,
        `${script.id} shot ${shot.n}: \`${field}\` is "${value}", which puts a ` +
          'figure on screen. Spell it out, or cut it — a number in an ad is a ' +
          'claim, and the muted cut is the one most people read.',
      );
      check(
        !/\bplates?\b/i.test(String(value)),
        `${script.id} shot ${shot.n}: \`${field}\` says "plate". Students call ` +
          'it a diagram, and so does the app. `plate` is our word for the file.',
      );
    }
  }
}

/* ---- And no ad repeats a line to itself -------------------------------- */
for (const script of ALL_SCRIPTS) {
  const seen = new Set();
  for (const shot of script.shots) {
    const line = shot.vo ?? '';
    if (!line) continue;
    check(!seen.has(line), `${script.id} shot ${shot.n} repeats an earlier line: "${line}"`);
    seen.add(line);
  }
}


/*
 * ---- The Google Play badge is the official artwork or it is not a badge ---
 *
 * Google's guidelines are explicit: do not modify the badge's colour,
 * proportions or spacing. A badge redrawn in CSS is a modified badge however
 * carefully it is done, so `EndCard` either draws the real PNG or prints plain
 * type that cannot be mistaken for one.
 *
 * The artwork is deliberately not committed — this sandbox cannot reach
 * play.google.com to fetch it, and inventing one is worse than shipping
 * without it. Drop the official file from the Play badge generator at
 * `public/google-play-badge.png` and flip HAS_PLAY_BADGE.
 */
{
  const endCard = await fs.readFile(path.join(root, 'src/components/EndCard.tsx'), 'utf8');
  const code = endCard.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');

  check(
    !/borderRadius[\s\S]{0,400}?(Google Play|GET IT ON)/i.test(code),
    'EndCard looks like it is DRAWING a Google Play badge. The badge may only ' +
      'be the official artwork — redrawing it modifies its colour, proportions ' +
      'or spacing, which the guidelines forbid.',
  );
  check(
    /staticFile\(PLAY_BADGE_FILE\)/.test(code),
    'EndCard no longer renders the official badge file when it is present.',
  );

  const badgePath = path.join(root, 'public', 'google-play-badge.png');
  const present = await fs.stat(badgePath).then(() => true).catch(() => false);
  const flagged = /HAS_PLAY_BADGE = true/.test(
    await fs.readFile(path.join(root, 'src/components/playBadge.ts'), 'utf8'),
  );
  check(
    present === flagged,
    present
      ? 'public/google-play-badge.png exists but HAS_PLAY_BADGE is false, so the ' +
        'end card still prints plain text instead of the badge.'
      : 'HAS_PLAY_BADGE is true but public/google-play-badge.png is missing — the ' +
        'end card would render a broken image where the badge should be.',
  );
}

if (problems.length > 0) {
  console.error('ad truth check failed:\n');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const reels = ALL_SCRIPTS.filter((s) => s.format === 'reel').length;
console.log(
  `OK  ${ALL_SCRIPTS.length} ads: every line matches the screenshot under it, no reel ` +
    `holds one screenshot more than ${MAX_TOTAL} times or ${MAX_RUN} in a row ` +
    `(${reels} reels), and nothing tells the viewer what their year is`,
);
