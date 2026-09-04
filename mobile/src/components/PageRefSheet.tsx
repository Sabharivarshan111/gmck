import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { BookOpen, Check, Plus, Trash2 } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { QuorumPips } from '@/components/QuorumPips';
import { Sheet } from '@/components/Sheet';
import { Touchable } from '@/components/Touchable';
import { useTheme } from '@/theme';
import { setSetting, useSettings } from '@/lib/settings';
import { DURATION, EASE, useReducedMotion } from '@/theme/motion';
import { typeScale } from '@/theme/typography';
import {
  PAGE_REF_QUORUM,
  addBook,
  canContribute,
  listBooks,
  pageRefsFor,
  submitPageRef,
  withdrawPageRef,
  type PageRef,
  type ReferenceBook,
} from '@/lib/pageRefs';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** The question as the reader sees it, with the leading "12. " stripped. */
  question: string;
  /** The bank's raw string, if it differs. Both are asked about. */
  rawQuestion?: string;
  /** Called after a successful submit, so the row can refresh its chip. */
  onChanged?: () => void;
}

/**
 * "Which page of which book answers this question."
 *
 * The sheet has to carry one idea that is not obvious from the controls: a page
 * number a reader types is **not** shown to anybody else until two more readers
 * have typed the same one. So it always says where a claim stands — "2 of 3" —
 * rather than accepting the number silently and looking like it published it.
 * Somebody who thinks they have corrected the app for everyone, and has not,
 * is the failure this screen exists to avoid.
 */
