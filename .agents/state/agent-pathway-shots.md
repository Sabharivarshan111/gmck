# agent-pathway-shots — capture pathway flashcards on both apps

## Status: HALF DONE — 7 PNGs captured and looked at, 4 evidence defects found

### Done
- Read 92-verify.md + show-it-works.
- RAN `node preview/pathway-card-shots.mjs /home/user/gmck/screenshots/pathway`
  (the previous agent never ran it). It PASSED on first run, no code changes needed.
- Looked at all 7 PNGs in /home/user/gmck/screenshots/pathway/.
  Renderers themselves look correct: mode chip, plate, numbered rail, HIGH-YIELD
  callout, and the degraded copy "The diagram could not be loaded — the steps
  above are the answer." all draw properly on native.

### Defects found — in the CAPTURE, not the renderers
1. native-2-back.png is CUT OFF at step 6. fullPage does not expand a
   react-native-web ScrollView, so HIGH-YIELD + grade row are absent from the
   picture even though the harness asserted their text.
2. web-2-back.png: the fixed bottom nav is painted ACROSS THE MIDDLE of the
   fullPage capture, hiding step 6 and the HIGH-YIELD heading. Classic
   fullPage + position:fixed artifact.
3. web shots show header "MOLECULAR AND FUNCTIONAL ORGANISA…" while the cards
   are carbohydrate metabolism — harness clicked the FIRST chapter and the stub
   returns the fixture regardless. Incoherent evidence.
   Fix: target "CARBOHYDRATE METABOLISM" (exists, src/data/topics/biochemistry/paper1.ts:49).
4. No WEB degraded (no-plate) capture at all. Task requires the degraded case.

### Next
- Edit mobile/preview/pathway-card-shots.mjs: tall-viewport captures (no
  fullPage) for back states; open CARBOHYDRATE METABOLISM on web; add
  web-4-no-plate. Re-run, re-look at every PNG.
- Then tsc/eslint/check:pathway-cards/check:one-app if any renderer changed
  (so far NONE changed).
