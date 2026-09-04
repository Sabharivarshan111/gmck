import { useState } from "react";
import { ChevronRight, Layers } from "lucide-react";
import HandwrittenNotesHub from "@/components/handwritten/HandwrittenNotesHub";
import FlashcardsHub from "@/components/flashcards/FlashcardsHub";
import { StudyMaterialsDriveCard, WhatsAppGroupCard } from "@/components/community/CommunityCards";
import { useProfile } from "@/hooks/use-profile";

export default function NotesTab() {
  const { local } = useProfile();
  const isThirdYear = local?.year === "third";
  /*
   * Flashcards take over the whole tab rather than sitting under the notes hub,
   * which is what the Android app does with the same two features: both are
   * year → subject → chapter walks several screens deep, and stacking one
   * inside the other gives the reader two back buttons that mean different
   * things.
   */
  const [flashcards, setFlashcards] = useState(false);

  if (flashcards) {
    return (
      <div className="pb-4">
        <FlashcardsHub onExit={() => setFlashcards(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      <header className="pt-2">
        <h1 className="text-2xl font-extrabold">Notes</h1>
        <p className="text-sm text-muted-foreground">AI-generated handwritten notes for every topic</p>
      </header>

      <button
        onClick={() => setFlashcards(true)}
        aria-label="Anki-style flashcards, browse decks by year"
        className="w-full rounded-xl bg-card border p-3 flex items-center gap-3 text-left hover:shadow-md hover:border-primary/40 transition-all"
      >
        <div className="h-10 w-10 rounded-lg bg-violet-500/15 text-violet-600 flex items-center justify-center flex-shrink-0">
          <Layers className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium">Anki-style flashcards</p>
          <p className="text-[11px] text-muted-foreground">
            Spaced repetition over any chapter — cards you find hard come back sooner
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>

      <HandwrittenNotesHub />

      <div className="space-y-3 pt-2">
        {isThirdYear && <StudyMaterialsDriveCard />}
        <WhatsAppGroupCard />
      </div>
    </div>
  );
}
