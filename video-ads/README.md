# ORBIT Instagram Reel Ads

A self-contained Remotion project for the 60-second ORBIT MBBS QBank Instagram Reels.

## Tooling

- Remotion 4.0.526 (exact version, including CLI)
- React 18.3.1
- Edge TTS 7.2.8
- Output: 1080 × 1920, 30 fps, 60 seconds

## Setup

```bash
cd video-ads
npm install
python3 -m pip install -r requirements.txt
```

Generate the neural voiceover:

```bash
npm run tts
```

By default it uses `en-IN-PrabhatNeural`. Override with:

```bash
ORBIT_TTS_VOICE=en-IN-NeerjaNeural ORBIT_TTS_RATE=+8% npm run tts
```

## Poster assets

Put these 9:16 poster files into `video-ads/public/posters/`:

1. `01-welcome.png`
2. `02-triple-tap.png`
3. `03-flashcards.png`
4. `04-ask-ai.png`
5. `05-attendance.png`
6. `06-progress.png`
7. `07-case-proformas.png`
8. `08-download.png`

The final download poster should use a machine-generated QR pointing to:
`https://play.google.com/store/apps/details?id=com.aistudio.mbbsqbank.aycxvd`

## Preview / render

```bash
npm run studio
npm run render:visual
npm run render:visual:captions
```

The compositions are fixed to Instagram Reels format: 1080×1920, 30 fps, 1800 frames (60 seconds).
