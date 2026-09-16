/**
 * Offline & AI Bedside Patient Clerking Synthesizer for MBBS Ward Practicals.
 * Automatically infers textbook-grade negative history, vitals, examination findings,
 * and presentation diagnoses for half-completed cases.
 */

import { askAi } from '@/lib/askAi';

export interface PatientClerkingDraft {
  patientInitials: string;
  age: string;
  sex: 'Male' | 'Female' | 'Other';
  ward: string;
  bedNo: string;
  admissionDate: string;
  chiefComplaints: string;
  hpi: string;
  pastHistory: string;
  personalHistory: string;
  vitals: string;
  generalExam: string;
  systemicExam: string;
  provisionalDiagnosis: string;
  differentialDiagnosis: string;
  investigationsPlan: string;
  updatedAt?: string;
}

export const EMPTY_CLERKING_DRAFT: PatientClerkingDraft = {
  patientInitials: '',
  age: '',
  sex: 'Male',
  ward: '',
  bedNo: '',
  admissionDate: new Date().toISOString().split('T')[0],
  chiefComplaints: '',
  hpi: '',
  pastHistory: '',
  personalHistory: '',
  vitals: '',
  generalExam: '',
  systemicExam: '',
  provisionalDiagnosis: '',
  differentialDiagnosis: '',
  investigationsPlan: '',
};

/**
 * High-yield textbook defaults synthesized from standard Indian MBBS curriculum
 * (SRB, Das, Bailey & Love, Tito Sir, Hutchison, Macleod, Nelson, Dutta).
 */
