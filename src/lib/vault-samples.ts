import type { InstalledReader } from './neetPgInstall';

export const PG_SAMPLE_SIZE = 10;
/** A fixed sample per bank: changing searches, chapters or saved IDs never
 * rotates the allowance or exposes a different set of ten questions. */
export function samplePracticeBank(installed: InstalledReader): InstalledReader {
  const original = installed.reader;
  const records = original.search({ limit: PG_SAMPLE_SIZE }).records;
  const ids = records.map(row => row.id);
  const allowed = new Set(ids);
  const imageIds = new Set(records.flatMap(row => row.imageIds));
  return { file: installed.file, reader: {
    id: original.id + ':free-preview-v1', total: records.length,
    chapters: () => original.chapters().map(chapter => ({ ...chapter, count: records.filter(row => row.chapterId === chapter.id).length })).filter(chapter => chapter.count > 0),
    search: (filter = {}) => original.search({ ...filter, ids: filter.ids ? filter.ids.filter(id => allowed.has(id)) : ids }),
    image: id => imageIds.has(id) ? original.image(id) : undefined,
  } };
}
