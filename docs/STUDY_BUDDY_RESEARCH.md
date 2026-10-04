# ORBIT Study Buddy — implementation and research

Status: expanded implementation ready for verification and publication. The user has explicitly authorized GitHub and Vercel publication in the current session; the CLI has no GitHub credentials, so the connected GitHub tools will publish the reviewed changes.

## What is implemented

- Tap the chat avatar to open Study Buddy. The same controls appear in Settings.
- Select Orbit or nine animals (dog, cat, crocodile, owl, rabbit, fox, penguin, bear, panda), each with three distinct Classic/Soft/Bold designs; change the name and accent colour; hide the buddy or enable quiet motion.
- All 27 animal designs are original generated artwork, bundled in three transparent 3×3 atlases. Orbit keeps the existing licensed bot engine. Recommended defaults are editorial choices for clear silhouettes and friendly small-avatar readability, not an empirical claim of best performance. All alternatives remain selectable. Existing bear/owl preferences migrate without losing names or study plans.
- Buddy appears alongside the pending response, beside the latest explanation, and inside the answered MCQ's result box. A mistake receives supportive feedback and a button that asks for the actual MCQ, options, correct answer and explanation to be explained. The app never grades arbitrary free text by an animation.
- 15-, 30-, and 60-minute plans divide time between understanding, active recall and reviewing. Start sends the relevant prompt through the existing source-grounded answer path. Completion is user marked, persists locally, and resets each local day. It is not a new XP reward or a second spaced repetition scheduler.
- Android's existing background reminder receives the buddy name, user-recorded total attendance, unfinished study plan, and today's cached unanswered MCQ. MCQ preview includes all four complete options when short enough; long questions receive an open-app prompt rather than truncated options. It never includes the correct answer or reuses yesterday's question.
- MCQ and plan notifications require explicit per-kind opt-in and the existing Daily reminder master switch/OS permission. Defaults are off. The existing one-per-day gate, permission checks and reboot scheduling remain.
- Browser notifications have the same content and safe click destinations, but its existing timer requires ORBIT to remain open. iPhone PWA background delivery is NOT implemented by this change.
- Existing English/Tamil/Tanglish answer presets, 5-mark answer and **15-mark essay** actions remain.

## Research decisions and sources

The linked repository is an MIT-licensed mascot design skill and a showcase image, rather than an animation/sprite library. Its README links to a separate download website. We used it as design context, not an executable dependency. Attribution would be required if copying substantial portions of its code/instructions. Original character creation does not establish an absolute legal guarantee.
- https://github.com/s1dashu/ip-as-logo-skill
- https://github.com/s1dashu/ip-as-logo-skill/blob/main/LICENSE

Retrieval practice with feedback and spaced practice informed the understand → recall → review sequence. Research does not establish that cute mascots themselves improve medical exam performance; that needs product evaluation.
- Primary randomized spaced education study: https://pmc.ncbi.nlm.nih.gov/articles/PMC5536283/
- Spaced repetition physician study: https://pubmed.ncbi.nlm.nih.gov/39250798/
- Retrieval feedback experiment: https://pmc.ncbi.nlm.nih.gov/articles/PMC10157468/

Interaction placement is our design inference: show the feedback at the point where the learner acts, so the explanation and next action stay together. No angry reaction, punishment, paid mascot unlock, or arbitrary streak penalty is added.

Notifications are platform features rather than animation canvases. Android supports expanded text and actions; iOS native apps use registered notification categories. iPhone web push requires Home Screen installation and a permission request initiated by a user gesture. A JavaScript timeout is not background push and was not represented as one.
- https://developer.android.com/develop/ui/compose/notifications/create-notification
- https://developer.android.com/develop/ui/compose/notifications/notification-permission
- https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers
- https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- https://developer.apple.com/documentation/usernotifications/handling-notifications-and-notification-related-actions

Motion uses the existing engine and primitives, honours OS reduced motion, and can be made quiet. Each animal is a static original illustration with state-dependent pose and feedback badge; it is not a full expression sprite pack. Animal artwork has no invisible perpetual engine loop. Idle card reactions do not run frame timers.
- https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html

