import React, { forwardRef } from 'react';
import {
  InlineCoronarySurface,
  type InlineCoronaryHandle,
} from '../../browser/InlineCoronarySurface';
import { CORONARY_SCENE_HTML } from '../../src/generated/coronarySceneHtml';
import { StyleSheet, View } from 'react-native';

/**
 * Video previews retain the existing placeholder. The trusted, locally bundled
 * coronary document renders the exact production WebGL scene in an iframe.
 *
 * The preview is react-native-web, where `react-native-webview` resolves to a
 * real `<iframe>` — and an iframe pointing at YouTube inside a harness that has
 * no route to the internet is a grey rectangle that takes several seconds to
 * decide it has failed. Worse, it would make every screenshot of a note depend
 * on whether YouTube was reachable from CI.
 *
 * So the shim draws the frame and nothing in it. Everything this feature is
 * checked on — that the still is what shows first, that tapping swaps to the
 * player, that the URL built for it is the no-cookie embed with the right
 * timestamp — is true either way, and `check:note-links` covers the URL itself.
 */
export const WebView = forwardRef<InlineCoronaryHandle, any>(function WebView(
  props,
  ref,
) {
  if (props.source?.html === CORONARY_SCENE_HTML)
    return <InlineCoronarySurface {...props} ref={ref} />;
  return (
    <View
      accessibilityLabel="Video player"
      style={[styles.stand, props.style as never]}
    />
  );
});

export default { WebView };

const styles = StyleSheet.create({
  stand: { backgroundColor: '#101014' },
});
