/**
 * Normal laboratory values, as a ward reference.
 *
 * Two rules this file follows, because both are how a lab reference goes
 * wrong:
 *
 * 1. **Every panel carries its own caveat.** A "normal range" is the central
 *    95% of one laboratory's reference population on one analyser. It moves
 *    with age, sex, pregnancy, altitude and method. A range quoted without
 *    that is quoted as if it were a law of nature, and students then argue
 *    with a lab report that is right.
 *
 * 2. **Conventional units first, SI second.** Indian labs report haemoglobin
 *    in g/dL and creatinine in mg/dL; the SI column is there for the papers
 *    and the international exams, not the other way round.
 *
 * CRITICAL values are marked, because those are the numbers that mean the
 * patient needs something done now rather than a repeat sample.
 */

export interface LabRow {
  analyte: string;
  /** Conventional units, as an Indian lab reports it. */
  normal: string;
  /** SI units where they differ usefully. */
  si?: string;
  /** Why it moves, or what a derangement means. */
  note?: string;
  /** A value that demands action rather than a repeat. */
  critical?: string;
}

export interface LabPanel {
  id: string;
  name: string;
  /** The specimen and any preparation — a fasting sample is a different test. */
  specimen: string;
  caveat?: string;
  rows: LabRow[];
}

export const LAB_PANELS: LabPanel[] = [
  {
    id: 'haematology',
    name: 'Haematology — Complete Blood Count',
    specimen: 'EDTA whole blood. No fasting needed.',
    caveat:
      'Haemoglobin is sex-specific, falls physiologically in pregnancy (plasma volume rises ~50% against a ~25% rise in red cell mass) and rises at altitude. The WHO anaemia cut-offs are lower than the "normal range": <13 g/dL in men, <12 in non-pregnant women, <11 in pregnancy and in children 6–59 months.',
    rows: [
      { analyte: 'Haemoglobin — male', normal: '13.0 – 17.0 g/dL', si: '130 – 170 g/L', critical: 'below 7 g/dL — transfusion threshold in a stable patient' },
      { analyte: 'Haemoglobin — female', normal: '12.0 – 15.0 g/dL', si: '120 – 150 g/L' },
      { analyte: 'Haemoglobin — pregnancy', normal: '11.0 g/dL and above', note: 'Below 11 is anaemia in pregnancy; below 7 is severe and an indication for admission' },
      { analyte: 'Total WBC count', normal: '4,000 – 11,000 /mm³', si: '4.0 – 11.0 ×10⁹/L', critical: 'below 1,000 (neutropenic sepsis risk) or above 50,000 (leukaemoid / leukaemia)' },
      { analyte: 'Neutrophils', normal: '40 – 75 %', note: 'Absolute count matters more than the percentage; ANC <500 is severe neutropenia' },
      { analyte: 'Lymphocytes', normal: '20 – 45 %', note: 'Relative lymphocytosis is normal in children under 5' },
      { analyte: 'Eosinophils', normal: '1 – 6 %', note: 'Raised in parasitic infestation, allergy, asthma, drug reaction, Löffler syndrome, tropical pulmonary eosinophilia' },
      { analyte: 'Monocytes', normal: '2 – 10 %' },
      { analyte: 'Basophils', normal: '0 – 1 %' },
      { analyte: 'Platelet count', normal: '1.5 – 4.5 lakh/mm³ (150,000 – 450,000)', si: '150 – 450 ×10⁹/L', critical: 'below 20,000 — spontaneous bleeding risk; below 10,000 transfuse' },
      { analyte: 'PCV / Haematocrit — male', normal: '40 – 50 %' },
      { analyte: 'PCV / Haematocrit — female', normal: '36 – 46 %' },
      { analyte: 'MCV', normal: '80 – 100 fL', note: 'Low = microcytic (iron deficiency, thalassaemia, anaemia of chronic disease, sideroblastic). High = macrocytic (B12/folate, alcohol, hypothyroid, liver disease, myelodysplasia)' },
      { analyte: 'MCH', normal: '27 – 32 pg' },
      { analyte: 'MCHC', normal: '32 – 36 g/dL', note: 'High MCHC is almost only hereditary spherocytosis, or a lipaemic sample' },
      { analyte: 'RDW', normal: '11.5 – 14.5 %', note: 'High RDW with low MCV favours iron deficiency; normal RDW with low MCV favours thalassaemia trait' },
      { analyte: 'Reticulocyte count', normal: '0.5 – 2.5 %', note: 'The single most useful test in anaemia: high = haemolysis or blood loss with an intact marrow; low = production failure' },
      { analyte: 'ESR (Westergren) — male', normal: '0 – 15 mm/hr', note: 'Rough rule: upper limit = age ÷ 2 in men, (age + 10) ÷ 2 in women' },
      { analyte: 'ESR (Westergren) — female', normal: '0 – 20 mm/hr', note: 'Very high (>100) — tuberculosis, myeloma, temporal arteritis, malignancy, severe infection' },
    ],
  },
  {
    id: 'coagulation',
    name: 'Coagulation',
    specimen: 'Citrated plasma (blue top), filled to the mark — an under-filled tube falsely prolongs the result.',
    caveat:
      'PT/INR tests the EXTRINSIC pathway (factor VII, the shortest half-life), so it is the first to derange in liver failure and in warfarin therapy. aPTT tests the INTRINSIC pathway and is what heparin prolongs.',
    rows: [
      { analyte: 'Bleeding time (Ivy)', normal: '2 – 7 minutes', note: 'Platelet function and vessel wall. Prolonged in thrombocytopenia, von Willebrand disease, aspirin, uraemia' },
      { analyte: 'Clotting time', normal: '4 – 9 minutes', note: 'Crude and largely abandoned; still asked in vivas' },
      { analyte: 'Prothrombin time (PT)', normal: '11 – 14 seconds', note: 'Extrinsic pathway — factors VII, X, V, II, fibrinogen' },
      { analyte: 'INR', normal: '0.8 – 1.2 (untreated)', note: 'Therapeutic on warfarin: 2.0–3.0 for AF and DVT; 2.5–3.5 for a mechanical mitral valve', critical: 'above 5 — high bleeding risk, withhold and consider vitamin K' },
      { analyte: 'aPTT', normal: '25 – 35 seconds', note: 'Intrinsic pathway. Prolonged by heparin, haemophilia A and B, von Willebrand disease, lupus anticoagulant' },
      { analyte: 'Fibrinogen', normal: '200 – 400 mg/dL', note: 'Falls in DIC and in liver failure; an acute-phase reactant so it rises in infection' },
      { analyte: 'D-dimer', normal: 'below 500 ng/mL FEU', note: 'Useful only to RULE OUT venous thromboembolism in a low-probability patient. Raised in sepsis, pregnancy, malignancy, surgery, age' },
    ],
  },
  {
    id: 'renal',
    name: 'Renal Function & Electrolytes',
    specimen: 'Serum. Potassium is falsely high in a haemolysed or fist-clenched sample.',
    caveat:
      'Creatinine is a poor marker of early renal impairment because it depends on muscle mass: a cachectic elderly woman can have a "normal" creatinine of 1.0 mg/dL with a GFR of 35. Always work from eGFR, and remember that creatinine does not rise until roughly half the nephron mass is lost.',
    rows: [
      { analyte: 'Blood urea', normal: '15 – 40 mg/dL', si: '2.5 – 6.7 mmol/L', note: 'Raised disproportionately to creatinine in pre-renal failure, GI bleed, high protein intake, catabolic states' },
      { analyte: 'Blood urea nitrogen (BUN)', normal: '7 – 20 mg/dL', note: 'BUN = urea ÷ 2.14' },
      { analyte: 'Serum creatinine — male', normal: '0.7 – 1.3 mg/dL', si: '62 – 115 µmol/L' },
      { analyte: 'Serum creatinine — female', normal: '0.6 – 1.1 mg/dL', si: '53 – 97 µmol/L' },
      { analyte: 'eGFR', normal: 'above 90 mL/min/1.73 m²', note: 'CKD stages: G1 ≥90, G2 60–89, G3a 45–59, G3b 30–44, G4 15–29, G5 <15 (or on dialysis)' },
      { analyte: 'Sodium', normal: '135 – 145 mEq/L', critical: 'below 120 or above 160 — seizure and osmotic demyelination risk; correct no faster than 8–10 mEq/L in 24 h' },
      { analyte: 'Potassium', normal: '3.5 – 5.0 mEq/L', critical: 'below 2.5 or above 6.5 — get an ECG now' },
      { analyte: 'Chloride', normal: '98 – 107 mEq/L' },
      { analyte: 'Bicarbonate', normal: '22 – 28 mEq/L' },
      { analyte: 'Anion gap', normal: '8 – 16 mEq/L', note: 'Na − (Cl + HCO₃). Raised in DKA, lactic acidosis, uraemia, salicylate, methanol, ethylene glycol (MUDPILES)' },
      { analyte: 'Calcium (total)', normal: '8.5 – 10.5 mg/dL', si: '2.1 – 2.6 mmol/L', note: 'Correct for albumin: add 0.8 mg/dL for every 1 g/dL the albumin is below 4' },
      { analyte: 'Ionised calcium', normal: '4.5 – 5.6 mg/dL (1.1 – 1.4 mmol/L)' },
      { analyte: 'Phosphate', normal: '2.5 – 4.5 mg/dL', note: 'Higher in children. Rises in CKD; falls in refeeding syndrome' },
      { analyte: 'Magnesium', normal: '1.7 – 2.4 mg/dL', note: 'Check it in any refractory hypokalaemia — potassium will not correct until magnesium does' },
      { analyte: 'Uric acid — male', normal: '3.5 – 7.2 mg/dL' },
      { analyte: 'Uric acid — female', normal: '2.6 – 6.0 mg/dL' },
    ],
  },
  {
    id: 'liver',
    name: 'Liver Function Tests',
    specimen: 'Serum. Bilirubin is light-sensitive — the sample must be protected from light.',
    caveat:
      '"LFT" is a misnomer: ALT, AST, ALP and GGT are markers of hepatocyte or biliary INJURY, not of liver function. The three that measure actual function are albumin, prothrombin time/INR and bilirubin. A patient can have normal transaminases and a failing liver.',
    rows: [
      { analyte: 'Total bilirubin', normal: '0.2 – 1.2 mg/dL', si: '3 – 21 µmol/L', note: 'Clinical jaundice appears above about 2–3 mg/dL' },
      { analyte: 'Direct (conjugated) bilirubin', normal: '0.0 – 0.3 mg/dL', note: 'More than 50% of total direct = conjugated hyperbilirubinaemia — hepatic or post-hepatic' },
      { analyte: 'Indirect (unconjugated) bilirubin', normal: '0.2 – 0.9 mg/dL', note: 'Predominant in haemolysis and in Gilbert syndrome' },
      { analyte: 'ALT (SGPT)', normal: '7 – 56 U/L', note: 'More liver-specific than AST. Above 1000 means viral hepatitis, ischaemic hepatitis or paracetamol' },
      { analyte: 'AST (SGOT)', normal: '10 – 40 U/L', note: 'AST:ALT ratio above 2:1 with a raised GGT suggests alcoholic liver disease; below 1 suggests viral or NAFLD' },
      { analyte: 'Alkaline phosphatase', normal: '40 – 130 U/L', note: 'Physiologically HIGH in children and adolescents (bone growth) and in the third trimester (placental). Raised with GGT = biliary; raised with normal GGT = bone (Paget, osteomalacia, metastases)' },
      { analyte: 'GGT', normal: '9 – 48 U/L', note: 'The confirmer: it tells you a raised ALP is hepatobiliary. Induced by alcohol and by enzyme-inducing drugs' },
      { analyte: 'Total protein', normal: '6.0 – 8.3 g/dL' },
      { analyte: 'Albumin', normal: '3.5 – 5.0 g/dL', si: '35 – 50 g/L', note: 'Half-life ~20 days, so it reflects CHRONIC liver function, not acute. Also falls in nephrotic syndrome, malnutrition, sepsis, protein-losing enteropathy' },
      { analyte: 'Globulin', normal: '2.0 – 3.5 g/dL', note: 'A reversed A:G ratio suggests chronic liver disease, myeloma or chronic infection' },
      { analyte: 'A:G ratio', normal: '1.2 – 2.0 : 1' },
      { analyte: 'Serum ammonia', normal: '15 – 45 µg/dL', note: 'Correlates poorly with the grade of hepatic encephalopathy — treat the patient, not the ammonia' },
    ],
  },
  {
    id: 'glycaemic',
    name: 'Glucose & Diabetes',
    specimen: 'Fluoride-oxalate (grey top) for plasma glucose — a plain tube glycolyses and under-reads.',
    caveat:
      'HbA1c is unreliable exactly where anaemia is common: it is falsely LOW in haemolysis, recent blood loss, recent transfusion and pregnancy (shortened red cell lifespan), and falsely HIGH in iron-deficiency anaemia and uraemia. On an Indian ward that is a large fraction of patients.',
    rows: [
      { analyte: 'Fasting plasma glucose', normal: '70 – 99 mg/dL', note: 'Impaired fasting glucose 100–125; diabetes ≥126 on two occasions', critical: 'below 54 mg/dL — treat immediately' },
      { analyte: '2-hour post-prandial / OGTT', normal: 'below 140 mg/dL', note: 'Impaired glucose tolerance 140–199; diabetes ≥200' },
      { analyte: 'Random plasma glucose', normal: 'below 140 mg/dL', note: '≥200 with classic symptoms is diagnostic of diabetes' },
      { analyte: 'HbA1c', normal: 'below 5.7 %', note: 'Prediabetes 5.7–6.4; diabetes ≥6.5. Target on treatment is usually <7% (individualised)' },
      { analyte: 'GDM — fasting (IADPSG/DIPSI)', normal: 'below 92 mg/dL', note: 'DIPSI single-step: 75 g glucose irrespective of fasting; 2-hour ≥140 mg/dL diagnoses GDM' },
      { analyte: 'GDM — 1 hour (75 g)', normal: 'below 180 mg/dL' },
      { analyte: 'GDM — 2 hour (75 g)', normal: 'below 153 mg/dL' },
      { analyte: 'Serum ketones / beta-hydroxybutyrate', normal: 'below 0.6 mmol/L', critical: 'above 3.0 with acidosis — diabetic ketoacidosis' },
    ],
  },
  {
    id: 'lipids',
    name: 'Lipid Profile',
    specimen: '12-hour fasting sample, classically — though non-fasting is now accepted for screening except when triglycerides are very high.',
    caveat: 'LDL is calculated (Friedewald: LDL = TC − HDL − TG/5) and becomes invalid when triglycerides exceed 400 mg/dL; a direct LDL is needed then.',
    rows: [
      { analyte: 'Total cholesterol', normal: 'below 200 mg/dL', note: 'Borderline 200–239; high ≥240' },
      { analyte: 'LDL cholesterol', normal: 'below 100 mg/dL', note: 'Optimal <100; near-optimal 100–129; borderline 130–159; high 160–189; very high ≥190. Target <70 in established cardiovascular disease' },
      { analyte: 'HDL cholesterol', normal: 'above 40 mg/dL (men), above 50 (women)', note: 'Low HDL is an independent risk factor and is characteristically low in South Asians' },
      { analyte: 'Triglycerides', normal: 'below 150 mg/dL', note: 'Above 500 is a pancreatitis risk; above 1000 is a strong one' },
      { analyte: 'VLDL', normal: '2 – 30 mg/dL' },
      { analyte: 'Non-HDL cholesterol', normal: 'below 130 mg/dL', note: 'Total minus HDL. Better than LDL when triglycerides are high' },
    ],
  },
  {
    id: 'abg',
    name: 'Arterial Blood Gas',
    specimen: 'Heparinised arterial sample, on ice, analysed within 15 minutes. Expel air bubbles — they raise pO₂ and lower pCO₂.',
    caveat:
      'Read an ABG in a fixed order or you will misread it: (1) is the pH acidaemic or alkalaemic? (2) is the pCO₂ moving the same way as the pH — respiratory — or the opposite? (3) what is the bicarbonate doing? (4) is compensation appropriate? (5) calculate the anion gap in any acidosis. (6) Then, and only then, look at the oxygenation.',
    rows: [
      { analyte: 'pH', normal: '7.35 – 7.45', critical: 'below 7.20 or above 7.60' },
      { analyte: 'pCO₂', normal: '35 – 45 mmHg', si: '4.7 – 6.0 kPa', note: 'The respiratory component. Rises in hypoventilation, falls in hyperventilation' },
      { analyte: 'pO₂', normal: '80 – 100 mmHg', si: '10.6 – 13.3 kPa', critical: 'below 60 mmHg — respiratory failure' },
      { analyte: 'HCO₃⁻', normal: '22 – 26 mEq/L', note: 'The metabolic component' },
      { analyte: 'Base excess', normal: '−2 to +2 mEq/L' },
      { analyte: 'SaO₂', normal: '95 – 100 %', note: 'Remember the oxygen dissociation curve: below an SaO₂ of 90% the pO₂ falls steeply for a small further fall in saturation' },
      { analyte: 'Lactate', normal: 'below 2 mmol/L', critical: 'above 4 mmol/L — a sepsis criterion and a marker of tissue hypoperfusion' },
      { analyte: 'A–a gradient', normal: '(Age ÷ 4) + 4 mmHg', note: 'Normal gradient with hypoxia = hypoventilation or low inspired oxygen. Raised gradient = V/Q mismatch, shunt, or diffusion defect' },
      { analyte: 'PaO₂/FiO₂ ratio', normal: 'above 400', note: 'ARDS (Berlin): mild 200–300, moderate 100–200, severe below 100' },
    ],
  },
  {
    id: 'cardiac',
    name: 'Cardiac Markers',
    specimen: 'Serum. Timing is the whole test — a troponin at 1 hour of chest pain proves nothing.',
    caveat:
      'A raised troponin means myocardial injury, NOT necessarily myocardial infarction. It also rises in myocarditis, pulmonary embolism, sepsis, chronic kidney disease, heart failure, tachyarrhythmia and after defibrillation. The diagnosis of infarction needs the rise-and-fall PATTERN plus ischaemic symptoms, ECG change or imaging.',
    rows: [
      { analyte: 'Troponin I', normal: 'below 0.04 ng/mL (assay-specific)', note: 'Rises at 3–4 h, peaks 12–24 h, stays raised 7–10 days. High-sensitivity assays detect it by 1–3 h' },
      { analyte: 'Troponin T', normal: 'below 0.01 ng/mL (assay-specific)', note: 'Same time course; chronically raised in CKD' },
      { analyte: 'CK-MB', normal: 'below 25 U/L, or below 5% of total CK', note: 'Rises 4–6 h, peaks 24 h, normalises by 48–72 h — which makes it the marker for RE-infarction, where troponin is still raised from the first event' },
      { analyte: 'Total CK', normal: '30 – 200 U/L', note: 'Also raised in rhabdomyolysis, myositis, after an intramuscular injection, after strenuous exercise' },
      { analyte: 'Myoglobin', normal: 'below 85 ng/mL', note: 'Earliest to rise (1–2 h) but entirely non-specific' },
      { analyte: 'BNP', normal: 'below 100 pg/mL', note: 'Useful to RULE OUT heart failure in acute dyspnoea. Raised by age and renal failure; lowered by obesity' },
      { analyte: 'NT-proBNP', normal: 'below 300 pg/mL', note: 'Age-adjusted rule-in thresholds: 450 (<50 y), 900 (50–75 y), 1800 (>75 y)' },
    ],
  },
  {
    id: 'thyroid',
    name: 'Thyroid Function',
    specimen: 'Serum.',
    caveat:
      'TSH is the single most sensitive test in non-pituitary thyroid disease, because the pituitary responds logarithmically to free T4. But it is the WRONG first test in suspected pituitary disease and in the sick euthyroid syndrome, and it has trimester-specific ranges in pregnancy.',
    rows: [
      { analyte: 'TSH', normal: '0.4 – 4.0 mIU/L', note: 'Pregnancy: first trimester 0.1–2.5, second 0.2–3.0, third 0.3–3.0' },
      { analyte: 'Free T4', normal: '0.8 – 1.8 ng/dL', si: '10 – 23 pmol/L' },
      { analyte: 'Free T3', normal: '2.3 – 4.2 pg/mL', si: '3.5 – 6.5 pmol/L' },
      { analyte: 'Total T4', normal: '5 – 12 µg/dL', note: 'Raised by anything that raises thyroid-binding globulin — pregnancy, oestrogen, OCP — without thyrotoxicosis' },
      { analyte: 'Total T3', normal: '80 – 200 ng/dL' },
      { analyte: 'Anti-TPO antibody', normal: 'below 35 IU/mL', note: 'Positive in Hashimoto thyroiditis and in Graves disease' },
      { analyte: 'Interpretation', normal: '—', note: 'High TSH + low fT4 = primary hypothyroidism. High TSH + normal fT4 = subclinical hypothyroidism. Low TSH + high fT4 = primary thyrotoxicosis. Low TSH + low fT4 = central (pituitary) hypothyroidism or sick euthyroid' },
    ],
  },
  {
    id: 'urine',
    name: 'Urine Examination',
    specimen: 'Mid-stream clean-catch, examined within 1 hour or refrigerated.',
    caveat:
      'Dipstick BLOOD positive with NO red cells on microscopy means haemoglobinuria or myoglobinuria, not haematuria — and myoglobinuria means rhabdomyolysis and a kidney about to fail. Dipstick protein misses light chains entirely, so a normal dipstick does not exclude myeloma.',
    rows: [
      { analyte: 'Colour / appearance', normal: 'Pale yellow, clear' },
      { analyte: 'pH', normal: '4.5 – 8.0', note: 'Persistently alkaline suggests a urea-splitting organism (Proteus) or renal tubular acidosis' },
      { analyte: 'Specific gravity', normal: '1.003 – 1.030', note: 'Fixed at 1.010 (isosthenuria) in chronic kidney disease' },
      { analyte: 'Protein', normal: 'Nil / trace', note: 'Nephrotic range is >3.5 g/24 h in an adult, or a urine protein:creatinine ratio >3.5 mg/mg' },
      { analyte: 'Glucose', normal: 'Nil', note: 'Appears above a plasma glucose of ~180 mg/dL; also in renal glycosuria and pregnancy' },
      { analyte: 'Ketones', normal: 'Nil' },
      { analyte: 'Pus cells (WBC)', normal: '0 – 5 /hpf', note: 'More than 5 = pyuria. Sterile pyuria: tuberculosis, partially treated UTI, stones, analgesic nephropathy' },
      { analyte: 'RBC', normal: '0 – 2 /hpf', note: 'Dysmorphic RBCs and RBC casts mean a glomerular source' },
      { analyte: 'Casts', normal: 'Occasional hyaline', note: 'RBC cast = glomerulonephritis. WBC cast = pyelonephritis or interstitial nephritis. Granular/muddy brown cast = acute tubular necrosis. Broad waxy cast = chronic kidney disease' },
      { analyte: '24-hour urinary protein', normal: 'below 150 mg/day', note: 'In pre-eclampsia the threshold is ≥300 mg/day, or a protein:creatinine ratio ≥0.3' },
      { analyte: 'Urine culture', normal: 'No growth', note: 'Significant bacteriuria ≥10⁵ CFU/mL in a clean-catch sample; any growth in a suprapubic aspirate' },
    ],
  },
  {
    id: 'csf',
    name: 'Cerebrospinal Fluid',
    specimen: 'Lumbar puncture — after fundoscopy, and after imaging if there is any focal deficit or papilloedema.',
    caveat:
      'Send the glucose with a PAIRED capillary blood glucose taken at the same time. CSF glucose is normally about two-thirds of blood glucose, so a CSF glucose of 60 is normal in a diabetic with a blood glucose of 200 and dangerously low in a patient whose blood glucose is 70.',
    rows: [
      { analyte: 'Appearance', normal: 'Clear, colourless ("crystal clear")' },
      { analyte: 'Opening pressure', normal: '6 – 18 cmH₂O (60 – 180 mmH₂O)' },
      { analyte: 'Cells', normal: '0 – 5 lymphocytes/mm³', note: 'Any neutrophil in adult CSF is abnormal' },
      { analyte: 'Protein', normal: '15 – 45 mg/dL', note: 'Very high (>150) with few cells — Guillain-Barré (albuminocytological dissociation), spinal block (Froin syndrome)' },
      { analyte: 'Glucose', normal: '50 – 80 mg/dL, or ⅔ of blood glucose' },
      { analyte: 'Chloride', normal: '118 – 132 mEq/L', note: 'Classically low in tuberculous meningitis' },
      { analyte: 'PYOGENIC meningitis', normal: 'Turbid; 1000s of neutrophils; protein very high; glucose very low', note: '' },
      { analyte: 'TUBERCULOUS meningitis', normal: 'Cobweb clot; 100–500 lymphocytes; protein very high; glucose low; chloride low', note: '' },
      { analyte: 'VIRAL meningitis', normal: 'Clear; 10–500 lymphocytes; protein mildly high; glucose NORMAL', note: 'Normal glucose is the key discriminator' },
      { analyte: 'FUNGAL (cryptococcal)', normal: 'Clear/turbid; lymphocytes; protein high; glucose low; India ink and cryptococcal antigen positive', note: '' },
    ],
  },
  {
    id: 'pleural-ascitic',
    name: 'Pleural & Ascitic Fluid',
    specimen: 'Aspirate, with a simultaneous serum sample — both tests below are RATIOS.',
    caveat:
      'For ascites, SAAG has replaced the old transudate/exudate split, and it answers a different and better question: SAAG ≥1.1 g/dL means PORTAL HYPERTENSION is present, whatever the protein does. Quoting the exudate/transudate language for ascites is the outdated answer.',
    rows: [
      { analyte: "Light's criteria — exudate if ANY one", normal: 'Fluid:serum protein >0.5, OR fluid:serum LDH >0.6, OR fluid LDH > ⅔ upper limit of normal serum LDH', note: 'For PLEURAL fluid. Sensitive but over-calls exudates in diuretic-treated heart failure' },
      { analyte: 'Pleural transudate', normal: 'Protein <3 g/dL', note: 'Heart failure, cirrhosis, nephrotic syndrome, hypoalbuminaemia, peritoneal dialysis, Meigs syndrome' },
      { analyte: 'Pleural exudate', normal: 'Protein >3 g/dL', note: 'Tuberculosis, parapneumonic effusion, malignancy, pulmonary embolism, pancreatitis, connective tissue disease' },
      { analyte: 'Pleural fluid glucose', normal: 'Equal to serum', note: 'Low (<60) in empyema, tuberculosis, rheumatoid effusion, malignancy' },
      { analyte: 'Pleural fluid ADA', normal: 'below 40 U/L', note: 'Above 40 with a lymphocytic exudate strongly supports tuberculosis in a high-prevalence setting' },
      { analyte: 'SAAG (serum-ascites albumin gradient)', normal: 'serum albumin − ascitic albumin', note: '≥1.1 g/dL = portal hypertension (cirrhosis, heart failure, Budd-Chiari, alcoholic hepatitis). <1.1 = no portal hypertension (peritoneal tuberculosis, peritoneal carcinomatosis, nephrotic syndrome, pancreatic ascites)' },
      { analyte: 'Ascitic neutrophil count', normal: 'below 250/mm³', critical: '≥250/mm³ = spontaneous bacterial peritonitis — start antibiotics on the count, do not wait for the culture' },
    ],
  },
  {
    id: 'obstetric',
    name: 'Obstetric & Neonatal Reference',
    specimen: 'Various.',
    caveat:
      'Almost every normal range shifts in pregnancy, and several shift in the direction that would be a disease outside it — a raised alkaline phosphatase, a raised ESR, a raised white cell count, a lowered urea and creatinine, and a lowered haemoglobin are all normal in the third trimester.',
    rows: [
      { analyte: 'Haemoglobin in pregnancy', normal: '11 g/dL and above', note: 'WHO: mild 10–10.9, moderate 7–9.9, severe <7. India (NFHS) uses the same cut-offs' },
      { analyte: 'Blood pressure in pregnancy', normal: 'below 140/90 mmHg', note: 'Gestational hypertension: ≥140/90 after 20 weeks. Severe: ≥160/110' },
      { analyte: 'Proteinuria in pre-eclampsia', normal: '≥300 mg/24 h, or PCR ≥0.3, or dipstick 2+', note: 'Pre-eclampsia can now be diagnosed WITHOUT proteinuria if there is end-organ dysfunction' },
      { analyte: 'Platelet count in HELLP', normal: 'below 1,00,000/mm³', note: 'With haemolysis (LDH >600, schistocytes) and AST/ALT more than twice normal' },
      { analyte: 'Symphysio-fundal height', normal: 'In cm ≈ gestational age in weeks after 24 weeks (±2)', note: 'More than 3 cm discrepancy needs a scan' },
      { analyte: 'Fetal heart rate', normal: '110 – 160 beats/min', note: 'Bradycardia <110, tachycardia >160. Variability 6–25 bpm is reassuring' },
      { analyte: 'Amniotic fluid index', normal: '8 – 24 cm', note: 'Oligohydramnios <5 cm; polyhydramnios >25 cm' },
      { analyte: 'Johnson\'s formula (fetal weight)', normal: '(SFH in cm − n) × 155 g', note: 'n = 12 if the vertex is above the ischial spines, 11 if at or below' },
      { analyte: 'McDonald\'s rule (gestational age)', normal: 'SFH in cm × 8 ÷ 7 = weeks', note: '' },
      { analyte: 'Naegele\'s rule (EDD)', normal: 'LMP + 9 months + 7 days', note: 'Assumes a regular 28-day cycle; add or subtract the difference for a longer or shorter one' },
      { analyte: 'Neonatal heart rate', normal: '120 – 160 /min' },
      { analyte: 'Neonatal respiratory rate', normal: '30 – 60 /min', note: 'Above 60 is tachypnoea and a sign of respiratory distress' },
      { analyte: 'Neonatal blood glucose', normal: 'above 45 mg/dL', critical: 'below 40 mg/dL in the first 24 h — treat' },
      { analyte: 'Neonatal bilirubin', normal: 'Peaks day 3–5 at below 12 mg/dL in a term baby', critical: 'Jaundice on day 1, or above 15 mg/dL, or rising >5 mg/dL/day — always pathological' },
    ],
  },
];
