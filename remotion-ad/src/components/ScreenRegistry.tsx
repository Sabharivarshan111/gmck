import React from 'react';
import { staticFile } from 'remotion';

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
  // Final year, because it is the only year with six subjects. Second year
  // has three rows and then 40% of the screen is black, which in a wide
  // shot reads as an empty app while the voiceover claims 5,545 questions.
  browse: { kind: 'screen', file: 'app_screens/browse-final.png' },
  questions: { kind: 'screen', file: 'app_screens/questions.png' },
  questionsChapters: { kind: 'screen', file: 'app_screens/questions-chapters.png' },
  questionsLeaf: { kind: 'screen', file: 'app_screens/questions-leaf.png' },

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
  userNotesMedia: { kind: 'screen', file: 'app_screens/usernotes-preview.png' },

  themeCustomizer: { kind: 'screen', file: 'app_screens/home-edit.png' },
  wallpaperCustomizer: { kind: 'screen', file: 'app_screens/glass-home.png' },
  outroCard: { kind: 'screen', file: 'app_screens/glass-home.png' },

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
  plateCalots: { kind: 'plate', file: 'app_screens/calots_triangle_anatomy.jpg' },
  plateStomach: { kind: 'plate', file: 'app_screens/stomach_lymphatics_anatomy.jpg' },
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

interface CleanScreenProps {
  imageName: string;
}

// Clean, uncropped, pristine native screenshot framed in mobile viewport
export const PristineAppScreen: React.FC<CleanScreenProps> = ({ imageName }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#030712'
    }}
  >
    <img
      src={staticFile(`app_screens/${imageName}`)}
      alt="App Screen"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'top center',
        display: 'block'
      }}
    />
  </div>
);

// High-Yield Exam Note Screen with Real Hand-Drawn Medical Plates (Zero Watermarks)
interface DiagramCardProps {
  plateImage: string;
  subjectTitle: string;
  topicTitle: string;
  takeawayPoints: string[];
}

