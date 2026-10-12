# Historical source matching audit — 12 October 2026

Checked 186,930 existing bank rows against 41 downloaded source extracts.
Found **150** exact stem plus four-option matches across **130** unique bank items.
**20** bank items have multiple distinct exam/year/session claims, all retained.
Found **355** unresolved stem candidates. These candidates must never be published as proven year attribution.

No official exam appearances or medical answers were verified. No automatic question-year labels were added.
Matching preserves NFC characters, punctuation and numerical values, ignoring only case and whitespace.
A stem needs 12 words or 60 characters, must be unique in both bank and source, and four nontrivial options
must occur separately after the stem inside a bounded question/options region. Source page and question label
are recorded. All matching results retain unofficial publisher attribution and unresolved reuse status.

| Source | Claimed year | Four-option matches | Unresolved candidates |
|---|---:|---:|---:|
| educationobserver-aipg-2001 | 2001 | 0 | 5 |
| educationobserver-aipg-2002 | 2002 | 0 | 2 |
| educationobserver-aipg-2003 | 2003 | 21 | 31 |
| educationobserver-aipg-2005 | 2005 | 20 | 109 |
| collegedunia-aipg-2010 | 2010 | 0 | 72 |
| collegedunia-aipg-2011 | 2011 | 0 | 7 |
| collegedunia-neetpg-2013 | 2013 | 1 | 3 |
| collegedunia-neetpg-2026-questions | 2026 | 0 | 0 |
| collegedunia-neetpg-2026-solutions | 2026 | 0 | 0 |
| educationobserver-fmge-8679 | 2002 | 15 | 20 |
| educationobserver-fmge-8680 | 2003 | 26 | 35 |
| educationobserver-fmge-8681 | 2004 | 11 | 18 |
| educationobserver-fmge-8682 | 2005 | 55 | 52 |
| educationobserver-fmge-8683 | 2007 | 1 | 0 |
| educationobserver-fmge-8684 | 2006 | 0 | 0 |
| educationobserver-fmge-8685 | 2007 | 0 | 0 |
| educationobserver-fmge-8686 | 2008 | 0 | 0 |
| educationobserver-fmge-8687 | 2009 | 0 | 0 |
| educationobserver-fmge-8688 | 2009 | 0 | 0 |
| educationobserver-fmge-8689 | 2010 | 0 | 0 |
| educationobserver-fmge-8690 | 2011 | 0 | 0 |
| educationobserver-fmge-8691 | 2011 | 0 | 0 |
| inicet-db1348b5f4b2 | 2020 | 0 | 1 |
| inicet-8462ea47dbe0 | 2020 | 0 | 0 |
| inicet-ef5d8fb757ba | 2021 | 0 | 0 |
| inicet-f6fe1067c14f | 2021 | 0 | 0 |
| inicet-f7eec8c9cec6 | 2021 | 0 | 0 |
| inicet-966b1028ee51 | 2021 | 0 | 0 |
| inicet-28cb536ffb66 | 2022 | 0 | 0 |
| inicet-b8e20e1f8cff | 2022 | 0 | 0 |
| inicet-3682862c285b | 2022 | 0 | 0 |
| inicet-1ebb61d97770 | 2022 | 0 | 0 |
| inicet-2e1a65af1f3c | 2023 | 0 | 0 |
| inicet-9fc8ff8af093 | 2023 | 0 | 0 |
| inicet-195a7eb371c2 | 2023 | 0 | 0 |
| inicet-22de78be7c48 | 2023 | 0 | 0 |
| inicet-c5447b883253 | 2024 | 0 | 0 |
| inicet-755d26136029 | 2024 | 0 | 0 |
| inicet-3a0939cbf085 | 2025 | 0 | 0 |
| inicet-f17565892e29 | 2025 | 0 | 0 |
| inicet-634617d6903d | 2026 | 0 | 0 |

The companion JSON contains metadata only: bank IDs, source URLs, PDF hashes, page/question labels,
and publisher year/session claims. It contains no source question text. Multiple year claims are retained.

- Only downloaded extracts listed here were checked; this is not all-year coverage.
- PDF text extraction errors and punctuation differences cause false negatives; no fuzzy matches are accepted.
- A textual match establishes an unofficial publisher claim, not an actual exam appearance or correct answer.
- Reuse rights are unresolved. No new source questions or source PDF/text are bundled.
- Multiple source/year claims are preserved. Existing bank keys and question years are unchanged.
