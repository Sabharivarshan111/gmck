import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// All 16 textbooks across 1st, 2nd, 3rd, and Final Year MBBS
// Uploaded to private Supabase storage bucket: "textbooks"
const BOOK_FILES: Record<string, string[]> = {
  // 1st Year
  anatomy: [
    "anatomy/vishram_singh_anatomy_part1.txt",
    "anatomy/vishram_singh_anatomy_part2.txt",
    "anatomy/vishram_singh_anatomy_part3.txt",
    "embryology/langmans_embryology_part1.txt",
  ],
  physiology: [
    "physiology/sembulingam_physiology_part1.txt",
    "physiology/sembulingam_physiology_part2.txt",
    "physiology/sembulingam_physiology_part3.txt",
  ],
  biochemistry: [
    "biochemistry/vasudevan_biochemistry_part1.txt",
    "biochemistry/vasudevan_biochemistry_part2.txt",
    "biochemistry/vasudevan_biochemistry_part3.txt",
  ],
  // 2nd Year
  pharmacology: [
    "pharmacology/kd_tripathi_classification.txt",
    "pharmacology/tara_shanbhag_pharmacology.txt",
  ],
  pathology: [
    "pathology/ramadas_nayak_pathology_part1.txt",
    "pathology/ramadas_nayak_pathology_part2.txt",
    "pathology/ramadas_nayak_pathology_part3.txt",
    "pathology/ramadas_nayak_pathology_part4.txt",
  ],
  microbiology: [
    "microbiology/apurba_sastry_microbiology_part1.txt",
    "microbiology/apurba_sastry_microbiology_part2.txt",
    "microbiology/apurba_sastry_microbiology_part3.txt",
    "microbiology/apurba_sastry_microbiology_part4.txt",
  ],
  // 3rd Year
  community: [
    "community/sia_park_community_medicine.txt",
  ],
  forensic: [
    "forensic/vision_forensic_medicine.txt",
  ],
  // Final Year
  // Obstetrics: DC Dutta (Separate book)
  obstetrics: [
    "obgyn/dc_dutta_gynaecology_part1.txt",
    "obgyn/dc_dutta_gynaecology_part2.txt",
  ],
  // Gynaecology: Shaw's (Separate book)
  gynaecology: [
    "obgyn/shaws_gynaecology_part1.txt",
    "obgyn/shaws_gynaecology_part2.txt",
  ],
  // General Surgery: Manipal Manual of Surgery (Separate book)
  surgery: [
    "surgery/manipal_surgery_part1.txt",
    "surgery/manipal_surgery_part2.txt",
    "surgery/manipal_surgery_part3.txt",
    "surgery/manipal_surgery_part4.txt",
  ],
  // Orthopaedics: Maheshwari Essential Orthopaedics (Separate book)
  orthopaedics: [
    "orthopaedics/maheshwari_orthopaedics_part1.txt",
    "orthopaedics/maheshwari_orthopaedics_part2.txt",
  ],
  // General Medicine: Manipal Prep Manual of Medicine
  medicine: [
    "medicine/manipal_medicine_part1.txt",
    "medicine/manipal_medicine_part2.txt",
    "medicine/manipal_medicine_part3.txt",
  ],
  // Paediatrics: OP Ghai Essential Pediatrics
  paediatrics: [
    "paediatrics/op_ghai_paediatrics_part1.txt",
    "paediatrics/op_ghai_paediatrics_part2.txt",
    "paediatrics/op_ghai_paediatrics_part3.txt",
  ],
  // ENT: PL Dhingra
  ent: [
    "ent/dhingra_ent_part1.txt",
    "ent/dhingra_ent_part2.txt",
  ],
  // Ophthalmology: AK Khurana
  ophthalmology: [
    "ophthalmology/khurana_ophthalmology_part1.txt",
    "ophthalmology/khurana_ophthalmology_part2.txt",
  ],
};

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

