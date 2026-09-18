/**
 * General Surgery long cases.
 *
 * From the long-case sheets the app's owner sent, cross-read against Bailey &
 * Love and SRB. The long case differs from the short case in what it is
 * testing: a short case asks whether you can examine a lump, and a long case
 * asks whether you can build a diagnosis, a differential and a plan out of a
 * whole patient. So these carry the full history, the systemic examination and
 * the management — and, unlike the short cases, a staging section, because the
 * answer to "what would you do" in a malignancy case is always "stage it first".
 *
 * As in the other proforma files, the general examination is not repeated. It
 * is drawn once, with a photograph of each sign, from `generalExamSigns.ts`.
 */
import type { ClinicalProforma } from '@/lib/clinicalProformas';

export const SURGERY_LONG_PROFORMAS: ClinicalProforma[] = [
  {
    id: 'obstructive_jaundice_proforma',
    title: 'Obstructive Jaundice',
    system: 'General Surgery',
    department: 'HPB Surgery / General Surgery',
    summary:
      'A long case that is really a question about the level of the block and whether it is benign or malignant. Covers the history that separates a stone from a tumour, the Courvoisier gallbladder, the coagulopathy that makes these patients dangerous to operate on, and the pre-operative optimisation nobody remembers.',
    examPearl:
      'PAINLESS progressive jaundice with a PALPABLE, non-tender gallbladder is a periampullary malignancy; PAINFUL fluctuating jaundice with fever and rigors is a stone. That one sentence is the whole case, and Courvoisier law is the reason.',
    diagramPath: '/diagrams/clinical/cirrhosis_portal_hypertension.jpg',
    diagramTitle: 'Hepatobiliary anatomy and the consequences of obstruction',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'Jaundice',
            description: 'Its behaviour over time is what names the cause.',
            checklist: [
              'Duration; onset insidious or acute',
              'PROGRESSIVE and relentless — malignancy. FLUCTUATING or INTERMITTENT — a stone, or a periampullary carcinoma that sloughs (silver-stool sign)',
              'DARK URINE (high coloured, tea-coloured) — conjugated bilirubin being excreted renally',
              'CLAY-COLOURED or PUTTY-COLOURED STOOLS — no bile reaching the gut. Ask whether the stool floats (steatorrhoea)',
              'PRURITUS — itching all over, often worse at night, with scratch marks. May PRECEDE the jaundice',
              'Associated pain, fever with chills and rigors (cholangitis), and vomiting',
            ],
            clinicalSign:
              'Charcot triad — jaundice, fever with rigors and right upper quadrant pain — is acute cholangitis. Add hypotension and altered sensorium and it is Reynolds pentad, which is an emergency needing urgent biliary drainage.',
          },
          {
            label: 'Pain and the rest of the history',
            description: 'SOCRATES, and then the features that point at a tumour.',
            checklist: [
              'Site (right hypochondrium, epigastrium), onset, character (colicky in stones, dull boring in carcinoma head of pancreas)',
              'RADIATION TO THE BACK, relieved by leaning forward — carcinoma of the head of the pancreas',
              'Relation to fatty meals; aggravating and relieving factors',
              'LOSS OF WEIGHT AND APPETITE — present and marked in malignancy, absent in a simple stone',
              'Vomiting; haematemesis and melaena (a bleeding periampullary tumour, or gastric outlet involvement)',
              'Abdominal distension and a lump felt by the patient',
              'BLEEDING TENDENCY — bruising, bleeding gums, epistaxis. Fat-soluble vitamin K is not absorbed without bile',
              'Recent onset DIABETES in an older patient — carcinoma of the pancreas',
              'Past: previous biliary colic, cholecystectomy, ERCP, hepatitis, blood transfusion, tattooing, IV drug use, alcohol',
              'Drug history — drugs causing cholestasis; family history of gallstones',
            ],
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'General — beyond PICCLE',
            description: 'The specific findings of long-standing biliary obstruction.',
            checklist: [
              'Deep icterus, best seen in daylight; SCRATCH MARKS of pruritus',
              'Signs of weight loss: temporal wasting, loose skin, cachexia',
              'Anaemia; bruising and petechiae from the coagulopathy',
              'Stigmata of CHRONIC LIVER DISEASE — to separate a surgical from a medical jaundice: spider naevi, palmar erythema, gynaecomastia, testicular atrophy, loss of body hair, Dupuytren, asterixis, caput medusae',
              'LEFT SUPRACLAVICULAR NODE (Virchow) — Troisier sign',
              'Sister Mary Joseph nodule at the umbilicus',
              'Pedal oedema; temperature',
            ],
          },
          {
            label: 'Abdomen',
            description: 'Inspection, palpation, percussion, auscultation — and per rectum.',
            checklist: [
              'Inspection: distension, flank fullness, dilated veins and the DIRECTION of flow, visible lump, scars, umbilicus',
              'Palpation: superficial for tenderness and guarding, then deep',
              'LIVER — size in the midclavicular line, surface, margin, consistency, tenderness, and whether pulsatile',
              'GALLBLADDER — palpable as a globular, smooth, non-tender swelling below the tip of the ninth costal cartilage, moving with respiration, that you CANNOT get above',
              'Murphy sign; spleen; kidneys by ballottement',
              'Any other lump — site, size, plane, mobility, relation to respiration',
              'Percussion: liver span, shifting dullness, fluid thrill',
              'Auscultation: bowel sounds, bruits',
              'PER RECTAL examination — for a rectal shelf, and to see the stool colour with your own eyes rather than take the history for it',
              'Hernial orifices; external genitalia; supraclavicular nodes again',
            ],
            clinicalSign:
              'A palpable gallbladder that is NOT tender in the presence of jaundice is the Courvoisier gallbladder, and it means a malignant obstruction.',
          },
        ],
      },
      {
        title: '3. Investigations and Management',
        items: [
          {
            label: 'Investigations',
            description: 'To confirm obstruction, find the level, find the cause, and stage it.',
            checklist: [
              'LIVER FUNCTION TESTS: conjugated hyperbilirubinaemia, ALKALINE PHOSPHATASE markedly raised (out of proportion to the transaminases), GGT raised, albumin low in chronic disease',
              'PROTHROMBIN TIME / INR — raised, and it CORRECTS with parenteral vitamin K in obstructive jaundice but not in hepatocellular failure. That is a bedside-level distinction worth naming',
              'Urine: bilirubin PRESENT, urobilinogen ABSENT in complete obstruction',
              'Complete blood count, renal function, electrolytes, blood sugar',
              'ULTRASOUND ABDOMEN — the first investigation: dilated intrahepatic and extrahepatic ducts, the level of the block, stones, a mass, liver secondaries',
              'MRCP — non-invasive road map of the whole biliary tree; the investigation of choice for the level',
              'CECT abdomen (pancreatic protocol) for staging a tumour and its resectability, especially vascular involvement',
              'ERCP — now mainly THERAPEUTIC (stone extraction, stenting, brushings for cytology) rather than diagnostic',
              'Endoscopic ultrasound with FNA; CA 19-9 in suspected pancreatic malignancy',
              'Upper GI endoscopy to see the periampullary region directly',
            ],
          },
          {
            label: 'Pre-operative optimisation — the part that is forgotten',
            description: 'These patients die of things unrelated to the operation itself.',
            checklist: [
              'VITAMIN K parenterally for several days, with fresh frozen plasma if the INR does not correct and surgery is urgent',
              'HYDRATION and forced diuresis — bile salts sensitise the kidney and HEPATORENAL SYNDROME is the classic post-operative death in obstructive jaundice',
              'Correct anaemia and hypoalbuminaemia; nutritional support',
              'Prophylactic antibiotics; control sepsis before any definitive procedure',
              'Consider pre-operative biliary drainage in cholangitis, severe malnutrition, or before neoadjuvant therapy — but routine pre-operative stenting increases infective complications and is not automatic',
              'Correct diabetes; assess cardiac and respiratory fitness',
            ],
          },
          {
            label: 'Definitive management',
            description: 'By cause, and the resectability question decides everything in malignancy.',
            checklist: [
              'CBD stone: ERCP with sphincterotomy and stone extraction; laparoscopic CBD exploration; open choledocholithotomy with T-tube drainage',
              'CARCINOMA HEAD OF PANCREAS / PERIAMPULLARY, resectable: Whipple pancreaticoduodenectomy',
              'Unresectable: palliation — endoscopic or percutaneous stenting, or a triple bypass (choledochojejunostomy, gastrojejunostomy, and a jejunojejunostomy)',
              'Cholangiocarcinoma: resection by Bismuth-Corlette type; hilar tumours may need hepatectomy',
              'Benign stricture: hepaticojejunostomy (Roux-en-Y)',
              'Coeliac plexus block for pain; pruritus managed with cholestyramine and biliary drainage',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'State Courvoisier law and its exceptions.',
        answer:
          'In a patient with obstructive jaundice, if the gallbladder is palpable and non-tender, the cause is unlikely to be a stone. The reasoning is that a gallbladder containing stones has usually been chronically inflamed and is fibrosed and shrunken, so it cannot distend; a gallbladder obstructed distally by a tumour is otherwise normal and distends freely. EXCEPTIONS (where the gallbladder IS palpable despite stones, or NOT palpable despite a tumour): double impaction — one stone in the cystic duct and another in the CBD; a stone forming de novo in the CBD with a healthy gallbladder; an oriental cholangiohepatitis; a mucocoele or empyema of the gallbladder; carcinoma of the gallbladder itself; a pancreatic tumour in a patient who ALSO has a fibrosed gallbladder; and a gallbladder that is simply not palpable because it is intrahepatic or the patient is obese.',
        examinerTip:
          'State the law in the negative, exactly as Courvoisier did — "unlikely to be a stone". Candidates who state it as a positive rule get caught on the exceptions.',
      },
      {
        question: 'Why does a patient with obstructive jaundice bleed, and how do you tell it apart from liver failure?',
        answer:
          'Bile salts are needed to absorb the fat-soluble vitamins, so in obstruction vitamin K is not absorbed and the vitamin K dependent clotting factors — II, VII, IX and X, with proteins C and S — are not carboxylated. The prothrombin time rises. The distinction from hepatocellular failure is made by giving PARENTERAL VITAMIN K: in obstructive jaundice the liver is working and the prothrombin time CORRECTS within about 24 to 48 hours, whereas in hepatocellular failure the synthetic function itself is lost and it does NOT correct, and fresh frozen plasma is then needed. Factor V is not vitamin K dependent, so a low factor V also points at hepatocellular disease.',
        examinerTip:
          'The vitamin K challenge is the answer. Mention factor V for the extra mark.',
      },
      {
        question: 'What is hepatorenal syndrome in this context and how is it prevented?',
        answer:
          'Acute kidney injury occurring in obstructive jaundice, classically after surgery, and historically the commonest cause of post-operative death in these patients. The mechanisms are endotoxaemia from gut bacterial translocation (bile salts normally bind endotoxin in the gut lumen, and without bile that is lost), a direct nephrotoxic effect of bile salts, reduced renal perfusion, and hypovolaemia. Prevention is the examinable part: adequate PRE-OPERATIVE HYDRATION with intravenous fluids started well before surgery, maintaining a good urine output with mannitol or a forced diuresis, avoiding nephrotoxic drugs including NSAIDs and aminoglycosides, prophylactic antibiotics, oral bile salts or lactulose to reduce endotoxaemia, and correcting the coagulopathy and nutrition.',
        examinerTip:
          '"Hydration before the knife" is the short answer, and endotoxaemia is the mechanism that explains why.',
      },
    ],
  },

  {
    id: 'ileocaecal_tb_proforma',
    title: 'Ileocaecal Tuberculosis and the Right Iliac Fossa Mass',
    system: 'General Surgery',
    department: 'GI Surgery / General Surgery',
    summary:
      'A right iliac fossa mass in an Indian medical school is ileocaecal tuberculosis, carcinoma caecum, appendicular lump or Crohn disease, and telling them apart is the whole case. Covers the constitutional history, the mass characteristics, and why the two commonest answers are treated completely differently.',
    examPearl:
      'The discriminator is the AGE and the CONSTITUTIONAL history. Evening rise of temperature, night sweats and weight loss with a vaguely mobile mass in a young patient is tuberculosis; an older patient with altered bowel habit, anaemia out of proportion, and a hard fixed mass is carcinoma caecum. Both need a tissue diagnosis before anything irreversible.',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'Abdominal pain and the mass',
            description: 'Colicky pain with a mass in the right iliac fossa.',
            checklist: [
              'Pain: site (right iliac fossa, periumbilical), onset, COLICKY character, relation to meals, relieved by vomiting or passage of flatus',
              'Duration; progression; and whether it has ever been severe enough to bring them to hospital',
              'Lump noticed by the patient — when, and whether it has changed in size',
              'Abdominal distension; borborygmi; visible peristalsis — the features of subacute obstruction',
              'Vomiting: timing, content, bilious or feculent',
              'ALTERNATING CONSTIPATION AND DIARRHOEA — the classic pattern of ileocaecal tuberculosis',
            ],
          },
          {
            label: 'The constitutional screen — which is the diagnosis',
            description: 'Asked in full, because these symptoms are what separate tuberculosis from carcinoma.',
            checklist: [
              'EVENING RISE OF TEMPERATURE — the specific question, not just "fever"',
              'NIGHT SWEATS, drenching enough to change clothing',
              'LOSS OF APPETITE and LOSS OF WEIGHT — quantified in kilograms or in belt notches',
              'Chronic cough, haemoptysis, chest pain — pulmonary focus',
              'CONTACT with an open case of tuberculosis, in the family or at work',
              'Previous antitubercular treatment — the drugs, the duration, and whether it was completed',
              'BCG scar; immunisation; HIV status where appropriate',
              'Bleeding per rectum, tenesmus, sense of incomplete evacuation — pointing instead at carcinoma',
              'Menstrual history; infertility — genital tuberculosis coexists',
            ],
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'General',
            description: 'Beyond PICCLE, the features of chronic infection and of malnutrition.',
            checklist: [
              'Built and nourishment — usually poorly built and poorly nourished',
              'Pallor; temperature chart',
              'GENERALISED LYMPHADENOPATHY, especially cervical — matted, non-tender nodes',
              'BCG scar over the left deltoid',
              'Chest examination for an active or healed pulmonary focus',
            ],
          },
          {
            label: 'Abdomen and the mass',
            description: 'The description of the mass is what carries the differential.',
            checklist: [
              'Inspection: distension, VISIBLE PERISTALSIS, fullness in the right iliac fossa, scars, dilated veins, umbilicus',
              'Palpation of the MASS: site, size, shape, surface, margins, consistency, tenderness',
              'MOBILITY — an ileocaecal tuberculous mass is typically vaguely felt, firm and somewhat mobile; a carcinoma is harder and more fixed',
              'Is it intra-abdominal or parietal — the LEG RAISING or head raising test (a parietal lump becomes MORE prominent, an intra-abdominal one less so)',
              'Is it retroperitoneal — the knee-elbow test',
              'Moves with respiration? Can you get above it? Is it ballottable?',
              'Free fluid: shifting dullness, fluid thrill — tuberculous ascites',
              'Doughy abdomen; rolled-up omentum felt as a transverse band',
              'Percussion over the mass — resonant if bowel is in front of it',
              'Auscultation: bowel sounds, exaggerated in subacute obstruction',
              'PER RECTAL examination — always, for a rectal shelf, for blood, and for the stool',
              'Hernial orifices; external genitalia; supraclavicular nodes',
            ],
            clinicalSign:
              'Free fluid WITH a right iliac fossa mass in a young patient shifts the diagnosis strongly towards abdominal tuberculosis.',
          },
        ],
      },
      {
        title: '3. Differential, Investigations and Management',
        items: [
          {
            label: 'Differential diagnosis of a right iliac fossa mass',
            description: 'Recited in order, with the discriminating feature for each.',
            checklist: [
              'ILEOCAECAL TUBERCULOSIS — young, constitutional symptoms, alternating bowel habit',
              'CARCINOMA CAECUM — older, anaemia out of proportion to the illness, occult blood, hard fixed mass',
              'APPENDICULAR LUMP — short history of a typical appendicitis 3–5 days earlier, tender mass',
              'CROHN DISEASE — perianal disease, fistulae, extraintestinal manifestations',
              'Amoeboma; actinomycosis; lymphoma; ileocaecal intussusception in a child',
              'Non-bowel: ovarian mass, undescended testis with tumour, iliac lymphadenopathy, psoas abscess, ectopic kidney, chondrosarcoma of the ilium',
            ],
          },
          {
            label: 'Investigations',
            description: 'Aimed at a tissue diagnosis, because the two commonest answers are treated oppositely.',
            checklist: [
              'Haemogram with ESR (raised in tuberculosis), differential count, blood grouping, blood sugar, urea, creatinine, electrolytes',
              'Urine routine; STOOL FOR OCCULT BLOOD',
              'Mantoux test; chest X-ray for a pulmonary focus',
              'Erect abdominal X-ray for air-fluid levels; enteroclysis',
              'BARIUM MEAL FOLLOW-THROUGH: the pulled-up subhepatic caecum, the obtuse ileocaecal angle, Stierlin sign (persistent narrow stream through the terminal ileum with failure to retain barium in the inflamed segment), Fleischner sign (the inverted umbrella sign of a thickened ileocaecal valve), and the String sign of Kantor',
              'CECT ABDOMEN: bowel wall thickening, necrotic mesenteric nodes, ascites, omental thickening',
              'COLONOSCOPY WITH BIOPSY — the key investigation. Ulcers are TRANSVERSE in tuberculosis and LONGITUDINAL in Crohn disease',
              'Histopathology: caseating epithelioid granulomas with Langhans giant cells; AFB stain; tissue TB-PCR (CBNAAT) and culture',
              'CEA where carcinoma is considered',
            ],
          },
          {
            label: 'Management',
            description: 'Medical, with surgery for the complications.',
            checklist: [
              'ANTITUBERCULAR THERAPY — the primary treatment: 2 months of HRZE followed by 4 months of HRE, extended to a total of 9–12 months in abdominal disease by many units',
              'Nutritional support; correct anaemia; treat worm infestation',
              'SURGERY only for complications: obstruction not relieved by ATT, perforation, massive bleeding, fistula, or an uncertain diagnosis',
              'Procedures: stricturoplasty, limited ileocaecal resection with ileocolic anastomosis, or a bypass in an unfit patient',
              'CARCINOMA CAECUM, in contrast, is treated by RIGHT HEMICOLECTOMY with ileotransverse anastomosis and adjuvant chemotherapy',
              'Never start antitubercular therapy on a right iliac fossa mass without trying for tissue — a missed carcinoma treated for six months with ATT is a preventable disaster',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'How do you differentiate intestinal tuberculosis from Crohn disease?',
        answer:
          'Clinically both give a young patient with abdominal pain, diarrhoea, weight loss and a right iliac fossa mass, so the distinction rests on the findings. TUBERCULOSIS: ulcers are TRANSVERSE (circumferential, following the lymphatics), the ileocaecal valve is incompetent and patulous, the caecum is contracted and pulled up, ascites is common, necrotic mesenteric lymph nodes are present on CT, granulomas are CASEATING, large and confluent and lie in the submucosa, AFB or TB-PCR may be positive, and there is often a pulmonary focus. CROHN: ulcers are LONGITUDINAL with a cobblestone mucosa, there are skip lesions, the valve is stenosed, PERIANAL disease and fistulae are characteristic, granulomas are NON-caseating, small and sparse, and there are extraintestinal manifestations. Where doubt persists, a therapeutic trial of antitubercular therapy with reassessment at 2–3 months is the accepted practice in India, because the cost of missing tuberculosis and giving immunosuppression is higher.',
        examinerTip:
          'Transverse versus longitudinal ulcers is the single most quotable difference. Perianal disease is the other.',
      },
      {
        question: 'Name the radiological signs of ileocaecal tuberculosis.',
        answer:
          'STIERLIN SIGN — the inflamed segment of terminal ileum and caecum fails to retain barium, so it appears as a narrow persistent stream with normal barium columns on either side. FLEISCHNER SIGN, the "inverted umbrella" sign — a widely patulous, thickened and gaping ileocaecal valve with a narrowed terminal ileum. STRING SIGN OF KANTOR — a persistent narrow string-like column of barium through a stenosed segment (also seen in Crohn disease). The pulled-up SUBHEPATIC CAECUM from fibrosis and shortening of the ascending colon, and loss of the normal acute ileocaecal angle so that it becomes obtuse. On CT, symmetrical ileocaecal thickening, necrotic mesenteric nodes with rim enhancement, omental caking, and ascites with high attenuation.',
        examinerTip:
          'Three named signs and the pulled-up caecum. That is the complete answer.',
      },
    ],
  },

  {
    id: 'pvd_buerger_proforma',
    title: 'Peripheral Vascular Disease and Critical Limb Ischaemia',
    system: 'General Surgery',
    department: 'Vascular Surgery',
    summary:
      'A young male smoker with rest pain and blackening of a toe is Buerger disease; an older diabetic or hypertensive with the same is atherosclerosis. Covers the claudication history, the full peripheral pulse examination, the bedside tests, and the one intervention that changes the disease.',
    examPearl:
      'In Buerger disease the single treatment that alters the course is STOPPING SMOKING ABSOLUTELY — not cutting down, not one a day. No drug, bypass or sympathectomy matters as much, and saying so is the answer to "what is the treatment".',
    diagramPath: '/diagrams/clinical/varicose_veins_trendelenburg.jpg',
    diagramTitle: 'Lower limb vascular examination',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'Pain — graded by Fontaine and Rutherford',
            description: 'Claudication first, then rest pain, then tissue loss.',
            checklist: [
              'INTERMITTENT CLAUDICATION: cramping pain in a muscle group on walking, relieved by REST WITHIN MINUTES without changing position',
              'CLAUDICATION DISTANCE — in metres, and whether it is shortening. This is the number that is followed',
              'Site of the pain localises the block: BUTTOCK and thigh — aortoiliac; CALF — femoropopliteal; FOOT — tibial and distal',
              'REST PAIN: burning pain in the forefoot and toes, WORSE AT NIGHT and on lying flat, RELIEVED BY HANGING THE LEG OUT OF BED or sleeping in a chair — because gravity helps perfusion',
              'Tissue loss: ulceration, blackening of a toe, gangrene, non-healing wound',
              'FONTAINE stages: I asymptomatic, II claudication (IIa over 200 m, IIb under 200 m), III rest pain, IV ulceration or gangrene',
            ],
            clinicalSign:
              'Rest pain relieved by dependency is what distinguishes ischaemic rest pain from a neuropathic or nocturnal cramp, and it is worth asking in exactly those words.',
          },
          {
            label: 'The history that names the disease',
            description: 'Buerger versus atherosclerosis versus embolism.',
            checklist: [
              'SMOKING — how many, for how many years, and in what form (beedi, cigarette, chewing). Quantify in pack-years',
              'Age at onset: under 45 with heavy smoking — Buerger (thromboangiitis obliterans)',
              'DIABETES, hypertension, dyslipidaemia, ischaemic heart disease, stroke — the atherosclerotic risk profile',
              'MIGRATORY SUPERFICIAL THROMBOPHLEBITIS — a recurrent tender red cord in a superficial vein; classic in Buerger and often precedes the arterial disease',
              'Raynaud phenomenon; upper limb claudication',
              'SUDDEN onset with the six Ps — embolism; ask about atrial fibrillation, recent myocardial infarction, valve disease',
              'Impotence with buttock claudication — Leriche syndrome (aortoiliac occlusion)',
              'Trauma; previous vascular intervention; family history',
            ],
          },
        ],
      },
      {
        title: '2. Examination — both limbs, compared',
        items: [
          {
            label: 'Inspection',
            description: 'From the groin to the toenails, and both sides together.',
            checklist: [
              'Colour: pallor, dusky red (dependent rubor), cyanosis, BLACKISH DISCOLOURATION of a digit',
              'Extent and line of demarcation of GANGRENE, and whether it is dry (mummified, well demarcated) or wet (swollen, blistered, foul, spreading)',
              'Trophic changes: shiny atrophic skin, LOSS OF HAIR, thickened brittle nails, wasting of the calf and small muscles of the foot',
              'ULCER — site (tips of toes, heel, over pressure points and malleoli in ischaemia; plantar over the metatarsal heads in a neuropathic diabetic foot), size, edge, floor, base, discharge, surrounding skin',
              'Guttering of the veins on elevation',
              'Interdigital clefts and the heel — looked at deliberately; they are where the ulcer hides',
              'Scars of previous surgery; oedema',
            ],
          },
          {
            label: 'Palpation and the bedside tests',
            description: 'All pulses, both sides, and then the named tests.',
            checklist: [
              'TEMPERATURE with the back of the hand, comparing the two limbs and moving proximally to find the level of change',
              'CAPILLARY REFILLING TIME at the pulp and nail bed — normal under 2–3 seconds',
              'ALL PERIPHERAL PULSES, both limbs: femoral, popliteal, posterior tibial, dorsalis pedis — and the abdominal aorta, subclavian, brachial, radial and ulnar',
              'Grade each as normal, feeble or absent, and name the LEVEL of the block from the highest absent pulse',
              'BUERGER TEST: elevate the limb to 45° — the angle at which pallor appears is the BUERGER ANGLE (under 20° means severe ischaemia). Then hang the leg down — delayed filling with a dusky red reactive hyperaemia is a positive BUERGER POSTURAL TEST',
              'ALLEN TEST for the hand; the cold and warm water test',
              'Movements of the joints of the limb adjacent to the gangrenous part, and sensation — both are lost late and their loss means the limb is threatened',
              'Auscultate for BRUITS over the aorta, iliac, femoral and popliteal arteries',
              'Examine the CVS fully: rhythm (atrial fibrillation), murmurs, and blood pressure in both arms',
            ],
            clinicalSign:
              'A limb that is pale, pulseless, painful, paraesthetic, paralysed and perishingly cold — the six Ps — is acute limb ischaemia and is an emergency measured in hours, not days.',
          },
        ],
      },
      {
        title: '3. Investigations and Management',
        items: [
          {
            label: 'Investigations',
            description: 'Non-invasive first, angiography when intervention is planned.',
            checklist: [
              'ANKLE BRACHIAL PRESSURE INDEX: normal 0.9–1.2; claudication 0.5–0.9; rest pain under 0.5; critical ischaemia under 0.3. FALSELY HIGH (above 1.3) in diabetics and in chronic kidney disease because of calcified incompressible vessels — use the toe-brachial index instead',
              'DUPLEX ULTRASOUND of the arterial tree — site, extent and flow',
              'CT or MR ANGIOGRAPHY; digital subtraction angiography as the gold standard when intervention is planned',
              'Blood sugar and HbA1c, lipid profile, renal function, haemogram, ESR, homocysteine',
              'ECG and echocardiography where embolism is suspected',
              'Wound swab for culture; X-ray of the foot for osteomyelitis and gas',
            ],
          },
          {
            label: 'Management',
            description: 'Risk factor control, then revascularisation, then amputation as failure.',
            checklist: [
              'ABSOLUTE CESSATION OF SMOKING — the only measure that alters the natural history of Buerger disease, and it must be stated as absolute',
              'Supervised EXERCISE PROGRAMME for claudication — it develops collaterals and is genuinely effective',
              'Antiplatelet (aspirin or clopidogrel), a statin, and control of diabetes and hypertension',
              'Cilostazol for claudication; analgesia for rest pain',
              'FOOT CARE: daily inspection, well-fitting footwear, never barefoot, treat fungal infection, careful nail cutting — and this is taught, not mentioned',
              'REVASCULARISATION: angioplasty with or without stenting for short segment disease; bypass grafting (femoropopliteal, femorodistal, aortobifemoral) with reversed saphenous vein or PTFE',
              'Lumbar sympathectomy — limited role; may help rest pain and superficial ulceration where no reconstruction is possible',
              'AMPUTATION for spreading wet gangrene, uncontrolled sepsis, intractable rest pain or an unsalvageable limb — at the lowest level that will heal',
              'In acute ischaemia: heparinise immediately, and embolectomy or thrombolysis within the golden 6 hours',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'How does Buerger disease differ from atherosclerotic peripheral vascular disease?',
        answer:
          'BUERGER (thromboangiitis obliterans): young, typically male, under 45, an invariable and heavy SMOKER; it is a segmental, non-atheromatous, inflammatory panarteritis with thrombosis that affects SMALL AND MEDIUM vessels — the distal arteries of the limbs — and characteristically involves the UPPER limbs as well; MIGRATORY THROMBOPHLEBITIS and Raynaud phenomenon are associated; the proximal pulses are normal and the distal are absent; angiography shows abrupt segmental occlusions with tortuous CORKSCREW COLLATERALS around them and normal proximal vessels; and there is no calcification. ATHEROSCLEROSIS: older, with diabetes, hypertension and dyslipidaemia; affects LARGE and medium vessels, typically at bifurcations; calcification is seen; the coronary and carotid circulations are involved; and it is not reversed by stopping smoking, although smoking still accelerates it.',
        examinerTip:
          'Upper limb involvement and migratory thrombophlebitis are the two Buerger features that atherosclerosis never gives you.',
      },
      {
        question: 'What is the significance of a falsely high ABPI?',
        answer:
          'An ABPI above 1.3 does not mean a good circulation — it means the vessel could not be compressed. Medial calcific sclerosis (Mönckeberg sclerosis) of the tibial arteries, which is common in DIABETICS and in chronic kidney disease, makes the vessel wall rigid, so the cuff cannot occlude it and an artificially high pressure is recorded. A diabetic with a critically ischaemic foot can therefore have a "normal" or high ABPI, and treating that number rather than the foot is how limbs are lost. Where this is suspected, use the TOE-BRACHIAL INDEX — digital vessels are usually spared — or the arterial waveform on Doppler, transcutaneous oxygen measurement, or duplex.',
        examinerTip:
          'This is the commonest ABPI question and the answer the examiner wants is "the artery is calcified and incompressible".',
      },
      {
        question: 'Dry versus wet gangrene.',
        answer:
          'DRY gangrene follows gradual arterial occlusion with the venous drainage intact, so the tissue desiccates and mummifies: it is dry, shrivelled, black, with a clear LINE OF DEMARCATION separating it from viable tissue, there is little or no infection, the smell is minimal, and it may auto-amputate. It is the gangrene of chronic peripheral vascular disease. WET gangrene follows occlusion of BOTH arterial and venous supply, or occurs where infection supervenes — typically in a diabetic foot or in strangulated bowel: the part is swollen, blistered, discoloured, moist and foul-smelling, the demarcation is indistinct, crepitus may be present, and it spreads rapidly with systemic toxaemia. Wet gangrene is a surgical EMERGENCY requiring urgent debridement or amputation and antibiotics; dry gangrene can be managed conservatively while the limb is optimised.',
        examinerTip:
          'The line of demarcation is the bedside discriminator, and "emergency versus not" is what the distinction is for.',
      },
    ],
  },
];
