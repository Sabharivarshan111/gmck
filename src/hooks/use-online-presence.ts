import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const HEARTBEAT_MS = 15_000;

/**
 * How many people are in a focus session right now.
 *
 * ## Why this changed, with the numbers that forced it
 *
 * This used to ping `last_seen` on every heartbeat the moment the page loaded,
 * and count every device seen in the previous forty-five seconds. So it counted
 * open browser tabs, not people studying — and the Timer tab is where a lot of
 * people land and sit.
 *
 * The native app moved off that definition deliberately, because its own screen
 * says "twenty-five minutes, phone down": the instant somebody did what the app
 * asked, they dropped out of the count, and what was left was the devices
 * staring at a countdown. It publishes `focus_until` instead and counts sessions
 * that have not ended.
 *
 * The two apps then disagreed, in one direction, and the app's owner spotted it:
 * the web showed a number and the phone never did. Measured on the live table —
 * 183 rows, 183 devices, and **182 of them had `focus_until` NULL**, because
 * this hook never wrote that column. Every web visitor was therefore invisible
 * to the phone's query, while every phone WAS visible to this one, since the
 * native app writes `last_seen` too.
 *
 * So the number on the web was real in the sense that the rows existed, and
 * wrong in the sense that it was not measuring studying. Same table, same
 * column, same definition now.
 *
 * A caller that passes no session still beats, so it keeps its row warm, and
 * contributes nothing to the count — which is correct: it is not studying.
 */
export interface PresenceSession {
  isRunning: boolean;
  /** Seconds left in the running session. */
  secondsLeft: number;
}

function getDeviceId() {
  try {
    const KEY = 'study_presence_device_id';
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export function useOnlinePresence(session?: PresenceSession) {
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  /*
   * Read through a ref so a running timer — which re-renders every second —
   * does not tear down and rebuild the heartbeat interval on every tick.
   */
  const sessionRef = useRef<PresenceSession | undefined>(session);
  sessionRef.current = session;

  useEffect(() => {
    const deviceId = getDeviceId();
    let cancelled = false;

    const ping = async () => {
      try {
        const live = sessionRef.current;
        /*
         * Written on every beat rather than once at the start, so it tracks the
         * session instead of predicting it: pausing stops the beats and the row
         * expires at whatever the last one said. At most one heartbeat of
         * overcount, against a session measured in tens of minutes.
         *
         * Cleared when nothing is running, or a row would keep counting from a
         * session the reader abandoned twenty minutes ago.
         */
        const focusUntil =
          live?.isRunning && live.secondsLeft > 0
            ? new Date(Date.now() + live.secondsLeft * 1000).toISOString()
            : null;
        await supabase.from('study_presence').upsert(
          {
            device_id: deviceId,
            last_seen: new Date().toISOString(),
            focus_until: focusUntil,
          },
          // Named, not inferred: without it PostgREST conflicts on the primary
          // key, and if that is ever not device_id this inserts a fresh row
          // every fifteen seconds and the count climbs forever.
          { onConflict: 'device_id' },
        );
      } catch {
        /* ignore */
      }
    };

    const recount = async () => {
      try {
        // Sessions that have not finished, rather than screens that are open.
        const { count, error } = await supabase
          .from('study_presence')
          .select('device_id', { count: 'exact', head: true })
          .gt('focus_until', new Date().toISOString());
        if (error) throw error;
        if (!cancelled) setOnlineCount(count ?? null);
      } catch {
        if (!cancelled) setOnlineCount(null);
      }
    };

    // initial
    ping().then(recount);

    const heartbeat = setInterval(() => {
      ping().then(recount);
    }, HEARTBEAT_MS);

    const cleanup = async () => {
      try {
        await supabase.from('study_presence').delete().eq('device_id', deviceId);
      } catch {
        /* ignore */
      }
    };

    const onBeforeUnload = () => {
      // best-effort fire-and-forget
      void cleanup();
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      cancelled = true;
      clearInterval(heartbeat);
      window.removeEventListener('beforeunload', onBeforeUnload);
      void cleanup();
    };
  }, []);

  return { onlineCount };
}
