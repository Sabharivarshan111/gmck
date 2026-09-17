/**
 * Clinical scoring systems, in full.
 *
 * A score printed as "Child-Pugh A/B/C" is useless at the bedside: the thing
 * being asked for is the five parameters, their cut-offs, and what the class
 * changes about management. So every entry here carries all four —
 * parameters, points, bands, and what the band is FOR.
 *
 * `whatItChanges` is the field that matters and the one most references
 * leave out. A score that does not change a decision is a number.
 */

export interface ScoreParameter {
  name: string;
  /** Each option with the points it scores, e.g. "Bilirubin <2 mg/dL — 1". */
  options: string[];
}

export interface ScoreBand {
  band: string;
  meaning: string;
}

export interface ScoringSystem {
  id: string;
  name: string;
  /** Which specialty tab it belongs under. */
  system:
    | 'General Medicine'
    | 'General Surgery'
    | 'Pediatrics'
    | 'Orthopaedics'
    | 'Obstetrics & Gynaecology'
    | 'Critical Care'
    | 'Community Medicine';
  /** What question the score answers. */
  use: string;
  parameters: ScoreParameter[];
  bands: ScoreBand[];
  /** What the answer actually changes. */
  whatItChanges: string;
  /** The mis-step examiners probe for. */
  pitfall?: string;
}

