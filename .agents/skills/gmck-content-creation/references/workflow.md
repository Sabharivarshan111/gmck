# Transcript-led production

## Timing model

Keep a machine-readable manifest in the media project's own directory, not in the installed skill:

```json
{
  "fps": 30,
  "output": {"width":1080,"height":1920,"duration":54.8},
  "audio": {"voice":"original","bgm":false,"sfx_source":"downloaded"},
  "segments": [{"source":"hook.mp4","src0":0.167,"src1":4.233,"out0":0,"out1":4.066}],
  "events": [{"kind":"strike","text":"MONEY LOST","source":"hook.mp4","source_time":3.25,"edit_time":3.083}],
  "variants": [{"name":"Mint Punch","layout":"presenter + native-app/decision inserts","bgm":false}]
}
```
Map an event within a retained segment by `edit_time = out0 + source_time - src0`. Handle removed gaps explicitly; never assign a spoken word to an arbitrary nearest frame without checking it. Keep video/audio cuts identical; derive dimensions after rotation, and quantize to the source or selected output frame grid. Distinguish approximate requested ranges from exact duration. Do not pad with dead air to meet a historical target.

## Speech-led emphasis example

For the user's wrong-tool reel, derive timings from the new recording rather than reusing old seconds:

| Spoken idea | Graphic | Sound |
|---|---|---|
| Wrong AI tool | Immediate large headline | Short downloaded impact |
| Lost a lot of money | Readable MONEY LOST; draw strike on the loss phrase; no invented amount | Cash-loss/register accent + brief scratch |
| Lovable | Official identifiable logo/name; cross out for this project's experience | Pop then scratch |
| Website/planner versus native goal | Labelled browser and phone pictograms | Snap whoosh on insert |
| Rebuilt in React Native | Old route retracts; new route draws to React Native | Whoosh + landing pop |
| Choose language/framework first | RIGHT TOOL FIRST; highlight the spoken takeaway | Restrained impact/ding |
| UI elements and libraries | Component tiles assemble | Short UI clicks |
| Flutter | Correct logo and name on mention | Pop |
| React web / React Native mobile | Two clearly labelled platform cards | Short transition |

Avoid converting a speaker's experience into a universal, current capability claim about a product. Keep generated UI explanatory, not a fabricated recording. Do not fabricate testimonials, amounts, metrics or endorsements.

## Four distinct Electric Creator treatments

- Mint Punch: dark/mint bold headline boxes, quick punches, native-goal and UI-grid inserts.
- Signal Receipt: paper/yellow, condensed receipt-like hierarchy, project-route and platform inserts, measured push/pull.
- Violet Tech: dark/violet modular UI, migration arrows, library stack and precision keynote transitions.
- Coral Kinetic: coral/off-white oversized type, strong strike, comparison reflow and closer editorial framing.

These are starting directions, not a fixed template. Let the transcript determine the graphic, keep the face clear and design new scenes. Match names to what actually exists; do not label a tint-only copy a new design.

## Medical phase coverage

Create a coverage table: phase, speech start/end, animation start/end, valve states, flow and caption. For the cardiac cycle include atrial systole; isovolumetric contraction; rapid ejection; reduced ejection; isovolumetric relaxation; rapid filling; diastasis. Respect the chosen teaching convention for timing and verify any new clinical claim. AV/semilunar labels must remain visible beneath long titles. Each phase needs its own correct depiction; short matched cutaways are valid only if requested, while continuous split-screen must actually remain continuous except disclosed repair inserts.

## Material and source hygiene

Use the current attachment paths first. Recover older saved projects via the host's Library tools when needed; do not assume yesterday's scratch directory survives. Record exact resolved file identity with current versions when editing saved files. Treat older finished videos as examples, not as the new user's footage. Preserve original camera audio separately from low-rate ASR audio. Keep downloads, cut maps, corrections and QA in the project so a new chat can resume without this conversation.
