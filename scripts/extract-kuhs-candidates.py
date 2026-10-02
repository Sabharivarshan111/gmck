#!/usr/bin/env python3
"""Build a source-linked review queue from OCR of Decipher question pages.

This deliberately does not turn OCR into a published question bank. Tables,
two-column layouts and mixed university labels need visual review of each row.
KU/KUHS, RGU and TU labels are all candidates and are preserved for review.

Usage: python3 scripts/extract-kuhs-candidates.py OCR_DIR OUT_TSV
"""

import csv
import pathlib
import re
import sys


# A bracket may contain several universities. The Kerala years start after KU
# or KUHS and end at the next university abbreviation. OCR sometimes reads a
# brace or parenthesis as the opening bracket, so accept those delimiters.
TAG = re.compile(r"[\[{(]\s*(?:KUHS|KU)\s*([0-9][0-9\s,;/.-]*)(?=\s*(?:[,;/]?\s*(?:RGU|TU|TNU|\]|\}|\))))", re.I)
BARE_TAG = re.compile(r"(?<![A-Za-z])(?:KUHS|KU)\s*((?:20)?[12][0-9](?:\s*[,;/.-]\s*(?:20)?[12][0-9])*)(?!\d)", re.I)
UNDATED_TAG = re.compile(r"[\[{(]\s*(?:KUHS|KU)\s*[\]})]", re.I)
YEAR = re.compile(r"(?<!\d)(?:20)?(1[0-9]|2[0-9])(?=\D|$)")
OTHER = re.compile(r"\b(?:RGU|TU|TNU)\b", re.I)\nUNIVERSITY_TAG = re.compile(r"\b(?:KUHS|KU|RGU|TU|TNU)\b", re.I)


def kerala_years(line: str) -> tuple[str, ...]:
    years = []
    for match in BARE_TAG.finditer(line):
        for year in YEAR.findall(match.group(1)):
            if year not in years:
                years.append(year)
    return tuple(years)


def candidates(folder: pathlib.Path):
    for page in sorted(folder.glob("*.txt")):
        lines = page.read_text(errors="replace").splitlines()
        page_number = int(page.stem.split('-')[0])
        column = page.stem.split('-', 1)[1] if '-' in page.stem else 'full'
        for index, line in enumerate(lines):
            years = kerala_years(line)
            undated = bool(UNDATED_TAG.search(line))
            universities = []
            for tag in UNIVERSITY_TAG.findall(line):
                normal = tag.upper()
                if normal == 'KUHS':
                    normal = 'KU'
                if normal not in universities:
                    universities.append(normal)
            if not years and not undated and not universities:
                continue
            # Retain context for wrapped text and case-based essay questions.
            # A reviewer must compare it with the page before publication.
            context = " ".join(part.strip() for part in lines[max(0, index - 2):index + 2] if part.strip())
            reasons = []
            if "|" in line:
                reasons.append("table_or_two_columns")
            if len(line.strip()) < 35:
                reasons.append("question_may_wrap")
            if OTHER.search(line):
                reasons.append("mixed_university_label")
            if not TAG.search(line) and not undated:
                reasons.append("malformed_or_bare_ku_tag")
            if undated and not years:
                reasons.append("no_year_given")
            if len(context) > 750:
                context = context[:750]
            yield {
                "page": page_number,
                "column": column,
                "line": index + 1,
                "ku_years": ",".join(years),
                "ku_count": len(years),
                "universities": ",".join(universities),
                "review_flags": ",".join(reasons),
                "ocr_line": line.strip(),
                "context": context,
            }


def main():
    if len(sys.argv) == 2 and sys.argv[1] == '--self-test':
        examples = {
            '[KU26,24,23,RGU,TU]': ('26', '24', '23'),
            '[KU 25]': ('25',),
            '[KU 14,18,RGU,TU]': ('14', '18'),
            '[KUHS 2024, 2022]': ('24', '22'),
            '[RGU,TU]': (),
            '[TU 24]': (),
            '[RGU 24] [KU 23]': ('23',),
            'KU 23,18,RGU': ('23', '18'),
            '[KU]': (),
        }
        for source, expected in examples.items():
            actual = kerala_years(source)
            assert actual == expected, (source, actual, expected)
        print('KU/KUHS tag separation and year counts passed')
        return
    folder, destination = map(pathlib.Path, sys.argv[1:3])
    rows = list(candidates(folder))
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("w", newline="") as out:
        writer = csv.DictWriter(out, fieldnames=["page", "column", "line", "ku_years", "ku_count", "universities", "review_flags", "ocr_line", "context"], delimiter="\t")
        writer.writeheader()
        writer.writerows(rows)
    print(f"{folder.name}: {len(rows)} KU/RGU/TU tagged OCR lines; all require source-page review")


if __name__ == "__main__":
    main()
