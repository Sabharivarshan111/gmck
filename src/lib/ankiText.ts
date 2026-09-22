import {
  clozeOrdinals,
  htmlToText,
  revealCloze,
  type ApkgCard,
} from './apkgFormat';

/**
 * Anki's text importer is a delimited UTF-8 importer. "HTML support" means
 * HTML is allowed inside fields; a standalone .html document is not an Anki
 * deck format. This module mirrors that boundary so the browser and Android
 * app agree about the same file.
 *
 * Behaviour, not source code, is implemented from Anki's published importing
 * documentation. No Anki or AnkiDroid source is copied here.
 */

export interface ParsedAnkiText {
  deckName: string;
  cards: ApkgCard[];
  html: boolean;
  separator: string;
  missingMedia: string[];
  warnings: string[];
}

export class AnkiTextError extends Error {
  constructor(
    public readonly code:
      | 'empty'
      | 'separator'
      | 'columns'
      | 'standaloneHtml'
      | 'tooFewFields',
    message: string,
  ) {
    super(message);
    this.name = 'AnkiTextError';
  }
}

const SPECIAL_COLUMNS = new Set(['tags', 'deck', 'notetype', 'guid']);

function separatorFromHeader(value: string | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  const named: Record<string, string> = {
    comma: ',',
    semicolon: ';',
    tab: '\t',
    space: ' ',
    pipe: '|',
    colon: ':',
  };
  const namedValue = named[raw.toLowerCase()];
  if (namedValue) return namedValue;
  if (raw === '\\t') return '\t';
  // Anki also accepts a literal one-character separator.
  return [...raw][0] ?? null;
}

function separatorName(separator: string): string {
  if (separator === '\t') return 'tab';
  if (separator === ' ') return 'space';
  return separator;
}

function sourceDeckName(sourceName: string): string {
  const base = sourceName.replace(/^.*[\\/]/, '').replace(/\.(txt|csv|tsv)$/i, '').trim();
  return base || 'Imported text';
}

function parseHeader(text: string): {
  headers: Map<string, string>;
  body: string;
} {
  const clean = text.replace(/^\uFEFF/, '');
  const headers = new Map<string, string>();
  let at = 0;
  let sawHeader = false;

  while (at < clean.length) {
    const nextLf = clean.indexOf('\n', at);
    const end = nextLf >= 0 ? nextLf + 1 : clean.length;
    const segment = clean.slice(at, end);
    const line = segment.replace(/[\r\n]+$/, '');

    if (!line.trim() && !sawHeader) {
      at = end;
      continue;
    }
    if (!line.startsWith('#')) break;

    sawHeader = true;
    const colon = line.indexOf(':');
    if (colon > 1) {
      headers.set(line.slice(1, colon).trim().toLowerCase(), line.slice(colon + 1));
    }
    at = end;
  }

  return { headers, body: clean.slice(at) };
}

function countOutsideQuotes(line: string, separator: string): number {
  let quoted = false;
  let count = 0;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && ch === separator) {
      count += 1;
    }
  }
  return count;
}

function detectSeparator(body: string, sourceName: string): string {
  if (/\.tsv$/i.test(sourceName)) return '\t';
  if (/\.csv$/i.test(sourceName)) return ',';

  const first = body
    .split(/\r?\n/)
    .map(line => line.trimEnd())
    .find(line => line.trim().length > 0);
  if (!first) {
    throw new AnkiTextError('empty', 'This text export has no cards in it.');
  }

  const candidates = ['\t', ',', ';', '|', ':'];
  let best = '';
  let bestCount = 0;
  for (const candidate of candidates) {
    const count = countOutsideQuotes(first, candidate);
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  if (!best) {
    throw new AnkiTextError(
      'separator',
      'Could not find the field separator. Export as tab-separated text, CSV, or TSV.',
    );
  }
  return best;
}

/** RFC-4180 style rows, also accepting tabs/semicolons and quoted newlines. */
export function parseDelimited(text: string, separator: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    pushField();
    if (row.some(value => value.length > 0)) rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"' && field.length === 0) {
      quoted = true;
    } else if (ch === separator) {
      pushField();
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      pushRow();
    } else {
      field += ch;
    }
  }

  if (quoted) {
    // Be permissive like spreadsheet importers: a missing final quote should
    // not erase every preceding row. The accumulated field is still useful.
  }
  if (field.length > 0 || row.length > 0) pushRow();
  return rows;
}

function splitColumns(value: string | undefined, separator: string): string[] | null {
  if (!value) return null;
  const decoded = value.replace(/\\t/g, '\t');
  return parseDelimited(decoded, separator)[0]?.map(column => column.trim()) ?? null;
}

function boolHeader(value: string | undefined): boolean | null {
  if (value == null) return null;
  if (/^(true|1|yes)$/i.test(value.trim())) return true;
  if (/^(false|0|no)$/i.test(value.trim())) return false;
  return null;
}

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][^>]*>/i.test(value) || /&#?[a-z0-9]+;/i.test(value);
}

function flatten(
  raw: string,
  allowHtml: boolean,
  question: boolean,
  missingMedia: Set<string>,
): string {
  if (!allowHtml) return raw.replace(/\r\n?/g, '\n').trim();
  const flat = htmlToText(raw, { question });
  flat.images.forEach(name => missingMedia.add(name));
  flat.audio.forEach(name => missingMedia.add(name));
  return flat.text;
}

function rowTags(raw: string, defaults: string[]): string[] {
  return [...new Set([...defaults, ...raw.split(/\s+/).filter(Boolean)])];
}

