---
description: Interface rules — theming, type, materials, accessibility
---

# Interface

Principles come from `.claude/skills/apple-design/SKILL.md`; its `README.md`
is the index and records which web techniques became what here. Open them for
anything this file does not settle.

## A theme is four colours

`mobile/src/theme/presets.ts` holds the named themes, `mobile/src/theme/color.ts` the maths.
A theme is **background, text, accent, card**, and `paletteFrom()` derives the
other fourteen, because those are relationships rather than choices.

Two things a theme may never reach:

- **Semantic colours.** `success`, `warning` and `danger` stay green, amber and
  red in every theme. A tick meaning "done" and a bar meaning "wrong" have to
  keep meaning that.
- **`onAccent`.** Text on a filled accent is computed from the accent's
  luminance, never hardcoded white — amber and cyan need black.

`theme` (light/dark) is derived from whether the background is dark, not from
which preset is selected. That is what keeps the status bar, the navigator and
the moon/sun icon right for a custom theme.

Four free colours *can* produce unreadable text. That is a property of the
feature: the editor makes the consequence visible rather than restricting the
choice. What ships must still be right — `npm run check:contrast` walks every
built-in theme through `paletteFrom`, and `check:subject-cards` covers the
custom-theme subject cards.

## Materials and wallpaper

- **Liquid Glass is a material, not a palette.** `components/GlassSurface.tsx`
  is the only place that draws it, and what it draws is a **bevel**: the rim
  (a stroked rect whose gradient runs corner to corner, brightest on the far
  edge), then the specular hairline, then the inner glow, then translucency
  and float. **No backdrop blur and no faking it** — a lighter rectangle
  pretending to be a blur is what makes an imitation look cheap.
- **There are two rims, of opposite polarity** — the bright one and a dimmer
  counter-rim just inside it, lit from the opposite corner. One line alone is
  a box with a border; two, a pixel apart, is an edge with thickness. The
  reference's stack has both.
- Three things that bevel gets wrong if they are touched: the rim is
  **measured**, never `100%` (a stroke at 100% pushes half its width past the
  edge, where the clip removes the brightest part); the specular's length is
  **capped in dp**, because as a fraction it turns a tall card grey; and the
  ink **follows the theme** — white on a dark pane, near-black on a light one,
  where a white rim on a white card is nothing at all.
- **The Liquid Glass preset is dark**, and used to be near-white over a white
  card: three near-identical whites, so the material had nothing to show
  through it and no edge you could find.
- **Android 13+ gets a real AGSL shader** (`GlassView.kt`, registered as
  `OrbitGlass`), drawn **between the fill and the bevel**. That order is the
  safety story: an older phone, a video wallpaper, or a failed capture all
  leave a finished card rather than a hole. Gated on API 33, on
  `hasViewManagerConfig`, and on **a wallpaper being set** — the backdrop
  search accepts only a full-page image or video, because content drawn *over*
  a pane cannot be behind it and capturing the screen instead captures each
  card's own text (it shipped once: "Search Search", "Timer Timer"). A new
  pane invalidates the shared capture, or a screen inherits the last one's
  picture. Affordable because the capture is a third of
  each dimension, shared, throttled to one per 90ms, and taken with every pane
  standing down so the glass is not inside the picture it refracts.
- **A video wallpaper refracts too**, but only because `WallpaperBackground`
  asks for `ViewType.TEXTURE`: a SurfaceView's frames are on a surface the
  hierarchy cannot read, and `draw()` on one returns nothing.
- **A view is not a module.** Modules must be TurboModules because the module
  interop flag is false; `useFabricInterop()` defaults to **true**, so a plain
  `SimpleViewManager` works with no codegen and no C++ entry point.
- **Neither Liquid Glass package belongs here.** `@callstack/liquid-glass` is
  iOS 26+ only and renders a plain View on Android.
  `@uginy/react-native-liquid-glass` is an Expo module — `requireNativeView`
  from `expo`, `ExpoModulesCorePlugin.gradle` — so it would bring the whole
  Expo module system into a bare app for one view. Its technique is what
  `GlassView.kt` does; below API 33 it draws nothing and its capture retries
  are unbounded, and neither of those was copied.
