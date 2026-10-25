#!/usr/bin/env python3
"""Inventory source/quality signals; never assert legal clearance from text scanning.

Outputs metadata only, not question stems, options or textbook explanations.
Dataset-level licence declarations and per-item provenance are separate evidence.
"""
import hashlib
import importlib.util
import json
from collections import Counter
from pathlib import Path
import re
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('pg_audit', ROOT / 'scripts/audit-pg-corpus.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)

EXAM = re.compile(r'\b(?:neet\s*[- ]?\s*pg|aipgmee|aiims|ini\s*[- ]?\s*cet|fmge|pgimer|jipmer|usmle)\b', re.I)
YEAR = re.compile(r'\b(?:19[89]\d|20[012]\d)\b')
BOOK = re.compile(r'\b(?:harrison|bailey\s*(?:and|&)\s*love|robbins|chaurasia|dhingra|ganong|guyton|kat[z]?ung|park[’\x27]?s|kd\s*tripathi|k\.?\s*d\.?\s*tripathi)\b', re.I)
COPYRIGHT = re.compile(r'(?:©|\bcopyright\b|\ball rights reserved\b)', re.I)


def signals(q):
    text = q['question'] + ' ' + q['explanation']
    result = []
    if EXAM.search(text):
        result.append('exam_name_marker')
    if YEAR.search(q['question']):
        result.append('year_like_number_in_stem')
    if BOOK.search(q['explanation']):
        result.append('named_textbook_reference_in_explanation')
    if COPYRIGHT.search(text):
        result.append('copyright_notice_marker')
    if audit.IMAGE_PATTERN.search(q['question']):
        result.append('missing_image_dependency')
    if not q['explanation'].strip():
        result.append('no_supplied_explanation')
    return result


def summarize(rows, withheld):
    counts = Counter()
    for q in rows:
        counts.update(signals(q))
    return {
        'records_scanned': len(rows),
        'signal_counts': dict(sorted(counts.items())),
        'structurally_quarantined_records': sum(q['id'] in withheld for q in rows),
        'dataset_split_labels': dict(sorted(Counter(q['exam'] for q in rows).items())),
        'individually_verified_exam_years': sum(q['year'] is not None for q in rows),
        'independently_medically_reviewed_answers': 0,
        'underlying_item_rights_chain_verified': 0,
        'ordered_id_sha256': hashlib.sha256('\n'.join(q['id'] for q in rows).encode()).hexdigest(),
    }


def main():
    rows, packs = audit.read_assets()
    quarantine = json.loads((ROOT / 'docs/PG_CORPUS_QUARANTINE_20261011.json').read_text())
    withheld = {q['id'] for q in quarantine['rows']}
    # Scan a reproducible 100,000-record subset as requested, plus the full bank.
    sample = sorted(rows, key=lambda q: q['id'])[:100000]
    assert len(sample) == 100000 and len({q['id'] for q in sample}) == 100000
    report = {
        'review_date': '2026-10-12',
        'scope': 'Automated source/provenance and existing structural-quarantine screening, not a legal or clinical opinion.',
        'dataset_permission_observed': {
            'maintainer_statement': 'A repository member states the team finalized MIT for the current dataset.',
            'statement_url': 'https://github.com/medmcqa/medmcqa/issues/2#issuecomment-1329300257',
            'publisher_license_url': 'https://github.com/medmcqa/medmcqa/blob/main/LICENSE.md',
            'mirror_declared_license': 'Apache-2.0',
            'mirror_url': 'https://huggingface.co/datasets/openlifescienceai/medmcqa',
            'commercial_reuse_of_covered_work_permitted_by_declared_licenses': True,
            'licensor_authority_over_every_underlying_item_independently_verified': False,
            'noninfringement_guarantee': False,
        },
        'requested_100000_subset': summarize(sample, withheld),
        'entire_collected_bank': summarize(rows, withheld),
        'packs_scanned': len(packs),
        'interpretation': [
            'A named textbook reference does not by itself prove copying or infringement.',
            'An exam name or a year-like number is a review signal, not verified question-year evidence.',
            'Absence of markers does not prove originality, permission, medical correctness or absence of exam confidentiality obligations.',
            'Zero verified item-level rights chains is an evidence gap, not a finding that every record is unlawful.',
            'Maintainer MIT clarification applies to the dataset; earlier descriptions treating MIT as code-only are incomplete.',
            'Licence notices, attribution and modification notices must be preserved when applicable; permission cannot be manufactured by paraphrasing.',
        ],
        'public_release_changed': False,
        'legal_or_criminal_immunity_guaranteed': False,
    }
    path = ROOT / 'docs/PG_100K_RELEASE_SCREEN_20261012.json'
    path.write_text(json.dumps(report, indent=2, sort_keys=True) + '\n')
    print(json.dumps({'subset': report['requested_100000_subset'], 'full_bank': report['entire_collected_bank']}, indent=2))


if __name__ == '__main__':
    main()
