# ORBIT Instagram Reel Launch Ads

Final 60-second ORBIT launch-video system.

## Delivery format

- 1080 × 1920
- Native 9:16 Instagram Reels format
- 30 fps
- 60.0 seconds / 1800 frames
- H.264 MP4 + AAC
- No blurred padding
- Real ORBIT UI only
- Key text and UI kept away from the right-side Reels action rail
- Final Play Store QR points to:
  `https://play.google.com/store/apps/details?id=com.aistudio.mbbsqbank.aycxvd`

## Final pacing

The final cut uses 18 beats at ~3.33 seconds each instead of long slideshow scenes:

1. Welcome to ORBIT
2. Your Study Hub
3. Search • Subjects • Progress
4. Triple-tap
5. Structured Full Notes
6. Ask AI
7. Voice + Follow-ups
8. Anki-style Flashcards
9. Spaced Repetition
10. Track Attendance
11. One-tap Marking
12. See Your Progress
13. XP • Streaks • Revision
14. Case Proformas
15. Viva + Bedside AI
16. One App • Every Tool
17. Built for MBBS
18. Download ORBIT

## Motion language

- spring-scale scene entrances
- full-screen hero shot followed by a closer feature punch-in
- subtle 2.5D drift / parallax
- animated touch ripples over real interaction targets
- kinetic lower-third feature labels
- fast directional transitions
- short diagonal light sweeps at scene boundaries
- longer clean hold on the final QR / Google Play CTA
- no generated replacement UI

## Audio

Two deliverables are maintained:

- music + kinetic text, no narration
- Edge TTS narration with the music ducked underneath

The narration uses the existing `en-IN-PrabhatNeural` workflow in this folder.

## Setup

```bash
cd video-ads
npm install
python3 -m pip install -r requirements.txt
npm run tts
```

## Render

```bash
npm run studio
npm run render:no-voice
npm run render:voice
```

The final production edit is storyboard-first: lock the real app screens and the 18-beat pacing before adding extra visual effects.