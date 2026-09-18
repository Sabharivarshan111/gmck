/**
 * General Surgery short cases.
 *
 * Built from the short-case sheets the app's owner sent, which are written as
 * worked examples — a named patient, an age, a locality, and every measurement
 * filled in. That format is why they are good teaching, and it is also why they
 * cannot be copied straight into an app: a proforma has to be the empty form,
 * not one filled copy of it. So each case here keeps the SEQUENCE and the
 * discriminating findings from the source sheet and drops the invented patient.
 *
 * ── The one structural decision worth explaining ───────────────────────────
 *
 * Eight of these cases are the same examination. Lipoma, sebaceous cyst,
 * dermoid cyst, hydrocele, ganglion — every one is "examine this swelling", and
 * the source sheets recite the identical thirty-line inspection and palpation
 * sequence each time. Writing that out eight times would be eight copies to
 * keep in step, and the first one to drift would be the one somebody read.
 *
 * So `swelling_proforma` holds the framework ONCE, in full, and each specific
 * case carries only what makes it that diagnosis: the punctum and the moulding
 * of a sebaceous cyst, the slip sign of a lipoma, the bony indentation of a
 * dermoid, getting above the swelling in a hydrocele. That is also how the
 * examination is actually taught — one method, applied to whatever is in front
 * of you — so the split matches the subject rather than fighting it.
 */
import type { ClinicalProforma } from '@/lib/clinicalProformas';

