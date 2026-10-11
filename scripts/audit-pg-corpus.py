#!/usr/bin/env python3
"""Audit every bundled PG asset without publishing question text or claiming clinical review.
NFC preserves medically meaningful compatibility characters; whitespace/case alone
are ignored for duplicate comparison. No model, network or textbook calls occur.
"""
import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
DATE = '2026-10-11'
IMAGE_PATTERN = re.compile(
    r'\b(?:shown|depicted|illustrated)\s+(?:below|above|here|in\s+(?:the\s+)?(?:image|figure|diagram|picture|photograph|slide|radiograph|x[- ]?ray|ecg|ct|illustration))\b'
    r'|\b(?:following|given|this|the)\s+(?:image|figure|picture|photograph|illustration)\b'
    r'|\bgiven\s+(?:diagram|slide|radiograph|x[- ]?ray|ecg)\b'
    r'|\bfollowing\s+(?:diagram|slide|radiograph|x[- ]?ray|ecg)\b(?!\s+(?:should|findings?|features?|changes?|signs?|tests?|types?|parameters?|leads?|abnormalit(?:y|ies)))'
    r'|\b(?:see|refer\s+to)\s+(?:the\s+)?(?:image|figure|diagram|picture)\b'
    r'|\b(?:image|figure|diagram|picture|photograph|slide|radiograph)\s+(?:below|above|shown)\b', re.I)
PLACEHOLDER_PATTERN = re.compile(r'^(?:option\s*[abcd]|[?]+|\.{2,}|[-–—]+|not\s+available|not\s+given|missing)\s*[.)]?$', re.I)

def normalized(value):
    return ' '.join(unicodedata.normalize('NFC', value).casefold().split())

