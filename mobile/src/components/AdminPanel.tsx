import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  BookOpen,
  Image as ImageIcon,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { Dialog } from '@/components/Dialog';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import {
  deletePageRef,
  diagramStats,
  listPageRefs,
  listSubscribers,
  pageRefStats,
  revokeAccess,
  type AdminPageRef,
  type DiagramStats,
  type PageRefStats,
  type Subscriber,
} from '@/lib/admin';

/** Which bundle a buyer owns, in words rather than plan keys. */
function notesLabel(plans: string | null): string {
  if (!plans) {
    return 'Notes';
  }
  const fm = plans.includes('notes_fmspm');
  const pharmac = plans.includes('notes_pharmac');
  if (fm && pharmac) {
    return 'FM+SPM & Pharmac notes';
  }
  if (pharmac) {
    return 'Pharmacology notes';
  }
  return 'FM+SPM notes';
}

/**
 * The owner's dashboard, at the bottom of My Progress.
 *
 * It renders nothing at all for everybody else — and that is a convenience,
 * not the security. Every call it makes runs against a SECURITY DEFINER
 * function that checks `is_admin()` in Postgres, so an unpacked APK with this
 * check patched out still gets empty lists. See `hooks/useIsAdmin.ts`.
 *
 * The three sections mirror what the web app's admin panel does — subscribers
 * and diagrams — plus moderation for the community page references, which the
 * web app has no equivalent of because the feature is new here.
 */
