import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Keyboard, Linking, StyleSheet, TextInput, View } from "react-native";
import { Text } from "@/components/Text";
import { Touchable } from "@/components/Touchable";
import { Dialog } from "@/components/Dialog";
import { Sheet } from "@/components/Sheet";
import { useTheme } from "@/theme";
import { NoteMediaPlayer } from "@/components/NoteMediaPlayer";
import { typeScale } from "@/theme/typography";
import { useUserNotes, type UserNote } from "@/hooks/useUserNotes";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  FileType,
  Film,
  ImagePlus,
  Music,
  HardDriveDownload,
  Link2,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react-native";
import { getSubjects, type BankNode, type YearKey } from "@/lib/questionBank";
import { flattenSubjectTopics } from "@/lib/handwrittenNotes";
import { attachNoteImage, loadNoteImage, removeNoteImage } from "@/lib/noteImages";
import {
  adoptNoteFile,
  attachNoteFile,
  formatBytes,
  kindOf,
  linkIsAlive,
  noteFilesAvailable,
  noteFileUri,
  removeNoteFile,
  type AttachMode,
  type NoteFile,
} from "@/lib/noteFiles";
import { withAlpha } from "@/theme";

/** The bucket a note with no subject falls into. */
const UNFILED = "Unfiled";

const KIND_LABEL: Record<string, string> = {
  image: "Picture",
  video: "Video",
  audio: "Recording",
  pdf: "PDF",
  file: "File",
};

/** One icon per kind, so a list of four attachments is scannable. */
function FileKindIcon({ file }: { file: NoteFile }) {
  const { colors } = useTheme();
  const kind = kindOf(file);
  if (kind === "video") return <Film size={16} color={colors.accent} />;
  if (kind === "audio") return <Music size={16} color={colors.accent} />;
  if (kind === "pdf") return <FileType size={16} color={colors.accent} />;
  if (kind === "image") return <ImagePlus size={16} color={colors.accent} />;
  return <Paperclip size={16} color={colors.accent} />;
}

/**
 * What a note carries, in one line, without opening anything.
 *
 * Counted by kind rather than totalled: "2 pictures · 1 video" tells the
 * reader which note has the lecture in it, and "3 attachments" does not.
 */
