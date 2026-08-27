import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

export interface UserNote {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  /**
   * Free text from the question bank's subject list, or null for unfiled.
   *
   * Not a foreign key: the subjects are TypeScript data, not database rows, so
   * a key would need a migration every time the bank changes.
   */
  subject?: string | null;
  /**
   * Storage paths in the private `note-images` bucket, `{uid}/{note}/{file}`.
   *
   * Paths, not bytes. Bytes in a synced row would mean every device
   * re-downloading megabytes of JPEG just to list a note's title.
   */
  images?: string[];
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = "orbit:user-notes:v1";

/**
 * Whether an id is one the database issued.
 *
 * `user_notes.id` is a `uuid` with a `gen_random_uuid()` default, so a note
 * created here before it reached the cloud carries a local `note_…` id
 * instead. Sending that to `.eq("id", …)` is not a harmless miss — Postgres
 * rejects it as invalid input for a uuid — so cloud writes only go out with an
 * id the cloud will recognise.
 */
const CLOUD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isCloudId = (id: string) => CLOUD_ID.test(id);

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
      subject: initial?.subject ?? null,
      images: initial?.images ?? [],
      created_at: now,
      updated_at: now,
    };

    const next = [newNote, ...notes];
    setNotes(next);
    await saveLocal(next);

    if (userId) {
      // `.select().single()` is what stops the note having two identities —
      // `note_…` here and a uuid in the database. Without it an edit updates
      // nothing and a delete removes only the local copy, so the note comes
      // back on the next refetch.
      const { data, error } = await supabase
        .from("user_notes")
        .insert({
          user_id: userId,
          title: newNote.title,
          content: newNote.content,
          subject: newNote.subject ?? null,
          images: newNote.images ?? [],
        })
        .select("id, created_at, updated_at")
        .single();

      // supabase-js returns errors rather than throwing, so the try/catch this
      // replaces could never have fired.
      if (!error && data?.id) {
        const adopted = next.map(note =>
          note.id === newId
            ? {
                ...note,
                id: data.id as string,
                created_at: (data.created_at as string) ?? note.created_at,
                updated_at: (data.updated_at as string) ?? note.updated_at,
              }
            : note,
        );
        setNotes(adopted);
        await saveLocal(adopted);
        return adopted.find(note => note.id === data.id) ?? newNote;
      }
      // Otherwise the note keeps its local id and stays on this device.
    }
    return newNote;
  };

  const updateNote = async (
    id: string,
    patch: Partial<Pick<UserNote, "title" | "content" | "subject" | "images">>,
  ) => {
    const next = notes.map(n => (n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n));
    setNotes(next);
    await saveLocal(next);

    if (userId && isCloudId(id)) {
      await supabase.from("user_notes").update(patch).eq("id", id);
    }
  };

  const deleteNote = async (id: string) => {
    const next = notes.filter(n => n.id !== id);
    setNotes(next);
    await saveLocal(next);

    if (userId && isCloudId(id)) {
      await supabase.from("user_notes").delete().eq("id", id);
    }
  };

  return { notes, loading, createNote, updateNote, deleteNote, refetch: fetchCloud };
}
