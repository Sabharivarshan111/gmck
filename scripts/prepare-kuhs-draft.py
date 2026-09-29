#!/usr/bin/env python3
"""Prepare a source-linked *unverified* KUHS question review list.

Input is the separate-column OCR TSVs from extract-kuhs-candidates.py and
extract-first-year-candidates.py. This script never writes app question-bank
data: a reviewer must compare the draft text and exam years with the PDF page.
"""

import csv
import pathlib
import re
import sys


KU_TAG = re.compile(r"(?<![A-Za-z])(?:KUHS|KU)\s*(?:20)?[12][0-9]", re.I)
DATE_TAG = re.compile(r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z.]*\s*['’]?\d{2}(?!\d)", re.I)
LEADING_NUMBER = re.compile(r"^\s*[|_~.'‘“*\\-]*\s*(?:\d{1,2}|[ivx])(?:\s*[.)|_\-]+\s*|\s+)", re.I)


def extract_guess(line: str, first_year: bool) -> tuple[str, list[str]]:
    marker = DATE_TAG.search(line) if first_year else KU_TAG.search(line)
    reasons: list[str] = []
    if not marker:
        return '', ['missing_marker_in_line']
    # Questions in the source end at their Kerala/date marker. Restrict the
    # draft to the text BEFORE that marker: trailing RGU/TU columns are never
    # question content for this university.
    prefix = line[:marker.start()].strip()
    prefix = LEADING_NUMBER.sub('', prefix)
    prefix = re.sub(r"^[\s|_~.'‘“*\\-]+", '', prefix)
    prefix = re.sub(r"[\s|_~.'‘“*\\\[{(\-]+$", '', prefix)
    prefix = re.sub(r'\s+', ' ', prefix)
    if len(prefix.split()) < 3:
        reasons.append('short_or_wrapped_text')
    if '|' in prefix or '[' in prefix or ']' in prefix:
        reasons.append('possible_adjacent_column_or_tag')
    if re.search(r'\b(?:RGU|TU|TNU)\b', prefix, re.I):
        reasons.append('other_university_in_question_text')
    if first_year and re.search(r'\b(?:a\)|b\)|c\)|d\))', line, re.I):
        reasons.append('possible_mcq')
    return prefix, reasons


def main():
    source, destination = map(pathlib.Path, sys.argv[1:3])
    first_year = source.stem.startswith('first')
    with source.open() as stream:
        inputs = list(csv.DictReader(stream, delimiter='\t'))
    rows = []
    for row in inputs:
        guess, reasons = extract_guess(row['ocr_line'], first_year)
        reasons.extend(filter(None, row['review_flags'].split(',')))
        rows.append({
            'source_page': row['page'],
            'column': row['column'],
            'ocr_line': row['line'],
            'exam_years_or_sittings': row['exam_sittings'] if first_year else row['ku_years'],
            'repeat_count_candidate': row['count'] if first_year else row['ku_count'],
            'question_draft': guess,
            'review_flags': ','.join(dict.fromkeys(reasons)),
            'verified_question': '',
            'verified_years': '',
            'subject': '',
            'question_type': '',
            'review_status': 'unverified',
        })
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open('w', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]), delimiter='\t')
        writer.writeheader()
        writer.writerows(rows)
    print(f'{source.stem}: {len(rows)} unverified rows, {sum(bool(r["question_draft"]) for r in rows)} draft fragments')


if __name__ == '__main__':
    assert extract_guess('2 Astigmatism [KU24,14,RGU,TU] |', False)[0] == 'Astigmatism'
    assert extract_guess('1 Synovial joint Feb 22', True)[0] == 'Synovial joint'
    main()
