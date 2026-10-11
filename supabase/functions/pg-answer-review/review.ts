import { subjectSources, type Passage } from './retrieval.ts';
export type Answer = 'A' | 'B' | 'C' | 'D';
export type Input = { exam: string; exam_year: number | null; subject: string; question: string;
  options: string[]; source_url?: string; supplied_answer?: Answer; question_id?: string; image_required?: boolean };
const EXAMS = new Set(['NEET_PG', 'INI_CET', 'FMGE', 'AIPGMEE', 'AIIMS_PG', 'GENERAL_MEDICAL']);
const ANSWERS = new Set(['A', 'B', 'C', 'D']);
export function validate(x: unknown): Input | null {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return null;
  const v = x as Record<string, unknown>;
  if (!EXAMS.has(String(v.exam)) || (v.exam_year !== null &&
    (!Number.isInteger(v.exam_year) || Number(v.exam_year) < 1991 || Number(v.exam_year) > 2026))) return null;
  if (typeof v.subject !== 'string' || v.subject.trim().length < 3 || v.subject.length > 100 || !subjectSources(v.subject)) return null;
  if (typeof v.question !== 'string' || v.question.trim().length < 12 || v.question.length > 1300) return null;
  if (!Array.isArray(v.options) || v.options.length !== 4 || !v.options.every(o => typeof o === 'string' && o.trim() && o.length <= 450)) return null;
  if (new Set(v.options.map(o => String(o).trim().toLowerCase())).size !== 4) return null;
  if (v.source_url != null) {
    if (typeof v.source_url !== 'string' || v.source_url.length > 600) return null;
    try { const u = new URL(v.source_url); if (u.protocol !== 'https:' || u.username || u.password) return null; } catch { return null; }
  }
  if (v.supplied_answer != null && !ANSWERS.has(String(v.supplied_answer))) return null;
  if (v.question_id != null && (typeof v.question_id !== 'string' || !/^[\w:.-]{1,180}$/.test(v.question_id))) return null;
  if (v.image_required != null && typeof v.image_required !== 'boolean') return null;
  // Unknown image payloads must never be silently discarded by a text-only review.
  const imageAttached = ['image', 'image_url', 'image_data', 'images', 'image_base64']
    .some(key => v[key] != null);
  return {...v, image_required: v.image_required === true || imageAttached} as Input;
}
export function requiresImage(input: Input) {
  // This endpoint deliberately does not accept images; require a separate multimodal review.
  return input.image_required === true || /(?:shown|given|following|above|below|attached)\s+(?:image|figure|diagram|picture|photograph|radiograph|x[- ]?ray|scan|ecg)|(?:image|figure|diagram|picture|photograph|radiograph|x[- ]?ray|scan|ecg)\s+(?:shown|above|below)|(?:shown|seen)\s+in\s+(?:the\s+)?(?:image|figure|diagram|picture|photograph|radiograph|x[- ]?ray|scan|ecg)|image[- ]based/i.test(input.question);
}
export function parseCandidate(raw: string, passages: Passage[]) {
  try {
    const o = JSON.parse(raw);
    if (!o || Array.isArray(o) || ![...ANSWERS, 'UNRESOLVED'].includes(o.answer) ||
      !['limited', 'insufficient'].includes(o.confidence) || typeof o.explanation !== 'string' ||
      o.explanation.length < 15 || o.explanation.length > 1200 ||
      !Array.isArray(o.evidence_ids) || o.evidence_ids.length > 12 ||
      !o.evidence_ids.every((id: unknown) => typeof id === 'string' && passages.some(p => p.id === id)) ||
      typeof o.conflicting_evidence !== 'boolean' || typeof o.options_distinguished !== 'boolean') return null;
    if (o.confidence === 'insufficient' || o.conflicting_evidence || !o.options_distinguished || !o.evidence_ids.length) {
      o.answer = 'UNRESOLVED'; o.confidence = 'insufficient';
    }
    if (o.answer === 'UNRESOLVED') o.confidence = 'insufficient';
    return o as {answer: Answer | 'UNRESOLVED'; confidence: string; explanation: string;
      evidence_ids: string[]; conflicting_evidence: boolean; options_distinguished: boolean};
  } catch { return null; }
}
export function answerComparison(input: Input, answer: Answer | 'UNRESOLVED') {
  return !input.supplied_answer ? 'not_supplied' : answer === 'UNRESOLVED' ? 'unresolved' :
    input.supplied_answer === answer ? 'agrees_provisionally' : 'disagrees_requires_review';
}

