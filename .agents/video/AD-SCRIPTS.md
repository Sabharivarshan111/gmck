# Orbit MBBS — three launch ad scripts (90s vertical, 30 × 3.0s)

**Format:** 9:16, 1080×1920, 30 fps, **2,700 frames = 90.0s**, 30 shots × 90 frames.
**Each script is a complete, standalone ad.** Not three cuts of one video, and never
six clips stitched together — three different arguments for the same app.

Every number below is real and was checked against the repo and the production
database on 2026-09-02, because a launch ad that overstates gets found out:

| Claim you may use | Actual |
|---|---|
| Questions in the bank | **5,545 unique** (5,679 entries incl. cross-listed) |
| Carrying a PYQ year marker | **2,025** |
| Carrying importance stars | **2,734** |
| Diagram rows with a picture | **915**, across **272** plates |
| MBBS years covered | **4** (first, second, third, final) |
| Focus-timer tree species | **12** |
| Built-in themes | 4 named + a custom theme builder |

Do **not** claim: "AI-generated answers are exam-verified", a user count, a pass
rate, or any university endorsement. None of those are true.

---

## Casting, voice and safe zones (applies to all three)

| | Script A | Script B | Script C |
|---|---|---|---|
| Voice | `en-US-AvaNeural` | `en-US-JennyNeural` | `en-US-AriaNeural` |
| Rate / Pitch | `+10%` / `+0Hz` | `+12%` / `+1Hz` | `+10%` / `-1Hz` |
| Register | Calm executive authority | Warm, fast, peer-to-peer | Bold, clipped, kinetic |

- **Never** a `*MultilingualNeural` voice. "M.G.R." and "MBBS" flip to French
  phonemes on those, which is failure mode #3 in the skill.
- Say **"The Tamil Nadu Dr. M.G.R. Medical University"** or **"M.G.R. University"**
  in full. Never "TNMGRMU".
- Every VO line below is **7–11 words**, which lands at **1.8–2.4s** at these
  rates and leaves ~0.6s of air before the cut.
- Captions sit in a frosted capsule at **`bottom: 300–320px`**, never below 300 —
  that is the Reels/TikTok UI crop zone.
- No neon boxes drawn over the phone. Attention is directed with **camera,
  focus and light** only.

---

# SCRIPT A — "The Pattern"
**Framework:** Investigator (secret) → Fortune Teller. **Emotion:** *they have been
studying blind.*
**One question the viewer must be asking at 0:03:** *"Which questions repeat?"*

> **Hook rationale.** Pain + specificity + an open loop. The number 2,025 is the
> contrast: it reframes "the syllabus is huge" (A) into "the repeats are already
> counted" (B). It cannot be misread, and it is true.

