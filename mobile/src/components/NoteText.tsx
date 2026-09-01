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
    /*
     * "- item", "• item", "+ item", "– item", "— item", and "* item".
     *
     * **The asterisk is the awkward one and it needs its own rule.** It starts
     * a bullet and it also starts `*italic*` and `**bold**`, and this used to
     * be one lenient pattern — `^[-*•+–—]\s*(.*)$` — which made *every* line
     * beginning with an asterisk a bullet. So pressing Bold at the start of a
     * line produced `**word**`, which came back as a bullet whose text was
     * `*word**`, and the reader saw a bullet point with asterisks in it and no
     * bold anywhere. The Bold button could not work on a line that began with
     * it, which is most of the lines anybody presses it on.
     *
     * Markdown's own answer is the fix: a `*` bullet requires a space after
     * it. `* item` is a list; `*italic*` and `**bold**` are not. The other
     * markers stay lenient because none of them mean anything else, and people
     * do type "-item" without the space.
     */
    const bullet = line.match(/^[-•+–—]\s*(.*)$/) || line.match(/^\*[^\S\n](\s*.*)$/);
    if (bullet && bullet[1].trim().length > 0) {
      return { kind: 'bullet', text: bullet[1].trim() };
    }
    // "1. item", "2) item", "3: item"
    const numbered = line.match(/^(\d{1,3})[.)\]:]\s*(.*)$/);
    if (numbered && numbered[2].length > 0) {
      return { kind: 'number', marker: `${numbered[1]}.`, text: numbered[2] };
    }
    // "# Heading", "## Subheading", "### Subheading", or "#Heading"
    const hash = line.match(/^(#{1,6})\s*(.*)$/);
    if (hash && hash[2].length > 0) {
      const cleanHeading = hash[2].replace(/\s*#+\s*$/, '');
      return { kind: 'heading', text: cleanHeading, level: hash[1].length === 1 ? 1 : 2 };
    }
    /*
     * A line that is entirely bold used to become a subheading, on the guess
     * that somebody typing `**Title**` on its own meant a heading. That guess
     * predates the toolbar. Now there are H1 and H2 buttons, and the guess
     * actively fights the Bold button next to them: select a word, press
     * Bold, and the line would come back a different size with a margin above
     * it — which is not what the button says it does. Bold makes bold; the
     * heading buttons make headings.
     */
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

interface InlineStyle {
  bold?: boolean;
  italic?: boolean;
  highlight?: string;
  strike?: boolean;
}

export interface InlineToken extends InlineStyle {
  text: string;
}

/**
 * Tokenize inline formatting including bold, italic, highlights, and combinations.
 */
export function parseInlineTokens(text: string, currentStyle: InlineStyle = {}): InlineToken[] {
  if (!text) return [];

  // Match delimiter patterns: highlight, bold, strikethrough, italic
  const highlightMatch = text.match(/==(?:([ygbp]):)?([^=\n]+?)==/) || text.match(/<mark(?: class="([ygbp])")?>([^<]+?)<\/mark>/i);
  const boldMatch = text.match(/(?:\*\*([^*]+?)\*\*|__([^_]+?)__|<b>([^<]+?)<\/b>|<strong>([^<]+?)<\/strong>)/i);
  const strikeMatch = text.match(/(?:~~([^~]+?)~~|<del>([^<]+?)<\/del>|<s>([^<]+?)<\/s>)/i);
  /*
   * `\s`, not `\\s`. In a regex *literal* the second is an escaped backslash
   * followed by a literal `s`, so the underscore form's character class read
   * "not an underscore, not a backslash, and not the letter s" — and with the
   * `i` flag, not `S` either. `_Part of LPS_` therefore never matched, and the
   * reader printed the underscores. A word ending in s is not a rare shape.
   */
  const italicMatch = text.match(/(?:^|[^*_])(?:\*([^*\s](?:[^*]*?[^*\s])?)\*|_([^_\s](?:[^_]*?[^_\s])?)_|<i>([^<]+?)<\/i>|<em>([^<]+?)<\/em>)/i);

  // Find the earliest matching token
  let earliest: {
    index: number;
    length: number;
    inner: string;
    style: InlineStyle;
  } | null = null;

  if (highlightMatch && highlightMatch.index !== undefined) {
    earliest = {
      index: highlightMatch.index,
      length: highlightMatch[0].length,
      inner: highlightMatch[2] || highlightMatch[1] || '',
      style: { ...currentStyle, highlight: highlightMatch[1] || 'y' },
    };
  }

  if (boldMatch && boldMatch.index !== undefined) {
    if (!earliest || boldMatch.index < earliest.index) {
      earliest = {
        index: boldMatch.index,
        length: boldMatch[0].length,
        inner: boldMatch[1] || boldMatch[2] || boldMatch[3] || boldMatch[4] || '',
        style: { ...currentStyle, bold: true },
      };
    }
  }

  if (strikeMatch && strikeMatch.index !== undefined) {
    if (!earliest || strikeMatch.index < earliest.index) {
      earliest = {
        index: strikeMatch.index,
        length: strikeMatch[0].length,
        inner: strikeMatch[1] || strikeMatch[2] || strikeMatch[3] || '',
        style: { ...currentStyle, strike: true },
      };
    }
  }

  if (italicMatch && italicMatch.index !== undefined) {
    const matchStr = italicMatch[0];
    const offset = matchStr.startsWith('*') || matchStr.startsWith('_') || matchStr.startsWith('<') ? 0 : 1;
    const actualIndex = italicMatch.index + offset;
    const actualLength = matchStr.length - offset;
    if (!earliest || actualIndex < earliest.index) {
      earliest = {
        index: actualIndex,
        length: actualLength,
        inner: italicMatch[1] || italicMatch[2] || italicMatch[3] || italicMatch[4] || '',
        style: { ...currentStyle, italic: true },
      };
    }
  }

  if (!earliest) {
    return [{ text, ...currentStyle }];
  }

  const before = text.slice(0, earliest.index);
  const after = text.slice(earliest.index + earliest.length);

  const tokens: InlineToken[] = [];
  if (before) {
    tokens.push(...parseInlineTokens(before, currentStyle));
  }
  tokens.push(...parseInlineTokens(earliest.inner, earliest.style));
  if (after) {
    tokens.push(...parseInlineTokens(after, currentStyle));
  }

  return tokens;
}

/**
 * `**bold**`, `_italic_`, `*italic*` and `==highlight==` inside any note line.
 */
function Inline({ text, style }: { text: string; style: object }) {
  const tokens = useMemo(() => parseInlineTokens(text), [text]);

  if (
    tokens.length === 1 &&
    !tokens[0].bold &&
    !tokens[0].italic &&
    !tokens[0].highlight &&
    !tokens[0].strike
  ) {
    return <Text style={style}>{text}</Text>;
  }

  return (
    <Text style={style}>
      {tokens.map((token, index) => {
        const tokenStyles: any[] = [];
        if (token.bold) {
          tokenStyles.push(styles.strong);
        }
        if (token.italic) {
          tokenStyles.push(styles.italic);
        }
        if (token.strike) {
          tokenStyles.push(styles.strike);
        }
        if (token.highlight) {
          const tint = HIGHLIGHTS[token.highlight] ?? HIGHLIGHTS.y;
          tokenStyles.push([
            styles.highlight,
            { backgroundColor: tint, color: onColor(tint) },
          ]);
        }
        if (tokenStyles.length === 0) {
          return token.text;
        }
        return (
          <Text key={index} style={tokenStyles}>
            {token.text}
          </Text>
        );
      })}
    </Text>
  );
}

/**
 * The note as one line of plain prose, for a card's three-line preview.
 */
export function plainPreview(content: string): string {
  return content
    .split(/\r?\n/)
    .map(line =>
      line
        .trim()
        .replace(/^#{1,3}\s+/, '')
        .replace(/^[-*•]\s+/, '• ')
        .replace(/^\d{1,3}[.)]\s+/, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/==(?:[ygbp]:)?([^=]+)==/g, '$1')
        .replace(/~~([^~]+)~~/g, '$1'),
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
            <Inline
              key={index}
              text={block.text}
              style={[
                block.level === 1 ? styles.heading : styles.subheading,
                { color: colors.text },
                face,
              ]}
            />
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
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
  },
  subheading: {
    ...typeScale.bodyStrong,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
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
  strike: {
    textDecorationLine: 'line-through',
  },
  highlight: {
    /* A little air either side, so the mark reads as a swipe of pen. */
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  /* A blank line is a paragraph break, not an empty row of text. */
  gap: {
    height: 10,
  },
});
