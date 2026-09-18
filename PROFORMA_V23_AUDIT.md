# v23 proforma expansion — review and handoff

Updated 2026-09-18. Work based on main at 6721b26c. Publication authorized by the user; workflow completion must be checked on GitHub.

## Implemented

The catalogue increases from 53 to 76 cases: 16 added paediatric cases and seven added obstetric/gynaecological cases. Totals: paediatrics 20, OBG 18, surgery 14, medicine 10, orthopaedics 7, ENT 5, ophthalmology 2. New content lives in paediatricSystems.ts and obgAdditional.ts, using the existing section renderer and shared background prompts.

The normal-values drawer now opens the laboratory reference sheet and uses explicit content heights with bottom insets. Clinical-sign text previously omitted by the renderer is displayed. The native screenshot driver now includes the laboratory reference sheet.

Three Commons clinical photographs are added: palmar erythema (Jmarchn), peripheral fingertip cyanosis (7mike5000), and onycholysis (Alborz Fallah), all CC BY-SA 3.0. The curated catalogue retains source/credit/licence links, explains clinical limitations, and provides a retry state for failed remote images. A microscopic splinter-haemorrhage image is excluded from bedside-photo display. Angular cheilitis is explicitly distinguished from Koplik spots. Twelve photographs are available across the 19-sign catalogue; not every sign has a verified photograph. Remote photos require connectivity.

Selected existing teaching statements were corrected: SAM criteria use alternatives rather than requiring all criteria; cuff choice follows measured arm size; malnutrition rehydration follows a monitored pathway; jaundice assessment uses gestation/age/risk charts; IVIG is selective; setting-sun eyes are not presented as a bilirubin-encephalopathy sign; aortic regurgitation does not require every peripheral sign.

Primary references consulted during the earlier source review:
- WHO 2023 wasting guidance: https://www.who.int/publications/i/item/9789240082830
- WHO recommendation B7: https://www.ncbi.nlm.nih.gov/books/NBK601655/
- AAP hyperbilirubinaemia FAQ: https://www.aap.org/en/patient-care/hyperbilirubinemia/frequently-asked-questions-about-the-2022-aap-guideline-on-the-management-of-hyperbilirubinemia/

## PDF coverage and remaining audit

Ten supplied PDFs total 471 pages; the two 82-page OG files have identical extracted text, leaving 389 unique pages. This is an inventory and targeted review, not a claim that every handwritten line has been clinically verified.

| Source | Pages | Coverage / remaining work |
|---|---:|---|
| PAEDIATRIC CASE PROFORMAS | 71 | GI 1–16, nutrition 17–24, neonate 25–30, CNS 31–47, respiratory 48–59, cardiovascular 59–71; system cases expanded. |
| Paediatrics_proforma | 110 | All pages rendered and indexed; selected details visually read. RHD, thalassaemia, hepatomegaly, jaundice, ARI, acute abdomen, TOF, CP, nephritic/nephrotic syndromes, preterm, nutrition, VSD, rickets, hypothyroidism, hydrocephalus and Down syndrome covered. Poor handwritten OCR means line-by-line reconciliation remains open. |
| OG cases and OG cases-1 | 82 each | Duplicate text counted once. Anaemia, PIH, GDM, breech, twins, prior LSCS, postdates, disproportion, cardiac/Rh disease, fibroid, AUB, prolapse, ovarian mass, discharge and infertility mapped. |
| OBG CASE PROFORMA | 13 | General gynaecological and antenatal frameworks reviewed. |
| clinical cases obstetrics | 21 | Six worked examples reviewed; last two pages advertising/blank. Example patient data was not copied as defaults. |
| Medicine | 16 | Corrected OCR reviewed for four systems; complete manual reconciliation remains open. |
| Surgery | 43 | Breast, thyroid, PAD, varicose veins and hernia mapped. Full detailed reconciliation of later pages remains open. Unsafe or erroneous old teaching is not automatically imported. |
| Orthopaedics | 22 | Existing CTEV, osteomyelitis, nonunion, nerve injury, OA knee and malunion material retained; faint handwriting needs further manual verification. |
| PICCLE | 11 | Shared 19-sign catalogue retained; photo matching remains incomplete. |

## Verification on the recovered working copy

Passed: TypeScript, ESLint, check:proformas (76 cases), check:exam-signs (19 signs), check:keyboard, check:edges, check:version (23 / 0.0.0.23), and Android production JavaScript bundling. The bundle reports a React Native feature-flag export fallback warning. Proforma image checks reported unavailable image assets in this sparse checkout; complete image validation remains open.

No new APK/AAB was built or published. No fresh Android screenshots were captured. Browser preview could not launch because Chromium graphics initialization failed in this environment; no visual/device verification is claimed. The attempted temporary preview harness was removed rather than shipping an unverified harness.

## Next steps for Claude

1. Recover the accompanying patch onto main at the recorded base if this workspace is lost. Inspect and apply with git apply --check before applying. Preserve unrelated changes.
2. Finish manual PDF reconciliation listed above. Do not describe the source audit as complete or increase confidence based only on parser checks.
3. On an Android-capable runner, run the updated screenshot driver, inspect drawer sizing/scrolling, laboratory sheet navigation, long case sections, image failure/retry and attribution links. Then build the requested v23 artifacts and inspect workflow results.
4. The user explicitly approved publication to main and the release/screenshot workflows on 2026-09-18. Terminal git push failed for lack of credentials; publish through the connected GitHub account, then verify the actual commit and workflow outcomes. Earlier local recovery commits never reached GitHub.

The user's main-only instruction supersedes the repository's older branch convention. The earlier approval-review block was followed by explicit user approval. Local commits and this recovery patch are reviewable work, not a released update.

## Duplicate audit — 2026-09-18

AST inspection found 76 entries, with no duplicate IDs, normalized titles, or identical complete case objects. Every source array is included once in CLINICAL_PROFORMAS. This count is not 76 unrelated diseases: the catalogue includes general examination frameworks and focused cases. Significant overlap includes Pediatric Clinical Case Proforma / Paediatric History and Examination; neonatal assessment / neonatal jaundice; general gynaecology / fibroid-AUB / adnexal mass; general OBG / antenatal framework; and orthopaedic/trauma overview / fracture assessment. Shared history and examination prompts also repeat deliberately. These entries have different content but should not be advertised as 76 wholly distinct conditions. No entries were deleted merely to change the count.

Screenshot provenance: the workflow uses an older native debug APK as a shell, but run_native_screenshot_apk.sh repacks the current checkout's Metro bundle before capture. Screenshots therefore exercise current JavaScript on that native shell, not a newly compiled native binary. The changed files in this update do not add native dependencies.
