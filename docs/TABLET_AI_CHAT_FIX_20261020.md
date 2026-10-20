# Tablet AI chat repair — 20 October 2026

The supplied screenshots show large vertical gaps inside an answer. The recording also shows a failed follow-up; its exact service/network cause cannot be established from the recording alone.

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