export function AdminPanel() {
  const { colors } = useTheme();
  const { isAdmin, loading: checking } = useIsAdmin();

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [diagrams, setDiagrams] = useState<DiagramStats | null>(null);
  const [pageStats, setPageStats] = useState<PageRefStats | null>(null);
  const [refs, setRefs] = useState<AdminPageRef[]>([]);
  const [onlyPending, setOnlyPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<
    { kind: 'revoke'; subscriber: Subscriber } | { kind: 'ref'; ref: AdminPageRef } | null
  >(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, d, ps, r] = await Promise.all([
        listSubscribers(),
        diagramStats(),
        pageRefStats(),
        listPageRefs(onlyPending),
      ]);
      setSubscribers(s);
      setDiagrams(d);
      setPageStats(ps);
      setRefs(r);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [onlyPending]);

  useEffect(() => {
    if (isAdmin) {
      void load();
    }
  }, [isAdmin, load]);

  const confirmAction = useCallback(async () => {
    if (!confirming) {
      return;
    }
    const target = confirming;
    setConfirming(null);
    setLoading(true);
    try {
      const message =
        target.kind === 'revoke'
          ? await revokeAccess(target.subscriber.userId)
          : await deletePageRef(
              target.ref.questionId,
              target.ref.bookId,
              target.ref.page,
            );
      if (message) {
        setError(message);
      }
      await load();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [confirming, load]);

  if (checking || !isAdmin) {
    return null;
  }

  const revenue = subscribers.reduce((sum, s) => sum + s.totalPaise, 0) / 100;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: withAlpha(colors.primary, 0.4) },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <ShieldCheck size={16} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Admin</Text>
        </View>
        <Touchable label="Refresh admin data" onPress={() => void load()} hitSlop={10}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <RefreshCw size={16} color={colors.textMuted} />
          )}
        </Touchable>
      </View>

      {/* ---- Money and people ------------------------------------------- */}
      <Section icon={<Users size={13} color={colors.textMuted} />} title="Subscribers">
        <View style={styles.statRow}>
          <Stat label="Buyers" value={String(subscribers.length)} />
          <Stat
            label="Notes active"
            value={String(subscribers.filter(s => s.notesActive).length)}
          />
          <Stat
            label="Ad-free"
            value={String(subscribers.filter(s => s.adfreeActive).length)}
          />
          <Stat label="Revenue" value={`₹${revenue.toFixed(0)}`} />
        </View>

        {subscribers.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            No purchases yet.
          </Text>
        ) : (
          subscribers.slice(0, 12).map(s => (
            <View
              key={s.userId}
              style={[
                styles.row,
                { backgroundColor: colors.cardElevated, borderColor: colors.border },
              ]}
            >
              <View style={styles.rowBody}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  {s.displayName || 'Unnamed'} · ₹{(s.totalPaise / 100).toFixed(0)}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.rowSub, { color: colors.textMuted }]}
                >
                  {s.email ?? 'no email'}
                </Text>
                <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                  {notesLabel(s.notesPlans)} {s.notesActive ? 'unlocked' : 'locked'} ·
                  Ad-free {s.adfreeActive ? 'on' : 'expired'}
                </Text>
              </View>
              {s.notesActive || s.adfreeActive ? (
                <Touchable
                  label={`Remove all access for ${s.displayName || 'this user'}`}
                  onPress={() => setConfirming({ kind: 'revoke', subscriber: s })}
                  hitSlop={8}
                  style={styles.iconButton}
                >
                  <Trash2 size={15} color={colors.danger} />
                </Touchable>
              ) : null}
            </View>
          ))
        )}
      </Section>

      {/* ---- Diagrams ---------------------------------------------------- */}
      <Section icon={<ImageIcon size={13} color={colors.textMuted} />} title="Diagrams">
        <View style={styles.statRow}>
          <Stat label="Rows" value={String(diagrams?.total ?? 0)} />
          {/* The number that matters: a row with no picture is a placeholder,
            and there are thousands of them. */}
          <Stat label="With a picture" value={String(diagrams?.withPicture ?? 0)} />
          <Stat label="Approved" value={String(diagrams?.approved ?? 0)} />
          <Stat label="Failed" value={String(diagrams?.failed ?? 0)} />
        </View>
        <Text style={[styles.note, { color: colors.textMuted }]}>
          Generating and approving diagrams stays in the web admin panel — it
          needs a Gemini key pasted in, which does not belong on a phone.
        </Text>
      </Section>

      {/* ---- Community page references ----------------------------------- */}
      <Section
        icon={<BookOpen size={13} color={colors.textMuted} />}
        title="Textbook pages"
      >
        <View style={styles.statRow}>
          <Stat label="Entries" value={String(pageStats?.totalRefs ?? 0)} />
          <Stat label="Confirmed" value={String(pageStats?.confirmedPages ?? 0)} />
          <Stat label="Pending" value={String(pageStats?.pendingPages ?? 0)} />
          <Stat label="Readers" value={String(pageStats?.contributors ?? 0)} />
        </View>

        <Touchable
          label={onlyPending ? 'Show all page claims' : 'Show only pending claims'}
          state={{ checked: onlyPending }}
          onPress={() => setOnlyPending(v => !v)}
          style={[
            styles.filterChip,
            {
              backgroundColor: onlyPending ? colors.primary : colors.cardElevated,
              borderColor: onlyPending ? colors.primary : colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.filterChipText,
              { color: onlyPending ? colors.primaryText : colors.text },
            ]}
          >
            {onlyPending ? 'Pending only' : 'All claims'}
          </Text>
        </Touchable>

        {refs.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            Nobody has entered a textbook page yet.
          </Text>
        ) : (
          refs.slice(0, 25).map(ref => (
            <View
              key={`${ref.questionId}:${ref.bookId}:${ref.page}`}
              style={[
                styles.row,
                {
                  backgroundColor: colors.cardElevated,
                  borderColor: ref.confirmed ? colors.success : colors.border,
                },
              ]}
            >
              <View style={styles.rowBody}>
                <Text
                  numberOfLines={2}
                  style={[styles.rowTitle, { color: colors.text }]}
                >
                  {ref.questionText}
                </Text>
                <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                  {ref.bookName}
                  {ref.edition ? ` ${ref.edition}` : ''} · p.{ref.page}
                </Text>
                <Text
                  style={[
                    styles.rowSub,
                    { color: ref.confirmed ? colors.success : colors.warning },
                  ]}
                >
                  {ref.confirmed
                    ? `Live — ${ref.votes} readers agree`
                    : `Not shown yet — ${ref.votes} of 3`}
                </Text>
              </View>
              <Touchable
                label={`Remove page ${ref.page} for this question`}
                onPress={() => setConfirming({ kind: 'ref', ref })}
                hitSlop={8}
                style={styles.iconButton}
              >
                <Trash2 size={15} color={colors.danger} />
              </Touchable>
            </View>
          ))
        )}
      </Section>

      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.error, { color: colors.danger }]}
        >
          {error}
        </Text>
      ) : null}

      {/* Both destructive actions take everyone's rows with them, so neither
        happens on a single tap. */}
      <Dialog
        visible={confirming !== null}
        onDismiss={() => setConfirming(null)}
        title={
          confirming?.kind === 'revoke'
            ? 'Remove all access?'
            : 'Remove this page reference?'
        }
        message={
          confirming?.kind === 'revoke'
            ? `${confirming.subscriber.displayName || 'This user'} loses every unlock they have paid for. This cannot be undone from here.`
            : confirming
              ? `Deletes every reader's vote for page ${confirming.ref.page} of ${confirming.ref.bookName}, not just one.`
              : ''
        }
        actions={[
          { label: 'Cancel', onPress: () => setConfirming(null), tone: 'secondary' },
          { label: 'Remove', onPress: () => void confirmAction(), tone: 'danger' },
        ]}
      />
    </View>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        {icon}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          {title.toUpperCase()}
        </Text>
      </View>
      {children}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.cardElevated }]}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 14,
    marginTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...typeScale.title3,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    ...typeScale.overline,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stat: {
    flexGrow: 1,
    flexBasis: '22%',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    ...typeScale.title3,
  },
  statLabel: {
    ...typeScale.caption,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...typeScale.callout,
    fontWeight: '700',
  },
  rowSub: {
    ...typeScale.caption,
  },
  iconButton: {
    padding: 6,
  },
  filterChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipText: {
    ...typeScale.caption,
    fontWeight: '700',
  },
  empty: {
    ...typeScale.footnote,
  },
  note: {
    ...typeScale.caption,
  },
  error: {
    ...typeScale.footnote,
  },
});
