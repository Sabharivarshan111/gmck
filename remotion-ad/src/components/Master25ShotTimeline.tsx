import React from 'react';
import { Sequence, Audio, staticFile } from 'remotion';
import { AuroraMeshBackground } from './AuroraMeshBackground';
import { LayeredCameraPhone } from './LayeredCameraPhone';
import { KineticWordCaption } from './KineticWordCaption';
import { GlowBadge } from './GlowBadge';
import { SHOT_TIMINGS } from '../shotTimings';
import {
  Shot01_HookScreen,
  Shot02_PrecisionScreen,
  Shot03_TNMGRMUGridScreen,
  Shot04_QuestionBankScreen,
  Shot05_TenStarQuestionScreen,
  Shot06_TripleTapActionScreen,
  Shot07_EssayExpansionScreen,
  Shot08_ShortNotesTabScreen,
  Shot09_DiagramsGalleryScreen,
  Shot10_GallbladderPlateScreen,
  Shot11_StomachPlateScreen,
  Shot12_AiProfessorScreen,
  Shot13_AvatarEvolutionScreen,
  Shot14_VivaDrillScreen,
  Shot15_DoubleTapMcqScreen,
  Shot16_AnkiSyncScreen,
  Shot17_AnkiCardFlipScreen,
  Shot18_ThemeSwitcherScreen,
  Shot19_PomodoroTimerScreen,
  Shot20_JacarandaBloomScreen,
  Shot21_BinauralWaveScreen,
  Shot22_CasePdfAttachScreen,
  Shot23_OfflineModeScreen,
  Shot24_DistinctionBadgeScreen,
  Shot25_PlayStoreOutroScreen
} from './ScreenRegistry';

interface MasterTimelineProps {
  themeKey: 'apple_keynote' | 'college_humor' | 'cyberpunk_os';
  themeType: 'apple' | 'college' | 'cyberpunk';
  themeColor: string;
}

const SCRIPTS_BY_THEME = {
  apple_keynote: [
    "Meet Orbit MBBS. Precision medical learning, completely redesigned.",
    "Engineered specifically for TN MGR University clinical excellence.",
    "Navigate four years of university curriculum with effortless ease.",
    "Over five thousand university exam questions organized by topic.",
    "Instantly spot highly repeated university exam questions.",
    "A single triple-tap reveals comprehensive exam answers.",
    "Full eight-page university essay formats ready for exam day.",
    "Switch seamlessly to high-yield three-page short notes.",
    "Over two hundred exam-oriented hand-drawn medical plates.",
    "Surgical anatomy of Calot's triangle mastered with zero stress.",
    "Stomach lymphatic drainage clearly color-coded and mapped.",
    "Meet your twenty-four-seven AI Medical Professor.",
    "Your clinical doctor avatar evolves as your knowledge grows.",
    "Simulate real viva rounds with instant examiner feedback.",
    "Rapid double-tap MCQ practice to build clinical reflexes.",
    "One-click synchronization with your official Anki decks.",
    "Retain complex clinical facts with spaced repetition recall.",
    "Four beautiful liquid glass themes for late-night ward study.",
    "Lock into deep focus with the built-in twenty-five minute timer.",
    "Grow your personal botanical study garden as you focus.",
    "Immerse your focus in four thirty-two hertz binaural soundscapes.",
    "Attach real clinical case sheets and lecture PDFs directly.",
    "One hundred percent offline autonomy inside hospital casualty and OT.",
    "Turn your preparation into a university distinction gold medal.",
    "Download Orbit MBBS on the Google Play Store today."
  ],
  college_humor: [
    "Still cramming for MBBS exams at two in the morning?",
    "Orbit maps your exact TN MGR University syllabus.",
    "No more digging through endless messy textbooks.",
    "Five thousand past university exam questions in your pocket.",
    "Spot every highly repeated exam question immediately.",
    "Just triple-tap anywhere and the full note appears.",
    "Eight-page essays structured exactly how examiners want them.",
    "Quick three-page short notes for lightning revision.",
    "Over two hundred hand-drawn diagrams ready for exams.",
    "Calot's triangle and gallbladder anatomy made simple.",
    "Stomach lymphatic drainage pathways clearly explained.",
    "Ask your AI Medical Professor anything, anytime.",
    "Level up your doctor avatar with every topic you finish.",
    "Ace your viva rounds without any awkward pauses.",
    "Double-tap MCQs to test yourself and gain XP fast.",
    "Sync your flashcards to Anki in a single tap.",
    "Spaced repetition ensures you never forget clinical facts.",
    "Switch to clean liquid glass dark mode for late nights.",
    "Study with the built-in Pomodoro focus timer.",
    "Watch your botanical study tree bloom while you learn.",
    "Relax with four thirty-two hertz lo-fi study beats.",
    "Keep all your clinical ward cases in one place.",
    "Works completely offline in hospital wards and duty rooms.",
    "Turn your exam fear into a university distinction.",
    "Get Orbit MBBS on the Google Play Store."
  ],
  cyberpunk_os: [
    "Orbit Medical OS. Clinical neural core online.",
    "TN MGR University medical database initialized.",
    "Scanning complete four-year clinical syllabus.",
    "Accessing five thousand past university exam nodes.",
    "Highly repeated essay question detected and highlighted.",
    "Haptic gesture trigger active across the interface.",
    "Expanding eight-page university exam protocols.",
    "Rapid three-page clinical summaries loaded.",
    "Two hundred hand-drawn anatomical plates online.",
    "Calot's triangle surgical grid verified.",
    "Stomach lymphatic drainage network rendered.",
    "AI Clinical Professor interface active twenty-four-seven.",
    "Upgrading knowledge avatar to Chief Surgeon.",
    "Real-time viva simulation round initialized.",
    "Double-tap clinical diagnostic MCQ drill engaged.",
    "Anki memory database synchronization complete.",
    "Spaced memory recall optimized for permanent retention.",
    "Liquid glass holographic shader loaded.",
    "Pomodoro focus cycle running.",
    "Botanical neural bloom progressing with study time.",
    "Four thirty-two hertz binaural audio synced.",
    "Ward clinical cases and lecture PDFs attached.",
    "One hundred percent offline hospital mode engaged.",
    "University distinction gold medal matrix achieved.",
    "Download Orbit on the Google Play Store."
  ]
};

