import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { NotesContentView } from '@/components/NotesContentView';
import {
  fetchSingleQuestionNote,
  type NotesContent,
} from '@/lib/handwrittenNotes';
import { NotesAiEditBox } from '@/components/NotesAiEditBox';
import { getCleanQuestionText } from '@/lib/questionText';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { RotateCw, X } from 'lucide-react-native';

/**
 * The reader a third-year triple tap opens.
 *
 * This is the native half of the web app's `SingleQuestionNoteOverlay`. Third
 * year is Community Medicine and Forensic Medicine, and those are the subjects
 * `generate-handwritten-notes` grounds in a real textbook — so a triple tap
 * there is worth a proper note rather than a chat answer. The row has said
 * "Triple tap → handwritten note" since the port; until now it opened Ask AI,
 * which routes to `ask-gemini`, a function with no textbook and no diagram
 * pass. That is why third-year triple-tap notes had no pictures: they were
 * never handwritten notes.
 *
 * A full-screen Modal rather than a Sheet on purpose — a note is pages of
 * reading, and a sheet that has to be dragged open to full height first is in
 * the way of it.
 */
export function SingleQuestionNote({
  question,
  subjectKey,
  subjectName,
  yearLabel,
  onClose,
}: {
  /** Null closes the reader. Changing it starts a new note. */
  question: string | null;
  subjectKey: string;
  subjectName: string;
  yearLabel: string;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const [content, setContent] = useState<NotesContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Closing mid-generation must not land a result on a closed reader.
  const runId = useRef(0);

  const generate = useCallback(
    async (regenerate: boolean) => {
      if (!question) {
        return;
      }
      const run = ++runId.current;
      setLoading(true);
      setError(null);
      setContent(null);
      try {
        const next = await fetchSingleQuestionNote(
          { question, subjectKey, subjectName, yearLabel },
          regenerate,
        );
        if (runId.current === run) {
          setContent(next);
        }
      } catch (e) {
        if (runId.current === run) {
          setError((e as Error).message || "Couldn't generate the note.");
        }
      } finally {
        if (runId.current === run) {
          setLoading(false);
        }
      }
    },
    [question, subjectKey, subjectName, yearLabel],
  );

  useEffect(() => {
    if (question) {
      generate(false);
    } else {
      runId.current += 1;
      setContent(null);
      setError(null);
      setLoading(false);
    }
  }, [question, generate]);

  const close = useCallback(() => {
    runId.current += 1;
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={question !== null}
      animationType="slide"
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.flex}>
            <Text style={[styles.eyebrow, { color: colors.fuchsia }]}>
              HANDWRITTEN NOTE
            </Text>
            <Text
              numberOfLines={2}
              style={[typeScale.callout, { color: colors.text }]}
            >
              {question ? getCleanQuestionText(question) : ''}
            </Text>
          </View>
          <Touchable
            label="Write this note again"
            onPress={() => generate(true)}
            disabled={loading}
            style={styles.close}
            hitSlop={12}
          >
            <RotateCw
              size={20}
              color={loading ? colors.border : colors.textMuted}
            />
          </Touchable>
          <Touchable
            label="Close note"
            onPress={close}
            style={styles.close}
            hitSlop={12}
          >
            <X size={22} color={colors.textMuted} />
          </Touchable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {loading ? (
            <View style={styles.centre}>
              <ActivityIndicator color={colors.fuchsia} />
              <Text style={[styles.status, { color: colors.textMuted }]}>
                Writing the note from the textbook…
              </Text>
            </View>
          ) : null}

          {error ? (
            <View
              style={[
                styles.error,
                {
                  backgroundColor: withAlpha(colors.danger, 0.1),
                  borderColor: withAlpha(colors.danger, 0.4),
                },
              ]}
            >
              <Text style={[typeScale.footnote, { color: colors.text }]}>
                {error}
              </Text>
              <Touchable
                label="Try again"
                onPress={() => generate(false)}
                style={[styles.retry, { borderColor: colors.border }]}
              >
                <Text style={[typeScale.footnote, { color: colors.text }]}>
                  Try again
                </Text>
              </Touchable>
            </View>
          ) : null}

          {content ? <NotesContentView content={content} /> : null}

          {/* Below the note, not above it: the note is what was asked for, and
              the way to change it belongs after the thing being changed. */}
          {content && question ? (
            <NotesAiEditBox
              request={{ question, subjectKey, subjectName, yearLabel }}
              content={content}
              onApply={setContent}
            />
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  close: {
    paddingTop: 2,
  },
  body: {
    padding: 16,
    paddingBottom: 48,
  },
  centre: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 48,
  },
  status: {
    fontSize: 13,
  },
  error: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 10,
  },
  retry: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
});
