import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Bold, Heading1, Heading2, List, ListOrdered } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
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

const PREFIX = /^(\s*)(#{1,3}\s+|[-*•]\s+|\d{1,3}[.)]\s+)?/;

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
    const previous = before[i].match(/^\s*(\d{1,3})[.)]\s+/);
    if (previous) {
      return `${Number(previous[1]) + 1}. `;
    }
    if (before[i].trim().length > 0) {
      break;
    }
  }
  return '1. ';
}

/** Wrap the selection in `**`, or unwrap it if it is already wrapped. */
export function toggleBold(
  text: string,
  selection: Selection,
): { text: string; cursor: number } {
  const { start, end } = selection;
  if (end <= start) {
    // Nothing selected: leave a pair with the cursor between them, ready to
    // type into. A button that does nothing on an empty selection reads as
    // broken.
    return { text: `${text.slice(0, start)}****${text.slice(start)}`, cursor: start + 2 };
  }
  const chosen = text.slice(start, end);
  if (chosen.startsWith('**') && chosen.endsWith('**') && chosen.length > 4) {
    const bare = chosen.slice(2, -2);
    return { text: text.slice(0, start) + bare + text.slice(end), cursor: start + bare.length };
  }
  return {
    text: `${text.slice(0, start)}**${chosen}**${text.slice(end)}`,
    cursor: end + 4,
  };
}

export function NoteToolbar({
  value,
  selection,
  onChange,
}: {
  value: string;
  selection: Selection;
  /** New text, and where the cursor should land in it. */
  onChange: (text: string, cursor: number) => void;
}) {
  const { colors } = useTheme();

  const apply = (marker: string) => {
    const result = toggleLinePrefix(value, selection.start, marker);
    onChange(result.text, result.cursor);
  };

  const buttons: { key: string; label: string; hint: string; icon: React.ReactNode; run: () => void }[] =
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
          const result = toggleBold(value, selection);
          onChange(result.text, result.cursor);
        },
      },
    ];

  return (
    <View style={styles.wrap}>
      {buttons.map(button => (
        <Touchable
          key={button.key}
          onPress={button.run}
          label={button.label}
          hint={button.hint}
          scaleTo={0.88}
          style={[
            styles.button,
            { backgroundColor: colors.cardElevated, borderColor: colors.border },
          ]}>
          {button.icon}
        </Touchable>
      ))}
      <View style={styles.grow} />
      <Text style={[styles.hint, { color: withAlpha(colors.text, 0.45) }]}>
        Formats as you read
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    width: 40,
    height: 40,
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
