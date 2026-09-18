/**
 * Orthopaedic case proformas, from the owner's own handwritten case sheets.
 *
 * `ortho_casesheets-1.pdf` is a CamScanner scan with no text layer, so the
 * first attempt at these was written from the standard sequence (Apley,
 * Maheshwari) and flagged as "his sheet wins if it differs". It has since been
 * read: the PDF embeds each page as a DCTDecode stream, a DCTDecode stream is a
 * JPEG verbatim, so the 22 pages were written out byte-for-byte and read as
 * images. The transcription is in `.agents/sources/proformas/`.
 *
 * These six are therefore built from the sheets rather than around them, and
 * they keep the things that are specifically HIS and would never come out of a
 * textbook:
 *
 * - **"No H/o native treatment / oil massage"** appears in both the non-union
 *   and the malunion sheet as an explicit negative. It is a real and common
 *   antecedent in Indian practice — a bone-setter's massage on a fresh fracture
 *   is a recognised route to malunion, non-union and compartment syndrome — and
 *   no Western text asks it.
 * - **Measurements in a two-column R/L table**, which is how the sheets record
 *   every limb, because a limb length means nothing except against the other.
 * - **The Kite (talo-calcaneal) angle** as the one number that matters on a
 *   CTEV film.
 *
 * As in every other proforma file here, the general examination is not
 * repeated — it is drawn once, with a photograph of each sign, from
 * `generalExamSigns.ts`. The sheets themselves write it as "No PICCLE", which
 * is the same shorthand.
 */
import type { ClinicalProforma } from '@/lib/clinicalProformas';