## Verification

Passed: native TypeScript, web TypeScript, targeted ESLint, buddy model/persistence/rollover test, seven bot engine states, MCQ parsing/cards, diagram matching, 18 attendance arithmetic cases, reminder wiring, native notification module wiring, Kotlin override check, preview provider parity, version consistency, repository integrity, full Vercel assembly, Android production JS bundle (433 assets).

Not verified: visual rendering of this change, TalkBack, native gesture timing, native permission dialogs, background notification delivery or Kotlin compilation. The cloud browser could not open the local preview. A subsequent browser control attempt was rejected by browser policy; no workaround was attempted. New Android CI requires the pending publication.

The preceding language preset build is already live at https://orbitmbbs.vercel.app/ and its signed ad-free test APK succeeded at https://github.com/Sabharivarshan111/gmck/releases/tag/internal-391. That APK does NOT include Study Buddy changes from this checkpoint.

## Remaining before calling this shipped

1. Current explicit authorization covers publication to Sabharivarshan111/gmck branch codex/native-web-parity and Vercel. Publish only the reviewed changes.
2. Publish only the checkpoint's reviewed changes; run the existing ad-free Android workflow and verify its actual result. Do not upload to Play or change signing/ad configuration.
3. Drive real customization, plan, correct/wrong MCQ and language-switch flows in the preview; capture and inspect screenshots; then update the public Vercel alias.
4. Background web/iPhone notifications require authenticated Web Push subscription storage, an opt-in server scheduler, VAPID credentials held in server secrets, quiet hours/timezone handling, stale-MCQ protection and delivery testing. Do not embed private keys in source or pretend the foreground timer fulfills this.
5. Native iPhone App Store delivery needs an iOS target, Apple signing and native notification integration. This repository's current supported iPhone surface is the PWA; no native iOS binary was produced.

Future improvements should be evaluated, not silently enabled: confidence prompts before MCQs, opt-in mistake review queues through the existing scheduler, diagram teach-back, exam-aware plan rebalancing, and snooze actions. Prioritize reliable recall and reminders over a long list of decorative reactions.

## Animal variations and animation library comparison

The website screenshots show a separate searchable catalog with multiple breeds and silhouettes. They clarified that variety means three distinct designs per animal, not three facial expressions. We generated original variants instead of assuming all site assets share the repository license.

- Classic dog: floppy-eared golden puppy; Soft: peach curly poodle; Bold: orange corgi.
- Classic cat: ginger/cream kitten; Soft: mint kitten; Bold: charcoal tuxedo kitten.
- Crocodile: lime, turquoise and forest-green snouts; Owl: lavender, blue and barn-owl faces.
- Rabbit: upright cream, pink lop-eared and gray; Fox: orange, rose and rust.
- Penguin: navy, pale blue and dark/golden; Bear: honey, lavender and chestnut; Panda: classic, cream/charcoal and fluffy contrast.

Lottie React Native renders authored After Effects/bodymovin JSON timelines and has a separate web-player integration. Rive's current React Native v2 runtime uses Nitro and authored `.riv` animations/state machines. Neither creates a facial rig from a PNG. For this existing shared app we retained its already-integrated engine and bundled original atlas artwork, avoiding additional native engines without compatible authored animation assets. Future full animal expression packs require actual expression frames or rigs; current animal reactions are contextual placement, feedback badges and bounded pose changes.

Primary sources:
- https://github.com/lottie-react-native/lottie-react-native
- https://github.com/rive-app/rive-nitro-react-native
- https://github.com/rive-app/rive-react

Generation: built-in image generation, stylized-concept prompts for three transparent 3×3 atlases, fixed row order dog/cat/crocodile, owl/rabbit/fox, penguin/bear/panda. Prompts request friendly rounded busts, distinct breeds/markings, consistent avatar scale and no lettering or existing branded characters. Source assets: `mobile/src/assets/buddy/animals-{classic,soft,bold}.png`.
