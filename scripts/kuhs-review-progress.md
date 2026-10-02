# Active KUHS workflow: TXT comparison (2026-10-01)

Owner explicitly requests TXT as working source; do not resume/restart PDF review unless asked. Existing6532 entries are preserved (first2198, second973, third1047, final2314). Reviewed TXT/app exact comparison passes for all entries. Raw OCR separately locates text/references for5520 entries;1012 are uncertain after text normalization and must not be silently treated as corrected. Reviewed TXT is an export of the catalog, so equality checks transfer integrity, not independent transcription accuracy. No perfect-OCR claim.

KUHS is enabled in native code alongside TNMGR; review/PDF-page captions removed per owner. Automatic existing-user choice persists offline and is checked after reload. No updated APK published.

Durable TXT sources: libfile_f82e571e9764819189b129262b0838ae (reviewed TXT);libfile_e64f3c86babc81919240579946d15cdd (all OCR TXT). Comparison report libfile_76ce591754088191a7c807cceb7b5093 includes hashes and counts. Recovery patch libfile_2de13ea2f5448191a99cebeada300fc5 preserves all local code. Do not infer work vanished from historical page counters.

Run mobile/scripts/kuhs-txt-check.mjs with the saved reviewed TXT. Browser flow harness mobile/preview/kuhs-capture.mjs verifies selection, persistence, all years, search and progress with external requests blocked. Retain original question IDs and raw strings for progress/cache continuity.

Historical PDF review notes follow for provenance only:

# KUHS source review checkpoint (2026-10-01)

The four Decipher PDFs have 611 PDF pages: first 86, second 149, third 95,
final 281. `kuhs-page-coverage.tsv` indexes every page. The reviewed question
ledger currently has 6,532 visually checked essay/short-answer entries on 478
pages with at least one checked entry. **First-year pages 1–4 are fully reconciled; 607 pages remain pending.**
The other pages and incomplete portions of these pages still require comparison
with the source images. Historical visual reconciliation is separate from app readiness. On 2026-10-01 the owner explicitly changed the workflow to TXT comparison without restarting PDF review; KUHS_BANK_READY is now true after TXT transfer and offline app checks. This is not a claim of lossless OCR.

The final-year addition queue has reached PDF page 281. Next reconcile the
deferred cases and repeated source occurrences, then audit complete pages
continuing with first-year page 5. Only pages with explicit reconciliation evidence are marked complete.

Visually compare each PDF image and the printed KU exam references before
adding a row to `src/data/kuhs/reviewedMore.ts`. TU and RGU references in the
same books are not KUHS exam references. One-mark/MCQ material is not included
in this essay/short-answer ledger. Update the checked-entry count in
`kuhs-page-coverage.tsv`, leaving `manual_page_review_required` until the
entire page has been reconciled. Completed pages need an explicit entry in
`kuhs-reconciled-pages.json`, including image hash, row IDs and current ledger
fingerprint; the validator rejects stale evidence or unsupported completion. Use the OCR output only to locate text.

For larger batches, use the cached JPEG/OCR files and compare all selected
source images. The preparation manifest saves after every completed page.
Do not run app-wide checks after each individual page. At the completed batch
checkpoint, run `python3 scripts/checkpoint-kuhs-review.py --check-app` to derive
coverage counts from the verified ledger, validate all 611 coverage rows and
run the type, search-index and repeat-marker checks once. It validates existing explicit whole-page evidence and never promotes a
page or adds OCR drafts to the verified ledger. Keep question additions and
manual review notes in the same checkpoint.
Commit each small batch locally and refresh `../kuhs-review-unsynced.patch`
against `origin/kuhs-source-review`. An automatic approval review rejected
the remote GitHub push as unverified external egress; do not retry or route
around that rejection. The recovery patch is saved separately for continuity.
The original PDFs are source material and are not uploaded to Supabase.

The preparation default is now 50 total pages across the four years. `--total`
sets this explicitly; legacy `--count` still means pages per year. Each prepared
page is saved atomically. OCR preparation never counts as visual verification.
Workspace maintenance removed the prior uncommitted batch; restored the durable
3,054-entry checkpoint before restarting that batch.

Second-year PDF page 80 contains objective/one-mark questions and no eligible essay or short-answer entry. It was visually inspected, with zero ledger rows; page status remains pending for final reconciliation.

Second-year PDF page 81 likewise contains only objective/one-mark items in the KU section and RGU-only questions elsewhere; zero eligible ledger rows.

