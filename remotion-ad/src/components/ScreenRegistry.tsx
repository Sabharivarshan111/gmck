import { staticFile } from 'remotion';

/**
 * Every screen key a script may name, and the file it resolves to.
 *
 * Two kinds, and they are composited differently:
 *
 * - `screen` is a phone screenshot. It renders *inside* the device at its
 *   natural aspect, never scaled or translated to fake a camera move — the
 *   device moves, the screen does not.
 * - `plate` is a medical diagram from the `diagrams` bucket. It fills the frame
 *   as a lit card, because a plate is the subject of its shot, not a thing
 *   being viewed on a phone.
 *
 * `scripts/preflight.mjs` asserts every file here exists before a render is
 * allowed to start. A missing asset must stop the build, not render a grey box
 * reading "this diagram could not be loaded" into a finished ad.
 */
export type ScreenKind = 'screen' | 'plate';

export interface ScreenAsset {
  kind: ScreenKind;
  file: string;
}

export const SCREENS: Record<string, ScreenAsset> = {
  // --- app screens, captured by mobile/preview/shoot.mjs -------------------
  home: { kind: 'screen', file: 'app_screens/home.png' },
  homeLight: { kind: 'screen', file: 'app_screens/home-light.png' },
  glassHome: { kind: 'screen', file: 'app_screens/glass-home.png' },
  browse: { kind: 'screen', file: 'app_screens/browse.png' },
  questions: { kind: 'screen', file: 'app_screens/questions.png' },

  noteHero: { kind: 'screen', file: 'app_screens/notes-renderer.png' },
  noteBody: { kind: 'screen', file: 'app_screens/notes-renderer.png' },
  noteBodyBottom: { kind: 'screen', file: 'app_screens/notes-renderer-bottom.png' },
  noteDiagram: { kind: 'screen', file: 'app_screens/single-note-diagram.png' },
  chapterDiagrams: { kind: 'screen', file: 'app_screens/chapter-diagrams.png' },

  askai: { kind: 'screen', file: 'app_screens/askai.png' },
  chatdemo: { kind: 'screen', file: 'app_screens/chatdemo.png' },
  flashcards: { kind: 'screen', file: 'app_screens/flashcards-decks.png' },
  ankiStudy: { kind: 'screen', file: 'app_screens/anki-study.png' },
  apkgHub: { kind: 'screen', file: 'app_screens/apkg-1-hub.png' },

  userNotes: { kind: 'screen', file: 'app_screens/notes.png' },
  userNotesEdit: { kind: 'screen', file: 'app_screens/usernotes-edit.png' },
  userNotesPreview: { kind: 'screen', file: 'app_screens/usernotes-preview.png' },

  timer: { kind: 'screen', file: 'app_screens/timer.png' },
  timerBottom: { kind: 'screen', file: 'app_screens/timer-bottom.png' },
  growth: { kind: 'screen', file: 'app_screens/growthshowcase.png' },
  treegallery: { kind: 'screen', file: 'app_screens/treegallery.png' },
  music: { kind: 'screen', file: 'app_screens/music-06-playing.png' },

  progress: { kind: 'screen', file: 'app_screens/progress.png' },
  progressBottom: { kind: 'screen', file: 'app_screens/progress-bottom.png' },

  // --- real plates, pulled from Supabase storage by scripts/fetch-plates ---
  plateBrachial: { kind: 'plate', file: 'app_screens/plate-brachial-plexus.jpg' },
  plateUlnar: { kind: 'plate', file: 'app_screens/plate-ulnar-nerve.jpg' },
  plateCalots: { kind: 'plate', file: 'app_screens/plate-calots-triangle.jpg' },
  plateShoulder: { kind: 'plate', file: 'app_screens/plate-shoulder-joint.jpg' },
};

export const screenAsset = (key: string): ScreenAsset => {
  const found = SCREENS[key];
  if (!found) {
    throw new Error(
      `Unknown screen "${key}". Add it to SCREENS — a script must never name an asset that does not exist.`,
    );
  }
  return found;
};

export const screenSrc = (key: string): string => staticFile(screenAsset(key).file);
