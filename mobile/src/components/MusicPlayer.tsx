import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import Video, { type OnProgressData, type OnLoadData } from 'react-native-video';
import {
  FolderOpen,
  HardDriveDownload,
  Link2,
  Music,
  Pause,
  Play,
  Plus,
  SkipBack,
  SkipForward,
  Trash2,
  X,
} from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { GlassSurface } from '@/components/GlassSurface';
import { Slider } from '@/components/Slider';
import { Sheet } from '@/components/Sheet';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { radius, space } from '@/theme/tokens';
import { EASE, DURATION, useReducedMotion } from '@/theme/motion';
import type { AttachMode } from '@/lib/noteFiles';
import {
  formatTime,
  loadTracks,
  MAX_TRACKS,
  nextTrack,
  pickTrack,
  previousTrack,
  removeTrack,
  trackArtist,
  trackIsAlive,
  trackTitle,
  trackUri,
  type Track,
} from '@/lib/music';

/**
 * Something to study to, drawn as a card of glass.
 *
 * ## About the design this was asked for
 *
 * The reference is kokonutui's Liquid Glass card, which gets its refraction
 * from an SVG `feDisplacementMap` applied through a CSS `backdrop-filter`.
 * **React Native has no backdrop-filter and no equivalent**, and this repo has
 * already decided what to do about that: `GlassSurface` is the app's liquid
 * glass, and `CLAUDE.md` says in as many words that there is no backdrop blur
 * and no faking it — "a lighter rectangle pretending to be a blur is what
 * makes an imitation look cheap".
 *
 * So the *material* is the app's own, which already does the part that carries
 * the effect: a specular highlight on the top edge, translucency so the page
 * reads through, and a soft float. What is reproduced exactly is the
 * reference's **layout** — square cover art, title over artist, the bouncing
 * volume bars, a thin progress bar between two monospaced times, and a row of
 * round transport buttons — because that is the part a phone can honestly
 * draw.
 *
 * ## And about where the music comes from
 *
 * The reader's own files, picked with Android's document picker and copied
 * into app storage. Nothing is uploaded and nothing is streamed. See
 * `lib/music.ts`.
 */

/** Bars in the little equaliser beside the title. */
const BAR_COUNT = 8;

/**
 * The equaliser.
 *
 * Eight bars on their own `Animated.Value`s, looping at slightly different
 * speeds so the row never lines up into a single pulsing block. Transform
 * only — `scaleY` composites on the GPU, while animating each bar's `height`
 * would be a layout pass per frame, eight of them, for decoration.
 */
function VolumeBars({ playing }: { playing: boolean }) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const bars = useMemo(
    () => Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.25)),
    [],
  );

  useEffect(() => {
    if (!playing || reduceMotion) {
      // Settled rather than stopped mid-bounce: a frozen equaliser at random
      // heights looks broken, a flat one reads as paused.
      bars.forEach(bar => {
        Animated.timing(bar, {
          toValue: 0.25,
          duration: DURATION.fast,
          easing: EASE.out,
          useNativeDriver: true,
        }).start();
      });
      return;
    }
    const loops = bars.map((bar, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: 1,
            duration: 420 + index * 70,
            easing: EASE.inOut,
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: 0.3,
            duration: 380 + index * 55,
            easing: EASE.inOut,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    loops.forEach(loop => loop.start());
    return () => loops.forEach(loop => loop.stop());
  }, [bars, playing, reduceMotion]);

  return (
    <View style={styles.bars} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {bars.map((bar, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              backgroundColor: colors.accent,
              // Scaled from the bottom, so a bar grows upward out of the
              // baseline rather than from its own middle.
              transform: [{ scaleY: bar }],
            },
          ]}
        />
      ))}
    </View>
  );
}

/**
 * The player, revealed.
 *
 * It grows out of the button that opened it rather than appearing: the height
 * animates from nothing while the card itself slides down a little, fades in
 * and settles from 0.94 — so the presence box below is pushed down by
 * something visibly arriving instead of teleporting a card into the gap.
 *
 * Two `Animated.Value`s because they cannot be one: height is a layout
 * property and has to run on the JS thread, while opacity and transform
 * composite on the GPU, and a single value cannot drive both drivers. The
 * card is measured through an absolutely-positioned child so its natural
 * height is known even while the container is collapsed to zero — without
 * that, the first open has nothing to animate towards.
 *
 * Nothing scales from 0 (house rule), and the whole thing is skipped under
 * reduced motion, where the card simply is or is not there.
 */