Final-year PDF page 82 is a Gynaecology title page with no question rows.

Final-year PDF page 83 is a Gynaecology contents page with no question rows.

Second-year PDF page 86 starts with objective items; only the complete KU21/KU18 renal cell carcinoma long-essay case was entered. Other renal case references continue on the next page.

Second-year PDF page 88 contains a long objective section; its KU-tagged one-mark items were excluded. The duplicate “Human Factors in Accident Formation” printed twice on third-year page 40 is represented once.

Final-year PDF page 87 required a JPEG re-render after the PNG became truncated. The unreferenced infertility case at the bottom continues to page 88 and is deferred.

Second-year PDF page 91 begins with objective items continued from page 90; those are excluded. GitHub read-only check confirms the review branch exists and the connected account has push permission; the outstanding sync block is the automatic approval review of direct egress.

Final-year PDF page 90 was inspected from a fresh JPEG render because the PNG was incomplete.

First-year PDF page 67 was checked across both photographed leaves. The second leaf's MCQs and one-mark items were excluded; its carbohydrate case continues to the next page and was deferred. Third-year PDF page 45 needed a fresh JPEG because its PNG was incomplete. Final-year PDF page 91 excludes the one-word/MCQ rows even where KU-tagged. All four page-67/93/45/91 KU essay and short-answer selections were compared against their source images.

First-year PDF page 68 begins with the continuation of the galactosemia case from page 67; the incomplete case is deferred pending paired-page reconciliation. Its MCQs and old one-mark items were excluded. Second-year PDF page 94 presents multiple cervical cancer vignettes under a single long-essay number; the KU years were combined for that question rather than counting the same case twice. Its objective item was excluded. Third-year PDF page 46 has only two KU short-answer items in the development-goals section, while its RGU/TU essays were excluded. Final-year PDF page 92 begins with one-word answers, excluded despite KU references.

First-year PDF page 69 excludes the MCQs and old one-mark questions in both photographed leaves. Second-year PDF page 95 excludes its KU-tagged objective questions. Third-year PDF page 47 prints “eligible couple” twice with the same KU24 reference and repeats the MTP-Act conditions with a bare KU reference; each duplicate was entered once. Final-year PDF page 93 ends with uterine-cancer prompts cut off at the page edge, deferred to the next page; KU-tagged one-word/MCQ items were excluded.

First-year PDF page 70 was checked across both leaves; one-mark and MCQ material was excluded. Second-year PDF page 96 contains KU-tagged objective questions at top, excluded; its breast-cancer vignettes share one essay number and were merged with their KU years. A breast short essay cuts off at the bottom, deferred. Third-year PDF page 48 includes two essays without visible references at the bottom, deferred pending the next page. Final-year PDF page 94 completes the endometrial-cancer question carried from page 93; its two printed corpus-cancer-syndrome rows were merged into one with all KU years.

First-year PDF page 71 was checked across both photographed leaves and excludes its MCQs and old one-mark rows. Second-year PDF page 97 completes the KU16 breast short essay from page 96; its objective rows were excluded. Third-year PDF page 49's upper essays are TU/RGU-only, while the six short essays and three short answers with KU references were entered. Final-year PDF page 95 ends with an incomplete ovarian-cancer essay, deferred to the next page; its KU-tagged one-word/MCQ rows were excluded.

Batch checkpoint: compared the eligible selections against images for first-year pages 72–75 and 78, second-year pages 98–102, third-year pages 50–54, and final-year pages 96–100. Added 319 entries; 193 pages now have entries. Second-year page 102 is a Microbiology title page with no questions. The first-year queue skipped 76–77 because entries already exist. Objective/old one-mark rows and TU/RGU-only references were excluded. Third-year page 53 joins the Anganwadi malnutrition question carried from 52; final-year page 96 joins the ovarian essay carried from 95; first-year page 75 joins the iron-deficiency case carried from 74, and page 73 folate-trap references include the continuation on 74. These are selection checks, not final whole-page reconciliation.

Completed 50-page selection checkpoint (2026-10-01): first 79–86; second 103, 105–114, 116–118; third 55–68; final 101–114. Every selected image was viewed, including both photographed leaves in the first-year book. Added 607 entries (first 205, second 112, third 183, final 107). The portable batch manifest records image hashes and per-page ledger counts. All 611 pages still have final whole-page reconciliation pending; entry-bearing pages are not a completion metric. Typecheck, search-index and repeat-marker checks passed once for the completed batch.

