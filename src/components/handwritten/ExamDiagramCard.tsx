import { useState, useEffect } from "react";
import { Maximize2, Download, Sparkles, Image as ImageIcon, ZoomIn, X, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  findDiagramsForQuestion,
  type QuestionDiagram,
} from "@/lib/questionDiagrams";

interface ExamDiagramCardProps {
  /**
   * The question this diagram belongs to, and the only thing it is looked up
   * by. A diagram belongs to a *question*; there is no such thing as a
   * chapter's diagram, and no row is filed under one.
   *
   * There used to be a `topicName` beside this, and the card fell back to it.
   * It is gone rather than left unused: a chapter name sitting in the props of
   * a component that looks things up is an invitation to key on it again, and
   * keying on it is what returned a neighbour's picture.
   */
  questionText?: string;
  /**
   * The bank's own string for the same question, still carrying its leading
   * `"12. "`. Every screen strips that before opening a note, because the notes
   * function's cache key is a hash of the stripped form — but the diagram
   * pipeline filed its rows under the raw text. 53 of the 855 pictures are
   * reachable only through this.
   */
  rawQuestionText?: string;
  subject?: string;
  defaultOpen?: boolean;
}

type DiagramItem = QuestionDiagram;

/*
 * What used to be here: a hundred-word stop list and an EXCLUSIVE_ENTITIES
 * table — a hand-written family of keywords per pathway — used to score every
 * row in the subject against the question's text.
 *
 * It is deleted rather than tuned. It produced two different wrong answers and
 * the second one is what was reported as "I cannot find any images relevant to
 * that":
 *
 *   • A question that *matched* a family got every row in that family. "TCA
 *     cycle - definition, sequence of reaction, energetics, regulation" opened
 *     with Glycolysis as "diagram 1 of 3", then Gluconeogenesis, then its own.
 *   • A question that matched *no* family returned an empty list and rendered
 *     nothing at all — which is most questions, because the families were
 *     written by hand and the bank has 5,523 questions.
 *
 * Widening or narrowing the lists only moved which questions were wrong. The
 * premise is wrong: a question that mentions a pathway is not a question about
 * it, and no vocabulary separates them. The native app deleted this table
 * months ago; the web app kept it.
 *
 * `question_diagrams` already answers the question exactly — one row per
 * question, carrying that question's own id — so identity is the whole matcher
 * now and `lib/questionDiagrams.ts` is where it lives, once, for both apps.
 */

export default function ExamDiagramCard({
  questionText,
  rawQuestionText,
  subject,
}: ExamDiagramCardProps) {
  const [diagrams, setDiagrams] = useState<DiagramItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    /*
     * Keyed on the question and nothing else. There is no chapter-name
     * fallback: looking a diagram up by the chapter's name is what produced a
     * neighbour's picture, and no row is filed under a chapter anyway.
     */
    const question = (questionText ?? "").trim();
    if (!question) {
      setDiagrams([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    findDiagramsForQuestion(supabase, question, subject, rawQuestionText)
      .then(found => {
        if (!isMounted) return;
        setDiagrams(found);
        setActiveIndex(0);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [questionText, rawQuestionText, subject]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-4 bg-muted rounded-full" />
          <div className="h-4 w-40 bg-muted rounded" />
        </div>
        <div className="w-full h-48 bg-muted/40 rounded-xl" />
      </div>
    );
  }

  // If no diagrams exist in Supabase storage, do not render any card in the app UI
  if (diagrams.length === 0) {
    return null;
  }

  const currentDiagram = diagrams[activeIndex] || diagrams[0];

  return (
    <>
      <div className="rounded-2xl border border-border/80 bg-gradient-to-b from-card to-muted/20 shadow-md overflow-hidden transition-all hover:shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-foreground">High-Yield Exam Diagram</span>
                {diagrams.length > 1 && (
                  <Badge variant="secondary" className="text-[10px] font-semibold gap-1">
                    <Layers className="h-3 w-3" />
                    {activeIndex + 1} of {diagrams.length} Views
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] font-semibold tracking-wider text-primary border-primary/30">
                  <Sparkles className="h-2.5 w-2.5 mr-1" />
                  Textbook Grounded
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setLightboxOpen(true)}
              title="Fullscreen Zoom"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              asChild
              title="Download Diagram"
            >
              <a href={currentDiagram.url} download target="_blank" rel="noreferrer">
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Multi-diagram Tabs if > 1 diagram exists */}
        {diagrams.length > 1 && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/40 border-b border-border/40 overflow-x-auto no-scrollbar">
            {diagrams.map((diag, idx) => (
              <button
                key={diag.url}
                onClick={() => setActiveIndex(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  idx === activeIndex
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-background/80 text-muted-foreground hover:text-foreground hover:bg-background"
                }`}
              >
                <span>Plate {idx + 1}</span>
                <span className="text-[10px] opacity-75 truncate max-w-[120px]">
                  {diag.title.split('-')[0].trim()}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Diagram Image */}
        <div
          className="relative group cursor-pointer overflow-hidden bg-black/5 dark:bg-black/40 flex items-center justify-center p-2 min-h-[220px]"
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={currentDiagram.url}
            alt={currentDiagram.title || questionText || "Exam Diagram"}
            className="w-full max-h-96 object-contain rounded-xl transition-transform duration-300 group-hover:scale-[1.01]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <div className="bg-background/90 text-foreground px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
              <ZoomIn className="h-3.5 w-3.5" />
              Click to Zoom Fullscreen
            </div>
          </div>

          {/* Navigation Arrows for multi-diagram */}
          {diagrams.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prev) => (prev > 0 ? prev - 1 : diagrams.length - 1));
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 text-foreground shadow-md flex items-center justify-center hover:bg-background transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prev) => (prev < diagrams.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 text-foreground shadow-md flex items-center justify-center hover:bg-background transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Caption footer */}
        <div className="px-4 py-2 bg-muted/40 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
          <span className="truncate max-w-[280px]">{currentDiagram.title}</span>
          <span className="font-mono text-[10px]">
            {diagrams.length > 1 ? `${activeIndex + 1} / ${diagrams.length}` : "Standard Mnemonic"}
          </span>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="w-full max-w-4xl flex items-center justify-between text-white mb-2 px-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground text-xs">
                {/*
                  "Diagram", not "Plate".

                  A plate is what a textbook publisher calls a printed figure,
                  and it is the word this codebase uses internally for the
                  files. It is not the word a medical student uses for the
                  thing they have to reproduce in an answer booklet, and the
                  label on a lightbox is read by the second group only.
                */}
                {diagrams.length > 1
                  ? `Diagram ${activeIndex + 1}/${diagrams.length}`
                  : "Exam Diagram"}
              </Badge>
              <span className="text-sm font-semibold truncate max-w-md">
                {currentDiagram.title || questionText}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <a href={currentDiagram.url} download target="_blank" rel="noreferrer">
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              </Button>
              <button
                onClick={() => setLightboxOpen(false)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentDiagram.url}
              alt={currentDiagram.title}
              className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
