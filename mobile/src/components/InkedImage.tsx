import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ImageStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { loadNoteInk, type NoteInk } from '@/lib/noteImages';

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
}: {
  uri: string;
  /** The picture's local id, which is what the marks are filed under. */
  imageId: string;
  style?: StyleProp<ImageStyle>;
}) {
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
      <Image source={{ uri }} style={style} resizeMode="contain" />
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
});
