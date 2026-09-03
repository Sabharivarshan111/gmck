import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/**
 * The settings a user can change, in one store.
 *
 * A plain module with a listener set rather than a context, for the same
 * reason `progress.ts` is: `Touchable` reads this on every press, and there is
 * a Touchable in every row of a five-hundred-row list. A context whose value
 * changed would re-render all of them; a store they subscribe to individually
 * re-renders only what actually depends on the value.
 */

const KEY = 'orbit:settings-v1';

export interface Settings {
  /** Whether the app vibrates at all. */
  haptics: boolean;
  /**
   * How hard, 0–1.
   *
   * This is a *duration*, not an amplitude. React Native's core Vibration API
   * has no amplitude control — that needs a native module — so "stronger"
   * means "longer", from a tick you half-notice to one you cannot miss. The
   * range is deliberately small: past about 30ms a tap stops feeling like a
   * tap and starts feeling like an alert.
   */
  hapticStrength: number;
  /** Whether a press makes a sound. */
  tapSound: boolean;
  /** Whether a finished focus session makes a sound. */
  timerSound: boolean;
  /** Which press sound. See TAP_PRESETS. */
  tapPreset: string;
  /** Which completion sound. See CHIME_PRESETS. */
  chimePreset: string;
  /**
   * How loud the completion sound is, 0–1.
   *
   * Separate from the phone's volume because this one clip is the only thing
   * in the app loud enough to matter: it fires when you are not looking at the
   * screen, and the right level in a library is the wrong one in a kitchen.
   */
  chimeVolume: number;
  /** Whether the phone buzzes when a session ends, independently of tap haptics. */
  timerVibration: boolean;
  /**
   * How many *new* flashcards a day a deck will hand out.
   *
   * Anki's own default is 20, and the number matters more than it looks: the
   * cap is most of what makes spaced repetition work. Twenty new cards a day
   * is a habit; a 50-card chapter in one sitting is an evening that happens
   * once and never again, and it lands every one of those cards back on the
   * same future day.
   *
   * It is adjustable because whose habit it is is not the app's call — someone
   * a week from an exam is in a different situation from someone in October.
   * The default stays Anki's.
   */
  newCardsPerDay: number;
  /**
   * Seconds allowed per flashcard, or 0 for no timer.
   *
   * A pacing aid, not a test: it counts down beside the card and turns amber
   * when it runs out, and **nothing happens** when it does. Auto-advancing
   * would be the obvious next step and it is the wrong one — spaced repetition
   * only works if you grade honestly, and a card that flips itself has graded
   * for you.
   *
   * Off by default. A clock on a revision card is pressure, and pressure is a
   * choice the reader makes for themselves, usually in the last fortnight
   * before an exam.
   */
  cardSeconds: number;
  /**
   * One study reminder a day.
   *
   * Off by default. A notification is the most intrusive thing this app can
   * do — louder than a sound, which is already off by default for being
   * public — and an app that starts posting to someone's lock screen because
   * they installed it has made a decision that was not its to make. It is one
   * tap to turn on, in the same place as everything else adjustable.
   */
  dailyReminder: boolean;
  /** Hour of day, 0–23, the reminder check runs. */
  reminderHour: number;
  /**
   * Which reminders are allowed, individually.
   *
   * Three switches rather than one, because they are three different bargains.
   * Someone revising for an exam next week wants the countdown and may not care
   * about a streak; someone using spaced revision daily wants the due queue and
   * nothing else. One switch forces them to take all three or none, and the
   * usual answer to that is none.
   *
   * All on when the master switch is on — the ladder already fires at most one
   * a day, so the defaults are not a volume decision, just a scope one.
   */
  remindExam: boolean;
  remindStreak: boolean;
  remindRevision: boolean;
  /**
   * Whether question rows show a textbook page reference.
   *
   * Off by default, and it is a *toggle* rather than something always on for
   * the reason the feature exists at all: a page number is only worth anything
   * to somebody holding that book. For everyone else it is a number taking up
   * a line on every row of a five-hundred-row list.
   *
   * Turning it on is also what makes a row fetch — nothing asks the network
   * about page references until somebody says they want them.
   */
  showPageRefs: boolean;
  /**
   * The book this reader actually owns, as a `reference_books` id.
   *
   * A page number is only worth anything to somebody holding that book, so the
   * row chip shows the page for THIS book. Without it the chip showed whichever
   * book had the most votes, which means a reader holding Robbins was being
   * given a page in Harrison — a number that is not wrong so much as useless,
   * and worse, indistinguishable from a useful one.
   *
   * Empty means "no book chosen": the chip then falls back to the
   * best-supported book and names it, which is the honest version of not
   * knowing.
   */
  myBookId: string;
  /** The chosen book's name, cached so a chip can render before any fetch. */
  myBookLabel: string;
}