export const SURGERY_SHORT_PROFORMAS: ClinicalProforma[] = [
  {
    id: 'swelling_proforma',
    title: 'Examination of a Swelling — the Master Short Case Framework',
    system: 'General Surgery',
    department: 'General Surgery',
    summary:
      'The single method behind every surgical short case. Every lump case — lipoma, sebaceous cyst, dermoid, hydrocele, ganglion, lymph node, thyroid, breast lump — is this sequence applied to a different site, and the specific proformas carry only what makes each one that diagnosis.',
    examPearl:
      'Inspection is finished BEFORE you touch the patient, and palpation begins by confirming the inspectory findings out loud. Examiners fail candidates who palpate first, because everything after that is contaminated — you cannot un-see a lump you have already felt.',
    sections: [
      {
        title: '1. History of a Swelling',
        items: [
          {
            label: 'The swelling itself',
            description: 'Six questions, always in this order.',
            checklist: [
              'DURATION — when was it first noticed, and by whom (the patient, or somebody else)',
              'MODE OF ONSET — spontaneous, after trauma, after an infection',
              'SITE at which it first appeared, and whether it has moved',
              'PROGRESSION — what size it started at (pea, almond, lemon are the units patients use), how fast it grew, whether growth has been steady, rapid, or in spurts',
              'Whether it has ever DECREASED in size or disappeared (a reducible hernia, a lymph node with an infection)',
              'PAIN — present or absent, and if present its site, character, radiation, timing and relation to the swelling',
            ],
            clinicalSign:
              'Rapid recent growth in a long-standing swelling is malignant change until proved otherwise — ask it of every chronic lump.',
          },
          {
            label: 'Secondary changes and associated features',
            description: 'Asked about explicitly, and recorded even when negative.',
            checklist: [
              'Ulceration, discharge, bleeding from the swelling',
              'Change in overlying skin: colour, warmth, a punctum, a scar, a sinus',
              'Impairment of function or restriction of movement of a nearby joint',
              'Pressure effects on nerves (numbness, weakness), on vessels (swelling distally), on a viscus',
              'ANY OTHER SWELLING ANYWHERE in the body — this is what turns a solitary lipoma into lipomatosis, and a neck node into a lymphoma',
              'Fever, night sweats, LOSS OF WEIGHT AND APPETITE — the constitutional screen',
            ],
          },
          {
            label: 'Past, personal, family and treatment history',
            description: 'Kept short, and aimed at the cause and at fitness for anaesthesia.',
            checklist: [
              'Trauma to the site; previous surgery or aspiration of the same swelling',
              'Similar swelling in the past, and how it was treated',
              'Diabetes, hypertension, tuberculosis, asthma, epilepsy, ischaemic heart disease',
              'Family history of similar swellings (neurofibromatosis, familial lipomatosis)',
              'Diet, appetite, bowel and bladder, sleep, habits',
              'Drug history and allergies',
            ],
          },
        ],
      },
      {
        title: '2. Inspection — completed before touching',
        items: [
          {
            label: 'The seven things inspection answers',
            description: 'Adequate exposure, good light, the patient positioned and comfortable.',
            checklist: [
              'NUMBER — solitary or multiple',
              'SITE — named anatomically, not vaguely',
              'SIZE — in two dimensions, in centimetres',
              'SHAPE — spherical, hemispherical, ovoid, pyriform, irregular',
              'EXTENT — stated as four limits: upper, lower, medial and lateral, each measured from a fixed bony landmark',
              'MARGINS — well defined or ill defined',
              'SURFACE — smooth, lobulated, nodular, irregular',
            ],
            normal: 'Example: "A solitary ovoid swelling 8 by 5 cm over the left side of the nape, margins well defined, surface smooth."',
          },
          {
            label: 'Skin over the swelling and the surrounding area',
            description: 'Each of these changes the diagnosis on its own.',
            checklist: [
              'Colour: normal, red, pigmented, black',
              'PUNCTUM — present in a sebaceous cyst, and that single finding almost makes the diagnosis',
              'Scar, sinus, ulcer, fungation',
              'DILATED VEINS over the swelling — vascular tumour, or venous obstruction',
              'Visible pulsation; visible peristalsis',
              'Skin stretched and shiny with loss of rugosity (in the scrotum) — a tense cystic swelling',
              'Secondary changes; state of the surrounding area and of the regional lymph node areas',
              'IMPULSE ON COUGHING — asked for, and looked for, in every swelling of the groin, scrotum and abdominal wall',
            ],
          },
        ],
      },
      {
        title: '3. Palpation — and the named tests',
        items: [
          {
            label: 'Before anything else',
            description: 'Temperature and tenderness first, with the back of the hand, and watching the face.',
            checklist: [
              'LOCAL TEMPERATURE — compared with the opposite side and the surrounding skin',
              'TENDERNESS — watch the patient’s face, not your hand',
              'Then CONFIRM every inspectory finding: site, size, shape, extent, margins, surface',
            ],
          },
          {
            label: 'Consistency, plane and mobility',
            description: 'The three that place the swelling anatomically.',
            checklist: [
              'CONSISTENCY — soft (lipoma), cystic, firm, hard (malignancy), variable, bony hard',
              'IS THE SKIN PINCHABLE over it? If not, the swelling arises from the skin (sebaceous cyst)',
              'PLANE: intradermal, subcutaneous, intramuscular, or deep to the muscle. Tested by contracting the underlying muscle — a swelling deep to muscle becomes LESS mobile and less prominent, one superficial to it becomes MORE prominent',
              'MOBILITY — in two planes at right angles, and whether free, restricted, or fixed',
              'FIXITY to skin, to underlying muscle, to bone, or to a neurovascular bundle (mobile at right angles to a nerve and not along it)',
            ],
          },
          {
            label: 'The named tests, and what each one means',
            description: 'Done selectively — performing all of them on every lump is a sign of not having a diagnosis.',
            checklist: [
              'FLUCTUATION (Paget test) — two fingers; positive means fluid. Elicited in TWO planes at right angles, because a soft solid swelling gives a false positive in one',
              'TRANSILLUMINATION — in a dark room, positive when the fluid is clear: hydrocele, cystic hygroma, meningocele. NEGATIVE with blood, pus or sebaceous material',
              'SLIP SIGN — press the edge and the margin slips away under the finger. Positive in a LIPOMA and it is the classic sign',
              'MOULDING — the swelling can be indented and holds the shape, as in a sebaceous cyst’s pultaceous contents',
              'REDUCIBILITY and COUGH IMPULSE — hernia, meningocele, varix',
              'COMPRESSIBILITY — empties on pressure and refills on release: haemangioma, lymphangioma. Different from reducibility',
              'PULSATILITY — and whether EXPANSILE (the two fingers move apart: aneurysm) or TRANSMITTED (they move in the same direction: a swelling lying on an artery)',
              'INDENTATION of underlying bone; a bony swelling arising from bone moves with it',
              'Fluid thrill in a large cystic swelling',
              'REGIONAL LYMPH NODES — examined in every case, and named',
            ],
            clinicalSign:
              'Expansile versus transmitted pulsation is the distinction that separates an aneurysm from a lump lying on an artery, and it is elicited by where your two fingers go, not by how strong the pulse feels.',
          },
        ],
      },
      {
        title: '4. Presentation and Workup',
        items: [
          {
            label: 'Summarising',
            description: 'Three sentences, in this order, and then the diagnosis.',
            checklist: [
              'The patient, the complaint and its duration',
              'The positive findings, grouped',
              'The relevant negatives',
              'Then: "a case of soft tissue swelling, most probably ___", with a differential',
            ],
          },
          {
            label: 'Investigations',
            description: 'General for fitness, specific for the diagnosis.',
            checklist: [
              'General: haemogram, blood sugar, renal function, urine routine, chest X-ray, ECG, viral markers',
              'Specific: ULTRASOUND to confirm cystic versus solid and to show the plane',
              'FNAC — quick, cheap and outpatient; the first specific test for most lumps and for a lymph node',
              'TRUCUT or core biopsy where architecture is needed (soft tissue sarcoma, breast)',
              'EXCISION BIOPSY where the lump is small and removal is the treatment anyway',
              'CT or MRI for a deep or large soft tissue mass before any operation',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'How do you elicit fluctuation, and why in two planes?',
        answer:
          'Paget test: the swelling is fixed with the index and middle finger of one hand placed at opposite edges (the watching fingers), and the centre is pressed with a finger of the other hand (the displacing finger). Fluid displaced from the centre raises both watching fingers. It is then repeated at RIGHT ANGLES to the first, rotating the fingers ninety degrees, because a soft SOLID swelling such as a lipoma will give a false positive in one plane — it yields along its line of least resistance — but cannot do so in both. Fluctuation is positive in both planes only if there is genuinely fluid. In a very small swelling the Paget test is unreliable and Hilton method is used instead.',
        examinerTip:
          'Say "because a lipoma fluctuates in one plane" — that is the reason, and it names the trap at the same time.',
      },
      {
        question: 'How do you determine the plane of a swelling?',
        answer:
          'By making the underlying structure contract and watching what happens. If the swelling is SUPERFICIAL to the muscle it becomes more prominent, more fixed and less mobile when the muscle contracts but remains palpable. If it lies WITHIN the muscle, mobility is lost in the direction of the muscle fibres and retained across them. If it is DEEP to the muscle it becomes less prominent or disappears completely on contraction. For the skin, the test is whether the skin can be PINCHED over the swelling: a swelling arising from the skin moves with it and cannot be pinched free — that is how a sebaceous cyst is separated from a subcutaneous lipoma.',
        examinerTip:
          'Name the specific contraction you would use for the site in front of you — "I would ask him to press his palms together" for pectoralis, and so on.',
      },
    ],
  },

  {
    id: 'lipoma_proforma',
    title: 'Lipoma',
    system: 'General Surgery',
    department: 'General Surgery',
    summary:
      'The commonest soft tissue swelling and the commonest short case. The whole diagnosis rests on three findings — soft lobulated consistency, a free edge that slips away under the finger, and a subcutaneous plane with pinchable skin.',
    examPearl:
      'The SLIP SIGN is the lipoma. Press the edge and it slips away from under your finger, because a lipoma is lobulated fat in a thin capsule with no attachment to the skin above or the fascia below. Elicit it and say its name.',
    sections: [
      {
        title: 'What makes it a lipoma',
        items: [
          {
            label: 'History',
            description: 'Long, slow, painless, and usually noticed by accident.',
            checklist: [
              'Duration in years rather than months; insidious onset',
              'Started the size of an almond or a pea and grew very slowly',
              'PAINLESS — pain suggests a neurofibroma, an infected cyst, or an angiolipoma',
              'No fever, no trauma, no discharge, no restriction of movement',
              'ANY OTHER SWELLING elsewhere — multiple lipomas occur in familial lipomatosis, Dercum disease (adiposis dolorosa, which IS painful), and Madelung neck',
              'No loss of weight or appetite',
            ],
          },
          {
            label: 'Examination — the discriminating findings',
            description: 'Everything else follows the master swelling framework.',
            checklist: [
              'Commonest over the nape, back, shoulder and thigh — wherever there is subcutaneous fat',
              'Margins well defined; surface smooth on inspection but LOBULATED on palpation',
              'SOFT in consistency; SLIP SIGN POSITIVE',
              'Skin over it is PINCHABLE and normal — no punctum',
              'Plane: SUBCUTANEOUS; freely mobile in all directions',
              'Fluctuation may be positive in one plane only — a classic false positive, and the reason to test in two',
              'Transillumination negative; not compressible, not reducible, not pulsatile',
              'Regional lymph nodes not palpable',
            ],
            clinicalSign:
              '"Pseudofluctuation" — a lipoma fluctuating in one plane and not the other — is a named finding and worth saying aloud.',
          },
          {
            label: 'Diagnosis, investigation and treatment',
            description: 'Usually clinical, but the exceptions are the marks.',
            checklist: [
              'Differential: sebaceous cyst (punctum, skin not pinchable), neurofibroma (mobile across the nerve only, may be tender), cold abscess, dermoid, fibroma, LIPOSARCOMA',
              'Investigations: usually none. Ultrasound where the plane or the nature is in doubt',
              'MRI for any lipoma that is large (over 5 cm), deep to the deep fascia, rapidly growing, or painful — these are the liposarcoma features',
              'FNAC or core biopsy where malignancy is suspected — never simply shell it out',
              'Treatment: EXCISION in toto with its capsule, under local anaesthesia for a small superficial one',
              'Indications to excise: cosmetic, pressure symptoms, rapid growth, diagnostic doubt',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'When does a lipoma worry you?',
        answer:
          'When it suggests a liposarcoma rather than a lipoma. The features are: size greater than 5 cm, a plane DEEP to the deep fascia (especially retroperitoneal, thigh or shoulder girdle), rapid or recent acceleration in growth, pain, fixity, and recurrence after previous excision. Any of those means imaging with MRI and a planned biopsy — core or incisional along the line of a future excision — before surgery, rather than a simple enucleation, because a liposarcoma shelled out through an unplanned incision contaminates the whole field and makes limb-sparing surgery harder.',
        examinerTip:
          'Deep to the deep fascia and bigger than 5 cm are the two the examiner is listening for.',
      },
      {
        question: 'Name the types of lipoma by situation.',
        answer:
          'Subcutaneous (much the commonest), subfascial, intermuscular and intramuscular, subsynovial, subserosal, submucosal, extradural, subperiosteal, retroperitoneal, and parosteal. Special named forms: Dercum disease (adiposis dolorosa — multiple painful lipomas, typically in obese postmenopausal women), Madelung disease (benign symmetrical lipomatosis of the neck, the "horse collar"), familial multiple lipomatosis, and the naevolipoma and fibrolipoma variants.',
        examinerTip:
          '"The universal tumour" — it occurs wherever fat occurs, which is everywhere except the brain. That line is worth having.',
      },
    ],
  },

  {
    id: 'sebaceous_cyst_proforma',
    title: 'Sebaceous Cyst (Epidermoid Cyst)',
    system: 'General Surgery',
    department: 'General Surgery',
    summary:
      'The short case that is diagnosed from two findings — a punctum, and skin that cannot be pinched off the swelling. Both follow directly from the fact that it arises from the skin itself.',
    examPearl:
      'The skin is NOT pinchable over a sebaceous cyst, because the cyst arises from the skin. That one finding separates it from every subcutaneous swelling, and the punctum — the blocked duct — confirms it.',
    sections: [
      {
        title: 'What makes it a sebaceous cyst',
        items: [
          {
            label: 'History and inspection',
            description: 'A slowly growing painless swelling where there are sebaceous glands.',
            checklist: [
              'Duration in years; started pea-sized and grew slowly',
              'Painless and without discharge — unless it has become infected, and then it is red, hot, tender and discharging',
              'Sites: scalp, face, neck, back, scrotum — anywhere with sebaceous glands. NEVER on the palm or the sole, which have none',
              'Solitary swelling, spherical or hemispherical, well defined, smooth surface',
              'PUNCTUM on the summit — a small dark depressed spot, the blocked duct. Present in about half',
              'No dilated veins, no visible pulsation, no scar',
            ],
            clinicalSign:
              'A sebaceous cyst cannot occur on the palm or the sole. Being asked where it never occurs is a standard viva opener.',
          },
          {
            label: 'Palpation — the two decisive findings',
            description: 'Everything else follows the master swelling framework.',
            checklist: [
              'CONSISTENCY cystic, with MOULDING — it can be indented and holds the indentation, because the contents are pultaceous sebum rather than free fluid',
              'FLUCTUATION positive (Paget test)',
              'TRANSILLUMINATION NEGATIVE — the contents are opaque',
              'SKIN NOT PINCHABLE over the swelling — the cyst arises FROM the skin',
              'Plane: arises from the skin, freely mobile over the underlying structures',
              'Not warm, not tender (unless infected); regional nodes not palpable',
            ],
          },
          {
            label: 'Complications, investigation and treatment',
            description: 'The complications are the examinable part.',
            checklist: [
              'COMPLICATIONS: infection, ulceration, a SEBACEOUS HORN (dried sebum protruding as a horn), COCK PECULIAR TUMOUR (an infected, ulcerated, granulating cyst of the scalp that mimics an epithelioma), calcification, and rarely malignant change',
              'Differential: dermoid cyst (punctum absent, deeper plane, at a line of embryological fusion), lipoma (skin pinchable, slip sign), neurofibroma, cold abscess',
              'Investigation: usually none; it is a clinical diagnosis',
              'Treatment: COMPLETE EXCISION of the cyst WITH ITS WALL, under local anaesthesia, with an elliptical incision including the punctum',
              'Incomplete removal of the wall is the cause of recurrence — that is the whole surgical point',
              'An infected cyst is drained first and excised later, when the inflammation has settled',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'What is Cock peculiar tumour?',
        answer:
          'An infected, ulcerated sebaceous cyst — classically of the scalp — in which the wall has given way and the granulation tissue proliferates through the opening to form an everted, oedematous, granulomatous mass with a purulent discharge. It closely mimics a squamous cell carcinoma or a fungating epithelioma of the scalp, which is precisely why it has a name. The differentiation is made by the history of a pre-existing cyst, the absence of a hard everted malignant edge and of lymph node involvement, and ultimately by excision biopsy, which is also the treatment.',
        examinerTip:
          'Say what it mimics. The name is only memorable because the mistake is dangerous.',
      },
      {
        question: 'Why does a sebaceous cyst recur?',
        answer:
          'Because the cyst wall — the lining epithelium — was not completely removed. The wall is the secreting structure, so any fragment left behind continues to produce sebum and the cyst reforms. This is why the operation is excision of the cyst with an intact wall through an elliptical incision that includes the punctum, and not simple incision and expression of the contents. When the cyst has previously been infected the wall is adherent and fragmented, which is exactly when recurrence is commonest — so an infected cyst is drained first and excised later once the inflammation has settled and a plane can be found.',
        examinerTip:
          'The wall is the pathology. Expressing the contents treats nothing.',
      },
    ],
  },

  {
    id: 'hydrocele_proforma',
    title: 'Hydrocele',
    system: 'General Surgery',
    department: 'Urology / General Surgery',
    summary:
      'The commonest scrotal short case. Three findings make it: you can get above the swelling, it transilluminates, and the testis cannot be felt separately. Each one of the three excludes a different thing.',
    examPearl:
      'GETTING ABOVE THE SWELLING is what separates a scrotal swelling from an inguinoscrotal one — that is, a hydrocele from a hernia — and it is done before transillumination, not after. If you cannot get above it, it came down from the abdomen.',
    sections: [
      {
        title: 'History and Examination',
        items: [
          {
            label: 'History',
            description: 'Painless scrotal swelling that does not reduce.',
            checklist: [
              'Side; duration; insidious onset, slowly progressive',
              'DOES NOT REDUCE ON LYING DOWN — asked directly, because a hernia does',
              'No aggravating or relieving factor; no pain',
              'No history of trauma, no fever with chills and rigor (filarial or pyocele)',
              'No heavy weight lifting, no chronic cough, no straining at stool or micturition — the hernia risk factors, asked to exclude',
              'No burning micturition, urethral discharge or urinary symptoms',
              'DRAGGING SENSATION and difficulty in walking or sitting when large',
              'Effect on sexual function and fertility; any other swelling; loss of weight',
              'In a child: whether it varies in size through the day (congenital, communicating)',
            ],
          },
          {
            label: 'Examination — patient standing first, then lying',
            description: 'Position matters and is recorded.',
            checklist: [
              'INSPECTION standing: side, size in two dimensions, shape (oval, pyriform), extent',
              'Skin STRETCHED and SHINY with LOSS OF RUGOSITY',
              'No dilated veins, no ulcer, no discharge, no sinus',
              'PENIS — whether in the midline or buried; in a very large hydrocele the penis is buried in the swelling',
              'COUGH IMPULSE — negative in a hydrocele, positive in a hernia and in a congenital hydrocele',
              'PALPATION: not warm, not tender; confirm inspectory findings',
              'CAN YOU GET ABOVE THE SWELLING? Yes in a hydrocele — the fingers meet above it and the cord is felt normally',
              'REDUCIBILITY — not reducible',
              'FLUCTUATION positive; TRANSILLUMINATION POSITIVE — in a dark room, with a torch behind the swelling',
              'Consistency cystic; TESTIS NOT PALPABLE SEPARATELY — it is surrounded by the fluid',
              'Examine the opposite side, the cord, and both inguinal regions; examine the abdomen',
            ],
            clinicalSign:
              'Transillumination is NEGATIVE in a haematocele, a pyocele, a thickened chronic hydrocele sac, and in a testicular tumour — which is exactly why a non-transilluminating scrotal swelling needs an ultrasound, not a tapping needle.',
          },
          {
            label: 'Types, investigation and treatment',
            description: 'The classification is asked every time.',
            checklist: [
              'PRIMARY (idiopathic) versus SECONDARY (to epididymo-orchitis, trauma, filariasis, tuberculosis, or a TESTICULAR TUMOUR)',
              'By anatomy: vaginal hydrocele, congenital (communicating with the peritoneal cavity), infantile (up to the deep ring but not communicating), encysted hydrocele of the cord, and hydrocele en bisac',
              'ULTRASOUND OF THE SCROTUM — confirms the fluid, and more importantly examines the TESTIS, which cannot be felt through a hydrocele',
              'Routine investigations for fitness; night blood smear where filariasis is endemic',
              'Treatment: JABOULAY procedure (eversion of the sac), LORD plication for a thin-walled sac, excision of the sac for a thick-walled one',
              'Aspiration alone is not a treatment — it recurs, and it risks introducing infection and bleeding',
              'A secondary hydrocele is treated by treating the cause',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Why must every hydrocele have an ultrasound?',
        answer:
          'Because the testis cannot be palpated through the fluid, and a hydrocele can be SECONDARY to a testicular tumour. A young man with a new hydrocele who is treated by eversion of the sac alone, without imaging, can have a germ cell tumour missed — and scrotal surgery through an incision over a tumour alters the lymphatic drainage of the testis from the para-aortic nodes to the inguinal nodes, which changes the staging and the field of any subsequent radiotherapy. Ultrasound also distinguishes a hydrocele from a haematocele, a pyocele, a chronic epididymal cyst and a hernia when the clinical findings are equivocal.',
        examinerTip:
          'The lymphatic drainage point is the one that earns the mark: a scrotal incision on an undiagnosed tumour is a staging error you cannot undo.',
      },
      {
        question: 'Differentiate a hydrocele from an inguinoscrotal hernia at the bedside.',
        answer:
          'GETTING ABOVE THE SWELLING: possible in a hydrocele (the fingers meet above it and a normal cord is felt), impossible in an inguinoscrotal hernia, which is continuous with the inguinal canal. COUGH IMPULSE: absent in a hydrocele, present in a hernia. REDUCIBILITY: a hydrocele is irreducible, a hernia reduces on lying down or with taxis. TRANSILLUMINATION: positive in a hydrocele, negative in a hernia — although an infantile hernia containing bowel may give a deceptive glow. PERCUSSION and AUSCULTATION: resonance and bowel sounds in a hernia containing bowel. And the TESTIS is separately palpable in a hernia but not in a hydrocele.',
        examinerTip:
          'Lead with "can I get above it". It is the first manoeuvre and it answers the question on its own most of the time.',
      },
    ],
  },

  {
    id: 'dermoid_cyst_proforma',
    title: 'Dermoid Cyst',
    system: 'General Surgery',
    department: 'General Surgery',
    summary:
      'A short case decided by SITE. A cystic swelling sitting exactly on a line of embryological fusion — the outer angle of the eye, the midline, the root of the nose — with no punctum and a deeper plane than a sebaceous cyst.',
    examPearl:
      'A sequestration dermoid sits at a LINE OF FUSION, and the commonest is the external angular dermoid at the outer canthus. Say the embryology — skin sequestered beneath the surface where two ectodermal folds met — and the site stops being a coincidence.',
    sections: [
      {
        title: 'History, Examination and Management',
        items: [
          {
            label: 'History',
            description: 'Present since birth or early life, though often noticed later.',
            checklist: [
              'Duration; frequently present since childhood, growing slowly',
              'Painless, no discharge, no fever, no trauma',
              'No secondary changes over the swelling',
              'At the outer angle of the eye, ask specifically: no difficulty opening the eyelid, no defective vision, redness or discharge from the eye',
              'NO HEADACHE, VOMITING OR SEIZURES — asked because a midline dermoid, particularly at the root of the nose or over the anterior fontanelle, may have an intracranial extension',
              'No loss of appetite or weight; no other swelling',
            ],
            clinicalSign:
              'A midline dermoid over the nasal root or the fontanelle needs imaging before excision. An unsuspected intracranial extension turns a minor excision into a CSF leak and meningitis.',
          },
          {
            label: 'Examination',
            description: 'Site first, then the standard swelling sequence.',
            checklist: [
              'SITES: external angular (outer canthus — commonest), internal angular, root of the nose, midline of the neck, sublingual, over the anterior fontanelle, and post-auricular',
              'Solitary, hemispherical or spherical, smooth surface, well defined margin',
              'Skin over it stretched and shiny but PINCHABLE; NO PUNCTUM — this is what separates it from a sebaceous cyst',
              'Soft to cystic consistency; FLUCTUATION POSITIVE; slip sign negative',
              'TRANSILLUMINATION NEGATIVE — the contents are sebum, desquamated epithelium and hair',
              'Plane: subcutaneous, often deeper, and frequently adherent to the periosteum',
              'BONY INDENTATION beneath — felt in a long-standing external angular dermoid, from pressure erosion. Its presence means a CT before excision',
              'Not compressible, not reducible, no cough impulse, not pulsatile',
              'Regional lymph nodes not palpable',
            ],
          },
          {
            label: 'Types, investigation and treatment',
            description: 'Four types, and the investigation depends on the site.',
            checklist: [
              'SEQUESTRATION dermoid — congenital, at a line of embryological fusion. The one in the short case',
              'IMPLANTATION dermoid — acquired, from epidermis driven beneath the skin by a prick injury; typically on the fingers of tailors, gardeners and housewives',
              'TUBULO-DERMOID — from an unobliterated embryonic tube, such as a thyroglossal cyst',
              'TERATOMATOUS dermoid — from totipotent cells; ovary, testis, retroperitoneum, mediastinum',
              'Investigation: X-ray for bony indentation; CT or MRI for a midline or nasal dermoid to exclude intracranial extension BEFORE surgery',
              'Ultrasound to confirm the cystic nature and the plane',
              'Treatment: complete EXCISION with the cyst wall intact. In an external angular dermoid the incision is placed in the eyebrow line',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'How does a dermoid cyst differ from a sebaceous cyst?',
        answer:
          'A dermoid is CONGENITAL, lies at a line of embryological fusion, has NO PUNCTUM, is lined by full-thickness skin with its appendages (hair follicles, sweat and sebaceous glands) and often contains hair, lies deeper — subcutaneous and frequently adherent to periosteum — with pinchable skin over it, and may produce bony indentation. A sebaceous cyst is ACQUIRED, occurs anywhere with sebaceous glands but never on the palm or sole, has a PUNCTUM in about half of cases, is lined by epidermis only, arises FROM the skin so the skin cannot be pinched over it, shows moulding, and does not indent bone.',
        examinerTip:
          'Punctum and pinchability are the two bedside discriminators. Embryology and lining are the two pathological ones. Give both pairs.',
      },
    ],
  },

  {
    id: 'undescended_testis_proforma',
    title: 'Undescended Testis and the Empty Scrotum',
    system: 'General Surgery',
    department: 'Paediatric Surgery / Urology',
    summary:
      'An empty hemiscrotum in a child, and the case is about telling a truly undescended testis from a retractile one — because one needs an operation and the other needs reassurance.',
    examPearl:
      'A RETRACTILE testis can be coaxed into the scrotum and STAYS there for a moment when released; an undescended testis cannot be brought down, or springs straight back. Examine with warm hands in a warm room, because a cold room produces a brisk cremasteric reflex and a false diagnosis.',
    sections: [
      {
        title: 'History and Examination',
        items: [
          {
            label: 'History',
            description: 'Short, and mostly from the parents.',
            checklist: [
              'Which side, or both; noticed at birth or later',
              'Has the testis EVER been seen or felt in the scrotum — and by whom, and when',
              'Does it come down during a warm bath (the single most useful question; a retractile testis does)',
              'Birth history: PREMATURITY — undescended testis is far commoner in preterm infants and most descend in the first few months',
              'Associated hernia, hypospadias or other genital anomaly',
              'Pain, swelling or sudden pain in the groin — torsion of an undescended testis',
              'Family history of undescended testis or infertility',
              'In an adult: infertility, and any groin or abdominal mass',
            ],
          },
          {
            label: 'Examination',
            description: 'Warm room, warm hands, patient supine and then standing and squatting.',
            checklist: [
              'SCROTUM: development of the affected hemiscrotum — HYPOPLASTIC and poorly rugated on the affected side in true undescent, and normally developed in a retractile testis',
              'Inspect for a scar of previous surgery',
              'Palpate from the anterior superior iliac spine along the inguinal canal DOWNWARDS AND MEDIALLY towards the scrotum, milking the testis down — never start at the scrotum',
              'If found: can it be brought into the scrotum, and does it STAY there when released?',
              'Ectopic sites if not in the line of descent: superficial inguinal pouch, femoral triangle, perineum, base of the penis, opposite scrotum',
              'Examine for an associated INGUINAL HERNIA — present in a high proportion',
              'The opposite testis: note COMPENSATORY HYPERTROPHY, which suggests the absent one is truly absent',
              'Secondary sexual characters; in bilateral cases look for signs of an intersex state and examine the phallus and urethral meatus',
              'Abdominal examination for a mass',
            ],
            clinicalSign:
              'A hypoplastic hemiscrotum means the testis has never been there. A normally developed one with an impalpable testis today points at a retractile testis instead.',
          },
          {
            label: 'Investigations, complications and treatment',
            description: 'Timing is the examinable point.',
            checklist: [
              'ULTRASOUND of the groin and abdomen — useful for a palpable or canalicular testis, poor for an intra-abdominal one',
              'MRI where available; DIAGNOSTIC LAPAROSCOPY is the gold standard for an IMPALPABLE testis and is diagnostic and therapeutic in the same sitting',
              'Hormonal assay (LH, FSH, testosterone) and karyotype in bilateral impalpable testes, with hCG stimulation to prove testicular tissue exists',
              'COMPLICATIONS: infertility, MALIGNANCY (seminoma, and the risk persists in the contralateral normally descended testis too), torsion, trauma against the pubic bone, associated hernia, and psychological effects',
              'TREATMENT: ORCHIDOPEXY, ideally between 6 and 18 months of age and certainly before 2 years — spermatogenic damage begins in the second year',
              'Dartos pouch orchidopexy is the standard; Fowler-Stephens (staged, dividing the testicular vessels and relying on the collateral from the vas) for a high intra-abdominal testis',
              'Orchidectomy for a post-pubertal unilateral intra-abdominal testis, because of the malignancy risk and its negligible fertility contribution',
              'Hormonal therapy has a limited role and works mainly in retractile testes',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Does orchidopexy remove the risk of malignancy?',
        answer:
          'No. Orchidopexy does NOT abolish the increased risk of testicular malignancy — it reduces it somewhat when done early, but its main value is that it places the testis where it can be EXAMINED and where a tumour will be found early, and it preserves fertility. The risk is also increased in the CONTRALATERAL, normally descended testis, which tells you the abnormality is in the gonad itself rather than purely in its position. The commonest tumour is seminoma. Patients must therefore be taught self-examination and followed up, and the operation must never be presented to parents as removing the cancer risk.',
        examinerTip:
          'The contralateral testis point is what proves you understand the answer rather than reciting it.',
      },
      {
        question: 'Undescended versus retractile versus ectopic testis.',
        answer:
          'UNDESCENDED (cryptorchid): the testis has arrested somewhere ALONG the normal line of descent — intra-abdominal, at the deep ring, in the inguinal canal, or at the superficial ring. The hemiscrotum is hypoplastic and the testis cannot be brought to the bottom of the scrotum, or springs straight back. RETRACTILE: a normally descended testis pulled up by an active cremasteric reflex; the hemiscrotum is NORMALLY developed, the testis can be milked into the scrotum and STAYS there momentarily on release, and it needs no operation, only reassurance and review. ECTOPIC: the testis has descended but come to lie OUTSIDE the normal path — superficial inguinal pouch (commonest ectopic site), femoral triangle, perineum, base of penis, or the opposite scrotum; the gubernaculum is at fault and the testis is usually normally developed.',
        examinerTip:
          'The development of the hemiscrotum is the bedside discriminator between undescended and retractile. Lead with it.',
      },
    ],
  },
];