- **`bevel` draws the light without the translucency**, for a surface that is
  *about* being glass under a solid theme (the music player). Not for general
  use: a rim round every list row undoes the distinction.
- **A wallpaper always carries a scrim**, drawn in `colors.background` and
  never black. `MIN_DIM` is 0.2 rather than 0: an unreadable app is not a
  preference.
- `launchImageLibrary` needs **no permission** — Android's photo picker runs
  out of process. Do not add `READ_MEDIA_IMAGES`.

## Type

`mobile/src/theme/tokens.ts` holds spacing and radius; `typeScale` in
`mobile/src/theme/typography.ts` holds the ramp. Use them instead of raw numbers — a
size written as a bare `fontSize` ships without the tracking and leading that
belong to it.

**Font is pinned to Roboto.** React Native otherwise follows the *system* font,
and OEM skins replace it — MIUI ships MiSans, One UI ships SamsungOne — which
would silently re-typeset the app on those phones.

In-app text size (`mobile/src/theme/textScale.tsx`) is a continuous 0.9–1.15
multiplier applied centrally in `components/Text.tsx`, which takes a
**zero-cost fast path at exactly 1**. Do not move that work anywhere it runs
per row. 1.15 is a measured ceiling, not a round one: past it "My Progress"
stops fitting inside the bottom bar's selection pill.

## Accessibility is part of the component contract

- **`Touchable` requires a `label`.** An unlabelled control is unusable with
  TalkBack, and making it a required prop is the only way that stays true as
  screens get added.
- Give lists **one spoken sentence per row**, not four fragments.
- Keep every target at 44dp using `hitSlop`, not padding that changes the
  design.
- `check:smoke` selects controls by accessibility label, so a control it cannot
  find is one TalkBack cannot announce either.
- **State goes out twice** — as `accessibilityState` *and* as `aria-checked` /
  `aria-selected` / `aria-expanded` / `aria-busy`. TalkBack reads the first;
  react-native-web 0.21 removed it and reads only the second. `Touchable` sets
  both from one value. Without the aria half, every switch in the preview
  reports no state at all — and a `check:smoke` assertion passed for a year
  while reading an attribute that was never emitted.

## Two things that look fine in the preview and are broken on a phone

The preview is react-native-web. Where the DOM is more forgiving than Android,
it will agree with a bug and keep agreeing.

- **Never resize a box that contains an `<Svg width="100%">`.** On Android
  react-native-svg paints its canvas at the size it measured and does not
  repaint when a parent is merely resized; a DOM `<svg>` reflows on its own.
  `ThinBar` drew its fill that way, so ticking the last question in a topic
  widened the box and kept painting the old fraction — a progress bar stuck at
  half, perfect in the preview. Draw the SVG once at full size and **clip** it
  instead.
- **One component, one rendering path.** A `Foo.web.tsx` beside `Foo.tsx` means
  the harness renders the file that never ships, so the file that does ships
  unreviewed. That is how a heading's animation was found to be bound to
  nothing while the preview shimmered from a CSS class in `index.html`. If a
  component cannot be reached in the harness (`listen()` rejects without a
  recogniser, so the dictation visualiser never mounts), put it on a demo route
  rather than giving it a second implementation.

## Performance, on a 3 GB phone

- Question rows subscribe to **one question** (`useQuestionDone`), never the
  store's global version. `check:fanout` fails if that regresses.
- Sliders emit on the **step**, not the frame: every `Text` subscribes to text
  size, so a callback per frame is a full-tree re-render per frame.
- A render error must never blank the app. `components/ErrorBoundary.tsx` wraps
  everything **outside** the providers and uses literal colours on purpose — a
  fallback that depends on the code that just failed is not a fallback.