/**
 * The clips that ship, and the names the native module knows them by.
 *
 * The `id` is the resource name — `mobile/scripts/make-sounds.py` writes
 * `<id>.wav`, SoundModule loads it as `R.raw.<id>`, and sound.ts plays it by
 * this same string. Adding one means touching all four, which is what
 * `npm run check:sounds` verifies.
 */
export const TAP_PRESETS: { id: string; label: string; detail: string }[] = [
  { id: 'tap', label: 'Click', detail: 'The default — short and bright' },
  { id: 'tap_soft', label: 'Soft', detail: 'Lower and rounder' },
  { id: 'tap_crisp', label: 'Crisp', detail: 'Dry and high, easier to hear in a pocket' },
];

export const CHIME_PRESETS: { id: string; label: string; detail: string }[] = [
  { id: 'chime', label: 'Chime', detail: 'Three notes rising — the default' },
  { id: 'chime_bell', label: 'Bell', detail: 'One struck note, carries further' },
  { id: 'chime_digital', label: 'Digital', detail: 'Three flat beeps, like a kitchen timer' },
  { id: 'chime_soft', label: 'Soft', detail: 'Two quiet notes, for shared rooms' },
];

const TAP_IDS = TAP_PRESETS.map(preset => preset.id);
const CHIME_IDS = CHIME_PRESETS.map(preset => preset.id);

export const DEFAULT_SETTINGS: Settings = {
  // On by default because it was asked for. The bar the rest of the app holds
  // — feedback only on a commit or a completion — is still what decides
  // *where* it fires; this decides whether it fires at all.
  haptics: true,
  hapticStrength: 0.4,
  // On by default, because it was asked for as "a sound effect every time the
  // user clicks". The reservation is real — a vibration is private and a sound
  // is not, and a phone that starts clicking in a lecture theatre is a bad
  // first impression — which is why it is the first switch in Settings and
  // takes one tap to silence, rather than something to go looking for.
  /*
   * Off. A vibration is private; a sound is not.
   *
   * An app that starts clicking out loud the first time it is opened — in a
   * lecture, in a library, on a ward — has made a decision that was not its to
   * make, and the reader's first act has to be finding the switch that stops
   * it. This flipped to `true` in the commit that fixed the silent sound
   * module, which is exactly when a default like this slips: the module was
   * finally audible and turning it on was the quickest way to hear it.
   * check:native-sound pins it.
   */
  tapSound: false,
  timerSound: true,
  tapPreset: 'tap',
  chimePreset: 'chime',
  chimeVolume: 0.85,
  dailyReminder: false,
  // Early evening: after classes, before the night's studying is decided.
  reminderHour: 19,
  remindExam: true,
  remindStreak: true,
  remindRevision: true,
  // Off: only useful to a reader holding that particular book, and it is what
  // gates the network call.
  showPageRefs: false,
  myBookId: '',
  myBookLabel: '',
  // On by default: the point of the alert is to reach someone who has stopped
  // looking at the screen, and a phone face-down on a desk is silent but not
  // still.
  timerVibration: true,
  // Anki's default, and a deliberate one — see the field's note.
  newCardsPerDay: 20,
  cardSeconds: 0,
};

/**
 * The pacing range, in seconds per card.
 *
 * 0 is off and is its own detent. Above that the floor is 15 seconds — below
 * that nobody is recalling anything, they are reading — and the ceiling is 120,
 * past which a per-card clock has stopped being a pace and become a nap. The
 * detents are the round numbers people actually think in: half a minute, a
 * minute, two.
 */
export const CARD_SECONDS_MAX = 120;
export const CARD_SECONDS_STEP = 15;

/**
 * The range the slider offers.
 *
 * The floor is 5 rather than 1 because a deck that hands out one card a day is
 * indistinguishable from a broken one. The ceiling is MAX_DECK_CARDS, since
 * past that the cap stops capping anything: the largest deck the generator will
 * build is 50 cards, and a limit above that just means "all of them".
 */
export const NEW_PER_DAY_MIN = 5;
export const NEW_PER_DAY_MAX = 50;

export const HAPTIC_MIN_MS = 6;
export const HAPTIC_MAX_MS = 28;

