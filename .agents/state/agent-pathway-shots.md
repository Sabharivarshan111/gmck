# agent-pathway-shots — capture pathway flashcards on both apps

## Status: DONE (2026-09-04)

8 PNGs in /home/user/gmck/screenshots/pathway/, every one opened and looked at.
NOT committed (task said not to). Only file changed: mobile/preview/pathway-card-shots.mjs.

## What happened
- The previous agent's harness `mobile/preview/pathway-card-shots.mjs` had never
  been run. Ran it: it PASSED first time. No renderer change was needed —
  PathwayFlow (native + web) and pathwayCards.ts were correct as written.
- But the pictures it produced asserted more than they showed. Four defects, all
  in the capture rather than the renderers:
  1. native-2-back.png was CUT OFF at step 6. `fullPage` does not expand a
     react-native-web ScrollView (overflow:auto box, not the document), so the
     HIGH-YIELD callout and grade row were outside the frame while `innerText`
     assertions passed on them.
  2. web-2-back.png: `fullPage` + `position:fixed` painted the bottom nav bar
     straight across the middle of the card, over step 6 and over "HIGH-YIELD".
  3. Web shots opened the FIRST Biochemistry chapter ("MOLECULAR AND FUNCTIONAL
     ORGANISATION OF CELL") while the stub returns the glycolysis deck whatever
     is opened — header and cards disagreed.
  4. No web degraded (no-plate) capture existed at all.

## Fixes applied to the harness
- `shot()` helper: back states captured at a 2000px-tall viewport, `fullPage`
  OFF. Fronts stay at the 980px phone height.
- `mustShow` guard inside `shot()`: every named element's bounding box must lie
  inside the rectangle about to be written to disk. This is the guard that stops
  defect 1/2 recurring — an assertion on innerText cannot see a crop.
- Web navigation now names CARBOHYDRATE METABOLISM.
- Added web-4-no-plate.png (plate served/refused via a `platesLoad` flag,
  localStorage cleared between runs so the queue hands back card 1 again).

## Commands, all green
  cd mobile && npx tsc --noEmit            -> exit 0, no output
  cd mobile && npx eslint . --quiet        -> exit 0, no output
  cd mobile && npm run check:pathway-cards -> OK
  cd mobile && npm run check:one-app       -> OK
  npm run build      -> built in 8.67s
  cd mobile && node preview/pathway-card-shots.mjs /home/user/gmck/screenshots/pathway -> OK

## Unproven
react-native-web is not Android. No native driver, no gesture timing, no
RuntimeShader, no TalkBack. The plate bytes are a STAND-IN SVG (sandbox cannot
reach Supabase storage — 403 on CONNECT), so the real
glycolysis_pathway_energetics.jpg has never been seen in a card. The deck comes
from a fixture/stub, not from a live `generate-flashcards`.
