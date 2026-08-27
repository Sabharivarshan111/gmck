import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';
import { onColor } from '@/theme/color';
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
 * The highlighter colours.
 *
 * Four, because that is what a pack of highlighters has and what anybody
 * actually uses to mark a page. They are fixed hexes rather than theme
 * colours: a highlight means "this bit", and a mark that changes hue when the
 * reader changes theme stops meaning anything. The ink on top is computed from
 * each one, so it stays legible without being hardcoded white or black.
 *
 * Arbitrary *text* colour is deliberately not offered. The app guarantees
 * contrast on every theme (`check:contrast`), and a free colour picker for
 * foreground text is exactly how that guarantee is lost — yellow text on the
 * light theme is unreadable and nothing would stop it. A highlight is safe
 * because both the background and the ink are ours.
 */
export const HIGHLIGHTS: Record<string, string> = {
  y: '#FDE68A',
  g: '#BBF7D0',
  b: '#BFDBFE',
  p: '#FBCFE8',
};

/**
 * The three faces a note may be written in.
 *
 * They are Android's own generic families, so nothing is bundled and the APK
 * does not grow: every Android device since forever resolves `serif` and
 * `monospace` to something real. A downloaded typeface would be hundreds of
 * kilobytes per weight for a preference, on phones chosen for being cheap.
 *
 * This is the one place the app's Roboto pin is relaxed, and only inside the
 * note's own body. The pin exists because OEM skins swap the *system* font and
 * would re-typeset the whole interface behind our back (`theme/typography.ts`);
 * naming a family here is the opposite — a deliberate choice, made by the
 * person writing the note, that cannot leak into the app's chrome.
 */
export const NOTE_FONTS: { key: string; name: string; family?: string }[] = [
  { key: 'default', name: 'Plain' },
  { key: 'serif', name: 'Serif', family: 'serif' },
  { key: 'mono', name: 'Mono', family: 'monospace' },
];

/** The family for a stored key, and `undefined` for the app's own face. */
export function noteFontFamily(key?: string | null): string | undefined {
  return NOTE_FONTS.find(font => font.key === key)?.family;
}

const INLINE = /(\*\*[^*]+\*\*|==(?:[ygbp]:)?[^=]+==|_[^_]+_)/g;

/**
 * `**bold**`, `_italic_` and `==highlight==` inside a line.
 *
 * The bold convention is the one `NotesContentView` already uses for the
 * generated notes, so a reader who has seen one has seen both. `==` for a
 * highlight is the convention every note app that has one uses.
 */
function Inline({ text, style }: { text: string; style: object }) {
  const parts = useMemo(() => text.split(INLINE).filter(Boolean), [text]);
  /*
   * The fast path is "there are no markers here", not "there is one piece".
   *
   * A line that is *entirely* one mark — `_Vi is the capsular one_`, or a
   * bullet that is nothing but a highlight — splits into exactly one piece,
   * and the old check read that as plain text and printed the underscores.
   * The lines most worth marking are the short ones, so this was wrong
   * precisely where the feature was being used.
   */
  if (!text.includes('**') && !text.includes('==') && !text.includes('_')) {
    return <Text style={style}>{text}</Text>;
  }
  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return (
            <Text key={index} style={styles.strong}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
          return (
            <Text key={index} style={styles.italic}>
              {part.slice(1, -1)}
            </Text>
          );
        }
        if (part.startsWith('==') && part.endsWith('==') && part.length > 4) {
          const inner = part.slice(2, -2);
          const keyed = inner.match(/^([ygbp]):(.*)$/);
          const tint = HIGHLIGHTS[keyed?.[1] ?? 'y'] ?? HIGHLIGHTS.y;
          return (
            <Text
              key={index}
              style={[styles.highlight, { backgroundColor: tint, color: onColor(tint) }]}>
              {keyed ? keyed[2] : inner}
            </Text>
          );
        }
        return part;
      })}
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
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/==(?:[ygbp]:)?([^=]+)==/g, '$1'),
    )
    .filter(line => line.length > 0)
    .join('  ');
}

export function NoteText({ content, font }: { content: string; font?: string | null }) {
  const { colors } = useTheme();
  const blocks = useMemo(() => parseNote(content), [content]);
  const family = noteFontFamily(font);
  // One object for the whole note rather than one per line: this renders every
  // block, and a fresh style object per block is a fresh style per re-render.
  const face = useMemo(() => (family ? { fontFamily: family } : null), [family]);

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
                face,
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
              <Inline text={block.text} style={[styles.body, { color: colors.text }, face]} />
            </View>
          );
        }
        return (
          <Inline
            key={index}
            text={block.text}
            style={[styles.body, { color: colors.text }, face]}
          />
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
  italic: {
    fontStyle: 'italic',
  },
  highlight: {
    /* A little air either side, so the mark reads as a swipe of pen. */
    paddingHorizontal: 3,
  },
  /* A blank line is a paragraph break, not an empty row of text. */
  gap: {
    height: 10,
  },
});
