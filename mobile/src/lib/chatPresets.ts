export type ChatLanguage = 'English' | 'Tamil' | 'Tanglish';
export const CHAT_LANGUAGES: ChatLanguage[] = ['English', 'Tamil', 'Tanglish'];
export const LANGUAGE_LABELS: Record<ChatLanguage, string> = { English: 'English', Tamil: 'தமிழ்', Tanglish: 'Tanglish' };
export function initialChatLanguage(prompt: string): ChatLanguage {
  if (/\b(?:tanglish|tunglish)\b|tamil.*(?:english|roman).*letters/i.test(prompt)) return 'Tanglish';
  return /\bTamil\b|[\u0B80-\u0BFF]/u.test(prompt) ? 'Tamil' : 'English';
}
export function languagePrompt(question: string, language: ChatLanguage): string {
  const instruction = language === 'Tanglish'
    ? 'Tanglish: natural spoken Tamil using English letters only, retaining English medical terms'
    : language === 'Tamil' ? 'Tamil script, retaining English medical terms' : 'English';
  return `Explain the same question in ${instruction}. Preserve the scope and level of detail of the supplied answer, verify medical facts against study sources, and do not introduce a new topic.\n\n${question.slice(0, 3000)}`;
}