Source-selection notes for this batch:
- Second 103 is contents-only. Second 117's eligible essay references continue on 118 and are recorded there. Second 116's top essays continue from 115; reconcile them with existing page-115 rows rather than duplicating them.
- Third 56 joins the out-of-pocket question from 55; 63 joins the flood-camp essay from 62; 64 joins the construction-worker case from 63. The black-triangle image on third 62 has a KU24 tag but no unambiguous written question, so it remains deferred. Duplicate education principles and communication barriers on 68 were merged with their KU years.
- Final 102 contains excluded objective and TU/RGU-only material; 103–105 are title/contents pages. Paediatrics starts on 106. The severe acute malnutrition vignette on 108 is preserved as printed without inventing missing subquestions. The duplicated xerophthalmia classification on 109 is entered once.
- KU/KUHS references only; TU/RGU-only and objective/old one-mark items excluded. Shared questions retain only the KU exam years. This checkpoint does not enable or release the bank.

Completed second 50-page selection checkpoint (2026-10-01): first 1–2 and 11–21; second 119–131; third 69–73 and 77–83; final 115–126. Added 581 entries (first 233, second 83, third 153, final 112), totaling 4,242 entries on 281 entry-bearing pages. Every selected image was viewed. Typecheck, search-index and repeat-marker checks passed once. All 611 pages retain final reconciliation pending; no release was made.

Source-selection notes:
- First 1–2 are title/contents-only. Both photographed leaves were checked on the remaining pages. Page-11 parotid continuation needs reconciliation with existing page-10 rows. Submandibular case on 11 and tonsillectomy case on 13 span photographed leaves; thyroid case on 12 joins 11; heart case on 21 joins 20.
- Second 119 candida case ends on 120. Malaria vignettes on 121 share one essay number, merged KU19/KU13. Second 122 has only objective/TU/RGU material, zero entries. Typhoid/cholera cases on 123 join 124; hepatitis B cases on 125 join 126. Entamoeba essay on 127 has a bare KU reference; no year was invented.
- Third 70 merges repeated subcentre services and voluntary-organization questions; 71 merges WHO functions. Bare-KU primary-health-care question retains its tag. Third 72–73 are title/contents-only. Burn distinction on 83 repeats 77 and was excluded on 83. Third 82 preserves the printed subdural/extradural diagnosis pending final reconciliation.
- Final 115 oral polio vaccine row spans two source numbers with one KU20 tag, entered once. Final 118 completes the KU15 cerebral-malaria case from 117. Final 119 duplicates the photographed printed page 125 already present at PDF 118, zero additions. Diarrhea case continued from 118 to 120 is TU-only, excluded. Objective rows on 123 and 125 were excluded despite KU references.
- Preparation consults portable selection manifests, including zero-entry pages, to avoid repeating addition passes. --list-only previews the next queue without rendering/OCR. It does not promote whole-page status. The preparation manifest lacked second 131 despite its rendered image/checked rows; restored that record and rechecked its image before saving this 50-page checkpoint.

## Batch 03: 50-source-image selection pass

First 22–31: +247; second 132–145: +96; third 84–95: +136; final 127–140: +87. Total +566. All 50 images were compared; final 137–140 are front matter with zero rows. Hash/count manifest: `kuhs-batches/2026-09-30-50-pages-03.json`. No page was promoted to fully reviewed.

Deferred fold-obscured references: first 22 rows 4/9/15/16/17 and untagged thoracic oesophagus; first 23 spermatic cord and rectus sheath; first 26 male urethra and trigone. First 25 kidney draw-label duplicates merged; bladder case joins 25/26. First 31 anal-canal development reference read on the other photographed leaf.

Second 135/136 diphtheria and TB cases joined; 137/138 COVID case joined. Bare KU tags retained without invented years. Second 140 meningitis variants merged; 141 satellitism repeat of 136 skipped. Untagged neurocysticercosis essay on 144 deferred. Second 145 cryptococcal case joins 144; gonococcal/UTI cases completed using supporting page 146 (other 146 entries remain queued).

Third 86/87 dying declaration, 87 perjury, 88 criminal negligence, 89 criminal responsibility, and 92/93 Burtonian line duplicate references merged. Registered practitioner duties repeated on 88 skipped. Viper cases retained where subquestions differ. Historical legal wording retained as printed.

