import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { ChevronRight } from "lucide-react-native";
import { Text } from "@/components/Text";
import { Touchable } from "@/components/Touchable";
import { QuestionRow } from "@/components/QuestionRow";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardSafe } from "@/components/KeyboardSafe";
import { SegmentedControl } from "@/components/ui";
import type { HomeStackParamList, RootTabParamList } from "@/navigation/types";
import type { YearKey } from "@/lib/questionBank";

type Year = "first-year" | "second-year" | "third-year" | "final-year";
type Kind = "essay" | "short-notes" | "unknown";
type Entry = {
  id: string;
  subject: string;
  chapter: string;
  question_type: Kind;
  question_text: string;
  source_pdf: string;
  source_pages: number[];
  exam_sessions: string[];
  review_status: string;
};
type Subject = { name: string; count: number };
type ListItem = { kind: "subject"; item: Subject } |
  { kind: "chapter"; name: string; count: number } |
  { kind: "question"; row: Entry };

const SUBJECTS: Record<Year, Subject[]> = {
  "first-year": [
    { name: "Anatomy", count: 1316 },
    { name: "Physiology", count: 1642 },
    { name: "Biochemistry", count: 719 },
  ],
  "second-year": [
    { name: "Pathology", count: 864 },
    { name: "Pharmacology", count: 1086 },
    { name: "Microbiology", count: 1067 },
  ],
  "third-year": [
    { name: "Community Medicine (PSM)", count: 824 },
    { name: "Forensic Medicine", count: 530 },
  ],
  "final-year": [
    { name: "Medicine", count: 1072 },
    { name: "Surgery", count: 777 },
    { name: "Obstetrics & Gynaecology", count: 869 },
    { name: "Paediatrics", count: 530 },
  ],
};
const YEAR_DB: Record<Year, string> = { "first-year": "first", "second-year": "second", "third-year": "third", "final-year": "final" };
const YEARS: { key: Year; label: string }[] = [
  { key: "first-year", label: "1st" }, { key: "second-year", label: "2nd" }, { key: "third-year", label: "3rd" }, { key: "final-year", label: "Final" },
];
const FIELDS = "id,subject,chapter,question_type,question_text,source_pdf,source_pages,exam_sessions,review_status";
const PAGE = 250;

function chapterLabel(row: Entry): string {
  if (row.chapter?.trim()) return row.chapter.trim();
  const page = row.source_pages?.[0] || 1;
  const start = Math.floor((page - 1) / 10) * 10 + 1;
  return "Unclassified chapters · PDF pages " + start + "–" + (start + 9);
}
function distinctSessions(row: Entry): string[] {
  return Array.from(new Set((row.exam_sessions ?? []).map(x => x.trim()).filter(Boolean)));
}

/**
 * Full RGUHS source question bank; quality flags stay internal.
 */
