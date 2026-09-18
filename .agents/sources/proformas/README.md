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

## Two files that could NOT be extracted, and why

`ortho_casesheets-1.txt` is 506 bytes of the words "Scanned by CamScanner"
repeated, and `proforma_medicine` produced nothing at all. Both are **image-only
scans with no text layer**. Extracting them needs OCR, which needs a package
this sandbox cannot install — `poppler-utils` and `pypdf` are both refused by
the egress proxy.

So `ortho_fracture_proforma` was written from the standard examination sequence
(Apley, Maheshwari, Ebnezar) rather than from the owner's sheet. **If his sheet
differs, his sheet wins** — someone with OCR should read it and reconcile.

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