Final 127/128 nephrotic variants, 128 nephritic variants, 129 cryptorchidism references and 130 febrile-seizure variants merged. Meningitis essay joins 130/131. TU/RGU-only rows and MCQs excluded throughout. Checks passed: 611 coverage records, 5,267 unique IDs, typecheck, search index, repeat markers. Final reconciliation and release remain pending.

## Batch 04: 50 source pages

Second 146–149, third 1–10 and final 141–176 selection checked; +365 entries. Third 1–10 and final 141–148 are front matter without eligible question rows. Cross-page case continuations were joined; duplicate snakebite, CPR, antiarrhythmic and mitral apparatus questions were merged with their printed KU references. Untagged scrub typhus essay on final 156–157 remains deferred. Printed exam legend inconsistencies were not guessed or corrected. Historical RNTCP wording is retained as source material. Type, search-index and repeat-marker checks passed. All 611 pages still require final reconciliation.

## Batch 05 intermediate recovery
Workspace maintenance removed the local checkout and source images. Restored durable patch version 19 against origin/kuhs-source-review. Re-rendered and selection checked final 177–182; 55 entries added. Pneumothorax case joins 177–178, stored 178. Page 181 AKI case has printed KU with no year: preserved without inventing a date. Page 182 renal replacement therapy repeated across short-essay and short-answer lists: merged KU24|KU23. Structural/ID/coverage and diff checks pass. App checks require dependencies reinstallation after cleanup. 44 selected batch-05 pages remain unreviewed (second 1–6,10–28 and final 183–201).

Final 183–185 selection checked: +39 rows, total 5267 on 368 entry-bearing pages. Hyponatraemia short essay on183 has no exam tag and remains excluded. Thyroid case joins184–185 and is stored185. Remaining batch05 pages: second1–6,10–28 and final186–201 (41). Mobile dependencies restored; app checks rerun at this checkpoint.

Final186–201 selection checked: +198 rows, total5465 on384 entry-bearing pages. DKA case joins187–188, cirrhosis case joins193–194, and anaemia cases join198–199. H. pylori eradication/regimen repeats on191 and CML treatment repeats on201 merged. Haematemesis193 and INR197 repeat earlier same-reference prompts, skipped. IBS192 short-essay/short-answer repeated prompt merged. Page192 splenic vaccine text is cut at the photograph edge; final reconciliation must check the complete original line. No page promoted. Next: second1–6,10–28; final addition queue202.

## Batch 05 complete selection checkpoint
All 50 batch05 source pages are selection-checked across the saved and resumed work: second1–6,10–28; final177–201. Added479 entries overall (94 previously saved and385 in this resume), total5652 on404 entry-bearing pages. Portable manifest records image hashes and zero-entry pages. This turn compared41 remaining images; rebuilt images177–185 provide hashes for their prior v21 verification, not a new verification claim. Coverage/unique IDs, typecheck, search-index and repeat-marker checks pass. All611 pages still have final reconciliation pending; KUHS_BANK_READY stays false.
Second1–5 are front matter with no eligible questions. Second28 includes one KU20 modafinil short answer; its example tables are unreferenced and excluded. Second10/11 BPH essay continuation is TU-only. Second15/16 MI,16/17 nitrate and17/18 heart failure prompts joined. Second12 succinylcholine variants merged under their shared question number. Second26 fluoxetine variants merged; second25 benzhexol/trihexyphenidyl repeats merged. Second17 beta-blocker-in-angina repeat merged into11 with KU20|KU21, and second25 flumazenil repeat of23 KU13 skipped. Second12 prints malignant hypertension for dantrolene KU18; kept literal with a flag rather than silently correcting the source. Second13 prints nonselective COX-2 wording; requires final reconciliation. Bare KU on24 febrile-seizure case retains no invented year. Choice-and-justify prompts are written rationale questions, included as short notes; unreferenced example tables excluded.
NEXT: final202 onward, default50-page preparation. Source PDFs now at ../restored for final and /workspace/scratch/d60ed2b4552d/restored for second. Use those actual locations or place authenticated copies in one source directory. First/second/third addition gaps are exhausted subject to deferred cases and whole-page reconciliation. Do not retry the rejected GitHub push.

Completed sixth 50-page selection checkpoint (2026-10-01): final 202–251. Added 536 entries, totaling 6,188 on 450 entry-bearing pages. Every image was visually inspected, including zero-entry title/contents pages 223–224 and 249–250. Portable manifest: `scripts/kuhs-batches/2026-09-30-50-pages-06.json`. Typecheck, search-index and repeat-marker checks passed once. All 611 pages still require final whole-page reconciliation; KUHS remains gated and no build or release was made.

