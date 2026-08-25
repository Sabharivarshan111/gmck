import { useCallback, useEffect, useState } from 'react';
import {
  dueCards,
  loadCards,
  newCard,
  saveCards,
  type ReviewCard,
} from '@/lib/spacedRepetition';

/**
 * The revision schedule, seeded from what has been ticked off.
 *
 * A question enters the schedule when it is marked done — that is the moment
 * the reader claims to know it, and the moment SM-2 becomes worth running on
 * it. Nothing has to be added by hand, which matters: a revision system that
 * needs its own curation step is one nobody keeps.
 *
 * The seed only ever *adds*. A card already in the schedule keeps its ease,
 * interval and due date, because those are the whole state — re-seeding a
 * known question would silently reset months of history to "due today".
 */
export function useSpacedRepetition(doneQuestions: { question: string; subject: string }[]) {
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    loadCards().then(stored => {
      if (alive) {
        setCards(stored);
        setReady(true);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  // Seed after load, never before, or the first render's empty list would look
  // like "nothing is scheduled" and add every done question again.
  useEffect(() => {
    if (!ready || doneQuestions.length === 0) {
      return;
    }
    setCards(existing => {
      const known = new Set(existing.map(card => card.question));
      const additions = doneQuestions
        .filter(item => !known.has(item.question))
        .map(item => newCard(item.question, item.subject));
      if (additions.length === 0) {
        return existing;
      }
      const next = [...existing, ...additions];
      saveCards(next).catch(() => {});
      return next;
    });
  }, [ready, doneQuestions]);

  const record = useCallback((card: ReviewCard, next: ReviewCard) => {
    setCards(existing => {
      const updated = existing.map(item => (item.question === card.question ? next : item));
      saveCards(updated).catch(() => {});
      return updated;
    });
  }, []);

  return { cards, due: dueCards(cards), record, ready };
}