function splitParagraphs(text: string): string[] {
  if (!text) return [];
  const cleaned = text.replace(/===== PAGE \d+ ?\/? ?\d* =====/g, "\n\n");
  const rawParas = cleaned.split(/\n\s*\n+/);
  const out: string[] = [];
  for (const p of rawParas) {
    const t = p.replace(/\s+/g, " ").trim();
    if (t.length < 60) continue;
    if (t.length <= 900) {
      out.push(t);
    } else {
      for (let i = 0; i < t.length; i += 800) out.push(t.slice(i, i + 900));
    }
  }
  return out;
}

// In-memory memory cache for parsed paragraphs per book key
const memoryCache: Record<string, string[]> = {};

async function loadBookParagraphs(bookKey: string, supabaseAdmin: any): Promise<string[]> {
  if (memoryCache[bookKey] && memoryCache[bookKey].length > 0) {
    return memoryCache[bookKey];
  }

  const files = BOOK_FILES[bookKey] || [];
  if (files.length === 0) return [];

  const chunks: string[] = [];
  for (const path of files) {
    try {
      const { data, error } = await supabaseAdmin.storage.from("textbooks").download(path);
      if (error) {
        console.warn(`[textbook] download error for ${path}:`, error.message);
        continue;
      }
      if (data) {
        const text = await data.text();
        chunks.push(text);
      }
    } catch (e) {
      console.warn(`[textbook] failed to load ${path}:`, e);
    }
  }

  const combined = chunks.join("\n\n");
  const paras = splitParagraphs(combined);
  memoryCache[bookKey] = paras;
  console.log(`[textbook] loaded book "${bookKey}": ${paras.length} paragraphs`);
  return paras;
}

export function pickBookKeys(subject: string, subtopicName?: string, questions?: string[]): string[] {
  const s = (subject || "").toLowerCase();
  const contextStr = `${s} ${(subtopicName || "").toLowerCase()} ${(questions || []).join(" ").toLowerCase()}`;

  // 3rd Year
  if (s.includes("community") || s.includes("psm") || s.includes("preventive") || s.includes("social medicine")) {
    return ["community"];
  }
  if (s.includes("forensic") || s.includes("fmt") || s.includes("toxicology")) {
    return ["forensic"];
  }

  // 2nd Year
  if (s.includes("pharmac") || s.includes("drug")) {
    return ["pharmacology"];
  }
  if (s.includes("patholog")) {
    return ["pathology"];
  }
  if (s.includes("microbio") || s.includes("bacterio") || s.includes("virolog") || s.includes("mycolog") || s.includes("parasitolog") || s.includes("immunolog")) {
    return ["microbiology"];
  }

  // 1st Year
  if (s.includes("physiolog")) {
    return ["physiology"];
  }
  if (s.includes("biochem")) {
    return ["biochemistry"];
  }
  if (s.includes("anatom") || s.includes("embryo") || s.includes("histolog") || s.includes("osteolog")) {
    return ["anatomy"];
  }

  // Final Year
  // Obstetrics vs Gynaecology (Dutta for Obstetrics, Shaw's for Gynaecology)
  if (s.includes("obstet") || s.includes("gynae") || s.includes("obgyn") || s.includes("o&g")) {
    const hasObstetricTerms = /pregnan|labor|labour|fetal|foetal|placenta|antenatal|antepartum|postpartum|preeclampsia|eclampsia|lscs|caesarean|amniotic|trimester|breech|puerperium|episiotomy|gestation|neonat|parturition|toxaemia/.test(contextStr);
    const hasGynaeTerms = /gynae|gynec|menstrua|ovarian|uterus|cervix|fibroid|endometri|pap smear|infertilit|prolapse|vulva|vagina|contracept|dUB|adenomyosis|salpingitis|amenorrhoea|dysmenorrhoea/.test(contextStr);
    
    if (hasObstetricTerms && !hasGynaeTerms) return ["obstetrics"];
    if (hasGynaeTerms && !hasObstetricTerms) return ["gynaecology"];
    return ["obstetrics", "gynaecology"]; // Search both if ambiguous
  }

  // Surgery vs Orthopaedics (Manipal for Surgery, Maheshwari for Orthopaedics)
  if (s.includes("surg") || s.includes("ortho")) {
    const hasOrthoTerms = /ortho|fracture|dislocation|bone|joint|splint|traction|epiphys|malunion|non-union|plaster of paris|nerve injur|claw hand|wrist drop|foot drop|amputation|osteom|scoliosis|meniscus|ligament/.test(contextStr);
    const hasSurgeryTerms = /appendix|hernia|gallbladder|cholecyst|breast|thyroid|mastectomy|laparotom|ulcer|burns|wound|abscess|fistula|hemorrhoid|parotid|pancreas|splen|periton/.test(contextStr);

    if (hasOrthoTerms && !hasSurgeryTerms) return ["orthopaedics"];
    if (hasSurgeryTerms && !hasOrthoTerms) return ["surgery"];
    return ["surgery", "orthopaedics"];
  }

  if (s.includes("medicine") || s.includes("general-medicine")) {
    return ["medicine"];
  }
  if (s.includes("paediat") || s.includes("pediatr")) {
    return ["paediatrics"];
  }
  if (s.includes("ent") || s.includes("otorhinolaryng") || s.includes("otolaryngol")) {
    return ["ent"];
  }
  if (s.includes("ophthalm") || s.includes("eye")) {
    return ["ophthalmology"];
  }

  return [];
}