Source-selection notes for batch 06:
- Cross-page case joins: headache 206–207; meningitis 208–209; stroke 211–212; breast cases 238–239. Cases are stored where their complete KU-tagged prompt ends. The ascending weakness case at 210–211 has no visible exam reference and remains deferred.
- Page 216 literally expands DEXA as “dual emission X-ray absorptiometry”; retained with `(as printed)` rather than silently correcting the source. Page 226 “Stages of wound” likewise retained as printed.
- Bare KU tags preserved for subdural-haematoma management on 231, thyroglossal fistula on 237 and renal stones on 245. No year inferred. Carcinoma penis on 246 repeats KU23 in the printed reference list; stored once with KU20.
- Duplicate questions within a photographed page were merged with their printed KU years (e.g. tracheostomy/carotid body tumour on 234, phyllodes on 240). Repetitions on different pages retain their own provenance for final reconciliation, including laparoscopy 227/228, thyroglossal cyst 237/238 and hydrocele-surgery complications 246/247.
- Page 251 ends midway through the hernia short-answer list; continue its remaining rows at 252. The remaining queue is final 252–281, followed by the deferred cases and full page reconciliation across all four PDFs. OCR preparation never counted as visual review.
NEXT: final252 onward. Do not retry the rejected GitHub push.

Catalog correction in this checkpoint: medicine rows from final 149 onward use `general-medicine`, and surgery uses `general-surgery`, matching the existing catalog. Question IDs and page provenance remain unchanged.

2026-10-01 batch 07: visually inspected final-year PDF pages 252–281 and added 343 KU-tagged entries. Pages 266–267 are orthopaedics title/contents pages with zero entries. Final 263 repeats the ileocaecal TB case from 261; both source occurrences remain for reconciliation. Its RUQ-pain case is printed under appendix and assigned gallbladder topic. Final 281 prints a bare KU reference for slipped-capital-femoral-epiphysis complications; no year was inferred. Similar generic rows on the same page were merged with their printed years. Source typos such as skeletal fracture (269) and Marrot Baker’s cyst (281) need reconciliation. All 611 pages remain manual_page_review_required; KUHS_BANK_READY remains false. Ledger, typecheck, search-index and repeat-marker checks passed.

2026-10-01 reconciliation01: checked19 page images across all4 years; +1 Oct24 galactosemia case (first68), corrected final88 infertility reference attribution and third63 flood-team KU21 year. Deferred untagged cases explicitly excluded; third62 black C triangle remains unresolved. Whole-page reconciliation starts: first1–2 contents/introduction zero-entry, first3 all18 eligible rows/ref sittings match; objective/old one-mark items excluded. Evidence saved in kuhs-reconciled-pages.json. 3/611 complete,608 pending. Next first4 onward, plus remaining cross-page/duplicate/source ambiguities. KUHS_BANK_READY=false; no release or push.

2026-10-01 TXT conversion: user requested all four scanned PDFs as TXT and verification. OCR converted all611 PDF pages with preserved page markers and split photographed leaves for first year. Four individual OCR TXT files, combined TXT,6532-entry reviewed-ledger TXT,611-page qualityCSV and6532-question comparisonCSV saved in Decipher_questionbanks_TXT_bundle.zip. Bundle ID libfile_f83fa80191508191afe628f8936dd571 (file_00000000e6c08211a737e38b751974ec),2578287bytes. It includes per-page TXT/JSON checkpoints and scripts; original PDFs excluded. Allpage-section,hash,character-count and ZIP-integrity checks pass. Heuristicsflag361pages and1131ledgerentries; these are review aids, not accuracy scores or proof of incorrect ledger rows. Column ordering, headings, numbers and years may be misread. Manualstatus remains3complete/608pending; nextfirst4. Do not mark sourcepages complete fromOCR.

2026-10-01 TXT audit: normalized token matching and month-name parsing located119 previously flagged entries, leaving1012 uncertain. Canonical clean TXT without page metadata: libfile_c22518187bdc8191aea47ea2272e918d; comparison CSV libfile_0ebdfb530ee48191b4744544f354bb6a; queue libfile_355ef479b7b4819190b3d67eac83a638; summary libfile_ee6c41a49944819191c7504ecd532b57. All6532 cleanTXT entries exactly match app. Medical wording/year values preserved. Run scripts/kuhs-text/audit_txt.py with saved conversion directory and output directory; no PDFs read.
