import { useCallback, useEffect, useState } from 'react';
import { getQuestionId } from '@/lib/progress';
import { confirmedPagesFor, type ConfirmedPage } from '@/lib/pageRefs';
import { useSettings } from '@/lib/settings';

/**
 * Confirmed textbook pages for the questions a screen is showing.
 *
 * One fetch per screen, keyed by question id, because a fetch per row is five
 * hundred round trips in a big topic. Rows read out of the returned map, which
 * is a plain lookup and costs them nothing.
 *
 * Nothing is fetched at all until the reader turns page references on. That is
 * deliberate: the great majority of readers do not have the book somebody else
 * numbered, and a screen that quietly queries on their behalf is a network call
 * spent on something they will never look at.
 */
export function usePageRefs(
  questions: string[],
): {
  pages: Map<string, ConfirmedPage>;
  refresh: () => void;
} {
  const { showPageRefs } = useSettings();
  const [pages, setPages] = useState<Map<string, ConfirmedPage>>(new Map());

  // The identity of the array changes every render; its content is what matters.
  const key = questions.length > 0 ? `${questions.length}:${questions[0]}` : '';

  const load = useCallback(async () => {
    if (!showPageRefs || questions.length === 0) {
      setPages(new Map());
      return;
    }
    const next = await confirmedPagesFor(questions.map(question => ({ question })));
    setPages(next);
    // `questions` is intentionally read through the memo key rather than listed:
    // a new array of the same questions must not refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPageRefs, key]);

  useEffect(() => {
    void load();
  }, [load]);

  return { pages, refresh: () => void load() };
}

/** The confirmed page for one question, out of a map from `usePageRefs`. */
export function pageFor(
  pages: Map<string, ConfirmedPage>,
  question: string,
): ConfirmedPage | undefined {
  return pages.get(getQuestionId(question));
}
