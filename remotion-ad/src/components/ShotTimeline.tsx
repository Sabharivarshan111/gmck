import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate, Easing } from 'remotion';
import { AuroraMeshBackground } from './AuroraMeshBackground';
import { LayeredCameraPhone } from './LayeredCameraPhone';
import { PlateCard } from './PlateCard';
import { KineticWordCaption } from './KineticWordCaption';
import { ReelHeadline } from './ReelHeadline';
import { BeatCaption, BeatRoom } from './BeatCaption';
import { MascotStage } from './MascotStage';
import type { BeatClock } from './beatGrid';
import { beatEnergy } from './beatGrid';
import { screenAsset } from './ScreenRegistry';
import { UserNotesMediaScreen, ThemeCustomizerScreen, OutroScreen } from './CustomAppScreens';
import type { AdScript, Shot } from '../scripts/types';
import { resolveShotFrames, framesPerBeat, scriptFrames } from '../scripts/types';
import { DYNAMIC_SCRIPT_TIMINGS, type ShotTiming } from '../dynamicScriptTimings';

const DEFAULT_ACCENT = '#7C5CFF';

/**
 * How much of the frame a reel gives the device, and how far up.
 *
 * These keep the phone clear of `CONTENT_FLOOR` — the line the caption band
 * can never be crossed above — and they are only ever passed for
 * `format: 'reel'`; the long-form ads pass nothing and frame exactly as they
 * always have.
 *
 * The arithmetic, because it is the kind that goes stale silently: at the
 * widest zoom this engine reaches (1.62, on a bottom-nav shot) the device is
 * 1,024 tall. At 0.86 and a lift of -70 its lower edge sat at ~1409, which was
 * correct against a ONE-LINE caption whose top edge was ~1465. The caption is
 * the whole spoken line now, wrapping to two lines or three, and its band top
 * is `CAPTION_TOP` — 1360. So the device drops 70 further to clear it.
 *
 * `check:reel-layout` recomputes this rather than trusting the paragraph
 * above, which is the only reason to believe it.
 */
const REEL_DEVICE_SCALE = 0.86;
const REEL_DEVICE_LIFT = -140;

/**
 * Music bed level, under a voice and on its own.
 *
 * The voiced cut ducks the bed to a sixth so it is felt rather than listened
 * to; the silent cut has nothing else to carry the film, so the bed comes up
 * to a level that reads as the soundtrack. These are two different mixes of
 * one composition, which is the point of shipping both.
 */
const BED_UNDER_VOICE = 0.16;
const BED_ALONE = 0.42;

interface ShotViewProps {
  shot: Shot;
  timing?: ShotTiming;
  voiceSrc: string | null;
  /** True for the silent cut: drop the aurora and sit the shot on black. */
  onBlack?: boolean;
  shotIndex: number;
  durationOverride?: number;
  reel?: boolean;
  /**
   * Present only on the beat-synced ads. When it is here the shot lights,
   * breathes and counts on the music's own grid; when it is not, nothing in
   * this file behaves any differently than it did before the beat cuts
   * existed.
   */
  clock?: BeatClock;
  /** Whole beats this shot holds for, for the counter under the caption. */
  beats?: number;
  /** Subtitle-led cut: the caption is the argument, so it replaces the headline. */
  subtitleLed?: boolean;
  /**
   * The script this shot belongs to, so a caption can look up when each of its
   * words is actually spoken. Without it every caption falls back to spreading
   * the line evenly across the clip, which is the desync that was reported.
   */
  scriptId?: string;
}

