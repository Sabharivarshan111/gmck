---
description: Motion rules for the React Native app — what to use, and what never ships
---

# Motion

The house motion system is `mobile/src/theme/motion.ts`. Springs, easing
curves, the duration scale, momentum projection and rubber-banding all live
there. **Do not hand-roll an animation.**

Full reference, in the repo, worth opening before any real animation work:

- `.claude/skills/review-animations/STANDARDS.md` — exact curves, durations,
  the interruption rules, the accessibility rules
- `.claude/skills/animate/SKILL.md` — the decision order for building one
- `.claude/skills/apple-design/README.md` — the index of which web technique
  became what in React Native, and which were deliberately **not** taken

## Use the primitive, not `Animated` directly

| Use | Component |
|---|---|
| Anything tappable | `components/Touchable.tsx` |
| Bottom sheets | `components/Sheet.tsx` |
| Either/or decisions | `components/Dialog.tsx` |
| A value on a range | `components/Slider.tsx` |
| Subject cards | `components/HoloCard.tsx` |
| Rearranging Home | `components/Reorderable.tsx` |
| Sorting subject cards | `components/SortableGrid.tsx` |
| Back navigation | `components/BackButton.tsx` |
| Long lists | spread `components/listTuning.ts` onto the `FlatList` |

## The rules that are checked, or that broke something once

- **Every `Animated.timing` names an `easing` from `EASE`.** React Native's
  default is an ease-in-out, which starts slow and delays the exact moment the
  user is watching. Omitting `easing` is the bug, not the default.
- **Never ease-in on UI.** Entering and exiting are ease-out; moving and
  morphing on screen are ease-in-out.
- **UI motion stays under 300ms.** Press feedback 100–160ms; sheets and
  drawers may go to 500ms and no further.
- **`useNativeDriver: true` on everything.** A busy JS thread — question-bank
  walks, Supabase round-trips — must not be able to drop animation frames.
  react-native-web has no native driver and warns about this in the preview;
  that warning is expected and is not a defect.
- **Nothing scales from 0.** Entrances start at 0.6–0.9. A `scale(0)` entrance
  reads as materialising out of nowhere.
- **Progress bars use `scaleX` with `transformOrigin: 'left'`, never an
  animated `width`.** Width is a layout property: animating it forces layout,
  paint and composite every frame, on the JS thread, for every bar on screen.
- **Springs, not durations, for anything a finger touches.** A spring animates
  from the value's *current* position, so grabbing a moving element continues
  from where it visibly is instead of jumping.
- **A gesture that fights a scroll must disable the scroll.** Set
  `scrollEnabled={false}` for the length of the drag. Otherwise React Native
  prints `ScrollView doesn't take rejection well - scrolls anyway`, the page
  scrolls, and the gesture silently does nothing. This shipped once and took
  three bug reports to find, because mouse-driven testing never reproduces it —
  `check:smoke` now drives real touch events for exactly this reason.
- **PanResponders built in a `useMemo` must not depend on values that change
  during the gesture.** The replacement never saw the grant, and the drag dies
  after one frame.
- **Reduced motion is not optional.** `useReducedMotion()` is wired into every
  primitive and new motion handles it in the same commit — as a gentler
  equivalent, not as the absence of feedback.

## Deliberately not done

Recorded so nobody "fixes" them: no backdrop blur (React Native has no
equivalent without another dependency — `GlassSurface` draws a specular
highlight, translucency and float instead), no haptics on navigation or
ordinary taps (only a commit or a completion earns one), no stagger.

Also: **never put `elevation` on a view with no background colour.** Android
takes the shadow outline from the view bounds, so a large `borderRadius`
renders as a visible straight-edged polygon.