function attachmentSummary(note: UserNote): string {
  const parts: string[] = [];
  const pictures = note.images?.length ?? 0;
  if (pictures > 0) {
    parts.push(`${pictures} picture${pictures === 1 ? "" : "s"}`);
  }
  const counts = new Map<string, number>();
  for (const file of note.files ?? []) {
    const kind = kindOf(file);
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  for (const [kind, count] of counts) {
    const label = KIND_LABEL[kind] ?? "File";
    parts.push(`${count} ${count === 1 ? label.toLowerCase() : `${label.toLowerCase()}s`}`);
  }
  return parts.join(" · ");
}


/**
 * One attachment, rendered as the thing it is.
 *
 * A video plays in place, a recording plays in place, and a PDF hands off to
 * whatever the reader already uses to read PDFs — this app has no business
 * being a document viewer, and Android already has one.
 *
 * A missing file says so rather than showing a black rectangle. The reader can
 * clear the app's storage from Android's settings at any moment, so "gone" is
 * a state that happens rather than one being defended against.
 */
function NoteAttachment({
  file,
  onAdopted,
}: {
  file: NoteFile;
  /** A link that has just been copied in, so the note can store the new record. */
  onAdopted?: (was: NoteFile, now: NoteFile) => void;
}) {
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const uri = noteFileUri(file);
  const kind = kindOf(file);
  /*
   * Asked once, when the note is opened.
   *
   * A copy is ours and always there. A link is not: the reader can delete or
   * move the original from any file manager on the phone, and the note has to
   * say so rather than showing a player that does nothing.
   */
  const alive = useMemo(() => Boolean(uri) && linkIsAlive(file), [file, uri]);

  if (!uri || !alive) {
    return (
      <View style={[styles.fileRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <FileKindIcon file={file} />
        <View style={styles.flex}>
          <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
            {file.name}
          </Text>
          <Text style={[styles.noteEmpty, { color: colors.textMuted }]}>
            {file.linked
              ? "The original has been moved or deleted, so this link no longer works."
              : "No longer on this phone."}
          </Text>
        </View>
      </View>
    );
  }

  const linkFooter = file.linked ? (
    <Touchable
      onPress={async () => {
        setBusy(true);
        const result = await adoptNoteFile(file);
        setBusy(false);
        if ("file" in result && onAdopted) {
          onAdopted(file, result.file);
        }
      }}
      disabled={busy}
      label={`Keep a copy of ${file.name} inside Orbit, so deleting the original does not matter`}
      style={[styles.linkFooter, { borderColor: colors.border }]}>
      <HardDriveDownload size={13} color={colors.cyan} />
      <Text style={[styles.noteEmpty, { color: colors.cyan }]}>
        {busy ? "Copying…" : "Linked to the original · keep a copy in Orbit"}
      </Text>
    </Touchable>
  ) : null;

  if (kind === "video" || kind === "audio") {
    /*
      Paused until asked, in NoteMediaPlayer. Autoplay would start a lecture
      recording out loud the moment a note is opened, which is the app making
      a decision about the room the reader is in.
    */
    return (
      <View>
        <NoteMediaPlayer uri={uri} name={file.name} video={kind === "video"} />
        {linkFooter}
      </View>
    );
  }

  if (kind === "image") {
    return (
      <View>
        <Image source={{ uri }} style={styles.readerImage} resizeMode="contain" />
        {linkFooter}
      </View>
    );
  }

  return (
    <View>
    <Touchable
      onPress={() => {
        // Android's own document viewer. Rendering a PDF here would mean
        // another dependency to do a job every phone already does.
        Linking.openURL(uri).catch(() => {});
      }}
      label={`Open ${file.name}`}
      style={[styles.fileRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <FileKindIcon file={file} />
      <View style={styles.flex}>
        <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
          {file.name}
        </Text>
        <Text style={[styles.noteEmpty, { color: colors.textMuted }]}>
          {KIND_LABEL[kind]}
          {formatBytes(file.size) ? ` · ${formatBytes(file.size)}` : ""} · tap to open
        </Text>
      </View>
      <ChevronRight size={14} color={colors.textMuted} />
    </Touchable>
    {linkFooter}
    </View>
  );
}

/**
 * Reading a note, as opposed to editing one.
 *
 * The list only ever offered a pencil, so the only way to look at a note was to
 * open it for editing — which puts a cursor in it and makes an accidental
 * keystroke a silent edit. This shows the whole thing, pictures included, and
 * has to be asked before it will change anything.
 */
function NoteReader({
  note,
  onClose,
  onEdit,
  onFilesChanged,
}: {
  note: UserNote | null;
  onClose: () => void;
  onEdit: (note: UserNote) => void;
  /** A link that has just been copied in has to be written back to the note. */
  onFilesChanged: (note: UserNote, files: NoteFile[]) => void;
}) {
  const { colors } = useTheme();
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    if (!note?.images?.length) {
      setUrls([]);
      return;
    }
    // Read from the device when the note is opened, rather than holding every
    // picture in memory for the life of the list.
    Promise.all(note.images.map(id => loadNoteImage(id))).then(found => {
      if (alive) setUrls(found.filter((uri): uri is string => Boolean(uri)));
    });
    return () => {
      alive = false;
    };
  }, [note]);

  if (!note) return null;

  return (
    <Sheet visible onClose={onClose} title={note.title || "Untitled Note"}>
      {note.subject ? (
        <View style={[styles.subjectChip, { backgroundColor: withAlpha(colors.fuchsia, 0.15) }]}>
          <Text style={[styles.subjectChipText, { color: colors.fuchsia }]}>{note.subject}</Text>
        </View>
      ) : null}

      <Text style={[styles.readerBody, { color: colors.text }]}>
        {note.content || "This note is empty."}
      </Text>

      {urls.map(url => (
        <Image key={url} source={{ uri: url }} style={styles.readerImage} resizeMode="contain" />
      ))}
      {note.images && note.images.length > 0 && urls.length === 0 ? (
        <Text style={[styles.noteEmpty, { color: colors.textMuted }]}>
          The pictures for this note are no longer on this phone.
        </Text>
      ) : null}

      {(note.files ?? []).map(file => (
        <NoteAttachment
          key={file.id}
          file={file}
          onAdopted={(was, now) =>
            onFilesChanged(
              note,
              (note.files ?? []).map(item => (item.id === was.id ? now : item)),
            )
          }
        />
      ))}

      <Touchable
        onPress={() => onEdit(note)}
        label={`Edit ${note.title || "this note"}`}
        style={[styles.editorBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
        <Text style={{ color: colors.primaryText, fontWeight: "600" }}>Edit this note</Text>
      </Touchable>
    </Sheet>
  );
}

/** What a note is filed against. Absent means unfiled. */
interface Filing {
  subject: string;
  chapterKey: string | null;
  chapterName: string | null;
}

/**
 * Choosing the subject and chapter a note belongs to.
 *
 * Two steps in one sheet, the same walk the flashcard decks use — things that
 * look alike must behave alike, and filing is a detour from writing that nobody
 * takes twice if it costs three screens.
 *
 * "Not filed" comes first because it is the state a note starts in, and
 * "the whole subject" is offered before the chapter list because a note about
 * Pathology in general is a real thing and forcing a chapter would make people
 * pick a wrong one.
 */
function NoteFilingSheet({
  visible,
  year,
  onClose,
  onPick,
}: {
  visible: boolean;
  year: YearKey;
  onClose: () => void;
  onPick: (filing: Filing | null) => void;
}) {
  const { colors } = useTheme();
  const [subject, setSubject] = useState<{ key: string; name: string; node: BankNode } | null>(null);

  // Reopening starts at the top: landing inside a subject chosen last week is
  // disorientation dressed as a shortcut.
  useEffect(() => {
    if (visible) setSubject(null);
  }, [visible]);

  const subjects = useMemo(() => getSubjects(year), [year]);
  const chapters = useMemo(
    () => (subject ? flattenSubjectTopics(subject.key, subject.node) : []),
    [subject],
  );

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={subject ? subject.name : "File this note under"}
      headerRight={
        subject ? (
          <Touchable onPress={() => setSubject(null)} label="Back to subjects" style={styles.sheetBack}>
            <ChevronDown size={18} color={colors.accent} style={styles.chevronBack} />
          </Touchable>
        ) : undefined
      }>
      {!subject ? (
        <>
          <Touchable
            onPress={() => onPick(null)}
            label="Do not file this note under anything"
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.flex}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Not filed</Text>
              <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                Keep it in this list only
              </Text>
            </View>
          </Touchable>
          {subjects.map(item => (
            <Touchable
              key={item.key}
              onPress={() => setSubject({ key: item.key, name: item.name, node: item.node })}
              label={`${item.name}, choose a chapter`}
              style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.flex}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{item.name}</Text>
              </View>
              <ChevronDown size={16} color={colors.textMuted} style={styles.chevronClosed} />
            </Touchable>
          ))}
        </>
      ) : (
        <>
          <Touchable
            onPress={() => onPick({ subject: subject.name, chapterKey: null, chapterName: null })}
            label={`File under ${subject.name} as a whole, not one chapter`}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.flex}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>All of {subject.name}</Text>
              <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                Not about one chapter in particular
              </Text>
            </View>
          </Touchable>
          {chapters.map(chapter => (
            <Touchable
              key={chapter.key}
              onPress={() =>
                onPick({
                  subject: subject.name,
                  chapterKey: chapter.key,
                  chapterName: chapter.name,
                })
              }
              label={`File this note under ${chapter.name}`}
              style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.flex}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{chapter.name}</Text>
                <Text style={[styles.rowSub, { color: colors.textMuted }]} numberOfLines={1}>
                  {chapter.breadcrumb}
                </Text>
              </View>
            </Touchable>
          ))}
        </>
      )}
    </Sheet>
  );
}

