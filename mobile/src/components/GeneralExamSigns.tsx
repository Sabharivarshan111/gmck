/**
 * The general examination, with a photograph of every sign.
 *
 * This is the part of clerking a student does on every patient and the part
 * that words cannot teach — "spoon-shaped nails" has never once made anybody
 * recognise koilonychia across a table. `src/lib/generalExamSigns.ts` explains
 * where the pictures come from and why they are photographs rather than
 * drawings; this file only draws them.
 *
 * Three things here are load-bearing rather than decorative:
 *
 * - **A sign with no picture renders as text, not as a broken frame.** The
 *   photographs are fetched by a workflow and some signs will legitimately
 *   never get one, because the only images available are not licensed for
 *   commercial use. That is the correct outcome, so it has to look deliberate.
 *
 * - **The credit line is not optional.** CC-BY requires attribution, and an
 *   attribution nobody displays is a licence nobody is keeping. It is drawn
 *   directly under the picture, in the same component, so the two cannot be
 *   separated by a later edit.
 *
 * - **A collapsed sign still announces its name to TalkBack.** The rows are
 *   accordions, and a row whose label is only "expand" tells a blind student
 *   nothing about which sign they are opening.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { ChevronDown, ChevronRight, Eye, Lightbulb } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { space, radius } from '@/theme/tokens';
import { typeScale } from '@/theme/typography';
import {
  EXAM_SIGNS,
  SIGN_GROUP_ORDER,
  type ExamSign,
  type SignGroup,
} from '@/lib/generalExamSigns';
import { resolveProformaDiagramUrl } from '@/lib/clinicalProformas';
import { SIGN_IMAGES, type FetchedSignImage } from '@/lib/examSignImages';

/* The manifest the fetch workflow writes. Read through a lookup rather than
 * baked into the sign list, so a new batch of pictures is one generated file
 * with no edit to the sign definitions themselves. */
function imageFor(sign: ExamSign): FetchedSignImage | undefined {
  const found = SIGN_IMAGES[sign.id];
  if (found?.file) {
    return found;
  }
  if (sign.image.file) {
    return {
      file: sign.image.file,
      credit: sign.image.credit,
      licence: sign.image.licence,
    };
  }
  return undefined;
}

export interface GeneralExamSignsProps {
  /** Opens the shared fullscreen viewer the proforma modal already owns. */
  onOpenImage?: (image: { uri: string; title: string }) => void;
  /** Show only these groups. Default: all of them, in examination order. */
  groups?: SignGroup[];
}

