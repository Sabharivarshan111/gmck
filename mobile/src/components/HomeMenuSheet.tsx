import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BadgeCheck,
  BookOpen,
  ChevronRight,
  LayoutGrid,
  MessageCircle,
  Palette,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Timer as TimerIcon,
  TrendingUp,
} from 'lucide-react-native';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { useIsAdmin } from '@/hooks/useIsAdmin';

/**
 * Everything the app can do, in one list, from the button that used to only
 * rearrange the home screen.
 *
 * ## Why a sheet and not a drawer
 *
 * The reference for this was a left-hand drawer, and this is deliberately not
 * one. Two reasons, and neither is taste:
 *
 * * **The app has no drawer motion and does have a sheet.** `Sheet.tsx` is the
 *   house primitive — drag-to-dismiss with velocity handoff, the scrim, the
 *   grabber, reduced-motion handling and the scroll gate are all solved in it
 *   and tested. A drawer would be a second set of all of that, hand-rolled,
 *   which `.agents/rules/10-motion.md` exists to prevent.
 * * **A drawer opens where the thumb is not.** It is anchored to the top-left
 *   corner of a 6.7-inch phone, which is the hardest place on the screen to
 *   reach one-handed; a sheet arrives under the thumb. The button that opens
 *   it stays top-left because that is where a menu button belongs, but what it
 *   opens does not have to live there.
 *
 * ## Rearranging is still here
 *
 * That button's old job was entering rearrange mode, and the comment on it
 * says why it exists at all: holding a block is the normal way in, and a hold
 * is not something a screen reader can offer. So "Rearrange home screen" is a
 * row in this list rather than a thing that was replaced — losing it would
 * take the accessible route with it.
 */
export interface HomeMenuAction {
  key: string;
  icon: React.ReactNode;
  label: string;
  /** The second line. Says what the row does, never what it is called again. */
  hint: string;
  onPress: () => void;
}

