// Textbook grounding for handwritten notes.
// All OCR text bundles live in the private `textbooks` Supabase storage bucket
// (free 1 GB tier) so the edge function bundle stays small. Large books are
// stored as ~1.2 MB `_partN.txt` chunks and concatenated at load time.
//
//   3rd year: community/…sia_park…            → Community Medicine
//             forensic/…vision…               → Forensic Medicine
//   2nd year: pharmacology/kd_tripathi…       → CLASSIFICATION ONLY
//             pharmacology/tara_shanbhag…     → everything else
//             pathology/ramadas_nayak…        → Pathology
//             microbiology/apurba_sastry…     → Microbiology
//   1st year: physiology/sembulingam…         → Physiology
//             biochemistry/vasudevan…         → Biochemistry
//             anatomy/vishram_singh…          → Anatomy (gross)
//             embryology/langmans…            → Anatomy — embryology questions

const STOPWORDS = new Set([
  "the","and","for","with","from","that","this","into","which","what","when",
  "where","their","them","they","have","has","had","are","was","were","been",
  "being","its","it's","itself","about","also","any","all","some","such",
  "not","no","yes","of","in","on","by","to","or","a","an","is","be","as",
  "at","if","so","we","you","your","our","us","i","me","my","he","she",
  "his","her","him","between","among","above","below","under","over","after",
  "before","during","because","while","than","then","these","those","other",
  "define","describe","discuss","write","short","note","essay","brief",
  "types","type","give","explain","classification","classify","enumerate",
  "add","mention","causes","clinical","features","management","treatment",
  "diagnosis","prevention","control","measures","factors","aspects","note.",
  "notes","only","various","how","why",
]);

function splitParagraphs(text: string, minLen = 60): string[] {
  if (!text) return [];
  const cleaned = text.replace(/===== PAGE \d+ ?\/? ?\d* =====/g, "\n\n");
  const rawParas = cleaned.split(/\n\s*\n+/);
  const out: string[] = [];
  for (const p of rawParas) {
    const t = p.replace(/\s+/g, " ").trim();
    if (t.length < minLen) continue;
    if (t.length <= 900) {
      out.push(t);
    } else {
      for (let i = 0; i < t.length; i += 800) out.push(t.slice(i, i + 900));
    }
  }
  return out;
}

export type BookKey =
  | "community" | "forensic" | "pharmacology"
  | "pathology" | "microbiology"
  | "physiology" | "biochemistry" | "anatomy"
  | "medicine" | "obgyn" | "surgortho" | "paediatrics" | "ent" | "ophthalmology";

/** Storage chunk paths per book (concatenated in order). */
const BOOK_FILES: Record<string, string[]> = {
  community: ["community/sia_park_community_medicine.txt"],
  forensic: ["forensic/vision_forensic_medicine.txt"],
  pathology: [1, 2, 3, 4].map((n) => `pathology/ramadas_nayak_pathology_part${n}.txt`),
  microbiology: [1, 2, 3, 4].map((n) => `microbiology/apurba_sastry_microbiology_part${n}.txt`),
  physiology: [1, 2, 3].map((n) => `physiology/sembulingam_physiology_part${n}.txt`),
  biochemistry: [1, 2, 3].map((n) => `biochemistry/vasudevan_biochemistry_part${n}.txt`),
  anatomy: [1, 2, 3].map((n) => `anatomy/vishram_singh_anatomy_part${n}.txt`),
  embryology: ["embryology/langmans_embryology_part1.txt"],
  // Final year
  medicine: [1, 2, 3].map((n) => `medicine/manipal_medicine_part${n}.txt`),
  gynaecology: [1, 2].map((n) => `obgyn/shaws_gynaecology_part${n}.txt`),
  obstetrics: [1, 2].map((n) => `obgyn/dc_dutta_gynaecology_part${n}.txt`),
  surgery: [1, 2, 3, 4].map((n) => `surgery/manipal_surgery_part${n}.txt`),
  orthopaedics: [1, 2].map((n) => `orthopaedics/maheshwari_orthopaedics_part${n}.txt`),
  paediatrics: [1, 2, 3].map((n) => `paediatrics/op_ghai_paediatrics_part${n}.txt`),
  ent: [1, 2].map((n) => `ent/dhingra_ent_part${n}.txt`),
  ophthalmology: [1, 2].map((n) => `ophthalmology/khurana_ophthalmology_part${n}.txt`),
};

