# Chapter-wise practice bank restored — 4 November 2026

The owner requested the earlier MedMCQA chapter-wise practice bank in addition to the current NEET-PG, AIIMS PG and INI-CET readers. This explicitly restores the compact practice reader; the earlier blanket runtime exclusion of MedMCQA is superseded for this labelled practice feature. Raw legacy TS packs and unaudited source catalogues remain outside the runtime import graph.

## Result

Vault → PG Practice → Practice questions opens subject/chapter browsing, paged text search, supplied-answer reveal, bookmarks and question-scoped ACEV. Website access follows the authenticated premium check. The existing free exam previews remain available. Attribution and complete offline notices remain in About and the packaged licences.

The existing corpus is reused without rewriting questions or supplied keys: 186,930 inventory records, 1,293 structural exclusions and one existing medical hold leave **185,636** practice records in **21 subjects**. Original question IDs and exclusions remain intact. **51,141** records have an existing explanation; **134,495** do not. The reader states when an explanation is unavailable. These practice records are separate from the unchanged 2,078 NEET-PG and 303 AIIMS/INI-CET records. No inferred examination years or new clinical verification are claimed.

The browser and Android use the same checksum-protected compressed packs: **8,744,604 bytes** including manifest/notices. Data are generated reproducibly, never fetched from Supabase. Only one 30-question result page is rendered, with the existing two-subject pack cache. Website builds now retain and precache `/pg/` assets. Existing content-derived PWA revision handling retires the old UI.

## Verification

- Native TypeScript, targeted mobile ESLint and Android production JS bundle passed.
- Full production-style legacy/native website assembly passed.
- Existing runtime test decoded every record with browser/native codec parity, validated answer indices/options, checked holds/stable IDs, subject/chapter filtering, paging and search.
- Existing AIIMS/INI offline and NEET year-join checks passed; all original exam payloads unchanged.
- New real-browser test passed: compressed chapter loading, intact four options and key, answer reveal, bookmark persistence after reload, paged search, 360/390/768 layout, service-worker offline asset reload, authenticated premium fixture and guest denial. Provider auth/entitlement responses are isolated test fixtures; no live payment or backend call was made.
- Screenshots: `docs/evidence/pg-practice/`.

Native iOS compatibility is a separate unfinished port. Its compiled binary lacks OrbitPgBank and other custom modules. This browser proof does not claim native iPhone practice-bank support, a physical-device test, StoreKit purchase verification or Play/App Store publication. Final Android bundle, CI and deployment receipts are appended when available.
