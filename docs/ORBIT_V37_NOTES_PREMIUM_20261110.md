# ORBIT v37 — daily handwritten notes and Premium sounds

Implemented on main on 10 November 2026.

## Access policy

- Signed-in free accounts get handwritten AI notes for **two questions per day**. Triple-tapped essays and short notes share the same allowance. The server resets it at midnight Asia/Kolkata.
- Premium and verified admin accounts bypass this two-question cap. Five successive Premium questions and a 21-question topic were allowed by rollback-only live database tests without creating trial rows.
- Topic requests cost their full question count. Shared-cache first access counts; personal saved notes remain readable. Failed, empty or too-brief output refunds an incomplete reservation. Request-bound retries and sequential topic batches reuse their reservation.
- Service-only database functions serialize allowance checks across devices. RLS is enabled; anon/authenticated roles cannot modify trials or execute reservation functions.
- Normal heart and vesicular lung sounds stay free. Pro heart/lung choices open the subscription flow. Vault shows Free preview, Pro, and 2 free questions / day.
- Android and web use the same feature labels and entitlement checks. Lovable payment copy includes handwritten notes, daily free preview and full sound library. Pricing remains ₹199/month, ₹299/6 months, ₹399/year; notes packs remain ₹150.

## Deployment

- Main application source: `cebf283547728cbf6b5768a83ec35a9910a5e8ef`.
- Supabase migrations: `20261110104704_handwritten_note_two_free_generations` followed by `20261110110955_handwritten_notes_two_questions_daily_ist`. The second migration replaces lifetime accounting with the final daily, weighted question policy.
- Handwritten notes Edge Function v81 is ACTIVE with JWT verification. Readback matches the committed daily handler. It preserves the secure endpoint wrapper, complete-essay expansion/422 guard, question-kind metadata and quota-only upstream error classifier from prior main.
- Notes and flashcard textbook helpers are byte-identical. Restoring the combined helper retains the existing notes retrieval implementation and the isolated flashcard namespace exports.
- Vercel production `dpl_C44VWFXsnBQ9FopiwQQeNiVmdvJV` is READY from the source commit above, serving orbitmbbs.site.
- Lovable payment deployment `ceea637e-3f4d-49f6-ba9a-0c67e084034e` is published. orbitmbbs.site/unlock redirects to https://mbbsqbank-questor.lovable.app/unlock.
- Android versionCode 37, versionName 0.0.0.37; application ID/signing/ads/billing configuration preserved.

## Validation

- Actual Edge handler fixtures pass daily first/second/third-denial, IST midnight reset, weighted bulk cap, request binding, retry idempotency, multi-batch continuation, paid/admin access, personal/shared cache, guest auth, output-failure refunds, edits and the real web Vault adapter.
- Rollback-only live database assertions pass free/paid/expired/admin checks, yesterday exclusion, two-question bulk cost, three-question rejection, retry binding and refunds. No test fixtures retained. Role grants checked.
- Payment browser suite `42805574465` passes guest/purchase/reload, failed verification recovery, interrupted checkout restore, note packs, free and paid feature access. Tests use mocked payment verification, with no real charge.
- Live Chrome verified daily Vault badges, normal lung preview, both Pro sound paywalls, Lovable daily copy and redirect. No real Google sign-in or physical-device claim.
- Vercel-style web build `42807633844` passes. Latest Vercel production is READY. Separate pre-existing CI failures remain: legacy anatomy atlas digestive coverage 92% versus 95%; security flashcard fixture expects an old unscoped cache key. Changed notes-isolation checks pass. These failures are not hidden or weakened.
- Android release run `42808834900` (1051) passes native types, lint, all feature/content/release checks, actual notes handler fixtures and website types. It is compiling signed artifacts; emulator publication proof is pending.
