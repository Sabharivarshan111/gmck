import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Touchable } from '@/components/Touchable';
import { Flame, Trophy } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { useTheme, withAlpha } from '@/theme';
import { supabase } from '@/lib/supabase';
import { YEAR_TO_KEY, type Year } from '@/lib/profile';
import { YEAR_LABEL } from '@/lib/questionBank';

type Scope = 'weekly' | 'lifetime';

interface Row {
  id: string;
  display_name: string;
  year: Year;
  /** The figure this scope ranks on. */
  xp: number;
  /** All-time XP for the year, which is what earns the badge. */
  yearXp: number;
  streak: number;
}

const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * The same six XP badges the web app awards, and the same emoji beside the
 * same name. A board where the person above you carries a diamond and you do
 * not is the part that makes it a board rather than a list.
 */
const XP_BADGES = [
  { threshold: 10, label: 'Bronze Scholar', emoji: '🥉' },
  { threshold: 50, label: 'Silver Scholar', emoji: '🥈' },
  { threshold: 100, label: 'Gold Scholar', emoji: '🥇' },
  { threshold: 250, label: 'Platinum Mind', emoji: '💠' },
  { threshold: 500, label: 'Diamond Mind', emoji: '💎' },
  { threshold: 1000, label: 'Legendary Healer', emoji: '👑' },
];

function highestBadge(yearXp: number) {
  let best: (typeof XP_BADGES)[number] | null = null;
  for (const badge of XP_BADGES) {
    if (yearXp >= badge.threshold) best = badge;
  }
  return best;
}

/**
 * Milliseconds until the weekly board resets.
 *
 * The window is Monday-aligned, matching `get_weekly_leaderboard`. Without the
 * countdown "XP earned this week only" is a rule with no deadline attached,
 * and the deadline is the reason to open the app today rather than Sunday.
 */
function msUntilNextMonday(now: Date = new Date()): number {
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilMonday);
  next.setHours(0, 0, 0, 0);
  return next.getTime() - now.getTime();
}