export const DiagramCardScreen: React.FC<DiagramCardProps> = ({
  plateImage,
  subjectTitle,
  topicTitle,
  takeawayPoints
}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#030712',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '48px 16px 20px 16px',
      color: '#f8fafc',
      boxSizing: 'border-box'
    }}
  >
    {/* Top Header */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13px', color: '#94a3b8' }}>←</span>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {subjectTitle}
        </span>
      </div>
      <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '3px 8px', borderRadius: '12px', fontWeight: 800 }}>
        HIGH-YIELD NOTE
      </span>
    </div>

    <div style={{ fontSize: '16px', fontWeight: 900, marginBottom: '12px', color: '#ffffff', lineHeight: 1.25 }}>
      {topicTitle}
    </div>

    {/* Real Hand-Drawn Anatomical Plate Card */}
    <div
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        borderRadius: '16px',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <img
        src={staticFile(`app_screens/${plateImage}`)}
        alt={topicTitle}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />
    </div>

    {/* Exam Key Takeaways */}
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '12px 14px',
        flex: 1
      }}
    >
      <div style={{ fontSize: '10px', fontWeight: 900, color: '#f59e0b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        ⭐ HIGHLY REPEATED EXAM ANCHORS
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {takeawayPoints.map((pt, i) => (
          <div key={i} style={{ fontSize: '11px', color: '#cbd5e1', display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: 1.3 }}>
            <span style={{ color: '#38bdf8', fontWeight: 900 }}>•</span>
            <span>{pt}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Real Interactive AI Professor Chat Screen (Pristine, no placeholder)
export const RealAiChatScreen: React.FC = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#030712',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '48px 16px 20px 16px',
      color: '#f8fafc',
      boxSizing: 'border-box'
    }}
  >
    {/* Header */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
          🧠
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>AI Medical Professor</div>
          <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>● Online 24/7 • Clinical Mode</div>
        </div>
      </div>
      <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '3px 8px', borderRadius: '8px', fontWeight: 700 }}>TNMGR GUIDE</span>
    </div>

    {/* Chat Dialogue Bubbles */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
      {/* Student Question */}
      <div style={{ alignSelf: 'flex-end', maxWidth: '82%', background: 'linear-gradient(135deg, #0284c7, #2563eb)', padding: '10px 14px', borderRadius: '16px 16px 4px 16px', color: '#ffffff', fontSize: '12px', lineHeight: 1.4, boxShadow: '0 4px 15px rgba(2, 132, 199, 0.3)' }}>
        Explain the boundaries of Calot's triangle and its surgical importance in laparoscopic cholecystectomy?
      </div>

      {/* AI Professor Response */}
      <div style={{ alignSelf: 'flex-start', maxWidth: '92%', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '12px 14px', borderRadius: '16px 16px 16px 4px', fontSize: '11.5px', lineHeight: 1.45, color: '#e2e8f0', boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ color: '#38bdf8', fontWeight: 800, marginBottom: '4px' }}>📌 Surgical Anatomy & Boundaries:</div>
        <div><strong>• Superior:</strong> Inferior border of Liver (Segment V)</div>
        <div><strong>• Medial:</strong> Common Hepatic Duct</div>
        <div><strong>• Lateral:</strong> Cystic Duct</div>
        <div style={{ marginTop: '6px', color: '#f59e0b', fontWeight: 700 }}>⭐ Critical Content: Cystic Artery & Lund's Node (Key landmark for safe dissection).</div>
      </div>
    </div>

    {/* Bottom Input Field */}
    <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '14px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Ask any clinical viva question...</span>
      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#030712', fontSize: '12px', fontWeight: 900 }}>
        ➤
      </div>
    </div>
  </div>
);

// SHOT 1: Real Glass Home Overview
export const Shot01_HookScreen: React.FC = () => <PristineAppScreen imageName="glass-home.png" />;

// SHOT 2: Clinical Precision Curriculum Explorer
export const Shot02_PrecisionScreen: React.FC = () => <PristineAppScreen imageName="home.png" />;

// SHOT 3: TN MGR University 4-Year Grid
export const Shot03_TNMGRMUGridScreen: React.FC = () => <PristineAppScreen imageName="browse-final.png" />;

// SHOT 4: 5,000+ Past Papers Question Bank
export const Shot04_QuestionBankScreen: React.FC = () => <PristineAppScreen imageName="questions.png" />;

// SHOT 5: Highly Repeated University Exam Questions
export const Shot05_TenStarQuestionScreen: React.FC = () => <PristineAppScreen imageName="questions.png" />;

// SHOT 6: Triple-Tap Gesture Action
export const Shot06_TripleTapActionScreen: React.FC = () => <PristineAppScreen imageName="tour-03-gestures.png" />;

// SHOT 7: Instant 8-Page Essay Expansion
export const Shot07_EssayExpansionScreen: React.FC = () => <PristineAppScreen imageName="tca-note.png" />;

// SHOT 8: 3-Page Short Notes Tab Switch
export const Shot08_ShortNotesTabScreen: React.FC = () => <PristineAppScreen imageName="notes-renderer.png" />;

// SHOT 9: 200+ Hand-Drawn Diagrams Gallery
export const Shot09_DiagramsGalleryScreen: React.FC = () => <PristineAppScreen imageName="chapter-diagrams.png" />;

// SHOT 10: Gallbladder & Calot's Triangle Deep Dive (Real Hand-Drawn Plate)
export const Shot10_GallbladderPlateScreen: React.FC = () => (
  <DiagramCardScreen
    plateImage="calots_triangle_anatomy.jpg"
    subjectTitle="General Surgery • Anatomy"
    topicTitle="Calot's Triangle & Surgical Anatomy"
    takeawayPoints={[
      "Superior: Inferior liver surface (Segment V)",
      "Medial: Common hepatic duct | Lateral: Cystic duct",
      "Critical Content: Cystic artery & Lund's cystic lymph node"
    ]}
  />
);

// SHOT 11: Stomach Lymphatics Clog's Areas Deep Dive (Real Hand-Drawn Plate)
export const Shot11_StomachPlateScreen: React.FC = () => (
  <DiagramCardScreen
    plateImage="stomach_lymphatics_anatomy.jpg"
    subjectTitle="Surgical Oncology • Anatomy"
    topicTitle="Stomach Lymphatics & Clog's 4 Areas"
    takeawayPoints={[
      "Area 1 & 2: Left Gastric & Hepatic Artery Nodes",
      "Area 3: Subpyloric Nodes (Right Gastroepiploic)",
      "Area 4: Pancreaticosplenic (Short Gastric Vessels)"
    ]}
  />
);

// SHOT 12: AI Medical Professor Awakening
export const Shot12_AiProfessorScreen: React.FC = () => <RealAiChatScreen />;

// SHOT 13: 6-Level Avatar Evolution
export const Shot13_AvatarEvolutionScreen: React.FC = () => <PristineAppScreen imageName="bot-liquidglass.png" />;

// SHOT 14: 24/7 Viva Simulation Drill
export const Shot14_VivaDrillScreen: React.FC = () => <RealAiChatScreen />;

// SHOT 15: Double-Tap Rapid MCQ Drill
export const Shot15_DoubleTapMcqScreen: React.FC = () => <PristineAppScreen imageName="anki-study.png" />;

// SHOT 16: 1-Click Anki Deck Sync
export const Shot16_AnkiSyncScreen: React.FC = () => <PristineAppScreen imageName="apkg-1-hub.png" />;

// SHOT 17: 3D Spaced Repetition Flashcard
export const Shot17_AnkiCardFlipScreen: React.FC = () => <PristineAppScreen imageName="apkg-3-chooser.png" />;

// SHOT 18: 4 Liquid Glass Themes Switcher
export const Shot18_ThemeSwitcherScreen: React.FC = () => <PristineAppScreen imageName="homeedit-7-picture.png" />;

// SHOT 19: Pomodoro Focus Timer
export const Shot19_PomodoroTimerScreen: React.FC = () => <PristineAppScreen imageName="timer.png" />;

// SHOT 20: Botanical Study Trees in Full Bloom
export const Shot20_JacarandaBloomScreen: React.FC = () => <PristineAppScreen imageName="treegallery.png" />;

// SHOT 21: 432Hz Binaural Lo-Fi Beats Visualizer
export const Shot21_BinauralWaveScreen: React.FC = () => <PristineAppScreen imageName="music-06-playing.png" />;

// SHOT 22: Attached Ward Cases & Lecture Video PDFs
export const Shot22_CasePdfAttachScreen: React.FC = () => <PristineAppScreen imageName="usernotes-preview.png" />;

// SHOT 23: 100% Offline Ward Mode
export const Shot23_OfflineModeScreen: React.FC = () => <PristineAppScreen imageName="progress.png" />;

// SHOT 24: TN MGR University Distinction Trophy
export const Shot24_DistinctionBadgeScreen: React.FC = () => <PristineAppScreen imageName="glass-progress.png" />;

// SHOT 25: Google Play Store Outro
export const Shot25_PlayStoreOutroScreen: React.FC = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#030712',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px',
      boxSizing: 'border-box',
      textAlign: 'center'
    }}
  >
    <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, #38bdf8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '42px', boxShadow: '0 10px 35px rgba(56, 189, 248, 0.4)', marginBottom: '20px' }}>
      🪐
    </div>
    <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '8px' }}>
      Orbit MBBS
    </div>
    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px', maxWidth: '240px', lineHeight: 1.4 }}>
      The Ultimate Study Suite for TN MGR University Medical Students.
    </div>
    <div style={{ background: '#0f172a', border: '1.5px solid #38bdf8', borderRadius: '14px', padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: '10px', boxShadow: '0 0 25px rgba(56, 189, 248, 0.3)' }}>
      <span style={{ fontSize: '20px' }}>▶️</span>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>GET IT ON</div>
        <div style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff' }}>Google Play</div>
      </div>
    </div>
  </div>
);
