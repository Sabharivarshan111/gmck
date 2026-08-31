import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Bold,
  Eye,
  EyeOff,
  Heading1,
  Heading2,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Type,
} from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { HIGHLIGHTS, NOTE_FONTS, noteFontFamily } from '@/components/NoteText';
import { onColor } from '@/theme/color';
import { typeScale } from '@/theme/typography';

/**
 * Heading, subheading, bullets, numbers and bold, without having to know that
 * `#` means heading.
 *
 * The note editor is a plain text box, and it stays one — the note is stored
 * as the text that was typed, so nothing is trapped in a format and nothing is
 * lost if this file is deleted tomorrow. What was missing was the *way in*:
 * "type a hyphen and a space for a bullet" is a thing you have to be told, and
 * the reader's friend had a tablet app with a row of buttons and asked, quite
 * reasonably, why this did not.
 *
 * So the buttons write the markers for you, and `NoteText` renders them when
 * the note is read. Anyone who already types `-` gets the same result and
 * never needs the toolbar.
 */

/** The text and where the cursor is, which is all a line edit needs. */
export interface Selection {
  start: number;
  end: number;
}

/** The bounds of the line the cursor sits in. */
function lineAt(text: string, at: number): { start: number; end: number } {
  const start = text.lastIndexOf('\n', Math.max(0, at - 1)) + 1;
  const nextBreak = text.indexOf('\n', at);
  return { start, end: nextBreak === -1 ? text.length : nextBreak };
}

const PREFIX = /^(\s*)(#{1,6}\s+|[-*•+–—]\s+|\d{1,3}[.)\]:]\s+)?/;

/**
 * Put one marker on the cursor's line, or take it off again.
 *
 * Toggling matters more than it sounds: a button that only ever *adds* leaves
 * the reader deleting characters by hand to undo it, which is exactly the
 * fiddling the toolbar exists to avoid. Pressing bullet on a bullet removes
 * it; pressing it on a numbered line swaps one for the other rather than
 * stacking them.
 */
export function toggleLinePrefix(
  text: string,
  at: number,
  marker: string,
): { text: string; cursor: number } {
  const { start, end } = lineAt(text, at);
  const line = text.slice(start, end);
  const match = line.match(PREFIX);
  const indent = match?.[1] ?? '';
  const existing = match?.[2] ?? '';
  const rest = line.slice(indent.length + existing.length);

  const next = existing === marker ? `${indent}${rest}` : `${indent}${marker}${rest}`;
  return {
    text: text.slice(0, start) + next + text.slice(end),
    cursor: start + next.length,
  };
}

/**
 * Numbering continues from the line above, so a list counts up on its own.
 *
 * Every button that inserts "1." into a list that is already at four is a
 * button that has to be corrected by hand.
 */
export function nextNumber(text: string, at: number): string {
  const { start } = lineAt(text, at);
  const before = text.slice(0, start).split(/\r?\n/);
  for (let i = before.length - 1; i >= 0; i--) {
    const previous = before[i].match(/^\s*(\d{1,3})[.)\]:]\s+/);
    if (previous) {
      return `${Number(previous[1]) + 1}. `;
    }
    if (before[i].trim().length > 0) {
      break;
    }
  }
  return '1. ';
}

/**
 * Wrap the selection in a marker, or unwrap it if it is already wrapped.
 *
 * Shared by bold, italic and highlight: they differ only in the characters,
 * and three copies of this is three places for the unwrap case to be wrong.
 */
export function toggleWrap(
  text: string,
  selection: Selection,
  open: string,
  close: string = open,
): { text: string; cursor: number } {
  const { start, end } = selection;
  if (end <= start) {
    // Nothing selected: leave a pair with the cursor between them, ready to
    // type into. A button that does nothing on an empty selection reads as
    // broken.
    return {
      text: `${text.slice(0, start)}${open}${close}${text.slice(start)}`,
      cursor: start + open.length,
    };
  }
  const chosen = text.slice(start, end);
  if (
    chosen.startsWith(open) &&
    chosen.endsWith(close) &&
    chosen.length > open.length + close.length
  ) {
    const bare = chosen.slice(open.length, -close.length);
    return { text: text.slice(0, start) + bare + text.slice(end), cursor: start + bare.length };
  }
  return {
    text: `${text.slice(0, start)}${open}${chosen}${close}${text.slice(end)}`,
    cursor: end + open.length + close.length,
  };
}

const HIGHLIGHT_NAMES: Record<string, string> = {
  y: 'Yellow',
  g: 'Green',
  b: 'Blue',
  p: 'Pink',
};

