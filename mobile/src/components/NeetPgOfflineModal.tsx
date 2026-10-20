import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, Modal, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZoomableImage } from '@/components/ZoomableImage';
import { Text } from '@/components/Text';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { radius, space } from '@/theme/tokens';
import type { InstalledReader } from '@shared/neetPgInstall';
import type { OfflineMcq } from '@shared/neetPgOffline';

const YEARS = [['first-year', '1st Year'], ['second-year', '2nd Year'], ['third-year', '3rd Year'], ['final-year', 'Final Year']] as const;

export function NeetPgOfflineModal({ visible, onClose, installed, onReplace, installing }: {
  visible: boolean; onClose: () => void; installed: InstalledReader;
  onReplace: () => void; installing: boolean;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [year, setYear] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [chapterId, setChapter] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [revealed, setRevealed] = useState<string | null>(null);
  const list = useRef<FlatList<OfflineMcq>>(null);
  useEffect(() => { list.current?.scrollToOffset({ offset: 0, animated: false }); }, [year, subject, chapterId, page]);
  const { reader } = installed;
  const chapters = useMemo(() => reader.chapters(), [reader]);
  const filteredChapters = useMemo(() => chapters.filter(c => !year || c.year === year), [chapters, year]);
  const subjects = useMemo(() => Array.from(new Map(filteredChapters.map(c => [c.subject, c.names[0]])).entries()), [filteredChapters]);
  const result = useMemo(() => reader.search({ year: year ?? undefined, subject: subject ?? undefined, chapterId: chapterId ?? undefined, query, offset: page * 30, limit: 30 }), [reader, year, subject, chapterId, query, page]);
  const reset = () => { setPage(0); setRevealed(null); };
  const chip = (id: string, label: string, selected: boolean, press: () => void) => (
    <Touchable key={id} label={label} state={{ selected }} onPress={press}
      style={[styles.chip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? withAlpha(colors.primary, 0.12) : colors.card }]}>
      <Text style={[typeScale.footnote, { color: colors.text }]}>{label}</Text>
    </Touchable>
  );
  return <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderColor: colors.border }]}>
        <Touchable label="Close offline NEET PG bank" onPress={onClose} style={styles.button}><Text style={{ color: colors.primary }}>Back</Text></Touchable>
        <View style={styles.flex}><Text style={[typeScale.title3, { color: colors.text }]}>NEET-PG</Text><Text style={[typeScale.caption, { color: colors.textMuted }]}>{reader.total.toLocaleString()} questions · stored offline</Text></View>
        <Touchable label="Replace offline bank" onPress={onReplace} disabled={installing} style={styles.button}><Text style={{ color: colors.primary }}>{installing ? 'Installing…' : 'Replace'}</Text></Touchable>
      </View>
      <KeyboardSafe style={styles.flex}><FlatList
        ref={list}
        data={result.records} keyExtractor={row => row.id} keyboardShouldPersistTaps="handled"
        initialNumToRender={6} maxToRenderPerBatch={6} windowSize={5}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + space.xxl }]}
        ListHeaderComponent={<View style={styles.filters}>
          <TextInput value={query} onChangeText={value => { setQuery(value); reset(); }} placeholder="Search questions and explanations" accessibilityLabel="Search offline NEET PG questions" placeholderTextColor={colors.textMuted} style={[styles.input, typeScale.callout, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.chips}>
            {chip('all-years', 'All years of study', year === null, () => { setYear(null); setSubject(null); setChapter(null); reset(); })}
            {YEARS.map(([id, label]) => chip(id, label, year === id, () => { setYear(id); setSubject(null); setChapter(null); reset(); }))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.chips}>
            {chip('all-subjects', 'All subjects', subject === null, () => { setSubject(null); setChapter(null); reset(); })}
            {subjects.map(([id, label]) => chip(id, label, subject === id, () => { setSubject(id); setChapter(null); reset(); }))}
          </ScrollView>
          {subject ? <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.chips}>
            {chip('all-chapters', 'All chapters', chapterId === null, () => { setChapter(null); reset(); })}
            {filteredChapters.filter(c => c.subject === subject).map(c => chip(c.id, `${c.name} (${c.count})`, chapterId === c.id, () => { setChapter(c.id); reset(); }))}
          </ScrollView> : <Text style={[typeScale.footnote, { color: colors.textMuted }]}>Choose a subject to browse its existing chapters.</Text>}
          <Text style={[typeScale.footnote, { color: colors.textMuted }]}>{result.total.toLocaleString()} matching questions</Text>
        </View>}
        ListEmptyComponent={<Text style={[typeScale.body, { color: colors.textMuted }]}>No questions match. Clear the search or choose another chapter.</Text>}
        renderItem={({ item }) => <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[typeScale.caption, { color: colors.textMuted }]}>{chapters.find(c => c.id === item.chapterId)?.name}</Text>
          <Text style={[typeScale.bodyStrong, { color: colors.text }]}>{item.question}</Text>
          {item.imageIds.map(id => { const image = reader.image(id)!; return <Touchable key={id} label="Open question illustration" onPress={() => setActiveImage(id)}><Image source={{ uri: image.dataUri }} accessibilityLabel={image.alt} resizeMode="contain" style={styles.image} /></Touchable>; })}
          {item.options.map((option, index) => <Text key={index} style={[typeScale.body, { color: revealed === item.id && index === item.answerIndex ? colors.success : colors.text }]}>{String.fromCharCode(65 + index)}. {option}</Text>)}
          <Touchable label={revealed === item.id ? 'Hide answer and explanation' : 'Show answer and explanation'} onPress={() => setRevealed(revealed === item.id ? null : item.id)} style={[styles.button, { backgroundColor: withAlpha(colors.primary, 0.1) }]}><Text style={{ color: colors.primary }}>{revealed === item.id ? 'Hide answer' : 'Answer + explanation'}</Text></Touchable>
          {revealed === item.id ? <View style={styles.explanation}><Text style={[typeScale.bodyStrong, { color: colors.text }]}>Answer: {item.sourceAnswer}</Text><Text style={[typeScale.body, { color: colors.text }]}>{item.explanation}</Text></View> : null}
        </View>}
        ListFooterComponent={result.total > 30 ? <View style={styles.header}>
          <Touchable label="Previous offline question page" onPress={() => { setPage(Math.max(0, page - 1)); setRevealed(null); }} disabled={page === 0} style={styles.button}><Text style={{ color: colors.primary }}>Previous</Text></Touchable>
          <Text style={[typeScale.caption, { color: colors.textMuted }]}>Page {page + 1} of {Math.ceil(result.total / 30)}</Text>
          <Touchable label="Next offline question page" onPress={() => { setPage(page + 1); setRevealed(null); }} disabled={(page + 1) * 30 >= result.total} style={styles.button}><Text style={{ color: colors.primary }}>Next</Text></Touchable>
        </View> : undefined}
      /></KeyboardSafe>
      <ZoomableImage visible={activeImage !== null} onClose={() => setActiveImage(null)} uri={activeImage ? reader.image(activeImage)?.dataUri : null} title="Question illustration" imageLabel="Question illustration" />
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  screen: { flex: 1 }, flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm, padding: space.md, borderBottomWidth: StyleSheet.hairlineWidth },
  body: { padding: space.lg, gap: space.md }, filters: { gap: space.md, paddingBottom: space.lg },
  chips: { gap: space.sm }, chip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.md, borderWidth: 1, borderRadius: radius.pill },
  button: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.md, borderRadius: radius.md },
  input: { minHeight: 44, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.md },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: space.lg, gap: space.md },
  image: { width: '100%', height: 240 }, explanation: { gap: space.sm },
});