const SHOT_METADATA = [
  { badgeIcon: '🪐', badgeLabel: 'TN MGR UNIVERSITY MEDICAL SUITE', screen: <Shot01_HookScreen /> },
  { badgeIcon: '⚡', badgeLabel: 'CLINICAL PRECISION', screen: <Shot02_PrecisionScreen /> },
  { badgeIcon: '🏛️', badgeLabel: 'TN MGR UNIVERSITY SYNC', screen: <Shot03_TNMGRMUGridScreen /> },
  { badgeIcon: '📚', badgeLabel: '5,000+ PAST EXAM PAPERS', screen: <Shot04_QuestionBankScreen /> },
  { badgeIcon: '⭐', badgeLabel: 'HIGHLY REPEATED EXAM QUESTIONS', screen: <Shot05_TenStarQuestionScreen /> },
  { badgeIcon: '👆', badgeLabel: 'TRIPLE-TAP GESTURE', screen: <Shot06_TripleTapActionScreen /> },
  { badgeIcon: '📄', badgeLabel: 'FULL 8-PAGE ESSAYS', screen: <Shot07_EssayExpansionScreen /> },
  { badgeIcon: '📝', badgeLabel: '3-PAGE HIGH-YIELD SHORT NOTES', screen: <Shot08_ShortNotesTabScreen /> },
  { badgeIcon: '🎨', badgeLabel: '200+ MEDICAL EXAM PLATES', screen: <Shot09_DiagramsGalleryScreen /> },
  { badgeIcon: '📐', badgeLabel: "CALOT'S TRIANGLE SURGICAL ANATOMY", screen: <Shot10_GallbladderPlateScreen /> },
  { badgeIcon: '🩺', badgeLabel: 'STOMACH LYMPHATICS ONCOLOGY', screen: <Shot11_StomachPlateScreen /> },
  { badgeIcon: '🤖', badgeLabel: 'AI MEDICAL PROFESSOR (24/7)', screen: <Shot12_AiProfessorScreen /> },
  { badgeIcon: '🧬', badgeLabel: '6-LEVEL DOCTOR AVATAR', screen: <Shot13_AvatarEvolutionScreen /> },
  { badgeIcon: '🎯', badgeLabel: '24/7 CLINICAL VIVA DRILL', screen: <Shot14_VivaDrillScreen /> },
  { badgeIcon: '⚡', badgeLabel: 'RAPID CLINICAL MCQ DRILL', screen: <Shot15_DoubleTapMcqScreen /> },
  { badgeIcon: '🔄', badgeLabel: '1-CLICK ANKI SYNC', screen: <Shot16_AnkiSyncScreen /> },
  { badgeIcon: '🧠', badgeLabel: 'SPACED RECALL RETENTION', screen: <Shot17_AnkiCardFlipScreen /> },
  { badgeIcon: '✨', badgeLabel: '4 LIQUID GLASS THEMES', screen: <Shot18_ThemeSwitcherScreen /> },
  { badgeIcon: '⏱️', badgeLabel: 'POMODORO FOCUS TIMER', screen: <Shot19_PomodoroTimerScreen /> },
  { badgeIcon: '🌸', badgeLabel: 'BOTANICAL STUDY GARDEN', screen: <Shot20_JacarandaBloomScreen /> },
  { badgeIcon: '🎧', badgeLabel: '432HZ BINAURAL SOUNDSCAPES', screen: <Shot21_BinauralWaveScreen /> },
  { badgeIcon: '📑', badgeLabel: 'WARD CASES & LECTURE PDFS', screen: <Shot22_CasePdfAttachScreen /> },
  { badgeIcon: '🛡️', badgeLabel: '100% OFFLINE WARD AUTONOMY', screen: <Shot23_OfflineModeScreen /> },
  { badgeIcon: '🏆', badgeLabel: 'UNIVERSITY DISTINCTION GOLD MEDAL', screen: <Shot24_DistinctionBadgeScreen /> },
  { badgeIcon: '▶️', badgeLabel: 'GOOGLE PLAY STORE EXCLUSIVE', screen: <Shot25_PlayStoreOutroScreen /> }
];

