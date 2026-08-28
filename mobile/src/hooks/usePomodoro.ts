import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { complete } from '@/lib/haptics';
import { playChime } from '@/lib/sound';
import { warn } from '@/lib/log';
import { plantTree } from '@/lib/forest';
import { DEFAULT_SPECIES } from '@/lib/trees';

export type PomodoroMode = 'focus' | 'short' | 'long';

export interface PomodoroSettings {
  focusMinutes: number;
  shortMinutes: number;
  longMinutes: number;
  longEvery: number;
  /** Which tree a focus session plants — a key from `lib/trees`. */
  species: string;
  /**
   * Whether leaving the app mid-session withers the tree.
   *
   * On by default, because it is the thing that makes the tree mean anything.
   * Off is offered rather than assumed: someone revising from a PDF in another
   * app is not being distracted, and an app that punishes them for it is an
   * app they stop using.
   */
  wilt: boolean;
}

export const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortMinutes: 5,
  longMinutes: 15,
  longEvery: 4,
  species: DEFAULT_SPECIES,
  wilt: true,
};

/**
 * How long you may be away before the tree withers, in milliseconds.
 *
 * Forest kills the tree the instant you leave. That is right for an app whose
 * only job is to stop you touching your phone, and wrong for a medical
 * question bank: a notification, a glance at a caller, a two-second check of a
 * formula are all things a student doing a fifty-minute Pharmacology block will
 * do. Fifteen seconds is long enough for all of those and far too short to
 * read anything.
 */
export const WILT_GRACE_MS = 15000;

const SESSION_KEY = 'pomodoro:session';
const SETTINGS_KEY = 'pomodoro:settings';
const FOCUS_TOTAL_KEY = 'pomodoro:focus-minutes-total';
const FOCUS_TODAY_KEY = 'pomodoro:focus-today';

/** Local calendar day, so "today" rolls over at the user's midnight. */
function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

interface PersistedSession {
  mode: PomodoroMode;
  totalSeconds: number;
  endsAt: number;
  completedFocus: number;
}

export const MODE_LABEL: Record<PomodoroMode, string> = {
  focus: 'Focus',
  short: 'Short Break',
  long: 'Long Break',
};

/**
 * A wall-clock pomodoro. The deadline is stored as an absolute timestamp, so
 * backgrounding the app, locking the screen, or killing the JS timer does not
 * drift the countdown — remaining time is always recomputed from Date.now().
 */
