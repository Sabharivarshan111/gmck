import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { removeNoteImages } from "@/lib/noteImages";
import { removeNoteFiles, type NoteFile } from "@/lib/noteFiles";

/**
 * Personal study notes.
 *
 * **On this device and nowhere else.** No account, no upload, no Supabase row.
 * This is the app owner's decision and it is the whole point of the feature: a
 * study note is somebody's own material — a ward-round scribble, a photograph
 * of their own book — and it is not this app's to keep a copy of on a server.
 *
 * It used to *try* to sync, and never actually did: both this hook and the
 * calendar were handed the signed-in **email** as `userId`, while
 * `user_notes.user_id` is a `uuid`. Postgres rejected every insert, supabase-js
 * returns errors rather than throwing, and the `if (!error)` branch quietly
 * kept the local copy. Nobody noticed because the local copy is all anyone ever
 * saw. Rather than fix that plumbing, the cloud half is gone — which is what
 * was asked for, and is now true rather than merely broken.
 *
 * The trade is stated in the UI, because it is only fair if it is not a
 * surprise later: reinstall the app or lose the phone and these go with it.
 */

export interface UserNote {
  id: string;
  title: string;
  content: string;
  /** Free text from the question bank's subject list, or null for unfiled. */
  subject?: string | null;
  /**
   * The chapter this note is about, as `flattenSubjectTopics` keys it —
   * "pathology::paper-1/neoplasia".
   *
   * The key is what the chapter screen matches on; the name is kept beside it
   * so the note can say where it is filed without walking the question bank to
   * find out. Subject alone was not enough: "Pathology" is forty chapters, and
   * a note about neoplasia surfacing on all of them is noise, not filing.
   */
  chapterKey?: string | null;
  chapterName?: string | null;
  /**
   * Local picture ids, resolved through `lib/noteImages`.
   *
   * Ids, not bytes: this whole list is one AsyncStorage value, and base64
   * photographs inside it would make reading the note *titles* a multi-megabyte
   * parse on a cheap phone.
   */
  images?: string[];
  /**
   * Videos, recordings and PDFs, resolved through `lib/noteFiles`.
   *
   * Separate from `images` because they are stored differently and for a
   * reason: a picture is a downscaled data URI in its own AsyncStorage key,
   * while these are real files in the app's own directory. Forty megabytes of
   * base64 video does not belong in the store that also holds this list.
   *
   * Records rather than bare ids, so the list can say "lecture-3.mp4, 42 MB"
   * without opening anything.
   */
  files?: NoteFile[];
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = "orbit:user-notes:v1";

export function useUserNotes() {
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);

  const saveLocal = useCallback(async (list: UserNote[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Best effort, like every other store in this app. A note that fails to
      // persist is a note lost on the next launch; a launch that fails is worse.
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      setNotes(
        Array.isArray(parsed)
          ? parsed.filter(
              (note): note is UserNote =>
                !!note &&
                typeof (note as UserNote).id === "string" &&
                typeof (note as UserNote).title === "string",
            )
          : [],
      );
    } catch {
      // A note list that will not parse is shown empty rather than thrown: a
      // screen that crashes on open cannot show them either.
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createNote = async (initial?: Partial<UserNote>): Promise<UserNote> => {
    const now = new Date().toISOString();
    const note: UserNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: initial?.title ?? "",
      content: initial?.content ?? "",
      subject: initial?.subject ?? null,
      chapterKey: initial?.chapterKey ?? null,
      chapterName: initial?.chapterName ?? null,
      images: initial?.images ?? [],
      created_at: now,
      updated_at: now,
    };
    const next = [note, ...notes];
    setNotes(next);
    await saveLocal(next);
    return note;
  };

  const updateNote = async (
    id: string,
    patch: Partial<
      Pick<UserNote, "title" | "content" | "subject" | "chapterKey" | "chapterName" | "images">
    >,
  ) => {
    const next = notes.map(note =>
      note.id === id ? { ...note, ...patch, updated_at: new Date().toISOString() } : note,
    );
    setNotes(next);
    await saveLocal(next);
  };

  const deleteNote = async (id: string) => {
    const going = notes.find(note => note.id === id);
    const next = notes.filter(note => note.id !== id);
    setNotes(next);
    await saveLocal(next);
    // The pictures and files go with it. Nothing else references them, so
    // leaving them behind is storage the reader can never account for or
    // reclaim — and a forgotten video is a great deal of it.
    await removeNoteImages(going?.images ?? []);
    removeNoteFiles(going?.files);
  };

  /**
   * The notes filed against one chapter.
   *
   * Exported as a plain function so the chapter screen can use it without
   * mounting a second copy of the hook's state.
   */
  const notesForChapter = useCallback(
    (chapterKey: string) => notes.filter(note => note.chapterKey === chapterKey),
    [notes],
  );

  return { notes, loading, createNote, updateNote, deleteNote, notesForChapter, refetch: load };
}
