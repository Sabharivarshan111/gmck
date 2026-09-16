/**
 * Smart parser and formatter for flashcard content.
 *
 * In imported medical decks (e.g., Marrow, Prepladder, NEET-PG, USMLE),
 * card templates frequently dump the question stem, multiple-choice options,
 * correct answer letter, reference, and explanation into unformatted text
 * or leave the image on the answer side while the question says "marked A in the image below".
 *
 * This module cleans and structures raw card content so that:
 * 1. Multiple-choice questions (MCQs) are parsed into interactive options (A, B, C, D).
 * 2. The question stem is cleanly isolated without spoiling the answer.
 * 3. Leaked answers, Q_IDs, references, and explanations are parsed for post-reveal display.
 * 4. Image clues ("in the image below", "identify this rhythm", etc.) promote the image
 *    to the front face so it is visible before answering.
 */

export interface McqOption {
  key: string;
  text: string;
}

export interface ParsedCardContent {
  isMcq: boolean;
  stem: string;
  options: McqOption[];
  correctOption?: string;
  explanation?: string;
  reference?: string;
  qId?: string;
  frontImages: string[];
  backImages: string[];
  cleanBack: string;
}

const OPTION_LINE_RE = /^\s*(?:\(([A-Ea-e])\)|\[([A-Ea-e])\]|([A-Ea-e])[\.\)\:\-]\s*)\s*(.*)/;
const SINGLE_LETTER_RE = /^\s*([A-Ea-e])\s*$/;
const ANSWER_KEY_RE = /^\s*(?:Ans(?:wer)?|Correct(?:\s+Option|\s+Answer)?|Key)\s*[:\-.]?\s*(?:\(([A-Ea-e])\)|\[([A-Ea-e])\]|([A-Ea-e]))(?:\b|\s|$)/i;
const QID_RE = /^\s*(?:Q_?ID|Question\s*ID|ID)\s*[:\-.]?\s*([A-Za-z0-9_\-]+)/i;
const REF_RE = /^\s*(?:Ref(?:erence)?|Source|Textbook)\s*[:\-.]?\s*(.+)/i;
const EXP_HEADER_RE = /^\s*(?:Explanation|Exp|Discussion|Rationale|Notes?)\s*[:\-.]?\s*(.*)/i;

const IMAGE_CLUE_RE = /\b(image|picture|diagram|photo|photomicrograph|shown|marked|below|figure|ecg|ekg|x-?ray|xray|scan|ct|mri|arrow|identify|histology|lesion)\b/i;