export function PageRefSheet({
  visible,
  onClose,
  question,
  rawQuestion,
  onChanged,
}: Props) {
  const { colors } = useTheme();
  const { myBookId } = useSettings();

  const [refs, setRefs] = useState<PageRef[]>([]);
  const [books, setBooks] = useState<ReferenceBook[]>([]);
  const [bookId, setBookId] = useState<string | null>(null);
  const [page, setPage] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mayContribute, setMayContribute] = useState(true);

  // The "add a book" half, hidden until asked for: most readers are picking one
  // that is already in the list, and two text fields above it is noise.
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEdition, setNewEdition] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [nextRefs, nextBooks, allowed] = await Promise.all([
        pageRefsFor(question, rawQuestion),
        listBooks(),
        canContribute(),
      ]);
      setRefs(nextRefs);
      setBooks(nextBooks);
      setMayContribute(allowed);
      // Their own book first — that is the whole point of having chosen one.
      setBookId(
        previous =>
          previous ??
          (myBookId && nextBooks.some(b => b.id === myBookId)
            ? myBookId
            : nextBooks[0]?.id ?? null),
      );
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [question, rawQuestion, myBookId]);

  useEffect(() => {
    if (visible) {
      void refresh();
    }
  }, [visible, refresh]);

  const createBook = useCallback(async () => {
    // A press that begins inside the keyboard's inset is spent dismissing it,
    // so the commit never arrives. Dismiss first, then commit.
    Keyboard.dismiss();
    setError(null);
    setBusy(true);
    try {
      const book = await addBook(newName, newEdition);
      if (!book) {
        setError(
          mayContribute
            ? 'Give the book a name of at least two characters.'
            : 'Sign in with Google to add a book.',
        );
        return;
      }
      setBooks(previous =>
        previous.some(b => b.id === book.id) ? previous : [...previous, book],
      );
      setBookId(book.id);
      setSetting('myBookId', book.id);
      setSetting(
        'myBookLabel',
        book.edition ? `${book.name} ${book.edition}` : book.name,
      );
      setAdding(false);
      setNewName('');
      setNewEdition('');
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }, [newName, newEdition, mayContribute]);

  const submit = useCallback(async () => {
    Keyboard.dismiss();
    setError(null);
    if (!bookId) {
      setError('Choose a book first.');
      return;
    }
    setBusy(true);
    try {
      const message = await submitPageRef(question, bookId, Number(page));
      if (message) {
        setError(message);
        return;
      }
      setPage('');
      await refresh();
      onChanged?.();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }, [bookId, page, question, refresh, onChanged]);

  const withdraw = useCallback(
    async (ref: PageRef) => {
      setBusy(true);
      try {
        await withdrawPageRef(question, ref.bookId);
        await refresh();
        onChanged?.();
      } catch (err) {
        setError(String(err));
      } finally {
        setBusy(false);
      }
    },
    [question, refresh, onChanged],
  );

  const selected = books.find(b => b.id === bookId) ?? null;

  return (
    <Sheet visible={visible} onClose={onClose} title="Textbook page">
      <Text style={[styles.blurb, { color: colors.textMuted }]}>
        A page number appears for everyone once {PAGE_REF_QUORUM} readers have
        entered the same one for the same book and edition.
      </Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : null}

      {/* What is already claimed for this question. */}
      {refs.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            ENTERED SO FAR
          </Text>
          {refs.map((ref, index) => (
            <ClaimRow
              key={`${ref.bookId}:${ref.page}`}
              claim={ref}
              index={index}
              onWithdraw={() => void withdraw(ref)}
            />
          ))}
        </View>
      ) : null}

      {/* Contributing, or the reason you cannot. */}
      {!mayContribute ? (
        <Text style={[styles.notice, { color: colors.textMuted }]}>
          You can read page numbers without an account. Adding one needs a
          Google sign-in, so that {PAGE_REF_QUORUM} agreeing readers really are{' '}
          {PAGE_REF_QUORUM} different people.
        </Text>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textMuted }]}>
              YOUR BOOK
            </Text>
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Picking one keeps it: question rows then show its page, not
              another book's.
            </Text>
            <View style={styles.bookWrap}>
              {books.map(book => {
                const on = book.id === bookId;
                return (
                  <Touchable
                    key={book.id}
                    label={`Use ${book.name} ${book.edition} as your textbook`}
                    state={{ selected: on }}
                    onPress={() => {
                      setBookId(book.id);
                      // Remember it: this is the book the row chips will use.
                      setSetting('myBookId', book.id);
                      setSetting(
                        'myBookLabel',
                        book.edition ? `${book.name} ${book.edition}` : book.name,
                      );
                    }}
                    style={[
                      styles.bookChip,
                      {
                        backgroundColor: on ? colors.primary : colors.cardElevated,
                        borderColor: on ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <BookOpen
                      size={13}
                      color={on ? colors.primaryText : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.bookChipText,
                        { color: on ? colors.primaryText : colors.text },
                      ]}
                    >
                      {book.name}
                      {book.edition ? ` · ${book.edition}` : ''}
                    </Text>
                  </Touchable>
                );
              })}
              <Touchable
                label={adding ? 'Cancel adding a book' : 'Add a book'}
                state={{ expanded: adding }}
                onPress={() => setAdding(v => !v)}
                style={[
                  styles.bookChip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Plus size={13} color={colors.textMuted} />
                <Text style={[styles.bookChipText, { color: colors.text }]}>
                  {adding ? 'Cancel' : 'Add a book'}
                </Text>
              </Touchable>
            </View>
          </View>

          {adding ? (
            <View style={styles.section}>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Book name, e.g. Robbins Basic Pathology"
                placeholderTextColor={colors.textMuted}
                maxLength={120}
                accessibilityLabel="Book name"
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.cardElevated,
                    borderColor: colors.border,
                  },
                ]}
              />
              {/* The edition is part of the book, not a detail about it: page
                341 of the 9th is not page 341 of the 10th. */}
              <TextInput
                value={newEdition}
                onChangeText={setNewEdition}
                placeholder="Edition, e.g. 10th"
                placeholderTextColor={colors.textMuted}
                maxLength={60}
                accessibilityLabel="Edition"
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.cardElevated,
                    borderColor: colors.border,
                  },
                ]}
              />
              <Touchable
                label="Save this book"
                onPress={() => void createBook()}
                disabled={busy}
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              >
                <Text
                  style={[styles.primaryButtonText, { color: colors.primaryText }]}
                >
                  Save book
                </Text>
              </Touchable>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textMuted }]}>
              PAGE NUMBER
            </Text>
            <TextInput
              value={page}
              onChangeText={setPage}
              placeholder={selected ? `Page in ${selected.name}` : 'Page number'}
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={4}
              accessibilityLabel="Page number"
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.cardElevated,
                  borderColor: colors.border,
                },
              ]}
            />
            <Touchable
              label="Submit this page number"
              onPress={() => void submit()}
              disabled={busy || !bookId || page.trim() === ''}
              style={[
                styles.primaryButton,
                {
                  backgroundColor:
                    busy || !bookId || page.trim() === ''
                      ? colors.cardElevated
                      : colors.primary,
                },
              ]}
            >
              <Check
                size={15}
                color={
                  busy || !bookId || page.trim() === ''
                    ? colors.textMuted
                    : colors.primaryText
                }
              />
              <Text
                style={[
                  styles.primaryButtonText,
                  {
                    color:
                      busy || !bookId || page.trim() === ''
                        ? colors.textMuted
                        : colors.primaryText,
                  },
                ]}
              >
                Submit page
              </Text>
            </Touchable>
          </View>
        </>
      )}

      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.error, { color: colors.danger }]}
        >
          {error}
        </Text>
      ) : null}
    </Sheet>
  );
}

