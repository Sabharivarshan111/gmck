import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Video, { type VideoRef } from 'react-native-video';
import { Maximize2, Pause, Play, RotateCcw } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { Slider } from '@/components/Slider';
import { useTheme } from '@/theme';
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
          onLoad={data => setDuration(data.duration)}
          onProgress={data => {
            if (scrubbing === null) {
              setPosition(data.currentTime);
            }
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
            // Whole seconds. A lecture does not need frame-accurate scrubbing,
            // and a step finer than the progress events arrive at is a thumb
            // that stutters against its own updates.
            step={1}
            onChange={next => setScrubbing(next)}
            onCommit={next => {
              player.current?.seek(next);
              setPosition(next);
              setScrubbing(null);
              setEnded(false);
            }}
            label={`Position in ${name}`}
            format={value => formatTime(value)}
          />
        </View>

        <Text style={[styles.time, { color: colors.textMuted }]}>
          {formatTime(shown)}
          {total > 0 ? ` / ${formatTime(total)}` : ''}
        </Text>

        {/* Only a video has anything to make bigger. */}
        {video ? (
          <Touchable
            onPress={() => setFull(true)}
            label={`Play ${name} full screen`}
            hint="Fills the screen and turns sideways"
            scaleTo={0.9}
            hitSlop={8}
            style={styles.expand}>
            <Maximize2 size={16} color={colors.textMuted} />
          </Touchable>
        ) : null}
      </View>

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
    gap: 8,
    marginTop: 10,
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
    width: '100%',
    height: '100%',
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
    minWidth: 78,
    textAlign: 'right',
  },
  expand: {
    paddingLeft: 2,
  },
  problem: {
    ...typeScale.caption,
  },
});
