# Two 60-second Orbit ads, built with HyperFrames

Built at the app owner's request, against
[`Tejashmakwana/astra-chatgpt-hyperframes`](https://github.com/Tejashmakwana/astra-chatgpt-hyperframes)
as the reference for what a HyperFrames film looks like.

| | Film | Ground | The shape |
|---|---|---|---|
| A | `ask-it/` | light | A student types a real exam question; the app answers it |
| B | `the-year/` | dark | The four MBBS years in order, one claim at a time over full-bleed screens |

Both are 1080x1920, 30fps, exactly 1,800 frames. Both open on the Orbit mark
and "Welcome to Orbit" and close on the end card, like every other Orbit ad.

```sh
npm install
npm run build     # write both compositions from the ad scripts
npm run check     # lint + the real browser gate: runtime, layout, contrast
npm run render    # draft MP4s into renders/
npm run render -- --high
npm run preview   # HyperFrames Studio
```

## What was already here, and was not real

`hyperframes-ad/` existed before this, holding `hyperframes.json` and three
files under `scenes/`. None of it was a HyperFrames project: no
`data-composition-id`, no clips, no GSAP timeline, no `window.__timelines`, and
a `hyperframes.json` whose `compositions` array is not a shape the CLI reads.
They were static HTML mockups with CSS keyframes — one of them carried
`justifyContent` as a CSS property, which is JavaScript's spelling and does
nothing in a stylesheet. The CLI could not have rendered any of them.

## The composition is generated, and that is the point

`scripts/build.mjs` reads `remotion-ad/src/scripts/` and writes the HTML. The
words in these films are the owner's own rewrite, and they live in exactly one
place, where `check:ad-truth` holds them to the screenshots under them and
`preflight` holds them to sixty seconds of speech. A second copy typed into
HTML would be a copy with no check on it.

So nothing under `ask-it/`, `the-year/` or `assets/` is committed. Edit the
script, run the build.

**Only the data crosses over** — the shot list, the spoken line, the caption a
muted viewer reads, the screenshot, the accent. None of the motion does. A
Remotion shot is a React component reading `useCurrentFrame()`; a HyperFrames
shot is static HTML with a GSAP timeline seeking over it. These are authored as
HyperFrames films, not ported.

## Two projects, not one with two compositions

Each film is its own directory with its own `index.html`, and `assets` inside
it is a symlink to the one real directory. The CLI treats whatever directory it
is given as the project root and rejects a `../` in any asset path, because
Studio resolves those against the root and 404s. One project would mean one
`index.html`, and `snapshot` and `preview` only ever look at that. The link
gives each film a root of its own without a second copy of the screenshots.

## What this sandbox cannot do

Two things, and both are policy rather than breakage:

- **The voice.** The speech host is blocked, so the films build silent and say
  so. `cd remotion-ad && npm run voice` records the lines in CI, and the build
  picks up the clips as soon as they are on disk.
- **The diagrams.** The storage bucket is blocked (403 on CONNECT), so
  `npm run plates` cannot download the drawings. The capture then photographs
  an empty picture box, and that capture is what every note shot in every ad is
  built on. `capture-screens.mjs` refuses to shoot without every plate now, and
  `preflight` refuses a plate file that is not a real JPEG — both because a
  grey rectangle inside a card headed "High-Yield Visual Exam Diagram" reached
  a finished frame and the owner reported it.

A render here is a check on the picture. The film is made in CI.

## Determinism

Every frame has to be reproducible from its time alone, so there is no
`Date.now()`, no unseeded random, no infinite repeat, and no per-frame callback
writing text. The typed prompt is the one that looks like it needs one: it is a
`clip-path` wipe on a stepped ease with the caret's `x` running the same steps,
both measured once inside `document.fonts.ready` — a width measured before the
face loads is the width of a fallback font.
