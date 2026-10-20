# Tablet AI chat repair — 20 October 2026

The supplied screenshots show large vertical gaps inside an answer, and the student separately reports being unable to continue the conversation. The recording also shows the dictation no-match warning ("Didn’t catch that"), not proof of an AI-service failure. The tablet microphone has not been tested.

## Changes

- `NoteText` no longer gives standalone paragraphs `flex: 1`. Only text beside a list marker shares horizontal space. This shared renderer serves saved notes and AI answers on Android and web.
- Assistant bubbles use available width up to 760dp. The composer does not shrink, and long variable-height Android messages are not removed by viewport clipping.
- All nonempty recent conversation histories activate the service's clarification/context path, including short prompts such as “Why?”. History is limited to the last ten entries, 15,000 characters per entry and 56,000 combined characters, below the deployed combined request limit even with a maximum-length prompt.
- Failed assistant messages stay out of subsequent AI context. A synchronous busy guard prevents duplicate submissions; clearing is disabled during a request. Requests have a 90-second SDK timeout. HTTP errors show the service's actual message where available, with the SDK fallback for non-JSON responses. Retry remains an explicit user action.
- Semantic annotation cleanup applies during reveal as well as completed rendering. The installed web cache version is refreshed.

## Verification

- Actual production shared components exercised at 390×844, 800×1280 and 1280×800: paragraph natural height/spacing, no page overflow, composer, context on a short follow-up, simulated HTTP failure, retry, another follow-up and fullscreen toggle.
- Service fixture asserts combined history bounds after 100 large entries, unchanged input history, MCQ intent, timeout option, actionable HTTP errors, malformed proxy response fallback, rate-limit handling and next-call recovery.
- Existing NEET-PG discussion contract and MCQ parser checks pass. Keyboard, notes-schema and built-in theme contrast checks pass.
- Captures under `docs/evidence/tablet-ai-chat` are browser captures of real components with a deterministic service fixture. They do not prove native GPU/IME behavior or universal service availability.

No question-bank content, supplied answer keys, backend function, authentication policy, paid access or database schema is changed.

A live service smoke with the previous serum/plasma exchange and the short prompt “Why?” returned HTTP 200 with a 1,105-character reply. This proves connectivity for that request, not medical accuracy or availability on the reporting tablet's network.

Native, production-web and preview TypeScript passed, along with targeted ESLint, the production `build:vercel` assembly and Android production JavaScript bundling. The NEET-PG offline browser story also passed after these shared changes. The maximum-size NEET discussion fixture verifies that shared history bounding retains its complete pinned question/options/key.

The pre-existing general Web build dossier check still reports digestive coverage 92% against a 95% floor. Anatomy sources and that gate were not changed for this repair.

## Publication and live verification

The real deployed `/ask-ai` interface completed the initial serum/plasma question and the typed follow-up “Why?” with topic context retained. Its unedited screenshot is `docs/evidence/tablet-ai-chat/live-follow-up.jpg`. An independent two-turn test through the actual shared request helper and installed Supabase SDK returned 2,037 and 2,110 characters, with the follow-up retaining the topic. The temporary remote-browser transport interruption recovered; it was not treated as an application failure.

Candidate verifier 39438175953 passed all required release preflights, full mobile lint, TypeScript, question-bank contracts and browser stories. Chromium/WebKit regression run 39438185333 also passed. Fresh signed build 725 (APK/AAB), internal 544 and debug 584 all succeeded from commit `2090212dfe8f36862143b4559cd07f0b2c8bab70`. The web's production commit `457337c33396b3fd5e8bcd126019cb3dd4cde055` has the identical source tree `399098b9a1bb0eb11617ea1b1d4f482c74b8a9e5`. Production deployment `dpl_EpDXnA7cSYHptWsKMtTfYkKVZt6P` is READY on the public domains; the refreshed service worker was fetched successfully.

All finished packages passed actual bank-payload inspection. URLs, byte counts and SHA-256 digests are in `TABLET_AI_CHAT_RELEASE_20261020.json`. These are GitHub prerelease packages from the existing verified-candidate route; the separate main anatomy evidence gate remains intact, and this chat repair does not recertify all 626 anatomy targets. No Google Play upload was performed.
