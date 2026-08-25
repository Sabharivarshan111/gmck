import { useEffect, useState } from 'react';
import { getExam, hydrateExam, isHydrated, pullExam, subscribeExam, type Exam } from '@/lib/exam';

/**
 * The stored exam, and nothing else.
 *
 * Deliberately not the day count: that changes at midnight and nothing here
 * would notice, so a screen left open overnight would keep saying the old
 * number. Callers derive it with `daysUntil()` at render, which is correct
 * every time the screen draws.
 */
export function useExam(year?: string): Exam | null {
  const [exam, setLocal] = useState<Exam | null>(getExam);

  useEffect(() => {
    if (!isHydrated()) {
      hydrateExam().catch(() => {});
    }
    return subscribeExam(() => setLocal(getExam()));
  }, []);

  // The cloud row after the local one, so the countdown paints immediately and
  // is corrected a moment later rather than blinking in from empty.
  useEffect(() => {
    if (year) {
      pullExam(year).catch(() => {});
    }
  }, [year]);

  return exam;
}
