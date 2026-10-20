# NEET-PG study UI — 20 October 2026

The former filter/list modal is replaced with an offline chapter library and a focused, one-question reader. The same React Native components serve Android and the production web app. Android stays at version 28.

## Design references

Reviewed primary product/documentation pages for interaction patterns, without copying assets or question content:

- [PrepLadder QBank](https://www.prepladder.com/courses/medical-pg/neet-pg-question-bank): subject/module discovery and saved revision.
- [AMBOSS study/exam modes](https://support.amboss.com/hc/en-us/articles/360036038991-Using-Study-Mode-Exam-Mode): question-first study flow with answer explanation on reveal.
- [AMBOSS AI learning](https://www.amboss.com/int/ai-mode-learning): contextual help alongside study.
- [UWorld product tour](https://medical.uworld.com/usmle/features/): focused reader and tutor explanations.
- [Apple material guidance](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass): use material to distinguish controls above content, with readable fallback.

ORBIT uses its existing typography, touchable, sheet, keyboard, image viewer and theme primitives. Clinical content remains solid and readable. No decorative glass is placed behind question text.

## Result

- Library: actual question/chapter totals, search, MBBS year segments, subjects, existing chapter taxonomy, saved questions and practice entry.
- Reader: full original question and options, independent selection, supplied answer/explanation on reveal, original illustrations with zoom, previous/next and persistent bookmark.
- ACEV button on every question opens a question-scoped discussion. Explain/compare/memory prompts, typed follow-ups, loading, retry and context preview. No automatic AI request on opening.
- Black & White is one new preset: black background, white text/accent, neutral cards. Decorative subject colours, emoji, moving sheen and wallpaper are suppressed. Clinical images and semantic status colours elsewhere remain meaningful.
- Glass: thinner rims, shorter/dimmer highlights and softer borders. Reduced transparency or increased contrast produces opaque surfaces. Black & White never uses glass.

## Data and AI boundaries

The release bank remains unchanged: 2,078 questions, 205 chapters, 467 embedded illustrations. The UI preserves literal supplied options, answer and explanation. No new question content or answer keys were generated in this change. Offline study/search/images/bookmarks require no service. ACEV requires connectivity and does not write to the bank.

Each request pins the complete stem/options/supplied key and bounded explanation, plus the latest eight history messages. It explicitly selects the existing service's clarification path so history is retained. Long discussions stay within the service's history limits. Images are not sent through the current text-only API; the panel says to describe them. The model is instructed to acknowledge unsupported reasoning rather than invent justification.

ORBIT's glass is not Apple's native Liquid Glass. Android 13+ can use the existing gated, throttled AGSL wallpaper snapshot shader. Web/older Android use SVG highlights. It does not refract arbitrary scrolling app content. Physical-device optical effects and keyboard/gesture timing require device validation.

## Verification

- Native, web and preview TypeScript passed; mobile ESLint passed.
- Reader/atomic installation tests, content integrity and retired-bank import graph passed.
- Dedicated discussion tests cover pinned context after forty turns, prompt/history limits, immutable keys and saved-ID filtering.
- Production-browser story passed at 360/390/430px, all five named presets, bundled offline reload, image zoom, chapter navigation, search pagination, private import, failed-import preservation and saved restart persistence.
- Browser AI service stub verifies request payload, clarification mode, retries, follow-up history, question isolation and unchanged stored answer. A separate live service smoke returned HTTP 200 and a nonempty response (1,153 characters). This verifies connectivity, not medical correctness of all model responses.
- Browser material test verifies actual glass surfaces, opaque increased-contrast fallback and restoration.
- Required release preflights, contrast, glass radius/shader guards and Android production JS bundle passed.
- General preview smoke could not complete reliably: its existing theme-menu selector `Themes` no longer matches the current UI. The production-browser story above exercises the changed feature directly. No global smoke success is claimed.

Screenshots in `docs/evidence/neetpg-redesign/` are inspected captures of the real shared UI at 390×844, not design mockups or Android GPU proof. AI panel screenshots show the empty input state, not a fabricated live reply.