| # | Time | Screen / visual | Camera | On-screen text | Voiceover |
|---|---|---|---|---|---|
| 1 | 0:00 | Black. One question row snaps in, its `★★★★` lighting up. | Macro on the stars, hard cut in | **2,025 questions.** | Your university repeats its questions. Nobody counted them. |
| 2 | 0:03 | `questions` — Pathology list, stars visible down the column | Slow pull-back revealing the full list | Until now | We did. Two thousand and twenty-five carry a year. |
| 3 | 0:06 | `browse` — four year cards | Lateral track across the cards | Four years | First year to final year. Every subject. One bank. |
| 4 | 0:09 | `questions` — scroll under finger | Push-in 1.08→1.14 | 5,545 questions | Five and a half thousand questions, already sorted. |
| 5 | 0:12 | Star cluster macro, `★★★★★` | Extreme macro, rack focus | Stars = frequency | The stars are not decoration. They are frequency. |
| 6 | 0:15 | Question row with `(Feb 23; Aug 19)` markers | Slow orbit right | Asked Feb 23. Aug 19. | Every year it was asked is printed on it. |
| 7 | 0:18 | Finger triple-taps a question | Macro on the tap, screen flares | Triple-tap | Triple-tap any question. Watch what happens. |
| 8 | 0:21 | `tca-note` — handwritten note builds in | Push-in through the screen | — | A full handwritten answer, written for that question. |
| 9 | 0:24 | `notes-renderer` — sections scrolling | Vertical track down the note | — | Structured the way an examiner wants to read it. |
| 10 | 0:27 | Real plate: `brachial_plexus_complete_scheme.jpg` | Camera settles, ambient dims | Its own diagram | And the diagram that belongs to that exact question. |
| 11 | 0:30 | `single-note-diagram` — plate above the theory | Pull back to show both | Picture, then theory | Picture first. Then the theory that explains it. |
| 12 | 0:33 | `chapter-diagrams` — chapter scrolling, plates between sections | Long vertical glide | Never a wall of images | Every plate sits beside the text it illustrates. |
| 13 | 0:36 | Real plate: `ulnar_nerve_course_branches.jpg` | Macro, slow drift across labels | Hand-drawn | Nine hundred and fifteen plates, drawn for these questions. |
| 14 | 0:39 | Textbook spine motif dissolving into a note | Morph transition | Textbook-grounded | Grounded in the standard textbook for that subject. |
| 15 | 0:42 | `askai` — question typed, answer streaming | Push-in on the answer | Ask anything | Ask it anything. It answers like your tutor. |
| 16 | 0:45 | `chatdemo` — MCQ options appearing | Cards assemble in 3D | Instant MCQs | Ask for MCQs and it writes you a set. |
| 17 | 0:48 | `flashcards-decks` — deck grid | Orbital move around the decks | Spaced repetition | Turn any chapter into spaced-repetition flashcards. |
| 18 | 0:51 | `anki-study` — card flip | Card flips toward camera | — | The scheduler brings each card back exactly when needed. |
| 19 | 0:54 | `apkg-1-hub` — Anki import row | Push-in on the import row | Import your Anki | Already have an Anki deck? Import it. It just opens. |
| 20 | 0:57 | `notes` — user note with stylus ink | Macro on the pen stroke | Write. Draw. | Write your own notes. Draw on them with a stylus. |
| 21 | 1:00 | Palm resting, pen drawing, fingers ignored | Extreme macro on the nib | Palm rejection | Rest your hand on the screen. It ignores your palm. |
| 22 | 1:03 | Note with a photo attachment | Pull back revealing the note | Your ward photos | Photos, recordings and PDFs live inside your notes. |
| 23 | 1:06 | `timer` — pomodoro running | Slow push-in on the dial | Focus | Start a session. Something grows while you work. |
| 24 | 1:09 | `treegallery` — species grid | Lateral track across the trees | 12 species | Twelve species, each unlocked by hours you actually focused. |
| 25 | 1:12 | Tree wilting as app backgrounds, then recovering | Camera holds, light dims then lifts | It withers. It survives. | Leave mid-session and it withers. Your minutes still count. |
| 26 | 1:15 | `progress` — streak, XP, heatmap | Pull back to full screen | Your year | Your streak, your level, your whole year mapped. |
| 27 | 1:18 | `glass-home` — Liquid Glass theme | Slow orbit, specular highlights travel | Make it yours | Four themes, or build your own from four colours. |
| 28 | 1:21 | Wallpaper set behind glass panes | Camera drifts, panes refract | — | Set a wallpaper and the surfaces bend the light. |
| 29 | 1:24 | `home` — full app, everything in place | Wide hero, gentle float | Orbit MBBS | Every question, every plate, every note. Offline. |
| 30 | 1:27 | Logo on obsidian, Play badge | Settle, subtle overshoot | **Orbit MBBS QBank** | Stop studying blind. Orbit MBBS. On Google Play. |

---

# SCRIPT B — "2 AM"
**Framework:** Pain hook → Experimenter. **Emotion:** *panic, then relief.*
**One question at 0:03:** *"What do I do in six hours?"*

> **Hook rationale.** The strongest pain in the niche, stated as a scene rather
> than a feeling. No product for the first six seconds — the viewer has to
> recognise themselves first. Pain hooks carry roughly twice the reach of a
> feature open, and this one is universal to every MBBS student alive.

