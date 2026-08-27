import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Study events and exam targets on the calendar.
 *
 * **On this device and nowhere else**, the same as the study notes beside them.
 * No row, no account, no server copy. What somebody has written on their own
 * calendar — a viva date, a ward posting, "revise cardio" — is their business,
 * and this app has no reason to hold a copy of it.
 *
 * It used to try to sync, and never actually did: the screen handed this hook
 * the signed-in **email** as `userId`, while `calendar_events.user_id` is a
 * `uuid`. Postgres rejected every insert, supabase-js returns errors rather
 * than throwing, and the `if (!error)` branch kept the local copy in silence.
 * The 68 rows in that table are all from the web app.
 *
 * The trade is the one the UI states: reinstall the app or lose the phone and
 * these go with it. `npm run check:cloud-ids` fails if this file so much as
 * imports the Supabase client.
 */

export interface CalendarEvent {
  id: string;
  event_date: string; // YYYY-MM-DD
  title: string;
  important: boolean;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = "orbit:calendar-events:v1";

/** Local calendar day, not UTC — the same rule the streak follows. */
function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const saveLocal = useCallback(async (list: CalendarEvent[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Best effort. A failed write costs the event; a thrown one costs the
      // screen.
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      setEvents(
        Array.isArray(parsed)
          ? parsed.filter(
              (event): event is CalendarEvent =>
                !!event &&
                typeof (event as CalendarEvent).id === "string" &&
                typeof (event as CalendarEvent).event_date === "string",
            )
          : [],
      );
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addEvent = async (date: Date, title: string, important = false) => {
    const now = new Date().toISOString();
    const event: CalendarEvent = {
      id: `cal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      event_date: toDateString(date),
      title,
      important,
      created_at: now,
      updated_at: now,
    };
    const next = [...events, event].sort((a, b) => a.event_date.localeCompare(b.event_date));
    setEvents(next);
    await saveLocal(next);
    return event;
  };

  const updateEvent = async (
    id: string,
    patch: Partial<Pick<CalendarEvent, "title" | "important">>,
  ) => {
    const next = events.map(event =>
      event.id === id ? { ...event, ...patch, updated_at: new Date().toISOString() } : event,
    );
    setEvents(next);
    await saveLocal(next);
  };

  const deleteEvent = async (id: string) => {
    const next = events.filter(event => event.id !== id);
    setEvents(next);
    await saveLocal(next);
  };

  return { events, loading, addEvent, updateEvent, deleteEvent, refetch: load };
}