export function MusicPlayerReveal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(open);
  const [measured, setMeasured] = useState(0);
  const grow = useRef(new Animated.Value(open ? 1 : 0)).current;
  const enter = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    if (open) {
      setMounted(true);
    }
    if (reduceMotion) {
      grow.setValue(open ? 1 : 0);
      enter.setValue(open ? 1 : 0);
      if (!open) {
        setMounted(false);
      }
      return;
    }
    // Opening waits for the measurement; closing never does, because the card
    // on screen has already been measured.
    if (open && measured === 0) {
      return;
    }
    const animation = Animated.parallel([
      Animated.timing(grow, {
        toValue: open ? 1 : 0,
        duration: open ? DURATION.slow : DURATION.base,
        easing: EASE.drawer,
        useNativeDriver: false,
      }),
      Animated.timing(enter, {
        toValue: open ? 1 : 0,
        duration: open ? DURATION.slow : DURATION.fast,
        easing: EASE.out,
        useNativeDriver: true,
      }),
    ]);
    animation.start(({ finished }) => {
      if (finished && !open) {
        setMounted(false);
      }
    });
    return () => animation.stop();
  }, [enter, grow, measured, open, reduceMotion]);

  if (!mounted) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.reveal,
        measured > 0 ? { height: grow.interpolate({ inputRange: [0, 1], outputRange: [0, measured] }) } : null,
      ]}>
      <Animated.View
        onLayout={event => setMeasured(event.nativeEvent.layout.height)}
        style={[
          styles.revealBody,
          {
            opacity: enter,
            transform: [
              { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) },
              { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
            ],
          },
        ]}>
        <MusicPlayer onClose={onClose} />
      </Animated.View>
    </Animated.View>
  );
}

