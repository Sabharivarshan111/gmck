#!/usr/bin/env python3
"""Match existing bundled items to private historical extracts; write metadata only.
This is source-text corroboration, never an official exam attribution or answer audit.
Only NFC, case folding and whitespace normalization are allowed. No fuzzy matching.
"""
import argparse
import bisect
from collections import Counter, defaultdict
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import unicodedata
from urllib.parse import urlparse, unquote

ROOT = Path(__file__).resolve().parents[1]
NORMALIZATION = 'Unicode NFC, casefold, collapse whitespace; punctuation and medical numbers retained'


def norm(value):
    return ' '.join(unicodedata.normalize('NFC', value).casefold().split())


def normalized_map(raw):
    parts, offsets, raw_offsets, length = [], [], [], 0
    for m in re.finditer(r'\S+', raw):
        t = unicodedata.normalize('NFC', m.group()).casefold()
        offsets.append(length); raw_offsets.append(m.start()); parts.append(t)
        length += len(t) + 1
    return ' '.join(parts), offsets, raw_offsets


def canonical_sources(args):
    records = []
    if args.neet_manifest:
        for s in json.loads(Path(args.neet_manifest).read_text()):
            records.append(dict(id=s['id'], url=s['url'], sha256=s['sha256'],
                exam=s['exam_claimed'], year=s['year_claimed'], session=s.get('session'),
                attribution='unofficial_publisher_claim', rights_status=s.get('reuse_status', 'unresolved'),
                text_path=s['text_path'], pages_path=s.get('pages_json_path'),
                identity_warning=('PDF calls pre-NEET AIPG years NEET PG and gives inconsistent exam instructions; historical identity unresolved' if s['id'] in ('collegedunia-aipg-2010', 'collegedunia-aipg-2011') else None)))
    if args.fmge_manifest:
        for s in json.loads(Path(args.fmge_manifest).read_text())['sources']:
            records.append(dict(id=s['id'], url=s['url'], sha256=s['sha256'],
                exam=s['claimedExam'], year=s['claimedYear'], session=s.get('claimedSessionMonth'),
                attribution=s['attributionStatus'], attribution_basis=s['attributionBasis'],
                rights_status=s.get('reuseStatus', 'unresolved'), text_path=s['localTextPath'],
                identity_warning=('Canadian context; FMGE identity not established' if s['id'].endswith('8684') else None)))
    if args.ini_manifest:
        directory = Path(args.ini_manifest).parent
        for s in json.loads(Path(args.ini_manifest).read_text()):
            filename = unquote(Path(urlparse(s['url']).path).name)
            text_path = directory / (filename + '.txt')
            if not text_path.exists():
                continue
            year = re.search(r'20\d\d', filename)
            year = int(year.group()) if year else None
            session = 'May' if 'May' in filename or year == 2025 else 'November' if year == 2020 else None
            records.append(dict(id='inicet-' + s['sha256'][:12], url=s['url'], sha256=s['sha256'],
                exam='INI-CET', year=year, session=session, attribution='unofficial_publisher_claim',
                rights_status='unresolved', text_path=str(text_path)))
    return records