export function GeneralExamSigns({ onOpenImage, groups }: GeneralExamSignsProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState<string | null>(null);

  const shown = useMemo(() => {
    const wanted = groups && groups.length > 0 ? groups : SIGN_GROUP_ORDER;
    return wanted
      .map(group => ({ group, signs: EXAM_SIGNS.filter(s => s.group === group) }))
      .filter(g => g.signs.length > 0);
  }, [groups]);

  const toggle = useCallback((id: string) => {
    setOpen(current => (current === id ? null : id));
  }, []);

  return (
    <View>
      <View style={[styles.intro, { backgroundColor: withAlpha(colors.primary, 0.08) }]}>
        <Eye size={16} color={colors.primary} />
        <Text style={[styles.introText, { color: colors.textMuted }]}>
          Every case sheet opens with this. Tap a sign to see what it actually looks like.
        </Text>
      </View>

      {shown.map(({ group, signs }) => (
        <View key={group} style={styles.group}>
          <Text style={[styles.groupTitle, { color: colors.textMuted }]}>
            {group.toUpperCase()}
          </Text>

          {signs.map(sign => {
            const expanded = open === sign.id;
            const picture = imageFor(sign);
            const uri = resolveProformaDiagramUrl(picture?.file);

            return (
              <View
                key={sign.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}>
                <Touchable
                  label={sign.name}
                  hint={expanded ? 'Collapse this sign' : 'Show the picture and the causes'}
                  state={{ expanded }}
                  onPress={() => toggle(sign.id)}
                  style={styles.header}>
                  <View style={styles.headerText}>
                    <Text style={[styles.signName, { color: colors.text }]}>{sign.name}</Text>
                    {!expanded ? (
                      <Text
                        numberOfLines={2}
                        style={[styles.signBrief, { color: colors.textMuted }]}>
                        {sign.definition}
                      </Text>
                    ) : null}
                  </View>
                  {expanded ? (
                    <ChevronDown size={18} color={colors.textMuted} />
                  ) : (
                    <ChevronRight size={18} color={colors.textMuted} />
                  )}
                </Touchable>

                {expanded ? (
                  <View style={styles.body}>
                    {uri ? (
                      <Touchable
                        label={`${sign.name}, photograph`}
                        hint="Opens the picture full screen"
                        onPress={() =>
                          onOpenImage?.({ uri, title: sign.name })
                        }
                        style={styles.imageTouch}>
                        <Image
                          source={{ uri }}
                          style={[styles.image, { backgroundColor: colors.cardElevated }]}
                          resizeMode="contain"
                          accessibilityLabel={`Clinical photograph of ${sign.name}`}
                        />
                      </Touchable>
                    ) : (
                      /* Deliberate, and explained: see the file header. A sign
                       * with no freely-licensed photograph says so rather than
                       * leaving an empty frame that reads as a failed load. */
                      <View
                        style={[
                          styles.noImage,
                          { borderColor: colors.border, backgroundColor: colors.cardElevated },
                        ]}>
                        <Text style={[styles.noImageText, { color: colors.textMuted }]}>
                          No freely-licensed photograph for this sign yet
                        </Text>
                      </View>
                    )}

                    {/* Attribution sits with the picture, in the same
                     * component, so no later edit can separate them. */}
                    {uri && (picture?.credit || picture?.licence) ? (
                      <Text style={[styles.credit, { color: colors.textMuted }]}>
                        {[picture?.credit, picture?.licence].filter(Boolean).join(' · ')}
                      </Text>
                    ) : null}

                    <Field label="What it is" value={sign.definition} />
                    <Field label="Where to look" value={sign.whereToLook} />
                    {sign.grading ? <Field label="Grading" value={sign.grading} /> : null}

                    {sign.mnemonic ? (
                      <View style={styles.block}>
                        <Text style={[styles.blockLabel, { color: colors.textMuted }]}>
                          CAUSES — {sign.mnemonic.word}
                        </Text>
                        {sign.mnemonic.expansion.map(line => (
                          <Text key={line} style={[styles.bullet, { color: colors.text }]}>
                            {line}
                          </Text>
                        ))}
                      </View>
                    ) : null}

                    {sign.causes && sign.causes.length > 0 ? (
                      <View style={styles.block}>
                        <Text style={[styles.blockLabel, { color: colors.textMuted }]}>
                          CAUSES
                        </Text>
                        {sign.causes.map(cause => (
                          <Text key={cause} style={[styles.bullet, { color: colors.text }]}>
                            {'•'}  {cause}
                          </Text>
                        ))}
                      </View>
                    ) : null}

                    {sign.pearl ? (
                      <View
                        style={[
                          styles.pearl,
                          {
                            backgroundColor: withAlpha(colors.warning, 0.12),
                            borderColor: withAlpha(colors.warning, 0.35),
                          },
                        ]}>
                        <Lightbulb size={14} color={colors.warning} />
                        <Text style={[styles.pearlText, { color: colors.text }]}>
                          {sign.pearl}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.block}>
      <Text style={[styles.blockLabel, { color: colors.textMuted }]}>
        {label.toUpperCase()}
      </Text>
      <Text style={[styles.blockValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    marginBottom: space.lg,
  },
  introText: { ...typeScale.caption, flex: 1 },
  group: { marginBottom: space.xl },
  groupTitle: { ...typeScale.overline, marginBottom: space.sm },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    marginBottom: space.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
  },
  headerText: { flex: 1 },
  signName: { ...typeScale.bodyStrong },
  signBrief: { ...typeScale.caption, marginTop: 2 },
  body: { paddingHorizontal: space.md, paddingBottom: space.md },
  imageTouch: { borderRadius: radius.md, overflow: 'hidden' },
  image: { width: '100%', height: 200, borderRadius: radius.md },
  noImage: {
    height: 72,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  noImageText: { ...typeScale.caption, textAlign: 'center' },
  credit: { ...typeScale.caption, marginTop: space.xs, fontSize: 11 },
  block: { marginTop: space.md },
  blockLabel: { ...typeScale.overline, marginBottom: space.xs },
  blockValue: { ...typeScale.body },
  bullet: { ...typeScale.body, marginBottom: space.xs },
  pearl: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    marginTop: space.md,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pearlText: { ...typeScale.caption, flex: 1 },
});
