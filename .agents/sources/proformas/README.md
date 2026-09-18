# The case proforma source material, as text

These are the app owner's own clinical proforma PDFs, extracted to plain text
so the next session can read them without the PDFs being re-uploaded.

**They are TEXT, not SVG.** Nothing here is a drawing and nothing here renders.
That matters because it was assumed once: the extraction produced `.txt`, it
lived in an ephemeral scratchpad that does not survive a session, and it would
have been lost. It is committed now, which is the only reason it still exists.

## Why this exists at all

The PDFs are attachments on a chat message. A later session — Claude Code,
Antigravity or ChatGPT — does not get those attachments, so without this
directory the 40 case proformas in `mobile/src/lib/proformas/` would have no
traceable source, and nobody could check whether a proforma matches the sheet
it was built from. That check is the whole point: these are the owner's college
materials and where a proforma disagrees with one of them, **the sheet wins**.

## What is here

| File | Covers |
|---|---|
| `surgery_cases_final-2.txt` | Breast, thyroid, hernia, varicose veins, PVD/gangrene |
| `Long_cases-1.txt` | Obstructive jaundice, ileocaecal TB, carcinoma caecum, GOO |
| `Short_cases-1.txt` | Lipoma, sebaceous cyst, dermoid, hydrocele, UDT, penis, tongue, parotid |
| `ENT_DD.txt` | CSOM, DNS with sinusitis, ethmoidal polyp, stridor, tonsillitis |
| `PAEDIATRIC_CASE_PROFORMAS.txt` | GI, antenatal/natal/developmental, NICU |
| `General_Proforma.txt` | Ophthalmology case taking (despite the filename) |
| `Ophthalmology_Case_Profoma_-_Agam.txt` | Ocular examination sequence + viva differentials |
| `OBSTETRICS_AND_GYNAECOLOGY_CASE_PROFORMA.txt` | Obstetric and gynaecological clerking |
| `Piccle_mnemonics.txt` | PICCKLE — the general examination mnemonics |

## The two scans with no text layer, and how one of them was read anyway

`ortho_casesheets-1.pdf` and `proforma_medicine.pdf` are **image-only
CamScanner scans**. The extractor returns "Scanned by CamScanner" repeated,
because there is no text to extract. OCR needs a package this sandbox cannot
install — `tesseract`, `poppler-utils`, `pypdf` and `pip` are all refused by
the egress proxy.

**`ortho_casesheets-1` was read anyway, without OCR.** The PDF embeds each page
as a `DCTDecode` stream, and a DCTDecode stream *is* a JPEG verbatim — so the
22 page images were written out byte-for-byte with a few lines of Python and
read as images rather than as text:

```sh
python3 .agents/sources/proformas/extract-page-images.py <scan.pdf> <outdir>
```

That is a **transcription by eye, not machine OCR**: faithful to the structure
and the clinical content, not character-exact. It is in
`ortho_casesheets-1.txt`, and the six cases it contains — CTEV, chronic
osteomyelitis, non-union, peripheral nerve injuries, osteoarthritis and
malunion — are now `mobile/src/lib/proformas/orthopaedics.ts`.

`proforma_medicine.pdf` can be read the same way by anyone who wants to. Its
four systems (CVS, RS, abdomen, CNS) are already covered in depth by the v23
proformas, which is why it was left.

**Where a proforma disagrees with the owner's own sheet, the sheet wins.**

## Regenerating

```sh
python3 .agents/sources/proformas/extract-pdf-text.py <file.pdf> > out.txt
```

`extract-pdf-text.py` is a dependency-free PDF text extractor written for this
job, because `pdftotext`, `pypdf` and `pip` are all unreachable from an agent
sandbox. It decodes **per-font ToUnicode CMaps**, which is the part that
matters: Word subsets its fonts, so a glyph code is not an ASCII code and the
same byte means different letters in different fonts. Decoding with one merged
table is what turns "Breast" into "BreaVt" — that happened on the first attempt
and the output was unusable until the per-font tables were tracked through the
content stream's `Tf` operators.

It cannot read a scanned page. There is no text to extract from an image.
