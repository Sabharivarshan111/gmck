import { supabase } from './supabase';

export const OPUS55_DATASET =
  'nisten/opus5-5-doctor-patient-conversations-all-human-diseases';

export interface ClinicalDatasetCaseSummary {
  id: string;
  name: string;
  aliases: string[];
  icd10: string | null;
  bodySystems: string[];
  description: string | null;
  prevalence: string | null;
  sourceDataset: string;
}

export interface ClinicalDialogueTurn {
  role: 'system' | 'user' | 'assistant' | string;
  content: string;
}

export interface ClinicalDatasetReference {
  pmid?: string;
  title?: string;
  year?: string | number;
}

export interface ClinicalDatasetCaseDetail extends ClinicalDatasetCaseSummary {
  patientScenario: string;
  executiveSummary: string | null;
  conversation: ClinicalDialogueTurn[];
  commonMistakes: unknown[];
  differentialDiagnosis: unknown[];
  relatedDiseases: unknown[];
  pubmedRefs: ClinicalDatasetReference[];
  sourceLicense: string;
}

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const asObjectArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const normalizeSummary = (row: Record<string, unknown>): ClinicalDatasetCaseSummary => ({
  id: String(row.id ?? ''),
  name: String(row.canonical_name ?? ''),
  aliases: asStringArray(row.aliases),
  icd10: typeof row.icd10 === 'string' && row.icd10.trim() ? row.icd10 : null,
  bodySystems: asStringArray(row.body_systems),
  description: typeof row.description === 'string' ? row.description : null,
  prevalence: typeof row.prevalence === 'string' ? row.prevalence : null,
  sourceDataset: String(row.source_dataset ?? OPUS55_DATASET),
});

export async function searchApprovedClinicalCases(
  query = '',
  bodySystem?: string,
  limit = 40,
): Promise<ClinicalDatasetCaseSummary[]> {
  const safeLimit = Math.max(1, Math.min(80, Math.round(limit)));
  const needle = query
    .replace(/[%_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .slice(0, 80);

  let request = supabase
    .from('clinical_dataset_cases')
    .select(
      'id,source_dataset,canonical_name,aliases,icd10,body_systems,description,prevalence',
    )
    .eq('review_status', 'approved')
    .order('canonical_name', { ascending: true })
    .limit(safeLimit);

  if (needle) {
    request = request.ilike('search_text', `%${needle}%`);
  }
  if (bodySystem?.trim()) {
    request = request.contains('body_systems', [bodySystem.trim()]);
  }

  const { data, error } = await request;
  if (error) {
    throw new Error(error.message);
  }
  return ((data ?? []) as Record<string, unknown>[]).map(normalizeSummary);
}

export async function fetchApprovedClinicalCase(
  id: string,
): Promise<ClinicalDatasetCaseDetail | null> {
  const { data, error } = await supabase
    .from('clinical_dataset_cases')
    .select(
      [
        'id',
        'source_dataset',
        'canonical_name',
        'aliases',
        'icd10',
        'body_systems',
        'description',
        'prevalence',
        'patient_scenario',
        'executive_summary',
        'conversation',
        'common_mistakes',
        'differential_diagnosis',
        'related_diseases',
        'pubmed_refs',
        'source_license',
      ].join(','),
    )
    .eq('id', id)
    .eq('review_status', 'approved')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }

  const row = data as Record<string, unknown>;
  const dialogue = asObjectArray(row.conversation)
    .map(item => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const turn = item as Record<string, unknown>;
      if (typeof turn.role !== 'string' || typeof turn.content !== 'string') {
        return null;
      }
      return { role: turn.role, content: turn.content } satisfies ClinicalDialogueTurn;
    })
    .filter((item): item is ClinicalDialogueTurn => item != null);

  const refs = asObjectArray(row.pubmed_refs)
    .map(item => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const ref = item as Record<string, unknown>;
      return {
        ...(typeof ref.pmid === 'string' ? { pmid: ref.pmid } : null),
        ...(typeof ref.title === 'string' ? { title: ref.title } : null),
        ...(typeof ref.year === 'string' || typeof ref.year === 'number'
          ? { year: ref.year }
          : null),
      } satisfies ClinicalDatasetReference;
    })
    .filter((item): item is ClinicalDatasetReference => item != null);

  return {
    ...normalizeSummary(row),
    patientScenario: String(row.patient_scenario ?? ''),
    executiveSummary:
      typeof row.executive_summary === 'string' ? row.executive_summary : null,
    conversation: dialogue,
    commonMistakes: asObjectArray(row.common_mistakes),
    differentialDiagnosis: asObjectArray(row.differential_diagnosis),
    relatedDiseases: asObjectArray(row.related_diseases),
    pubmedRefs: refs,
    sourceLicense: String(row.source_license ?? ''),
  };
}