export function parseCardContent(params: {
  front: string;
  back?: string;
  frontImages?: string[];
  backImages?: string[];
  imageUrl?: string;
}): ParsedCardContent {
  const rawFront = (params.front ?? '').trim();
  const rawBack = (params.back ?? '').trim();

  const allFrontImages = Array.isArray(params.frontImages) ? [...params.frontImages] : [];
  const candidateBackImages: string[] = [];
  if (Array.isArray(params.backImages)) {
    params.backImages.forEach(img => {
      if (img && !candidateBackImages.includes(img)) candidateBackImages.push(img);
    });
  }
  if (params.imageUrl && !candidateBackImages.includes(params.imageUrl)) {
    candidateBackImages.push(params.imageUrl);
  }

  // Check if options exist in front or back
  const frontLines = rawFront.split(/\r?\n/);
  const backLines = rawBack.split(/\r?\n/);

  // Step 1: Scan front lines for options
  let firstOptionIdx = -1;
  let lastOptionIdx = -1;
  const parsedOptions: McqOption[] = [];

  for (let i = 0; i < frontLines.length; i++) {
    const line = frontLines[i];
    const match = OPTION_LINE_RE.exec(line);
    if (match) {
      const letter = (match[1] || match[2] || match[3] || '').toUpperCase();
      const text = (match[4] || '').trim();
      if (letter && text) {
        if (firstOptionIdx === -1) {
          firstOptionIdx = i;
        }
        lastOptionIdx = i;
        parsedOptions.push({ key: letter, text });
      }
    }
  }

  // Also check if options are formatted in backLines if none found in frontLines
  if (parsedOptions.length < 2) {
    let bFirst = -1;
    let bLast = -1;
    const bOptions: McqOption[] = [];
    for (let i = 0; i < backLines.length; i++) {
      const line = backLines[i];
      const match = OPTION_LINE_RE.exec(line);
      if (match) {
        const letter = (match[1] || match[2] || match[3] || '').toUpperCase();
        const text = (match[4] || '').trim();
        if (letter && text) {
          if (bFirst === -1) bFirst = i;
          bLast = i;
          bOptions.push({ key: letter, text });
        }
      }
    }
    if (bOptions.length >= 2) {
      // Options were in back
      parsedOptions.splice(0, parsedOptions.length, ...bOptions);
    }
  }

  const isMcq = parsedOptions.length >= 2;

  let stem = rawFront;
  let correctOption: string | undefined;
  let explanation: string | undefined;
  let reference: string | undefined;
  let qId: string | undefined;

  if (isMcq && firstOptionIdx !== -1) {
    // Stem is whatever precedes the first option
    stem = frontLines.slice(0, firstOptionIdx).join('\n').trim();

    // Post-options lines in front may contain leaked answer, Q_ID, Ref, Explanation
    const postOptionLines = frontLines.slice(lastOptionIdx + 1);
    const expLines: string[] = [];

    for (let i = 0; i < postOptionLines.length; i++) {
      const line = postOptionLines[i].trim();
      if (!line) continue;

      const singleLetterMatch = SINGLE_LETTER_RE.exec(line);
      const answerKeyMatch = ANSWER_KEY_RE.exec(line);
      const qidMatch = QID_RE.exec(line);
      const refMatch = REF_RE.exec(line);
      const expHeaderMatch = EXP_HEADER_RE.exec(line);

      if (!correctOption && (singleLetterMatch || answerKeyMatch)) {
        const match = singleLetterMatch || answerKeyMatch;
        const letter = (match![1] || match![2] || match![3] || '').toUpperCase();
        if (parsedOptions.some(o => o.key === letter)) {
          correctOption = letter;
          continue;
        }
      }

      if (qidMatch) {
        qId = qidMatch[1].trim();
        continue;
      }

      if (refMatch) {
        reference = refMatch[1].trim();
        continue;
      }

      if (expHeaderMatch) {
        if (expHeaderMatch[1].trim()) {
          expLines.push(expHeaderMatch[1].trim());
        }
        continue;
      }

      expLines.push(line);
    }

    if (expLines.length > 0) {
      explanation = expLines.join('\n').trim();
    }
  }

  // Also check backLines for correctOption, qId, reference, explanation
  const backExpLines: string[] = [];
  for (let i = 0; i < backLines.length; i++) {
    const line = backLines[i].trim();
    if (!line) continue;

    // Skip option lines if they were duplicated on back
    if (OPTION_LINE_RE.test(line)) continue;

    const singleLetterMatch = SINGLE_LETTER_RE.exec(line);
    const answerKeyMatch = ANSWER_KEY_RE.exec(line);
    const qidMatch = QID_RE.exec(line);
    const refMatch = REF_RE.exec(line);
    const expHeaderMatch = EXP_HEADER_RE.exec(line);

    if (!correctOption && (singleLetterMatch || answerKeyMatch)) {
      const match = singleLetterMatch || answerKeyMatch;
      const letter = (match![1] || match![2] || match![3] || '').toUpperCase();
      if (parsedOptions.some(o => o.key === letter)) {
        correctOption = letter;
        continue;
      }
    }

    if (!qId && qidMatch) {
      qId = qidMatch[1].trim();
      continue;
    }

    if (!reference && refMatch) {
      reference = refMatch[1].trim();
      continue;
    }

    if (expHeaderMatch) {
      if (expHeaderMatch[1].trim()) {
        backExpLines.push(expHeaderMatch[1].trim());
      }
      continue;
    }

    backExpLines.push(line);
  }

  if (backExpLines.length > 0) {
    const combinedBack = backExpLines.join('\n').trim();
    if (!explanation) {
      explanation = combinedBack;
    } else if (combinedBack && !explanation.includes(combinedBack)) {
      explanation = `${explanation}\n\n${combinedBack}`.trim();
    }
  }

  // Handle Non-MCQ answer leakage in front
  let cleanBack = rawBack;
  if (!isMcq) {
    // If front has leaked answer/explanation headers, strip them from front
    const frontParts = rawFront.split(/\n(?=(?:Ans(?:wer)?|Correct|Key|Explanation|Exp|Discussion)\s*[:\-])/i);
    if (frontParts.length > 1) {
      stem = frontParts[0].trim();
      const leaked = frontParts.slice(1).join('\n').trim();
      if (!cleanBack) {
        cleanBack = leaked;
      } else if (!cleanBack.includes(leaked)) {
        cleanBack = `${cleanBack}\n\n${leaked}`.trim();
      }
    }
  }

  // Image promotion: If no front image, but back has image and card references an image (or is an MCQ)
  const frontImages = [...allFrontImages];
  const backImages = [...candidateBackImages];

  if (frontImages.length === 0 && candidateBackImages.length > 0) {
    const textToCheck = `${stem} ${rawFront}`;
    const needsFrontImage = isMcq || IMAGE_CLUE_RE.test(textToCheck);
    if (needsFrontImage) {
      // Promote the first back image to the front!
      const promoted = candidateBackImages[0];
      frontImages.push(promoted);
    }
  }

  // Filter out any backImages that are already in frontImages to avoid redundancy
  const finalBackImages = backImages.filter(img => !frontImages.includes(img));

  return {
    isMcq,
    stem: stem || rawFront,
    options: parsedOptions,
    correctOption,
    explanation,
    reference,
    qId,
    frontImages,
    backImages: finalBackImages,
    cleanBack: cleanBack || explanation || '',
  };
}
