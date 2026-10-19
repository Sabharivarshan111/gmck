"""Match local source extracts to study notes without publishing publisher text.

Run: python3 scripts/audit-neet-pg-matches.py --sources /path/to/pg_audit
Only counts, identifiers and fingerprints are written. This is a completeness
assessment, not a distributable question pack or medical answer verification.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()


def option_blocks(text, pattern):
    parts = re.split(pattern, text)
    labels = [label.translate(str.maketrans('сС', 'cC')).upper() for label in parts[1::2]]
    if labels not in [list('ABCD'), list('1234')]:
        return None
    return parts[0].strip(), [part.strip() for part in parts[2::2]]


def answer_index(key):
    key = str(key).strip().upper()
    if key in list('ABCD'):
        return ord(key) - ord('A')
    if key in list('1234'):
        return int(key) - 1
    return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sources', type=Path)
    parser.add_argument('--self-test', action='store_true')
    parser.add_argument('--output', type=Path, default=Path('docs/NEET_PG_MATCH_AUDIT_20261019.json'))
    args = parser.parse_args()
    if args.self_test:
        assert option_blocks('Stem A. One B. Two C. Three D. Four', r'([A-D])\.\s*') == ('Stem', ['One', 'Two', 'Three', 'Four'])
        assert option_blocks('Stem a. One b. Two с. Three d. Four', r'([a-dс])\.\s*') == ('Stem', ['One', 'Two', 'Three', 'Four'])
        assert option_blocks('Stem A. One C. Three D. Four', r'([A-D])\.\s*') is None
        assert answer_index('c') == answer_index('3') == 2
        assert answer_index('B/C') is None
        print('PASS original parser fixtures: preserved options, label recognition, missing-option and ambiguous-key rejection.')
        return
    if not args.sources:
        parser.error('--sources is required unless --self-test is used')
    repo = Path(__file__).resolve().parent.parent
    data = json.loads((repo / 'mobile/src/lib/neetPgStudyData.json').read_text())
    rows = {}
    images = {}

    def add(source, number, stem, options, key, raw, image_count=0):
        identity = (source, int(number))
        if identity in rows:
            raise ValueError(f'Duplicate source identity: {identity}')
        rows[identity] = dict(stem=stem, options=options, key=key, raw=raw)
        images[identity] = image_count

    for row in json.loads((args.sources / 'early/source_records.internal.json').read_text()):
        options = row['options']
        labels = list('ABCD') if 'A' in options else list('1234')
        add(row['source'], row['source_number'], row['stem'], [options.get(label, '') for label in labels], row['source_key'], row['source_text'])

    for row in json.loads((args.sources / 'explanations/source_records_2024_shifts.internal.json').read_text()):
        raw = row['source_text']
        head = re.split(r'Ans\s*\.', raw, maxsplit=1, flags=re.I)[0]
        parsed = option_blocks(head, r'(?<![A-Z])([A-D])\.\s*')
        if not parsed:
            parsed = option_blocks(head, r'(?<![A-Z])([a-dс])\.\s*')
        if parsed:
            add(row['source'], row['source_number'], *parsed, row['source_key'], raw)

    # HTML lists preserve option boundaries and image associations lost in PDF
    # text extraction. No image bytes or publisher questions are emitted.
    from lxml import html
    doc = html.fromstring((args.sources / 'recent/diginerve2025.html').read_text())
    for node in doc.xpath('//p'):
        match = re.match(r'^Q\s*(\d+)\.\s*(.*)', node.text_content().strip(), re.S)
        if not match:
            continue
        number = int(match[1])
        following = []
        for sibling in node.itersiblings():
            if re.match(r'^Q\s*\d+\.', sibling.text_content().strip()):
                break
            following.append(sibling)
        lists = [sibling for sibling in following if sibling.tag in ('ol', 'ul')]
        if len(lists) != 1:
            continue
        options = [' '.join(item.itertext()).strip() for item in lists[0].xpath('./li')]
        answer = re.search(r'Answer\s*:\s*([A-D])', '\n'.join(item.text_content() for item in following), re.I)
        key = answer[1].upper() if answer else None
        # Q57 has a key recorded from a second source in the existing audit.
        # Do not silently adopt it as the DigiNerve page's own answer.
        add('2025_DigiNerve_web', number, match[2].strip(), options, key,
            node.text_content() + '\n' + '\n'.join(item.text_content() for item in following),
            sum(len(item.xpath('.//img')) + int(item.tag == 'img') for item in following))

    raw = (args.sources / '2026_Collegedunia_solutions.txt').read_text()
    blocks = re.split(r'(?m)^\s*(\d{1,3})\.\s+', raw)
    for index in range(1, len(blocks), 2):
        number, text = int(blocks[index]), blocks[index + 1]
        key = re.search(r'Correct\s*Answer\s*:\s*\(([A-D])\)', text)
        if not key:
            continue
        head = re.split(r'Correct\s*Answer\s*:', text, maxsplit=1)[0]
        parsed = option_blocks(head, r'\(([A-D])\)\s*')
        if parsed:
            add('2026_Collegedunia_solutions', number, *parsed, key[1], text)

    # Numbered answer text is retained exactly; a mismatch is never converted
    # into a guessed option index, even if a spelling correction seems obvious.
    raw = (args.sources / '2024_PrepLadder.txt').read_text()
    blocks = re.split(r'Q\.\s*(\d+)\.', raw)
    for index in range(1, len(blocks), 2):
        number, text = int(blocks[index]), blocks[index + 1]
        parts = re.split(r'Correct\s+Answer\s*:', text, maxsplit=1)
        if len(parts) != 2:
            continue
        head = re.sub(r'PrepLadder', '', parts[0])
        parsed = option_blocks(head, r'(?<!\d)([1-4])\.\s+')
        if parsed:
            key = re.split(r'Topic\s*:', parts[1], maxsplit=1)[0].strip()
            add('2024_PrepLadder', number, *parsed, key, text)

    raw = (args.sources / '2026_Prepp.txt').read_text()
    question_text, answer_text = raw.split('NEET PG 2026 Answer Key', maxsplit=1)
    keys = {int(number): key for number, key in re.findall(r'(?m)^\s*(\d+)\s+[^\n]*?\s([A-D])\s+', answer_text)}
    blocks = re.split(r'(?m)^\s*(\d{1,3})\.\s+', question_text)
    for index in range(1, len(blocks), 2):
        number, text = int(blocks[index]), blocks[index + 1]
        head = re.split(r'Topic\s*:', text, maxsplit=1)[0]
        # Publisher/page furniture is separate from question/option content.
        head = re.sub(r'(?m)^www\.prepp\.in\s*$', '', head)
        parsed = option_blocks(head, r'(?m)^\s*([A-D])\.\s*')
        if parsed:
            add('2026_Prepp', number, *parsed, keys.get(number), text)

    chapter_ids = {chapter['id'] for chapter in data['chapters']}
    assert len(chapter_ids) == len(data['chapters'])
    assert all(note['chapterId'] in chapter_ids for note in data['records'])
    assert len({note['id'] for note in data['records']}) == len(data['records'])
    counts = {}
    fingerprints = []
    unmatched = []
    image_pattern = re.compile(r'\b(?:image|figure|photograph|micrograph|diagram|radiograph|picture)\b|\bshown\s+(?:below|above)\b', re.I)
    for note in data['records']:
        source = note['source']
        counter = counts.setdefault(source, Counter(year=note['year']))
        counter['notes'] += 1
        row = rows.get((source, note['source_number']))
        if not row:
            counter['unparsed'] += 1
            unmatched.append(note['id'])
            continue
        counter['matched'] += 1
        options, key = row['options'], row['key']
        structurally_complete = bool(row['stem'].strip()) and len(options) == 4 and all(option.strip() for option in options)
        idx = answer_index(key)
        if idx is None and key is not None:
            exact = [i for i, option in enumerate(options) if ' '.join(option.split()) == ' '.join(str(key).split())]
            idx = exact[0] if len(exact) == 1 else None
        note_key = str(note.get('source_answer', '')).strip()
        keys_equal = key is not None and (' '.join(note_key.split()) == ' '.join(str(key).split()) or (answer_index(note_key) is not None and answer_index(note_key) == idx))
        if structurally_complete:
            counter['complete_text_and_four_options'] += 1
        if not keys_equal:
            counter['source_key_not_matched'] += 1
        if idx is None:
            counter['source_key_not_resolved_to_option'] += 1
        if structurally_complete and keys_equal and idx is not None:
            counter['text_options_key_explanation_matched'] += 1
        image_clue = bool(image_pattern.search(row['stem'])) or images.get((source, note['source_number']), 0) > 0
        if image_clue:
            counter['requires_image_mapping_review'] += 1
        fingerprints.append(dict(id=note['id'], source=source, source_number=note['source_number'],
            question_sha256=digest(row['stem']), options_sha256=digest(options),
            source_key_sha256=digest(key), source_text_sha256=digest(row['raw']),
            text_and_four_options_complete=structurally_complete, source_key_matches_note=keys_equal,
            source_key_resolves_to_option=idx is not None, image_mapping_review_needed=image_clue))

    report = dict(schema=1, scope='Local downloaded-source matching audit; not a distributable MCQ bank',
        notes=len(data['records']), mapped_chapters=len(data['chapters']), matched=len(fingerprints), unparsed=len(unmatched),
        matched_text_options_key_explanation=sum(c['text_options_key_explanation_matched'] for c in counts.values()),
        source_options_changed=0, source_keys_changed=0,
        image_bytes_embedded=0, redistribution_clearance='Not established for these publisher collections',
        readiness='Not ready to replace the released bank',
        limitations=['Structural matching does not verify examination authenticity, explanation relevance or medical correctness.',
            'Image requirement detection is a heuristic; every source page still needs visual review.',
            'Extracted text may retain page furniture; a structural match is not a clean, verified MCQ.',
            'Matches with suspected images have no embedded image payload yet.',
            'Source wording and supplied answers are never corrected or guessed by this audit.',
            'Unparsed sources remain unresolved; no question or option is manufactured.'],
        sources=[dict(source=source, **counter) for source, counter in counts.items()],
        unparsed_ids=unmatched, unresolved_parsed_ids=[row['id'] for row in fingerprints if not (row['text_and_four_options_complete'] and row['source_key_matches_note'] and row['source_key_resolves_to_option'])], fingerprint_sha256=digest(fingerprints))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({key: report[key] for key in ['notes', 'matched', 'unparsed', 'matched_text_options_key_explanation', 'source_options_changed', 'source_keys_changed', 'readiness']}, indent=2))
    for row in report['sources']:
        print(row)


if __name__ == '__main__':
    main()
