---
description: Notes the reader writes — the markers that make a note a document, drawing on a picture with a stylus, and the one place Roboto is not pinned
---

# Notes you write yourself

`mobile/src/components/ProgressNotesTab.tsx` is the whole feature: a list, a
full-screen editor and a full-screen reader, all of it on this phone. See
`.agents/rules/70-supabase.md` for why none of it syncs — `check:cloud-ids`
fails if `useUserNotes` or `noteImages` so much as imports the Supabase client.

## A note is plain text, and stays plain text

What is typed is what is saved. `components/NoteText.tsx` renders five shapes
when the note is **read**:

| Typed | Read as |
|---|---|
| `# ` / `## ` | heading, subheading |
| `- ` `* ` `• ` | bullet |
| `1. ` `2) ` | numbered point |
| `**word**` / `_word_` | bold / italic |
| `==word==`, `==g:` `==b:` `==p:` | highlight, four colours |

`components/NoteToolbar.tsx` writes those markers so nobody has to know them,
and every button **toggles** — one that only adds leaves the reader deleting
characters by hand.

Three things there are load-bearing:

- **The fast path is "no markers in this line", not "one piece".** A line that
  is entirely one mark splits into exactly one piece; reading that as plain
  text printed the underscores, and short lines are the ones people mark.
- **Deliberately not a markdown engine.** A note is not a document: a parser
  would bring links, tables and code fences to handle text nobody writes.
- **Arbitrary text colour is refused.** `check:contrast` guarantees every theme
  stays readable and a free foreground picker is exactly how that is lost. A
  highlight is safe because both the ground and the ink are ours — `onColor()`
  computes the ink, so it is never hardcoded white.

## The typeface is the one place Roboto is not pinned

`NOTE_FONTS` offers Plain, Serif and Mono, stored on the note as a **key**, not
a family name. They are Android's own generic families (`serif`, `monospace`),
so nothing is bundled and the APK does not grow.

This does not contradict the Roboto pin in `theme/typography.ts`. That pin
exists because OEM skins swap the *system* font and would re-typeset the app
behind our back; naming a family for one note's body is a choice the writer
made, and it cannot reach the app's chrome.

The editor's text box is drawn in the chosen face too. A preference that only
appears after saving is one nobody trusts they have set.

## Drawing on a picture

`components/DrawCanvas.tsx` — strokes are `<Path>` elements over the photo,
through `react-native-svg`, which this app already ships. Skia would be
megabytes of native library for a polyline over a photograph.

- **Palm rejection is real, not a heuristic.** Android reports the tool that
  made a touch and RN's pointer events carry it as `pointerType`; once a `pen`
  has been seen on the canvas, fingers stop drawing. That needs
  `ReactFeatureFlags.dispatchPointerEvents = true` in `MainApplication.kt`
  **before** `loadReactNative` — the flag defaults to false and pointer events
  simply never arrive. It is additive: `dispatchJSTouchEvent` still runs, so no
  existing PanResponder is disturbed. The touch handlers stand in only where no
  pointer event has ever arrived.
- **The board is the picture's box, not the screen's.** Marks are saved as
  geometry and replayed by an SVG `viewBox`, which fits them the way
  `resizeMode="contain"` fits the photo — the two land on each other only while
  the shapes match. Draw on a tall screen against a wide photo and every mark
  comes back stretched away from the thing it pointed at.
- **Give the overlay `width="100%" height="100%"`.** An `<Svg>` with only
  `StyleSheet.absoluteFill` falls back to SVG's default 300×150 on
  react-native-web, which silently clips everything past a third of the way
  down. One stroke drew, the next did not, and the screenshot looked fine.
- **Never commit a stroke from inside another `setState` updater.** It is a
  state update raised during a render pass, which React may discard — and did.
  `liveRef` holds the stroke; `finish` reads the ref.
- **The eraser removes whole strokes.** A pixel eraser needs a bitmap and a
  second render target; on an annotation, removing the mark you touched is what
  was wanted.

Ink lives in `orbit:note-ink:{imageId}` beside the picture and is deleted with
it. `components/InkedImage.tsx` is the only thing that replays it — editor
thumbnails, the reader and `ChapterNotes` all go through it.

## Prove it, and look at the screenshot

`check:smoke` draws two strokes with the mouse, asserts **both** survive and
that neither is clipped by the overlay, then keeps them and asserts they come
back over the thumbnail. Every one of the bugs above shipped past a green
typecheck and a green lint; only the picture showed them. See
`.agents/rules/92-verify.md`.
