import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Crown, Gem, ShieldCheck, Sparkles } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme } from '@/theme';

export type FounderRole = 'Founder' | 'Co-Founder';

const messages: Record<FounderRole, string[]> = {
  Founder: [
    'The first orbit began with your idea. ✦',
    'Founder access: the original constellation is yours.',
    'Secret unlocked: IMAGINE · BUILD · INSPIRE.',
    'Every world begins with someone willing to create it.',
  ],
  'Co-Founder': [
    'You belong to the constellation that builds ORBIT. ✦',
    'A rare orbit unlocked. Your ideas matter here.',
    'Secret unlocked: DREAM · BUILD · REPEAT.',
    'Not just part of the journey. Part of its beginning.',
  ],
};

/** A private identity collectible, deliberately NOT a payment card. */
export function FounderIdentityCard({
  role,
  cardholderName,
}: {
  role: FounderRole;
  cardholderName: string;
}) {
  const { colors } = useTheme();
  const isFounder = role === 'Founder';
  const metal = isFounder;
  const turning = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);
  const [secretIndex, setSecretIndex] = useState(-1);
  const name = (cardholderName.trim() || (isFounder ? 'SABHARIVARSHAN S' : 'ORBIT CO-FOUNDER')).toUpperCase();
  const color = metal ? '#1B2636' : '#F5F6FE';
  const faded = metal ? '#4C5869' : '#B6C7E5';

  const flip = () => {
    Animated.timing(turning, {
      toValue: flipped ? 0 : 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    setFlipped(!flipped);
  };

  const frontSpin = turning.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backSpin = turning.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <View style={styles.section} testID="founders-edition-container">
      <View style={styles.heading}>
        <View style={styles.headingIcon}><Gem size={17} color="#A5A8E2" /></View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headingTitle, { color: colors.text }]}>Your Founder's Card</Text>
          <Text style={[styles.headingSubtitle, { color: colors.textMuted }]}>Exclusively yours · ORBIT Founders Edition</Text>
        </View>
        <Text style={[styles.editionMark, { color: colors.violet }]}>✦  {isFounder ? '01 / 01' : '02 / 02'}</Text>
      </View>

      <Touchable
        label={'Flip ' + role + ' silver identity card to reveal its hidden message'}
        hint="A collectible ORBIT identity card. Not a payment card."
        onPress={flip}
        scaleTo={0.985}
        testID="founders-edition-flip"
        style={styles.cardTouch}>
        <Animated.View
          style={[styles.cardFace, { transform: [{ rotateY: frontSpin }], backfaceVisibility: 'hidden' }]}>
          <Svg pointerEvents="none" width="100%" height="100%" viewBox="0 0 350 220" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="plate" x1="0%" y1="0%" x2="100%" y2="100%">
                {[metal ? (
                  <>
                    <Stop offset="0%" stopColor="#F8F9FD" />
                    <Stop offset="19%" stopColor="#C7CDD6" />
                    <Stop offset="37%" stopColor="#EFF2F5" />
                    <Stop offset="55%" stopColor="#A9B3C3" />
                    <Stop offset="77%" stopColor="#E9EDF3" />
                    <Stop offset="100%" stopColor="#98A5B6" />
                  </>
                ) : (
                  <>
                    <Stop offset="0%" stopColor="#10192B" />
                    <Stop offset="36%" stopColor="#243752" />
                    <Stop offset="70%" stopColor="#161D32" />
                    <Stop offset="100%" stopColor="#5C6389" />
                  </>
                )]}
              </LinearGradient>
              <LinearGradient id="reflection" x1="0%" y1="0%" x2="100%" y2="75%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
                <Stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.03" />
                <Stop offset="52%" stopColor="#FFFFFF" stopOpacity="0.22" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </LinearGradient>
              <LinearGradient id="chip" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#F9E7C0" />
                <Stop offset="48%" stopColor="#B89D69" />
                <Stop offset="85%" stopColor="#FFF1C9" />
                <Stop offset="100%" stopColor="#98865D" />
              </LinearGradient>
            </Defs>
            <Rect width="350" height="220" rx="19" fill="url(#plate)" />
            <Path d="M-35 155 L245 -45 L400 10 L70 235Z" fill="url(#reflection)" />
            {Array.from({ length: 23 }, (_, i) => (
              <Path key={i} d={'M0 ' + (i * 11) + ' H350'} stroke={metal ? '#FFFFFF' : '#9CB6D1'} strokeWidth=".22" opacity={metal ? '.38' : '.14'} />
            ))}
            <Ellipse cx="297" cy="120" rx="127" ry="50" transform="rotate(-31 297 120)"
              stroke={metal ? '#53667B' : '#CBD8F6'} strokeWidth="1.5" strokeOpacity=".42" fill="none" />
            <Circle cx="290" cy="122" r="76" stroke={metal ? '#4C6076' : '#AEC4EE'} strokeWidth=".9" strokeOpacity=".22" fill="none" />
            <Circle cx="290" cy="122" r="48" stroke={metal ? '#4C6076' : '#AEC4EE'} strokeWidth=".8" strokeOpacity=".22" fill="none" />
            <Circle cx="185" cy="162" r="4" fill={metal ? '#576781' : '#E9D7AC'} />
            <Path d="M250 -8 L350 60" stroke="#FFFFFF" strokeOpacity=".4" strokeWidth="30" />
            <Rect x="1.5" y="1.5" width="347" height="217" rx="18.5" stroke={metal ? '#FDFEFF' : '#E1D8CB'}
              strokeOpacity=".7" strokeWidth="1.4" fill="none" />
            <Rect x="25" y="84" width="49" height="37" rx="7" fill="url(#chip)"
              stroke={metal ? '#827750' : '#F8E0A1'} strokeWidth="1" />
            <Rect x="37" y="90" width="25" height="25" rx="5" fill="none" stroke="#846D4C" strokeWidth="1.2" />
            <Path d="M25 96 H37 M25 110 H37 M62 96 H74 M62 110 H74 M49 84 V90 M49 115 V121"
              stroke="#806B4C" strokeWidth="1.2" fill="none" />
          </Svg>

          <View style={styles.faceBody} pointerEvents="none">
            <View style={styles.topLine}>
              <View>
                <Text style={[styles.brand, { color }]}>ORBIT</Text>
                <Text style={[styles.brandSub, { color: faded }]}>M B B S     ·     FOUNDERS EDITION</Text>
              </View>
              <Text style={[styles.topIcon, { color }]}>✦</Text>
            </View>

            <View style={styles.centerLine}>
              <Text style={[styles.role, { color }]}>{role.toUpperCase()}</Text>
              <Text style={[styles.roleMeta, { color: faded }]}>{isFounder ? 'ORIGINAL FOUNDER  ·  Nº 001' : 'FOUNDING MEMBER  ·  Nº 002'}</Text>
            </View>

            <View style={styles.bottomLine}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardLabel, { color: faded }]}>CARDHOLDER</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}
                  style={[styles.cardName, { color }]}>{name}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.infinity, { color }]}>∞</Text>
                <Text style={[styles.signature, { color: faded }]}>ORBIT PRIVATE</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[styles.cardFace, styles.cardBack, { transform: [{ rotateY: backSpin }], backfaceVisibility: 'hidden' }]}>
          <Svg pointerEvents="none" width="100%" height="100%" viewBox="0 0 350 220" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="reverse" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#07101F" />
                <Stop offset="48%" stopColor="#253550" />
                <Stop offset="100%" stopColor="#1A1527" />
              </LinearGradient>
            </Defs>
            <Rect width="350" height="220" rx="19" fill="url(#reverse)" />
            <Ellipse cx="175" cy="110" rx="164" ry="66" transform="rotate(-28 175 110)"
              fill="none" stroke="#B8C7E2" strokeWidth="1.2" strokeOpacity=".18" />
            <Rect x="1.5" y="1.5" width="347" height="217" rx="18" fill="none" stroke="#C8D5EC" strokeOpacity=".5" />
          </Svg>
          <View style={styles.reverseText}>
            <Crown size={29} color="#EED6A0" />
            <Text style={styles.reverseEyebrow}>THE ORBIT UNIVERSE</Text>
            <Text style={styles.reverseMessage}>
              {isFounder
                ? 'Every orbit has a beginning. This one began with your vision.'
                : 'You are more than part of ORBIT. You help shape its future.'}
            </Text>
            <Text style={styles.reverseFooter}>✦  AN ORIGINAL STORY, STILL UNFOLDING  ✦</Text>
          </View>
        </Animated.View>
      </Touchable>

      <View style={styles.actionRow}>
        <Text style={[styles.flipHint, { color: colors.textMuted }]}>↻  Tap the card to flip</Text>
        <Touchable
          label="Unlock a founders-only Easter egg"
          testID="founders-edition-secret"
          onPress={() => setSecretIndex(i => (i + 1) % messages[role].length)}
          style={styles.secretButton}>
          <Sparkles size={14} color="#C7A7FF" />
          <Text style={styles.secretButtonText}>Find a secret</Text>
        </Touchable>
      </View>
      {secretIndex >= 0 ? (
        <View style={styles.secretMessage}>
          <Text style={styles.secretMessageText}>{messages[role][secretIndex]}</Text>
          <Text style={styles.secretDots}>
            {messages[role].map((_, i) => i === secretIndex ? '✦' : '·').join('   ')}
          </Text>
        </View>
      ) : null}
      <View style={styles.disclaimer}>
        <ShieldCheck size={12} color="#8E96A4" />
        <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>Exclusive verified identity collectible · Not a payment card</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 8, marginBottom: 12, gap: 10 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  headingIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#27223D' },
  headingTitle: { fontSize: 15, fontWeight: '800', color: '#F1F1F6' },
  headingSubtitle: { fontSize: 10, color: '#A3A5AF', marginTop: 3 },
  editionMark: { fontSize: 10, fontWeight: '800', color: '#A5A8C5', letterSpacing: 1 },
  cardTouch: { width: '100%', maxWidth: 490, alignSelf: 'center', aspectRatio: 1.586, position: 'relative', borderRadius: 19, shadowColor: '#000', shadowOpacity: 0.32, shadowRadius: 19, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
  cardFace: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderRadius: 19, overflow: 'hidden' },
  faceBody: { flex: 1, paddingHorizontal: '7%', paddingTop: '6%', paddingBottom: '5.5%', justifyContent: 'space-between' },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand: { fontSize: 22, fontWeight: '900', letterSpacing: 4, lineHeight: 26 },
  brandSub: { fontSize: 7, fontWeight: '800', letterSpacing: 1.4 },
  topIcon: { fontSize: 24, fontWeight: '800' },
  centerLine: { marginTop: 21, marginLeft: '19%' },
  role: { fontSize: 17, fontWeight: '900', letterSpacing: 2.7 },
  roleMeta: { fontSize: 8, marginTop: 5, fontWeight: '700', letterSpacing: 1.1 },
  bottomLine: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  cardLabel: { fontSize: 8, letterSpacing: 2.4, fontWeight: '800', marginBottom: 3 },
  cardName: { fontSize: 19, fontWeight: '900', letterSpacing: 1.7 },
  infinity: { fontSize: 23, lineHeight: 25, fontWeight: '400' },
  signature: { fontSize: 7, fontWeight: '700', letterSpacing: 1.2 },
  cardBack: { backgroundColor: '#111A2E' },
  reverseText: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, gap: 11 },
  reverseEyebrow: { fontSize: 9, color: '#EED6A0', fontWeight: '900', letterSpacing: 2.5 },
  reverseMessage: { fontSize: 17, fontWeight: '800', lineHeight: 23, color: '#FFFFFF', textAlign: 'center' },
  reverseFooter: { fontSize: 8, color: '#C5C1D5', letterSpacing: 1.5, textAlign: 'center', marginTop: 8 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  flipHint: { fontSize: 11, color: '#A7A7B5' },
  secretButton: { flexDirection: 'row', gap: 7, alignItems: 'center', borderRadius: 100, borderWidth: 1, borderColor: '#6E588D', paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#29213D' },
  secretButtonText: { fontSize: 11, color: '#E4D8FF', fontWeight: '800' },
  secretMessage: { padding: 13, backgroundColor: '#24233A', borderColor: '#63537E', borderWidth: 1, borderRadius: 14 },
  secretMessageText: { fontSize: 12, fontWeight: '700', color: '#F2E8FF' },
  secretDots: { fontSize: 11, color: '#B8A0ED', textAlign: 'center', marginTop: 8 },
  disclaimer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  disclaimerText: { fontSize: 10, color: '#9699A3' },
});
