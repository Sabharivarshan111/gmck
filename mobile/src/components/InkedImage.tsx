import React, { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type StyleProp,
  type ImageStyle,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ruling } from '@/components/DrawCanvas';
import { loadNoteInk, type NoteInk } from '@/lib/noteImages';
import { useTheme } from '@/theme';

/**
 * A note's picture with whatever was drawn on it — or a page that *is* the
 * drawing.
 *
 * The marks are geometry rather than pixels (see `saveNoteInk`), so they are
 * laid over the ground here and scale with it. `viewBox` does the scaling: the
 * strokes were recorded against the board they were drawn on, and SVG maps
 * that onto whatever box this ends up in, at any size, on any screen.
 */
export function InkedImage({
  uri,
  imageId,
  style,
  ownShape,
}: {
  /** The picture, or nothing for a page that was written on directly. */
  uri?: string | null;
  /** The picture's local id, which is what the marks are filed under. */
  imageId: string;
  style?: StyleProp<ImageStyle>;
  /**
   * Let a written page take its own proportions rather than the given box.
   *
   * Wanted where the page is being read and not where it is a 64dp thumbnail
   * in a row of them, which is why it is asked for rather than assumed.
   */
  ownShape?: boolean;
}) {
  const { colors } = useTheme();
  const [ink, setInk] = useState<NoteInk | null>(null);

  useEffect(() => {
    let alive = true;
    loadNoteInk(imageId).then(found => {
      if (alive) setInk(found);
    });
    return () => {
      alive = false;
    };
  }, [imageId]);

  /*
   * For a page, the *wrapper* is the paper.
   *
   * It used to be a paper View with the overlay as its sibling, and the two
   * were not the same box: the ruling and any mark near the bottom were drawn
   * below the card's rounded edge, hanging in the page like a rendering fault.
   * One element means the overlay's `absoluteFill` can only ever be the paper
   * exactly, and `overflow` clips both to the same corner radius.
   */
  const paper: StyleProp<ViewStyle> = uri
    ? null
    : [
        style as StyleProp<ViewStyle>,
        styles.paper,
        { backgroundColor: colors.card, borderColor: colors.border },
        /*
         * A page keeps the shape it was written on.
         *
         * A picture can be letterboxed inside a fixed box and still read
         * correctly, because the photograph is the thing being looked at. A
         * page is the *paper*: forced into a landscape box, a portrait page's
         * writing shrinks into a column down the middle with empty card either
         * side, which looks broken rather than like a page.
         */
        ownShape && ink ? { height: undefined, aspectRatio: ink.width / ink.height } : null,
      ];

  return (
    <View style={[styles.wrap, paper]}>
      {uri ? <Image source={{ uri }} style={style} resizeMode="contain" /> : null}
      {ink && (ink.strokes.length > 0 || ink.paper) ? (
        <Svg
          style={StyleSheet.absoluteFill}
          width="100%"
          height="100%"
          viewBox={`0 0 ${ink.width} ${ink.height}`}
          pointerEvents="none">
          {/* The page's own ruling, under everything, exactly as written on. */}
          {!uri && ink.paper && ink.paper !== 'plain' ? (
            <Ruling
              paper={ink.paper}
              board={{ width: ink.width, height: ink.height }}
              colors={colors}
            />
          ) : null}
          {/* Highlighter first, whatever order it was drawn in — a wash under
              the writing is the point of it, not a wash on top. */}
          {[...ink.strokes]
            .sort((a, b) => (a.opacity ? 0 : 1) - (b.opacity ? 0 : 1))
            .map((stroke, index) => (
              <Path
                key={index}
                d={stroke.d}
                stroke={stroke.color}
                strokeWidth={stroke.width}
                strokeOpacity={stroke.opacity ?? 1}
                strokeLinecap={stroke.opacity ? 'butt' : 'round'}
                strokeLinejoin="round"
                fill="none"
              />
            ))}
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    overflow: 'hidden',
  },
  paper: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