def match_source(source, index, stem_groups):
    if source.get('pages_path'):
        raw = '\f'.join(p['text'] for p in json.loads(Path(source['pages_path']).read_text()))
    else:
        raw = Path(source['text_path']).read_text()
    normalized, offsets, raw_offsets = normalized_map(raw)
    tokens = normalized.split(' ')
    matches = []
    occurrences = Counter()
    candidates = []
    for i in range(max(0, len(tokens) - 4)):
        prefix = ' '.join(tokens[i:i+5])
        for stem in index.get(prefix, ()):
            start = offsets[i]
            if not normalized.startswith(stem, start):
                continue
            end = start + len(stem)
            if end < len(normalized) and not normalized[end].isspace():
                continue
            raw_start = raw_offsets[i]
            marker = re.search(r'(?:^|\n)\s*(?P<q>Q(?:uestion)?\.?\s*)?(?P<num>\d{1,3})\s*[.)]\s*$', raw[max(0, raw_start-70):raw_start], re.I)
            number = int(marker['num']) if marker else None
            raw_end_index = bisect.bisect_left(offsets, end)
            raw_end = raw_offsets[raw_end_index] if raw_end_index < len(raw_offsets) else len(raw)
            region = raw[raw_end:raw_end+3000]
            bounded = False
            if marker:
                next_pattern = (r'^\s*Q(?:uestion)?\.?\s*\d{1,3}\s*[.)]' if marker['q'] else rf'^\s*(?:Q\.?\s*)?{number+1}\s*[.)]')
                next_marker = re.search(next_pattern, region, re.I | re.M)
                if next_marker:
                    region = region[:next_marker.start()]; bounded = True
                elif len(raw) - raw_end <= 3000:
                    bounded = True
            # Stop at a supplied key so corroboration cannot come from an explanation.
            key_marker = re.search(r'^\s*(?:Ans(?:wer)?\b|Correct\s+(?:answer|option)\b|Solution\b)', region, re.I | re.M)
            if key_marker:
                region = region[:key_marker.start()]; bounded = True
            window = norm(region)
            for row in stem_groups[stem]:
                options = [norm(o) for o in row['options']]
                found = []
                nontrivial = all(len(o) >= 4 and not re.fullmatch(r'[\W\d_]+', o) for o in options)
                for o in options:
                    m = re.search(r'(?<!\w)' + re.escape(o) + r'(?!\w)', window) if o else None
                    found.append((m.start(), m.end()) if m else None)
                intervals = sorted(x for x in found if x)
                separate = len(intervals) == 4 and all(a[1] <= b[0] for a, b in zip(intervals, intervals[1:]))
                corroborated = nontrivial and separate and bounded and number is not None
                reasons = []
                if len(stem_groups[stem]) != 1: reasons.append('stem_not_unique_in_bank')
                if not nontrivial: reasons.append('option_text_too_short_for_conservative_match')
                if not separate: reasons.append('all_four_distinct_options_not_corroborated')
                if not bounded: reasons.append('question_option_region_not_reliably_bounded')
                if number is None: reasons.append('source_question_number_not_identified')
                meta = dict(bank_id=row['id'], bank_pack=row['pack'], source_id=source['id'],
                    source_url=source['url'], source_sha256=source['sha256'], source_page=raw[:raw_start].count('\f')+1,
                    source_question_number=number, claimed_exam=source['exam'], claimed_year=source['year'],
                    claimed_session=source['session'], attribution_status=source['attribution'],
                    rights_status=source['rights_status'], evidence_confidence='candidate_stem_only',
                    matched_option_count=len(intervals), reasons=reasons,
                    stem_sha256=hashlib.sha256(stem.encode()).hexdigest(), official_attribution_verified=False,
                    answer_verified=False, eligible_for_automatic_year_label=False)
                if source.get('identity_warning'):
                    meta['identity_warning'] = source['identity_warning']; reasons.append('source_exam_identity_unestablished')
                candidates.append((stem, corroborated, meta))
            occurrences[stem] += 1
    for stem, corroborated, meta in candidates:
        if occurrences[stem] != 1:
            meta['reasons'].append('stem_repeats_in_source')
        if corroborated and not meta['reasons']:
            meta['evidence_confidence'] = 'exact_stem_and_four_options_unofficial_claim'
            matches.append(meta)
    return matches, [m for _, _, m in candidates if m['evidence_confidence'] == 'candidate_stem_only']


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--neet-manifest'); ap.add_argument('--fmge-manifest'); ap.add_argument('--ini-manifest')
    ap.add_argument('--output-prefix', default=str(ROOT / 'docs/PG_HISTORICAL_MATCH_AUDIT_20261012'))
    args = ap.parse_args()
    spec = importlib.util.spec_from_file_location('corpus_audit', ROOT / 'scripts/audit-pg-corpus.py')
    audit = importlib.util.module_from_spec(spec); spec.loader.exec_module(audit)
    rows, packs = audit.read_assets()
    index, groups = defaultdict(set), defaultdict(list)
    excluded = 0
    for row in rows:
        stem = norm(row['question'])
        if len(stem) < 60 and len(stem.split()) < 12:
            excluded += 1; continue
        groups[stem].append(row)
        index[' '.join(stem.split()[:5])].add(stem)
    sources = canonical_sources(args)
    full, partial = [], []
    source_stats = []
    for source in sources:
        a, b = match_source(source, index, groups); full.extend(a); partial.extend(b)
        source_stats.append(dict(source_id=source['id'], source_url=source['url'], source_sha256=source['sha256'],
            claimed_exam=source['exam'], claimed_year=source['year'], claimed_session=source['session'],
            rights_status=source['rights_status'], source_text_sha256=hashlib.sha256(Path(source['text_path']).read_bytes()).hexdigest(),
            identity_warning=source.get('identity_warning'), full_matches=len(a), candidates=len(b)))
        print(source['id'], len(a), len(b), flush=True)
    claims_per_bank = defaultdict(set)
    for m in full:
        claims_per_bank[m['bank_id']].add((m['claimed_exam'], m['claimed_year'], m['claimed_session']))
    report = dict(audit_date='2026-10-12', schema_version=1, normalization=NORMALIZATION,
        bank_rows=len(rows), packs=len(packs), excluded_short_stems=excluded, source_files=len(sources),
        exact_stem_and_four_option_matches=len(full), matched_unique_bank_items=len({m['bank_id'] for m in full}),
        bank_items_with_multiple_claims=sum(len(v) > 1 for v in claims_per_bank.values()),
        stem_only_or_other_unresolved_candidates=len(partial), official_exam_attributions_verified=0,
        answers_medically_verified=0, automatic_year_labels_added=0, sources=source_stats,
        corroborated_unofficial_claims=full, unresolved_candidates=partial,
        limitations=['Only downloaded extracts listed here were checked; this is not all-year coverage.',
            'PDF text extraction errors and punctuation differences cause false negatives; no fuzzy matches are accepted.',
            'A textual match establishes an unofficial publisher claim, not an actual exam appearance or correct answer.',
            'Reuse rights are unresolved. No new source questions or source PDF/text are bundled.',
            'Multiple source/year claims are preserved. Existing bank keys and question years are unchanged.'])
    prefix = Path(args.output_prefix)
    prefix.with_suffix('.json').write_text(json.dumps(report, indent=2, ensure_ascii=False)+'\n')
    table = '\n'.join(f"| {s['source_id']} | {s['claimed_year']} | {s['full_matches']} | {s['candidates']} |" for s in source_stats)
    md = f"""# Historical source matching audit — 12 October 2026

Checked {len(rows):,} existing bank rows against {len(sources)} downloaded source extracts.
Found **{len(full)}** exact stem plus four-option matches across **{report['matched_unique_bank_items']}** unique bank items.
**{report['bank_items_with_multiple_claims']}** bank items have multiple distinct exam/year/session claims, all retained.
Found **{len(partial)}** unresolved stem candidates. These candidates must never be published as proven year attribution.

No official exam appearances or medical answers were verified. No automatic question-year labels were added.
Matching preserves NFC characters, punctuation and numerical values, ignoring only case and whitespace.
A stem needs 12 words or 60 characters, must be unique in both bank and source, and four nontrivial options
must occur separately after the stem inside a bounded question/options region. Source page and question label
are recorded. All matching results retain unofficial publisher attribution and unresolved reuse status.

| Source | Claimed year | Four-option matches | Unresolved candidates |
|---|---:|---:|---:|
{table}

The companion JSON contains metadata only: bank IDs, source URLs, PDF hashes, page/question labels,
and publisher year/session claims. It contains no source question text. Multiple year claims are retained.

""" + '\n'.join('- ' + l for l in report['limitations']) + '\n'
    prefix.with_suffix('.md').write_text(md)
    print(json.dumps({k:report[k] for k in ['source_files','exact_stem_and_four_option_matches','matched_unique_bank_items','stem_only_or_other_unresolved_candidates']}))

if __name__ == '__main__':
    main()
