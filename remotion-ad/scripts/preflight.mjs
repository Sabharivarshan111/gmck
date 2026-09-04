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
