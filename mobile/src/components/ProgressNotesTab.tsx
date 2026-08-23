import React, { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { Text } from "@/components/Text";
import { Touchable } from "@/components/Touchable";
import { Dialog } from "@/components/Dialog";
import { useTheme } from "@/theme";
import { typeScale } from "@/theme/typography";
import { useUserNotes, type UserNote } from "@/hooks/useUserNotes";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react-native";

interface Props {
  userId: string | null;
}

export function ProgressNotesTab({ userId }: Props) {
  const { colors } = useTheme();
  const { notes, createNote, updateNote, deleteNote } = useUserNotes(userId);

  const [editing, setEditing] = useState<UserNote | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<UserNote | null>(null);

  const openEditor = (note?: UserNote) => {
    if (note) {
      setEditing(note);
      setEditTitle(note.title);
      setEditContent(note.content);
    } else {
      setEditing({ id: "new", title: "", content: "", created_at: "", updated_at: "" });
      setEditTitle("");
      setEditContent("");
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    if (editing.id === "new") {
      await createNote({
        title: editTitle.trim() || "Untitled Note",
        content: editContent.trim(),
      });
    } else {
      await updateNote(editing.id, {
        title: editTitle.trim() || "Untitled Note",
        content: editContent.trim(),
      });
    }
    setEditing(null);
  };

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

      {/* Notes List */}
      <View style={styles.notesList}>
        {notes.map(n => (
          <View
            key={n.id}
            style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.noteTop}>
              <View style={styles.noteTitleWrap}>
                <FileText size={16} color={colors.fuchsia} style={styles.noteIcon} />
                <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={1}>
                  {n.title || "Untitled Note"}
                </Text>
              </View>
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
              <Text style={[styles.noteContent, { color: colors.textMuted }]} numberOfLines={3}>
                {n.content}
              </Text>
            ) : (
              <Text style={[styles.noteEmpty, { color: colors.textMuted }]}>
                (Empty note)
              </Text>
            )}
          </View>
        ))}

        {notes.length === 0 && (
          <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.emptyBoxText, { color: colors.textMuted }]}>
              No personal notes saved yet. Tap "New Study Note" to create one.
            </Text>
          </View>
        )}
      </View>

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
