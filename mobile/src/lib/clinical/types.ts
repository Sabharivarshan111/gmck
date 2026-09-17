/**
 * The shape of a clinical proforma.
 *
 * Extracted from `clinicalProformas.ts` so the per-subject case files can
 * import it without importing the array — a module that both declares the type
 * and aggregates every case would be a cycle the moment a case file needed the
 * type. `clinicalProformas.ts` re-exports all three names, so nothing that
 * imported them from there had to change.
 */

export interface ProformaSection {
  title: string;
  items: {
    label: string;
    description: string;
    normal?: string;
    clinicalSign?: string;
    checklist?: string[];
  }[];
}

export interface VivaQuestion {
  question: string;
  answer: string;
  examinerTip?: string;
}

export type ProformaSystem =
  | 'General Medicine'
  | 'General Surgery'
  | 'Pediatrics'
  | 'Orthopaedics'
  | 'Obstetrics & Gynaecology'
  | 'ENT'
  | 'Ophthalmology';

/**
 * Long case or short case — the distinction surgery finals are actually
 * organised by, and the one the uploaded case sheets are split along.
 *
 * It is not cosmetic. A long case is a full clerking: history, general and
 * systemic examination, differential, investigations, management, and forty
 * minutes to present it. A short case is a swelling or an ulcer and about five
 * minutes: you inspect, palpate, give the findings and commit to a diagnosis,
 * and there is no history at all unless you are asked for one. A student who
 * revises a short case as though it were a long one revises the wrong thing.
 *
 * `undefined` means the proforma is a system master sheet rather than a case,
 * which is what the original twelve are.
 */
export type CaseType = 'long' | 'short';

export interface ClinicalProforma {
  id: string;
  title: string;
  system: ProformaSystem;
  department: string;
  summary: string;
  examPearl: string;
  caseType?: CaseType;
  /** Which uploaded case sheet this was built from, for traceability. */
  source?: string;
  diagramPath?: string;
  diagramTitle?: string;
  sections: ProformaSection[];
  vivaQuestions: VivaQuestion[];
}
