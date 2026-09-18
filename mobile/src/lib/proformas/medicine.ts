/**
 * General Medicine case proformas — the disease cases.
 *
 * `clinicalProformas.ts` already holds the four SYSTEM proformas (CVS,
 * respiratory, abdomen, CNS), which are the examination sequences. These are
 * the DISEASE cases that get given in a medicine long case, and they are a
 * different thing: a system proforma teaches you how to examine a chest, and a
 * disease proforma teaches you what to do when the chest belongs to somebody
 * with decompensated cirrhosis.
 *
 * So these deliberately do not repeat the examination sequences. Each one
 * assumes the relevant system proforma and carries what that system proforma
 * cannot: the disease-specific history, the findings that grade severity, the
 * complications to screen for, and the management. The general examination is
 * drawn once, with its photographs, from `generalExamSigns.ts`.
 */
import type { ClinicalProforma } from '@/lib/clinicalProformas';

export const MEDICINE_PROFORMAS: ClinicalProforma[] = [
  {
    id: 'cld_portal_htn_proforma',
    title: 'Chronic Liver Disease with Portal Hypertension',
    system: 'General Medicine',
    department: 'Hepatology / General Medicine',
    summary:
      'The commonest medicine long case with a big abdomen. Covers the aetiological history, the head-to-toe stigmata, the distinction between hepatic and other causes of ascites, Child-Pugh and MELD, and the complications that kill — variceal bleeding, encephalopathy, SBP and hepatorenal syndrome.',
    examPearl:
      'Establish DECOMPENSATION before anything else: ascites, encephalopathy, variceal bleed or jaundice. Compensated and decompensated cirrhosis are different diseases with different prognoses, and the Child-Pugh class is what the examiner wants you to have calculated at the bedside.',
    diagramPath: '/diagrams/clinical/portal_hypertension_portosystemic_anastomosis.jpg',
    diagramTitle: 'Portal hypertension and the portosystemic anastomoses',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'Presenting complaints',
            description: 'Usually distension, swelling, jaundice or a bleed.',
            checklist: [
              'ABDOMINAL DISTENSION: onset, duration, progression, whether uniform, and any associated pain',
              'SWELLING OF THE FEET — and whether it came before or after the abdominal distension (feet first suggests cardiac or renal; abdomen first suggests hepatic)',
              'JAUNDICE: duration, progression, pruritus, urine and stool colour',
              'HAEMATEMESIS and MELAENA — number of episodes, quantity, whether fresh or coffee-ground, and any syncope',
              'ENCEPHALOPATHY: reversal of sleep rhythm, day-time drowsiness, confusion, altered behaviour, tremor of the hands, and any precipitant',
              'Fever — which in an ascitic patient means spontaneous bacterial peritonitis',
              'Decreased urine output; abdominal pain; breathlessness from a tense ascites or a hepatic hydrothorax',
              'Loss of weight, loss of appetite, easy fatigability, loss of libido',
            ],
            clinicalSign:
              'Reversal of the sleep-wake rhythm is the earliest feature of hepatic encephalopathy and is asked about in those words — "does he sleep in the day and stay awake at night?"',
          },
          {
            label: 'Aetiology — asked systematically',
            description: 'The cause changes the treatment, so the history is the workup.',
            checklist: [
              'ALCOHOL: type, quantity in units per day, duration in years, and when it was last taken. Ask about withdrawal symptoms',
              'Blood transfusion, tattooing, intravenous drug use, unsafe injections, multiple sexual partners — hepatitis B and C',
              'Jaundice in the past; contact with a jaundiced patient; hepatitis vaccination',
              'Drugs and indigenous medicines; methotrexate, amiodarone, antitubercular therapy',
              'FAMILY HISTORY: Wilson disease, haemochromatosis, alpha-1-antitrypsin deficiency — asked of every young patient with cirrhosis',
              'Diabetes, obesity, dyslipidaemia — non-alcoholic fatty liver disease',
              'Autoimmune disease; pruritus preceding jaundice in a middle-aged woman — primary biliary cholangitis',
              'Previous abdominal surgery; congestive cardiac failure',
            ],
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'The stigmata, head to toe',
            description: 'The general examination of this case is longer than PICCLE and is its own finding.',
            checklist: [
              'FACE: temporal wasting, alopecia, icterus, pallor, xanthelasma, medial supraciliary madarosis, bilateral PAROTID enlargement, bleeding gums, FETOR HEPATICUS',
              'Kayser-Fleischer ring — looked for on slit lamp in any patient under 40',
              'HANDS: clubbing, leukonychia (Terry nails, Muehrcke lines), PALMAR ERYTHEMA, DUPUYTREN contracture, ASTERIXIS, bounding pulse',
              'THORAX: SPIDER NAEVI in the SVC distribution (and the test — blanching from the central punctum outwards), GYNAECOMASTIA, loss of axillary and pectoral hair, breast atrophy in women',
              'ABDOMEN: CAPUT MEDUSAE, dilated veins with the flow AWAY from the umbilicus (the two-finger milking test), everted umbilicus, divarication of recti',
              'TESTICULAR ATROPHY; scrotal and pedal oedema',
              '"Spider-man habitus" — central ascites with wasted limbs',
            ],
          },
          {
            label: 'The abdomen and the ascites',
            description: 'Assumes the abdominal system proforma; these are the findings that grade it.',
            checklist: [
              'LIVER: span in the midclavicular line (normal 12–15 cm), surface, margin, consistency; SHRUNKEN in established cirrhosis, enlarged and firm early',
              'SPLEEN — palpated from the right iliac fossa towards the left costal margin; splenomegaly is the clinical evidence of portal hypertension',
              'ASCITES: FLUID THRILL (over 1500–2000 mL), SHIFTING DULLNESS (over 500–1000 mL), PUDDLE SIGN (about 100–120 mL, the most sensitive)',
              'CRUVEILHIER-BAUMGARTEN venous hum over the epigastrium or umbilicus; hepatic arterial bruit; friction rubs',
              'Bowel sounds; hernial orifices (umbilical hernia is common with tense ascites)',
              'CHILD-TURCOTTE-PUGH score, calculated at the bedside: bilirubin, albumin, INR, ascites and encephalopathy. Class A 5–6, B 7–9, C 10–15',
              'MELD score where transplant is being considered',
              'Neurological: grade of encephalopathy (West Haven I–IV), asterixis, constructional apraxia (the five-pointed star test)',
            ],
            clinicalSign:
              'A sudden fall in the size of a previously large spleen with a variceal bleed, or new fever and abdominal pain in a stable ascitic patient, are the two changes that mean decompensation is happening now.',
          },
        ],
      },
      {
        title: '3. Investigations and Management',
        items: [
          {
            label: 'Investigations',
            description: 'Confirm, grade, find the cause, and look for the complications.',
            checklist: [
              'Liver function tests; albumin and globulin with a REVERSED A:G ratio; PROTHROMBIN TIME / INR — the best marker of synthetic function',
              'Complete blood count — pancytopenia from hypersplenism',
              'Renal function, electrolytes, blood sugar',
              'VIRAL MARKERS: HBsAg, anti-HCV, HIV',
              'Autoimmune profile (ANA, ASMA, anti-LKM), immunoglobulins; serum ceruloplasmin and 24-hour urinary copper in the young; ferritin and transferrin saturation; alpha-1-antitrypsin',
              'ULTRASOUND ABDOMEN with Doppler: liver echotexture and size, surface nodularity, PORTAL VEIN DIAMETER (over 13 mm), flow direction, collaterals, splenomegaly, ascites',
              'ALPHA-FETOPROTEIN and 6-monthly ultrasound — HCC surveillance, which is a standing obligation in every cirrhotic',
              'UPPER GI ENDOSCOPY — for varices, graded, and for portal hypertensive gastropathy. Every newly diagnosed cirrhotic gets one',
              'ASCITIC FLUID TAP: cell count with differential, SAAG, protein, culture in blood culture bottles at the bedside, cytology, ADA',
              'Transient elastography; liver biopsy where the cause remains unclear',
            ],
          },
          {
            label: 'Management',
            description: 'Treat the cause, treat the complications, and screen for the cancer.',
            checklist: [
              'ABSTINENCE from alcohol — absolute, and the single most effective intervention in alcoholic liver disease',
              'Antiviral therapy for hepatitis B and C; nutrition with adequate protein (protein restriction is obsolete and harmful)',
              'ASCITES: salt restriction (under 2 g sodium daily), spironolactone with furosemide in a 100:40 ratio, daily weight, and therapeutic paracentesis WITH ALBUMIN cover for large volumes',
              'VARICES: non-selective beta blockers (propranolol, carvedilol) or endoscopic band ligation for primary prophylaxis; in an acute bleed — resuscitate, terlipressin or octreotide, prophylactic antibiotics, and endoscopic band ligation within 12 hours. TIPS for refractory bleeding',
              'ENCEPHALOPATHY: identify and treat the PRECIPITANT (infection, bleed, constipation, diuretics, electrolyte disturbance, sedatives), lactulose to two or three soft stools a day, rifaximin',
              'SBP: an ascitic neutrophil count of 250/mm³ or more — cefotaxime plus ALBUMIN, then long-term norfloxacin prophylaxis',
              'HEPATORENAL SYNDROME: albumin with terlipressin; transplant assessment',
              'Avoid NSAIDs, aminoglycosides and sedatives; vaccinate against hepatitis A and B, pneumococcus and influenza',
              'LIVER TRANSPLANT referral by MELD',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'What is SAAG and why did it replace the exudate-transudate classification?',
        answer:
          'The serum-ascites albumin gradient is the serum albumin minus the ascitic fluid albumin, from samples taken on the SAME DAY. A SAAG of 1.1 g/dL or MORE indicates PORTAL HYPERTENSION — cirrhosis, alcoholic hepatitis, cardiac ascites, Budd-Chiari, massive liver metastases, portal vein thrombosis. A SAAG BELOW 1.1 indicates a non-portal-hypertensive cause — peritoneal tuberculosis, peritoneal carcinomatosis, pancreatic ascites, nephrotic syndrome, serositis. It replaced the old exudate-transudate division based on ascitic protein because SAAG is about 97% accurate whereas the protein-based classification misclassifies a substantial minority — notably cardiac ascites, which has a HIGH protein but is nevertheless portal hypertensive, and cirrhotic ascites complicated by infection, where the protein rises. SAAG is based on oncotic-hydrostatic balance and so measures the mechanism directly.',
        examinerTip:
          'Cardiac ascites is the example that proves the point: high SAAG and high protein at the same time.',
      },
      {
        question: 'Calculate the Child-Pugh score and say what it is used for.',
        answer:
          'Five parameters, each scored 1 to 3, remembered as PABAE or "A BAP-E": ALBUMIN (over 3.5 = 1, 2.8–3.5 = 2, under 2.8 = 3); BILIRUBIN (under 2 = 1, 2–3 = 2, over 3 = 3); PROTHROMBIN TIME prolongation in seconds (under 4 = 1, 4–6 = 2, over 6 = 3) or INR (under 1.7, 1.7–2.3, over 2.3); ASCITES (none = 1, mild or diuretic-responsive = 2, moderate to severe or refractory = 3); and ENCEPHALOPATHY (none = 1, grade I–II = 2, grade III–IV = 3). Total 5 to 15: CLASS A 5–6, CLASS B 7–9, CLASS C 10–15. It predicts survival, and it is used to assess operative risk before any surgery in a cirrhotic — which is its original purpose — and to decide on variceal prophylaxis. MELD, based on bilirubin, creatinine, INR and sodium, has largely replaced it for transplant allocation because it is continuous and objective.',
        examinerTip:
          'The two clinical parameters, ascites and encephalopathy, are what you can score at the bedside. Do that before you are asked.',
      },
    ],
  },

  {
    id: 'dm_complications_proforma',
    title: 'Diabetes Mellitus with Complications',
    system: 'General Medicine',
    department: 'Endocrinology / General Medicine',
    summary:
      'A long case that is entirely about the complications, not the diagnosis. Covers the control history, the systematic screen for retinopathy, nephropathy, neuropathy and macrovascular disease, the diabetic foot, and the management targets.',
    examPearl:
      'Examine the FEET — shoes and socks off, both of them, including between the toes and the heel. A diabetic case where the candidate has not taken the socks off has failed, and the neuropathic ulcer is always in the place nobody looked.',
    diagramPath: '/diagrams/pharmacology/antidiabetic_drugs_organ_mechanisms.jpg',
    diagramTitle: 'Antidiabetic drugs and their organ mechanisms',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'The diabetes itself',
            description: 'Diagnosis, control, and what treatment has actually been taken.',
            checklist: [
              'Age at diagnosis; how it was diagnosed (symptoms, routine check, or a complication)',
              'Presenting symptoms then: polyuria, polydipsia, polyphagia, weight loss, fatigue, recurrent infection',
              'DURATION of diabetes in years — which is the strongest predictor of microvascular complications',
              'TREATMENT: which drugs, what doses, for how long, and whether taken REGULARLY. Insulin — type, dose, timing, injection sites and whether rotated',
              'MONITORING: home glucose testing, frequency, typical values; last HbA1c and its value',
              'HYPOGLYCAEMIA: frequency, timing, severity, whether any required help, and HYPOGLYCAEMIA UNAWARENESS — which changes the target',
              'Ketoacidosis or hyperosmolar state — any admission, and what precipitated it',
              'Diet, exercise, weight change; adherence and the barriers to it including cost',
            ],
          },
          {
            label: 'The complication screen — which is the case',
            description: 'Asked system by system, and recorded as present or absent.',
            checklist: [
              'EYES: blurring, floaters, sudden loss of vision, date of the LAST FUNDUS EXAMINATION, any laser treatment or intravitreal injection, cataract',
              'KIDNEY: frothy urine, swelling of the face and feet, reduced urine output, nocturia; previous urea, creatinine and urine albumin',
              'NEUROPATHY, sensory: numbness, tingling, burning pain in a GLOVE AND STOCKING distribution, worse at night; loss of sensation; unnoticed injury',
              'NEUROPATHY, autonomic: postural dizziness, early satiety and vomiting (gastroparesis), nocturnal diarrhoea, bladder dysfunction, ERECTILE DYSFUNCTION, gustatory sweating, and loss of hypoglycaemia awareness',
              'FOOT: ulcer, callus, deformity, previous amputation, footwear habits, walking barefoot',
              'CARDIOVASCULAR: chest pain, exertional dyspnoea, palpitations — and remember SILENT ischaemia is common',
              'CEREBROVASCULAR: transient ischaemic attack, stroke',
              'PERIPHERAL VASCULAR: claudication, rest pain, blackening of a toe',
              'INFECTIONS: recurrent boils, urinary infection, candidiasis, TUBERCULOSIS, periodontal disease',
              'Comorbidity: hypertension, dyslipidaemia, thyroid disease, obesity; smoking and alcohol; family history',
            ],
            clinicalSign:
              'Postural dizziness plus loss of hypoglycaemia awareness is autonomic neuropathy, and it is the finding that should make you RAISE the glycaemic target rather than tighten it.',
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'General and cardiovascular',
            description: 'Beyond PICCLE, aimed at the metabolic syndrome and the macrovascular disease.',
            checklist: [
              'Height, weight, BMI, WAIST CIRCUMFERENCE (over 90 cm in men and 80 cm in women for South Asians)',
              'ACANTHOSIS NIGRICANS in the neck and axillae — insulin resistance; skin tags',
              'Diabetic dermopathy, necrobiosis lipoidica, granuloma annulare, eruptive xanthomata',
              'INJECTION SITES — lipohypertrophy and lipoatrophy; ask to see them and palpate',
              'BLOOD PRESSURE supine and standing, after 3 minutes — a fall of 20 mmHg systolic or 10 diastolic is postural hypotension',
              'ALL PERIPHERAL PULSES, and carotid, renal and femoral bruits',
              'CVS and RS fully; check for tuberculosis',
              'Oral cavity: candidiasis, periodontitis, dental caries',
            ],
          },
          {
            label: 'The foot, the eye and the nerves',
            description: 'The three examinations this case exists for.',
            checklist: [
              'FOOT — both, shoes and socks OFF: skin, colour, temperature, hair loss, nail changes, fungal infection BETWEEN THE TOES, callus, ulcer (site, size, edge, floor, depth, probe to bone), deformity (claw toes, Charcot arthropathy, rocker-bottom foot), and the HEEL',
              'FOOTWEAR examined — inside as well as outside, for a foreign body and for wear pattern',
              'MONOFILAMENT: 10 g Semmes-Weinstein at ten sites; inability to feel it at four or more predicts ulceration',
              'VIBRATION with a 128 Hz fork at the great toe and the medial malleolus; ankle jerk; pinprick; joint position sense',
              'FUNDUS EXAMINATION after dilatation — stated as part of the examination, not deferred: microaneurysms, dot and blot haemorrhages, hard exudates, cotton wool spots, venous beading, IRMA, NEW VESSELS at the disc or elsewhere, vitreous haemorrhage, and maculopathy',
              'Visual acuity; cataract; cranial nerve palsies (a third nerve palsy with PUPIL SPARING is the classic diabetic one)',
              'Motor: proximal weakness and wasting of the quadriceps (diabetic amyotrophy); mononeuritis multiplex',
            ],
            clinicalSign:
              'Proliferative retinopathy can be present with 6/6 vision. A patient who says the eyes are fine has told you nothing, which is why the fundus is examined rather than the history taken.',
          },
        ],
      },
      {
        title: '3. Investigations and Management',
        items: [
          {
            label: 'Investigations',
            description: 'For control, and for each complication.',
            checklist: [
              'Fasting and postprandial glucose; HbA1c (which reflects the last 8–12 weeks)',
              'URINE for albumin — the ALBUMIN:CREATININE RATIO on a spot sample, which detects nephropathy years before the creatinine moves',
              'Renal function, electrolytes; urine routine and culture',
              'Lipid profile; liver function; thyroid function',
              'ECG, and echocardiography or a stress test where indicated',
              'FUNDUS examination by an ophthalmologist, at diagnosis in type 2 and after 5 years in type 1, then annually',
              'Nerve conduction studies where the diagnosis is uncertain',
              'ABPI and Doppler for peripheral vascular disease; X-ray of the foot for osteomyelitis and Charcot changes',
              'Chest X-ray and sputum for AFB where tuberculosis is suspected',
            ],
          },
          {
            label: 'Management',
            description: 'Targets, drugs, and the things that are not drugs.',
            checklist: [
              'TARGETS: HbA1c generally under 7%, individualised — relaxed to 8% or above in the elderly, in hypoglycaemia unawareness, in advanced complications and in limited life expectancy',
              'Blood pressure under 130/80; LDL under 100 mg/dL, or under 70 with established cardiovascular disease',
              'LIFESTYLE: medical nutrition therapy, 150 minutes of exercise a week, weight loss, smoking cessation — stated first, because it is stated last in practice',
              'METFORMIN as first-line unless contraindicated; then SGLT2 inhibitors and GLP-1 receptor agonists, which have cardiovascular and renal benefit independent of glucose lowering',
              'Sulfonylureas, DPP-4 inhibitors, pioglitazone; INSULIN when oral agents fail, in acute illness, in pregnancy and in severe hyperglycaemia',
              'ACE INHIBITOR or ARB for albuminuria even when the blood pressure is normal',
              'Statin; antiplatelet for secondary prevention',
              'FOOT CARE EDUCATION: daily inspection with a mirror, never barefoot, well-fitting footwear, careful nail cutting, treat fungal infection, and report any ulcer immediately',
              'Annual screening: fundus, urine ACR, feet, lipids',
              'Vaccination: influenza, pneumococcus, hepatitis B',
              'SICK DAY RULES — never stop insulin during illness, monitor more often, maintain hydration',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'A diabetic patient has a foot ulcer. How do you decide whether it is neuropathic or ischaemic?',
        answer:
          'NEUROPATHIC ulcer: occurs at PRESSURE POINTS — the metatarsal heads, the plantar surface, under a callus; the ulcer is PAINLESS with a punched-out edge and surrounding callus; the foot is WARM with bounding pulses and dilated dorsal veins; sensation is lost in a glove-and-stocking distribution, the ankle jerk is absent and vibration is reduced; the skin is dry from autonomic denervation of the sweat glands; and there may be clawing or a Charcot deformity. ISCHAEMIC ulcer: occurs at the TIPS OF THE TOES, the heel and the margins of the foot; it is PAINFUL, with rest pain worse at night and relieved by dependency; the foot is COLD and PULSELESS with delayed capillary refill, thin shiny skin, hair loss and a low ABPI; there is no callus. Most diabetic feet are NEUROISCHAEMIC — a mixture — and it is the ischaemic component that determines whether the ulcer will heal, so the pulses and ABPI are examined in every case.',
        examinerTip:
          'Warm and painless versus cold and painful. Then say "most are neuroischaemic", which is what a real foot clinic sees.',
      },
      {
        question: 'Why can the ABPI be misleading in a diabetic?',
        answer:
          'Because medial calcific sclerosis of the tibial arteries is common in diabetes, making the vessels rigid and incompressible. The cuff cannot occlude them, so an artificially HIGH pressure is recorded and the ABPI may be normal or above 1.3 in a foot that is critically ischaemic. Treating the number rather than the foot is how limbs are lost. Where this is suspected, use the TOE-BRACHIAL INDEX, since the digital arteries are usually spared — a toe pressure below 30 mmHg indicates critical ischaemia — or assess the Doppler waveform (a normal artery is triphasic; monophasic flow means disease however good the pressure looks), transcutaneous oxygen tension, or duplex ultrasound.',
        examinerTip:
          'Say "the artery is incompressible" and then give the toe-brachial index as the alternative. Both halves are needed.',
      },
    ],
  },

  {
    id: 'ckd_nephrotic_proforma',
    title: 'Chronic Kidney Disease and Nephrotic Syndrome',
    system: 'General Medicine',
    department: 'Nephrology / General Medicine',
    summary:
      'The renal long case. Covers the history of oedema and its progression, the distinction between nephrotic and nephritic presentations, the staging of CKD, the systemic consequences of uraemia, and the management including when to dialyse.',
    examPearl:
      'Oedema that starts as PUFFINESS OF THE FACE in the morning and then becomes generalised is renal; oedema that starts in the FEET at the end of the day and ascends is cardiac or hepatic. Ask where it started and when in the day it is worst — that one question sorts the differential before you touch the patient.',
    diagramPath: '/diagrams/physiology/gfr_filtration_barrier_starling.jpg',
    diagramTitle: 'Glomerular filtration barrier and Starling forces',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'Oedema and urinary symptoms',
            description: 'The pattern of the oedema and the character of the urine.',
            checklist: [
              'OEDEMA: where it started (FACE and periorbital in renal disease), time of day it is worst (MORNING in renal, evening in cardiac), progression to the legs, abdomen and genitalia, and whether it pits',
              'FROTHY URINE — the bedside marker of heavy proteinuria; ask whether the froth persists',
              'Urine output: oliguria, anuria, NOCTURIA (an early sign of loss of concentrating ability), polyuria',
              'HAEMATURIA — colour (smoky or cola-coloured in glomerulonephritis, frankly red in urological causes), timing within the stream, clots (clots suggest a urological cause)',
              'Burning micturition, frequency, urgency, loin pain, passage of stones or gravel',
              'Hypertension — duration, control, and whether the blood pressure or the kidney came first',
            ],
            clinicalSign:
              'Cola-coloured urine with facial puffiness and hypertension two to three weeks after a sore throat or a skin infection is post-streptococcal glomerulonephritis, and the interval is the diagnostic feature.',
          },
          {
            label: 'Uraemic symptoms and the aetiological history',
            description: 'What the failing kidney does to every other system.',
            checklist: [
              'Anorexia, nausea, vomiting, METALLIC TASTE, hiccups, weight loss',
              'Fatigue, breathlessness on exertion — anaemia of chronic kidney disease',
              'Breathlessness at rest, orthopnoea, PND — fluid overload and uraemic pulmonary oedema',
              'PRURITUS, restless legs, muscle cramps, bone pain',
              'Drowsiness, confusion, seizures, asterixis — uraemic encephalopathy',
              'Bleeding tendency — uraemic platelet dysfunction',
              'AETIOLOGY: DIABETES and its duration; HYPERTENSION; recurrent urinary infection in childhood; renal stones; NSAIDs and indigenous medicines taken long term; a family history of polycystic kidney disease or of renal failure',
              'Preceding sore throat or pyoderma; joint pains, rash, oral ulcers, photosensitivity, alopecia (SLE); haemoptysis (pulmonary-renal syndrome)',
              'Previous renal biopsy, dialysis, or transplant assessment',
            ],
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'General',
            description: 'The specific findings of uraemia, over and above PICCLE.',
            checklist: [
              'PERIORBITAL PUFFINESS; generalised oedema (anasarca); ascites; pleural effusion',
              'Pitting oedema — graded, and examined over the SACRUM in a bed-bound patient',
              'PALLOR — often striking; a sallow, muddy complexion',
              'Uraemic FROST (rare); scratch marks; ecchymoses',
              'HALF-AND-HALF NAILS (Lindsay nails); leukonychia from hypoalbuminaemia',
              'ASTERIXIS; uraemic FETOR',
              'BLOOD PRESSURE — in both arms, and looked for hypertensive retinopathy on fundoscopy',
              'JVP — raised in volume overload, and the key bedside guide to fluid status',
              'Weight, and the change in it — the most reliable measure of fluid balance',
              'Signs of the cause: diabetic changes, a malar rash, joint deformity, palpable kidneys (polycystic disease)',
            ],
          },
          {
            label: 'Systemic',
            description: 'Every system, because uraemia reaches all of them.',
            checklist: [
              'CVS: apex beat, added sounds, a PERICARDIAL RUB (uraemic pericarditis — an indication for urgent dialysis), signs of failure',
              'RS: basal crackles of pulmonary oedema, pleural effusion, Kussmaul breathing of metabolic acidosis',
              'ABDOMEN: ascites, palpable kidneys, bladder (chronic retention), renal bruit, an arteriovenous fistula in the forearm and its thrill and bruit',
              'CNS: sensorium, asterixis, peripheral neuropathy, proximal myopathy',
              'Bone: bone tenderness, proximal muscle weakness, deformity — renal osteodystrophy',
              'Fundus: hypertensive and diabetic changes',
            ],
          },
        ],
      },
      {
        title: '3. Investigations and Management',
        items: [
          {
            label: 'Investigations',
            description: 'Confirm, stage, find the cause, and find the complications.',
            checklist: [
              'URINE ROUTINE and MICROSCOPY — protein, blood, and the CASTS: red cell casts mean glomerulonephritis, broad waxy casts mean chronic disease, fatty casts and oval fat bodies mean nephrotic syndrome',
              '24-HOUR URINE PROTEIN or the spot protein:creatinine ratio. NEPHROTIC RANGE is over 3.5 g per day in an adult',
              'Serum ALBUMIN (under 3 g/dL in nephrotic syndrome), total protein, LIPID PROFILE (hyperlipidaemia completes the nephrotic tetrad)',
              'Blood urea, CREATININE, and the eGFR by CKD-EPI — which is what STAGES the disease: G1 above 90, G2 60–89, G3a 45–59, G3b 30–44, G4 15–29, G5 under 15',
              'Electrolytes, calcium, phosphate, PTH, bicarbonate, uric acid',
              'Haemogram — normocytic normochromic anaemia; iron studies',
              'ULTRASOUND: kidney SIZE (small and echogenic in chronic disease, normal or large in diabetic nephropathy, amyloid and polycystic disease), cortical thickness, corticomedullary differentiation, obstruction',
              'Aetiological workup: blood sugar and HbA1c, ANA and anti-dsDNA, complement C3 and C4, ANCA, anti-GBM, ASO titre, hepatitis B and C, HIV, serum and urine electrophoresis',
              'RENAL BIOPSY where the cause is unclear and the kidneys are of normal size',
              'ECG and echocardiography; chest X-ray',
            ],
          },
          {
            label: 'Management',
            description: 'Slow the decline, treat the complications, and prepare for replacement.',
            checklist: [
              'Treat the CAUSE: glycaemic control, blood pressure control, stop nephrotoxins including NSAIDs, contrast and indigenous medicines',
              'BLOOD PRESSURE target under 130/80, with an ACE INHIBITOR or ARB as first choice for their antiproteinuric effect — accepting a creatinine rise of up to 30%',
              'SGLT2 inhibitors — now standard for slowing progression in both diabetic and non-diabetic CKD',
              'Dietary: salt restriction, protein moderation (0.8 g/kg), potassium and phosphate restriction as needed',
              'ANAEMIA: iron replacement first, then erythropoiesis-stimulating agents to a target haemoglobin of 10–11.5 g/dL — not higher',
              'MINERAL BONE DISEASE: phosphate binders, calcium and vitamin D analogues, control PTH',
              'ACIDOSIS: oral sodium bicarbonate; HYPERKALAEMIA: dietary restriction, binders, and emergency treatment when needed',
              'NEPHROTIC SYNDROME specifically: steroids and immunosuppression by histological type, statin, ACE inhibitor, albumin with diuretics for severe oedema, and ANTICOAGULATION where albumin is very low — renal vein thrombosis is the complication that is missed',
              'Vaccination: hepatitis B, pneumococcus, influenza',
              'DIALYSIS indications: refractory fluid overload, refractory hyperkalaemia, severe acidosis, uraemic PERICARDITIS, uraemic ENCEPHALOPATHY, and intractable symptoms — remembered as AEIOU',
              'Early access planning: an arteriovenous fistula created months before it is needed; transplant assessment',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Differentiate nephrotic from nephritic syndrome.',
        answer:
          'NEPHROTIC syndrome is a problem of PERMEABILITY: massive proteinuria over 3.5 g per day, hypoalbuminaemia under 3 g/dL, generalised oedema which is often gross, and hyperlipidaemia with lipiduria. Blood pressure is usually normal, haematuria is absent or minimal, red cell casts are absent, and renal function is often preserved initially. Causes include minimal change disease (the commonest in children), focal segmental glomerulosclerosis, membranous nephropathy, diabetic nephropathy and amyloidosis. NEPHRITIC syndrome is a problem of INFLAMMATION: haematuria with RED CELL CASTS and dysmorphic red cells, proteinuria that is sub-nephrotic, HYPERTENSION, OLIGURIA and a rising creatinine, with oedema that is typically periorbital and milder. Causes include post-streptococcal glomerulonephritis, IgA nephropathy, lupus nephritis, ANCA-associated vasculitis and anti-GBM disease. The two can overlap, and a nephritic-nephrotic picture points at membranoproliferative or lupus nephritis.',
        examinerTip:
          'Red cell casts are the single finding that makes it nephritic. Say that, and say that hypertension and oliguria go with it.',
      },
      {
        question: 'Why do nephrotic patients develop thrombosis?',
        answer:
          'Because the glomerulus leaks proteins by size, not by usefulness. ANTITHROMBIN III is lost in the urine along with albumin, and it is the principal endogenous anticoagulant; proteins C and S are also lost or functionally altered. At the same time the liver, stimulated by hypoalbuminaemia, increases synthesis of fibrinogen and of factors V and VIII; platelet number and reactivity rise; haemoconcentration follows diuretic use; and blood viscosity increases with the hyperlipidaemia. The result is a hypercoagulable state. RENAL VEIN THROMBOSIS is the classic complication — particularly in membranous nephropathy — presenting with loin pain, haematuria, a sudden fall in urine output and worsening proteinuria, and deep vein thrombosis and pulmonary embolism also occur. Prophylactic anticoagulation is considered when serum albumin falls below about 2–2.5 g/dL, especially in membranous nephropathy.',
        examinerTip:
          'Name antithrombin III losing itself in the urine. That single fact is the mechanism and the answer.',
      },
    ],
  },

  {
    id: 'stroke_hemiplegia_proforma',
    title: 'Stroke — the Hemiplegic Patient',
    system: 'General Medicine',
    department: 'Neurology / General Medicine',
    summary:
      'The commonest neurology long case. Covers the onset that separates a bleed from an infarct, the localisation from cortex to cord, the risk factor history, the swallow assessment that prevents the commonest complication, and acute management including the thrombolysis window.',
    examPearl:
      'Localise before you name the lesion: is it UMN or LMN, is it cortical or subcortical, and what is the ARTERIAL TERRITORY? A candidate who says "left hemiplegia, probably a stroke" has not answered the question. The answer is "right middle cerebral artery territory infarct involving the cortex, evidenced by aphasia / neglect / cortical sensory loss".',
    diagramPath: '/diagrams/anatomy/internal_capsule_horizontal_sections.jpg',
    diagramTitle: 'Internal capsule: tracts and blood supply',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'The event',
            description: 'Onset and progression are what distinguish the pathology.',
            checklist: [
              'EXACT TIME OF ONSET, or the time the patient was LAST SEEN WELL — this decides thrombolysis eligibility and is the single most important question',
              'What the patient was doing at the time: at rest or on waking (infarct) versus during exertion or straining (haemorrhage)',
              'Onset SUDDEN and maximal at onset (embolic, haemorrhagic) versus stuttering and progressive over hours (thrombotic)',
              'HEADACHE, VOMITING, NECK STIFFNESS, LOSS OF CONSCIOUSNESS and SEIZURE at onset — all favour HAEMORRHAGE over infarct',
              'Weakness: which side, which limbs, face involved or not, and whether the weakness has improved, worsened or stayed the same',
              'SPEECH: unable to speak, speaking but not making sense, unable to understand, slurred — these are different and must be distinguished',
              'Swallowing difficulty, nasal regurgitation, choking on liquids',
              'Sensory loss; visual loss or field defect; double vision; vertigo; ataxia',
              'Bladder and bowel involvement; higher function and behaviour change',
              'PREVIOUS TIA — duration and symptoms',
            ],
            clinicalSign:
              'Headache, vomiting and early loss of consciousness with a stroke point at haemorrhage, but no clinical feature reliably separates infarct from bleed. That is why the CT is done before any antiplatelet or thrombolytic.',
          },
          {
            label: 'Risk factors and the rest',
            description: 'Because secondary prevention is half the management.',
            checklist: [
              'HYPERTENSION — duration, control, medication and compliance. The single biggest risk factor',
              'DIABETES; dyslipidaemia; SMOKING; alcohol',
              'CARDIAC: ATRIAL FIBRILLATION, rheumatic valvular disease, prosthetic valve, recent myocardial infarction, infective endocarditis, cardiomyopathy — the embolic sources',
              'Previous stroke or TIA; carotid disease; peripheral vascular disease',
              'Oral contraceptives, hormone therapy, pregnancy and puerperium in a young woman',
              'In a YOUNG stroke: vasculitis, antiphospholipid syndrome, thrombophilia, homocysteinaemia, sickle cell disease, cervical artery dissection after trauma or neck manipulation, drug abuse, and a patent foramen ovale',
              'Drug history, particularly anticoagulants and antiplatelets — which changes the haemorrhage risk',
              'Functional and social history: handedness, occupation, who is at home, stairs, and the family’s capacity to care — which decides the rehabilitation plan',
            ],
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'General and cardiovascular — looking for the source',
            description: 'The stroke case includes the heart, every time.',
            checklist: [
              'Conscious level by GLASGOW COMA SCALE; orientation; NIHSS score if available',
              'PULSE — rate, and RHYTHM: an irregularly irregular pulse is atrial fibrillation and is the source',
              'BLOOD PRESSURE in both arms; radio-radial and radio-femoral delay',
              'CAROTID BRUIT; temporal artery tenderness',
              'CVS: murmurs (mitral stenosis, prosthetic valve), signs of endocarditis — splinters, Osler nodes, Janeway lesions, Roth spots',
              'FUNDUS: hypertensive changes, papilloedema, subhyaloid haemorrhage (subarachnoid haemorrhage), Roth spots',
              'Neck stiffness and Kernig sign',
            ],
          },
          {
            label: 'Neurological localisation',
            description: 'Assumes the CNS proforma; these are the findings that localise the lesion.',
            checklist: [
              'HIGHER FUNCTIONS: orientation, memory, MMSE; and SPEECH — fluency, comprehension, repetition, naming. Broca (non-fluent, comprehension intact), Wernicke (fluent but meaningless, comprehension lost), conduction, global',
              'NEGLECT and constructional apraxia — non-dominant parietal lesions',
              'CRANIAL NERVES, especially: UMN versus LMN SEVENTH — forehead SPARED in an upper motor neurone lesion because of bilateral cortical supply, and this is the single most examined sign in the case',
              'Visual fields — homonymous hemianopia localises to the optic tract, radiation or occipital cortex',
              'Conjugate gaze deviation — towards the lesion in a cortical stroke, away from it in a pontine one',
              'MOTOR: bulk, TONE (flaccid in the acute phase, spastic later with clasp-knife rigidity), POWER graded MRC 0–5 in every group, and the pattern of weakness',
              'REFLEXES: exaggerated deep tendon reflexes, clonus, EXTENSOR PLANTAR, absent abdominal reflexes — the UMN picture',
              'SENSORY: all modalities, including CORTICAL sensation (stereognosis, graphaesthesia, two-point discrimination, extinction) — loss of cortical sensation with preserved primary modalities localises to the cortex',
              'CEREBELLAR signs; gait if the patient can stand',
              'SWALLOW ASSESSMENT — done before anything is given by mouth, and this is a step, not an afterthought',
            ],
            clinicalSign:
              'Aphasia, neglect, cortical sensory loss and a visual field defect are CORTICAL signs. A pure motor hemiplegia involving face, arm and leg equally with none of those is a LACUNAR infarct of the internal capsule.',
          },
        ],
      },
      {
        title: '3. Investigations and Management',
        items: [
          {
            label: 'Investigations',
            description: 'Imaging first, and the rest in parallel.',
            checklist: [
              'NON-CONTRAST CT HEAD IMMEDIATELY — to exclude haemorrhage before any antiplatelet or thrombolytic. An infarct may be normal on CT in the first hours; a bleed is visible at once',
              'MRI with diffusion-weighted imaging — far more sensitive for an early or posterior fossa infarct',
              'CT or MR angiography for large vessel occlusion where thrombectomy is possible',
              'ECG and continuous cardiac monitoring; prolonged monitoring for paroxysmal atrial fibrillation',
              'ECHOCARDIOGRAPHY — transthoracic, and transoesophageal where a cardiac source is suspected',
              'CAROTID DOPPLER',
              'Blood glucose IMMEDIATELY — hypoglycaemia mimics a stroke and is reversible',
              'Complete blood count, ESR, renal function, electrolytes, lipid profile, coagulation screen',
              'Young stroke workup: vasculitis screen, antiphospholipid antibodies, thrombophilia, homocysteine, and screening for dissection',
            ],
          },
          {
            label: 'Management',
            description: 'Acute, then secondary prevention, then rehabilitation.',
            checklist: [
              'ABC, oxygen if saturation is below 94%, and NIL BY MOUTH until the swallow is formally assessed',
              'THROMBOLYSIS with intravenous alteplase or tenecteplase within 4.5 HOURS of onset in an ischaemic stroke meeting the criteria — which is why the time of onset is the first question asked',
              'MECHANICAL THROMBECTOMY for a large vessel occlusion, up to 24 hours in selected patients',
              'BLOOD PRESSURE: permissive hypertension in an ischaemic stroke — lower only above 220/120, or above 185/110 if thrombolysing. In HAEMORRHAGE, lower to a systolic of 140',
              'Antiplatelet: aspirin within 24–48 hours (and after 24 hours if thrombolysed); dual antiplatelet for 21 days in a minor stroke or high-risk TIA',
              'ANTICOAGULATION for atrial fibrillation — timed by infarct size, not started on day one in a large infarct',
              'Statin; blood pressure control; glycaemic control; smoking cessation; carotid endarterectomy for severe symptomatic stenosis',
              'Glucose, temperature and hydration control; DVT prophylaxis with compression rather than heparin in a bleed',
              'PREVENT THE COMPLICATIONS: aspiration pneumonia (the swallow assessment), pressure sores (two-hourly turning), contractures (passive movements from day one), depression, and shoulder subluxation',
              'REHABILITATION from day one — physiotherapy, occupational therapy, speech therapy — and it is part of the management, not something arranged at discharge',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'How do you distinguish an upper from a lower motor neurone facial palsy, and why?',
        answer:
          'In an UPPER motor neurone lesion the FOREHEAD IS SPARED: the patient can wrinkle the forehead and close the eye, but the lower face — the nasolabial fold and the angle of the mouth — is weak on the opposite side. In a LOWER motor neurone lesion the WHOLE half of the face is weak on the SAME side, including the forehead, with loss of eye closure and a positive Bell phenomenon. The reason is that the part of the facial nucleus supplying the upper face receives BILATERAL corticobulbar input, while the part supplying the lower face receives only CONTRALATERAL input; so a unilateral upper motor neurone lesion still leaves the upper face innervated from the other hemisphere. Additional discriminators: emotional movements may be preserved in an UMN lesion (the emotional pathway is separate), while an LMN lesion may involve taste on the anterior two-thirds of the tongue, hyperacusis and reduced lacrimation depending on the level of the lesion in the facial canal.',
        examinerTip:
          'Say "bilateral cortical supply to the upper face". That clause is the whole answer and everything else follows from it.',
      },
      {
        question: 'What is the thrombolysis window and what would stop you thrombolysing?',
        answer:
          'Intravenous alteplase (0.9 mg/kg, 10% as a bolus and the rest over an hour) or tenecteplase is given within 4.5 HOURS of the onset of symptoms, or of the time the patient was last seen well. Mechanical thrombectomy extends to 6 hours routinely and to 24 hours in selected patients with a large vessel occlusion and favourable perfusion imaging. ABSOLUTE contraindications: any intracranial haemorrhage on CT, a history of intracranial haemorrhage, suspected subarachnoid haemorrhage, an intracranial neoplasm or arteriovenous malformation, active internal bleeding, blood pressure persistently above 185/110 despite treatment, platelet count below 100,000, INR above 1.7 or current effective anticoagulation, blood glucose below 50 mg/dL, significant head trauma or stroke in the previous 3 months, and recent intracranial or intraspinal surgery. Relative: major surgery within 14 days, gastrointestinal bleeding within 21 days, a seizure at onset with postictal deficit, pregnancy, and a rapidly improving or very minor deficit.',
        examinerTip:
          '"Time is brain" — and quote the figure: roughly 1.9 million neurones are lost per minute of untreated large vessel occlusion.',
      },
    ],
  },

  {
    id: 'anaemia_proforma',
    title: 'Anaemia — Clinical Approach and Classification',
    system: 'General Medicine',
    department: 'Haematology / General Medicine',
    summary:
      'The commonest finding in every medicine case and a long case in its own right in India. Covers the history that names the cause, the specific signs beyond pallor, the morphological classification, and the investigation sequence that avoids transfusing an undiagnosed patient.',
    examPearl:
      'Anaemia is a SIGN, never a diagnosis. The case is not finished when you say "iron deficiency anaemia" — it is finished when you say WHY she is iron deficient, and in an adult male or a postmenopausal woman that answer is occult gastrointestinal blood loss until a scope says otherwise.',
    diagramPath: '/diagrams/pathology/megaloblastic_vs_iron_deficiency_anemia.jpg',
    diagramTitle: 'Megaloblastic versus iron deficiency anaemia',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'Symptoms of anaemia, and of its cause',
            description: 'The anaemia symptoms are non-specific; the cause is in the rest of the history.',
            checklist: [
              'Easy fatigability, exertional dyspnoea and its grade, palpitations, dizziness, headache, tinnitus, loss of concentration',
              'Angina and pedal oedema — which mean the anaemia has become severe enough to cause high-output failure',
              'BLOOD LOSS: menorrhagia (quantified in pads), bleeding per rectum, haematemesis, melaena, haematuria, epistaxis, bleeding gums, haemoptysis',
              'PICA — eating mud, chalk, ice; and PAGOPHAGIA. Highly suggestive of iron deficiency',
              'DIET: vegetarian or mixed, milk intake, green leafy vegetables, meat; economic access to food',
              'GI: dysphagia (Plummer-Vinson), dyspepsia, abdominal pain, altered bowel habit, weight loss, PASSAGE OF WORMS',
              'B12 and FOLATE features: glossitis, paraesthesiae, unsteady gait, memory loss, prior gastric surgery, ileal resection, strict veganism, metformin, alcohol, pregnancy',
              'HAEMOLYSIS: jaundice, high-coloured urine, gallstones, a family history of anaemia, transfusion requirement since childhood, splenectomy',
              'CHRONIC DISEASE: tuberculosis, chronic kidney disease, malignancy, rheumatoid arthritis, HIV',
              'DRUGS: NSAIDs, aspirin, anticoagulants, antitubercular therapy, chemotherapy, chloramphenicol, phenytoin',
              'Occupational exposure; hookworm endemic area and barefoot walking',
              'Previous blood transfusion, and how many',
            ],
            clinicalSign:
              'Pica and dysphagia together are Plummer-Vinson (Paterson-Brown-Kelly) syndrome — iron deficiency with a postcricoid web, and a premalignant condition.',
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'Beyond pallor',
            description: 'The specific signs that name the type.',
            checklist: [
              'PALLOR at all four sites — lower palpebral conjunctiva, tongue, nail beds and PALMAR CREASES (crease pallor suggests haemoglobin under 7 g/dL)',
              'KOILONYCHIA and PLATONYCHIA — iron deficiency; brittle nails',
              'ATROPHIC GLOSSITIS — smooth, depapillated, beefy tongue: iron, B12 and folate deficiency',
              'ANGULAR STOMATITIS and CHEILOSIS',
              'JAUNDICE — lemon-yellow tint with pallor suggests haemolysis or megaloblastic anaemia',
              'Frontal bossing, maxillary prominence and CHIPMUNK FACIES — thalassaemia major',
              'LYMPHADENOPATHY, HEPATOMEGALY, SPLENOMEGALY — which shift the diagnosis to haemolysis, leukaemia or lymphoma',
              'STERNAL TENDERNESS — leukaemia',
              'Bleeding: petechiae, purpura, ecchymoses, retinal haemorrhages — suggesting marrow failure',
              'Leg ulcers — sickle cell disease and thalassaemia',
              'CVS: tachycardia, wide pulse pressure, a HAEMIC (flow) MURMUR, a hyperdynamic apex, and signs of failure',
              'NEUROLOGICAL: posterior column and pyramidal signs — SUBACUTE COMBINED DEGENERATION in B12 deficiency, with absent ankle jerks and an extensor plantar together',
              'PER RECTAL examination — in every adult with iron deficiency, for a mass and for occult blood',
            ],
          },
        ],
      },
      {
        title: '3. Classification, Investigations and Management',
        items: [
          {
            label: 'Morphological classification by MCV',
            description: 'The first fork in the investigation, and it is free — it comes with the blood count.',
            checklist: [
              'MICROCYTIC HYPOCHROMIC (MCV under 80): iron deficiency, thalassaemia, anaemia of chronic disease (may be normocytic), sideroblastic anaemia, lead poisoning',
              'NORMOCYTIC NORMOCHROMIC (MCV 80–100): acute blood loss, anaemia of chronic disease, chronic kidney disease, haemolysis, marrow failure, mixed deficiency',
              'MACROCYTIC (MCV over 100): MEGALOBLASTIC — B12 and folate deficiency; NON-MEGALOBLASTIC — alcohol, liver disease, hypothyroidism, myelodysplasia, reticulocytosis, drugs',
              'MENTZER INDEX (MCV divided by red cell count): above 13 suggests iron deficiency, below 13 suggests thalassaemia trait — a useful bedside discriminator where both are common',
              'RDW: raised in iron deficiency, usually normal in thalassaemia trait',
            ],
          },
          {
            label: 'Investigations and management',
            description: 'Find the cause before treating, and never transfuse to a number.',
            checklist: [
              'Complete blood count with indices, RDW, and a PERIPHERAL SMEAR — which is the single most informative test and is frequently skipped',
              'RETICULOCYTE COUNT — which divides the whole differential: LOW means production failure, HIGH means haemolysis or blood loss',
              'IRON STUDIES: serum iron low, TIBC high, ferritin low, transferrin saturation low in iron deficiency. FERRITIN is an acute phase reactant and can be normal or high in iron deficiency with coexisting inflammation',
              'Serum B12 and folate; homocysteine and methylmalonic acid where borderline',
              'HAEMOLYSIS screen: indirect bilirubin, LDH, haptoglobin, reticulocytes, direct Coombs test, and the peripheral smear for spherocytes, schistocytes and sickle cells',
              'HAEMOGLOBIN ELECTROPHORESIS or HPLC for thalassaemia and sickle cell disease',
              'Stool for occult blood and for ova and cysts',
              'UPPER GI ENDOSCOPY AND COLONOSCOPY — mandatory in an adult male or a postmenopausal woman with iron deficiency, because the anaemia is the presentation of the cancer',
              'Renal and liver function, thyroid function, ESR, HIV',
              'BONE MARROW where there is pancytopenia, an unexplained anaemia, or suspected marrow infiltration',
              'TREATMENT: oral iron for 3–6 months after the haemoglobin normalises, to refill stores; parenteral iron for intolerance or malabsorption',
              'B12 by injection — and never give folate alone in an undiagnosed macrocytic anaemia, because it corrects the blood picture while the neurological damage of B12 deficiency progresses',
              'TRANSFUSION only for symptomatic severe anaemia or active bleeding — and take the diagnostic samples BEFORE transfusing, because afterwards the iron studies, B12, folate and electrophoresis are all uninterpretable for months',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Why must you never give folic acid alone to a patient with macrocytic anaemia?',
        answer:
          'Because folate corrects the haematological abnormality of vitamin B12 deficiency without correcting the neurological one, and may accelerate it. B12 is required both for the methionine synthase reaction, which folate can bypass haematologically, and for methylmalonyl-CoA mutase, which it cannot — and it is the latter, with the accumulation of methylmalonyl-CoA and abnormal fatty acids in myelin, that produces SUBACUTE COMBINED DEGENERATION of the posterior and lateral columns. Giving folate alone therefore consumes the remaining B12 in accelerated haematopoiesis, the anaemia and macrocytosis resolve, everyone is reassured, and the patient goes on to develop irreversible paraesthesiae, sensory ataxia, absent ankle jerks with extensor plantars, and dementia. So in any macrocytic anaemia, B12 and folate are BOTH measured before treatment, and if treatment must start empirically, B12 is given first or both together.',
        examinerTip:
          'Absent ankle jerks with an extensor plantar is the classic combination — posterior column and pyramidal disease together — and it is worth naming.',
      },
      {
        question: 'An adult man has iron deficiency anaemia. What is the most important next step?',
        answer:
          'To find the source of blood loss, which in an adult MALE or a POSTMENOPAUSAL woman means the gastrointestinal tract until proved otherwise. Adult men have no physiological route of iron loss, so iron deficiency means bleeding, and the commonest serious cause is a right-sided colonic carcinoma, which bleeds occultly and presents with anaemia rather than with a change in bowel habit. The step is therefore UPPER GI ENDOSCOPY AND COLONOSCOPY — both, because a lesion found at one end does not exclude one at the other and dual pathology is well recognised — with duodenal biopsies for coeliac disease, plus stool for occult blood and for hookworm in endemic areas. Simply prescribing iron and rechecking the haemoglobin is the error: it treats the number, the haemoglobin rises, and the cancer is found later and larger.',
        examinerTip:
          '"Both ends, and biopsy the duodenum." Saying that you would scope despite a good response to iron is what the examiner is waiting for.',
      },
    ],
  },

  {
    id: 'pyrexia_tb_proforma',
    title: 'Prolonged Fever and Pulmonary Tuberculosis',
    system: 'General Medicine',
    department: 'Infectious Disease / General Medicine',
    summary:
      'The fever long case, which in India is tuberculosis until proved otherwise. Covers the fever pattern and what each pattern means, the systematic search for a focus, the diagnosis of tuberculosis under the current programme, and the treatment regimens with their monitoring.',
    examPearl:
      'Characterise the FEVER PATTERN and the associated symptoms before reaching for investigations. Evening rise with night sweats and weight loss is tuberculosis; a stepladder rise with relative bradycardia is typhoid; and paroxysms with rigors every 48 hours is malaria. The chart at the end of the bed is part of the examination.',
    diagramPath: '/diagrams/pharmacology/antitubercular_drugs_ripe_moa.jpg',
    diagramTitle: 'Antitubercular drugs: RIPE and their mechanisms',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'The fever',
            description: 'Fully characterised, because the pattern is diagnostic.',
            checklist: [
              'Duration, onset, and whether it is continuous, intermittent or remittent',
              'DIURNAL VARIATION — EVENING RISE is the tuberculosis pattern and is asked in those words',
              'Grade; documented or subjective; whether it is associated with CHILLS and RIGORS (pyogenic infection, malaria, urinary sepsis)',
              'PERIODICITY — every 48 hours (tertian) or 72 hours (quartan) in malaria',
              'STEPLADDER rise over the first week with relative bradycardia — typhoid',
              'Response to antipyretics and to any antibiotics already taken — and a partially treated fever is its own problem',
              'NIGHT SWEATS — drenching enough to change clothing',
              'LOSS OF WEIGHT (quantified) and LOSS OF APPETITE',
            ],
          },
          {
            label: 'The search for a focus, system by system',
            description: 'Every system asked about, because the fever case is a case of finding where it comes from.',
            checklist: [
              'RESPIRATORY: COUGH and its duration, sputum (amount, colour, foul smell, three-layered), HAEMOPTYSIS, chest pain, breathlessness',
              'A cough of more than 2 WEEKS is the programmatic trigger for tuberculosis evaluation in India',
              'Urinary: burning, frequency, loin pain, haematuria',
              'Gastrointestinal: pain, diarrhoea, dysentery, jaundice, abdominal distension',
              'CNS: headache, vomiting, neck stiffness, altered sensorium, seizures',
              'Skin and soft tissue: boils, cellulitis, ulcer, an infected wound',
              'Joints: pain, swelling; back pain and spinal tenderness',
              'ENT and dental: sore throat, earache, toothache, sinusitis',
              'Lymph nodes: any swelling noticed, especially in the neck',
              'CONTACT with an open case of TUBERCULOSIS; contact with a similar illness; TRAVEL history',
              'Risk: HIV status, diabetes, steroids and immunosuppression, malignancy, alcohol, smoking, malnutrition, intravenous drug use',
              'PREVIOUS ANTITUBERCULAR TREATMENT — the drugs, the duration, and whether COMPLETED. This decides whether it is a new or a previously treated case and therefore the regimen and the drug resistance risk',
              'BCG scar; occupational and animal exposure; overcrowding at home',
            ],
            clinicalSign:
              'A previously treated patient who defaulted is the commonest route to drug resistance. Ask about past treatment in every fever case, and ask whether it was finished, not merely whether it was taken.',
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'General and the focus',
            description: 'Looking for the source in every system.',
            checklist: [
              'TEMPERATURE recorded and CHARTED; pulse rate related to it — RELATIVE BRADYCARDIA (Faget sign) in typhoid',
              'Built and nourishment; BMI — weight loss is objective evidence',
              'Pallor; LYMPHADENOPATHY in all groups — in tuberculosis the nodes are MATTED and may be non-tender, and may form a cold abscess or a discharging sinus',
              'BCG scar; clubbing (bronchiectasis, lung abscess, empyema, endocarditis, malignancy)',
              'Rash: rose spots (typhoid), petechiae (dengue, meningococcaemia), the stigmata of endocarditis',
              'Oral cavity, teeth, throat, ears and sinuses',
              'RESPIRATORY: apical crackles, bronchial breathing, signs of consolidation, PLEURAL EFFUSION (stony dull, absent breath sounds), cavitation, fibrosis with tracheal shift',
              'CVS: murmurs — an unexplained fever with a murmur is infective endocarditis until blood cultures say otherwise',
              'ABDOMEN: hepatomegaly, SPLENOMEGALY (malaria, typhoid, kala-azar, endocarditis, lymphoma), ascites, a right iliac fossa mass, tenderness',
              'CNS: neck stiffness, Kernig and Brudzinski signs, focal deficit, fundus for papilloedema, choroid tubercles and Roth spots',
              'Joints and spine: tenderness, gibbus, restricted movement',
              'Per rectal and genital examination; breast examination',
            ],
          },
        ],
      },
      {
        title: '3. Investigations and Management',
        items: [
          {
            label: 'Investigations',
            description: 'Staged: the basics, then the targeted, then the invasive.',
            checklist: [
              'Complete blood count with differential; peripheral smear FOR MALARIAL PARASITE and rapid antigen test',
              'ESR and C-reactive protein; procalcitonin where available',
              'BLOOD CULTURE — three sets from different sites before antibiotics, and held for 2 weeks if endocarditis is suspected',
              'Urine routine and CULTURE; renal and liver function; blood sugar; HIV with counselling',
              'Widal or, better, blood culture for typhoid; dengue NS1 and serology; scrub typhus and leptospirosis serology by region',
              'CHEST X-RAY — upper lobe infiltrate, cavitation, fibrosis, miliary mottling, pleural effusion, hilar lymphadenopathy',
              'SPUTUM for AFB, and CBNAAT / Xpert MTB-RIF — which is now the FIRST-LINE diagnostic under the national programme and gives rifampicin resistance at the same time',
              'Sputum culture and drug susceptibility testing; line probe assay',
              'Gastric aspirate or induced sputum where the patient cannot expectorate; bronchoscopy with lavage',
              'FNAC of a lymph node with AFB stain, CBNAAT and histopathology',
              'Pleural or ascitic fluid: cell count, protein, ADA, AFB, CBNAAT, cytology',
              'Ultrasound abdomen, CECT chest and abdomen; echocardiography; bone marrow where indicated',
            ],
          },
          {
            label: 'Management of tuberculosis',
            description: 'Under the national programme, with the monitoring that goes with it.',
            checklist: [
              'DRUG-SENSITIVE pulmonary TB: INTENSIVE PHASE 2 months of isoniazid, rifampicin, pyrazinamide and ethambutol (HRZE), then CONTINUATION PHASE 4 months of HRE — daily, weight-band dosed, under the NTEP',
              'Extended continuation in CNS, skeletal and disseminated disease (total 9–12 months)',
              'PYRIDOXINE with isoniazid to prevent peripheral neuropathy',
              'STEROIDS in tuberculous meningitis and pericarditis',
              'DRUG-RESISTANT TB: regimens by the DST result, under a programme centre, never improvised',
              'MONITORING: sputum at the end of the intensive phase and at completion; weight at every visit; liver function if symptomatic or at risk; VISUAL ACUITY AND COLOUR VISION for ethambutol',
              'ADVERSE EFFECTS to warn about: hepatitis (all except ethambutol), peripheral neuropathy (isoniazid), optic neuritis (ethambutol), hyperuricaemia and arthralgia (pyrazinamide), orange discolouration of urine and drug interactions especially with oral contraceptives and antiretrovirals (rifampicin)',
              'HIV testing in every TB patient and ART started regardless of CD4 count, with attention to IRIS',
              'Nutritional support — Nikshay Poshan Yojana',
              'CONTACT TRACING and screening of household contacts; TB preventive therapy for eligible contacts',
              'Notification of every case — a legal requirement',
              'Infection control: cough etiquette, ventilation, masks',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Why has CBNAAT replaced sputum microscopy as the first test?',
        answer:
          'Because smear microscopy needs around 10,000 bacilli per millilitre to be positive, so it misses a large proportion of cases — particularly in children, in people with HIV, and in extrapulmonary disease — and it says nothing at all about drug resistance. CBNAAT (Xpert MTB-RIF) is a cartridge-based nucleic acid amplification test that detects Mycobacterium tuberculosis DNA down to about 130 bacilli per millilitre, gives a result in under two hours, and SIMULTANEOUSLY detects mutations in the rpoB gene that confer RIFAMPICIN RESISTANCE, which is the surrogate marker for multidrug resistance. That means a patient can be started on the correct regimen on the same day rather than waiting six to eight weeks for a culture. Its limitation is that it cannot distinguish live from dead bacilli, so it is not used to monitor treatment response — smear and culture are used for that.',
        examinerTip:
          'The rifampicin resistance result in two hours is the point. And say why it cannot be used for follow-up.',
      },
      {
        question: 'A patient on antitubercular therapy develops jaundice. What do you do?',
        answer:
          'Stop ALL antitubercular drugs immediately and confirm drug-induced hepatitis with liver function tests, while excluding viral hepatitis, alcohol and biliary obstruction. The threshold to stop is transaminases above five times the upper limit without symptoms, or above three times WITH symptoms, or any significant rise in bilirubin. If the patient is seriously ill and cannot be left untreated, bridge with a non-hepatotoxic regimen — ethambutol, levofloxacin and an injectable such as streptomycin or amikacin. Wait for the liver function to normalise and symptoms to resolve, then REINTRODUCE the drugs sequentially, one at a time, a few days apart, with liver function checked before each addition: rifampicin first (least hepatotoxic of the three), then isoniazid, and pyrazinamide last — and if the hepatitis was severe, pyrazinamide is omitted altogether and the regimen extended. The commonest culprits are pyrazinamide, then isoniazid, then rifampicin.',
        examinerTip:
          'The reintroduction order — rifampicin, then isoniazid, then pyrazinamide — is exactly what is being tested.',
      },
    ],
  },
];
