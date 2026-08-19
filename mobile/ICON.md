# The app icon

## What is there now

A **reproduction**, drawn by `scripts/make-icon.py` from measurements of the
ORBIT artwork. It is close, not exact — the geometry was solved off the image
(the crest's radius comes from its chord and rise so its ends land on the big
ring's shoulders), but it is redrawn rather than copied.

## Replacing it with the real file — one command

```sh
cd mobile
python3 scripts/import-icon.py path/to/orbit.png
```

Then set the plate colour behind the adaptive icon in
`android/app/src/main/res/values/colors.xml` to the artwork's background,
commit, and push. The next build carries it.

That script does four things that copying a PNG into the folders does not:

1. **Trims the empty margin** before scaling. Artwork usually carries generous
   padding and Android adds its own — keep both and the icon lands on the home
   screen visibly smaller than every other app's.
2. **Drops the wordmark.** In a 48dp icon, "ORBIT MBBS QB" is about three
   pixels tall and unreadable, while taking the room the symbol needs. Every
   app does this with a lockup. `--keep-text` overrides it.
3. **Pads to square rather than stretching.** A stretched logo is worse than a
   wrong one.
4. **Writes the adaptive foreground** at 108dp with the art inside the 72dp
   safe zone, so a circular, squircle or teardrop mask cannot clip it.

## Why the adaptive icon matters

Without `mipmap-anydpi-v26/ic_launcher.xml`, Android 8 and later take the
legacy PNG and shrink it inside a white or grey plate — it cannot know which
part of a bitmap is safe to mask. That is how a dark icon ends up as a small
square floating in a light circle. The foreground and background are separate
layers so the launcher can mask to its own shape, and it gives the parallax on
launchers that do it.

## What to check after changing it

Android caches launcher icons aggressively. After installing, if the old icon
is still showing, it is usually the launcher rather than the build — restart
the phone before concluding the change did not work.
