import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

export interface UserNote {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = "orbit:user-notes:v1";

export function useUserNotes(userId: string | null) {
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLocal = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        setNotes(JSON.parse(raw) as UserNote[]);
      }
    } catch {
      // Ignored
    }
  }, []);

  const saveLocal = useCallback(async (list: UserNote[]) => {
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
        .from("user_notes")
        .select("*")
        .order("updated_at", { ascending: false });
      if (!error && data) {
        setNotes(data as UserNote[]);
        saveLocal(data as UserNote[]);
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

  const createNote = async (initial?: Partial<UserNote>): Promise<UserNote> => {
    const newId = `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const newNote: UserNote = {
      id: newId,
      user_id: userId ?? undefined,
      title: initial?.title ?? "",
      content: initial?.content ?? "",
      created_at: now,
      updated_at: now,
    };

    const next = [newNote, ...notes];
    setNotes(next);
    await saveLocal(next);

    if (userId) {
      try {
        await supabase.from("user_notes").insert({
          user_id: userId,
          title: newNote.title,
          content: newNote.content,
        });
      } catch {
        // Keep local
      }
    }
    return newNote;
  };

  const updateNote = async (id: string, patch: Partial<Pick<UserNote, "title" | "content">>) => {
    const next = notes.map(n => (n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n));
    setNotes(next);
    await saveLocal(next);

    if (userId) {
      try {
        await supabase.from("user_notes").update(patch).eq("id", id);
      } catch {
        // Keep local
      }
    }
  };

  const deleteNote = async (id: string) => {
    const next = notes.filter(n => n.id !== id);
    setNotes(next);
    await saveLocal(next);

    if (userId) {
      try {
        await supabase.from("user_notes").delete().eq("id", id);
      } catch {
        // Keep local
      }
    }
  };

  return { notes, loading, createNote, updateNote, deleteNote, refetch: fetchCloud };
}