function combineRaw(values: string[], allowHtml: boolean): string {
  const kept = values.filter(value => value.trim().length > 0);
  return kept.join(allowHtml ? '<br><br>' : '\n\n');
}

/**
 * Parse an Anki text export into the exact rendered-card shape the APKG path
 * already stores. Images/audio named by HTML are reported but deliberately not
 * attached: a .txt/.csv/.tsv contains references, not the media bytes. Use
 * .apkg/.colpkg when the deck must carry media.
 */
export function parseAnkiText(text: string, sourceName = 'deck.txt'): ParsedAnkiText {
  if (/\.html?$/i.test(sourceName)) {
    throw new AnkiTextError(
      'standaloneHtml',
      'Anki HTML import means HTML inside a .txt, .csv, or .tsv field; a standalone .html file is not an Anki deck. Export as text/CSV or as .apkg instead.',
    );
  }

  const { headers, body } = parseHeader(text);
  if (!body.trim()) {
    throw new AnkiTextError('empty', 'This text export has no cards in it.');
  }

  const separator =
    separatorFromHeader(headers.get('separator')) ?? detectSeparator(body, sourceName);
  const rows = parseDelimited(body, separator);
  if (rows.length === 0) {
    throw new AnkiTextError('empty', 'This text export has no cards in it.');
  }

  const columns = splitColumns(headers.get('columns'), separator);
  const maxFields = rows.reduce((max, row) => Math.max(max, row.length), 0);
  if (maxFields < 2 && !/cloze/i.test(headers.get('notetype') ?? '')) {
    throw new AnkiTextError(
      'tooFewFields',
      'A text deck needs at least two fields (front and back), unless it is a Cloze export.',
    );
  }

  const normalizedColumns = columns?.map(column => column.trim().toLowerCase()) ?? null;
  const specialIndex = (name: string): number =>
    normalizedColumns?.findIndex(column => column === name || column.startsWith(`${name}:`)) ?? -1;

  const tagsIndex = specialIndex('tags');
  const deckIndex = specialIndex('deck');
  const regularIndices = Array.from({ length: maxFields }, (_, index) => index).filter(index => {
    const column = normalizedColumns?.[index];
    return !column || !SPECIAL_COLUMNS.has(column.split(':')[0]);
  });

  const namedFront =
    normalizedColumns?.findIndex(column => /^(front|question|prompt)$/.test(column)) ?? -1;
  const namedBack =
    normalizedColumns?.findIndex(column => /^(back|answer|extra)$/.test(column)) ?? -1;
  const frontIndex = namedFront >= 0 ? namedFront : (regularIndices[0] ?? 0);
  const backIndex = namedBack >= 0 ? namedBack : (regularIndices[1] ?? -1);

  const headerHtml = boolHeader(headers.get('html'));
  const sample = rows.slice(0, 30).flat().join('\n');
  const allowHtml = headerHtml ?? looksLikeHtml(sample);
  const defaultDeck = (headers.get('deck') ?? '').trim() || sourceDeckName(sourceName);
  const defaultTags = (headers.get('tags') ?? '').split(/\s+/).filter(Boolean);
  const cloze = /cloze/i.test(headers.get('notetype') ?? '');
  const missingMedia = new Set<string>();
  const warnings: string[] = [];
  const cards: ApkgCard[] = [];

  rows.forEach((row, rowIndex) => {
    const rawFront = row[frontIndex] ?? '';
    const otherRegular = regularIndices.filter(index => index !== frontIndex && index !== backIndex);
    const rawBack =
      backIndex >= 0
        ? combineRaw([row[backIndex] ?? '', ...otherRegular.map(index => row[index] ?? '')], allowHtml)
        : combineRaw(otherRegular.map(index => row[index] ?? ''), allowHtml);
    const deck = (deckIndex >= 0 ? row[deckIndex] : '')?.trim() || defaultDeck;
    const tags = rowTags(tagsIndex >= 0 ? row[tagsIndex] ?? '' : '', defaultTags);

    const clozeNumbers = cloze ? clozeOrdinals(rawFront) : [];
    const ordinals = clozeNumbers.length > 0 ? clozeNumbers : [0];

    for (const ordinal of ordinals) {
      const qRaw = ordinal > 0 ? revealCloze(rawFront, ordinal, true) : rawFront;
      const revealed = ordinal > 0 ? revealCloze(rawFront, ordinal, false) : rawFront;
      const aRaw =
        ordinal > 0
          ? combineRaw([revealed, rawBack], allowHtml)
          : rawBack;

      const front = flatten(qRaw, allowHtml, true, missingMedia);
      const back = flatten(aRaw, allowHtml, false, missingMedia);
      if (!front) continue;

      cards.push({
        id: `text-${rowIndex + 1}${ordinal > 0 ? `-c${ordinal}` : ''}`,
        deck,
        front,
        back,
        tags,
        // Text exports can mention media but cannot contain the bytes. Keeping
        // these empty prevents a permanent broken-image placeholder.
        frontMedia: [],
        backMedia: [],
        audio: [],
      });
    }
  });

  if (cards.length === 0) {
    throw new AnkiTextError('empty', 'Nothing in this text export could be turned into a card.');
  }

  if (missingMedia.size > 0) {
    warnings.push(
      `${missingMedia.size} media reference${missingMedia.size === 1 ? '' : 's'} could not be copied because text exports do not contain media files. Use .apkg/.colpkg to bring pictures or audio.`,
    );
  }

  return {
    deckName: defaultDeck,
    cards,
    html: allowHtml,
    separator: separatorName(separator),
    missingMedia: [...missingMedia],
    warnings,
  };
}
