# ORBIT Instagram Reel Launch Ads

Remotion source for the upgraded 60-second ORBIT launch Reels.

## Format

- 1080 × 1920 (native 9:16)
- 30 fps
- 60 seconds / 1800 frames
- H.264 MP4
- Key kinetic copy kept away from the Reels UI zones
- No blurred background padding

## Motion language

The launch cut uses one consistent motion system rather than random effects:

- slow 1–3% poster push-ins
- subtle alternating parallax drift
- spring-scale kinetic text cards
- 17-frame directional cross-transitions
- a crisp diagonal light sweep at scene boundaries
- a faster feature montage in the first 15 seconds
- longer hold on the Google Play / QR CTA

The visual order is voice-aligned:
Welcome → feature montage → Triple-tap full note → Ask AI → Flashcards → Attendance → Case Proformas → Progress → Download.

## Setup

```bash
cd video-ads
npm install
python3 -m pip install -r requirements.txt
```

Generate the Edge TTS narration:

```bash
npm run tts
```

Default voice: `en-IN-PrabhatNeural`.

## Required assets

Put the final 9:16 artwork in `public/posters/`:

- `01-welcome.png`
- `02-triple-tap.png`
- `03-flashcards.png`
- `04-ask-ai.png`
- `05-attendance.png`
- `06-progress.png`
- `07-case-proformas.png`
- `08-download.png`

Put the audio bed at `public/audio/music.wav`.
Run `npm run tts` to create `public/audio/voiceover.mp3`.

The QR on `08-download.png` must encode exactly:
`https://play.google.com/store/apps/details?id=com.aistudio.mbbsqbank.aycxvd`

## Preview and render

```bash
npm run studio
npm run render:no-voice
npm run render:voice
```
