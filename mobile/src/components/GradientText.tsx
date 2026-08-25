import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/theme';

let seq = 0;

// SVG text defaults to a serif face; name the UI font so headings match the
// rest of the app.
const FONT_FAMILY = Platform.select({
  android: 'sans-serif',
  default: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
});

/**
 * Bold headline with a rainbow gradient clipped to the text,
 * sliding continuously for a glossy iridescent sweep ("Gradient Shimmer" effect).
 */
export function GradientText({
  children,
  size = 24,
  weight = '800',
  letterSpacing = 0,
  from,
  to,
  align = 'center',
}: {
  children: string;
  size?: number;
  weight?: string;
  letterSpacing?: number;
  from?: string;
  to?: string;
  align?: 'center' | 'left';
}) {
  const { colors } = useTheme();
  const id = useMemo(() => {
    seq += 1;
    return `gt${seq}`;
  }, []);

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  // On Web, use hardware-accelerated CSS background-clip + shimmer animation
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.wrap, { alignItems: align === 'center' ? 'center' : 'flex-start' }]}>
        <div style={{ position: 'relative', display: 'inline-grid', placeItems: 'center' }}>
          <h1
            className="gradient-shimmer-text"
            style={{
              margin: 0,
              padding: 0,
              textAlign: align,
              fontFamily: FONT_FAMILY,
              fontWeight: weight as any,
              fontSize: size,
              letterSpacing: letterSpacing ? `${letterSpacing}px` : '-0.03em',
              lineHeight: 1.1,
            }}>
            {children}
          </h1>
        </div>
      </View>
    );
  }

  const height = Math.round(size * 1.35);

  return (
    <View style={[styles.wrap, { height }]}>
      <Svg width="100%" height={height}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#ff2e97" />
            <Stop offset="0.2" stopColor="#ff8a00" />
            <Stop offset="0.4" stopColor="#ffe600" />
            <Stop offset="0.6" stopColor="#00ffd5" />
            <Stop offset="0.8" stopColor="#5d6bff" />
            <Stop offset="1" stopColor="#ff2e97" />
          </LinearGradient>
        </Defs>
        <SvgText
          x={align === 'center' ? '50%' : '0'}
          y={size}
          fontSize={size}
          fontFamily={FONT_FAMILY}
          fontWeight={weight}
          letterSpacing={letterSpacing}
          textAnchor={align === 'center' ? 'middle' : 'start'}
          fill={`url(#${id})`}>
          {children}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
  },
});
