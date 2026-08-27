import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, StatusBar, StyleSheet, View } from 'react-native';
import Video, { type VideoRef } from 'react-native-video';
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { Slider } from '@/components/Slider';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { onColor } from '@/theme/color';
import OrbitScreen from '@/native/NativeOrbitScreen';

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
 * **The controls are ours rather than ExoPlayer's**, and fullscreen is ours
 * too. The library's `fullscreen` prop on Android hands the surface to
 * ExoPlayer's own dialog, which draws *its* built-in controls — so with
 * `controls={false}` a reader got a fullscreen with no play button, no
 * scrubber, no time and no volume, still in portrait, with only the back
 * gesture to escape. `fullscreenOrientation` would have fixed the rotation and
 * is iOS-only.
 *
 * So fullscreen here is a `Modal` holding the same transport, turned landscape
 * through `OrbitScreen`. The one real cost is that moving the `<Video>` into
 * the modal's tree remounts it — React cannot reparent — so the position and
 * the play/pause state are carried across by hand and the new instance seeks
 * back to them on load. One seek, once, on a deliberate tap.
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
  const [full, setFull] = useState(false);

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

  /**
   * Where to pick up after the `<Video>` is remounted.
   *
   * Entering or leaving fullscreen moves it between two trees, which React can
   * only do by unmounting one and mounting the other. Without this the video
   * would restart from zero every time the button is pressed.
   */
  const resumeAt = useRef(0);

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

  // Landscape while fullscreen, and released on the way out — including when
  // the component unmounts mid-video, which is what closing the note does.
  useEffect(() => {
    OrbitScreen?.setLandscape(full);
    return () => {
      if (full) {
        OrbitScreen?.setLandscape(false);
      }
    };
  }, [full]);

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
    resumeAt.current = next;
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

  const enterFull = useCallback(() => {
    resumeAt.current = position;
    setFull(true);
  }, [position]);

  const leaveFull = useCallback(() => {
    resumeAt.current = position;
    setFull(false);
  }, [position]);

  /**
   * The one `<Video>`, rendered wherever the player currently lives.
   *
   * A function rather than a component so React keeps it as the same element
   * type in both trees; it is still remounted when it moves, which `resumeAt`
   * covers.
   */
  const surface = (style: object) => (
    <Video
      ref={player}
      source={{ uri }}
      paused={!playing}
      resizeMode="contain"
      // Ours, not ExoPlayer's — including fullscreen. See the note at the top.
      controls={false}
      // A recording keeps playing with the screen off; a video is something
      // you are watching, so it holds the screen awake.
      preventsDisplaySleepDuringVideoPlayback={video}
      // The lecture stops when the app leaves the foreground. That is what a
      // player is expected to do; it is not what a decorative video does.
      playInBackground={false}
      volume={volume}
      muted={muted}
      onLoad={data => {
        setDuration(data.duration);
        setHasAudio((data.audioTracks?.length ?? 0) > 0);
        // Back to where it was before the move between trees.
        if (resumeAt.current > 0.25) {
          seeking.current = true;
          player.current?.seek(resumeAt.current);
        }
      }}
      onProgress={data => {
        if (scrubbing === null && !seeking.current) {
          setPosition(data.currentTime);
          resumeAt.current = data.currentTime;
        }
      }}
      onSeek={data => {
        seeking.current = false;
        setPosition(data.currentTime);
        resumeAt.current = data.currentTime;
      }}
      onEnd={() => {
        setPlaying(false);
        setEnded(true);
      }}
      onError={() => {
        setPlaying(false);
        setError(true);
      }}
      style={style}
    />
  );

  const Icon = ended ? RotateCcw : playing ? Pause : Play;

  /**
   * The transport, identical in the note and in fullscreen.
   *
   * One definition on purpose: the whole complaint was that fullscreen had no
   * controls, and two implementations is how one of them ends up missing a
   * button again.
   */
  const transport = (onDark: boolean) => {
    const ink = onDark ? '#FFFFFF' : colors.text;
    const dim = onDark ? 'rgba(255,255,255,0.7)' : colors.textMuted;
    const surfaceColor = onDark ? 'rgba(255,255,255,0.14)' : colors.cardElevated;
    return (
      <>
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

          <Text style={[styles.time, { color: dim }]}>
            {formatTime(shown)}
            {total > 0 ? ` / ${formatTime(total)}` : ''}
          </Text>

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
                  backgroundColor: volumeOpen ? withAlpha(colors.accent, 0.18) : surfaceColor,
                  borderColor: onDark ? 'transparent' : colors.border,
                },
              ]}>
              {muted || volume === 0 ? (
                <VolumeX size={17} color={colors.warning} />
              ) : (
                <Volume2 size={17} color={volumeOpen ? colors.accent : ink} />
              )}
            </Touchable>
          ) : null}

          {video ? (
            <Touchable
              onPress={full ? leaveFull : enterFull}
              label={full ? `Leave full screen` : `Play ${name} full screen`}
              hint={full ? 'Back to the note' : 'Fills the screen and turns sideways'}
              scaleTo={0.9}
              hitSlop={8}
              style={[
                styles.iconButton,
                { backgroundColor: surfaceColor, borderColor: onDark ? 'transparent' : colors.border },
              ]}>
              {full ? <Minimize2 size={17} color={ink} /> : <Maximize2 size={17} color={ink} />}
            </Touchable>
          ) : null}
        </View>

        {volumeOpen && hasAudio ? (
          <View
            style={[
              styles.volumeRow,
              {
                backgroundColor: surfaceColor,
                borderColor: onDark ? 'transparent' : colors.border,
              },
            ]}>
            <Text style={[styles.volumeLabel, { color: dim }]}>
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
      </>
    );
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
        {name}
      </Text>

      {/* Empty while fullscreen: the one Video is over there. The box stays so
          the note does not jump as the modal opens and closes. */}
      <View style={video ? styles.frame : styles.silent}>
        {video && !full ? surface(styles.video) : null}
      </View>

      {!full ? transport(false) : null}

      {!hasAudio ? (
        <Text style={[styles.problem, { color: colors.textMuted }]}>
          This file has no sound in it.
        </Text>
      ) : null}

      {error ? (
        <Text accessibilityLiveRegion="polite" style={[styles.problem, { color: colors.warning }]}>
          This phone could not play that file.
        </Text>
      ) : null}

      <Modal
        visible={full}
        animationType="fade"
        supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
        // Android's back gesture leaves fullscreen rather than closing the
        // note, which is what a reader expects and what ExoPlayer's own
        // fullscreen did.
        onRequestClose={leaveFull}>
        <StatusBar hidden={full} />
        <View style={styles.fullRoot}>
          <View style={styles.fullVideo}>{full ? surface(styles.video) : null}</View>
          <View style={styles.fullControls}>{transport(true)}</View>
        </View>
      </Modal>
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
  problem: {
    ...typeScale.caption,
  },
  fullRoot: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullVideo: {
    flex: 1,
  },
  /*
   * The controls sit *below* the picture rather than floating over it.
   *
   * Overlaid controls have to auto-hide, and auto-hiding controls are the
   * reason people tap a video three times to find the scrubber. There is room
   * for both in landscape, so both stay on screen.
   */
  fullControls: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: 6,
    gap: 8,
  },
});