export const ORTHOPAEDIC_PROFORMAS: ClinicalProforma[] = [
  {
    id: 'ctev_proforma',
    title: 'CTEV — Congenital Talipes Equinovarus',
    system: 'Orthopaedics',
    department: 'Paediatric Orthopaedics',
    summary:
      'The commonest congenital orthopaedic long case. Covers the four components of the deformity, what has already been tried before the child reached you, the Kite angle, and the full ladder of correction from manipulation to triple arthrodesis by age.',
    examPearl:
      'Say the four components in order every time — CAVUS, ADDUCTUS, VARUS, EQUINUS — and then say whether the deformity is FLEXIBLE or RIGID. Ponseti correction follows that exact sequence, and equinus is corrected LAST, which is why the tenotomy comes at the end.',
    diagramPath: '/diagrams/orthopaedics/ctev_clubfoot_pirani_score.jpg',
    diagramTitle: 'CTEV: components, Pirani score and correction',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'Presenting complaint and the informant',
            description: 'A child’s history is somebody else’s account, so who gave it is part of the data.',
            checklist: [
              'Age of the child in months; sex; brought by whom, and THE RELIABILITY OF THE INFORMANT',
              '"Deformity in the __ leg since birth" — in the parent’s own words',
              'Which side, or both; noticed at birth or later, and by whom',
              'Whether the deformity has improved, stayed the same, or worsened',
            ],
          },
          {
            label: 'What has already been done — which is most of the history',
            description: 'Almost every CTEV case in an examination is a partially treated one.',
            checklist: [
              'Age at which treatment was started — the single strongest predictor of outcome',
              'MANIPULATION: by whom, how often, and was the mother taught to do it',
              'POP CASTS: when started, ABOVE-KNEE (Ponseti) or BELOW-KNEE (Kite), how many casts, changed how often, for how long in total',
              'Response: which side corrected, which did not',
              'TENOTOMY of the tendo-achilles — done or not',
              'SPLINT: CTEV splint, Dennis-Brown splint or CTEV shoes; for how many hours a day, and COMPLIANCE',
              'Any surgery, and what was done',
              'Why they have come now — relapse, residual deformity, or referral',
            ],
            clinicalSign:
              'Relapse after good initial correction is almost always a bracing-compliance problem, not a technical failure. Ask how many hours a day the brace was actually worn before you blame the surgery.',
          },
          {
            label: 'Antenatal, natal, developmental and family history',
            description: 'Exactly as the source sheet sets it out, and each item excludes something.',
            checklist: [
              'CONSANGUINITY of the parents',
              'ANTENATAL: no OLIGOHYDRAMNIOS (which causes postural, positional deformity), no TORCH infections, no MULTIPLE PREGNANCY, no drug exposure',
              'NATAL: term or preterm, mode of delivery, birth order, birth weight',
              'DEVELOPMENTAL history — attained as per age, or delayed',
              'IMMUNISATION — up to date for age',
              'FAMILY history of clubfoot or of any congenital deformity',
              'Ask about OTHER anomalies: spina bifida, arthrogryposis, DDH, torticollis — CTEV is frequently syndromic and the associated ones behave differently',
            ],
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'General — and the associated anomalies',
            description: 'Short, but the spine and the hips are examined in every case.',
            checklist: [
              'Alert and awake; no PICCLE (the general examination is drawn separately, with photographs)',
              'SPINE — no kyphosis or scoliosis; look for a dimple, tuft of hair or lipoma over the lumbosacral spine (spinal dysraphism)',
              'HIP JOINTS — examined in every CTEV child for developmental dysplasia (Ortolani, Barlow, Galeazzi)',
              'Other joints and the other limb',
              'Vitals; anthropometry',
            ],
          },
          {
            label: 'Inspection of the foot — the four components',
            description: 'Recorded joint by joint, as the sheet does.',
            checklist: [
              'ATTITUDE — Hip: neutral. Knee: flexed. ANKLE: EQUINUS, plantar flexion',
              'SUBTALAR joint: VARUS — the heel is inverted',
              'TALO-NAVICULAR joint: ADDUCTED (forefoot adduction)',
              'CAVUS — the high medial arch; the fourth component and the one most often forgotten',
              'MEDIAL BORDER: CONCAVE, with a DEEP CREASE present',
              'LATERAL BORDER: CONVEX, STRETCHED, with CALLOSITIES over the lateral malleolus in a walking child',
              'LATERAL MALLEOLUS and HEAD OF TALUS both PROMINENT',
              'Posterior crease; calf wasting; state of the sole (a walking child bears weight on the lateral border)',
              'Size of the foot and of the calf compared with the other side',
            ],
            clinicalSign:
              'Callosities on the lateral border and lateral malleolus mean the child has been WALKING on the deformity, which changes both the age and the surgical answer.',
          },
          {
            label: 'Palpation, movements and measurements',
            description: 'Flexible or rigid is the finding that decides everything.',
            checklist: [
              'Not warm, no tenderness; inspectory findings confirmed',
              'DEFORMITY — FLEXIBLE or RIGID. Attempt gentle passive correction of each component and record how far it goes',
              'ANKLE: plantarflexion (e.g. 40°); DORSIFLEXION restricted or not possible — record the degrees short of neutral',
              'SUBTALAR: inversion (e.g. 30°); EVERSION restricted',
              'TALONAVICULAR: abduction and adduction',
              'The NORMAL side recorded alongside — "adequate correction with 10° dorsiflexion"',
              'MEASUREMENTS in a two-column R/L table: thigh circumference, leg circumference, and limb length. Record the SHORTENING in centimetres',
              'DISTAL NEUROVASCULAR STATUS — named as its own step',
              'No lymphadenopathy; other joints normal; other limb normal',
              'Pirani or Dimeglio score where the unit uses one',
            ],
          },
        ],
      },
      {
        title: '3. Diagnosis, Investigations and Treatment',
        items: [
          {
            label: 'Diagnosis and radiology',
            description: 'One sentence, then the one angle that matters.',
            checklist: [
              'Format: "a case of [untreated / partially corrected / relapsed] CTEV of the __ foot, with shortening of the leg"',
              'X-RAY AP VIEW: TARSO-METATARSAL angle; talo-calcaneal angle (normally 20–40°, reduced in CTEV)',
              'X-RAY LATERAL VIEW: TALO-CALCANEAL ANGLE — the KITE ANGLE. Normally above 35°, and DECREASED in CTEV because the talus and calcaneum lie parallel',
              'Films are taken in maximum correction, and are of limited value under 3 months because the tarsal bones are unossified',
              'Ultrasound of the spine in an infant where dysraphism is suspected',
            ],
            clinicalSign:
              'Parallelism of the talus and calcaneum on the lateral film is the radiological essence of the deformity — they should diverge.',
          },
          {
            label: 'Non-operative treatment',
            description: 'Correction first, then maintenance. This is where almost all CTEV is cured.',
            checklist: [
              'MANIPULATION ALONE for minor deformity — dorsiflexion and eversion held for 5 seconds, repeated for 5 minutes, BY THE MOTHER, several times a day. Teaching her is the treatment',
              'MANIPULATION + POP for major deformity, started as early as possible',
              'KITE method — BELOW-KNEE cast',
              'PONSETI method — ABOVE-KNEE cast, changed weekly; corrects CAVUS, ADDUCTUS, VARUS in sequence, then percutaneous TENDO-ACHILLES TENOTOMY for the EQUINUS, then a further 3 weeks in cast',
              'MAINTENANCE: CTEV splints (plastic, moulded, tied with straps)',
              'DENNIS-BROWN SPLINT — until the child starts walking, worn 24 hours a day, then at night and naps until about 4 years',
              'CTEV SHOES during walking (under 5 years): straight inner border to prevent forefoot adduction; outer shoe raise to prevent inversion; NO HEEL to prevent equinus',
            ],
          },
          {
            label: 'Operative treatment — by age',
            description: 'The ladder from the sheet, and the age is what selects the rung.',
            checklist: [
              'POSTERO-MEDIAL SOFT TISSUE RELEASE (PMSTR)',
              'LIMITED SOFT TISSUE RELEASE — equinus: posterior release; adduction: medial release; cavus: plantar release',
              'TENDON TRANSFER (only after 5 years) — tibialis anterior tendon transfer for dynamic supination',
              'DWYER OSTEOTOMY — wedge osteotomy of the calcaneum, 3 years and above',
              'DILWYN EVANS procedure — PMSTR with calcaneo-cuboid fusion, 4–8 years',
              'WEDGE TARSECTOMY — 8–11 years; a wedge removed from the mid-tarsal area',
              'TRIPLE ARTHRODESIS — above 12 years; fusion of the subtalar, calcaneo-cuboid and talo-navicular joints',
              'ILIZAROV / JESS — neglected cases; gradual stretching by external fixation. JESS differential distraction: MEDIAL 1 mm and LATERAL 0.5 mm per day, 1–4 years, pin size 4.5 mm, and the PARENTS ARE EDUCATED to do the distraction',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Name the components of CTEV and the order in which Ponseti corrects them.',
        answer:
          'Four components, remembered as CAVE: CAVUS (high medial arch, from plantarflexion of the first ray), ADDUCTUS (forefoot adduction at the talo-navicular joint), VARUS (hindfoot inversion at the subtalar joint), and EQUINUS (ankle plantarflexion). Ponseti corrects them IN THAT ORDER, because each unlocks the next: the cavus is corrected first by supinating the forefoot and dorsiflexing the first ray, then adductus and varus are corrected together by abducting the foot around the head of the TALUS as the fulcrum — never around the calcaneo-cuboid joint — up to about 70 degrees of abduction, over five to six weekly above-knee casts. EQUINUS IS CORRECTED LAST, and in about 80% of cases it needs a percutaneous tendo-achilles tenotomy, after which a final cast is kept for three weeks. Bracing then follows for years, and relapse is almost always a bracing failure.',
        examinerTip:
          'The head of the talus as the fulcrum is the detail that separates Ponseti from Kite — abducting around the calcaneo-cuboid joint is the classic Kite error and it blocks correction.',
      },
      {
        question: 'What is the Kite angle and what happens to it in CTEV?',
        answer:
          'The Kite angle is the TALO-CALCANEAL angle, measured on the LATERAL radiograph between the long axis of the talus and the long axis of the calcaneum. Normally it is greater than about 35 degrees, because the two bones diverge. In CTEV the calcaneum is inverted and lies UNDER the talus rather than beside it, so the two axes become PARALLEL and the angle is markedly DECREASED — that parallelism is the radiological essence of the deformity. It is also measured on the AP view, where it is normally 20 to 40 degrees and is similarly reduced. Films are of limited use before three months because the tarsal bones are not yet ossified, and they are taken in maximum correction.',
        examinerTip:
          '"The talus and calcaneum become parallel" is the sentence. The number follows from it.',
      },
    ],
  },

  {
    id: 'chronic_osteomyelitis_proforma',
    title: 'Chronic Osteomyelitis',
    system: 'Orthopaedics',
    department: 'Orthopaedics',
    summary:
      'A discharging sinus over a bone, usually years after an injury or an operation. Covers the discharge history that makes the diagnosis, the radiological triad of sequestrum, involucrum and cloaca, and the complication nobody expects.',
    examPearl:
      'Ask whether BONY SPICULES have come out in the discharge. A patient who says yes has told you there is a sequestrum, which is the whole pathology and the whole operation — and it is a question only somebody who knows the disease thinks to ask.',
    diagramPath: '/diagrams/orthopaedics/osteomyelitis_pathology_sequestrum.jpg',
    diagramTitle: 'Chronic osteomyelitis: sequestrum, involucrum and cloaca',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'The discharge',
            description: 'Characterised in full — it is the presenting complaint and the diagnosis.',
            checklist: [
              'Site: "discharge from the upper part of the front of the leg for __ years"',
              'Duration; continuous or intermittent, with periods of healing and breaking down again',
              'Amount: scanty or profuse. Colour: purulent, serous, blood-stained',
              'FOUL SMELLING or not',
              'H/O BONY SPICULES IN THE DISCHARGE — pathognomonic of a separating sequestrum',
              'Number of sinuses, and whether they have changed position',
              'Pain: aggravated on walking, relieved by rest; throbbing pain suggests acute exacerbation',
              'Fever with exacerbations',
            ],
          },
          {
            label: 'The antecedent',
            description: 'Chronic osteomyelitis almost always has one, and finding it dates the disease.',
            checklist: [
              'TRAUMA — and whether it was an open fracture',
              'PREVIOUS SURGERY on the bone, and the interval before the discharge started (classically about a month)',
              'IMPLANT in situ — plate, nail, screws, external fixator',
              'Preceding boil, infected wound, or an acute febrile illness in childhood (haematogenous)',
              'Previous courses of antibiotics, their duration, and any previous debridement',
              'Native or traditional treatment applied to the wound',
              'Diabetes, HIV, immunosuppression, sickle cell disease, intravenous drug use, tuberculosis contact',
              'Loss of weight and appetite; night sweats — to exclude tuberculous osteomyelitis',
              'Functional loss: walking distance, limp, work',
            ],
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'General and local inspection',
            description: 'The limb, both sides, exposed from above the joint above.',
            checklist: [
              'Conscious, oriented, moderately built and nourished; no PICCLE; vitals',
              'PEDAL OEDEMA — may be diffuse from foot to knee',
              'SKIN over the front of the leg: HYPERPIGMENTED and THICKENED; scarring; puckering',
              'SINUS — number, site, whether it is tethered to bone, the character of the discharge, and whether the edge is everted or heaped (sinus tract malignancy)',
              'Scars of previous surgery; any implant palpable or visible',
              'Muscle wasting; LIMB SHORTENING; deformity; angulation',
              'Surface smooth or irregular; bone thickened',
            ],
            clinicalSign:
              'An everted, heaped-up or fungating edge on a sinus that has been discharging for years is SQUAMOUS CELL CARCINOMA — Marjolin ulcer — until biopsy says otherwise.',
          },
          {
            label: 'Palpation, movements and neurovascular status',
            description: 'And the joints on either side, in every case.',
            checklist: [
              'Local temperature; tenderness — localised bony tenderness',
              'Thickening and irregularity of the bone',
              'Sinus: is it fixed to bone? Can a probe reach bone? (probe-to-bone is a useful bedside sign)',
              'Measurements in a two-column R/L table: limb length, segmental lengths, circumference at a fixed distance from a bony landmark',
              'MOVEMENTS of the joint above and the joint below, active and passive, in degrees',
              'DISTAL NEUROVASCULAR STATUS — as a named step',
              'Regional lymph nodes; gait',
            ],
          },
        ],
      },
      {
        title: '3. Diagnosis, Investigations and Treatment',
        items: [
          {
            label: 'Differential diagnosis',
            description: 'Four, from the sheet, and each is distinguishable.',
            checklist: [
              'IMPLANT INFECTION — a sinus over an implant, settling only when the metal is removed',
              'TUBERCULOUS OSTEOMYELITIS — insidious, cold abscess, less sclerosis, constitutional symptoms, more bone destruction than new bone formation',
              'SOFT TISSUE INFECTION — the sinus does not reach bone and the bone is radiologically normal',
              "EWING SARCOMA — the great mimic: fever, raised ESR, leucocytosis, an onion-peel periosteal reaction, and a child or young adult. Biopsy is the answer",
              'Also: syphilitic osteitis, actinomycosis, Brodie abscess, chronic recurrent multifocal osteomyelitis',
            ],
          },
          {
            label: 'Investigations',
            description: 'The radiological triad is the examinable part.',
            checklist: [
              'X-RAY: THICKENING of the bone; PATCHY SCLEROSIS; SEQUESTRUM (a dense avascular fragment — dense BECAUSE it is avascular and so is not resorbed while the living bone around it is); INVOLUCRUM (the new subperiosteal bone forming a sheath around it); CLOACA (the opening in the involucrum through which pus and sequestra escape)',
              'SINOGRAM — to map the tract and show whether it reaches bone',
              'CT — best for sequestra and for the extent of cortical destruction; MRI for marrow and soft tissue involvement',
              'BLOOD: haemogram, ESR (raised), CRP — used to follow the response',
              'PUS FOR CULTURE AND SENSITIVITY — ideally from deep tissue at debridement, not a superficial swab, which grows colonisers',
              'Biopsy of the sinus edge where malignancy is suspected',
              'Blood sugar; HIV; Mantoux where tuberculosis is considered',
            ],
            clinicalSign:
              'The sequestrum is dense on X-ray precisely because it is DEAD — it cannot be resorbed, while the living bone around it is being remodelled and looks less dense by comparison.',
          },
          {
            label: 'Treatment and complications',
            description: 'Surgery is the treatment; antibiotics support it.',
            checklist: [
              'SEQUESTRECTOMY — removal of the dead bone. Nothing heals while it is in there',
              'SAUCERISATION — laying the cavity open into a shallow saucer so it can granulate and drain',
              'SALINE IRRIGATION; local antibiotic delivery (gentamicin beads, antibiotic cement)',
              'SKIN GRAFT or flap cover for the resulting defect',
              'SKELETAL STABILISATION — external fixation, or bone transport for a segmental defect',
              'Culture-directed systemic antibiotics for a prolonged course; nutrition; control of diabetes',
              'Remove infected implants once the fracture has united',
              'COMPLICATIONS: acute exacerbation; GROWTH ABNORMALITIES (shortening, lengthening or deformity, from physeal involvement in a child); PATHOLOGICAL FRACTURE; SINUS TRACT MALIGNANCY (squamous cell carcinoma); AMYLOIDOSIS (rare); joint stiffness and ankylosis',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Define sequestrum, involucrum and cloaca.',
        answer:
          'SEQUESTRUM is a piece of DEAD bone that has separated from the living bone, its blood supply destroyed by the infection and by the subperiosteal pus stripping the periosteum. It appears DENSE on radiographs — not because it has gained calcium, but because it cannot be resorbed while the living bone around it is being remodelled and rarefied. It harbours organisms in a biofilm where antibiotics cannot reach, which is why no amount of antibiotic cures chronic osteomyelitis and why removing it is the operation. INVOLUCRUM is the new bone laid down by the stripped but still viable periosteum, forming a sheath around the sequestrum. CLOACA is an opening in that involucrum through which pus and small sequestra discharge, and which communicates with the skin as the sinus.',
        examinerTip:
          '"Dense because it is dead" is the line. It explains the radiograph and the operation in one clause.',
      },
      {
        question: 'A sinus has been discharging for twenty years and its edge is now heaped up. What is it?',
        answer:
          'MARJOLIN ULCER — squamous cell carcinoma arising in a chronically inflamed sinus tract or scar. Long-standing epithelial regeneration and repeated repair in an unstable scar predispose to malignant change. Suspect it when a long-standing sinus changes: an everted or heaped-up edge, increased or blood-stained and foul discharge, fungation, a lump, sudden increase in pain, or recent rapid growth. It is classically slow-growing and, because scar tissue is relatively avascular and has few lymphatics, it metastasises late — but once it reaches normal tissue the nodes become involved and the prognosis worsens. Management is wide excision, with amputation for extensive disease, plus block dissection for clinically involved nodes; the diagnosis is made by biopsy of the EDGE, and multiple biopsies are taken because sampling error is common.',
        examinerTip:
          'Say that you would biopsy the edge, not the base, and take several. That is what being asked here tests.',
      },
    ],
  },

  {
    id: 'nonunion_malunion_proforma',
    title: 'Non-union and Malunion',
    system: 'Orthopaedics',
    department: 'Orthopaedics / Trauma',
    summary:
      'Two ways a fracture fails, examined the same way and treated oppositely. Covers abnormal mobility and painless movement at the fracture site, the deformity of malunion, the radiology that separates them, and the question about native treatment that the owner’s sheets ask twice.',
    examPearl:
      'ABNORMAL MOBILITY at the old fracture site, and PAINLESS movement, is non-union. A united fracture in a bad position, with a deformity but NO mobility, is malunion. Elicit mobility gently and once — and then never again, because it hurts and it achieves nothing after the first time.',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'The original injury and the interval',
            description: 'Both sheets open the same way: normal, then a fracture, then years, then this.',
            checklist: [
              'When was the original fracture — which may be many years ago',
              'Mechanism; which bone; open or closed',
              'HOW WAS IT TREATED: plaster, traction, surgery, or nothing. Where, and by whom',
              'Duration of immobilisation, and whether the patient removed it early',
              'Was union ever declared? Did the patient use the limb normally in between?',
              'NO H/O NATIVE TREATMENT OR OIL MASSAGE — asked explicitly, as both sheets do. A bone-setter’s massage on a fresh fracture is a recognised route to malunion, non-union and compartment syndrome, and nobody volunteers it',
              'Infection at any stage: fever, discharge, open wound',
            ],
            clinicalSign:
              'The question about oil massage and native treatment is in both of these sheets for a reason. Ask it directly and without judgement, or you will not be told.',
          },
          {
            label: 'The present complaint',
            description: 'Which differs between the two.',
            checklist: [
              'NON-UNION: deformity of the limb; PAIN ON MOVEMENT of the limb; H/O ABNORMAL MOBILITY; difficulty using the limb',
              'Pain — pricking type, radiating distally, aggravated by movement, relieved by rest',
              'MALUNION: "the leg suddenly bent outward while walking" — a deformity, with pain that is dull, aching, non-radiating and aggravated on walking',
              'Difficulty standing and walking unaided, but able to stand with support',
              'RESTRICTION OF MOVEMENT at the adjacent joint',
              'Shortening noticed by the patient; limp; footwear worn unevenly',
              'No fever, no discharge, no open wound — recorded, because infection changes the operation entirely',
              'Occupation, handedness and functional demand',
            ],
          },
          {
            label: 'Past and personal history',
            description: 'Short, and aimed at why it failed to unite.',
            checklist: [
              'Not a known case of DM, hypertension, TB, epilepsy, cardiac disease — or which of them',
              'SMOKING — a major and correctable cause of non-union, and it must be stated to the patient',
              'Alcohol; nutrition; diet',
              'Steroids, NSAIDs, chemotherapy, bisphosphonates',
              'Previous surgery on the limb',
              'Any suggestion of a PATHOLOGICAL fracture: trivial trauma, bone pain before the injury, known malignancy, weight loss',
            ],
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'Look, feel, move',
            description: 'After consent, exposed from the joint above, both limbs compared.',
            checklist: [
              'General examination: conscious, oriented, moderately built and nourished, no PICCLE. Vitals',
              'ATTITUDE of the limb; DEFORMITY — angulation, rotation, shortening. Record the direction and the degree',
              'Swelling, scars, sinuses, wasting; skin over the site',
              'Local temperature and TENDERNESS — non-union is classically NON-tender, and tenderness suggests infection or delayed union rather than established non-union',
              'ABNORMAL MOBILITY at the fracture site — elicited GENTLY and ONCE. Painless mobility is the hallmark of non-union',
              'A palpable gap, or a bony lump of malunited callus',
              'MEASUREMENTS in a two-column R/L table: true and apparent length, segmental lengths, and circumference at a fixed distance from a bony landmark. Record the SHORTENING in centimetres',
              'MOVEMENTS of the joint above and the joint below, in degrees, active and passive',
              'DISTAL NEUROVASCULAR STATUS — named as its own step. A malunited or non-united fracture can tether or compress a nerve',
              'Gait; ability to weight-bear',
            ],
          },
        ],
      },
      {
        title: '3. Diagnosis, Investigations and Treatment',
        items: [
          {
            label: 'Diagnosis and radiology',
            description: 'The X-ray separates them, and the appearances are specific.',
            checklist: [
              'Format: "a case of post-traumatic NON-UNION of the __ with shortening of the __", or "MALUNION of the __ with __ degrees of __ deformity"',
              'NON-UNION on X-ray: OBLITERATED MEDULLARY CAVITY (sealed off at the fracture ends), SMOOTH AND SCLEROTIC fracture lines, a persistent gap, rounded and eburnated bone ends, and no bridging callus at 9 months with no progress for 3 months',
              'HYPERTROPHIC non-union — abundant callus, an "elephant foot", the biology is fine and the problem is MOVEMENT: treat with stable fixation alone',
              'ATROPHIC non-union — no callus, tapered avascular ends, the problem is BIOLOGY: treat with bone graft as well as fixation',
              'MALUNION on X-ray: the fracture HAS united, but in angulation, rotation or with shortening; measure the deformity in degrees and the shortening in millimetres',
              'CT for the exact deformity and for rotational malunion; scanogram for limb length',
              'Blood: haemogram, ESR, CRP (to exclude infected non-union), blood sugar, vitamin D, calcium, thyroid function',
              'Where infection is suspected: cultures and a nuclear scan, because INFECTED non-union is a different operation',
            ],
          },
          {
            label: 'Treatment',
            description: 'Opposite problems, opposite operations.',
            checklist: [
              'NON-UNION: OPEN REDUCTION, INTERNAL FIXATION AND BONE GRAFTING — the standard answer. Freshen the ends, open the medullary canal, achieve stable compression, and graft',
              'Excision of fragments, with replacement by a prosthesis, where the fragment is small and unsalvageable',
              'ILIZAROV external fixation — for infected non-union, bone loss, or deformity with shortening; allows compression, distraction and bone transport',
              'IF ASYMPTOMATIC, NO TREATMENT — stated plainly in the sheet, and it is right: a painless, functionally adequate non-union in an elderly patient does not need an operation',
              'Adjuncts: bone marrow aspirate concentrate, BMP, electrical stimulation; STOP SMOKING; correct vitamin D and nutrition',
              'MALUNION: corrective OSTEOTOMY with internal or external fixation, planned on the CT; limb lengthening or shoe raise for shortening',
              'Malunion is accepted rather than corrected when the deformity is small, the patient is elderly, function is good, or the risk outweighs the cosmetic gain — and that decision is made WITH the patient',
              'Physiotherapy for the stiff joints on either side, in both conditions',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Differentiate delayed union, non-union and malunion.',
        answer:
          'DELAYED UNION: the fracture has not united within the expected time for that bone and that patient, but union is still PROGRESSING — there is tenderness at the site, the fracture line is still visible, and callus is forming, just slowly. It usually needs patience, protection and correction of the cause. NON-UNION: union has CEASED; conventionally no radiological or clinical progress for three consecutive months, or no union by nine months. The site is typically NON-tender with PAINLESS ABNORMAL MOBILITY, the fracture line is smooth and sclerotic, and the medullary canal is sealed. It will not unite without intervention. MALUNION: the fracture HAS united, but in an unacceptable position — angulation, rotation, shortening, or a combination — with no mobility at the site. The problem is the position, not the healing.',
        examinerTip:
          'Tenderness is the bedside discriminator: delayed union is tender, established non-union is not.',
      },
      {
        question: 'Hypertrophic versus atrophic non-union — why does the distinction matter?',
        answer:
          'Because it tells you WHAT IS MISSING, and therefore what to supply. HYPERTROPHIC non-union shows abundant callus — the "elephant foot" or "horse hoof" appearance — which means the biology is intact and the blood supply is good; what is missing is MECHANICAL STABILITY, so rigid fixation with compression alone will unite it and bone graft is usually unnecessary. ATROPHIC non-union shows no callus, with tapered, osteopenic, avascular bone ends and a gap; the biology has failed — from stripping of the periosteum, excessive soft tissue damage, infection, smoking, or a poor blood supply — so stability alone will not do, and it needs freshening of the ends, decortication and AUTOGENOUS BONE GRAFT as well as fixation. Weber and Cech classified them on exactly this basis.',
        examinerTip:
          '"Hypertrophic needs stability, atrophic needs biology." One sentence, and the whole management follows.',
      },
      {
        question: 'Why do you ask about oil massage in a fracture history?',
        answer:
          'Because traditional bone-setting is common in India and patients frequently present after it, but rarely volunteer it. Vigorous massage of a fresh fracture disrupts the early haematoma and the forming callus, causes repeated micro-movement at the fracture site, and can produce MALUNION and NON-UNION. Tight splintage applied by a bone-setter over a swelling limb causes COMPARTMENT SYNDROME, pressure sores and Volkmann ischaemic contracture, and unsterile manipulation of an open injury introduces infection leading to osteomyelitis. The delay itself matters: a patient who spends six weeks with a bone-setter before reaching hospital arrives with a deformity that is now stiff and difficult to reduce. Asking directly, early, and without any hint of blame is the only way to be told.',
        examinerTip:
          'Both of the owner’s own case sheets record this as an explicit negative. It is a real local question, not a textbook curiosity.',
      },
    ],
  },

  {
    id: 'peripheral_nerve_injury_proforma',
    title: 'Peripheral Nerve Injuries — Radial, Ulnar, Median and Common Peroneal',
    system: 'Orthopaedics',
    department: 'Orthopaedics / Hand Surgery',
    summary:
      'Four nerves, one examination. Covers the functional complaint each palsy produces, the motor and sensory map that localises the level, the classification that predicts recovery, and the tendon transfers that restore function when it does not come back.',
    examPearl:
      'Name the DEFORMITY, then the LEVEL, then the CAUSE — "wrist drop from a radial nerve palsy at the spiral groove, following a fracture of the shaft of the humerus". A candidate who says "he cannot lift his wrist" has described the problem, not diagnosed it.',
    diagramPath: '/diagrams/orthopaedics/peripheral_nerve_injuries_deformities.jpg',
    diagramTitle: 'Peripheral nerve injuries: deformities and sensory loss',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'The functional complaint, by nerve',
            description: 'Patients describe a lost function, not a nerve.',
            checklist: [
              'RADIAL nerve (wrist): "inability to hold or carry objects" — because the wrist collapses and the grip fails',
              'ULNAR and MEDIAN nerves (fingers): "inability to grasp objects"',
              'COMMON PERONEAL nerve: "inability to lift the foot" — tripping, slapping gait, difficulty climbing stairs',
              'Duration; which limb; sudden or gradual',
              'H/O TRAUMA and its nature — the usual antecedent',
              'H/O NUMBNESS AND PARAESTHESIA, and over exactly what area',
              'H/O SKIN CHANGES — dry, wrinkled, or moist. Autonomic loss follows the sensory territory precisely and is a useful objective sign',
              'Progression: improving, static, or worsening',
              'Pain — burning, causalgia',
            ],
          },
          {
            label: 'The causes that are not trauma',
            description: 'One of them is asked about in the sheet by name.',
            checklist: [
              'H/O HYPOPIGMENTED PATCHES — LEPROSY. In India this is a leading non-traumatic cause of peripheral nerve palsy and the sheet asks it explicitly',
              'No H/o DM, HT, LEPROSY, SYPHILIS — recorded as negatives',
              'Compression: a plaster, a tourniquet, crutches (Saturday night palsy for the radial nerve), prolonged squatting or leg-crossing for the common peroneal',
              'Injection palsy — an intramuscular injection into the buttock injuring the sciatic nerve',
              'Previous surgery near the nerve; fracture and its fixation',
              'Diabetes, alcohol, vitamin deficiency, vasculitis — for a mononeuritis multiplex picture',
              'Family history of neurological illness; no smoking, no alcohol',
            ],
            clinicalSign:
              'Palpate for THICKENED NERVES — greater auricular, ulnar at the medial epicondyle, common peroneal at the fibular neck, superficial radial — in every case. A thickened nerve with a hypopigmented anaesthetic patch is leprosy.',
          },
        ],
      },
      {
        title: '2. Examination — motor, sensory, autonomic, and the nerve itself',
        items: [
          {
            label: 'Radial nerve',
            description: 'The nerve of extension.',
            checklist: [
              'DEFORMITY: WRIST DROP, with finger drop at the MCP joints and thumb drop',
              'MOTOR: test wrist extension, finger extension AT THE MCP JOINTS, thumb extension and abduction, and brachioradialis. Test triceps to locate the level — triceps SPARED means the lesion is at or below the spiral groove',
              'Grip strength is weak because the wrist cannot be stabilised — demonstrate that grip improves when the wrist is passively held extended',
              'SENSORY: first dorsal web space (the autonomous zone of the posterior interosseous / superficial radial)',
              'POSTERIOR INTEROSSEOUS palsy spares wrist extension (ECRL is intact) and spares sensation — finger drop without wrist drop',
            ],
          },
          {
            label: 'Ulnar and median nerves',
            description: 'The nerves of the hand, and the deformities are opposite in distribution.',
            checklist: [
              'ULNAR: PARTIAL CLAW HAND — hyperextension at the MCP and flexion at the IP joints of the RING and LITTLE fingers',
              'Ulnar motor: interossei (card test, Egawa test), adductor pollicis (FROMENT SIGN — the thumb IP flexes when pinching paper), abductor digiti minimi, hypothenar wasting, guttering of the dorsum',
              'Ulnar sensory: little finger and the ulnar half of the ring finger; the autonomous zone is the pulp of the little finger',
              'ULNAR PARADOX — a HIGHER lesion gives LESS clawing, because FDP to the ring and little fingers is also paralysed',
              'MEDIAN: POINTING INDEX and the "ape thumb" — wasting of the thenar eminence with loss of opposition',
              'Median motor: abductor pollicis brevis (the key muscle — abduct the thumb perpendicular to the palm against resistance), opponens, LOAF muscles; for a high lesion, FDS, FDP to index and middle, FPL and pronators',
              'OCHSNER CLASPING TEST and the OK SIGN for the anterior interosseous nerve',
              'Median sensory: thumb, index, middle and the radial half of the ring finger; autonomous zone is the pulp of the index',
            ],
            clinicalSign:
              'Froment sign for the ulnar nerve and loss of thumb abduction for the median nerve are the two tests that make the diagnosis at the bedside. Do both in every hand case.',
          },
          {
            label: 'Common peroneal nerve, and the general points',
            description: 'And the things that are done in every nerve case.',
            checklist: [
              'DEFORMITY: FOOT DROP, with a high-stepping or steppage gait',
              'MOTOR: dorsiflexion (deep peroneal — tibialis anterior), EVERSION (superficial peroneal), extensor hallucis longus. INVERSION IS PRESERVED, because tibialis posterior is tibial nerve',
              'SENSORY: dorsum of the foot and the lateral leg; the autonomous zone is the first dorsal web space of the foot',
              'Palpate the nerve at the FIBULAR NECK for thickening and for a Tinel sign',
              'In every case: MRC grading 0–5 of each muscle; wasting measured by tape at a fixed distance; joint contractures and passive range',
              'TINEL SIGN — and its ADVANCE distally over weeks is evidence of regeneration; it moves at roughly 1 mm a day',
              'AUTONOMIC: dry skin (loss of sweating), loss of the wrinkle test on immersion, trophic changes, nail changes',
              'Examine the joints for fixed contracture — which is what converts a recoverable palsy into a permanent disability',
            ],
          },
        ],
      },
      {
        title: '3. Diagnosis, Investigations and Treatment',
        items: [
          {
            label: 'Diagnosis and investigations',
            description: 'Stated in the sheet’s own format.',
            checklist: [
              'Format: "a case of post-traumatic radial / ulnar / median / common peroneal nerve palsy of the left / right limb with wrist drop / partial claw hand / foot drop"',
              'Add the level and the cause where known',
              'BLOOD — including blood sugar; slit-skin smear where leprosy is suspected',
              'NERVE CONDUCTION STUDY — localises the lesion and grades the conduction block',
              'EMG — shows denervation (fibrillations, positive sharp waves) and, later, reinnervation potentials. Do not do it before 3 weeks; denervation changes take that long to appear',
              'X-ray of the associated fracture; ultrasound or MRI of the nerve for a neuroma or a compressing lesion',
            ],
          },
          {
            label: 'Treatment',
            description: 'Preserve the joints while you wait, and transfer when waiting has failed.',
            checklist: [
              'DEFORMITY — SPLINTAGE: COCK-UP SPLINT for wrist drop; KNUCKLE-BENDER SPLINT for claw hand; foot-drop splint or AFO for foot drop. The splint prevents the fixed contracture that would make any later reconstruction useless',
              'MUSCLE ATROPHY — ELECTRICAL STIMULATION',
              'JOINT STIFFNESS — joint mobilisation and PHYSIOTHERAPY, passive movement of every joint through full range, daily',
              'Neurapraxia and axonotmesis: observe, with serial examination and an advancing Tinel sign',
              'Neurotmesis or a clean sharp laceration: primary repair. A ragged or contaminated wound: delayed repair at 3 weeks. A gap: nerve grafting (sural)',
              'Neurolysis for a compressive or scarred nerve; decompression at a known entrapment site',
              'TENDON TRANSFERS when recovery has not occurred and the joints are supple:',
              '  PRONATOR TERES → ECRB, for WRIST DROP',
              '  FCR → ED, for FINGER DROP',
              '  PL → EPL, for THUMB DROP',
              '  (ulnar: Bunnell, Zancolli lasso for claw hand; peroneal: tibialis posterior transfer for foot drop)',
              'Protect the anaesthetic limb: teach inspection, avoid burns and pressure',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Classify nerve injuries and say what each grade recovers.',
        answer:
          'SEDDON: NEURAPRAXIA — a conduction block with the axon intact, no Wallerian degeneration; recovery is complete in days to weeks. AXONOTMESIS — the axon is divided but the endoneurial tube and the connective tissue framework are intact, so Wallerian degeneration occurs but the axon regenerates along its own tube at about 1 mm per day; recovery is good. NEUROTMESIS — complete division of the nerve including its sheath; no spontaneous recovery, and surgical repair is required. SUNDERLAND refines this into five degrees: first degree equals neurapraxia; second degree is axon divided, endoneurium intact (axonotmesis); third degree adds endoneurial disruption with the perineurium intact, giving incomplete and disorganised recovery; fourth degree leaves only the epineurium intact, with a neuroma-in-continuity and essentially no useful recovery; and fifth degree is complete transection. A sixth degree (Mackinnon) describes a mixed pattern within one nerve.',
        examinerTip:
          'The 1 mm per day figure is what lets you predict a date and justify how long you will wait before operating — give it unprompted.',
      },
      {
        question: 'What is the ulnar paradox?',
        answer:
          'A HIGHER ulnar nerve lesion produces LESS deformity than a lower one. Clawing of the ring and little fingers results from unopposed action of the long extensors and long flexors when the ulnar-supplied intrinsics (the medial two lumbricals and the interossei) are paralysed. In a LOW lesion at the wrist, flexor digitorum profundus to the ring and little fingers is intact and its unopposed pull flexes the interphalangeal joints, producing marked clawing. In a HIGH lesion at or above the elbow, FDP to those fingers is ALSO paralysed, so the IP joints cannot flex strongly and the claw is much less obvious — the hand looks better while the injury is worse. Clinically this also means that as a high lesion recovers, FDP reinnervates before the intrinsics and the clawing APPEARS or worsens, which is a sign of recovery rather than deterioration.',
        examinerTip:
          'The clawing getting worse as the patient improves is the part that sounds wrong and is right. Say it.',
      },
    ],
  },

  {
    id: 'osteoarthritis_knee_proforma',
    title: 'Osteoarthritis of the Knee',
    system: 'Orthopaedics',
    department: 'Orthopaedics',
    summary:
      'The commonest orthopaedic long case in an older patient. Covers the pain and stiffness history that separates it from an inflammatory arthritis, the deformity and the gait, the four radiological features, and the treatment ladder from quadriceps exercises to replacement.',
    examPearl:
      'Stiffness after INACTIVITY that eases within minutes of moving — and NO early morning stiffness beyond half an hour — is osteoarthritis. Prolonged early morning stiffness is inflammatory. That one question sorts the differential before you touch the knee.',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'Pain',
            description: 'Characterised exactly as the sheet does.',
            checklist: [
              'Duration; GRADUAL in onset; PROGRESSIVE in nature',
              'UNILATERAL or bilateral; which knee is worse',
              'DULL ACHING; continuous',
              'AGGRAVATED BY MOVEMENT AND WEIGHT-BEARING, RELIEVED BY REST — the mechanical pattern',
              'Night pain and rest pain — which indicate advanced disease',
              'Site: medial compartment pain is the commonest; anterior pain on stairs suggests patellofemoral disease',
              'Aggravated by climbing stairs, squatting, and getting up from a chair',
            ],
          },
          {
            label: 'Stiffness, swelling and function',
            description: 'The functional questions are the ones that decide the operation.',
            checklist: [
              'STIFFNESS: duration; AGGRAVATED ON SITTING FOR A LONG DURATION; RELIEVED AFTER WALKING (the "gelling" phenomenon)',
              'NO EARLY MORNING STIFFNESS, or under 30 minutes — recorded explicitly, because prolonged morning stiffness means inflammatory arthritis',
              'SWELLING: gradual, continuous; episodes of increase',
              'H/o DIFFICULTY IN SQUATTING',
              'H/o DIFFICULTY SITTING CROSS-LEGGED — which matters enormously in Indian practice: toilets, floor seating and worship all require it',
              'H/o DIFFICULTY CLIMBING STAIRS',
              'H/o INABILITY TO BEAR WEIGHT on the affected side',
              'H/o RESTRICTED MOVEMENTS; H/o CREPITUS on movement',
              'Instability, giving way, locking — which suggest a meniscal or ligamentous cause',
              'WALKING DISTANCE in metres, and use of a stick — the number that is followed',
              'Deformity noticed: bow legs (varus) or knock knees (valgus)',
            ],
            clinicalSign:
              'Difficulty sitting cross-legged and squatting is a functional loss that Western scoring systems do not capture and that Indian patients present with. Ask it, and record it.',
          },
          {
            label: 'Secondary causes and the rest',
            description: 'Because secondary osteoarthritis is treated differently.',
            checklist: [
              'Previous knee INJURY, meniscal tear, ligament injury, fracture involving the joint',
              'Previous knee surgery, including meniscectomy',
              'Septic arthritis or tuberculosis of the knee in the past',
              'Inflammatory arthritis: rheumatoid, gout, ankylosing spondylitis — joint pains elsewhere, morning stiffness, psoriasis, uveitis, low back pain',
              'Occupation — farming, squatting work, heavy manual labour; obesity; diabetes',
              'Treatment already taken: analgesics, intra-articular injections, physiotherapy, and the response',
              'Comorbidity, for fitness for arthroplasty',
            ],
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'Gait, standing and inspection',
            description: 'The examination starts with the patient walking in.',
            checklist: [
              'GAIT: antalgic (short stance phase on the painful side), lurching, varus thrust',
              'STANDING, from front, side and behind: VARUS (bow leg) or VALGUS (knock knee) deformity; measure the intercondylar or intermalleolar distance',
              'FIXED FLEXION DEFORMITY — look from the side with the patient supine and see whether the knee touches the couch',
              'Swelling: suprapatellar fullness, loss of the parapatellar hollows, generalised or localised',
              'QUADRICEPS WASTING — particularly vastus medialis obliquus; measured by tape 15 cm above the joint line, both sides',
              'Scars, sinuses, skin changes; popliteal swelling (Baker cyst)',
            ],
          },
          {
            label: 'Palpation and movements',
            description: 'And the effusion tests, which depend on how much fluid there is.',
            checklist: [
              'Local temperature — raised in inflammatory, normal or slightly raised in osteoarthritis',
              'TENDERNESS over the JOINT LINE (medial and lateral), the patellofemoral joint, and the osteophytes, which may be palpable',
              'EFFUSION: PATELLAR TAP for a moderate effusion; BULGE / WIPE TEST for a small one; fluctuation and cross-fluctuation for a large one',
              'CREPITUS — palpable and audible on passive movement, and on patellofemoral grinding',
              'MOVEMENTS in degrees: flexion (normal 0–135°), extension, and any fixed flexion deformity recorded as, e.g., 15–100°',
              'Passive and active range compared',
              'STABILITY: collateral ligaments in extension and 30° flexion; anterior and posterior drawer; Lachman; McMurray for the menisci',
              'MEASUREMENTS in a two-column R/L table: limb length, thigh and calf circumference',
              'DISTAL NEUROVASCULAR STATUS',
              'Examine the HIP and the SPINE — hip pathology refers pain to the knee, and a knee case that is really a hip is a classic exam trap',
              'Examine the other knee and the other joints',
            ],
            clinicalSign:
              'A patient presenting with knee pain whose knee examination is normal has a HIP until the hip has been examined. Referred pain along the obturator nerve is the mechanism.',
          },
        ],
      },
      {
        title: '3. Investigations and Treatment',
        items: [
          {
            label: 'Investigations',
            description: 'Weight-bearing films, and the four features.',
            checklist: [
              'X-RAY KNEE, AP STANDING (weight-bearing) and lateral, with a skyline view for the patellofemoral joint. Non-weight-bearing films underestimate joint space loss',
              'THE FOUR FEATURES: JOINT SPACE NARROWING (asymmetrical, usually medial); SUBCHONDRAL SCLEROSIS; OSTEOPHYTES; SUBCHONDRAL CYSTS',
              'Also: varus or valgus malalignment, loose bodies, tibial spiking, deformity',
              'Kellgren-Lawrence grading 0–IV',
              'Full-length standing hip-to-ankle film for the mechanical axis before osteotomy or arthroplasty',
              'Blood: haemogram, ESR, CRP, RA factor, uric acid, blood sugar — to exclude inflammatory and crystal arthropathy',
              'MRI only where a meniscal or ligament injury or avascular necrosis is suspected — it is not needed to diagnose osteoarthritis',
              'Joint aspiration where infection or crystals are suspected',
            ],
          },
          {
            label: 'Treatment',
            description: 'From the sheet, and the non-drug measures come first because they work.',
            checklist: [
              'MEDICAL: analgesics — paracetamol first, then NSAIDs (diclofenac, COX-2 inhibitors), and opioids such as morphine only in severe disease unsuitable for surgery. Topical NSAIDs are effective and safer in the elderly',
              'CHONDROPROTECTIVE AGENTS (chondroitin sulphate, glucosamine) — rarely used, and the evidence is weak; say so',
              'VISCOSUPPLEMENTATION (intra-articular hyaluronic acid) — rare',
              'Intra-articular steroid for an acute flare, sparingly',
              'WEIGHT REDUCTION — the single most effective non-surgical measure',
              'AVOID STRESS AND STRAIN TO THE JOINT: avoid squatting, cross-legged sitting, stairs and Indian-style toilets; use a raised commode and a walking stick IN THE OPPOSITE HAND',
              'LOCAL HEAT for pain relief',
              'EXERCISES — QUADRICEPS STRENGTHENING, which is the mainstay. Static quadriceps, straight-leg raising, and range-of-motion work',
              'Footwear: cushioned soles, lateral wedge insole for medial compartment disease',
              'SURGICAL: HIGH TIBIAL OSTEOTOMY — mild cases, and for GENU VARUM in a younger active patient with isolated medial compartment disease; it realigns the mechanical axis',
              'TOTAL KNEE REPLACEMENT — severe cases; unicompartmental replacement for isolated single-compartment disease',
              'Arthroscopic lavage and debridement — not indicated for osteoarthritis alone; only for a mechanical block such as a loose body or a bucket-handle tear',
              'Arthrodesis as a salvage where replacement has failed or is contraindicated',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'How do you distinguish osteoarthritis from rheumatoid arthritis clinically?',
        answer:
          'OSTEOARTHRITIS: older patient; pain that is MECHANICAL — worse with use, better with rest; stiffness after inactivity that eases within minutes and MORNING STIFFNESS under 30 minutes; ASYMMETRICAL, affecting weight-bearing joints (knee, hip, spine) and the DIP joints of the hand with Heberden nodes; no systemic features; bony swelling and crepitus rather than warmth; normal ESR and CRP; and radiologically joint space narrowing that is ASYMMETRICAL, with SUBCHONDRAL SCLEROSIS, OSTEOPHYTES and cysts. RHEUMATOID: younger, more often female; INFLAMMATORY pain, worse at rest and better with use; MORNING STIFFNESS over an hour; SYMMETRICAL, affecting the small joints — MCP, PIP and wrist — and SPARING the DIP joints; systemic features of fatigue, weight loss and fever, with extra-articular manifestations such as nodules; a warm, boggy, soft-tissue swelling; raised ESR and CRP with positive RA factor and anti-CCP; and radiologically PERIARTICULAR OSTEOPENIA, SYMMETRICAL joint space narrowing, MARGINAL EROSIONS and deformity, with no osteophytes.',
        examinerTip:
          'Osteoarthritis makes bone (osteophytes, sclerosis); rheumatoid destroys it (erosions, osteopenia). That single contrast organises the whole radiological answer.',
      },
      {
        question: 'When would you choose a high tibial osteotomy over a knee replacement?',
        answer:
          'A high tibial osteotomy is chosen for a YOUNGER (typically under 60), ACTIVE patient, often a manual worker or farmer, with ISOLATED MEDIAL COMPARTMENT osteoarthritis and a VARUS deformity, who has a good range of movement (flexion beyond 90 degrees), a fixed flexion deformity of less than about 15 degrees, stable ligaments, and no significant patellofemoral or lateral compartment disease. It works by shifting the mechanical axis laterally so that load is transferred from the worn medial compartment to the preserved lateral one, which relieves pain, preserves the patient’s own joint and their ability to squat and kneel, and does not preclude a replacement later. A TOTAL KNEE REPLACEMENT is chosen for the older, less active patient with tricompartmental disease, severe deformity, night and rest pain, and a substantial fixed flexion deformity — it gives more reliable and more immediate pain relief, but has a finite lifespan, which is exactly why it is avoided in a young heavy-demand patient.',
        examinerTip:
          'Age and the number of compartments involved. Say both, then say that an osteotomy does not burn the bridge to a replacement.',
      },
    ],
  },
];