export const SCORING_SYSTEMS: ScoringSystem[] = [
  // ─────────────────────────────────────────────────────── MEDICINE ───────
  {
    id: 'gcs',
    name: 'Glasgow Coma Scale',
    system: 'General Medicine',
    use: 'Grades depth of impaired consciousness and tracks it over time.',
    parameters: [
      { name: 'Eye opening (E)', options: ['Spontaneous — 4', 'To speech — 3', 'To pain — 2', 'None — 1'] },
      {
        name: 'Verbal response (V)',
        options: ['Oriented — 5', 'Confused conversation — 4', 'Inappropriate words — 3', 'Incomprehensible sounds — 2', 'None — 1'],
      },
      {
        name: 'Motor response (M)',
        options: [
          'Obeys commands — 6',
          'Localises to pain — 5',
          'Withdraws from pain — 4',
          'Abnormal flexion (decorticate) — 3',
          'Extension (decerebrate) — 2',
          'None — 1',
        ],
      },
    ],
    bands: [
      { band: '13 – 15', meaning: 'Mild head injury' },
      { band: '9 – 12', meaning: 'Moderate head injury' },
      { band: '3 – 8', meaning: 'Severe head injury — coma' },
    ],
    whatItChanges:
      'GCS ≤8 is the conventional threshold for intubation to protect the airway. A fall of 2 or more points is a neurosurgical emergency and triggers repeat imaging. It also drives trauma triage and the decision to transfer.',
    pitfall:
      'Minimum is 3, never 0. Always report E, V and M separately — two patients with a total of 8 can be in entirely different situations. In an intubated patient record V as 1T.',
  },
  {
    id: 'child-pugh',
    name: 'Child-Turcotte-Pugh Score',
    system: 'General Medicine',
    use: 'Grades severity of cirrhosis and predicts surgical mortality and 1–2 year survival.',
    parameters: [
      { name: 'Total bilirubin (mg/dL)', options: ['below 2 — 1 point', '2 – 3 — 2 points', 'above 3 — 3 points'] },
      { name: 'Serum albumin (g/dL)', options: ['above 3.5 — 1 point', '2.8 – 3.5 — 2 points', 'below 2.8 — 3 points'] },
      { name: 'INR (or prothrombin time prolongation)', options: ['below 1.7 (<4 s) — 1 point', '1.7 – 2.3 (4–6 s) — 2 points', 'above 2.3 (>6 s) — 3 points'] },
      { name: 'Ascites', options: ['None — 1 point', 'Mild / diuretic-responsive — 2 points', 'Moderate–severe / refractory — 3 points'] },
      { name: 'Hepatic encephalopathy', options: ['None — 1 point', 'Grade I–II — 2 points', 'Grade III–IV — 3 points'] },
    ],
    bands: [
      { band: 'Class A (5 – 6)', meaning: 'Well-compensated. 1-year survival ~100%, 2-year ~85%. Abdominal surgery mortality ~10%' },
      { band: 'Class B (7 – 9)', meaning: 'Significant functional compromise. 1-year ~80%, 2-year ~60%. Surgery mortality ~30%' },
      { band: 'Class C (10 – 15)', meaning: 'Decompensated. 1-year ~45%, 2-year ~35%. Surgery mortality ~80%' },
    ],
    whatItChanges:
      'Decides whether a cirrhotic can survive elective surgery, and Class C is effectively a contraindication to it. It also guides transplant referral and the decision to offer TIPS.',
    pitfall:
      'Two of the five parameters — ascites and encephalopathy — are subjective, which is the whole reason MELD was invented for transplant allocation. Remember the mnemonic "A BEAN": Albumin, Bilirubin, Encephalopathy, Ascites, INR.',
  },
  {
    id: 'meld',
    name: 'MELD / MELD-Na Score',
    system: 'General Medicine',
    use: 'Predicts 3-month mortality in end-stage liver disease; used to allocate liver transplants.',
    parameters: [
      { name: 'Serum bilirubin (mg/dL)', options: ['Entered into the formula; values below 1.0 are rounded up to 1.0'] },
      { name: 'Serum creatinine (mg/dL)', options: ['Values below 1.0 rounded up to 1.0; capped at 4.0; set to 4.0 if on dialysis twice in the past week'] },
      { name: 'INR', options: ['Values below 1.0 rounded up to 1.0'] },
      { name: 'Serum sodium (MELD-Na only)', options: ['Bounded between 125 and 137 mEq/L'] },
      { name: 'Formula', options: ['MELD = 3.78×ln(bilirubin) + 11.2×ln(INR) + 9.57×ln(creatinine) + 6.43'] },
    ],
    bands: [
      { band: '9 or less', meaning: '3-month mortality ~1.9%' },
      { band: '10 – 19', meaning: '~6%' },
      { band: '20 – 29', meaning: '~19.6%' },
      { band: '30 – 39', meaning: '~52.6%' },
      { band: '40 or more', meaning: '~71.3%' },
    ],
    whatItChanges:
      'Determines position on the transplant waiting list. A MELD of 15 or more is the conventional threshold at which transplant confers a survival benefit over remaining on medical therapy.',
    pitfall:
      'Entirely objective, which is its advantage over Child-Pugh — but it does not include ascites or encephalopathy, so a patient with refractory ascites and a low MELD can be sicker than the number says. MELD-Na was added because hyponatraemia carries independent mortality.',
  },
  {
    id: 'curb65',
    name: 'CURB-65',
    system: 'General Medicine',
    use: 'Severity assessment in community-acquired pneumonia; decides admission.',
    parameters: [
      { name: 'C — Confusion', options: ['New disorientation in time, place or person (AMTS ≤8) — 1 point'] },
      { name: 'U — Urea', options: ['Blood urea above 42 mg/dL (>7 mmol/L) — 1 point'] },
      { name: 'R — Respiratory rate', options: ['30/min or more — 1 point'] },
      { name: 'B — Blood pressure', options: ['Systolic below 90 or diastolic 60 or below — 1 point'] },
      { name: '65 — Age', options: ['65 years or older — 1 point'] },
    ],
    bands: [
      { band: '0 – 1', meaning: 'Low severity, ~1.5% mortality. Manage at home' },
      { band: '2', meaning: 'Moderate, ~9% mortality. Consider hospital admission or supervised outpatient care' },
      { band: '3 – 5', meaning: 'High severity, ~22% mortality. Admit; consider intensive care if 4–5' },
    ],
    whatItChanges:
      'It is an admission decision, not a diagnosis. In primary care where urea is unavailable, CRB-65 is used with the same thresholds.',
    pitfall:
      'It under-calls severity in the young, in whom physiology compensates until it does not, and takes no account of comorbidity, hypoxia or bilateral disease. A 30-year-old with an SpO₂ of 88% scores 0 and still needs admitting.',
  },
  {
    id: 'nyha',
    name: 'NYHA Functional Classification',
    system: 'General Medicine',
    use: 'Grades symptomatic limitation in heart failure.',
    parameters: [
      { name: 'Class I', options: ['No limitation. Ordinary physical activity causes no symptoms'] },
      { name: 'Class II', options: ['Slight limitation. Comfortable at rest; ordinary activity causes fatigue, palpitation or dyspnoea'] },
      { name: 'Class III', options: ['Marked limitation. Comfortable at rest; LESS than ordinary activity causes symptoms'] },
      { name: 'Class IV', options: ['Unable to carry out any physical activity without discomfort. Symptoms AT REST'] },
    ],
    bands: [
      { band: 'I – II', meaning: 'Mild. Annual mortality roughly 5–10%' },
      { band: 'III', meaning: 'Moderate. Annual mortality roughly 10–20%' },
      { band: 'IV', meaning: 'Severe. Annual mortality 30–70%' },
    ],
    whatItChanges:
      'Drives device therapy (CRT is considered in NYHA II–IV on optimal therapy), transplant assessment, and is the outcome measure in almost every heart failure trial.',
    pitfall:
      'It is symptomatic, not anatomical, and it fluctuates — the same patient is class IV before diuresis and class II after. It is not the same as the ACC/AHA stages A–D, which are structural and only move one way.',
  },
  {
    id: 'mmrc',
    name: 'mMRC Dyspnoea Scale',
    system: 'General Medicine',
    use: 'Grades breathlessness, principally in COPD.',
    parameters: [
      { name: 'Grade 0', options: ['Breathless only with strenuous exercise'] },
      { name: 'Grade 1', options: ['Short of breath hurrying on the level, or walking up a slight hill'] },
      { name: 'Grade 2', options: ['Walks slower than people of the same age on the level, or stops for breath walking at own pace'] },
      { name: 'Grade 3', options: ['Stops for breath after about 100 metres or after a few minutes on the level'] },
      { name: 'Grade 4', options: ['Too breathless to leave the house, or breathless on dressing or undressing'] },
    ],
    bands: [
      { band: '0 – 1', meaning: 'Less symptomatic — GOLD group A or E depending on exacerbations' },
      { band: '2 or more', meaning: 'More symptomatic — GOLD group B or E' },
    ],
    whatItChanges:
      'With exacerbation history it places the patient in a GOLD group, which selects the inhaler regimen. mMRC ≥2 is also an indication for pulmonary rehabilitation.',
    pitfall: 'Not the same as the NYHA class, and not interchangeable with it. Grade 2 is the pivotal cut-off.',
  },
  {
    id: 'killip',
    name: 'Killip Classification',
    system: 'General Medicine',
    use: 'Risk-stratifies acute myocardial infarction by the degree of heart failure at presentation.',
    parameters: [
      { name: 'Class I', options: ['No clinical signs of heart failure'] },
      { name: 'Class II', options: ['Basal crepitations over less than half the lung fields, S3 gallop, or raised JVP'] },
      { name: 'Class III', options: ['Frank acute pulmonary oedema — crepitations over more than half the lung fields'] },
      { name: 'Class IV', options: ['Cardiogenic shock — systolic BP below 90 with signs of hypoperfusion'] },
    ],
    bands: [
      { band: 'Class I', meaning: '30-day mortality roughly 5%' },
      { band: 'Class II', meaning: 'Roughly 15%' },
      { band: 'Class III', meaning: 'Roughly 30–40%' },
      { band: 'Class IV', meaning: 'Roughly 60–80%' },
    ],
    whatItChanges:
      'A Killip class of II or above at presentation pushes towards early invasive management and intensive monitoring. It is a component of the GRACE and TIMI risk scores.',
  },
  {
    id: 'wells-dvt',
    name: 'Wells Score — Deep Vein Thrombosis',
    system: 'General Medicine',
    use: 'Pre-test probability of DVT, to decide between D-dimer and imaging.',
    parameters: [
      { name: 'Active cancer (treatment within 6 months, or palliative)', options: ['+1'] },
      { name: 'Paralysis, paresis, or recent plaster immobilisation of a leg', options: ['+1'] },
      { name: 'Recently bedridden 3 days or more, or major surgery within 12 weeks', options: ['+1'] },
      { name: 'Localised tenderness along the deep venous system', options: ['+1'] },
      { name: 'Entire leg swollen', options: ['+1'] },
      { name: 'Calf swelling more than 3 cm greater than the other leg (10 cm below tibial tuberosity)', options: ['+1'] },
      { name: 'Pitting oedema confined to the symptomatic leg', options: ['+1'] },
      { name: 'Collateral superficial (non-varicose) veins', options: ['+1'] },
      { name: 'Previously documented DVT', options: ['+1'] },
      { name: 'An alternative diagnosis at least as likely as DVT', options: ['−2'] },
    ],
    bands: [
      { band: '0 or less', meaning: 'Low probability (~5%). A negative D-dimer excludes DVT' },
      { band: '1 – 2', meaning: 'Moderate (~17%). D-dimer, then ultrasound if positive' },
      { band: '3 or more', meaning: 'High (~53%). Go straight to compression ultrasound; D-dimer does not help' },
    ],
    whatItChanges:
      'It decides whether a D-dimer is worth doing at all. In a high-probability patient a negative D-dimer does NOT exclude DVT, so the test is skipped and imaging done.',
    pitfall: 'There is a separate Wells score for pulmonary embolism with different items — do not mix them up.',
  },
  {
    id: 'qsofa',
    name: 'qSOFA and SOFA',
    system: 'Critical Care',
    use: 'qSOFA screens for sepsis at the bedside; SOFA defines organ dysfunction and grades it.',
    parameters: [
      { name: 'qSOFA — Respiratory rate', options: ['22/min or more — 1 point'] },
      { name: 'qSOFA — Altered mentation', options: ['GCS below 15 — 1 point'] },
      { name: 'qSOFA — Systolic blood pressure', options: ['100 mmHg or less — 1 point'] },
      {
        name: 'SOFA — six organ systems, each scored 0–4',
        options: [
          'Respiration — PaO₂/FiO₂ ratio',
          'Coagulation — platelet count',
          'Liver — bilirubin',
          'Cardiovascular — mean arterial pressure and vasopressor dose',
          'CNS — Glasgow Coma Scale',
          'Renal — creatinine or urine output',
        ],
      },
    ],
    bands: [
      { band: 'qSOFA 2 or more', meaning: 'Increased risk of poor outcome — investigate for organ dysfunction and escalate' },
      { band: 'SOFA rise of 2 or more', meaning: 'Sepsis, by the Sepsis-3 definition: life-threatening organ dysfunction from a dysregulated host response to infection' },
      { band: 'Septic shock', meaning: 'Sepsis plus vasopressor requirement to keep MAP ≥65 mmHg PLUS lactate above 2 mmol/L despite adequate fluid resuscitation' },
    ],
    whatItChanges:
      'Triggers the sepsis bundle: cultures before antibiotics, broad-spectrum antibiotics within the hour, lactate, fluid resuscitation at 30 mL/kg for hypotension or lactate ≥4, and vasopressors if MAP stays below 65.',
    pitfall:
      'qSOFA is a prognostic screen, not a diagnostic test — it is specific but insensitive, so a qSOFA of 0 does not exclude sepsis. SIRS criteria were replaced by Sepsis-3 precisely because they were too sensitive.',
  },
  {
    id: 'duke',
    name: 'Modified Duke Criteria',
    system: 'General Medicine',
    use: 'Diagnosis of infective endocarditis.',
    parameters: [
      {
        name: 'MAJOR criteria',
        options: [
          'Positive blood culture — typical organism from two separate cultures (viridans streptococci, S. bovis, HACEK, S. aureus, community-acquired enterococci without a focus), OR persistently positive cultures, OR a single positive culture for Coxiella burnetii / phase I IgG titre >1:800',
          'Evidence of endocardial involvement — echocardiogram showing a vegetation, abscess, or new dehiscence of a prosthetic valve, OR a NEW valvular regurgitant murmur',
        ],
      },
      {
        name: 'MINOR criteria',
        options: [
          'Predisposition — predisposing heart condition or injecting drug use',
          'Fever — temperature above 38 °C',
          'Vascular phenomena — major arterial emboli, septic pulmonary infarcts, mycotic aneurysm, intracranial haemorrhage, conjunctival haemorrhage, Janeway lesions',
          'Immunological phenomena — glomerulonephritis, Osler nodes, Roth spots, rheumatoid factor',
          'Microbiological evidence not meeting a major criterion',
        ],
      },
    ],
    bands: [
      { band: 'DEFINITE', meaning: '2 major, OR 1 major + 3 minor, OR 5 minor — or pathological confirmation of a vegetation or abscess' },
      { band: 'POSSIBLE', meaning: '1 major + 1 minor, OR 3 minor' },
      { band: 'REJECTED', meaning: 'A firm alternative diagnosis, or resolution with 4 days or less of antibiotics, or no pathological evidence at surgery/autopsy after 4 days or less of antibiotics' },
    ],
    whatItChanges:
      'Definite endocarditis commits the patient to 4–6 weeks of parenteral antibiotics and a surgical opinion. Distinguish Janeway lesions (painless, palms and soles, septic emboli) from Osler nodes (painful, finger pulps, immune complex) — that pair is asked every time.',
  },

  // ─────────────────────────────────────────────────────── SURGERY ────────
  {
    id: 'alvarado',
    name: 'Alvarado Score (MANTRELS)',
    system: 'General Surgery',
    use: 'Probability of acute appendicitis.',
    parameters: [
      { name: 'M — Migration of pain to the right iliac fossa', options: ['1 point'] },
      { name: 'A — Anorexia', options: ['1 point'] },
      { name: 'N — Nausea or vomiting', options: ['1 point'] },
      { name: 'T — Tenderness in the right iliac fossa', options: ['2 points'] },
      { name: 'R — Rebound tenderness', options: ['1 point'] },
      { name: 'E — Elevated temperature (above 37.3 °C)', options: ['1 point'] },
      { name: 'L — Leucocytosis (above 10,000/mm³)', options: ['2 points'] },
      { name: 'S — Shift of the differential count to the left (neutrophils above 75%)', options: ['1 point'] },
    ],
    bands: [
      { band: '1 – 4', meaning: 'Appendicitis unlikely. Discharge with safety-net advice' },
      { band: '5 – 6', meaning: 'Compatible — observe and re-examine, or image' },
      { band: '7 – 8', meaning: 'Probable appendicitis' },
      { band: '9 – 10', meaning: 'Very probable — proceed to appendicectomy' },
    ],
    whatItChanges:
      'It reduces the negative appendicectomy rate and rations CT. The two 2-point items are RIF tenderness and leucocytosis — those carry the score.',
    pitfall:
      'Poorly discriminating in women of reproductive age, where the differential (ectopic pregnancy, ovarian torsion, PID, ruptured corpus luteum) is wide — always do a urine pregnancy test before acting on it.',
  },
  {
    id: 'ranson',
    name: 'Ranson Criteria',
    system: 'General Surgery',
    use: 'Predicts mortality in acute pancreatitis.',
    parameters: [
      {
        name: 'ON ADMISSION (mnemonic GA LAW)',
        options: [
          'Glucose above 200 mg/dL',
          'Age above 55 years',
          'LDH above 350 IU/L',
          'AST above 250 IU/L',
          'WBC above 16,000/mm³',
        ],
      },
      {
        name: 'AT 48 HOURS (mnemonic C HOBBS)',
        options: [
          'Calcium below 8 mg/dL',
          'Haematocrit fall of more than 10%',
          'Oxygen — PaO₂ below 60 mmHg',
          'BUN rise of more than 5 mg/dL',
          'Base deficit greater than 4 mEq/L',
          'Sequestration of fluid greater than 6 litres',
        ],
      },
    ],
    bands: [
      { band: '0 – 2', meaning: 'Mortality about 2%' },
      { band: '3 – 4', meaning: 'About 15%' },
      { band: '5 – 6', meaning: 'About 40%' },
      { band: '7 – 11', meaning: 'Close to 100%' },
    ],
    whatItChanges:
      'Three or more criteria means severe pancreatitis: high-dependency care, aggressive fluid resuscitation and a contrast CT at 72 hours to look for necrosis.',
    pitfall:
      'It cannot be completed until 48 hours have passed, which is its central weakness — by then the decision has been made. This is why BISAP, APACHE-II and the revised Atlanta classification are preferred in practice. Note also that amylase is NOT in the score: the height of the amylase does not predict severity.',
  },
  {
    id: 'glasgow-blatchford',
    name: 'Glasgow-Blatchford Score',
    system: 'General Surgery',
    use: 'Upper gastrointestinal bleed — identifies who can be managed as an outpatient.',
    parameters: [
      { name: 'Blood urea (mg/dL)', options: ['18.2–22.3 — 2', '22.4–27.9 — 3', '28.0–69.9 — 4', '70 or above — 6'] },
      { name: 'Haemoglobin — men (g/dL)', options: ['12.0–12.9 — 1', '10.0–11.9 — 3', 'below 10 — 6'] },
      { name: 'Haemoglobin — women (g/dL)', options: ['10.0–11.9 — 1', 'below 10 — 6'] },
      { name: 'Systolic BP (mmHg)', options: ['100–109 — 1', '90–99 — 2', 'below 90 — 3'] },
      { name: 'Other markers', options: ['Pulse 100 or more — 1', 'Melaena — 1', 'Syncope — 2', 'Liver disease — 2', 'Cardiac failure — 2'] },
    ],
    bands: [
      { band: '0 (or ≤1)', meaning: 'Very low risk. Can be managed as an outpatient with an early endoscopy appointment' },
      { band: '1 – 5', meaning: 'Low to moderate risk' },
      { band: '6 or more', meaning: 'High risk — more than 50% chance of needing intervention. Admit, resuscitate, urgent endoscopy' },
    ],
    whatItChanges:
      'A score of 0 is the only validated basis for sending a GI bleed home. Unlike the Rockall score, it needs no endoscopic findings, so it works at the front door.',
  },
  {
    id: 'wagner',
    name: 'Wagner Classification — Diabetic Foot Ulcer',
    system: 'General Surgery',
    use: 'Grades the depth and infection of a diabetic foot ulcer.',
    parameters: [
      { name: 'Grade 0', options: ['No open lesion; may have a deformity or cellulitis — the foot "at risk"'] },
      { name: 'Grade 1', options: ['Superficial ulcer, partial or full thickness, not through to tendon or bone'] },
      { name: 'Grade 2', options: ['Deep ulcer extending to tendon, capsule or bone, without abscess or osteomyelitis'] },
      { name: 'Grade 3', options: ['Deep ulcer with abscess, osteomyelitis or joint sepsis'] },
      { name: 'Grade 4', options: ['Localised gangrene — forefoot or heel'] },
      { name: 'Grade 5', options: ['Gangrene of the whole foot'] },
    ],
    bands: [
      { band: 'Grades 1 – 2', meaning: 'Offloading, debridement, dressings, glycaemic control' },
      { band: 'Grade 3', meaning: 'Urgent surgical drainage, culture-directed antibiotics, imaging for osteomyelitis' },
      { band: 'Grades 4 – 5', meaning: 'Amputation — ray, transmetatarsal, below-knee or above-knee by extent and vascularity' },
    ],
    whatItChanges:
      'Selects debridement versus amputation and the level of it. Always assess perfusion alongside (ankle-brachial index, Doppler) — Wagner grades the WOUND and says nothing about the blood supply, which is what determines healing.',
  },
  {
    id: 'asa',
    name: 'ASA Physical Status Classification',
    system: 'General Surgery',
    use: 'Pre-anaesthetic grading of the patient\'s systemic fitness.',
    parameters: [
      { name: 'ASA I', options: ['A normal healthy patient'] },
      { name: 'ASA II', options: ['Mild systemic disease without substantive functional limitation — controlled hypertension, controlled diabetes, smoker, pregnancy, obesity with BMI 30–40'] },
      { name: 'ASA III', options: ['Severe systemic disease with substantive functional limitation — poorly controlled diabetes or hypertension, COPD, BMI above 40, ESRD on dialysis, MI or stroke more than 3 months ago'] },
      { name: 'ASA IV', options: ['Severe systemic disease that is a constant threat to life — recent (<3 months) MI or stroke, ongoing cardiac ischaemia, sepsis, DIC, ESRD not on dialysis'] },
      { name: 'ASA V', options: ['A moribund patient not expected to survive without the operation — ruptured aneurysm, massive trauma, intracranial bleed with mass effect'] },
      { name: 'ASA VI', options: ['A declared brain-dead patient whose organs are being removed for donation'] },
      { name: 'Suffix E', options: ['Added for an emergency operation, e.g. ASA IIIE'] },
    ],
    bands: [
      { band: 'I – II', meaning: 'Routine perioperative care' },
      { band: 'III', meaning: 'Optimise before elective surgery; higher-dependency recovery' },
      { band: 'IV – V', meaning: 'Markedly increased perioperative mortality; operate only when the alternative is worse' },
    ],
    whatItChanges:
      'Determines the anaesthetic plan, the level of postoperative care booked, and consent discussion. It is a description of the PATIENT, not of the operation and not a prediction of risk by itself.',
  },
  {
    id: 'mallampati',
    name: 'Modified Mallampati Classification',
    system: 'General Surgery',
    use: 'Predicts difficulty of laryngoscopy and intubation.',
    parameters: [
      { name: 'Class I', options: ['Soft palate, uvula, fauces and both pillars visible'] },
      { name: 'Class II', options: ['Soft palate, uvula and fauces visible — pillars hidden'] },
      { name: 'Class III', options: ['Soft palate and the base of the uvula only'] },
      { name: 'Class IV', options: ['Soft palate not visible at all — hard palate only'] },
    ],
    bands: [
      { band: 'I – II', meaning: 'Intubation usually straightforward' },
      { band: 'III – IV', meaning: 'Predicts a difficult airway — prepare a difficult-airway trolley and a plan B' },
    ],
    whatItChanges:
      'Drives airway preparation. Assess it with the patient SEATED, head neutral, mouth opened maximally, tongue protruded, WITHOUT phonation — asking the patient to say "aah" lifts the palate and falsely improves the class.',
    pitfall:
      'Poor sensitivity on its own. Combine with thyromental distance (below 6 cm is a concern), mouth opening (below 3 cm), neck extension and the upper-lip-bite test.',
  },

  // ───────────────────────────────────────────────── OBSTETRICS & GYN ─────
  {
    id: 'bishop',
    name: 'Bishop Score',
    system: 'Obstetrics & Gynaecology',
    use: 'Assesses cervical favourability before induction of labour.',
    parameters: [
      { name: 'Cervical dilatation (cm)', options: ['Closed — 0', '1–2 — 1', '3–4 — 2', '5–6 — 3'] },
      { name: 'Effacement (%)', options: ['0–30 — 0', '40–50 — 1', '60–70 — 2', '80 or more — 3'] },
      { name: 'Station (relative to ischial spines)', options: ['−3 — 0', '−2 — 1', '−1 to 0 — 2', '+1 to +2 — 3'] },
      { name: 'Cervical consistency', options: ['Firm — 0', 'Medium — 1', 'Soft — 2'] },
      { name: 'Cervical position', options: ['Posterior — 0', 'Mid — 1', 'Anterior — 2'] },
    ],
    bands: [
      { band: '8 or more', meaning: 'Favourable ("ripe"). Induction likely to succeed; probability of vaginal delivery comparable to spontaneous labour' },
      { band: '6 – 7', meaning: 'Intermediate' },
      { band: '5 or less', meaning: 'Unfavourable. Cervical ripening needed first — prostaglandin E2 gel, misoprostol, or a Foley/balloon catheter' },
    ],
    whatItChanges:
      'Decides whether to ripen the cervix before inducing, or to go straight to amniotomy and oxytocin. A low Bishop score predicts failed induction and therefore caesarean section.',
    pitfall: 'Maximum is 13. Dilatation, effacement and station each score up to 3; consistency and position up to 2.',
  },
  {
    id: 'apgar',
    name: 'APGAR Score',
    system: 'Pediatrics',
    use: 'Assesses the newborn\'s condition at 1 and 5 minutes of life.',
    parameters: [
      { name: 'A — Appearance (colour)', options: ['Blue or pale all over — 0', 'Body pink, extremities blue (acrocyanosis) — 1', 'Completely pink — 2'] },
      { name: 'P — Pulse (heart rate)', options: ['Absent — 0', 'Below 100/min — 1', '100/min or above — 2'] },
      { name: 'G — Grimace (reflex irritability)', options: ['No response — 0', 'Grimace — 1', 'Cry, cough or sneeze — 2'] },
      { name: 'A — Activity (muscle tone)', options: ['Limp — 0', 'Some flexion of limbs — 1', 'Active movement — 2'] },
      { name: 'R — Respiration', options: ['Absent — 0', 'Slow, irregular, weak cry — 1', 'Good, strong cry — 2'] },
    ],
    bands: [
      { band: '7 – 10', meaning: 'Normal. Routine care' },
      { band: '4 – 6', meaning: 'Moderately depressed. Stimulate, clear the airway, bag-and-mask ventilation if needed' },
      { band: '0 – 3', meaning: 'Severely depressed. Full resuscitation' },
    ],
    whatItChanges:
      'It describes the response to resuscitation over time; the 5-minute score has more prognostic weight than the 1-minute score. If the 5-minute score is below 7, repeat every 5 minutes up to 20 minutes.',
    pitfall:
      'APGAR does NOT start resuscitation and must never delay it — resuscitation begins on the three questions at birth (term? tone? breathing or crying?), not on a score at one minute. It is also a poor predictor of long-term neurological outcome on its own, and it is unreliable in preterm infants, whose tone and colour are immature.',
  },
  {
    id: 'pph-shock-index',
    name: 'Obstetric Shock Index & PPH Assessment',
    system: 'Obstetrics & Gynaecology',
    use: 'Detects haemodynamic compromise in postpartum haemorrhage before the blood pressure falls.',
    parameters: [
      { name: 'Shock index', options: ['Heart rate ÷ systolic blood pressure. Normal in pregnancy 0.7–0.9'] },
      { name: 'Blood loss definition', options: ['PPH: ≥500 mL after vaginal delivery, or ≥1000 mL after caesarean, or any loss causing haemodynamic instability'] },
      { name: 'The four Ts — causes', options: ['TONE — uterine atony (70%)', 'TRAUMA — genital tract laceration, uterine rupture, inversion (20%)', 'TISSUE — retained placenta or clots (10%)', 'THROMBIN — coagulopathy (1%)'] },
    ],
    bands: [
      { band: 'Shock index below 0.9', meaning: 'Reassuring' },
      { band: '0.9 – 1.7', meaning: 'Significant haemorrhage — escalate, cross-match, activate the PPH protocol' },
      { band: 'Above 1.7', meaning: 'Severe. Massive transfusion protocol' },
    ],
    whatItChanges:
      'A young pregnant woman maintains her blood pressure until she has lost 30–40% of her blood volume, so waiting for hypotension is waiting too long. The shock index rises first.',
    pitfall: 'Tone is by far the commonest cause — rub up a contraction and give uterotonics FIRST while you look for the other three.',
  },

  // ─────────────────────────────────────────────────────── PAEDIATRICS ────
  {
    id: 'silverman-anderson',
    name: 'Silverman-Anderson Retraction Score',
    system: 'Pediatrics',
    use: 'Grades respiratory distress in the NEWBORN.',
    parameters: [
      { name: 'Upper chest movement', options: ['Synchronised — 0', 'Lag on inspiration — 1', 'See-saw — 2'] },
      { name: 'Lower chest retraction', options: ['None — 0', 'Just visible — 1', 'Marked — 2'] },
      { name: 'Xiphoid retraction', options: ['None — 0', 'Just visible — 1', 'Marked — 2'] },
      { name: 'Nasal flaring', options: ['None — 0', 'Minimal — 1', 'Marked — 2'] },
      { name: 'Expiratory grunt', options: ['None — 0', 'Audible with stethoscope only — 1', 'Audible with the naked ear — 2'] },
    ],
    bands: [
      { band: '0', meaning: 'No respiratory distress' },
      { band: '1 – 3', meaning: 'Mild' },
      { band: '4 – 6', meaning: 'Moderate — impending respiratory failure' },
      { band: '7 – 10', meaning: 'Severe — imminent respiratory failure; intubate and ventilate' },
    ],
    whatItChanges:
      'Guides escalation from oxygen to CPAP to mechanical ventilation, and surfactant in a preterm baby with hyaline membrane disease.',
    pitfall:
      'Unlike almost every other score, a HIGHER Silverman score is worse and a score of 0 is normal — the opposite convention to the Downes score in which 0 is also normal but the scale is different. Do not confuse it with Downes, which is used in older infants and includes cyanosis and air entry.',
  },
  {
    id: 'pem-grading',
    name: 'Protein-Energy Malnutrition — IAP & WHO',
    system: 'Pediatrics',
    use: 'Grades undernutrition in a child.',
    parameters: [
      {
        name: 'IAP classification (weight for age, % of expected)',
        options: [
          'Normal — above 80%',
          'Grade I — 71–80%',
          'Grade II — 61–70%',
          'Grade III — 51–60%',
          'Grade IV — 50% or below (and Grade III/IV with oedema = kwashiorkor)',
        ],
      },
      {
        name: 'WHO / Wellcome classification',
        options: [
          'Underweight — weight-for-age below −2 SD',
          'Stunting — height-for-age below −2 SD (CHRONIC malnutrition)',
          'Wasting — weight-for-height below −2 SD (ACUTE malnutrition)',
          'Severe acute malnutrition — weight-for-height below −3 SD, OR MUAC below 11.5 cm, OR bilateral pitting oedema',
        ],
      },
      {
        name: 'Gomez classification (weight for age)',
        options: ['Normal >90%', 'Grade 1 (mild) 75–89%', 'Grade 2 (moderate) 60–74%', 'Grade 3 (severe) below 60%'],
      },
    ],
    bands: [
      { band: 'Moderate acute malnutrition', meaning: 'Community management, supplementary feeding, treat infection, counsel' },
      { band: 'Severe acute malnutrition WITHOUT complications', meaning: 'Community-based management with ready-to-use therapeutic food' },
      { band: 'SAM WITH complications or oedema', meaning: 'Admit. WHO 10 steps: treat/prevent hypoglycaemia, hypothermia, dehydration; correct electrolytes; treat infection; correct micronutrients; cautious feeding; catch-up growth; sensory stimulation; prepare for follow-up' },
    ],
    whatItChanges:
      'Decides admission versus community management, and whether feeding must be cautious. Refeeding a severely malnourished child too fast causes refeeding syndrome and kills them — hence the "cautious feeding" step before "catch-up growth".',
    pitfall:
      'Oedema upgrades the grade regardless of weight, because oedema fluid ADDS weight and hides the deficit. Never classify a child with bilateral pitting oedema on weight alone.',
  },
  {
    id: 'ballard',
    name: 'New Ballard Score',
    system: 'Pediatrics',
    use: 'Estimates gestational age of a newborn from physical and neuromuscular maturity.',
    parameters: [
      {
        name: 'Neuromuscular maturity (6 items)',
        options: ['Posture', 'Square window (wrist)', 'Arm recoil', 'Popliteal angle', 'Scarf sign', 'Heel to ear'],
      },
      {
        name: 'Physical maturity (6 items)',
        options: ['Skin', 'Lanugo', 'Plantar surface creases', 'Breast bud', 'Eye and ear', 'Genitals'],
      },
    ],
    bands: [
      { band: 'Score −10', meaning: '20 weeks' },
      { band: 'Score 0', meaning: '24 weeks' },
      { band: 'Score 20', meaning: '32 weeks' },
      { band: 'Score 35', meaning: '38 weeks' },
      { band: 'Score 50', meaning: '44 weeks' },
    ],
    whatItChanges:
      'Each 5 points is roughly 2 weeks of gestation. Combined with birth weight it classifies the baby as small, appropriate or large for gestational age, which selects the screening (hypoglycaemia, polycythaemia) the baby needs.',
    pitfall:
      'Most accurate within the first 12 hours in a baby under 26 weeks, and within 96 hours otherwise. It over-estimates gestational age in growth-restricted babies.',
  },

  // ──────────────────────────────────────────────────── ORTHOPAEDICS ──────
  {
    id: 'pirani',
    name: 'Pirani Score — CTEV',
    system: 'Orthopaedics',
    use: 'Grades severity of congenital talipes equinovarus and tracks Ponseti correction.',
    parameters: [
      {
        name: 'HINDFOOT contracture score (0, 0.5 or 1 each)',
        options: ['Posterior crease', 'Empty heel', 'Rigid equinus'],
      },
      {
        name: 'MIDFOOT contracture score (0, 0.5 or 1 each)',
        options: ['Curved lateral border', 'Medial crease', 'Lateral head of talus (uncovered)'],
      },
    ],
    bands: [
      { band: '0', meaning: 'Normal foot / fully corrected' },
      { band: '0.5 – 2.5', meaning: 'Mild' },
      { band: '3 – 4.5', meaning: 'Moderate' },
      { band: '5 – 6', meaning: 'Severe' },
    ],
    whatItChanges:
      'Predicts the number of Ponseti casts needed (roughly one cast per point) and, with a hindfoot score of 1 or more after midfoot correction, indicates a percutaneous tendo-Achilles tenotomy — which about 80–90% of feet require.',
    pitfall:
      'Maximum is 6, made of two halves of 3. Each of the six signs scores 0 (normal), 0.5 (moderately abnormal) or 1 (severely abnormal). Do not confuse it with the Dimeglio score, which runs 0–20.',
  },
  {
    id: 'gustilo',
    name: 'Gustilo-Anderson Classification — Open Fractures',
    system: 'Orthopaedics',
    use: 'Grades an open fracture by soft-tissue injury and contamination.',
    parameters: [
      { name: 'Type I', options: ['Wound less than 1 cm, clean, minimal soft-tissue damage, simple fracture pattern'] },
      { name: 'Type II', options: ['Wound 1–10 cm, moderate soft-tissue damage, no extensive stripping'] },
      { name: 'Type IIIA', options: ['Wound more than 10 cm or high energy; extensive soft-tissue damage but adequate bone coverage remains'] },
      { name: 'Type IIIB', options: ['Extensive soft-tissue loss with periosteal stripping and bone exposure — requires a flap'] },
      { name: 'Type IIIC', options: ['Any open fracture with an ARTERIAL INJURY requiring repair, irrespective of wound size'] },
    ],
    bands: [
      { band: 'Type I', meaning: 'Infection risk 0–2%. First-generation cephalosporin' },
      { band: 'Type II', meaning: '2–7%. Cephalosporin' },
      { band: 'Type III', meaning: '10–50%. Add an aminoglycoside; add penicillin for farmyard contamination (clostridial risk)' },
    ],
    whatItChanges:
      'Selects the antibiotic, the urgency of debridement, the need for plastic surgery cover, and in IIIC the need for immediate vascular repair. All open fractures get tetanus prophylaxis, early antibiotics (within an hour) and thorough debridement.',
    pitfall:
      'The classification can only be made definitively IN THEATRE after debridement — the wound size at the roadside consistently under-calls the grade. And IIIC is defined by vascular injury alone: a 1 cm wound with a divided popliteal artery is IIIC, not type I.',
  },

  // ─────────────────────────────────────────────── COMMUNITY MEDICINE ─────
  {
    id: 'kuppuswamy',
    name: 'Modified Kuppuswamy Scale',
    system: 'Community Medicine',
    use: 'Socioeconomic classification of an URBAN Indian family.',
    parameters: [
      {
        name: 'Education of the head of the family',
        options: [
          'Professional degree — 7',
          'Graduate / postgraduate — 6',
          'Intermediate / post-high school diploma — 5',
          'High school certificate — 4',
          'Middle school certificate — 3',
          'Primary school certificate — 2',
          'Illiterate — 1',
        ],
      },
      {
        name: 'Occupation of the head of the family',
        options: [
          'Legislators, senior officials, managers — 10',
          'Professionals — 9',
          'Technicians and associate professionals — 8',
          'Clerks — 7',
          'Skilled workers, shop and market sales — 6',
          'Skilled agriculture and fishery — 5',
          'Craft and related trades — 4',
          'Plant and machine operators — 3',
          'Elementary occupation — 2',
          'Unemployed — 1',
        ],
      },
      {
        name: 'Total monthly family income',
        options: [
          'The income slabs are revised every year against the All-India Consumer Price Index — always quote the year of the version you are using',
          'Highest slab — 12 points, descending in steps to the lowest slab — 1 point',
        ],
      },
    ],
    bands: [
      { band: '26 – 29', meaning: 'Upper (Class I)' },
      { band: '16 – 25', meaning: 'Upper middle (Class II)' },
      { band: '11 – 15', meaning: 'Lower middle (Class III)' },
      { band: '5 – 10', meaning: 'Upper lower (Class IV)' },
      { band: 'Below 5', meaning: 'Lower (Class V)' },
    ],
    whatItChanges:
      'It is the standard socioeconomic descriptor in the history of every Indian case sheet, and it determines eligibility framing for welfare schemes in a community-medicine posting.',
    pitfall:
      'Kuppuswamy is for URBAN families. For rural families use the modified BG Prasad scale, which is based on per-capita monthly income alone and is also CPI-revised annually. Quoting Kuppuswamy for a rural farmer is the error examiners look for.',
  },
];