/** One attached picture, signed on demand because the bucket is private. */
function NoteThumb({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loadNoteImage(path).then(found => {
      if (alive) setUrl(found);
    });
    return () => {
      alive = false;
    };
  }, [path]);
  if (!url) return <View style={styles.thumb} />;
  return <Image source={{ uri: url }} style={styles.thumb} resizeMode="cover" />;
}

interface Props {
  /** The reader's year, which decides which subjects are offered. */
  year: YearKey;
}

export function ProgressNotesTab({ year }: Props) {
  const { colors } = useTheme();
  const { notes, createNote, updateNote, deleteNote } = useUserNotes();

  const [editing, setEditing] = useState<UserNote | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editSubject, setEditSubject] = useState<string | null>(null);
  const [editChapterKey, setEditChapterKey] = useState<string | null>(null);
  const [editChapterName, setEditChapterName] = useState<string | null>(null);
  const [filingOpen, setFilingOpen] = useState(false);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editFiles, setEditFiles] = useState<NoteFile[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [busyImage, setBusyImage] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserNote | null>(null);
  /** The note being read. Reading and editing are different things. */
  const [reading, setReading] = useState<UserNote | null>(null);
  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>({});

  /**
   * Notes under their subject.
   *
   * A flat list is fine for five notes and useless for fifty, which is what a
   * year of them looks like. Unfiled sorts last: it is a to-do, not a subject.
   */
  const grouped = useMemo(() => {
    const buckets = new Map<string, UserNote[]>();
    for (const note of notes) {
      const key = note.subject?.trim() || UNFILED;
      const list = buckets.get(key);
      if (list) {
        list.push(note);
      } else {
        buckets.set(key, [note]);
      }
    }
    return [...buckets.entries()].sort(([a], [b]) => {
      if (a === UNFILED) return 1;
      if (b === UNFILED) return -1;
      return a.localeCompare(b);
    });
  }, [notes]);

  const openEditor = (note?: UserNote) => {
    setImageError(null);
    setReading(null);
    if (note) {
      setEditing(note);
      setEditTitle(note.title);
      setEditContent(note.content);
      setEditSubject(note.subject ?? null);
      setEditChapterKey(note.chapterKey ?? null);
      setEditChapterName(note.chapterName ?? null);
      setEditImages(note.images ?? []);
      setEditFiles(note.files ?? []);
    } else {
      setEditing({ id: "new", title: "", content: "", created_at: "", updated_at: "" });
      setEditTitle("");
      setEditContent("");
      setEditSubject(null);
      setEditChapterKey(null);
      setEditChapterName(null);
      setEditImages([]);
      setEditFiles([]);
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    // The Save button sits under a focused field; without this the first tap
    // is spent dismissing the keyboard. See .agents/rules/80-keyboard.md.
    Keyboard.dismiss();
    const patch = {
      title: editTitle.trim() || "Untitled Note",
      content: editContent.trim(),
      subject: editSubject,
      chapterKey: editChapterKey,
      chapterName: editChapterName,
      images: editImages,
      files: editFiles,
    };
    if (editing.id === "new") {
      await createNote(patch);
    } else {
      await updateNote(editing.id, patch);
    }
    setEditing(null);
  };

  /**
   * Attach a picture.
   *
   * Kept on this phone, like the note itself. No upload, no account, no server
   * copy — see `lib/noteImages`. The picture is stored under its own
   * AsyncStorage key and the note holds only its id.
   */
  const addImage = useCallback(async () => {
    // No cap: they are on this phone and cost nobody else anything.
    setBusyImage(true);
    setImageError(null);
    try {
      const result = await attachNoteImage();
      if (result && "error" in result) {
        setImageError(result.error);
      } else if (result) {
        setEditImages(current => [...current, result.id]);
      }
    } finally {
      setBusyImage(false);
    }
  }, []);

  /**
   * Attach a video, a recording or a PDF.
   *
   * The same promise as the pictures — this phone, no upload, no account — and
   * the same absence of a cap, for the same reason: it is the reader's own
   * storage and the size of their own lecture recording is not this app's
   * decision. See `lib/noteFiles` for why these are files on disk while the
   * pictures are rows in AsyncStorage.
   */
  const addFile = useCallback(async (mode: AttachMode) => {
    setAttachOpen(false);
    setBusyImage(true);
    setImageError(null);
    try {
      const result = await attachNoteFile(mode);
      if (result && "error" in result) {
        setImageError(result.error);
      } else if (result) {
        setEditFiles(current => [...current, result.file]);
      }
    } finally {
      setBusyImage(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Create Note Action */}
      <Touchable
        onPress={() => openEditor()}
        label="Create a new study note"
        scaleTo={0.98}
        style={[styles.createBtn, { backgroundColor: colors.primary }]}>
        <Plus size={18} color={colors.primaryText} />
        <Text style={[styles.createBtnText, { color: colors.primaryText }]}>New Study Note</Text>
      </Touchable>

      {/* Notes, under their subject */}
      <View style={styles.notesList}>
        {grouped.map(([subject, list]) => {
          // Collapsed by default only once there are enough groups for the
          // list to be the problem. One subject open is not a menu.
          const open = openSubjects[subject] ?? grouped.length <= 3;
          return (
            <View key={subject} style={styles.group}>
              <Touchable
                onPress={() =>
                  setOpenSubjects(current => ({ ...current, [subject]: !open }))
                }
                label={`${subject}, ${list.length} note${list.length === 1 ? "" : "s"}, ${
                  open ? "collapse" : "expand"
                }`}
                state={{ expanded: open }}
                scale={false}
                dim
                style={styles.groupHeader}>
                <ChevronDown
                  size={16}
                  color={colors.textMuted}
                  style={open ? undefined : styles.chevronClosed}
                />
                <Text style={[styles.groupName, { color: colors.text }]}>{subject}</Text>
                <Text style={[styles.groupCount, { color: colors.textMuted }]}>{list.length}</Text>
              </Touchable>

              {open
                ? list.map(n => (
                    <View
                      key={n.id}
                      style={[
                        styles.noteCard,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}>
                      <View style={styles.noteTop}>
                        {/* The title opens the note to *read*. Editing used to
                            be the only way in, so there was no way to look at a
                            note without being able to change it by accident. */}
                        <Touchable
                          onPress={() => setReading(n)}
                          label={`Read ${n.title || "note"}`}
                          scale={false}
                          dim
                          style={styles.noteTitleWrap}>
                          <FileText size={16} color={colors.fuchsia} style={styles.noteIcon} />
                          <Text
                            style={[styles.noteTitle, { color: colors.text }]}
                            numberOfLines={1}>
                            {n.title || "Untitled Note"}
                          </Text>
                        </Touchable>
                        <View style={styles.noteActions}>
                          <Touchable
                            onPress={() => openEditor(n)}
                            label={`Edit ${n.title || "note"}`}
                            scaleTo={0.85}
                            hitSlop={10}>
                            <Pencil size={16} color={colors.textMuted} />
                          </Touchable>
                          <Touchable
                            onPress={() => setDeleteTarget(n)}
                            label={`Delete ${n.title || "note"}`}
                            scaleTo={0.85}
                            hitSlop={10}>
                            <Trash2 size={16} color={colors.textMuted} />
                          </Touchable>
                        </View>
                      </View>

                      {/*
                        The body opens it too, and says so.

                        Tapping the title already read the note, but a title
                        looks like a title — next to a pencil and a bin, which
                        look like buttons, it read as a card with two actions
                        and no way in. The reader's own report was that there
                        was no button to view a note. So the preview is a
                        target as well, and the row underneath names what
                        happens rather than leaving it to be discovered.
                      */}
                      <Touchable
                        onPress={() => setReading(n)}
                        label={`Read ${n.title || "note"}`}
                        scale={false}
                        dim
                        style={styles.noteBody}>
                        {n.content ? (
                          <Text
                            style={[styles.noteContent, { color: colors.textMuted }]}
                            numberOfLines={3}>
                            {n.content}
                          </Text>
                        ) : (
                          <Text style={[styles.noteEmpty, { color: colors.textMuted }]}>
                            (Empty note)
                          </Text>
                        )}

                        {attachmentSummary(n) ? (
                          <Text style={[styles.noteEmpty, { color: colors.textMuted }]}>
                            {attachmentSummary(n)}
                          </Text>
                        ) : null}

                        <View style={styles.readRow}>
                          <BookOpen size={13} color={colors.fuchsia} />
                          <Text style={[styles.readHint, { color: colors.fuchsia }]}>
                            Read note
                          </Text>
                          <ChevronRight size={13} color={colors.fuchsia} />
                        </View>
                      </Touchable>
                    </View>
                  ))
                : null}
            </View>
          );
        })}

        {notes.length === 0 && (
          <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.emptyBoxText, { color: colors.textMuted }]}>
              No personal notes saved yet. Tap "New Study Note" to create one.
            </Text>
          </View>
        )}
      </View>

      <NoteReader
        note={reading}
        onClose={() => setReading(null)}
        onEdit={note => openEditor(note)}
        onFilesChanged={(note, files) => {
          // Persist, and keep the open sheet showing the new state rather than
          // the link it has just stopped being.
          updateNote(note.id, { files });
          setReading(current => (current ? { ...current, files } : current));
        }}
      />

      {/* Note Editor Card */}
      {editing ? (
        <View style={[styles.editorCard, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
          <Text style={[styles.editorTitle, { color: colors.text }]}>
            {editing.id === "new" ? "New Note" : "Edit Note"}
          </Text>
          <TextInput
            placeholder="Note title…"
            accessibilityLabel="Note title"
            placeholderTextColor={colors.textMuted}
            value={editTitle}
            onChangeText={setEditTitle}
            style={[styles.editorInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          />
          {/*
            Where this note belongs.

            One row rather than a scroller of chips: a subject alone is forty
            chapters, and a note about neoplasia that surfaces on all of them is
            noise rather than filing. The row states the current answer and
            opens the same year-subject-chapter walk the flashcard decks use —
            things that look alike should behave alike.
          */}
          <Touchable
            onPress={() => setFilingOpen(true)}
            label={
              editChapterName
                ? `Filed under ${editChapterName}. Change where this note belongs.`
                : editSubject
                  ? `Filed under ${editSubject}. Change where this note belongs.`
                  : "Not filed under a chapter. Choose one."
            }
            style={[styles.filingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: withAlpha(colors.fuchsia, 0.15) }]}>
              <FileText size={16} color={colors.fuchsia} />
            </View>
            <View style={styles.filingText}>
              <Text style={[styles.filingTitle, { color: colors.text }]} numberOfLines={1}>
                {editChapterName ?? editSubject ?? "Not filed"}
              </Text>
              <Text style={[styles.filingSub, { color: colors.textMuted }]} numberOfLines={1}>
                {editChapterName
                  ? `${editSubject} · shows on this chapter`
                  : editSubject
                    ? "Whole subject · tap to pick a chapter"
                    : "Tap to file it under a subject and chapter"}
              </Text>
            </View>
            <ChevronDown size={16} color={colors.textMuted} style={styles.chevronClosed} />
          </Touchable>

          {/*
        Two ways to attach, and the difference said before the choice.

        This is the whole feature: one of them costs space and survives the
        original being deleted, the other costs nothing and does not. Neither
        is the right default for everybody, and a reader who finds out which
        one they picked a month later, when the file stops playing, has been
        failed by the interface rather than by the storage.
      */}
      <Sheet
        visible={attachOpen}
        onClose={() => setAttachOpen(false)}
        title="How should Orbit keep it?">
        <Touchable
          onPress={() => addFile("copy")}
          label="Keep a copy inside Orbit. Uses space on this phone, and survives the original being deleted"
          style={[styles.modeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.modeIcon, { backgroundColor: withAlpha(colors.fuchsia, 0.15) }]}>
            <HardDriveDownload size={18} color={colors.fuchsia} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Keep a copy in Orbit</Text>
            <Text style={[styles.rowSub, { color: colors.textMuted }]}>
              The file is copied into this app. Delete, move or rename the original later and
              your note still plays it. Uses space on your phone — as much as the file is big.
            </Text>
          </View>
        </Touchable>

        <Touchable
          onPress={() => addFile("link")}
          label="Link to the original. Uses no space, and stops working if you delete or move the file"
          style={[styles.modeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.modeIcon, { backgroundColor: withAlpha(colors.cyan, 0.15) }]}>
            <Link2 size={18} color={colors.cyan} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Link to the original</Text>
            <Text style={[styles.rowSub, { color: colors.textMuted }]}>
              Nothing is copied, so this uses no extra space. It plays here from wherever the
              file already is — but if you delete or move it, this note can no longer play it.
              You can switch it to a copy at any time.
            </Text>
          </View>
        </Touchable>

        <Text style={[styles.note, { color: withAlpha(colors.text, 0.5) }]}>
          Either way nothing is uploaded. Both options keep the file on this phone and no
          copy of it ever leaves.
        </Text>
      </Sheet>

      <NoteFilingSheet
            visible={filingOpen}
            year={year}
            onClose={() => setFilingOpen(false)}
            onPick={picked => {
              setEditSubject(picked?.subject ?? null);
              setEditChapterKey(picked?.chapterKey ?? null);
              setEditChapterName(picked?.chapterName ?? null);
              setFilingOpen(false);
            }}
          />

          <TextInput
            placeholder="Write your clinical / study notes here…"
            accessibilityLabel="What the note says"
            placeholderTextColor={colors.textMuted}
            value={editContent}
            onChangeText={setEditContent}
            multiline
            numberOfLines={5}
            style={[
              styles.editorTextarea,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
            ]}
          />
          {editImages.length > 0 ? (
            <View style={styles.thumbRow}>
              {editImages.map(path => (
                <View key={path} style={styles.thumbWrap}>
                  <NoteThumb path={path} />
                  <Touchable
                    onPress={async () => {
                      setEditImages(current => current.filter(p => p !== path));
                      // Best effort: the row is the source of truth, and an
                      // orphaned object costs bytes rather than correctness.
                      await removeNoteImage(path);
                    }}
                    label="Remove this picture"
                    style={[
                      styles.thumbRemove,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}>
                    <X size={12} color={colors.danger} />
                  </Touchable>
                </View>
              ))}
            </View>
          ) : null}

          {/*
            What is already attached, and how big it is.

            The size is shown because there is no cap — the reader is the one
            deciding whether a 300 MB video belongs on a phone with 2 GB free,
            and they cannot decide that without the number.
          */}
          {editFiles.length > 0 ? (
            <View style={styles.fileList}>
              {editFiles.map(file => (
                <View
                  key={file.id}
                  style={[
                    styles.fileRow,
                    { backgroundColor: colors.cardElevated, borderColor: colors.border },
                  ]}>
                  <FileKindIcon file={file} />
                  <View style={styles.flex}>
                    <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <Text style={[styles.noteEmpty, { color: colors.textMuted }]}>
                      {KIND_LABEL[kindOf(file)]}
                      {formatBytes(file.size) ? ` · ${formatBytes(file.size)}` : ""}
                      {file.linked ? " · linked to the original" : " · kept in Orbit"}
                    </Text>
                  </View>
                  <Touchable
                    onPress={() => {
                      setEditFiles(current => current.filter(f => f.id !== file.id));
                      // The whole record, not the id: a linked file is the
                      // reader's own and detaching it gives up our permission
                      // to read it, never deletes it. See lib/noteFiles.
                      removeNoteFile(file);
                    }}
                    label={
                      file.linked
                        ? `Unlink ${file.name}, the original is not deleted`
                        : `Remove ${file.name} from this note`
                    }
                    scaleTo={0.85}
                    hitSlop={10}>
                    <X size={14} color={colors.danger} />
                  </Touchable>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.attachRow}>
            <Touchable
              onPress={addImage}
              disabled={busyImage}
              label="Add a picture to this note"
              style={[styles.attachBtn, { borderColor: colors.border }]}>
              <ImagePlus size={16} color={colors.accent} />
              <Text style={[styles.subjectChipText, { color: colors.accent }]}>
                {busyImage ? "Adding…" : "Add picture"}
              </Text>
            </Touchable>
            {/* Hidden rather than disabled where the module is absent, which is
                the preview harness: a control that cannot work is worse than
                one that is not offered. */}
            {noteFilesAvailable ? (
              <Touchable
                onPress={() => setAttachOpen(true)}
                disabled={busyImage}
                label="Add a video, recording or PDF to this note"
                style={[styles.attachBtn, { borderColor: colors.border }]}>
                <Paperclip size={16} color={colors.accent} />
                <Text style={[styles.subjectChipText, { color: colors.accent }]}>
                  {busyImage ? "Adding…" : "Add file"}
                </Text>
              </Touchable>
            ) : null}
          </View>
          {noteFilesAvailable ? (
            <Text style={[styles.noteEmpty, { color: colors.textMuted }]}>
              Video, audio or PDF. No size limit — it is kept on this phone, so the only
              limit is the space you have.
            </Text>
          ) : null}

          {imageError ? (
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.noteEmpty, { color: colors.danger }]}>
              {imageError}
            </Text>
          ) : null}

          <View style={styles.editorButtons}>
            <Touchable
              onPress={() => setEditing(null)}
              label="Cancel editing note"
              scaleTo={0.95}
              style={[styles.editorBtn, { borderColor: colors.border }]}>
              <Text style={{ color: colors.textMuted }}>Cancel</Text>
            </Touchable>
            <Touchable
              onPress={handleSave}
              label="Save note"
              scaleTo={0.95}
              style={[styles.editorBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <Text style={{ color: colors.primaryText, fontWeight: "600" }}>Save</Text>
            </Touchable>
          </View>
        </View>
      ) : null}

      {/* Delete Confirmation Dialog */}
      <Dialog
        visible={!!deleteTarget}
        title="Delete note?"
        message={`Are you sure you want to delete "${deleteTarget?.title || "this note"}"?`}
        onDismiss={() => setDeleteTarget(null)}
        actions={[
          { label: "Cancel", onPress: () => setDeleteTarget(null), tone: "secondary" },
          {
            label: "Delete",
            onPress: () => {
              if (deleteTarget) {
                deleteNote(deleteTarget.id);
                setDeleteTarget(null);
              }
            },
            tone: "danger",
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  createBtnText: {
    ...typeScale.bodyStrong,
  },
  group: {
    gap: 8,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  chevronBack: {
    transform: [{ rotate: "90deg" }],
  },
  sheetBack: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  rowSub: {
    ...typeScale.footnote,
  },
  flex: {
    flex: 1,
  },
  rowTitle: {
    ...typeScale.bodyStrong,
  },
  chevronClosed: {
    transform: [{ rotate: "-90deg" }],
  },
  groupName: {
    ...typeScale.bodyStrong,
    flex: 1,
  },
  groupCount: {
    ...typeScale.footnote,
  },
  subjectChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  subjectChipText: {
    ...typeScale.footnote,
    fontWeight: "700",
  },
  readerBody: {
    ...typeScale.body,
    marginBottom: 14,
  },
  readerImage: {
    width: "100%",
    height: 240,
    borderRadius: 12,
    marginBottom: 12,
  },
  thumbRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  thumbWrap: {
    position: "relative",
  },
  thumbRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  attachRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  filingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  filingText: {
    flex: 1,
  },
  filingTitle: {
    ...typeScale.bodyStrong,
  },
  filingSub: {
    ...typeScale.footnote,
  },
  subjectRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  notesList: {
    gap: 10,
  },
  noteCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 8,
  },
  noteTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  noteTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  noteIcon: {
    marginTop: 1,
  },
  noteTitle: {
    ...typeScale.title3,
    flex: 1,
  },
  noteActions: {
    flexDirection: "row",
    gap: 12,
  },
  linkFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  modeRow: {
    flexDirection: "row",
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  modeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  note: {
    ...typeScale.caption,
    lineHeight: 18,
  },
  fileList: {
    gap: 8,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fileName: {
    ...typeScale.footnote,
    fontWeight: "600",
  },
  noteBody: {
    gap: 4,
  },
  readRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  readHint: {
    ...typeScale.caption,
    fontWeight: "700",
  },
  noteContent: {
    ...typeScale.body,
  },
  noteEmpty: {
    ...typeScale.caption,
    fontStyle: "italic",
  },
  emptyBox: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBoxText: {
    ...typeScale.caption,
    textAlign: "center",
    fontStyle: "italic",
  },
  editorCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  editorTitle: {
    ...typeScale.title3,
  },
  editorInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    ...typeScale.body,
  },
  editorTextarea: {
    minHeight: 100,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
    ...typeScale.body,
  },
  editorButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
  editorBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
