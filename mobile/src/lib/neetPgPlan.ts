/** Local practice planning. No rank predictions; answer keys stay in the bank. */
export type NeetPlan = {
  target: string;
  examDate: string;
  minutes: number;
  days: number[];
  subjects: string[];
  preparation: string;
};
export type NeetAttempt = {
  choice: number | null;
  correct: boolean | null;
  day: string;
  due: string;
  streak: number;
};
export type NeetStudy = {
  plan: NeetPlan | null;
  attempts: Record<string, NeetAttempt>;
  session: { day: string; ids: string[]; position: number } | null;
};
export const emptyNeetStudy = (): NeetStudy => ({
  plan: null,
  attempts: {},
  session: null,
});
export const defaultNeetPlan = (): NeetPlan => ({
  target: 'Build consistency',
  examDate: '',
  minutes: 20,
  days: [1, 2, 3, 4, 5, 6],
  subjects: [],
  preparation: 'Starting fresh',
});
export function studyDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}
export function addStudyDays(day: string, amount: number) {
  const [y, m, d] = day.split('-').map(Number);
  return studyDay(new Date(y, m - 1, d + amount, 12));
}
export function validStudyDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  return studyDay(new Date(y, m - 1, d, 12)) === value;
}
export function dailyQuestionOffset(day: string, total: number) {
  let hash = 0;
  for (const c of day) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return total ? hash % total : 0;
}
export function recordNeetAttempt(
  previous: NeetAttempt | undefined,
  choice: number | undefined,
  answerIndex: number | null,
  day: string,
): NeetAttempt {
  const correct =
    choice === undefined || answerIndex === null
      ? null
      : choice === answerIndex;
  // Re-opening or toggling an explanation cannot manufacture a review streak.
  const streak = correct
    ? previous?.day === day
      ? Math.max(1, previous.streak)
      : (previous?.streak ?? 0) + 1
    : 0;
  const interval = correct ? [1, 3, 7, 14][Math.min(3, streak - 1)] : 1;
  return {
    choice: choice ?? null,
    correct,
    day,
    due: addStudyDays(day, interval),
    streak,
  };
}
export function planSession(
  records: readonly { id: string; subject: string }[],
  state: NeetStudy,
  day: string,
) {
  const limit = Math.max(1, Math.floor((state.plan?.minutes ?? 20) / 2));
  const due = records
    .filter(q => state.attempts[q.id]?.due <= day)
    .sort((a, b) =>
      state.attempts[a.id].due.localeCompare(state.attempts[b.id].due),
    );
  const fresh = records
    .filter(q => !state.attempts[q.id])
    .sort(
      (a, b) =>
        Number(state.plan?.subjects.includes(b.subject)) -
        Number(state.plan?.subjects.includes(a.subject)),
    );
  // Reviews get priority, with room for new practice whenever it is available.
  const reviews = due.slice(0, fresh.length ? Math.ceil(limit / 2) : limit);
  const ids = [...reviews, ...fresh.slice(0, limit - reviews.length)].map(
    q => q.id,
  );
  if (ids.length < limit)
    for (const q of due.slice(reviews.length)) {
      if (ids.length >= limit) break;
      ids.push(q.id);
    }
  return { day, ids, position: 0 };
}
export function parseNeetStudy(raw: string | null): NeetStudy {
  if (!raw) return emptyNeetStudy();
  try {
    const value = JSON.parse(raw);
    const state = emptyNeetStudy();
    const p = value?.plan;
    if (
      p &&
      typeof p.target === 'string' &&
      typeof p.preparation === 'string' &&
      (p.examDate === '' || validStudyDate(p.examDate)) &&
      [10, 20, 30, 45, 60].includes(p.minutes) &&
      Array.isArray(p.days) &&
      p.days.length &&
      p.days.every(
        (d: unknown) => Number.isInteger(d) && Number(d) >= 0 && Number(d) <= 6,
      ) &&
      Array.isArray(p.subjects) &&
      p.subjects.every((s: unknown) => typeof s === 'string')
    )
      state.plan = p;
    if (value?.attempts && typeof value.attempts === 'object')
      for (const [id, a] of Object.entries(value.attempts) as [
        string,
        NeetAttempt,
      ][]) {
        if (
          a &&
          validStudyDate(a.day) &&
          validStudyDate(a.due) &&
          Number.isInteger(a.streak) &&
          a.streak >= 0 &&
          (a.choice === null || Number.isInteger(a.choice)) &&
          [null, true, false].includes(a.correct)
        )
          state.attempts[id] = a;
      }
    const s = value?.session;
    if (
      s &&
      validStudyDate(s.day) &&
      Array.isArray(s.ids) &&
      s.ids.every((id: unknown) => typeof id === 'string') &&
      Number.isInteger(s.position) &&
      s.position >= 0 &&
      s.position < s.ids.length
    )
      state.session = s;
    return state;
  } catch {
    return emptyNeetStudy();
  }
}

/** First-pass estimate only; review repetitions also consume the selected budget. */
export function planCoverage(
  plan: NeetPlan,
  remaining: number,
  today = studyDay(),
) {
  if (!validStudyDate(plan.examDate) || plan.examDate < today) return null;
  let day = today;
  let sessions = 0;
  for (let guard = 0; day <= plan.examDate && guard < 36600; guard++) {
    const [y, m, d] = day.split('-').map(Number);
    if (plan.days.includes(new Date(y, m - 1, d, 12).getDay())) sessions++;
    day = addStudyDays(day, 1);
  }
  if (day <= plan.examDate) return null;
  return {
    sessions,
    neededPerSession: sessions ? Math.ceil(remaining / sessions) : remaining,
    budget: Math.floor(plan.minutes / 2),
  };
}
