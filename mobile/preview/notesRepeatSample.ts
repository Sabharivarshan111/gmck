import type { NotesContent } from '@/lib/handwrittenNotes';
// Regression fixture copied from the owner's repeated AF headings. Preview only.
const items = [
  {label:'Etiology',description:'Rheumatic heart disease, hypertension, hyperthyroidism, ischemic heart disease, alcohol binge.'},
  {label:'Pathophysiology',description:'Multiple re-entrant wavelets in the atria leading to chaotic electrical activity and loss of atrial kick.'},
  {label:'Clinical Features',description:'Variable intensity S1, pulse deficit, and signs of underlying cardiac failure.'},
  {label:'Clinical Features',description:'Palpitations, fatigue, irregular pulse, syncope, or thromboembolic events (stroke).'},
];
export const REPEATED_AF_NOTES: NotesContent = {
  sections:[{type:'bullets',title:'Atrial Fibrillation (AF)',payload:{items:[...items,...items,...items]}}],
};
