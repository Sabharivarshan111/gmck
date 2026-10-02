#!/usr/bin/env python3
"""Make a review queue for first-year dated questions (whole book is Kerala).

The first-year volume labels exam sittings by month/year rather than KU tags.
This records occurrences with source locations; it does not publish OCR text.
"""

import csv
import pathlib
import re
import sys


DATE = re.compile(r"\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z.]*\s*['’]?(\d{2})(?!\d)", re.I)


def main():
    folder, destination = map(pathlib.Path, sys.argv[1:3])
    rows = []
    for page in sorted(folder.glob('*.txt')):
        number = int(page.stem.split('-')[0])
        column = page.stem.split('-', 1)[1] if '-' in page.stem else 'full'
        lines = page.read_text(errors='replace').splitlines()
        for index, line in enumerate(lines):
            sittings = [f'{month.title()} {year}' for month, year in DATE.findall(line)]
            if not sittings:
                continue
            rows.append({
                'page': number,
                'column': column,
                'line': index + 1,
                'exam_sittings': ', '.join(sittings),
                'count': len(sittings),
                'review_flags': 'table_or_two_columns' if '|' in line else 'wrapped_question_possible',
                'ocr_line': line.strip(),
                'context': ' '.join(part.strip() for part in lines[max(0,index-2):index+2] if part.strip())[:750],
            })
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open('w',newline='') as out:
        writer=csv.DictWriter(out,fieldnames=list(rows[0]) if rows else ['page','column','line','exam_sittings','count','review_flags','ocr_line','context'],delimiter='\t')
        writer.writeheader();writer.writerows(rows)
    print(f'{len(rows)} dated OCR lines from {folder.name}; verify each against the source page')


if __name__=='__main__': main()
