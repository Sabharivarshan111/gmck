import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { CORONARY_SCENE_HTML } from '../src/generated/coronarySceneHtml';
interface Props {
  source?: { html?: string };
  style?: StyleProp<ViewStyle>;
  onMessage?: (event: { nativeEvent: { data: string } }) => void;
  onLoadEnd?: () => void;
}
export interface InlineCoronaryHandle {
  injectJavaScript: (script: string) => void;
}
/** Browser host for the exact same trusted WebGL document shipped to Android. */
export const InlineCoronarySurface = forwardRef<InlineCoronaryHandle, Props>(
  function InlineCoronarySurface(props, ref) {
    const frame = useRef<HTMLIFrameElement>(null);
    const callbacks = useRef(props);
    callbacks.current = props;
    useImperativeHandle(
      ref,
      () => ({
        injectJavaScript(script) {
          const prefix = 'window.updateCoronaryScene(';
          if (!script.startsWith(prefix) || !script.endsWith(');true;')) return;
          try {
            frame.current?.contentWindow?.postMessage(
              {
                channel: 'orbit-coronary-config',
                config: JSON.parse(script.slice(prefix.length, -7)),
              },
              '*',
            );
          } catch {
            /* Invalid bridge payload. */
          }
        },
      }),
      [],
    );
    useEffect(() => {
      const listener = (event: MessageEvent) => {
        if (
          event.source !== frame.current?.contentWindow ||
          event.data?.channel !== 'orbit-coronary-webgl' ||
          typeof event.data.payload !== 'string'
        )
          return;
        callbacks.current.onMessage?.({
          nativeEvent: { data: event.data.payload },
        });
      };
      window.addEventListener('message', listener);
      return () => window.removeEventListener('message', listener);
    }, []);
    if (props.source?.html !== CORONARY_SCENE_HTML) return null;
    return (
      <iframe
        ref={frame}
        title="Coronary real-time 3D"
        srcDoc={CORONARY_SCENE_HTML}
        sandbox="allow-scripts allow-same-origin"
        onLoad={() => callbacks.current.onLoadEnd?.()}
        style={{
          flex: 1,
          display: 'block',
          border: 0,
          width: '100%',
          height: '100%',
        }}
      />
    );
  },
);