/** Human-readable citation label used in the prompt block. */
export const BOOK_LABELS: Record<string, string> = {
  community: "Sia's Park Community Medicine (PSM)",
  forensic: "Vision Forensic Medicine & Toxicology 4th ed.",
  pathology: "Ramadas Nayak — Exam Preparatory Manual, Pathology 2nd ed.",
  microbiology: "Apurba S Sastry — Essentials of Medical Microbiology 4th ed.",
  physiology: "K Sembulingam — Essentials of Medical Physiology 6th ed.",
  biochemistry: "DM Vasudevan — Textbook of Biochemistry 7th ed.",
  anatomy: "Vishram Singh — Textbook of Anatomy",
  embryology: "Langman's Medical Embryology 13th ed.",
  pharmacology: "KD Tripathi + Tara V Shanbhag",
  medicine: "Manipal Prep Manual of Medicine 3rd ed.",
  obgyn: "Shaw's Textbook of Gynaecology 17e (gynaecology) + DC Dutta's Textbook of Obstetrics (obstetrics)",
  gynaecology: "Shaw's Textbook of Gynaecology 17e",
  obstetrics: "DC Dutta's Textbook of Obstetrics",

  surgortho: "Manipal Manual of Surgery 5e + Maheshwari Essential Orthopaedics 5e",
  surgery: "Manipal Manual of Surgery 5th ed.",
  orthopaedics: "J Maheshwari — Essential Orthopaedics 5th ed.",
  paediatrics: "OP Ghai — Essential Pediatrics 8th ed.",
  ent: "PL Dhingra — Diseases of Ear, Nose and Throat 7th ed.",
  ophthalmology: "AK Khurana — Comprehensive Ophthalmology 6th ed.",
};

export function pickBookKey(subject: string): BookKey | null {
  const s = (subject || "").toLowerCase();
  if (s.includes("community") || s.includes("psm") || s.includes("preventive") || s.includes("social medicine")) return "community";
  if (s.includes("forensic") || s.includes("fmt") || s.includes("toxicology")) return "forensic";
  if (s.includes("pharmac") || s.includes("drug")) return "pharmacology";
  if (s.includes("patholog")) return "pathology";
  if (s.includes("microbio") || s.includes("bacterio") || s.includes("virolog") || s.includes("mycolog") || s.includes("parasitolog") || s.includes("immunolog")) return "microbiology";
  if (s.includes("physiolog")) return "physiology";
  if (s.includes("biochem")) return "biochemistry";
  if (s.includes("anatom") || s.includes("embryo") || s.includes("histolog") || s.includes("osteolog")) return "anatomy";
  // Final year
  if (s.includes("obstetric") || s.includes("gynaec") || s.includes("gynec") || s.includes("obg")) return "obgyn";
  if (s.includes("surger") || s.includes("surgical") || s.includes("orthopaed") || s.includes("orthoped")) return "surgortho";
  if (s.includes("paediatric") || s.includes("pediatric") || s.includes("child health") || s.includes("neonat")) return "paediatrics";
  if (s.includes("ophthalm") || s.includes("eye")) return "ophthalmology";
  if (/\bent\b/.test(s) || s.includes("otorhino") || s.includes("otolaryng") || s.includes("ear, nose")) return "ent";
  if (s.includes("medicine") || s.includes("medical")) return "medicine";
  return null;
}


// ---------------------------------------------------------------------------
// Pharmacology (2nd year)
// ---------------------------------------------------------------------------
const PHARM_FILES = {
  classification: "pharmacology/kd_tripathi_classification.txt",
  general: "pharmacology/tara_shanbhag_pharmacology.txt",
} as const;

const remoteCache: Record<string, string[]> = {};

