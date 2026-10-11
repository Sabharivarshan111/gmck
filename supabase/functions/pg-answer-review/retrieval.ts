/** PG-only retrieval: OCR page numbers are provenance, not printed-book page claims. */
export type Passage = { id: string; source_path: string; ocr_page: number | null;
  paragraph_id: string; text: string; passage_sha256: string };
const parts = (prefix: string, count: number) => Array.from({length: count}, (_, i) => `${prefix}_part${i + 1}.txt`);
const FILES: Record<string, string[]> = {
  community: ['community/sia_park_community_medicine.txt'],
  forensic: ['forensic/vision_forensic_medicine.txt'],
  pharmacology: ['pharmacology/tara_shanbhag_pharmacology.txt', 'pharmacology/kd_tripathi_classification.txt'],
  pathology: parts('pathology/ramadas_nayak_pathology', 4),
  microbiology: parts('microbiology/apurba_sastry_microbiology', 4),
  physiology: parts('physiology/sembulingam_physiology', 3),
  biochemistry: parts('biochemistry/vasudevan_biochemistry', 3),
  anatomy: [...parts('anatomy/vishram_singh_anatomy', 3), 'embryology/langmans_embryology_part1.txt'],
  medicine: parts('medicine/manipal_medicine', 3),
  obgyn: [...parts('obgyn/shaws_gynaecology', 2), ...parts('obgyn/dc_dutta_gynaecology', 2)],
  surgery: parts('surgery/manipal_surgery', 4),
  orthopaedics: parts('orthopaedics/maheshwari_orthopaedics', 2),
  paediatrics: parts('paediatrics/op_ghai_paediatrics', 3),
  ent: parts('ent/dhingra_ent', 2), ophthalmology: parts('ophthalmology/khurana_ophthalmology', 2),
};
export function subjectSources(subject: string): { paths: string[]; fallback: string | null } | null {
  const s = subject.toLowerCase();
  const fallback = /radiolog|psychiatr|dermatolog|anaesthe|anesthe/.test(s);
  if (fallback) return { paths: [...FILES.medicine, ...FILES.surgery, ...FILES.pharmacology],
    fallback: 'No dedicated specialty textbook is available; medicine, surgery and pharmacology are supplementary references only.' };
  const rules: [RegExp, string[]][] = [
    [/community|psm|preventive|social medicine/, ['community']], [/forensic|fmt|toxicolog/, ['forensic']],
    [/pharmac|drug/, ['pharmacology']], [/patholog/, ['pathology']],
    [/microbio|bacterio|virolog|mycolog|parasitolog|immunolog/, ['microbiology']],
    [/physiolog/, ['physiology']], [/biochem/, ['biochemistry']],
    [/anatom|embryo|histolog|osteolog/, ['anatomy']], [/obstetric|gynaec|gynec|obg/, ['obgyn']],
    [/orthopaed|orthoped/, ['orthopaedics', 'surgery']], [/surger|surgical/, ['surgery', 'orthopaedics']],
    [/paediatric|pediatric|child health|neonat/, ['paediatrics']], [/ophthalm|\beye\b/, ['ophthalmology']],
    [/\bent\b|otorhino|otolaryng|ear, nose/, ['ent']], [/medicine|medical/, ['medicine']],
  ];
  const rule = rules.find(([regex]) => regex.test(s));
  return rule ? {paths: rule[1].flatMap(key => FILES[key]), fallback: null} : null;
}
export async function sha256(text: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))))
    .map(v => v.toString(16).padStart(2, '0')).join('');
}
export async function parsePassages(text: string, source_path: string): Promise<Passage[]> {
  const result: Passage[] = [];
  let page: number | null = null;
  // Split before normalization; never replace and discard page markers.
  const blocks = text.split(/(=====\s*PAGE\s+\d+(?:\s*\/\s*\d+)?\s*=====)/gi);
  for (const block of blocks) {
    const marker = /^=====\s*PAGE\s+(\d+)(?:\s*\/\s*\d+)?\s*=====$/i.exec(block);
    if (marker) { page = Number(marker[1]); continue; }
    for (const raw of block.split(/\n\s*\n+/)) {
      const normalized = raw.replace(/\s+/g, ' ').trim();
      if (normalized.length < 60) continue;
      for (let offset = 0; offset < normalized.length; offset += 900) {
        const excerpt = normalized.slice(offset, offset + 900);
        const paragraph_id = `paragraph-${result.length + 1}`;
        const hash = await sha256(excerpt);
        result.push({id: `${source_path}#${paragraph_id}:${hash}`, source_path,
          ocr_page: page, paragraph_id, text: excerpt, passage_sha256: hash});
      }
    }
  }
  return result;
}
const STOP = new Set('the and for with from this that what which most least following patient patients correct incorrect answer options years year old'.split(' '));
const SHORT_CLINICAL = new Set(['no', 'mg', 'ml', 'dl', 'kg', 'mcg', 'ug', 'iu', 'mm', 'cm', 'ph', 'tb', 'ct', 'iv', 'im']);
export function clinicalTokens(text: string) {
  // Split 5mg and 5 mg identically, retain 5 vs 50 and decimals, and keep negation.
  // These tokens rank excerpts only; full, unaltered numeric/negation wording goes to the model.
  const raw = text.toLowerCase().replace(/[µμ]/g, 'u').match(/\d+(?:\.\d+)?|[a-z]+/g) || [];
  return [...new Set(raw.filter(t => /^\d/.test(t) ||
    (!STOP.has(t) && (t.length >= 3 || SHORT_CLINICAL.has(t)))))];
}
export function rankPassages(passages: Passage[], query: string, maxChars = 9500): Passage[] {
  const queryTokens = clinicalTokens(query);
  if (queryTokens.length < 2) return [];
  const ranked = passages.map(p => {
    const passageTokens = new Set(clinicalTokens(p.text));
    return {p, score: queryTokens.filter(t => passageTokens.has(t)).length};
  })
    .filter(x => x.score >= 2).sort((a, b) => b.score - a.score || a.p.id.localeCompare(b.p.id));
  let used = 0;
  return ranked.filter(({p}) => {
    const cost = p.text.length + p.id.length + 80;
    if (used + cost > maxChars) return false;
    used += cost; return true;
  }).slice(0, 12).map(({p}) => p);
}
export async function retrievePassages(paths: string[], query: string,
  loadText: (path: string) => Promise<string | null>) {
  const loaded = await Promise.all(paths.map(async path => {
    const text = await loadText(path);
    return text ? parsePassages(text, path) : [];
  }));
  return rankPassages(loaded.flat(), query);
}

