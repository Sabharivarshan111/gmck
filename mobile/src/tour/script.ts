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

/**
 * The card shown when somebody presses Skip, before the tour actually ends.
 *
 * Skipping used to end it outright, and the only place that said the tour can
 * be replayed was the *hint* on the Skip button — which is spoken by TalkBack
 * and read by nobody else. So the reader who most needed to know where the
 * walkthrough lives was the one guaranteed not to be told.
 *
 * This is one card, and it spotlights the real Settings button while it says
 * so, because "in Settings" is a sentence and a ring round the actual control
 * is an answer. Pressing Skip again from here ends it — the second press is
 * unambiguous, and nobody is trapped.
 *
 * It is deliberately NOT part of `STEPS`: it has no chapter, it must never
 * appear in the replay list, and it would otherwise change every "N of 18"
 * in the run.
 */
export const SKIP_FAREWELL: TourStep = {
  id: 'farewell',
  chapter: 'welcome',
  title: 'It lives in here',
  body:
    'No problem. The walkthrough is in Settings whenever you want it — and you can replay just one part of it, ' +
    'so you never have to sit through the whole thing again.',
  tab: 'Home',
  target: 'Settings',
  cta: 'Got it',
};

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
      'and you can attach a photo, a video, a recording or a PDF to any note. ' +
      'Paste a video link and it plays inside the note rather than sending you to another app.',
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
      'Tap here for cards built from any chapter — theory on one side, the diagram on the other. ' +
      'They come back on the same spacing algorithm Anki uses, so you see a card just before you would forget it.',
    tab: 'Notes',
    target: 'Anki-style flashcards, browse decks by year',
    tapToAdvance: true,
  },
  /*
   * Drawing on a PDF is a second verb on a file that already had one, and the
   * row that offers it is below the row that opens it — so it is easy to miss
   * entirely if nothing says it is there.
   */
  {
    id: 'pdf-draw',
    chapter: 'notes',
    title: 'Mark up a PDF',
    body:
      'A PDF in a note has a second row with a pencil on it. ' +
      'Highlight, circle and write on the pages — the file itself is never changed.',
  },
  {
    id: 'anki-import',
    chapter: 'notes',
    title: 'Already have an Anki deck?',
    body:
      'Open it here and it just works — your senior\'s deck, one off AnkiWeb, or your own export. ' +
      'Pictures and audio come with it, and the whole deck stays on this phone.',
    tab: 'Notes',
  },
  {
    id: 'anki-own',
    chapter: 'notes',
    title: 'Or write your own',
    body:
      'Make a deck by hand, add a photo from your gallery to any card, and share the finished deck as a file. ' +
      'It exports in the oldest Anki format on purpose, so whoever you send it to can open it.',
    tab: 'Notes',
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
    title: 'Your own music, while you work',
    body:
      'Tap the music button for the player. It plays files already on this phone — nothing streams, nothing uploads, ' +
      'and no account is asked for.',
    tab: 'Timer',
    target: 'Show the music player',
    tapToAdvance: true,
  },
  {
    id: 'music-add',
    chapter: 'focus',
    title: 'Adding a track',
    body:
      'Press + in the player, choose whether to copy the file into Orbit or just link to it, and pick it from your phone. ' +
      'Put your music in one folder first — the picker reopens wherever you were last.',
    tab: 'Timer',
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
      'Behind the same button. Set a picture or a video from your phone and the Home cards turn to glass over it — ' +
      'on Android 13 and up they actually bend what is behind them. ' +
      'It stays on Home: a photo behind a question list competes with the question.',
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
  /*
   * There is no Calendar tab any more.
   *
   * It was a month grid you could pin a note to, and it became the attendance
   * tracker. This step used to point at it by name, which meant the spotlight
   * had nothing to find and the step lost its arrow while still telling the
   * reader to tap something. `check:tour` is what caught it — it matches every
   * `target` against the accessibility labels that exist in `src/`, so a
   * renamed control cannot quietly orphan a step.
   *
   * The exam countdown did not move: it is on the Stats tab, where it always
   * was, so the step now says where it actually is.
   */
  {
    id: 'exam',
    chapter: 'progress',
    title: 'Put your exam in',
    body:
      'Scroll down the Stats tab and you can enter your exam name and date, and it counts down to it. ' +
      'Your own dates stay on this phone — they are never uploaded anywhere.',
    tab: 'Progress',
    target: 'Stats',
    tapToAdvance: true,
  },
  /*
   * The exam pill went on the Timer, and a reader who has never set a date
   * would not know the feature exists — the strip it replaced only appeared
   * once one WAS set. A step that points at the control is the cheapest fix
   * for that, and it is the same defect the note card had.
   */
  {
    id: 'exam-pill',
    chapter: 'progress',
    title: 'Or set it from the Timer',
    body:
      'There is a pill under the timer controls that does the same thing. ' +
      'Tap it to open, and there is a button to put it away again.',
    tab: 'Timer',
    target: 'Set an exam date',
    tapToAdvance: true,
  },
  {
    id: 'attendance',
    chapter: 'progress',
    title: 'And your attendance',
    body:
      'Add your subjects and clinical postings, then tap Present or Absent after each one. ' +
      'Orbit works out how many more you can miss and still be above your target — and it never rounds up. ' +
      'This stays on your phone too.',
    tab: 'Progress',
    target: 'Attendance',
    tapToAdvance: true,
  },
  /*
   * The posting form stopped asking "how many days does it run?" and started
   * asking for two dates on a calendar. Anybody who used the old one is
   * looking for a box that is no longer there, which is exactly what a tour
   * step is for.
   */
  {
    id: 'posting-calendar',
    chapter: 'progress',
    title: 'A posting is two dates',
    body:
      'Tap the first day and the last day on the calendar, and Orbit counts the days between them. ' +
      'Tick Sundays off if your posting does not run then, and tap any holiday to take it out too.',
    tab: 'Progress',
    target: 'Clinical postings',
  },
  {
    id: 'attendance-dates',
    chapter: 'progress',
    title: 'Exams, posting exams and seminars',
    body:
      'Add anything with a date and Orbit counts down to it. ' +
      'The evening reminder tells you about whichever one is soonest.',
    tab: 'Progress',
    target: 'Add an exam or seminar date',
  },
  /*
   * Spaced revision had no step, and it is the card at the top of My Progress
   * — above the tabs, which is where it was deliberately moved so that a
   * reader on Attendance or Notes can still see that something is due.
   *
   * It also needs explaining more than anything else on that screen, because
   * the commonest misreading of it is that it does nothing: nothing is
   * scheduled until you tick a question off, so a reader who has ticked
   * nothing sees an empty Revise button and concludes the feature is broken.
   * The card says "Tick a question off to start revising it" for that reason,
   * and so does this.
   */
  {
    id: 'spaced',
    chapter: 'progress',
    title: 'What to revise today',
    body:
      'Tick a question off and Orbit schedules it to come back — tomorrow, then in six days, then a week, then a month. ' +
      'Miss one and it returns the next day. Nothing is scheduled until you tick something, so this sits empty until you do.',
    tab: 'Progress',
    target: 'Start revising',
    tapToAdvance: true,
  },
  {
    id: 'progress-detail',
    chapter: 'progress',
    title: 'What My Progress keeps',
    body:
      'A ring per subject so you can see the weak one at a glance, a heatmap of every day you studied, ' +
      'your streak and XP, and a leaderboard for your year.',
    tab: 'Progress',
  },
  {
    id: 'reminders-open',
    chapter: 'progress',
    title: 'Last thing: the evening reminder',
    body:
      'Tap Settings — the sliders button in the top right. This is the only notification Orbit ever sends.',
    tab: 'Home',
    target: 'Settings',
    tapToAdvance: true,
  },
  /*
   * Before the bell, not after it.
   *
   * `reminders-bell` carries `cta: 'Finish'` because it was written as the
   * LAST step, so its button reads "Finish: step N of M". Putting anything
   * after it left that label matching nothing a reader — or `check:smoke` —
   * recognises as a way forward, and the walkthrough dead-ended one step from
   * the end.
   *
   * It also reads better here: open the settings, see what you can set, then
   * turn it on. Finishing on the action is the right last beat.
   */
  {
    id: 'reminder-timing',
    chapter: 'progress',
    title: 'And when it reaches you',
    body:
      'Two sliders: the hour it checks, and how many days before a date it starts counting down. ' +
      'That second one covers your exam and anything you added under Attendance.',
    tab: 'Home',
  },
  {
    id: 'reminders-bell',
    chapter: 'progress',
    title: 'Now turn on Daily reminder',
    body:
      'Under NOTIFICATIONS. It says how many days to your exam, what revision is due and when your streak is about to break — ' +
      'at an hour you pick, and only when it has something to say.',
    tab: 'Home',
    target: 'Daily reminder (notifications)',
    tapToAdvance: true,
    cta: 'Finish',
  },
];

/**
 * Every control the script points at. `Touchable` checks this on layout.
 *
 * `SKIP_FAREWELL` is in here explicitly rather than left out because its
 * target happens to be named by another step too. It does today, and a set
 * built from `STEPS` alone would therefore have worked — right up until the
 * reminders step stopped pointing at Settings, at which point Skip would have
 * silently degraded to a centred card with no ring and nothing saying where
 * the walkthrough lives, which is the one thing that card exists to show.
 */
export const TOUR_TARGETS: ReadonlySet<string> = new Set(
  [...STEPS, SKIP_FAREWELL]
    .map(step => step.target)
    .filter((label): label is string => Boolean(label)),
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