async function loadStorageBook(path: string, minParaLen: number): Promise<string[]> {
  if (remoteCache[path]) return remoteCache[path];
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/storage/v1/object/textbooks/${path}`, {
      headers: { Authorization: `Bearer ${key}`, apikey: key },
    });
    if (!res.ok) {
      console.error(`[textbook] storage fetch failed ${path} → ${res.status}`);
      return [];
    }
    const text = await res.text();
    const paras = splitParagraphs(text, minParaLen);
    remoteCache[path] = paras;
    console.log(`[textbook] loaded ${path} paragraphs=${paras.length}`);
    return paras;
  } catch (e) {
    console.error(`[textbook] storage error ${path}:`, e);
    return [];
  }
}

/** Load every chunk of a book and return the merged paragraph list. */
async function loadBook(bookKey: string, minParaLen = 60): Promise<string[]> {
  const files = BOOK_FILES[bookKey];
  if (!files) return [];
  const parts = await Promise.all(files.map((f) => loadStorageBook(f, minParaLen)));
  return parts.flat();
}

function rankParagraphs(paragraphs: string[], subtopicName: string, questions: string[], maxChars: number): string {
  if (paragraphs.length === 0) return "";
  const subtopicTokens = tokenize(subtopicName);
  const questionTokens = questions.map((q) => tokenize(q));
  const queryTokens = new Set<string>([...subtopicTokens, ...questionTokens.flat()]);
  if (queryTokens.size === 0) return "";
  const boostTokens = new Set<string>([
    ...subtopicTokens,
    ...questionTokens.flatMap((t) => t.slice(0, 4)),
  ]);
  const nameLower = subtopicName.toLowerCase();
  const scored: Array<{ idx: number; score: number }> = [];
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i].toLowerCase();
    let score = 0;
    for (const tok of queryTokens) if (p.includes(tok)) score += 1;
    if (score === 0) continue;
    for (const tok of boostTokens) if (p.includes(tok)) score += 1;
    if (nameLower.length >= 5 && p.includes(nameLower)) score += 6;
    scored.push({ idx: i, score });
  }
  scored.sort((a, b) => b.score - a.score || a.idx - b.idx);
  const picked: string[] = [];
  let used = 0;
  for (const s of scored) {
    const para = paragraphs[s.idx];
    if (used + para.length + 4 > maxChars) continue;
    picked.push(para);
    used += para.length + 4;
    if (picked.length >= 90) break;
  }
  return picked.join("\n\n");
}

export type PharmContext = { classification: string; general: string };

/**
 * Pharmacology grounding.
 * - `classification` comes STRICTLY from KD Tripathi's Pharmacological
 *   Classification of Drugs (with doses/preparations).
 * - `general` (mechanisms, uses, adverse effects, answers, points) comes from
 *   Tara V Shanbhag — never used for classification lists.
 */
export async function buildPharmContext(
  subtopicName: string,
  questions: string[],
  maxClassChars = 9000,
  maxGeneralChars = 14000,
): Promise<PharmContext> {
  const [classPara, generalPara] = await Promise.all([
    loadStorageBook(PHARM_FILES.classification, 30),
    loadStorageBook(PHARM_FILES.general, 60),
  ]);
  const classification = rankParagraphs(classPara, subtopicName, questions, maxClassChars);
  const general = rankParagraphs(generalPara, subtopicName, questions, maxGeneralChars);
  console.log(`[textbook] pharm subtopic="${subtopicName}" classChars=${classification.length} generalChars=${general.length}`);
  return { classification, general };
}

function tokenize(s: string): string[] {
  // Allow 3-char tokens so terms like "air", "TB", "HIV", "ORS", "DOT", "PSM"
  // (frequent MBBS keywords) survive filtering.
  return (s.toLowerCase().match(/[a-z][a-z0-9\-]{2,}/g) || [])
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

const EMBRYO_HINTS = [
  "embryo", "embryolog", "development of", "developmental", "germ layer",
  "gastrulation", "neurulation", "notochord", "somite", "pharyngeal arch",
  "branchial", "placenta", "amnion", "chorion", "yolk sac", "allantois",
  "fetal circulation", "foetal circulation", "teratogen", "congenital anomal",
  "cleft", "meckel", "gametogenesis", "spermatogenesis", "oogenesis",
  "fertilization", "fertilisation", "blastocyst", "implantation", "twinning",
  "derivatives of", "primitive streak", "urogenital sinus", "aortic arch",
];

function looksEmbryological(subtopicName: string, questions: string[]): boolean {
  const hay = `${subtopicName} ${questions.join(" ")}`.toLowerCase();
  return EMBRYO_HINTS.some((h) => hay.includes(h));
}

const OBSTETRIC_HINTS = [
  "pregnan", "labour", "labor", "antenatal", "prenatal", "puerper", "postpartum",
  "eclamp", "placenta", "foetal", "fetal", "obstetric", "partograph", "breech",
  "caesarean", "cesarean", "lactation", "twin pregnancy", "multiple pregnancy",
  "abortion", "ectopic", "hydatidiform", "molar pregnancy", "gestation",
  "amniotic", "liquor", "pph", "haemorrhage in pregnancy", "rh isoimmun",
  "oxytoc", "episiotom", "cephalopelvic", "malpresentation", "hyperemesis",
  "cervical incompetence", "preterm", "iugr", "apgar", "newborn resuscitation",
];

const ORTHO_HINTS = [
  "fracture", "dislocat", "orthopaed", "orthoped", "bone", "joint", "spine",
  "vertebra", "osteomyeliti", "osteoarthrit", "osteoporo", "osteosarcoma",
  "tendon", "ligament", "meniscus", "acl", "traction", "plaster", "cast",
  "splint", "amputation stump", "club foot", "ctev", "scoliosis", "kyphosis",
  "spondyl", "sciatica", "disc prolapse", "carpal tunnel", "nerve injury",
  "compartment syndrome", "avascular necrosis", "tuberculosis of", "pott",
  "arthritis", "arthroplast", "sprain", "shoulder", "hip", "knee", "wrist",
];

function looksObstetric(subtopicName: string, questions: string[]): boolean {
  const hay = `${subtopicName} ${questions.join(" ")}`.toLowerCase();
  return OBSTETRIC_HINTS.some((h) => hay.includes(h));
}

function looksOrthopaedic(subtopicName: string, questions: string[]): boolean {
  const hay = `${subtopicName} ${questions.join(" ")}`.toLowerCase();
  return ORTHO_HINTS.some((h) => hay.includes(h));
}


/**
 * Generic textbook grounding. Returns a labelled reference block
 * (may combine two books, e.g. Anatomy + Langman's Embryology).
 */
export async function buildTextbookContext(
  subject: string,
  subtopicName: string,
  questions: string[],
  maxChars = 18000,
): Promise<string> {
  const key = pickBookKey(subject);
  if (!key) return "";
  if (key === "pharmacology") {
    const { classification, general } = await buildPharmContext(
      subtopicName, questions,
      Math.round(maxChars * 0.4), Math.round(maxChars * 0.6),
    );
    const blocks: string[] = [];
    if (classification) blocks.push(`[KD TRIPATHI — CLASSIFICATION ONLY]\n${classification}`);
    if (general) blocks.push(`[TARA V SHANBHAG — CONCEPTS, MECHANISMS, USES, ADVERSE EFFECTS]\n${general}`);
    return blocks.join("\n\n");
  }

  // Anatomy: gross anatomy from Vishram Singh, embryology from Langman's.
  if (key === "anatomy") {
    const embryo = looksEmbryological(subtopicName, questions);
    const anatShare = embryo ? 0.3 : 0.75;
    const [anatPara, embryoPara] = await Promise.all([
      loadBook("anatomy", 60),
      loadBook("embryology", 60),
    ]);
    const anatText = rankParagraphs(anatPara, subtopicName, questions, Math.round(maxChars * anatShare));
    const embryoText = rankParagraphs(embryoPara, subtopicName, questions, Math.round(maxChars * (1 - anatShare)));
    const blocks: string[] = [];
    if (embryo && embryoText) blocks.push(`[LANGMAN'S MEDICAL EMBRYOLOGY 13e — PRIMARY source for this embryology question]\n${embryoText}`);
    if (anatText) blocks.push(`[VISHRAM SINGH TEXTBOOK OF ANATOMY — gross anatomy, relations, applied anatomy]\n${anatText}`);
    if (!embryo && embryoText) blocks.push(`[LANGMAN'S MEDICAL EMBRYOLOGY 13e — use only for development/embryology parts]\n${embryoText}`);
    console.log(`[textbook] anatomy subtopic="${subtopicName}" embryoMode=${embryo} anatChars=${anatText.length} embryoChars=${embryoText.length}`);
    return blocks.join("\n\n");
  }

  // Obstetrics & Gynaecology share one subject but NOT one book.
  if (key === "obgyn") {
    const obs = looksObstetric(subtopicName, questions);
    const [shaw, dutta] = await Promise.all([loadBook("gynaecology", 60), loadBook("obstetrics", 60)]);
    const duttaShare = obs ? 0.85 : 0.15;
    const shawText = rankParagraphs(shaw, subtopicName, questions, Math.round(maxChars * (1 - duttaShare)));
    const duttaText = rankParagraphs(dutta, subtopicName, questions, Math.round(maxChars * duttaShare));
    const blocks: string[] = [];
    if (obs) {
      if (duttaText) blocks.push(`[DC DUTTA'S TEXTBOOK OF OBSTETRICS — STRICTLY the source for obstetrics questions]\n${duttaText}`);
      if (shawText) blocks.push(`[SHAW'S TEXTBOOK OF GYNAECOLOGY 17e — supplementary only]\n${shawText}`);
    } else {
      if (shawText) blocks.push(`[SHAW'S TEXTBOOK OF GYNAECOLOGY 17e — STRICTLY the source for gynaecology questions]\n${shawText}`);
      if (duttaText) blocks.push(`[DC DUTTA'S TEXTBOOK OF OBSTETRICS — supplementary only]\n${duttaText}`);
    }

    console.log(`[textbook] obgyn subtopic="${subtopicName}" obstetricMode=${obs} shawChars=${shawText.length} duttaChars=${duttaText.length}`);
    return blocks.join("\n\n");
  }

  // General Surgery and Orthopaedics: Manipal for surgery, Maheshwari for ortho.
  if (key === "surgortho") {
    const ortho = looksOrthopaedic(subtopicName, questions);
    const [surg, orth] = await Promise.all([loadBook("surgery", 60), loadBook("orthopaedics", 60)]);
    const orthoShare = ortho ? 0.7 : 0.2;
    const surgText = rankParagraphs(surg, subtopicName, questions, Math.round(maxChars * (1 - orthoShare)));
    const orthText = rankParagraphs(orth, subtopicName, questions, Math.round(maxChars * orthoShare));
    const blocks: string[] = [];
    if (ortho) {
      if (orthText) blocks.push(`[MAHESHWARI ESSENTIAL ORTHOPAEDICS 5e — PRIMARY source for this orthopaedic question]\n${orthText}`);
      if (surgText) blocks.push(`[MANIPAL MANUAL OF SURGERY 5e — use only for general surgical aspects]\n${surgText}`);
    } else {
      if (surgText) blocks.push(`[MANIPAL MANUAL OF SURGERY 5e — PRIMARY source for this surgery question]\n${surgText}`);
      if (orthText) blocks.push(`[MAHESHWARI ESSENTIAL ORTHOPAEDICS 5e — use only for bone/joint/trauma parts]\n${orthText}`);
    }
    console.log(`[textbook] surgortho subtopic="${subtopicName}" orthoMode=${ortho} surgChars=${surgText.length} orthChars=${orthText.length}`);
    return blocks.join("\n\n");
  }


  const paragraphs = await loadBook(key, 60);
  if (paragraphs.length === 0) return "";
  const picked = rankParagraphs(paragraphs, subtopicName, questions, maxChars);
  console.log(`[textbook] subject=${subject} book=${key} subtopic="${subtopicName}" chars=${picked.length}`);
  return picked;
}
