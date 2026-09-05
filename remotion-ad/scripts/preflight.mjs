// Refuse to render until every asset a script names actually exists.
//
// This exists because a previous cut shipped screens that had failed to load. A
// missing asset has to stop the build; it must never become a grey rectangle
// inside a finished ad.
//
// It now covers the voiceover too, which is the more dangerous half: a missing
// screenshot is a hole you can see, but a missing mp3 is a shot that plays in
// silence, and an ad with a silent shot looks finished. `staticFile()` on a
// path that does not exist does not stop a Remotion render.
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const problems = [];

// ---- Screens and plates --------------------------------------------------
const registry = await fs.readFile(
  path.join(root, 'src/components/ScreenRegistry.tsx'),
  'utf8',
);
const files = [...registry.matchAll(/file:\s*'([^']+)'/g)].map(m => m[1]);

/*
 * The assets named by PROPS, not by the registry — and this is the half that
 * was missing.
 *
 * `PristineAppScreen imageName="glass-progress.png"` and
 * `DiagramCardScreen plateImage="stomach_lymphatics_anatomy.jpg"` both resolve
 * to `app_screens/<name>` through `staticFile()`, exactly like a registry
 * entry, and the check above never looked at them. Seven files were named this
 * way and produced by nothing: two plates that were never downloaded and five
 * screens that were never captured or copied. Every one of them rendered as a
 * broken image in a finished, published advertisement, and nothing failed.
 *
 * Scanned across every component rather than just the registry, because the
 * prop can be written anywhere a shot is defined.
 */
