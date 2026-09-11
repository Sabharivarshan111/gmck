---
description: The ad pipeline — what it produces, why a cut made in an agent sandbox is never shippable, and the five rules a re-cut has already paid for
---

# 97 - Launch ad videos (Remotion)

There is a **working, committed pipeline**. Do not start a new one, and do not
render ads by hand in another tool.

| Thing | Where |
|---|---|
| Renderer | `remotion-ad/` |
| Where the scripts live, and why no transcript is kept beside them | `.agents/video/AD-SCRIPTS.md` |
| Scripts as data | `remotion-ad/src/scripts/` |
| **What a line may say, and how it should sound** | `.agents/rules/97-ad-copy.md` |
| CI render + release | `.github/workflows/ad-videos.yml` |
| Full standard | `.claude/skills/cinematic-product-launch-video/SKILL.md` |

## What it produces

Twenty-six **complete, standalone** vertical ads (1080x1920, 30fps), each also
cut silent, so forty-eight MP4s. Three are 90-second long-form films paced by
their own recorded speech (`orbit-the-pattern`, `orbit-2am`,
`orbit-draw-it-from-memory`); the rest are 60-second reels, of which two
(`orbit-ask-it`, `orbit-the-year`) are flat typographic rather than device
films. Different arguments for one app — never cuts of one film.

One shared motion engine drives all of them; the shot data is the only
difference. **Do not fork the engine per ad** — that is how a set of ads drifts
into a set of different-looking products.

## Run it

Actions -> **Ad videos** -> tag (e.g. `ads-1`). It captures the real screens,
downloads the real plates, speaks the lines, renders in parallel and publishes
the MP4s to a release. `workflow_dispatch` only appears for workflows on the
**default branch**, so it must be on `main` first.

## Rendering cannot finish in an agent sandbox

Policy blocks, verified by direct test — not guesses:

- `speech.platform.bing.com` — **403 on the WebSocket upgrade**, so no voice.
  The first error you see is `CERTIFICATE_VERIFY_FAILED`, and that part IS
  fixable (`cat /root/.ccr/ca-bundle.crt >> "$(python3 -c 'import certifi;print(certifi.where())')"`).
  Fixing it gets you to the 403. Do not report the cert error as the blocker.
- Supabase storage — **403 CONNECT**, so no medical plates, and the notes
  screens capture with the literal text "This diagram could not be loaded".
  `tca-note.png` comes out fully black.

So: review motion locally with `npx remotion still <id> out/f.png --frame=315`,
and render the actual product in CI. Never ship a cut made in the sandbox.

## The five rules that are enforced in code

Each of these already cost a re-cut once.

1. **The camera moves the device, never the screen content.** All transforms are
   on the device container in `LayeredCameraPhone`. The inner `<Img>` renders at
   natural width; its only vertical offset is the screen's own scroll position.
   Scaling the inner image cropped the nav bar and pushed headings under the
   Dynamic Island.
2. **A missing asset stops the build.** `scripts/preflight.mjs` fails on any
   asset absent or under 4KB (the size of a blank capture). It runs before every
   render. Never hotlink an image at render time; bundle it.
3. **Human copy, single-language US voices.** Say "The Tamil Nadu Dr. M.G.R.
   Medical University", never "TNMGRMU". `synthesize.py` raises on any
   `*MultilingualNeural` voice — they read "M.G.R." and "MBBS" with French
   phonemes.
4. **Captions at `bottom: 308`**, and the device lifted `DEVICE_Y = -100`. Reels
   and TikTok cover roughly the bottom 260-290px, and the caption must also
   clear the app's own bottom navigation.
5. **No overlay rectangles.** Direct attention with the backlight, the
   accent-tinted room and focal emphasis.

## The mascot has three ads and one voice

`reelGuide` (a tour), `reelGuideAnswer` (one question worked end to end) and
`reelGuideNight` (the night before the exam) are all hosted by `BotAvatar` —
the Ask AI chat's own face. All three use **`en-US-AvaNeural` at `+0%`**: it is
one character, and three voices would make it three characters. Mood is carried
by the bed, not the voice.

A new bed is a row in `TEMPOS`, `PROGRESSIONS` and a `sections()` branch in
`make-beds.py`. `main()` walks `TEMPOS`; it walked a hardcoded tuple while
printing `len(TEMPOS)`, so a seventh bed reported success and was never built.

## Assets are never committed