let current: Settings = DEFAULT_SETTINGS;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

/** Called once at launch, before the first render that matters. */
export async function hydrateSettings(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw) as Partial<Settings>;
    current = {
      haptics: typeof parsed.haptics === 'boolean' ? parsed.haptics : DEFAULT_SETTINGS.haptics,
      hapticStrength:
        typeof parsed.hapticStrength === 'number' && Number.isFinite(parsed.hapticStrength)
          ? Math.max(0, Math.min(1, parsed.hapticStrength))
          : DEFAULT_SETTINGS.hapticStrength,
      tapSound:
        typeof parsed.tapSound === 'boolean' ? parsed.tapSound : DEFAULT_SETTINGS.tapSound,
      timerSound:
        typeof parsed.timerSound === 'boolean' ? parsed.timerSound : DEFAULT_SETTINGS.timerSound,
      // Validated against what actually ships: a preset removed in a later
      // release must fall back to the default rather than name a clip the
      // native side cannot load, which would be silence with no explanation.
      tapPreset:
        typeof parsed.tapPreset === 'string' && TAP_IDS.includes(parsed.tapPreset)
          ? parsed.tapPreset
          : DEFAULT_SETTINGS.tapPreset,
      chimePreset:
        typeof parsed.chimePreset === 'string' && CHIME_IDS.includes(parsed.chimePreset)
          ? parsed.chimePreset
          : DEFAULT_SETTINGS.chimePreset,
      chimeVolume:
        typeof parsed.chimeVolume === 'number' && Number.isFinite(parsed.chimeVolume)
          ? Math.max(0, Math.min(1, parsed.chimeVolume))
          : DEFAULT_SETTINGS.chimeVolume,
      timerVibration:
        typeof parsed.timerVibration === 'boolean'
          ? parsed.timerVibration
          : DEFAULT_SETTINGS.timerVibration,
      // Clamped rather than trusted: a stored 0 would hand out no new cards at
      // all, which is a deck that looks empty for no stated reason.
      newCardsPerDay:
        typeof parsed.newCardsPerDay === 'number' && Number.isFinite(parsed.newCardsPerDay)
          ? Math.round(Math.max(NEW_PER_DAY_MIN, Math.min(NEW_PER_DAY_MAX, parsed.newCardsPerDay)))
          : DEFAULT_SETTINGS.newCardsPerDay,
      cardSeconds:
        typeof parsed.cardSeconds === 'number' && Number.isFinite(parsed.cardSeconds)
          ? Math.round(Math.max(0, Math.min(CARD_SECONDS_MAX, parsed.cardSeconds)))
          : DEFAULT_SETTINGS.cardSeconds,
      dailyReminder:
        typeof parsed.dailyReminder === 'boolean'
          ? parsed.dailyReminder
          : DEFAULT_SETTINGS.dailyReminder,
      reminderHour:
        typeof parsed.reminderHour === 'number' && Number.isFinite(parsed.reminderHour)
          ? Math.max(0, Math.min(23, Math.round(parsed.reminderHour)))
          : DEFAULT_SETTINGS.reminderHour,
      remindExam:
        typeof parsed.remindExam === 'boolean' ? parsed.remindExam : DEFAULT_SETTINGS.remindExam,
      remindStreak:
        typeof parsed.remindStreak === 'boolean'
          ? parsed.remindStreak
          : DEFAULT_SETTINGS.remindStreak,
      remindRevision:
        typeof parsed.remindRevision === 'boolean'
          ? parsed.remindRevision
          : DEFAULT_SETTINGS.remindRevision,
      showPageRefs:
        typeof parsed.showPageRefs === 'boolean'
          ? parsed.showPageRefs
          : DEFAULT_SETTINGS.showPageRefs,
      myBookId:
        typeof parsed.myBookId === 'string' ? parsed.myBookId : DEFAULT_SETTINGS.myBookId,
      myBookLabel:
        typeof parsed.myBookLabel === 'string'
          ? parsed.myBookLabel
          : DEFAULT_SETTINGS.myBookLabel,
    };
    emit();
  } catch {
    // A corrupt entry should not stop the app starting.
  }
}

/** Read without subscribing. For code paths that are not React. */
export function getSettings(): Settings {
  return current;
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  if (current[key] === value) {
    return;
  }
  current = { ...current, [key]: value };
  emit();
  AsyncStorage.setItem(KEY, JSON.stringify(current)).catch(() => {});
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, getSettings);
}
