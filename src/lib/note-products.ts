export type NotesPlan = 'notes_fmspm' | 'notes_pharmac';
export const NOTE_PRODUCTS: Record<NotesPlan, { title: string; detail: string; url: string }> = {
  notes_fmspm: { title: 'FM + SPM revision notes', detail: '3rd year · lifetime access', url: 'https://drive.google.com/drive/folders/1TbgyHOkdrfYd8-4nl1jTup3LSkkimzvv' },
  notes_pharmac: { title: 'Pharmacology full-subject notes', detail: '2nd year · lifetime access', url: 'https://drive.google.com/drive/folders/1HuMtYbqTnWO-bQ-uGNlrrdCPp6pA4pch' },
};
