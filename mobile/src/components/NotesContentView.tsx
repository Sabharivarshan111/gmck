import React, { memo } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { Text } from '@/components/Text';
import { useTheme, withAlpha } from '@/theme';
import { DiagramCard } from '@/components/DiagramCard';
import type { NotesContent, Section } from '@/lib/handwrittenNotes';

/**
 * Renders the section vocabulary the notes edge function emits — the same ten
 * shapes handled by src/components/handwritten/HandwrittenNotesView.tsx.
 *
 * Memoized because the Notes screen re-renders on a timer while it generates.
 *
 * A big topic arrives in batches with a 25-second pace between them, and the
 * countdown ticks the screen's state throughout. `content` does not change
 * during those ticks, but without memo the whole section tree — tables,
 * flowcharts, every bullet — was rebuilt on each one. That is the most
 * expensive thing on screen re-rendering repeatedly on the cheap phones this
 * app targets, for a number that changes in a label above it.
 */
function NotesContentViewBase({ content }: { content: NotesContent }) {
  const { colors } = useTheme();

  return (
    <View style={styles.root}>
      {content.highYieldTip ? (
        <View
          style={[
            styles.tip,
            {
              backgroundColor: withAlpha(colors.warning, 0.1),
              borderColor: withAlpha(colors.warning, 0.4),
            },
          ]}>
          <Text style={[styles.tipLabel, { color: colors.warning }]}>HIGH-YIELD</Text>
          <RichText text={content.highYieldTip} style={[styles.tipText, { color: colors.text }]} />
        </View>
      ) : null}

      {content.pyqYears && content.pyqYears.length > 0 ? (
        <View style={styles.pyqRow}>
          {content.pyqYears.map(year => (
            <View
              key={year}
              style={[styles.pyqBadge, { borderColor: withAlpha(colors.fuchsia, 0.5) }]}>
              <Text style={[styles.pyqText, { color: colors.fuchsia }]}>{year}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {content.sections.map((section, index) => (
        <SectionBlock key={`${section.title}-${index}`} section={section} />
      ))}
    </View>
  );
}

/**
 * `**bold**` in the model's output, rendered as a highlight.
 *
 * The notes function emits Markdown emphasis inside otherwise plain strings,
 * and the web app has always turned it into a marker-pen highlight. The native
 * port printed the asterisks — so the one word in a sentence the model marked
 * as the examinable one arrived looking like a typo.
 *
 * React Native nests Text, so this needs no library: split on the pairs and
 * give the inner ones a background.
 */
/**
 * Markdown images in note prose, anywhere they appear.
 *
 * The notes function embeds diagrams as `![alt](url)` pointing at the
 * `diagrams` Supabase bucket, and it does not restrict itself to one place —
 * a definition, a paragraph, a bullet's description, a step. Handling it per
 * section type meant the two types that were special-cased rendered the
 * picture and every other one printed the raw markdown at the reader, which
 * is what a shotgun-cartridge definition looked like on a phone:
 *
 *     ![Parts of a 12-Gauge Shotgun Cartridge](https://…supabase.co/storage/…
 *
 * So it lives here instead, in the single function every piece of prose in a
 * note already flows through. Text runs keep their `**bold**` highlighting;
 * image runs become a DiagramCard; and both keep their original order rather
 * than the image being hoisted to the top and the words swept up after it.
 */
const IMAGE_MARKDOWN = /!\[([^\]]*)\]\(\s*(\S+?)\s*\)/g;

function RichText({
  text,
  style,
  containerStyle,
}: {
  text: string;
  style?: StyleProp<TextStyle>;
  /** Layout for the box. Folded into the text when there is no image to box. */
  containerStyle?: StyleProp<ViewStyle>;
}) {
  const value = String(text ?? '');
  // The overwhelmingly common case: no image, no splitting, no extra views.
  if (!value.includes('](')) {
    return <Inline text={value} style={containerStyle ? [containerStyle, style] : style} />;
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  IMAGE_MARKDOWN.lastIndex = 0;
  while ((match = IMAGE_MARKDOWN.exec(value)) !== null) {
    const before = value.slice(cursor, match.index).trim();
    if (before) {
      parts.push(<Inline key={`t${cursor}`} text={before} style={style} />);
    }
    parts.push(
      <DiagramCard key={`i${match.index}`} imageUrl={match[2]} caption={match[1]} />,
    );
    cursor = match.index + match[0].length;
  }
  const rest = value.slice(cursor).trim();
  if (rest) {
    parts.push(<Inline key={`t${cursor}`} text={rest} style={style} />);
  }
  return <View style={[styles.richText, containerStyle]}>{parts}</View>;
}

function Inline({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  const { colors } = useTheme();
  const parts = String(text ?? '').split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) {
    // The common case, and the one that must stay cheap: no marks, no extra
    // Text nodes, no per-part array work.
    return <Text style={style}>{text}</Text>;
  }
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
          <Text
            key={i}
            style={[styles.mark, { backgroundColor: withAlpha(colors.warning, 0.28), color: colors.text }]}>
            {part.slice(2, -2)}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        ),
      )}
    </Text>
  );
}

/**
 * "6× ASKED IN [FEB 23] [FEB 22] …" — the years a section has come up.
 *
 * This was a line of grey text reading "Asked: Feb 2012, Feb 2013". The count
 * is the part a student scans for, and it was the part that had to be worked
 * out by counting commas.
 */
function AskedRow({ years }: { years: string[] }) {
  const { colors } = useTheme();
  if (years.length === 0) {
    return null;
  }
  return (
    <View style={[styles.askedRow, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
      <View style={[styles.askedCount, { backgroundColor: withAlpha(colors.warning, 0.22) }]}>
        <Text style={[styles.askedCountText, { color: colors.warning }]}>{years.length}× ASKED</Text>
      </View>
      <Text style={[styles.askedIn, { color: colors.textMuted }]}>IN</Text>
      {years.map(year => (
        <View key={year} style={[styles.yearChip, { backgroundColor: withAlpha(colors.text, 0.12) }]}>
          <Text style={[styles.yearChipText, { color: colors.text }]}>{year.toUpperCase()}</Text>
        </View>
      ))}
    </View>
  );
}

function SectionBlock({ section }: { section: Section }) {
  const { colors } = useTheme();
  /**
   * Definitions and comparisons are marked in red, everything else in green.
   *
   * These are semantic, not decorative: red is "learn this exactly as written"
   * and green is "this is the body of the answer". They stay red and green in
   * every theme for the same reason success and danger do — a colour that
   * means something cannot be reassigned by a palette.
   */
  const accent =
    section.type === 'definition' || section.type === 'comparison'
      ? colors.danger
      : colors.success;
  // A revision block is its own card — dashed, violet, with its own heading —
  // so wrapping it in the standard card would frame it twice and title it
  // twice. The web app does the same.
  const isMnemonic = section.type === 'revision';
  if (isMnemonic) {
    return (
      <View>
        <AskedRow years={section.pyqYears ?? []} />
        <SectionBody section={section} />
      </View>
    );
  }
  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionRule, { backgroundColor: accent }]} />
        {section.icon ? <Text style={styles.sectionIcon}>{section.icon}</Text> : null}
        <Text style={[styles.sectionTitle, styles.flex, { color: accent }]}>{section.title}</Text>
      </View>
      <AskedRow years={section.pyqYears ?? []} />
      <SectionBody section={section} />
    </View>
  );
}

