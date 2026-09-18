/**
 * Canonical Clinical Case Proformas for MBBS Practicals & Ward Clerking.
 * Synthesized from MMC, Stanley, AIIMS, Tito Sir, Das, Bailey & Love, and Indian Medical Universities.
 */

import { ENT_PROFORMAS } from '@/lib/proformas/ent';
import { OPHTHALMOLOGY_PROFORMAS } from '@/lib/proformas/ophthalmology';
import { SURGERY_SHORT_PROFORMAS } from '@/lib/proformas/surgeryShort';
import { SURGERY_LONG_PROFORMAS } from '@/lib/proformas/surgeryLong';
import { PAEDIATRIC_PROFORMAS } from '@/lib/proformas/paediatrics';
import { ORTHO_OBG_PROFORMAS } from '@/lib/proformas/orthoObg';
import { MEDICINE_PROFORMAS } from '@/lib/proformas/medicine';

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

/**
 * The departments a case can belong to. Named rather than inlined into the
 * interface because the picker, the per-department colour and the counts all
 * have to agree with it — three places that quietly disagreed while this was
 * a union literal in one of them.
 */
export type ProformaSystem =
  | 'General Medicine'
  | 'General Surgery'
  | 'Pediatrics'
  | 'Orthopaedics'
  | 'Obstetrics & Gynaecology'
  | 'ENT'
  | 'Ophthalmology';

export interface ClinicalProforma {
  id: string;
  title: string;
  system: ProformaSystem;
  department: string;
  summary: string;
  examPearl: string;
  diagramPath?: string;
  diagramTitle?: string;
  sections: ProformaSection[];
  vivaQuestions: VivaQuestion[];
}

