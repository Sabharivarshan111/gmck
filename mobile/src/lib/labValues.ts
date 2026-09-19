import { CLINICAL_GRADINGS } from './clinicalGradings';
/**
 * Normal laboratory values, for the bedside.
 *
 * Every case proforma in this app ends with investigations, and every one of
 * them assumes the reader knows what normal is. In a viva the examiner does not
 * ask "what is the haemoglobin" — they ask "is that normal, and what does it
 * mean in THIS patient", and a student who has to reach for a different app to
 * answer has lost the thread of their own case.
 *
 * So this sits behind a button above the search in the case-sheet picker,
 * beside the general examination, because those are the two things a student
 * needs WHILE clerking rather than after it.
 *
 * ── Three rules this file keeps ────────────────────────────────────────────
 *
 * 1. **SI units and conventional units, both.** Indian laboratories report
 *    haemoglobin in g/dL and creatinine in mg/dL while the textbooks and the
 *    journals use g/L and µmol/L. A reference that gives only one of them makes
 *    the reader do a conversion at the exact moment they are trying to think
 *    about a patient.
 *
 * 2. **Age and sex where they change the answer.** A haemoglobin of 12 g/dL is
 *    normal in a woman, anaemia in a man and dangerous in a neonate. Collapsing
 *    that into one range is the commonest way a reference table misleads.
 *
 * 3. **The critical value, where one exists.** The number that means "act now"
 *    is not the same as the number that means "abnormal", and it is the one
 *    that matters at 3am. It is marked separately rather than buried in prose.
 *
 * These are reference intervals for a healthy adult unless stated otherwise.
 * **Local laboratories differ** — the ranges on the patient's own report are
 * the ones that count, and the app says so on the screen rather than only here.
 */

export type LabGroup =
  | 'Clinical grading'
  | 'Haematology'
  | 'Biochemistry'
  | 'Renal and electrolytes'
  | 'Liver'
  | 'Cardiac and inflammatory'
  | 'Endocrine'
  | 'Arterial blood gas'
  | 'Urine'
  | 'Cerebrospinal fluid and body fluids'
  | 'Vitals and bedside';

export interface LabValue {
  name: string;
  source?: string;
  aliases?: string[];
  /** Conventional units, as Indian laboratories report them. */
  conventional: string;
  /** SI units, as the textbooks use them. Omitted where the two are the same. */
  si?: string;
  /** Where age, sex or pregnancy changes the range. */
  variants?: { label: string; value: string }[];
  /** The number that means act now, not merely the number that means abnormal. */
  critical?: string;
  /** What it is for, or the trap in interpreting it. */
  note?: string;
}

export interface LabSection {
  group: LabGroup;
  values: LabValue[];
}

