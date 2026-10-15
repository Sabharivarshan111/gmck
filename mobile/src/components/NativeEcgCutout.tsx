import React, { memo, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Text } from '@/components/Text';
import { NATIVE_CUTOUT_CONFIGS, nativeEcgCutoutSvg } from '@/lib/nativeEcgCutoutDrawing';

/** Same illustrative Lead II drawing and labels as the canonical cutout. */
function NativeEcgCutout({ segmentId }: { segmentId: string }) {
  const cfg = NATIVE_CUTOUT_CONFIGS[segmentId] || NATIVE_CUTOUT_CONFIGS.qrs;
  const xml = useMemo(() => nativeEcgCutoutSvg(segmentId), [segmentId]);
  return <View style={{ padding: 12, borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 12, backgroundColor: '#020617', gap: 8 }}>
    <Text style={{ color: '#f1f5f9', fontSize: 12, lineHeight: 18, fontWeight: '700', fontFamily: 'monospace' }}>🔍 Single-Lead Magnified Cut-Out: {cfg.name}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <Text style={{ color: '#67e8f9', fontSize: 12, fontFamily: 'monospace' }}>Lead II (4x Zoom)</Text>
      <Text style={{ color: '#fda4af', fontSize: 12, fontFamily: 'monospace' }}>25 mm/s | 10 mm/mV</Text>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator style={{ flexGrow: 0, borderRadius: 8, borderWidth: 1, borderColor: '#fca5a5', backgroundColor: '#fff5f5' }}>
      <SvgXml xml={xml} width={700} height={210 * 700 / 760} accessibilityLabel={`${cfg.name}: magnified Lead II with duration and voltage calipers, landmarks and electrical vector`} />
    </ScrollView>
  </View>;
}

export default memo(NativeEcgCutout);
