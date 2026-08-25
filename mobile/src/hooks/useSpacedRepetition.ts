import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  dueCards,
  loadCards,
  newCard,
  saveCards,
  startOfDay,
  grade as gradeLocally,
  type Grade,
  type ReviewCard,
} from '@/lib/spacedRepetition';

/**
 * The revision schedule, shared with the web app.
 *
 * **The server owns this when there is a session.** `revision_schedule` holds
 * the state, `review_question` does the maths, and `record_question_done`
 * enrols a question the moment it is ticked — all of which the browser already
 * uses. A phone keeping its own schedule would give one user two, which is the
 * thing the shared storage keys exist to prevent.
 *
 * The local copy is the offline and not-yet-signed-in path, computing with the
 * identical algorithm so the two agree rather than merely coexist. It is also
 * the mirror: a cloud grade writes the returned row back to it, so closing the
 * app after revising offline-then-online does not lose the answer.
 */
export function useSpacedRepetition(
  doneQuestions: { questionId: string; question: string; subject: string }[],
) {
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [ready, setReady] = useState(false);
  const [cloud, setCloud] = useState(false);

  /** Question text by id, so a cloud row can be shown as a question. */
  const textFor = useCallback(
    (id: string) => doneQuestions.find(item => item.questionId === id),
    [doneQuestions],
  );

  const refresh = useCallback(async () => {
    const local = await loadCards();

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      setCloud(false);
      setCards(local);
      setReady(true);
      return;
    }

    // supabase-js *returns* errors rather than throwing, so a try/catch here
    // would never fire — the error has to be read off the result.
    const { data, error } = await supabase
      .from('revision_schedule')
      .select('question_id, due_date, interval_days, ease')
      .lte('due_date', new Date().toISOString().slice(0, 10))
      .order('due_date', { ascending: true })
      .limit(100);

    if (error || !data) {
      // Offline, or the table is unreachable. The local schedule is a worse
      // answer than the server's and a much better one than an empty screen.
      setCloud(false);
      setCards(local);
      setReady(true);
      return;
    }

    setCloud(true);
    setCards(
      data.map(row => {
        const known = textFor(row.question_id);
        return {
          questionId: row.question_id,
          question: known?.question ?? row.question_id,
          subject: known?.subject ?? '',
          interval: row.interval_days ?? 1,
          ease: row.ease ?? 2.5,
          due: startOfDay(new Date(`${row.due_date}T00:00:00`).getTime()),
        };
      }),
    );
    setReady(true);
  }, [textFor]);

  useEffect(() => {
    let alive = true;
    refresh().catch(() => {
      if (alive) {
        setReady(true);
      }
    });
    return () => {
      alive = false;
    };
  }, [refresh]);

  /**
   * Enrol newly ticked questions — **local only**.
   *
   * The server does its own enrolling inside `record_question_done`, so doing
   * it here as well would race it and write a second row under the same key.
   */
  useEffect(() => {
    if (!ready || cloud || doneQuestions.length === 0) {
      return;
    }
    setCards(existing => {
      const known = new Set(existing.map(card => card.questionId));
      const additions = doneQuestions
        .filter(item => !known.has(item.questionId))
        .map(item => newCard(item.questionId, item.question, item.subject));
      if (additions.length === 0) {
        return existing;
      }
      const next = [...existing, ...additions];
      saveCards(next).catch(() => {});
      return next;
    });
  }, [ready, cloud, doneQuestions]);

  const record = useCallback(
    async (card: ReviewCard, quality: Grade) => {
      // Optimistic either way: the reader has moved on to the next question
      // before any round trip could finish.
      const predicted = gradeLocally(card, quality);
      setCards(existing => {
        const updated = existing.map(item =>
          item.questionId === card.questionId ? predicted : item,
        );
        if (!cloud) {
          saveCards(updated).catch(() => {});
        }
        return updated;
      });

      if (!cloud) {
        return;
      }
      // The RPC is authoritative — it returns the interval it actually stored,
      // which is what the browser will see. Taking its answer rather than
      // keeping the prediction is what stops the two drifting.
      const { data, error } = await supabase.rpc('review_question', {
        _question_id: card.questionId,
        _grade: quality,
      });
      const row = Array.isArray(data) ? data[0] : data;
      if (error || !row) {
        return;
      }
      setCards(existing =>
        existing.map(item =>
          item.questionId === card.questionId
            ? {
                ...item,
                interval: row.new_interval ?? item.interval,
                ease: row.new_ease ?? item.ease,
                due: row.next_due
                  ? startOfDay(new Date(`${row.next_due}T00:00:00`).getTime())
                  : item.due,
              }
            : item,
        ),
      );
    },
    [cloud],
  );

  return { cards, due: dueCards(cards), record, ready, cloud };
}