export const Master25ShotTimeline: React.FC<MasterTimelineProps> = ({
  themeKey,
  themeType,
  themeColor
}) => {
  const currentScripts = SCRIPTS_BY_THEME[themeKey] || SCRIPTS_BY_THEME.apple_keynote;
  const timingManifest = SHOT_TIMINGS[themeKey] || SHOT_TIMINGS.apple_keynote;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#020617',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <AuroraMeshBackground theme={themeType} />

      {SHOT_METADATA.map((meta, idx) => {
        const shotIndex = idx + 1;
        const timing = timingManifest.shots[idx] || {
          fromFrame: idx * 90,
          durationInFrames: 90,
          audioFrames: 75,
          audioFile: `audio/${themeKey}/shot_${shotIndex < 10 ? '0' + shotIndex : shotIndex}.mp3`
        };

        const spokenText = currentScripts[idx] || '';

        return (
          <Sequence
            key={idx}
            from={timing.fromFrame}
            durationInFrames={timing.durationInFrames}
          >
            {/* Synchronized Shot-Specific Studio Audio */}
            <Audio src={staticFile(timing.audioFile)} volume={1.0} />

            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'center',
                padding: '60px 20px 20px 20px',
                position: 'relative',
                zIndex: 10
              }}
            >
              {/* Top Minimalist Pill Badge */}
              <div style={{ marginBottom: '20px' }}>
                <GlowBadge icon={meta.badgeIcon} label={meta.badgeLabel} color={themeColor} delay={2} />
              </div>

              {/* Center 3D Floating Phone with Native UI and Cinematic Camera Choreography */}
              <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LayeredCameraPhone
                  themeColor={themeColor}
                  shotIndex={shotIndex}
                  durationInFrames={timing.durationInFrames}
                >
                  {meta.screen}
                </LayeredCameraPhone>
              </div>

              {/* Elevated Subtitle Capsule (Smoothly synchronized with actual spoken audio length) */}
              <KineticWordCaption
                text={spokenText}
                themeColor={themeColor}
                audioFrames={timing.audioFrames}
                durationInFrames={timing.durationInFrames}
              />
            </div>
          </Sequence>
        );
      })}
    </div>
  );
};
