import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Keyboard, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Text } from "@/components/Text";
import { Touchable } from "@/components/Touchable";
import { Dialog } from "@/components/Dialog";
import { Sheet } from "@/components/Sheet";
import { useTheme } from "@/theme";
import { typeScale } from "@/theme/typography";
import { useUserNotes, type UserNote } from "@/hooks/useUserNotes";
import { ChevronDown, FileText, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react-native";
import { getSubjects, type YearKey } from "@/lib/questionBank";
import { attachNoteImage, removeNoteImage, signNoteImages, MAX_IMAGES_PER_NOTE } from "@/lib/noteImages";
import { withAlpha } from "@/theme";

/** The bucket a note with no subject falls into. */
const UNFILED = "Unfiled";

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
}: {
  note: UserNote | null;
  onClose: () => void;
  onEdit: (note: UserNote) => void;
}) {
  const { colors } = useTheme();
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    if (!note?.images?.length) {
      setUrls([]);
      return;
    }
    // The bucket is private, so these are signed and expire — fetched when the
    // note is opened rather than held for the life of the list.
    signNoteImages(note.images).then(signed => {
      if (alive) setUrls(signed);
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
          Could not load the pictures. They are still saved.
        </Text>
      ) : null}

      <Touchable
        onPress={() => onEdit(note)}
        label={`Edit ${note.title || "this note"}`}
        style={[styles.editorBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
        <Text style={{ color: colors.primaryText, fontWeight: "600" }}>Edit this note</Text>
      </Touchable>
    </Sheet>
  );
}

/** One attached picture, signed on demand because the bucket is private. */
function NoteThumb({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    signNoteImages([path]).then(([signed]) => {
      if (alive) setUrl(signed ?? null);
    });
    return () => {
      alive = false;
    };
  }, [path]);
  if (!url) return <View style={styles.thumb} />;
  return <Image source={{ uri: url }} style={styles.thumb} resizeMode="cover" />;
}

interface Props {
  userId: string | null;
  /** The reader's year, which decides which subjects are offered. */
  year: YearKey;
}

export function ProgressNotesTab({ userId, year }: Props) {
  const { colors } = useTheme();
  const { notes, createNote, updateNote, deleteNote } = useUserNotes(userId);

  const [editing, setEditing] = useState<UserNote | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editSubject, setEditSubject] = useState<string | null>(null);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [busyImage, setBusyImage] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserNote | null>(null);
  /** The note being read. Reading and editing are different things. */
  const [reading, setReading] = useState<UserNote | null>(null);
  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>({});

  const subjectOptions = useMemo(
    () => getSubjects(year).map(subject => subject.name),
    [year],
  );

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
      setEditImages(note.images ?? []);
    } else {
      setEditing({ id: "new", title: "", content: "", created_at: "", updated_at: "" });
      setEditTitle("");
      setEditContent("");
      setEditSubject(null);
      setEditImages([]);
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
      images: editImages,
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
   * Uploaded to the private `note-images` bucket under this user's own folder,
   * so it survives a reinstall and reaches their other devices. That needs a
   * signed-in uid — without one there is nowhere to put it that would still be
   * there tomorrow, and saying so beats a button that silently does nothing.
   */
  const addImage = useCallback(async () => {
    if (!userId) {
      setImageError("Sign in to add pictures — they are stored with your account.");
      return;
    }
    if (!editing) return;
    if (editImages.length >= MAX_IMAGES_PER_NOTE) {
      setImageError(`A note holds up to ${MAX_IMAGES_PER_NOTE} pictures.`);
      return;
    }
    setBusyImage(true);
    setImageError(null);
    try {
      const result = await attachNoteImage(userId, editing.id);
      if (result && "error" in result) {
        setImageError(result.error);
      } else if (result) {
        setEditImages(current => [...current, result.path]);
      }
    } finally {
      setBusyImage(false);
    }
  }, [editImages.length, editing, userId]);

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

                      {n.images && n.images.length > 0 ? (
                        <Text style={[styles.noteEmpty, { color: colors.textMuted }]}>
                          {n.images.length} picture{n.images.length === 1 ? "" : "s"}
                        </Text>
                      ) : null}
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
      />

      {/* Note Editor Card */}
      {editing ? (
        <View style={[styles.editorCard, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
          <Text style={[styles.editorTitle, { color: colors.text }]}>
            {editing.id === "new" ? "New Note" : "Edit Note"}
          </Text>
          <TextInput
            placeholder="Note title…"
            placeholderTextColor={colors.textMuted}
            value={editTitle}
            onChangeText={setEditTitle}
            style={[styles.editorInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          />
          {/* Which subject this belongs under. Horizontal because the list is
              long and a wrapped grid of twelve chips is taller than the
              editor it sits in. */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.subjectRow}>
            <Touchable
              onPress={() => setEditSubject(null)}
              label="File this note under no subject"
              state={{ selected: editSubject === null }}
              style={[
                styles.subjectChip,
                {
                  backgroundColor:
                    editSubject === null ? withAlpha(colors.fuchsia, 0.15) : colors.card,
                },
              ]}>
              <Text
                style={[
                  styles.subjectChipText,
                  { color: editSubject === null ? colors.fuchsia : colors.textMuted },
                ]}>
                Unfiled
              </Text>
            </Touchable>
            {subjectOptions.map(name => {
              const active = editSubject === name;
              return (
                <Touchable
                  key={name}
                  onPress={() => setEditSubject(name)}
                  label={`File this note under ${name}`}
                  state={{ selected: active }}
                  style={[
                    styles.subjectChip,
                    { backgroundColor: active ? withAlpha(colors.fuchsia, 0.15) : colors.card },
                  ]}>
                  <Text
                    style={[
                      styles.subjectChipText,
                      { color: active ? colors.fuchsia : colors.textMuted },
                    ]}>
                    {name}
                  </Text>
                </Touchable>
              );
            })}
          </ScrollView>

          <TextInput
            placeholder="Write your clinical / study notes here…"
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
          </View>

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
