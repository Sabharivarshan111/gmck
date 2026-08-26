import { useState, useEffect } from "react";
import { Maximize2, Download, Sparkles, Image as ImageIcon, ZoomIn, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ExamDiagramCardProps {
  questionText?: string;
  topicName?: string;
  subject?: string;
  defaultOpen?: boolean;
}

export default function ExamDiagramCard({
  questionText,
  topicName,
  subject,
  defaultOpen = true,
}: ExamDiagramCardProps) {
  const [diagramUrl, setDiagramUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchDiagram = async () => {
      setLoading(true);
      try {
        const queryTerm = (questionText || topicName || "").trim();
        if (!queryTerm) {
          setLoading(false);
          return;
        }

        // Clean query term to extract significant medical keywords
        const cleanQuery = queryTerm
          .replace(/[0-9]+\./g, "")
          .replace(/\(Pg.*\)/gi, "")
          .replace(/\(Feb.*\)|\(Aug.*\)|\(Oct.*\)|\(Jan.*\)/gi, "")
          .replace(/[*#]/g, "")
          .trim();

        // 1. Try exact or partial match on question_text
        let { data, error } = await supabase
          .from("question_diagrams")
          .select("public_url, storage_path, question_text")
          .not("public_url", "is", null)
          .ilike("question_text", `%${cleanQuery.slice(0, 30)}%`)
          .limit(1);

        // 2. Fallback: Search by top keywords if not found
        if ((!data || data.length === 0) && cleanQuery.length > 3) {
          const words = cleanQuery.split(/\s+/).filter(w => w.length > 4);
          for (const word of words.slice(0, 3)) {
            const res = await supabase
              .from("question_diagrams")
              .select("public_url, storage_path, question_text")
              .not("public_url", "is", null)
              .ilike("question_text", `%${word}%`)
              .limit(1);
            if (res.data && res.data.length > 0) {
              data = res.data;
              break;
            }
          }
        }

        if (isMounted && data && data.length > 0 && data[0].public_url) {
          setDiagramUrl(data[0].public_url);
        }
      } catch (err) {
        console.error("Error fetching diagram:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDiagram();
    return () => { isMounted = false; };
  }, [questionText, topicName]);

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

  if (!diagramUrl) return null;

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
                <Badge variant="outline" className="text-[10px] font-semibold tracking-wider text-primary border-primary/30">
                  <Sparkles className="h-2.5 w-2.5 mr-1" />
                  AI Exam Diagram
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
              <a href={diagramUrl} download target="_blank" rel="noreferrer">
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Diagram Image */}
        <div
          className="relative group cursor-pointer overflow-hidden bg-black/5 dark:bg-black/40 flex items-center justify-center p-2"
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={diagramUrl}
            alt={topicName || questionText || "Exam Diagram"}
            className="w-full max-h-96 object-contain rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <div className="bg-background/90 text-foreground px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
              <ZoomIn className="h-3.5 w-3.5" />
              Click to Zoom Fullscreen
            </div>
          </div>
        </div>

        {/* Caption footer */}
        <div className="px-4 py-2 bg-muted/40 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Continuous visual layout for rapid recall</span>
          <span className="font-mono text-[10px]">Nano Banana 2</span>
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
                {badgeLabel}
              </Badge>
              <span className="text-sm font-semibold truncate max-w-md">
                {topicName || questionText}
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
                <a href={diagramUrl} download target="_blank" rel="noreferrer">
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              </Button>
              <button
                onClick={() => setLightboxOpen(false)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div
            className="relative max-w-4xl max-h-[85vh] overflow-auto flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={diagramUrl}
              alt="Fullscreen Diagram"
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </>
  );
}