`public/app_screens/` and `public/audio/` are gitignored and rebuilt on every
render. A committed screenshot is a UI the app may no longer have; a committed
plate goes stale the moment the diagram is regenerated.

## A reel is paced by speech, and its silent twin by music

The bug this prevents was in **every one of the twenty-one reels**. Shot
lengths came only from the music beat grid, which always sums to `REEL_FRAMES`,
and nothing compared a shot against the recording it carried. Measured against
the real mp3s they held **57 to 73 seconds of speech in a 60-second film**, and
235 shots ran past their slot by up to 3.8s. The surplus plays under the next
shot, whose own clip has started. That is the overlapping voice.

A comment in `ShotTimeline` claimed preflight already failed on an overrun.
**No such check existed.** An asserted safety net nobody built is worse than
none, because it stops people looking.

Three rules now, and all three are enforced:

1. **Audio paces what has audio; the beat grid paces what does not.**
   `measure-audio.mjs` gives every spoken shot — reel or long-form — at least
   its own audio plus air, so a shot can never be shorter than its line. Spare
   time goes to the last shot, which pins a reel to exactly 60s.
2. **A reel must be WRITTEN to fit.** `preflight` estimates each line from a
   model fitted to 90 real clips of this voice
   (`sec = 1.100 + 0.0339 x chars + 0.732 x punctuation`) and fails before
   anything renders. **Commas and full stops cost ~0.7s each**, so a list is
   the most expensive thing a line can hold: "Medicine, Surgery, O and G,
   Paediatrics, ENT, Ophthal." spends 4.4 of its 7.3 seconds saying nothing.
3. **14 shots, not 18.** At 18 shots a 60-second reel affords 35 characters a
   line; at 22 it affords three words. 14 gives ~63 characters, which is the
   7-11 word line the `vo` type has always documented and nothing enforced.

**The silent cut is its own script** (`remotion-ad/src/scripts/silent.ts`), not the same
edit rendered with `withVoice: false`. That prop is gone. One edit could not
serve both, because the two are paced by clocks that disagree — and the grid
was the only one anything computed, which is exactly why the voice overran. A
silent reel is `noVoice`, cut to its beats, captioned from the separately
authored `silentText` and `kicker`. A silent long-form cut borrows its twin's
measurements through `voiceOf`, because those ads never had the bug: their
shots were always measured, and their captions always typed out every word.

## Two ads are flat and typographic, and they are not the device ads

`adAskIt` (light, a question being typed and answered) and `adTheYear` (dark,
one claim at a time over a full-bleed screen) are built on the techniques in
`Tejashmakwana/astra-chatgpt-hyperframes`, at the owner's request. They render
through `HyperAd`, not `ShotTimeline`, chosen by `script.look`.

**Take the technique, never the assets.** Its code is MIT and the four ideas
worth having are in `SweptType` and `TypedLine`: a gradient whose bright stop
travels through the glyphs, type resolving out of blur, an exponential settle
rather than a spring, and a typed line with a caret. Its **artwork, soundtrack
and font are not ours** — its `THIRD_PARTY.md` says publication "does not claim
ownership of the reference artwork or grant permission to redistribute its
soundtrack elsewhere". None are in this repo and none may be.

On a `typed` shot `text` is the question being typed on screen, so `silentText`
is what the muted viewer reads. Everything else is shared with the device ads
on purpose — same bookends, pacing, budget and silent twin. A format that
quietly opted out of those would be a format that overran its voice.

## The caption band is a number, not a comment

`captionBand.ts` owns where a reel's caption sits and how tall it may get;
`ReelHeadline` shrinks the type to fit it, and `MascotStage` and the device
framing are placed against `CONTENT_FLOOR`.

It was three comments quoting each other before — "the guide's feet are at
470", "its lower edge at ~1409 against a headline block whose top edge is
~1465" — all correct about a layout that then changed. Once the caption became
the whole spoken line it wrapped to two lines for 257 of 294 captions and grew
upward through the device and the mascot. `npm run check:reel-layout`
recomputes it from the real scripts.

**Every ad opens on "Welcome to Orbit" and closes on "Download Orbit on the
Play Store".** Stamped once in `bookends.ts` over the one list that has them
all, never typed into forty-eight places.

**No ad counts diagrams, and none says "plate".** Say what the picture is for
in the argument that ad is making. `npm run check:ad-truth` fails on either.
