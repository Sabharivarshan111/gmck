---
description: The two strings the Play Console asks for at upload — what to write in Release name and Release notes, and the two things that may never appear in them
---

# The Play Console form is part of the release

`40-releases.md` covers cutting the build. This covers the last step, which was
being skipped: **a build is not delivered until the owner has the two strings
the Play Console asks for**, pasted into the chat ready to use.

It has its own file because 40-releases.md is against the 12,000-char cap and
has been trimmed three times to make room for smaller things than this.

## Give both, unasked, the moment a release is dispatched

Not when the build finishes — the build takes about twenty minutes and the
notes cost nothing, so writing them while it runs means the owner can fill the
form the second the `.aab` appears.

They upload **from a phone**. They are standing in a form with a red "Release
name is required" under an empty field. Anything that makes them compose prose
at that moment is the release not being finished. This is not hypothetical: v15
was built, signed and linked to a GitHub release, and the next message was the
owner in the Play Console with an empty form asking for the text.

Two fenced blocks, ready to paste, nothing between them that has to be read
first.

**Release name** — internal, never shown to a reader. Play's own convention is
the version:

    15 (0.0.0.15)

Read it out of `mobile/android/app/build.gradle`. Never from memory and never
from a doc in this repo: `CLAUDE.md` said "13 is live" for weeks while 14 was.

**Release notes** — wrapped in the language tag the form pre-fills, because
that is what it expects pasted back:

    <en-US>
    New
    • …

    Fixed
    • …
    </en-US>

**500 characters per language and Play refuses the paste over it.** Count
before sending; aim for ~450 so a later edit does not tip it over. Drop a
heading entirely rather than writing "None" under it.

The `app_releases` row for this versionCode is the same list the app's own
"What's new" card shows, so the two should agree — but rewrite it rather than
pasting it. That table is written for a card with more room.

## Write them for a student, not for the changelog

Every bullet is something the reader can notice. Not a refactor, not a check,
not a module.

| Not this | This |
|---|---|
| Fixed `use-xp-stream` baseline drift | Un-ticking a question no longer says you gained XP |
| Added FirstRun gate at the app root | Your year is asked on first open, not chosen for you |
| `filterable` now counts both tabs | The search box no longer vanishes on the Essays tab |

If a bullet cannot be written that way it does not belong in the notes.

## What may never appear

**No price for anything bought through Razorpay.** Ad-free is sold outside Play
Billing, and Play requires Play Billing for digital goods consumed in the app.
The release notes are the one place a reviewer always reads, so `₹150` there
puts a policy problem directly in front of them.
`.agents/queue/play-billing-migration.md` is the full position.

Say out loud that it was left out, and offer the version with it. It is the
owner's app and their risk to take — one short paragraph, then move on.

**Nothing that has never worked once.** The ad-free purchase has still never
had a real payment through it (`razorpay-untested` in
`.agents/state/blocked.json`). A feature whose first real use might fail is
better shipped quietly and announced next time.

**No model name, no agent, no commit hash, no "AI".** These notes are the app
talking to its readers.

Claude Code has the same material as `.claude/skills/play-release-notes/`,
which it loads on its own; this file is how Antigravity gets it.
