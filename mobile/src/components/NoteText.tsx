import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';
import { typeScale } from '@/theme/typography';

/**
 * A study note, rendered the way it was typed.
 *
 * Notes are written in a plain text box, and people write lists in them —
 * "1." for a numbered point, "-" or "*" for a bullet — because that is what
 * everyone does in every text field. Printing those characters back verbatim
 * is technically faithful and reads like a log file. This turns them into
 * actual lists when the note is *read*, while leaving the typed text exactly
 * as typed, so nothing is lost and nothing has to be un-learned.
 *
 * Deliberately not a markdown engine. A note is not a document: what people
 * type is bullets, numbers, the odd heading and the odd emphasis, and a full
 * parser would bring link syntax, tables, code fences and a dependency to
 * handle text nobody writes. Five shapes, no library.
 */

export type NoteBlock =
  | { kind: 'bullet'; text: string }
  | { kind: 'number'; marker: string; text: string }
  | { kind: 'heading'; text: string; level: 1 | 2 }
  | { kind: 'blank' }
  | { kind: 'text'; text: string };

/**
 * One line, one block.
 *
 * Line-based rather than paragraph-based because a note is typed with the
 * return key: joining wrapped lines would fight the way it was written.
 */
export function parseNote(content: string): NoteBlock[] {
  return content.split(/\r?\n/).map<NoteBlock>(raw => {
    const line = raw.trim();
    if (line.length === 0) {
      return { kind: 'blank' };
    }
    // "- item", "* item", "• item"
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (bullet) {
      return { kind: 'bullet', text: bullet[1] };
    }
    // "1. item", "2) item"
    const numbered = line.match(/^(\d{1,3})[.)]\s+(.*)$/);
    if (numbered) {
      return { kind: 'number', marker: `${numbered[1]}.`, text: numbered[2] };
    }
    // "# Heading" — and a line that is entirely bold, which is how people
    // write a heading when they are not thinking about markdown.
    const hash = line.match(/^(#{1,3})\s+(.*)$/);
    if (hash) {
      // One hash is the section, two or three are what sits under it. Deeper
      // than that is an outline, and an outline is not a study note.
      return { kind: 'heading', text: hash[2], level: hash[1].length === 1 ? 1 : 2 };
    }
    const wrapped = line.match(/^\*\*(.+)\*\*$/);
    if (wrapped) {
      return { kind: 'heading', text: wrapped[1], level: 2 };
    }
    return { kind: 'text', text: line };
  });
}

/**
 * `**bold**` inside a line becomes bold, and the asterisks go.
 *
 * The same convention `NotesContentView` already uses for the generated
 * notes, so a reader who has seen one has seen both.
 */
function Inline({ text, style }: { text: string; style: object }) {
  const parts = useMemo(() => text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean), [text]);
  if (parts.length === 1) {
    return <Text style={style}>{text}</Text>;
  }
  return (
    <Text style={style}>
      {parts.map((part, index) =>
        part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
          <Text key={index} style={styles.strong}>
            {part.slice(2, -2)}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

/**
 * The note as one line of plain prose, for a card's three-line preview.
 *
 * A preview is too small to render structure, and showing "# Antigens of S.
 * Typhi" there would put the punctuation back in the one place the reader
 * cannot expand it away.
 */
export function plainPreview(content: string): string {
  return content
    .split(/\r?\n/)
    .map(line =>
      line
        .trim()
        .replace(/^#{1,3}\s+/, '')
        .replace(/^[-*•]\s+/, '• ')
        .replace(/\*\*([^*]+)\*\*/g, '$1'),
    )
    .filter(line => line.length > 0)
    .join('  ');
}

export function NoteText({ content }: { content: string }) {
  const { colors } = useTheme();
  const blocks = useMemo(() => parseNote(content), [content]);

  return (
    <View>
      {blocks.map((block, index) => {
        if (block.kind === 'blank') {
          return <View key={index} style={styles.gap} />;
        }
        if (block.kind === 'heading') {
          return (
            <Text
              key={index}
              style={[
                block.level === 1 ? styles.heading : styles.subheading,
                { color: colors.text },
              ]}>
              {block.text}
            </Text>
          );
        }
        if (block.kind === 'bullet' || block.kind === 'number') {
          return (
            <View key={index} style={styles.row}>
              <Text
                style={[
                  styles.marker,
                  // A bullet is one glyph; a number can be three. Sharing one
                  // width pushed bullet text a finger's width off the margin.
                  block.kind === 'bullet' ? styles.bulletMarker : styles.numberMarker,
                  { color: block.kind === 'bullet' ? colors.fuchsia : colors.textMuted },
                ]}>
                {block.kind === 'bullet' ? '•' : block.marker}
              </Text>
              <Inline text={block.text} style={[styles.body, { color: colors.text }]} />
            </View>
          );
        }
        return (
          <Inline key={index} text={block.text} style={[styles.body, { color: colors.text }]} />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    ...typeScale.body,
    flex: 1,
  },
  heading: {
    ...typeScale.title3,
    marginTop: 16,
    marginBottom: 4,
  },
  subheading: {
    ...typeScale.bodyStrong,
    marginTop: 12,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 3,
  },
  marker: {
    ...typeScale.body,
    fontWeight: '700',
  },
  bulletMarker: {
    width: 14,
  },
  /* Wide enough for "10." so every item's text lines up under itself. */
  numberMarker: {
    minWidth: 24,
  },
  strong: {
    fontWeight: '700',
  },
  /* A blank line is a paragraph break, not an empty row of text. */
  gap: {
    height: 10,
  },
});
