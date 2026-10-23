#!/usr/bin/env python3
"""Private staging helper. Candidate extraction never approves a runtime question.

Use --sources with a directory containing text extracted from pinned PDFs. Output
contains publisher material and must remain private; it is not an app bank.
"""
import argparse
from collections import Counter
import json
import math
from pathlib import Path
import re


def duplicate_suggestions(candidates, existing):
    """Rank overlaps for a human; different wording is not proof of uniqueness."""
    stop = set('a an the and or with of in to for is are was were which following most not all except true false patient presented presents what does can be have has from at by on given about should will seen likely best years year old associated used cause causes may more than due among feature features include includes statement statements regarding listed diagnosis treatment'.split())
    def tokens(row):
        key = row.get('key')
        answer = row['options'][ord(key)-65] if key in ('A','B','C','D') else ''
        text = (row['question'] + ' ' + answer).lower().replace('haem', 'hem')
        return [w for w in re.findall(r'[a-z0-9]+', text) if w not in stop and len(w)>1]
    rows = candidates + existing
    counts = Counter(w for row in rows for w in set(tokens(row)))
    vectors = [{w: n*(math.log((len(rows)+1)/(counts[w]+1))+1)
                for w, n in Counter(tokens(row)).items()} for row in rows]
    norms = [math.sqrt(sum(n*n for n in vector.values())) for vector in vectors]
    for i, row in enumerate(candidates):
        scores = []
        for j, other in enumerate(existing, len(candidates)):
            if other['id'] == row['id']:
                continue
            score = sum(n*vectors[j].get(w,0) for w,n in vectors[i].items()) / (norms[i]*norms[j] or 1)
            scores.append((score, other['id']))
        row['duplicateSuggestions'] = [dict(id=identity, similarity=round(score,3))
                                       for score,identity in sorted(scores,reverse=True)[:3]]
    return candidates


def single_key(value):
    """Never turn C,D or A-B-D-C into the first letter of a fake single key."""
    value = value.strip().upper()
    return value if re.fullmatch(r'[A-D]', value) else None


def extract(text, source):
    text = re.sub(r'(?m)^\s*(?:docs\.aglasem\.com|aglasem\s*\.com|=== PAGE[^\n]*)\s*$', '', text)
    parts = re.split(r'(?m)^\s*Q\s*(\d+)\s*\.', text)
    rows = []
    for i in range(1, len(parts), 2):
        number, body = int(parts[i]), parts[i + 1]
        answer = re.search(r'Correct\s*answer\s*:\s*([^\n]+)', body, re.I)
        if not answer:
            continue
        options = re.split(r'(?m)^\s*([A-D])\)\s*', body[:answer.start()])
        if len(options) != 9:
            continue
        clean = lambda value: ' '.join(value.split())
        raw_key = answer[1].strip()
        question, choices = clean(options[0]), [clean(o) for o in options[2::2]]
        key = single_key(raw_key)
        issues = []
        if key is None:
            issues.append('non_single_or_unreadable_key')
        if not question or not all(choices) or len(set(choices)) != 4:
            issues.append('incomplete_or_duplicate_options')
        if re.search(r'\b(?:image|figure|graph|shown|marked|picture)\b', question, re.I):
            issues.append('figure_or_context_review_required')
        if re.search(r'\b[A-E]\)', ' '.join(choices)):
            issues.append('possible_extra_option')
        rows.append(dict(id=Path(source).stem + ':' + str(number), source=source,
                         source_number=number, question=question, options=choices,
                         sourceKeyText=raw_key, key=key, issues=issues,
                         reviewStatus='unreviewed_candidate'))
    counts = Counter(row['id'] for row in rows)
    for row in rows:
        if counts[row['id']] > 1:
            row['issues'].append('duplicate_source_number')
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sources', type=Path, required=True)
    parser.add_argument('--private-output', type=Path, required=True)
    parser.add_argument('--existing-bank', type=Path, action='append', default=[])
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    output = args.private_output.resolve()
    if output.is_relative_to(root):
        parser.error('Private candidate material must stay outside the repository')
    files = {p.name.replace('.ocr.txt', '.pdf').replace('.txt', '.pdf'): p
             for p in sorted(args.sources.glob('aglasem*.txt')) if not p.name.endswith('.ocr.txt')}
    for p in args.sources.glob('aglasem*.ocr.txt'):
        files[p.name.replace('.ocr.txt', '.pdf')] = p
    rows = [row for source, path in sorted(files.items()) for row in extract(path.read_text(), source)]
    existing = []
    for path in args.existing_bank:
        existing += [dict(id=row['id'],question=row['question'],options=row['options'],key=row['sourceAnswer'])
                     for row in json.loads(path.read_text())['records']]
    if existing:
        duplicate_suggestions(rows, existing)
    output.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(dict(candidateRows=len(rows), uniqueSourceIdentities=len({r['id'] for r in rows}),
                          sourceDocuments=len(files), rowsWithoutParserFlags=sum(not r['issues'] for r in rows),
                          approvedByExtraction=0)))


if __name__ == '__main__':
    main()
