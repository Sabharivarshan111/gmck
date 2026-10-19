/** Pure offline reader: shared by native Android and the production browser app. */
export type OfflineChapter = {
  id: string; year: string; subject: string; path: string[]; names: string[]; name: string;
};
export type OfflineMcq = {
  id: string; chapterId: string; question: string; options: string[];
  answerIndex: number; sourceAnswer: string; explanation: string;
  requiresImage: boolean; imageIds: string[];
};
export type OfflineBank = {
  schema: 1; id: string; chapters: OfflineChapter[]; records: OfflineMcq[];
  images: Record<string, { dataUri: string; alt: string }>;
};
const YEARS = new Set(['first-year', 'second-year', 'third-year', 'final-year']);
const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Reject incomplete imports before replacing an installed bank. No network fallback. */
export function validateOfflineBank(value: unknown): asserts value is OfflineBank {
  if (!object(value) || value.schema !== 1 || !nonempty(value.id) || !Array.isArray(value.chapters) || !Array.isArray(value.records) || !object(value.images)) {
    throw new Error('Invalid offline bank structure.');
  }
  const chapterIds = new Set<string>();
  for (const chapter of value.chapters) {
    if (!object(chapter) || !nonempty(chapter.id) || chapterIds.has(chapter.id) || !YEARS.has(String(chapter.year)) || !nonempty(chapter.subject) || !nonempty(chapter.name) || !Array.isArray(chapter.path) || chapter.path.length < 2 || !chapter.path.every(nonempty) || !Array.isArray(chapter.names) || chapter.names.length !== chapter.path.length || !chapter.names.every(nonempty) || chapter.path[0] !== chapter.subject || chapter.id !== `${chapter.year}/${chapter.path.join('/')}`) {
      throw new Error('Invalid or duplicate offline chapter.');
    }
    chapterIds.add(chapter.id);
  }
  for (const [id, image] of Object.entries(value.images)) {
    if (!nonempty(id) || !object(image) || !nonempty(image.alt) || typeof image.dataUri !== 'string' || !/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image.dataUri)) {
      throw new Error(`Image ${id} must be embedded, with alternative text.`);
    }
  }
  const ids = new Set<string>();
  if (!value.records.length) throw new Error('An offline question bank cannot be empty.');
  for (const row of value.records) {
    if (!object(row) || !nonempty(row.id) || ids.has(row.id) || !chapterIds.has(String(row.chapterId)) || !nonempty(row.question) || !Array.isArray(row.options) || row.options.length < 2 || row.options.length > 8 || !row.options.every(nonempty) || new Set(row.options).size !== row.options.length || !Number.isInteger(row.answerIndex) || Number(row.answerIndex) < 0 || Number(row.answerIndex) >= row.options.length || !nonempty(row.sourceAnswer) || !nonempty(row.explanation) || typeof row.requiresImage !== 'boolean' || !Array.isArray(row.imageIds) || !row.imageIds.every(nonempty) || new Set(row.imageIds).size !== row.imageIds.length) {
      throw new Error(`Incomplete or invalid offline question: ${String(object(row) ? row.id : '')}`);
    }
    if (row.requiresImage && row.imageIds.length === 0) throw new Error(`Required image missing: ${row.id}`);
    const label = String(row.sourceAnswer).trim();
    const labelledIndex = /^[A-Ha-h]$/.test(label) ? label.toUpperCase().charCodeAt(0) - 65 : /^[1-8]$/.test(label) ? Number(label) - 1 : row.options.indexOf(label);
    if (labelledIndex !== row.answerIndex) throw new Error(`Source answer and option index disagree: ${row.id}`);
    if (!row.imageIds.every(id => Object.hasOwn(value.images as object, id))) throw new Error(`Unresolved image reference: ${row.id}`);
    ids.add(row.id);
  }
}

export function createOfflineReader(input: unknown) {
  validateOfflineBank(input);
  // Own the installed snapshot: later changes to an import object cannot corrupt it.
  const bank = JSON.parse(JSON.stringify(input)) as OfflineBank;
  const chapters = new Map(bank.chapters.map(chapter => [chapter.id, chapter]));
  const indexed = bank.records.map(row => ({ row, text: `${row.question} ${row.options.join(' ')} ${row.explanation} ${chapters.get(row.chapterId)!.names.join(' ')}`.toLocaleLowerCase() }));
  return {
    id: bank.id,
    total: bank.records.length,
    chapters: () => bank.chapters.map(chapter => ({ ...chapter, path: [...chapter.path], names: [...chapter.names], count: bank.records.filter(row => row.chapterId === chapter.id).length })),
    search: (filter: { year?: string; subject?: string; chapterId?: string; query?: string; offset?: number; limit?: number } = {}) => {
      const terms = (filter.query ?? '').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
      const matches = indexed.filter(({ row, text }) => {
        const chapter = chapters.get(row.chapterId)!;
        return (!filter.year || chapter.year === filter.year) && (!filter.subject || chapter.subject === filter.subject) && (!filter.chapterId || row.chapterId === filter.chapterId) && terms.every(term => text.includes(term));
      });
      const offset = Number.isFinite(filter.offset) ? Math.max(0, Math.trunc(filter.offset!)) : 0;
      const limit = Number.isFinite(filter.limit) ? Math.max(1, Math.min(40, Math.trunc(filter.limit!))) : 40;
      return { total: matches.length, records: matches.slice(offset, offset + limit).map(({ row }) => ({ ...row, options: [...row.options], imageIds: [...row.imageIds] })) };
    },
    image: (id: string) => Object.hasOwn(bank.images, id) ? { ...bank.images[id] } : undefined,
  };
}
