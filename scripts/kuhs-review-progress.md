# KUHS source review checkpoint (2026-09-29)

The four Decipher PDFs have 611 PDF pages: first 86, second 149, third 95,
final 281. `kuhs-page-coverage.tsv` indexes every page. The reviewed question
ledger currently has 1,625 visually checked essay/short-answer entries on 102
pages with at least one checked entry. **No page is marked fully reviewed.**
The other pages and incomplete portions of these pages still require comparison
with the source images. KUHS publication stays gated by `KUHS_BANK_READY = false`.

The next sequential image queue starts at first-year PDF page 53, second-year
page 79, third-year page 31, and final-year page 77. Use the source PDFs from
the user's Library in a local `../restored` directory, then run:

```sh
python3 scripts/prepare-kuhs-review-batch.py ../restored ../kuhs-page-batches/next \
  --start first:53 --start second:79 --start third:31 --start final:77 \
  --count 4 --jobs 4 --ocr
```

Visually compare each PDF image and the printed KU exam references before
adding a row to `src/data/kuhs/reviewedMore.ts`. TU and RGU references in the
same books are not KUHS exam references. One-mark/MCQ material is not included
in this essay/short-answer ledger. Update the checked-entry count in
`kuhs-page-coverage.tsv`, leaving `manual_page_review_required` until the
entire page has been reconciled. Use the OCR output only to locate text.

Before each checkpoint, run the type, search-index and repeat-marker checks
under `mobile`, and audit the 611-row coverage TSV with
`python3 scripts/audit-kuhs-coverage.py ../kuhs-review scripts/kuhs-page-coverage.tsv`.
Commit and push the review branch after each small batch. The original PDFs
are source material and are not uploaded to Supabase.