export default function RguhsImportedBank({ initialYear, onSwitchBack }: {
  initialYear: YearKey; onSwitchBack: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList, "BrowseHome">>();
  const [year, setYear] = useState<Year>(initialYear);
  const [subject, setSubject] = useState<string | null>(null);
  const [chapter, setChapter] = useState<string | null>(null);
  const [tab, setTab] = useState<Kind>("essay");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!subject) return;
    let canceled = false;
    setLoading(true); setError(""); setRows([]);
    const load = async () => {
      try {
        const all: Entry[] = [];
        for (let offset = 0; ; offset += PAGE) {
          const { data, error: queryError } = await supabase
            .from("rguhs_question_candidates").select(FIELDS)
            .eq("mbbs_year", YEAR_DB[year]).eq("subject", subject).eq("published", true)
            .order("normalized_key", { ascending: true }).order("id", { ascending: true })
            .range(offset, offset + PAGE - 1);
          if (queryError) throw new Error(queryError.message || "Could not load RGUHS");
          if (canceled) return;
          const batch = (data ?? []) as Entry[];
          all.push(...batch);
          if (batch.length < PAGE) break;
        }
        if (!canceled) setRows([...new Map(all.map(row => [row.id, row])).values()]);
      } catch (e) { if (!canceled) setError(e instanceof Error ? e.message : "Unable to load questions"); }
      finally { if (!canceled) setLoading(false); }
    };
    void load();
    return () => { canceled = true; };
  }, [year, subject, retry]);

  const chapterGroups = useMemo(() => {
    const groups = new Map<string, { name: string; count: number; page: number }>();
    for (const row of rows) {
      const name = chapterLabel(row);
      const page = row.source_pages?.[0] || 1;
      const old = groups.get(name);
      if (old) { old.count++; old.page = Math.min(old.page, page); }
      else groups.set(name, { name, count: 1, page });
    }
    return [...groups.values()].sort((a, b) => a.page - b.page || a.name.localeCompare(b.name));
  }, [rows]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter(row => chapterLabel(row) === chapter && row.question_type === tab &&
      (!needle || row.question_text.toLowerCase().includes(needle)));
  }, [rows, chapter, tab, query]);
  const data: ListItem[] = !subject ? SUBJECTS[year].map(item => ({ kind: "subject", item })) :
    !chapter ? chapterGroups.map(item => ({ kind: "chapter", name: item.name, count: item.count })) :
    visible.map(row => ({ kind: "question", row }));

  const back = useCallback(() => {
    if (chapter) { setChapter(null); setQuery(""); return; }
    if (subject) { setSubject(null); setRows([]); return; }
    onSwitchBack();
  }, [chapter, subject, onSwitchBack]);

  const askAi = useCallback((question: string) => {
    navigation.getParent<BottomTabNavigationProp<RootTabParamList>>()
      ?.navigate("AskAI", { question, nonce: Date.now() });
  }, [navigation]);

  return <KeyboardSafe>
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 8, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Touchable label="Back" onPress={back} style={{ borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 10 }}>
          <Text style={{ color: colors.text }}>‹ Back</Text>
        </Touchable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "800", fontSize: 18, color: colors.text }}>RGUHS — {subject || "Complete Question Bank"}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{chapter || "Karnataka • All four MBBS years"}</Text>
        </View>
      </View>
      <Text style={{ color: colors.textMuted, fontSize: 12, padding: 12, marginBottom: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border }}>
        RGUHS chapterwise questions with source PDF page references. Please cross-check printed exam dates against the original question papers.
      </Text>
      {!subject ? <SegmentedControl options={YEARS.map(x => ({ key: x.key, label: x.label }))}
        value={year} onChange={(next: Year) => { setYear(next); setChapter(null); setQuery(""); setRows([]); }} /> : null}
      {subject && !chapter && !loading ? <Text style={{ fontSize: 12, marginVertical: 10, color: colors.textMuted }}>
        {rows.length} imported questions. Select a chapter or source-page section.
      </Text> : null}
      {chapter ? <View style={{ marginBottom: 12 }}>
        <SegmentedControl options={[
          { key: "essay", label: "Essay" },
          { key: "short-notes", label: "Short Notes" },
          { key: "unknown", label: "Needs sorting" },
        ]} value={tab} onChange={(next: Kind) => { setTab(next); setQuery(""); }} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search this section"
          placeholderTextColor={colors.textMuted}
          style={{ marginTop: 10, padding: 12, color: colors.text, borderColor: colors.border, borderWidth: 1, backgroundColor: colors.card, borderRadius: 10 }} />
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 6 }}>{visible.length} matching questions</Text>
      </View> : null}
      {loading ? <ActivityIndicator color={colors.primary} style={{ margin: 24 }} /> : null}
      {!!error ? <Touchable onPress={() => setRetry(x => x + 1)} label="Retry loading RGUHS questions">
        <Text style={{ color: colors.danger }}>Loading error: {error}. Tap to retry.</Text>
      </Touchable> : null}
      {!loading && !error ? <FlatList
        data={data} keyExtractor={item => item.kind === "question" ? item.row.id : item.kind === "subject" ? item.item.name : item.name}
        keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={<Text style={{ padding: 15, color: colors.textMuted }}>No questions found in this section.</Text>}
        renderItem={({ item, index }) => {
          if (item.kind === "question") {
            const dateRefs = distinctSessions(item.row);
            const verified = item.row.review_status === "verified";
            return <View style={{ marginBottom: 14 }}>
              <QuestionRow question={item.row.question_text} index={index} onAskAi={askAi}
                repeatCountOverride={verified ? dateRefs.length : 0} />
              <Text style={{ color: colors.textMuted, fontSize: 11, paddingLeft: 10 }}>
                PDF p.{item.row.source_pages?.join(", ") || "?"}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 11, paddingLeft: 10 }}>
                {verified ? "Exam sessions: " : "Dates shown in source: "}
                {dateRefs.length ? dateRefs.join(" · ") : "Not reliably extracted"}
              </Text>
            </View>;
          }
          const label = item.kind === "subject" ? item.item.name : item.name;
          const count = item.kind === "subject" ? item.item.count : item.count;
          return <Touchable label={label} onPress={() => {
            if (item.kind === "subject") { setSubject(item.item.name); setChapter(null); setTab("essay"); }
            else { setChapter(item.name); setTab("essay"); setQuery(""); }
          }} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.card, padding: 15, marginBottom: 9, flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "700" }}>{label}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{count} imported questions</Text>
            </View><ChevronRight size={18} color={colors.textMuted} />
          </Touchable>;
        }}
      /> : null}
      {!subject ? <Touchable label="Open existing reviewed RGUHS bank" onPress={onSwitchBack}
        style={{ paddingVertical: 12 }}><Text style={{ color: colors.cyan }}>Open older reviewed RGUHS questions</Text></Touchable> : null}
    </View>
  </KeyboardSafe>;
}
