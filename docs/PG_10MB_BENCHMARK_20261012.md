# 10 MB question-bank benchmark — 12 October 2026

The complete collected inventory can fit below 10,000,000 bytes as a **data prototype**. This is not the entire Android app and is not currently embedded in a released app.

| Content | Measured result |
|---|---:|
| Question records, options and source answer indices | 186,930 |
| Source subject labels | 21 |
| Source chapter/topic labels | 2,392 |
| Nonempty supplied explanations | 51,542 |
| Missing supplied explanations | 135,388 |
| Complete prototype with chapter indices and provenance | 9,633,779 bytes (9.633779 MB) |

The codec is Brotli quality 10. Decompression was compared byte-for-byte against the complete 41,551,146-byte JSON input; the round trip was exact. Numeric values, options and answer indices were not paraphrased or changed. The original question UUIDs were excluded, with row offsets serving only as internal IDs. This prototype is not a drop-in replacement for old ID-based progress or attribution mappings. Source chapter labels are retained without asserting their correctness; blank topics remain explicitly unclassified.

Every record has a source answer index, but a valid index does not prove the answer is correct. The existing structural quarantine still identifies 1,293 faulty records, leaving 185,637 structurally eligible records. The compression test includes the full inventory and must not be read as approval to display all records.

The live Supabase pg-answer-review function is version 4, JWT protected. Its private textbook retrieval remains available for provisional comparisons. It is rate limited to three requests/minute and 25/day per user. Dedicated specialty-reference gaps remain. No bulk model calls were made, no quotas were bypassed, no private textbook passages were exported, and none of the 135,388 missing explanations were silently filled with generated text.

## Unfinished before release

- Resolve the underlying-content reuse uncertainty described in PG_100K_RELEASE_SCREEN_20261012.md. The dataset maintainer's MIT clarification is positive dataset-level evidence; scanning is not legal clearance.
- Add and measure the required licence notices, structural quarantine representation and decoder/runtime overhead against the 10 MB limit.
- Implement bounded-memory native and browser decoding, chapter loading and source-ID/progress compatibility; prove the final emitted artifacts and offline behavior. A compressed file alone is not a functioning app integration.
- Generate/review missing explanations through an explicitly budgeted, source-grounded workflow. Automated outputs must remain provisional until independently reviewed.

No app question distribution changed in this benchmark. The original-only release remains active. No legal immunity, complete annual PYQ archive, perfect answer accuracy, or completed bulk textbook verification is claimed.
