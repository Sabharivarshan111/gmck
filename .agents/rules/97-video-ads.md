# 97 - Launch ad videos (Remotion)

There is a **working, committed pipeline**. Do not start a new one, and do not
render ads by hand in another tool.

| Thing | Where |
|---|---|
| Renderer | `remotion-ad/` |
| Scripts as prose + hook rationale | `.agents/video/AD-SCRIPTS.md` |
| Scripts as data | `remotion-ad/src/scripts/` |
| CI render + release | `.github/workflows/ad-videos.yml` |
| Full standard | `.claude/skills/cinematic-product-launch-video/SKILL.md` |

## What it produces

Three **complete, standalone** 90-second vertical ads (1080x1920, 30fps, 2,700
frames, **30 shots x exactly 90 frames**). Three different arguments — not three
cuts of one film, and never six clips stitched into one:

- `orbit-the-pattern` — the repeats are already counted (`en-US-AvaNeural`)
- `orbit-2am` — the night before the exam (`en-US-JennyNeural`)
- `orbit-draw-it-from-memory` — the diagram is where the marks are (`en-US-AriaNeural`)

One shared motion engine drives all three; the shot data is the only difference.
**Do not fork the engine per ad** — that is how three ads drift into three
different-looking products.

## Run it

Actions -> **Ad videos** -> tag (e.g. `ads-1`). It captures the real screens,
downloads the real plates, speaks the lines, renders the three in parallel and
publishes the MP4s to a release. `workflow_dispatch` only appears for workflows
on the **default branch**, so it must be on `main` first.

## Rendering cannot finish in an agent sandbox

Policy blocks, verified by direct test — not guesses:

- `speech.platform.bing.com` — **403 on the WebSocket upgrade**, so no voice.
  The first error you see is `CERTIFICATE_VERIFY_FAILED`, and that part IS
  fixable (`cat /root/.ccr/ca-bundle.crt >> "$(python3 -c 'import certifi;print(certifi.where())')"`).
  Fixing it gets you to the 403. Do not report the cert error as the blocker.
- Supabase storage — **403 CONNECT**, so no medical plates, and the notes
  screens capture with the literal text "This diagram could not be loaded".
  `tca-note.png` comes out fully black.

So: review motion locally with
`npx remotion still <id> out/f.png --frame=315 --props='{"withVoice":false}'`,
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

## Voice

Python **edge-tts** (`pip install edge-tts`). `voice-manifest.mjs` dumps the 90
lines to JSON, `synthesize.py` speaks them. A file under 2KB raises — edge-tts
writes a zero-byte mp3 when the socket is refused, and a silent shot in a
finished ad is worse than a crash.

Voiceover lines are **7-11 words**, which lands in 1.8-2.4s and leaves ~0.6s of
air before the cut.

## Facts that may be claimed

Re-measured 2026-09-05, because three of the four were wrong and had shipped:

| | Claim | Was claimed |
|---|---|---|
| questions in the bank | **5,634** | 5,545 |
| carrying a repeat marker | **3,463** (2,013 of them a year list) | "2,025" |
| hand-drawn plates | **250**, attached to 922 questions | "915 plates" |
| MBBS years / tree species | 4 / 12 | unchanged |

"915" counted `question_diagrams` **rows** carrying a picture — the question
count wearing the drawings' name. One plate answers many questions.

**No quantity may be shaped like a year.** "2,025" on screen beside "the years
asked" reads as 2025, and the owner reported it as such. `preflight` refuses any
bare `19xx`/`20xx` or `1,xxx`/`2,xxx` in `text`, `vo` or `kicker`. Write it in
words.

**Never claim** a user count, a pass rate, that AI answers are exam-verified, or
any university endorsement. "100% offline" is also refused — the bundled bank
works offline; notes, plates and Ask AI do not.

## The caption must be the words that are spoken

Three separate bugs made the ads look unsynchronised, and all three are now
enforced rather than remembered:

1. **A voiced reel is captioned with `shot.vo` itself** — the whole line, not a
   piece of it. The rule here was once that `text` had to be a verbatim *span*
   of `vo`, written to stop "2,025 already asked" appearing over "Your
   university repeats its questions". It fixed that and cost something worse:
   a span of a sentence is a fragment, and 264 of 385 voiced shots ended up
   showing under three quarters of what was said — "Every day you studied,
   coloured in." reached the screen as "coloured in". Reading and hearing are
   one string now, so they cannot disagree, and `ReelHeadline` still lights
   each word as it is said.
2. **Word timings come from the synthesiser.** `synthesize.py` passes
   `boundary="WordBoundary"` (the edge-tts default is `SentenceBoundary`, which
   returns audio and no word marks at all) and keeps every event.
   `measure-audio.mjs` bakes them into `remotion-ad/src/generated/voiceTimings.ts`.
3. **`remotion-ad/src/dynamicScriptTimings.ts` is generated, never edited.** It used to be
   committed and unregenerated, so CI recorded new lines and laid them on
   boundaries measured from an older script; the shots run end to end, so one
   line that grew pushed every later shot out of step. `preflight` fails when a
   row describes a line the script no longer contains.

The committed `remotion-ad/src/generated/voiceTimings.ts` is deliberately EMPTY. A
checked-in measurement is a measurement of an older recording.

## The mascot has three ads and one voice

`reelGuide` (a tour), `reelGuideAnswer` (one question worked end to end) and
`reelGuideNight` (the night before the exam) are all hosted by `BotAvatar` —
the Ask AI chat's own face. All three use **`en-US-AvaNeural` at `+0%`**: it is
one character, and three voices would make it three characters. Mood is carried
by the bed, not the voice.

A new bed is a row in `TEMPOS`, `PROGRESSIONS` and a `sections()` branch in
`make-beds.py`. `main()` walks `TEMPOS`; it used to walk a hardcoded tuple while
printing `len(TEMPOS)`, so a seventh bed reported success and was never built.

## Assets are never committed

`public/app_screens/` and `public/audio/` are gitignored and rebuilt on every
render. A committed screenshot is a UI the app may no longer have; a committed
plate goes stale the moment the diagram is regenerated.

## A reel is paced by speech, and its silent twin by music

The bug this exists to prevent was in **every one of the twenty-one reels**.

Shot lengths came only from the music beat grid, which always sums to exactly
`REEL_FRAMES`. Nothing ever compared a shot against the recording it carried.
Measured against the real mp3s the reels held **57 to 73 seconds of speech in a
60-second film**, and 235 individual shots ran past their slot — up to 3.8s
each. The surplus does not vanish: it plays under the next shot, whose own clip
has already started. That is the overlapping voice.

A comment in `ShotTimeline` claimed "`preflight` still fails if a clip overruns
by enough to talk over the next line". **No such check existed.** An asserted
safety net nobody built is worse than no net, because it stops people looking.

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
