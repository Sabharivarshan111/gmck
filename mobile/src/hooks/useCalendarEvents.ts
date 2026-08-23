import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

export interface CalendarEvent {
  id: string;
  user_id?: string;
  event_date: string; // YYYY-MM-DD
  title: string;
  important: boolean;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = "orbit:calendar-events:v1";

function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useCalendarEvents(userId: string | null) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLocal = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        setEvents(JSON.parse(raw) as CalendarEvent[]);
      }
    } catch {
      // Ignored
    }
  }, []);

  const saveLocal = useCallback(async (list: CalendarEvent[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Ignored
    }
  }, []);

  const fetchCloud = useCallback(async () => {
    if (!userId) {
      await loadLocal();
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .order("event_date", { ascending: true });
      if (!error && data) {
        setEvents(data as CalendarEvent[]);
        saveLocal(data as CalendarEvent[]);
      } else {
        await loadLocal();
      }
    } catch {
      await loadLocal();
    } finally {
      setLoading(false);
    }
  }, [userId, loadLocal, saveLocal]);

  useEffect(() => {
    fetchCloud();
  }, [fetchCloud]);

  const addEvent = async (date: Date, title: string, important = false) => {
    const eventDate = toDateString(date);
    const newId = `cal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const newEvent: CalendarEvent = {
      id: newId,
      user_id: userId ?? undefined,
      event_date: eventDate,
      title: title.trim(),
      important,
      created_at: now,
      updated_at: now,
    };

    const next = [...events, newEvent].sort((a, b) => a.event_date.localeCompare(b.event_date));
    setEvents(next);
    await saveLocal(next);

    if (userId) {
      try {
        await supabase.from("calendar_events").insert({
          user_id: userId,
          event_date: eventDate,
          title: title.trim(),
          important,
        });
      } catch {
        // Keep local
      }
    }
  };

  const updateEvent = async (id: string, patch: Partial<Pick<CalendarEvent, "title" | "important">>) => {
    const next = events.map(e => (e.id === id ? { ...e, ...patch, updated_at: new Date().toISOString() } : e));
    setEvents(next);
    await saveLocal(next);

    if (userId) {
      try {
        await supabase.from("calendar_events").update(patch).eq("id", id);
      } catch {
        // Keep local
      }
    }
  };

  const deleteEvent = async (id: string) => {
    const next = events.filter(e => e.id !== id);
    setEvents(next);
    await saveLocal(next);

    if (userId) {
      try {
        await supabase.from("calendar_events").delete().eq("id", id);
      } catch {
        // Keep local
      }
    }
  };

  return { events, loading, addEvent, updateEvent, deleteEvent, refetch: fetchCloud };
}