export function formatCountdown(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

/**
 * Reads through the same security-definer RPCs the web app uses
 * (`get_weekly_leaderboard` / `get_year_leaderboard`) so profile rows stay
 * private — no direct table access.
 */
export function Leaderboard({
  year,
  selfName,
  selfId,
}: {
  year: Year;
  selfName: string;
  /** The signed-in profile id, when there is one. */
  selfId?: string | null;
}) {
  const { colors } = useTheme();
  const [scope, setScope] = useState<Scope>('weekly');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(() => msUntilNextMonday());

  // A minute is the resolution the label prints, so a minute is how often it
  // is worth waking to redraw one line of text.
  useEffect(() => {
    const id = setInterval(() => setCountdown(msUntilNextMonday()), 60_000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rpc = scope === 'weekly' ? 'get_weekly_leaderboard' : 'get_year_leaderboard';
      const { data, error: rpcError } = await supabase.rpc(rpc, { _year: year, _limit: 50 });
      if (rpcError) {
        throw new Error(rpcError.message);
      }
      const mapped = ((data ?? []) as Record<string, unknown>[]).map(row => ({
        id: String(row.id),
        display_name: String(row.display_name ?? 'Anonymous'),
        year: row.year as Year,
        xp: Number(scope === 'weekly' ? row.weekly_xp ?? 0 : row.year_xp ?? row.xp ?? 0),
        yearXp: Number(row.year_xp ?? row.xp ?? 0),
        streak: Number(row.streak ?? 0),
      }));
      setRows(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the leaderboard.');
    } finally {
      setLoading(false);
    }
  }, [scope, year]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Trophy size={20} color={colors.warning} />
        <Text style={[styles.title, { color: colors.text }]}>Leaderboard</Text>
        <View style={styles.grow} />
        <View style={[styles.scope, { backgroundColor: colors.cardElevated }]}>
          {(['weekly', 'lifetime'] as Scope[]).map(option => {
            const active = option === scope;
            return (
              <Touchable
                key={option}
                onPress={() => setScope(option)}
                role="tab"
                label={option === 'weekly' ? 'Weekly' : 'Lifetime'}
                state={{ selected: active }}
                scale={false}
                style={[styles.scopeItem, active && { backgroundColor: colors.background }]}>
                <Text
                  style={[
                    styles.scopeText,
                    { color: active ? colors.text : colors.textMuted },
                  ]}>
                  {option === 'weekly' ? 'Weekly' : 'Lifetime'}
                </Text>
              </Touchable>
            );
          })}
        </View>
      </View>

      <Text style={[styles.caption, { color: colors.textMuted }]}>
        {YEAR_LABEL[YEAR_TO_KEY[year]]} ·{' '}
        {scope === 'weekly'
          ? `XP earned this week only. Resets in ${formatCountdown(countdown)}.`
          : 'XP earned all-time. No reset.'}{' '}
        Ties broken by streak.
      </Text>

      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color={colors.fuchsia} />
        </View>
      ) : error ? (
        <Touchable onPress={load} label={`${error} Tap to retry.`} style={styles.state}>
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.stateText, { color: colors.textMuted }]}>
            {error}
          </Text>
          <Text style={[styles.retry, { color: colors.fuchsia }]}>Tap to retry</Text>
        </Touchable>
      ) : rows.length === 0 ? (
        <View style={styles.state}>
          <Text style={[styles.stateText, { color: colors.textMuted }]}>
            No one on the board yet this week.
          </Text>
        </View>
      ) : (
        /*
          All fifty, scrolling inside the card — the same shape the web app
          uses (`max-h-72 overflow-y-auto`).

          It used to render `rows.slice(0, 10)` out of the fifty it had already
          fetched, so anyone ranked eleventh or lower could not find themselves
          on a board they were on. `nestedScrollEnabled` is what lets this
          scroll at all inside the Progress screen's own ScrollView on Android.
        */
        <ScrollView
          style={styles.list}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled">
          {rows.map((row, index) => {
            /*
              Identity by id where there is one. Matching on the display name
              put the highlight on a stranger as soon as two people picked the
              same one, which on a board of medical students called Praveena is
              not a hypothetical. The name is the fallback for a reader with no
              account, who has no id to match on.
            */
            const isSelf = selfId
              ? row.id === selfId
              : selfName.length > 0 && row.display_name === selfName;
            const badge = highestBadge(row.yearXp);
            return (
              <View
                key={row.id}
                accessible
                accessibilityLabel={
                  `${isSelf ? 'You, ' : ''}number ${index + 1}, ${row.display_name}, ` +
                  `${row.xp} XP, ${row.streak} day streak` +
                  (badge ? `, ${badge.label}` : '')
                }
                style={[
                  styles.row,
                  isSelf && {
                    backgroundColor: withAlpha(colors.fuchsia, 0.12),
                    borderColor: withAlpha(colors.fuchsia, 0.4),
                    borderWidth: StyleSheet.hairlineWidth,
                  },
                ]}>
                <Text style={[styles.rank, { color: colors.textMuted }]}>
                  {index < 3 ? MEDALS[index] : `#${index + 1}`}
                </Text>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                  {row.display_name}
                  {isSelf ? ' (you)' : ''}
                  {badge ? ` ${badge.emoji}` : ''}
                </Text>
                <View style={styles.streak}>
                  <Flame size={13} color="#FB923C" />
                  <Text style={[styles.streakText, { color: '#FB923C' }]}>{row.streak}</Text>
                </View>
                <Text style={[styles.xp, { color: colors.text }]}>{row.xp} XP</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  grow: {
    flex: 1,
  },
  scope: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
    gap: 3,
  },
  scopeItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  scopeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 12,
  },
  state: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
  },
  stateText: {
    fontSize: 13,
    textAlign: 'center',
  },
  retry: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    /*
      Bounded so the board is a card on the page rather than the page. Roughly
      seven rows, which is enough to see the shape of the top and that there is
      more below it.
    */
    maxHeight: 288,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 11,
    borderRadius: 10,
  },
  rank: {
    width: 34,
    fontSize: 14,
    fontWeight: '700',
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700',
  },
  xp: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 58,
    textAlign: 'right',
  },
});
