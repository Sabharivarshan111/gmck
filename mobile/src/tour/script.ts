/**
 * The first-run walkthrough, as data.
 *
 * ## Controls are addressed by their accessibility label
 *
 * A step says `target: 'Timer settings'` and the overlay finds that control,
 * measures it, and cuts a live hole over it. Nothing in any screen had to be
 * edited to make that work — `Touchable` registers itself when its label is
 * one the script asks for, which is one edit in one file.
 *
 * That choice is doing a second job. This repo already treats the
 * accessibility label as the app's stable handle on a control: `check:smoke`
 * drives the app by label on the grounds that "a control this script cannot
 * find is a control TalkBack cannot announce". A tour built the same way
 * cannot drift into pointing at something unlabelled, and `check:tour` fails
 * if a label named here does not exist in the source — which is how the
 * `Anki flashcards` → `Anki-style flashcards` rename would have been caught
 * the day it happened instead of by a 30-second click timeout weeks later.
 *
 * ## Length is the design problem, not the content
 *
 * The ask was "explain everything" and "don't make it long enough to tire
 * anyone", which are in tension, and the resolution is chapters. Eighteen
 * steps run about two minutes, but nobody experiences it as eighteen: the card
 * shows `FOCUS TIMER · 10 of 18`, so the end is always in sight, Skip is on
 * screen at every step rather than hidden behind a corner ×, and Settings can
 * replay any single chapter later. A reader who wants only the timer can have
 * only the timer.
 *
 * A step is at most a title and two sentences. The tour's job is to show
 * where things are and what a gesture does; it is not the manual.
 *
 * ## What may not appear in this file
 *
 * No textbook titles and no author names, anywhere, in any step. The notes
 * feature is grounded in a standard reference for each subject and the reader
 * is told exactly that much — the same rule the notes function follows in its
 * own prompt, and the same one `check:textbooks` enforces across every source
 * file, this one included. A student is studying, not being handed a
 * bibliography, and naming someone's book inside a shipped product is not
 * ours to do.
 */

export type ChapterId = 'welcome' | 'study' | 'notes' | 'focus' | 'look' | 'progress';

/** The tab a step's screen lives on, so Next can get there without being tapped. */
export type TabName = 'Home' | 'Notes' | 'Timer' | 'AskAI' | 'Progress';

export interface Chapter {
  id: ChapterId;
  /** Shown in the card's header, and in the replay list. */
  name: string;
  /** One line, for the replay list only. */
  blurb: string;
}

export const CHAPTERS: Chapter[] = [
  { id: 'welcome', name: 'Welcome', blurb: 'What Orbit is, in one screen' },
  { id: 'study', name: 'Studying', blurb: 'Subjects, the three taps, and rearranging Home' },
  { id: 'notes', name: 'Notes & cards', blurb: 'Handwritten notes, your own notes, flashcards' },
  { id: 'focus', name: 'Focus timer', blurb: 'Pomodoro, your own music, and the tree' },
  { id: 'look', name: 'Make it yours', blurb: 'Themes and wallpaper' },
  { id: 'progress', name: 'Progress', blurb: 'XP, your exam date, and reminders' },
];

export interface TourStep {
  id: string;
  chapter: ChapterId;
  title: string;
  /** Two sentences at most. */
  body: string;
  /**
   * The accessibility label of the control to spotlight.
   *
   * Omitted for steps that explain rather than point — the card centres itself
   * and the scrim is plain. A target that cannot be measured (its screen is
   * not showing, it scrolled away) degrades to exactly that, so a step is
   * never a dead end waiting for a control that is not there.
   */
  target?: string;
  /**
   * The target's accessibility role, when the label alone is ambiguous.
   *
   * `Ask AI` and `Timer` are the label of a bottom-bar **tab** and of a Home
   * quick action, and both are correct. Without this the tour drew its ring
   * over whichever registered first, which was always Home's.
   */
  targetRole?: string;
  /** Where the target lives, so Next can navigate before looking for it. */
  tab?: TabName;
  /**
   * Whether pressing the real control moves the tour on.
   *
   * True wherever the press does something worth seeing — opening the
   * pomodoro sheet, changing tab. The reader learns the control by using it
   * rather than by reading that it exists, and Next still works for anyone
   * who would rather just read.
   */
  tapToAdvance?: boolean;
  /** An interactive rehearsal rendered in the card instead of body text. */
  demo?: 'gestures';
  /** Overrides the primary button's wording. */
  cta?: string;
}

