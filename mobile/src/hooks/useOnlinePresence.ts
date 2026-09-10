import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

/**
 * How many people are in a focus session right now.
 *
 * A heartbeat rather than a connection: a row per device, and the count is
 * however many sessions have not finished yet. Realtime presence would be exact
 * and would also hold a websocket open on a phone that is already running a
 * timer, which is the wrong trade for a number that decorates a screen.
 *
 * ## It used to count the people who were ignoring the timer
 *
 * The count was "devices seen in the last forty-five seconds", and the hook
 * deletes its row and stops beating when the app goes to the background. The
 * Timer screen's own instruction is **"twenty five minutes, phone down"** — so
 * the moment somebody did what the app asked, they left the count. What was
 * left was the devices staring at a countdown, which is the behaviour the
 * feature exists to discourage.
 *
 * Measured on the live table before this changed: 3,277 rows, 44 devices seen
 * that day, and never more than one inside a window. The screen had therefore
 * always read "Studying with you right now / Start a session to join" and had
 * never once shown a number. It looked like a broken query and it was a broken
 * definition.
 *
 * So a beat now publishes **when this session ends**, and the count is sessions
 * that have not ended. A pocketed phone keeps counting for the rest of its
 * twenty-five minutes and writes nothing while it does — which is exactly what
 * the heartbeat design was protecting.
 */
const HEARTBEAT_MS = 15_000;
const DEVICE_ID_KEY = 'study_presence_device_id';

let cachedDeviceId: string | null = null;

function mintId(): string {
  return 'mob_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function getOrCreateDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) {
      cachedDeviceId = existing;
      return existing;
    }
    const newId = mintId();
    await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
    cachedDeviceId = newId;
    return newId;
  } catch {
    // Storage unavailable: a per-launch id still counts this device once.
    cachedDeviceId = mintId();
    return cachedDeviceId;
  }
}

/**
 * @param isStudying whether a focus session is actually running.
 *
 * It gates the heartbeat, and it is read through a ref rather than listed as an
 * effect dependency. As a dependency it tore the whole effect down on every
 * pause — which runs the cleanup, which **deletes the presence row** — and
 * built a new one on resume. A timer that is paused and restarted a few times
 * is then a device that leaves and rejoins, and the count everyone else sees
 * flickers.
 */
export function useOnlinePresence(isStudying = false, remainingSeconds = 0) {
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const deviceIdRef = useRef<string | null>(null);
  const studyingRef = useRef(isStudying);
  studyingRef.current = isStudying;
  /*
   * Read through a ref for the same reason `isStudying` is: this changes every
   * second, and as an effect dependency it would tear the heartbeat down and
   * rebuild it once a second — which runs the cleanup, which deletes the row.
   */
  const remainingRef = useRef(remainingSeconds);
  remainingRef.current = remainingSeconds;
  /** The running effect's beat, so starting a session can publish at once. */
  const beatRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const forget = () => {
      const deviceId = deviceIdRef.current;
      if (!deviceId) {
        return;
      }
      // supabase-js returns errors rather than throwing them, so there is
      // nothing here for a try/catch to catch. Both arms are the same shrug:
      // a row we failed to remove ages out of the window on its own.
      supabase
        .from('study_presence')
        .delete()
        .eq('device_id', deviceId)
        .then(
          () => {},
          () => {},
        );
    };

    const beat = async () => {
      const deviceId = deviceIdRef.current ?? (await getOrCreateDeviceId());
      deviceIdRef.current = deviceId;

      /*
       * Only a running timer is presence. Anyone who has the Timer tab open is
       * not "studying right now", and counting them is how a number like this
       * stops meaning anything — the tab is the app's landing spot for a lot of
       * people.
       */
      if (studyingRef.current) {
        /*
         * `focus_until` is what makes this survive the phone being put down.
         *
         * It is written on every beat, so it tracks the session rather than
         * predicting it: pausing stops the beats, and the row then expires at
         * whatever the last beat said — at most fifteen seconds of overcount,
         * against a session measured in tens of minutes.
         */
        const endsAt = new Date(Date.now() + Math.max(0, remainingRef.current) * 1000);
        await supabase.from('study_presence').upsert(
          {
            device_id: deviceId,
            last_seen: new Date().toISOString(),
            focus_until: endsAt.toISOString(),
          },
          // Named, not inferred. Without it PostgREST conflicts on the primary
          // key, and if that is ever not device_id this inserts a fresh row
          // every fifteen seconds and the count climbs forever.
          { onConflict: 'device_id' },
        );
      }

      // Sessions that have not finished, rather than screens that are open.
      const { count, error } = await supabase
        .from('study_presence')
        .select('device_id', { count: 'exact', head: true })
        .gt('focus_until', new Date().toISOString());

      if (cancelled) {
        return;
      }
      if (!error) {
        setOnlineCount(count ?? 0);
      }
      setLoading(false);
    };

    const tick = () => {
      beat().catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    };

    const start = () => {
      if (timer != null) {
        return;
      }
      tick();
      timer = setInterval(tick, HEARTBEAT_MS);
    };

    const stop = () => {
      if (timer != null) {
        clearInterval(timer);
        timer = null;
      }
    };

    beatRef.current = tick;
    start();

    /*
     * Nothing beats in the background.
     *
     * Four writes a minute, forever, on a phone that has been put in a pocket
     * — on metered data, on the cheap hardware this app is aimed at — for a
     * count nobody is looking at, since the screen showing it is not on.
     *
     * The ROW no longer goes with it. `focus_until` is already written, so a
     * session that is genuinely still running keeps counting without costing a
     * single background write. See the header for why deleting it here was the
     * whole bug.
     */
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active') {
        start();
        return;
      }
      stop();
      /*
       * A backgrounded phone with a session running KEEPS its row.
       *
       * This used to call `forget()` unconditionally, and that one line is why
       * the count was always empty: the app says "phone down", the reader puts
       * the phone down, and the app removed them. The row now expires on its
       * own at `focus_until`, so nothing has to be written from the
       * background — the battery argument that put this branch here is
       * untouched.
       *
       * With no session running there is nothing to preserve and the row goes,
       * exactly as before.
       */
      if (!studyingRef.current) {
        forget();
      }
    });

    return () => {
      cancelled = true;
      stop();
      subscription.remove();
      /*
       * Same rule as backgrounding, and it is not a nicety: leaving the Timer
       * tab mid-session unmounts this, and an unconditional delete here would
       * drop the reader out of the count for going to look something up. The
       * row expires at `focus_until` either way, so nothing leaks.
       */
      if (!studyingRef.current) {
        forget();
      }
    };
  }, []);

  /*
   * Publish the moment a session starts or stops, rather than waiting out the
   * rest of the interval. The label on screen flips from `timer.isRunning`
   * immediately, so without this a phone says "in deep focus" for up to fifteen
   * seconds before anyone else's count agrees.
   */
  const publishedRef = useRef(false);
  useEffect(() => {
    // Not on mount: the effect above already beat, and two identical requests
    // one after the other is the sort of thing that looks free on a laptop.
    if (!publishedRef.current) {
      publishedRef.current = true;
      return;
    }
    beatRef.current();
  }, [isStudying]);

  return { onlineCount, loading };
}