/**
 * One string out of a section item.
 *
 * The notes function's item shapes are **objects**, not strings: a bullet is
 * `{ label, description }`, a step is `{ title, description, keyTrigger? }`, a
 * flowchart node is `{ label, detail }`. The first version of this file ran
 * every list through `String(item)`, which renders an object as the literal
 * text `[object Object]` — which is exactly what a third-year Community
 * Medicine topic showed instead of its content.
 *
 * It went unnoticed because the model does sometimes return plain strings, so
 * some topics looked perfect and others were unreadable, with nothing in
 * between to suggest the renderer was the problem rather than the answer.
 *
 * So: read the named field, fall back to a bare string, and never stringify
 * an object.
 */
function field(item: unknown, ...names: string[]): string {
  if (typeof item === 'string') {
    return item;
  }
  if (item && typeof item === 'object') {
    for (const name of names) {
      const value = (item as Record<string, unknown>)[name];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
      if (typeof value === 'number') {
        return String(value);
      }
    }
  }
  return '';
}

/** The items of a list section, as a plain array whatever arrived. */
function itemsOf(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** `details: string[]` on a morphology item, tolerating a single string. */
function detailsOf(item: unknown): string[] {
  if (!item || typeof item !== 'object') {
    return [];
  }
  const value = (item as Record<string, unknown>).details;
  if (Array.isArray(value)) {
    return value.map(entry => field(entry, 'text', 'detail', 'description')).filter(Boolean);
  }
  return typeof value === 'string' ? [value] : [];
}

/** A CLASSIC / PATHOGNOMONIC / COMMON marker on a morphology item. */
function TagChip({ tag }: { tag: string }) {
  const { colors } = useTheme();
  if (!tag) {
    return null;
  }
  return (
    <View style={[styles.tagChip, { backgroundColor: withAlpha(colors.warning, 0.16) }]}>
      <Text style={[styles.tagText, { color: colors.warning }]}>{tag.toUpperCase()}</Text>
    </View>
  );
}

function SectionBody({ section }: { section: Section }) {
  const { colors } = useTheme();
  // `?? section` because the model sometimes returns a section's fields at the
  // top level rather than under `payload`. The web app has always allowed
  // that; without it those sections render as nothing at all.
  const p = (section.payload ?? (section as unknown as Record<string, unknown>) ?? {}) as Record<
    string,
    unknown
  >;

  switch (section.type) {
    case 'diagram': {
      const url = field(p, 'imageUrl', 'url', 'text');
      const caption = field(p, 'caption', 'description');
      return <DiagramCard imageUrl={url} title={section.title} caption={caption} />;
    }

    case 'definition':
      return (
        <View style={[styles.definition, { borderLeftColor: colors.fuchsia }]}>
          <RichText text={field(p, 'text')} style={[styles.body, { color: colors.text }]} />
        </View>
      );

    case 'text':
      return <RichText text={field(p, 'paragraph')} style={[styles.body, { color: colors.text }]} />;

    case 'bullets':
      return (
        <View>
          {itemsOf(p.items).map((item, i) => {
            const label = field(item, 'label', 'title');
            const description = field(item, 'description', 'text', 'detail');
            return (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: colors.fuchsia }]}>•</Text>
                <View style={styles.flex}>
                  {label ? (
                    <Text style={[styles.itemLabel, { color: colors.fuchsia }]}>{label}</Text>
                  ) : null}
                  {description ? (
                    <RichText
                      text={description}
                      style={[
                        styles.body,
                        // Tightened only when it sits under a label, so a
                        // bullet that is one sentence keeps its own rhythm.
                        label ? styles.itemDescription : null,
                        { color: label ? colors.textMuted : colors.text },
                      ]}
                    />
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      );

    case 'steps':
      return (
        <View>
          {itemsOf(p.items).map((item, i) => {
            const title = field(item, 'title', 'label');
            const description = field(item, 'description', 'text', 'detail');
            const trigger = field(item, 'keyTrigger');
            return (
              <View key={i} style={styles.bulletRow}>
                <View
                  style={[styles.stepNum, { backgroundColor: withAlpha(colors.fuchsia, 0.18) }]}>
                  <Text style={[styles.stepNumText, { color: colors.fuchsia }]}>{i + 1}</Text>
                </View>
                <View style={styles.flex}>
                  {title ? (
                    <Text style={[styles.stepTitle, { color: colors.textMuted }]}>
                      {title.toUpperCase()}
                    </Text>
                  ) : null}
                  {description ? (
                    <RichText text={description} style={[styles.body, { color: colors.text }]} />
                  ) : null}
                  {trigger ? (
                    <View
                      style={[
                        styles.trigger,
                        {
                          backgroundColor: withAlpha(colors.warning, 0.12),
                          borderColor: withAlpha(colors.warning, 0.35),
                        },
                      ]}>
                      <Text style={[styles.triggerText, { color: colors.warning }]}>
                        Key trigger: {trigger}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      );

    case 'morphology': {
      const subtitle = field(p, 'subtitle');
      return (
        <View>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.cyan }]}>{subtitle}</Text>
          ) : null}
          {itemsOf(p.items).map((item, i) => {
            const details = detailsOf(item);
            return (
              <View key={i} style={styles.morphItem}>
                <View style={styles.morphHead}>
                  <Text style={[styles.itemLabel, styles.flex, { color: colors.text }]}>
                    {field(item, 'title', 'label')}
                  </Text>
                  <TagChip tag={field(item, 'tag')} />
                </View>
                <View style={[styles.morphDetails, { borderLeftColor: colors.border }]}>
                  {details.map((detail, j) => (
                    <RichText
                      key={j}
                      text={`— ${detail}`}
                      style={[styles.body, { color: colors.textMuted }]}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      );
    }

    case 'comparison': {
      const rows = itemsOf(p.rows);
      return (
        <View>
          <View style={[styles.compareHead, { borderBottomColor: colors.border }]}>
            <Text style={[styles.compareCell, styles.compareHeadText, { color: colors.cyan }]}>
              {field(p, 'left')}
            </Text>
            <Text style={[styles.compareCell, styles.compareHeadText, { color: colors.fuchsia }]}>
              {field(p, 'right')}
            </Text>
          </View>
          {rows.map((row, i) => {
            const label = field(row, 'label');
            return (
              <View key={i}>
                {/* The row label is what the two cells are being compared
                    *on*. Dropping it, as this did, leaves two columns of
                    facts with no stated axis. */}
                {label ? (
                  <Text style={[styles.compareLabel, { color: colors.textMuted }]}>
                    {label.toUpperCase()}
                  </Text>
                ) : null}
                <View
                  style={[
                    styles.compareRow,
                    i === rows.length - 1 ? styles.tableRowLast : null,
                    { borderBottomColor: colors.border },
                  ]}>
                  <RichText
                    text={field(row, 'left')}
                    containerStyle={styles.compareCell}
                    style={[styles.body, { color: colors.text }]}
                  />
                  <RichText
                    text={field(row, 'right')}
                    containerStyle={styles.compareCell}
                    style={[styles.body, { color: colors.text }]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      );
    }

    case 'table':
      return (
        <TableSection
          columns={itemsOf(p.columns).map(column => field(column, 'label', 'title'))}
          rows={itemsOf(p.rows)}
        />
      );

    case 'flowchart':
      return (
        <View>
          {itemsOf(p.steps).map((step, i, all) => (
            <View key={i}>
              <View
                style={[
                  styles.flowStep,
                  { backgroundColor: colors.cardElevated, borderColor: colors.border },
                ]}>
                <Text style={[styles.itemLabel, { color: colors.text }]}>
                  {field(step, 'label', 'title')}
                </Text>
                {field(step, 'detail', 'description') ? (
                  <RichText
                    text={field(step, 'detail', 'description')}
                    style={[styles.body, { color: colors.textMuted }]}
                  />
                ) : null}
              </View>
              {i < all.length - 1 ? (
                <Text style={[styles.flowArrow, { color: colors.fuchsia }]}>↓</Text>
              ) : null}
            </View>
          ))}
        </View>
      );

    case 'outcome':
      return (
        <View
          style={[
            styles.outcome,
            {
              backgroundColor: withAlpha(colors.success, 0.1),
              borderColor: withAlpha(colors.success, 0.4),
            },
          ]}>
          <RichText text={field(p, 'text')} style={[styles.body, { color: colors.text }]} />
        </View>
      );

    case 'revision':
      /**
       * The dashed violet card, matching the web app.
       *
       * A revision section is not another list of facts — it is the handful of
       * lines that must end up on the paper. Drawing it like every other
       * bullet list is why it read as more of the same; the border and the
       * heading are what make it findable when someone is skimming an hour
       * before the exam.
       */
      return (
        <View
          style={[
            styles.mnemonic,
            { borderColor: colors.violet, backgroundColor: withAlpha(colors.violet, 0.1) },
          ]}>
          <Text style={[styles.mnemonicLabel, { color: colors.violet }]}>
            MNEMONIC — MUST-WRITE POINTS
          </Text>
          {section.title ? (
            <Text style={[styles.mnemonicTitle, { color: colors.text }]}>{section.title}</Text>
          ) : null}
          {itemsOf(p.items).map((item, i) => (
            <View key={i} style={styles.mnemonicRow}>
              <Text style={[styles.mnemonicNum, { color: colors.violet }]}>{i + 1}</Text>
              <RichText
                text={field(item, 'text', 'label', 'title')}
                style={[styles.body, styles.flex, { color: colors.text }]}
              />
            </View>
          ))}
        </View>
      );

    default:
      // Unknown section types still show their text rather than vanishing —
      // but never as a stringified object.
      return (
        <RichText
          text={field(p, 'text', 'paragraph')}
          style={[styles.body, { color: colors.textMuted }]}
        />
      );
  }
}

/** Narrower than this and a cell like "12–24 h" starts wrapping mid-value. */
const MIN_COLUMN_WIDTH = 88;

/**
 * A table that fits renders as a grid; one that does not renders as records.
 *
 * The version before this gave every column a fixed 140dp inside a horizontal
 * ScrollView with the indicator switched off. On a 390dp phone the card is
 * 326dp wide, so the four-column cardiac-markers table — "Marker / Rises /
 * Peaks / Returns", a shape the notes function emits constantly — drew its
 * fourth column past the card edge with nothing on screen to suggest it was
 * there. "Returns: 7–10 days" is the single most examinable cell in that table
 * and it was invisible unless you guessed to swipe a table sideways.
 *
 * Horizontal scrolling inside a vertically scrolling page is the wrong fix. It
 * competes with the page's own gesture, hides content behind an affordance
 * people miss, and makes comparing two rows require scrubbing back and forth.
 * So when the columns cannot fit, the table stops being a table: each row
 * becomes a small record with its first cell as the heading and the rest as
 * label/value pairs. Every value is on screen, nothing scrolls sideways, and
 * the reading order is the one a screen reader would use anyway.
 *
 * Which layout applies is decided from the measured width, not the screen size
 * — the same table is a grid on a tablet and records on a cheap 5-inch phone,
 * which is the point (apple-design: adapt to the container, don't make the
 * person adapt to the content).
 *
 * Width arrives on the first layout pass, so the first render assumes the
 * stacked case. That is the safe way round: stacked is always readable, so a
 * frame of it before the grid appears costs nothing, whereas assuming a grid
 * and then clipping is the bug being fixed.
 */
function TableSection({ columns, rows }: { columns: string[]; rows: unknown[] }) {
  const { colors } = useTheme();
  const [width, setWidth] = React.useState(0);

  const count = Math.max(
    columns.length,
    ...rows.map(row => (Array.isArray(row) ? row.length : 1)),
    1,
  );
  const asGrid = width > 0 && count * MIN_COLUMN_WIDTH <= width;

  return (
    <View onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      {asGrid ? (
        <View>
          {columns.length > 0 ? (
            <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
              {columns.map(column => (
                <Text
                  key={column}
                  style={[styles.tableCell, styles.tableHead, { color: colors.textMuted }]}>
                  {column}
                </Text>
              ))}
            </View>
          ) : null}
          {rows.map((row, i) => (
            <View
              key={i}
              style={[
                styles.tableRow,
                // No rule under the final row: it would fence the table off
                // from the card it already sits inside.
                i === rows.length - 1 ? styles.tableRowLast : null,
                { borderBottomColor: colors.border },
              ]}>
              {(Array.isArray(row) ? row.map(String) : [String(row)]).map((cell, j) => (
                <Text key={j} style={[styles.tableCell, styles.body, { color: colors.text }]}>
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.records}>
          {rows.map((row, i) => {
            const cells = Array.isArray(row) ? row.map(String) : [String(row)];
            const [head, ...rest] = cells;
            return (
              <View
                key={i}
                style={[
                  styles.record,
                  { backgroundColor: colors.cardElevated, borderColor: colors.border },
                ]}>
                <Text style={[styles.recordHead, { color: colors.text }]}>{head}</Text>
                {rest.map((cell, j) => (
                  <View key={j} style={styles.recordRow}>
                    <Text style={[styles.recordLabel, { color: colors.textMuted }]}>
                      {columns[j + 1] ?? ''}
                    </Text>
                    <Text style={[styles.body, styles.flex, { color: colors.text }]}>{cell}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  richText: {
    // Only ever wraps prose that turned out to contain a diagram, so the gap
    // is the space between a sentence and the picture it introduces.
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  tip: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  tipLabel: {
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: '700',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 21,
  },
  pyqRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pyqBadge: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  pyqText: {
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionYears: {
    fontSize: 11,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 6,
  },
  definition: {
    borderLeftWidth: 3,
    paddingLeft: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  // Raw sizes, like the rest of this file. It predates the type ramp and
  // mixing the two here would put two different leadings on adjacent lines.
  mnemonic: {
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 14,
  },
  mnemonicLabel: {
    fontSize: 9,
    letterSpacing: 1.4,
    fontWeight: '800',
  },
  mnemonicTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 6,
  },
  mnemonicRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  mnemonicNum: {
    fontSize: 13,
    fontWeight: '800',
    width: 16,
  },
  mark: {
    fontWeight: '700',
  },
  sectionRule: {
    width: 3,
    alignSelf: 'stretch',
    minHeight: 18,
    borderRadius: 2,
  },
  askedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 7,
    marginBottom: 10,
  },
  askedCount: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  askedCountText: {
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  askedIn: {
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  yearChip: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
  },
  yearChipText: {
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '700',
  },
  itemLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  itemDescription: {
    marginTop: 2,
  },
  stepTitle: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginBottom: 2,
  },
  trigger: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  triggerText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tagChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '700',
  },
  morphItem: {
    marginBottom: 10,
  },
  morphHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  morphDetails: {
    marginLeft: 8,
    paddingLeft: 10,
    borderLeftWidth: 2,
    gap: 2,
  },
  compareLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  bulletDot: {
    fontSize: 15,
    lineHeight: 21,
  },
  stepNum: {
    height: 20,
    width: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: '700',
  },
  compareHead: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
    marginBottom: 8,
  },
  compareHeadText: {
    fontWeight: '700',
    fontSize: 13,
  },
  compareRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  compareCell: {
    flex: 1,
    paddingRight: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCell: {
    flex: 1,
    paddingRight: 12,
  },
  records: {
    gap: 8,
  },
  record: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    gap: 2,
  },
  recordHead: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  recordLabel: {
    width: 78,
    fontSize: 12,
    fontWeight: '600',
    paddingTop: 2,
  },
  tableHead: {
    fontSize: 12,
    fontWeight: '700',
  },
  flowStep: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  flowArrow: {
    textAlign: 'center',
    fontSize: 18,
    marginVertical: 2,
  },
  outcome: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
});

export const NotesContentView = memo(NotesContentViewBase);
