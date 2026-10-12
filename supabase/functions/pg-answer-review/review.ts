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
  const visual = '(?:image|figure|diagram|picture|photograph|radiograph|x[- ]?ray|scan|ecg|tracing|micrograph)';
  const reference = new RegExp(`(?:shown|given|following|above|below|attached|this|that)\\s+(?:the\\s+)?${visual}|${visual}\\s+(?:shown|above|below)|(?:shown|seen)\\s+in\\s+(?:the\\s+)?${visual}|image[- ]based`, 'i');
  // An arrow/label is a reference to an absent visual even when "image" is omitted.
  const marker = /(?:marked|indicated|pointed|denoted|labelled|labeled)\s+(?:by|with|as)\s+(?:(?:the|an?|a|red|blue|black|white)\s+)*(?:arrow|asterisk|label)|(?:arrow|asterisk)\s+(?:marks|indicates|points|denotes)|(?:identify|name)\s+(?:the\s+)?labelled\s+(?:structure|part)/i;
  return input.image_required === true || reference.test(input.question) || marker.test(input.question);
}

// The model's instruction to paraphrase is not a data-exposure boundary. Check
// every retrieved passage, not just cited ones, before returning an explanation.
function reproducesPrivatePassage(explanation: string, passages: Passage[]): boolean {
  const words = (text: string) => text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const output = words(explanation);
  const covered = new Set<number>();
  for (const passage of passages) {
    const source = words(passage.text);
    const starts = new Map<string, number[]>();
    for (let j = 0; j < source.length; j++) {
      const indices = starts.get(source[j]) ?? [];
      indices.push(j); starts.set(source[j], indices);
    }
    for (let i = 0; i < output.length; i++) {
      for (const start of starts.get(output[i]) ?? []) {
        let length = 0;
        while (i + length < output.length && start + length < source.length &&
          output[i + length] === source[start + length]) length++;
        // Long runs are substantially copied; ordinary clinical phrases remain usable.
        if (length >= 16 && output.slice(i, i + length).join(' ').length >= 90) return true;
        if (length >= 8) for (let k = i; k < i + length; k++) covered.add(k);
      }
    }
  }
  // Also detect several copied fragments separated by model-written transitions.
  return covered.size >= 30 && covered.size / output.length >= 0.65;
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
    if (reproducesPrivatePassage(o.explanation, passages)) return null;
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

