# FMGE historical question attribution audit — 12 October 2026

The historical search does find older material, beginning with 2002. The earlier recent-year catalog was incomplete for the user's requested scope. This audit records observed files and year/session claims; it does not convert those claims into official or clinically verified papers. No questions from these sources were added to the app by this audit.

## Origin and date model

[NBEMS FMGE overview](https://natboard.edu.in/viewnbeexam?exam=fmge) says the test was introduced through Screening Test Regulations 2002. That establishes the historical search boundary, not the precise first sitting date.

Use both `sessionLabel` and `examDate`, with separate `claimedExamYear` and `yearAttributionStatus`. For example, the [official December 2025 examination notice](https://natboard.edu.in/viewNotice.php?NBE=NzNwMkN0emxFTW9vN2VIWnNCSC96QT09) schedules it for **17 January 2026**. “January 2026 recall” and “December 2025 session” can describe the same sitting; they must not become two papers. [June 2026 official bulletin](https://nbe.edu.in/IB/FMGE%20JUNE%202026%20information%20bulletin.pdf) gives 28 June 2026. An additional October sitting is [reported scheduled for 31 October 2026](https://medicine.careers360.com/articles/fmge-october-2026); it is still future on this audit date, and contributes zero historical questions. Its exact official bulletin link remains to be resolved. Do not invent a December 2026 paper.

## Observed old attachments, including defects

Public threads: [solved-paper attachments](https://www.educationobserver.com/forum/showthread.php?tid=14302) and [memory-paper attachments](https://www.educationobserver.com/forum/showthread.php?tid=14308). All 13 PDF byte streams were successfully fetched without sign-in on this audit date. Temporary PDFs were inspected with `pdftotext -layout`; only source metadata is retained in the repository. The machine-readable manifest is `docs/PG_HISTORICAL_FMGE_SOURCES_20261012.json`; temporary bytes and text are at `/tmp/fmge-audit/{attachment-id}.pdf` and `.txt`. Those paths are transient and must not be treated as durable artifacts.

“Labels” below means printed question-number observations, not accepted MCQs. Line-heading detection is imperfect and catches occasional numbered explanations; therefore maximum numbers, page counts and key markers are evidence of structure, never automatic usable-item counts.

| Source claim | Attachment | Pages | Observed numbering / answers | Attribution limit |
|---|---|---:|---|---|
| 2002 | [8679](https://www.educationobserver.com/forum/attachment.php?aid=8679) | 62 | Numbered range through 267; last item truncated; 265 `Ans.` markers | Year on cover; exact session unknown |
| 2003 | [8680](https://www.educationobserver.com/forum/attachment.php?aid=8680) | 58 | Through 256; Q254 printed54; line-heading detector misses34; 256 answer markers | Year only; malformed options visible at28 |
| 2004 | [8681](https://www.educationobserver.com/forum/attachment.php?aid=8681) | 63 | 300 distinct Q labels1–300 and300 answer markers | Year only; not proof of official provenance/key accuracy |
| March2005 (forum filename) | [8682](https://www.educationobserver.com/forum/attachment.php?aid=8682) | 61 | Q1–285; 282 answer markers; final item truncated | Cover says2005; March comes from uploader filename |
| 2007 (unspecified) | [8683](https://www.educationobserver.com/forum/attachment.php?aid=8683) | 42 | Last printed280; line detector271 distinct labels; repeated numbered answer/explanation material | Session unresolved |
| 2006 (uploader claim) | [8684](https://www.educationobserver.com/forum/attachment.php?aid=8684) | 25 | Through264, line detector260 distinct; incomplete stems/options | No year heading; Canada-related wording; exam identity needs corroboration |
| September2007 | [8685](https://www.educationobserver.com/forum/attachment.php?aid=8685) | 4 | Last143; 141 distinct line labels; topic fragments | Session in internal heading; many missing options/keys |
| 2008 (uploader claim) | [8686](https://www.educationobserver.com/forum/attachment.php?aid=8686) | 31 | Mixed numbered recalls and explanations; unsafe automated count | No session corroboration; do not use naive max (year1910 appears as a number) |
| 2009 (uploader claim) | [8687](https://www.educationobserver.com/forum/attachment.php?aid=8687) | 6 | Through109;108 detected distinct labels; inline supplied answers | Month unresolved; reference to March2009 repeat does not prove September |
| March2009 | [8688](https://www.educationobserver.com/forum/attachment.php?aid=8688) | 26 | “high yield important topics review” heading; labels reset; mixed questions/topic material | Topic review, not an authenticated complete paper |
| September2010 | [8689](https://www.educationobserver.com/forum/attachment.php?aid=8689) | 4 | Header claims291; actually219 detected numbered lines1–219 | Reject claimed291 coverage; abbreviated recalls |
| March2011 | [8690](https://www.educationobserver.com/forum/attachment.php?aid=8690) | 4 | Header105; last105;104 detected labels (98 missing in line detector) | Partial recall; no complete four-option/key proof |
| September2011 | [8691](https://www.educationobserver.com/forum/attachment.php?aid=8691) | 3 | Through131;131 distinct line labels plus repeated number | Partial recall, some inline candidate answers |

Additional [2002–2008 compilation](https://pdfcoffee.com/m-c-i-screening-test-fmge-question-papers-2002-2008-pdf-free.html) visibly includes a **September2005** section; its own text marks some answers questionable. Treat that section as candidate recollections, not a reviewed key. Its 2002 section overlaps the older solved compilation; deduplicate at question level before counting anything.

## Every historical year: observed coverage and gaps

E = EducationObserver files above; P = [public PrepLadder article](https://www.prepladder.com/fmge-study-material/previous-years-question-papers/fmge-previous-year-question-papers); N = [Eneutron index](https://www.eneutron.info/india/fmge/previous-papers/); O = [Oncourse year index](https://getoncourse.ai/questions/indian-medical-pg/previous-year-papers/fmge/). O numbers are publisher index claims, not imported/independently audited questions.

| Calendar year | Concrete leads observed | Remaining attribution/coverage gap |
|---:|---|---|
|2002|E62pp year-labeled solved compilation|Session/date unknown; truncated last question|
|2003|E58pp; O1 advertised|Exact sitting unknown; numbering/options defects|
|2004|E63pp300 labels; O1 advertised|Exact sitting unknown; key and authenticity unverified|
|2005|E March filename285 labels; September section in mixed compilation; O1 advertised|September exact usable count unmeasured; no complete-session assurance|
|2006|E25pp uploader-labeled recall|Exam identity and session weak; suspect mislabeled material|
|2007|E42pp unspecified +4ppSeptember|Other sitting month unresolved; duplicates not reconciled|
|2008|E31pp mixed recall; O5 advertised|Session split unsupported|
|2009|E6pp unspecified +26ppMarch topics; O13 advertised|Possible overlap; complete-session attribution unsupported|
|2010|E September219 labels; NMarch/September; O20 advertised|Both Npages lack question payload|
|2011|E March105 claim +September131 labels; Nboth; O21 advertised|NMarch claims148 andSeptember101; differs from E; no actual Npayload|
|2012|NMarch/September pages; O2 advertised|NMarch metadata claims102; September150; no question payload|
|2013|NMarch/September pages; O8 advertised|Nboth metadata claims150; no observed question payload|
|2014|NJanuary/June pages|Nboth metadata claims150; dates and question payload unresolved|
|2015|NJanuary/June pages|Nboth metadata claims150; dates and question payload unresolved|
|2016|No usable source observed in this pass|Both sittings remain an explicit gap; absence here is not proof none exist|
|2017|O81 advertised in index (older result78)|Year claim only; session/date split unresolved|
|2018|PDecember39 question headings/38 answer markers; O257 advertised|June source unresolved; publisher page duplicated later in HTML|
|2019|PDecember76 headings/76 keys; June link label; O302 advertised|June question payload not audited|
|2020|PAugust37 headings/37 keys; December38/38; NAugust|Official session names/dates need reconciliation|
|2021|PDecember21 detectableQ headings/37 key markers; O12 advertised|Mixed heading formatting; June missing in this pass|
|2022|PJune download label; O16 advertised|Actual PDF/content count unmeasured; December sitting held2023 needs mapping|
|2023|P2023 section70Q headings/72keys, indexJanuary label; O300 advertised|Do not equate section title with both sittings; date/session lookup required|
|2024|PJanuary36Q/36keys; June40Q/40keys; O116 advertised|Partial subject samples, not complete300papers; January is prior December session possibility|
|2025|PJanuary +July Part1/2 labels; O627 advertised|Downloads not counted; map to December2024/June2025 official sittings|
|2026|Public PWMedEdJan PDF68.1MB post7594; Careers360June recall; O270 index vs267 year page|January maps December2025; June28June; October31future, zero questions|

## Public groups and source inspection boundaries

[PWMedEd public channel excerpt](https://t.me/s/pwmeded?before=7599) exposes **FMGE Jan2026 Recall.pdf**,68.1MB, [post7594](https://t.me/pwmeded/7594). The public post metadata is visible; question bytes were not downloaded, so question count and key quality remain unknown. This is a concrete publisher post, not a hypothetical Telegram directory.

Indexed Reddit leads include [June2026 recall discussion](https://www.reddit.com/r/fmge/comments/1uyqtoa/fmge_june_26_recalls/) (comment recommends Arise258-question PDF), [June2025 recall collection](https://www.reddit.com/r/fmge/comments/1m9pcs4), and [recall wording criticism](https://www.reddit.com/r/fmge/comments/1uot7th/one_thing_id_like_to_say_about_fmge_recall_pdfs/). Search snippets were available; direct retrieval was blocked. These establish leads/user claims, not258 verified imported questions. No accounts/groups were joined, no private posts accessed, and nobody was contacted.

The PrepLadder article has duplicated whole older-year sections in its HTML. Do not double-count. The January2024 sample has an option-letter/text mismatch on Zellweger and a Bombay-transfusion supplied key that needs clinical review. These source defects alone defeat any automatic “all answers perfect” label.

## Item-level import decision

Old files support stable source IDs using PDF SHA256 +page +printed question label +ordinal. Preserve original year claim, source locator and supplied key; put an exact date/month only when evidenced. The2004 file supports300 source-item candidates, not300 clinically verified MCQs. A year-only2002 candidate must display **“FMGE2002, session unconfirmed, unofficial source”**, not a fabricated March/September date.

Eligibility still requires complete stem, all original choices, original image where necessary, stable numbering, deduplication, usable rights, and independent answer evidence. Supplied answers and current textbook-supported answers must be separate fields because historical practice and guidelines can change. The [June2026 official bulletin](https://nbe.edu.in/IB/FMGE%20JUNE%202026%20information%20bulletin.pdf) restricts candidates sharing exam content; public availability is not a reuse license. This audit does not assert every third-party recall is unlawful; it marks reuse unresolved until a defensible source basis is established.

## Download fingerprints

These permit reproducibility without storing a copyrighted corpus in this report.

| Attachment ID | Bytes | SHA256 |
|---|---:|---|
|8679|645225|`21010c22da0fa80e0d3492d3bb83ea76b7696091ee8a8df10ca8bd51a7120b6b`|
|8680|574349|`a2d39739667404453cc42ecbef807ee233ba563600dc8dc94ff19b8f0aedff6a`|
|8681|576697|`898d5c3ec0b5e8f3b67304824b25a69e51e0788c2f50367c3463894bb8063b51`|
|8682|576475|`dd8c6d8dfb415ac1799ade3b44efb60be8ced967e4ee4f906e28ef48cea48b62`|
|8683|533650|`84792312687c7d88a447af221ee24301736d367fef9ae1f7e21b7a972611cd5f`|
|8684|537619|`89424eed8fdf3f09f3b135717fe79b8bdef86d4f5152ab16b523548715d3a023`|
|8685|483524|`cc04ea89ba69b50de7ae41e7c759e107acc6cb9033a868381504ef6d404a0b50`|
|8686|541989|`345f5a602fc6120516d82b056759a864ed2c8129256cd4f51ad7561bc9e671ff`|
|8687|485643|`8e850b322bff47ce38076582bb7764e8cfa9adf78aa3aa87d0e462f136daca57`|
|8688|581766|`7623c8af3135d00fb97355c6db44f93f848c554600b14d8591049da47854068b`|
|8689|499982|`b88d1b965979e36dbe14939da77059ae25a1072c4398fa4eac2eda57a5f44600`|
|8690|481106|`89029cd9bbd35c2c0e8bdb5d0107cfca7d88c0e853eee192569e80971b3326e5`|
|8691|484227|`b954b0a5c0864b19a97cbdeffd93cb085692d68be3403c0bb943580a76759ad8`|
