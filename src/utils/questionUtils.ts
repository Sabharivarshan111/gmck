
/**
 * Utility functions for processing question text
 */

/**
 * Generate a unique question ID from the question text
 */
export const generateQuestionId = (text: string) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `question-${Math.abs(hash)}`;
};

/**
 * Get the number of asterisks in a text
 */
export const getAsteriskCount = (text: string) => {
  const asteriskMatch = text.match(/\*+/);
  return asteriskMatch ? asteriskMatch[0].length : 0;
};

/**
 * Check if text contains an exam date
 */
export const hasExamDate = (text: string) => {
  const datePattern = /\((?:[^()]*?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^()]*?)\)/;
  return datePattern.test(text);
};

/**
 * Get the count of exam dates in a text
 */
export const getExamDateCount = (text: string) => {
  const datePattern = /\(((?:[^()]*?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^()]*?;)*(?:[^()]*?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^()]*?))\)/;
  const dateMatch = text.match(datePattern);
  
  if (dateMatch && dateMatch[1]) {
    const semicolonCount = (dateMatch[1].match(/;/g) || []).length;
    return semicolonCount + 1;
  }
  return 0;
};

/**
 * Check if text contains a page number
 */
export const hasPageNumber = (text: string) => {
  return text.includes("(Pg.No:");
};

/**
 * Clean question text by removing page numbers
 */
export const cleanQuestionText = (text: string) => {
  return text.replace(/\(Pg\.No: [^)]+\)/, '');
};

/**
 * Get the display number for the question badge
 */
export const getDisplayNumber = (question: string) => {
  const asteriskCount = getAsteriskCount(question);
  if (asteriskCount > 0) {
    return asteriskCount;
  }
  
  if (hasExamDate(question)) {
    return getExamDateCount(question);
  }
  
  return 1; // Default for regular questions
};
