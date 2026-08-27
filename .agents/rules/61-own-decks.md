---
description: Decks the reader makes — written by hand, generated for one phone, or carrying photos from the gallery
---

# Decks you make yourself


Three ways in, one storage:

| From | What it makes |
|---|---|
| Flashcards → **Decks you write** | an unfiled deck, in My decks |
| A chapter's **+** → *Generate with AI* | a deck of generated cards, filed under that chapter |
| A chapter's **+** → *Write your own* | an empty deck, filed under that chapter |

All three are `CustomDeck`s in `orbit:anki:custom-decks`, **on the phone only**.
`chapter` is what files one; clearing it moves it back to My decks. Filing
changes nothing else — the schedule is keyed on `customDeckKey(id)`, so a moved
deck keeps its history.

**A personal AI deck must never be built under the chapter's own subtopic key.**
The server caches on `year::subject::subtopicKey`, so it would overwrite the
deck everyone else reads, and because card ids are hashed from the front, every
reader's schedule for every changed card would reset with it. `personalDeckKey()`
suffixes the key; `noCache: true` tells a new enough server not to keep the row
at all. The suffix is what makes it safe on a server that predates the flag, so
**do not remove it** when `noCache` ships.

## Pictures on a card are data URIs, not file paths

`lib/cardImage.ts`. The picker returns a URI into the app's *cache* directory,
which Android empties whenever it wants the space. Fine for the wallpaper — one
image, and a load error falls back to the plain theme — but on a card the
picture *is* the card, and twenty of them turning into grey rectangles a month
later is not a deck any more.

So the bytes are downscaled hard (1200px, quality 0.6) and kept inline, with a
700 KB cap each and 40 image cards to a deck. The whole deck list is **one**
AsyncStorage value; those two numbers are what keep it a safe size.

`launchImageLibrary` needs **no permission** and must not be given one — the
same rule the wallpaper follows.

**The picture goes on the back.** A visual card may have an empty back, because
the diagram answers it; a written one may not. A diagram shown before "Show
answer" is the answer.

## The per-card clock paces, it does not judge

`settings.cardSeconds`, 0 (off, the default) to 120. A bar drains beside the
card and turns amber when it runs out, and **nothing happens** — no auto-advance,
no auto-reveal. Spaced repetition only works if the grade is honest, and a card
that flips itself has graded for you.

It is `scaleX` with `transformOrigin: 'left'` at `EASE.linear` — the one place
linear is right, since any easing on a clock is a clock that lies — and under
reduced motion the bar does not sweep at all, reporting the outcome by colour
instead.

## Study notes are on-device too, and enforced

My Progress → Notes is `hooks/useUserNotes.ts` + `lib/noteImages.ts`, both
**AsyncStorage only**. No row, no bucket, no account — the owner's decision, and
the point of the feature.

`npm run check:cloud-ids` lists both files as `LOCAL_ONLY` and fails if either
imports the Supabase client at all. It briefly did sync, and briefly had a
private storage bucket; both are gone and the columns that went with them were
dropped. Do not add them back.

Pictures are one AsyncStorage key each (`orbit:note-image:{id}`); the note holds
ids, because the note list is a single value and base64 photographs inside it
would make reading the *titles* a multi-megabyte parse. Deleting a note deletes
its pictures.

The calendar on the same screen **is** synced. That is deliberate: an exam date
is a fact about a course, a study note is a fact about a person.