| # | Time | Screen / visual | Camera | On-screen text | Voiceover |
|---|---|---|---|---|---|
| 1 | 0:00 | Dark room. Phone face-down. `2:04 AM` glowing. | Static macro, then a slow tilt up | **2:04 AM** | It's two AM. Your exam is in six hours. |
| 2 | 0:03 | Stack of unopened notes, one page turning | Slow push toward the stack | 400 questions | Four hundred questions. You've written notes for nine. |
| 3 | 0:06 | Phone lights up — `home` | Whip-pan into the screen | — | Okay. Here's what actually saves you tonight. |
| 4 | 0:09 | `browse` → subject tapped | Push-in through the tap | Pick your subject | Open your year. Pick the subject you're sitting. |
| 5 | 0:12 | `questions` — star column | Camera glides down the stars | Start with 5 stars | Start with the five-star ones. Those repeat most. |
| 6 | 0:15 | PYQ markers `(Feb 23; Aug 19; Feb 18)` | Macro, rack focus along the years | It came 3 times | This one came three times. It's coming again. |
| 7 | 0:18 | Triple-tap gesture | Macro on the finger | Triple-tap | Triple-tap it. Don't type anything. Just tap. |
| 8 | 0:21 | `tca-note` writing itself in | Push through the glass into the note | — | A full written answer. In about ten seconds. |
| 9 | 0:24 | Real plate: `calots_triangle` style plate | Camera settles on the plate | With the diagram | With the diagram you'd have to draw in the exam. |
| 10 | 0:27 | `notes-renderer` — headings, bullets, PYQ chips | Vertical glide down sections | Exam-shaped | Headings, points, and the years it was asked. |
| 11 | 0:30 | Scroll: plate → theory → plate → theory | Continuous vertical travel | Image. Theory. Image. | Picture, then its theory. You never scroll hunting. |
| 12 | 0:33 | Highlighted bold terms in the note | Macro, terms glow softly | The examinable words | The words worth marks are already marked for you. |
| 13 | 0:36 | Regenerate button pressed | Quick push-in, note refreshes | Not enough? | Want it deeper? Regenerate. Or fix it with AI. |
| 14 | 0:39 | `askai` — typed question | Camera pushes into the field | Ask it | Still stuck? Ask. It explains it properly. |
| 15 | 0:42 | `chatdemo` — MCQ set generating | Cards deal into 3D space | Test yourself | Ask for MCQs and quiz yourself right there. |
| 16 | 0:45 | `flashcards-decks` | Orbital drift | Make cards | Turn the chapter into flashcards in one tap. |
| 17 | 0:48 | `anki-study` — card flipping | Card rotates to camera | — | It shows each card again right before you'd forget. |
| 18 | 0:51 | `apkg-1-hub` — import | Push-in | Your Anki works | Your senior's Anki deck? Import it. It opens. |
| 19 | 0:54 | Progress tick on a question row | Macro, checkbox fills | 1 down | Tick it. That's one you never have to reopen. |
| 20 | 0:57 | XP toast rising | Camera follows the toast up | +XP | It counts everything you finish. Quietly. |
| 21 | 1:00 | `timer` — 25:00 starting | Slow push-in on the dial | 25 minutes | Set twenty-five minutes. Put the phone down. |
| 22 | 1:03 | Sapling growing on the timer screen | Macro, tree grows in real time | — | A tree grows the whole time you stay focused. |
| 23 | 1:06 | Music player opening | Pull back, player slides up | Your own music | Play your own music. Nothing streams. Nothing uploads. |
| 24 | 1:09 | Tree fully grown, session ends | Camera pulls back, chime lands | Session complete | Session done. That's twenty-five real minutes. |
| 25 | 1:12 | `progress` — streak counter ticking | Push-in on the streak | Day 12 | Your streak survives on your phone. No account needed. |
| 26 | 1:15 | Heatmap filling across the year | Lateral track over the grid | — | Every day you studied, coloured in. |
| 27 | 1:18 | Airplane mode toggled, app still working | Camera holds steady | Works offline | Hostel wifi died? The whole bank works offline. |
| 28 | 1:21 | `glass-home` theme switch | Orbit as surfaces re-light | Make it yours | Make it look how you want. Even the colours. |
| 29 | 1:24 | Sunrise light, phone on desk, notes closed | Slow pull back, warm grade | 8 AM | Eight AM. You're not walking in empty-handed. |
| 30 | 1:27 | Logo, Play badge | Settle with gentle overshoot | **Orbit MBBS QBank** | Orbit MBBS. Free on Google Play. |

---

# SCRIPT C — "Draw It From Memory"
**Framework:** Contrarian → Magician. **Emotion:** *a specific, sharp inadequacy.*
**One question at 0:03:** *"Could I actually draw that?"*

> **Hook rationale.** This is the contrarian angle: everyone optimises reading,
> and reading is not what the diagram marks test. It challenges a belief the
> viewer holds about their own preparation, and the visual — a blank sheet and a
> timer — does the work before the voice arrives. Highest-risk, highest-ceiling
> of the three.

