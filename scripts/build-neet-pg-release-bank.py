"""Rebuild the authorised offline release bank from hash-pinned source PDFs.

Requires pymupdf and Pillow. Images are embedded; generated medical images are
never used. Incomplete and held records stay outside the study UI.
"""
import argparse
import base64
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
import hashlib
import io
import json
from pathlib import Path
import re
import urllib.request
import urllib.parse
import time

import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent


def clean(text):
    text = re.sub(r'\[IMG:[^\]]+\]', '', text)
    text = re.sub(r'PrepLadder|NEET\s*PG\s*\d{4}\s*PYQS|Page\s*\d+\s*of\s*\d+|www\.prepp\.in|\u200b|\ufeff', '', text)
    return re.sub(r'\s+', ' ', text).strip()


def split_options(head, patterns):
    for pattern in patterns:
        parts = re.split(pattern, head)
        labels = [label.translate(str.maketrans('сС', 'cC')).upper() for label in parts[1::2]]
        if labels in [list('ABCD'), list('1234')]:
            return clean(parts[0]), [clean(part) for part in parts[2::2]]
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--sources', type=Path, required=True)
    parser.add_argument('--download', action='store_true')
    args = parser.parse_args()
    args.sources.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((ROOT / 'scripts/neet-pg-build-sources.json').read_text())

    def fetch(source):
        target = args.sources / (source['name'] + '.pdf')
        if not target.exists() and args.download:
            print('Downloading ' + source['name'], flush=True)
            urls = [source['url']]
            parsed = urllib.parse.urlparse(source['url'])
            if parsed.hostname == 'drive.google.com':
                file_id = urllib.parse.parse_qs(parsed.query).get('id', [''])[0]
                urls.append('https://drive.usercontent.google.com/download?' + urllib.parse.urlencode({'id': file_id, 'export': 'download'}))
            last_error = None
            for attempt in range(4):
                try:
                    request = urllib.request.Request(urls[min(attempt, len(urls)-1)], headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(request, timeout=120) as response:
                        body = response.read(120_000_001)
                    if len(body) > 120_000_000:
                        raise ValueError('Source exceeds size limit')
                    if not body.startswith(b'%PDF-'):
                        raise ValueError('Expected a public PDF')
                    if hashlib.sha256(body).hexdigest() != source['sha256']:
                        raise ValueError('Source fingerprint changed')
                    target.write_bytes(body)
                    print('Verified ' + source['name'], flush=True)
                    break
                except Exception as error:
                    last_error = error
                    if attempt < 3:
                        time.sleep(2 * (attempt + 1))
            else:
                raise RuntimeError('Could not download ' + source['name'] + ': ' + str(last_error)) from last_error
        if hashlib.sha256(target.read_bytes()).hexdigest() != source['sha256']:
            raise ValueError('Source fingerprint changed: ' + source['name'])
    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(fetch, manifest))

    images = {}
    rows = {}

    def pdf_text(name, kind):
        doc = fitz.open(args.sources / (name + '.pdf'))
        pages = []
        image_cache = {}
        for page_number, page in enumerate(doc):
            events = []
            for block in page.get_text('dict')['blocks']:
                if block['type'] != 0:
                    continue
                for line in block['lines']:
                    text = ''.join(span['text'] for span in line['spans'])
                    box = fitz.Rect(line['bbox'])
                    if kind == 'colleg' and ((page_number == 0 and box.y0 < 135) or box.y0 > 795):
                        continue
                    if kind == 'prep' and (box.y0 < 55 or box.y0 > page.rect.height - 18):
                        continue
                    if kind == 'shift' and box.y0 > 710:
                        continue
                    if kind == 'prepp' and (box.y0 < 45 or box.y0 > 800) and 'Answer Key' not in text:
                        continue
                    if text.strip() == 'PrepLadder':
                        continue
                    events.append((box.y0, box.x0, text))
            for info in page.get_image_info(xrefs=True):
                box = fitz.Rect(info['bbox'])
                if kind == 'prepp':  # Only page furniture/watermarks in this source.
                    continue
                if kind == 'colleg' and ((page_number == 0 and box.y0 < 135) or box.y1 > 795):
                    continue
                if kind == 'prep' and box.y0 < 55:
                    continue
                if kind == 'shift' and box.y0 > 710:
                    continue
                if kind == 'dn' and (box.y0 < 50 or box.y1 > page.rect.height - 30):
                    continue
                if box.width < 25 or box.height < 25 or not info['xref']:
                    continue
                xref = info['xref']
                if xref not in image_cache:
                    original = doc.extract_image(xref)['image']
                    image = Image.open(io.BytesIO(original)).convert('RGB')
                    image.thumbnail((1100, 1100))
                    output = io.BytesIO()
                    image.save(output, format='WEBP', quality=88, method=2)
                    encoded = output.getvalue()
                    image_id = 'img-' + hashlib.sha256(encoded).hexdigest()[:20]
                    images[image_id] = {'dataUri': 'data:image/webp;base64,' + base64.b64encode(encoded).decode(), 'alt': 'Question illustration'}
                    image_cache[xref] = image_id
                events.append((box.y0, box.x0, '[IMG:' + image_cache[xref] + ']'))
            pages.append('\n'.join(item[2] for item in sorted(events, key=lambda item: (round(item[0], 1), item[1]))))
        doc.close()
        return '\n'.join(pages)

    def add(source, number, head, answer, patterns):
        parsed = split_options(head, patterns)
        if parsed:
            rows[(source, number)] = {'question': parsed[0], 'options': parsed[1], 'answer': clean(answer or ''), 'imageIds': list(dict.fromkeys(re.findall(r'\[IMG:([^\]]+)\]', head)))}

    for year in range(2018, 2024):
        source = f'{year}_PrepLadder'
        parts = re.split(r'Ques\s*No\s*:\s*(\d+)', pdf_text(source, 'prep'))
        for index in range(1, len(parts), 2):
            number, body = int(parts[index]), parts[index + 1]
            answer = re.search(r'Ans\s*:\s*([1-4])', body)
            if not answer:
                continue
            head = re.split(r'Sub-Topic\s*:', body, maxsplit=1)[-1]
            head = re.split(r'Ans\s*:', head, maxsplit=1)[0]
            add(source, number, head, answer[1], [r'O([1-4])\s*:'])
        print(source, 'parsed', sum(key[0] == source for key in rows), flush=True)

    for year in [2017, 2026]:
        source = f'{year}_Collegedunia_solutions'
        parts = re.split(r'(?m)^\s*(\d{1,3})\.\s*', pdf_text(source, 'colleg'))
        for index in range(1, len(parts), 2):
            number, body = int(parts[index]), parts[index + 1]
            answer = re.search(r'Correct\s*Answer\s*:\s*\(([A-D])\)', body)
            if answer:
                add(source, number, re.split(r'Correct\s*Answer\s*:', body, maxsplit=1)[0], answer[1], [r'\(([A-D])\)\s*'])

    for source in ['2024_shift1_Collegehai', '2024_shift2_Collegehai']:
        parts = re.split(r'Ques\s*(\d+)\s*\.', pdf_text(source, 'shift'))
        for index in range(1, len(parts), 2):
            number, body = int(parts[index]), parts[index + 1]
            answer = re.search(r'Ans\s*\.\s*([^\n]+)', body, re.I)
            if answer:
                add(source, number, re.split(r'Ans\s*\.', body, maxsplit=1, flags=re.I)[0], answer[1], [r'(?m)^\s*([A-Da-dсС])\s*\.\s*', r'(?<![A-Z])([A-D])\.\s*', r'(?<![A-Z])([a-dс])\.\s*'])

    source = '2024_PrepLadder'
    parts = re.split(r'Q\.\s*(\d+)\s*\.', pdf_text(source, 'prep'))
    for index in range(1, len(parts), 2):
        number, body = int(parts[index]), parts[index + 1]
        answer = re.split(r'Correct\s+Answer\s*:', body, maxsplit=1)
        if len(answer) != 2:
            continue
        key = clean(re.split(r'Topic\s*:', answer[1], maxsplit=1)[0])
        for furniture in [' Gynaecology & Obstetrics', ' ENT', ' EAR', ' PSM', ' Anatomy', ' Medicine', ' Paediatrics', ' Pharmacology', ' Pathology', ' Biochemistry', ' Surgery', ' Orthopaedics', ' Dermatology']:
            if key.endswith(furniture):
                key = key[:-len(furniture)].rstrip()
        add(source, number, answer[0], key, [r'(?m)^\s*([1-4])\s*\.\s*', r'(?<!\d)([1-4])\.\s+'])

    source = '2026_Prepp'
    text = pdf_text(source, 'prepp')
    question_text, answer_text = re.split(r'NEET\s*PG\s*2026\s*Answer\s*Key', text, maxsplit=1)
    # Unsorted extraction preserves the answer table's logical column order.
    with fitz.open(args.sources / (source + '.pdf')) as doc:
        logical = '\n'.join(page.get_text() for page in doc)
    answer_text = logical.split('NEET PG 2026 Answer Key', maxsplit=1)[1]
    keys = {int(number): key for number, key in re.findall(r'(?m)^\s*(\d+)\s+[^\n]*?\s([A-D])\s+', answer_text)}
    parts = re.split(r'(?m)^\s*(\d{1,3})\.\s+', question_text)
    for index in range(1, len(parts), 2):
        number = int(parts[index])
        add(source, number, re.split(r'Topic\s*:', parts[index + 1], maxsplit=1)[0], keys.get(number), [r'(?m)^\s*([A-D])\.\s*'])

    # Retain the PDF's own wording, options and key for the 2025 recall source.
    source = '2025_DigiNerve_web'
    parts = re.split(r'Q\s*(\d+)\s*\.', pdf_text('2025_DigiNerve', 'dn'))
    for index in range(1, len(parts), 2):
        number, body = int(parts[index]), parts[index + 1]
        answer = re.search(r'Answer\s*:\s*([A-D])', body, re.I)
        if answer:
            add(source, number, re.split(r'Answer\s*:', body, maxsplit=1, flags=re.I)[0], answer[1].upper(), [r'(?m)^\s*([A-D])\.\s*'])

    # Retain the audited webpage's complete option lists and supplied keys.
    # Clinical illustrations are mapped by the matching question number in its PDF.
    image_map = {int(parts[index]): list(dict.fromkeys(re.findall(r'\[IMG:([^\]]+)\]', re.split(r'Answer\s*:', parts[index + 1], maxsplit=1, flags=re.I)[0]))) for index in range(1, len(parts), 2)}
    for item in json.loads((ROOT / 'scripts/neet-pg-2025-records.json').read_text()):
        rows[(source, item['number'])] = {'question': clean(item['question']), 'options': [clean(value) for value in item['options']], 'answer': item['answer'] or '', 'imageIds': image_map.get(item['number'], [])}

    notes = json.loads((ROOT / 'mobile/src/lib/neetPgStudyData.json').read_text())
    policy = json.loads((ROOT / 'scripts/neet-pg-build-policy.json').read_text())
    held, requires_image = set(policy['heldIds']), set(policy['requiresImageIds'])
    rejected, records, seen = [], [], set()
    for ordinal, note in enumerate(notes['records'], 1):
        row = rows.get((note['source'], note['source_number']))
        reason = None
        if note['id'] in held:
            reason = 'answer_review_incomplete'
        elif not row or not row['question'] or len(row['options']) != 4 or not all(row['options']) or len(set(row['options'])) != 4:
            reason = 'source_options_incomplete'
        elif not row['answer']:
            reason = 'source_answer_missing'
        elif (note['id'] in requires_image or re.search(r'\b(?:image|picture|figure|photograph|radiograph|micrograph)\b|\bshown (?:below|above)\b', row['question'], re.I)) and not row['imageIds']:
            reason = 'required_image_unavailable'
        if reason:
            rejected.append({'id': note['id'], 'reason': reason})
            continue
        signature = (row['question'], tuple(row['options']), row['answer'])
        if signature in seen:
            rejected.append({'id': note['id'], 'reason': 'exact_duplicate'})
            continue
        seen.add(signature)
        answer, options = row['answer'], row['options']
        answer_index = ord(answer.upper()) - 65 if re.fullmatch('[A-Da-d]', answer) else int(answer) - 1 if re.fullmatch('[1-4]', answer) else options.index(answer) if answer in options else None
        records.append({'id': f'neet-{note["year"]}-{ordinal:04}', 'chapterId': note['chapterId'], 'question': row['question'], 'options': options, 'answerIndex': answer_index, 'sourceAnswer': answer, 'explanation': note['explanation'], 'requiresImage': bool(row['imageIds']), 'imageIds': row['imageIds']})
    used_images = {image_id for row in records for image_id in row['imageIds']}
    chapters = {row['chapterId'] for row in records}
    bank = {'schema': 1, 'id': 'neet-pg-offline-20261019', 'chapters': [chapter for chapter in notes['chapters'] if chapter['id'] in chapters], 'records': records, 'images': {key: images[key] for key in sorted(used_images)}}
    target = ROOT / 'mobile/src/lib/neetPgBank.json'
    payload = json.dumps(bank, ensure_ascii=False, separators=(',', ':')) + '\n'
    # Keep individual repository/upload requests small; every image remains bundled.
    image_parts = [{} for _ in range(4)]
    for index, (key, value) in enumerate(bank['images'].items()):
        image_parts[index % 4][key] = value
    for index, part in enumerate(image_parts):
        (target.parent / f'neetPgImages{index}.json').write_text(json.dumps(part, separators=(',', ':')) + '\n')
    target.write_text(json.dumps({**bank, 'images': {}}, ensure_ascii=False, separators=(',', ':')) + '\n')
    summary = {'questions': len(records), 'chapters': len(bank['chapters']), 'images': len(used_images), 'bytes': len(payload.encode()), 'sha256': hashlib.sha256(payload.encode()).hexdigest(), 'omitted': len(rejected), 'omissionCounts': dict(Counter(row['reason'] for row in rejected)), 'years': sorted({row['id'].split('-')[1] for row in records})}
    (ROOT / 'docs/NEET_PG_RELEASE_BANK.json').write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps(summary, indent=2), flush=True)


if __name__ == '__main__':
    main()
