import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHOTS_DATA = {
  apple_keynote: {
    voice: 'en-US-AvaNeural',
    rate: '+8%',
    pitch: '+0Hz',
    scripts: [
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
    ]
  },
  college_humor: {
    voice: 'en-US-JennyNeural',
    rate: '+10%',
    pitch: '+1Hz',
    scripts: [
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
    ]
  },
  cyberpunk_os: {
    voice: 'en-US-AvaNeural',
    rate: '+8%',
    pitch: '-1Hz',
    scripts: [
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
  }
};

async function synthesizeAll() {
  const outDir = path.join(__dirname, 'public', 'audio');

  for (const [theme, data] of Object.entries(SHOTS_DATA)) {
    const themeDir = path.join(outDir, theme);
    fs.mkdirSync(themeDir, { recursive: true });

    console.log(`\n🎙️ Synthesizing ${theme} with ${data.voice}...`);

    for (let i = 0; i < data.scripts.length; i++) {
      const shotNum = String(i + 1).padStart(2, '0');
      const filename = path.join(themeDir, `shot_${shotNum}.mp3`);
      const text = data.scripts[i];

      console.log(`[${theme}] Shot ${shotNum}: "${text}"`);
      const tts = new MsEdgeTTS();
      await tts.setMetadata(data.voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

      const { audioStream } = tts.toStream(text, {
        rate: data.rate,
        pitch: data.pitch
      });

      const writeStream = fs.createWriteStream(filename);
      audioStream.pipe(writeStream);

      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
      tts.close();
    }
  }
  console.log('\n✅ All 75 audio clips successfully synthesized with pure native US English voices!');
}

synthesizeAll().catch(err => {
  console.error('Error synthesizing:', err);
  process.exit(1);
});