const ShotView: React.FC<ShotViewProps> = ({
  shot,
  timing,
  voiceSrc,
  shotIndex,
  durationOverride,
  reel = false,
  onBlack = false,
  clock,
  beats = 4,
  subtitleLed = false,
  scriptId,
}) => {
  const frame = useCurrentFrame();
  const durationInFrames = durationOverride ?? timing?.shotFrames ?? 120;
  const audioFrames = timing?.audioFrames ?? Math.round(durationInFrames * 0.8);
  const t = Math.min(1, frame / durationInFrames);
  const accent = shot.accent ?? DEFAULT_ACCENT;

  // Smooth seamless shot arrival & exit easing
  const enter = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const leave = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  const alpha = Math.min(enter, leave);

  const asset = shot.screen ? screenAsset(shot.screen) : null;
  const src = asset ? staticFile(asset.file) : null;

  // Derive interactive touch target based on script shot
  let touchPreset: any = undefined;
  let isTripleTap = false;

  if (shot.text.toLowerCase().includes('triple-tap') || (shot.screen?.startsWith('questions') && shot.text.toLowerCase().includes('tap'))) {
    touchPreset = 'tripleTap';
    isTripleTap = true;
  } else if (shot.screen === 'browse') {
    touchPreset = 'bottomNavBrowse';
  } else if (shot.screen === 'timer') {
    touchPreset = 'bottomNavTimer';
  } else if (shot.screen === 'askai') {
    touchPreset = 'bottomNavAI';
  } else if (shot.screen === 'progress') {
    touchPreset = 'bottomNavProgress';
  } else if (shot.screen === 'userNotes' || shot.screen === 'userNotesEdit' || shot.screen === 'userNotesMedia') {
    touchPreset = 'bottomNavNotes';
  } else if (shot.screen === 'ankiStudy' || shot.screen === 'chatdemo') {
    touchPreset = 'mcqOption';
  } else if (shot.screen === 'flashcards') {
    touchPreset = 'flashcardFlip';
  } else if (shot.screen === 'themeCustomizer' || shot.screen === 'wallpaperCustomizer' || shot.screen === 'glassHome') {
    touchPreset = 'themeSwatch';
  }

  let customScreenContent: React.ReactNode = null;
  if (shot.screen === 'outroCard') {
    customScreenContent = <OutroScreen />;
  }

  return (
    <AbsoluteFill>
      {/* The silent cut runs on true black.
        *
        * A reel is watched muted and thumb-first, so the subtitle cut has to
        * survive with no voice carrying it. The aurora is a lovely bed under a
        * narrated ad and it is the wrong choice here: it lifts the ground off
        * black, and every phone gallery, every Reels feed and every dark OLED
        * frames the video against black already. Matching it makes the phone in
        * the shot and the caption look like they are floating in the feed
        * rather than sitting on a coloured card someone designed.
        *
        * The accent does not disappear — it stays in the caption, the rim and
        * the touch ripple, where it marks meaning instead of filling space. */}
      {onBlack ? null : (
        <AuroraMeshBackground accent={accent} intensity={shot.camera === 'macro' ? 0.6 : 1} />
      )}
      {/* A beat-synced cut still gets lit, just not filled. See `BeatRoom`. */}
      {clock ? (
        <BeatRoom accent={accent} clock={clock} durationInFrames={durationInFrames} />
      ) : null}
      {/*
        The device sits out the shots the mascot hosts.

        `screen: null` draws an empty dark phone, which is right for a cold
        open and wrong here — a black slab behind the presenter is a prop
        nobody is looking at, and it steals the depth the figure needs. When
        the mascot has the frame, it has the frame.
      */}
      {shot.mascot === 'hero' ? null : (
      <AbsoluteFill
        style={{
          opacity: alpha,
          // The device breathes with the bed on the beat cuts. Under one per
          // cent: a phone that visibly bounces reads as a GIF, and the point
          // is that the picture and the music are the same object.
          transform: clock ? `scale(${1 + beatEnergy(frame, clock) * 0.008})` : undefined,
        }}
      >
        {asset?.kind === 'plate' && src ? (
          <PlateCard
            src={src}
            move={shot.camera}
            t={t}
            accent={accent}
            lift={reel ? REEL_DEVICE_LIFT : 0}
          />
        ) : (
          <LayeredCameraPhone
            src={src}
            move={shot.camera}
            t={t}
            accent={accent}
            focus={shot.focus}
            touchPreset={touchPreset}
            isTripleTap={isTripleTap}
            shotIndex={shotIndex}
            durationInFrames={durationInFrames}
            scaleMul={reel ? REEL_DEVICE_SCALE : 1}
            liftExtra={reel ? REEL_DEVICE_LIFT : 0}
          >
            {customScreenContent}
          </LayeredCameraPhone>
        )}
      </AbsoluteFill>
      )}
      {shot.mascot ? (
        <MascotStage
          mode={shot.mascot}
          accent={accent}
          durationInFrames={durationInFrames}
          // Alternated so a recurring guide is a guide rather than wallpaper:
          // it changes which side of the device it steps in from.
          side={shotIndex % 2 === 0 ? 'left' : 'right'}
        />
      ) : null}
      <AbsoluteFill style={{ opacity: alpha }}>
        {subtitleLed && clock ? (
          <BeatCaption
            text={shot.text}
            kicker={shot.kicker}
            accent={accent}
            durationInFrames={durationInFrames}
            clock={clock}
            beats={beats}
          />
        ) : reel ? (
          /*
             A voiced reel shows THE WHOLE LINE it is speaking.

             It used to show `shot.text`, a verbatim *span* of the line. The
             span rule was written to fix a real bug — a headline that said
             "2,025 already asked" while the voice said something else — and it
             did fix it, by making the caption a piece of the sentence instead
             of a different sentence. But a piece of a sentence is a fragment,
             and it was measured: 264 of the 385 voiced shots showed less than
             three quarters of what was said, and some showed a fifth of it.
             "Every day you studied, coloured in." appeared on screen as
             "coloured in".

             Reading the line and hearing the line are now the same words. Sync
             is not lost by doing this, because it never came from the caption
             being short — `ReelHeadline` lights each word as the Speech
             service says it, from the recorded word boundaries, so a longer
             caption simply has more words to light.
          */
          <ReelHeadline
            text={shot.vo || shot.text || ''}
            accent={accent}
            durationInFrames={durationInFrames}
            scriptId={scriptId}
            shotN={shot.n}
            spokenLine={shot.vo}
          />
        ) : (
          <KineticWordCaption
            text={timing?.vo || shot.vo || shot.text}
            accent={accent}
            audioFrames={audioFrames}
            durationInFrames={durationInFrames}
            scriptId={scriptId}
            shotN={shot.n}
          />
        )}
      </AbsoluteFill>
      {voiceSrc ? <Audio src={voiceSrc} /> : null}
    </AbsoluteFill>
  );
};

