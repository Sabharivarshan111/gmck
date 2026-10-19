# NEET PG offline replacement preparation

The owner requests a complete offline NEET PG replacement in Vault, on the native Android and Vercel applications. The replacement must include questions, unchanged options and source answers, original explanations and required images, organised by the existing MBBS year/subject/chapter tree. An explanation-only or source-link-only replacement does not meet the request.

## Prepared

- `mobile/src/lib/neetPgStudyData.json`: 2,209 original explanation entries, associated with 207 existing TNMGRMU chapter paths across four years. These are collection entries, not authenticated unique examination counts. Mapping combines publisher subject/topic metadata, earlier reviewed concept matches, explicit placements and lexical candidates. Structural path validity is checked; this is not a claim of exhaustive semantic review.
- `src/lib/neetPgOffline.ts`: platform-independent offline MCQ reader. Validates complete text/options/source-answer labels/explanations, chapter identities and embedded image references. Search and pagination use memory, with no fetch, AI call or database requirement. Imported snapshots and returned results cannot mutate the installed answers.
- `scripts/test-neet-pg-offline.mjs`: tests offline operation, filters/search, pagination, data isolation and rejection of missing options, invalid answer indices, duplicate records, absent required images and external image URLs. It also proves that the explanation companion is rejected as an incomplete MCQ bank.

## Not released

No runtime entry point has been changed. Existing Vault data, generated legacy packs, Android version/signing configuration and service worker remain unchanged. No complete question bank is supplied by the new JSON, and it must not be connected as if it were one.

The prepared explanation JSON intentionally contains no publisher question stems or options. Free access to third-party recall PDFs does not establish permission to redistribute their complete question banks or images inside a public application. A complete redistribution-cleared question/image pack is required before joining it to these original explanations, replacing the current runtime bank, or cutting releases.

## Next

1. Obtain the complete question/options/image content with an appropriate redistribution basis; preserve its supplied answer labels separately from the zero-based answer index used by the reader.
2. Match each item to its existing source ID and chapter path. Verify every required image is actually embedded and that image bytes decode correctly. Do not manufacture missing question text, options or images.
3. Validate the finished pack and its complete source-option/key preservation before an atomic replacement. A failure must retain the installed bank.
4. Connect the same reader to the native Vault and production native-web entry point. Remove the old practice pack from the reachable runtime and build output only when the new complete pack is ready.
5. Verify UI navigation/search/reveal in both apps, including a network-disabled browser reload and a native release-bundle inspection; then follow the existing release workflows. Browser testing is not physical Android verification.

Validation completed locally: offline reader tests and a focused TypeScript check. No UI, complete-content, native-device, deployment or release completion is claimed.
