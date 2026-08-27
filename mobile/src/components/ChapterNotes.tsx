import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { FileText } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { useUserNotes } from '@/hooks/useUserNotes';
import { loadNoteImage } from '@/lib/noteImages';

/**
 * The reader's own notes for the chapter they are looking at.
 *
 * Filing a note under a chapter is only worth doing if the note then turns up
 * *there* — otherwise it is a label on a list nobody revisits. This is the
 * other half of that: open Pathology → Neoplasia and whatever you wrote about
 * neoplasia is underneath the generated note, in your own words.
 *
 * It renders nothing at all when there is nothing filed here. An empty "Your
 * notes" heading on nine chapters out of ten is chrome that teaches people to
 * stop reading the screen.
 */
export function ChapterNotes({ chapterKey }: { chapterKey: string }) {
  const { colors } = useTheme();
  const { notesForChapter } = useUserNotes();
  const mine = notesForChapter(chapterKey);

  if (mine.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, { color: colors.textMuted }]}>
        YOUR NOTES{mine.length > 1 ? ` · ${mine.length}` : ''}
      </Text>
      {mine.map(note => (
        <View
          key={note.id}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.top}>
            <View style={[styles.icon, { backgroundColor: withAlpha(colors.fuchsia, 0.15) }]}>
              <FileText size={14} color={colors.fuchsia} />
            </View>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {note.title || 'Untitled note'}
            </Text>
          </View>
          {note.content ? (
            <Text style={[styles.body, { color: colors.textMuted }]}>{note.content}</Text>
          ) : null}
          {(note.images ?? []).map(id => (
            <NoteImage key={id} id={id} />
          ))}
          {/* Videos, recordings and PDFs named rather than played: this block
              sits under a generated note as an annotation on it, and a video
              player mounted here would be the loudest thing on the chapter.
              The Notes tab is where they open. */}
          {(note.files ?? []).length > 0 ? (
            <Text style={[styles.body, { color: colors.textMuted }]}>
              {(note.files ?? []).map(file => file.name).join(' · ')}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

/** Read from the device when the chapter is open, not held for the whole list. */
function NoteImage({ id }: { id: string }) {
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loadNoteImage(id).then(found => {
      if (alive) {
        setUri(found);
      }
    });
    return () => {
      alive = false;
    };
  }, [id]);
  if (!uri) {
    return null;
  }
  return <Image source={{ uri }} style={styles.image} resizeMode="contain" />;
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 18,
    gap: 8,
  },
  heading: {
    ...typeScale.caption,
    fontWeight: '800',
    letterSpacing: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typeScale.bodyStrong,
    flex: 1,
  },
  body: {
    ...typeScale.footnote,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
});
