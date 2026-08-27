import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Video, { type VideoRef } from 'react-native-video';
import { Maximize2, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { Slider } from '@/components/Slider';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { onColor } from '@/theme/color';

/**
 * The player for a recording or a video attached to a note.
 *
 * **Built on `react-native-video`, which this app already ships** for the video
 * wallpaper. It is Media3/ExoPlayer underneath — hardware-decoded, the same
 * engine every Android video app uses — and because it is already in the APK,
 * a player built on it adds **no size at all**.
 *
 * libVLC was the obvious alternative and is the wrong tool here. It carries its
 * own decoders as native libraries, tens of megabytes per ABI, which is the
 * cost of playing formats Android cannot — obscure codecs, odd containers,
 * network streams. Every file this plays came out of the phone's own picker and
 * is something the phone can already decode, so all of that weight would buy
 * nothing, in an app whose readers are on cheap handsets with no space.
 *
 * **The controls are ours rather than ExoPlayer's.** The built-in ones are a
 * different typeface, a different accent and a different set of gestures from
 * the rest of the app, dropped into the middle of a note. These are the same
 * `Slider` and `Touchable` as everywhere else, so a scrub here feels like a
 * scrub anywhere else in Orbit.
 */

/** mm:ss, or h:mm:ss past an hour. Lectures run long. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  const whole = Math.floor(seconds);
  const s = `${whole % 60}`.padStart(2, '0');
  const m = Math.floor(whole / 60) % 60;
  const h = Math.floor(whole / 3600);
  return h > 0 ? `${h}:${`${m}`.padStart(2, '0')}:${s}` : `${m}:${s}`;
}

export function NoteMediaPlayer({
  uri,
  name,
  video,
}: {
  uri: string;
  name: string;
  /** A video gets a frame; a recording is the transport bar alone. */
  video: boolean;
}) {
  const { colors } = useTheme();
  const player = useRef<VideoRef>(null);

  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState(false);

  /**
   * Where the finger is, while it is down.
   *
   * The thumb has to follow the finger and nothing else: letting `onProgress`
   * keep writing the position during a drag makes the thumb jump back to the
   * playhead several times a second, which reads as a control fighting you.
   * Null means nobody is scrubbing and the playhead is in charge again.
   */
  const [scrubbing, setScrubbing] = useState<number | null>(null);

  /**
   * Fullscreen, driven as a prop rather than by calling into the ref.
   *
   * `presentFullscreenPlayer()` is the imperative twin of this and leaves the
   * component's idea of the state behind: leave fullscreen with the system
   * back gesture and nothing tells React, so the next tap on the button does
   * nothing. Holding it in state and letting the dismiss callbacks write back
   * is the version that cannot drift.
   */
  const [full, setFull] = useState(false);

  /**
   * Whether a seek is still in flight.
   *
   * Releasing the scrubber was making the thumb jump backwards and then
   * forwards again. `seek()` is asynchronous, so the first `onProgress` after
   * a release still carries the position from *before* the seek — which was
   * written straight back into the slider, springing the thumb to the old
   * spot until the seek landed and threw it forward. Progress is ignored until
   * `onSeek` says the player has actually arrived.
   */
  const seeking = useRef(false);

  /** 0 to 1. Muting is a separate state so the level survives being muted. */
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  /**
   * Whether the file has any sound in it at all.
   *
   * A screen recording made without the microphone or internal audio has no
   * audio track, and plays back in perfect silence — which is
   * indistinguishable from a broken player unless the player says so. `onLoad`
   * reports the tracks, so it can.
   */
  const [hasAudio, setHasAudio] = useState(true);

  const shown = scrubbing ?? position;
  const total = duration > 0 ? duration : 0;

  const toggle = useCallback(() => {
    setError(false);
    if (ended) {
      player.current?.seek(0);
      setPosition(0);
      setEnded(false);
      setPlaying(true);
      return;
    }
    setPlaying(current => !current);
  }, [ended]);

  const Icon = ended ? RotateCcw : playing ? Pause : Play;

  /*
   * Stable across renders, because a drag re-renders this component on every
   * step and the Slider's gesture must not be rebuilt underneath it. The
   * Slider now reads its callbacks through refs so this is belt and braces,
   * but a handler that changes identity forty times a second is worth not
   * creating in the first place.
   */
  const onScrub = useCallback((next: number) => setScrubbing(next), []);
  const onScrubEnd = useCallback((next: number) => {
    seeking.current = true;
    player.current?.seek(next);
    setPosition(next);
    setScrubbing(null);
    setEnded(false);
  }, []);

  /*
   * Half-second steps under ten minutes, whole seconds above.
   *
   * A fixed one-second step gave a 28-second clip twenty-eight positions, so
   * the thumb moved in visible jumps rather than following the finger. An
   * hour-long lecture does not need that resolution and would pay for it in
   * re-renders.
   */
  const scrubStep = useMemo(() => (total > 600 ? 1 : 0.5), [total]);

  /** Touching the level unmutes: nudging a slider means "let me hear it". */
  const onVolume = useCallback((next: number) => {
    setVolume(next);
    setMuted(next === 0);
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
        {name}
      </Text>

      <View style={video ? styles.frame : styles.silent}>
        <Video
          ref={player}
          source={{ uri }}
          paused={!playing}
          resizeMode="contain"
          // Ours, not ExoPlayer's. See the note at the top.
          controls={false}
          // A recording keeps playing with the screen off; a video is
          // something you are watching, so it holds the screen awake.
          preventsDisplaySleepDuringVideoPlayback={video}
          fullscreen={full}
          // Landscape, because a lecture or a procedure was filmed that way and
          // a phone held upright wastes two thirds of the screen on black.
          fullscreenOrientation="landscape"
          fullscreenAutorotate
          onFullscreenPlayerDidDismiss={() => setFull(false)}
          // The lecture keeps playing when the note is scrolled past, and
          // stops when the app leaves the foreground. Both are what a player
          // is expected to do; neither is what a decorative video does.
          playInBackground={false}
          volume={volume}
          muted={muted}
          onLoad={data => {
            setDuration(data.duration);
            setHasAudio((data.audioTracks?.length ?? 0) > 0);
          }}
          onProgress={data => {
            if (scrubbing === null && !seeking.current) {
              setPosition(data.currentTime);
            }
          }}
          onSeek={data => {
            seeking.current = false;
            setPosition(data.currentTime);
          }}
          onEnd={() => {
            setPlaying(false);
            setEnded(true);
          }}
          onError={() => {
            setPlaying(false);
            setError(true);
          }}
          style={video ? styles.video : styles.none}
        />
        {/*
          Fullscreen sits on the frame, bottom right, where every video player
          on the phone puts it — and where it does not have to compete with the
          transport for horizontal room. The dark disc is so it stays visible
          over a bright frame.
        */}
        {video ? (
          <Touchable
            onPress={() => setFull(true)}
            label={`Play ${name} full screen`}
            hint="Fills the screen and turns sideways"
            scaleTo={0.9}
            hitSlop={10}
            style={styles.expand}>
            <Maximize2 size={17} color="#FFFFFF" />
          </Touchable>
        ) : null}
      </View>

      <View style={styles.transport}>
        <Touchable
          onPress={toggle}
          label={ended ? `Play ${name} again` : playing ? `Pause ${name}` : `Play ${name}`}
          state={{ selected: playing }}
          scaleTo={0.9}
          style={[styles.playButton, { backgroundColor: colors.accent }]}>
          <Icon size={16} color={onColor(colors.accent)} />
        </Touchable>

        <View style={styles.track}>
          <Slider
            value={Math.min(shown, total || 1)}
            min={0}
            max={total || 1}
            step={scrubStep}
            onChange={onScrub}
            onCommit={onScrubEnd}
            label={`Position in ${name}`}
            format={formatTime}
          />
        </View>

        <Text style={[styles.time, { color: colors.textMuted }]}>
          {formatTime(shown)}
          {total > 0 ? ` / ${formatTime(total)}` : ''}
        </Text>

        {/*
          Volume, behind one button.

          A slider always on screen would double the height of the transport
          for something most people never touch — and the phone's own volume
          keys already work. Tapping the speaker reveals it; long content in a
          shared room is exactly when it is wanted.
        */}
        {hasAudio ? (
          <Touchable
            onPress={() => {
              if (volumeOpen) {
                setMuted(current => !current);
              } else {
                setVolumeOpen(true);
              }
            }}
            label={muted ? `Unmute ${name}` : `Volume for ${name}`}
            hint={volumeOpen ? 'Mutes and unmutes' : 'Opens the volume slider'}
            state={{ expanded: volumeOpen }}
            scaleTo={0.9}
            hitSlop={8}
            style={[
              styles.iconButton,
              {
                backgroundColor: volumeOpen
                  ? withAlpha(colors.accent, 0.18)
                  : colors.cardElevated,
                borderColor: colors.border,
              },
            ]}>
            {muted || volume === 0 ? (
              <VolumeX size={17} color={colors.warning} />
            ) : (
              <Volume2 size={17} color={volumeOpen ? colors.accent : colors.text} />
            )}
          </Touchable>
        ) : null}

      </View>

      {volumeOpen && hasAudio ? (
        <View
          style={[
            styles.volumeRow,
            { backgroundColor: colors.cardElevated, borderColor: colors.border },
          ]}>
          <Text style={[styles.volumeLabel, { color: colors.textMuted }]}>
            {muted ? 'Muted' : `${Math.round(volume * 100)}%`}
          </Text>
          <View style={styles.track}>
            <Slider
              value={muted ? 0 : volume}
              min={0}
              max={1}
              step={0.05}
              onChange={onVolume}
              label={`Volume for ${name}`}
              format={value => `${Math.round(value * 100)} percent`}
            />
          </View>
        </View>
      ) : null}

      {/*
        Silence with a reason.

        A screen recording made without the microphone has no audio track at
        all and plays back silently, which looks exactly like a broken player.
        Saying so is the difference between "this app is broken" and "that file
        has no sound in it".
      */}
      {!hasAudio ? (
        <Text style={[styles.problem, { color: colors.textMuted }]}>
          This file has no sound in it.
        </Text>
      ) : null}

      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.problem, { color: colors.warning }]}>
          This phone could not play that file.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    // Room above and below, so a player does not sit flush against the note's
    // text or against whatever button follows it.
    marginTop: 16,
    marginBottom: 12,
  },
  name: {
    ...typeScale.footnote,
    fontWeight: '600',
  },
  frame: {
    width: '100%',
    height: 210,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  /* A recording has nothing to look at, so it takes no room at all. */
  silent: {
    height: 0,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  none: {
    width: 0,
    height: 0,
  },
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    flex: 1,
  },
  time: {
    ...typeScale.caption,
    fontVariant: ['tabular-nums'],
    minWidth: 74,
    textAlign: 'right',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 6,
  },
  volumeLabel: {
    ...typeScale.caption,
    fontVariant: ['tabular-nums'],
    minWidth: 42,
  },
  expand: {
    width: 36,
    height: 36,
    borderRadius: 18,
    margin: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  problem: {
    ...typeScale.caption,
  },
});