def fingerprint(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()

def read_assets():
    manifest = (ROOT / 'mobile/src/lib/pgPacks/generatedManifest.ts').read_text()
    entries = re.findall(r'id: "([^"]+)", exam: "([^"]+)", year: (null|\d+), count: (\d+)', manifest)
    if not entries:
        raise ValueError('No packs parsed from manifest')
    all_rows, packs = [], []
    for pack_id, exam, year, count in entries:
        path = ROOT / 'mobile/src/lib/pgPacks' / (pack_id + '.ts')
        raw = path.read_bytes(); text = raw.decode()
        match = re.search(r'const ROWS[^=]*= (.*?);\nconst EXAM', text, re.S)
        if not match:
            raise ValueError(f'Unsupported asset encoding: {pack_id}')
        records = json.loads(match.group(1))
        if len(records) != int(count):
            raise ValueError(f'Manifest count differs: {pack_id}')
        packs.append(dict(id=pack_id, exam=exam, year=None if year == 'null' else int(year),
                          rows=len(records), asset_sha256=hashlib.sha256(raw).hexdigest()))
        for r in records:
            all_rows.append(dict(id=r[0], question=r[1], options=r[2:6], answer_index=r[6],
                                 explanation=r[7], exam=exam, year=None if year == 'null' else int(year), pack=pack_id))
    return all_rows, packs

def audit():
    rows, packs = read_assets()
    reasons = defaultdict(set)
    ordered, unordered, stems, exact, ids = (defaultdict(list) for _ in range(5))
    explanation_counts = Counter()
    for q in rows:
        qid = q['id']; ids[qid].append(q)
        opts = q['options']; normopts = [normalized(o) for o in opts]
        stem = normalized(q['question'])
        if len(normopts) != 4 or any(not o for o in normopts): reasons[qid].add('missing_option')
        if len(set(normopts)) < 4: reasons[qid].add('duplicate_option_text')
        if any(PLACEHOLDER_PATTERN.fullmatch(o.strip()) for o in opts): reasons[qid].add('placeholder_option')
        if IMAGE_PATTERN.search(q['question']): reasons[qid].add('explicit_image_dependency_without_asset')
        if len(q['question'].strip()) <= 8: reasons[qid].add('incomplete_stem')
        if not isinstance(q['answer_index'], int) or q['answer_index'] not in range(4): reasons[qid].add('invalid_answer_index')
        answer = normopts[q['answer_index']] if isinstance(q['answer_index'], int) and q['answer_index'] in range(4) else None
        q['normalized_answer'] = answer
        ordered[(stem, tuple(normopts))].append(q)
        unordered[(stem, tuple(sorted(normopts)))].append(q)
        stems[stem].append(q)
        exact[(q['question'], tuple(opts))].append(q)
        explanation_counts[q['exam'] + (':nonempty' if q['explanation'].strip() else ':empty')] += 1
    for qid, group in ids.items():
        if len(group) > 1: reasons[qid].add('duplicate_id')
    conflict_groups = []
    for key, group in unordered.items():
        if len({q['normalized_answer'] for q in group}) > 1:
            conflict_groups.append(dict(fingerprint=fingerprint(key), ids=sorted(q['id'] for q in group)))
            for q in group: reasons[q['id']].add('conflicting_answer_for_same_stem_and_options')
    def duplicate_report(groups):
        members = [g for g in groups.values() if len(g) > 1]
        return dict(groups=len(members), rows=sum(len(g) for g in members), excess_rows=sum(len(g)-1 for g in members))
    variants = []
    for stem, group in stems.items():
        if len(group) > 1 and len({q['normalized_answer'] for q in group}) > 1:
            option_sets = {tuple(sorted(normalized(o) for o in q['options'])) for q in group}
            if len(option_sets) > 1:
                variants.append(dict(fingerprint=fingerprint(stem), ids=sorted(q['id'] for q in group)))
    per_exam = Counter(q['exam'] for q in rows)
    quarantined_exam = Counter(q['exam'] for q in rows if q['id'] in reasons)
    per_reason = Counter(reason for values in reasons.values() for reason in values)
    eligible_pack = Counter(q['pack'] for q in rows if q['id'] not in reasons)
    for pack in packs:
        pack['eligible_rows'] = eligible_pack[pack['id']]
        pack['quarantined_rows'] = pack['rows'] - pack['eligible_rows']
    corpus_fingerprint = fingerprint([(p['id'], p['asset_sha256']) for p in packs])
    report = dict(audit_date=DATE, schema_version=1, clinical_verification_performed=False,
                  scope='All currently bundled static PG assets; structural checks do not establish medical correctness or exam-year provenance.',
                  normalization='Unicode NFC, casefold and collapsed whitespace; never NFKC',
                  asset_fingerprint=corpus_fingerprint, total_rows=len(rows), packs_count=len(packs),
                  proven_year_rows=sum(q['year'] is not None for q in rows),
                  independently_medically_verified_rows=0, by_exam=dict(sorted(per_exam.items())),
                  nonempty_explanation_counts=dict(sorted(explanation_counts.items())),
                  quarantine_unique_rows=len(reasons), structurally_eligible_rows=len(rows)-len(reasons),
                  quarantine_by_exam=dict(sorted(quarantined_exam.items())), reason_counts=dict(sorted(per_reason.items())),
                  exact_stem_option_duplicates=duplicate_report(exact),
                  normalized_ordered_stem_option_duplicates=duplicate_report(ordered),
                  normalized_reordered_stem_option_duplicates=duplicate_report(unordered),
                  conflicting_same_stem_option_groups=conflict_groups,
                  stem_only_answer_variants_retained=variants,
                  policy='Quarantine structural faults, explicit missing-image references and conflicting labels for identical normalized stem/option sets. Retain nonconflicting repeats and stem-only variants. Missing explanations alone do not quarantine.',
                  image_dependency_rule=IMAGE_PATTERN.pattern, placeholder_option_rule=PLACEHOLDER_PATTERN.pattern,
                  packs=packs)
    quarantine = dict(audit_date=DATE, schema_version=1, asset_fingerprint=corpus_fingerprint,
                      total_rows=len(rows), quarantined_total=len(reasons), structurally_eligible_total=len(rows)-len(reasons),
                      rows=[dict(id=qid, reasons=sorted(values)) for qid, values in sorted(reasons.items())],
                      eligible_pack_counts=dict(sorted(eligible_pack.items())))
    return report, quarantine

def write_json(path, value, check=False):
    content=json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True)+'\n'
    if check:
        if not path.exists() or path.read_text() != content: raise SystemExit(f'Stale audit output: {path.relative_to(ROOT)}')
    else: path.parent.mkdir(parents=True, exist_ok=True); path.write_text(content)

def self_test():
    assert normalized(' m² ') != normalized('m2'), 'Compatibility characters must remain distinct'
    assert normalized('e\u0301') == normalized('é'), 'NFC canonical equivalents must match'
    for stem in ['Which of the following ECG findings suggests hyperkalemia?', 'Which of the following X-ray should be advised?', 'A scatter diagram is drawn to study correlation', 'Safety pin appearance is shown by which bacteria?']:
        assert not IMAGE_PATTERN.search(stem), stem
    for stem in ['Identify the image below', 'The radiograph is shown below', 'What is shown in the figure?', 'Which diagnosis matches the given ECG?']:
        assert IMAGE_PATTERN.search(stem), stem
    for option in ['Na', 'Nil', 'Unknown', 'None of the above', 'Option 1 and 2', 'a']:
        assert not PLACEHOLDER_PATTERN.fullmatch(option), option
    for option in ['Option D', '?', 'Missing', '--']:
        assert PLACEHOLDER_PATTERN.fullmatch(option), option

def main():
    self_test()
    parser=argparse.ArgumentParser(); parser.add_argument('--check', action='store_true'); args=parser.parse_args()
    report, quarantine=audit()
    write_json(ROOT/'docs/PG_CORPUS_AUDIT_20261011.json',report,args.check)
    write_json(ROOT/'docs/PG_CORPUS_QUARANTINE_20261011.json',quarantine,args.check)
    print(json.dumps({k:report[k] for k in ['total_rows','packs_count','quarantine_unique_rows','structurally_eligible_rows','quarantine_by_exam','reason_counts']}))

if __name__=='__main__': main()
