export class NotesDepthError extends Error {}

/** A length safeguard, not a medical accuracy or coverage verdict. */
export function notesWordCount(content: unknown): number {
  const text: string[] = [];
  const seen = new Set<string>();
  const visit = (value: unknown) => {
    if (typeof value === 'string') {
      for (const paragraph of value.split(/\n\s*\n/)) {
        const normalized = paragraph.replace(/\s+/g, ' ').trim();
        if (normalized && !seen.has(normalized)) { seen.add(normalized); text.push(normalized); }
      }
    }
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  };
  if (content && typeof content === 'object') visit((content as { sections?: unknown }).sections);
  return text.join(' ').trim().split(/\s+/).filter(Boolean).length;
}
export async function ensureLongEssay<T extends { sections: unknown[] }>(initial: T, expand: (words: number) => Promise<T | null>): Promise<T> {
  const words = notesWordCount(initial);
  if (words >= 900) return initial;
  const expanded = await expand(words);
  if (!expanded || !Array.isArray(expanded.sections) || notesWordCount(expanded) < 900) {
    throw new NotesDepthError(`The generated essay was too brief (${words} words before expansion, ${notesWordCount(expanded)} after). Your saved answer was kept. Please retry the full essay.`);
  }
  return expanded;
}

/** Focus the repair on content depth rather than repeating the chapter prompt. */
export function essayExpansionPrompt(question: string, subject: string, reference: string, previous: unknown, words: number): string {
  return `Write a supplement that adds missing depth to this MBBS long essay. Do not rewrite the original answer.
SUBJECT: ${subject}
QUESTION (answer every part): ${question}
The existing answer has ${words} distinct words and will be kept in full. Return ONLY additional sections providing 700–1100 words of new explanation; the application will append them to the original.

CONTENT BUDGET: write 700–1100 words of additional medical explanation across 6–8 substantive sections. Each major section needs approximately 100–150 words. For bullet sections, write 4–6 developed items with 25–40 words in each description. Do not substitute a list of headings or one-line facts for an answer. Do not repeat the original definition, classification, revision points or lists of findings. Concentrate on explanations and decisions missing from the original.

Develop the mechanism behind findings, interpretation of investigations, differential diagnosis, decision points in treatment, contraindications and special situations, complications, prevention and follow-up where relevant. Explain why and when, not just names of tests or drugs. Avoid repeating the same clinical fact in multiple sections or from the previous answer. Give each supplementary section a specific, distinct title. Do not invent a dose, cutoff or guideline when unsure.

Return exactly the normal notes JSON schema with sections and payloads containing ONLY the supplement. No markdown or separate summary. Before returning, review whether each requested part has a developed answer and whether the complete content meets the word budget.

REFERENCE (use relevant facts; this excerpt is not a limit on answer depth):
${reference || 'No excerpt available; use standard MBBS knowledge.'}

EXISTING ANSWER — RETAINED BY THE APP; DO NOT REPEAT:
${JSON.stringify(previous)}`;
}

export function appendEssaySupplement<T extends { sections: unknown[] }>(initial: T, supplement: { sections: unknown[] } | null): T | null {
  if (!supplement || !Array.isArray(supplement.sections) || supplement.sections.length === 0) return null;
  return { ...initial, sections: [...initial.sections, ...supplement.sections] };
}
