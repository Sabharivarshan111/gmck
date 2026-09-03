# remotion-ad — the three Orbit MBBS launch films

Three **complete, standalone** 90-second vertical ads (1080×1920, 30fps,
2,700 frames, 30 shots × 3.0s). Not three cuts of one video, and never six
clips stitched into one.

| Composition | Angle | Voice |
|---|---|---|
| `orbit-the-pattern` | The repeats are already counted | `en-US-AvaNeural` |
| `orbit-2am` | The night before the exam | `en-US-JennyNeural` |
| `orbit-draw-it-from-memory` | The diagram is where the marks are | `en-US-AriaNeural` |

Scripts, hook rationale and the claims that may **not** be made are in
[`.agents/video/AD-SCRIPTS.md`](../.agents/video/AD-SCRIPTS.md).

## Render it

The whole pipeline runs in CI, via the **Ad videos** workflow
(`.github/workflows/ad-videos.yml`), which publishes the three MP4s to a GitHub
Release. Run it from the Actions tab with a tag.

Locally, if your network reaches Supabase and Microsoft's speech endpoint:

```sh
cd remotion-ad
npm install --legacy-peer-deps
npm run screens     # capture the real app screens via mobile/preview/shoot.mjs
npm run plates      # download the real medical plates from the diagrams bucket
npm run voice       # synthesise 90 voiceover clips (30 per ad)
npm run preflight   # refuses to continue if any asset is missing or blank
npm run render:all
```

## Why this runs in CI and not in an agent sandbox

The agent sandbox's proxy denies two hosts by policy, and both are load-bearing:

- **`speech.platform.bing.com`** — no voiceover can be synthesised.
- **`pmtgeydtqypwrypshhsx.supabase.co`** — the medical plates cannot be
  downloaded, *and* the notes screens render the literal placeholder
  "This diagram could not be loaded" because they fetch their images at capture
  time.

Rendering there would reproduce the exact failure the design notes call out. A
runner has open network, so it captures clean screens, pulls the real plates,
speaks the script, and renders.

To review motion only, without either host, render silent against stand-in
plates:

```sh
npx remotion still orbit-the-pattern out/frame.png --frame=315 \
  --props='{"withVoice":false}'
```

## The rules the code enforces

1. **The camera moves the device; it never touches the screen content.** Every
   transform in `LayeredCameraPhone` is on the device container. The `<Img>`
   inside renders at natural width and is only ever offset to a *scroll
   position*. Scaling the inner image is what cropped the nav bar, softened the
   text and pushed headings under the Dynamic Island in the previous attempt.
2. **A missing asset stops the build.** `scripts/preflight.mjs` walks every file
   the screen registry names and fails on anything absent or under 4KB — the
   size a blank or black capture comes out at. It is wired in before every
   render, twice.
3. **Nothing is hotlinked.** Screens and plates are bundled into `public/`
   before the render starts.
4. **Captions clear the platform UI.** `KineticWordCaption` is pinned at
   `bottom: 308`, above the Reels/TikTok control rail that covers roughly the
   bottom 260–290px. The device is lifted 100px above centre so the capsule
   never lands across the app's own bottom navigation.
5. **No overlay rectangles.** Attention is directed with the backlight, the
   accent-tinted room, and focal emphasis — never a drawn box.
6. **Single-language US English voices.** A `*MultilingualNeural` voice reads
   "M.G.R." and "MBBS" with French phonemes.

## Assets are never committed

`public/app_screens/` and `public/audio/` are gitignored and rebuilt on every
render. A committed screenshot is a UI the app may no longer have; a committed
plate goes stale the moment the diagram is regenerated.
