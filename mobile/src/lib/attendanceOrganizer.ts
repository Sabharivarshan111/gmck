import AsyncStorage from '@react-native-async-storage/async-storage';

/** Original ORBIT organizer. Local-only; no reference-app code or assets. */
const KEY = 'orbit:attendance-organizer-v1';
export type OrganizerTab = 'week' | 'tasks' | 'projects' | 'notes' | 'break';
export interface WeekClass {
  id: string;
  title: string;
  weekday: number;
  start: string;
  end: string;
  room: string;
  subjectId?: string;
}
export interface OrganizerTask {
  id: string;
  title: string;
  due: string;
  done: boolean;
  projectId?: string;
}
export interface OrganizerProject {
  id: string;
  title: string;
  due: string;
}
export interface OrganizerNote {
  id: string;
  title: string;
  body: string;
}
export interface OrganizerData {
  classes: WeekClass[];
  tasks: OrganizerTask[];
  projects: OrganizerProject[];
  notes: OrganizerNote[];
  timetableImage?: string;
}
const empty = (): OrganizerData => ({
  classes: [],
  tasks: [],
  projects: [],
  notes: [],
});
let data = empty();
let loaded = false;
let hydration: Promise<void> | undefined;
let version = 0;
let queue: Promise<void> = Promise.resolve();
const listeners = new Set<() => void>();
export const organizerVersion = () => version;
export const getOrganizer = () => ({ ...data, loaded });
export function subscribeOrganizer(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function emit() {
  version += 1;
  listeners.forEach(listener => listener());
}
export function validTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
export function validDue(value: string): boolean {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}
export function classError(
  candidate: Omit<WeekClass, 'id'>,
  classes: WeekClass[],
  editingId?: string,
): string | null {
  if (!candidate.title.trim()) return 'Enter a class name.';
  if (
    !Number.isInteger(candidate.weekday) ||
    candidate.weekday < 0 ||
    candidate.weekday > 6
  )
    return 'Choose a weekday.';
  if (
    !validTime(candidate.start) ||
    !validTime(candidate.end) ||
    candidate.end <= candidate.start
  )
    return 'Use 24-hour times (09:00); end must be after start.';
  if (
    classes.some(
      row =>
        row.id !== editingId &&
        row.weekday === candidate.weekday &&
        candidate.start < row.end &&
        row.start < candidate.end,
    )
  )
    return 'This overlaps another class. Check the times.';
  return null;
}
export function projectProgress(projectId: string, tasks: OrganizerTask[]) {
  const assigned = tasks.filter(task => task.projectId === projectId);
  return {
    total: assigned.length,
    done: assigned.filter(task => task.done).length,
  };
}
const text = (value: unknown): value is string => typeof value === 'string';
/** Restored values are untrusted; never render objects as labels. */
export function cleanOrganizer(raw: unknown): OrganizerData {
  if (!raw || typeof raw !== 'object') return empty();
  const value = raw as Record<string, unknown>;
  function rows(name: string): Record<string, unknown>[] {
    const seen = new Set<string>();
    return (Array.isArray(value[name]) ? value[name] : []).filter(
      (row): row is Record<string, unknown> => {
        if (
          !row ||
          typeof row !== 'object' ||
          !text(row.id) ||
          !text(row.title) ||
          !row.title.trim() ||
          seen.has(row.id)
        )
          return false;
        seen.add(row.id);
        return true;
      },
    );
  }
  const projects = rows('projects')
    .filter(row => text(row.due) && validDue(row.due))
    .map(row => ({
      id: String(row.id),
      title: String(row.title),
      due: String(row.due),
    }));
  return {
    projects,
    classes: rows('classes')
      .filter(
        row =>
          Number.isInteger(row.weekday) &&
          Number(row.weekday) >= 0 &&
          Number(row.weekday) <= 6 &&
          text(row.start) &&
          text(row.end) &&
          validTime(row.start) &&
          validTime(row.end) &&
          row.end > row.start,
      )
      .map(row => ({
        id: String(row.id),
        title: String(row.title),
        weekday: Number(row.weekday),
        start: String(row.start),
        end: String(row.end),
        room: text(row.room) ? row.room : '',
        subjectId: text(row.subjectId) ? row.subjectId : undefined,
      })),
    tasks: rows('tasks')
      .filter(row => text(row.due) && validDue(row.due))
      .map(row => ({
        id: String(row.id),
        title: String(row.title),
        due: String(row.due),
        done: row.done === true,
        projectId:
          text(row.projectId) && projects.some(p => p.id === row.projectId)
            ? row.projectId
            : undefined,
      })),
    notes: rows('notes')
      .filter(row => text(row.body))
      .map(row => ({
        id: String(row.id),
        title: String(row.title),
        body: String(row.body),
      })),
    timetableImage:
      text(value.timetableImage) &&
      /^data:image\/(jpeg|png|webp);base64,/.test(value.timetableImage)
        ? value.timetableImage
        : undefined,
  };
}
export function hydrateOrganizer(): Promise<void> {
  if (loaded) return Promise.resolve();
  if (!hydration)
    hydration = (async () => {
      const raw = await AsyncStorage.getItem(KEY);
      data = raw ? cleanOrganizer(JSON.parse(raw)) : empty();
      loaded = true;
      emit();
    })().catch(error => {
      hydration = undefined;
      throw error;
    });
  return hydration;
}
/** Serialize writes; failed saves keep the prior state and can be retried. */
export function changeOrganizer(
  change: (previous: OrganizerData) => OrganizerData,
): Promise<void> {
  const job = queue.then(async () => {
    await hydrateOrganizer();
    const next = change(data);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    data = next;
    emit();
  });
  queue = job.catch(() => {});
  return job;
}
export const organizerId = () =>
  `org_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
