import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, ChevronRight, FileText, RefreshCw, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import QuestionCard from "@/components/QuestionCard";
import { requestDailyAd } from "@/lib/daily-ad";

type QuestionType = "essay" | "short-notes";
type QuestionRow = {
  id: string;
  subject: string;
  chapter: string;
  question_type: QuestionType;
  question_text: string;
  source_page: number;
  source_column: number;
  source_pdf: string;
  quality_status: string;
};

const SUBJECTS_BY_YEAR = {
  "first-year": [
    { key: "Anatomy", label: "Anatomy", emoji: "🫀", count: 393 },
    { key: "Physiology", label: "Physiology", emoji: "🧠", count: 631 },
    { key: "Biochemistry", label: "Biochemistry", emoji: "🧬", count: 403 },
  ],
  "second-year": [
    { key: "Pathology", label: "Pathology", emoji: "🔬", count: 261 },
    { key: "Pharmacology", label: "Pharmacology", emoji: "💊", count: 621 },
    { key: "Microbiology", label: "Microbiology", emoji: "🦠", count: 309 },
  ],
  "third-year": [
    { key: "Community Medicine (PSM)", label: "Community Medicine (PSM)", emoji: "🏥", count: 62 },
    { key: "Forensic Medicine", label: "Forensic Medicine & Toxicology", emoji: "⚖️", count: 28 },
  ],
} as const;

const YEAR_LABEL = {
  "first-year": "First Year",
  "second-year": "Second Year",
  "third-year": "Third Year Part I",
} as const;

const DB_STUDY_YEAR = {
  "first-year": "first-year",
  "second-year": "second-year",
  "third-year": "third-year",
} as const;

const PAGE_SIZE = 250;
const COLUMNS = "id,subject,chapter,question_type,question_text,source_page,source_column,source_pdf,quality_status";

