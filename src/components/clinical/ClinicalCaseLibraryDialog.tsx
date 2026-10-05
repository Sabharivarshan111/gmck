import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  FileText,
  Search,
  Stethoscope,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

type JsonObject = Record<string, unknown>;

interface CaseSummary {
  id: string;
  name: string;
  aliases: string[];
  icd10: string | null;
  bodySystems: string[];
  description: string | null;
  sourceDataset: string;
}

interface DialogueTurn {
  role: string;
  content: string;
}

interface CaseReference {
  pmid?: string;
  title?: string;
  year?: string | number;
}

interface CaseDetail extends CaseSummary {
  patientScenario: string;
  executiveSummary: string | null;
  conversation: DialogueTurn[];
  commonMistakes: unknown[];
  differentialDiagnosis: unknown[];
  pubmedRefs: CaseReference[];
  sourceLicense: string;
}

export function ClinicalCaseLibraryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selected, setSelected] = useState<CaseDetail | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const needle = query
          .replace(/[%_]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase()
          .slice(0, 80);

        // The generated Supabase type file may lag the live schema between
        // migrations and a type regeneration. RLS, not this cast, is the
        // security boundary.
        let request = (supabase as any)
          .from("clinical_dataset_cases")
          .select("id,source_dataset,canonical_name,aliases,icd10,body_systems,description")
          .eq("review_status", "approved")
          .order("canonical_name", { ascending: true })
          .limit(50);

        if (needle) request = request.ilike("search_text", `%${needle}%`);

        const { data, error: readError } = await request;
        if (readError) throw readError;
        if (cancelled) return;

        setCases(
          ((data ?? []) as JsonObject[]).map((row) => ({
            id: String(row.id ?? ""),
            name: String(row.canonical_name ?? ""),
            aliases: stringArray(row.aliases),
            icd10: typeof row.icd10 === "string" && row.icd10 ? row.icd10 : null,
            bodySystems: stringArray(row.body_systems),
            description: typeof row.description === "string" ? row.description : null,
            sourceDataset: String(row.source_dataset ?? ""),
          })),
        );
      } catch (e) {
        if (!cancelled) {
          setCases([]);
          setError(e instanceof Error ? e.message : "Could not load clinical cases.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, query.trim() ? 250 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setRevealed(false);
      setTranscriptOpen(false);
      setError(null);
    }
  }, [open]);

  async function openCase(item: CaseSummary) {
    setDetailLoading(true);
    setError(null);
    setRevealed(false);
    setTranscriptOpen(false);
    try {
      const { data, error: readError } = await (supabase as any)
        .from("clinical_dataset_cases")
        .select(
          "id,source_dataset,canonical_name,aliases,icd10,body_systems,description,patient_scenario,executive_summary,conversation,common_mistakes,differential_diagnosis,pubmed_refs,source_license",
        )
        .eq("id", item.id)
        .eq("review_status", "approved")
        .maybeSingle();

      if (readError) throw readError;
      if (!data) throw new Error("This case is no longer in the reviewed library.");

      const row = data as JsonObject;
      setSelected({
        id: String(row.id ?? ""),
        name: String(row.canonical_name ?? ""),
        aliases: stringArray(row.aliases),
        icd10: typeof row.icd10 === "string" && row.icd10 ? row.icd10 : null,
        bodySystems: stringArray(row.body_systems),
        description: typeof row.description === "string" ? row.description : null,
        sourceDataset: String(row.source_dataset ?? ""),
        patientScenario: String(row.patient_scenario ?? ""),
        executiveSummary:
          typeof row.executive_summary === "string" ? row.executive_summary : null,
        conversation: objectArray(row.conversation)
          .filter((turn) => typeof turn.role === "string" && typeof turn.content === "string")
          .map((turn) => ({ role: String(turn.role), content: String(turn.content) })),
        commonMistakes: Array.isArray(row.common_mistakes) ? row.common_mistakes : [],
        differentialDiagnosis: Array.isArray(row.differential_diagnosis)
          ? row.differential_diagnosis
          : [],
        pubmedRefs: objectArray(row.pubmed_refs).map((ref) => ({
          ...(typeof ref.pmid === "string" ? { pmid: ref.pmid } : {}),
          ...(typeof ref.title === "string" ? { title: ref.title } : {}),
          ...(typeof ref.year === "string" || typeof ref.year === "number"
            ? { year: ref.year }
            : {}),
        })),
        sourceLicense: String(row.source_license ?? ""),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open this case.");
    } finally {
      setDetailLoading(false);
    }
  }

  const visibleTurns = useMemo(
    () =>
      (selected?.conversation ?? []).filter(
        (turn) => turn.role === "user" || turn.role === "assistant",
      ),
    [selected],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[88vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <div className="flex items-start gap-3 pr-8">
            {selected ? (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full"
                onClick={() => {
                  setSelected(null);
                  setRevealed(false);
                  setTranscriptOpen(false);
                }}
                aria-label="Back to case library"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : (
              <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Stethoscope className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate">
                {selected ? selected.name : "Patient simulator cases"}
              </DialogTitle>
              <DialogDescription>
                Reviewed synthetic clinical encounters for exam practice
              </DialogDescription>
            </div>
            <span className="text-[10px] font-bold tracking-wider rounded-full bg-primary/10 text-primary px-2 py-1">
              REVIEWED
            </span>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-5 space-y-4">
            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm">
                {error}
              </div>
            )}

            {detailLoading ? (
              <div className="min-h-48 flex items-center justify-center text-sm text-muted-foreground">
                Opening case…
              </div>
            ) : selected ? (
              <>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">Simulated case for exam practice</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Not clinical guidance. ORBIT exposes only cases that passed the review gate.
                    </p>
                  </div>
                </div>

                <section className="rounded-2xl border bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    <h3 className="font-bold">Presentation</h3>
                  </div>
                  <p className="text-sm leading-6">{selected.patientScenario}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selected.icd10 && (
                      <span className="rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-semibold">
                        {selected.icd10}
                      </span>
                    )}
                    {selected.bodySystems.slice(0, 4).map((system) => (
                      <span key={system} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                        {system}
                      </span>
                    ))}
                  </div>
                </section>

                {!revealed ? (
                  <section className="rounded-2xl border bg-card p-4">
                    <h3 className="font-bold">Before you reveal</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-6">
                      Take the history, make a provisional diagnosis and list your differentials first.
                    </p>
                    <Button className="mt-4 w-full sm:w-auto" onClick={() => setRevealed(true)}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Reveal debrief
                    </Button>
                  </section>
                ) : (
                  <>
                    {selected.executiveSummary && (
                      <TeachingCard title="Teaching summary" items={[selected.executiveSummary]} />
                    )}
                    <TeachingCard
                      title="Differential diagnosis"
                      items={selected.differentialDiagnosis}
                    />
                    <TeachingCard title="Common mistakes" items={selected.commonMistakes} />

                    <section className="rounded-2xl border bg-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <h3 className="font-bold">References</h3>
                      </div>
                      {selected.pubmedRefs.length ? (
                        <div className="space-y-2">
                          {selected.pubmedRefs.slice(0, 8).map((ref, index) => (
                            <p key={`${ref.pmid ?? "ref"}-${index}`} className="text-sm">
                              {index + 1}. {ref.title ?? (ref.pmid ? `PubMed ${ref.pmid}` : "PubMed reference")}
                              {ref.year ? ` (${ref.year})` : ""}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No references attached.</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-3 leading-5">
                        A PMID resolving to a paper does not prove every generated statement is supported by
                        that paper. Verify important clinical facts against primary sources.
                      </p>
                    </section>

                    <button
                      type="button"
                      onClick={() => setTranscriptOpen((value) => !value)}
                      className="w-full rounded-xl border bg-card px-4 py-3 flex items-center justify-between text-sm font-semibold"
                    >
                      {transcriptOpen ? "Hide teaching transcript" : "Show teaching transcript"}
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${transcriptOpen ? "rotate-90" : ""}`}
                      />
                    </button>

                    {transcriptOpen && (
                      <section className="rounded-2xl border bg-card p-4 space-y-2">
                        {visibleTurns.map((turn, index) => (
                          <div
                            key={`${turn.role}-${index}`}
                            className={`rounded-xl p-3 ${
                              turn.role === "assistant" ? "bg-primary/5" : "bg-muted/60"
                            }`}
                          >
                            <p className="text-[10px] tracking-wider font-bold text-muted-foreground">
                              {turn.role === "assistant" ? "CLINICIAN" : "PATIENT"}
                            </p>
                            <p className="text-sm leading-6 mt-1">{turn.content}</p>
                          </div>
                        ))}
                      </section>
                    )}

                    <p className="text-[11px] leading-5 text-muted-foreground">
                      Source: {selected.sourceDataset}. Stored license note: {selected.sourceLicense}
                    </p>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex gap-3">
                  <Stethoscope className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-bold">Opus 5.5 case library</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-5">
                      Cases live server-side and remain invisible until reviewed. The raw 75 MB corpus is
                      not bundled into the PWA.
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search disease, alias or ICD-10"
                    className="pl-9"
                  />
                </div>

                {loading ? (
                  <div className="min-h-40 flex items-center justify-center text-sm text-muted-foreground">
                    Loading reviewed cases…
                  </div>
                ) : cases.length ? (
                  <div className="space-y-2">
                    {cases.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openCase(item)}
                        className="w-full rounded-xl border bg-card p-3 text-left flex items-center gap-3 hover:border-primary/40 hover:shadow-sm transition-all"
                      >
                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Stethoscope className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {[item.icd10, item.bodySystems.slice(0, 2).join(" • "), item.aliases[0]]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border bg-card min-h-44 p-5 flex flex-col items-center justify-center text-center">
                    <BookOpen className="h-7 w-7 text-muted-foreground" />
                    <p className="font-bold mt-3">
                      {query ? "No reviewed case matches this search" : "No reviewed dataset cases published yet"}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-5">
                      Imported records start as pending. They appear here only after clinical review marks
                      them approved.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function TeachingCard({ title, items }: { title: string; items: unknown[] }) {
  const readable = items.map(plainItem).filter(Boolean).slice(0, 10);
  return (
    <section className="rounded-2xl border bg-card p-4">
      <h3 className="font-bold">{title}</h3>
      {readable.length ? (
        <div className="space-y-2 mt-2">
          {readable.map((item, index) => (
            <p key={`${title}-${index}`} className="text-sm leading-6">
              {readable.length === 1 ? item : `${index + 1}. ${item}`}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mt-2">No reviewed items in this section.</p>
      )}
    </section>
  );
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function objectArray(value: unknown): JsonObject[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is JsonObject => Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
    : [];
}

function plainItem(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const item = value as JsonObject;
  for (const key of [
    "diagnosis",
    "name",
    "condition",
    "mistake",
    "pitfall",
    "text",
    "description",
    "rationale",
    "reason",
  ]) {
    if (typeof item[key] === "string" && String(item[key]).trim()) {
      return String(item[key]).trim();
    }
  }
  return Object.entries(item)
    .filter(([, candidate]) => typeof candidate === "string" || typeof candidate === "number")
    .slice(0, 3)
    .map(([key, candidate]) => `${key.replace(/_/g, " ")}: ${String(candidate)}`)
    .join(" • ");
}

export default ClinicalCaseLibraryDialog;