const CANONICAL_TEMPLATES: Record<string, Partial<PatientClerkingDraft>> = {
  hernia_proforma: {
    patientInitials: 'R. K.',
    age: '54',
    sex: 'Male',
    ward: 'Male Surgical Ward 3',
    bedNo: 'Bed 16',
    chiefComplaints:
      '1. Swelling in the right groin for 8 months.\n2. Dragging discomfort in the right groin on prolonged standing and heavy lifting for 2 months.',
    hpi:
      'Patient was apparently asymptomatic 8 months ago when he noticed a small peanut-sized swelling in the right groin. The swelling has gradually increased to its current lemon size.\n- The swelling appears on standing, coughing, and strenuous physical exertion.\n- Disappears spontaneously on lying down (completely reducible).\n- No history of sudden severe pain, redness, or irreducibility (no strangulation / obstruction).\n- No history of chronic cough, breathlessness, or smoking.\n- No history of straining at micturition, poor stream, hesitance, or nocturia (no BPH).\n- No history of chronic constipation or weight loss.',
    pastHistory:
      'No history of previous abdominal surgery or hernia repair. No history of diabetes, hypertension, tuberculosis, or asthma.',
    personalHistory:
      'Farmer by occupation (heavy manual laborer). Non-smoker, non-alcoholic. Mixed diet, regular bowel and bladder habits.',
    vitals:
      'Pulse: 74/min, regular, normal volume and character.\nBP: 126/80 mmHg in right arm supine.\nRR: 16/min, thoraco-abdominal.\nTemp: 98.4°F (afebrile).',
    generalExam:
      'Moderately built and nourished. No pallor, icterus, cyanosis, clubbing, generalized lymphadenopathy, or bilateral pedal edema.\nChest & spine clinically normal. External urethral meatus: normal caliber, no phimosis. Digital Rectal Examination (DRE): Grade I benign prostate enlargement, smooth, firm, non-tender, median groove preserved.',
    systemicExam:
      'LOCAL EXAMINATION OF RIGHT GROIN & SCROTUM:\n1. Inspection (Standing):\n- A single pyriform swelling of size 6 x 4 cm noted in the right inguinal region, extending into the upper scrotum (incomplete/funicular indirect hernia).\n- Extends from midway between ASIS and pubic symphysis towards the right scrotum.\n- Visible expansile cough impulse: Present.\n- Skin over swelling: Normal, no scar, sinus, or dilated veins.\n- Left groin and scrotum: Normal (no contralateral hernia).\n\n2. Palpation:\n- Swelling is non-tender, soft, elastic, and completely reducible with a palpable gurgling sound (enterocele).\n- Getting above the swelling: NOT possible (inguinoscrotal swelling).\n- Palpable expansile cough impulse: Present.\n- Deep Ring Occlusion Test: Swelling completely reduced; deep ring (1.25 cm above midinguinal point) occluded with thumb. On coughing, the swelling DOES NOT appear. On releasing thumb, the swelling bulges forward -> Positive test, confirms INDIRECT INGUINAL HERNIA.\n- Zieman Three-Finger Test: Impulse felt against the index finger placed over the deep inguinal ring.\n- External Ring Invagination Test: Little finger invaginates scrotal skin into superficial ring; expansile impulse strikes the tip of the examining finger.\n- Testis: Palpable separately from swelling in scrotum; normal size and sensation.\n\n3. Auscultation:\n- Bowel sounds heard over the groin swelling.',
    provisionalDiagnosis:
      'Right-sided, uncomplicated, reducible, incomplete indirect inguinal enterocele, secondary to chronic strenuous physical exertion.',
    differentialDiagnosis:
      '1. Right direct inguinal hernia (ruled out by positive deep ring occlusion test and pyriform shape).\n2. Right encysted hydrocele of the cord (ruled out by reducibility and cough impulse).\n3. Right femoral hernia (ruled out as swelling is above and medial to pubic tubercle).\n4. Inguinal lymphadenopathy (ruled out by reducibility and cough impulse).',
    investigationsPlan:
      '1. Routine pre-op: CBC, Blood urea, Serum creatinine, RBS, Viral markers (HIV, HBsAg, HCV), Chest X-ray, ECG.\n2. USG Abdomen & Pelvis: Confirm deep ring defect size, rule out BPH (prostate volume & post-void residual urine).\n3. Definitive Surgery: Right Lichtenstein Tension-Free Mesh Hernioplasty under Spinal Anesthesia.',
  },

  cvs_proforma: {
    patientInitials: 'M. S.',
    age: '38',
    sex: 'Female',
    ward: 'Female Medical Ward 2',
    bedNo: 'Bed 08',
    chiefComplaints:
      '1. Shortness of breath on exertion for 1 year, aggravated for the past 2 weeks (NYHA Class II progressing to Class III).\n2. Palpitations on exertion for 6 months.\n3. Paroxysmal nocturnal dyspnea and orthopnea (needs 2 pillows) for 10 days.',
    hpi:
      'Patient was in usual state of health until 1 year ago when she developed insidious dyspnea on walking uphill or climbing stairs (NYHA II). For the last 2 weeks, dyspnea is triggered by ordinary daily activities like walking inside the house (NYHA III).\n- Orthopnea present: needs 2 pillows to sleep comfortably.\n- Paroxysmal Nocturnal Dyspnea (PND): wakes up 2 hours after sleeping feeling suffocated, relieved by sitting upright.\n- History of rapid, fluttering, irregular palpitations on exertion.\n- Negative History: No chest pain, syncope, hemoptysis, fever, or swelling of feet.',
    pastHistory:
      'History of recurrent throat infections and migratory joint pain involving knee and ankle joints at age 11 (consistent with Rheumatic Fever). Completed penicillin prophylaxis until age 21.',
    personalHistory:
      'Homemaker, non-smoker, non-drinker. Vegetarian diet. Normal sleep and appetite.',
    vitals:
      'Pulse: 84 beats/min, irregularly irregular (Atrial Fibrillation), variable volume, no radio-radial or radio-femoral delay, pulse deficit of 14 bpm.\nBP: 110/76 mmHg right arm supine.\nRR: 20/min, regular.\nTemp: 98.6°F.\nJVP: Elevated 4 cm above sternal angle at 45°; prominent "v" wave, absent "a" wave.',
    generalExam:
      'Comfortable at rest. Mitral facies (malar flush with dusky cyanotic hue) present. Mild bilateral pitting pedal edema. No pallor, icterus, or clubbing.',
    systemicExam:
      'CARDIOVASCULAR SYSTEM EXAMINATION:\n1. Inspection:\n- Precordium symmetric, no chest deformity or visible pulsations.\n- Apex beat visible in left 5th intercostal space, 1 cm medial to midclavicular line.\n\n2. Palpation:\n- Apex beat: Tapping in character, localized in left 5th ICS inside midclavicular line.\n- Diastolic thrill palpable at the apex in left lateral decubitus position.\n- Parasternal heave: Grade 1 left parasternal heave palpable (RV enlargement).\n- Palpable second sound (P2) in left 2nd intercostal space (pulmonary hypertension).\n\n3. Percussion:\n- Left border corresponds to apex; right border of cardiac dullness along right sternal edge.\n\n4. Auscultation:\n- Mitral Area (Apex):\n  * First Heart Sound (S1): Loud, sharp, and snapping.\n  * Second Heart Sound (S2): Normal A2, loud P2.\n  * Opening Snap (OS): High-pitched, heard 0.08 s after S2, best heard medial to apex.\n  * Murmur: Low-pitched, rumbling mid-diastolic murmur with presystolic accentuation (lost in AF), best heard with bell of stethoscope at apex in left lateral position in expiration.',
    provisionalDiagnosis:
      'Rheumatic Heart Disease with Severe Mitral Stenosis with moderate Pulmonary Arterial Hypertension (PAH), in Atrial Fibrillation with NYHA Class III functional status, currently in compensated state.',
    differentialDiagnosis:
      '1. Left atrial myxoma (prolapse across mitral valve; postural murmur variation).\n2. Austin Flint murmur secondary to severe Aortic Regurgitation.\n3. Tricuspid stenosis (murmur increases on inspiration - Carvallo sign).\n4. Ventricular Septal Defect (pansystolic murmur).',
    investigationsPlan:
      '1. 12-Lead ECG: Coarse atrial fibrillation fibrillatory waves, right axis deviation, RVH signs.\n2. Chest X-ray (PA view): Straightening of left cardiac border (mitralization), double contour of right heart border, pulmonary venous congestion (Kerley B lines).\n3. Transthoracic Echocardiography: Assess Wilkins score (valve thickness, mobility, calcification, subvalvular thickening), Mitral Valve Area (< 1.0 cm2 = severe), mean pressure gradient, LA clot.\n4. Management: Rate control (Beta-blockers/Digoxin), oral anticoagulation (Warfarin, target INR 2.0-3.0), loop diuretics, Percutaneous Transvenous Mitral Commisurotomy (PTMC / BMV) if Wilkins score <= 8.',
  },

  respiratory_proforma: {
    patientInitials: 'S. N.',
    age: '46',
    sex: 'Male',
    ward: 'Pulmonology Ward',
    bedNo: 'Bed 04',
    chiefComplaints:
      '1. High-grade fever with chills and rigors for 5 days.\n2. Productive cough with rusty sputum for 4 days.\n3. Right-sided sharp pleuritic chest pain aggravated by deep breathing for 3 days.',
    hpi:
      'Patient had sudden onset of fever 5 days ago, high grade, associated with shaking chills and rigors, remitting partially with paracetamol.\n- Developed cough with thick, tenacious, rust-colored sputum, approx 2-3 tablespoons/day, non-foul smelling.\n- Right lower chest pain, stabbing in character, aggravated by inspiration and coughing, relieved by lying on the right side.\n- Associated with moderate dyspnea on exertion.\n- Negative: No hemoptysis, night sweats, wheezing, smoking, or history of aspiration.',
    pastHistory: 'No past history of tuberculosis, diabetes, asthma, or immunosuppression.',
    personalHistory: 'Accountant, non-smoker, occasional alcohol drinker. Mixed diet.',
    vitals:
      'Pulse: 102/min (tachycardia), regular.\nBP: 120/78 mmHg.\nRR: 26/min (tachypnea), shallow.\nSpO2: 93% on room air.\nTemp: 102.2°F.',
    generalExam:
      'Alert, flushed facies, visibly tachypneic. Cyanosis absent, no clubbing or lymphadenopathy. Mild dehydration.',
    systemicExam:
      'RESPIRATORY SYSTEM EXAMINATION:\n1. Inspection:\n- Chest symmetrical, respiratory movements reduced on right hemithorax (right infrascapular and axillary areas).\n- Trachea is central; apical impulse in left 5th ICS midclavicular line.\n\n2. Palpation:\n- Confirm central trachea; chest expansion decreased by 2 cm on right side.\n- Tactile Vocal Fremitus (TVF): Markedly increased over the right infrascapular and axillary areas.\n\n3. Percussion:\n- Dull percussion note over right infrascapular and mid/lower axillary regions.\n- Normal resonant note over left hemithorax.\n\n4. Auscultation:\n- Breath sounds: Tubular Bronchial breath sounds with prolonged expiration heard over right infrascapular area.\n- Added sounds: Late inspiratory fine crackles (crepitations) that do not clear on coughing.\n- Vocal Resonance: Markedly increased; Bronchophony and Whispering Pectoriloquy positive over right lower zone.',
    provisionalDiagnosis:
      'Community-Acquired Lobar Pneumonia of the Right Lower Lobe (Consolidation phase), CURB-65 score = 1.',
    differentialDiagnosis:
      '1. Right-sided pleural effusion (stony dull note, decreased TVF and absent breath sounds).\n2. Pulmonary tuberculosis with consolidation.\n3. Atelectasis / Lung collapse (trachea pulled to ipsilateral side, absent breath sounds).\n4. Acute pulmonary infarction.',
    investigationsPlan:
      '1. Sputum Gram stain & Culture-Sensitivity, Acid-Fast Bacilli (AFB).\n2. CBC: Leukocytosis with neutrophilia and toxic granulations; elevated CRP and procalcitonin.\n3. Chest X-ray (PA & Lateral): Dense homogeneous consolidation with prominent air bronchograms in right lower lobe.\n4. ABG: Mild hypoxemia.\n5. Treatment: Empirical IV Ceftriaxone + Azithromycin, supplemental O2, antipyretics, adequate hydration.',
  },

  abdomen_proforma: {
    patientInitials: 'K. V.',
    age: '52',
    sex: 'Male',
    ward: 'Medical Gastroenterology Ward',
    bedNo: 'Bed 19',
    chiefComplaints:
      '1. Abdominal distension for 3 months, worsening over past 3 weeks.\n2. Bilateral leg swelling for 1 month.\n3. Yellowish discoloration of eyes and dark urine for 2 weeks.',
    hpi:
      'Gradual onset progressive abdominal distension starting from lower abdomen, now generalized with everted umbilicus. Bilateral pitting pedal edema up to mid-shin.\n- Scleral jaundice noticed by family members 2 weeks ago.\n- History of fatigue, early satiety, and decreased urine output.\n- Negative: No hematemesis, melena, altered sleep-wake cycle, asterixis, or fever.',
    pastHistory: 'History of chronic ethanol intake (approx 120 g/day for 20 years). No history of blood transfusions, tattooing, or IV drug abuse.',
    personalHistory: 'Heavy alcoholic, chronic smoker (15 pack-years). Appetite poor.',
    vitals:
      'Pulse: 88/min, regular, bounding volume (hyperdynamic circulation).\nBP: 106/68 mmHg.\nRR: 18/min.\nTemp: 98.4°F.\nJVP: Normal.',
    generalExam:
      'Deep icterus of sclera, palmar erythema on thenar/hypothenar eminences, spider angiomas on upper chest (3 noted), bilateral non-tender parotid enlargement, white nails (leukonychia), bilateral pitting pedal edema. Flapping tremor (asterixis): Absent.',
    systemicExam:
      'ABDOMINAL EXAMINATION:\n1. Inspection:\n- Abdomen uniformly distended, flanks full, everted umbilicus.\n- Caput medusae / dilated tortuous superficial abdominal veins radiating from umbilicus with flow directed away from umbilicus.\n- No visible pulsations or surgical scars.\n\n2. Palpation:\n- Soft, non-tender, no localized guarding.\n- Liver: Hepatomegaly palpable 2 cm below right costal margin, hard in consistency, nodular surface, blunt margin, non-tender.\n- Spleen: Palpable 3 cm below left costal margin along axis of 10th rib, firm, non-tender with notch palpable.\n\n3. Percussion:\n- Shifting dullness: Strongly positive.\n- Fluid thrill: Positive across flanks.\n- Tympanitic resonant note around central periumbilical area.\n\n4. Auscultation:\n- Normal bowel sounds; Cruveilhier-Baumgarten venous hum absent.',
    provisionalDiagnosis:
      'Decompensated Chronic Liver Disease (Alcoholic Cirrhosis) with Clinically Significant Portal Hypertension, Grade 2 Ascites, Splenomegaly, and Jaundice, Child-Turcotte-Pugh (CTP) Class B (score 8).',
    differentialDiagnosis:
      '1. Chronic Viral Hepatitis (Hepatitis B / C cirrhosis).\n2. Non-Alcoholic Steatohepatitis (NASH) cirrhosis.\n3. Congestive hepatopathy secondary to severe Right Heart Failure.\n4. Budd-Chiari syndrome (hepatic vein thrombosis).\n5. Peritoneal tuberculosis / carcinomatosis.',
    investigationsPlan:
      '1. Liver Function Tests (LFT): Elevated total and direct bilirubin, reversed AST/ALT ratio (> 2:1), hypoalbuminemia, prolonged PT/INR.\n2. Diagnostic Paracentesis: SAAG (Serum-Ascites Albumin Gradient) > 1.1 g/dL confirms portal hypertension; ascitic fluid PMN count < 250/uL rules out SBP.\n3. USG Abdomen with Doppler: Coarse liver echotexture, nodular margins, portal vein dilation (> 13 mm), splenomegaly, moderate ascites.\n4. Upper GI Endoscopy: Grade II/III esophageal varices screening.\n5. Management: Salt restriction (< 2 g/day), Spironolactone + Furosemide, Thiamine, Propranolol for secondary variceal prophylaxis.',
  },

  cns_proforma: {
    patientInitials: 'P. D.',
    age: '63',
    sex: 'Male',
    ward: 'Neurology Ward',
    bedNo: 'Bed 11',
    chiefComplaints:
      '1. Sudden onset weakness of the right upper and lower limbs for 2 days.\n2. Inability to speak clearly with deviation of mouth to left for 2 days.',
    hpi:
      'Patient woke up 2 days ago at 6:00 AM with weakness in right arm and leg, unable to hold a cup or stand independently. Relatives noted slurred speech and mouth deviation to left.\n- No loss of consciousness, seizures, vomiting, or severe thunderclap headache.\n- No sensory loss, dysphagia, or double vision.\n- Negative: No preceding fever, trauma, or neck stiffness.',
    pastHistory: 'Hypertension for 8 years on irregular Amlodipine; Type 2 Diabetes for 5 years on Metformin. No prior TIA or stroke.',
    personalHistory: 'Retired clerk, non-smoker, non-alcoholic. Sedentary lifestyle.',
    vitals:
      'Pulse: 80/min, regular, high volume.\nBP: 168/98 mmHg right arm supine.\nRR: 16/min.\nTemp: 98.6°F.',
    generalExam:
      'Conscious, oriented to time, place, and person. No carotid bruit. Carotid and peripheral pulses palpable bilaterally.',
    systemicExam:
      'CENTRAL NERVOUS SYSTEM EXAMINATION:\n1. Higher Mental Functions:\n- Glasgow Coma Scale (GCS): 15/15 (E4V5M6).\n- Speech: Broca (motor/expressive) dysphasia; comprehension intact, repetition impaired.\n\n2. Cranial Nerves:\n- CN VII: Right Upper Motor Neuron (UMN) facial palsy; flat right nasolabial fold, drooping right angle of mouth, forehead wrinkling preserved bilaterally.\n- Other cranial nerves (I to XII) intact.\n\n3. Motor System:\n- Bulk: Symmetrical in all limbs, no wasting.\n- Tone: Increased tone (spasticity, "clasp-knife" rigidity) in right upper and lower limbs; normal on left.\n- Power:\n  * Right Upper Limb: Grade 2/5.\n  * Right Lower Limb: Grade 3/5.\n  * Left Upper & Lower Limbs: Grade 5/5.\n- Deep Tendon Reflexes (DTR):\n  * Biceps, Triceps, Supinator, Knee, Ankle: Brisk (3+) on right; normal (2+) on left.\n  * Ankle clonus: 3-4 beats on right.\n- Plantar Reflex: Extensor on right (Babinski sign positive); flexor on left.\n\n4. Sensory & Cerebellar:\n- Pain, touch, temperature, and joint position sense intact.\n- Cerebellar tests: Normal on left; impaired on right due to motor weakness.',
    provisionalDiagnosis:
      'Acute Ischemic Stroke with Right Spastic Hemiplegia with Right UMN Facial Palsy and Expressive Aphasia, localized to the Left Middle Cerebral Artery (MCA) cortical territory (internal capsule / corona radiata), secondary to atherosclerotic thromboembolism.',
    differentialDiagnosis:
      '1. Intracerebral hemorrhage (putaminal / thalamic bleed).\n2. Subdural hematoma.\n3. Space Occupying Lesion (brain tumor with peritumoral edema).\n4. Todd paralysis following unwitnessed focal seizure.',
    investigationsPlan:
      '1. Non-contrast Brain CT / MRI Brain with DWI: Acute infarct in left MCA territory; rules out hemorrhage.\n2. Carotid Doppler: Assess internal carotid artery stenosis.\n3. 2D Echo & Holter: Rule out cardioembolic source (AF, LV thrombus).\n4. Secondary prophylaxis: Aspirin + Clopidogrel (DAPT), Atorvastatin 80 mg, strict BP and blood sugar control, neuro-rehabilitation.',
  },

  thyroid_proforma: {
    patientInitials: 'A. L.',
    age: '34',
    sex: 'Female',
    ward: 'Female Surgical Ward 1',
    bedNo: 'Bed 22',
    chiefComplaints:
      '1. Swelling in the front of the lower neck for 1 year, painless and slowly growing.',
    hpi:
      'Swelling started as a small walnut-sized nodule in right lower neck, gradually enlarging to current size. Moves upward on swallowing.\n- No dysphagia (difficulty swallowing), dyspnea, or hoarseness of voice (stridor).\n- No symptoms of hyperthyroidism: no heat intolerance, tremors, sweating, palpitation, weight loss with good appetite, or loose stools.\n- No symptoms of hypothyroidism: no cold intolerance, weight gain, constipation, dry skin, or lethargy.\n- No history of neck irradiation or family history of thyroid cancer.',
    pastHistory: 'No past history of goiter, thyroid surgery, or radioactive iodine treatment.',
    personalHistory: 'Teacher, vegetarian, iodized salt consumer, non-smoker.',
    vitals: 'Pulse: 72/min, regular, normal character. BP: 118/74 mmHg. Weight stable at 56 kg.',
    generalExam:
      'Calm, comfortable, euthyroid appearance. No fine tremors of outstretched hands. Eye signs: Exophthalmos, lid lag (von Graefe), lid retraction (Dalrymple) all ABSENT. No pretibial myxedema.',
    systemicExam:
      'LOCAL EXAMINATION OF THYROID SWELLING:\n1. Inspection:\n- Solitary swelling measuring 4 x 3 cm in right thyroid lobe, lower anterior neck.\n- Moves upward synchronously with deglutition.\n- Does NOT move with tongue protrusion (rules out thyroglossal cyst).\n- Lower border of swelling clearly visible above suprasternal notch (no retrosternal extension).\n- Overlying skin: Normal, no dilated veins.\n\n2. Palpation (Examined from behind with neck slightly flexed):\n- Confirms 4 x 3 cm solitary nodule in right lobe, firm, smooth surface, well-defined margins, non-tender.\n- Moves freely with swallowing.\n- Trachea is central; carotid pulse (Berry sign) palpable bilaterally.\n- Retrosternal extension: Fingers can be insinuated between lower border and sternum.\n\n3. Percussion & Auscultation:\n- Resonant over manubrium sterni (no retrosternal goiter).\n- Auscultation: No systolic bruit over superior thyroid pole.\n\n4. Cervical Lymph Node Examination:\n- Level I to VI cervical lymph nodes palpable: NONE.',
    provisionalDiagnosis:
      'Solitary Thyroid Nodule of Right Lobe (Clinically Euthyroid), Bethesda Category II (Benign follicular nodule / Adenoma) vs Bethesda IV (Follicular neoplasm).',
    differentialDiagnosis:
      '1. Dominant nodule of Multinodular Goitre.\n2. Follicular Adenoma of Thyroid.\n3. Papillary Thyroid Carcinoma (ruled out by absence of lymph nodes, fixity, or hoarseness).\n4. Colloid cyst of thyroid.',
    investigationsPlan:
      '1. Serum Thyroid Profile: T3, T4, TSH (euthyroid expected).\n2. High-Resolution USG Neck: TIRADS categorization (composition, echogenicity, shape, margins, echogenic foci).\n3. Fine Needle Aspiration Cytology (FNAC) under USG guidance (Bethesda classification).\n4. Treatment: Right Hemithyroidectomy / Lobectomy with histopathological examination.',
  },

  breast_lump_proforma: {
    patientInitials: 'T. R.',
    age: '23',
    sex: 'Female',
    ward: 'Female Surgical Ward 2',
    bedNo: 'Bed 05',
    chiefComplaints:
      '1. Painless lump in the right breast noticed accidentally 4 months ago.',
    hpi:
      'Noticed accidentally during bathing 4 months ago. Insidious onset, slow increase in size.\n- Painless, no cyclical variation with menstrual cycles.\n- No nipple discharge, retraction, or ulceration.\n- No lump in opposite breast or axillae.\n- No constitutional symptoms (weight loss, anorexia, bone pain).',
    pastHistory: 'Menarche at 13 years, regular 28-day cycles. Nulliparous. No history of oral contraceptive pills. No family history of breast or ovarian cancer (BRCA).',
    personalHistory: 'College student, non-smoker, healthy lifestyle.',
    vitals: 'Pulse: 76/min, BP: 114/72 mmHg, Temp: 98.4°F.',
    generalExam: 'Well-built, healthy young female. No pallor, icterus, or generalized lymphadenopathy. Systemic examination normal.',
    systemicExam:
      'LOCAL EXAMINATION OF BREAST (Sitting & Supine):\n1. Inspection:\n- Breasts symmetrical; a subtle fullness in right upper outer quadrant.\n- Overlying skin: Normal, no peau d\'orange, puckering, dimpling, redness, or venous engorgement.\n- Nipple-Areolar Complex: Both nipples at same level, right nipple normal, no retraction or deviation, no discharge.\n- Arm raising and contraction of pectoralis major causes NO change or dimpling.\n\n2. Palpation:\n- Palpated with palmar surface of fingers against chest wall in all four quadrants.\n- A solitary 3 x 2.5 cm lump in upper outer quadrant of right breast, 3 cm from areola.\n- Consistency: Firm, rubbery.\n- Margins: Well-defined, smooth surface, non-tender.\n- Mobility: Exceptionally mobile in all directions beneath skin and over pectoralis major muscle ("Breast Mouse").\n- Skin over lump: Easily pinchable, completely free from the lump.\n- Fixity: Not fixed to pectoralis major or chest wall.\n\n3. Regional Lymph Nodes:\n- Anterior (pectoral), posterior (subscapular), lateral, central, and apical axillary nodes palpable: NONE.\n- Supraclavicular lymph nodes: Normal.',
    provisionalDiagnosis:
      'Benign Breast Disease: Right Breast Fibroadenoma in Upper Outer Quadrant (Triple Assessment Score: Concordant Benign).',
    differentialDiagnosis:
      '1. Phyllodes tumor (benign or borderline - fast growing, larger).\n2. Fibrocystic disease of breast (usually cyclical mastalgia, multiple lumpy areas).\n3. Breast cyst (transilluminant, tense).\n4. Carcinoma breast (hard, irregular margins, skin tethering, fixed, axillary nodes).',
    investigationsPlan:
      '1. Triple Assessment:\n  a) Clinical Examination: Concordant benign (Fibroadenoma).\n  b) Imaging: Targeted Breast Ultrasound (USG) preferred in < 30 years: Oval, circumscribed, hypoechoic lesion with wider-than-tall orientation (BI-RADS 2/3).\n  c) Pathology: Core needle biopsy or FNAC: Benign ductal and stromal elements (staghorn pattern).\n2. Treatment: Reassurance and conservative monitoring, or elective Enucleation through a circumareolar / Webster incision under local anesthesia if > 3 cm or patient requested.',
  },

  varicose_veins_proforma: {
    patientInitials: 'D. S.',
    age: '49',
    sex: 'Male',
    ward: 'Male Surgical Ward 2',
    bedNo: 'Bed 27',
    chiefComplaints:
      '1. Prominent, tortuous, dilated veins in the left lower limb for 6 years.\n2. Aching heaviness and tiredness in left calf towards the end of the day for 1 year.',
    hpi:
      'Traffic police officer with prolonged standing duties (8-10 hours/day). Dilated veins started in left medial calf, ascending to medial thigh.\n- Aching heaviness increases towards evening and after continuous standing, relieved on elevation of limb.\n- No sudden calf pain, swelling, or redness (no DVT).\n- No history of trauma, ulceration, bleeding, or abdominal swelling.',
    pastHistory: 'No history of deep vein thrombosis, pelvic surgery, or fracture of lower limbs.',
    personalHistory: 'Standing occupation, non-smoker, non-diabetic.',
    vitals: 'Pulse: 74/min, BP: 128/82 mmHg, RR: 16/min.',
    generalExam: 'Normal general survey. Abdomen examination: Normal, no pelvic mass or dilated abdominal collateral veins.',
    systemicExam:
      'LOCAL EXAMINATION OF LEFT LOWER LIMB (Standing & Supine):\n1. Inspection:\n- Dilated, tortuous, elongated superficial veins in Great Saphenous vein territory along medial aspect of left calf and thigh, up to saphenous opening in groin.\n- Skin changes: Mild hyperpigmentation (stasis dermatitis) over lower medial third of leg (gaiter zone); no lipodermatosclerosis or active ulcer.\n- Saphena Varix: A prominent bluish dilation noted 3.5 cm below and lateral to pubic tubercle.\n\n2. Palpation:\n- Dilated veins are soft, compressible, and non-tender.\n- Cough Impulse Test at Saphenofemoral Junction: Hand placed over saphenous opening, patient coughs -> expansile thrill felt (positive cough impulse confirms SFJ incompetence).\n- Schwartz Test: Tap lower varicosity; fluid impulse transmitted upward to SFJ.\n- Brodie-Trendelenburg Test I & II:\n  * Patient supine, limb elevated to empty veins. SFJ occluded with tourniquet.\n  * On standing, veins remain empty for 30 sec -> on releasing tourniquet, veins fill rapidly from above downwards -> INCOMPETENT SAPHENOFEMORAL JUNCTION (Trendelenburg I positive).\n  * Tourniquet kept applied, veins fill quickly from below within 15 sec -> INCOMPETENT PERFORATOR VEINS (Trendelenburg II positive).\n- Perthes Test (Deep Vein Patency):\n  * Tourniquet applied below SFJ, patient walks briskly for 5 mins -> varicosities collapse and no calf pain felt -> DEEP VEINS ARE PATENT.\n- Pratt Perforator Test: Localizes ankle/mid-calf blowouts.',
    provisionalDiagnosis:
      'Primary Left Great Saphenous Varicose Veins with Saphenofemoral Junction (SFJ) Incompetence and Cockett / Dodd Perforator Incompetence, CEAP Clinical Class C4a (Pigmentation/Stasis Dermatitis), with Patent Deep Vein System.',
    differentialDiagnosis:
      '1. Secondary varicose veins due to previous Deep Vein Thrombosis (post-thrombotic syndrome).\n2. Klippel-Trenaunay syndrome (congenital AV malformation with limb hypertrophy).\n3. Pelvic vein congestion syndrome.',
    investigationsPlan:
      '1. Venous Duplex Doppler Ultrasound of Lower Limbs (Gold Standard):\n  - Confirms SFJ reflux (> 0.5 sec reverse flow), evaluates perforator incompetence diameter (> 3.5 mm), and proves complete deep vein compressibility and patency.\n2. Definitive Management:\n  - Endovenous Thermal Ablation (EVLA / RFA) or Open Trendelenburg operation (Flush SFJ ligation + Great Saphenous stripping to below knee + subfascial perforator ligation). Class II compression stockings.',
  },

  goo_proforma: {
    patientInitials: 'B. M.',
    age: '48',
    sex: 'Male',
    ward: 'Male Surgical Ward 1',
    bedNo: 'Bed 14',
    chiefComplaints:
      '1. Repeated vomiting of large volumes of foul-smelling, undigested food eaten hours earlier, for 3 weeks.\n2. Burning epigastric pain for 2 years, relieved previously by food/antacids but now persistent.\n3. Significant loss of weight and appetite for 2 months.',
    hpi:
      'Long-standing history of dyspepsia and burning pain in epigastrium 2 hours after meals (duodenal ulcer). For past 3 weeks, developed fullness after few bites, followed by copious projectile vomiting occurring once or twice daily, typically in late afternoon or night.\n- Vomitus: Non-bilious, foul smelling, containing recognizable undigested food eaten hours before.\n- Vomiting provides temporary relief from pain and abdominal fullness.\n- Severe thirst, muscle cramps, and obstipation.\n- Negative: No hematemesis, melena, jaundice, or fever.',
    pastHistory: 'Chronic peptic ulcer disease for 5 years on self-prescribed antacids. Heavy NSAID use for back pain.',
    personalHistory: 'Smoker (20 pack-years), chronic stress, irregular meal habits.',
    vitals: 'Pulse: 108/min (tachycardia), feeble, low volume. BP: 98/62 mmHg (hypotension). RR: 18/min. Temp: 98.4°F.',
    generalExam:
      'Marked dehydration: dry tongue, sunken eyes, loss of skin turgor. Pallor present, emaciation. Left supraclavicular lymph node (Virchow node): Not palpable (favors benign cicatrized ulcer over gastric cancer).',
    systemicExam:
      'ABDOMINAL EXAMINATION:\n1. Inspection:\n- Upper abdomen visibly distended; lower abdomen flat / scaphoid.\n- Visible Gastric Peristalsis (VGP): Slow peristaltic waves traveling across epigastrium from left hypochondrium to right hypochondrium.\n\n2. Palpation:\n- Epigastric fullness and mild tenderness; no palpable mass in pylorus or epigastrium.\n\n3. Percussion:\n- Normal resonance; tympanitic note over dilated stomach fundus.\n\n4. Auscultation:\n- Succussion Splash: Auscultating epigastrium while shaking patient\'s pelvis -> loud splashing sound heard > 4 hours after food/water (strongly positive for gastric outlet obstruction).',
    provisionalDiagnosis:
      'Gastric Outlet Obstruction (GOO) secondary to Cicatrized Chronic Duodenal Ulcer with Hypochloremic Hypokalemic Metabolic Alkalosis with Paradoxical Aciduria.',
    differentialDiagnosis:
      '1. Carcinoma of Gastric Antrum / Pylorus (older age, hard epigastric mass, Virchow node, anorexia, malignant GOO).\n2. Adult Hypertrophic Pyloric Stenosis.\n3. Pancreatic head carcinoma or chronic pancreatitis compressing duodenum.\n4. Superior Mesenteric Artery (SMA) syndrome.',
    investigationsPlan:
      '1. Serum Electrolytes & ABG: Hypochloremia, Hypokalemia, elevated bicarbonate, metabolic alkalosis.\n2. Ryle\'s Tube Aspiration & Stomach Wash: Measure overnight aspirate (> 200 mL residual confirms GOO); normal saline stomach wash until aspirate runs clear.\n3. Upper GI Endoscopy (after 72h stomach wash): Pinpoint scarred pyloric stenosis; multiple biopsies to rule out malignancy.\n4. Management: Fluid resuscitation with 0.9% Normal Saline + KCl infusion; Truncal Vagotomy and Gastrojejunostomy (GJ) or laparoscopic balloon dilatation.',
  },

  pediatrics_proforma: {
    patientInitials: 'Baby of Kavitha',
    age: '14 months',
    sex: 'Male',
    ward: 'Pediatric Medical Ward',
    bedNo: 'Crib 06',
    chiefComplaints:
      '1. Watery loose stools, 8-10 episodes per day, for 2 days.\n2. Non-projectile vomiting, 4-5 episodes per day, for 2 days.\n3. Excessive thirst and irritability for 1 day.',
    hpi:
      'Child was well until 2 days ago when he developed sudden onset watery, yellowish stools without blood or mucus. Vomiting occurred after every feed.\n- Decreased urine output (only 2 wet diapers in last 12 hours).\n- Mother reports child eagerly drinks water when offered.\n- Negative: No high fever, convulsions, lethargy, or unconsciousness.',
    pastHistory: 'Birth weight: 2.8 kg, delivered at term normal vaginal delivery, cried immediately at birth. Exclusive breastfeeding for 6 months, complementary feeding started at 6 months.',
    personalHistory: 'Immunization: Up to date as per National Immunization Schedule (NIS) including BCG, OPV, Pentavalent, Rotavirus, and MR 1st dose.',
    vitals:
      'Heart Rate: 130/min (tachycardia for age).\nRR: 34/min (no chest indrawing).\nTemp: 99.0°F.\nCapillary Refill Time (CRT): 2 seconds.\nWeight: 8.4 kg (mild weight drop from 9.0 kg).',
    generalExam:
      'Assessment of Dehydration (WHO Integrated Management of Neonatal & Childhood Illness - IMNCI):\n1. Condition: Irritable and restless.\n2. Eyes: Sunken.\n3. Thirst: Eager to drink, thirsty.\n4. Skin Pinch (Abdomen): Goes back slowly (between 1 and 2 seconds).\n-> Classified as SOME DEHYDRATION (Moderate).',
    systemicExam:
      'Abdomen: Soft, mild generalized distension, no tenderness or organomegaly. Hyperactive bowel sounds.\nRespiratory: Symmetrical, bilateral clear breath sounds.\nCVS: S1 and S2 heard, no murmur.\nCNS: Alert, anterior fontanelle slightly depressed, no neck stiffness or kernig sign.',
    provisionalDiagnosis:
      'Acute Watery Diarrhea (likely viral - Rotavirus / Norovirus) with Some (Moderate) Dehydration, IMNCI Plan B.',
    differentialDiagnosis:
      '1. Bacterial Dysentery (Shigella, Salmonella - ruled out by lack of blood/mucus and high fever).\n2. Extra-intestinal infection: Urinary Tract Infection (UTI), Otitis Media.\n3. Lactose intolerance secondary to mucosal injury.',
    investigationsPlan:
      '1. Stool microscopy, routine & reducing substances.\n2. Serum electrolytes, BUN, creatinine.\n3. Management (WHO Plan B):\n  - Reduced Osmolarity ORS: 75 mL/kg over 4 hours (approx 630 mL over 4 hours) with spoon/cup.\n  - Reassess after 4 hours.\n  - Continue breastfeeding.\n  - Zinc supplementation: 20 mg/day for 14 days.\n  - Probiotics and age-appropriate feeding as soon as rehydrated.',
  },

  orthopaedics_proforma: {
    patientInitials: 'Master Rahul',
    age: '10',
    sex: 'Male',
    ward: 'Orthopaedics Ward',
    bedNo: 'Bed 03',
    chiefComplaints:
      '1. Pain, swelling, and deformity of the right elbow following a fall on an outstretched hand 6 hours ago.',
    hpi:
      'Child was playing in the school playground when he slipped from a swing and fell onto his outstretched right hand with the elbow in extension. Immediately developed intense pain, inability to move the right elbow, and rapidly progressive swelling.\n- No open wound or active bleeding.\n- Sensation over thumb, index finger, and hand intact.\n- No other injuries (no head injury or loss of consciousness).',
    pastHistory: 'No previous fractures or joint dislocations. Bone health normal.',
    personalHistory: 'School student, active sports player.',
    vitals: 'Pulse: 96/min, regular, strong. BP: 104/68 mmHg. Temp: 98.4°F.',
    generalExam: 'Conscious, cooperative child with right upper extremity supported in a sling by his mother. Systemic exam normal.',
    systemicExam:
      'LOCAL EXAMINATION OF RIGHT ELBOW & FOREARM:\n1. Inspection:\n- Gross S-shaped deformity of the elbow with prominent olecranon posteriorly and fullness in the cubital fossa anteriorly.\n- Significant swelling around elbow with ecchymosis in antecubital fossa.\n- Carrying angle cannot be assessed due to pain.\n- No puckering of skin (no brisement cutané / skin tethering by proximal fragment).\n\n2. Palpation:\n- Marked tenderness over distal humerus, 2 cm above epicondyles.\n- Three-Point Bony Relationship of Elbow:\n  * In 90° flexion: Medial epicondyle, lateral epicondyle, and olecranon process form an EQUILATERAL TRIANGLE.\n  * This equilateral relationship is MAINTAINED in supracondylar fracture (KEY sign distinguishing it from elbow dislocation where the triangle is disrupted!).\n- Distal Vascular & Nerve Status (CRITICAL):\n  * Radial pulse: Palpable, synchronous with left side, capillary refill time < 2 seconds.\n  * Anterior Interosseous Nerve (AIN - Branch of Median Nerve): Tested by "OK sign" (flexion of DIP joint of index finger by FDP and IP of thumb by FPL) -> Normal.\n  * Radial Nerve: Active extension of wrist and fingers against gravity -> Intact.\n  * Ulnar Nerve: Finger abduction (dorsal interossei) and sensation over little finger -> Intact.',
    provisionalDiagnosis:
      'Closed Extension-Type Supracondylar Fracture of the Right Humerus (Gartland Type IIB / Type III) without Neurovascular Deficit.',
    differentialDiagnosis:
      '1. Posterior dislocation of the elbow (distrupted equilateral triangle of three bony landmarks).\n2. Fracture lateral condyle of humerus (Milkman fracture).\n3. Intercondylar / T-shaped fracture of humerus.',
    investigationsPlan:
      '1. Plain Radiographs of Right Elbow: True AP and Lateral views.\n  - Anterior Humeral Line: Should intersect the middle third of the capitellum (in extension injury, it passes anterior to capitellum).\n  - Baumann\'s Angle (70-75°): Evaluates coronal alignment and avoids cubitus varus (gunstock deformity).\n  - Fat pad sign (sail sign) on lateral view.\n2. Management: Closed Reduction and Percutaneous Pinning (CRPP) with two or three divergent lateral K-wires under C-arm fluoroscopy and general anesthesia, followed by posterior slab at 90° flexion. Monitor for Volkmann Ischemia / Compartment Syndrome.',
  },

  obgyn_proforma: {
    patientInitials: 'Mrs. Priya',
    age: '25',
    sex: 'Female',
    ward: 'Antenatal Ward',
    bedNo: 'Bed 12',
    chiefComplaints:
      '1. Amenorrhea for 9 months (38 weeks + 2 days).\n2. Regular antenatal check-up; noticed mild swelling of both feet for 10 days.',
    hpi:
      'Primi, married for 2 years, non-consanguineous marriage, spontaneous conception.\n- Last Menstrual Period (LMP): 12th December. Expected Date of Delivery (EDD by Naegele rule): 19th September.\n- Gestational Age: 38 weeks 2 days.\n- 1st Trimester: Ultrasound dating scan concordant, folic acid taken, no bleeding per vaginam or excessive hyperemesis.\n- 2nd Trimester: Quickening felt at 18 weeks. Anomaly scan at 19 weeks normal. 2 doses of Td vaccine taken. Oral iron and calcium adhered to.\n- 3rd Trimester: Good fetal movements (> 10/day - Cardiff count). Mild pedal edema noticed in evening. No headache, visual blurring, epigastric pain, or vomiting (no impending eclampsia symptoms).\n- No labor pains, leaking, or bleeding per vaginam.',
    pastHistory: 'No history of chronic hypertension, pre-gestational diabetes, renal disease, or bronchial asthma.',
    personalHistory: 'Diet: mixed, adequate calories. Blood Group: B positive (husband B positive - no Rh isoimmunization risk).',
    vitals:
      'Pulse: 78/min, regular.\nBP: 138/88 mmHg right arm sitting (borderline gestational hypertension).\nRR: 16/min.\nTemp: 98.4°F.\nWeight: 64 kg (total weight gain 11 kg in pregnancy).',
    generalExam:
      'Well-nourished, mild bilateral pitting ankle edema (+1). No pallor, icterus, or facial puffiness. Deep tendon reflexes (knee jerk): Normal (2+), no clonus.',
    systemicExam:
      'OBSTETRIC ABDOMINAL EXAMINATION:\n1. Inspection:\n- Abdomen uniformly distended, longitudinally ovoid.\n- Linea nigra and striae gravidarum present, umbilicus flat.\n- No surgical scars or visible fetal movements.\n\n2. Palpation:\n- Fundal Height: Corresponds to 36-38 weeks (symphysio-fundal height: 37 cm).\n- Fundal Grip: Broad, soft, irregular, non-ballottable mass occupying fundus -> Breech in fundus.\n- Lateral Grips:\n  * Left lateral grip: Smooth, continuous, curved, firm resistance -> Fetal Back on maternal left.\n  * Right lateral grip: Small, knobby, irregular, movable parts -> Fetal Limbs on maternal right.\n- First Pelvic Grip (Pawlik Grip):\n  * Hard, smooth, spherical, ballottable mass -> Fetal Head.\n- Second Pelvic Grip:\n  * Converging fingers indicate head is NOT engaged (floating / free head).\n\n3. Auscultation:\n- Fetal Heart Rate (FHR): 140 beats/min, regular, loud and clear, best heard in left lower quadrant midway between umbilicus and ASIS.',
    provisionalDiagnosis:
      'Term Primigravida at 38 weeks 2 days of Gestation, Single Live Intrauterine Fetus, in Longitudinal Lie, Cephalic Presentation, Left Occipito-Anterior (LOA) position, Unengaged Head, with Gestational Hypertension without Severe Features, Not in Labor.',
    differentialDiagnosis:
      '1. Preeclampsia without severe features (requires urine protein verification).\n2. Gestational Diabetes Mellitus (GDM).\n3. Intrauterine Growth Restriction (ruled out by symphysio-fundal height concordant with dates).',
    investigationsPlan:
      '1. Urine Albumin by dipstick (rule out proteinuria) and 24h urine protein or spot urine protein-to-creatinine ratio.\n2. Obstetric Ultrasound: Fetal biometry (BPD, HC, AC, FL), estimated fetal weight, Amniotic Fluid Index (AFI normal 8-18 cm), placental maturity (Grade III, fundal).\n3. Non-Stress Test (NST): Reactive pattern (baseline 140 bpm, 2 accelerations of 15 bpm for 15 sec in 20 min, no decelerations).\n4. Plan: Await spontaneous onset of labor until 40 weeks with bi-weekly maternal BP monitoring and fetal kick counts; offer cervical ripening and induction of labor if BP increases >= 140/90 mmHg.',
  },
};

