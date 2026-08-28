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
import { loadNoteInk, type NoteInk } from '@/lib/noteImages';
import { useTheme } from '@/theme';

/**
 * A note's picture, with whatever was drawn on it.
 *
 * The marks are geometry rather than pixels — see `saveNoteInk` — so they are
 * laid over the photograph here and scale with it. `viewBox` does the scaling:
 * the strokes were recorded against the canvas they were drawn on, and SVG
 * maps that onto whatever box this ends up in, at any size, on any screen.
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

  return (
    <View style={styles.wrap}>
      {uri ? (
        <Image source={{ uri }} style={style} resizeMode="contain" />
      ) : (
        /* A page is its own ground. It is drawn in the theme's card colour
           because that is the colour it was written on — a handwritten page
           reproduced on a different ground is a page in a different pen. */
        <View
          style={[
            style as StyleProp<ViewStyle>,
            styles.paper,
            { backgroundColor: colors.card, borderColor: colors.border },
            /*
             * A page keeps the shape it was written on.
             *
             * A picture can be letterboxed inside a fixed box and still read
             * correctly, because the photograph is the thing being looked at.
             * A page is the *paper*: forced into a landscape box, a portrait
             * page's writing shrinks into a column down the middle with empty
             * card either side, which looks like a rendering fault rather than
             * a page.
             */
            ownShape && ink ? { height: undefined, aspectRatio: ink.width / ink.height } : null,
          ]}
        />
      )}
      {ink && ink.strokes.length > 0 ? (
        <Svg
          style={StyleSheet.absoluteFill}
          width="100%"
          height="100%"
          viewBox={`0 0 ${ink.width} ${ink.height}`}
          pointerEvents="none">
          {ink.strokes.map((stroke, index) => (
            <Path
              key={index}
              d={stroke.d}
              stroke={stroke.color}
              strokeWidth={stroke.width}
              strokeLinecap="round"
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
  },
  paper: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
