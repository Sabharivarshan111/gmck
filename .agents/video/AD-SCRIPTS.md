# Where the ad scripts actually are

`remotion-ad/src/scripts/` — one TypeScript file per ad, twenty-six of them,
plus `bookends.ts` which stamps the opening and closing shot onto all of them
and `silent.ts` which derives each ad's muted twin.

```sh
cd remotion-ad
npm run check:ad-truth      # every line matches the screenshot under it
npm run check:reel-layout   # every caption fits the band it is drawn in
npm run preflight           # the assets, the budget and the sixty seconds
```

To read the whole set as prose, the scripts are the document: each shot is one
line carrying its spoken line (`vo`), the caption a muted viewer reads
(`silentText`) and the screenshot it plays over (`screen`).

## Why the transcript that used to be here is gone

This file held the full shot-by-shot table for three 90-second ads, and it had
stopped being true in every way a document can:

- **The format.** Three ads became twenty-six, and most of them are 60-second
  reels rather than 90-second films.
- **The numbers.** It opened with a table headed "Every number below is real",
  listing 5,545 questions, "2,025" carrying a year marker and "915 plates".
  Every one of those was superseded, and the ads now count nothing at all —
  see `.agents/rules/97-video-ads.md`.
- **The lines themselves.** "Never a neighbour's picture", "exactly when
  needed", "Nine hundred and fifteen plates" — the app's owner rewrote all
  twenty-six scripts by hand and struck those phrasings by name.
- **The geometry.** "Captions sit at bottom 300-320px" was three components
  quoting each other about a layout that had changed. `captionBand.ts` owns it
  now and `check:reel-layout` recomputes it from the real scripts.

A transcript kept beside the code is a transcript that drifts from it, silently,
and this one drifted for months. The rules that survived the ads themselves are
in `.agents/rules/97-video-ads.md`; the words are in the scripts.