export function NoteToolbar({
  value,
  selection,
  onChange,
  font,
  onFont,
  onTogglePreview,
  isPreview,
}: {
  value: string;
  selection: Selection;
  /** New text, and where the cursor should land in it. */
  onChange: (text: string, cursor: number) => void;
  /** The face this note is written in — see `NOTE_FONTS`. */
  font?: string | null;
  onFont: (key: string) => void;
  /** Toggle live preview mode */
  onTogglePreview?: () => void;
  isPreview?: boolean;
}) {
  const { colors } = useTheme();
  /*
   * The colours are behind the highlighter, not beside it.
   *
   * Four more buttons permanently on the row would be four more things to look
   * past every time a note is written, for a choice most people make once. The
   * pen opens them; picking one highlights and closes them again.
   */
  const [palette, setPalette] = useState(false);
  /* Same reasoning, same pattern: three more permanent buttons for a choice
     made once a note would crowd out the ones used on every line. */
  const [faces, setFaces] = useState(false);

  const apply = (marker: string) => {
    const result = toggleLinePrefix(value, selection.start, marker);
    onChange(result.text, result.cursor);
  };

  const buttons: { key: string; label: string; hint: string; icon: React.ReactNode; run: () => void; active?: boolean }[] =
    [
      {
        key: 'h1',
        label: 'Heading',
        hint: 'Makes this line a heading',
        icon: <Heading1 size={18} color={colors.text} />,
        run: () => apply('# '),
      },
      {
        key: 'h2',
        label: 'Subheading',
        hint: 'Makes this line a subheading',
        icon: <Heading2 size={18} color={colors.text} />,
        run: () => apply('## '),
      },
      {
        key: 'bullet',
        label: 'Bullet point',
        hint: 'Turns this line into a bullet',
        icon: <List size={18} color={colors.text} />,
        run: () => apply('- '),
      },
      {
        key: 'number',
        label: 'Numbered point',
        hint: 'Turns this line into a numbered point',
        icon: <ListOrdered size={18} color={colors.text} />,
        run: () => apply(nextNumber(value, selection.start)),
      },
      {
        key: 'bold',
        label: 'Bold',
        hint: 'Makes the selected words bold',
        icon: <Bold size={18} color={colors.text} />,
        run: () => {
          const result = toggleWrap(value, selection, '**');
          onChange(result.text, result.cursor);
        },
      },
      {
        key: 'italic',
        label: 'Italic',
        hint: 'Slants the selected words',
        icon: <Italic size={18} color={colors.text} />,
        run: () => {
          const result = toggleWrap(value, selection, '_');
          onChange(result.text, result.cursor);
        },
      },
      {
        key: 'highlight',
        label: 'Highlight',
        hint: 'Marks the selected words, and offers four colours',
        icon: <Highlighter size={18} color={colors.text} />,
        run: () => {
          setFaces(false);
          setPalette(open => !open);
        },
      },
      {
        key: 'font',
        label: 'Typeface',
        hint: 'Writes this note in a different face',
        icon: <Type size={18} color={colors.text} />,
        run: () => {
          setPalette(false);
          setFaces(open => !open);
        },
      },
    ];

  if (onTogglePreview) {
    buttons.push({
      key: 'preview',
      label: isPreview ? 'Edit mode' : 'Live preview',
      hint: isPreview ? 'Switch back to editing' : 'See live formatted preview of your note',
      icon: isPreview ? <EyeOff size={18} color={colors.fuchsia} /> : <Eye size={18} color={colors.fuchsia} />,
      active: isPreview,
      run: onTogglePreview,
    });
  }

  const highlight = (key: string) => {
    const result = toggleWrap(value, selection, key === 'y' ? '==' : `==${key}:`, '==');
    onChange(result.text, result.cursor);
    setPalette(false);
  };

  return (
    <View style={styles.column}>
    <View style={styles.wrap}>
      {buttons.map(button => (
        <Touchable
          key={button.key}
          onPress={button.run}
          label={button.label}
          hint={button.hint}
          scaleTo={0.88}
          hitSlop={6}
          style={[
            styles.button,
            { backgroundColor: colors.cardElevated, borderColor: colors.border },
          ]}>
          {button.icon}
        </Touchable>
      ))}
    </View>
    {faces ? (
      <View style={styles.wrap}>
        {NOTE_FONTS.map(face => {
          const chosen = (font ?? 'default') === face.key;
          return (
            <Touchable
              key={face.key}
              onPress={() => {
                onFont(face.key);
                setFaces(false);
              }}
              label={`${face.name} typeface`}
              state={{ selected: chosen }}
              scaleTo={0.92}
              style={[
                styles.face,
                {
                  backgroundColor: chosen ? colors.accent : colors.cardElevated,
                  borderColor: colors.border,
                },
              ]}>
              <Text
                style={{
                  fontFamily: noteFontFamily(face.key),
                  color: chosen ? onColor(colors.accent) : colors.text,
                  fontWeight: '600',
                }}>
                {face.name}
              </Text>
            </Touchable>
          );
        })}
      </View>
    ) : null}
    {palette ? (
      <View style={styles.wrap}>
        {Object.entries(HIGHLIGHTS).map(([key, tint]) => (
          <Touchable
            key={key}
            onPress={() => highlight(key)}
            label={`${HIGHLIGHT_NAMES[key]} highlight`}
            scaleTo={0.88}
            style={[styles.swatch, { backgroundColor: tint }]}>
            <Highlighter size={15} color={onColor(tint)} />
          </Touchable>
        ))}
        <View style={styles.grow} />
        <Text style={[styles.hint, { color: withAlpha(colors.text, 0.45) }]}>
          Select words first
        </Text>
      </View>
    ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    gap: 8,
  },
  face: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 40,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    /* Eight buttons have to fit the narrowest phone this ships to without a
       ninth pushing one off the edge — so they wrap rather than clip, and the
       gap is tuned so the row is one line at 360dp. */
    flexWrap: 'wrap',
    gap: 6,
  },
  button: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: {
    flex: 1,
  },
  hint: {
    ...typeScale.caption,
  },
});
