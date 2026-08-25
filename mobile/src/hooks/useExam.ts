import { useEffect, useState } from 'react';
import { getExam, hydrateExam, isHydrated, subscribeExam, type Exam } from '@/lib/exam';

/**
 * The stored exam, and nothing else.
 *
 * Deliberately not the day count: that changes at midnight and nothing here
 * would notice, so a screen left open overnight would keep saying the old
 * number. Callers derive it with `daysUntil()` at render, which is correct
 * every time the screen draws.
 */
export function useExam(): Exam | null {
  const [exam, setLocal] = useState<Exam | null>(getExam);

  useEffect(() => {
    if (!isHydrated()) {
      hydrateExam().catch(() => {});
    }
    return subscribeExam(() => setLocal(getExam()));
  }, []);

  return exam;
}