export const STEPS: TourStep[] = [
  // ---- Welcome -------------------------------------------------------------
  {
    id: 'welcome',
    chapter: 'welcome',
    title: 'Welcome to Orbit',
    body:
      'Your MBBS question bank, notes, flashcards and focus timer in one place. ' +
      'This takes about two minutes — you can skip it at any point, and replay it from Settings.',
    cta: 'Show me around',
  },

  // ---- Studying ------------------------------------------------------------
  {
    id: 'subjects',
    chapter: 'study',
    title: 'Your subjects live here',
    body:
      'Pick a year, then a subject, then a chapter to reach its questions. ' +
      'Hold any subject card and drag it to put your own order on them.',
    tab: 'Home',
    target: 'View all years',
  },
  {
    id: 'gestures',
    chapter: 'study',
    title: 'Every question does three things',
    body:
      'The circle ticks it done. Double tap the question for practice MCQs, triple tap it for a handwritten answer. ' +
      'Try all three below — this one is not real, so nothing is saved.',
    demo: 'gestures',
    tab: 'Home',
  },
  {
    id: 'rearrange',
    chapter: 'study',
    title: 'Home is yours to rearrange',
    body:
      'Hold any block until it lifts, then drag it where you want it. ' +
      'Each block also has a grip on its bottom edge — drag that to make it bigger or smaller.',
    tab: 'Home',
  },
  {
    id: 'askai',
    chapter: 'study',
    title: 'Ask anything',
    body:
      'Ask a question in your own words, or send one straight from the bank with a double tap. ' +
      'The little face is the assistant: it looks down while you type, thinks while it works, and dozes off when you leave.',
    tab: 'AskAI',
    target: 'Ask AI',
    targetRole: 'tab',
    tapToAdvance: true,
  },

  // ---- Notes & cards -------------------------------------------------------
  {
    id: 'notes-tab',
    chapter: 'notes',
    title: 'Notes written for the exam',
    body:
      'Pick a year, subject and chapter and Orbit writes a revision page from every past question in it, ' +
      'grounded in a standard reference for that subject, with the exam diagrams in line beside the answers.',
    tab: 'Notes',
    target: 'Notes',
    targetRole: 'tab',
    tapToAdvance: true,
  },
  {
    id: 'own-notes',
    chapter: 'notes',
    title: 'And notes you write yourself',
    body:
      'Under My Progress → Notes. Headings, bullets and highlights, handwriting with a stylus, ' +
      'and you can attach a photo, a video, a recording or a PDF to any note.',
  },
  {
    id: 'attachments',
    chapter: 'notes',
    title: 'Keep a copy, or just link it',
    body:
      'Attaching a lecture video asks you which: a copy survives you deleting the original but uses space, ' +
      'a link uses none and stops working if you move the file. Orbit says both before you choose.',
  },
  {
    id: 'flashcards',
    chapter: 'notes',
    title: 'Flashcards, scheduled properly',
    body:
      'Theory and diagram cards for any chapter, with the same spacing algorithm Anki uses. ' +
      'You can write your own decks, open an .apkg you already have, and share a deck you wrote as one.',
    tab: 'Notes',
    target: 'Anki-style flashcards, browse decks by year',
  },

  // ---- Focus timer ---------------------------------------------------------
  {
    id: 'timer',
    chapter: 'focus',
    title: 'A timer that keeps score',
    body:
      'Focus, short break and long break. Every finished session is counted towards your day.',
    tab: 'Timer',
    target: 'Timer',
    targetRole: 'tab',
    tapToAdvance: true,
  },
  {
    id: 'pomodoro-settings',
    chapter: 'focus',
    title: 'Set your own lengths',
    body:
      'Tap the arrowed button for the settings sheet: session length, break lengths, ' +
      'how many sessions before a long one, and the sound it makes when time is up.',
    tab: 'Timer',
    target: 'Timer settings',
    tapToAdvance: true,
  },
  {
    id: 'music',
    chapter: 'focus',
    title: 'Your own music while you work',
    body:
      'Play files that are already on your phone — put them in one folder first and picking them is quick. ' +
      'Nothing is streamed and nothing is uploaded; it plays what you chose and nothing else.',
    tab: 'Timer',
    target: 'Show the music player',
    tapToAdvance: true,
  },
  {
    id: 'tree',
    chapter: 'focus',
    title: 'A tree grows while you focus',
    body:
      'It grows for the whole session and is planted in your day when the time is up. ' +
      'Leave the app and it starts to wilt — the minutes still count, and twelve species unlock as yours add up.',
    tab: 'Timer',
  },

  // ---- Make it yours -------------------------------------------------------
  {
    id: 'themes',
    chapter: 'look',
    title: 'Four themes, or build one',
    body:
      'Dark, Light, Black Pink and Liquid Glass — or pick your own four colours and Orbit works out the rest. ' +
      'It warns you if your text stops being readable.',
    tab: 'Home',
    target: 'Themes',
    tapToAdvance: true,
  },
  {
    id: 'wallpaper',
    chapter: 'look',
    title: 'Your own wallpaper, photo or video',
    body:
      'Behind the same button. Set a picture or a video from your phone and the cards turn to glass over it — ' +
      'on Android 13 and up they actually bend what is behind them.',
    tab: 'Home',
  },

  // ---- Progress ------------------------------------------------------------
  {
    id: 'progress',
    chapter: 'progress',
    title: 'Everything you have done',
    body:
      'Ticking a question earns XP, which fills your level and your badges, and studying on consecutive days builds a streak. ' +
      'The heatmap shows which subjects you have been avoiding.',
    tab: 'Progress',
    target: 'My Progress',
    targetRole: 'tab',
    tapToAdvance: true,
  },
  {
    id: 'exam',
    chapter: 'progress',
    title: 'Put your exam in',
    body:
      'The Calendar tab takes your exam name and date and counts down to it. ' +
      'Your own dates stay on this phone — they are never uploaded anywhere.',
    tab: 'Progress',
    target: 'Calendar',
    tapToAdvance: true,
  },
  {
    id: 'reminders',
    chapter: 'progress',
    title: 'One reminder, in the evening',
    body:
      'Settings → Daily reminder. It tells you how many days are left before your exam, what revision is due, ' +
      'and when your streak is about to break — at an hour you choose, and only when it has something to say.',
    tab: 'Home',
    target: 'Settings',
    tapToAdvance: true,
    cta: 'Finish',
  },
];

/** Every control the script points at. `Touchable` checks this on layout. */
export const TOUR_TARGETS: ReadonlySet<string> = new Set(
  STEPS.map(step => step.target).filter((label): label is string => Boolean(label)),
);

export function chapterOf(id: ChapterId): Chapter {
  return CHAPTERS.find(chapter => chapter.id === id) ?? CHAPTERS[0];
}

/** The step indices belonging to one chapter, for the replay list. */
export function stepsIn(chapter: ChapterId): number[] {
  const out: number[] = [];
  STEPS.forEach((step, index) => {
    if (step.chapter === chapter) {
      out.push(index);
    }
  });
  return out;
}