export const CLINICAL_PROFORMAS: ClinicalProforma[] = [
  // 1. MEDICINE - CARDIOVASCULAR SYSTEM (CVS)
  {
    id: 'cvs_proforma',
    title: 'Cardiovascular System (CVS) Master Case Proforma',
    system: 'General Medicine',
    department: 'Cardiology / General Medicine',
    summary: 'Postgraduate & MBBS examination-grade master proforma for Valvular Heart Diseases (Mitral Stenosis, Mitral Regurgitation, Aortic Stenosis, Aortic Regurgitation), Rheumatic Heart Disease, Congestive Heart Failure, Infective Endocarditis, and Ischemic Heart Disease.',
    examPearl: 'Always palpate the carotid artery while auscultating the precordium to establish S1 definitively; count the pulse for 1 full minute with a simultaneous apical count to document pulse deficit in Atrial Fibrillation, and rigorously check all 12 peripheral signs before diagnosing Aortic Regurgitation.',
    diagramPath: '/diagrams/clinical/mitral_stenosis_murmur.jpg',
    diagramTitle: 'Mitral Stenosis: Wiggers, PCG & Murmur Radiation',
    sections: [
      {
        title: '1. Patient Demographics & Presenting Complaints',
        items: [
          {
            label: 'Patient Demographics',
            description: 'Record standard clinical demographics.',
            checklist: [
              'Name, Age, Sex, Occupation (sedentary vs heavy manual labor), and Complete Residential Address',
              'Handedness: Right-handed vs Left-handed individual',
              'Socioeconomic status: Modified Kuppuswamy scale (urban) / Modified BG Prasad scale (rural)',
            ],
          },
          {
            label: 'Chest Pain (Angina / Carditis / Pericardial)',
            description: 'Detailed symptom chronology of precordial/retrosternal pain.',
            checklist: [
              'Duration and Mode of onset (sudden vs insidious)',
              'Site: Retrosternal, precordial, diffuse vs localized with a single finger',
              'Nature & Character: Constricting, crushing, pressure-like, burning, aching, or sharp pleuritic',
              'Brought on by: Exertional physical work, walking uphill/stairs, emotional stress, or unprovoked at rest (angina pectoris vs unstable angina)',
              'Continuous vs Intermittent nature and duration of each painful episode',
              'Radiation: Left shoulder, inner aspect of left arm to ring/little fingers, neck, jaw, teeth, epigastrium, or interscapular back',
              'Postural variation: Relieved by sitting up and leaning forward (acute pericarditis)',
              'Aggravating & Relieving factors: Relieved within 3-5 minutes of rest or sublingual nitroglycerin (effort angina)',
              'Associated autonomic features: Diaphoresis / profuse sweating, nausea, vomiting, sense of impending doom (angor animi)',
              'Association with food intake: Postprandial angina vs gastroesophageal reflux',
            ],
          },
          {
            label: 'Breathlessness (Dyspnoea, PND & Orthopnoea)',
            description: 'Chronological progression of exertional dyspnoea and pulmonary congestion.',
            checklist: [
              'Duration and Mode of onset (gradual progression in valvular disease vs sudden acute in pulmonary edema/MI)',
              'Progression & NYHA Functional Classification: Grade I (ordinary physical activity causes no symptoms), Grade II (slight limitation, comfortable at rest, ordinary activity causes dyspnoea), Grade III (marked limitation, less than ordinary activity causes dyspnoea), Grade IV (inability to carry out any physical activity without discomfort, symptoms at rest)',
              'Postural & Diurnal variation: Exertional worsening, evening aggravation',
              'Orthopnoea: Shortness of breath occurring within 1-2 minutes of lying flat, relieved on sitting up; quantified by number of pillows used (caused by cephalad redistribution of venous return expanding congested pulmonary capillary bed)',
              'Paroxysmal Nocturnal Dyspnoea (PND): Patient goes to sleep comfortably and wakes up suddenly 2-3 hours later feeling suffocated, gasping for breath, coughing white/pink frothy sputum; sits up on bed or rushes to open window for relief; takes 30-45 minutes to subside',
              'Aggravating and relieving factors: Climbing stairs, walking against cold wind, emotional excitement',
            ],
          },
          {
            label: 'Palpitations',
            description: 'Unpleasant awareness of one own heart beat.',
            checklist: [
              'Duration and Onset (sudden abrupt start and termination in PSVT vs gradual acceleration and deceleration in sinus tachycardia)',
              'Regular vs Irregular: Regularly irregular (ectopics) vs Irregularly irregular with variable pulse volume (Atrial Fibrillation)',
              'Paroxysmal vs Continuous',
              'Brought on by: Exertion, sudden emotional distress, caffeine, fever, thyrotoxicosis, or at rest',
              'Aggravating & Relieving factors: Valsalva maneuver, carotid sinus massage, diving reflex',
              'Associated symptoms: Chest pain, presyncope, polyuria following termination (atrial natriuretic peptide ANP release in PSVT)',
            ],
          },
          {
            label: 'Syncope & Loss of Consciousness (LOC)',
            description: 'Transient loss of consciousness caused by global cerebral hypoperfusion.',
            checklist: [
              'Number of episodes and duration of unconsciousness',
              'Total vs Partial loss of consciousness (presyncope / lightheadedness / graying of vision)',
              'Relation to exertion: Effort syncope characteristic of severe Aortic Stenosis, HOCM, or Primary Pulmonary Hypertension (fixed cardiac output unable to meet peripheral vasodilatation)',
              'Relation to posture: Postural orthostatic syncope on standing vs vasovagal neurocardiogenic syncope with prodrome (nausea, diaphoresis, yawning)',
              'Recovery time: Rapid, spontaneous, complete recovery without confusion within seconds to a minute (cardiovascular Stokes-Adams syncope vs post-ictal confusion in epilepsy)',
              'Associated features: Absence of aura, absence of tongue bite, absence of bowel/bladder incontinence, presence of transient facial pallor followed by flushing',
              'Time and circumstances of the last episode',
            ],
          },
          {
            label: 'Cough with Expectoration & Haemoptysis',
            description: 'Respiratory manifestations secondary to elevated pulmonary venous pressures.',
            checklist: [
              'Cough: Duration, mode of onset, dry irritating nocturnal cough (early pulmonary congestion in Mitral Stenosis)',
              'Quantity, Colour & Odour: Copious pink frothy sputum in acute alveolar pulmonary edema',
              'Postural & Diurnal variation: Aggravated on lying down, late night and early morning',
              'Haemoptysis (Bloody Cough): Number of episodes and duration',
              'Character of blood: Pulmonary apoplexy (sudden massive frank bright red hemoptysis due to rupture of thin-walled congested bronchial submucosal veins under high left atrial pressure in tight Mitral Stenosis)',
              'Blood-stained / blood-streaked sputum during winter bouts of acute bronchitis in MS',
              'Dark altered blood / plum-colored blood with pleuritic chest pain in Pulmonary Infarction',
              'Distinguish from haematemesis: Confirm absence of preceding nausea, absence of food particles, alkaline pH, and whether followed by melaena',
            ],
          },
        ],
      },
      {
        title: '2. Systematic Negative History (Heart Failure & Etiology)',
        items: [
          {
            label: 'Symptoms of Right Heart Failure (RHF)',
            description: 'Systemic venous congestion and hepatic congestion signs.',
            checklist: [
              'History of bilateral pedal edema: Starting around ankles in evening, ascending up to shins and thighs, decreasing after overnight bed rest',
              'History of abdominal distension: Gradual progressive abdominal swelling (congestive ascites)',
              'History of Right Hypochondrial pain: Constant dull dragging ache over liver (acute stretch of Glisson capsule in congestive hepatomegaly)',
              'History of dyspepsia, anorexia, bloating, and postprandial fullness (passive gastrointestinal venous congestion)',
              'History of facial puffiness: Especially in mornings or periorbital edema',
            ],
          },
          {
            label: 'Symptoms of Left Heart Failure (LHF)',
            description: 'Pulmonary venous hypertension and forward low cardiac output symptoms.',
            checklist: [
              'History of exertional dyspnoea, PND, and orthopnoea',
              'History of easy fatigability, generalized lethargy, weakness, and decreased exercise tolerance (low forward cardiac output)',
              'History of syncope and presyncopal episodes',
              'History of voice change / hoarseness: Ortner syndrome (compression of the left recurrent laryngeal nerve between a dilated pulmonary artery trunk and the aortic arch / enlarged left atrium in tight MS)',
              'History of dysphagia: Dysphagia megalatriensis (compression of esophagus by massive left atrial enlargement on swallowing solids)',
              'History of oliguria: Reduced urine output during daytime with nocturia at night (recumbent renal perfusion improved)',
            ],
          },
          {
            label: 'Symptoms of Rheumatic Fever (RF)',
            description: 'Evidence of acute rheumatic carditis in childhood (revised Jones criteria).',
            checklist: [
              'History of recurrent high fever with sore throat (Group A beta-hemolytic streptococcal pharyngitis)',
              'History of fleeting, migratory polyarthritis involving large joints (knees, ankles, elbows, wrists; joint swollen, red, intensely painful, resolving without permanent residual deformity within weeks)',
              'History of involuntary, purposeless, jerky choreiform movements: Sydenham chorea (St. Vitus dance, facial grimacing, clumsy dropping of objects)',
              'History of transient skin rashes: Erythema marginatum (pink evanescent ring-like serpiginous macules with pale centers on trunk)',
              'History of painless lumps over bones: Subcutaneous nodules (firm, painless nodules over bony prominences like olecranon, patella, spine)',
            ],
          },
          {
            label: 'Symptoms of Congenital Heart Disease & Pulmonary Hypertension',
            description: 'Cyanotic spells, shunt reversals, and recurrent respiratory infections.',
            checklist: [
              'History of cyanotic episodes (bluish discoloration of lips and tongue during crying or feeding in childhood)',
              'History of squatting posture during play to relieve dyspnoea (Tetralogy of Fallot: increases systemic vascular resistance, decreasing right-to-left shunt)',
              'History of recurrent lower respiratory tract infections and pneumonia in infancy and childhood (large left-to-right shunts: VSD, PDA, ASD)',
              'History of effort syncope, exertional chest pain, and hemoptysis (Eisenmenger syndrome / severe Pulmonary Hypertension)',
            ],
          },
        ],
      },
      {
        title: '3. Past, Personal, Family & Treatment History',
        items: [
          {
            label: 'Past Medical & Surgical History',
            description: 'Previous hospital admissions, interventions, and chronic medical illnesses.',
            checklist: [
              'History of previous similar episodes of heart failure, decompensation, or ICU admissions',
              'History of documented Rheumatic Fever, Rheumatic chorea, or childhood arthritis',
              'History of Hypertension, Diabetes Mellitus, Tuberculosis, and Ischemic Heart Disease / Myocardial Infarction',
              'History of high-risk sexual exposures or Sexually Transmitted Diseases (syphilitic aortitis causing severe AR, coronary ostial stenosis, aortic aneurysm)',
              'History of chronic respiratory infections, bronchiectasis, or cyanotic spells',
              'History of previous cardiac interventions: Closed Mitral Valvotomy (CMV), Percutaneous Balloon Mitral Valvotomy (PBMV), Surgical Valve Replacement (metallic prosthetic vs bioprosthetic valve), CABG, or pacemaker implantation',
              'History of chronic unexplained prolonged fever, chills, dental extractions, or instrumentation (Subacute Bacterial Endocarditis - SBE)',
            ],
          },
          {
            label: 'Family History',
            description: 'Genetic and hereditary cardiovascular predispositions.',
            checklist: [
              'Premature coronary artery disease in first-degree relatives (male < 55 years, female < 65 years)',
              'History of sudden unexpected cardiac death in young family members (HOCM, Long QT syndrome, Brugada syndrome, Arrhythmogenic RV Cardiomyopathy)',
              'Family members with Valvular or Rheumatic Heart Disease',
              'Familial hypercholesterolemia (tendon xanthomas, early myocardial infarction)',
              'Connective tissue disorders in family (Marfan syndrome, Ehlers-Danlos, aortic dissection)',
            ],
          },
          {
            label: 'Personal History',
            description: 'Lifestyle habits and physiological history.',
            checklist: [
              'Smoking / Tobacco: Beedi vs cigarette, quantity per day, duration in years, calculation of Pack-Years (packs/day x years)',
              'Alcohol consumption: Type of beverage, average daily consumption in grams of pure alcohol (holiday heart syndrome with paroxysmal AF, alcoholic dilated cardiomyopathy)',
              'Dietary history: High salt intake, vegetarian vs mixed, processed foods',
              'Sleep and appetite, bowel and bladder habits',
              'Menstrual & Obstetric History (females): Menarche, cycle regularity, menorrhagia (anticoagulation related), number of pregnancies, exacerbation of dyspnea/failure during pregnancy or puerperium',
            ],
          },
          {
            label: 'Treatment History & Secondary Prophylaxis',
            description: 'Current cardiovascular medications and rheumatic prophylaxis adherence.',
            checklist: [
              'Diuretic therapy: Furosemide, Torsemide, Spironolactone (doses, compliance, electrolyte monitoring)',
              'Afterload reduction: ACE inhibitors (Enalapril, Ramipril), ARBs, ARNI (Sacubitril/Valsartan)',
              'Rate-controlling & Antiarrhythmics: Beta-blockers (Metoprolol, Carvedilol), Digoxin, Amiodarone',
              'Anticoagulation: Oral Vitamin K antagonists (Warfarin, Acenocoumarol) with target INR range (2.0-3.0 for native AF/tissue valve; 2.5-3.5 for mechanical mitral prosthesis); NOACs / DOACs (Dabigatran, Apixaban, Rivaroxaban)',
              'Secondary Rheumatic Prophylaxis: Inj. Benzathine Penicillin G 1.2 million units intramuscularly deep in gluteal region every 3 to 4 weeks (or oral Erythromycin 250 mg BD if penicillin-allergic); duration of prophylaxis: up to age 21 or 5 years after last attack in rheumatic fever without carditis; up to age 40 or lifelong in severe rheumatic heart disease with valve surgery!',
            ],
          },
        ],
      },
      {
        title: '4. General Physical Examination & Etiological Markers',
        items: [
          {
            label: 'General Habitus & Bedside Decubitus',
            description: 'Overall clinical appearance, habitus, and mental status.',
            checklist: [
              'Consciousness: Alert, oriented in time, place, and person; mental clarity',
              'Comfort: Comfortable at rest vs orthopnoeic, respiratory distress, tachypnoea',
              'Built & Nutrition: Well built / moderately built / emaciated (cardiac cachexia in chronic congestive heart failure with TNF-alpha elevation)',
              'Body habitus: Asthenic, Marfanoid habitus (tall, thin, arm span > height, arachnodactyly, reduced upper segment to lower segment ratio < 0.86)',
              'Facies: Mitral facies (rosy, dusky cyanotic violaceous malar flush over cheeks with telangiectasia due to low cardiac output and peripheral vasoconstriction in severe MS)',
              'Temperature: Measured in axilla with clinical thermometer (afebrile vs fever in IE or active rheumatic carditis)',
            ],
          },
          {
            label: 'Classical Six General Examination Signs',
            description: 'Standard clinical screening for systemic disease.',
            checklist: [
              'Pallor: Lower palpebral conjunctiva, dorsum of tongue, soft palate, palmar creases, nail beds (anemia aggravating heart failure and hemic murmurs)',
              'Jaundice (Icterus): Upper bulbar sclera in natural daylight, under-surface of tongue (congestive cardiac cirrhosis with unconjugated/conjugated hyperbilirubinemia, hemolysis in prosthetic valve dysfunction)',
              'Cyanosis: Central cyanosis (tongue, inner lips, buccal mucosa - SaO2 < 85%, warm extremities) vs Peripheral cyanosis (earlobes, nose tip, fingertips - cold extremities with sluggish flow)',
              'Clubbing: Bilateral symmetrical clubbing of fingers and toes (Lovibond angle > 180°, positive Schamroth sign, Grade 1 to 4; indicates Cyanotic Congenital Heart Disease or Subacute Bacterial Endocarditis)',
              'Pedal Edema: Bilateral, symmetrical, pitting edema over medial malleolus and anterior border of tibia (demonstrated by pressing with thumb for 15-20 seconds; evening prominence ascending to sacrum in bedridden patients)',
              'Significant Lymphadenopathy: Cervical, axillary, epitrochlear, and inguinal nodes (tuberculosis, lymphoma, viral infections)',
            ],
          },
          {
            label: 'Stigmata of Congenital Heart Disease',
            description: 'Dysmorphic phenotypic markers.',
            checklist: [
              'Hypertelorism (widely spaced eyes)',
              'Low-set dysplastic ears',
              'High-arched palate (Marfan syndrome, Turner syndrome)',
              'Syndactyly (webbing of fingers/toes) & Polydactyly (extra digits in Ellis-van Creveld)',
              'Arachnodactyly: Long spider-like slender fingers (positive Steinberg thumb sign and Walker-Murdoch wrist sign in Marfan syndrome)',
              'Pectus excavatum (funnel chest) / Pectus carinatum (pigeon chest) / Kyphoscoliosis',
              'Webbed neck: Prominent lateral skin folds from mastoid to acromion (Turner syndrome [45,XO] associated with Bicuspid Aortic Valve and Coarctation of Aorta; Noonan syndrome with Pulmonary Stenosis)',
            ],
          },
          {
            label: 'Stigmata of Infective Endocarditis (IE)',
            description: 'Vascular and immunologic phenomena of endocarditis.',
            checklist: [
              'Anemia (normocytic normochromic anemia of chronic disease)',
              'Jaundice (mild icteric tinge due to hepatic congestion and hemolysis)',
              'Persistent fever with chills, rigors, and night sweats',
              'Hand Signs: Finger clubbing; Splinter hemorrhages (linear dark red subungual streaks in middle third of nail bed); Osler nodes (small, painful, tender violaceous nodular immune-complex lesions on pulps of fingers and thenar eminence); Janeway lesions (painless, flat erythematous embolic macules on palms and soles)',
              'Eye Signs: Roth spots on fundoscopy (pale retinal oval spots surrounded by flame hemorrhages); petechiae on palpebral conjunctiva',
              'Splenomegaly: Mild, non-tender, palpable spleen (reticuloendothelial hyperplasia / splenic infarction)',
              'Microscopic hematuria on urine analysis (embolic focal glomerulonephritis)',
            ],
          },
          {
            label: 'Stigmata of Rheumatic Heart Disease (RHD)',
            description: 'Cutaneous markers of acute and chronic rheumatic disease.',
            checklist: [
              'Erythema marginatum: Non-pruritic, erythematous serpiginous rash with sharp raised outer border and central clearing on trunk and limbs (spares face)',
              'Subcutaneous nodules: Firm, painless, non-tender pea-sized nodules (0.5-2 cm) over bony prominences and extensor tendons (olecranon, patella, occiput, vertebrae)',
              'Erythema nodosum: Painful, tender erythematous nodules over anterior tibial shins',
            ],
          },
          {
            label: 'Markers of Tuberculosis & HIV',
            description: 'Infectious markers with cardiovascular implications.',
            checklist: [
              'Markers of TB: Phlyctenular keratoconjunctivitis, cervical collar-stud abscess scars or discharging sinuses (scrofuloderma), tinea versicolor, lupus vulgaris, erythema nodosum, gynecomastia (secondary to Isoniazid INH therapy)',
              'Markers of HIV: Oral hairy leukoplakia (corrugated white plaques on lateral border of tongue), oral pseudomembranous candidiasis (thrush), molluscum contagiosum on face, multidermatomal herpes zoster scars, generalized persistent lymphadenopathy',
            ],
          },
        ],
      },
      {
        title: '5. Detailed Arterial Pulse Examination (10 Characteristics)',
        items: [
          {
            label: 'The 10 Classical Arterial Pulse Traits',
            description: 'Right radial artery palpated with index, middle, and ring fingers against distal radius for 1 full minute.',
            checklist: [
              '1. Rate: Counted for 60 seconds (Normal: 60-100 bpm; Tachycardia > 100 bpm in heart failure, anemia, thyrotoxicosis; Bradycardia < 60 bpm in heart block, beta-blocker therapy, athlete)',
              '2. Rhythm: Regular vs Regularly irregular (second-degree AV block, ventricular bigeminy) vs Irregularly irregular (Atrial Fibrillation, multifocal atrial tachycardia, frequent polymorphic ectopics)',
              '3. Volume: Normal vs Small volume / Pulsus parvus (severe Mitral Stenosis, Aortic Stenosis, LV systolic failure, hypovolemia) vs Large volume / Bounding / Collapsing (Aortic Regurgitation, PDA, severe anemia, thyrotoxicosis, beriberi)',
              '4. Character / Waveform: Detailed below (collapsing, bisferiens, alternans, paradoxus, parvus et tardus)',
              '5. Condition of vessel wall: Palpated at radial artery while compressing proximally with middle finger and distally with ring finger; normally pliable and soft; thickened, rigid, tortuous cord-like vessel indicates Mönckeberg medial calcific sclerosis (pipe-stem artery) or atherosclerosis',
              '6. Radio-radial delay: Right and left radial pulses palpated simultaneously; asymmetry or delay indicates Subclavian artery stenosis (Takayasu arteritis, atherosclerosis), Aortic arch dissection, or Cervical rib syndrome',
              '7. Radio-femoral delay: Right radial and right femoral artery palpated simultaneously with thumb over midinguinal point; normal: femoral pulse occurs synchronously or fractionally earlier than radial pulse; Femoral pulse is delayed and diminished in Coarctation of the Aorta (also check bilateral lower limb BPs)',
              '8. Pulse Deficit: Apical heart rate counted with stethoscope while an assistant counts radial pulse simultaneously for 1 full minute; Pulse Deficit = Apical rate minus Radial rate; Deficit > 10 bpm is diagnostic of Atrial Fibrillation (due to ineffective stroke volumes during short diastolic filling intervals failing to transmit peripheral pulse waves)',
              '9. Peripheral pulses equality in all 7 arterial pairs: Carotid, Brachial, Radial, Femoral, Popliteal, Posterior Tibial, and Dorsalis Pedis (documented as present, diminished, or absent)',
              '10. Respiratory variation in pulse volume: Marked decrease on inspiration seen in Pulsus Paradoxus',
            ],
          },
          {
            label: 'Specific Pathological Pulse Waveforms',
            description: 'Bedside demonstration of pathological pulse characters.',
            checklist: [
              'Collapsing / Water-hammer Pulse (Corrigan pulse): Forceful bounding percussion wave followed by sudden diastolic collapse; demonstrated by grasping the patient anterior forearm with the palmar aspect of fingers and elevating the arm vertically above the heart (accentuates hydrostatic pressure gradient)',
              'Pulsus Bisferiens: Two distinct systolic peaks felt during each beat (percussion wave and tidal wave); pathognomonic of combined severe Aortic Stenosis with Aortic Regurgitation (AS + AR) or Hypertrophic Obstructive Cardiomyopathy (HOCM)',
              'Pulsus Alternans: Alternation of strong and weak pulse beats with regular rhythm; pathognomonic of severe Left Ventricular Systolic Dysfunction and end-stage heart failure; confirmed by sphygmomanometer (Korotkoff sounds double as cuff pressure is deflated slowly)',
              'Pulsus Paradoxus: Exaggerated drop in systolic blood pressure > 10 mmHg during normal quiet inspiration; demonstrated with BP cuff (systolic sounds audible only during expiration at higher pressure, and continuously during both inspiration and expiration at lower pressure; difference > 10 mmHg denotes cardiac tamponade, severe bronchial asthma, constrictive pericarditis)',
              'Pulsus Parvus et Tardus (Anacrotic pulse): Low amplitude (parvus), slow-rising with delayed peak (tardus), and anacrotic notch on ascending limb; pathognomonic of severe Calcific Aortic Stenosis',
              'Dicrotic Pulse: Double pulse with second peak felt during diastole (accentuated dicrotic wave); seen in dilated cardiomyopathy with low cardiac output and septic shock',
            ],
          },
        ],
      },
      {
        title: '6. Blood Pressure & Jugular Venous Pressure (JVP) Analysis',
        items: [
          {
            label: 'Blood Pressure Measurement Protocol',
            description: 'Comprehensive 4-limb arterial blood pressure.',
            checklist: [
              'Measured in right arm supine after 5 minutes of rest using appropriate cuff size (bladder encircles >= 80% of arm)',
              'Left arm measurement (normal difference < 10 mmHg; > 15-20 mmHg indicates subclavian steal, aortic dissection, or coarctation)',
              'Postural hypotension test: Measure supine BP, then stand patient and re-measure at 1 minute and 3 minutes; positive if systolic BP falls >= 20 mmHg or diastolic BP falls >= 10 mmHg with symptoms of cerebral hypoperfusion',
              'Lower limb blood pressure: Measured with large thigh cuff over popliteal artery; normal lower limb systolic BP is 10-20 mmHg higher than upper limb; Popliteal systolic BP > 20 mmHg higher than brachial confirms positive Hill sign of AR; Lower limb systolic BP LOWER than upper limb confirms Coarctation of Aorta',
              'Pulse pressure: Systolic minus Diastolic BP (Normal: 30-40 mmHg; Wide pulse pressure > 60 mmHg in Aortic Regurgitation, PDA, AV fistula, thyrotoxicosis; Narrow pulse pressure < 25 mmHg in severe Aortic Stenosis, cardiac tamponade, severe hypovolemia)',
            ],
          },
          {
            label: 'Jugular Venous Pressure (JVP) & Waveform Analysis',
            description: 'Internal jugular vein (IJV) inspected tangentially at 45 degrees head elevation.',
            checklist: [
              'Vertical Height: Measured as vertical distance in centimeters from the sternal angle of Louis to the top of the internal jugular venous column; Normal <= 3 cm at 45 degrees (corresponds to central venous pressure <= 8 cm H2O)',
              'Differentiate IJV from Carotid: IJV has non-palpable double pulsation per heartbeat (a and v peaks), obliterated by gentle light pressure at base of neck, top level drops on inspiration, rises with abdominojugular reflux',
              'a wave (Presystolic): Produced by right atrial contraction; coincides with S1 and precedes carotid pulse; Giant/Prominent a wave seen in Pulmonary Stenosis, Pulmonary Arterial Hypertension, Tricuspid Stenosis (atrium contracting against resistance); Absent a wave in Atrial Fibrillation; Cannon a wave produced when right atrium contracts against closed tricuspid valve (regular cannon waves in junctional rhythm; irregular cannon waves in Complete Heart Block and Ventricular Tachycardia due to AV dissociation)',
              'c wave: Small positive wave caused by tricuspid valve closure and bulging into right atrium during isovolumetric ventricular contraction',
              'x descent: Systolic drop caused by atrial relaxation and downward displacement of tricuspid valve floor during ventricular systole',
              'v wave: Positive wave in late systole caused by venous filling of right atrium against closed tricuspid valve; Giant prominent v wave (Lancisi sign / cv fusion wave) pathognomonic of severe Tricuspid Regurgitation (systolic pulsation of neck veins)',
              'y descent: Diastolic drop caused by rapid emptying of right atrial blood into right ventricle upon tricuspid valve opening; Rapid steep deep y descent (Friedreich sign) in Constrictive Pericarditis; Slow prolonged y descent in Tricuspid Stenosis',
              'Abdominojugular (Hepatojugular) Reflux: Firm pressure applied with flat palm over right upper quadrant / periumbilical abdomen for 15-30 seconds; sustained rise of JVP >= 4 cm for duration of compression indicates RV failure or volume overload',
              'Kussmaul Sign: Paradoxical rise or failure of JVP to fall during inspiration; diagnostic of Constrictive Pericarditis, Right Ventricular Infarction, severe Tricuspid Regurgitation, or restrictive cardiomyopathy',
            ],
          },
        ],
      },
      {
        title: '7. Complete 12 Peripheral Signs of Aortic Regurgitation',
        items: [
          {
            label: 'The 12 Classical Physical Signs of Chronic Aortic Regurgitation',
            description: 'Systematic head-to-toe examination for hyperdynamic circulation stigmata.',
            checklist: [
              '1. Hill Sign: Popliteal cuff systolic blood pressure exceeds brachial systolic BP by >= 20 mmHg (Mild AR: 20-40 mmHg; Moderate AR: 40-60 mmHg; Severe AR: > 60 mmHg; artifact of cuff pressure amplification in hyperdynamic circulation)',
              '2. Lighthouse Sign: Alternating flushing (erythema during systole) and blanching (pallor during diastole) of the forehead and facial skin',
              '3. Locomotor Brachii: Dynamic, tortuous, visible serpentine systolic pulsations of the brachial artery in the antecubital fossa and lower arm',
              '4. Collapsing or Water-hammer Pulse (Corrigan pulse): Forceful percussion wave with rapid steep diastolic collapse, exaggerated by elevating the arm above the heart',
              '5. Pulsus Bisferiens: Double systolic peak palpable at carotid, brachial, or radial arteries (percussion wave and tidal wave with deep midsystolic dip)',
              '6. Landolfi Sign: Systolic pupillary constriction and diastolic pupillary dilatation (pupillary hippus synchronized with cardiac cycle, not reactive to light)',
              '7. Müller Sign: Systolic pulsation of the uvula and soft palate observed on opening the mouth with tongue depressed',
              '8. Quincke Sign: Capillary pulsations visible in the nail bed when gentle pressure is applied to the tip of the nail with a glass slide or thumb',
              '9. Duroziez Sign: Double murmur heard over the femoral artery with stethoscope diaphragm (gradual proximal compression yields a systolic murmur; gradual distal compression yields a diastolic murmur of retrograde regurgitant flow)',
              '10. Traube Sign: Loud, explosive booming "pistol-shot" systolic and diastolic sounds heard over the femoral artery with uncompressed stethoscope',
              '11. Becker Sign: Systolic pulsation of retinal arterioles and veins observed on dilated fundoscopic examination',
              '12. Gerhardt Sign (Sailer sign): Systolic pulsation of an enlarged spleen, frequently accompanied by systolic hepatic pulsation (Rosenbach sign)',
            ],
          },
        ],
      },
      {
        title: '8. Precordial Examination: Inspection & Palpation',
        items: [
          {
            label: 'Inspection of the Precordium',
            description: 'Patient examined supine with 45 degrees head-end elevation.',
            checklist: [
              'Chest wall symmetry and thoracic cage shape: Normal elliptical vs Pectus excavatum, Pectus carinatum, Kyphoscoliosis, Straight back syndrome',
              'Apical impulse visible location: Normally 5th left intercostal space, inside midclavicular line (shifted laterally and downwards in LV enlargement)',
              'Tracheal position: Central vs shifted',
              'Precordial pulsations in specific anatomical zones:',
              '  - Epigastric pulsation: RV enlargement (pulsation thrusts downwards into epigastrium from below costal margin) vs Abdominal aorta (pulsation strikes palm directly forward from posterior abdominal wall)',
              '  - Left Parasternal pulsation: 3rd, 4th, 5th left intercostal spaces (Right Ventricular Hypertrophy, Severe Mitral Regurgitation with systolic expansion of left atrium)',
              '  - Suprasternal, Supraclavicular & Neck pulsations: Aortic aneurysm, severe AR, high-output states',
              '  - Interscapular & Suprascapular pulsations: Dilated arterial collaterals around scapula in Coarctation of the Aorta',
              'Precordial bulge: Prominent bulging of left ribs (indicates cardiomegaly developing in early childhood before fusion of costal cartilages)',
              'Scars: Median sternotomy (CABG, valve replacement), Left lateral thoracotomy (closed mitral valvotomy, coarctation repair), infraclavicular pacemaker pocket scar',
              'Dilated veins, discharging sinuses, drooping of left shoulder, oral cavity inspection',
            ],
          },
          {
            label: 'Palpation of the Precordium',
            description: 'Systematic examination with warm hands in supine and left lateral positions.',
            checklist: [
              'Apex Beat: Outermost and downmost point of definite maximum cardiac impulse (Normal: Left 5th intercostal space, 1 cm medial to midclavicular line or 7-9 cm from midsternal line, area < 2.5 cm)',
              'Character of the Apex Beat:',
              '  - Tapping Apex Beat: Palpable first heart sound (S1) imparted against the chest wall in Mitral Stenosis with pliable leaflets (short-lived crisp tap without sustained lift)',
              '  - Heaving / Sustained Apex Beat: Forceful systolic lift that sustains under the examining fingers throughout systole, pushing the fingers upward (Left Ventricular Pressure Overload: Severe Aortic Stenosis, Systemic Hypertension, Coarctation)',
              '  - Hyperdynamic Apex Beat: Forceful, exaggerated displacement with rapid collapse (Left Ventricular Volume Overload: Aortic Regurgitation, Mitral Regurgitation, VSD, PDA)',
              '  - Dyskinetic / Double Apical Impulse: Ectopic paradoxical systolic bulge (Left Ventricular Aneurysm, ischemic cardiomyopathy)',
              'Epigastric Pulsation: Confirmed by pressing fingers flat against the abdominal wall under the xiphoid process pointing towards the left shoulder (RV pulsation felt on fingertips; aortic pulsation felt against pulp of fingers)',
              'Parasternal Heave (Left sternal border examined with heel of right hand):',
              '  - Grade I: Visible but not palpable',
              '  - Grade II: Visible and palpable, but can be obliterated by moderate hand pressure',
              '  - Grade III: Visible and palpable, and CANNOT be obliterated by hand pressure (severe RVH)',
              'Thrills (Palpable murmurs felt with the palm and metacarpophalangeal joints):',
              '  - Systolic thrill at apex (severe Mitral Regurgitation)',
              '  - Diastolic thrill at apex felt best in left lateral position in expiration (severe Mitral Stenosis)',
              '  - Systolic thrill at 2nd right ICS radiating to right carotid artery (severe Aortic Stenosis)',
              '  - Systolic thrill at left 3rd-4th intercostal space (Ventricular Septal Defect)',
              'Palpable Heart Sounds:',
              '  - Palpable First Heart Sound (S1) at apex: Mitral Stenosis',
              '  - Palpable Second Heart Sound (P2 / Diastolic shock) at 2nd left ICS: Severe Pulmonary Hypertension',
              'Tracheal position: Palpated in suprasternal notch to confirm central position',
            ],
          },
        ],
      },
      {
        title: '9. Precordial Examination: Percussion & Auscultation',
        items: [
          {
            label: 'Percussion of Cardiac Borders',
            description: 'Delineation of superficial and deep cardiac dullness.',
            checklist: [
              'Right Border of Cardiac Dullness: Percussed horizontally from right midclavicular line towards right sternal edge in 3rd, 4th, and 5th intercostal spaces; normally does not extend beyond right sternal border (dullness beyond right sternal edge indicates massive Right Atrial enlargement or Pericardial Effusion)',
              'Left Border of Cardiac Dullness: Percussed from anterior axillary line inwards along 3rd, 4th, and 5th left intercostal spaces; normally corresponds to the palpated apex beat inside the midclavicular line',
              'Upper Border of Cardiac Dullness: Normally at lower border of 3rd left rib; dullness in 2nd left intercostal space indicates dilated pulmonary artery trunk',
              'Hepatic Dullness: Upper border of liver dullness percussed in right midclavicular line (normally 5th ICS MCL)',
            ],
          },
          {
            label: 'Systematic Auscultation across All 4 Cardiac Areas',
            description: 'Auscultation performed methodically with diaphragm and bell across all areas with patient maneuvers.',
            checklist: [
              '1. Mitral Area (Apex):',
              '   * First Heart Sound (S1): Loud, sharp, and snapping in Mitral Stenosis with mobile pliable leaflets; Soft S1 in Mitral Regurgitation, PR interval prolongation, or heavily calcified immobile mitral valve; Variable S1 in Atrial Fibrillation or Complete AV Block',
              '   * Second Heart Sound (S2): A2 and P2 components',
              '   * Mid-Diastolic Murmur (MDM): A rough, low-pitched, rumbling mid-diastolic murmur of Grade 1-4/6 with presystolic accentuation (lost in Atrial Fibrillation); heard best with the bell of the stethoscope placed lightly at the apex with the patient turned into the left lateral decubitus position and breath held in full expiration (expiratory apnea)',
              '   * Pan-Systolic Murmur (PSM): High-pitched, blowing pansystolic murmur of Grade 1-6/6 heard with the diaphragm at the apex; radiates into the left axilla and infrascapular back; loudest in left lateral position during expiration',
              '2. Aortic Area (2nd Right Intercostal Space):',
              '   * S1 and S2 heard',
              '   * Ejection Systolic Murmur (ESM): Harsh, rasping, diamond-shaped crescendo-decrescendo murmur of Grade 1-6/6; starts after S1, peaks in midsystole, and ends before A2; radiates along both carotid arteries (louder on right carotid); heard best with diaphragm with patient sitting up, leaning forward, and breath held in expiration',
              '   * Early Diastolic Murmur (EDM): High-pitched, soft, blowing decrescendo murmur of Grade 1-4/6 starting immediately with A2; heard best with diaphragm along the left sternal border in 3rd/4th ICS (Erb point) and aortic area, with patient sitting, leaning forward in full expiratory apnea',
              '3. Pulmonary Area (2nd Left Intercostal Space):',
              '   * S2 Splitting: Normal physiological splitting (widens during inspiration, closes during expiration); Wide fixed splitting in Atrial Septal Defect (ASD); Wide variable splitting in RBBB or severe Pulmonary Stenosis; Paradoxical / Reverse splitting (closes on inspiration, splits on expiration) in severe Aortic Stenosis or LBBB',
              '   * Pulmonary Component (P2): Loud, ringing, accentuated P2 indicates Pulmonary Hypertension; soft or absent P2 indicates severe Pulmonary Stenosis',
              '   * Systolic ejection murmur of pulmonary stenosis or flow murmur of ASD',
              '4. Tricuspid Area (4th-5th Left Lower Sternal Border):',
              '   * S1 and S2 heard',
              '   * Pansystolic Murmur of Tricuspid Regurgitation: High-pitched blowing murmur; Carvallo Sign (murmur intensifies during inspiration due to augmented right ventricular venous return, distinguishing TR from MR)',
              '   * Mid-diastolic murmur of Tricuspid Stenosis (rare, rheumatic)',
              '5. Added Heart Sounds, Clicks & Snaps:',
              '   * Third Heart Sound (S3): Low-pitched early diastolic ventricular gallop (volume overload, dilated cardiomyopathy, LV failure)',
              '   * Fourth Heart Sound (S4): Low-pitched late diastolic presystolic atrial gallop (pressure overload, stiff non-compliant LV in AS or hypertension; absent in AF!)',
              '   * Opening Snap (OS): High-pitched, snapping diastolic sound following A2 by 0.04 to 0.12 seconds in Mitral Stenosis; A2-OS interval is inversely proportional to severity of MS (< 0.08 s indicates severe MS with high left atrial pressure)',
              '   * Ejection click (bicuspid aortic valve, pulmonary stenosis); Mid-systolic click (Mitral Valve Prolapse / Barlow syndrome)',
            ],
          },
        ],
      },
      {
        title: '10. Systemic Review & Definitive Diagnostic Synthesis',
        items: [
          {
            label: 'Other Systems Examination',
            description: 'Examination of Respiratory, Abdominal, and Central Nervous Systems.',
            checklist: [
              'Respiratory System: Normal vesicular breath sounds, bilateral basal end-inspiratory fine/coarse crackles (pulmonary venous congestion / LV failure), signs of pleural effusion (dullness, diminished breath sounds at bases)',
              'Abdomen: Soft, tender, enlarged liver with smooth surface (congestive hepatomegaly); pulsatile liver in severe Tricuspid Regurgitation; free fluid in peritoneal cavity (ascites); splenomegaly (IE or congestive)',
              'Central Nervous System: Conscious, oriented, no cranial nerve deficit; absence of embolic focal neurological deficits (hemiparesis, aphasia from left atrial thrombus embolization)',
            ],
          },
          {
            label: 'Canonical Examination Presentation Diagnosis Rubric',
            description: 'Structured MBBS practical case formulation.',
            checklist: [
              'Formulation Template: "A case of acquired / congenital heart disease of [Rheumatic / Degenerative / Congenital / Ischemic / Syphilitic] etiology with [Mitral Stenosis / Mitral Regurgitation / Aortic Stenosis / Aortic Regurgitation / Mixed Valvular Lesions]. The patient is currently in [Normal Sinus Rhythm / Atrial Fibrillation with controlled or rapid ventricular rate], in [NYHA Functional Class I / II / III / IV], [with signs of Congestive Cardiac Failure / compensated], [with / without Pulmonary Arterial Hypertension], and [with / without evidence of active Infective Endocarditis or Rheumatic Activity]."',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'How do you differentiate a tapping apex beat from a heaving apex beat?',
        answer: 'A tapping apex beat is a palpable first heart sound (S1) imparted against the chest wall in mitral stenosis with pliable leaflets; it is a brief, crisp tap that does not sustain under your fingers. A heaving apex beat is a sustained systolic lift that forces your palpating fingers upwards throughout systole, indicating left ventricular pressure overload (e.g., severe aortic stenosis, systemic hypertension).',
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
      {
        question: 'What is Hill sign and why does it occur in Aortic Regurgitation?',
        answer: 'Hill sign is present when the popliteal cuff systolic blood pressure exceeds brachial systolic blood pressure by >= 20 mmHg (mild: 20-40 mmHg, moderate: 40-60 mmHg, severe: > 60 mmHg). It is not a true physiological intra-arterial pressure gradient, but an artifact of indirect cuff sphygmomanometry caused by augmented stroke volume, rapid pressure wave velocity, and vessel wall reflection in the lower extremities.',
        examinerTip: 'Examiners will ask: "If you place an intra-arterial catheter in the femoral and radial arteries, is Hill sign present?" Answer: No! Intra-arterial pressure recordings show identical systolic pressures; it is purely an acoustic and cuff artifact.',
      },
      {
        question: 'What is Carvallo sign and what is its physiological mechanism?',
        answer: 'Carvallo sign is the inspiratory accentuation of the pansystolic murmur of Tricuspid Regurgitation (or the mid-diastolic murmur of Tricuspid Stenosis). During inspiration, negative intrathoracic pressure enhances venous return into the right atrium and ventricle, augmenting right ventricular stroke volume and transvalvular regurgitant flow, making the murmur louder. In contrast, left-sided murmurs (Mitral Regurgitation) remain unchanged or decrease during inspiration.',
        examinerTip: 'Always use Carvallo sign at the bedside to distinguish Tricuspid Regurgitation from Mitral Regurgitation when both produce pansystolic murmurs.',
      },
    ],
  },

  // 2. MEDICINE - RESPIRATORY SYSTEM (RS)
  {
    id: 'respiratory_proforma',
    title: 'Respiratory System (RS) Master Case Proforma',
    system: 'General Medicine',
    department: 'Pulmonology / General Medicine',
    summary: 'Postgraduate & MBBS examination-grade master proforma for Pleural Effusion, Lobar Consolidation (Pneumonia), Pneumothorax, Hydropneumothorax, COPD, Bronchiectasis, Lung Abscess, Fibrosis, and Lung Collapse.',
    examPearl: 'Tracheal deviation and apex beat shift are your primary bedside anchors for mediastinal displacement. Trachea and apex shift AWAY from the lesion in large pleural effusion and tension pneumothorax; shift TOWARDS the lesion in collapse and fibrosis; and remain STRICTLY CENTRAL in consolidation.',
    diagramPath: '/diagrams/clinical/consolidation_vs_pleural_effusion.jpg',
    diagramTitle: 'Physical Signs: Consolidation vs Pleural Effusion',
    sections: [
      {
        title: '1. Patient Demographics & Presenting Complaints',
        items: [
          {
            label: 'Patient Demographics',
            description: 'Record standard clinical demographics.',
            checklist: [
              'Name, Age, Sex, Occupation (quarry worker, sandblaster, farmer, coal miner, cotton mill worker, textile laborer), and Complete Address',
              'Socioeconomic status (overcrowding, poorly ventilated dwellings predisposing to tuberculosis)',
            ],
          },
          {
            label: 'Cough',
            description: 'Chronological evaluation of cough characteristics.',
            checklist: [
              'Duration: Acute (< 3 weeks, e.g., viral bronchitis, acute pneumonia) vs Subacute (3-8 weeks) vs Chronic (> 8 weeks, e.g., pulmonary tuberculosis, bronchiectasis, chronic bronchitis, bronchogenic carcinoma)',
              'Mode of onset: Sudden choking onset (foreign body aspiration) vs Insidious gradual progression',
              'Paroxysmal vs Persistent: Paroxysmal bouts of coughing ending in whoop or post-tussive syncope',
              'Dry vs Productive: Dry hacking cough (early interstitial lung disease, pleurisy, viral infection, ACE inhibitor therapy) vs Productive cough with sputum',
              'Postural variation: Cough exacerbated on changing posture or lying to one side (bronchiectasis, lung abscess emptying when cavity drains into bronchus)',
              'Diurnal variation: Early morning cough on waking (chronic bronchitis, bronchiectasis); Nocturnal cough waking from sleep (bronchial asthma / cardiac failure)',
              'Aggravating & Relieving factors: Cold air, dust, exertion, pollen; relieved by bronchodilator inhalers or steam inhalation',
              'Associated symptoms: Chest pain, syncope (tussive syncope), wheezing, shortness of breath, hoarseness of voice',
            ],
          },
          {
            label: 'Chest Pain (Pleuritic vs Musculoskeletal)',
            description: 'Detailed symptom analysis of thoracic pain.',
            checklist: [
              'Duration and Mode of onset (sudden knife-like onset in pneumothorax, pulmonary embolism, or acute pleurisy)',
              'Site: Lateral chest wall, substernal, lower ribs, or shoulder tip (diaphragmatic pleurisy mediated via phrenic nerve C3-C5)',
              'Nature & Character: Sharp, stabbing, knife-like pleuritic pain (caused by friction between inflamed visceral and parietal pleura)',
              'Continuous vs Intermittent: Aggravated intensely by deep inspiration, coughing, sneezing, laughing, or bending trunk',
              'Radiation: Referred to neck and shoulder tip (central diaphragmatic pleura) or to anterior abdominal wall (peripheral diaphragmatic pleura)',
              'Postural variation: Relieved by lying on the affected side (splinting the hemithorax reduces pleural excursion) or holding breath',
              'Aggravating & Relieving factors: Pain ceases abruptly when fluid accumulates and separates pleural layers (in pleural effusion)',
              'Associated autonomic features: Nausea, vomiting, diaphoresis, apprehension',
              'Association with food intake: Postprandial pain ruling out gastrointestinal causes (esophageal spasm, peptic ulcer)',
            ],
          },
          {
            label: 'Breathlessness (Dyspnoea & Wheezing)',
            description: 'Functional grading and characteristics of shortness of breath.',
            checklist: [
              'Duration and Mode of onset: Sudden within minutes (pneumothorax, acute pulmonary embolism, foreign body, acute asthma) vs Insidious over months/years (COPD, pulmonary tuberculosis, idiopathic pulmonary fibrosis)',
              'Progression & mMRC Dyspnoea Scale: Grade 0 (dyspnoea only with strenuous exercise), Grade 1 (dyspnoea when hurrying on level ground or walking up a slight hill), Grade 2 (walks slower than people of same age on level ground or stops for breath when walking at own pace), Grade 3 (stops for breath after walking 100 meters or after a few minutes on level ground), Grade 4 (too breathless to leave the house or breathless when dressing/undressing)',
              'Postural & Diurnal variation: Nocturnal dipping (asthma); Platypnea (dyspnoea worsened by upright posture, relieved recumbent in hepatopulmonary syndrome or intracardiac shunts); Trepopnea (dyspnoea lying on one specific side)',
              'Orthopnoea & PND: Inquire to rule out secondary left ventricular failure / cardiogenic pulmonary edema',
              'Wheeze: Continuous high-pitched whistling/musical sound on breathing; expiratory wheezing in asthma and COPD',
            ],
          },
          {
            label: 'Sputum & Expectoration',
            description: 'Qualitative and quantitative character of sputum.',
            checklist: [
              'Duration of expectoration',
              'Quantity: Scanty (acute bronchitis, asthma) vs Copious (> 100 mL/day in bronchiectasis, lung abscess, bronchoalveolar carcinoma)',
              'Three-layered sputum: Collected in a conical glass; top frothy mucus layer, middle cloudy serous layer, bottom thick purulent sediment with cellular debris (diagnostic of Bronchiectasis)',
              'Colour: Rusty sputum (prune-juice / oxidized blood in pneumococcal pneumonia due to Streptococcus pneumoniae); Red currant jelly sputum (tenacious in Klebsiella pneumoniae); Greenish-yellow purulent (Pseudomonas or pyogenic infection); Blackish sputum (coal miner anthracosilicosis); Pink frothy sputum (acute pulmonary edema)',
              'Odour: Foul, putrid, offensive odour (anaerobic infection in aspiration pneumonia, lung abscess, or necrotizing bronchiectasis)',
              'Postural variation: Copious gush of sputum on waking or lying to the unaffected side',
            ],
          },
          {
            label: 'Haemoptysis (Coughing up Blood)',
            description: 'True hemoptysis evaluation and differentiation from hematemesis.',
            checklist: [
              'Duration and Number of episodes',
              'Quantity: Streaky hemoptysis (streaks of blood in sputum in acute bronchitis or bronchogenic carcinoma) vs Frank blood vs Massive Hemoptysis (> 200-600 mL in 24 hours in cavitary pulmonary TB, bronchiectasis, Rasmussen aneurysm rupture, aspergilloma / mycetoma)',
              'Character of blood: Bright red, frothy, alkaline pH, mixed with sputum; absence of nausea or vomiting; not preceded by retching; not followed by melaena',
              'Associated with purulent sputum (bronchiectasis, lung abscess) or weight loss and anorexia (bronchogenic carcinoma, TB)',
            ],
          },
        ],
      },
      {
        title: '2. Systematic Negative History (TB, Cardiac & Malignancy)',
        items: [
          {
            label: 'Tuberculosis Constitutional B-Symptoms',
            description: 'Evidence of chronic mycobacterial toxemia.',
            checklist: [
              'History of low-grade fever with characteristic evening rise of temperature, settling with night sweats',
              'History of significant unintentional weight loss (> 10% of body weight over 3-6 months)',
              'History of persistent loss of appetite (anorexia)',
              'History of drenching, soaking night sweats requiring changing of nightclothes',
            ],
          },
          {
            label: 'Cardiovascular Symptoms (Cor Pulmonale / RHF)',
            description: 'Secondary cardiac failure from chronic pulmonary hypertension.',
            checklist: [
              'History of bilateral pedal edema (evening swelling of feet)',
              'History of abdominal distension (congestive ascites)',
              'History of Right Hypochondrial pain (tender congestive hepatomegaly)',
              'History of facial puffiness, morning periorbital fullness',
              'History of palpitations and effort syncope (fixed pulmonary vascular resistance)',
              'History of oliguria during daytime',
            ],
          },
          {
            label: 'Malignancy & Upper Airway Compression Signs',
            description: 'Red flag signs of bronchogenic carcinoma and mediastinal invasion.',
            checklist: [
              'History of progressive dysphagia (difficulty swallowing solids, indicating subcarinal / mediastinal lymph node compression of esophagus)',
              'History of hoarseness of voice (left recurrent laryngeal nerve invasion by apical/mediastinal tumor or aortopulmonary window lymphadenopathy)',
              'Mode of onset: Rapidly progressive deteriorating course',
              'History of facial swelling, neck fullness, and engorged veins on waking (Superior Vena Cava SVC syndrome)',
              'History of severe unremitting localized bone pain (skeletal metastasis)',
            ],
          },
        ],
      },
      {
        title: '3. Past History & Pneumonia Aspiration Risk (ABCDEF)',
        items: [
          {
            label: 'Past Medical & Respiratory History',
            description: 'Chronic diseases and prior pulmonary episodes.',
            checklist: [
              'History of previous similar episodes of pleurisy, pneumonia, effusion, or pneumothorax',
              'History of Diabetes Mellitus (predisposes to Klebsiella, Mucormycosis, extensive cavitation)',
              'History of Systemic Hypertension and Bronchial Asthma',
              'History of Tuberculosis: Personal history of primary infection, childhood primary complex, previous anti-tubercular therapy (ATT) regimens, duration, adherence, drug-induced hepatitis, or treatment default/failure',
              'History of contact with active open pulmonary TB cases (family, hostel, workplace)',
            ],
          },
          {
            label: 'Pneumonia & Lung Abscess Aspiration Risk Factors (ABCDEF Mnemonic)',
            description: 'Predisposing causes of pulmonary aspiration and anaerobic suppuration.',
            checklist: [
              'A - Aspiration: Impaired consciousness, stroke, general anesthesia, head injury, sedative overdose',
              'B - Booze: Acute or chronic alcoholism (loss of gag reflex, vomiting, Klebsiella / anaerobic aspiration)',
              'C - Cough Reflex Impaired: Neuromuscular disease, bulbar palsy, myasthenia gravis, tracheostomy',
              'D - Drowning: Near-drowning episodes with inhalation of contaminated water',
              'E - Epilepsy: Generalized tonic-clonic seizures with post-ictal coma and aspiration of gastric contents',
              'F - Foreign Body: Inhalation of foreign body (peanuts, betel nut, dental fixtures) into right main bronchus',
            ],
          },
          {
            label: 'Surgical & Abdominal Triggers of Pleural Effusion',
            description: 'Subdiaphragmatic sources of sympathetic pleural effusion.',
            checklist: [
              'History of tooth extraction, severe periodontal sepsis, tonsillectomy, or ENT instrumentation (source of anaerobic aspiration lung abscess)',
              'History of thoracic trauma, fractured ribs, blunt chest injury, or recent central venous catheterization (hemothorax, pneumothorax)',
              'History of recent general anesthesia and endotracheal intubation',
              'History of Acute Abdominal Distress causing sympathetic / reactive pleural effusion: Subphrenic abscess, Amoebic liver abscess rupture, Acute pancreatitis (left-sided hemorrhagic/amylase-rich effusion), Peritonitis',
              'History of childhood exanthematous fevers: Measles and whooping cough (pertussis necrotizing bronchiolitis leading to secondary Bronchiectasis)',
              'History of recurrent lower respiratory tract infections since childhood (cystic fibrosis, primary ciliary dyskinesia / Kartagener syndrome)',
            ],
          },
        ],
      },
      {
        title: '4. Personal, Occupational & Treatment History',
        items: [
          {
            label: 'Smoking & Biomass Fuel Exposure',
            description: 'Quantification of inhaled noxious agents.',
            checklist: [
              'Smoking history: Beedi vs cigarette, chutta, hookah; quantity smoked per day',
              'Pack-Years Calculation: Number of packs smoked per day multiplied by number of years of smoking (1 pack = 20 cigarettes; > 20 pack-years significantly increases risk of COPD and lung cancer)',
              'Beedi-Years Calculation: Number of beedis smoked per day multiplied by number of years (1 beedi pack = 25 beedis)',
              'Biomass fuel / Chulha smoke exposure: Unventilated indoor cooking with wood, dried dung, or crop residues; exposure quantified in Hour-Years (cooking hours/day x years; major cause of non-smoker COPD in rural females)',
            ],
          },
          {
            label: 'Occupational & Environmental Dust Exposures',
            description: 'Pneumoconiosis and occupational lung diseases.',
            checklist: [
              'Silica exposure: Stone cutting, quarrying, sandblasting, slate pencils, granite polishing (Silicosis - eggshell calcification of hilar nodes, high TB risk)',
              'Coal dust: Underground coal mining (Coal Worker Pneumoconiosis)',
              'Asbestos exposure: Insulation, shipbuilding, roofing, brake lining (Asbestosis, pleural plaques, Mesothelioma)',
              'Organic dusts: Cotton dust in textile mills (Byssinosis - Monday morning chest tightness); Sugar cane bagasse (Bagassosis); Grain and flour dust (Farmer lung - extrinsic allergic alveolitis); Pigeon / bird droppings (Bird fancier lung)',
              'History of high-risk sexual exposures / STD risk factors (HIV-associated TB, Pneumocystis jirovecii pneumonia)',
            ],
          },
          {
            label: 'Treatment History',
            description: 'Current and past pulmonary pharmacological agents.',
            checklist: [
              'Short-acting beta-2 agonists (SABA: Salbutamol) and Anticholinergics (Ipratropium)',
              'Long-acting bronchodilators (LABA: Formoterol, Salmeterol) and LAMA (Tiotropium)',
              'Inhaled Corticosteroids (ICS: Budesonide, Fluticasone) - inhaler technique, use of spacer, mouth rinsing after inhalation',
              'Systemic corticosteroids: Oral prednisolone (doses, duration, side effects)',
              'Antibiotic courses: Beta-lactams, macrolides, fluoroquinolones',
              'Anti-Tubercular Therapy (ATT): First-line HRZE regimen (Isoniazid, Rifampicin, Pyrazinamide, Ethambutol); duration, compliance, hepatotoxicity monitoring',
              'Domiciliary Oxygen therapy / Home Non-Invasive Ventilation (NIV / BiPAP)',
            ],
          },
        ],
      },
      {
        title: '5. General Physical Examination, Clubbing & Horner Syndrome',
        items: [
          {
            label: 'General Examination & Respiratory Vitals',
            description: 'Systematic clinical appraisal of the respiratory patient.',
            checklist: [
              'Consciousness: Alert, oriented vs drowsy, irritable, flapping tremors, asterixis (CO2 narcosis / type II respiratory failure)',
              'Comfort & Decubitus: Orthopnoeic, comfortable at rest, preferring to lie on affected side (pleural effusion / pleurisy)',
              'Built & Nutrition: Moderately built vs emaciated (pulmonary cachexia in end-stage COPD or tuberculosis)',
              'Respiratory Rate: Counted for 60 seconds (Normal: 12-18 breaths/min; Tachypnea > 20/min in pneumonia, effusion; Bradypnea < 10/min in CNS depression)',
              'Type of Respiration: Normal Thoraco-abdominal in females; Abdomino-thoracic in males; purely thoracic in peritonitis; purely abdominal in chest wall trauma/pleurisy',
              'Respiratory Pattern: Kussmaul breathing (deep rapid sighing breathing in metabolic acidosis); Cheyne-Stokes breathing (waxing and waning respiration with apnea in heart failure/stroke)',
              'Accessory muscle usage: Visible contraction of sternocleidomastoid, scalene, and trapezius muscles on quiet inspiration; intercostal and supraclavicular indrawing',
              'Pursed-lip breathing: Expiration through pursed lips creating positive end-expiratory pressure to prevent airway collapse (pink puffers in emphysema)',
            ],
          },
          {
            label: 'General Clinical Signs',
            description: 'Screening for systemic illness.',
            checklist: [
              'Pallor: Lower palpebral conjunctiva, tongue, nail beds (anemia secondary to chronic disease or hemoptysis)',
              'Jaundice: Sclera in daylight (rifampicin/pyrazinamide-induced hepatitis, hepatic metastases, congestive hepatomegaly)',
              'Cyanosis: Central cyanosis (tongue, buccal mucosa - SaO2 < 85%) indicates alveolar hypoventilation or V/Q mismatch',
              'Pedal Edema: Bilateral pitting pedal edema (Cor Pulmonale / RV failure secondary to chronic hypoxic pulmonary vasoconstriction)',
              'Significant Lymphadenopathy: Cervical, Scalene node (drains lung apices), Supraclavicular (left Virchow node in thoracic malignancies), and Axillary nodes',
              'Halitosis: Putrid, foul-smelling breath characteristic of anaerobic Lung Abscess and infected Bronchiectasis',
            ],
          },
          {
            label: 'Finger Clubbing & Grading',
            description: 'Digital clubbing evaluation and clinical significance.',
            checklist: [
              'Schamroth Window Sign: Normally, apposing the dorsal surfaces of the terminal phalanges of corresponding fingers creates a diamond-shaped window; obliteration of this window is the earliest sign of clubbing',
              'Lovibond Angle: Angle between the nail plate and proximal nail fold (Normal < 160°; Clubbing > 180°)',
              'Grades of Clubbing:',
              '  - Grade 1: Fluctuant nail bed (increased ballotability and softening of nail bed)',
              '  - Grade 2: Obliteration of the normal Lovibond angle (> 180°)',
              '  - Grade 3: Parrot-beaking / beak-like curvature of the nail in both longitudinal and transverse planes',
              '  - Grade 4: Drumstick appearance of terminal phalanx with Hypertrophic Osteoarthropathy (HPOA: wrist pain, tender distal radius/ulna periostitis)',
              'Causes of Clubbing in Respiratory Disease: Bronchiectasis, Lung Abscess, Bronchogenic Carcinoma, Empyema, Idiopathic Pulmonary Fibrosis (IPF / CFA)',
              'IMPORTANT RULE: Clubbing does NOT occur in uncomplicated COPD or simple Bronchial Asthma! If clubbing is found in a smoker with COPD, search for underlying Bronchogenic Carcinoma or Bronchiectasis!',
            ],
          },
          {
            label: 'Horner Syndrome (MAP Mnemonic)',
            description: 'Ipsilateral cervical sympathetic trunk disruption by Pancoast tumor.',
            checklist: [
              'M - Miosis: Constricted, smaller pupil on the affected side due to loss of sympathetic pupillodilator tone',
              'A - Anhidrosis: Loss of sweating on the ipsilateral half of the face, neck, and upper chest',
              'P - Ptosis: Mild partial drooping of the upper eyelid (1-2 mm) due to paralysis of Müller superior tarsal muscle (sympathetic), distinct from complete ptosis of CN III palsy',
              'Enophthalmos: Apparent sunken appearance of the eyeball in the orbit due to narrowed palpebral fissure',
              'Clinical Significance: Pancoast tumor (Superior Sulcus Bronchogenic Carcinoma) invading the stellate / inferior cervical ganglion and C8-T1 nerve roots (causing wasting of intrinsic hand muscles and pain along inner arm)',
            ],
          },
          {
            label: 'Markers of Tuberculosis & HIV',
            description: 'Infectious stigmata.',
            checklist: [
              'Markers of TB: Phlyctenular keratoconjunctivitis, cervical collar-stud scar or discharging sinus (scrofuloderma), tinea versicolor, lupus vulgaris, erythema nodosum over shins, gynecomastia (INH-induced)',
              'Markers of HIV: Oral hairy leukoplakia, oral candidiasis (thrush), molluscum contagiosum on face, multidermatomal herpes zoster scars, generalized persistent lymphadenopathy',
            ],
          },
        ],
      },
      {
        title: '6. Upper Respiratory Tract & Thoracic Cage Inspection',
        items: [
          {
            label: 'Inspection of the Upper Respiratory Tract',
            description: 'Otorhinolaryngological bedside inspection.',
            checklist: [
              'Nose & Nasal Cavity: Deviated nasal septum (DNS), hypertrophied turbinates, nasal mucosal congestion, nasal polyps (allergic rhinitis, Samter triad: asthma, nasal polyps, aspirin sensitivity)',
              'Oral Cavity & Oropharynx: Poor dentition, dental caries, gingivitis, loose teeth (predisposition to aspiration lung abscess)',
              'Tonsils: Hypertrophied, congested, or exuding tonsils',
              'Post-Nasal Drip: Mucopurulent secretions trickling down posterior pharyngeal wall (upper airway cough syndrome / post-nasal drip)',
            ],
          },
          {
            label: 'Inspection of the Thoracic Cage (Shape & Symmetry)',
            description: 'Patient examined stripped to waist, sitting upright in good lighting, observed anteriorly, laterally, and posteriorly.',
            checklist: [
              'Shape of the Chest:',
              '  - Normal: Elliptical in cross-section; Anteroposterior (AP) to Transverse diameter ratio is approximately 5:7 (or 0.7); Subcostal angle is acute (< 90°)',
              '  - Barrel Chest: Increased AP diameter equal to or exceeding transverse diameter (AP:transverse ratio 1:1); ribs are horizontal with widened intercostal spaces; subcostal angle is obtuse (> 90°); prominent sternal angle of Louis; seen in advanced Emphysema and COPD',
              '  - Pectus Excavatum (Funnel chest): Congenital depression of lower body of sternum and xiphoid; decreases thoracic volume and can displace heart to the left',
              '  - Pectus Carinatum (Pigeon chest): Prominent anterior projection of sternum with lateral flattening of ribs (rickets, severe childhood asthma, Marfan syndrome)',
              '  - Kyphoscoliosis: Posterior curvature (kyphosis) and lateral curvature (scoliosis) of thoracic spine; Pott disease (gibbus deformity)',
              'Symmetry of Chest & Hemithorax Expansion:',
              '  - Bilateral symmetry vs Asymmetry',
              '  - Flattening of chest wall and drooping of shoulder on affected side (Fibrosis, complete Lung Collapse)',
              '  - Fullness / bulging of hemithorax with widened intercostal spaces (Massive Pleural Effusion, Tension Pneumothorax)',
              '  - Crowding of ribs and narrow intercostal spaces (Fibrosis, Collapse)',
              '  - Supraclavicular and Infraclavicular hollowness: Sunken fossae due to apical fibrosis or wasting',
              'Movement of the Chest Wall with Respiration:',
              '  - Both hemithoraces observed from the foot-end and from the side',
              '  - Normal: Symmetrical, equal expansion of both sides during quiet and deep breathing',
              '  - Diminished / Restricted movement on affected side (Pleural Effusion, Pneumothorax, Consolidation, Fibrosis, Collapse, Pleurisy)',
              '  - Hoover Sign: Paradoxical inward movement of the lower lateral costal margins during inspiration (flattened low diaphragm in severe COPD pulling ribs inwards rather than expanding them)',
            ],
          },
          {
            label: 'Mediastinal Inspection Markers & Cutaneous Signs',
            description: 'Inspection of midline structures and chest wall surface.',
            checklist: [
              'Visible Tracheal Position: Trachea seen deviated towards or away from midline in suprasternal notch',
              'Visible Apical Impulse: Shift of apical impulse noted on inspection (displaced laterally in cardiomegaly or mediastinal shift)',
              'Pulsations: Abnormal chest wall pulsations (intercostal collaterals in coarctation, aortic aneurysm)',
              'Skin & Surface of Chest:',
              '  - Surgical scars: Intercostal drain (ICD) scar in 5th intercostal space anterior axillary line; Posterolateral thoracotomy scar beneath angle of scapula; Sternotomy scar',
              '  - Dilated collateral veins: Superior Vena Cava (SVC) obstruction showing engorged tortuous veins on upper anterior chest wall (direction of blood flow downwards into IVC territory)',
              '  - Discharging sinuses: Scrofuloderma (TB), Actinomycosis (sulfur granules), Empyema necessitans',
              '  - Subcutaneous nodules or tumor deposits',
            ],
          },
        ],
      },
      {
        title: '7. Palpation: Mediastinum, Chest Expansion & Tactile Vocal Fremitus',
        items: [
          {
            label: 'Palpation of Mediastinal Position (Trachea & Apex)',
            description: 'Bedside determination of mediastinal shift.',
            checklist: [
              'Tracheal Palpation Protocol:',
              '  - Patient sits comfortably with head slightly flexed in neutral midline position without turning to either side',
              '  - Examiner places right index and ring fingertips firmly on the corresponding right and left sternoclavicular joints, while the middle fingertip gently slides into the suprasternal notch along the trachea',
              '  - Determine whether the middle finger slips into an equal space on both sides of the trachea or impinges against a deviated trachea',
              '  - Trail Sign: Prominence and accentuation of the clavicular head of the sternocleidomastoid muscle on the side to which the trachea is deviated',
              '  - Campbell Sign: Downward descent of the trachea during inspiration due to diaphragmatic traction in severe COPD',
              '  - Tracheal Tug (Oliver sign): Downward tugging sensation felt on the trachea during systole (Aortic Arch Aneurysm)',
              'Apical Impulse Palpation:',
              '  - Palpated to determine exact intercostal space and distance from midclavicular line (Normal: 5th left ICS, 1 cm inside MCL)',
              '  - Combined Trachea & Apex Interpretation (The Master Mediastinal Rule):',
              '    * Trachea and Apex shifted AWAY from lesion: Large Pleural Effusion, Tension Pneumothorax',
              '    * Trachea and Apex shifted TOWARDS lesion: Lung Collapse, Extensive Pulmonary Fibrosis, Pneumonectomy',
              '    * Trachea and Apex remain STRICTLY CENTRAL: Lobar Consolidation, Pulmonary Edema, Bronchiectasis',
            ],
          },
          {
            label: 'Chest Movement & Expansion Measurements',
            description: 'Objective tape measurements and regional excursion.',
            checklist: [
              'Tape Measurement Protocol (Circumferential Expansion):',
              '  - Measuring tape placed horizontally around the chest passing just below the nipples (4th/5th ICS) in males and under the breasts in females',
              '  - Patient asked to breathe out fully to residual volume (measure expiration circumference in cm)',
              '  - Patient asked to take a deep maximal inspiration (measure inspiration circumference in cm)',
              '  - Chest Expansion = Inspiration minus Expiration (Normal healthy adult >= 5 cm; < 2.5 cm is significantly impaired in Ankylosing Spondylitis, advanced COPD, diffuse fibrosis)',
              'Regional Chest Excursion Palpation:',
              '  - Upper Lobes: Examiner hands placed over the clavicles and supraclavicular fossae with thumbs touching at midline; observe separation of thumbs during deep inspiration',
              '  - Middle Lobes: Hands placed firmly over the anterolateral chest wall at nipple level with thumbs touching in midline; observe outward excursion of thumbs',
              '  - Lower Lobes: Examiner hands clamped around the lower lateral ribcage posteriorly with thumbs meeting over the 10th thoracic spine; observe symmetrical divergence of thumbs',
              '  - Restricted excursion confirmed on the diseased side',
            ],
          },
          {
            label: 'Intercostal Tenderness & Tactile Vocal Fremitus (TVF)',
            description: 'Vibratory and tissue palpation.',
            checklist: [
              'Intercostal Tenderness: Gently press over each intercostal space with examining fingers; localized tenderness denotes fractured rib, costochondritis (Tietze syndrome), dry pleurisy, or impending Empyema Necessitans',
              'Subcutaneous Emphysema: Palpate for soft tissue swelling with characteristic crepitus (rice-crispy crackling sensation on pressing skin; seen in pneumothorax, tracheobronchial rupture, rib fracture)',
              'Tactile Vocal Fremitus (TVF) Protocol:',
              '  - Palpated using the ulnar border of the hand (hypothenar eminence) or palm placed firmly against symmetric zones of the chest wall',
              '  - Patient repeats the resonance words "ninety-nine" or "one-one-one" (or "aath-aath" / "oru-oru") in a deep, constant voice',
              '  - Symmetrically compare identical anatomical regions from apex to base anteriorly, laterally in axillae, and posteriorly',
              '  - INCREASED TVF: Lobar Consolidation (solid conducting medium transmits sound vibrations with minimal attenuation); superficial thick-walled cavity communicating with a patent bronchus',
              '  - DECREASED / ABSENT TVF: Pleural Effusion (fluid layer acts as acoustic dampener); Pneumothorax (air pocket reflects sound waves); Complete Lung Collapse with blocked bronchus; Thickened pleura; Severe emphysema',
            ],
          },
          {
            label: 'Palpation of Lymph Nodes',
            description: 'Systematic examination of cervical and axillary stations.',
            checklist: [
              'Examine with patient seated, neck slightly flexed forward',
              'Scalene lymph nodes (deep in scalene triangle behind clavicular head of SCM; drains ipsilateral lung)',
              'Supraclavicular lymph nodes (Virchow node on left in thoracic duct drainage; right supraclavicular in right lung cancer)',
              'Axillary lymph nodes: Anterior (pectoral), Posterior (subscapular), Lateral (brachial), Central, and Apical groups palpated bilaterally with patient arm supported',
            ],
          },
        ],
      },
      {
        title: '8. Systematic 9-Region Bilateral Percussion & Special Bedside Tests',
        items: [
          {
            label: 'The Systematic 9-Region Bilateral Percussion Protocol',
            description: 'Methodical comparative percussion from apices down to bases.',
            checklist: [
              'Technique: Middle finger of left hand (pleximeter) pressed firmly against intercostal space parallel to ribs; struck smartly at 90° on middle phalanx by right middle fingertip (plexor) with loose wrist movement',
              'Symmetrically percuss and document note (+ / -) in all 9 anatomical regions bilaterally:',
              '  1. Directly on Clavicle: Plexor strikes directly on medial third and middle third of clavicle (percusses lung apices without pleximeter)',
              '  2. Supraclavicular Fossa: Percussed inside the fossa above clavicle',
              '  3. Infraclavicular Region: 1st and 2nd intercostal spaces between clavicle and 3rd rib',
              '  4. Mammary Region: 3rd, 4th, and 5th intercostal spaces down to 6th rib',
              '  5. Axillary Region: 4th and 5th intercostal spaces between anterior and posterior axillary lines above 6th rib',
              '  6. Infra-Axillary Region: 6th, 7th, and 8th intercostal spaces in midaxillary line',
              '  7. Suprascapular Region: Above the spine of the scapula posteriorly',
              '  8. Interscapular Region: Between the medial border of the scapula and thoracic vertebral spines (3rd to 7th thoracic levels)',
              '  9. Infrascapular Region: Below the inferior angle of the scapula from 8th to 10th/11th intercostal spaces',
              'Quality of Percussion Notes:',
              '  * Resonant: Normal air-filled healthy lung parenchyma',
              '  * Hyperresonant: Markedly increased air content under tension (Pneumothorax, large emphysematous bullae, severe asthma)',
              '  * Impaired / Dull: Diminished resonance (Lobar Consolidation, Atelectasis / Collapse, Thickened pleura)',
              '  * Stony Dull: Absolute wooden dullness with total lack of resonance and intense resistance felt by the pleximeter finger (Pathognomonic of Pleural Effusion or Empyema)',
              '  * Tympanitic: Hollow drum-like note heard over Traube space or large superficial thin-walled cavity',
            ],
          },
          {
            label: 'Special Bedside Percussion Tests',
            description: 'Specific clinical tests to verify pathology.',
            checklist: [
              'Tidal Percussion: Percuss lower border of resonance posteriorly during normal tidal respiration; mark the line of dullness; ask patient to take a deep inspiration and hold breath; percuss down again; normal diaphragmatic descent is 3-5 cm; absence of movement indicates pleural effusion, diaphragmatic paralysis, or severe emphysema',
              'Shifting Dullness in Chest: Percuss the upper level of dullness in the upright sitting position; ask patient to recline back at 45 degrees or lie recumbent; re-percuss; a shifting fluid level confirms Hydropneumothorax (free fluid moving under gravity without capillary pleural suction)!',
              'Straight Line Dullness: In simple pleural effusion, the upper border of dullness forms a curved parabolic line (Ellis S-shaped curve, highest in axilla); in Hydropneumothorax, the presence of air abolishes negative intrapleural pressure, forming a strictly horizontal, straight line of dullness!',
              'Traube Space Percussion: Boundaries: 6th rib superiorly, left midaxillary line laterally, left costal margin inferiorly; normally tympanitic due to gastric air bubble; Dull in Splenomegaly, Left Pleural Effusion, Left lower lobe Consolidation, Cardiomegaly, or full stomach',
              'Upper Border of Liver Dullness: Percussed downwards along right midclavicular line from 2nd ICS; normally dull at 5th right intercostal space (pushed downwards in emphysema; obliterated in pneumoperitoneum)',
              'Cardiac Dullness: Superficial cardiac dullness in 4th and 5th left intercostal spaces obliterated in barrel chest of emphysema',
              'Kronig Isthmus: Band of resonance 4-6 cm wide running over the shoulder connecting anterior and posterior resonance; narrowed or obliterated in apical pulmonary tuberculosis or Pancoast tumor',
            ],
          },
        ],
      },
      {
        title: '9. Auscultation: Breath Sounds, Adventitious Sounds & Vocal Resonance',
        items: [
          {
            label: 'Systematic Auscultation of Breath Sounds',
            description: 'Listen with stethoscope diaphragm through mouth breathing in all 9 regions.',
            checklist: [
              'Normal Vesicular Breath Sounds: Soft, rustling, low-pitched gentle sound; inspiratory phase is long, loud, and prominent; expiratory phase is short, soft, and faint (inspiratory:expiratory ratio 3:1); NO silent pause between inspiration and expiration',
              'Vesicular with Prolonged Expiration: Expiratory phase is prolonged and audible throughout (I:E ratio 1:1 or 1:2); characteristic of diffuse airway obstruction in Bronchial Asthma and COPD',
              'Bronchial Breath Sounds: Harsh, loud, hollow, tubular blowing quality; inspiratory and expiratory phases are equal in duration and intensity; DISTINCT SILENT PAUSE between inspiration and expiration (normal over trachea/larynx only); Types of Pathological Bronchial Breathing:',
              '  - Tubular Bronchial Breathing: High-pitched, harsh; heard over Lobar Consolidation with patent bronchus',
              '  - Cavernous Bronchial Breathing: Low-pitched, hollow, resonant blowing sound; heard over a superficial thick-walled Cavity communicating with a patent bronchus',
              '  - Amphoric Bronchial Breathing: High-pitched, metallic, ringing sound resembling blowing across the mouth of a narrow empty glass bottle; heard over a large empty cavity with rigid smooth walls or open Pneumothorax (bronchopleural fistula)',
              'Diminished or Absent Breath Sounds: Markedly reduced breath sounds seen in Pleural Effusion, Pneumothorax, Complete Lung Collapse with blocked bronchus, and Thickened pleura',
            ],
          },
          {
            label: 'Adventitious / Added Respiratory Sounds',
            description: 'Identification of crackles, wheezes, and friction rubs.',
            checklist: [
              'Crackles / Crepitations (Discontinuous non-musical explosive sounds):',
              '  * Fine Crepitations: High-pitched, crisp, delicate, dry sounds occurring at the end of inspiration; not cleared by coughing; caused by explosive reopening of small collapsed distal airways (Interstitial Pulmonary Fibrosis / IPF, Left Heart Failure / pulmonary edema)',
              '  * Coarse Crepitations: Low-pitched, loud, bubbling, rattling moist sounds occurring in early to mid-inspiration and throughout expiration; frequently alter or clear after vigorous coughing; caused by air bubbling through secretions in large bronchi (Bronchiectasis, Lung Abscess, resolving Pneumonia, Chronic Bronchitis)',
              'Wheezes / Rhonchi (Continuous musical sounds caused by airway narrowing):',
              '  * Monophonic Wheeze: Single continuous musical tone of constant pitch originating from a localized airway; does not change with coughing; indicates localized partial obstruction of a major bronchus by Bronchogenic Carcinoma, adenoma, or foreign body (warrants bronchoscopy!)',
              '  * Polyphonic Wheezes: Multiple discordant musical notes of varying pitches heard diffusely throughout expiration; caused by widespread dynamic narrowing of multiple bronchi in Bronchial Asthma and COPD',
              'Pleural Friction Rub: Superficial, grating, creaking, leathery sound heard during both inspiration and expiration; loudest at the end of inspiration; accentuated by applying firm pressure with the stethoscope; disappears completely when pleural effusion accumulates or when patient holds breath; pathognomonic of Acute Pleurisy',
            ],
          },
          {
            label: 'Vocal Resonance & Bedside Auscultatory Tests',
            description: 'Auscultation of transmitted spoken voice.',
            checklist: [
              'Technique: Auscultate corresponding symmetric areas while patient repeats "ninety-nine" or "one-one-one" in a normal speaking voice',
              'Normal Vocal Resonance: Words are muffled and indistinct',
              'Increased Vocal Resonance / Bronchophony: Words are transmitted with increased intensity and clarity, sounding close to the stethoscope (Lobar Consolidation, superficial cavity)',
              'Whispering Pectoriloquy: Whispered words ("one-two-three") are heard distinctly and clearly through the stethoscope, as if whispered directly into the earpiece (diagnostic of Lobar Consolidation with patent bronchus)',
              'Egophony ("E-to-A" Sign): Patient asked to say a continuous "Eee"; over consolidated lung or the compressed upper border of a pleural effusion, the sound is converted into a high-pitched, bleating, nasal "Aaa" sound (caused by selective transmission of high-frequency formants through compressed fluid-free lung)',
              'Decreased / Absent Vocal Resonance: Marked reduction in Pleural Effusion, Pneumothorax, Collapse with blocked bronchus, and Thickened pleura',
              'Succussion Splash: Auscultate over lower chest while gently shaking the patient shoulders from side to side; audible splashing sound confirms co-existing fluid and air in pleural space (Pathognomonic of Hydropneumothorax / Pyopneumothorax)',
              'Coin Percussion Test: Assistant holds a coin flat on the anterior chest wall and taps it firmly with the edge of another coin while the examiner auscultates with the stethoscope over the posterior chest wall; a clear, metallic, bell-like ringing note (bell sound) is transmitted across the chest (diagnostic of Pneumothorax)',
            ],
          },
        ],
      },
      {
        title: '10. Systemic Review & Definitive Diagnostic Synthesis',
        items: [
          {
            label: 'Other Systems Examination',
            description: 'Cardiovascular, neurological, and abdominal findings.',
            checklist: [
              'Cardiovascular System: Loud pulmonary second sound (P2), Left parasternal heave (RVH), elevated JVP with prominent v wave, tricuspid regurgitation murmur (Cor Pulmonale / RV failure secondary to chronic hypoxic lung disease)',
              'Central Nervous System: Flapping tremor (Asterixis), bounding pulse, drowsiness, altered sensorium, papilledema (Carbon dioxide CO2 narcosis and severe hypercapnic respiratory failure)',
              'Abdomen: Tender soft hepatomegaly (congestive RHF); tender right hypochondrial mass (Amoebic Liver Abscess extending through diaphragm into right pleural cavity)',
            ],
          },
          {
            label: 'Canonical Examination Presentation Diagnosis Rubric',
            description: 'Structured MBBS practical presentation statement.',
            checklist: [
              'Formulation Template: "A case of [Right / Left] sided [Pleural Effusion / Lobar Consolidation / Pneumothorax / Hydropneumothorax / Bronchiectasis / Lung Abscess / Pulmonary Fibrosis / Complete Lung Collapse] probably of [Tuberculous / Pneumococcal / Staphylococcal / Malignant / Bronchiectatic / Post-infective] etiology, [with / without signs of Cor Pulmonale / Right Heart Failure], and [with / without evidence of acute Type I or Type II Respiratory Failure]."',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'What are the 4 classical physical signs that differentiate Consolidation from Pleural Effusion?',
        answer: '1) Mediastinal shift: Trachea & apex are CENTRAL in consolidation; shifted AWAY from the lesion in large pleural effusion. 2) Percussion note: DULL in consolidation; STONY DULL in effusion. 3) Tactile Vocal Fremitus (TVF) & Vocal Resonance (VR): MARKEDLY INCREASED with bronchophony and whispered pectoriloquy in consolidation; DECREASED or ABSENT in effusion. 4) Breath sounds: BRONCHIAL (tubular) breathing in consolidation; DIMINISHED or ABSENT breath sounds in effusion (except aegophony at the compressed upper border).',
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
      {
        question: 'What is the anatomical basis of Hoover sign in COPD?',
        answer: 'In severe COPD and emphysema, marked hyperinflation pushes the diaphragm downwards, causing it to become flattened or even inverted. When the flattened diaphragm contracts during inspiration, its muscle fibers pull the lower lateral ribs inward toward the midline rather than lifting them upward and outward. This paradoxical inward movement of the lower costal margin is called Hoover sign.',
        examinerTip: 'Hoover sign correlates strongly with the severity of airway obstruction (FEV1 < 40%) and hyperinflation.',
      },
      {
        question: 'What is the diagnostic significance of a positive Coin Percussion Test and Succussion Splash?',
        answer: 'A positive Coin Percussion Test produces a bell-like, metallic ringing chime heard across the chest cavity, indicating a large air-filled cavity under tension (Pneumothorax). A Succussion Splash produces an audible splashing sound on shaking the patient shoulders, which requires BOTH free fluid AND air within a hollow space (Hydropneumothorax or Pyopneumothorax). A simple pleural effusion cannot splash because there is no air-fluid interface!',
        examinerTip: 'Remember: A succussion splash can also be heard over the abdomen in Gastric Outlet Obstruction (GOO) > 4 hours after meals.',
      },
    ],
  },

  // 3. MEDICINE - ABDOMEN & HEPATOBILIARY SYSTEM
  {
    id: 'abdomen_proforma',
    title: 'Abdomen & Hepatobiliary Master Case Proforma',
    system: 'General Medicine',
    department: 'Gastroenterology / General Medicine',
    summary: 'Postgraduate & MBBS examination-grade master proforma for Chronic Liver Disease (Cirrhosis, Portal Hypertension), Ascites, Splenomegaly, Hepatosplenomegaly, Obstructive Jaundice, and Abdominal Mass.',
    examPearl: 'Always start palpating the spleen from the right iliac fossa ascending towards the left hypochondrium so a massive spleen crossing the midline is not missed; never omit the two-finger milking test to differentiate portal hypertension collaterals from IVC obstruction.',
    diagramPath: '/diagrams/clinical/cirrhosis_portal_hypertension.jpg',
    diagramTitle: 'Cirrhosis & Portal Hypertension: Stigmata & Collaterals',
    sections: [
      {
        title: '1. Patient Demographics & Presenting Complaints',
        items: [
          {
            label: 'Patient Demographics',
            description: 'Record standard clinical demographics.',
            checklist: [
              'Name, Age, Sex, Occupation, and Complete Address',
              'Socioeconomic status, dietary habits, and cultural background',
            ],
          },
          {
            label: 'Abdominal Pain',
            description: 'Symptom analysis of acute and chronic abdominal pain.',
            checklist: [
              'Duration and Mode of onset (acute sudden onset in peritonitis/perforation vs insidious dull ache in chronic hepatitis)',
              'Site: Epigastrium, right hypochondrium, periumbilical, right/left iliac fossa, or generalized',
              'Nature & Character: Constant dull dragging ache (stretch of Glisson capsule in hepatomegaly, splenic capsule stretch in splenomegaly) vs Colicky cramping pain (biliary colic, ureteric colic, intestinal obstruction) vs Burning gnawing pain (peptic ulcer disease)',
              'Severity: Visual Analog Scale (VAS 0 to 10)',
              'Radiation: Radiation straight through to the back (acute pancreatitis, posterior penetrating duodenal ulcer); Radiation to right infrascapular region and shoulder tip (acute cholecystitis, biliary colic); Radiation from loin to groin and genitalia (ureteric colic)',
              'Aggravating & Relieving factors: Aggravated by fatty meals (biliary disease), aggravated by food (gastric ulcer), relieved by food and antacids (duodenal ulcer), relieved by sitting forward (pancreatic disease)',
              'Associated features: Fever with chills and rigors (Charcot triad in acute ascending cholangitis), nausea, vomiting, obstipation, or diarrhea',
            ],
          },
          {
            label: 'Abdominal Distension',
            description: 'Chronology, site, and progression of abdominal swelling.',
            checklist: [
              'Duration and Mode of onset: Rapid acute onset over days with intense pain (Budd-Chiari syndrome with hepatic vein thrombosis, portal vein thrombosis, acute peritonitis) vs Insidious gradual painless distension over months (cirrhotic ascites, chronic kidney disease)',
              'Site: Generalized uniform distension (ascites, obesity, meteorism) vs Localized fullness (right hypochondrial mass in hepatomegaly/HCC; left hypochondrial mass in splenomegaly; suprapubic distension in urinary bladder retention)',
              'Progression: Steadily progressive requiring loosening of trouser belts or sari cords; whether associated with scrotal or bilateral pedal edema',
            ],
          },
          {
            label: 'Liver Features: Jaundice, Pruritus & GI Bleed',
            description: 'Cardinal manifestations of parenchymal liver failure and portal hypertension.',
            checklist: [
              'Anorexia: Progressive loss of appetite and early satiety (gastric compression by ascites/splenomegaly)',
              'Jaundice (Icterus): Onset, duration, yellowish discoloration of sclera and skin; dark yellow high-colored tea-like urine; pale clay-colored acholic stools (Obstructive / Cholestatic jaundice); generalized distressing pruritus with intense scratch marks (bile acid deposition in skin)',
              'Upper Gastrointestinal Bleeding (Haematemesis & Melaena):',
              '  * Haematemesis: Vomiting fresh bright red frank blood or dark altered blood with clots; sudden, painless, copious, unheralded hematemesis (ruptured gastroesophageal varices secondary to portal hypertension); hematemesis preceded by severe retching (Mallory-Weiss gastroesophageal junction tear); hematemesis with burning epigastric pain (peptic ulcer erosion)',
              '  * Melaena: Passage of jet black, tarry, sticky, foul-smelling loose stools (requires > 50-100 mL of blood digested in upper GI tract; rules out lower GI bleeding)',
              '  * Differentiate from hemoptysis: Inquire about presence of food particles, preceding nausea, and lack of cough/sputum',
            ],
          },
        ],
      },
      {
        title: '2. Associated Systemic Features (CVS, Hepatic & Renal)',
        items: [
          {
            label: 'Cardiovascular Features (Right Heart Failure)',
            description: 'Cardiogenic causes of congestive hepatomegaly and ascites.',
            checklist: [
              'History of bilateral lower extremity swelling (ascending pedal edema)',
              'History of exertional breathlessness, orthopnea, and PND (congestive heart failure)',
              'History of retrosternal chest pain or prior myocardial infarction',
            ],
          },
          {
            label: 'Renal & Fluid Balance Symptoms',
            description: 'Hepatorenal syndrome and fluid retention indicators.',
            checklist: [
              'History of oliguria: Progressive decrease in 24-hour urine output (< 400-500 mL/day)',
              'History of hematuria (dark smoky urine) or frothy foamy urine (heavy proteinuria in nephrotic syndrome causing ascites)',
              'History of sudden worsening of renal function following high-dose diuretic therapy, paracentesis, or GI bleed (Hepatorenal Syndrome HRS-AKI)',
            ],
          },
          {
            label: 'Neuropsychiatric Symptoms (Hepatic Encephalopathy)',
            description: 'Portosystemic encephalopathy stages.',
            checklist: [
              'Reversal of sleep-wake cycle: Daytime somnolence with nocturnal insomnia (earliest sign of Hepatic Encephalopathy)',
              'Subtle personality changes: Irritability, apathy, euphoria, anxiety, intellectual impairment',
              'Impaired fine motor coordination: Difficulty writing, change in signature, clumsy buttoning of clothes (constructional apraxia)',
              'Confusion, gross disorientation to time and place, inappropriate social behavior, slurred speech, delirium, and fluctuating stupor',
              'Precipitating triggers: High dietary protein intake, gastrointestinal bleeding, constipation, hypokalemia, diuretics, sedatives, infections (Spontaneous Bacterial Peritonitis)',
            ],
          },
        ],
      },
      {
        title: '3. Etiological Past History, Risk Factors & Vaccinations',
        items: [
          {
            label: 'Past Medical & Surgical History',
            description: 'Prior medical illnesses, surgical interventions, and biliary history.',
            checklist: [
              'History of previous similar episodes of jaundice, ascites, hematemesis, or hepatic decompensation',
              'History of Diabetes Mellitus, Systemic Hypertension, Tuberculosis, and Bronchial Asthma',
              'History of previous abdominal surgeries (laparotomy, cholecystectomy, appendectomy, portosystemic shunt surgery)',
              'History of biliary colic, gallstones, or renal calculi',
            ],
          },
          {
            label: 'Viral Hepatitis Risk Factors & Parenteral Transmission',
            description: 'Blood-borne and mucosal transmission vectors.',
            checklist: [
              'History of professional body tattooing or body piercing using unsterilized needles',
              'History of Intravenous (IV) recreational drug abuse with needle sharing (Hepatitis C virus transmission)',
              'History of multiple blood or blood product transfusions, especially prior to mandatory viral screening',
              'History of high-risk unprotected sexual exposures, multiple partners, or sexually transmitted diseases (Hepatitis B virus)',
              'History of therapeutic injections, unsterile dental instrumentation, or acupuncture',
              'History of Hepatitis vaccination: Complete 3-dose vaccination against Hepatitis B; Hepatitis A and Hepatitis E vaccination history',
            ],
          },
          {
            label: 'Drug-Induced Liver Injury (DILI) & Toxins',
            description: 'Hepatotoxic pharmaceutical and alternative exposures.',
            checklist: [
              'Anti-Tubercular Therapy (ATT): Isoniazid (INH), Rifampicin, Pyrazinamide (commonest cause of DILI in India)',
              'Acetaminophen / Paracetamol overdose or chronic therapeutic excess',
              'Anticonvulsants (Sodium valproate, Carbamazepine, Phenytoin)',
              'Antibiotics: Amoxicillin-clavulanate (cholestatic jaundice), Macrolides, Nitrofurantoin, Ketoconazole',
              'Indigenous / Ayurvedic / Herbal medications, complementary alternative medicines (CAM), heavy metal decoctions, country potions',
              'Occupational toxin exposures: Carbon tetrachloride, vinyl chloride (hepatic angiosarcoma), arsenic, phosphorus',
            ],
          },
        ],
      },
      {
        title: '4. Family, Personal, Sexual & Treatment History',
        items: [
          {
            label: 'Family History & Inherited Metabolic Diseases',
            description: 'Hereditary liver diseases.',
            checklist: [
              'History of chronic liver disease, unexplained cirrhosis, or premature death from liver failure in first-degree relatives',
              'Alpha-1-Antitrypsin Deficiency: Emphysema in young non-smokers associated with cirrhosis',
              'Wilson Disease: Consanguineous parentage, unexplained childhood/adolescent cirrhosis, tremors, dystonia, psychiatric disturbances, or Kayser-Fleischer rings',
              'Hereditary Hemochromatosis: Family history of bronze diabetes, hyperpigmentation, arthritis, and cardiomyopathy',
            ],
          },
          {
            label: 'Alcoholic Quantification & Personal History',
            description: 'Exact mathematical calculation of alcohol consumption.',
            checklist: [
              'Type of alcoholic beverage: Country liquor (arrack, toddy), Indian Made Foreign Liquor (IMFL: whisky, brandy, rum, gin ~ 40-42.8% ABV), Beer (5-8% ABV), Wine (11-14% ABV)',
              'Average daily consumption in milliliters (mL)',
              'Calculation of Pure Alcohol Intake in Grams/Day: Alcohol (g/day) = Volume (mL) x ABV (%) x 0.8 / 100 (Threshold for cirrhosis: > 60-80 g/day in men for > 10 years; > 20-40 g/day in women for > 10 years)',
              'Drinking pattern: Binge drinking vs steady daily consumption; duration of alcohol use in years; time since last drink',
              'CAGE Questionnaire: C - Have you ever felt you should Cut down on your drinking? A - Have people Annoyed you by criticizing your drinking? G - Have you ever felt bad or Guilty about your drinking? E - Have you ever had an Eye-opener drink first thing in the morning? (Score >= 2 indicates alcohol dependence)',
              'History of alcohol withdrawal symptoms: Morning tremors, insomnia, diaphoresis, auditory/visual hallucinations, withdrawal seizures, delirium tremens',
              'Dietary history: Caloric and protein intake, salt consumption',
              'Sexual History: High-risk contacts, commercial sex workers, men who have sex with men (MSM)',
              'Menstrual & Obstetric History: Secondary amenorrhea or oligomenorrhea in females with cirrhosis due to hypothalamic-pituitary-gonadal axis suppression and hyperestrogenism',
            ],
          },
          {
            label: 'Current Treatment History',
            description: 'Cirrhosis and portal hypertension pharmacotherapy.',
            checklist: [
              'Diuretic Regimen: Spironolactone (aldosterone antagonist, 100 mg/day titrated up to 400 mg) combined with Furosemide (loop diuretic, 40 mg/day titrated up to 160 mg) in a fixed 100:40 mg ratio to maintain normokalemia',
              'Non-Selective Beta-Blockers (NSBB): Propranolol (20-80 mg BD) or Carvedilol (6.25-12.5 mg OD) for primary and secondary prophylaxis of variceal bleeding (titrated to reduce resting heart rate by 25% or to 55-60 bpm)',
              'Lactulose (synthetic non-absorbable disaccharide) titrated to achieve 2 to 3 soft acidic bowel movements per day for hepatic encephalopathy',
              'Rifaximin (gut-selective non-absorbable antibiotic, 550 mg BD) for secondary encephalopathy prophylaxis',
              'Vasoactive agents: Terlipressin, Octreotide, Somatostatin used during acute variceal bleed',
              'Proton pump inhibitors (Pantoprazole), Vitamin K supplementation',
              'History of therapeutic paracentesis with intravenous albumin infusion (8 grams of 20% albumin per liter of ascitic fluid removed beyond 5 liters to prevent paracentesis-induced circulatory dysfunction PICD)',
              'History of Endoscopic Variceal Ligation (EVL / band ligation) or sclerotherapy',
            ],
          },
        ],
      },
      {
        title: '5. Head-to-Toe Stigmata of Liver Cell Failure & Portal HT',
        items: [
          {
            label: 'Head, Eyes & Facial Stigmata',
            description: 'Craniofacial stigmata of chronic liver disease.',
            checklist: [
              'Head: Alopecia (diffuse thinning and loss of scalp hair), temporal muscle wasting (hollowing of temporal fossae due to profound muscle catabolism in cirrhosis)',
              'Eyes: Bitot spots (triangular foamy keratinized plaques on bulbar conjunctiva indicating severe Vitamin A malabsorption in chronic cholestasis); Subconjunctival hemorrhages (severe coagulopathy and thrombocytopenia); Anemia / Pallor of conjunctiva; Jaundice / Deep icterus of sclera; Kayser-Fleischer (KF) Ring (golden-brownish to greenish-copper granular deposit in Descemet membrane at the corneal limbus, evaluated with slit-lamp microscopy; diagnostic of Wilson disease); Xanthelasma (soft, yellowish periorbital subcutaneous cholesterol plaques in Primary Biliary Cholangitis PBC)',
              'Face: Medial supraciliary madarosis (loss of hair from the medial third of eyebrows); Sunken hollow eyes and wasted sunken cheeks (hippocratic facies of end-stage liver failure); Loss of facial hair (thin, sparse beard and moustache in males due to feminization); Bilateral painless Parotid Gland Enlargement (sialadenosis / fatty infiltration in chronic alcoholism)',
            ],
          },
          {
            label: 'Oral & Thoracic Stigmata',
            description: 'Oral cavity and chest wall signs.',
            checklist: [
              'Mouth: Bleeding gums (thrombocytopenia and coagulopathy); Cheilosis and angular stomatitis (riboflavin/vitamin B deficiencies); Fetor Hepaticus (sweet, musty, mousy, slightly fecal breath odor caused by volatile dimethyl sulfide, mercaptans, and ethanethiol in severe portosystemic shunting)',
              'Chest Wall Stigmata:',
              '  * Spider Angiomas / Spider Naevi: Central pulsating arteriole with delicate radiating capillary legs distributed strictly in the Superior Vena Cava (SVC) territory (face, neck, upper chest, shoulders, forearms); pressing the central arteriole with the tip of a pinhead or glass slide causes complete blanching of the radiating legs; release causes instant filling from the center outwards (> 5 spider naevi on trunk is highly specific for chronic liver disease with portal hypertension and impaired hepatic estrogen degradation)',
              '  * Gynecomastia: True glandular breast tissue enlargement in males; palpable, firm, tender disc of breast tissue beneath the areola (caused by altered estrogen-to-androgen ratio, hyperestrogenism, and spironolactone therapy)',
              '  * Atrophy of breasts in females',
              '  * Loss of secondary sexual hair: Loss of pectoral and axillary hair (female escutcheon pattern in males)',
              '  * Pectoral muscle atrophy and visible bony ribcage',
              '  * Dilated collateral veins on anterior chest wall',
            ],
          },
          {
            label: 'Hand, Nail & Abdominal Stigmata',
            description: 'Peripheral vascular, nail, and abdominal signs.',
            checklist: [
              'Hands:',
              '  * Palmar Erythema: Symmetrical, mottled, non-tender erythematous flushing of the thenar and hypothenar eminences, sparing the central palm (caused by hyperdynamic circulation, peripheral arteriolar vasodilatation, and increased free circulating estradiol)',
              '  * Bounding / Collapsing Water-Hammer Pulse: Due to hyperdynamic circulation with peripheral arteriolar vasodilatation and low systemic vascular resistance',
              '  * Finger Clubbing: Bilateral clubbing (Grade 1-3) seen in cirrhosis, hepatopulmonary syndrome, and primary biliary cholangitis',
              '  * Dupuytren Contracture: Nodular thickening and shortening of the palmar aponeurosis causing progressive flexion deformity of the ring and little fingers (strongly associated with chronic alcoholism)',
              '  * Flapping Tremor / Asterixis: Patient holds arms outstretched with wrists dorsiflexed and fingers abducted for 30-60 seconds; rapid, arrhythmic, irregular, involuntary lapses of sustained posture and downward flapping movements of hands (negative myoclonus; pathognomonic of Hepatic Encephalopathy Stage 2-3, uremia, or CO2 narcosis)',
              'Nails:',
              '  * Terry Nails: Proximal 80% of the nail plate has an opaque ground-glass white appearance with a narrow 1-2 mm reddish-brown distal band (caused by hypoalbuminemia and altered nail bed microcirculation)',
              '  * Muehrcke Lines: Paired, white, transverse, non-palpable parallel bands running across the nail plate separated by normal pink nail bed; do not move with nail growth; indicates severe chronic hypoalbuminemia (< 2.2 g/dL)',
              '  * Leukonychia totalis: Whitening of nails',
              'Abdomen & Genitalia:',
              '  * Distended abdomen with prominent dilated collateral veins (Caput Medusae)',
              '  * Testicular Atrophy: Both testes small, soft, shrunken (< 12 mL volume) with loss of testicular sensation (caused by impaired hypothalamic GnRH secretion, low testosterone, and high circulating estrogen)',
              '  * Loss of pubic hair (loss of normal diamond-shaped male escutcheon into a flat female triangular pattern)',
              '  * Scrotal edema: Pitting swelling of scrotal skin',
            ],
          },
          {
            label: 'Lower Limbs & General Body Appearance',
            description: 'Peripheral edema, ulcers, and overall habitus.',
            checklist: [
              'Lower Limbs: Bilateral, symmetrical, pitting pedal edema over medial malleolus and pre-tibial shins (caused by hypoalbuminemia, high sinusoidal hydrostatic pressure, and secondary hyperaldosteronism); chronic stasis pigmentation, thinning of skin, chronic leg ulcers, loss of leg hair',
              'Generalized Pruritus & Scratch Marks: Multiple linear excoriations over limbs and trunk due to bile salt deposition in skin in cholestatic jaundice',
              'Spider-Man Appearance: Striking clinical habitus of profound wasting, emaciated thin upper and lower limbs with a protuberant, massive, fluid-distended abdomen',
              'Markers of Tuberculosis & HIV: Scrofuloderma scars, oral hairy leukoplakia, oral thrush, multidermatomal zoster',
            ],
          },
        ],
      },
      {
        title: '6. Vital Signs & Hemodynamics in Chronic Liver Disease',
        items: [
          {
            label: 'Hemodynamic Vital Signs',
            description: 'Evaluation of the hyperdynamic circulatory state of cirrhosis.',
            checklist: [
              'Arterial Pulse: Rate, rhythm, bounding hyperdynamic volume (large volume pulse due to high cardiac output and reduced systemic vascular resistance from splanchnic nitric oxide release); radio-femoral delay absent, condition of vessel wall',
              'Blood Pressure: Wide pulse pressure (e.g., 110/60 mmHg); low mean arterial pressure; significant postural hypotension due to autonomic neuropathy and splanchnic venous pooling',
              'Respiratory Rate: Counted for 60 seconds; tachypnea due to tense ascites splinting the diaphragm and reducing functional residual capacity; respiratory alkalosis',
              'Body Temperature: Measured in axilla (hypothermia common in advanced liver failure; low-grade fever indicates spontaneous bacterial peritonitis, urinary tract infection, or alcoholic hepatitis)',
              'Jugular Venous Pressure (JVP): Normal or low JVP in uncomplicated cirrhosis due to splanchnic venous pooling; ELEVATED JVP in chronic liver disease rules out primary cirrhosis and points directly to Congestive Heart Failure, Severe Tricuspid Regurgitation, or Constrictive Pericarditis causing Cardiac Cirrhosis!',
            ],
          },
        ],
      },
      {
        title: '7. Inspection: Supine, Head-Rising & Standing Positions',
        items: [
          {
            label: 'Inspection in the Supine Position',
            description: 'Patient examined completely flat and at 45 degrees with abdomen exposed from xiphisternum to midthigh.',
            checklist: [
              'Contour of Abdomen: Flat, scaphoid, or distended; Generalized uniform symmetrical distension with fullness and eversion of flanks (characteristic of Ascites); Central domed distension with empty flanks (meteorism, mesenteric cyst, pregnancy)',
              'Flanks: Full and bulging laterally in ascites; free in non-fluid distension',
              'Umbilicus Inspection:',
              '  - Position: Normally midway between xiphisternum and pubic symphysis; in ascites, umbilicus is displaced downwards (distance from xiphisternum to umbilicus exceeds distance from umbilicus to symphysis pubis, T/X > X/P); in pelvic or ovarian masses, umbilicus is pushed upwards',
              '  - Shape: Slit-like horizontal smiling umbilicus in moderate ascites; everted, tense, flattened, or herniating in tense ascites',
              '  - Nodules: Sister Mary Joseph Nodule (firm, irregular, ulcerated or subcutaneous metastatic nodule at the umbilicus from gastric, colon, or pancreatic adenocarcinoma)',
              'Movement of Abdominal Wall with Respiration:',
              '  - Normal: Abdominal wall moves freely and synchronously with respiration',
              '  - Restricted or absent movements: Generalized peritonitis or severe acute pancreatitis',
              'Visible Peristalsis:',
              '  - Visible Gastric Peristalsis (VGP): Large slow peristaltic waves passing from left hypochondrium downwards and to the right across the epigastrium (Gastric Outlet Obstruction)',
              '  - Visible Intestinal Peristalsis (VIP): Rapid dynamic step-ladder peristaltic waves across the periumbilical region (Small Bowel Obstruction)',
              'Skin and Surface of Abdomen:',
              '  - Stretched, smooth, shiny, and tense skin with thinned epidermis in ascites',
              '  - Striae: Silvery-white striae distensae from rapid abdominal distension and stretching of elastic dermal fibers; Broad purple/violaceous striae in Cushing syndrome',
              '  - Scars: Previous laparotomy, subcostal Kocher scar (cholecystectomy), McBurney scar (appendectomy)',
              '  - Dilated collateral veins on anterior abdominal wall (Caput Medusae)',
            ],
          },
          {
            label: 'Inspection during Head-Rising Test & Standing Position',
            description: 'Provocative maneuvers for muscle wall defects and external hernia.',
            checklist: [
              'Head-Rising Test (Divarication of Recti):',
              '  - Patient asked to lift head off pillow without using hands (or cough/strain)',
              '  - Rectus abdominis muscles contract firmly',
              '  - Divarication of Recti (Diastasis Recti): Prominent, elongated, midline longitudinal ridge/bulge emerging between the two separated rectus abdominis bellies from xiphisternum to umbilicus; caused by stretching and thinning of the linea alba in multiparous females or massive chronic ascites (not a true hernia, no surgical ring)',
              'Inspection in the Standing Position:',
              '  - Engorgement and filling of dilated anterior abdominal veins become prominent',
              '  - Hernial Orifices: Inguinal, femoral, and umbilical regions inspected for expansile cough impulses',
              '  - External Genitalia: Bilateral scrotal swelling, edema, and testicular size inspected in standing position',
            ],
          },
        ],
      },
      {
        title: '8. Superficial & Deep Palpation: Liver, Spleen & Kidneys',
        items: [
          {
            label: 'Superficial Palpation Protocol',
            description: 'Patient supine, knees slightly flexed to relax abdominal wall, examiner hands warm.',
            checklist: [
              'Ask patient if there is any painful area; examine the painful quadrant LAST',
              'Gently palpate all 9 quadrants of abdomen using flat palmar aspect of fingers (not fingertips)',
              'Local Temperature / Warmth: Assessed with dorsum of hand (increased warmth in abscess / cellulitis)',
              'Tenderness: Localized vs generalized tenderness',
              'Muscle Guarding: Voluntary contraction of abdominal muscles (diminishes as patient relaxes or takes deep breaths) vs Involuntary Rigidity (board-like continuous involuntary contraction of abdominal muscles due to peritoneal irritation in peritonitis/perforation)',
              'Hyperesthesia: Cutaneous hypersensitivity along dermatomes (Sherren triangle in acute appendicitis)',
            ],
          },
          {
            label: 'Deep Palpation of the Liver & Liver Span',
            description: 'Systematic examination of hepatic enlargement.',
            checklist: [
              'Technique: Palpation begins in the Right Iliac Fossa (RIF) with radial border of right index finger or flat fingers parallel to right costal margin; advance upwards 1-2 cm during expiration and hold steady during deep inspiration to feel the liver edge descending against the finger',
              'Liver Characteristics Documented:',
              '  * Size: Distance in centimeters (cm) below the right costal margin in the right midclavicular line (MCL)',
              '  * Movement with respiration: Normal liver moves down 1-3 cm with the diaphragm on deep inspiration',
              '  * Surface: Smooth (normal, viral hepatitis, fatty liver, cardiac congestion) vs Micronodular (fine hobnail pebbly surface in alcoholic cirrhosis) vs Macronodular / Irregular / Rocky hard (Hepatocellular Carcinoma, metastatic deposits)',
              '  * Margin / Edge: Sharp, knife-like edge (normal, cirrhosis) vs Rounded, blunt edge (congestive hepatomegaly, fatty liver)',
              '  * Consistency: Soft (normal, acute fatty liver) vs Firm (cirrhosis) vs Stony hard / Wood-like (Hepatocellular Carcinoma, metastases)',
              '  * Tenderness: Tender on palpation (acute viral hepatitis, congestive failure, amoebic liver abscess, Budd-Chiari) vs Non-tender (cirrhosis, uncomplicated malignancy)',
              '  * Pulsatility: Expansile systolic hepatic pulsation (severe Tricuspid Regurgitation)',
              'Liver Span Measurement Protocol:',
              '  * Percuss the upper border of liver dullness in right midclavicular line from 2nd ICS downwards (normally 5th right ICS MCL)',
              '  * Palpate or percuss the lower border of liver dullness in right midclavicular line from RIF upwards',
              '  * Total Liver Span = Distance between upper and lower borders (Normal: 12-15 cm in adult males, 10-12 cm in females; Liver span < 10 cm confirms a small, shrunken cirrhotic liver; Liver span > 15 cm confirms true Hepatomegaly)',
            ],
          },
          {
            label: 'Deep Palpation of the Spleen (Splenomegaly)',
            description: 'Systematic examination of splenic enlargement.',
            checklist: [
              'Technique: Start palpation in the Right Iliac Fossa (RIF) with flat hand, pointing towards the left hypochondrium; advance diagonally across the umbilicus towards the left costal margin during expiration, holding steady during deep inspiration to feel the descending spleen tip (a massive spleen extending into RIF will be completely missed if palpation begins in the left upper quadrant!)',
              'Bimanual Palpation: Examiner left hand supports the lower left ribcage posteriorly (10th-11th ribs) lifting it forward, while right hand palpates subcostally',
              'Middleton Maneuver: Patient turned 45 degrees into right lateral decubitus position with left knee flexed; examiner hooks fingers under left costal margin during deep inspiration (detects mild, early 1-2 cm splenomegaly)',
              'Clinical Signs Confirming Spleen (vs Left Kidney):',
              '  1. Enlarges diagonally downwards and medially towards the right iliac fossa (along axis of 10th rib)',
              '  2. Sharp anterior/medial border with a distinct, palpable SPLENIC NOTCH',
              '  3. CANNOT get above the mass (upper border extends deep under left costal margin)',
              '  4. Dull to percussion (lies in direct contact with anterior abdominal wall)',
              '  5. Not bimanually ballotable; moves freely with deep respiration',
              'Hackett Grading of Splenomegaly:',
              '  - Grade 0: Normal spleen, not palpable on deep inspiration',
              '  - Grade 1: Spleen palpable only on deep inspiration below left costal margin',
              '  - Grade 2: Spleen palpable below costal margin, halfway to horizontal line through umbilicus',
              '  - Grade 3: Spleen palpable extending to the level of the umbilicus',
              '  - Grade 4: Spleen palpable halfway between umbilicus and pubic symphysis',
              '  - Grade 5: Massive spleen extending into right iliac fossa, crossing the midline',
            ],
          },
          {
            label: 'Bimanual Palpation and Ballottement of Kidneys',
            description: 'Differentiation of renal masses.',
            checklist: [
              'Right Kidney Palpation: Left hand placed in right loin between 12th rib and iliac crest, pushing forwards; right hand placed flat on right lumbar/hypochondrial region pressing deeply backwards',
              'Left Kidney Palpation: Examiner reaches across patient or palpates with hands reversed',
              'Ballottement: Quick flexing motion of posterior hand fingers thrusts kidney forward against anterior palpating hand (Bimanually Ballotable mass confirms renal origin; spleen is NOT ballotable)',
              'Can get above the mass; anterior band of resonance on percussion due to overlying colon',
            ],
          },
        ],
      },
      {
        title: '9. Special Palpatory Tests: Venous Milking, Fluid Thrill & Girth',
        items: [
          {
            label: 'Two-Finger Milking Test for Venous Blood Flow Direction',
            description: 'Crucial clinical test to differentiate Portal Hypertension from Vena Caval Obstruction.',
            checklist: [
              'Technique: Identify a prominent, dilated straight segment of vein on the anterior abdominal wall',
              'Place index and middle fingertips side-by-side firmly over the vein to occlude and empty it',
              'Slide the index finger upwards along the vein for 3-4 cm while keeping the middle finger pressed firmly to empty the venous blood column',
              'Step 1: Release the lower (middle) finger while maintaining pressure with upper finger: Observe if vein fills immediately from below (Flow is UPWARDS)',
              'Step 2: Re-empty vein; release the upper (index) finger while maintaining pressure with lower finger: Observe if vein fills immediately from above (Flow is DOWNWARDS)',
              'Interpretation of Venous Blood Flow Patterns:',
              '  * Portal Hypertension (Caput Medusae): Blood flows radially AWAY from the umbilicus (UPWARDS above umbilicus towards SVC territory; DOWNWARDS below umbilicus towards IVC territory; Paraumbilical veins in falciform ligament recanalized)',
              '  * Inferior Vena Cava (IVC) Obstruction: Blood flow in all dilated abdominal wall veins is entirely UPWARDS (flows from below pubis and groin upwards towards thoracic veins to bypass the obstructed IVC)',
              '  * Superior Vena Cava (SVC) Obstruction: Blood flow in all chest and abdominal wall collaterals is entirely DOWNWARDS (flows downwards towards the groin and saphenous system to bypass the obstructed SVC)',
            ],
          },
          {
            label: 'Fluid Thrill (Fluid Wave) Test',
            description: 'Clinical test for massive peritoneal free fluid.',
            checklist: [
              'Technique: Patient lies supine; an assistant places the ulnar border of one hand firmly along the midline of the abdomen (this critical maneuver dampens and prevents transmission of false mechanical shock waves through the subcutaneous abdominal wall fat)',
              'Examiner places the left palm flat against the patient right flank and sharply flicks or taps the left flank with the fingers of the right hand',
              'Positive Fluid Thrill: A distinct, liquid shock wave / impulse is transmitted across the peritoneal cavity and strikes the opposite palpating palm',
              'Clinical Significance: Confirms Massive Ascites (requires at least 1500 to 2000 mL of free peritoneal fluid to elicit a fluid thrill)',
            ],
          },
          {
            label: 'Abdominal Girth Measurement',
            description: 'Serial monitoring of ascites volume.',
            checklist: [
              'Technique: Inelastic measuring tape placed horizontally around the abdomen passing directly over the center of the umbilicus',
              'Measured at the end of normal quiet expiration with patient lying flat supine',
              'Recorded in centimeters (cm) daily at the same time of morning after micturition to objectively evaluate therapeutic response to diuretics and paracentesis',
            ],
          },
          {
            label: 'Palpation of Lymph Nodes',
            description: 'Metastatic abdominal stations.',
            checklist: [
              'Left Supraclavicular Lymph Node (Troisier Sign / Virchow Node): Firm, non-tender, stony hard node deep behind clavicular head of left sternocleidomastoid; represents metastatic seeding from gastrointestinal malignancy (stomach, pancreas, colon) via the thoracic duct',
              'Bilateral Inguinal Lymph Nodes (horizontal and vertical chains)',
              'Para-aortic lymph nodes (deep epigastric mass, non-tender, fixed)',
            ],
          },
        ],
      },
      {
        title: '10. Percussion: Shifting Dullness, Puddle Sign & Organ Span',
        items: [
          {
            label: 'Shifting Dullness Test for Moderate Ascites',
            description: 'The standard clinical bedside test for free peritoneal fluid.',
            checklist: [
              'Technique: Patient lies supine; start percussion at the midline umbilicus (which is tympanitic and resonant because gas-filled bowel loops float upwards on top of ascitic fluid)',
              'Percuss downwards laterally towards one flank along the horizontal line until the percussion note changes from resonant to DULL; keep the pleximeter finger firmly in place at this exact point of dullness',
              'Ask patient to turn 45 degrees towards the opposite side; wait 15-30 seconds to allow gravitational shifting of fluid',
              'Re-percuss at the same point: The note shifts from dull to TYMPANITIC / RESONANT (as free fluid sinks to the dependent flank and gas-filled bowel floats upwards)',
              'Now percuss across to the opposite dependent flank to demonstrate that dullness has shifted to the dependent side',
              'Clinical Significance: Requires approximately 500 to 1000 mL of free ascites for positive shifting dullness',
            ],
          },
          {
            label: 'Puddle Sign for Minimal Ascites',
            description: 'High-sensitivity bedside test for small-volume ascites.',
            checklist: [
              'Technique: Patient placed on all fours in the knee-elbow position for 3-5 minutes, allowing small quantities of fluid to pool dependently around the umbilicus',
              'Stethoscope diaphragm placed over the most dependent part of the periumbilical abdominal wall',
              'Examiner lightly flicks the lateral flank with a finger while gradually moving the stethoscope laterally away from the fluid pool',
              'Positive Puddle Sign: There is a sudden sharp increase in sound intensity and high-frequency transmission when the stethoscope crosses the border of the fluid puddle',
              'Clinical Significance: Can detect small volumes of free ascitic fluid as low as 100 to 120 mL',
            ],
          },
          {
            label: 'Splenic Dullness & Traube Space Percussion',
            description: 'Delineation of left upper quadrant organs.',
            checklist: [
              'Traube Space Boundaries: Left 6th rib superiorly, left midaxillary line laterally, left costal margin inferiorly; normally tympanitic (gastric bubble); Dullness indicates Splenomegaly, Left Pleural Effusion, or massive Hepatomegaly',
              'Castell Sign: Percuss the lowest intercostal space in the left anterior axillary line (normally resonant); ask patient to take a deep inspiration; note remains resonant normally; note shifts to DULL on inspiration in Splenomegaly (positive Castell sign)',
              'Nixon Method for Splenomegaly: Patient turned onto right side at 45 degrees; percuss from lower posterior axillary margin diagonally across spleen; dullness > 8 cm confirms splenomegaly',
            ],
          },
        ],
      },
      {
        title: '11. Auscultation: Bowel Sounds, Bruits, Venous Hums & Rubs',
        items: [
          {
            label: 'Auscultation of Bowel Sounds',
            description: 'Gastrointestinal motility evaluation.',
            checklist: [
              'Technique: Auscultate with warm stethoscope diaphragm placed in right lower quadrant (ileocecal region) for at least 1-2 full minutes',
              'Normal Bowel Sounds: Low-pitched intermittent gurgling clicks and rumbles occurring at a rate of 4 to 8 per minute (small bowel motility produces 10-15/min, large bowel 3-5/min)',
              'Hyperactive Bowel Sounds: Frequent loud rushes and high-pitched metallic tinkling sounds (borborygmi) indicating mechanical intestinal obstruction',
              'Absent Bowel Sounds: Silence documented after listening continuously for 3 to 5 minutes; indicates Paralytic Ileus, diffuse generalized Peritonitis, or severe hypokalemia',
            ],
          },
          {
            label: 'Vascular Bruits & Venous Hums',
            description: 'Turbulent vascular flows in cirrhosis and portal hypertension.',
            checklist: [
              'Hepatic Arterial Bruit: Soft systolic or continuous murmur heard over the liver parenchyma (seen in Hepatocellular Carcinoma HCC due to tumor hypervascularity, Acute Alcoholic Hepatitis, or arteriovenous malformations)',
              'Renal Artery Bruit: High-pitched systolic-diastolic bruit heard 2-3 cm superior and lateral to the umbilicus, radiating to flanks (Renal Artery Stenosis in secondary hypertension)',
              'Abdominal Aortic Bruit: Midline systolic bruit heard in epigastrium (Aortic aneurysm or atherosclerosis)',
              'Cruveilhier-Baumgarten Venous Hum: Soft, continuous, low-pitched humming murmur heard over the epigastrium and periumbilical region midway between umbilicus and xiphisternum; produced by turbulent flow through recanalized paraumbilical veins in the falciform ligament in severe Portal Hypertension; hum intensifies during inspiration and standing; obliterated by applying firm pressure with stethoscope',
            ],
          },
          {
            label: 'Peritoneal Friction Rubs & Succussion Splash',
            description: 'Serosal inflammation and gastric retention.',
            checklist: [
              'Peritoneal Friction Rubs: Rough, grating, creaking, leathery sound heard during respiration:',
              '  * Splenic Friction Rub: Heard over left upper quadrant in Splenic Infarction (sickle cell disease, infective endocarditis)',
              '  * Hepatic Friction Rub: Heard over right lower costal margin in Perihepatitis (amoebic liver abscess, gonococcal/chlamydial Fitz-Hugh-Curtis syndrome, hepatic metastatic nodules)',
              'Succussion Splash: Auscultate over epigastrium while grasping the patient iliac crests and vigorously rocking the pelvis from side to side; an audible sloshing/splashing sound heard > 4 hours after a meal confirms Gastric Outlet Obstruction (GOO) or severe gastroparesis',
            ],
          },
        ],
      },
      {
        title: '12. Systemic Review & Definitive Diagnostic Synthesis (Child-Pugh)',
        items: [
          {
            label: 'Other Systems Examination',
            description: 'Extra-abdominal organ assessment.',
            checklist: [
              'Cardiovascular System: Hyperdynamic circulation, ejection systolic hemic flow murmurs at pulmonary area, low systemic vascular resistance',
              'Respiratory System: Elevated right hemidiaphragm; Right-sided Pleural Effusion (Hepatic Hydrothorax: transudation of ascitic fluid across congenital diaphragmatic defects into pleural space)',
              'Central Nervous System: Mental status, asterixis, West Haven grading of Hepatic Encephalopathy (Grade 1 to 4)',
            ],
          },
          {
            label: 'Child-Pugh Score & Prognostic Classification',
            description: 'Objective grading of cirrhotic severity (Pour Another Beer At Eleven mnemonic).',
            checklist: [
              'Scoring System (1, 2, or 3 points for each of the 5 parameters):',
              '  * P - Prothrombin Time / INR prolongation: 1 pt (< 1.7 or < 4 s prolonged), 2 pts (1.7-2.3 or 4-6 s), 3 pts (> 2.3 or > 6 s)',
              '  * A - Ascites: 1 pt (None), 2 pts (Slight / medically controlled), 3 pts (Moderate to severe / refractory)',
              '  * B - Bilirubin (mg/dL): 1 pt (< 2.0 mg/dL), 2 pts (2.0-3.0 mg/dL), 3 pts (> 3.0 mg/dL; in Primary Biliary Cholangitis PBC, cutoffs are < 4, 4-10, > 10)',
              '  * A - Albumin (g/dL): 1 pt (> 3.5 g/dL), 2 pts (2.8-3.5 g/dL), 3 pts (< 2.8 g/dL)',
              '  * E - Encephalopathy: 1 pt (None), 2 pts (Grade 1-2), 3 pts (Grade 3-4)',
              'Child-Pugh Classification:',
              '  * Class A: 5 to 6 points (Well-compensated cirrhosis, 1-year survival 100%)',
              '  * Class B: 7 to 9 points (Significant functional compromise, 1-year survival 80%)',
              '  * Class C: 10 to 15 points (Decompensated cirrhosis, 1-year survival 45%)',
            ],
          },
          {
            label: 'Canonical Examination Presentation Diagnosis Rubric',
            description: 'Structured MBBS practical case formulation.',
            checklist: [
              'Formulation Template: "A case of Chronic Liver Disease (Cirrhosis of the Liver) probably of [Alcoholic / Chronic Viral Hepatitis B / Chronic Viral Hepatitis C / Non-Alcoholic Steatohepatitis NASH / Wilson disease / Autoimmune Hepatitis] etiology, complicated by Portal Hypertension with [Ascites / Upper Gastrointestinal Bleeding from esophageal varices / Hepatic Encephalopathy Grade I-IV / Spontaneous Bacterial Peritonitis / Hepatorenal Syndrome], currently in [Child-Pugh Class A / B / C], with a MELD-Na score of [__], and [with / without evidence of Hepatocellular Carcinoma]."',
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
        answer: 'SAAG = Serum Albumin minus Ascitic Fluid Albumin (measured on simultaneous same-day samples). 1) HIGH SAAG (>= 1.1 g/dL): Indicates PORTAL HYPERTENSION (sinusoidal hydrostatic transudation). Causes: Cirrhosis, Budd-Chiari syndrome, Congestive heart failure, Constrictive pericarditis, Portal vein thrombosis. 2) LOW SAAG (< 1.1 g/dL): Indicates NON-PORTAL HYPERTENSION etiologies (increased capillary permeability or peritoneal exudation). Causes: Peritoneal carcinomatosis, Tuberculous peritonitis, Nephrotic syndrome, Pancreatic ascites, Biliary leak.',
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
      {
        question: 'What is Cruveilhier-Baumgarten syndrome and what physical signs define it?',
        answer: 'Cruveilhier-Baumgarten syndrome is characterized by Portal Hypertension associated with a widely patent, recanalized umbilical vein running within the falciform ligament. It features: 1) Caput medusae (large tortuous subcutaneous veins radiating from the umbilicus); 2) Cruveilhier-Baumgarten Venous Hum (a continuous low-pitched humming murmur heard midway between the xiphisternum and umbilicus, which intensifies during inspiration and diminishes on pressing with the stethoscope); 3) Palpable thrill over the venous hum site.',
        examinerTip: 'Contrast Cruveilhier-Baumgarten syndrome (acquired recanalization due to cirrhosis) with Cruveilhier-Baumgarten disease (congenital patency of umbilical vein with hypoplastic liver).',
      },
      {
        question: 'What is the definition and diagnostic criteria for Spontaneous Bacterial Peritonitis (SBP)?',
        answer: 'Spontaneous Bacterial Peritonitis (SBP) is an acute spontaneous bacterial infection of ascitic fluid occurring in patients with cirrhosis in the absence of an identifiable contiguous intra-abdominal surgically treatable source of infection (such as a perforated viscus or abscess). Diagnostic criteria on diagnostic paracentesis: Ascitic fluid Absolute Neutrophil Count (ANC / PMN count) >= 250 cells/mm3 (calculated as total WBC count x % neutrophils). Common organisms: E. coli, Klebsiella pneumoniae, and Streptococcus pneumoniae. Treatment of choice: Third-generation cephalosporin (IV Cefotaxime 2g Q8H) plus IV Albumin (1.5 g/kg at diagnosis and 1 g/kg on day 3 to prevent hepatorenal syndrome).',
        examinerTip: 'Always remember: Even if the ascitic fluid culture is negative, a PMN count >= 250 cells/mm3 is diagnostic of Culture-Negative Neutrocytic Ascites (CNNA) and warrants full antibiotic treatment!',
      },
    ],
  },

  // 4. MEDICINE - CENTRAL NERVOUS SYSTEM (CNS)
  {
    id: 'cns_proforma',
    title: 'Central Nervous System (CNS) Master Case Proforma',
    system: 'General Medicine',
    department: 'Neurology / General Medicine',
    summary: 'M.D. General Medicine & MBBS examination-grade master proforma for Stroke (Hemiplegia), Paraplegia / Quadriplegia, Cranial Nerve Palsies (CN I-XII), Movement Disorders, Cerebellar Ataxias, Myasthenia Gravis, and Neuropathies.',
    examPearl: 'Establish handedness and cerebral dominance first. Differentiate UMN from LMN systematically: UMN features clasp-knife spasticity, hyperreflexia, extensor plantar (Babinski sign), and absent superficial reflexes; LMN features flaccidity, hypotonia, hyporeflexia, neurogenic wasting, and fasciculations.',
    diagramPath: '/diagrams/clinical/cranial_nerve_exam.jpg',
    diagramTitle: 'Cranial Nerves I to XII & Brainstem Localization',
    sections: [
      {
        title: '1. Patient Demographics, Handedness & Chronological History',
        items: [
          {
            label: 'Patient Demographics & Handedness',
            description: 'Record demographics and cerebral hemisphere dominance.',
            checklist: [
              'Name, Age, Sex, Occupation, and Complete Residential Address',
              'Handedness: Right-handed vs Left-handed individual (Crucial for cerebral dominance: 99% of right-handed individuals and 70% of left-handed individuals are LEFT hemisphere dominant for speech and language; 15% of left-handers are right dominant and 15% have bilateral representation)',
            ],
          },
          {
            label: 'Presenting Complaints',
            description: 'Record chronological sequence of events in the patient own words.',
            checklist: [
              'Weakness or paralysis of limbs (specifying right vs left, upper vs lower)',
              'Deviation of angle of mouth, facial asymmetry, or difficulty closing eyes',
              'Speech and language disturbance (difficulty speaking, understanding, or slurred speech)',
              'Sensory disturbances (numbness, tingling, loss of sensation, pain)',
              'Loss of consciousness, seizures, abnormal involuntary movements',
              'Headache, vomiting, visual blurring, diplopia, or fever',
              'Walking difficulty, staggering, imbalance, or falls',
              'Precise duration of each complaint in hours, days, weeks, or months',
            ],
          },
        ],
      },
      {
        title: '2. Motor Weakness Analysis: Proximal vs Distal & Functional Tasks',
        items: [
          {
            label: 'Onset, Evolution & Progression of Limb Weakness',
            description: 'Determine vascular vs non-vascular tempo of illness.',
            checklist: [
              'Inability to use the limbs: Paresis (partial weakness) vs Paralysis / Plegia (complete loss of voluntary movement)',
              'Mode of Onset and Tempo: Sudden / apoplectic onset within seconds to minutes (embolic stroke or ruptured intracranial aneurysm); Rapid evolution over minutes to hours (intracerebral hemorrhage); Stuttering progression over hours to 1-2 days (atherothrombotic stroke); Subacute progression over days to 1-2 weeks (Guillain-Barre Syndrome GBS, acute transverse myelitis); Insidious chronic progression over months to years (Motor Neuron Disease / ALS, compressive myelopathy, muscular dystrophies)',
              'Progression: Static, progressive, worsening, improving, fluctuating (Myasthenia Gravis), or relapsing-remitting (Multiple Sclerosis)',
              'Sequence of Limbs Affected: Inquire which limb was affected first, the exact time interval between one limb and another, and whether weakness is ascending (GBS) or descending',
            ],
          },
          {
            label: 'Upper Limb Functional Task Assessment (Proximal vs Distal)',
            description: 'Distinguish myopathic / radicular proximal from neuropathic distal weakness.',
            checklist: [
              'Proximal Muscle Weakness: Difficulty combing hair, taking food to the mouth, lifting heavy objects overhead, or reaching above shoulder level (shoulder girdle / myopathy)',
              'Distal Muscle Weakness: Difficulty buttoning the shirt, unbuttoning, mixing food, writing with a pen, turning keys in locks, slipping of grasp, or dropping objects from hands (distal neuropathy, pyramidal tract lesion)',
            ],
          },
          {
            label: 'Lower Limb Functional Task Assessment (Proximal vs Distal)',
            description: 'Pelvic girdle vs distal leg motor analysis.',
            checklist: [
              'Proximal Muscle Weakness: Difficulty squatting and getting up from a squatting position (requiring hand support - Gowers sign), difficulty climbing stairs up and down, difficulty getting up from a low chair (pelvic girdle / proximal myopathy)',
              'Distal Muscle Weakness: Slipping of chappals / slippers without the patient noticing (loss of toe grip), tripping of toes while walking over carpets or door thresholds, foot drop, dragging of toes (common peroneal nerve, distal peripheral neuropathy)',
            ],
          },
          {
            label: 'Axial, Respiratory & Tone Symptoms',
            description: 'Neck, trunk, diaphragmatic, and muscle tone character.',
            checklist: [
              'Neck Weakness: Difficulty lifting the head off the pillow when lying supine (neck flexor weakness) or head falling/drooping forward (neck extensor weakness in ALS or myasthenia)',
              'Trunk Weakness: Difficulty rolling over in bed, difficulty sitting up from lying posture (rectus abdominis weakness)',
              'Respiratory Difficulty: Shortness of breath, orthopnea, inability to count to 20 in a single breath (single breath count < 15 indicates diaphragmatic and intercostal muscle compromise in GBS or myasthenic crisis)',
              'Diurnal Variation: Normal strength in the morning on waking, with progressive muscle weakness and fatigue emerging towards evening after exertion, improving with rest (Pathognomonic of Myasthenia Gravis)',
              'Limb Tone Character: Limbs feel flaccid, loose, floppy (LMN lesion, early spinal shock, stroke diaschisis) vs Limbs feel stiff, rigid, tight, heavy (UMN spasticity)',
            ],
          },
        ],
      },
      {
        title: '3. Spinomotor Symptoms, Muscle Twitches & Involuntary Movements',
        items: [
          {
            label: 'Spinomotor Symptoms & Fasciculations',
            description: 'Anterior horn cell and muscle belly symptoms.',
            checklist: [
              'Wasting / Thinning of Muscles: Noticed shrinkage of muscle mass (focal in hand/shoulder or generalized; LMN denervation)',
              'Muscle Pain, Cramps & Fatigue: Severe nocturnal calf or hand cramps (MND, metabolic myopathies)',
              'Fasciculations: Visible, spontaneous flickering or crawling contractions of muscle bundles under the skin without moving the joint ("muscle twitching"; pathognomonic of anterior horn cell degeneration in ALS / MND)',
            ],
          },
          {
            label: 'Involuntary Movements (ABCDEFM Analysis)',
            description: 'Extrapyramidal and basal ganglia movement disorders.',
            checklist: [
              'A - Athetosis: Slow, continuous, writhing, involuntary twisting movements of hands and fingers',
              'A - Asterixis: Sudden, brief, arrhythmically recurring lapses of sustained muscle contraction (flapping tremor in encephalopathy)',
              'B - Ballismus / Hemiballismus: Wild, violent, forceful flinging movements of an entire limb from proximal joints (contralateral subthalamic nucleus of Luys lesion)',
              'C - Chorea: Rapid, brief, jerky, non-repetitive, purposeless dance-like involuntary movements flowing randomly from one body part to another (Sydenham chorea, Huntington disease)',
              'D - Dystonia: Sustained involuntary muscle contractions causing twisting repetitive movements or abnormal postures (torticollis, blepharospasm, writer cramp)',
              'E - Essential Tremor: High-frequency (8-12 Hz) action/postural tremor of hands or head, aggravated by stress, relieved by alcohol',
              'E - Resting Tremor: Low-frequency (4-6 Hz) pill-rolling tremor present at rest, diminishing on voluntary movement (Parkinsonism)',
              'F - Fasciculations: Spontaneous localized muscle twitches',
              'M - Myoclonus: Sudden, shock-like, lightning involuntary contractions of a muscle or group of muscles',
            ],
          },
        ],
      },
      {
        title: '4. Sensory Disturbances, Root Pains & Cortical Symptoms',
        items: [
          {
            label: 'Sensory Symptoms & Radicular Pains',
            description: 'Spinothalamic, dorsal column, and nerve root sensory disturbances.',
            checklist: [
              'Sensory Deficit: Loss of sensation, inability to feel touch, clothes, or hot bathwater',
              'Numbness & Paresthesias: Pins and needles, tingling, burning, or crawling sensations (stocking-and-glove distribution in peripheral polyneuropathy)',
              'Root Pain / Radicular Pain: Severe sharp, shooting, lancinating pain radiating along a specific dermatome into arm or leg, aggravated by coughing, sneezing, straining, or neck flexion (nerve root compression in cervical or lumbar disc prolapse)',
              'Band-Like / Girdle Sensation: Tight constricting sensation around the chest or abdomen marking the upper level of spinal cord compression or transverse myelitis',
              'Sensory Ataxia: Unsteadiness while walking in the dark or while closing eyes in the bathroom when washing the face (loss of proprioception in dorsal columns)',
              'Lhermitte Symptom: Sudden electric-shock-like sensation radiating down the spine into the limbs upon passive neck flexion (cervical cord demyelination in Multiple Sclerosis, subacute combined degeneration SACD, cervical spondylotic myelopathy)',
            ],
          },
        ],
      },
      {
        title: '5. Higher Mental Functions, Cranial Nerves & Autonomic Symptoms',
        items: [
          {
            label: 'Higher Mental Function Symptoms',
            description: 'Consciousness, speech, cognition, and emotional lability.',
            checklist: [
              'Loss of Consciousness / Seizures: Number of episodes, aura, generalized tonic-clonic jerking, tongue bite (lateral border of tongue), urinary or bowel incontinence, duration of post-ictal confusion, time of last episode',
              'Speech Disturbances: Dysarthria (slurred speech, scanning speech in cerebellar disease, hot potato speech in bulbar palsy) vs Dysphonia (soft hoarse voice) vs Aphasia (inability to express speech, comprehend, or name objects)',
              'Cognitive & Psychiatric: Memory disturbances, delusions, hallucinations, unprovoked emotional lability (pseudobulbar affect: uncontrollable laughing or crying without appropriate emotion)',
            ],
          },
          {
            label: 'Cranial Nerve Symptoms (I to XII)',
            description: 'Systematic screening for cranial nerve involvement.',
            checklist: [
              'CN I: Loss of smell (anosmia) or distorted smell (parosmia)',
              'CN II: Diminution of vision, blurring, visual field loss, transient monocular blindness (amaurosis fugax)',
              'CN III, IV, VI: Drooping of upper eyelids (ptosis), double vision (diplopia: worse on looking in specific direction)',
              'CN V: Numbness over face, shooting facial pain (trigeminal neuralgia), difficulty chewing food',
              'CN VII: Inability to close the eye, deviation of angle of mouth to normal side, drooling of saliva, food collecting in cheek, loss of taste on anterior tongue, intolerance to loud sounds (hyperacusis)',
              'CN VIII: Hard of hearing, buzzing in ears (tinnitus), true rotational spinning dizziness (vertigo), gait imbalance',
              'CN IX, X: Nasal regurgitation of liquids on swallowing, difficulty swallowing (dysphagia for liquids > solids in bulbar palsy), nasal twang to voice, frequent coughing while swallowing',
              'CN XI: Difficulty shrugging shoulders, difficulty turning head to opposite side',
              'CN XII: Difficulty rolling or protruding tongue, slurred lingual speech ("t, d, n, l" sounds)',
            ],
          },
          {
            label: 'Cerebellar, Autonomic & Meningeal Symptoms',
            description: 'Incoordination, visceral innervation, and meningeal signs.',
            checklist: [
              'Cerebellum: Spilling of tea/soup from spoon while taking to mouth (intention tremor), staggering drunken gait, inability to negotiate narrow doorways',
              'Autonomic Nervous System:',
              '  * Bladder: Sensation of bladder fullness, hesitancy, urgency, urge incontinence, stress incontinence, retention of urine with overflow dribbling (neurogenic bladder in spinal cord transection / myelopathy)',
              '  * Bowel: Severe chronic constipation, fecal incontinence',
              '  * Vasomotor & Secretomotor: Postural giddiness / lightheadedness on standing up (orthostatic hypotension), abnormal sweating (anhidrosis / hyperhidrosis)',
              'Meninges: High fever, projectile vomiting without nausea, severe unremitting headache, photophobia, neck stiffness',
            ],
          },
        ],
      },
      {
        title: '6. Negative History, Past Medical History & Neurovascular Risks',
        items: [
          {
            label: 'Relevant Negative History',
            description: 'Rule out traumatic, toxic, and infectious causes.',
            checklist: [
              'History of head trauma, fall from height, or road traffic accident',
              'History of severe headache preceding weakness (subarachnoid hemorrhage)',
              'History of high fever with rash or ear discharge (otitis media / brain abscess)',
              'History of animal bites (rabies prophylaxis)',
              'History of exposure to neurotoxins, organophosphates, lead, heavy metals, or snakebite',
            ],
          },
          {
            label: 'Past Medical History & Stroke Risk Factors',
            description: 'Cerebrovascular and neurological co-morbidities.',
            checklist: [
              'History of Transient Ischemic Attack (TIA: focal neurological deficit resolving completely within 24 hours) or RIND (Reversible Ischemic Neurological Deficit)',
              'History of Systemic Hypertension, Diabetes Mellitus, Dyslipidemia',
              'History of Coronary Artery Disease, Myocardial Infarction, Atrial Fibrillation, Rheumatic Valvular Disease (embolic stroke source)',
              'History of Tuberculosis (tuberculous meningitis, tuberculoma)',
              'History of Syphilis (tabes dorsalis, general paresis of the insane GPI)',
              'History of prior demyelinating episodes (optic neuritis, transverse myelitis)',
            ],
          },
          {
            label: 'Personal, Family, Menstrual & Treatment History',
            description: 'Lifestyle habits, heredity, and medications.',
            checklist: [
              'Smoking and alcohol consumption history',
              'Family history: Consanguinity, stroke in young family members, familial ataxias, muscular dystrophies, neurofibromatosis, Huntington chorea',
              'Menstrual & Obstetric: Oral Contraceptive Pill (OCP) usage, postpartum status (Cortical Venous Sinus Thrombosis CVST)',
              'Treatment History: Antihypertensives, Antidiabetics, Anticoagulants, Antiplatelets (Aspirin, Clopidogrel), Antiepileptics (Phenytoin, Carbamazepine, Levetiracetam), Dopaminergic drugs (Levodopa-Carbidopa), Immunosuppressants',
            ],
          },
        ],
      },
      {
        title: '7. General Physical Signs & Neurocutaneous Markers',
        items: [
          {
            label: 'General Examination & Neurological Habitus',
            description: 'Bedside appraisal of the neurological patient.',
            checklist: [
              'Consciousness, posture, comfort in bed; Right-handed vs Left-handed status verified',
              'Terminal phalanx trophic changes, brittle nails, shiny skin',
              'Decubitus Ulcers (Bedsores): Staged over pressure points (sacrum, greater trochanters, heels, ischial tuberosities, occiput)',
              'Trophic Ulcers: Deep, painless, indolent ulcers on sole over metatarsal heads with punched-out margins (loss of pain sensation in Tabes Dorsalis, Diabetic Neuropathy, Leprosy)',
              'Presence of indwelling Foley urinary catheter, nasogastric Ryle tube, or tracheostomy tube',
              'Vital Signs: Arterial Pulse, Blood Pressure (supine and standing for postural drop), Respiratory Rate and pattern, Axillary Temperature',
            ],
          },
          {
            label: 'Neurocutaneous Markers (Phakomatoses)',
            description: 'Cutaneous clues to congenital neurological syndromes.',
            checklist: [
              'Cafe-au-Lait Macules: Flat, uniform, light brown hyperpigmented macules with smooth borders (>= 6 macules > 15 mm in post-pubertal or > 5 mm in prepubertal individuals is diagnostic of Neurofibromatosis Type 1 - NF-1 / von Recklinghausen disease)',
              'Neurofibromas: Multiple, soft, violaceous subcutaneous nodules along peripheral nerves with button-hole invagination sign; Plexiform neurofibromas (bag of worms feel)',
              'Axillary & Inguinal Freckling (Crowe Sign): Highly specific for NF-1',
              'Ash-Leaf Macules: Hypopigmented lance-ovate macules (>= 3 macules, best seen under Wood UV lamp in Tuberous Sclerosis)',
              'Shagreen Patch: Leathery, pebbled, orange-peel textured plaque located in lumbosacral region (Tuberous Sclerosis)',
              'Adenoma Sebaceum (Facial Angiofibromas): Butterfly distribution of reddish papules over nose and cheeks (Tuberous Sclerosis)',
              'Port-Wine Stain (Nevus Flammeus): Flat vascular birthmark strictly in ophthalmic V1/V2 trigeminal dermatome (Sturge-Weber Syndrome associated with leptomeningeal angioma, glaucoma, and contralateral hemiplegia)',
            ],
          },
        ],
      },
      {
        title: '8. Higher Mental Functions & 30-Point Folstein MMSE Rubric',
        items: [
          {
            label: 'Consciousness, Orientation & Memory',
            description: 'Cognitive state evaluation.',
            checklist: [
              'Consciousness: Glasgow Coma Scale (GCS: Eye opening 1-4, Verbal response 1-5, Motor response 1-6; Total 3 to 15)',
              'Orientation: Oriented to Time (time of day, day, date, month, year), Place (hospital, floor, city, state), and Person (own identity, doctor/family)',
              'Memory Assessment:',
              '  * Immediate Memory: Tested by digit span (normal forward >= 6 digits, backward >= 4 digits)',
              '  * Recent Memory: Register 3 unrelated objects (e.g., Apple, Table, Penny); ask patient to recall them after 5 minutes; ask what they ate for breakfast',
              '  * Remote Memory: Inquire about date of independence, birth date, names of children',
            ],
          },
          {
            label: 'Speech & Language Assessment (Aphasia vs Dysarthria)',
            description: 'Systematic testing of language components.',
            checklist: [
              'Spontaneous Speech Fluency: Number of words per minute, effort, phrase length (Non-fluent halting agrammatic speech in Broca aphasia vs Fluent effortless empty speech in Wernicke aphasia)',
              'Comprehension: Tested by simple and complex commands ("Touch your right ear with your left thumb"; intact in Broca, impaired in Wernicke)',
              'Repetition: Ask patient to repeat "No ifs, ands, or buts" or multisyllabic sentences (severely impaired in Conduction Aphasia due to arcuate fasciculus lesion; impaired in Broca and Wernicke; preserved in Transcortical aphasias)',
              'Naming: Point to watch, pen, button and ask patient to name them (anomia)',
              'Reading & Writing: Reading comprehension and spontaneous sentence writing',
              'Dysarthria: Speech clarity (Cerebellar staccato/scanning; Spastic UMN pseudo-bulbar; Flaccid LMN bulbar with nasal twang; Extrapyramidal monotone hypophonic)',
            ],
          },
          {
            label: 'Parietal Lobe Functions & Frontal Release Signs',
            description: 'Cortical associative and primitive reflexes.',
            checklist: [
              'Astereognosis: Inability to identify familiar objects (coin, key) by touch alone in hand with eyes closed (contralateral parietal lobe)',
              'Agraphesthesia: Inability to identify numbers traced on palm with eyes closed',
              'Two-Point Discrimination: Impaired sensory threshold on fingertips (normal 2-4 mm)',
              'Sensory Inattention / Extinction: Patient fails to perceive touch on affected side during bilateral simultaneous stimulation',
              'Apraxia: Inability to carry out learned skilled motor acts despite intact power and comprehension (Ideomotor vs Ideational apraxia)',
              'Emotional Lability: Pathological pseudobulbar laughing and crying',
            ],
          },
          {
            label: 'The Complete 30-Point Folstein MMSE Rubric',
            description: 'Standardized bedside cognitive scoring.',
            checklist: [
              'I. Orientation (10 points): Year, Season, Date, Day, Month (5 pts); Country, State, District, Hospital, Floor (5 pts)',
              'II. Registration (3 points): Name 3 objects (Apple, Table, Penny) taking 1 sec each; ask patient to repeat them (score 1 pt each for 1st trial; repeat until learned up to 6 trials)',
              'III. Attention and Calculation (5 points): Serial 7s subtraction from 100 five times (93, 86, 79, 72, 65); score 1 pt for each correct subtraction; alternatively spell "WORLD" backwards (D-L-R-O-W)',
              'IV. Recall (3 points): Ask for the 3 objects learned in Registration (score 1 pt each)',
              'V. Language & Praxis (9 points):',
              '   * Naming: Show pencil and wristwatch; ask patient to name them (2 pts)',
              '   * Repetition: Ask patient to repeat "No ifs, ands, or buts" (1 pt)',
              '   * 3-Stage Command: "Take a paper in your right hand, fold it in half, and put it on the floor" (3 pts)',
              '   * Reading: Read and obey "CLOSE YOUR EYES" printed in large letters (1 pt)',
              '   * Writing: Write a spontaneous sentence with subject and verb that makes sense (1 pt)',
              '   * Copying Design: Copy intersecting pentagons with a 4-sided intersection (1 pt)',
              'Total Score: __ / 30 (Normal: 24-30; Mild impairment: 19-23; Moderate dementia: 10-18; Severe dementia: < 10)',
            ],
          },
        ],
      },
      {
        title: '9. Comprehensive Cranial Nerve Examination (CN I to XII Bilateral)',
        items: [
          {
            label: 'CN I (Olfactory Nerve)',
            description: 'Sense of smell tested in each nostril separately.',
            checklist: [
              'Verify nasal patency first by occluding each nostril in turn',
              'Patient closes eyes; test each nostril separately with non-pungent aromatic substances (Coffee powder, Asafoetida, Peppermint, Soap)',
              'Avoid ammonia, spirit, or acid which stimulate trigeminal CN V sensory endings rather than olfactory nerve',
              'Right: Normal / Anosmia / Parosmia; Left: Normal / Anosmia / Parosmia',
            ],
          },
          {
            label: 'CN II (Optic Nerve)',
            description: 'Visual acuity, visual fields, color vision, and fundus.',
            checklist: [
              'Visual Acuity: Tested using Rosenbaum near vision pocket card at 14 inches or Snellen distant chart at 6 meters for each eye separately (wearing glasses); recorded as 20/20, 6/6, finger counting at meters, hand movements, or light perception',
              'Visual Fields (Confrontation Perimetry): Examiner and patient sit at 1 meter eye-to-eye; patient covers left eye while examiner closes right eye; target object / wiggling finger brought inwards from periphery in all four quadrants; test each eye separately; map: Bitemporal hemianopia (optic chiasm compression by pituitary adenoma); Homonymous hemianopia (contralateral optic tract or optic radiation / occipital cortex stroke); Quadrantanopia (superior quadrantanopia in temporal lobe Meyer loop; inferior quadrantanopia in parietal lobe Baum loop)',
              'Color Vision: Tested with Ishihara pseudoisochromatic plates (impaired in optic neuritis)',
              'Fundoscopy: Optic disc margins (sharp vs blurred in papilledema), physiological cup, optic disc pallor (Primary Optic Atrophy in MS/compression; Secondary Optic Atrophy following chronic papilledema), retinal vessels, hemorrhages, exudates',
            ],
          },
          {
            label: 'CN III, IV, VI (Oculomotor, Trochlear, Abducens)',
            description: 'Ocular motility, pupillary reflexes, and eyelid.',
            checklist: [
              'Extraocular Movements: Tested in all 6 cardinal directions of gaze (making a large "H" pattern in space); ask patient to follow moving finger without moving head; observe for restriction of movement and diplopia:',
              '  * Lateral Rectus (CN VI - Abducens): Abduction of eye; palsy causes failure of abduction and uncrossed horizontal diplopia',
              '  * Superior Oblique (CN IV - Trochlear): Depression of adducted eye; palsy causes vertical/torsional diplopia on looking down and in (difficulty walking down stairs)',
              '  * Oculomotor (CN III): Superior rectus, Inferior rectus, Medial rectus, Inferior oblique; palsy causes complete "down and out" eye position, severe ptosis, and dilated unreactive pupil',
              'Ptosis: Drooping of upper eyelid; complete ptosis in CN III palsy; partial ptosis (1-2 mm) with miosis in Horner syndrome; fatigable ptosis in Myasthenia Gravis (Cogan twitch sign: upward saccade from down-gaze causes transient overshoot of upper eyelid)',
              'Pupillary Size & Symmetry: Measured in millimeters (mm) in ambient light; anisocoria',
              'Direct Light Reflex: Light shone into eye causes brisk constriction of ipsilateral pupil (Afferent CN II, Efferent CN III)',
              'Consensual Light Reflex: Light shone into one eye causes brisk constriction of contralateral pupil (Afferent CN II, Efferent CN III via Edinger-Westphal pretectal crossing)',
              'Accommodation Reflex: Patient shifts gaze from distant wall to near target (finger held 10 cm in front of nose); observe pupillary constriction, convergence of eyeballs, and lens accommodation',
              'Argyll Robertson Pupil: Pupils accommodate to near vision but DO NOT react to light ("Light-Near Dissociation"); small, irregular pupils seen in Neurosyphilis (Tabes Dorsalis)',
              'Nystagmus: Involuntary rhythmic oscillatory eye movement; documented as horizontal, vertical, or rotary; direction of fast phase noted',
            ],
          },
          {
            label: 'CN V (Trigeminal Nerve)',
            description: 'Sensory divisions, muscles of mastication, and jaw jerk.',
            checklist: [
              'Sensory Examination: Tested for light touch (cotton wisp) and pain (pinprick) symmetrically across the 3 anatomical divisions bilaterally:',
              '  * Ophthalmic Division (V1): Forehead, anterior scalp, cornea, bridge of nose',
              '  * Maxillary Division (V2): Cheek, lower eyelid, ala of nose, upper lip, upper teeth, hard palate',
              '  * Mandibular Division (V3): Lower lip, chin, lower teeth, anterior 2/3 of tongue (general sensation), buccal mucosa',
              'Motor Examination: Muscles of Mastication:',
              '  * Temporalis & Masseter: Palpate muscle bellies firmly while patient clenches teeth tightly; assess bulk and contraction',
              '  * Lateral & Medial Pterygoids: Patient opens mouth against resistance applied under chin; in unilateral pterygoid paralysis, the JAW DEVIATES TOWARDS THE PARALYZED SIDE (pushed by intact contralateral pterygoid)',
              'Reflexes:',
              '  * Corneal Reflex: Touch wisp of clean cotton to cornea (not sclera) approaching from side; normal response is bilateral brisk blink (Afferent CN V1, Efferent CN VII)',
              '  * Conjunctival Reflex: Afferent CN V1, Efferent CN VII',
              '  * Jaw Jerk / Masseter Reflex: Patient relaxes jaw with mouth slightly open; examiner places index finger flat on chin and taps finger downwards with reflex hammer; Afferent & Efferent V3; Normal is absent or minimal; Brisk / Exaggerated jaw jerk indicates Bilateral Supranuclear UMN lesion above the mid-pons (Pseudobulbar Palsy)',
            ],
          },
          {
            label: 'CN VII (Facial Nerve)',
            description: 'Motor muscles of facial expression, taste, and UMN vs LMN distinction.',
            checklist: [
              'Motor Examination of Facial Expression:',
              '  * Occipitofrontalis: Ask patient to look up and wrinkle forehead; observe symmetry of horizontal wrinkles',
              '  * Orbicularis Oculi: Ask patient to close eyes tightly against resistance while examiner attempts to gently pry them open',
              '  * Orbicularis Oris: Ask patient to smile, show teeth, whistle, and blow air into cheeks without leaking',
              '  * Buccinator: Prevent food collecting between cheek and teeth',
              '  * Platysma: Ask patient to grimace / pull down lower corners of mouth tightly',
              '  * Nasolabial Folds: Assess symmetry and depth of nasolabial folds at rest and during smiling',
              'UMN vs LMN Facial Palsy Distinction (The Golden Rule of Neurology):',
              '  * UMN Facial Palsy (Supranuclear): SPARES the forehead (patient CAN wrinkle forehead and CAN close eyes tightly) because the upper facial motor nucleus receives BILATERAL corticonuclear innervation from both cerebral hemispheres; only lower half of face is paralyzed (flat nasolabial fold, drooping corner of mouth, mouth deviates to normal side)',
              '  * LMN Facial Palsy (Infranuclear / Bell Palsy): Paralyzes the ENTIRE ipsilateral half of the face including forehead (patient CANNOT wrinkle forehead, CANNOT close eye tightly); Bell Phenomenon: on attempting eye closure, the eyeball rolls upwards and outwards',
              'Sensory Examination: Taste sensation on anterior 2/3 of tongue tested with sugar, salt, vinegar/citric acid on protruded tongue (Chorda Tympani via nervus intermedius); cutaneous sensation over tragus and concha of ear',
              'Secretomotor: Lacrimation (Schirmer test) and salivation',
              'Stapedius Reflex: Hyperacusis (intolerance to ordinary loud sounds due to paralysis of nerve to stapedius)',
            ],
          },
          {
            label: 'CN VIII (Vestibulocochlear Nerve)',
            description: 'Cochlear hearing acuity, tuning fork tests, and vestibular function.',
            checklist: [
              'Whispered Voice Hearing Test: Tested at 60 cm for each ear separately while occluding contralateral ear canal',
              'Rinne Test (512 Hz Tuning Fork): Tuning fork base placed on mastoid process until patient can no longer hear it (Bone Conduction BC), then held 2 cm from external auditory meatus (Air Conduction AC):',
              '  * Normal / Positive Rinne: AC > BC (sound heard longer by air conduction)',
              '  * Conductive Hearing Loss / Negative Rinne: BC > AC (bone conduction exceeds air conduction in affected ear)',
              '  * Sensorineural Hearing Loss: AC > BC (both air and bone conduction reduced proportionally, but AC remains greater than BC)',
              'Weber Test (512 Hz Tuning Fork): Struck fork placed firmly on vertex or midline forehead:',
              '  * Normal: Sound heard equally in both ears in center of head',
              '  * Conductive Loss: Sound lateralizes to the DISEASED ear (ambient noise eliminated)',
              '  * Sensorineural Loss: Sound lateralizes to the NORMAL ear',
              'Absolute Bone Conduction (ABC) Test: Compares patient bone conduction with normal examiner; reduced in sensorineural deafness',
              'Vestibular Testing: Spontaneous nystagmus, Romberg test, Dix-Hallpike maneuver for BPPV',
            ],
          },
          {
            label: 'CN IX, X (Glossopharyngeal & Vagus Nerves)',
            description: 'Palatal movement, uvula position, gag reflex, and swallowing.',
            checklist: [
              'Inspection of Soft Palate & Uvula: Inspect palatal arches at rest and during phonation ("Say Ah"):',
              '  * Normal: Bilateral symmetrical elevation of palatal arches with uvula staying in midline',
              '  * Unilateral Vagus / Palatal Palsy: Palatal arch on paralyzed side fails to elevate; UVULA DEVIATES TOWARDS THE NORMAL SIDE (pulled by intact contralateral levator veli palatini)',
              '  * Bilateral Palatal Palsy: Soft palate does not elevate; nasal regurgitation of fluids on swallowing; nasal twang to voice',
              'Gag Reflex (Pharyngeal Reflex): Gently touch posterior pharyngeal wall or faucial pillar with spatula; normal response is brisk pharyngeal constriction and gagging (Afferent CN IX, Efferent CN X)',
              'Palatal Reflex: Touching soft palate causes elevation (Afferent CN IX, Efferent CN X)',
              'Voice Quality: Hoarseness or bovine non-explosive cough (recurrent laryngeal nerve palsy)',
              'Swallowing Test: Give small sip of water; observe for coughing, choking, or nasal regurgitation',
            ],
          },
          {
            label: 'CN XI (Spinal Accessory Nerve)',
            description: 'Trapezius and sternocleidomastoid motor examination.',
            checklist: [
              'Trapezius: Patient asked to shrug shoulders upward against firm resistance applied by examiner hands; assess power, symmetry, and muscle bulk; wasting and drooping of shoulder on paralyzed side',
              'Sternocleidomastoid (SCM): Patient asked to turn head firmly to the opposite side against resistance applied by examiner hand on the jaw; palpate contracting contralateral SCM muscle belly; weakness in turning head to opposite side indicates ipsilateral SCM paralysis',
            ],
          },
          {
            label: 'CN XII (Hypoglossal Nerve)',
            description: 'Tongue motor examination, wasting, and protrusion.',
            checklist: [
              'Inspection in Floor of Mouth at Rest: Inspect for muscle bulk, atrophy / wasting, furrowing, and fasciculations / fibrillations (LMN hypoglossal palsy)',
              'Protrusion of Tongue:',
              '  * Normal: Tongue protrudes in exact midline',
              '  * Unilateral Hypoglossal Palsy: TONGUE DEVIATES TOWARDS THE PARALYZED SIDE (pushed forward by the unopposed action of the intact contralateral genioglossus muscle)',
              '  * UMN Supranuclear lesion: Spastic tongue, small, tight, slow movements, deviates to contralateral side without wasting or fasciculations',
              '  * LMN Infranuclear lesion: Flaccid tongue with prominent wasting, furrowing, wrinkling, fasciculations, deviating to ipsilateral side',
              'Rapid lateral tongue movements inside mouth; pushing tongue against cheek against resistance',
              'Speech: Lingual speech sounds ("ta-ta-ta", "la-la-la")',
            ],
          },
        ],
      },
      {
        title: '10. Motor System: Inspection, Circumferential Bulk & Tone Analysis',
        items: [
          {
            label: 'Muscle Bulk & Circumferential Tape Measurements',
            description: 'Objective measurement of muscle nutrition and wasting.',
            checklist: [
              'Inspection: Symmetrical muscle bulk comparison; focal wasting (thenar, hypothenar, interossei in hands; guttering between metacarpals; shoulder girdle; temporalis; calf muscles)',
              'Pseudohypertrophy: Bulky, enlarged, rubbery calf muscles with decreased power (Duchenne / Becker Muscular Dystrophy due to fibrofatty replacement)',
              'Circumferential Tape Measurements Protocol from Fixed Bony Landmarks:',
              '  * Upper Arm: 10 cm above olecranon process (Right: __ cm, Left: __ cm)',
              '  * Forearm: 10 cm below olecranon process (Right: __ cm, Left: __ cm)',
              '  * Thigh: 18 cm above superior border of patella (Right: __ cm, Left: __ cm)',
              '  * Calf: 10 cm below tibial tuberosity (Right: __ cm, Left: __ cm)',
              '  * Asymmetry > 1.0 cm between corresponding limbs confirms true neurogenic or myopathic atrophy',
            ],
          },
          {
            label: 'Muscle Tone Analysis (Spasticity vs Rigidity vs Flaccidity)',
            description: 'Passive range of motion at all major joints.',
            checklist: [
              'Patient completely relaxed; examiner passively flexes and extends joints at varying speeds:',
              '  * Hypotonia / Flaccidity: Abnormally reduced resistance, excessive joint excursion, floppy flail limbs (LMN lesions, cerebellar disease, spinal shock)',
              '  * Spasticity (Clasp-Knife Spasticity): Velocity-dependent increase in resistance to passive stretch; maximal resistance at initiation of movement which suddenly gives way; preferential distribution: flexor hypertonia in upper limbs, extensor hypertonia in lower limbs (Pyramidal / Corticospinal UMN tract lesion)',
              '  * Rigidity (Lead-Pipe & Cogwheel Rigidity): Uniform, continuous, non-velocity-dependent resistance throughout the entire range of passive flexion and extension in both agonist and antagonist muscle groups (Lead-pipe rigidity); superimposed resting tremor produces a jerky, ratchet-like resistance (Cogwheel rigidity; Extrapyramidal / Basal Ganglia lesion in Parkinsonism)',
              'Documented as: Upper Limbs (Right: Normal / Spastic / Rigid / Flaccid; Left: Normal / Spastic / Rigid / Flaccid); Lower Limbs (Right: Normal / Spastic / Rigid / Flaccid; Left: Normal / Spastic / Rigid / Flaccid)',
            ],
          },
        ],
      },
      {
        title: '11. Motor System: Bilateral Joint Power (MRC Grades 0 to 5)',
        items: [
          {
            label: 'Medical Research Council (MRC) Muscle Power Grading Scale',
            description: 'Standard 0-5 grading definition.',
            checklist: [
              'Grade 0: Complete paralysis, no visible or palpable muscle contraction',
              'Grade 1: Trace / flicker of contraction without joint movement',
              'Grade 2: Active movement possible with gravity eliminated (horizontal plane)',
              'Grade 3: Active movement against gravity, but cannot overcome resistance',
              'Grade 4: Active movement against gravity and moderate resistance',
              'Grade 5: Normal full muscular power against maximal resistance',
            ],
          },
          {
            label: 'Bilateral Joint Power Testing: Upper Limbs & Trunk',
            description: 'Systematic testing of root and peripheral muscle groups.',
            checklist: [
              'Neck Muscles: Flexion (C1-C4), Extension (C1-C8)',
              'Shoulder Joint:',
              '  * Abduction: Deltoid (Axillary nerve C5) - Right: __/5, Left: __/5',
              '  * Adduction: Pectoralis major (C6-C8) - Right: __/5, Left: __/5',
              '  * Flexion & Extension, Medial & Lateral Rotation',
              'Elbow Joint:',
              '  * Flexion: Biceps & Brachialis (Musculocutaneous C5-C6) - Right: __/5, Left: __/5',
              '  * Extension: Triceps (Radial nerve C7-C8) - Right: __/5, Left: __/5',
              'Wrist Joint:',
              '  * Dorsiflexion (Extensor carpi radialis / ulnaris, Radial C6-C7) - Right: __/5, Left: __/5',
              '  * Palmar Flexion (Flexor carpi radialis / ulnaris, Median/Ulnar C7-C8) - Right: __/5, Left: __/5',
              '  * Pronation (Median C6-C7) & Supination (Biceps/Radial C5-C7)',
              'Hand & Small Muscles:',
              '  * Hand Grip: Squeeze examiner index and middle fingers firmly - Right: __/5, Left: __/5',
              '  * Finger Abduction: Dorsal Interossei (Deep branch of Ulnar T1) - Right: __/5, Left: __/5',
              '  * Finger Adduction: Palmar Interossei (Ulnar T1) - Right: __/5, Left: __/5',
              '  * Thumb Abduction: Abductor Pollicis Brevis (Median nerve T1) - Right: __/5, Left: __/5',
              'Trunk Muscles & Beevor Sign: Patient in supine position flexes neck against resistance or attempts to sit up; upward deviation of umbilicus denotes paralysis of lower rectus abdominis (T10-T12) with intact upper rectus (T7-T9)',
            ],
          },
          {
            label: 'Bilateral Joint Power Testing: Lower Limbs',
            description: 'Systematic testing of pelvic and lower limb muscle groups.',
            checklist: [
              'Hip Joint:',
              '  * Flexion: Iliopsoas (L2-L3, Femoral nerve) - Right: __/5, Left: __/5',
              '  * Extension: Gluteus maximus (L5-S1, Inferior gluteal nerve) - Right: __/5, Left: __/5',
              '  * Abduction: Gluteus medius/minimus (L4-S1, Superior gluteal nerve) - Right: __/5, Left: __/5',
              '  * Adduction: Adductor longus/magnus (L2-L4, Obturator nerve) - Right: __/5, Left: __/5',
              '  * Internal & External Rotation',
              'Knee Joint:',
              '  * Extension: Quadriceps femoris (L3-L4, Femoral nerve) - Right: __/5, Left: __/5',
              '  * Flexion: Hamstrings (L5-S1, Sciatic nerve) - Right: __/5, Left: __/5',
              'Ankle Joint:',
              '  * Dorsiflexion: Tibialis anterior (L4-L5, Deep peroneal nerve) - Right: __/5, Left: __/5',
              '  * Plantar Flexion: Gastrocnemius and Soleus (S1-S2, Tibial nerve) - Right: __/5, Left: __/5',
              '  * Inversion (Tibialis posterior L4-L5) & Eversion (Peronei L5-S1)',
              'Foot & Toes:',
              '  * Big Toe Dorsiflexion: Extensor Hallucis Longus EHL (L5, Deep peroneal nerve) - Right: __/5, Left: __/5',
              '  * Toe Flexion: Flexor hallucis/digitorum longus (S1-S2, Tibial nerve) - Right: __/5, Left: __/5',
            ],
          },
        ],
      },
      {
        title: '12. Reflexes: Superficial, Deep Tendon & Pathological Frontal Release',
        items: [
          {
            label: 'Superficial Reflexes',
            description: 'Cutaneous stimulation reflexes.',
            checklist: [
              'Corneal & Conjunctival Reflexes (Afferent V1, Efferent VII): Present bilaterally',
              'Pharyngeal (Gag) & Palatal Reflexes (Afferent IX, Efferent X): Present bilaterally',
              'Abdominal Reflexes: Symmetrically stroke four abdominal quadrants towards umbilicus with blunt pin; localized contraction of abdominal wall with umbilicus pulling towards stimulus:',
              '  * Upper Abdominal Reflex: T8, T9 - Right: Present/Absent, Left: Present/Absent',
              '  * Middle Abdominal Reflex: T9, T10 - Right: Present/Absent, Left: Present/Absent',
              '  * Lower Abdominal Reflex: T11, T12 - Right: Present/Absent, Left: Present/Absent',
              '  * Absent in UMN pyramidal tract lesions',
              'Cremasteric Reflex: Light scratch on upper inner thigh from above downwards; brisk retraction of ipsilateral testis (L1, L2 - Genitofemoral/Ilioinguinal nerve) - Right: Present/Absent, Left: Present/Absent',
              'Anal Reflex (Anal Wink): Prick perianal skin; visible contraction of external anal sphincter (S4, S5 - Pudendal nerve)',
              'Plantar Reflex (L5, S1, S2 - Tibial nerve):',
              '  * Technique: Firm, slow stroke along lateral border of sole from heel forward to base of 5th toe and medially across ball of foot to base of great toe',
              '  * Normal: Plantar flexion of all toes (Flexor plantar response)',
              '  * Babinski Sign (Extensor Plantar Response): Slow, tonic, deliberate extension / dorsiflexion of great toe with fanning / abduction of other four toes; pathognomonic of Pyramidal / Corticospinal UMN tract lesion',
              '  * Babinski Equivalents: Chaddock sign (stroke around lateral malleolus), Oppenheim sign (slide knuckles down anterior tibia), Gordon sign (firmly squeeze calf), Schaeffer sign (squeeze Achilles tendon)',
              '  * Documented: Right (Flexor / Extensor Babinski / Equivocal / Absent); Left (Flexor / Extensor Babinski / Equivocal / Absent)',
            ],
          },
          {
            label: 'Deep Tendon Reflexes (0 to 4+ Scale)',
            description: 'Muscle stretch reflexes tested with reflex hammer.',
            checklist: [
              'Grading: 0 = Absent; 1+ = Sluggish / Decreased / Present with reinforcement; 2+ = Normal; 3+ = Brisk; 4+ = Markedly hyperactive with Clonus',
              'Reinforcement Maneuver (Jendrassik Maneuver): Interlock flexed fingers and pull apart on count of 3 to reinforce lower limb reflexes; clench teeth or squeeze fists for upper limb reflexes',
              'Specific Reflexes Tested Bilaterally:',
              '  * Jaw Jerk (Pons, CN V3): Normally absent or faint; brisk in pseudobulbar palsy',
              '  * Biceps Jerk (C5, C6 - Musculocutaneous nerve) - Right: __, Left: __',
              '  * Supinator / Brachioradialis Jerk (C5, C6 - Radial nerve) - Right: __, Left: __ (Inverted Supinator Jerk: finger flexion without supinator contraction indicates C5 cord compression with UMN lesion below)',
              '  * Triceps Jerk (C7, C8 - Radial nerve) - Right: __, Left: __',
              '  * Knee Jerk (L2, L3, L4 - Femoral nerve) - Right: __, Left: __ (Pendular knee jerk in cerebellar disease)',
              '  * Ankle Jerk (S1, S2 - Tibial nerve) - Right: __, Left: __ (Delayed relaxation phase in hypothyroidism)',
              'Clonus (> 4 sustained rhythmic beats abnormal):',
              '  * Patellar Clonus: Sharp downward stretch of patella - Right: Present/Absent, Left: Present/Absent',
              '  * Ankle Clonus: Sudden sustained dorsiflexion of foot with maintained upward pressure on sole - Right: Present/Absent, Left: Present/Absent',
            ],
          },
          {
            label: 'Pathological & Primitive Reflexes',
            description: 'Frontal release and pyramidal signs.',
            checklist: [
              'Hoffmann Sign (C8, T1): Flick distal phalanx of middle finger; involuntary flexion/adduction of thumb and index finger confirms UMN hyperreflexia - Right: Present/Absent, Left: Present/Absent',
              'Wartenberg Sign: Flex fingers against examiner fingers (accentuated thumb adduction in UMN lesion)',
              'Rossolimo Sign: Tapping plantar surface of metatarsophalangeal joints causes toe flexion',
              'Frontal Release Signs (Diffuse cerebral / frontal lobe dysfunction):',
              '  * Glabellar Tap (Myerson Sign): Tap forehead between eyebrows; persistent rhythmic blinking beyond 3-4 taps (Parkinsonism)',
              '  * Palmomental Reflex: Scratch thenar eminence; ipsilateral mentalis chin twitch',
              '  * Snout Reflex: Tap closed lips; puckering / pouting of lips',
              '  * Grasp Reflex: Stroke palm; involuntary grasping of examiner fingers',
            ],
          },
        ],
      },
      {
        title: '13. Coordination, Cerebellar Signs & Gait Analysis',
        items: [
          {
            label: 'Cerebellar Coordination Tests: Upper & Lower Limbs',
            description: 'Testing dysmetria, intention tremor, and dysdiadochokinesia.',
            checklist: [
              'Upper Limbs:',
              '  * Finger-to-Nose Test: Patient abducts arm and smoothly touches tip of nose with index finger; examine with eyes open then closed; observe for dysmetria (past-pointing) and intention tremor (kinetic tremor worsening near target)',
              '  * Finger-Nose-Finger Test: Patient alternately touches tip of own nose and examiner moving target index finger; past-pointing confirms cerebellar hemispheric lesion',
              '  * Dysdiadochokinesia: Rapid alternating movements (rapid supination and pronation of hand on opposite palm, or rapid tapping); slow, clumsy, irregular, arrhythmic movements confirm dysdiadochokinesia',
              '  * Rebound Phenomenon (Stewart-Holmes Sign): Examiner pulls flexed forearm while patient resists; release causes uncontrolled flexion striking own chest',
              '  * Drawing a circle in air / putting a dot in the center of a circle',
              'Lower Limbs:',
              '  * Heel-to-Knee-to-Shin Test: Patient places heel on opposite knee, slides it smoothly down anterior crest of tibia to great toe, and lifts it up; unsteadiness, ataxia, or falling off the shin confirms cerebellar ataxia',
              '  * Drawing a circle in the air with big toe',
            ],
          },
          {
            label: 'Truncal Ataxia, Speech & Nystagmus',
            description: 'Midline cerebellar vermis and vestibular signs.',
            checklist: [
              'Titubation: Rhythmic 3-4 Hz tremor of the head and trunk while sitting or standing (cerebellar vermis lesion)',
              'Truncal Ataxia: Inability to sit upright without swaying or falling backwards (vermis lesion)',
              'Nystagmus: Gaze-evoked horizontal nystagmus with fast phase directed towards the side of the lesion',
              'Cerebellar Dysarthria: Scanning, staccato speech with irregular volume, explosive articulation, and syllable breakdown',
            ],
          },
          {
            label: 'Romberg Test & Tandem Gait Analysis',
            description: 'Sensory vs cerebellar ataxia differentiation and gait patterns.',
            checklist: [
              'Romberg Test Protocol:',
              '  - Patient stands with feet together, arms by sides; observe stability with eyes open',
              '  - Patient asked to close eyes for 30 seconds while examiner stands guard to catch patient',
              '  - Positive Romberg Test: Patient is stable with eyes open, but sways and falls when eyes are closed (Sensory Ataxia due to loss of proprioception in dorsal columns)',
              '  - Cerebellar Ataxia: Patient is unsteady and sways with eyes BOTH OPEN AND CLOSED (Romberg negative, cerebellar vermis defect)',
              'Tandem Walking: Heel-to-toe walking along a straight line (accentuates mild truncal ataxia; patient veers towards side of cerebellar hemisphere lesion)',
              'Gait Patterns:',
              '  * Hemiplegic Gait: Circumduction of spastic leg with flexed pronated arm',
              '  * Scissor Gait: Spastic paraparesis with bilateral adductor spasm crossing knees',
              '  * High-Stepping / Foot-Drop Gait: Lifting knee high to clear dragging toes',
              '  * Sensory Ataxic / Stamping Gait: Broad-based, eyes glued to floor, heavy stamping of heels',
              '  * Cerebellar Ataxic Gait: Broad-based, reeling, drunken gait with wide stance',
              '  * Parkinsonian / Festinating Gait: Stooped posture, shuffling short steps, loss of arm swing, festination, en-bloc turning',
            ],
          },
        ],
      },
      {
        title: '14. Sensory System: Spinothalamic, Posterior Column & Cortical',
        items: [
          {
            label: 'Spinothalamic Tract (Pain, Temperature & Crude Touch)',
            description: 'Exteroceptive sensation tested across dermatomes bilaterally.',
            checklist: [
              'Pain (Superficial Nociception): Sterile disposable neurological pin compared across symmetric dermatomes (C2 to S5) asking "sharp or dull"',
              'Temperature Sensation: Test tubes containing hot water (40-45°C) and cold water (5-10°C); map loss of cold/warmth discrimination',
              'Crude Light Touch: Tested with cotton wisp or fingertip',
              'Document: Normal / Hyperesthesia / Hypoesthesia / Analgesia; Map sensory level on trunk (e.g., T4 at nipples, T10 at umbilicus, L1 at groin)',
            ],
          },
          {
            label: 'Posterior Column System (Fine Touch, Vibration & Position)',
            description: 'Proprioceptive sensation.',
            checklist: [
              'Fine Touch: Light touch with cotton wool wisp',
              'Vibration Sense: Struck 128 Hz tuning fork placed over bony prominences from distal to proximal (interphalangeal joint of big toe, medial malleolus, tibial tuberosity, ASIS, knuckles, olecranon, sternum, clavicle); ask patient if they feel vibration and when it stops; compare with examiner',
              'Joint Position Sense (Proprioception): Grasp lateral borders of terminal phalanx of big toe or index finger (avoiding dorsal/plantar pressure); demonstrate "up" and "down"; test with eyes closed; patient identifies subtle 1-2 mm movements',
            ],
          },
          {
            label: 'Cortical Sensations (Parietal Lobe)',
            description: 'Tested only when primary sensations are intact.',
            checklist: [
              'Two-Point Discrimination: Minimum distance between compass points distinguished as two separate stimuli (Normal: 2-4 mm on fingertips, 1 mm on tongue, 30-40 mm on back)',
              'Tactile Localization: Patient identifies exact spot touched with eyes closed',
              'Graphesthesia: Patient identifies numbers (e.g., 3, 8) drawn on palm with eyes closed',
              'Stereognosis: Patient identifies common objects (coin, key, paperclip) placed in hand by touch alone with eyes closed (Astereognosis confirms contralateral parietal lobe lesion)',
              'Bilateral Simultaneous Extinction: Simultaneous bilateral sensory stimulation; extinction of stimulus on one side indicates contralateral parietal lobe lesion',
            ],
          },
        ],
      },
      {
        title: '15. Autonomic System, Meningeal Signs, Spine, Cranium & Nerves',
        items: [
          {
            label: 'Autonomic Nervous System Examination',
            description: 'Sympathetic and parasympathetic testing.',
            checklist: [
              'Postural Blood Pressure Drop: Measure supine BP after 5 min; measure standing BP at 1 min and 3 min; fall in systolic BP >= 20 mmHg or diastolic BP >= 10 mmHg without appropriate heart rate acceleration indicates autonomic failure',
              'Resting Tachycardia: Loss of normal sinus respiratory arrhythmia (cardiac autonomic neuropathy in diabetes)',
              'Sweating disturbances: Anhidrosis or localized hyperhidrosis',
              'Skin and trophic changes: Shiny skin, loss of hair, brittle nails, Charcot neuroarthropathy joints',
            ],
          },
          {
            label: 'Signs of Meningeal Irritation',
            description: 'Meningeal inflammation and subarachnoid blood.',
            checklist: [
              'Neck Stiffness / Rigidity: Patient supine; examiner places hands behind occiput and flexes neck passively forward; involuntary reflex spasm of extensor neck muscles preventing chin from touching chest (positive neck stiffness)',
              'Kernig Sign: Patient supine, hip flexed to 90 degrees; examiner attempts to extend knee passively; severe hamstring spasm and resistance with intense pain preventing extension beyond 135 degrees (positive Kernig sign)',
              'Brudzinski Sign: Passive flexion of the neck causes involuntary spontaneous flexion of both hips and knees (positive Brudzinski sign)',
            ],
          },
          {
            label: 'Spine, Cranium, Peripheral Nerves & Carotids',
            description: 'Axial skeleton, hypertrophic neuropathy, and neurovascular exam.',
            checklist: [
              'Spine & Cranium: Gibbus deformity, kyphosis, scoliosis, localized spinous tenderness (Pott spine, metastatic collapse), cranial and spinal bruits auscultated with stethoscope bell',
              'Peripheral Nerve Thickening (Bilateral Palpation for Leprosy, HNPP, CIDP, Amyloidosis):',
              '  * Greater Auricular Nerve (crossing sternocleidomastoid muscle towards angle of jaw)',
              '  * Ulnar Nerve (in groove behind medial epicondyle of humerus)',
              '  * Common Peroneal / Lateral Popliteal Nerve (winding around neck of fibula)',
              '  * Superficial Radial Cutaneous Nerve (at anatomical snuffbox over radius)',
              'Carotid Arteries: Palpation of bilateral carotid pulses; auscultation with stethoscope diaphragm for Carotid Bruits (carotid bifurcation stenosis)',
            ],
          },
        ],
      },
      {
        title: '16. Other Systems & Master Diagnostic Formulation (Anatomical & Pathological)',
        items: [
          {
            label: 'Other Systems Review',
            description: 'Systemic co-morbidities.',
            checklist: [
              'Cardiovascular System: Heart murmurs (mitral stenosis, aortic stenosis), Atrial Fibrillation (cardioembolic stroke source), prosthetic valve clicks',
              'Respiratory System: Normal vesicular breath sounds, absence of aspiration crackles',
              'Abdomen: No organomegaly, soft, non-tender',
            ],
          },
          {
            label: 'Master Neurological Case Presentation Formulation Rubric',
            description: 'Comprehensive Indian MBBS & MD General Medicine presentation format.',
            checklist: [
              'Formulation Protocol:',
              '  1. Anatomical Localization:',
              '     "The lesion is anatomically localized to the [Left / Right Cerebral Cortex / Corona Radiata / Internal Capsule / Brainstem (Midbrain / Pons / Medulla) / Cervical Spinal Cord / Thoracic Spinal Cord at T__ level / Conus Medullaris / Cauda Equina / Peripheral Nerves / Neuromuscular Junction / Muscle]."',
              '  2. Pathological & Etiological Diagnosis:',
              '     "The etiology is most likely [Vascular (Ischemic Thromboembolic Stroke in Left Middle Cerebral Artery territory / Intracerebral Hemorrhage) / Compressive Myelopathy (Pott Spine / Cervical Spondylotic Myelopathy / Extradural Tumor) / Demyelinating (Multiple Sclerosis / Neuromyelitis Optica) / Inflammatory (Acute Inflammatory Demyelinating Polyradiculoneuropathy - Guillain-Barre Syndrome GBS) / Degenerative (Amyotrophic Lateral Sclerosis / Idiopathic Parkinson Disease) / Autoimmune (Myasthenia Gravis)] in [acute / subacute / chronic] stage, currently presenting with [Right / Left Hemiplegia / Paraplegia / Quadriparesis / Bulbar Palsy], [with / without Cranial Nerve involvement], [with / without sensory deficit], and [with / without Bladder and Bowel involvement]."',
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
      {
        question: 'What is Beevor sign and what is its clinical localizing value?',
        answer: 'Beevor sign is the upward movement / deviation of the umbilicus when the patient flexes the neck against resistance or attempts to sit up from a supine position. It is caused by paralysis of the lower rectus abdominis muscles (innervated by T10-T12) with preserved power in the upper rectus abdominis muscles (innervated by T7-T9). The intact upper rectus pulls the umbilicus upwards toward the head, localizing the spinal cord lesion precisely to the T10 spinal segment.',
        examinerTip: 'Beevor sign is commonly seen in Thoracic Myelopathy at T10, Facioscapulohumeral Muscular Dystrophy (FSHD), and Amyotrophic Lateral Sclerosis.',
      },
      {
        question: 'What is the anatomical basis of an Inverted Supinator Jerk?',
        answer: 'When the styloid process of the radius is tapped to elicit the supinator / brachioradialis jerk, the normal response is elbow flexion and supination (C5-C6). In an Inverted Supinator Jerk, there is NO elbow flexion or supinator jerk; instead, there is prominent, brisk finger flexion (C8-T1). This occurs in cervical spinal cord compression at the C5-C6 level: the LMN arc at C5-C6 is damaged (abolishing the supinator jerk), while the corticospinal tract running down the cord is compressed, producing UMN hyperreflexia at the lower uncompressed segments (C8 finger flexors).',
        examinerTip: 'An Inverted Supinator Jerk is diagnostic of Cervical Spondylotic Compressive Myelopathy at C5-C6.',
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
    diagramPath: '/diagrams/pediatrics/pediatric_respiratory_distress_silverman.jpg',
    diagramTitle: 'Pediatric Respiratory Distress & Silverman-Anderson Retraction Score',
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
    diagramPath: '/diagrams/orthopaedics/ctev_clubfoot_pirani_score.jpg',
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
  /*
   * Departments added after this file passed 290 KB in one array.
   *
   * A department per file under `proformas/` rather than more entries here:
   * the array was becoming the only thing anybody could edit at a time, and a
   * merge conflict in it is unresolvable by reading. Spread rather than
   * concatenated at the call site so CLINICAL_PROFORMAS stays one exported
   * array and nothing that reads it changes.
   */
  ...ENT_PROFORMAS,
  ...OPHTHALMOLOGY_PROFORMAS,
  ...SURGERY_SHORT_PROFORMAS,
  ...SURGERY_LONG_PROFORMAS,
  ...PAEDIATRIC_PROFORMAS,
  ...ORTHO_OBG_PROFORMAS,
  ...MEDICINE_PROFORMAS,
];

const SUPABASE_DIAGRAMS_BASE = 'https://pmtgeydtqypwrypshhsx.supabase.co/storage/v1/object/public/diagrams';

/**
 * Resolves a clinical proforma diagram path to its authentic Supabase Storage CDN URL.
 */
export function resolveProformaDiagramUrl(path: string | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.replace(/^\/?diagrams\//, '').replace(/^\//, '');
  return `${SUPABASE_DIAGRAMS_BASE}/${cleanPath}`;
}
