import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { CORONARY_SCENE_HTML } from '@/generated/coronarySceneHtml';
import type { CoronarySceneConfig } from '@/lib/coronaryModel';
import type { Angles } from '@/lib/coronaryLab';
import { typeScale } from '@/theme/typography';

interface Props {
  selected: string;
  onSelect: (id: string) => void;
  angles: Angles;
  mode: 'anatomy' | 'projection' | 'room';
  shell: boolean;
  labels: boolean;
  zoom: number;
  system: 'both' | 'left' | 'right';
  reset: number;
}
/** One real locally bundled WebGL scene on Android and in the browser harness. */
export default function CoronaryLabScene({
  selected,
  onSelect,
  angles,
  mode,
  shell,
  labels,
  zoom,
  system,
  reset,
}: Props) {
  const ref = useRef<WebView<object>>(null);
  const [error, setError] = useState('');
  const [generation, setGeneration] = useState(0);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const source = useMemo(
    () => ({
      html: CORONARY_SCENE_HTML,
      baseUrl: 'https://orbit-coronary.local/',
    }),
    [],
  );
  const config = useMemo<CoronarySceneConfig>(
    () => ({
      selected,
      angles,
      mode,
      shell,
      labels,
      zoom,
      system,
      reset,
      active,
    }),
    [selected, angles, mode, shell, labels, zoom, system, reset, active],
  );
  const latest = useRef(config);
  latest.current = config;
  const inject = () =>
    ref.current?.injectJavaScript(
      'window.updateCoronaryScene(' +
        JSON.stringify(latest.current) +
        ');true;',
    );
  useEffect(() => {
    const sub = AppState.addEventListener('change', s =>
      setActive(s === 'active'),
    );
    return () => sub.remove();
  }, []);
  useEffect(() => {
    ref.current?.injectJavaScript(
      'window.updateCoronaryScene(' + JSON.stringify(config) + ');true;',
    );
  }, [config, generation]);
  return (
    <View style={styles.root} testID="coronary-webgl-surface">
      <WebView<object>
        key={generation}
        ref={ref}
        source={source}
        style={styles.root}
        originWhitelist={['https://orbit-coronary.local', 'about:blank']}
        javaScriptEnabled
        domStorageEnabled={false}
        mixedContentMode="never"
        allowFileAccess={false}
        allowUniversalAccessFromFileURLs={false}
        scrollEnabled={false}
        bounces={false}
        nestedScrollEnabled
        onShouldStartLoadWithRequest={request =>
          request.url === 'about:blank' ||
          request.url.startsWith('https://orbit-coronary.local/')
        }
        onLoadEnd={inject}
        onError={event =>
          setError(
            event.nativeEvent.description || '3D renderer could not load.',
          )
        }
        onMessage={event => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'select' && typeof data.id === 'string')
              onSelect(data.id);
            if (data.type === 'ready') {
              setError('');
              inject();
            }
            if (data.type === 'error')
              setError(
                '3D graphics are unavailable on this device. Enable WebGL or retry.',
              );
          } catch {
            /* Ignore malformed renderer messages. */
          }
        }}
      />
      {!!error && (
        <View style={styles.error}>
          <Text style={styles.message}>{error}</Text>
          <Touchable
            label="Retry coronary 3D renderer"
            onPress={() => {
              setError('');
              setGeneration(n => n + 1);
            }}
            style={styles.retry}
          >
            <Text style={styles.message}>Retry 3D</Text>
          </Touchable>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#11111b' },
  error: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#11111b',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  message: { ...typeScale.caption, color: '#f5e8ff' },
  retry: {
    minHeight: 44,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8a1f8',
    borderRadius: 12,
  },
});
