"""Deterministic structural gates; these do not establish medical correctness."""
import re
import unicodedata
from collections import Counter, defaultdict

OPTION_KEYS = ('opa', 'opb', 'opc', 'opd')
# Kept in sync with scripts/audit-pg-corpus.py; tests pin the policy.
IMAGE_DEPENDENCE = re.compile(
    r'\b(?:shown|depicted|illustrated)\s+(?:below|above|here|in\s+(?:the\s+)?(?:image|figure|diagram|picture|photograph|slide|radiograph|x[- ]?ray|ecg|ct|illustration))\b'
    r'|\b(?:following|given|this|the)\s+(?:image|figure|picture|photograph|illustration)\b'
    r'|\bgiven\s+(?:diagram|slide|radiograph|x[- ]?ray|ecg)\b'
    r'|\bfollowing\s+(?:diagram|slide|radiograph|x[- ]?ray|ecg)\b(?!\s+(?:should|findings?|features?|changes?|signs?|tests?|types?|parameters?|leads?|abnormalit(?:y|ies)))'
    r'|\b(?:see|refer\s+to)\s+(?:the\s+)?(?:image|figure|diagram|picture)\b'
    r'|\b(?:image|figure|diagram|picture|photograph|slide|radiograph)\s+(?:below|above|shown)\b', re.I)
PLACEHOLDER_PATTERN = re.compile(r'^(?:option\s*[abcd]|[?]+|\.{2,}|[-–—]+|not\s+available|not\s+given|missing)\s*[.)]?$', re.I)

def normalized(value):
    return ' '.join(unicodedata.normalize('NFC', str(value or '')).casefold().split())

def structural_reasons(row):
    reasons = []
    question = row.get('question')
    if not isinstance(question, str) or len(question.strip()) < 9:
        reasons.append('missing_or_short_question')
    options = [row.get(k) for k in OPTION_KEYS]
    norms = [normalized(v) for v in options]
    if any(not isinstance(v, str) or not n or PLACEHOLDER_PATTERN.fullmatch(v.strip()) for v, n in zip(options, norms)):
        reasons.append('missing_or_placeholder_option')
    if len(set(norms)) != 4:
        reasons.append('duplicate_options')
    if row.get('answer') not in ('A', 'B', 'C', 'D'):
        reasons.append('invalid_answer_label')
    if not str(row.get('id') or '').strip():
        reasons.append('missing_id')
    # Current offline pack format carries no image assets. A URL alone is not
    # evidence that the figure is bundled or renderable offline.
    if IMAGE_DEPENDENCE.search(str(question or '')):
        reasons.append('image_required_without_supported_asset')
    if row.get('answer_format', 'single_label') != 'single_label':
        reasons.append('unsupported_answer_format')
    return reasons

def conflict_ids(rows):
    groups = defaultdict(list)
    for row in rows:
        if structural_reasons(row):
            continue
        key = (row.get('exam'), row.get('exam_year'), row.get('exam_session'),
               normalized(row['question']), tuple(sorted(normalized(row[k]) for k in OPTION_KEYS)))
        answer_text = normalized(row[OPTION_KEYS['ABCD'.index(row['answer'])]])
        groups[key].append((str(row['id']), answer_text))
    return {qid for group in groups.values() if len({text for _, text in group}) > 1 for qid, _ in group}

def preflight(rows):
    """Inspect the whole split so both sides of an answer conflict are held."""
    conflicts = conflict_ids(rows)
    duplicates = {qid for qid, count in Counter(str(r.get('id') or '') for r in rows).items() if count > 1}
    usable, excluded = [], []
    counts = Counter()
    for row in rows:
        reasons = structural_reasons(row)
        qid = str(row.get('id') or '')
        if qid in conflicts:
            reasons.append('conflicting_answer_text')
        if qid in duplicates:
            reasons.append('duplicate_id')
        if reasons:
            excluded.append({'id': qid or 'unknown', 'reasons': reasons})
            counts.update(reasons)
        else:
            usable.append(row)
    report = {'raw': len(rows), 'usable': len(usable), 'invalid': len(excluded),
              'invalid_reasons': dict(sorted(counts.items())), 'excluded_rows': excluded}
    assert report['raw'] == report['usable'] + report['invalid']
    return usable, report