export function MusicPlayer({ onClose }: { onClose: () => void }) {
  const { colors } = useTheme();
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
  /*
   * Progress is ignored while a finger is down, and until the seek lands.
   * Both, for the reason `NoteMediaPlayer` documents: `seek()` is
   * asynchronous, so the first progress event after a release still carries
   * the old position, and writing it back springs the thumb backwards and then
   * throws it forward. That is the jitter.
   */
  const scrubbing = useRef(false);
  const seeking = useRef(false);
  const player = useRef<React.ComponentRef<typeof Video>>(null);

  useEffect(() => {
    loadTracks().then(list => {
      setTracks(list);
      setCurrentId(previous => previous ?? list[0]?.id ?? null);
    });
  }, []);

  const current = useMemo(
    () => tracks?.find(track => track.id === currentId) ?? null,
    [tracks, currentId],
  );
  const uri = current ? trackUri(current) : '';

  const add = useCallback(async (mode: AttachMode) => {
    setChooserOpen(false);
    setNotice(null);
    setBusy(true);
    try {
      const result = await pickTrack(mode);
      if ('added' in result) {
        const list = await loadTracks();
        setTracks(list);
        setCurrentId(result.added.id);
      } else if ('error' in result) {
        setNotice(result.error);
      } else if ('full' in result) {
        setNotice(`That is ${MAX_TRACKS} tracks — remove one first.`);
      }
    } finally {
      setBusy(false);
    }
  }, []);

  const drop = useCallback(async () => {
    if (!current) {
      return;
    }
    const list = await removeTrack(current);
    setTracks(list);
    setCurrentId(list[0]?.id ?? null);
    setPlaying(false);
    setPosition(0);
  }, [current]);

  const step = useCallback(
    (direction: 1 | -1) => {
      if (!tracks) {
        return;
      }
      const target =
        direction === 1 ? nextTrack(tracks, currentId) : previousTrack(tracks, currentId);
      if (target) {
        setCurrentId(target.id);
        setPosition(0);
      }
    },
    [currentId, tracks],
  );

  const onProgress = useCallback((data: OnProgressData) => {
    if (scrubbing.current || seeking.current) {
      return;
    }
    setPosition(data.currentTime * 1000);
  }, []);

  const onLoad = useCallback((data: OnLoadData) => {
    setDuration(data.duration * 1000);
  }, []);

  /*
   * Memoised, and reading through refs where they need live values. A drag
   * re-renders this many times a second, and `Slider`'s PanResponder is
   * memoised — a handler that changes identity on every step rebuilds the
   * gesture underneath the finger.
   */
  const onScrub = useCallback((value: number) => {
    scrubbing.current = true;
    setPosition(value);
  }, []);

  const onScrubEnd = useCallback((value: number) => {
    scrubbing.current = false;
    seeking.current = true;
    setPosition(value);
    player.current?.seek(value / 1000);
  }, []);

  const total = duration || current?.durationMs || 0;
  /*
   * A link is the one kind of track that can vanish while the app is closed,
   * so it is asked about on render rather than trusted from when it was added.
   */
  const dead = !!current && !trackIsAlive(current);

  return (
    <GlassSurface elevated bevel borderRadius={radius.xl} style={styles.card}>
      {/* The file itself. There is no video track to draw, so the surface is
          sized to nothing and the artwork below comes from the file's own
          tags. `react-native-video` has no audio-only prop — a zero-sized
          player is how you say it. */}
      {uri ? (
        <Video
          ref={player}
          source={{ uri }}
          paused={!playing}
          onProgress={onProgress}
          onLoad={onLoad}
          onSeek={() => {
            seeking.current = false;
          }}
          onEnd={() => step(1)}
          onError={() => setNotice('That track could not be played.')}
          progressUpdateInterval={250}
          // Keeps playing while the phone is in a pocket, which is the entire
          // point of music during a focus session. `playInBackground` without
          // this leaves it stopping the moment the screen locks.
          playInBackground
          ignoreSilentSwitch="ignore"
          style={styles.hiddenVideo}
        />
      ) : null}

      <View style={styles.head}>
        <Touchable onPress={onClose} label="Close the music player" hitSlop={10} scaleTo={0.88}>
          <GlassSurface elevated bevel borderRadius={13} style={styles.close}>
            <X size={14} color={colors.textMuted} />
          </GlassSurface>
        </Touchable>
      </View>

      <View style={styles.row}>
        {/* Cover art, or a plate with a note on it when the file carries none. */}
        <GlassSurface elevated bevel borderRadius={radius.md} style={styles.art}>
          {current?.artwork ? (
            <Image source={{ uri: current.artwork }} style={styles.artImage} resizeMode="cover" />
          ) : (
            <Music size={24} color={colors.accent} />
          )}
        </GlassSurface>

        <View style={styles.meta}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
            {current ? trackTitle(current) : 'No music yet'}
          </Text>
          <Text numberOfLines={1} style={[styles.artist, { color: colors.textMuted }]}>
            {current ? trackArtist(current) : 'Add a track from your phone'}
          </Text>
        </View>

        <VolumeBars playing={playing && !!current} />
      </View>

      {current ? (
        <>
          <View style={styles.times}>
            <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(position)}</Text>
            <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(total)}</Text>
          </View>
          <Slider
            value={Math.min(position, total)}
            min={0}
            max={Math.max(total, 1)}
            step={1000}
            onChange={onScrub}
            onCommit={onScrubEnd}
            label="Track position"
            format={value => formatTime(value)}
          />
        </>
      ) : null}

      <View style={styles.controls}>
        <Touchable
          onPress={() => step(-1)}
          label="Previous track"
          disabled={!current || (tracks?.length ?? 0) < 2}
          hitSlop={6}
          scaleTo={0.9}>
          <GlassSurface elevated bevel borderRadius={17} style={styles.control}>
            <SkipBack size={16} color={current ? colors.text : withAlpha(colors.text, 0.3)} />
          </GlassSurface>
        </Touchable>

        <Touchable
          onPress={() => setPlaying(value => !value)}
          label={playing ? 'Pause music' : 'Play music'}
          disabled={!current}
          scaleTo={0.93}
          style={[
            styles.playControl,
            { backgroundColor: current ? colors.primary : withAlpha(colors.text, 0.12) },
          ]}>
          {playing ? (
            <Pause size={20} color={colors.primaryText} fill={colors.primaryText} />
          ) : (
            <Play size={20} color={colors.primaryText} fill={colors.primaryText} />
          )}
        </Touchable>

        <Touchable
          onPress={() => step(1)}
          label="Next track"
          disabled={!current || (tracks?.length ?? 0) < 2}
          hitSlop={6}
          scaleTo={0.9}>
          <GlassSurface elevated bevel borderRadius={17} style={styles.control}>
            <SkipForward size={16} color={current ? colors.text : withAlpha(colors.text, 0.3)} />
          </GlassSurface>
        </Touchable>

        <View style={styles.spacer} />

        <Touchable
          onPress={() => setChooserOpen(true)}
          label="Add music from this phone"
          hint="Opens your files — nothing is uploaded"
          disabled={busy}
          hitSlop={6}
          scaleTo={0.9}>
          <GlassSurface elevated bevel borderRadius={17} style={styles.control}>
            <Plus size={16} color={colors.accent} />
          </GlassSurface>
        </Touchable>

        {current ? (
          <Touchable
            onPress={drop}
            label={
              current.linked
                ? `Remove ${trackTitle(current)} from the playlist. Your file is not deleted`
                : `Remove ${trackTitle(current)} and delete Orbit's copy`
            }
            hitSlop={6}
            scaleTo={0.9}>
            <GlassSurface elevated bevel borderRadius={17} style={styles.control}>
              <Trash2 size={14} color={colors.danger} />
            </GlassSurface>
          </Touchable>
        ) : null}
      </View>

      {notice ? (
        <Text style={[styles.notice, { color: colors.warning }]}>{notice}</Text>
      ) : dead ? (
        <Text style={[styles.notice, { color: colors.warning }]}>
          The original has been moved or deleted. Add it again to keep a copy.
        </Text>
      ) : (
        <Text style={[styles.notice, { color: colors.textMuted }]}>
          {/* The empty state has to say what to press. There is no catalogue
              to browse and nothing to sign into, so a player with an empty
              list and no instruction reads as broken rather than as waiting
              for a file. */}
          {!tracks || tracks.length === 0
            ? 'Tap the + button to select music from your phone.'
            : `${tracks.length} ${tracks.length === 1 ? 'track' : 'tracks'} in this playlist`}
        </Text>
      )}

      {/*
        Copy or link, asked before the picker opens rather than after.

        The same choice a note attachment offers, and the folder tip above it
        for the same reason it is worth giving at all: Android's document
        picker opens on whatever it opened on last, and a music collection
        scattered across Downloads, WhatsApp and a memory card is a lot of
        taps per track. One folder makes both options a two-tap job.
      */}
      <Sheet
        visible={chooserOpen}
        onClose={() => setChooserOpen(false)}
        title="Save it, or just link it?">
        <View style={[styles.tip, { backgroundColor: withAlpha(colors.accent, 0.12) }]}>
          <FolderOpen size={16} color={colors.accent} />
          <Text style={[styles.tipText, { color: colors.text }]}>
            First, make one folder on your phone — call it Study Music — and put all your songs
            in it. Then pick them from there with either option below.
          </Text>
        </View>

        <Touchable
          onPress={() => add('copy')}
          label="Save a copy in Orbit. Uses phone space, and keeps playing if you delete the original"
          style={[styles.modeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.modeIcon, { backgroundColor: withAlpha(colors.fuchsia, 0.15) }]}>
            <HardDriveDownload size={18} color={colors.fuchsia} />
          </View>
          <View style={styles.modeBody}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Save a copy</Text>
            <Text style={[styles.rowSub, { color: colors.textMuted }]}>
              Safest. Keeps playing even if you delete the original. Uses phone space.
            </Text>
          </View>
        </Touchable>

        <Touchable
          onPress={() => add('link')}
          label="Just link it. Uses no space, and stops playing if you delete or move the original"
          style={[styles.modeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.modeIcon, { backgroundColor: withAlpha(colors.cyan, 0.15) }]}>
            <Link2 size={18} color={colors.cyan} />
          </View>
          <View style={styles.modeBody}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Just link it</Text>
            <Text style={[styles.rowSub, { color: colors.textMuted }]}>
              Uses no space. Stops playing if you move or delete the original.
            </Text>
          </View>
        </Touchable>

        <Text style={[styles.sheetNote, { color: withAlpha(colors.text, 0.5) }]}>
          Nothing is uploaded either way — the music stays on this phone.
        </Text>
      </Sheet>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  reveal: { overflow: 'hidden' },
  // Absolute, so the card is measured at its natural height while the
  // container above is still collapsed to zero. The padding is inside the
  // measurement, so the gap above the card closes with it.
  revealBody: { position: 'absolute', left: 0, right: 0, top: 0, paddingTop: space.md },
  card: { padding: space.md, gap: space.sm },
  hiddenVideo: { width: 0, height: 0 },
  head: { alignItems: 'flex-end', marginBottom: -space.xs },
  close: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  art: { width: 56, height: 56, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  artImage: { width: '100%', height: '100%' },
  meta: { flex: 1, gap: 2 },
  title: { ...typeScale.bodyStrong },
  artist: { ...typeScale.footnote },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 24 },
  bar: { width: 3, height: 24, borderRadius: 2 },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { ...typeScale.caption, fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  control: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  playControl: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: { flex: 1 },
  notice: { ...typeScale.caption },
  tip: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    padding: space.md,
    borderRadius: radius.md,
    marginBottom: space.md,
  },
  tipText: { ...typeScale.footnote, flex: 1 },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: space.sm,
  },
  modeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBody: { flex: 1, gap: 2 },
  rowTitle: { ...typeScale.bodyStrong },
  rowSub: { ...typeScale.footnote },
  sheetNote: { ...typeScale.caption, marginTop: space.sm },
});