export function pickBookKey(subject: string): string | null {
  const keys = pickBookKeys(subject);
  return keys[0] || null;
}

function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[a-z][a-z0-9\-]{2,}/g) || [])
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

export async function buildTextbookContext(
  subject: string,
  subtopicName: string,
  questions: string[],
  maxChars = 22000,
  supabaseAdmin?: any,
): Promise<string> {
  const bookKeys = pickBookKeys(subject, subtopicName, questions);
  if (bookKeys.length === 0) return "";

  const adminClient = supabaseAdmin || createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const allParagraphs: string[] = [];
  for (const k of bookKeys) {
    const paras = await loadBookParagraphs(k, adminClient);
    allParagraphs.push(...paras);
  }

  if (allParagraphs.length === 0) return "";

  const subtopicTokens = tokenize(subtopicName);
  const questionTokens = questions.map((q) => tokenize(q));
  const queryTokens = new Set<string>([
    ...subtopicTokens,
    ...questionTokens.flat(),
  ]);
  if (queryTokens.size === 0) return "";

  const boostTokens = new Set<string>([
    ...subtopicTokens,
    ...questionTokens.flatMap((toks) => toks.slice(0, 3)),
  ]);

  const nameLower = subtopicName.toLowerCase();
  const scored: Array<{ idx: number; score: number }> = [];
  for (let i = 0; i < allParagraphs.length; i++) {
    const p = allParagraphs[i].toLowerCase();
    let score = 0;
    for (const tok of queryTokens) if (p.includes(tok)) score += 1;
    if (score === 0) continue;
    for (const tok of boostTokens) if (p.includes(tok)) score += 1;
    if (nameLower.length >= 5 && p.includes(nameLower)) score += 6;
    scored.push({ idx: i, score });
  }
  if (scored.length === 0) {
    console.log(`[textbook] no matches for subject=${subject} subtopic=${subtopicName}`);
    return "";
  }
  scored.sort((a, b) => b.score - a.score || a.idx - b.idx);

  const picked: string[] = [];
  let used = 0;
  const seen = new Set<number>();
  for (const s of scored) {
    if (seen.has(s.idx)) continue;
    const para = allParagraphs[s.idx];
    if (used + para.length + 4 > maxChars) continue;
    picked.push(para);
    seen.add(s.idx);
    used += para.length + 4;
    if (picked.length >= 80) break;
  }
  console.log(`[textbook] subject=${subject} subtopic="${subtopicName}" matched=${scored.length} picked=${picked.length} chars=${used}`);
  return picked.join("\n\n");
}