export function HomeMenuSheet({
  visible,
  onClose,
  onGoToTab,
  onBrowse,
  onSearch,
  onRearrange,
  onSettings,
  onThemes,
  onCommunity,
  adFreeUntil,
  onRemoveAds,
}: {
  visible: boolean;
  onClose: () => void;
  onGoToTab: (tab: 'Notes' | 'Timer' | 'AskAI' | 'Progress') => void;
  onBrowse: () => void;
  onSearch: () => void;
  onRearrange: () => void;
  onSettings: () => void;
  onThemes: () => void;
  onCommunity: () => void;
  /** ISO date the ad-free period ends, or null when there is none. */
  adFreeUntil: string | null;
  onRemoveAds: () => void;
}) {
  const { colors } = useTheme();
  const { isAdmin } = useIsAdmin();

  /** Close first, then act. A sheet that is still up while the screen changes
   *  behind it reads as the tap having missed. */
  const run = (fn: () => void) => () => {
    onClose();
    fn();
  };

  /*
   * Built on every render rather than memoised.
   *
   * Every handler here is an inline arrow from HomeScreen, so it has a new
   * identity each render and a `useMemo` keyed on them would rebuild anyway —
   * while a memo keyed on anything LESS would capture a stale `onClose` and
   * leave the sheet up after a tap. Eleven objects is not a cost worth a bug.
   */
  const groups: { title: string; items: HomeMenuAction[] }[] = [
      {
        title: 'STUDY',
        items: [
          {
            key: 'browse',
            icon: <BookOpen size={18} color={colors.text} />,
            label: 'All subjects',
            hint: 'Every year, down to the chapter',
            onPress: run(onBrowse),
          },
          {
            key: 'search',
            icon: <Search size={18} color={colors.text} />,
            label: 'Search the bank',
            hint: 'Find a question by its words',
            onPress: run(onSearch),
          },
          {
            key: 'notes',
            icon: <Sparkles size={18} color={colors.text} />,
            label: 'Notes and flashcards',
            hint: 'Your notes, and decks to drill',
            onPress: run(() => onGoToTab('Notes')),
          },
          {
            key: 'ask',
            icon: <MessageCircle size={18} color={colors.text} />,
            label: 'Ask AI',
            hint: 'Explanations and instant MCQs',
            onPress: run(() => onGoToTab('AskAI')),
          },
        ],
      },
      {
        title: 'YOUR WORK',
        items: [
          {
            key: 'timer',
            icon: <TimerIcon size={18} color={colors.text} />,
            label: 'Focus timer',
            hint: 'Twenty-five minutes, and a tree',
            onPress: run(() => onGoToTab('Timer')),
          },
          {
            key: 'progress',
            icon: <TrendingUp size={18} color={colors.text} />,
            label: 'My progress',
            hint: 'Streak, XP, calendar and the board',
            onPress: run(() => onGoToTab('Progress')),
          },
        ],
      },
      {
        title: 'THE APP',
        items: [
          {
            key: 'rearrange',
            icon: <LayoutGrid size={18} color={colors.text} />,
            label: 'Rearrange home screen',
            hint: 'Move and resize the blocks',
            onPress: run(onRearrange),
          },
          {
            key: 'themes',
            icon: <Palette size={18} color={colors.text} />,
            label: 'Themes and wallpaper',
            hint: 'Four themes, or build your own',
            onPress: run(onThemes),
          },
          {
            key: 'settings',
            icon: <SlidersHorizontal size={18} color={colors.text} />,
            label: 'Settings',
            hint: 'Text size, haptics, sounds, reminders',
            onPress: run(onSettings),
          },
          {
            key: 'community',
            icon: <MessageCircle size={18} color={colors.text} />,
            label: 'WhatsApp community',
            hint: 'The group for your year',
            onPress: run(onCommunity),
          },
          ...(isAdmin
            ? [
                {
                  key: 'admin',
                  icon: <Shield size={18} color={colors.text} />,
                  label: 'Admin dashboard',
                  hint: 'Subscribers, diagrams and page refs',
                  onPress: run(() => onGoToTab('Progress')),
                },
              ]
            : []),
        ],
      },
  ];

  return (
    <Sheet visible={visible} onClose={onClose} title="Orbit">
      {/*
        The ad-free state is the top of the list because it is the only row
        whose ANSWER changes: everything below is a place to go, and this one
        tells you something you might not know. When it is already bought it
        stops being an offer and becomes a receipt — an app that keeps selling
        to somebody who has paid is the fastest way to make a paid feature feel
        like a mistake.
      */}
      <Touchable
        onPress={adFreeUntil ? onClose : run(onRemoveAds)}
        label={
          adFreeUntil
            ? `Ad-free until ${adFreeUntil}`
            : 'Remove ads, from fifty rupees'
        }
        scaleTo={0.98}
        style={[
          styles.premium,
          {
            borderColor: withAlpha(colors.accent, 0.45),
            backgroundColor: withAlpha(colors.accent, 0.1),
          },
        ]}>
        <BadgeCheck size={20} color={colors.accent} />
        <View style={styles.premiumBody}>
          <Text style={[styles.premiumTitle, { color: colors.accent }]}>
            {adFreeUntil ? 'No ads' : 'Remove ads'}
          </Text>
          <Text style={[styles.premiumHint, { color: colors.textMuted }]}>
            {adFreeUntil ? `Until ${adFreeUntil}` : 'One month, six months or a year'}
          </Text>
        </View>
        {adFreeUntil ? null : <ChevronRight size={18} color={colors.textMuted} />}
      </Touchable>

      {groups.map(group => (
        <View key={group.title} style={styles.group}>
          <Text style={[styles.groupTitle, { color: colors.textMuted }]}>{group.title}</Text>
          {group.items.map(item => (
            <Touchable
              key={item.key}
              onPress={item.onPress}
              label={item.label}
              hint={item.hint}
              scaleTo={0.98}
              style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: colors.cardElevated }]}>
                {item.icon}
              </View>
              <View style={styles.rowBody}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>{item.label}</Text>
                <Text style={[styles.rowHint, { color: colors.textMuted }]}>{item.hint}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </Touchable>
          ))}
        </View>
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  premium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  premiumBody: { flex: 1 },
  premiumTitle: { fontSize: 15, fontWeight: '800' },
  premiumHint: { fontSize: 12, marginTop: 2 },
  group: { marginTop: 18 },
  groupTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
    marginLeft: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '700' },
  rowHint: { fontSize: 12, marginTop: 1 },
});