export default function MUHSPreFinalBank({ yearKey, onSwitchBack }: { yearKey: "first-year" | "second-year" | "third-year"; onSwitchBack: () => void }) {
  const [subject, setSubject] = useState<string | null>(null);
  const [chapter, setChapter] = useState<string | null>(null);
  const [tab, setTab] = useState<QuestionType>("essay");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setSubject(null);
    setChapter(null);
    setRows([]);
    setSearch("");
  }, [yearKey]);

  useEffect(() => {
    if (!subject) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRows([]);
    const load = async () => {
      try {
        const items: QuestionRow[] = [];
        for (let start = 0; ; start += PAGE_SIZE) {
          const { data, error: queryError } = await (supabase as any)
            .from("muhs_early_year_questions")
            .select(COLUMNS)
            .eq("university", "MUHS")
            .eq("study_year", DB_STUDY_YEAR[yearKey])
            .eq("subject", subject)
            .in("quality_status", ["ocr_checked", "verified"])
            .order("source_page", { ascending: true })
            .order("source_column", { ascending: true })
            .order("id", { ascending: true })
            .range(start, start + PAGE_SIZE - 1);
          if (queryError) throw new Error(queryError.message || "Could not load MUHS questions");
          if (cancelled) return;
          const batch: QuestionRow[] = data ?? [];
          items.push(...batch);
          if (batch.length < PAGE_SIZE) break;
        }
        if (!cancelled) {
          setRows(Array.from(new Map(items.map((item) => [
            [item.chapter, item.question_type, item.question_text.toLowerCase().replace(/[^a-z0-9]/g, "")].join("|"), item
          ])).values()));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load questions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [subject, retry, yearKey]);

  const chapters = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(row.chapter, (counts.get(row.chapter) ?? 0) + 1);
    return Array.from(counts, ([name, count]) => ({ name, count }));
  }, [rows]);

  const topicRows = useMemo(() => {
    if (!chapter) return [];
    const term = search.trim().toLowerCase();
    return rows.filter((row) =>
      row.chapter === chapter &&
      row.question_type === tab &&
      (!term || row.question_text.toLowerCase().includes(term))
    );
  }, [rows, chapter, tab, search]);

  const enterSubject = (next: string) => {
    setSubject(next);
    setChapter(null);
    setTab("essay");
    setSearch("");
  };

  const goBack = () => {
    if (chapter) { setChapter(null); setSearch(""); return; }
    if (subject) { setSubject(null); return; }
    onSwitchBack();
  };

  return (
    <div className="space-y-4 pb-5">
      <header className="flex items-center gap-3 pt-2">
        <button onClick={goBack} aria-label="Back" className="h-10 w-10 flex-shrink-0 rounded-full border border-border/60 bg-card flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">{YEAR_LABEL[yearKey]} • Maharashtra University</p>
          <h1 className="text-xl font-extrabold truncate">{chapter ?? subject ?? "MUHS Question Bank"}</h1>
        </div>
      </header>
      {!subject && (
        <>
          <p className="text-xs text-muted-foreground">{SUBJECTS_BY_YEAR[yearKey].reduce((total, item) => total + item.count, 0)} OCR-screened MUHS questions arranged by subject and chapter. Uncertain scans are withheld for review; wording has not been fully verified against every page.</p>
          <div className="grid grid-cols-2 gap-3">
            {SUBJECTS_BY_YEAR[yearKey].map((s) => (
              <button key={s.key} onClick={() => enterSubject(s.key)} className="h-40 rounded-2xl border border-border/60 bg-gradient-to-br from-card to-primary/10 p-4 flex flex-col items-start justify-between text-left hover:border-primary/50 active:scale-[0.98] transition">
                <span className="text-3xl">{s.emoji}</span>
                <span>
                  <span className="block font-bold text-sm leading-tight">{s.label}</span>
                  <span className="block mt-1 text-xs text-muted-foreground">{s.count} questions</span>
                </span>
                <ChevronRight className="h-4 w-4 self-end text-primary" />
              </button>
            ))}
          </div>
          <button onClick={onSwitchBack} className="text-sm text-primary underline underline-offset-2">Switch to existing question bank</button>
        </>
      )}
      {subject && (
        <>
          {loading && <p role="status" className="py-10 text-center text-muted-foreground">Loading MUHS questions…</p>}
          {error && (
            <div role="alert" className="rounded-xl border border-destructive/40 bg-card p-4 space-y-3">
              <p className="text-sm text-destructive">Could not load questions: {error}</p>
              <button onClick={() => setRetry((x) => x + 1)} className="inline-flex gap-2 items-center text-sm text-primary font-semibold"><RefreshCw className="h-4 w-4" /> Retry</button>
            </div>
          )}
          {!loading && !error && !chapter && (
            <>
              <p className="text-xs text-muted-foreground">{rows.length} unique questions • {chapters.length} chapters</p>
              <div className="space-y-2">
                {chapters.map((c, i) => (
                  <button key={c.name} onClick={() => { setChapter(c.name); setTab("essay"); setSearch(""); requestDailyAd("questions"); }} className="w-full flex gap-3 items-center rounded-xl border border-border/60 bg-card p-4 text-left hover:border-primary/40">
                    <span className="h-10 w-10 flex items-center justify-center bg-primary/10 rounded-lg text-primary font-bold">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.count} questions</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </>
          )}
          {!loading && !error && chapter && (
            <>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-card border border-border/60">
                {(["essay", "short-notes"] as QuestionType[]).map((t) => (
                  <button key={t} onClick={() => { setTab(t); setSearch(""); }} className={`rounded-lg py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                    {t === "essay" ? <BookOpen className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    {t === "essay" ? "Essays" : "Short Notes"}
                    <span className="opacity-80">{rows.filter((r) => r.chapter === chapter && r.question_type === t).length}</span>
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this chapter…" className="w-full rounded-xl border border-border/60 bg-card py-3 pl-10 pr-3 text-sm" />
              </div>
              {topicRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No {tab === "essay" ? "essays" : "short notes"} match this chapter.</p>
              ) : (
                <div className="space-y-3">
                  {topicRows.map((q, i) => (
                    <div key={q.id}>
                      <QuestionCard
                        question={q.question_text}
                        index={i}
                        isFirstYear={yearKey === "first-year"}
                        yearKey={yearKey}
                        subjectKey={`muhs-${subject.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                        subjectName={`MUHS — ${subject}`}
                      />
                      <div className="px-3 pt-1 text-[11px] text-muted-foreground">
                        {q.source_pdf ? `${q.source_pdf}, PDF page ${q.source_page}` : `PDF page ${q.source_page}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
