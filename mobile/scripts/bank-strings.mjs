/**
 * Every double-quoted string in the question-bank source, read correctly.
 *
 * This exists because the obvious way is wrong, and wrong in a way that looks
 * like it works. Matching `/"((?:[^"\\]|\\.){N,})"/g` over the source seems
 * fine until a string shorter than N appears — `"Paper 1"` with N of 10. The
 * regex fails at that opening quote, the engine advances one character, and the
 * next quote it finds is that string's CLOSING quote. From then on quote parity
 * is inverted and every subsequent "match" is the *gap between* two strings:
 * `",\n            "`. Run over anatomy/paper1.ts it returned 245 matches, none
 * of which contained a question, while the file plainly holds hundreds.
 *
 * Importing the real module is the other obvious answer and it does not work
 * either: questionBankData.ts imports `./topics/pharmacology`, a directory, and
 * Node's ESM resolver refuses extensionless directory imports.
 *
 * So: scan. Find a quote, read to the next unescaped quote, emit, and resume
 * AFTER the closing quote. Parity cannot drift because the position is always
 * advanced past a complete string.
 */
import fs from 'node:fs';
import path from 'node:path';

/** Strings in one file, in order. */
export function stringsIn(source) {
  const out = [];
  let i = 0;
  while (i < source.length) {
    const open = source.indexOf('"', i);
    if (open === -1) break;
    let j = open + 1;
    let value = '';
    let closed = false;
    while (j < source.length) {
      const ch = source[j];
      if (ch === '\\') {
        value += source.slice(j, j + 2);
        j += 2;
        continue;
      }
      if (ch === '"') {
        closed = true;
        break;
      }
      value += ch;
      j += 1;
    }
    if (!closed) break;
    out.push(value);
    i = j + 1; // past the closing quote — this is what keeps parity
  }
  return out;
}

/** Looks like a question rather than a key, a name, or structural noise. */
export function isQuestion(text) {
  if (text.length < 12) return false;
  if (!/[a-z]/.test(text)) return false;
  // Keys are kebab-case with no spaces; questions have spaces.
  if (!/\s/.test(text)) return false;
  return true;
}

/** Every .ts file under a directory. */
export function tsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  let out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(tsFiles(full));
    else if (entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

/**
 * Every question in the bank, with the subject directory it came from.
 *
 * Only strings that appear inside a `questions:` array count — a `name:` value
 * reads like a question ("GENERAL ANATOMY" does not, but "Paper 1" and some
 * chapter names do) and would otherwise be counted as one.
 */
export function bankQuestions(topicsDir) {
  const rows = [];
  for (const file of tsFiles(topicsDir)) {
    const source = fs.readFileSync(file, 'utf8');
    const subject = path.relative(topicsDir, file).split(path.sep)[0].replace(/\.ts$/, '');
    for (const block of source.split(/questions:\s*\[/).slice(1)) {
      for (const text of stringsIn(block.slice(0, arrayEnd(block)))) {
        if (isQuestion(text)) rows.push({ text, subject, file });
      }
    }
  }
  return rows;
}

/**
 * Where a `questions: [` array closes.
 *
 * `indexOf(']')` is the obvious answer and it truncates the array: Community
 * Medicine questions carry a page marker in brackets — "Post exposure
 * prophylaxis in prevention of human rabies ** (Aug 2016) [Pg:325]" — so the
 * first `]` in the block is inside a string, and everything after that question
 * was silently dropped. Bracket depth has to be counted outside strings only.
 */
function arrayEnd(block) {
  let depth = 0;
  let i = 0;
  while (i < block.length) {
    const ch = block[i];
    if (ch === '"') {
      // Skip the whole string, escapes included.
      i += 1;
      while (i < block.length) {
        if (block[i] === '\\') {
          i += 2;
          continue;
        }
        if (block[i] === '"') break;
        i += 1;
      }
      i += 1;
      continue;
    }
    if (ch === '[') depth += 1;
    if (ch === ']') {
      if (depth === 0) return i;
      depth -= 1;
    }
    i += 1;
  }
  return block.length;
}