const voiceFile = (script: AdScript, shot: Shot) =>
  staticFile(`audio/${script.id}/shot_${String(shot.n).padStart(2, '0')}.mp3`);

export const ShotTimeline: React.FC<{ script: AdScript }> = ({ script }) => {
  const reel = script.format === 'reel';
  // A silent long-form cut plays none of its twin's clips but is the same edit
  // frame for frame, so it reads the twin's measurements. `voiceOf` names it;
  // a silent reel leaves it unset, because a reel is cut to music.
  const timingId = script.voiceOf ?? script.id;
  const timingReport = DYNAMIC_SCRIPT_TIMINGS[timingId];

  // One rule, and it replaces two that contradicted each other:
  //
  //   **Audio paces what has audio. The beat grid paces what does not.**
  //
  // The comment here used to say a reel was "the other way round — the
  // platform fixes the length at 60.0s, so the shots declare their frames and
  // the voice is written to fit them". The first half is true. The second half
  // was an instruction to a human that nothing ever checked, and it was not
  // followed: measured against the real recordings, every reel held between 57
  // and 73 seconds of speech in a 60-second film. The beat grid does not
  // stretch, so the surplus played on underneath the next shot while its clip
  // was already speaking. That is the overlapping voice.
  //
  // So a spoken script — long-form or reel — takes its boundaries from
  // `dynamicScriptTimings.ts`, which is measured from the same mp3s this will
  // mux and gives every shot at least its own audio plus air. A shot can no
  // longer be shorter than the line it carries.
  //
  // `resolveShotFrames` still owns the silent scripts, and there it is exactly
  // right: with nothing spoken there is no duration to obey, and the music is
  // the only clock in the room.
  const resolved = resolveShotFrames(script);
  const spokenScript = !script.noVoice;

  let cursor = 0;
  const shotsWithTimings = script.shots.map((shot, i) => {
    const timing = timingReport?.shots.find((s) => s.n === shot.n);

    if (spokenScript && timing) {
      return {
        shot,
        timing,
        startFrame: timing.startFrame,
        durationInFrames: timing.shotFrames,
        index: i,
      };
    }

    const fixed = resolved[i];
    if (fixed > 0) {
      const startFrame = cursor;
      cursor += fixed;
      return { shot, timing, startFrame, durationInFrames: fixed, index: i };
    }
    const startFrame = timing?.startFrame ?? i * 120;
    const durationInFrames = timing?.shotFrames ?? 120;
    return { shot, timing, startFrame, durationInFrames, index: i };
  });

  // Same rule as the boundaries: the measurement wins wherever there is one,
  // so a voiced reel's length is the length its own recordings came to (pinned
  // to REEL_FRAMES by `measure-audio`), and a silent one is the sum of its
  // beats.
  const total = spokenScript
    ? (timingReport?.totalFrames ?? scriptFrames(script))
    : scriptFrames(script);

  // A cut written in beats carries its clock down to every shot, so the type,
  // the room light and the device all move on the same grid the cuts land on.
  const perBeat = script.bpm ? framesPerBeat(script.bpm) : null;
  const gridOrigin = script.beatOffsetFrames ?? 0;

  // There is one silence now, and it is a property of the script.
  //
  // There used to be two, and keeping them apart was the whole confusion:
  // `withVoice: false` meant "the muted mix of a voiced reel" and
  // `script.noVoice` meant "an ad written without a voice". The first was a
  // prop, so the same edit served a listening viewer and a muted one — two
  // audiences whose only clock disagrees. `withVoice` is gone; a silent cut is
  // a script of its own, built in `scripts/silent.ts`.
  const subtitleLed = Boolean(script.noVoice);
  const speaks = !script.noVoice;

  // A silent reel sits on true black — there is no film light to match, and
  // the caption is the whole image. A silent LONG-FORM cut keeps its twin's
  // ground, because it is the identical edit with the voice muted.
  const black = reel && subtitleLed;

  return (
    <AbsoluteFill style={{ backgroundColor: black ? '#000000' : '#030712' }}>
      {/*
        The bed sits under everything and runs the whole composition. It is the
        first child so no shot's background can be drawn beneath it, and it is
        the only audio in a silent cut, which is why that cut is still a film
        rather than a video with the sound broken.
      */}
      {script.music ? (
        <Audio
          src={staticFile(script.music)}
          volume={(f) =>
            interpolate(
              f,
              [0, 18, Math.max(19, total - 40), total],
              [0, 1, 1, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            ) * (speaks ? BED_UNDER_VOICE : BED_ALONE)
          }
        />
      ) : null}

      {shotsWithTimings.map(({ shot, timing, startFrame, durationInFrames, index }) => (
        <Sequence
          key={shot.n}
          from={startFrame}
          durationInFrames={durationInFrames}
          layout="none"
        >
          <ShotView
            shot={shot}
            timing={timing}
            shotIndex={index}
            durationOverride={durationInFrames}
            reel={reel}
            voiceSrc={speaks && !reel ? voiceFile(script, shot) : null}
            onBlack={black}
            clock={perBeat ? { perBeat, originFrame: startFrame - gridOrigin } : undefined}
            beats={perBeat ? Math.round(durationInFrames / perBeat) : undefined}
            subtitleLed={subtitleLed}
            /*
               Which recording's WORD BOUNDARIES light this caption.
               Independent of whether anything is played: a silent long-form
               cut is the same edit with the voice muted, and its words should
               still arrive when they were said rather than spread evenly.
            */
            scriptId={subtitleLed && reel ? undefined : timingId}
          />
        </Sequence>
      ))}

      {/*
        A reel's voice is mounted outside the shot it belongs to, with no
        duration of its own.

        Mounted with no duration so a clip is never cut off mid-word: a
        Sequence would trim it to the shot, and the last syllable of a line is
        not a detail.

        What this comment used to say was that a clip "simply laps a few frames
        into the next shot, which is what a fast cut sounds like anyway", and
        that "`preflight` still fails if a clip overruns by enough to talk over
        the next line". Neither was true. No such check existed anywhere, and
        the lapping was not a few frames: shots were cut to the music grid
        without ever consulting the recordings, so lines ran up to 3.8 seconds
        past their shot and every reel held more speech than it had room for.
        Two voices talking at once is what that sounds like.

        The safety is real now and it is upstream: `measure-audio` gives every
        shot at least its own audio plus air, so the next shot cannot begin
        until this line has finished, and `preflight` refuses a reel whose
        speech will not fit in sixty seconds.
      */}
      {reel && speaks
        ? shotsWithTimings.map(({ shot, startFrame }) => (
            <Sequence key={`vo-${shot.n}`} from={startFrame} layout="none">
              <Audio src={voiceFile(script, shot)} />
            </Sequence>
          ))
        : null}
    </AbsoluteFill>
  );
};