export function usePomodoro() {
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [totalSeconds, setTotalSeconds] = useState(DEFAULT_SETTINGS.focusMinutes * 60);
  const [remaining, setRemaining] = useState(DEFAULT_SETTINGS.focusMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedFocus, setCompletedFocus] = useState(0);
  /**
   * Bumped every time a session ends, so the screen can acknowledge it.
   *
   * A counter rather than a boolean: two sessions in a row have to be
   * distinguishable, and a boolean that has to be reset invites a stuck flag.
   */
  const [completionNonce, setCompletionNonce] = useState(0);
  const [focusMinutesTotal, setFocusMinutesTotal] = useState(0);
  const [focusMinutesToday, setFocusMinutesToday] = useState(0);
  /** This session's tree has withered. Cleared when a new one is planted. */
  const [wilted, setWilted] = useState(false);

  const endsAtRef = useRef<number | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  /** When the app went to the background, so the grace period can be measured. */
  const leftAt = useRef<number | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const runningRef = useRef(isRunning);
  runningRef.current = isRunning;
  const wiltedRef = useRef(wilted);
  wiltedRef.current = wilted;

  const minutesFor = useCallback((next: PomodoroMode, from: PomodoroSettings) => {
    if (next === 'focus') {
      return from.focusMinutes;
    }
    return next === 'short' ? from.shortMinutes : from.longMinutes;
  }, []);

  // Restore settings, lifetime focus minutes, and any in-flight session.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getMany([
          SETTINGS_KEY,
          SESSION_KEY,
          FOCUS_TOTAL_KEY,
          FOCUS_TODAY_KEY,
        ]);
        if (cancelled) {
          return;
        }
        const rawSettings = stored[SETTINGS_KEY];
        const rawSession = stored[SESSION_KEY];
        const rawTotal = stored[FOCUS_TOTAL_KEY];
        const rawToday = stored[FOCUS_TODAY_KEY];

        if (rawToday) {
          const parsed = JSON.parse(rawToday) as { date: string; minutes: number };
          // Yesterday's total does not carry over.
          if (parsed.date === todayKey()) {
            setFocusMinutesToday(parsed.minutes || 0);
          }
        }

        let active = DEFAULT_SETTINGS;
        if (rawSettings) {
          active = { ...DEFAULT_SETTINGS, ...(JSON.parse(rawSettings) as PomodoroSettings) };
          setSettings(active);
        }
        if (rawTotal) {
          setFocusMinutesTotal(Number(rawTotal) || 0);
        }
        if (rawSession) {
          const session = JSON.parse(rawSession) as PersistedSession;
          const left = Math.round((session.endsAt - Date.now()) / 1000);
          setMode(session.mode);
          setTotalSeconds(session.totalSeconds);
          setCompletedFocus(session.completedFocus);
          if (left > 0) {
            endsAtRef.current = session.endsAt;
            setRemaining(left);
            setIsRunning(true);
            return;
          }
          // Session elapsed while the app was closed.
          setRemaining(0);
          await AsyncStorage.removeItem(SESSION_KEY);
          return;
        }
        setTotalSeconds(minutesFor('focus', active) * 60);
        setRemaining(minutesFor('focus', active) * 60);
      } catch (error) {
        warn('pomodoro restore failed:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [minutesFor]);

  const finishSession = useCallback(() => {
    setIsRunning(false);
    endsAtRef.current = null;
    AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
    // Haptic, sound and visual have to land together — feedback split across
    // senses reads as several events rather than one (apple-design §13
    // Harmony). The screen's flourish keys off the same nonce set here, and
    // the chime is fired on the same tick rather than after an await.
    complete();
    playChime();
    setCompletionNonce(n => n + 1);

    setMode(current => {
      if (current !== 'focus') {
        const next = settingsRef.current.focusMinutes * 60;
        setTotalSeconds(next);
        setRemaining(next);
        return 'focus';
      }

      const done = completedFocus + 1;
      setCompletedFocus(done);
      // The tree is planted the moment the session ends, wilted or not: an
      // empty plot says nothing happened, a grey tree says exactly what did.
      plantTree({
        at: Date.now(),
        minutes: settingsRef.current.focusMinutes,
        species: settingsRef.current.species,
        wilted: wiltedRef.current,
      }).catch(() => {});
      setWilted(false);
      setFocusMinutesTotal(prev => {
        const updated = prev + settingsRef.current.focusMinutes;
        AsyncStorage.setItem(FOCUS_TOTAL_KEY, String(updated)).catch(() => {});
        return updated;
      });
      setFocusMinutesToday(prev => {
        const updated = prev + settingsRef.current.focusMinutes;
        AsyncStorage.setItem(
          FOCUS_TODAY_KEY,
          JSON.stringify({ date: todayKey(), minutes: updated }),
        ).catch(() => {});
        return updated;
      });

      const nextMode: PomodoroMode =
        done % settingsRef.current.longEvery === 0 ? 'long' : 'short';
      const nextSeconds = minutesFor(nextMode, settingsRef.current) * 60;
      setTotalSeconds(nextSeconds);
      setRemaining(nextSeconds);
      return nextMode;
    });
  }, [completedFocus, minutesFor]);

  const syncFromClock = useCallback(() => {
    if (endsAtRef.current == null) {
      return;
    }
    const left = Math.round((endsAtRef.current - Date.now()) / 1000);
    if (left <= 0) {
      setRemaining(0);
      finishSession();
    } else {
      setRemaining(left);
    }
  }, [finishSession]);

  // Tick once per second while running.
  useEffect(() => {
    if (!isRunning) {
      return;
    }
    const id = setInterval(syncFromClock, 1000);
    return () => clearInterval(id);
  }, [isRunning, syncFromClock]);

  /*
   * Re-sync on return — and wither the tree if the trip was a long one.
   *
   * `AppState` is all this needs: no permission, no Usage Access, no
   * accessibility service. Forest's Deep Focus blocks other apps outright,
   * which needs exactly those, is a Play-policy minefield, and would stop a
   * student opening a calculator mid-revision. Knowing you left is enough.
   */
  useEffect(() => {
    const handler = (state: AppStateStatus) => {
      if (state === 'active') {
        const away = leftAt.current == null ? 0 : Date.now() - leftAt.current;
        leftAt.current = null;
        if (
          away > WILT_GRACE_MS &&
          runningRef.current &&
          modeRef.current === 'focus' &&
          settingsRef.current.wilt
        ) {
          setWilted(true);
        }
        syncFromClock();
        return;
      }
      // 'inactive' is the half-second of a system dialog or the app switcher
      // being opened; only a real background counts as leaving.
      if (state === 'background') {
        leftAt.current = Date.now();
      }
    };
    const subscription = AppState.addEventListener('change', handler);
    return () => subscription.remove();
  }, [syncFromClock]);

  const persistSession = useCallback(
    (endsAt: number, currentMode: PomodoroMode, total: number, focusCount: number) => {
      const session: PersistedSession = {
        mode: currentMode,
        totalSeconds: total,
        endsAt,
        completedFocus: focusCount,
      };
      AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session)).catch(() => {});
    },
    [],
  );

  const start = useCallback(() => {
    const seconds = remaining > 0 ? remaining : totalSeconds;
    const endsAt = Date.now() + seconds * 1000;
    endsAtRef.current = endsAt;
    setRemaining(seconds);
    setIsRunning(true);
    persistSession(endsAt, mode, totalSeconds, completedFocus);
  }, [remaining, totalSeconds, mode, completedFocus, persistSession]);

  const pause = useCallback(() => {
    syncFromClock();
    setIsRunning(false);
    endsAtRef.current = null;
    AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
  }, [syncFromClock]);

  const reset = useCallback(() => {
    setWilted(false);
    const seconds = minutesFor(mode, settingsRef.current) * 60;
    setIsRunning(false);
    endsAtRef.current = null;
    setTotalSeconds(seconds);
    setRemaining(seconds);
    AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
  }, [mode, minutesFor]);

  /**
   * Start the pomodoro count again from zero, back on a focus session.
   *
   * Distinct from reset(), which only restarts the session on screen. This is
   * for the other thing people mean by "reset": the run of four is wrong —
   * they were interrupted, or left the app running overnight — and the next
   * long break should be counted from now rather than from whatever the tally
   * happens to say.
   */
  const resetCycle = useCallback(() => {
    setWilted(false);
    const seconds = minutesFor('focus', settingsRef.current) * 60;
    setIsRunning(false);
    endsAtRef.current = null;
    setCompletedFocus(0);
    setMode('focus');
    setTotalSeconds(seconds);
    setRemaining(seconds);
    AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
  }, [minutesFor]);

  const switchMode = useCallback(
    (next: PomodoroMode) => {
      const seconds = minutesFor(next, settingsRef.current) * 60;
      setWilted(false);
      setIsRunning(false);
      endsAtRef.current = null;
      setMode(next);
      setTotalSeconds(seconds);
      setRemaining(seconds);
      AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
    },
    [minutesFor],
  );

  const updateSettings = useCallback(
    (next: Partial<PomodoroSettings>) => {
      setSettings(prev => {
        const merged = { ...prev, ...next };
        settingsRef.current = merged;
        AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(merged)).catch(() => {});
        if (!isRunning) {
          const seconds = minutesFor(mode, merged) * 60;
          setTotalSeconds(seconds);
          setRemaining(seconds);
        }
        return merged;
      });
    },
    [isRunning, mode, minutesFor],
  );

  const setCustomMinutes = useCallback(
    (mins: number) => {
      const safeMins = Math.max(1, Math.min(180, mins));
      const seconds = safeMins * 60;
      setIsRunning(false);
      endsAtRef.current = null;
      AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
      setTotalSeconds(seconds);
      setRemaining(seconds);
      if (mode === 'focus') {
        updateSettings({ focusMinutes: safeMins });
      } else if (mode === 'short') {
        updateSettings({ shortMinutes: safeMins });
      } else {
        updateSettings({ longMinutes: safeMins });
      }
    },
    [mode, updateSettings],
  );

  return {
    mode,
    modeLabel: MODE_LABEL[mode],
    remaining,
    totalSeconds,
    isRunning,
    completedFocus,
    completionNonce,
    focusMinutesTotal,
    focusMinutesToday,
    settings,
    wilted,
    /**
     * How much of this focus session has been spent, 0 to 1.
     *
     * Derived rather than stored: it changes every tick anyway, and a second
     * copy of a value the countdown already holds is a second thing that can
     * disagree with the clock.
     */
    growth:
      mode === 'focus' && totalSeconds > 0
        ? Math.max(0, Math.min(1, 1 - remaining / totalSeconds))
        : 0,
    start,
    pause,
    reset,
    switchMode,
    updateSettings,
    resetCycle,
    setCustomMinutes,
  };
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
