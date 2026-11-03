import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import QuestionCard from "@/components/QuestionCard";

type Year = "first-year" | "second-year" | "third-year";
type Kind = "essay" | "short-notes" | "unknown";
type Entry = {
  id: string; subject: string; chapter: string; question_type: Kind;
  question_text: string; source_pdf: string; source_pages: number[];
  exam_sessions: string[]; review_status: string;
};
const SUBJECTS: Record<Year, { name: string; icon: string; key: string; count: number }[]> = {
  "first-year": [
    { name: "Anatomy", icon: "🫀", key: "anatomy", count: 1316 },
    { name: "Physiology", icon: "🧠", key: "physiology", count: 1642 },
    { name: "Biochemistry", icon: "🧬", key: "biochemistry", count: 719 },
  ],
  "second-year": [
    { name: "Pathology", icon: "🔬", key: "pathology", count: 864 },
    { name: "Pharmacology", icon: "💊", key: "pharmacology", count: 1086 },
    { name: "Microbiology", icon: "🦠", key: "microbiology", count: 1067 },
  ],
  "third-year": [
    { name: "Community Medicine (PSM)", icon: "🏥", key: "community-medicine", count: 824 },
    { name: "Forensic Medicine", icon: "⚖️", key: "forensic-medicine", count: 530 },
  ],
};
const YEAR_TO_DB: Record<Year, string> = { "first-year": "first", "second-year": "second", "third-year": "third" };
const YEAR_TEXT: Record<Year, string> = { "first-year": "1st Year", "second-year": "2nd Year", "third-year": "3rd Year Part I" };
const PAGE_SIZE = 250;
const FIELDS = "id,subject,chapter,question_type,question_text,source_pdf,source_pages,exam_sessions,review_status";
function chapterLabel(item: Entry) {
  if (item.chapter?.trim()) return item.chapter.trim();
  const page = item.source_pages?.[0] || 1;
  const start = Math.floor((page - 1) / 10) * 10 + 1;
  return "Unclassified chapters · PDF pages " + start + "–" + (start + 9);
}
function examLabels(item: Entry) {
  return Array.from(new Set((item.exam_sessions ?? []).map(x => x.trim()).filter(Boolean)));
}
/** Imported RGUHS questions; provenance remains in internal review_status. */
export default function RGUHSCompleteBank({ yearKey, onSwitchBack, onYearChange }: { yearKey: Year; onSwitchBack: () => void; onYearChange: (year: Year) => void }) {
  const [subject, setSubject] = useState<string | null>(null);
  const [chapter, setChapter] = useState<string | null>(null);
  const [tab, setTab] = useState<Kind>("essay");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => { setSubject(null); setChapter(null); setItems([]); setQuery(""); }, [yearKey]);

  useEffect(() => {
    if (!subject) return;
    let cancelled = false;
    setLoading(true); setError(""); setItems([]);
    const load = async () => {
      try {
        const all: Entry[] = [];
        for (let offset = 0; ; offset += PAGE_SIZE) {
          const { data, error: queryError } = await (supabase as any)
            .from("rguhs_question_candidates").select(FIELDS)
            .eq("mbbs_year", YEAR_TO_DB[yearKey]).eq("subject", subject).eq("published", true)
            .order("normalized_key", { ascending: true }).order("id", { ascending: true })
            .range(offset, offset + PAGE_SIZE - 1);
          if (queryError) throw new Error(queryError.message || "Could not load RGUHS questions");
          if (cancelled) return;
          const batch = (data || []) as Entry[];
          all.push(...batch);
          if (batch.length < PAGE_SIZE) break;
        }
        if (!cancelled) setItems([...new Map(all.map(x => [x.id, x])).values()]);
      } catch (reason) { if (!cancelled) setError(reason instanceof Error ? reason.message : "Loading failed"); }
      finally { if (!cancelled) setLoading(false); }
    };
    void load();
    return () => { cancelled = true; };
  }, [subject, yearKey, retry]);

  const groups = useMemo(() => {
    const map = new Map<string, { name: string; count: number; page: number }>();
    items.forEach(item => {
      const name = chapterLabel(item);
      const page = item.source_pages?.[0] ?? 1;
      const old = map.get(name);
      if (old) { old.count++; old.page = Math.min(old.page, page); }
      else map.set(name, { name, count: 1, page });
    });
    return [...map.values()].sort((a, b) => a.page - b.page || a.name.localeCompare(b.name));
  }, [items]);
  const visible = useMemo(() => items.filter(item => chapterLabel(item) === chapter &&
    item.question_type === tab && (!query || item.question_text.toLowerCase().includes(query.trim().toLowerCase()))),
    [items, chapter, tab, query]);
  const subjectMeta = SUBJECTS[yearKey].find(x => x.name === subject);
  const goBack = () => {
    if (chapter) { setChapter(null); setQuery(""); return; }
    if (subject) { setSubject(null); setItems([]); return; }
    onSwitchBack();
  };

  return <section className="space-y-4 pb-8">
    <header className="flex items-center gap-3 pt-2">
      <button onClick={goBack} type="button" aria-label="Back" className="h-10 w-10 shrink-0 grid place-items-center rounded-xl border border-border bg-card"><ArrowLeft className="h-5 w-5" /></button>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-widest text-primary font-bold">RGUHS Karnataka • {YEAR_TEXT[yearKey]}</p>
        <h2 className="font-extrabold text-xl truncate">{chapter ?? subject ?? "Complete Question Bank"}</h2>
      </div>
    </header>
    <p className="rounded-xl bg-card border border-border p-3 text-xs text-muted-foreground">
      Chapterwise RGUHS questions with source PDF page references. Dates and wording should be checked against the original question papers before use.
    </p>
    {!subject ? <>
      <nav aria-label="MBBS year" className="flex gap-2 overflow-x-auto">
        {(["first-year", "second-year", "third-year"] as Year[]).map(year =>
          <button type="button" key={year} onClick={() => onYearChange(year)}
            className={"rounded-full px-4 py-2 whitespace-nowrap border text-sm " +
              (yearKey === year ? "bg-primary/10 text-primary border-primary" : "border-border bg-card text-muted-foreground")}>
            {YEAR_TEXT[year]}
          </button>)}
      </nav>
      <p className="text-sm text-muted-foreground">{SUBJECTS[yearKey].reduce((n, row) => n + row.count, 0).toLocaleString()} RGUHS questions. Previous question-bank entries are preserved.</p>
      <div className="grid grid-cols-2 gap-3">{SUBJECTS[yearKey].map(row =>
        <button key={row.name} type="button" onClick={() => { setSubject(row.name); setChapter(null); setQuery(""); setTab("essay"); }}
          className="min-h-36 rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 text-left justify-between hover:border-primary/40">
          <span className="text-3xl">{row.icon}</span><span className="text-sm font-bold">{row.name}</span>
          <span className="text-xs text-muted-foreground">{row.count.toLocaleString()} questions <ChevronRight className="h-4 w-4 inline" /></span>
        </button>)}</div>
      <button onClick={onSwitchBack} type="button" className="text-primary text-sm underline underline-offset-4">Show older reviewed RGUHS questions</button>
    </> : <>
      {loading && <p role="status" className="py-6 text-center text-sm">Loading complete {subject} question bank…</p>}
      {!!error && <div role="alert" className="border rounded-xl p-4 text-sm">
        Error loading questions: {error} <button type="button" onClick={() => setRetry(x => x + 1)} className="text-primary ml-2"><RefreshCw className="inline w-4 h-4" /> Retry</button>
      </div>}
      {!loading && !error && !chapter && <>
        <p className="text-xs text-muted-foreground">{items.length.toLocaleString()} records • Select a chapter or PDF-page group</p>
        <div className="space-y-2">{groups.map(group =>
          <button key={group.name} type="button" onClick={() => { setChapter(group.name); setTab("essay"); setQuery(""); }}
            className="w-full rounded-xl border border-border bg-card p-4 flex justify-between gap-3 text-left">
            <span className="font-semibold text-sm">{group.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{group.count} <ChevronRight className="inline h-4 w-4" /></span>
          </button>)}</div>
      </>}
      {!loading && !error && chapter && <>
        <div className="flex flex-wrap gap-2">{(["essay", "short-notes", "unknown"] as Kind[]).map(kind =>
          <button key={kind} type="button" onClick={() => { setTab(kind); setQuery(""); }}
            className={"rounded-full border px-3 py-2 text-xs font-semibold " + (tab === kind ? "bg-primary/10 text-primary border-primary" : "bg-card border-border text-muted-foreground")}>
            {kind === "essay" ? "Essay" : kind === "short-notes" ? "Short Notes" : "Other"}
          </button>)}</div>
        <div className="rounded-xl border border-border bg-card flex gap-2 items-center px-3"><Search className="w-4 h-4 text-muted-foreground" />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search this section" className="bg-transparent outline-none w-full text-sm p-3" /></div>
        <p className="text-xs text-muted-foreground">{visible.length} matching questions</p>
        {visible.length === 0 && <p className="text-sm p-4 text-muted-foreground">No questions in this section. Try another tab.</p>}
        {visible.map((row, index) => {
          const sessions = examLabels(row);
          const verified = row.review_status === "verified";
          return <div key={row.id} className="mb-4">
            <QuestionCard question={row.question_text} index={index} yearKey={yearKey} subjectKey={subjectMeta?.key}
              subjectName={subject || ""} repeatCountOverride={verified ? sessions.length : 0} />
            <div className="text-[11px] text-muted-foreground pl-3 -mt-1 space-y-1">
              <p>Source PDF page {row.source_pages?.join(", ") || "unknown"}</p>
              <p>{verified ? "Exam sessions" : "Dates shown in source"}: {sessions.length ? sessions.join(" · ") : "not listed"}</p>
            </div>
          </div>;
        })}
      </>}
    </>}
  </section>;
}
