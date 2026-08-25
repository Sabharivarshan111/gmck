import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

/**
 * How many people are in a focus session right now.
 *
 * A heartbeat rather than a connection: a row per device with a timestamp, and
 * the count is however many were seen inside the window. Realtime presence
 * would be exact and would also hold a websocket open on a phone that is
 * already running a timer, which is the wrong trade for a number that decorates
 * a screen.
 */
const HEARTBEAT_MS = 15_000;
const ACTIVE_WINDOW_SECONDS = 45;
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
export function useOnlinePresence(isStudying = false) {
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const deviceIdRef = useRef<string | null>(null);
  const studyingRef = useRef(isStudying);
  studyingRef.current = isStudying;
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
        await supabase.from('study_presence').upsert(
          { device_id: deviceId, last_seen: new Date().toISOString() },
          // Named, not inferred. Without it PostgREST conflicts on the primary
          // key, and if that is ever not device_id this inserts a fresh row
          // every fifteen seconds and the count climbs forever.
          { onConflict: 'device_id' },
        );
      }

      const since = new Date(Date.now() - ACTIVE_WINDOW_SECONDS * 1000).toISOString();
      const { count, error } = await supabase
        .from('study_presence')
        .select('device_id', { count: 'exact', head: true })
        .gte('last_seen', since);

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
     * count nobody is looking at, since the screen showing it is not on. The
     * row goes too: a backgrounded phone is not in a focus session however the
     * timer is configured.
     */
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active') {
        start();
      } else {
        stop();
        forget();
      }
    });

    return () => {
      cancelled = true;
      stop();
      subscription.remove();
      forget();
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
