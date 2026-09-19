/**
 * The general examination as a page of its own.
 *
 * `GeneralExamSigns` already renders inside the Guide tab of every proforma,
 * and that is right — it belongs with the case you are clerking. But it is also
 * the one thing a student wants WITHOUT a case: on the ward round, in the ten
 * seconds before the examiner reaches the bed, or while revising. Making them
 * open a case sheet they do not want in order to reach it is the kind of thing
 * that makes people stop using a feature.
 *
 * So the same component is also a page, reached from a button above the search
 * in the case-sheet picker. One component, two mount points — not a second copy
 * of the signs, which would be nineteen things to keep in step.
 *
 * Full-screen `<Modal>`, so `insets.top` is explicit: a modal is a window
 * outside the navigator's SafeAreaView and nothing insets it. `check:edges`
 * exists for that rule.
 */
import React, { useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, X } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { GeneralExamSigns } from '@/components/GeneralExamSigns';
import { useTheme } from '@/theme';

export interface GeneralExamSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function GeneralExamSheet({ visible, onClose }: GeneralExamSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [fullscreenImage, setFullscreenImage] = useState<{
    uri: string;
    title: string;
  } | null>(null);

  if (!visible) return null;

  return (
    <Modal visible onRequestClose={onClose} animationType="slide" statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            { paddingTop: insets.top + 8, borderBottomColor: colors.border },
          ]}>
          <Touchable onPress={onClose} label="Back" style={styles.back}>
            <ArrowLeft size={22} color={colors.text} />
          </Touchable>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>General Examination</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              PICCLE and the nail signs, with photographs
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <GeneralExamSigns onOpenImage={setFullscreenImage} />
        </ScrollView>

        {fullscreenImage ? (
          <Modal
            visible
            onRequestClose={() => setFullscreenImage(null)}
            animationType="fade"
            statusBarTranslucent>
            <View style={styles.fullscreenContainer}>
              <View style={[styles.fullscreenHeader, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
                <Text style={styles.fullscreenTitle} numberOfLines={1}>
                  {fullscreenImage.title}
                </Text>
                <Touchable
                  onPress={() => setFullscreenImage(null)}
                  label="Close image"
                  style={styles.fullscreenClose}>
                  <X size={22} color="#FFFFFF" />
                </Touchable>
              </View>
              <Image
                source={{ uri: fullscreenImage.uri }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            </View>
          </Modal>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { padding: 4 },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 48 },
  fullscreenContainer: { flex: 1, backgroundColor: '#000000' },
  fullscreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  fullscreenTitle: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  fullscreenClose: { padding: 6 },
  fullscreenImage: { flex: 1, width: '100%' },
});