| # | Time | Screen / visual | Camera | On-screen text | Voiceover |
|---|---|---|---|---|---|
| 1 | 0:00 | Blank exam sheet. Pen hovering. Timer starts. | Static macro, timer ticking | **Draw the brachial plexus.** | You can explain the brachial plexus. Now draw it. |
| 2 | 0:03 | Pen still hovering. Nothing drawn. Timer at 0:12. | Slow push toward the blank paper | From memory | From memory. Four minutes. Most people freeze here. |
| 3 | 0:06 | Real plate `brachial_plexus_complete_scheme.jpg` slams in | Hard cut, plate fills frame | This is the mark | This is what the examiner wants on the page. |
| 4 | 0:09 | Plate labels illuminating one by one | Macro drift across roots and trunks | Roots. Trunks. Cords. | Roots, trunks, divisions, cords, branches. All labelled. |
| 5 | 0:12 | Pull back — plate is inside the app | Dramatic pull-back reveal | Inside the app | It's already in the app. Attached to that question. |
| 6 | 0:15 | `questions` — the plexus question, triple-tapped | Push-in through the tap | Triple-tap | Triple-tap the question. The plate comes with it. |
| 7 | 0:18 | `single-note-diagram` — plate above theory | Camera settles, both visible | Picture, then theory | Picture first. Then the answer that explains it. |
| 8 | 0:21 | Real plate `ulnar_nerve_course_branches.jpg` | Lateral track across the plate | Not a stock image | Drawn for that question. Never a neighbour's picture. |
| 9 | 0:24 | Grid of many plates assembling | Camera pulls back through the grid | 915 plates | Nine hundred and fifteen of them across the bank. |
| 10 | 0:27 | Shoulder joint plate, coronal | Slow orbit around the plate | — | Shoulder joint. Thyroid. Pharynx. Tongue. Uterus. |
| 11 | 0:30 | `chapter-diagrams` — plates between sections | Long vertical glide | Beside its own text | Each one sits beside the paragraph it belongs to. |
| 12 | 0:33 | Note scrolling: theory → plate → theory | Continuous travel down | No scrolling back | You never scroll up hunting for the picture again. |
| 13 | 0:36 | `notes-renderer` — comparison table building | Table assembles column by column | — | Comparisons build as tables. Steps build as flowcharts. |
| 14 | 0:39 | PYQ chips: `3× ASKED IN FEB 23…` | Macro, chips pop in | 3× asked | And it tells you how often it has been asked. |
| 15 | 0:42 | Textbook motif morphing into the note | Morph transition | Textbook-grounded | Written from the standard textbook for that subject. |
| 16 | 0:45 | `askai` streaming an explanation | Push-in on streaming text | Ask deeper | Push it further. Ask why. It answers properly. |
| 17 | 0:48 | `notes` — user opens blank page, picks pen | Macro on the pen picker | Now you draw | Now draw it yourself. Blank page. Real stylus. |
| 18 | 0:51 | Stylus drawing the plexus, palm resting | Extreme macro on the nib | Palm rejection | Rest your palm on the glass. It only takes the pen. |
| 19 | 0:54 | Highlighter sweeping under the writing | Macro, wash goes under ink | Highlighter | Highlighter washes under your writing, never over it. |
| 20 | 0:57 | Colour wheel opening | Camera orbits the wheel | Any colour | Six pens, or any colour off the wheel. |
| 21 | 1:00 | Eraser removing one stroke cleanly | Macro on the rubber | Two erasers | Rub out a whole mark, or just the middle of a line. |
| 22 | 1:03 | Finished hand-drawn plexus beside the plate | Pull back, both side by side | Yours vs the plate | Compare yours against the plate. That's the drill. |
| 23 | 1:06 | `flashcards-decks` — image card | Cards assemble | Drill it | Make it a flashcard. Drill it until it's automatic. |
| 24 | 1:09 | `anki-study` — image card flipping | Card rotates to camera | — | It returns exactly when you're about to forget it. |
| 25 | 1:12 | `timer` with tree growing | Push-in on the dial | 25:00 | Twenty-five focused minutes. A tree grows for it. |
| 26 | 1:15 | `treegallery` | Lateral track | 12 species | Twelve species. Earned in hours, not coins. |
| 27 | 1:18 | `progress` — heatmap and streak | Pull back to full | Your year | Everything you drilled, mapped across the year. |
| 28 | 1:21 | `glass-home` — Liquid Glass, wallpaper behind | Orbit, light refracting through panes | — | And it looks like something you'd want to open. |
| 29 | 1:24 | Cut back: exam sheet, now fully drawn, timer 3:40 | Slow pull back from the paper | 3:40 left | Same question. Same four minutes. Different outcome. |
| 30 | 1:27 | Logo, Play badge | Settle, gentle overshoot | **Orbit MBBS QBank** | Orbit MBBS. Free on Google Play. |

---

## Production notes that are not optional

1. **The phone moves, the screen never warps.** All camera motion is
   `transform: scale(cameraZoom) rotateX(rx) rotateY(ry) translate3d(x,y,z)` on
   the device container. Never `scale()`/`translateY()` on the `<img>` inside the
   screen — that is what cropped the nav bar and clipped the Dynamic Island last
   time.
2. **Every screen is a real, current capture.** Regenerate with
   `cd mobile && node preview/shoot.mjs` before rendering. Ten of the fourteen
   screens the old asset manifest named are *not* in `screenshots/` — rendering
   against that manifest is how "this diagram could not be loaded" reached a cut.
3. **Diagram plates come from the `diagrams` bucket**, downloaded to
   `public/app_screens/`. Never hotlinked at render time.
4. **Captions never below `bottom: 300px`.**
5. **No neon rectangles.** Direct attention with focus, light and camera only.
6. **Shot 1 of each script must survive being watched with sound off.** The text
   hook and the visual hook carry it alone.