/**
 * Returns a complete case synthesis for the requested proforma.
 */
export function getCanonicalCaseDraft(
  proformaId: string,
  userPartial: Partial<PatientClerkingDraft> = {},
): PatientClerkingDraft {
  const template = CANONICAL_TEMPLATES[proformaId] ?? CANONICAL_TEMPLATES.hernia_proforma;
  return {
    ...EMPTY_CLERKING_DRAFT,
    ...template,
    ...userPartial,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * AI Auto-Fill Synthesizer:
 * Uses ask-gemini (via askAi) with a medical prompt if online,
 * or falls back seamlessly to canonical textbook MBBS templates if offline.
 */
export async function autoFillClinicalCase(
  proformaId: string,
  currentDraft: PatientClerkingDraft,
  proformaTitle: string,
  proformaSystem: string,
): Promise<PatientClerkingDraft> {
  const fallback = getCanonicalCaseDraft(proformaId, currentDraft);

  // If user has provided chief complaints or age/sex, try to invoke AI
  const prompt = `Triple-tapped: You are an expert MBBS Clinical Professor and Practical Examiner in India.
A medical student is clerking a clinical case for presentation tomorrow morning but only completed half of it.
Proforma: ${proformaTitle} (${proformaSystem})
Patient: ${currentDraft.patientInitials || fallback.patientInitials}, ${currentDraft.age || fallback.age} y/o ${currentDraft.sex || fallback.sex}
Chief Complaints entered by student: "${currentDraft.chiefComplaints || fallback.chiefComplaints}"
HPI entered so far: "${currentDraft.hpi || ''}"

TASK: Complete the case presentation with realistic, textbook-grade negative history, vitals, general exam, systemic examination findings, provisional diagnosis, differential diagnoses, and investigations plan.
RESPOND WITH HIGH-YIELD MBBS PRACTICAL FORMAT.`;

  try {
    const res = await askAi(prompt, []);
    if (res?.text && res.text.length > 80) {
      // Intelligently merge AI response into empty or partial sections
      const sections = parseAiClinicalResponse(res.text);
      return {
        ...fallback,
        hpi: currentDraft.hpi?.trim() || sections.hpi || fallback.hpi,
        vitals: currentDraft.vitals?.trim() || sections.vitals || fallback.vitals,
        generalExam: currentDraft.generalExam?.trim() || sections.generalExam || fallback.generalExam,
        systemicExam: currentDraft.systemicExam?.trim() || sections.systemicExam || fallback.systemicExam,
        provisionalDiagnosis: currentDraft.provisionalDiagnosis?.trim() || sections.diagnosis || fallback.provisionalDiagnosis,
        differentialDiagnosis: currentDraft.differentialDiagnosis?.trim() || sections.differential || fallback.differentialDiagnosis,
        investigationsPlan: currentDraft.investigationsPlan?.trim() || sections.investigations || fallback.investigationsPlan,
        updatedAt: new Date().toISOString(),
      };
    }
  } catch {
    // Offline or network error: return canonical textbook synthesis
  }

  return fallback;
}

/**
 * Extracts sections from prose response if returned in structured headings
 */
function parseAiClinicalResponse(text: string): {
  hpi?: string;
  vitals?: string;
  generalExam?: string;
  systemicExam?: string;
  diagnosis?: string;
  differential?: string;
  investigations?: string;
} {
  const clean = text.replace(/[*#]/g, '');
  const findPart = (keywords: string[]): string | undefined => {
    for (const kw of keywords) {
      const idx = clean.toLowerCase().indexOf(kw.toLowerCase());
      if (idx !== -1) {
        const slice = clean.slice(idx + kw.length, idx + 800).trim();
        const nextBreak = slice.search(/\n[A-Z0-9\s-]{4,25}:/);
        return nextBreak !== -1 ? slice.slice(0, nextBreak).trim() : slice;
      }
    }
    return undefined;
  };

  return {
    hpi: findPart(['history of present illness', 'HPI:']),
    vitals: findPart(['vitals:', 'vital signs:']),
    generalExam: findPart(['general physical examination:', 'general exam:']),
    systemicExam: findPart(['systemic examination:', 'local examination:']),
    diagnosis: findPart(['provisional diagnosis:', 'diagnosis:']),
    differential: findPart(['differential diagnosis:', 'differentials:']),
    investigations: findPart(['investigations & management:', 'investigations plan:']),
  };
}
