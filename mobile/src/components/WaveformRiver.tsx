import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';

interface WaveformRiverProps {
  active?: boolean;
  color?: string;
  height?: number;
}

/**
 * Waveform River Audio Visualizer for Native iOS / Android
 */
export function WaveformRiver({
  active = true,
  color = '#22d3ee',
  height = 52,
}: WaveformRiverProps) {
  const { colors } = useTheme();
  const [phase, setPhase] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      return;
    }
    let current = 0;
    let running = true;
    const animate = () => {
      if (!running) return;
      current += 0.08;
      setPhase(current);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [active]);

  const mid = height * 0.5;
  const a1 = Math.sin(phase) * 12;
  const a2 = Math.cos(phase * 1.3) * 14;
  const a3 = Math.sin(phase * 0.8 + 1.2) * 10;

  const y1 = mid + a1;
  const y2 = mid - a2;
  const y3 = mid + a3;

  const pathTop = `M 0 ${mid} C 60 ${y1} 120 ${y2} 200 ${y3} S 300 ${y1} 360 ${mid}`;
  const pathBottom = `C 300 ${mid - a1} 240 ${mid + a2} 160 ${mid - a3} S 60 ${mid - a1} 0 ${mid}`;

  return (
    <View style={[styles.container, { height, borderColor: colors.border }]}>
      <View style={styles.badgeRow}>
        <View style={[styles.liveDot, { backgroundColor: color }]} />
        <Text style={[styles.liveLabel, { color }]}>LISTENING...</Text>
      </View>
      <Svg width="100%" height={height} viewBox="0 0 360 52" style={styles.svgBg}>
        <Defs>
          <LinearGradient id="waveRiverGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="0.04" />
            <Stop offset="0.7" stopColor={color} stopOpacity="0.22" />
            <Stop offset="1" stopColor={color} stopOpacity="0.52" />
          </LinearGradient>
        </Defs>
        <Path
          d={`${pathTop} ${pathBottom} Z`}
          fill="url(#waveRiverGrad)"
        />
        <Path
          d={pathTop}
          stroke={color}
          strokeWidth="1.8"
          fill="none"
        />
        <Circle cx="352" cy={mid} r="3.2" fill={color} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#07080d',
    marginBottom: 8,
  },
  badgeRow: {
    position: 'absolute',
    top: 6,
    left: 10,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(7, 8, 13, 0.75)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  svgBg: {
    backgroundColor: '#07080d',
    width: '100%',
    height: '100%',
  },
});