export const LAB_VALUES: LabSection[] = [
  { group: 'Clinical grading', values: CLINICAL_GRADINGS },
  {
    group: 'Haematology',
    values: [
      {
        name: 'Haemoglobin',
        conventional: 'Men 13–17 g/dL · Women 12–15 g/dL',
        si: 'Men 130–170 g/L · Women 120–150 g/L',
        variants: [
          { label: 'Newborn', value: '14–24 g/dL' },
          { label: 'Infant 3–6 months', value: '9.5–14 g/dL' },
          { label: 'Child 1–6 years', value: '11–14 g/dL' },
          { label: 'Pregnancy', value: '≥ 11 g/dL (World Health Organization); anaemia below that' },
        ],
        critical: 'Below 7 g/dL — transfusion threshold in a stable patient',
        note: 'World Health Organization anaemia cut-offs: 13 in men, 12 in non-pregnant women, 11 in pregnancy and in children 6–59 months.',
      },
      {
        name: 'Total leucocyte count',
        conventional: '4,000–11,000 /mm³',
        si: '4.0–11.0 × 10⁹/L',
        variants: [{ label: 'Newborn', value: '9,000–30,000 /mm³' }],
        critical: 'Below 1,000 /mm³, or absolute neutrophils below 500 — neutropenic sepsis risk',
      },
      {
        name: 'Differential count',
        conventional: 'Percentage of each type of white blood cell',
        variants: [
          { label: 'Neutrophils', value: '40–75% — rapid defence against infection, especially bacteria' },
          { label: 'Lymphocytes', value: '20–45% — antibody production and targeted immune responses' },
          { label: 'Eosinophils', value: '1–6% — parasite defence and allergic inflammation' },
          { label: 'Monocytes', value: '2–10% — remove microbes and damaged cells' },
          { label: 'Basophils', value: '0–1% — release mediators involved in allergic responses' },
        ],
        note: 'In a child under 5 the lymphocytes normally exceed the neutrophils — a "reversed" differential at that age is the normal one.',
      },
      {
        name: 'Platelet count',
        conventional: '1.5–4.5 lakh /mm³ (150,000–450,000)',
        si: '150–450 × 10⁹/L',
        critical: 'Below 20,000 — spontaneous bleeding risk; below 50,000 before an invasive procedure',
      },
      {
        name: 'Packed cell volume (haematocrit)',
        conventional: 'Men 40–50% · Women 36–46%',
        note: 'Roughly three times the haemoglobin in g/dL. A gross mismatch means a sampling or analyser error.',
      },
      { name: 'Mean corpuscular volume', conventional: '80–100 fL', note: 'The first fork in the anaemia workup: microcytic, normocytic or macrocytic.' },
      { name: 'Mean corpuscular haemoglobin', conventional: '27–32 pg' },
      { name: 'Mean corpuscular haemoglobin concentration', conventional: '32–36 g/dL' },
      { name: 'Red cell distribution width', conventional: '11.5–14.5%', note: 'Raised in iron deficiency, usually normal in thalassaemia trait.' },
      {
        name: 'Reticulocyte count',
        conventional: '0.5–2.5%',
        note: 'Divides the whole anaemia differential: low means production failure, high means haemolysis or blood loss.',
      },
      {
        name: 'Erythrocyte sedimentation rate (Westergren)',
        conventional: 'Men 0–15 mm/hr · Women 0–20 mm/hr',
        note: 'Rises with age — a rough ceiling is age divided by 2 in men, and (age + 10) divided by 2 in women.',
      },
      { name: 'Prothrombin time', conventional: '11–13.5 s · International normalised ratio 0.8–1.2', critical: 'International normalised ratio above 5 on warfarin — reversal' },
      { name: 'Activated partial thromboplastin time', conventional: '25–35 s' },
      { name: 'Bleeding time (Ivy)', conventional: '2–7 min' },
      { name: 'Clotting time', conventional: '4–9 min' },
      { name: 'D-dimer', conventional: 'Below 500 ng/mL fibrinogen-equivalent units', note: 'Useful to EXCLUDE thromboembolism in a low-probability patient; a positive result proves nothing on its own.' },
      { name: 'Fibrinogen', conventional: '200–400 mg/dL' },
      { name: 'Serum ferritin', conventional: 'Men 30–300 ng/mL · Women 15–200 ng/mL', note: 'An ACUTE PHASE REACTANT — it can be normal or high in iron deficiency with coexisting inflammation. Below 15 is diagnostic; below 30 is deficiency in practice.' },
      { name: 'Serum iron', conventional: '60–170 µg/dL' },
      { name: 'Total iron-binding capacity', conventional: '240–450 µg/dL', note: 'HIGH in iron deficiency, LOW in anaemia of chronic disease — which is how the two are separated.' },
      { name: 'Transferrin saturation', conventional: '20–50%' },
      { name: 'Vitamin B12', conventional: '200–900 pg/mL' },
      { name: 'Serum folate', conventional: '3–17 ng/mL' },
      { name: 'Glycated haemoglobin', conventional: 'Below 5.7% normal · 5.7–6.4% prediabetes · ≥ 6.5% diabetes', note: 'Reflects 8–12 weeks. Unreliable in haemolysis, recent transfusion, haemoglobinopathy and chronic kidney disease.' },
    ],
  },
  {
    group: 'Renal and electrolytes',
    values: [
      { name: 'Blood urea', conventional: '15–40 mg/dL', si: '2.5–6.7 mmol/L' },
      { name: 'Blood urea nitrogen (Blood urea nitrogen)', conventional: '7–20 mg/dL', note: 'Urea divided by 2.14. A Blood urea nitrogen:creatinine ratio above 20 suggests a prerenal cause or an upper gastrointestinal bleed.' },
      {
        name: 'Serum creatinine',
        conventional: 'Men 0.7–1.3 mg/dL · Women 0.6–1.1 mg/dL',
        si: 'Men 62–115 µmol/L · Women 53–97 µmol/L',
        note: 'A poor early marker: it does not rise until roughly half the glomerular filtration rate is lost, and it is lower in the elderly and the malnourished because it depends on muscle mass.',
      },
      {
        name: 'Estimated glomerular filtration rate (Chronic Kidney Disease Epidemiology Collaboration equation)',
        conventional: 'Above 90 mL/min/1.73 m²',
        note: 'Stages: G1 ≥90, G2 60–89, G3a 45–59, G3b 30–44, G4 15–29, G5 <15.',
      },
      {
        name: 'Sodium',
        conventional: '135–145 mEq/L',
        si: '135–145 mmol/L',
        critical: 'Below 120 or above 160 mEq/L',
        note: 'Correct chronic hyponatraemia SLOWLY — no more than 8–10 mEq/L in 24 hours, or central pontine myelinolysis follows.',
      },
      {
        name: 'Potassium',
        conventional: '3.5–5.0 mEq/L',
        critical: 'Below 2.5 or above 6.5 mEq/L — electrocardiogram and treat now',
        note: 'A haemolysed sample gives a spuriously high result. Repeat before treating an unexpected value in a well patient.',
      },
      { name: 'Chloride', conventional: '98–107 mEq/L' },
      { name: 'Bicarbonate', conventional: '22–28 mEq/L' },
      { name: 'Anion gap', conventional: '8–12 mEq/L', note: 'Sodium − (chloride + bicarbonate). A raised gap suggests unmeasured acids; corrected for albumin, since a low albumin lowers the measured gap.' },
      { name: 'Serum calcium (total)', conventional: '8.5–10.5 mg/dL', si: '2.1–2.6 mmol/L', critical: 'Below 7 or above 14 mg/dL', note: 'Corrected calcium = measured + 0.8 × (4 − albumin in g/dL).' },
      { name: 'Ionised calcium', conventional: '4.5–5.6 mg/dL (1.1–1.4 mmol/L)' },
      { name: 'Phosphate', conventional: '2.5–4.5 mg/dL', variants: [{ label: 'Child', value: '4.0–7.0 mg/dL' }] },
      { name: 'Magnesium', conventional: '1.6–2.6 mg/dL' },
      { name: 'Serum uric acid', conventional: 'Men 3.5–7.2 mg/dL · Women 2.6–6.0 mg/dL' },
      { name: 'Serum osmolality', conventional: '275–295 mOsm/kg', note: '2 × sodium + glucose/18 + blood urea nitrogen/2.8 (glucose and blood urea nitrogen in milligrams per decilitre). An osmolar gap above 10 suggests an unmeasured osmole — methanol, ethylene glycol, ethanol.' },
    ],
  },
  {
    group: 'Liver',
    values: [
      { name: 'Total bilirubin', conventional: '0.3–1.2 mg/dL', si: '5–21 µmol/L', note: 'Jaundice becomes clinically visible above about 2–3 mg/dL.' },
      { name: 'Direct (conjugated) bilirubin', conventional: '0.1–0.4 mg/dL', note: 'Above 2 mg/dL, or more than 20% of the total, in a newborn is always pathological.' },
      { name: 'Aspartate aminotransferase (serum glutamic-oxaloacetic transaminase)', conventional: '5–40 U/L', note: 'Aspartate aminotransferase:Alanine aminotransferase above 2 with both under 300 suggests alcoholic liver disease.' },
      { name: 'Alanine aminotransferase (serum glutamic-pyruvic transaminase)', conventional: '7–56 U/L', note: 'More liver-specific than Aspartate aminotransferase. Values in the thousands mean viral hepatitis, ischaemia or a toxin.' },
      { name: 'Alkaline phosphatase', conventional: '40–130 U/L', variants: [{ label: 'Child / adolescent', value: 'Up to 3× the adult upper limit — growing bone' }], note: 'Raised out of proportion to the transaminases in obstruction. Confirm the liver origin with Gamma-glutamyl transferase, since bone raises it too.' },
      { name: 'Gamma-glutamyl transferase', conventional: 'Men 10–50 U/L · Women 8–40 U/L' },
      { name: 'Serum albumin', conventional: '3.5–5.5 g/dL', note: 'A synthetic function marker with a half-life of ~20 days, so it reflects chronic rather than acute failure.' },
      { name: 'Total protein', conventional: '6.0–8.3 g/dL', note: 'Albumin-to-globulin ratio normally 1.2–2.0 — REVERSED in chronic liver disease and in myeloma.' },
      { name: 'Prothrombin time and international normalised ratio', conventional: 'International normalised ratio 0.8–1.2', note: 'The BEST marker of acute synthetic function — factor VII has a half-life of 6 hours. In obstructive jaundice it corrects with parenteral vitamin K; in hepatocellular failure it does not.' },
      { name: 'Serum ammonia', conventional: '15–45 µg/dL', note: 'Correlates poorly with the grade of encephalopathy. Treat the patient, not the ammonia.' },
      { name: 'Alpha-fetoprotein', conventional: 'Below 10 ng/mL', note: 'hepatocellular carcinoma surveillance in cirrhosis, with 6-monthly ultrasound.' },
    ],
  },
  {
    group: 'Biochemistry',
    values: [
      { name: 'Fasting plasma glucose', conventional: '70–100 mg/dL normal · 100–125 prediabetes · ≥ 126 diabetes', si: '3.9–5.6 mmol/L', critical: 'Below 54 mg/dL — treat immediately' },
      { name: 'Postprandial (2 h) glucose', conventional: 'Below 140 normal · 140–199 impaired glucose tolerance · ≥ 200 diabetes' },
      { name: 'Random plasma glucose', conventional: '≥ 200 mg/dL with symptoms is diagnostic of diabetes' },
      { name: 'Gestational diabetes mellitus (Diabetes in Pregnancy Study Group India, India)', conventional: '75 g non-fasting, 2 h value ≥ 140 mg/dL is diagnostic', note: 'Single step, irrespective of the last meal — designed for women who travel long distances fasting.' },
      { name: 'Total cholesterol', conventional: 'Desirable below 200 mg/dL' },
      { name: 'Low-density lipoprotein cholesterol', conventional: 'Optimal below 100 mg/dL', note: 'Below 70 with established cardiovascular disease.' },
      { name: 'High-density lipoprotein cholesterol', conventional: 'Men above 40 · Women above 50 mg/dL' },
      { name: 'Triglycerides', conventional: 'Below 150 mg/dL', critical: 'Above 500 mg/dL — pancreatitis risk' },
      { name: 'Serum amylase', conventional: '30–110 U/L', note: 'Rises in 6–12 h and falls by 3–5 days. Also raised in a perforated viscus, mesenteric ischaemia and salivary disease.' },
      { name: 'Serum lipase', conventional: '10–140 U/L', note: 'More specific than amylase and stays up longer.' },
      { name: 'Serum lactate', conventional: '0.5–2.2 mmol/L', critical: 'Above 4 mmol/L — tissue hypoperfusion' },
    ],
  },
  {
    group: 'Cardiac and inflammatory',
    values: [
      { name: 'High-sensitivity cardiac troponin I or T', conventional: 'Assay-specific; below the 99th percentile', note: 'The RISE AND FALL matters more than a single value — repeat at 3 hours. Chronically raised in renal failure.' },
      { name: 'Creatine kinase, myocardial band', conventional: '0–5 ng/mL, or below 5% of total creatine kinase' },
      { name: 'N-terminal pro-B-type natriuretic peptide', conventional: 'Below 125 pg/mL rules out heart failure in a stable patient', note: 'Rises with age and renal impairment; lower in obesity.' },
      { name: 'C-reactive protein', conventional: 'Below 6 mg/L', note: 'Rises within hours and falls quickly — better than Erythrocyte sedimentation rate for following a response to treatment.' },
      { name: 'Procalcitonin', conventional: 'Below 0.05 ng/mL', note: 'Favours bacterial over viral infection; used to guide stopping antibiotics.' },
      { name: 'Antistreptolysin O titre', conventional: 'Below 200 IU/mL' },
      { name: 'Rheumatoid factor', conventional: 'Below 14 IU/mL' },
    ],
  },
  {
    group: 'Endocrine',
    values: [
      { name: 'Thyroid-stimulating hormone', conventional: '0.4–4.0 mIU/L', variants: [{ label: 'Pregnancy, 1st trimester', value: '0.1–2.5 mIU/L' }], note: 'The single best screening test — it moves before free thyroxine does.' },
      { name: 'Free thyroxine', conventional: '0.8–1.8 ng/dL' },
      { name: 'Free triiodothyronine', conventional: '2.3–4.2 pg/mL' },
      { name: 'Serum cortisol (8 am)', conventional: '5–25 µg/dL' },
      { name: 'Parathyroid hormone (intact)', conventional: '15–65 pg/mL' },
      { name: '25-hydroxyvitamin D', conventional: 'Sufficient above 30 ng/mL · 20–30 insufficient · below 20 deficient' },
      { name: 'Serum prolactin', conventional: 'Men below 20 · Women below 25 ng/mL' },
      { name: 'Beta human chorionic gonadotropin', conventional: 'Non-pregnant below 5 mIU/mL', note: 'Doubles roughly every 48 h in a normal early intrauterine pregnancy; a slower rise suggests ectopic or failing pregnancy.' },
    ],
  },
  {
    group: 'Arterial blood gas',
    values: [
      { name: 'pH', conventional: '7.35–7.45', critical: 'Below 7.20 or above 7.60' },
      { name: 'Arterial oxygen partial pressure', conventional: '80–100 mmHg (room air)', critical: 'Below 60 mmHg — respiratory failure', note: 'Type I respiratory failure is a low Arterial oxygen partial pressure with a normal or low Arterial carbon dioxide partial pressure; type II is a low Arterial oxygen partial pressure with Arterial carbon dioxide partial pressure above 50.' },
      { name: 'Arterial carbon dioxide partial pressure', conventional: '35–45 mmHg', critical: 'Above 50 mmHg with acidosis' },
      { name: 'Bicarbonate', conventional: '22–26 mEq/L' },
      { name: 'Base excess', conventional: '−2 to +2 mEq/L' },
      { name: 'Arterial oxygen saturation', conventional: '95–100%' },
      { name: 'Alveolar–arterial oxygen gradient', conventional: 'Roughly (age/4) + 4 mmHg', note: 'A NORMAL gradient with hypoxia means hypoventilation or low inspired oxygen; a RAISED gradient means shunt, ventilation–perfusion mismatch or diffusion defect.' },
    ],
  },
  {
    group: 'Urine',
    values: [
      { name: 'Urine output', conventional: '0.5–1 mL/kg/hr (adult) · 1–2 mL/kg/hr (child)', critical: 'Below 0.5 mL/kg/hr for 6 h — acute kidney injury' },
      { name: 'Specific gravity', conventional: '1.003–1.030' },
      { name: 'Urine protein (24 h)', conventional: 'Below 150 mg/day', note: 'NEPHROTIC RANGE is above 3.5 g/day in an adult.' },
      { name: 'Urine albumin:creatinine ratio', conventional: 'Below 30 mg/g normal · 30–300 moderately increased · above 300 severely increased', note: 'Detects diabetic nephropathy years before the creatinine moves.' },
      { name: 'Urine microscopy', conventional: 'Red blood cells 0–2/high-power field · White blood cells 0–5/high-power field · no casts', note: 'RED CELL CASTS mean glomerulonephritis. Fatty casts and oval fat bodies mean nephrotic syndrome.' },
      { name: 'Fractional excretion of sodium', conventional: 'Below 1% prerenal · above 2% intrinsic (acute tubular necrosis)', note: 'Invalid after a diuretic — use fractional excretion of urea instead.' },
    ],
  },
  {
    group: 'Cerebrospinal fluid and body fluids',
    values: [
      { name: 'Cerebrospinal fluid opening pressure', conventional: '6–20 cm H₂O' },
      { name: 'Cerebrospinal fluid cells', conventional: '0–5 lymphocytes/mm³', note: 'Neutrophils predominate in bacterial meningitis; lymphocytes in viral and tuberculous.' },
      { name: 'Cerebrospinal fluid protein', conventional: '15–45 mg/dL', note: 'Very high (100s) in tuberculous meningitis, with a cobweb coagulum on standing.' },
      { name: 'Cerebrospinal fluid glucose', conventional: '50–80 mg/dL, or above ⅔ of the plasma value', note: 'LOW in bacterial, tuberculous and fungal meningitis; NORMAL in viral.' },
      { name: 'Ascitic serum–ascites albumin gradient', conventional: '≥ 1.1 g/dL means portal hypertension · below 1.1 means it does not', note: 'Serum albumin minus ascitic albumin, samples the SAME day. Replaced the exudate–transudate split because cardiac ascites has a high serum–ascites albumin gradient AND a high protein.' },
      { name: 'Ascitic fluid neutrophils (spontaneous bacterial peritonitis)', conventional: '≥ 250/mm³ is diagnostic of spontaneous bacterial peritonitis' },
      { name: 'Pleural fluid — Light criteria', conventional: 'Exudate if ANY: fluid:serum protein > 0.5, fluid:serum lactate dehydrogenase > 0.6, or fluid lactate dehydrogenase > ⅔ the serum upper limit' },
      { name: 'Pleural / ascitic adenosine deaminase', conventional: 'Above 40 U/L supports tuberculosis' },
    ],
  },
  {
    group: 'Vitals and bedside',
    values: [
      {
        name: 'Heart rate',
        conventional: 'Adult 60–100 /min',
        variants: [
          { label: 'Newborn', value: '120–160 /min' },
          { label: 'Infant', value: '100–150 /min' },
          { label: '1–3 years', value: '90–140 /min' },
          { label: '3–6 years', value: '80–120 /min' },
          { label: '6–12 years', value: '70–110 /min' },
        ],
        note: 'A rate of 140 is normal in a neonate and alarming in a ten-year-old — which is why an age-blind "normal" range is dangerous in paediatrics.',
      },
      {
        name: 'Respiratory rate',
        conventional: 'Adult 12–20 /min',
        variants: [
          { label: 'Newborn', value: '30–60 /min' },
          { label: 'Infant', value: '30–53 /min' },
          { label: '1–5 years', value: '22–37 /min' },
          { label: '6–12 years', value: '18–25 /min' },
        ],
        note: 'World Health Organization fast breathing: ≥60 under 2 months, ≥50 at 2–12 months, ≥40 at 1–5 years.',
      },
      {
        name: 'Blood pressure',
        conventional: 'Adult below 120/80 normal · ≥ 140/90 hypertension',
        variants: [{ label: 'Child', value: 'Systolic ≈ 90 + (2 × age in years); hypotension below 70 + (2 × age)' }],
        critical: 'Above 180/120 with end-organ damage — hypertensive emergency',
      },
      { name: 'Temperature', conventional: '36.5–37.5 °C (97.7–99.5 °F)', note: 'Rectal is about 0.5 °C above oral; axillary about 0.5 °C below.' },
      { name: 'Oxygen saturation by pulse oximetry', conventional: '95–100%', critical: 'Below 90% — and a normal saturation never excludes airway obstruction' },
      { name: 'Glasgow Coma Scale', conventional: 'Eye opening 4 + verbal response 5 + motor response 6 = 15; minimum total 3', critical: '8 or below — urgent airway assessment and senior review' },
      { name: 'Urine output (child)', conventional: '1–2 mL/kg/hr' },
      { name: 'Body mass index', conventional: 'Asian-Indian: normal 18.5–22.9 · overweight 23–24.9 · obese ≥ 25', note: 'The Indian cut-offs are LOWER than the World Health Organization international ones, because cardiometabolic risk starts at a lower Body mass index in South Asians.' },
    ],
  },
];

export function labSection(group: LabGroup): LabValue[] {
  return LAB_VALUES.find(s => s.group === group)?.values ?? [];
}

/** Every value, flattened, for the search box. */
export function allLabValues(): { group: LabGroup; value: LabValue }[] {
  return LAB_VALUES.flatMap(s => s.values.map(value => ({ group: s.group, value })));
}
