import React from 'react';
import { View, type ViewProps } from 'react-native';

/**
 * Dev-only stand-in for react-native-video.
 *
 * Renders nothing but keeps the layout, so a screen that composes a video
 * background still lays out correctly in the preview. Playback, and the
 * battery cost that makes it worth pausing, are device concerns the harness
 * cannot report on either way.
 */
/**
 * `ViewType`, because the wallpaper names one.
 *
 * The real enum decides whether Android renders the player into a SurfaceView
 * or a TextureView, which is a distinction a browser has no equivalent of and
 * does not need — but importing a name that is not exported throws at module
 * load, which takes the whole app down rather than the one screen. This shim
 * existing at all is the reminder: a native dependency needs a stand-in on the
 * same commit that starts using a new part of it.
 */
export const ViewType = { TEXTURE: 0, SURFACE: 1, SURFACE_SECURE: 2 } as const;

export default function Video(props: ViewProps) {
  return <View {...props} />;
}
