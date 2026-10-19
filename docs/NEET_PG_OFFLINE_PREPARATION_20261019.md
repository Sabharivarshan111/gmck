# NEET PG offline replacement preparation

The owner requests a complete offline NEET PG replacement in Vault, on the native Android and Vercel applications. The replacement must include questions, unchanged options and source answers, original explanations and required images, organised by the existing MBBS year/subject/chapter tree. An explanation-only or source-link-only replacement does not meet the request.

## Prepared

- `mobile/src/lib/neetPgStudyData.json`: 2,209 original explanation entries, associated with 207 existing TNMGRMU chapter paths across four years. These are collection entries, not authenticated unique examination counts. Mapping combines publisher subject/topic metadata, earlier reviewed concept matches, explicit placements and lexical candidates. Structural path validity is checked; this is not a claim of exhaustive semantic review.
- `src/lib/neetPgOffline.ts`: platform-independent offline MCQ reader. Validates complete text/options/source-answer labels/explanations, chapter identities and embedded image references. Search and pagination use memory, with no fetch, AI call or database requirement. Imported snapshots and returned results cannot mutate the installed answers.
- `scripts/test-neet-pg-offline.mjs`: tests offline operation, filters/search, pagination, data isolation and rejection of missing options, invalid answer indices, duplicate records, absent required images and external image URLs. It also proves that the explanation companion is rejected as an incomplete MCQ bank.

## Local replacement implementation

`src/lib/neetPgInstall.ts` installs complete user-selected JSON banks through a private file store, using a small durable pointer as the commit. It validates before replacement, retains the most recent readable installation, rejects concurrent installs, and preserves possibly committed bytes after ambiguous storage failures. Tests model app restarts, cancellation, invalid imports, failed writes and damaged active files.

`mobile/src/lib/neetPgInstalledBank.ts` connects that installer to Android private files and production-web IndexedDB. Bank bytes are kept outside AsyncStorage's Android row limit. Imports are limited to 25 MB; supplied source labels must resolve to the unchanged option index. Every supplied image must be embedded and decode successfully before commit, with at most 16 million pixels per image. Chapter paths must resolve in the existing TNMGRMU tree.

Vault's PG entry point opens the installed complete bank, with year/subject/chapter filters, local search, pagination, embedded images, source-answer reveal and explanations. Both Android and production web use `NeetPgOfflineModal.tsx`. Until a valid bank is installed, the existing bank remains accessible. Invalid imports never replace it. No question-bank file is uploaded or fetched by this flow. The preview harness intentionally cannot import real private files.

The service-worker cache version advances for the new browser bundle. Browser private data remains in IndexedDB. Clearing application/site data still removes installed files, so keep an external copy of the import.

## Not released

No complete question bank is supplied by the explanation JSON, and it must not be connected as if it were one. The runtime changes are in draft PR 103; no production deployment, Android version bump or release has been performed. Generated legacy packs are retained until a complete replacement is available.

The prepared explanation JSON intentionally contains no publisher question stems or options. Free access to third-party recall PDFs does not establish permission to redistribute their complete question banks or images inside a public application. A complete redistribution-cleared question/image pack is required before joining it to these original explanations, replacing the current runtime bank, or cutting releases.

## Next

1. Obtain the complete question/options/image content with an appropriate redistribution basis; preserve its supplied answer labels separately from the zero-based answer index used by the reader.
2. Match each item to its existing source ID and chapter path. Verify every required image is actually embedded and that image bytes decode correctly. Do not manufacture missing question text, options or images.
3. Validate the finished pack and its complete source-option/key preservation before an atomic replacement. A failure must retain the installed bank.
4. Install and verify the complete replacement through the connected reader. Remove the old practice pack from the reachable runtime and build output only when the new complete pack is ready.
5. Verify UI navigation/search/reveal in both apps, including a network-disabled browser reload and a native release-bundle inspection; then follow the existing release workflows. Browser testing is not physical Android verification.

Validation completed locally: offline reader and installer tests; native, production-web and preview TypeScript checks; targeted ESLint (no errors, existing-style warnings); Kotlin override/spec guard; keyboard, cloud-ID and repository integrity guards; production `build:vercel`. Browser installation in this workspace failed because the downloaded Chromium archive was truncated. `mobile/web/neet-pg-offline-check.mjs` is added to the existing production-web CI: it exercises actual private JSON import, image decoding, source-key reveal, chapter filters, pagination, failed replacement and a network-disabled service-worker reload using original test questions. Its execution must be confirmed from CI. Kotlin guard success is not an Android compiler/device test. No complete-content, native-device, deployment or release completion is claimed.