/**
 * One claim — a book, a page, and how close it is to being shown to everybody.
 *
 * It has an entrance because it arrives: the claims are fetched after the sheet
 * is already open, so without one the list of what other readers have said
 * appears between two frames with nothing to say it just got here. The row
 * rises 10dp and fades, `EASE.out` (entrances never ease in), staggered by 45ms
 * so three claims read as one arrival and not a queue — and the segments fill
 * behind it, half a beat later, which is the rule drawing itself.
 *
 * Only opacity and transform, so it runs on the native driver: the sheet opens
 * while `pageRefsFor` and `listBooks` are still resolving, and a busy JS thread
 * must not be able to stutter it. Under reduced motion the row is simply there,
 * fully drawn, and the pips are not asked to fill.
 *
 * Exported for `?screen=quorumdemo` in the preview, which is the only way this
 * row can be photographed: its data comes from Supabase and no agent sandbox
 * can reach it. The demo mounts *this* component against fixed claims rather
 * than a copy of its markup — a fixture that duplicates a renderer is a fixture
 * that can agree with a bug, which is how the notes screen once shipped
 * `[object Object]` while the demo looked perfect.
 */
export function ClaimRow({
  claim,
  index,
  onWithdraw,
}: {
  claim: PageRef;
  index: number;
  onWithdraw: () => void;
}) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  // Never from 0: it starts at 1 under reduced motion and 0 opacity otherwise,
  // and nothing here is scaled at all.
  const enter = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      enter.setValue(1);
      return;
    }
    const animation = Animated.timing(enter, {
      toValue: 1,
      duration: DURATION.base,
      easing: EASE.out,
      delay: index * 45,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [enter, index, reduceMotion]);

  return (
    <Animated.View
      style={[
        styles.refRow,
        {
          backgroundColor: colors.cardElevated,
          borderColor: claim.confirmed ? colors.success : colors.border,
          opacity: enter,
          transform: [
            {
              translateY: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.refBody}>
        <Text style={[styles.refBook, { color: colors.text }]}>
          {claim.bookName}
          {claim.edition ? ` · ${claim.edition}` : ''}
        </Text>
        <View style={styles.refStateRow}>
          <Text style={[styles.refPage, { color: colors.text }]}>
            p.{claim.page}
          </Text>
          <QuorumPips
            votes={claim.votes}
            quorum={PAGE_REF_QUORUM}
            enterDelay={index * 45 + Math.round(DURATION.base / 2)}
          />
          <Text
            style={[
              styles.refState,
              { color: claim.confirmed ? colors.success : colors.textMuted },
            ]}
          >
            {claim.confirmed ? 'Shown to everyone' : 'Needs more readers'}
          </Text>
        </View>
      </View>
      {claim.mine ? (
        <Touchable
          label={`Withdraw your page ${claim.page} for ${claim.bookName}`}
          onPress={onWithdraw}
          style={styles.iconButton}
        >
          <Trash2 size={16} color={colors.danger} />
        </Touchable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  blurb: {
    ...typeScale.footnote,
    marginBottom: 12,
  },
  loader: {
    marginVertical: 12,
  },
  section: {
    marginBottom: 16,
    gap: 8,
  },
  label: {
    ...typeScale.overline,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  refBody: {
    flex: 1,
    gap: 2,
  },
  refBook: {
    ...typeScale.callout,
    fontWeight: '700',
  },
  refState: {
    ...typeScale.caption,
    flexShrink: 1,
  },
  refStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  refPage: {
    ...typeScale.caption,
    fontWeight: '800',
  },
  hint: {
    ...typeScale.caption,
    marginTop: -2,
  },
  iconButton: {
    padding: 6,
  },
  notice: {
    ...typeScale.footnote,
    marginBottom: 12,
  },
  bookWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bookChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bookChipText: {
    ...typeScale.caption,
    fontWeight: '700',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    ...typeScale.body,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 13,
  },
  primaryButtonText: {
    ...typeScale.callout,
    fontWeight: '800',
  },
  error: {
    ...typeScale.footnote,
    marginTop: 4,
  },
});
