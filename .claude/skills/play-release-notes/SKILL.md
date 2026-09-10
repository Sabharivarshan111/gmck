---
name: play-release-notes
description: Hand the app owner a ready-to-paste Play Console release name and release notes, in the chat, every time a build is cut. Use whenever a release or internal build is dispatched, whenever versionCode is bumped, whenever the owner says they are uploading to Play or shows the Play Console release form, and whenever asked what to put in "Release name" or "Release notes". Also covers what must never appear in those notes.
---

# The Play Console release form is part of cutting a build

## The rule

**A build is not delivered until the owner has the two strings the Play Console
asks for.** Give them in the chat, in fenced blocks, ready to paste — do not
describe them, do not link to them, do not say "you can write something like".

The owner uploads from a phone. They are standing in a form with two required
fields and a red "Release name is required" under one of them. Anything that
makes them compose prose at that moment is the release not being finished.

This exists because it happened: v15 was built, signed, published to a GitHub
release with the `.aab` linked — and the next message was the owner in the
Play Console with an empty form asking for the text.

## What to give, every time

Two fenced blocks, in this order, with nothing between them that has to be
read before pasting.

### 1. Release name

Internal only; Play never shows it to a reader. Use the version, in Play's own
convention:

```
15 (0.0.0.15)
```

Read it from `mobile/android/app/build.gradle` — never from memory, and never
from a doc in this repo. `CLAUDE.md` said "13 is live" for weeks while 14 was.

### 2. Release notes

Wrapped in the language tag the form pre-fills, because that is what it expects
pasted back:

```
<en-US>
New
• …

Fixed
• …
</en-US>
```

**500 characters per language, and Play refuses the paste over it.** Count
before sending. Aim for ~450 so a later edit does not tip it over.

Two headings, `New` and `Fixed`, bullets under each. Drop a heading entirely if
it has nothing under it rather than writing "None".

Where the content comes from: the `app_releases` row for this versionCode is
the same list the app's own "What's new" card shows, so the two should agree.
Rewrite it for a reader rather than pasting it — that table is written for the
card, and the card has more room.

## Write them for a student, not for the changelog

Every bullet is a thing the reader can notice. Not a refactor, not a check, not
a module.

| Do not write | Write |
|---|---|
| Fixed `use-xp-stream` baseline drift | Un-ticking a question no longer says you gained XP |
| Added FirstRun gate at the app root | Your year is asked on first open, not chosen for you |
| `filterable` now counts both tabs | The search box no longer vanishes on the Essays tab |

Say what changed for them. If a bullet cannot be written that way, it does not
belong in the notes.

## What must never go in the notes

**No price for anything bought through Razorpay.** Ad-free is bought outside
Play Billing, and Play requires Play Billing for digital goods consumed in the
app. The release notes are the one place a reviewer always reads, so naming
`₹150` or `₹300` there puts a policy problem directly in front of them.

Say so out loud when leaving it out, and offer the version with it — it is the
owner's app and their risk to take. Do not silently trim it and do not lecture:
one short paragraph, then move on. `.agents/queue/play-billing-migration.md`
has the full position.

**Nothing that has never worked once.** The ad-free purchase has still never
had a real payment through it (`razorpay-untested` in
`.agents/state/blocked.json`). Announcing a feature whose first real use might
fail is worse than shipping it quietly and mentioning it next time.

**No model name, no agent, no commit hash, no "AI".** The notes are the app
talking to its readers.

## When to do this without being asked

The moment a release build is dispatched — not when it finishes. The build
takes about twenty minutes; the notes cost nothing and mean the owner can fill
the form the second the `.aab` appears.

Also whenever `versionCode` is bumped, since that is the other half of the same
act: both files, an `app_releases` row, and the two strings for the form.