const componentDir = path.join(root, 'src/components');
const propNamed = new Set();
for (const name of await fs.readdir(componentDir)) {
  if (!name.endsWith('.tsx')) continue;
  const body = await fs.readFile(path.join(componentDir, name), 'utf8');
  for (const [, asset] of body.matchAll(
    /(?:imageName|plateImage)=["']([^"'{}]+\.(?:png|jpg|jpeg|webp))["']/g,
  )) {
    propNamed.add(`app_screens/${asset}`);
  }
  // `staticFile('app_screens/…')` written out in full, which one shot does.
  for (const [, asset] of body.matchAll(
    /staticFile\(\s*['"`](app_screens\/[^'"`$]+)['"`]\s*\)/g,
  )) {
    propNamed.add(asset);
  }
}
files.push(...propNamed);

for (const rel of [...new Set(files)]) {
  const full = path.join(root, 'public', rel);
  try {
    const { size } = await fs.stat(full);
    // A black or empty PNG is the failure this is really looking for.
    if (size < 4000) {
      problems.push(`${rel} is only ${size} bytes — almost certainly a blank capture`);
    }
  } catch {
    problems.push(`${rel} is missing`);
  }
}

// ---- Voiceover -----------------------------------------------------------
//
// ShotTimeline builds the path by convention — `audio/<id>/shot_NN.mp3` — so
// this rebuilds it the same way from the scripts rather than trusting a list.
// Every script, from the one list that has them all.
//
// This used to name three imports of its own, and `voice-manifest.mjs` named
// the same three separately. Adding the reels made that concrete: they were
// registered as compositions and rendered, and NEITHER file knew they existed —
// so their voice clips were never synthesised and this check never noticed they
// were missing. A reel would have shipped silent, which is exactly the failure
// the audio checks below exist to prevent.
const { ALL_SCRIPTS: scripts } = await import(
  pathToFileURL(path.join(root, 'src', 'scripts', 'index.ts')).href
);
const { REEL_FRAMES, resolveShotFrames, framesPerBeat } = await import(
  pathToFileURL(path.join(root, 'src', 'scripts', 'types.ts')).href
);

// ---- The edit is the right length, and lands where it says it does --------
//
// Every reel is exactly 1800 frames because Instagram is the one holding the
// stopwatch: a 60.4-second reel loses its call to action to the trim, and a
// 59.6-second one ends on a cut. The comment in every reel script has claimed
// since they were written that preflight enforces this. It did not. It does
// now — that gap is exactly the kind of thing that stays true for months
// because everyone has read the sentence saying otherwise.
//
// For a beat-synced script it also checks the thing that makes it beat-synced:
// that every cut lands within half a frame of a beat. Rounding boundaries
// rather than durations is what keeps that true at a tempo whose beat is not a
// whole number of frames, and this is the assertion that the arithmetic did
// not drift.
for (const script of scripts) {
  if (script.format !== 'reel') {
    continue;
  }
  const frames = resolveShotFrames(script);
  const total = frames.reduce((a, b) => a + b, 0);
  if (total !== REEL_FRAMES) {
    problems.push(
      `${script.id} is ${total} frames, not ${REEL_FRAMES} — that is ` +
        `${((total - REEL_FRAMES) / 30).toFixed(2)}s off sixty seconds`,
    );
  }
  const short = frames.findIndex((f) => f < 1);
  if (short >= 0) {
    problems.push(`${script.id} shot ${script.shots[short].n} is ${frames[short]} frames long`);
  }

  if (script.bpm) {
    const perBeat = framesPerBeat(script.bpm);
    const offset = script.beatOffsetFrames ?? 0;
    let cursor = 0;
    for (let i = 0; i < frames.length; i += 1) {
      // The first cut is the start of the film and the last is its end;
      // neither is on the grid when a lead-in has been declared.
      if (i > 0) {
        const beats = (cursor - offset) / perBeat;
        if (Math.abs(beats - Math.round(beats)) * perBeat > 0.5) {
          problems.push(
            `${script.id} cuts to shot ${script.shots[i].n} at frame ${cursor}, ` +
              `which is ${((beats - Math.round(beats)) * perBeat).toFixed(2)} frames ` +
              `off the ${script.bpm}bpm grid`,
          );
        }
      }
      cursor += frames[i];
    }
    if (script.shots.some((shot) => shot.frames !== undefined)) {
      problems.push(
        `${script.id} declares a bpm AND raw frames on a shot — two answers to ` +
          'one question, and the beat grid would silently win',
      );
    }
  } else if (script.shots.some((shot) => shot.beats !== undefined)) {
    problems.push(`${script.id} gives a shot \`beats\` but the script has no \`bpm\``);
  }
}

// edge-tts writes a zero-byte mp3 when its socket is refused, so "the file is
// there" is not the question — "is there speech in it" is. Two seconds of
// speech is comfortably over 2KB.
const MIN_AUDIO_BYTES = 2000;
let clips = 0;

for (const script of scripts) {
  // A script with no spoken track has no clips to be missing. This is NOT the
  // `-silent` mix of a voiced reel — that one still has every mp3 and simply
  // does not play them. `noVoice` means the ad was written to be read.
  if (script.noVoice) {
    if (script.shots.some((shot) => shot.vo)) {
      problems.push(
        `${script.id} is marked noVoice but a shot still carries a \`vo\` line — ` +
          'it would never be recorded and never be heard',
      );
    }
    continue;
  }
  if (!script.voice) {
    problems.push(
      `${script.id} names no voice and is not marked \`noVoice\` — a forgotten ` +
        'voice and a deliberately silent ad must never look the same',
    );
    continue;
  }
  for (const shot of script.shots) {
    if (!shot.vo) {
      problems.push(`${script.id} shot ${shot.n} has no \`vo\` line, so it would play in silence`);
      continue;
    }
    const rel = `audio/${script.id}/shot_${String(shot.n).padStart(2, '0')}.mp3`;
    clips += 1;
    try {
      const { size } = await fs.stat(path.join(root, 'public', rel));
      if (size < MIN_AUDIO_BYTES) {
        problems.push(
          `${rel} is only ${size} bytes — a silent or truncated clip, so shot ` +
            `${shot.n} of ${script.id} would play with no voice`,
        );
      }
    } catch {
      problems.push(`${rel} is missing — shot ${shot.n} of ${script.id} would be silent`);
    }
  }
}

// ---- The music bed, for the cuts that have one --------------------------
//
// A silent reel has no voiceover by design, so the bed is the ONLY thing
// carrying it. A missing bed there is a sixty-second film with no sound at all.
for (const script of scripts) {
  if (!script.music) {
    continue;
  }
  try {
    const { size } = await fs.stat(path.join(root, 'public', script.music));
    if (size < MIN_AUDIO_BYTES) {
      problems.push(`${script.music} is only ${size} bytes — not a music bed`);
    }
  } catch {
    problems.push(
      `${script.music} is missing — ${script.id} has no music, and its silent ` +
        'cut would have no sound at all',
    );
  }
}

// ---- Has the spoken text drifted from the audio? -------------------------
//
// The clips are committed, so editing a line in a script leaves the old
// recording in place and the ad says something the caption does not. The
// manifest is written at synthesis time, so comparing it to the scripts as they
// are now is what catches that.
try {
  const manifest = JSON.parse(
    await fs.readFile(path.join(root, 'public/audio/manifest.json'), 'utf8'),
  );
  for (const script of scripts) {
    if (script.noVoice) {
      continue;
    }
    const recorded = manifest.find(entry => entry.id === script.id);
    if (!recorded) {
      problems.push(`${script.id} has no entry in audio/manifest.json — never synthesised`);
      continue;
    }
    if (recorded.voice !== script.voice) {
      problems.push(
        `${script.id} was recorded with ${recorded.voice} but the script now ` +
          `asks for ${script.voice} — run \`npm run voice\``,
      );
    }
    for (const shot of script.shots) {
      const name = `shot_${String(shot.n).padStart(2, '0')}`;
      const line = recorded.lines.find(l => l.name === name);
      if (line && line.text !== shot.vo) {
        problems.push(
          `${script.id} ${name}: the recording says "${line.text}" but the ` +
            `script now says "${shot.vo}" — run \`npm run voice\``,
        );
      }
    }
  }
} catch {
  problems.push('public/audio/manifest.json is missing — the voiceover has never been synthesised');
}

/* ------------------------------------------------------------------------
 * No quantity may be shaped like a year.
 *
 * The bank's repeat-marker count was written on screen as "2,025", and the
 * app's owner watched the finished reels and asked what 2025 was doing in
 * them. They were right to: beside the words "the years asked", a four-digit
 * number with a comma in it is a year, and no amount of context rescues it at
 * two seconds a shot.
 *
 * It was also stale and counting the wrong thing, which is the usual pairing —
 * a number nobody can sanity-check by looking at it is a number that rots
 * quietly. So the rule is shape, not accuracy: any bare 19xx/20xx, and any
 * "1,xxx"/"2,xxx", is refused in anything the viewer reads or hears. Counts
 * that genuinely land in that range have to be written another way ("over
 * two thousand"), and a real year in a PYQ badge belongs in a screenshot,
 * not in the ad's own copy.
 * --------------------------------------------------------------------- */
const YEAR_SHAPED = /\b(?:19|20)\d{2}\b|\b[12],\d{3}\b/;

for (const script of scripts) {
  for (const shot of script.shots) {
    for (const [field, value] of [
      ['text', shot.text],
      ['vo', shot.vo],
      ['kicker', shot.kicker],
    ]) {
      if (value && YEAR_SHAPED.test(value)) {
        problems.push(
          `${script.id} shot ${shot.n}: \`${field}\` contains "${value}", and ` +
            'a four-digit number in that range reads as a year rather than as ' +
            'a count. Write it in words.',
        );
      }
    }
  }
}

/* ------------------------------------------------------------------------
 * A voiced reel's headline must be words the voice actually says.
 *
 * This is the rule that makes the reels synchronisable at all. The headline
 * and the voiceover used to be written independently: shot one of "Already
 * Asked" put "2,025 already asked" on screen while the voice said "Your
 * university repeats its questions". A viewer with the sound on read one
 * sentence and heard a different one, and no amount of timing work can fix
 * that — there is nothing to line the words up with.
 *
 * So the headline is a verbatim, consecutive span of the spoken line, and
 * `ReelHeadline` lights each of its words at the moment it is said. If this
 * check is failing, the fix is in the script: shorten the headline until it is
 * a phrase the line contains, rather than loosening the comparison.
 *
 * Comparison is on letters and digits only, so punctuation and case in either
 * place are free. A `noVoice` reel is exempt: its caption IS the argument and
 * there is no voice for it to agree with.
 * --------------------------------------------------------------------- */
const wordsOf = text =>
  String(text ?? '')
    .split(/\s+/)
    .map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(Boolean);

const isSpanOf = (span, line) => {
  const want = wordsOf(span);
  const said = wordsOf(line);
  if (want.length === 0) return true;
  for (let i = 0; i + want.length <= said.length; i += 1) {
    let hit = true;
    for (let k = 0; k < want.length; k += 1) {
      if (said[i + k] !== want[k]) {
        hit = false;
        break;
      }
    }
    if (hit) return true;
  }
  return false;
};

/* ------------------------------------------------------------------------
 * The muted cut needs a headline that stands on its own.
 *
 * `text` is a verbatim span of the spoken line, which is what keeps the voiced
 * cut in sync. A span of a sentence is usually a FRAGMENT, and the silent cut
 * renders the same string — so with the sound off,
 * `orbit-reel-guide-silent` read "The way examiners read", "Before you
 * forget", "Picture first": each the tail of a line nobody heard. The owner
 * reported it, and it was introduced by the fix for the previous complaint.
 *
 * The silent cut is the one most people watch, so it gets `silentText`: a
 * standalone claim, numerals allowed (a spoken line must spell numbers out;
 * a caption should not), written for somebody who will never hear a word.
 * Required on every shot of a voiced reel, because a missing one falls back to
 * the fragment and nothing on screen would say so.
 * --------------------------------------------------------------------- */
for (const script of scripts) {
  if (script.format !== 'reel' || script.noVoice) continue;
  for (const shot of script.shots) {
    if (!shot.silentText) {
      problems.push(
        `${script.id} shot ${shot.n} has no \`silentText\`, so its silent cut ` +
          `would show "${shot.text}" — a fragment of a line the muted viewer ` +
          'never hears',
      );
      continue;
    }
    if (YEAR_SHAPED.test(shot.silentText)) {
      problems.push(
        `${script.id} shot ${shot.n}: \`silentText\` contains "${shot.silentText}", ` +
          'and a four-digit number in that range reads as a year',
      );
    }
    const words = shot.silentText.trim().split(/\s+/).filter(Boolean).length;
    if (words > 6) {
      problems.push(
        `${script.id} shot ${shot.n}: \`silentText\` is ${words} words. A reel ` +
          'headline is read in under a second — keep it to six.',
      );
    }
  }
}

for (const script of scripts) {
  if (script.format !== 'reel' || script.noVoice) continue;
  for (const shot of script.shots) {
    if (!shot.text) continue;
    if (!isSpanOf(shot.text, shot.vo)) {
      problems.push(
        `${script.id} shot ${shot.n}: the headline "${shot.text}" is not a ` +
          `phrase inside the spoken line "${shot.vo}" — the viewer would read ` +
          'one thing and hear another',
      );
    }
  }
}

/* ------------------------------------------------------------------------
 * The word timings have to be the ones for THESE lines.
 *
 * `src/generated/voiceTimings.ts` is what the captions read to know when each
 * word is spoken, and `src/dynamicScriptTimings.ts` is what paces the
 * long-form ads. Both are written by `scripts/measure-audio.mjs` from the
 * recordings, and the copy committed to the repo is deliberately empty.
 *
 * The failure this prevents is the one that produced the reported desync:
 * `dynamicScriptTimings.ts` was a hand-maintained file that nothing
 * regenerated, so CI recorded new lines and then laid them out on boundaries
 * measured from an older script. Because the shots run end to end, one line
 * that grew pushed every later shot out of step with its own audio, and the
 * error accumulated over the whole ninety seconds with nothing failing.
 * --------------------------------------------------------------------- */
try {
  const { VOICE_TIMINGS } = await import(
    pathToFileURL(path.join(root, 'src', 'generated', 'voiceTimings.ts')).href
  );
  const { DYNAMIC_SCRIPT_TIMINGS } = await import(
    pathToFileURL(path.join(root, 'src', 'dynamicScriptTimings.ts')).href
  );

  for (const script of scripts) {
    if (script.noVoice) continue;

    const measured = VOICE_TIMINGS[script.id];
    if (!measured || Object.keys(measured).length === 0) {
      problems.push(
        `${script.id} has no word timings — run \`npm run voice\`, which now ` +
          'measures the recordings it just made. Without them every caption ' +
          'falls back to spreading its line evenly across the shot, which is ' +
          'the desync this replaced.',
      );
      continue;
    }

    for (const shot of script.shots) {
      const line = measured[shot.n];
      if (!line) {
        problems.push(`${script.id} shot ${shot.n} has no word timing`);
      } else if (line.vo !== shot.vo) {
        problems.push(
          `${script.id} shot ${shot.n}: the timings were measured from ` +
            `"${line.vo}" but the script now says "${shot.vo}" — run ` +
            '`npm run voice`',
        );
      } else if (!Array.isArray(line.words) || line.words.length === 0) {
        problems.push(
          `${script.id} shot ${shot.n} was measured but carries no word ` +
            'boundaries, so its caption cannot be synchronised',
        );
      }
    }

    // The long-form ads are paced by these numbers, so a stale row there moves
    // every later shot, not just its own.
    if (script.format !== 'reel') {
      const table = DYNAMIC_SCRIPT_TIMINGS[script.id];
      if (!table) {
        problems.push(`${script.id} has no shot-boundary table — run \`npm run voice\``);
      } else {
        for (const shot of script.shots) {
          const row = table.shots.find(r => r.n === shot.n);
          if (!row) {
            problems.push(`${script.id} shot ${shot.n} is missing from the boundary table`);
          } else if (row.vo !== shot.vo) {
            problems.push(
              `${script.id} shot ${shot.n}: the shot is ${row.shotFrames} frames ` +
                `long because "${row.vo}" took that long to say, but the script ` +
                `now says "${shot.vo}" — every later shot is out of step too. ` +
                'Run `npm run voice`.',
            );
          }
        }
      }
    }
  }
} catch (err) {
  problems.push(
    `the timing tables could not be read (${err.message}) — run \`npm run voice\``,
  );
}

if (problems.length) {
  process.stdout.write('PREFLIGHT FAILED\n');
  for (const p of problems) process.stdout.write(`  - ${p}\n`);
  process.stdout.write(`\n${problems.length} asset problem(s). Fix these before rendering.\n`);
  process.exit(1);
}

process.stdout.write(
  `OK  ${new Set(files).size} screens and ${clips} voice clips present, ` +
    'and every clip matches the line the script now says\n',
);
