/**
 * Canonical Clinical Case Proformas for MBBS Practicals & Ward Clerking.
 * Synthesized from MMC, Stanley, AIIMS, Tito Sir, Das, Bailey & Love, and Indian Medical Universities.
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

export interface ClinicalProforma {
  id: string;
  title: string;
  system: 'General Medicine' | 'General Surgery' | 'Pediatrics' | 'Orthopaedics' | 'Obstetrics & Gynaecology';
  department: string;
  summary: string;
  examPearl: string;
  diagramPath?: string;
  diagramTitle?: string;
  sections: ProformaSection[];
  vivaQuestions: VivaQuestion[];
}

export const CLINICAL_PROFORMAS: ClinicalProforma[] = [
  // 1. MEDICINE - CVS
  {
    id: 'cvs_proforma',
    title: 'Cardiovascular System (CVS) Case Proforma',
    system: 'General Medicine',
    department: 'Cardiology / General Medicine',
    summary: 'Master examination proforma for Rheumatic Heart Disease (MS, MR, AS, AR), Congestive Heart Failure, and IHD.',
    examPearl: 'Always examine the pulse before the heart, and palpate the carotid pulse while auscultating heart sounds to reliably identify S1.',
    diagramPath: '/diagrams/clinical/mitral_stenosis_murmur.jpg',
    diagramTitle: 'Mitral Stenosis: Wiggers, PCG & Murmur Radiation',
    sections: [
      {
        title: '1. Patient Demographics & History',
        items: [
          {
            label: 'Chief Complaints',
            description: 'Record in chronological order with duration in days/months.',
            checklist: [
              'Chest pain (onset, location, radiation to left arm/jaw, character, relieving/aggravating factors)',
              'Breathlessness / Dyspnea (NYHA Functional Class I to IV)',
              'Orthopnea (number of pillows needed to sleep comfortably)',
              'Paroxysmal Nocturnal Dyspnea (waking up 2-3 hours after sleep gasping for air)',
              'Palpitations (sudden vs gradual, regular vs irregular)',
              'Syncope or presyncope (on exertion vs postural)',
              'Bilateral pedal edema (evening onset, ascending)',
            ],
          },
          {
            label: 'History of Present Illness (HPI)',
            description: 'Elaborate each symptom, negative history (no fever, no hemoptysis, no jaundice, no joint pains, no rash).',
          },
          {
            label: 'Past & Treatment History',
            description: 'History of sore throat / migratory polyarthritis in childhood (Jones criteria), monthly penicillin prophylaxis, hypertension, diabetes mellitus, coronary interventions.',
          },
        ],
      },
      {
        title: '2. General Physical Examination',
        items: [
          {
            label: 'Arterial Pulse',
            description: 'Examine right radial artery for 1 full minute.',
            checklist: [
              'Rate: beats/min (tachycardia > 100, bradycardia < 60)',
              'Rhythm: Regular vs Regularly irregular vs Irregularly irregular (Atrial Fibrillation with pulse deficit)',
              'Volume: Small volume (Pulsus parvus) vs Large volume (Bounding / Water-hammer / Collapsing)',
              'Character: Pulsus bisferiens (AS+AR), Pulsus alternans (LV failure), Pulsus paradoxus (cardiac tamponade, severe asthma)',
              'Vessel wall condition: Thickened / tortuous (Monckeberg arteriosclerosis)',
              'Radio-radial & Radio-femoral delay: Checked to rule out Coarctation of Aorta',
              'Peripheral pulses: Carotid, brachial, radial, femoral, popliteal, posterior tibial, dorsalis pedis',
            ],
          },
          {
            label: 'Blood Pressure & JVP',
            description: 'Measure BP in right arm supine and standing. JVP measured at 45 degrees head elevation with tangentially directed light.',
            checklist: [
              'JVP vertical height above sternal angle (normal < 3 cm or < 8 cm H2O total venous pressure)',
              'Waveforms: Prominent a wave (pulmonary stenosis, pulmonary hypertension), Cannon a wave (complete heart block, ventricular tachycardia)',
              'Prominent v wave (tricuspid regurgitation), absent a wave (atrial fibrillation)',
              'Abdomino-jugular (hepato-jugular) reflux test: Positive if JVP sustained elevation > 4 cm for 15 sec',
              'Kussmaul sign: Paradoxical rise of JVP on inspiration (constrictive pericarditis, RV infarction)',
            ],
          },
          {
            label: 'Infective Endocarditis & Peripheral Signs',
            description: 'Inspect hands, eyes, mouth, and skin.',
            checklist: [
              'Clubbing (cyanotic congenital heart disease, IE)',
              'Splinter hemorrhages in nail beds',
              'Janeway lesions: Painless erythematous macules on palms/soles (embolic)',
              'Osler nodes: Painful nodular lesions on pulp of fingers/toes (immune-complex)',
              'Roth spots on fundus (retinal hemorrhages with pale centers)',
              'Corrigan sign (dancing carotids), Quincke sign (capillary pulsations in nail bed in AR)',
            ],
          },
        ],
      },
      {
        title: '3. Systemic Examination of Precordium',
        items: [
          {
            label: 'Inspection',
            description: 'Patient supine at 45 degrees; inspect precordial contour and impulses.',
            checklist: [
              'Chest wall symmetry, pectus excavatum or carinatum, kyphoscoliosis',
              'Apical impulse visible location and extent (normally 5th ICS inside MCL)',
              'Parasternal pulsations (RV enlargement), epigastric pulsation',
              'Suprasternal / aortic arch pulsations, dilated collateral veins',
              'Scars: Median sternotomy (CABG/valve replacement), left lateral thoracotomy (mitral valvotomy)',
            ],
          },
          {
            label: 'Palpation',
            description: 'Confirm findings with warm hands.',
            checklist: [
              'Apex Beat: Definite outermost and downmost point of maximum cardiac impulse (normal: 5th ICS, 1 cm medial to midclavicular line)',
              'Apex Character: Hyperdynamic / Tapping (palpable S1 in MS) vs Heaving / Sustained (LVH in AS/HTN) vs Dyskinetic',
              'Parasternal Heave: Palpate left sternal border with heel of right hand (Grade 1 to 3 RV enlargement)',
              'Palpable Heart Sounds: Palpable S1 at apex (MS), Palpable P2 at pulmonary area (pulmonary hypertension)',
              'Thrills: Palpable murmurs (Systolic thrill in AS at aortic area; Diastolic thrill in MS at apex in left lateral position)',
            ],
          },
          {
            label: 'Percussion',
            description: 'Delineate cardiac dullness (left border, right border, and upper border at 3rd left rib).',
          },
          {
            label: 'Auscultation',
            description: 'Listen methodically across all 4 areas with diaphragm and bell: Mitral area (apex), Tricuspid area (lower left sternal border), Aortic area (2nd right ICS), Pulmonary area (2nd left ICS), and Erb point (3rd left ICS).',
            checklist: [
              'First Heart Sound (S1): Loud in Mitral Stenosis; Soft in Mitral Regurgitation or PR prolongation',
              'Second Heart Sound (S2): A2 and P2 split (Normal physiological split on inspiration vs Wide fixed split in ASD vs Paradoxical reverse split in severe AS / LBBB)',
              'Added Sounds: S3 (ventricular gallop in heart failure or volume overload), S4 (atrial gallop in LVH / stiff ventricle)',
              'Opening Snap (OS): High-pitched diastolic sound following A2 in Mitral Stenosis; shorter A2-OS interval denotes more severe MS!',
              'Murmurs: Grade 1 to 6 (Levine scale), timing (systolic vs diastolic), pitch, shape (crescendo-decrescendo, pansystolic, rumbling), and radiation (MR to axilla, AS to carotids)',
              'Dynamic Auscultation: Left lateral decubitus + bell for MS mid-diastolic rumble; Leaning forward in expiration for AR early diastolic murmur; Valsalva maneuver differentiates HOCM (louder) from AS (softer)',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'How do you differentiate a tapping apex beat from a heaving apex beat?',
        answer: 'A tapping apex beat is a palpable first heart sound (S1) imparted against the chest wall in mitral stenosis with pliable leaflets; it does not sustain under your fingers. A heaving apex beat is a sustained systolic lift that forces your palpating fingers upwards throughout systole, indicating left ventricular pressure overload (e.g., severe aortic stenosis, systemic hypertension).',
        examinerTip: 'Always mention that in mitral stenosis, the LV is underfilled and small, so the apex is formed by the enlarged right ventricle pushing the LV backwards!',
      },
      {
        question: 'What is Carey Coombs murmur and how does it differ from the Austin Flint murmur?',
        answer: 'Carey Coombs murmur is a soft, mid-diastolic murmur heard at the apex during acute rheumatic carditis due to active valvulitis and edema of mitral valve leaflets. Austin Flint murmur is a low-pitched mid-diastolic/presystolic apical rumble heard in severe aortic regurgitation, caused by the regurgitant aortic jet impinging on the anterior mitral valve leaflet and displacing it.',
        examinerTip: 'Remember: Carey Coombs has no opening snap and disappears once carditis resolves; Austin Flint is associated with wide pulse pressure and peripheral signs of AR.',
      },
      {
        question: 'Why is the A2-OS interval inversely proportional to the severity of Mitral Stenosis?',
        answer: 'The Opening Snap occurs when the left ventricular pressure drops below left atrial pressure, causing the stenosed mitral valve to dome open. In severe mitral stenosis, the left atrial pressure is markedly elevated (e.g., 25-30 mmHg instead of 8 mmHg). Therefore, LV pressure drops below LA pressure much earlier in diastole, causing the valve to snap open rapidly, narrowing the A2-OS interval (< 80 ms indicates severe MS).',
        examinerTip: 'Examiners love to ask: "What does it mean if the opening snap disappears?" Answer: The mitral valve leaflets have become heavily calcified and rigid, requiring balloon valvotomy or replacement rather than closed commissurotomy.',
      },
      {
        question: 'What is Graham Steell murmur?',
        answer: 'A high-pitched, blowing early diastolic decrescendo murmur heard along the upper left sternal border due to pulmonary regurgitation secondary to severe pulmonary hypertension (pulmonary artery systolic pressure > 50 mmHg).',
        examinerTip: 'Contrast it with the early diastolic murmur of Aortic Regurgitation by checking peripheral signs (wide pulse pressure in AR, absent in Graham Steell) and inspiratory accentuation (Carvallo sign).',
      },
    ],
  },

  // 2. MEDICINE - RESPIRATORY
  {
    id: 'respiratory_proforma',
    title: 'Respiratory System (RS) Case Proforma',
    system: 'General Medicine',
    department: 'Pulmonology / General Medicine',
    summary: 'Master examination proforma for Pleural Effusion, Lobar Consolidation (Pneumonia), Pneumothorax, COPD, Bronchiectasis, and Lung Collapse.',
    examPearl: 'Tracheal tug and shift is your anchor. In pleural effusion and pneumothorax, the trachea shifts AWAY from the lesion; in collapse and fibrosis, it shifts TOWARDS the lesion; in consolidation, it remains CENTRAL.',
    diagramPath: '/diagrams/clinical/consolidation_vs_pleural_effusion.jpg',
    diagramTitle: 'Physical Signs: Consolidation vs Pleural Effusion',
    sections: [
      {
        title: '1. History & Symptoms',
        items: [
          {
            label: 'Chief Complaints',
            description: 'Chronological recording with duration.',
            checklist: [
              'Cough: Dry vs Productive, acute (< 3 weeks) vs chronic (> 8 weeks)',
              'Sputum: Amount (copious three-layered in bronchiectasis), color (rusty in pneumococcal pneumonia, pink frothy in pulmonary edema, foul-smelling in anaerobic lung abscess)',
              'Hemoptysis: Streaky vs Massive (> 200 mL/24h in TB, bronchiectasis, malignancy, aspergilloma)',
              'Chest Pain: Pleuritic (sharp, knife-like, aggravated by deep inspiration/cough, relieved by holding breath or lying on affected side)',
              'Breathlessness: mMRC Dyspnea scale grade 0 to 4',
              'Wheeze & Stridor: Expiratory polyphonic wheeze in COPD/asthma; Inspiratory monophonic stridor in upper airway obstruction',
              'Constitutional symptoms: Low-grade evening fever with drenching night sweats and weight loss (tuberculosis)',
            ],
          },
          {
            label: 'Occupational & Smoking History',
            description: 'Calculate pack-years (packs/day x years). Inquire about exposure to silica, asbestos, biomass fuel smoke, pigeon droppings (extrinsic allergic alveolitis).',
          },
        ],
      },
      {
        title: '2. General & Upper Airway Examination',
        items: [
          {
            label: 'General Signs',
            description: 'Assess respiratory rate, pattern, cyanosis, and clubbing.',
            checklist: [
              'Respiratory rate & pattern: Tachypnea (> 20/min), Kussmaul (metabolic acidosis), Cheyne-Stokes (heart failure, brainstem lesion)',
              'Accessory muscle usage: Sternocleidomastoid and scalene contraction, supraclavicular/intercostal indrawing',
              'Pursed-lip breathing: Prolonged expiratory phase (pink puffer in emphysema)',
              'Clubbing Grade 1 to 4: Schamroth sign obliteration, Lovibond angle > 180 degrees (causes: bronchiectasis, lung abscess, bronchogenic carcinoma, empyema, IPF — NOT simple COPD or asthma!)',
              'Cyanosis: Central cyanosis (tongue, mucous membranes; SaO2 < 85%) vs Peripheral (fingertips)',
              'Horner syndrome stigmata: Unilateral ptosis, miosis, anhidrosis, enophthalmos (Pancoast superior sulcus tumor)',
            ],
          },
        ],
      },
      {
        title: '3. Systemic Chest Examination',
        items: [
          {
            label: 'Inspection',
            description: 'Examine anteriorly and posteriorly.',
            checklist: [
              'Shape of chest: Normal elliptical (AP:transverse ratio 5:7) vs Barrel chest (ratio 1:1, increased AP diameter in COPD)',
              'Spine: Kyphosis, scoliosis, Gibbus deformity (Pott spine)',
              'Chest symmetry and movement: Drooping of shoulder, flattening of chest wall, crowding of ribs (fibrosis/collapse) vs fullness of intercostal spaces (effusion/pneumothorax)',
              'Respiratory excursion: Diminished chest expansion on the affected side',
              'Pulsations and scars: Intercostal drain (ICD) scar in 5th ICS anterior axillary line, thoracotomy scar',
            ],
          },
          {
            label: 'Palpation',
            description: 'Confirm inspection findings with warm hands.',
            checklist: [
              'Tracheal Position: Trail sign (prominence of sternocleidomastoid on side of deviation); palpate trachea in suprasternal notch with index and ring finger on sternoclavicular joints and middle finger gently sliding into trachea space',
              'Apical Impulse: Position and shift of mediastinum',
              'Chest Expansion: Measure with tape at nipple level (normal > 5 cm); measure right vs left hemithorax using hands clamped around lower ribs with thumbs touching at midline',
              'Tactile Vocal Fremitus (TVF): Feel vibrations of "ninety-nine" with ulnar border of hand across symmetric lung zones (Increased in Consolidation; Decreased/Absent in Pleural Effusion, Pneumothorax, Collapse)',
              'Tenderness / Subcutaneous emphysema: Crepitus on pressing chest wall (surgical emphysema, fractured ribs)',
            ],
          },
          {
            label: 'Percussion',
            description: 'Percuss symmetrically from apices down to bases (anterior, axillary, posterior). Note Kronig isthmus (normal 4-6 cm resonant band over apex of lung).',
            checklist: [
              'Resonant: Normal aerated lung',
              'Hyperresonant: Pneumothorax, emphysematous bullae',
              'Dull: Lobar consolidation, atelectasis, thickened pleura',
              'Stony Dull: Pleural effusion (woody/wooden resistance felt by pleximeter finger)',
              'Upper border of liver dullness: Normally 5th right ICS midclavicular line (pushed down in emphysema; obliterated in pneumoperitoneum)',
              'Traube space: Boundaries: Left 6th rib superiorly, left midaxillary line laterally, left costal margin inferiorly. Normally tympanitic (gastric bubble); dull in splenomegaly, left pleural effusion, cardiomegaly, full stomach',
              'Ellis S-shaped curve: Upper margin of dullness in moderate pleural effusion (highest in axilla)',
            ],
          },
          {
            label: 'Auscultation',
            description: 'Listen with diaphragm over all lung zones during quiet and deep oral breathing.',
            checklist: [
              'Breath Sounds: Vesicular (rustling, inspiratory phase longer, no pause) vs Bronchial (hollow, blowing, equal inspiratory and expiratory phases with distinct silent pause between them)',
              'Tubular / Bronchial breathing causes: Consolidation with patent bronchus, top of pleural effusion (condensed lung), cavity communicating with bronchus',
              'Vocal Resonance: Spoken "ninety-nine" auscultated (Bronchophony: loud clear sound; Pectoriloquy: whispered words clearly audible over consolidation)',
              'Aegophony: "E-to-A" change (nasal, bleating quality of voice through compressed lung above an effusion)',
              'Adventitious / Added Sounds: Crackles / Crepitations (Fine late-inspiratory in pulmonary edema/fibrosis; Coarse pan-inspiratory in bronchiectasis/pneumonia; Early inspiratory in COPD)',
              'Wheezes / Rhonchi: Continuous musical sounds (polyphonic in asthma/COPD; monophonic in fixed bronchial tumor)',
              'Pleural Friction Rub: Grating, leathery sound heard in both inspiration and expiration over inflamed pleura; disappears when effusion accumulates',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'What are the 4 classical physical signs that differentiate Consolidation from Pleural Effusion?',
        answer: '1) Mediastinal shift: Trachea & apex are CENTRAL in consolidation; shifted AWAY from the lesion in pleural effusion. 2) Percussion note: DULL in consolidation; STONY DULL in effusion. 3) Tactile Vocal Fremitus (TVF) & Vocal Resonance (VR): MARKEDLY INCREASED with bronchophony and whispered pectoriloquy in consolidation; DECREASED or ABSENT in effusion. 4) Breath sounds: BRONCHIAL (tubular) breathing in consolidation; DIMINISHED or ABSENT breath sounds in effusion (except aegophony at the compressed upper border).',
        examinerTip: 'Stony dullness is so characteristic of fluid that Das says: "You feel the resistance more in your pleximeter finger than you hear the sound!"',
      },
      {
        question: 'What is Light criteria and how do you differentiate exudative from transudative pleural effusion?',
        answer: 'Light criteria defines an EXUDATIVE effusion if at least one of the following is present: 1) Pleural fluid protein / Serum protein ratio > 0.5; 2) Pleural fluid LDH / Serum LDH ratio > 0.6; 3) Pleural fluid LDH > 2/3 the upper limit of normal serum LDH. Common transudates: Congestive heart failure, Cirrhosis (hepatic hydrothorax), Nephrotic syndrome. Common exudates: Parapneumonic effusion, Tuberculosis, Malignancy, Pulmonary embolism.',
        examinerTip: 'If protein is borderline, check Pleural fluid cholesterol (> 45 mg/dL indicates exudate) or Serum-pleural fluid albumin gradient (> 1.2 g/dL indicates transudate in patients on diuretics).',
      },
      {
        question: 'Where do you perform Diagnostic Thoracocentesis and why is the needle inserted above the lower rib?',
        answer: 'In the 7th or 8th intercostal space along the posterior axillary line (or mid-scapular line), one or two spaces below the fluid level. The needle is always inserted immediately ABOVE the upper border of the lower rib to avoid injuring the intercostal neurovascular bundle (Vein, Artery, Nerve - VAN) which runs along the subcostal groove on the inferior border of the upper rib.',
        examinerTip: 'Always mention that no more than 1000-1500 mL of fluid should be removed in a single therapeutic tap to prevent Re-expansion Pulmonary Edema.',
      },
      {
        question: 'Why does finger clubbing NOT occur in uncomplicated COPD or Bronchial Asthma?',
        answer: 'Uncomplicated COPD and asthma cause airway obstruction and alveolar hypoxia without chronic suppurative lung tissue destruction or right-to-left shunting. Clubbing requires platelet-derived growth factor (PDGF) and VEGF release from trapped megakaryocytes or chronic inflammatory AV shunts. If clubbing is present in a COPD patient, you MUST suspect co-existing Bronchogenic Carcinoma or Bronchiectasis!',
        examinerTip: 'Examiners consider this a major catch question. Always emphasize: "Sir, clubbing in a smoker with COPD warrants an urgent chest CT to rule out malignancy."',
      },
    ],
  },

  // 3. MEDICINE - ABDOMEN
  {
    id: 'abdomen_proforma',
    title: 'Abdomen & Hepatobiliary Case Proforma',
    system: 'General Medicine',
    department: 'Gastroenterology / General Medicine',
    summary: 'Master examination proforma for Chronic Liver Disease (Cirrhosis, Portal Hypertension), Splenomegaly, Ascites, Hepatosplenomegaly, and Abdominal Mass.',
    examPearl: 'Always palpate the spleen starting from the right iliac fossa towards the left hypochondrium so you do not miss a massive spleen (splenomegaly enlarges along the axis of the 10th rib towards the right iliac fossa).',
    diagramPath: '/diagrams/clinical/cirrhosis_portal_hypertension.jpg',
    diagramTitle: 'Cirrhosis & Portal Hypertension: Stigmata & Collaterals',
    sections: [
      {
        title: '1. History & Etiology',
        items: [
          {
            label: 'Chief Complaints',
            description: 'Abdominal distension, jaundice, hematemesis/melena, altered sensorium, swelling of feet.',
            checklist: [
              'Abdominal distension: Rapid onset with pain (Budd-Chiari, spontaneous bacterial peritonitis) vs Gradual painless (cirrhosis)',
              'Hematemesis & Melena: Painless, massive frank blood hematemesis with clots (esophageal varices rupture)',
              'Jaundice: Onset, duration, yellow sclera, high-colored tea-like urine, clay-colored stools, generalized pruritus (obstructive cholestasis)',
              'Altered Sleep Pattern & Encephalopathy: Reversal of day-night sleep cycle, day-time somnolence, flapping tremors, confusion, disorientation (West Haven criteria grades 1-4)',
              'Bilateral pedal edema: Ascending swelling starting in ankles and legs',
            ],
          },
          {
            label: 'Risk Factors & Etiology',
            description: 'Alcohol quantification (grams/day = volume in mL x ABV % x 0.8 / 100), history of blood transfusion, tattooing, unprotected sexual exposure (Hepatitis B & C), Wilson disease family history, NAFLD/metabolic syndrome, hepatotoxic drugs (ATT: INH, Rifampicin, Pyrazinamide).',
          },
        ],
      },
      {
        title: '2. General Physical Examination (Cirrhotic Stigmata)',
        items: [
          {
            label: 'Peripheral Signs of Liver Cell Failure & Hyperestrogenism',
            description: 'Systematic head-to-toe inspection for peripheral markers.',
            checklist: [
              'Palmar erythema: Flushing of thenar and hypothenar eminences (hyperdynamic circulation, increased free estrogen)',
              'Spider angiomas / naevi: Central pulsating arteriole with radiating spider-leg capillaries in SVC territory (face, neck, chest, arms; blanch on pressing center with a pinhead)',
              'Gynecomastia: True glandular breast tissue enlargement in males (tender, palpable disc beneath areola)',
              'Testicular atrophy: Loss of testicular sensation and volume (< 12 mL)',
              'Loss of secondary sexual hair: Scanty axillary and pubic hair (female escutcheon pattern in males)',
              'Dupuytren contracture: Thickening and shortening of palmar aponeurosis causing flexion deformity of ring/little fingers (alcoholism)',
              'Nail signs: Terry nails (ground-glass opacification of proximal 80% with narrow brown distal band), Muehrcke lines (paired white transverse lines of hypoalbuminemia)',
              'Parotid enlargement: Bilateral painless hypertrophy (sialadenosis in chronic alcoholism)',
              'Fetor hepaticus: Sweet, musty, mousy odor on breath due to volatile dimethyl sulfide',
              'Flapping Tremor / Asterixis: Bilateral arrhythmic interruption of voluntary muscle contraction with outstretched hands in dorsiflexion (hepatic encephalopathy)',
            ],
          },
        ],
      },
      {
        title: '3. Systemic Abdominal Examination',
        items: [
          {
            label: 'Inspection',
            description: 'Abdomen inspected with patient supine, arms by sides, knees slightly flexed.',
            checklist: [
              'Contour: Generalized distension (flanks full in ascites vs central dome in obesity/meteorism)',
              'Umbilicus: Central, everted, slit-like, or transverse (horizontal in ascites, smiling umbilicus)',
              'Dilated Veins & Caput Medusae: Radiating from umbilicus (portal hypertension, recanalized umbilical vein in falciform ligament); determine direction of venous blood flow using two-finger milking test (Flow AWAY from umbilicus in portal hypertension; Flow UPWARDS from below pubis in IVC obstruction)',
              'Movement with respiration: Free movement (normal) vs Restricted in generalized peritonitis',
              'Visible pulsations: Epigastric pulsation (enlarged RV, abdominal aortic aneurysm)',
              'Hernial orifices & External genitalia: Cough impulse at inguinal, femoral, and umbilical rings; scrotal edema',
            ],
          },
          {
            label: 'Palpation',
            description: 'Ask for pain before touching; palpate superficially first, then deep.',
            checklist: [
              'Superficial Palpation: Muscle guarding, rigidity, localized tenderness',
              'Liver Palpation: Start right iliac fossa, move upward towards right costal margin in midclavicular line with respiration; feel edge with radial border of index finger. Record: Size below costal margin, surface (micronodular vs macronodular), consistency (firm, hard), margin (sharp, blunt), tenderness, pulsatility (tricuspid regurgitation)',
              'Liver Span: Percuss upper border of dullness (normally 5th ICS MCL) down to lower palpated border (normal span 12-15 cm in males, 10-12 cm in females; < 10 cm indicates shrunken cirrhotic liver!)',
              'Spleen Palpation: Start from right iliac fossa, ascend diagonally towards left hypochondrium; feel anterior notch. Bimanual palpation with left hand supporting 10th-11th ribs posteriorly. Turn patient to right lateral position (Middleton maneuver) for mild splenomegaly!',
              'Kidney Bimanual Ballottement: Flank fullness, ballotable between anterior hand and posterior lumbar hand (colon lies anterior to kidney; spleen has notch and sharp border with no space between spleen and costal margin)',
            ],
          },
          {
            label: 'Percussion',
            description: 'Ascites confirmation tests.',
            checklist: [
              'Shifting Dullness: Percuss from midline umbilicus (resonant due to floating bowel) towards dependent flank until dullness is reached. Keep finger in place, ask patient to turn 45 degrees towards opposite side; wait 15 seconds. Note becomes resonant as fluid drops away! (Requires > 500 mL of free fluid)',
              'Fluid Thrill / Wave: Place one hand on flank, assistant places medial border of hand vertically on midline of abdomen (damps abdominal wall vibration). Flick opposite flank with fingers; feel transmitted fluid impulse (Requires massive ascites > 1500-2000 mL)',
              'Puddle Sign: Patient on all fours (knee-elbow position); percuss lower abdomen while moving stethoscope (detects small ascites ~ 120 mL)',
            ],
          },
          {
            label: 'Auscultation',
            description: 'Bowel sounds, bruits, and venous hums.',
            checklist: [
              'Bowel sounds: Normal 4-8/min; hyperactive / tinkling rushes in intestinal obstruction; absent in paralytic ileus',
              'Cruveilhier-Baumgarten Venous Hum: Soft continuous humming murmur over epigastrium/umbilicus in portal hypertension with patent paraumbilical veins (disappears on pressure)',
              'Hepatic Arterial Bruit: Heard over liver in Hepatocellular Carcinoma (HCC) or acute alcoholic hepatitis',
              'Splenic Rub: Friction rub over left upper quadrant in splenic infarction (sickle cell, infective endocarditis)',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'How do you clinically differentiate an enlarged Spleen from an enlarged Left Kidney?',
        answer: '1) Direction of enlargement: Spleen enlarges downwards and medially towards the right iliac fossa (along the 10th rib axis); kidney enlarges downwards into the lumbar region and iliac fossa. 2) Characteristics: Spleen has a sharp anterior border with a distinct SPLENIC NOTCH; kidney has rounded margins with no notch. 3) Getting above the mass: Cannot get above the spleen; can usually get above the upper pole of the kidney. 4) Ballottement: Kidney is BIMANUALLY BALLOTABLE; spleen is not ballotable. 5) Percussion: Spleen is DULL to percussion because it lies against anterior abdominal wall; kidney is TYMPANITIC because the descending colon crosses anterior to it.',
        examinerTip: 'Examiners always ask: "Can a kidney ever have a notch?" Answer: A fetal lobulated kidney may have indentations, but never a true sharp notch like a spleen!',
      },
      {
        question: 'What is SAAG (Serum-Ascites Albumin Gradient) and what does a high vs low SAAG indicate?',
        answer: 'SAAG = Serum Albumin - Ascitic Fluid Albumin (measured from samples drawn on the same day). 1) HIGH SAAG (>= 1.1 g/dL): Indicates PORTAL HYPERTENSION (sinusoidal hydrostatic transudation). Causes: Cirrhosis, Budd-Chiari syndrome, Congestive heart failure, Constrictive pericarditis, Portal vein thrombosis. 2) LOW SAAG (< 1.1 g/dL): Indicates NON-PORTAL HYPERTENSION etiologies (increased capillary permeability or lymphatic leak). Causes: Peritoneal carcinomatosis, Tuberculous peritonitis, Nephrotic syndrome, Pancreatic ascites, Biliary leak.',
        examinerTip: 'Notice that SAAG completely replaces the old, inaccurate transudate/exudate cutoff (< 3 g/dL protein) for classifying ascites.',
      },
      {
        question: 'What are the 5 components of the Child-Pugh Score and how is it graded?',
        answer: 'The 5 components are remembered as "Pour Another Beer At Eleven": P - Prothrombin time / INR (1: < 1.7, 2: 1.7-2.3, 3: > 2.3); A - Ascites (1: None, 2: Slight/medically controlled, 3: Moderate-severe); B - Bilirubin (1: < 2 mg/dL, 2: 2-3 mg/dL, 3: > 3 mg/dL); A - Albumin (1: > 3.5 g/dL, 2: 2.8-3.5 g/dL, 3: < 2.8 g/dL); E - Encephalopathy (1: None, 2: Grade 1-2, 3: Grade 3-4). Scoring: Class A = 5-6 points (well-compensated); Class B = 7-9 points (significant functional compromise); Class C = 10-15 points (decompensated cirrhosis).',
        examinerTip: 'In Primary Biliary Cholangitis (PBC), the bilirubin cutoff points are adjusted to < 4, 4-10, and > 10 mg/dL because baseline bilirubin is higher.',
      },
      {
        question: 'How do you determine the direction of blood flow in dilated anterior abdominal wall veins?',
        answer: 'Place the index and middle fingers together over a straight segment of the vein to empty it. Press firmly, then slide the index finger upward along the vein while keeping the middle finger pressed. Release the lower (middle) finger: if the vein fills immediately from below, the flow is UPWARDS. Repeat by releasing the upper finger: if it fills from above, flow is DOWNWARDS. In Portal Hypertension (Caput Medusae), veins radiate AWAY from the umbilicus (upwards above umbilicus, downwards below umbilicus). In IVC obstruction, flow is entirely UPWARDS from the groin towards the heart to bypass the blocked vena cava.',
        examinerTip: 'In SVC obstruction, collateral venous blood flows entirely DOWNWARDS towards the IVC territory.',
      },
    ],
  },

  // 4. MEDICINE - CNS
  {
    id: 'cns_proforma',
    title: 'Central Nervous System (CNS) Case Proforma',
    system: 'General Medicine',
    department: 'Neurology / General Medicine',
    summary: 'Master examination proforma for Stroke (Hemiplegia), Paraplegia, Cranial Nerve Palsies, Parkinsonism, Cerebellar Ataxia, and Motor Neuron Disease.',
    examPearl: 'In UMN lesion: Hypertonia (clasp-knife spasticity), hyperreflexia, extensor plantar (Babinski sign), and absent superficial reflexes. In LMN lesion: Hypotonia (flaccidity), hyporeflexia/areflexia, muscle wasting, and fasciculations.',
    diagramPath: '/diagrams/clinical/cranial_nerve_exam.jpg',
    diagramTitle: 'Cranial Nerves I to XII & Brainstem Localization',
    sections: [
      {
        title: '1. History & Localization Clues',
        items: [
          {
            label: 'Chief Complaints',
            description: 'Weakness of limbs, facial deviation, speech abnormality, sensory loss, seizures, involuntary movements, headache/vomiting.',
            checklist: [
              'Onset & Evolution: Sudden catastrophic onset within seconds (embolic stroke) vs Minutes-hours (intracerebral hemorrhage) vs Stuttering progression over hours-days (atherothrombotic stroke) vs Subacute-chronic (space occupying lesion, demyelinating)',
              'Weakness distribution: Monoplegia (single limb) vs Hemiplegia (one half of body) vs Paraplegia (both lower limbs) vs Quadriplegia (all four limbs)',
              'Speech disturbance: Dysphasia / Aphasia (Broca expressive vs Wernicke receptive vs Global) vs Dysarthria (slurred speech, scanning speech in cerebellar disease, hot potato speech in bulbar palsy)',
              'Cranial nerve symptoms: Diplopia, facial asymmetry, dysphagia, nasal regurgitation, hoarseness of voice',
              'Bladder/Bowel symptoms: Urgency, precipitancy, retention, or overflow incontinence (myelopathy/spinal cord lesion)',
            ],
          },
        ],
      },
      {
        title: '2. Higher Mental Functions & Speech',
        items: [
          {
            label: 'Higher Mental Functions',
            description: 'Assess consciousness, orientation, memory, speech, and praxis.',
            checklist: [
              'Glasgow Coma Scale (GCS): E (Eye opening 1-4), V (Verbal response 1-5), M (Motor response 1-6); Total 3 to 15',
              'Orientation: Time, place, and person',
              'Memory: Immediate (digit span), Recent (recall 3 items after 5 minutes), Remote (birthplace, wedding date)',
              'Speech Assessment: Spontaneous speech fluency, Comprehension, Repetition (arcuate fasciculus: impaired in conduction aphasia), Naming, Reading, Writing',
              'Parietal lobe functions: Agnosia, Astereognosis (failure to identify object placed in hand with eyes closed), Agraphesthesia, Sensory inattention / Extinction, Apraxia',
              'Frontal lobe signs: Grasp reflex, Palmar-mental reflex, Glabellar tap (Myerson sign in Parkinsonism), emotional lability',
            ],
          },
        ],
      },
      {
        title: '3. Cranial Nerves Examination (CN I to XII)',
        items: [
          {
            label: 'CN I to VI (Ocular & Facial Sensation)',
            description: 'Systematic testing of cranial nerves.',
            checklist: [
              'CN I (Olfactory): Test each nostril separately with non-pungent scents (coffee, soap; avoid ammonia which stimulates CN V)',
              'CN II (Optic): Visual acuity (Snellen chart / finger counting), Visual fields (confrontation test for hemianopia), Color vision (Ishihara plates), Fundoscopy (papilledema, optic atrophy), Pupillary reflexes (Direct and consensual light reflex, accommodation reflex; Marcus Gunn afferent pupillary defect)',
              'CN III, IV, VI (Oculomotor, Trochlear, Abducens): Extraocular eye movements in 6 cardinal gazes; ptosis (CN III); Horner syndrome vs CN III palsy (dilated pupil in CN III vs constricted in Horner); Diplopia testing; Nystagmus (direction, fast phase, gaze-evoked)',
              'CN V (Trigeminal): Sensory: Ophthalmic (V1), Maxillary (V2), Mandibular (V3) touch and pain. Motor: Clench teeth to palpate temporalis and masseter; pterygoids (open mouth against resistance; deviates to PARALYZED side). Reflexes: Corneal reflex (Afferent V1, Efferent VII), Jaw jerk (exaggerated in pseudobulbar palsy)',
            ],
          },
          {
            label: 'CN VII to XII (Facial, Bulbar & Tongue)',
            description: 'Facial nerve, hearing, bulbar and tongue motor exam.',
            checklist: [
              'CN VII (Facial): Motor: Wrinkle forehead (frontalis), close eyes tightly against resistance (orbicularis oculi), blow cheeks, whistle, show teeth. UMN vs LMN: UMN spares forehead wrinkles (bilateral corticonuclear innervation); LMN paralyzes entire half of face including forehead (Bell palsy). Taste: Anterior 2/3 of tongue (chorda tympani)',
              'CN VIII (Vestibulocochlear): Hearing: Whispered voice test; Tuning fork 512 Hz: Rinne test (AC > BC is normal; BC > AC is conductive loss), Weber test (lateralizes to diseased ear in conductive loss, to normal ear in sensorineural loss). Vestibular: Romberg test, Hallpike maneuver',
              'CN IX, X (Glossopharyngeal, Vagus): Palatal movement: "Say Ah" — uvula deviates towards the NORMAL side; Gag reflex (Afferent IX, Efferent X); Voice quality and swallowing (nasal regurgitation in palatal palsy)',
              'CN XI (Spinal Accessory): Trapezius: Shrug shoulders against resistance; Sternocleidomastoid: Turn head to opposite side against resistance',
              'CN XII (Hypoglossal): Inspect tongue in floor of mouth for wasting and fasciculations; Protrude tongue: Deviates TOWARDS the side of lesion/weakness (paralyzed genioglossus cannot push forward)',
            ],
          },
        ],
      },
      {
        title: '4. Motor System Examination',
        items: [
          {
            label: 'Bulk, Tone & Power',
            description: 'Compare bilaterally in upper and lower extremities.',
            checklist: [
              'Muscle Bulk / Nutrition: Measure circumference at symmetrical levels (upper arm 10 cm above olecranon; thigh 15 cm above patella; calf 10 cm below tibial tuberosity). Wasting (LMN) vs Pseudohypertrophy (Duchenne muscular dystrophy in calf)',
              'Involuntary Movements: Tremors (Resting 4-6 Hz pill-rolling in Parkinsonism vs Postural in Essential tremor vs Intention in Cerebellar disease), Chorea, Athetosis, Myoclonus, Fasciculations',
              'Muscle Tone: Passive movement at wrist, elbow, ankle, knee. Spasticity (Clasp-knife: resistance maximal at start then gives way; UMN pyramidal tract) vs Rigidity (Lead-pipe or Cogwheel: uniform resistance throughout movement; extrapyramidal basal ganglia) vs Hypotonia / Flaccidity (LMN or cerebellar)',
              'Muscle Power: Medical Research Council (MRC) Grade 0 to 5: Grade 0 (No contraction), Grade 1 (Flicker of contraction), Grade 2 (Movement with gravity eliminated), Grade 3 (Movement against gravity), Grade 4 (Movement against moderate resistance), Grade 5 (Normal full power)',
            ],
          },
          {
            label: 'Reflexes (Deep Tendon & Superficial)',
            description: 'Test tendon jerks with reflex hammer (Grade 0 to 4+; 2+ normal, 3+ brisk, 4+ clonus).',
            checklist: [
              'Biceps Jerk (C5, C6 - Musculocutaneous nerve)',
              'Supinator / Brachioradialis Jerk (C5, C6 - Radial nerve): Inverted supinator jerk (finger flexion with absent supinator denotes C5-C6 cord compression with UMN lesion below)',
              'Triceps Jerk (C7, C8 - Radial nerve)',
              'Knee Jerk (L2, L3, L4 - Femoral nerve): Pendular knee jerk in cerebellar disease',
              'Ankle Jerk (S1, S2 - Tibial nerve): Delayed relaxation phase in Hypothyroidism (Wolff-Chaikoff / Woltman sign)',
              'Clonus: Sustained rhythmic contraction (> 4 beats abnormal). Patellar clonus and Ankle clonus (sudden brisk dorsiflexion of foot)',
              'Superficial Reflexes: Abdominal reflexes (T8-T12; lost in UMN lesion), Cremasteric reflex (L1, L2), Anal reflex (S4, S5)',
              'Plantar Reflex (L5, S1, S2): Babinski sign (firm stroke along lateral plantar border of sole towards 5th toe and across ball of foot to great toe; Extension of great toe with fanning of outer four toes indicates UMN pyramidal tract lesion; normal is flexor)',
              'Alternative Babinski equivalents: Chaddock (stroke lateral malleolus), Oppenheim (slide knuckles down anterior tibia), Gordon (squeeze calf)',
            ],
          },
        ],
      },
      {
        title: '5. Sensory, Cerebellar & Meningeal Signs',
        items: [
          {
            label: 'Sensory & Cerebellar Testing',
            description: 'Test sensory modalities, coordination, and meningeal irritation.',
            checklist: [
              'Superficial Sensation: Light touch (cotton wisp), Pain / Pinprick (sterile pin), Temperature (spinothalamic tract)',
              'Deep Sensation: Vibration sense (128 Hz tuning fork over bony prominences), Joint position / Proprioception (dorsal column)',
              'Cortical Sensation: Two-point discrimination, Stereognosis, Graphesthesia (parietal lobe)',
              'Cerebellar Signs (VANISHED): Vertigo, Ataxia (broad-based drunken gait), Nystagmus (horizontal, fast phase to side of lesion), Intention tremor (finger-to-nose test, heel-to-shin test), Slurred staccato speech, Hypotonia, Dysdiadochokinesia (rapid alternating supination-pronation), Rebound phenomenon (Stewart-Holmes sign)',
              'Meningeal Irritation Signs: Neck rigidity (resistance to passive neck flexion), Kernig sign (resistance and pain on extending knee beyond 135 degrees when hip is flexed 90 degrees), Brudzinski sign (passive neck flexion causes involuntary flexion of hips and knees)',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'How do you differentiate an UMN Facial Palsy from a LMN Facial Palsy?',
        answer: 'In UMN facial palsy (e.g. middle cerebral artery stroke), the forehead muscles (frontalis and orbicularis oculi) are SPARED because the upper face receives bilateral corticonuclear innervation from both cerebral hemispheres. Therefore, the patient CAN wrinkle their forehead and close their eye, but has weakness of the lower face (flat nasolabial fold, drooping corner of mouth). In LMN facial palsy (e.g. Bell palsy), the entire ipsilateral half of the face is paralyzed, so the patient CANNOT wrinkle the forehead, cannot close the eye tightly (Bell phenomenon: eyeball rolls upwards and outwards on attempted closure), and has drooping mouth.',
        examinerTip: 'Examiners love to ask: "Can an UMN lesion ever look like LMN?" Answer: Yes, in acute stroke shock / diaschisis, tone may be temporarily flaccid for 2-3 weeks before classic spasticity emerges.',
      },
      {
        question: 'What is Millard-Gubler syndrome and Foville syndrome?',
        answer: 'Millard-Gubler syndrome is a ventral pontine syndrome caused by infarction of the paramedian branches of the basilar artery. It features: 1) Ipsilateral LMN facial nerve (CN VII) palsy; 2) Ipsilateral lateral rectus (CN VI) palsy; 3) Contralateral hemiplegia (pyramidal tract involvement). If it also includes conjugate gaze palsy towards the side of the lesion (involvement of the PPRF / paramedian pontine reticular formation), it is called Foville syndrome.',
        examinerTip: 'Remember the rule of brainstem syndromes: "Ipsilateral cranial nerve palsy with contralateral hemiplegia means a brainstem stroke (crossed hemiplegia)!"',
      },
      {
        question: 'What is Brown-Sequard syndrome and what are its classic neurological signs?',
        answer: 'Brown-Sequard syndrome is caused by hemisection of the spinal cord (e.g., trauma, stab injury, disc herniation). It produces: 1) At the level of the lesion: Ipsilateral complete sensory loss and LMN motor paralysis. 2) Below the level of the lesion (Ipsilateral): UMN paralysis (corticospinal tract) + Loss of vibration and proprioception (dorsal columns). 3) Below the level of the lesion (Contralateral): Loss of pain and temperature sensation starting 1-2 segments below the lesion (spinothalamic tract decussates in anterior white commissure).',
        examinerTip: 'Highlight the dissociation: touch and joint sense lost on the SAME side; pain and temperature lost on the OPPOSITE side.',
      },
      {
        question: 'What is the difference between Broca aphasia and Wernicke aphasia?',
        answer: 'Broca aphasia (expressive/motor) is caused by a lesion in the inferior frontal gyrus (Brodmann area 44/45, superior division of MCA). The patient has non-fluent, halting, agrammatic speech, but comprehension is preserved; the patient is aware and frustrated by their deficit. Wernicke aphasia (receptive/sensory) is caused by a lesion in the superior temporal gyrus (Brodmann area 22, inferior division of MCA). The patient speaks fluently with normal melody and grammar, but their speech is devoid of meaning ("word salad", neologisms, paraphasias); comprehension is severely impaired, and the patient is unaware of their deficit.',
        examinerTip: 'Repetition is impaired in BOTH Broca and Wernicke aphasia. If repetition is intact with fluent/non-fluent deficit, consider Transcortical aphasias!',
      },
    ],
  },

  // 5. SURGERY - INGUINAL & VENTRAL HERNIA
  {
    id: 'hernia_proforma',
    title: 'Inguinal & Ventral Hernia Case Proforma',
    system: 'General Surgery',
    department: 'General Surgery / Abdominal Wall',
    summary: 'Master Indian MBBS surgical examination proforma for Inguinal Hernia (Direct vs Indirect), Femoral Hernia, and Ventral Hernia (Umbilical, Paraumbilical, Epigastric, Incisional).',
    examPearl: 'Always examine both standing and supine. First inspect the opposite groin to rule out bilateral hernia. In indirect inguinal hernia, the deep ring occlusion test prevents the hernia from appearing on coughing; in direct hernia, the bulge emerges medial to the occluding finger in Hesselbach triangle.',
    diagramPath: '/diagrams/clinical/inguinal_hernia_hesselbach_anatomy.jpg',
    diagramTitle: 'Inguinal Canal & Hesselbach Triangle: Direct vs Indirect Hernia Anatomy',
    sections: [
      {
        title: '1. Patient Demographics & History',
        items: [
          {
            label: 'Chief Complaints & Chronology',
            description: 'Record swelling in groin/scrotum/abdomen with duration and characteristics.',
            checklist: [
              'Swelling in groin: Duration, onset (sudden after heavy lifting vs gradual), painless dragging sensation',
              'Reducibility: Disappears spontaneously on lying down or reduced manually by patient',
              'Complication signs: Sudden severe pain, irreducibility, vomiting, abdominal distension, obstipation (incarceration / strangulation)',
              'Precipitating risk factors (increased intra-abdominal pressure): Chronic cough / smoking (COPD), straining at micturition (BPH / urethral stricture), chronic constipation, heavy manual labor / weight lifting',
            ],
          },
          {
            label: 'Past & Surgical History',
            description: 'History of previous hernia repair (recurrent hernia), appendicectomy or laparotomy scars, diabetes mellitus, connective tissue disorders.',
          },
        ],
      },
      {
        title: '2. General Physical Examination',
        items: [
          {
            label: 'General Survey & Risk Factors',
            description: 'Vitals, nutritional status, and predisposing systemic conditions.',
            checklist: [
              'Vitals: Tachycardia and fever in strangulated hernia / peritonitis',
              'Respiratory exam: Chronic bronchitis, emphysema, barrel chest, wheeze (must be optimized before elective surgery)',
              'Abdominal wall musculature tone: Malgaigne bulges (diffuse bilateral groin bulges in elderly with weak aponeurosis)',
              'Per-rectal examination (DRE): Essential in all elderly males to assess benign prostatic hyperplasia (BPH) or rectal malignancy before repairing hernia!',
              'External urethral meatus: Inspect for pinhole meatus / phimosis in children and young adults',
            ],
          },
        ],
      },
      {
        title: '3. Local Examination of Groin & Scrotum (Standing & Supine)',
        items: [
          {
            label: 'Inspection (Standing)',
            description: 'Patient standing, examiner seated in front. Examine both groins simultaneously.',
            checklist: [
              'Location: Inguinal (above and medial to pubic tubercle) vs Femoral (below and lateral to pubic tubercle)',
              'Shape: Pyriform / Oblique / Sausage-shaped (Indirect inguinal hernia) vs Globular / Hemispherical (Direct inguinal hernia)',
              'Extent: Incomplete (Bubonocele in canal, Funicular down to cord) vs Complete (Scrotal hernia extending to base of scrotum)',
              'Visible Expansile Cough Impulse: Expands and bulges when patient coughs with head turned away',
              'Skin over swelling: Normal, stretched, redness or edema (strangulation)',
              'Opposite groin & scrotum: Rule out bilateral hernia or contralateral patent processus vaginalis',
            ],
          },
          {
            label: 'Palpation (Standing & Supine)',
            description: 'Confirm findings, determine anatomical landmarks, and perform clinical tests.',
            checklist: [
              'Temperature & Tenderness: Local warmth and severe tenderness indicate strangulation / acute incarceration',
              'Getting Above the Swelling: Fingers can get above a scrotal swelling = PURELY SCROTAL (hydrocele, spermatocele, testicular tumor); Fingers CANNOT get above swelling = INGUINOSCROTAL (hernia or infantile hydrocele)',
              'Palpable Expansile Cough Impulse: Hand cupped over swelling, patient coughs; expansile thrust felt in all directions',
              'Consistency: Soft, granular, doughy (Omentocele) vs Elastic, smooth, often with initial resistance followed by rapid reduction with a gurgling sound (Enterocele / bowel)',
              'Testis and Cord Palpation: Testis felt separately below swelling (indirect hernia) vs within swelling (congenital hernia); thick spermatic cord',
            ],
          },
          {
            label: 'Special Clinical Tests for Inguinal Hernia',
            description: 'The 4 definitive clinical bed tests to distinguish direct from indirect hernia.',
            checklist: [
              '1. Deep Ring Occlusion Test: Deep inguinal ring lies 1.25 cm (half an inch) above the midinguinal point (midway between ASIS and pubic symphysis). Reduce hernia completely in supine position; occlude deep ring firmly with thumb. Ask patient to stand and cough: If swelling DOES NOT appear = INDIRECT HERNIA (controlled by deep ring occlusion); If swelling BULGES MEDIAL to thumb = DIRECT HERNIA (emerges through Hesselbach triangle)',
              '2. Finger Invagination Test: Right little/index finger invaginates loose scrotal skin upwards along spermatic cord into the external (superficial) inguinal ring. Patient coughs: Impulse felt at the TIP of the finger = INDIRECT HERNIA (travels down canal); Impulse felt on the PULP / PAD of the finger = DIRECT HERNIA (pushes forward through posterior wall)',
              '3. Zieman Three-Finger Test: Right hand placed over right groin: Index finger on deep ring, Middle finger over superficial ring (Hesselbach triangle), Ring finger over saphenous opening (femoral canal). Patient coughs: Impulse on Index = Indirect; Impulse on Middle = Direct; Impulse on Ring = Femoral hernia',
              '4. Reduction Test (Taxis): Indirect hernia reduces upwards, backwards, and laterally; Direct hernia reduces directly backwards into abdominal cavity',
            ],
          },
          {
            label: 'Percussion & Auscultation',
            description: 'Percussion note and bowel sounds.',
            checklist: [
              'Percussion: Tympanitic over enterocele (gas-filled bowel); Dull over omentocele or bladder',
              'Auscultation: Bowel sounds audible over enterocele; Absent in omentocele; High-pitched tinkling sounds in obstructed hernia',
            ],
          },
        ],
      },
      {
        title: '4. Summary, Diagnosis & Surgical Management',
        items: [
          {
            label: 'Provisional Diagnosis Structure',
            description: 'Complete Indian MBBS diagnosis format.',
            checklist: [
              'Side: Right / Left / Bilateral',
              'Site: Inguinal (Indirect vs Direct) vs Femoral vs Ventral (Umbilical, Incisional)',
              'Extent: Bubonocele / Funicular / Complete scrotal',
              'Status: Reducible / Irreducible / Obstructed / Strangulated',
              'Content: Enterocele (small bowel) / Omentocele (greater omentum)',
              'Etiological predisposing factors: e.g. BPH, chronic cough, constipation',
            ],
          },
          {
            label: 'Surgical Treatment',
            description: 'Definitive operative management.',
            checklist: [
              'Lichtenstein Tension-Free Mesh Hernioplasty: Gold standard open repair; 7.5 x 15 cm polypropylene mesh placed on posterior wall, secured to pubic tubercle with 1.5-2 cm overlap medial to pubic tubercle',
              'Laparoscopic repairs: TEP (Totally Extraperitoneal) vs TAPP (Transabdominal Preperitoneal)',
              'Pediatric Inguinal Hernia: Herniotomy alone (high ligation and excision of patent sac at deep ring neck; posterior wall is normal in children, mesh contraindicated!)',
              'Bassini / Shouldice Repair: Tissue-based non-mesh anatomical repairs (used if mesh contraindicated e.g. strangulated bowel with peritonitis and contamination)',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: "What is Hesselbach's triangle? State its exact anatomical boundaries.",
        answer: "Hesselbach's triangle is located on the posterior surface of the anterior abdominal wall in the groin. Its boundaries are: Medial: Lateral border of the rectus abdominis muscle (linea semilunaris); Lateral: Inferior epigastric artery; Inferior: Inguinal ligament (Poupart's ligament). The floor is formed by the fascia transversalis reinforced by the conjoint tendon. Direct inguinal hernias emerge through this triangle.",
        examinerTip: "Examiners often ask: 'How is Hesselbach's triangle subdivided?' Answer: The obliterated umbilical artery (medial umbilical ligament) divides it into medial and lateral fossae; direct hernias most commonly bulge through the medial fossa!",
      },
      {
        question: 'Why does an Indirect Inguinal Hernia enter the scrotum while a Direct Hernia rarely does?',
        answer: 'An indirect hernia enters the deep ring and travels within the patent processus vaginalis inside the spermatic cord, enveloped by the internal spermatic fascia, cremasteric muscle, and external spermatic fascia. This direct anatomic tunnel guides it straight into the scrotum. In contrast, a direct hernia pushes forward directly through a diffuse defect in the posterior wall (transversalis fascia) medial to the inferior epigastric vessels. It lies BEHIND the spermatic cord and is prevented from entering the scrotum by the strong conjoint tendon and fascia attachments.',
        examinerTip: 'Direct hernia entering the scrotum is exceedingly rare; if it occurs in longstanding giant direct hernia, it is called a funicular direct hernia.',
      },
      {
        question: 'What is the anatomical difference between the Midinguinal Point and the Midpoint of the Inguinal Ligament?',
        answer: 'The Midinguinal Point is midway between the Anterior Superior Iliac Spine (ASIS) and the Pubic Symphysis. The femoral artery crosses into the thigh here; the Deep Inguinal Ring lies 1.25 cm (0.5 inch) above it. The Midpoint of the Inguinal Ligament is midway between the ASIS and the Pubic Tubercle. The internal oblique muscle originates from its lateral half.',
        examinerTip: 'Remember: Pubic symphysis is in the midline; pubic tubercle is approximately 2 cm lateral to it. Confusing these two points is an instant negative mark in practical exams!',
      },
      {
        question: 'What are the 3-3-3 components of the Spermatic Cord?',
        answer: 'The contents of the spermatic cord are remembered as 3 Arteries, 3 Nerves, and 3 Other structures: 3 Arteries: 1) Testicular artery (from aorta), 2) Artery to the vas deferens (from inferior vesical), 3) Cremasteric artery (from inferior epigastric). 3 Nerves: 1) Genital branch of genitofemoral nerve (supplies cremaster), 2) Ilioinguinal nerve (runs on outside of cord), 3) Sympathetic nerve plexus (T10-T11). 3 Others: 1) Vas deferens, 2) Pampiniform plexus of veins (becomes testicular vein), 3) Lymphatics and remnant of processus vaginalis.',
        examinerTip: 'Note that the ilioinguinal nerve runs on the anterior surface of the cord under the external oblique aponeurosis, not within the internal spermatic fascia.',
      },
      {
        question: 'What is Lichtenstein Tension-Free Mesh Hernioplasty? Where is the first anchoring stitch placed?',
        answer: 'It is the gold standard open repair for inguinal hernia. A 7.5 x 15 cm monofilament polypropylene (Prolene) mesh is placed over the posterior wall of the inguinal canal to reinforce the transversalis fascia. The FIRST anchoring stitch is placed at the pubic tubercle, securing the mesh to the periosteum/lacunar ligament, ensuring a 1.5 to 2 cm overlap medial to the pubic tubercle to prevent medial recurrence. The inferior border is continuous-sutured to the shelving edge of the inguinal ligament up to the deep ring. A slit is cut laterally to create two tails that embrace the spermatic cord at the deep ring, creating a new internal ring.',
        examinerTip: 'Always mention that the suture must NOT catch the periosteum too deeply into bone to avoid chronic osteitis pubis, and must avoid the femoral vein laterally.',
      },
      {
        question: "What are Richter's, Littre's, Maydl's, and Amyand's hernias?",
        answer: "1) Richter's Hernia: Only a portion of the circumference of the bowel wall is trapped in the hernial sac; it can strangulate and become gangrenous WITHOUT producing mechanical intestinal obstruction. 2) Littre's Hernia: The hernial sac contains a Meckel's diverticulum. 3) Maydl's Hernia (Hernia-in-W): Two loops of bowel are in the hernial sac while the intervening intermediate loop lies inside the peritoneal cavity; the intra-abdominal loop strangulates while the loops in the sac look deceptively viable! 4) Amyand's Hernia: The hernial sac contains the vermiform appendix (may undergo acute appendicitis inside the hernia).",
        examinerTip: 'Another high-yield rare hernia is Pantaloon hernia (Dual/Saddlebag hernia): having both a direct and an indirect hernia simultaneously on the same side, straddling the inferior epigastric vessels.',
      },
      {
        question: 'What is a Sliding Hernia (Hernie par glissement)?',
        answer: 'A sliding hernia is one in which the wall of a retroperitoneal viscus forms part of the hernial sac itself. On the right side, the cecum and ascending colon are common; on the left side, the sigmoid colon; and medially, the urinary bladder. During repair, the surgeon must never attempt to dissect the posterior wall of the sac away from the bowel, as this will devitalize or puncture the organ; the sac is reduced en masse with the bowel (Bevan or LaRoque technique).',
        examinerTip: 'Sliding hernias almost always occur in elderly men and are indirect hernias.',
      },
      {
        question: 'What is the Nyhus classification of groin hernias?',
        answer: 'Type I: Indirect inguinal hernia with normal internal ring (pediatric hernia); Type II: Indirect inguinal hernia with dilated internal ring but intact posterior canal wall; Type III: Posterior wall defect (IIIA = Direct hernia, IIIB = Indirect hernia with large defect / pantaloon / sliding, IIIC = Femoral hernia); Type IV: Recurrent hernia (IVA = direct, IVB = indirect, IVC = femoral, IVD = combined).',
        examinerTip: 'Nyhus classification is favored by examiners because it guides whether a tissue repair, mesh hernioplasty, or preperitoneal approach is required.',
      },
    ],
  },

  // 6. SURGERY - VARICOSE VEINS
  {
    id: 'varicose_veins_proforma',
    title: 'Varicose Veins Case Proforma',
    system: 'General Surgery',
    department: 'General Surgery / Vascular',
    summary: 'Master surgical examination proforma for Chronic Venous Insufficiency (CVI), Saphenofemoral and Saphenopopliteal Incompetence, and Venous Ulcer (CEAP classification).',
    examPearl: 'Always verify deep vein patency using Perthes test or Modified Trendelenburg before performing high saphenous ligation or stripping; if deep veins are occluded by DVT, superficial veins are the only venous return collateral!',
    diagramPath: '/diagrams/clinical/varicose_veins_trendelenburg.jpg',
    diagramTitle: 'Trendelenburg & Tourniquet Tests for Venous Incompetence',
    sections: [
      {
        title: '1. Patient History & Symptoms',
        items: [
          {
            label: 'Chief Complaints',
            description: 'Dilated tortuous veins, aching leg pain after prolonged standing, ankle swelling, pigmentation, ulceration.',
            checklist: [
              'Dragging aching pain in calf, worse in the evening after prolonged standing, relieved by elevation of limb or walking',
              'Swelling around ankles (evening edema)',
              'Skin changes: Itching, eczema, brown pigmentation (stasis purpura / hemosiderin deposition), lipodermatosclerosis (inverted champagne bottle leg)',
              'Ulceration: Gaiter zone (medial malleolus), shallow, sloping edges, seropurulent discharge',
              'Complications: Superficial thrombophlebitis, external hemorrhage from burst vein, Marjolin ulcer (malignant squamous transformation in longstanding ulcer)',
            ],
          },
          {
            label: 'Risk Factors & Past History',
            description: 'Occupation involving prolonged standing (policemen, traffic wardens, surgeons, bus conductors), multiple pregnancies (progesterone vein relaxation), history of DVT, oral contraceptive pill use.',
          },
        ],
      },
      {
        title: '2. Clinical Examination (Standing & Supine)',
        items: [
          {
            label: 'Inspection (Standing)',
            description: 'Patient standing on a stool with entire lower limbs exposed from groin to toes.',
            checklist: [
              'Course of Great Saphenous Vein: Starts anterior to medial malleolus, ascends medial calf and knee, passes anteromedial thigh to saphenous opening (4 cm below and lateral to pubic tubercle)',
              'Course of Small Saphenous Vein: Starts posterior to lateral malleolus, ascends midline of posterior calf, pierces popliteal fascia to end in popliteal vein',
              'Saphena Varix: Saccular dilatation of great saphenous vein at saphenofemoral junction (exhibits cough impulse, fluid thrill, blue swell, disappears on lying down; easily mistaken for femoral hernia!)',
              'Skin changes in Gaiter Area: Stasis dermatitis, hyperpigmentation, induration, atrophie blanche (smooth white ivory scar tissue)',
            ],
          },
          {
            label: 'Special Clinical Tests for Venous Incompetence',
            description: 'The 6 standard surgical clinical bedside tests.',
            checklist: [
              '1. Trendelenburg Test (Test 1 - SFJ Incompetence): Patient supine, elevate limb to empty veins. Apply rubber tourniquet just below saphenofemoral junction (4 cm below pubic tubercle). Patient stands: If veins remain collapsed, and RAPIDLY FILL FROM ABOVE ON RELEASING TOURNIQUET = Saphenofemoral Junction (SFJ) Incompetence!',
              '2. Trendelenburg Test (Test 2 - Perforator Incompetence): Same setup, but KEEP TOURNIQUET ON while patient stands: If veins fill rapidly from below within 15-30 seconds despite tourniquet = Incompetent Perforators!',
              '3. Multiple Tourniquet Test: 3 tourniquets applied (below SFJ, above knee, below knee) to localize perforator incompetence (Hunterian mid-thigh, Dodd knee, Boyd upper calf, Cockett lower calf ankle perforators)',
              '4. Perthes Test (Deep Vein Patency): Apply tourniquet below SFJ, ask patient to walk briskly 5 minutes: If veins collapse = Deep veins are patent and calf pump is working; If veins become more distended and patient develops severe bursting calf pain = Deep Vein Thrombosis / Obstruction (stripping is ABSOLUTELY CONTRAINDICATED!)',
              '5. Schwartz Test: Tap lower end of vein with fingers while palpating upper end with other hand; impulse transmitted upwards denotes incompetent valves',
              '6. Fegan Method: Palpate fascial defects along medial calf where incompetent perforating veins pierce the deep fascia',
            ],
          },
        ],
      },
      {
        title: '3. CEAP Classification & Management',
        items: [
          {
            label: 'CEAP Clinical Stages',
            description: 'C0: No signs, C1: Telangiectasias / reticular veins (< 3mm), C2: Varicose veins (> 3mm), C3: Edema, C4a: Pigmentation/eczema, C4b: Lipodermatosclerosis/atrophie blanche, C5: Healed venous ulcer, C6: Active venous ulcer.',
          },
          {
            label: 'Definitive Treatment',
            description: 'Duplex Ultrasound (gold standard investigation) followed by: Endovenous Thermal Ablation (EVLA / RFA), Foam Sclerotherapy (UGFS), or Open Trendelenburg Operation (High Saphenous Ligation flush with femoral vein + division of all 5-6 tributaries + stripping to upper calf).',
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'How do you differentiate a Saphena Varix from a Femoral Hernia on clinical examination?',
        answer: 'Both present as a groin swelling below the inguinal ligament. Differentiating features: 1) Expansile cough impulse: Saphena varix has an expansile impulse with a characteristic FLUID THRILL (Cruveilhier sign) like a cat purr when coughing; femoral hernia has an impulse without fluid thrill. 2) Reducibility: Saphena varix disappears instantly on lying down without manipulation; femoral hernia requires taxis and often gives a gurgling sound (if enterocele). 3) Percussion: Tapping the great saphenous vein below produces an impulse transmitted upwards to the saphena varix (Schwartz test positive). 4) Auscultation: Venous hum heard over saphena varix, not in femoral hernia.',
        examinerTip: 'Saphena varix is a dilatation of the GSV at the SFJ and is easily treated during flush ligation; mistaking it for hernia and dissecting it can cause catastrophic femoral vein hemorrhage!',
      },
      {
        question: 'What are the tributaries of the Great Saphenous Vein at the Saphenofemoral Junction that MUST be divided during Trendelenburg operation?',
        answer: 'There are typically 5 to 6 tributaries: 1) Superficial circumflex iliac vein, 2) Superficial epigastric vein, 3) Superficial external pudendal vein, 4) Deep external pudendal vein, 5) Anterolateral vein of thigh (accessory saphenous), 6) Posteromedial vein of thigh. They MUST all be divided flush with the femoral vein because leaving even one tributary intact will cause collateral recurrence of varicose veins!',
        examinerTip: 'Remember: The ligation of the GSV must be FLUSH with the common femoral vein (no stump left), without tenting or narrowing the lumen of the femoral vein.',
      },
      {
        question: 'Why is stripping of the Great Saphenous Vein restricted only down to the upper calf / knee level?',
        answer: 'Below the knee, the saphenous nerve emerges from beneath the deep fascia and runs in intimate contact with the great saphenous vein down to the medial malleolus. Stripping the vein in the lower leg carries a high risk of injuring the saphenous nerve, causing permanent numbness, parasthesia, or painful neuroma along the medial border of the leg and foot.',
        examinerTip: 'Similarly, stripping of the small saphenous vein carries a risk of injuring the sural nerve.',
      },
      {
        question: 'What is the pathophysiological mechanism of Lipodermatosclerosis and Venous Ulcer formation?',
        answer: 'Valvular incompetence leads to chronic ambulatory venous hypertension. Increased hydrostatic pressure is transmitted to the skin microcirculation in the gaiter area, causing capillary distension, opening of endothelial pores, and extravasation of red blood cells and fibrinogen into the dermis. Breakdown of RBCs releases hemosiderin, causing brown pigmentation. Fibrin polymerizes around capillaries forming a "pericapillary fibrin cuff", which acts as a barrier preventing oxygen and nutrient diffusion to skin cells. Chronic inflammation and hypoxia result in dermal fibrosis, fat necrosis (lipodermatosclerosis), and skin breakdown causing venous ulceration.',
        examinerTip: 'Mention that 4-layer compression bandage (40 mmHg pressure at ankle, graduated to 17 mmHg below knee) is the gold standard for healing active venous ulcers (C6).',
      },
    ],
  },

  // 7. SURGERY - GASTRIC OUTLET OBSTRUCTION (GOO)
  {
    id: 'goo_proforma',
    title: 'Gastric Outlet Obstruction (GOO) Case Proforma',
    system: 'General Surgery',
    department: 'General Surgery / Upper GI',
    summary: 'Master surgical examination proforma for Pyloric Stenosis (secondary to chronic peptic ulcer disease) and Antral Carcinoma of Stomach.',
    examPearl: 'A succussion splash heard > 4 hours after the last meal without stethoscope is pathognomonic of gastric outlet obstruction. Always correct the metabolic alkalosis with hypokalemia and paradoxical aciduria before surgery!',
    diagramPath: '/diagrams/clinical/gastric_outlet_obstruction.jpg',
    diagramTitle: 'Gastric Outlet Obstruction: Succussion Splash, Visible Peristalsis & Dilatation',
    sections: [
      {
        title: '1. History & Differentiation (Benign vs Malignant)',
        items: [
          {
            label: 'Vomiting Characteristics',
            description: 'Copious, projectile, non-bilious vomiting containing undigested food particles eaten days prior.',
            checklist: [
              'Non-bilious projectile vomiting: In obstruction distal to ampulla of Vater (duodenal), vomit is bilious; in GOO (pyloric/antral), it is strictly non-bilious',
              'Contains foul-smelling partially digested food eaten 24-48 hours earlier',
              'Vomiting relieves epigastric fullness and discomfort completely',
              'Benign (Cicatrizing Duodenal Ulcer): Long history of dyspepsia, hunger pain relieved by food/antacids, younger age',
              'Malignant (Antral Carcinoma Stomach): Short duration, anorexia, loss of appetite (especially for meat), rapid weight loss, older age, hematemesis / coffee-ground vomitus',
            ],
          },
        ],
      },
      {
        title: '2. Physical Examination',
        items: [
          {
            label: 'General Examination',
            description: 'Assess severe dehydration, cachexia, and metastatic signs.',
            checklist: [
              'Signs of severe dehydration: Sunken eyes, dry tongue, loss of skin turgor, oliguria, hypotension',
              'Cachexia and wasting: Marked weight loss in gastric malignancy',
              'Metastatic signs in Gastric Carcinoma: Virchow node (Troisier sign - left supraclavicular lymph node), Sister Mary Joseph nodule (umbilical metastasis), Krukenberg tumor (bilateral ovarian enlargement on per-rectal/per-vaginal exam), Blumer shelf (metastasis in pouch of Douglas), Trousseau sign (migratory thrombophlebitis)',
            ],
          },
          {
            label: 'Abdominal Examination',
            description: 'Inspection, palpation, and succussion splash.',
            checklist: [
              'Visible Gastric Peristalsis (VGP): Waves moving from left hypochondrium downwards and to the right across epigastrium towards pylorus; provoked by flicking abdominal wall',
              'Gastric Distension: Scaphoid lower abdomen with bulging epigastrium',
              'Palpable Mass: Epigastric / pyloric mass felt in gastric cancer (firm, hard, moves with respiration, irregular); usually no mass in benign duodenal ulcer stenosis',
              'Succussion Splash: Place stethoscope over epigastrium, shake patient hips/abdomen sideways: Audible splashing sound heard > 4 hours after oral intake confirms gastric fluid accumulation',
              'Auscultopercussion: Scratch test used to delineate the lower border of a massively dilated stomach reaching the pelvis',
            ],
          },
        ],
      },
      {
        title: '3. Fluid & Electrolyte Resuscitation & Surgery',
        items: [
          {
            label: 'Metabolic Derangement',
            description: 'Hypochloremic, Hypokalemic, Metabolic Alkalosis with Paradoxical Aciduria.',
            checklist: [
              'Loss of HCl in vomit -> Loss of H+ and Cl- -> Metabolic alkalosis',
              'Kidneys excrete Na+ and HCO3- initially to compensate',
              'Severe volume depletion causes aldosterone release -> Kidneys conserve Na+ at the expense of K+ and H+ excretion in distal tubules',
              'Hypokalemia worsens; renal tubular cells exchange H+ for Na+ -> Urine becomes paradoxically acidic despite systemic alkalosis!',
              'Correction: 0.9% Normal Saline + Potassium Chloride (KCl); Saline supplies Cl- allowing kidneys to excrete excess bicarbonate',
            ],
          },
          {
            label: 'Definitive Surgery',
            description: 'Nasogastric decompression with warm saline washes for 3-5 days to reduce gastric wall edema. Benign: Truncal Vagotomy and Gastrojejunostomy (GJ) or Pyloroplasty. Malignant: Distal Radical Subtotal Gastrectomy with D2 lymphadenectomy and Roux-en-Y reconstruction.',
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Explain the mechanism of Paradoxical Aciduria in Gastric Outlet Obstruction.',
        answer: 'Persistent vomiting of gastric juice causes massive loss of H+, Cl-, Na+, and water. As volume depletion progresses, aldosterone is secreted in excess. Aldosterone acts on distal renal tubules to reabsorb Na+ in exchange for K+. Eventually, profound hypokalemia develops. To conserve Na+, the renal tubular cells are now forced to secrete H+ ions into the urine in exchange for reabsorbing Na+, even though the body is in severe metabolic alkalosis. This results in the paradoxical excretion of acidic urine in an alkalotic patient.',
        examinerTip: 'Examiners always ask: "Why do you infuse 0.9% Normal Saline and not Ringer Lactate?" Answer: Ringer lactate contains lactate which is metabolized to bicarbonate, worsening the alkalosis! Normal saline provides abundant chloride (154 mEq/L), allowing the kidney to excrete bicarbonate.',
      },
      {
        question: 'What are the boundaries and importance of the Triangle of Gastric Outlet Obstruction (Calot vs Wilkie)?',
        answer: 'During surgery for cicatrizing duodenal ulcer, the first part of the duodenum is scarred and shortened. A retrocolic posterior gastrojejunostomy is constructed at the most dependent part of the greater curvature, ensuring an isoperistaltic anastomosis without tension.',
        examinerTip: 'Always mention that pre-operative stomach preparation requires 3-5 days of wide-bore Ewald/Ryle tube aspiration with warm saline stomach washes to wash out food debris and let the thickened, edematous gastric muscularis recover tone.',
      },
      {
        question: 'What are the classical eponyms of distant metastases in Gastric Carcinoma?',
        answer: '1) Troisier sign / Virchow node: Left supraclavicular lymph node enlargement via thoracic duct. 2) Sister Mary Joseph nodule: Metastatic deposit at the umbilicus via falciform ligament lymphatics. 3) Krukenberg tumor: Transcoelomic drop metastases to both ovaries (signet-ring cells). 4) Blumer shelf: Transcoelomic peritoneal deposit in the rectovesical / rectouterine pouch of Douglas felt on digital rectal exam. 5) Irish node: Left anterior axillary lymph node.',
        examinerTip: 'The presence of any of these signs signifies Stage IV M1 disease, rendering the tumor incurable by curative resection (palliative care indicated).',
      },
    ],
  },

  // 8. SURGERY - BREAST LUMP
  {
    id: 'breast_lump_proforma',
    title: 'Breast Lump / Carcinoma Breast Proforma',
    system: 'General Surgery',
    department: 'General Surgery / Oncosurgery',
    summary: 'Master surgical examination proforma for Breast Lump, Fibroadenoma, Phyllodes Tumor, and Carcinoma Breast (TNM staging and Triple Assessment).',
    examPearl: 'Palpate the breast with the flat of the fingers against the underlying rib cage (not pinching the tissue between fingers, which makes normal breast tissue feel nodular). Always test mobility against Pectoralis Major by asking patient to press hands firmly against hips.',
    diagramPath: '/diagrams/anatomy/axilla_boundaries_contents_artery.jpg',
    diagramTitle: 'Axilla Boundaries, Contents & Surgical Anatomy (Levels I, II, III Lymph Nodes)',
    sections: [
      {
        title: '1. Patient History & Risk Stratification',
        items: [
          {
            label: 'Chief Complaints',
            description: 'Breast lump, nipple discharge, skin changes, pain, axillary swelling.',
            checklist: [
              'Lump in breast: Duration, painless (carcinoma) vs painful (fibroadenosis, mastitis, breast abscess)',
              'Rate of growth: Slow over years (fibroadenoma) vs progressive over months (carcinoma) vs rapid doubling (phyllodes tumor)',
              'Relationship to menstrual cycle: Increases in size and tenderness premenstrually (cyclical mastalgia in fibrocystic disease)',
              'Nipple Discharge: Unilateral single-duct blood-stained discharge (Intraductal Papilloma, Ductal Carcinoma In Situ); Serous (fibrocystic); Green/brownish (duct ectasia); Milky bilateral (galactorrhea, hyperprolactinemia)',
              'Skin changes: Peau d orange (orange peel skin), dimpling, redness, ulceration, nipple retraction',
            ],
          },
          {
            label: 'Risk Factors & Family History',
            description: 'Age, nulliparity, late first childbirth (> 30 years), early menarche (< 12 years), late menopause (> 55 years), HRT use, family history of breast/ovarian cancer (BRCA1 on chr 17, BRCA2 on chr 13).',
          },
        ],
      },
      {
        title: '2. Clinical Examination (Inspection & Palpation)',
        items: [
          {
            label: 'Inspection (Sitting)',
            description: 'Patient sitting upright; arms by sides, arms raised above head, hands pressed on hips, and leaning forward.',
            checklist: [
              'Symmetry: Difference in size, shape, and contour between the two breasts',
              'Nipple-Areola Complex: Level (retracted / elevated on diseased side), direction of nipple, inversion (slit-like in duct ectasia vs circumferential in malignancy), Paget disease (eczematous ulceration of nipple with destruction of areola)',
              'Skin overlying: Dimpling / puckering (infiltration of Cooper suspensory ligaments); Peau d orange (dermal lymphatic obstruction with cutaneous pitting at hair follicles); fungating ulcer',
              'Arms raised above head: Exaggerates tethering of skin and reveals hidden lumps in lower quadrants or inframammary fold',
              'Hands pressed against hips (contracts Pectoralis Major): Tethers lump if pectoralis fascia is infiltrated',
              'Leaning forward: Reveals fixation to chest wall and asymmetry',
            ],
          },
          {
            label: 'Palpation of Breast Lump',
            description: 'Patient supine with ipsilateral hand placed under head (flattens breast over chest wall). Palpate with palmar surface of fingers.',
            checklist: [
              'Location: Clock face position and quadrant (Upper Outer 50%, Upper Inner 15%, Lower Outer 10%, Lower Inner 10%, Central/Retroareolar 15%) + distance from nipple in cm',
              'Size: Measure in two perpendicular dimensions (cm)',
              'Consistency: Soft/cystic (cyst, galactocele) vs Firm/rubbery (fibroadenoma, breast mouse) vs Hard/stony (carcinoma)',
              'Margin & Surface: Well-circumscribed and smooth (benign) vs Ill-defined and craggy/irregular (carcinoma)',
              'Fixity to Skin (Tethering vs Infiltration): Pinch the skin over the lump: Inability to pinch skin = Skin Infiltration; Dimpling on moving lump = Tethering to Cooper ligaments',
              'Fixity to Pectoralis Major Muscle: Move lump parallel and perpendicular to muscle fibers with muscle relaxed, then repeat with patient pressing hands firmly against hips to contract pectoralis major. If mobility is RESTRICTED when muscle contracts = Fixed to Pectoralis Major!',
              'Fixity to Chest Wall (Ribs / Intercostal muscles): If lump remains fixed and immobile even with pectoralis muscle relaxed = Fixed to Chest Wall (T4b)',
            ],
          },
          {
            label: 'Axillary & Supraclavicular Lymph Node Examination',
            description: 'Examine axilla with patient sitting, supporting patient arm with examiner arm to relax pectoral muscles.',
            checklist: [
              'Anterior / Pectoral group: Palpate along anterior axillary fold (lateral border of pectoralis major)',
              'Posterior / Subscapular group: Palpate along posterior axillary fold (latissimus dorsi)',
              'Lateral / Brachial group: Palpate against upper medial aspect of humerus',
              'Central group: Palpate high in axilla against rib cage',
              'Apical group: Palpate at apex of axilla beneath clavicle',
              'Supraclavicular lymph nodes: Palpate from behind patient in supraclavicular fossa',
            ],
          },
        ],
      },
      {
        title: '3. Triple Assessment & TNM Staging',
        items: [
          {
            label: 'The Triple Assessment Protocol',
            description: 'Gold standard diagnostic approach (concordance > 99% accuracy).',
            checklist: [
              '1. Clinical Examination (Bimanual breast and nodal exam)',
              '2. Imaging: Ultrasound Breast in women < 35 years (dense fibroglandular tissue) vs Digital Mammography with Tomosynthesis in women >= 35 years (BIRADS category 1 to 6; spiculation, pleomorphic microcalcifications, architectural distortion)',
              '3. Pathological: Core Needle Biopsy (CNB) is gold standard (distinguishes in-situ from invasive carcinoma and allows ER, PR, HER2-neu, and Ki-67 receptor testing); FNAC cannot assess invasion or receptor architecture!',
            ],
          },
          {
            label: 'Surgical Management',
            description: 'Early Breast Cancer (Stage I, II): Breast Conserving Surgery (BCS / Wide local excision) + Sentinel Lymph Node Biopsy (SLNB) + Radiotherapy, OR Modified Radical Mastectomy (MRM: Patey or Madden). Locally Advanced (Stage III): Neoadjuvant Chemotherapy followed by surgery.',
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'What is Triple Assessment for breast diseases and why is Core Needle Biopsy preferred over FNAC?',
        answer: 'Triple Assessment is the diagnostic triad of: 1) Clinical Breast Examination, 2) Radiological Imaging (Mammography / Ultrasound), and 3) Pathological Biopsy. Core Needle Biopsy (CNB, using 14-gauge Tru-Cut needle) is preferred over FNAC because: a) CNB provides tissue histology rather than cytology, reliably differentiating Invasive Carcinoma from Carcinoma In Situ (DCIS); b) It provides receptor status (ER, PR, HER2-neu) and proliferation marker Ki-67 needed to plan neoadjuvant chemotherapy; c) It has a much lower false-negative rate.',
        examinerTip: 'FNAC is now reserved primarily for assessing suspicious axillary lymph nodes under ultrasound guidance.',
      },
      {
        question: 'What are the Berg Levels of Axillary Lymph Nodes and their surgical boundaries?',
        answer: 'The levels are defined by their anatomical relationship to the Pectoralis Minor muscle: Level I: Nodes lateral and inferior to the lateral border of pectoralis minor (external mammary, scapular, lateral groups); Level II: Nodes behind/deep to pectoralis minor (central group, interpectoral Rotter nodes); Level III: Nodes medial and superior to the medial border of pectoralis minor extending up to the apex/Halsted ligament (apical group).',
        examinerTip: 'In standard Modified Radical Mastectomy (MRM), Level I and Level II nodes are routinely cleared; Level III is cleared only if Level II is visibly involved.',
      },
      {
        question: 'What two critical nerves must be identified and preserved during axillary dissection, and what are the consequences of injuring them?',
        answer: '1) Long Thoracic Nerve of Bell (Nerve to Serratus Anterior, originates from C5, C6, C7 roots): Runs vertically on the medial wall of the axilla over serratus anterior. Injury causes Winging of Scapula and inability to abduct arm above 90 degrees. 2) Thoracodorsal Nerve (Nerve to Latissimus Dorsi, from posterior cord C6-C8): Runs with thoracodorsal vessels on the posterior axillary wall. Injury weakens adduction and internal rotation of the arm ("scratching the opposite buttock" or climbing).',
        examinerTip: 'Also mention the Intercostobrachial nerve (T2 lateral cutaneous): divided routinely during axillary clearance, causing temporary numbness over the inner upper arm.',
      },
      {
        question: 'What is the difference between Patey and Madden Modified Radical Mastectomy?',
        answer: 'Both procedures excise the entire breast, nipple-areola complex, overlying skin, and pectoralis major fascia, combined with axillary clearance. The difference lies in the pectoralis minor: In Patey MRM, the Pectoralis Minor muscle is excised or divided to facilitate access to Level III apical nodes. In Madden MRM, the Pectoralis Minor muscle is completely PRESERVED and retracted, reducing postoperative pain and cosmetic morbidity while achieving equivalent oncology clearance.',
        examinerTip: 'Madden is the technique performed in modern surgery worldwide.',
      },
    ],
  },

  // 9. SURGERY - THYROID
  {
    id: 'thyroid_proforma',
    title: 'Thyroid Gland Swelling Case Proforma',
    system: 'General Surgery',
    department: 'General Surgery / Endocrine',
    summary: 'Master surgical examination proforma for Goitre, Solitary Thyroid Nodule (STN), Multinodular Goitre (MNG), Hashimoto Thyroiditis, and Thyroid Carcinoma.',
    examPearl: 'A neck swelling that moves upwards on deglutition is thyroid because the pretracheal fascia anchors the thyroid gland to the cricoid and thyroid cartilages via Berry suspensory ligament. If it ALSO moves with tongue protrusion, it is a Thyroglossal Cyst.',
    diagramPath: '/diagrams/anatomy/carotid_triangle_boundaries_contents.jpg',
    diagramTitle: 'Carotid Triangle, Thyroid Gland Relations & Surgical Anatomy',
    sections: [
      {
        title: '1. History & Functional Assessment',
        items: [
          {
            label: 'Chief Complaints',
            description: 'Swelling in front of neck, duration, rate of growth, pain.',
            checklist: [
              'Neck swelling: Duration (years in colloid goitre vs rapid enlargement in anaplastic carcinoma or lymphoma)',
              'Pressure / Compressive Symptoms: Dyspnea / stridor on lying supine (tracheal compression), Dysphagia to solids (esophageal compression), Hoarseness of voice (Recurrent Laryngeal Nerve infiltration by malignancy)',
              'Pain: Sudden painful enlargement indicates hemorrhage into a colloid nodule or subacute de Quervain thyroiditis',
            ],
          },
          {
            label: 'Thyrotoxicosis vs Hypothyroidism Checklist',
            description: 'Assess functional status (Wayne and Newcastle index).',
            checklist: [
              'Toxic Symptoms: Heat intolerance, excessive sweating, palpitation, weight loss despite increased appetite, diarrhea/frequent stools, tremors, emotional lability, oligomenorrhea',
              'Hypothyroid Symptoms: Cold intolerance, weight gain with poor appetite, constipation, dry coarse skin, hoarseness, lethargy, facial puffiness, menorrhagia',
            ],
          },
        ],
      },
      {
        title: '2. Local Examination of Thyroid Gland',
        items: [
          {
            label: 'Inspection',
            description: 'Patient sitting, neck slightly extended. Good tangential lighting.',
            checklist: [
              'Location: Lower anterior neck (isthmus over 2nd, 3rd, 4th tracheal rings; lateral lobes extending from thyroid cartilage down to 6th tracheal ring)',
              'Deglutition test: Give patient a sip of water and observe upward movement during swallowing',
              'Tongue protrusion test: Swelling does NOT move with tongue protrusion (distinguishes thyroid from thyroglossal cyst, which moves up on both swallowing AND protruding tongue!)',
              'Skin over swelling, dilated veins, surgical scars',
              'Pemberton Sign: Ask patient to raise both arms above head until they touch the ears for 1 full minute. Positive if facial plethora, cyanosis, and engorged neck veins develop = RETROSTERNAL GOITRE compressing the thoracic inlet (thoracic inlet obstruction syndrome)',
            ],
          },
          {
            label: 'Palpation',
            description: 'Palpate from BEHIND the seated patient using fingers of both hands while patient flexes neck slightly (relaxes sternocleidomastoid muscles).',
            checklist: [
              'Method of Palpation: Crile method (palpate from front with thumb) vs Lahey method (examiner uses one hand to push thyroid to opposite side to palpate other lobe from behind)',
              'Delineate Swelling: Number of nodules (Solitary nodule vs Multinodular vs Diffuse), size, surface, consistency (Soft in colloid, Firm in Hashimoto/MNG, Stony hard in anaplastic carcinoma, calcified nodule, or Riedel thyroiditis)',
              'Lower Border: Can you get below the lower border? If lower border CANNOT be felt on swallowing = Retrosternal Extension!',
              'Berry Sign: Palpate carotid pulsations in the lower neck: In benign goitre, the carotid pulse is pushed posterolaterally but remains easily palpable; In malignant thyroid cancer invading the carotid sheath, the carotid pulse is encased or absent (Berry sign positive)',
              'Kocher Test: Gentle lateral compression of lateral lobes produces stridor = Tracheomalacia or scabbard trachea',
              'Tracheal Position: Palpate trachea above sternal notch to detect lateral deviation',
            ],
          },
          {
            label: 'Percussion & Auscultation',
            description: 'Retrosternal dullness and thyroid bruit.',
            checklist: [
              'Percussion over Manubrium Sterni: Dullness over upper sternum indicates retrosternal goitre (normally resonant)',
              'Auscultation of Upper Poles: Systolic bruit heard over superior thyroid artery in Graves disease (distinguishes Graves from toxic MNG)',
            ],
          },
          {
            label: 'Cervical Lymph Nodes & Eye Signs',
            description: 'Examine lymph nodes (Levels I to VI) and ocular signs.',
            checklist: [
              'Cervical Lymph Nodes: Levels I (submental/submandibular), II, III, IV (internal jugular chain), V (posterior triangle), VI (pretracheal / paratracheal Delphian nodes; common early site in papillary carcinoma)',
              'Eye Signs in Graves Disease: Exophthalmos / proptosis (Hertel exophthalmometer), Von Graefe sign (lid lag on looking down), Dalrymple sign (staring look with visible sclera above cornea), Stellwag sign (infrequent blinking), Moebius sign (convergence failure), Joffroy sign (absent forehead wrinkling on looking up)',
            ],
          },
        ],
      },
      {
        title: '3. Investigations & Surgical Procedures',
        items: [
          {
            label: 'Standard Workup',
            description: 'Serum TSH (first test) -> Ultrasound Neck (TIRADS classification) -> FNAC under ultrasound (Bethesda classification I to VI).',
          },
          {
            label: 'Surgical Options & Complications',
            description: 'Hemithyroidectomy / Lobectomy (for benign solitary nodule or low-risk papillary microcarcinoma) vs Total Thyroidectomy (for MNG, toxic goitre, or thyroid cancer). Key complications: 1) Hemorrhage & hematoma causing airway compromise (immediate bed opening), 2) Recurrent Laryngeal Nerve palsy (unilateral hoarseness, bilateral aphonia and stridor), 3) Hypoparathyroidism / Hypocalcemia (Chvostek and Trousseau signs; treat with IV Calcium Gluconate).',
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Why does the Thyroid Gland move upwards on deglutition, and why is this clinically important?',
        answer: 'The thyroid gland is enclosed by the pretracheal layer of deep cervical fascia. Posteriomedially, this fascia condenses to form the Suspensory Ligament of Berry, which firmly anchors each thyroid lobe to the cricoid cartilage and upper tracheal rings. When the patient swallows, the larynx and cricoid cartilage are elevated by the suprahyoid muscles, pulling the thyroid gland upwards with it. Differentiating value: Swellings arising from the thyroid (goitre, adenoma, cancer) move with deglutition, whereas branchial cysts, lipomas, carotid body tumors, and cervical lymph nodes do NOT move with swallowing (except subhyoid bursitis, prelaryngeal Delphian lymph nodes, and thyroglossal cyst).',
        examinerTip: 'Remember: A fixed malignant thyroid cancer or giant fibrotic Riedel thyroiditis may lose its movement on deglutition due to local infiltration!',
      },
      {
        question: 'What is Pemberton Sign and what does a positive sign indicate?',
        answer: "Pemberton sign is tested by asking the patient to elevate both arms above the head until the arms touch the sides of the face, and hold them there for 60 seconds. A POSITIVE sign is the development of facial congestion, plethora, cyanosis, and marked engorgement of neck veins (sometimes accompanied by stridor or dizziness). It indicates a RETROSTERNAL GOITRE causing thoracic inlet obstruction, where elevating the arms draws the clavicles inwards and pushes the thyroid mass deeper into the narrow thoracic inlet, compressing the internal jugular veins and trachea.",
        examinerTip: 'Examiners consider this a must-know clinical sign for all long cases of multinodular goitre.',
      },
      {
        question: 'What is Berry Sign (Carotid Pulse displacement)?',
        answer: 'Berry sign assesses the relationship between a thyroid enlargement and the common carotid artery. In benign goitre, the expanding thyroid pushes the carotid artery posterolaterally; therefore, the carotid pulse remains easily palpable along the posterior border of the swelling. In malignant thyroid carcinoma (especially anaplastic or invasive papillary), the tumor infiltrates and encases the carotid sheath; the carotid pulse becomes muffled, non-palpable, or obliterated. Berry sign is said to be positive when the carotid pulse is absent/obliterated by a malignant thyroid mass.',
        examinerTip: 'Named after Sir James Berry (not to be confused with the ligament of Berry!).',
      },
      {
        question: 'What are the manifestations and clinical tests for Post-Thyroidectomy Hypocalcemia?',
        answer: 'Hypocalcemia results from inadvertent removal, devascularization, or infarction of the parathyroid glands during thyroidectomy. Clinical manifestations appear 24-48 hours post-op: perioral numbness, tingling in fingertips and toes (parasthesia), carpopedal spasm, and tetany. Clinical tests: 1) Chvostek Sign: Tapping the facial nerve at the angle of the jaw produces twitching of the ipsilateral facial muscles (corner of mouth, nose, eye); 2) Trousseau Sign: Inflating a sphygmomanometer cuff on the arm 20 mmHg above systolic BP for 3 minutes produces painful carpopedal spasm (wrist flexion, MCP flexion, interphalangeal extension, thumb adduction — "obstetrician hand"). Treatment: 10 mL of 10% IV Calcium Gluconate over 10 minutes.',
        examinerTip: 'Trousseau sign is much more sensitive and specific (positive in 94% of hypocalcemic patients) than Chvostek sign (which can be false positive in 10-15% of normal individuals).',
      },
      {
        question: 'What is the Bethesda System for Reporting Thyroid Cytopathology on FNAC?',
        answer: 'Bethesda classifies thyroid FNAC into 6 diagnostic categories: Category I: Unsatisfactory / Non-diagnostic (repeat FNA); Category II: Benign (colloid nodule, Hashimoto; risk of malignancy 0-3%; observation); Category III: Atypia of Undetermined Significance / Follicular Lesion of Undetermined Significance (AUS/FLUS; risk 10-30%); Category IV: Follicular Neoplasm / Suspicious for a Follicular Neoplasm (risk 25-40%; diagnostic lobectomy needed because FNAC cannot evaluate capsular or vascular invasion); Category V: Suspicious for Malignancy (risk 50-75%; surgery indicated); Category VI: Malignant (papillary, medullary, anaplastic; risk 97-100%; total thyroidectomy).',
        examinerTip: 'Examiners always ask: "Can FNAC differentiate Follicular Adenoma from Follicular Carcinoma?" Answer: NO! Only histological demonstration of capsular or vascular invasion on paraffin section can diagnose follicular carcinoma.',
      },
    ],
  },

  // 10. PEDIATRICS
  {
    id: 'pediatrics_proforma',
    title: 'Pediatric Clinical Case Proforma',
    system: 'Pediatrics',
    department: 'Pediatrics & Neonatology',
    summary: 'Master examination proforma for Protein Energy Malnutrition (PEM - Marasmus & Kwashiorkor), Thalassemia, Nephrotic Syndrome, Bronchiolitis, and Developmental Delay.',
    examPearl: 'Always calculate Anthropometry percentiles and classify malnutrition using IAP (Weight-for-Age) and WHO Z-score charts (Weight-for-Height for acute wasting, Height-for-Age for chronic stunting).',
    diagramPath: '/diagrams/clinical/consolidation_vs_pleural_effusion.jpg',
    diagramTitle: 'Pediatric Respiratory Assessment & Lung Signs',
    sections: [
      {
        title: '1. Pediatric History & Birth Records',
        items: [
          {
            label: 'Birth & Neonatal History',
            description: 'Antenatal care, birth weight, gestational age at delivery, birth asphyxia, resuscitation, APGAR score, neonatal jaundice, phototherapy, NICU stay.',
          },
          {
            label: 'Dietary & Nutritional History',
            description: 'Exclusive breastfeeding for first 6 months, age of introduction of complementary feeding, calorie and protein deficit calculation using 24-hour dietary recall.',
          },
          {
            label: 'Developmental Milestones',
            description: 'Gross Motor (Neck holding 3m, Sitting with support 6m, Sitting without support 8m, Standing without support 10-12m, Walking 12-15m), Fine Motor (Bidextrous reach 4m, Unidextrous reach 6m, Pincer grasp 9m), Language (Coos 3m, Monosyllables 6m, Bisyllables "ba-ba" 9m, First meaningful word 12m), Social (Social smile 2m, Recognizes mother 3m, Stranger anxiety 6m, Wave bye-bye 9m).',
          },
          {
            label: 'Immunization History',
            description: 'National Immunization Schedule (NIS): Birth (BCG, OPV-0, HepB-0), 6-10-14 weeks (Pentavalent: DPT+HepB+Hib, IPV, Rotavirus, PCV), 9 months (MR-1, JE-1, Vitamin A 1 lakh IU), 16-24 months (MR-2, DPT booster, OPV booster), 5 years (DPT booster-2), 10 and 16 years (Td).',
          },
        ],
      },
      {
        title: '2. Anthropometric Examination',
        items: [
          {
            label: 'Growth Measurements',
            description: 'Essential measurements for assessing nutritional status.',
            checklist: [
              'Weight: Recorded on digital scale without clothes (normal birth weight 2.5-3.5 kg, doubles by 5 months, triples by 1 year, quadruples by 2 years)',
              'Length (< 2 years on infantometer) / Height (> 2 years on stadiometer): Normal length 50 cm at birth, 75 cm at 1 year, doubles to 100 cm at 4 years',
              'Head Circumference: 35 cm at birth, 45 cm at 1 year, 50 cm at 5 years (cross-tape over occiput and supraorbital ridges)',
              'Mid-Upper Arm Circumference (MUAC): Shakir tape between acromion and olecranon (11.5 to 12.5 cm = Moderate Acute Malnutrition; < 11.5 cm = Severe Acute Malnutrition [SAM])',
              'Classification: IAP Classification (Weight-for-Age: Grade I 71-80%, Grade II 61-70%, Grade III 51-60%, Grade IV <= 50%); Waterlow Classification (Stunting = Height-for-Age; Wasting = Weight-for-Height)',
            ],
          },
        ],
      },
      {
        title: '3. Physical Examination & Systemic Evaluation',
        items: [
          {
            label: 'Malnutrition Stigmata (Marasmus vs Kwashiorkor)',
            description: 'Clinical markers of severe malnutrition.',
            checklist: [
              'Marasmus: Severe wasting of muscle and subcutaneous fat, "old man" / "monkey facies", sunken eyes, prominent ribs, loose bag of skin over buttocks',
              'Kwashiorkor: Bilateral pitting pedal edema (sine qua non), moon face, sparse hypopigmented hair (flag sign), flaky-paint dermatosis, crazy-pavement dermatosis, apathy and misery, hepatomegaly with fatty liver',
              'Micronutrient Deficiencies: Vitamin A (Bitot spots, xerophthalmia, keratomalacia), Vitamin D (Rickets: craniotabes, rachitic rosary, Harrison sulcus, widening of wrists, genu varum/valgum), Vitamin C (Scurvy: bleeding gums, subperiosteal hematoma)',
            ],
          },
          {
            label: 'Thalassemia & Anemia Facies',
            description: 'Features of chronic extramedullary hematopoiesis.',
            checklist: [
              'Frontal bossing, parietal bossing, prominent malar bones, depressed nasal bridge, chipmunk facies, dental malocclusion, pallor, icterus, massive hepatosplenomegaly',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'What is the diagnostic definition and criteria for Severe Acute Malnutrition (SAM) according to WHO?',
        answer: 'SAM in children aged 6 to 59 months is defined by the presence of ANY ONE of the following three criteria: 1) Weight-for-Height / Length < -3 Z-scores (standard deviations) of the WHO growth standards; OR 2) Mid-Upper Arm Circumference (MUAC) < 11.5 cm; OR 3) Presence of bilateral nutritional pitting edema (regardless of anthropometry, as in Kwashiorkor).',
        examinerTip: 'Always mention that SAM with complications (anorexia, hypothermia, hypoglycemia, severe infection, severe anemia) requires inpatient NRC (Nutrition Rehabilitation Center) admission for F-75 / F-100 diet.',
      },
      {
        question: 'What are the 10 steps in the WHO management of Severe Acute Malnutrition?',
        answer: 'Divided into Initial Stabilization (Days 1-7) and Rehabilitation (Weeks 2-6): 1) Treat/prevent Hypoglycemia (10% dextrose); 2) Treat/prevent Hypothermia (KMC, warm blankets); 3) Treat/prevent Dehydration (ReSoMal — rehydration solution for malnutrition; never use standard ORS due to high sodium!); 4) Correct electrolyte imbalance (potassium and magnesium supplementation, NO extra sodium); 5) Treat/prevent Infection (broad-spectrum parenteral antibiotics); 6) Correct micronutrient deficiencies (Vitamin A, Zinc, Folic acid; iron is WITHHELD until child starts gaining weight!); 7) Start cautious feeding (F-75 diet: 75 kcal/100 mL, 0.9 g protein); 8) Achieve catch-up growth (F-100 diet: 100 kcal, 2.9 g protein); 9) Sensory stimulation and emotional play; 10) Prepare for discharge and follow-up.',
        examinerTip: 'Why is iron contraindicated in the initial stabilization phase of SAM? Answer: Free iron promotes bacterial proliferation (in free-iron saturated serum) and generates reactive oxygen species, precipitating fatal sepsis and heart failure!',
      },
      {
        question: 'What are the classic radiographic and clinical skeletal signs of Nutritional Rickets?',
        answer: 'Clinical signs: Craniotabes (ping-pong ball sensation on palpating parieto-occipital sutures in infants < 6m), large anterior fontanelle (> 18m), frontal bossing, delayed tooth eruption, Rachitic Rosary (beading of costochondral junctions), Harrison sulcus (groove corresponding to diaphragmatic attachment), widening of wrists and ankles, bow legs (genu varum) or knock knees (genu valgum). X-ray wrist (AP view): Cupping (concave metaphysis), Splaying (widened metaphysis), Fraying (brush-like, irregular zone of provisional calcification), and increased distance between epiphysis and metaphysis.',
        examinerTip: 'Remember: Treatment is single-dose Stoss therapy (300,000 to 600,000 IU of Vitamin D3 orally) or daily 2,000-5,000 IU for 4-6 weeks with oral calcium.',
      },
    ],
  },

  // 11. ORTHOPAEDICS
  {
    id: 'orthopaedics_proforma',
    title: 'Orthopaedics & Trauma Case Proforma',
    system: 'Orthopaedics',
    department: 'Orthopaedics & Traumatology',
    summary: 'Master clinical proforma for Chronic Osteomyelitis, Fractures (Neck of Femur, Shaft of Femur), Peripheral Nerve Injuries (Radial, Median, Ulnar), CTEV (Clubfoot), and Hip Joint Pathologies.',
    examPearl: 'The classical orthopaedic clinical examination sequence is always: Look (inspection), Feel (palpation), Move (range of motion active & passive), Measure (limb length true vs apparent, limb girth), and Special Tests.',
    diagramPath: '/diagrams/orthopaedics/ctev_clubfoot_pirani_scoring.jpg',
    diagramTitle: 'CTEV (Clubfoot): Anatomical Deformities & Pirani Score',
    sections: [
      {
        title: '1. Trauma & History',
        items: [
          {
            label: 'Chief Complaints',
            description: 'Pain, swelling, deformity, inability to bear weight / loss of function, discharging sinus.',
            checklist: [
              'Mechanism of injury: High-energy (RTA) vs Low-energy fall in elderly (osteoporotic fracture)',
              'Deformity: Shortening and external rotation of lower limb (Fracture Neck of Femur)',
              'Chronic bone infection: History of acute bone pain and high fever in childhood followed by spontaneous burst with discharging bone fragments (Sequester) = Chronic Osteomyelitis',
              'Peripheral nerve injury: Wrist drop (Radial nerve), Claw hand (Ulnar nerve), Ape thumb / Hand of Benediction (Median nerve), Foot drop (Common Peroneal nerve)',
            ],
          },
        ],
      },
      {
        title: '2. Clinical Examination: Look, Feel, Move, Measure',
        items: [
          {
            label: 'LOOK (Inspection)',
            description: 'Attitude of the limb, skin, scars, sinuses, deformities, and muscle wasting.',
            checklist: [
              'Attitude of Limb: Normal alignment vs Fixed Flexion Deformity (FFD), abduction/adduction, internal/external rotation',
              'Deformity: Cubitus varus (gunstock deformity after supracondylar fracture of humerus), Genu valgum / varum',
              'Skin & Sinuses: Puckered sinus adherent to underlying bone with seropurulent discharge and sprouting granulation tissue (Chronic Osteomyelitis)',
              'Swelling: Bony enlargement, expanding swelling (osteosarcoma), joint effusion',
            ],
          },
          {
            label: 'FEEL (Palpation)',
            description: 'Confirm findings with warm hands.',
            checklist: [
              'Local temperature & tenderness: Warmth over active inflammation or vascular tumor; pinpoint bony tenderness over fracture site or metaphyseal osteomyelitis',
              'Bony contour & Thickening: Irregular thickened bone (Involucrum in chronic osteomyelitis)',
              'Joint effusion: Patellar tap test (moderate effusion) and Fluid shift test (minor effusion)',
            ],
          },
          {
            label: 'MOVE (Range of Motion)',
            description: 'Test Active and Passive Range of Motion (ROM) with goniometer. Note crepitus and pain.',
            checklist: [
              'Record exact degrees: Flexion, extension, abduction, adduction, internal rotation, external rotation',
              'Pain during movement: Throughout range (arthritis) vs terminal range only (periarthritis)',
              'Crepitus: Fine crepitus (synovial thickening) vs Coarse bone-on-bone grating crepitus (advanced osteoarthritis)',
            ],
          },
          {
            label: 'MEASURE (Limb Length & Girth)',
            description: 'Measure with inextensible tape.',
            checklist: [
              'True Limb Length: Measured from ASIS to medial malleolus with both limbs placed in symmetrical position (True shortening indicates pathology in femur, tibia, or hip joint)',
              'Apparent Limb Length: Measured from Xiphisternum / Umbilicus to medial malleolus (Apparent shortening caused by pelvic tilt in fixed adduction/abduction deformity without bony shortening!)',
              'Bryant Triangle & Nelaton Line: Supratrochanteric shortening (neck of femur fracture, Perthes disease, coxa vara)',
              'Limb Girth / Circumference: Quadriceps / calf wasting at fixed distances from joint line',
            ],
          },
        ],
      },
      {
        title: '3. Special Orthopaedic Tests',
        items: [
          {
            label: 'Hip, Spine & Foot Tests',
            description: 'Specific clinical diagnostic maneuvers.',
            checklist: [
              'Thomas Test: Detects Fixed Flexion Deformity (FFD) of hip; flex sound hip fully until lumbar lordosis is flattened on the couch: If affected thigh rises off couch = FFD present (angle between couch and thigh = degrees of FFD)',
              'Trendelenburg Test: Assesses abductor mechanism of hip (Gluteus medius and minimus, superior gluteal nerve); patient stands on affected leg: If opposite pelvis drops = POSITIVE Trendelenburg (abductor weakness, unreduced congenital hip dysplasia, nonunion neck of femur, coxa vara)',
              'Galeazzi Sign: Patient supine with hips and knees flexed 90 degrees with feet flat on bed: Unequal knee height indicates femur shortening (knee lower anteriorly) or tibia shortening (knee lower vertically)',
              'Pirani Score for CTEV: 6 signs (3 midfoot: Medial crease, Talar head coverage, Curved lateral border; 3 hindfoot: Posterior crease, Empty heel, Rigid equinus); Each scored 0, 0.5, or 1 (Max score 6; guides Ponseti casting)',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'What is Sequestrum, Involucrum, and Cloaca in Chronic Osteomyelitis?',
        answer: '1) Sequestrum: A piece of dead, devitalized bone separated from sound bone by osteoclastic granulation tissue. On X-ray, it appears dense, sclerotic, and chalky-white because it has lost its blood supply and does not undergo disuse osteopenia. 2) Involucrum: A sheath of new periosteal living bone formed around the dead sequestrum by the elevated, hypervascular periosteum. 3) Cloaca: Openings or holes in the involucrum through which infected pus and small sequestra extrude out to reach the skin surface via a sinus tract.',
        examinerTip: 'Examiners always ask: "What is Sequestrectomy and Saucerization?" Answer: Sequestrectomy is the surgical removal of dead sequestrum. Saucerization (Winnett-Orr technique) is converting a deep cavity in the bone into a flat saucer shape to eliminate dead space and allow granulation tissue to fill it.',
      },
      {
        question: 'What is the Garden classification of Intracapsular Femoral Neck Fractures?',
        answer: 'Garden classification is based on AP pelvis X-ray alignment of trabeculae: Stage I: Incomplete / impacted fracture with valgus alignment; Stage II: Complete fracture without displacement (intact trabecular angle); Stage III: Complete fracture with partial displacement (trabeculae out of line, < 50% displacement); Stage IV: Complete fracture with total displacement (femoral head trabeculae re-align with acetabular trabeculae).',
        examinerTip: 'Stages III and IV have high rates of Avascular Necrosis (AVN) of femoral head due to disruption of retinacular vessels (branches of medial circumflex femoral artery), requiring Hemiarthroplasty or Total Hip Replacement in elderly patients.',
      },
      {
        question: 'What are the motor and sensory deficits in Radial, Median, and Ulnar Nerve injuries at the wrist and elbow?',
        answer: '1) Radial Nerve: High lesion (spiral groove / humerus shaft fracture) causes WRIST DROP, finger drop, and sensory loss over the first dorsal web space. 2) Median Nerve: Low lesion (wrist / carpal tunnel) causes APE THUMB deformity (thenar atrophy, loss of thumb abduction and opponens) with sensory loss over lateral 3.5 digits; High lesion causes Pointing sign / Hand of Benediction on attempting to make a fist. 3) Ulnar Nerve: Low lesion at wrist causes CLAW HAND deformity (hyperextension of MCP joints and flexion of IP joints in 4th and 5th digits due to lumbrical paralysis) and sensory loss over medial 1.5 digits; High lesion at elbow produces a LESS severe clawing (Ulnar Paradox) because the medial half of Flexor Digitorum Profundus is also paralyzed!',
        examinerTip: 'The "Ulnar Paradox" (higher lesion causes less deformity) is an absolute favorite viva question in every orthopaedics and surgery exam!',
      },
      {
        question: 'What are the 4 anatomical deformities of CTEV (Clubfoot) and what is the Ponseti correction order?',
        answer: 'The 4 deformities are remembered by the acronym CAVE: C - Cavus (high medial longitudinal arch); A - Adductus (forefoot adduction at tarsometatarsal joints); V - Varus (hindfoot/calcaneus inversion); E - Equinus (plantarflexion at ankle joint). Ponseti Correction Order: Correct C-A-V together first, and Equinus LAST! 1) First: Elevate 1st metatarsal to correct Cavus; 2) Abduct the forefoot in supination while counter-pressing on lateral talar head (corrects Adductus and Varus); 3) Last: Correct Equinus by dorsiflexion (often requiring percutaneous Achilles tenotomy in 85-90% of cases). Maintain in Steenbeek / Denis Browne abduction splint.',
        examinerTip: 'Never counter-press on the calcaneus or cuboid during Ponseti manipulation, as this blocks the calcaneus from swinging out from under the talus!',
      },
    ],
  },

  // 12. OBGYN
  {
    id: 'obgyn_proforma',
    title: 'Obstetrics & Gynaecology (OBG) Proforma',
    system: 'Obstetrics & Gynaecology',
    department: 'Obstetrics & Gynaecology',
    summary: 'Antenatal clerking, Leopold maneuvers (4 abdominal grips), Gestational Diabetes (GDM), Pre-eclampsia, and Mechanism of Normal Labor.',
    examPearl: 'Naegele Rule for calculating Expected Date of Delivery (EDD): Add 9 calendar months and 7 days to the first day of the Last Menstrual Period (LMP).',
    diagramPath: '/diagrams/clinical/mechanism_of_normal_labor_cardinal_movements.jpg',
    diagramTitle: 'Mechanism of Normal Labor: The 7 Cardinal Movements',
    sections: [
      {
        title: '1. Obstetric History & Dating',
        items: [
          {
            label: 'Obstetric Formula',
            description: 'Gravida (total pregnancies including current), Para (births past 28 weeks viable age), Abortions (< 28 weeks), Living children (G_ P_ A_ L_).',
          },
          {
            label: 'Dating & Gestational Age',
            description: 'LMP (Last Menstrual Period), EDD calculated by Naegele rule. Period of Gestation (POG) in completed weeks.',
          },
          {
            label: 'Trimester-wise History',
            description: '1st Trimester (hyperemesis, bleeding, folic acid), 2nd Trimester (quickening at 16-20w, anomaly scan at 18-20w), 3rd Trimester (headache, epigastric pain, visual blur for preeclampsia; fetal kicks count).',
          },
        ],
      },
      {
        title: '2. Obstetric Abdominal Examination (Leopold Maneuvers)',
        items: [
          {
            label: 'The 4 Leopold Grips',
            description: 'Palpation of gravid uterus to determine lie, presentation, position, and engagement.',
            checklist: [
              '1. Fundal Grip: Palpate fundus facing patient face to identify fetal pole (Broad, soft, irregular = Breech; Hard, round, ballotable = Head)',
              '2. Lateral / Umbilical Grip: Place hands on lateral uterine walls: Smooth, continuous curved resistance = Fetal back; Irregular knob-like small parts = Fetal limbs',
              '3. Pawlik Grip (First Pelvic Grip): Grasp lower uterine segment above symphysis pubis with right hand (thumb and fingers): If presenting part is mobile = Not engaged; If fixed = Engaged',
              '4. Deep Pelvic Grip (Second Pelvic Grip): Face patient feet, press fingers downward into pelvic brim: Converging fingers = Head not engaged; Diverging fingers = Head deeply engaged; Identify cephalic prominence (occiput vs sinciput)',
            ],
          },
          {
            label: 'Symphysio-Fundal Height (SFH) & FHS',
            description: 'SFH measured with tape from upper border of pubic symphysis to uterine fundus (SFH in cm corresponds to weeks of gestation between 24 and 36 weeks). Fetal Heart Sound (FHS) auscultated with Pinard stethoscope / Doppler (normal 110-160 bpm).',
          },
          {
            label: 'The 7 Cardinal Movements of Normal Labor',
            description: 'The mechanical progression of the fetal head through the birth canal.',
            checklist: [
              '1. Engagement (Biparietal diameter passes pelvic inlet)',
              '2. Descent (Continuous throughout labor)',
              '3. Flexion (Suboccipitobregmatic 9.5 cm presents instead of occipitofrontal 11.5 cm)',
              '4. Internal Rotation of Head (Occiput rotates 2/8th or 1/8th of a circle anteriorly towards pubic symphysis on pelvic floor)',
              '5. Extension (Head is born by extension as occiput pivots around lower border of symphysis pubis)',
              '6. Restitution (Head aligns 1/8th of circle back to bisacromial shoulder diameter)',
              '7. External Rotation of Head & Expulsion (Shoulders rotate internally, head rotates externally; anterior shoulder born under pubis followed by posterior shoulder and trunk)',
            ],
          },
        ],
      },
      {
        title: '3. High-Risk Obstetric Assessment',
        items: [
          {
            label: 'Pre-eclampsia & GDM Screening',
            description: 'Diagnostic criteria and emergency management.',
            checklist: [
              'Pre-eclampsia: BP >= 140/90 mmHg on two occasions 4 hours apart after 20 weeks with proteinuria (>= 1+ dipstick or >= 300 mg/24h) or end-organ dysfunction',
              'Severe Features: BP >= 160/110, platelets < 100,000, serum creatinine > 1.1, transaminases doubled, pulmonary edema, new visual/cerebral disturbances',
              'Eclampsia Prophylaxis: Magnesium Sulfate (Pritchard regimen: 4g IV + 10g IM loading dose, then 5g IM every 4 hours in alternate buttocks; monitor patellar reflex, RR > 16, urine output > 30 mL/h; antidote 10% Calcium Gluconate)',
              'Gestational Diabetes (GDM - DIPSI criteria): Single-step 75g oral glucose load irrespective of fasting state; plasma glucose >= 140 mg/dL after 2 hours is diagnostic of GDM!',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'What is the Pritchard Regimen for Magnesium Sulfate in Severe Pre-eclampsia / Eclampsia?',
        answer: 'Loading Dose: 4g of 20% MgSO4 IV slowly over 10-15 minutes PLUS 10g of 50% MgSO4 IM (5g deep IM in each buttock with 1 mL 2% xylocaine). Maintenance Dose: 5g of 50% MgSO4 deep IM in alternate buttocks every 4 hours for 24 hours after delivery or 24 hours after the last convulsion (whichever is later). Monitoring Criteria before each dose: 1) Knee jerk / patellar reflex MUST be present; 2) Respiratory rate MUST be >= 16/min; 3) Urine output MUST be >= 30 mL/hour (>= 100 mL over preceding 4 hours). Antidote: 10 mL of 10% IV Calcium Gluconate over 10 minutes.',
        examinerTip: 'Examiners always ask: "Which sign of MgSO4 toxicity appears first?" Answer: Loss of patellar reflex (appears at 8-10 mEq/L serum level; respiratory depression occurs at 12 mEq/L; cardiac arrest occurs at > 15 mEq/L).',
      },
      {
        question: 'What is Bishop Score and what score indicates a favorable cervix for induction of labor?',
        answer: 'Bishop score evaluates cervical readiness for induction based on 5 parameters (each scored 0 to 2 or 3; max score 13): 1) Cervical Dilatation (0: closed, 1: 1-2 cm, 2: 3-4 cm, 3: >= 5 cm); 2) Cervical Effacement % (0: 0-30%, 1: 40-50%, 2: 60-70%, 3: >= 80%); 3) Cervical Consistency (0: firm, 1: medium, 2: soft); 4) Cervical Position (0: posterior, 1: mid-position, 2: anterior); 5) Fetal Station relative to ischial spines (0: -3, 1: -2, 2: -1/0, 3: +1/+2). A score >= 6 (or >= 8) indicates a FAVORABLE / ripe cervix with high likelihood of successful vaginal induction; score <= 5 indicates an UNFAVORABLE cervix requiring cervical ripening (PGE2 dinoprostone gel or Foley catheter balloon).',
        examinerTip: 'Easy mnemonic: "Call Peds For Delivery" = Consistency, Position, Fetal station, Dilatation, Effacement.',
      },
      {
        question: 'What is Active Management of the Third Stage of Labor (AMTSL) and its 3 components?',
        answer: 'AMTSL significantly reduces the risk of Postpartum Hemorrhage (PPH). The 3 essential components are: 1) Uterotonic administration: 10 IU of Oxytocin IM within 1 minute of delivery of the baby (after ruling out a second twin); 2) Controlled Cord Traction (CCT / Brandt-Andrews maneuver): Delivered with counter-traction on the lower uterine segment upwards towards umbilicus with one hand while gently pulling the clamped cord downwards and backwards with the other hand during uterine contraction; 3) Uterine Massage: Massaging the uterine fundus immediately following placental delivery until it is firmly contracted, and checking tone every 15 minutes for 2 hours.',
        examinerTip: 'Mention that early cord clamping is NO LONGER part of AMTSL; delayed cord clamping (at 1-3 minutes) is recommended to improve neonatal iron stores.',
      },
      {
        question: 'What is the diagnostic threshold for Gestational Diabetes Mellitus (GDM) under DIPSI guidelines in India?',
        answer: 'The Diabetes in Pregnancy Study Group India (DIPSI) recommends a single-step non-fasting test: A pregnant woman is given 75g of anhydrous oral glucose in 300 mL of water, irrespective of the time of her last meal. A 2-hour venous plasma glucose value >= 140 mg/dL is diagnostic of GDM. If 2-hour glucose is between 120-139 mg/dL, it is classified as Gestational Glucose Intolerance (GGI), requiring dietary management and repeat testing in 4 weeks.',
        examinerTip: 'DIPSI is specifically designed for Indian conditions where pregnant women often travel long distances fasting, which causes nausea and dropouts.',
      },
    ],
  },
];
