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
/*
 * Every `screen` a shot names has to be a key in SCREENS.
 *
 * It did not, and the gap cost most of a render. `screenAsset()` throws
 * "Unknown screen" — a good error, raised at the worst possible moment: two
 * reels named `notes` where the registry calls that screen `userNotes`, and
 * the failure surfaced at **frame 975 of 1800**, after the assets job, after
 * eight other videos had rendered, in two jobs that had each been running for
 * minutes. Everything below already checks that a named FILE exists; nothing
 * checked that a named KEY does.
 *
 * The registry is TSX and this is plain Node, so the keys are read out of the
 * source rather than imported. That is a little crude and it is the whole
 * point: this must not need the renderer's toolchain to run.
 */
const registrySource = await fs.readFile(
  path.join(root, 'src', 'components', 'ScreenRegistry.tsx'),
  'utf8',
);
const registryBody = registrySource.slice(
  registrySource.indexOf('export const SCREENS'),
  registrySource.indexOf('export const screenAsset'),
);
const screenKeys = new Set(
  [...registryBody.matchAll(/^ {2}([A-Za-z][A-Za-z0-9]*):\s*\{/gm)].map((m) => m[1]),
);
for (const script of scripts) {
  for (const shot of script.shots) {
    if (shot.screen && !screenKeys.has(shot.screen)) {
      problems.push(
        `${script.id} shot ${shot.n} names screen "${shot.screen}", which is not in ` +
          `SCREENS — the render throws on the frame that first shows it`,
      );
    }
  }
}

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
 * A voiced reel shows the line it is speaking.
 *
 * The rule here used to be that the headline had to be a verbatim,
 * consecutive SPAN of the spoken line. It was written to fix a real bug — shot
 * one of "Already Asked" put "2,025 already asked" on screen while the voice
 * said "Your university repeats its questions" — and as a way of making a
 * caption agree with a voice it worked.
 *
 * What it could not do was leave the caption worth reading. A span of a
 * sentence is a fragment: measured across the reels, 264 of 385 voiced shots
 * showed less than three quarters of what was said and the worst showed a
 * fifth of it, so "Every day you studied, coloured in." reached the screen as
 * "coloured in".
 *
 * The caption is now the line itself, so agreement is structural rather than
 * checked — there is only one string. This asserts that, because the whole
 * point is that no later edit can quietly go back to showing a fragment.
 * Sync is unaffected: `ReelHeadline` lights each word as the Speech service
 * says it, and a longer caption simply has more words to light.
 * --------------------------------------------------------------------- */
{
  const timeline = await fs.readFile(
    path.join(root, 'src/components/ShotTimeline.tsx'),
    'utf8',
  );
  const code = timeline
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

  if (!/<ReelHeadline[\s\S]{0,200}?text=\{shot\.vo/.test(code)) {
    problems.push(
      'ShotTimeline no longer captions a voiced reel with `shot.vo`. The ' +
        'caption has to BE the spoken line; showing a span of it is how 264 ' +
        'of 385 shots ended up displaying a fragment of their own sentence.',
    );
  }
}
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

// ---- Every voiced ad ships in two cuts, and one list cannot know that ----
//
// The rule is simple: an ad with a voice is rendered twice, once with it and
// once without, because a reel is watched muted. It held for every reel and
// silently did not hold for the three 90-second launch ads — they were written
// before the silent cut existed, registered by hand as one `<Composition>`
// each, and listed by hand in the render matrix. Nothing compared the two
// hand-written lists to the rule, so 24 voiced ads shipped against 21 silent
// ones and the gap was only visible by counting the files in a release.
//
// Both lists are read as TEXT rather than imported. `Root.tsx` is JSX and the
// workflow is YAML; parsing them is the point, since the failure being caught
// is one list drifting from the other.
{
  const rootSource = await fs.readFile(path.join(root, 'src/Root.tsx'), 'utf8');
  const workflow = await fs.readFile(
    path.join(root, '..', '.github/workflows/ad-videos.yml'),
    'utf8',
  );

  const rendered = new Set(
    [...workflow.matchAll(/^\s*- ad:\s*(\S+)/gm)].map(m => m[1]),
  );

  const voiced = scripts.filter(s => !s.noVoice);

  for (const script of voiced) {
    for (const id of [script.id, `${script.id}-silent`]) {
      if (!rendered.has(id)) {
        problems.push(
          `${id} is never rendered — ad-videos.yml has no matrix entry for it. ` +
            'An ad with a voice ships in two cuts; the muted one is the cut ' +
            'most people watch.',
        );
      }
    }
  }

  // `withVoice` is how a cut used to be chosen, and it is why one edit was
  // serving two audiences with opposite clocks. A silent cut is a script now.
  if (/withVoice\s*[:=]/.test(rootSource.replace(/\/\*[\s\S]*?\*\//g, ' '))) {
    problems.push(
      'Root.tsx still passes `withVoice`. A silent cut is its own script — ' +
        'see scripts/silent.ts — not the same edit rendered with the sound off.',
    );
  }
}

// ---- The same budget, before anything is recorded -------------------------
//
// The measured check below is the truth, and it can only run in CI: the mp3s
// are synthesised there because the sandbox proxy blocks the speech host. That
// makes it a poor place to LEARN you have written too much — the render is
// already forty minutes in, and the person who wrote the line is gone.
//
// So the length is estimated here from the text, with a model fitted to the
// ninety real clips of this exact voice that the long-form ads measured:
//
//     seconds = 1.100 + 0.0339 x characters + 0.732 x punctuation marks
//
// R^2 0.57, median error 0.45s. Too rough to time an edit with, which is why
// it does not, and easily good enough to catch a reel holding seventy-three
// seconds of speech.
//
// The punctuation term is the one worth understanding before writing a line:
// every comma and full stop costs about three quarters of a second of pause.
// A list — "Medicine, Surgery, O and G, Paediatrics, ENT, Ophthal." — spends
// 4.4s of its 7.3s saying nothing at all. Lists are what made these reels
// overrun more than long words did.
{
  const { REEL_FRAMES: RF } = await import(
    pathToFileURL(path.join(root, 'src', 'scripts', 'types.ts')).href
  );
  const AIR = 0.3;
  const estimate = (vo) =>
    1.1 + 0.0339 * vo.length + 0.732 * (vo.match(/[.!?,;:—]/g) ?? []).length;

  for (const script of scripts) {
    if (script.format !== 'reel' || script.noVoice) continue;
    const spoken = script.shots.filter((s) => s.vo);
    const need = spoken.reduce((n, s) => n + estimate(s.vo) + AIR, 0);
    const budget = RF / 30;
    if (need > budget) {
      problems.push(
        `${script.id} is written with about ${need.toFixed(1)}s of speech for a ` +
          `${budget.toFixed(0)}s reel — roughly ${(need - budget).toFixed(1)}s too much ` +
          `across ${spoken.length} shots. Shorten the lines, or cut shots: ` +
          'commas and full stops cost ~0.7s each, so a list is the most ' +
          'expensive thing a line can contain.',
      );
    }
  }
}

// ---- A reel's speech has to fit inside the reel ---------------------------
//
// THE check this file was missing, and the one the bug needed.
//
// A comment in `ShotTimeline` asserted that "preflight still fails if a clip
// overruns by enough to talk over the next line". No such check existed
// anywhere. Meanwhile reels were cut to the music grid with the recordings
// never consulted, so measured against the real mp3s every one of the
// twenty-one held more speech than sixty seconds — between 57 and 73 seconds
// of it — and 235 individual shots ran past their slot. The surplus does not
// disappear: it plays under the next shot, whose own line has already started.
//
// `measure-audio` now gives every shot at least its own audio plus air, so a
// shot can never be shorter than its line. That moves the failure rather than
// removing it: the shots then sum past REEL_FRAMES, and a reel that is not
// sixty seconds is one Instagram trims the call to action off. So the reel has
// to be WRITTEN to fit, and this is what says so, in seconds, per script,
// before anything renders.
{
  const { REEL_FRAMES } = await import(
    pathToFileURL(path.join(root, 'src', 'scripts', 'types.ts')).href
  );
  const { VOICE_TIMINGS } = await import(
    pathToFileURL(path.join(root, 'src', 'generated', 'voiceTimings.ts')).href
  );

  for (const script of scripts) {
    if (script.format !== 'reel' || script.noVoice) continue;
    const lines = VOICE_TIMINGS[script.id];
    if (!lines) continue;

    const REEL_AIR_FRAMES = 9;
    let need = 0;
    for (const shot of script.shots) {
      const line = lines[shot.n];
      if (!line) continue;
      need += Math.ceil((line.audioMs / 1000) * 30) + REEL_AIR_FRAMES;
    }

    if (need > REEL_FRAMES) {
      const over = (need - REEL_FRAMES) / 30;
      problems.push(
        `${script.id} holds ${(need / 30).toFixed(1)}s of speech and air in a ` +
          `${(REEL_FRAMES / 30).toFixed(1)}s reel — ${over.toFixed(1)}s too much. ` +
          'Shorten the `vo` lines. Nothing can absorb this: the shots cannot ' +
          'be squeezed without a line playing over the next one, and the reel ' +
          'cannot run long without the platform trimming the end off.',
      );
    }
  }
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
