/**
 * Paediatric case proformas.
 *
 * From the paediatric case-proforma set the app's owner sent. Two things in
 * those sheets are unlike every adult proforma in this repo, and both are kept
 * here because dropping them is how a paediatric case gets marked down:
 *
 * 1. The INFORMANT and their RELIABILITY are recorded at the top. A child's
 *    history is somebody else's account of it, and who gave it and how well
 *    they know the child is part of the data, not clerical detail.
 *
 * 2. The antenatal, natal, postnatal, developmental, immunisation and dietary
 *    histories are a section of their own and are as long as the presenting
 *    complaint. In an adult these are a line; in a child they are frequently
 *    the diagnosis.
 *
 * As in the other proforma files the general examination is not repeated — it
 * is drawn once, with a photograph of each sign, from `generalExamSigns.ts` —
 * but the paediatric ADDITIONS to it (anthropometry, development, the anterior
 * fontanelle) are here, because those genuinely are different in a child.
 */
import type { ClinicalProforma } from '@/lib/clinicalProformas';

export const PAEDIATRIC_PROFORMAS: ClinicalProforma[] = [
  {
    id: 'paed_history_proforma',
    title: 'Paediatric History and Examination — the Master Framework',
    system: 'Pediatrics',
    department: 'Pediatrics',
    summary:
      'The framework behind every paediatric case: the informant, the birth and developmental histories that adults do not have, the immunisation record, the dietary history, and the anthropometry that turns "looks thin" into a number.',
    examPearl:
      'PLOT the child on a growth chart and CLASSIFY the malnutrition before you present anything else. "Poorly nourished" is an impression; weight-for-height below minus 3 SD with a mid-arm circumference under 11.5 cm is severe acute malnutrition, and it changes the management on the spot.',
    diagramPath: '/diagrams/community/growth_chart_road_to_health.jpg',
    diagramTitle: 'Growth chart — road to health',
    sections: [
      {
        title: '1. Patient Particulars and the Informant',
        items: [
          {
            label: 'Particulars',
            description: 'More than in an adult, and each item is used.',
            checklist: [
              'Name, age (in months under 3 years), sex',
              'Education and schooling; birth order; consanguinity of the parents',
              'Address; socioeconomic status by the modified Kuppuswamy or BG Prasad scale',
              'Date of admission and date of examination',
              'INFORMANT — who gave the history, and their relationship to the child',
              'RELIABILITY of the informant — stated explicitly. A history from a grandmother who sees the child weekly is not the same evidence as one from the mother',
            ],
          },
          {
            label: 'Presenting complaint and its history',
            description: 'In the informant’s words, with durations, in chronological order.',
            checklist: [
              'Each complaint with its duration, listed in order of appearance rather than of severity',
              'For each: onset, duration, progression, aggravating and relieving factors, associated symptoms',
              'FEVER: duration, grade, diurnal variation, chills, associated irritability, inconsolable crying, convulsions',
              'VOMITING: number of episodes, content, bilious or non-bilious, projectile or not, blood-stained, relation to feeds',
              'DIARRHOEA: number of stools, consistency, blood or mucus, foul smell, and crucially HOW THE CHILD IS BETWEEN EPISODES',
              'Feeding: has the child continued to feed? Refusal of feeds in an infant is a danger sign',
              'ACTIVITY: apathy, decreased activity, altered behaviour — asked in these words, because a mother reports "not playing" long before any sign appears',
              'Urine output; the number of wet nappies in 24 hours',
            ],
            clinicalSign:
              'Refusal to feed, lethargy, and reduced urine output are the three the mother notices first and the three that matter most. Ask all three of every sick infant.',
          },
        ],
      },
      {
        title: '2. The Histories an Adult Case Does Not Have',
        items: [
          {
            label: 'Antenatal, natal and postnatal history',
            description: 'Taken trimester by trimester, exactly as the source sheet does.',
            checklist: [
              'FIRST TRIMESTER: when pregnancy was confirmed; fever with rash, excessive vomiting, exposure to radiation, regular drug intake, burning micturition, bleeding or leaking per vagina; folic acid intake; regular antenatal visits; scans',
              'SECOND TRIMESTER: month quickening was felt; headache, fever with rash, pedal oedema; iron and calcium supplements; tetanus toxoid; weight gain; scans',
              'THIRD TRIMESTER: hypertension, diabetes, oedema, decreased fetal movements; antenatal steroids',
              'NATAL: place of delivery (hospital or home), term or preterm, mode (normal, instrumental, caesarean and its indication), presentation, duration of labour, PROM',
              'CRIED IMMEDIATELY AFTER BIRTH? Resuscitation needed? APGAR if known — this is the birth asphyxia question',
              'BIRTH WEIGHT; NICU admission and why; duration of stay',
              'POSTNATAL: neonatal jaundice and whether phototherapy or exchange transfusion was needed; convulsions, sepsis, feeding difficulty, cyanosis',
            ],
          },
          {
            label: 'Developmental history',
            description: 'Four domains, with the milestone ages, and whether any have regressed.',
            checklist: [
              'GROSS MOTOR: head control 3 months, sits with support 5 months, sits without support 6–8 months, stands with support 9 months, walks alone 12–15 months, runs 18 months, climbs stairs 2 years',
              'FINE MOTOR: reaches for object 4 months, transfers hand to hand 6 months, immature pincer 9 months, mature pincer 12 months, tower of 3 cubes 18 months',
              'LANGUAGE: coos 2 months, monosyllables 6 months, bisyllables 9 months, first words with meaning 12 months, two-word sentences 2 years',
              'SOCIAL AND ADAPTIVE: social smile 2 months, recognises mother 3 months, stranger anxiety 6–8 months, waves bye 9 months, feeds self 15–18 months, toilet trained 2–3 years',
              'Is development APPROPRIATE, DELAYED, or has there been REGRESSION? Regression is a different and more serious category and must be stated separately',
              'Current developmental age in each domain, and the developmental quotient',
              'School performance where applicable',
            ],
            clinicalSign:
              'Loss of an acquired milestone is REGRESSION, and it points at a neurodegenerative or metabolic disorder rather than at static cerebral palsy. Never record it merely as "delay".',
          },
          {
            label: 'Immunisation and dietary history',
            description: 'Against the national schedule, and the diet actually eaten.',
            checklist: [
              'IMMUNISATION — checked against the card, not from memory, and recorded as up to date for age or not',
              'National schedule: BCG, OPV-0 and hepatitis B at birth; pentavalent, OPV and rotavirus at 6, 10 and 14 weeks; measles-rubella at 9 months; DPT and OPV boosters',
              'Any adverse event following immunisation; any optional vaccines given',
              'BCG SCAR — looked for on the left deltoid, since it is objective evidence',
              'BREASTFEEDING: exclusive or not, and for how long; when it was started after birth; prelacteal feeds',
              'WEANING: age at which complementary feeding started, and with what',
              'Current diet: a 24-hour recall, then calculated calories and protein against the requirement for age',
              'Feeding difficulty, food fads, pica',
            ],
          },
          {
            label: 'Past, family and social history',
            description: 'Including the questions asked only in paediatrics.',
            checklist: [
              'Similar complaints in the past; previous hospitalisation, surgery or blood transfusion',
              'Tuberculosis, and CONTACT with an open case in the household',
              'FAMILY: a three-generation pedigree; CONSANGUINITY — and its degree; sibling deaths and their ages and causes',
              'Similar illness in siblings; family history of asthma, atopy, epilepsy, developmental delay',
              'Housing, overcrowding, water supply, sanitation, cooking fuel',
              'Mother’s education and the primary caregiver',
            ],
          },
        ],
      },
      {
        title: '3. Examination — the paediatric additions',
        items: [
          {
            label: 'Anthropometry — measured, plotted, classified',
            description: 'Numbers, not impressions, and plotted on the chart in front of the examiner.',
            checklist: [
              'WEIGHT; LENGTH (under 2 years, lying) or HEIGHT (over 2 years, standing); HEAD CIRCUMFERENCE (occipitofrontal); CHEST CIRCUMFERENCE; MID-UPPER ARM CIRCUMFERENCE',
              'PLOT every one on the WHO or IAP growth chart and state the percentile or Z-score',
              'Expected weight = (age in years + 4) x 2 kg for 1–6 years; birth weight doubles by 5 months, triples by 1 year, quadruples by 2 years',
              'Head circumference exceeds chest circumference until about 9–12 months, after which they cross over',
              'Upper segment to lower segment ratio: 1.7 at birth, 1.3 at 3 years, 1.0 at 7 years',
              'CLASSIFY the nutrition: IAP, Gomez (weight for age), Waterlow (wasting and stunting), and the WHO SAM criteria',
              'SEVERE ACUTE MALNUTRITION: weight-for-height below −3 SD, or MUAC under 11.5 cm, or bilateral pitting pedal oedema — ANY ONE is enough',
            ],
          },
          {
            label: 'The general examination additions',
            description: 'On top of PICCKLE, which is drawn with its photographs elsewhere in the app.',
            checklist: [
              'ANTERIOR FONTANELLE — open or closed, and its size; normally closes at 12–18 months. SUNKEN in dehydration, BULGING in raised intracranial pressure. Feel it with the child sitting up and calm',
              'Posterior fontanelle — closes by 6–8 weeks',
              'Signs of DEHYDRATION: skin turgor over the abdomen, sunken eyes, dry tongue, capillary refill, activity level, and whether the child drinks eagerly or is unable to drink',
              'Signs of VITAMIN DEFICIENCY: rickets (craniotabes, frontal bossing, rachitic rosary, Harrison sulcus, widened wrists, bow legs), vitamin A (Bitot spot, xerosis), scurvy',
              'SAM features: visible severe wasting, loss of the buccal pad of fat, baggy-pants appearance, flaky-paint dermatosis, sparse hypopigmented hair, hepatomegaly',
              'Dysmorphic features; the BCG scar',
              'Vitals with AGE-APPROPRIATE normal ranges — a heart rate of 140 is normal in a neonate and alarming in a ten-year-old',
              'Blood pressure with a cuff covering two thirds of the upper arm',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Define severe acute malnutrition and say how you would manage it on day one.',
        answer:
          'SAM in a child of 6 to 59 months is defined by ANY ONE of: weight-for-height below −3 SD of the WHO standard; mid-upper arm circumference below 11.5 cm; or BILATERAL PITTING PEDAL OEDEMA. Day one management follows the WHO ten steps, and the first four are the ones that save the child: treat and prevent HYPOGLYCAEMIA (feed immediately, 10% dextrose if unable to feed), treat and prevent HYPOTHERMIA (keep warm, kangaroo care, cover the head), treat DEHYDRATION with ReSoMal given SLOWLY and orally — never standard ORS, because these children are sodium-overloaded and potassium-depleted — and correct ELECTROLYTES with potassium and magnesium while giving no iron in the first week. Then treat infection with broad-spectrum antibiotics even without signs, correct micronutrients, start cautious feeding with F-75, and only later move to catch-up growth with F-100 and add iron.',
        examinerTip:
          'The two traps are intravenous fluids and early iron. Say that you would avoid both and why: IV fluids precipitate heart failure, and iron feeds free radical injury and infection.',
      },
      {
        question: 'Why is the informant’s reliability recorded in a paediatric history?',
        answer:
          'Because in paediatrics the history is entirely second-hand: the patient cannot give it. Everything you will act on is somebody else’s observation, filtered through their understanding and their memory, so who that person is, how much time they actually spend with the child, and how consistent their account is are all part of the evidence. A history from a mother who has been with the child continuously is different data from one given by a neighbour who brought the child in, and a history that changes between tellings is itself a finding — in suspected non-accidental injury it may be the most important one. Recording it forces you to state how much weight the rest of the history can bear.',
        examinerTip:
          'Mention that an inconsistent or changing history is itself a red flag. That is what makes the field more than bureaucracy.',
      },
    ],
  },

  {
    id: 'paed_pem_proforma',
    title: 'Protein Energy Malnutrition — Marasmus and Kwashiorkor',
    system: 'Pediatrics',
    department: 'Pediatrics',
    summary:
      'The commonest paediatric long case in India. Covers the dietary and socioeconomic history, the anthropometric classification, the distinction between marasmus and kwashiorkor, and the WHO ten steps in the order they are done.',
    examPearl:
      'OEDEMA is what makes it kwashiorkor, and it must be BILATERAL and PITTING and start in the feet. A severely wasted child with oedema is marasmic kwashiorkor, which is the worst of the three and is often missed because the oedema hides the wasting and the weight looks better than the child is.',
    diagramPath: '/diagrams/pediatrics/pem_kwashiorkor_vs_marasmus.jpg',
    diagramTitle: 'PEM: kwashiorkor versus marasmus',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'Presenting complaints',
            description: 'Rarely "malnutrition" — the family brings a different complaint.',
            checklist: [
              'Failure to gain weight, or actual weight loss; the mother saying clothes have become loose',
              'SWELLING of the feet, then the legs, then the face and the whole body — the order matters',
              'Decreased activity, apathy, irritability, excessive crying, loss of interest in play',
              'Recurrent diarrhoea and recurrent respiratory infection',
              'Poor appetite — characteristic of kwashiorkor; a marasmic child is often ravenously hungry',
              'Change in the hair and the skin — colour change, falling hair, peeling skin',
              'Delayed milestones; not attending school',
            ],
          },
          {
            label: 'Dietary and social history — the cause',
            description: 'Taken in detail, because the treatment is largely this.',
            checklist: [
              'BREASTFEEDING: exclusive for how long, when stopped and WHY. Abrupt weaning at the birth of a sibling is the classic kwashiorkor story',
              'Prelacteal feeds; bottle feeding and its hygiene; dilution of formula to make it last',
              'Age at which complementary feeding started and with what — rice water and diluted cereal gruel are energy-poor and protein-poor',
              '24-HOUR DIETARY RECALL, then calories and protein calculated against the requirement for age and the DEFICIT stated as a percentage',
              'Food beliefs and taboos; foods withheld during illness — a major and correctable cause',
              'Number of siblings and the birth interval; the mother’s education; who feeds the child',
              'Income, ration card, access to the ICDS anganwadi and the mid-day meal',
              'Recurrent infection, tuberculosis contact, worm infestation, HIV exposure',
            ],
            clinicalSign:
              'Abrupt weaning when the next baby arrives is the classic kwashiorkor history, and the word kwashiorkor itself means "the sickness of the deposed child".',
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'Anthropometry and classification',
            description: 'Measured and classified, never described.',
            checklist: [
              'Weight, height or length, MUAC, head and chest circumference; all plotted',
              'WHO: SAM if weight-for-height below −3 SD, or MUAC under 11.5 cm, or bilateral pitting oedema. MAM between −2 and −3 SD, or MUAC 11.5–12.5 cm',
              'IAP classification by weight for age: grade I 71–80%, II 61–70%, III 51–60%, IV 50% or less of expected',
              'WELLCOME classification: 60–80% expected weight without oedema is undernutrition, with oedema is KWASHIORKOR; under 60% without oedema is MARASMUS, with oedema is MARASMIC KWASHIORKOR',
              'WATERLOW: weight for height measures WASTING (acute), height for age measures STUNTING (chronic)',
            ],
          },
          {
            label: 'Marasmus versus kwashiorkor at the bedside',
            description: 'The two pictures, and the overlap between them.',
            checklist: [
              'MARASMUS: severe wasting, "old man" or "monkey" facies, loss of the BUCCAL PAD OF FAT (lost last, so its loss means severe), BAGGY PANTS appearance of the buttocks, prominent ribs, visible bony landmarks, NO oedema, the child is ALERT and RAVENOUSLY HUNGRY, hair and skin are relatively preserved',
              'KWASHIORKOR: BILATERAL PITTING PEDAL OEDEMA, moon face, FLAKY PAINT DERMATOSIS (hyperpigmented patches that peel leaving raw depigmented skin), FLAG SIGN in the hair with alternating bands of colour, sparse easily pluckable hypopigmented hair, HEPATOMEGALY from fatty liver, APATHY and anorexia, muscle wasting with preserved subcutaneous fat',
              'MARASMIC KWASHIORKOR: features of both — severe wasting WITH oedema. The worst prognosis',
              'Look for associated: anaemia, vitamin A deficiency (Bitot spot, xerophthalmia, keratomalacia), rickets, scurvy, angular stomatitis, glossitis',
              'Signs of INFECTION — which is often hidden: a SAM child may have pneumonia or septicaemia with no fever, no cough and no leucocytosis',
              'Signs of dehydration — and note that skin turgor and sunken eyes are UNRELIABLE in severe wasting',
            ],
            clinicalSign:
              'Hypothermia and hypoglycaemia in a severely malnourished child are signs of INFECTION, not merely of cold and hunger. Treat both, and treat the infection.',
          },
        ],
      },
      {
        title: '3. Investigations and Management',
        items: [
          {
            label: 'Investigations',
            description: 'Few, and mostly looking for the hidden infection.',
            checklist: [
              'Haemogram with peripheral smear; blood sugar (hypoglycaemia is common and lethal)',
              'Serum electrolytes, calcium, magnesium, albumin, total protein',
              'Blood culture; urine routine and culture; chest X-ray',
              'Mantoux and gastric aspirate for AFB where tuberculosis is suspected',
              'Stool for ova, cysts and occult blood',
              'HIV testing with counselling; renal and liver function',
              'Serum albumin is LOW in kwashiorkor but is a poor marker of response — do not follow it',
            ],
          },
          {
            label: 'The WHO ten steps, in two phases',
            description: 'Stabilisation first, rehabilitation after, and the order is the examinable part.',
            checklist: [
              'STABILISATION (days 1–7): 1 treat/prevent HYPOGLYCAEMIA; 2 treat/prevent HYPOTHERMIA; 3 treat/prevent DEHYDRATION with ReSoMal, orally and slowly; 4 correct ELECTROLYTES — potassium and magnesium, restrict sodium; 5 treat INFECTION with broad-spectrum antibiotics even in the absence of signs',
              '6 correct MICRONUTRIENTS — vitamin A, zinc, folic acid, multivitamins, but NO IRON in the first week',
              '7 begin CAUTIOUS FEEDING with F-75, small frequent feeds, to maintain rather than to grow',
              'REHABILITATION (weeks 2–6): 8 achieve CATCH-UP GROWTH with F-100 or ready-to-use therapeutic food, and ADD IRON now; 9 provide sensory stimulation and emotional support; 10 prepare for FOLLOW-UP after discharge',
              'NEVER give routine intravenous fluids — the myocardium is compromised and fluid overload precipitates heart failure. IV fluids only for shock',
              'REFEEDING SYNDROME: watch for falling phosphate, potassium and magnesium as feeding starts',
              'Discharge criteria and follow-up; link to the anganwadi; counsel the mother on feeding, which is the only thing that prevents the next episode',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Why is iron withheld in the first week of treating severe acute malnutrition?',
        answer:
          'Because in severe malnutrition transferrin and other iron-binding proteins are depleted, so given iron circulates as FREE IRON. Free iron catalyses the production of hydroxyl free radicals through the Fenton reaction, worsening oxidative cell damage at the very moment the child is least able to withstand it, and free iron is also directly available to bacteria as a growth substrate, promoting sepsis — the leading cause of death in these children. Iron is therefore started only in the rehabilitation phase, once the child has a returning appetite, is gaining weight, and infection is controlled, at which point the binding proteins have recovered.',
        examinerTip:
          '"Free iron feeds bacteria and makes free radicals." Both halves, and it is the answer to why anaemia is not corrected first.',
      },
      {
        question: 'Why is ReSoMal used rather than standard ORS?',
        answer:
          'A severely malnourished child has a high TOTAL body sodium despite a low serum sodium, and a severe potassium and magnesium deficit, because the sodium-potassium pump is impaired. Standard WHO ORS contains too much sodium for such a child and would worsen sodium overload and precipitate cardiac failure, and it contains too little potassium to replace what is missing. ReSoMal (Rehydration Solution for Malnutrition) has a LOWER sodium (about 45 mmol/L rather than 75), a HIGHER potassium (about 40 mmol/L), and added magnesium, zinc and copper. It is given slowly by mouth or nasogastric tube — 5 ml/kg every 30 minutes for the first 2 hours, then 5–10 ml/kg/hour — with the child monitored for rising pulse and respiratory rate, which signal overload.',
        examinerTip:
          'Low sodium, high potassium. Then say the monitoring: a rising pulse and respiratory rate means stop.',
      },
    ],
  },

  {
    id: 'paed_neonatal_proforma',
    title: 'Neonatal Case — the Sick or Jaundiced Newborn',
    system: 'Pediatrics',
    department: 'Neonatology',
    summary:
      'The NICU case. Covers the antenatal and perinatal history in the detail a newborn case needs, gestational age assessment, the assessment of jaundice by zones, the danger signs of neonatal sepsis, and when jaundice stops being physiological.',
    examPearl:
      'Jaundice in the FIRST 24 HOURS is never physiological. It is haemolysis — Rh or ABO incompatibility, G6PD deficiency, sepsis — until proved otherwise, and it needs a bilirubin now, not a review tomorrow.',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'Antenatal and maternal',
            description: 'The mother’s pregnancy is the baby’s past history.',
            checklist: [
              'Maternal age, parity, BLOOD GROUP AND Rh, and the father’s Rh',
              'Booked or unbooked; number of antenatal visits; tetanus toxoid; iron, calcium and folic acid',
              'Maternal illness: anaemia, hypertension and pre-eclampsia, DIABETES, hypothyroidism, epilepsy, heart disease, tuberculosis',
              'INFECTIONS: fever with rash, urinary infection, vaginal discharge, and the TORCH screen; HIV, hepatitis B and VDRL status',
              'Drugs taken in pregnancy; radiation exposure; alcohol and tobacco',
              'Antenatal scans and any detected anomaly; antenatal steroids if preterm labour was threatened',
              'Consanguinity; previous neonatal deaths, previous baby with jaundice needing exchange transfusion, or with a congenital anomaly',
            ],
          },
          {
            label: 'Natal and postnatal',
            description: 'The first minutes and the first days.',
            checklist: [
              'Place of delivery; gestation in completed weeks; mode of delivery and indication',
              'Presentation; duration of labour; PROM and for how many hours; foul-smelling or meconium-stained liquor — the sepsis risk factors',
              'CRIED IMMEDIATELY? Time to first cry; need for resuscitation and what was done; APGAR at 1 and 5 minutes',
              'BIRTH WEIGHT, length and head circumference; classify as term or preterm and as AGA, SGA or LGA',
              'Passed urine within 24 hours and meconium within 48 hours — asked of every newborn',
              'FEEDING: time of first feed, breastfeeding established or not, adequacy, and weight change',
              'JAUNDICE: DAY OF ONSET (the single most important question), progression, and any treatment',
              'Any convulsion, apnoea, lethargy, refusal of feeds, abdominal distension, vomiting, temperature instability',
            ],
            clinicalSign:
              'Prolonged rupture of membranes beyond 18 hours, maternal fever, and foul liquor are the three risk factors that make you start sepsis screening in an otherwise well-looking baby.',
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'General and gestational age',
            description: 'In a warm environment, with the baby undressed but not chilled.',
            checklist: [
              'ACTIVITY, tone, posture, cry — a lethargic hypotonic newborn with a weak cry is septic until proved otherwise',
              'Temperature, heart rate, respiratory rate, oxygen saturation, capillary refill',
              'GESTATIONAL AGE by NEW BALLARD score — six neuromuscular and six physical criteria',
              'Plot weight, length and head circumference on the intrauterine growth chart; classify AGA, SGA or LGA',
              'RESPIRATORY DISTRESS: tachypnoea, grunting, nasal flaring, retractions; grade by the SILVERMAN-ANDERSEN score in a preterm and by the Downes score in a term baby',
              'Anterior fontanelle: normal, sunken or bulging',
              'Skin: vernix, lanugo, peeling, rashes, pustules, sclerema, petechiae',
              'Umbilicus: number of vessels, discharge, redness of the surrounding skin (omphalitis)',
              'Congenital anomalies: cleft lip or palate, spinal defect, imperforate anus, limb and digit anomalies, ambiguous genitalia',
              'Primitive reflexes: Moro, grasp, rooting, sucking, asymmetric tonic neck',
            ],
          },
          {
            label: 'Jaundice — assessed by zone',
            description: 'Looked at in daylight, blanching the skin with a finger.',
            checklist: [
              'DAY OF ONSET — recorded before anything else',
              'KRAMER ZONES, progressing cephalocaudally: zone 1 head and neck (about 4–6 mg/dL); zone 2 upper trunk to the umbilicus (about 8–9); zone 3 lower trunk and thighs (about 12); zone 4 arms and legs below the knee (about 15); zone 5 PALMS AND SOLES (over 15, and always significant)',
              'Blanch the skin with finger pressure in natural light and look at the blanched area',
              'Pallor (haemolysis), plethora (polycythaemia), hepatosplenomegaly, cephalhaematoma or bruising (a bilirubin load)',
              'Neurological signs of acute bilirubin encephalopathy: lethargy, poor feeding, high-pitched cry, hypertonia, retrocollis and opisthotonus, setting-sun sign, seizures',
              'Kramer zones ESTIMATE and never replace a serum bilirubin — they are for deciding whom to test',
            ],
          },
        ],
      },
      {
        title: '3. Diagnosis and Management',
        items: [
          {
            label: 'Physiological versus pathological jaundice',
            description: 'Five criteria, any one of which makes it pathological.',
            checklist: [
              'PATHOLOGICAL if: onset within the FIRST 24 HOURS; total bilirubin rising faster than 5 mg/dL per day (or 0.5 mg/dL per hour); total bilirubin above 15 mg/dL in a term baby; CONJUGATED (direct) bilirubin above 2 mg/dL or more than 20% of the total; or jaundice PERSISTING beyond 14 days in a term and 21 days in a preterm baby',
              'Also pathological: any jaundice with clinical illness, with pale stools and dark urine, or with hepatosplenomegaly',
              'PHYSIOLOGICAL: appears after 24 hours, peaks at day 3–5 in a term baby, unconjugated, and resolves by 10–14 days',
              'BREAST MILK jaundice (prolonged, well baby, from the end of the first week) is distinguished from BREASTFEEDING jaundice (early, from inadequate intake and dehydration — the treatment is more feeding, not less)',
            ],
          },
          {
            label: 'Investigations and treatment',
            description: 'The screen, and the thresholds.',
            checklist: [
              'Total and direct serum bilirubin; blood group and Rh of mother and baby; DIRECT COOMBS TEST',
              'Haemoglobin, packed cell volume, reticulocyte count, PERIPHERAL SMEAR for haemolysis',
              'G6PD assay — particularly in a male infant',
              'SEPSIS SCREEN: total and differential count, immature to total neutrophil ratio, micro-ESR, C-reactive protein, and BLOOD CULTURE',
              'Thyroid function and urine for reducing substances in prolonged jaundice',
              'PHOTOTHERAPY — plotted against the age in hours on the NNF or AAP nomogram, with the threshold lowered for prematurity and risk factors. Eyes and gonads covered, adequate hydration, temperature monitored',
              'EXCHANGE TRANSFUSION for levels above the exchange line, for rapid rise despite phototherapy, or for any sign of encephalopathy',
              'IVIG in immune haemolysis; treat sepsis; ensure adequate feeding',
              'Counsel the mother: continue breastfeeding, and follow up after discharge — a baby discharged at 48 hours has not yet reached the peak',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Why is jaundice in the first 24 hours always pathological?',
        answer:
          'Because physiological jaundice cannot appear that early. It depends on the normal postnatal fall in haemoglobin, the short lifespan of fetal red cells, immaturity of hepatic UDP-glucuronyl transferase and increased enterohepatic circulation — a combination that takes more than 24 hours to raise bilirubin to visible levels. Jaundice within the first 24 hours therefore means an accelerated bilirubin load, which in practice means HAEMOLYSIS: Rh isoimmunisation, ABO incompatibility, G6PD deficiency, hereditary spherocytosis, or congenital infection and sepsis. It requires an immediate serum bilirubin, blood group and Rh of mother and baby, a direct Coombs test, a peripheral smear and a reticulocyte count, and it is one of the few neonatal findings where "review tomorrow" is a wrong answer.',
        examinerTip:
          'Say "it has not had time to be physiological". That phrasing shows you understand the mechanism rather than the rule.',
      },
      {
        question: 'What is kernicterus and which babies are at risk at a lower bilirubin?',
        answer:
          'Kernicterus is the chronic, permanent sequel of bilirubin deposition in the basal ganglia, hippocampus and brainstem nuclei — choreoathetoid cerebral palsy, high-frequency sensorineural hearing loss, gaze palsy with impaired upward gaze, and dental enamel dysplasia. It follows acute bilirubin encephalopathy, which passes through a lethargic phase, then hypertonia with retrocollis, opisthotonus and a high-pitched cry, then apnoea and seizures. Free unconjugated bilirubin crosses the blood-brain barrier, so the risk is higher at a LOWER total bilirubin in babies who are PRETERM, acidotic, hypoxic, hypothermic, hypoglycaemic, septic, hypoalbuminaemic, or receiving drugs that displace bilirubin from albumin such as sulphonamides and ceftriaxone. That is exactly why the phototherapy and exchange thresholds are plotted against gestation and risk factors rather than being a single number.',
        examinerTip:
          'Name the four features of established kernicterus. Then say "free bilirubin", which is why albumin and displacing drugs matter.',
      },
    ],
  },
];
