import type { ClinicalProforma } from '@/lib/clinical/types';

/**
 * Surgery SHORT cases — built from `docs/clinical_materials/case_sheets/Short_cases-1.txt`.
 *
 * A short case is not a small long case. There is no history unless the
 * examiner asks for one; you are shown a swelling or an ulcer, and you have
 * about five minutes to inspect, palpate, give the findings in order and
 * commit to a diagnosis. So every proforma here is built around the examination
 * sequence rather than around the clerking, and each one ends with the single
 * sentence that is actually being marked — the summary that names site, size,
 * shape, plane, consistency and diagnosis in one breath.
 *
 * The two schemes that recur, and that every one of these cases is an instance
 * of, are in the first section of each: the swelling scheme and the ulcer
 * scheme. They are repeated per case rather than cross-referenced because in
 * the exam you get one case, not an index.
 */

/** Shared opening section — the order every swelling is described in. */
const SWELLING_SCHEME = {
  title: 'Examination scheme for ANY swelling',
  items: [
    {
      label: 'Inspection — eight things, in this order',
      description:
        'Say them in this order every time. An examiner is listening for the order as much as for the findings, because the order is what stops you omitting one.',
      checklist: [
        'SITE — anatomical, with reference to a bony landmark',
        'SIZE — in centimetres, two dimensions, never "like a lemon"',
        'SHAPE — spherical, ovoid, hemispherical, irregular, pear-shaped',
        'EXTENT — upper, lower, medial and lateral limits, each measured from a fixed landmark',
        'SURFACE — smooth, lobulated, nodular, irregular',
        'MARGINS / EDGE — well defined or ill defined (ill defined suggests infiltration or inflammation)',
        'SKIN OVER THE SWELLING — normal, stretched, shiny, red, pigmented, ulcerated; punctum; peau d\'orange',
        'SPECIAL FEATURES — visible pulsation, peristalsis, scar, sinus, dilated veins, impulse on cough, secondary changes',
      ],
    },
    {
      label: 'Palpation — the order that separates the diagnoses',
      description:
        'Warmth and tenderness FIRST, before you press: a tender swelling handled roughly ends the examination.',
      checklist: [
        'Local rise of temperature — with the back of the hand, comparing both sides',
        'Tenderness — watch the face, not the hand',
        'Confirm every inspectory finding: site, size, shape, extent, surface, margins',
        'CONSISTENCY — soft (lipoma), cystic (cyst, hydrocele), firm (fibroma), hard (malignancy), variable (lipoma, sarcoma), bony hard',
        'FLUCTUATION — Paget test in two perpendicular planes, with the smaller of the two examining fingers fixed. Positive means fluid. It is unreliable below about 2 cm',
        'TRANSILLUMINATION — in a dark room, torch applied to the side. Positive means clear fluid: hydrocele, cystic hygroma, meningocele. NEGATIVE in a haematocele, a pyocele and a solid tumour',
        'PLANE — skin (moves with the skin, skin not pinchable over it), subcutaneous (skin pinchable, swelling moves freely), muscle (mobility reduced when the muscle is contracted), deep to muscle (mobility unchanged or reduced on contraction), bone (immobile)',
        'MOBILITY — in two planes, and relative to the plane it lies in',
        'COMPRESSIBILITY vs REDUCIBILITY — compressible refills on release from the same place (haemangioma, lymphangioma); reducible goes back into a cavity and needs a cough impulse to return (hernia)',
        'PULSATILITY — and whether it is EXPANSILE (aneurysm: two fingers separate) or TRANSMITTED (a swelling lying on an artery: fingers move together)',
        'SLIP SIGN — the edge of a lipoma slips away from the examining finger; positive is close to diagnostic',
        'GETTING ABOVE THE SWELLING — in a scrotal swelling, whether you can pinch normal cord above it. You cannot in an inguinoscrotal hernia',
        'REGIONAL LYMPH NODES — always, and name the group',
      ],
    },
    {
      label: 'Percussion, auscultation, and finishing',
      description: 'Short, but skipping them is noticed.',
      checklist: [
        'Percussion — resonant over bowel in a hernia; dull over a solid or cystic swelling',
        'Auscultation — bowel sounds in a hernia; a bruit over a vascular swelling or a toxic goitre',
        'Examine the rest of the region, the other side, and the draining nodes',
        'State that you would complete with a general and systemic examination',
      ],
    },
  ],
};

export const SURGERY_SHORT_CASES: ClinicalProforma[] = [
  {
    id: 'short_lipoma',
    title: 'Lipoma',
    system: 'General Surgery',
    caseType: 'short',
    department: 'General Surgery',
    source: 'Short_cases-1.pdf',
    summary:
      'The universal tumour — a soft, lobulated, freely mobile subcutaneous swelling with a positive slip sign. The commonest short case there is, and the one that tests whether you can describe a swelling properly.',
    examPearl:
      'The slip sign is the sign. Press the edge of the swelling with a finger: a lipoma\'s edge slips out from under it, because the lobulated fat is contained by a thin capsule that offers no resistance. Demonstrate it, name it, and then say "pseudofluctuation" — fat at body temperature is semi-fluid, so a large lipoma can appear to fluctuate without containing any fluid at all.',
    sections: [
      {
        title: '1. History — kept short, because a short case is not a clerking',
        items: [
          {
            label: 'The three questions that matter',
            description:
              'A painless, slowly growing swelling present for years, with no secondary change, is the whole history of a lipoma.',
            checklist: [
              'Duration, and the size it started at — "the size of an almond four years ago"',
              'Onset insidious, progression slow. A lipoma that has grown rapidly is a liposarcoma until proved otherwise',
              'PAINLESS — pain in a lipoma suggests it is a neurofibroma, an angiolipoma, or that it has become inflamed',
              'No fever, no trauma, no discharge, no ulceration',
              'Any other swelling elsewhere? — multiple lipomas mean familial lipomatosis, Dercum disease (painful, in obese middle-aged women), or Madelung disease (neck, in alcoholics)',
              'No loss of weight or appetite, no restriction of movement',
            ],
          },
        ],
      },
      SWELLING_SCHEME,
      {
        title: '3. Findings that make it a lipoma',
        items: [
          {
            label: 'What you expect to find',
            description: 'Each of these excludes something.',
            checklist: [
              'Soft, sometimes variable in consistency',
              'Surface LOBULATED — the giveaway, and the reason it is lobulated is the fibrous septa between fat lobules',
              'Margins well defined, and the edge SLIPS (slip sign positive)',
              'Skin over it pinchable and normal — so it is SUBCUTANEOUS, not arising from skin (which is what a sebaceous cyst does)',
              'No punctum — a punctum means sebaceous cyst',
              'Freely mobile in all directions; mobility unchanged when the underlying muscle contracts',
              'Fluctuation may be falsely positive (pseudofluctuation); transillumination NEGATIVE',
              'Not compressible, not reducible, not pulsatile',
              'Regional lymph nodes NOT palpable',
            ],
          },
          {
            label: 'Sites and their names',
            description: 'A lipoma arises anywhere there is fat, i.e. everywhere except the brain.',
            checklist: [
              'Subcutaneous — commonest, and the short case you will get',
              'Subfascial, intermuscular, intramuscular — deeper, less mobile, and much harder to distinguish from sarcoma',
              'Subserous, submucous, extradural, subsynovial, intra-articular',
              'Retroperitoneal — presents late, large, and is the one most often malignant',
            ],
          },
        ],
      },
      {
        title: '4. Differential diagnosis',
        items: [
          {
            label: 'What else is a soft subcutaneous swelling',
            description: 'Give three, and give the feature that separates each.',
            checklist: [
              'Sebaceous cyst — arises from SKIN (skin not pinchable over it), has a punctum, moulds, Paget test positive',
              'Neurofibroma — mobile perpendicular to the nerve but not along it; may be tender or give paraesthesiae',
              'Cold abscess — fluctuant, no slip sign, and there is usually a source',
              'Liposarcoma — rapid growth, size over 5 cm, deep to the fascia, fixed, and the reason a deep or fast-growing "lipoma" gets an MRI',
              'Dermoid cyst — at a line of embryonic fusion, and it may indent the underlying bone',
            ],
          },
        ],
      },
      {
        title: '5. Investigations and treatment',
        items: [
          {
            label: 'Investigations',
            description: 'A subcutaneous lipoma needs almost none; a deep one needs imaging.',
            checklist: [
              'A clinically typical subcutaneous lipoma needs no investigation before excision',
              'FNAC — mature adipocytes',
              'Ultrasound — a well-defined hyperechoic lesion in the subcutaneous plane',
              'MRI — for any deep, intramuscular, retroperitoneal, recurrent or rapidly growing lesion. Fat suppresses on STIR, and any non-fatty septation or nodule suggests liposarcoma',
              'Trucut biopsy if sarcoma is suspected — planned so the tract can be excised with the specimen',
            ],
          },
          {
            label: 'Treatment',
            description: 'Excision, and the reason for the capsule.',
            checklist: [
              'Excision under local anaesthesia for a small subcutaneous lipoma; regional or general for a large or deep one',
              'Remove it WITH ITS CAPSULE — a lipoma left with capsule remnants recurs',
              'Indications to remove at all: cosmesis, pressure symptoms, rapid growth, diagnostic doubt, size above 5 cm',
              'A deep or suspicious lesion is treated as a sarcoma: wide local excision with a margin, after imaging and biopsy, not an enucleation',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Why is a lipoma called the universal tumour?',
        answer:
          'Because it arises from adipose tissue, and adipose tissue is present in every part of the body except the brain. So a lipoma can occur anywhere — subcutaneous, intermuscular, submucous, subserous, extradural, retroperitoneal, intra-articular.',
        examinerTip:
          'Follow it immediately with "and it is the commonest benign soft tissue tumour", which is the next question anyway.',
      },
      {
        question: 'What is pseudofluctuation, and why does a lipoma show it?',
        answer:
          'Fluctuation that is present without any contained fluid. Fat at body temperature is semi-fluid, so a large lipoma transmits pressure like a fluid-filled cavity and the fluctuation test appears positive. Transillumination remains negative, which is how you tell it from a true cyst.',
      },
      {
        question: 'What is the slip sign?',
        answer:
          'Pressing the edge of the swelling makes it slip out from under the examining finger, because the lobulated fat is held only by a thin capsule. It is close to diagnostic of a lipoma and is the sign to demonstrate rather than describe.',
      },
      {
        question: 'How would you tell a lipoma from a liposarcoma clinically?',
        answer:
          'Rapid growth, size greater than 5 cm, a deep or retroperitoneal site, fixity to deeper structures, pain, and recurrence after excision. Any of those means imaging (MRI) and a planned biopsy rather than a simple excision.',
        examinerTip: 'Say "the commonest site for liposarcoma is the retroperitoneum and the thigh" before you are asked.',
      },
      {
        question: 'Name the syndromes with multiple lipomas.',
        answer:
          'Familial multiple lipomatosis; Dercum disease (adiposis dolorosa — multiple painful lipomas, typically in obese middle-aged women); Madelung disease or Launois-Bensaude syndrome (symmetrical lipomatosis of the neck, "horse collar", in alcoholics); and Gardner syndrome, in which lipomas accompany osteomas and colonic polyps.',
      },
    ],
  },

  {
    id: 'short_hydrocele',
    title: 'Hydrocele',
    system: 'General Surgery',
    caseType: 'short',
    department: 'General Surgery / Urology',
    source: 'Short_cases-1.pdf',
    summary:
      'A cystic scrotal swelling you can get above, that transilluminates, and in which the testis cannot be felt separately. The three findings are the diagnosis.',
    examPearl:
      'Two questions settle every scrotal swelling before you touch consistency. Can you GET ABOVE IT? — if not, it is an inguinoscrotal hernia, not a hydrocele. Is the TESTIS palpable separately? — if it is, the fluid is not around the testis and you are dealing with a cyst of the epididymis or a spermatocele. Examine the patient STANDING first, then lying.',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'What to ask',
            description: 'A painless scrotal swelling of years, that does not reduce on lying down.',
            checklist: [
              'Duration, onset insidious, slow progression',
              'DOES IT REDUCE ON LYING DOWN? — a hydrocele does not; a hernia usually does',
              'Painless. Pain suggests infection, torsion, or a haematocele',
              'No trauma (haematocele), no fever with chills and rigor (pyocele, filariasis)',
              'No heavy weight lifting, no chronic cough or straining (the hernia questions)',
              'No loss of weight or appetite, no other swelling (testicular tumour with a secondary hydrocele)',
              'No burning micturition, no urethral discharge (epididymo-orchitis)',
              'In an endemic area, ask about filariasis: recurrent fever, lymphangitis, limb swelling',
            ],
          },
        ],
      },
      SWELLING_SCHEME,
      {
        title: '3. Scrotal examination — the additions that are specific to it',
        items: [
          {
            label: 'Inspection, patient STANDING',
            description: 'Standing first: a small hydrocele and a varicocele both disappear lying down.',
            checklist: [
              'Side, size, shape, and extent — from the root of the scrotum to its bottom',
              'Skin: STRETCHED AND SHINY with LOSS OF RUGOSITY — the classic description of a tense hydrocele',
              'No dilated veins (varicocele — "bag of worms"), no ulcer, no discharging sinus',
              'Position of the penis: buried or displaced in a large hydrocele; note whether it is in the midline',
              'COUGH IMPULSE — negative in a hydrocele, positive in a hernia and in a congenital (communicating) hydrocele',
            ],
          },
          {
            label: 'Palpation',
            description: 'The three findings that make the diagnosis, in order.',
            checklist: [
              '1. CAN YOU GET ABOVE IT? — pinch the cord at the neck of the scrotum between thumb and fingers. If you can feel normal cord above the swelling, the swelling is scrotal. If not, it is inguinoscrotal and it is a hernia',
              '2. FLUCTUATION positive, in two perpendicular planes',
              '3. TRANSILLUMINATION positive — a dark room, torch to the side of the swelling. Positive means CLEAR fluid',
              'Consistency cystic, smooth, tense or lax',
              'TESTIS NOT SEPARATELY PALPABLE — the fluid surrounds it. Feel for testicular sensation by gently squeezing: it is present but the testis cannot be outlined',
              'Not reducible, no impulse on cough',
              'Examine the OTHER side, the cord, the inguinal region and the abdomen',
            ],
          },
        ],
      },
      {
        title: '4. Types, and the classification asked for',
        items: [
          {
            label: 'Primary (idiopathic) vs secondary',
            description: 'A large lax hydrocele in an older man is usually primary; a small tense one in a young man is usually secondary, and the cause matters more than the fluid.',
            checklist: [
              'PRIMARY — no underlying testicular pathology; usually large and lax; middle-aged and elderly',
              'SECONDARY — to epididymo-orchitis, tuberculosis, testicular tumour, trauma, filariasis, or post-herniorrhaphy. Usually small and lax, and the testis is often abnormal. ALWAYS examine the testis and, if you cannot, get an ultrasound',
            ],
          },
          {
            label: 'Anatomical types',
            description: 'By what part of the processus vaginalis has stayed patent.',
            checklist: [
              'Vaginal hydrocele — the commonest; fluid confined to the tunica vaginalis',
              'Congenital hydrocele — the processus is patent up to the peritoneum, with a narrow neck; fluid reduces on lying down and it is associated with a hernia',
              'Infantile hydrocele — the processus is obliterated at the deep ring but patent distally; extends up to the deep ring but does NOT communicate with the peritoneum',
              'Encysted hydrocele of the cord — a smooth swelling in the cord that MOVES DOWN when the testis is pulled down (the traction test) and becomes less mobile when the cord is made taut',
              'Hydrocele of the canal of Nuck — the female equivalent, in the labium majus',
              'Hydrocele en bisac (bilocular) — has an abdominal and a scrotal component communicating through the inguinal canal; pressing one fills the other',
            ],
          },
        ],
      },
      {
        title: '5. Investigations and treatment',
        items: [
          {
            label: 'Investigations',
            description: '',
            checklist: [
              'ULTRASOUND OF THE SCROTUM — mandatory in a secondary hydrocele or whenever the testis cannot be palpated, to exclude an underlying tumour',
              'Routine: haemogram, blood sugar, urine, and the pre-anaesthetic panel',
              'Night blood smear for microfilariae in an endemic area',
              'Serum AFP, beta-hCG and LDH if a testicular tumour is suspected',
            ],
          },
          {
            label: 'Treatment',
            description: 'Operative, and the choice is by sac thickness.',
            checklist: [
              "LORD'S PLICATION — for a thin-walled sac. The sac is plicated with a series of interrupted sutures around the testis. Minimal dissection, so least haematoma",
              "JABOULAY'S EVERSION OF THE SAC — for a moderately thickened sac. The sac is opened and everted behind the testis and sutured",
              'SUBTOTAL EXCISION OF THE SAC — for a very thick or calcified sac',
              'Aspiration alone recurs and risks introducing infection; aspiration with sclerosant is reserved for those unfit for surgery',
              'A CONGENITAL hydrocele is treated as a hernia — herniotomy, with high ligation of the sac at the deep ring. Never a scrotal approach',
              'A hydrocele secondary to a testicular tumour is managed by INGUINAL orchidectomy with high cord ligation — never through the scrotum, which would seed the inguinal nodes and change the lymphatic drainage',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'What is a hydrocele, and where does the fluid lie?',
        answer:
          'An abnormal collection of serous fluid within the tunica vaginalis, which is the remnant of the processus vaginalis. In a vaginal hydrocele the fluid lies between the parietal and visceral layers of the tunica, which is why the testis cannot be felt separately.',
      },
      {
        question: 'Why can you get above a hydrocele but not above an inguinoscrotal hernia?',
        answer:
          'A hydrocele arises in the tunica vaginalis, which is entirely scrotal, so normal spermatic cord can be pinched above it. A hernia descends through the inguinal canal and the deep ring, so its contents are continuous with the abdomen and there is no normal cord above.',
        examinerTip:
          'This is the single most asked question in the scrotal short case. Answer it with the anatomy, not just the sign.',
      },
      {
        question: 'When is transillumination negative in a scrotal swelling?',
        answer:
          'When the contents are not clear fluid: haematocele, pyocele, a chylocele of filariasis, a hydrocele with a thickened or calcified sac, a testicular tumour, and a hernia containing bowel or omentum.',
      },
      {
        question: 'A young man with a small tense hydrocele — what is your concern?',
        answer:
          'A secondary hydrocele over a testicular tumour. The testis is unpalpable through the fluid, so it must be imaged: an urgent ultrasound of the scrotum with tumour markers (AFP, beta-hCG, LDH). If a tumour is confirmed, the approach is a high inguinal orchidectomy, never a scrotal incision.',
      },
      {
        question: 'What is Chevassu manoeuvre, and what is the traction test?',
        answer:
          'Chevassu manoeuvre is clamping the cord at the deep inguinal ring before mobilising a testicular tumour, to prevent haematogenous and lymphatic dissemination during handling. The traction test is for an encysted hydrocele of the cord: pulling the testis downwards makes the swelling move down, and it becomes fixed when the cord is made taut.',
      },
      {
        question: 'What is the composition of hydrocele fluid?',
        answer:
          'Clear, amber, straw-coloured fluid with a specific gravity of about 1.022–1.024, containing albumin, fibrinogen, inorganic salts and cholesterol crystals. It does not clot on standing unless it is contaminated with blood.',
      },
    ],
  },

  {
    id: 'short_sebaceous_cyst',
    title: 'Sebaceous Cyst (Epidermoid Cyst)',
    system: 'General Surgery',
    caseType: 'short',
    department: 'General Surgery',
    source: 'Short_cases-1.pdf',
    summary:
      'A skin-arising cystic swelling with a punctum, that moulds and in which the skin cannot be pinched off it. The punctum is the diagnosis.',
    examPearl:
      'The plane is what separates it from a lipoma, and the test is pinching the skin. Skin over a SEBACEOUS CYST cannot be pinched off it, because the cyst arises FROM skin; skin over a LIPOMA pinches freely, because the lipoma is under it. Add the punctum and moulding and you have named it.',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'What to ask',
            description: 'A painless swelling of months or years, starting pea-sized.',
            checklist: [
              'Duration, initial size ("pea sized three years ago"), insidious onset, slow progression',
              'Painless and no discharge — pain, redness or discharge means it has become INFECTED, which is the commonest complication',
              'No fever',
              'Any other swelling in the body — multiple sebaceous cysts on the scalp and scrotum are common and may be familial (Gardner syndrome if with osteomas and polyps)',
              'Sites: scalp, face, neck, back, scrotum — anywhere with sebaceous glands. Never the palms or soles, which have none',
            ],
          },
        ],
      },
      SWELLING_SCHEME,
      {
        title: '3. The findings that make it a sebaceous cyst',
        items: [
          {
            label: 'Inspection',
            description: '',
            checklist: [
              'Single or multiple, spherical or hemispherical, smooth surface, well defined margins',
              'PUNCTUM — a small dark pit on the summit, the blocked duct. Present in a minority but diagnostic when there',
              'Skin over it may be stretched; no hair follicles over the summit',
              'No scar, no sinus, no dilated veins, no visible pulsation',
            ],
          },
          {
            label: 'Palpation',
            description: '',
            checklist: [
              'Not warm, not tender (unless infected)',
              'Consistency CYSTIC, with MOULDING — indenting it with a finger leaves a slowly recovering dent, because the contents are semi-solid sebum rather than free fluid',
              'FLUCTUATION positive — Paget test positive',
              'TRANSILLUMINATION negative — the contents are opaque',
              'SKIN NOT PINCHABLE over the swelling — the defining sign. The cyst is in the skin, so skin and cyst move as one',
              'Freely mobile over the underlying structures',
              'Regional lymph nodes not palpable',
            ],
          },
        ],
      },
      {
        title: '4. Complications — the list that gets asked',
        items: [
          {
            label: 'Six complications',
            description: 'Know the two eponyms.',
            checklist: [
              'INFECTION — the commonest; the cyst becomes red, hot, tender and may point and discharge',
              'ULCERATION',
              'SEBACEOUS HORN — dried, hard, projecting sebum from the punctum, like a small horn',
              "COCK'S PECULIAR TUMOUR — an infected, ulcerated sebaceous cyst with everted edges and granulation tissue, on the scalp, which MIMICS a squamous cell carcinoma and is benign",
              'CALCIFICATION',
              'MALIGNANT CHANGE — rare, to squamous cell carcinoma',
            ],
          },
        ],
      },
      {
        title: '5. Investigations and treatment',
        items: [
          {
            label: 'Investigations',
            description: 'Clinical diagnosis; investigation is for the excised specimen.',
            checklist: [
              'Routine blood sugar — a recurrent or infected cyst in a diabetic',
              'Excision biopsy is both the treatment and the confirmation',
              'Histology: a cyst lined by stratified squamous epithelium containing keratin — which is why "epidermoid cyst" is the more accurate name',
            ],
          },
          {
            label: 'Treatment',
            description: 'Excision, and the reason the whole wall must come out.',
            checklist: [
              'COMPLETE EXCISION of the cyst WITH ITS WALL, under local anaesthesia, through an elliptical incision including the punctum',
              'Leaving any of the lining causes recurrence — the lining is what secretes the contents',
              'If infected: incision and drainage plus antibiotics FIRST, then excise the cyst after the inflammation settles. Excising an acutely infected cyst leaves wall behind and it recurs',
              "Cock's peculiar tumour: excise and send for histology, because the clinical picture is of a squamous cell carcinoma",
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Why is "sebaceous cyst" a misnomer?',
        answer:
          'Because the cyst is lined by stratified squamous epithelium and its contents are keratin, not sebum from sebaceous gland epithelium. The correct term is epidermoid cyst (or pilar/trichilemmal cyst on the scalp, which arises from the hair follicle root sheath).',
        examinerTip: 'Say the correct name first, then acknowledge the traditional one.',
      },
      {
        question: 'How do you distinguish a sebaceous cyst from a lipoma at the bedside?',
        answer:
          'By the plane. Skin over a sebaceous cyst cannot be pinched off it and moves with it, because the cyst arises from skin; skin over a lipoma pinches freely. A sebaceous cyst may have a punctum, moulds, and is cystic; a lipoma has no punctum, is soft and lobulated, and has a positive slip sign.',
      },
      {
        question: "What is Cock's peculiar tumour?",
        answer:
          'An infected, ulcerated sebaceous cyst of the scalp with everted edges and exuberant granulation tissue, which looks exactly like a squamous cell carcinoma but is entirely benign. It is excised and sent for histology because the clinical appearance cannot be trusted.',
      },
      {
        question: 'Where does a sebaceous cyst never occur, and why?',
        answer:
          'On the palms and soles, because there are no sebaceous glands and no pilosebaceous units there.',
      },
    ],
  },

  {
    id: 'short_dermoid_cyst',
    title: 'Dermoid Cyst',
    system: 'General Surgery',
    caseType: 'short',
    department: 'General Surgery',
    source: 'Short_cases-1.pdf',
    summary:
      'A cystic swelling at a line of embryonic fusion — classically the outer angle of the eyebrow — that is deep to skin and may indent the bone beneath it.',
    examPearl:
      'Site is the diagnosis. A dermoid sits where two embryonic processes fused: the outer or inner angle of the orbit, the midline of the nose, the midline of the neck, the sublingual region. And the question that follows is always about the BONE: an external angular dermoid can extend intracranially through a bony defect, so a plain X-ray or CT comes before any excision near the orbit.',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'What to ask',
            description: '',
            checklist: [
              'Duration; a congenital (sequestration) dermoid is often noticed in childhood, an implantation dermoid follows an injury',
              'Insidious onset, initially pea-sized, slowly progressive',
              'Painless, no discharge, no fever, no trauma — EXCEPT in an implantation dermoid, where a history of a penetrating injury (a needle prick, a thorn) is the point',
              'Occupation — implantation dermoids occur in tailors, gardeners and manual workers, on the fingers',
              'Any visual symptoms, proptosis, or headache if it is near the orbit',
            ],
          },
        ],
      },
      SWELLING_SCHEME,
      {
        title: '3. The findings that make it a dermoid',
        items: [
          {
            label: 'What you expect',
            description: '',
            checklist: [
              'Situated at a line of embryonic fusion, or at a site of previous injury',
              'Spherical or ovoid, smooth surface, well defined margins',
              'SKIN OVER IT IS FREE AND PINCHABLE — it lies deep to skin, which separates it from a sebaceous cyst',
              'NO PUNCTUM — the other separator from a sebaceous cyst',
              'Cystic, may fluctuate; transillumination usually negative (the contents are sebum, desquamated epithelium and hair)',
              'Mobility may be restricted if it is adherent to bone',
              'FEEL FOR A BONY DEFECT — an external angular dermoid may indent the underlying bone, and the edge of the defect is palpable as a firm rim around it',
              'Regional lymph nodes not palpable',
            ],
          },
          {
            label: 'Types',
            description: 'Four, and only two of them will be your short case.',
            checklist: [
              'SEQUESTRATION dermoid — congenital, from skin sequestrated along a line of fusion. Sites: external angular (commonest, at the outer end of the eyebrow), internal angular, midline of the nose (nasal), post-auricular, sublingual, midline of the neck, the scalp, and the pre-sacral region',
              'IMPLANTATION dermoid — acquired, from skin driven into subcutaneous tissue by a penetrating injury. Fingers and palm, in manual workers',
              'TUBULO-DERMOID — from an unobliterated embryonic tube: thyroglossal cyst, postanal dermoid, ependymal cyst',
              'TERATOMATOUS dermoid — from totipotent cells; ovary, testis, retroperitoneum, mediastinum. Contains all three germ layers',
            ],
          },
        ],
      },
      {
        title: '4. Investigations and treatment',
        items: [
          {
            label: 'Investigations',
            description: 'Imaging before excision, and the reason is intracranial extension.',
            checklist: [
              'X-RAY of the region — to show a bony defect under an external angular dermoid',
              'CT or MRI — mandatory for a midline nasal dermoid or any dermoid near the orbit or scalp, to exclude intracranial extension through a patent fonticulus frontalis. Excising one of those blind risks a CSF leak and meningitis',
              'Ultrasound for a soft-tissue swelling elsewhere',
            ],
          },
          {
            label: 'Treatment',
            description: '',
            checklist: [
              'Complete excision of the cyst with its wall',
              'An external angular dermoid is excised through an incision in the eyebrow or a skin crease, for cosmesis',
              'If intracranial extension is present, a combined approach with neurosurgery',
              'Histology: a cyst lined by stratified squamous epithelium WITH skin appendages — hair follicles, sebaceous and sweat glands — in its wall. That is what distinguishes it histologically from an epidermoid cyst, which has no appendages',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'What is a dermoid cyst, and how does it differ histologically from a sebaceous cyst?',
        answer:
          'A cyst lined by stratified squamous epithelium whose wall CONTAINS SKIN APPENDAGES — hair follicles, sebaceous glands and sweat glands. A sebaceous (epidermoid) cyst is lined by squamous epithelium with no appendages. That single difference is the histological definition.',
      },
      {
        question: 'Name the sites of a sequestration dermoid.',
        answer:
          'Lines of embryonic fusion: the external angular process (outer end of the eyebrow — the commonest), the internal angular, the midline of the nose, post-auricular, the midline of the neck, sublingual, the scalp, and pre-sacral.',
      },
      {
        question: 'Why must an external angular dermoid be imaged before excision?',
        answer:
          'Because it may indent the underlying bone and, rarely, extend intracranially through a bony defect. Excising it without knowing that risks tearing dura, a CSF leak and meningitis. A plain X-ray shows the defect; CT or MRI defines any intracranial component.',
        examinerTip: 'This is the answer the examiner is waiting for — lead with the intracranial extension.',
      },
      {
        question: 'What is an implantation dermoid and who gets one?',
        answer:
          'An acquired dermoid formed when a fragment of skin is driven into the subcutaneous tissue by a penetrating injury. It occurs on the fingers and palms of tailors, gardeners and manual workers, and the history of the injury is the diagnostic clue.',
      },
    ],
  },

  {
    id: 'short_parotid_swelling',
    title: 'Salivary Gland Swelling (Parotid)',
    system: 'General Surgery',
    caseType: 'short',
    department: 'General Surgery / Head & Neck',
    source: 'Short_cases-1.pdf',
    summary:
      'A swelling below and behind the ear lobule that lifts the lobule and obliterates the retromandibular groove. Pleomorphic adenoma until the facial nerve says otherwise.',
    examPearl:
      'Test and report the FACIAL NERVE before you are asked. A parotid swelling with an intact seventh nerve is benign until proved otherwise; a parotid swelling WITH facial palsy is malignant until proved otherwise, and no imaging is needed to say so. The second sign in the same breath is fixity — to skin, to masseter, or to the mandible.',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'The questions, and what each one excludes',
            description:
              'Every negative in this list rules something out. Say them as negatives, because that is how they are marked.',
            checklist: [
              'Duration, onset insidious, slow progression — years of painless slow growth is pleomorphic adenoma',
              'NO variation in size or pain DURING MEALS — a swelling that swells and hurts at mealtimes is obstructive sialadenitis or a duct calculus',
              'NO sudden recent increase in size in a long-standing swelling — that is malignant transformation in a pleomorphic adenoma (carcinoma ex pleomorphic adenoma)',
              'NO pain over the swelling, NO referred pain in the ear (otalgia) — both suggest malignancy',
              'NO deviation of the angle of the mouth, NO difficulty closing the eyelid — facial nerve involvement, i.e. malignancy',
              'NO difficulty opening the mouth (trismus) — suggests deep lobe or pterygoid involvement',
              'NO difficulty in swallowing — a deep lobe tumour pushes the tonsil and soft palate medially',
              'NO fever, NO trauma',
              'NO loss of weight or appetite',
              'PAST HISTORY OF THE SAME SWELLING AND ITS EXCISION — recurrence is common in pleomorphic adenoma if it was enucleated rather than excised with a cuff of gland',
              'Dry mouth and dry eyes, bilateral swelling — Sjögren syndrome, Mikulicz syndrome, sarcoidosis',
              'Alcohol, smoking, HIV status, tuberculosis contact',
            ],
          },
        ],
      },
      SWELLING_SCHEME,
      {
        title: '3. Parotid-specific examination',
        items: [
          {
            label: 'Inspection',
            description: 'Three findings say the swelling is IN the parotid rather than near it.',
            checklist: [
              'Site: in the parotid region — below and in front of the ear, extending behind the ramus of the mandible',
              'EAR LOBULE LIFTED UP AND OUT — the parotid sign',
              'RETROMANDIBULAR GROOVE OBLITERATED — the groove between the mandible and the mastoid is filled in',
              'The swelling is above a line from the angle of the mandible to the tip of the mastoid; below that line it is a lymph node or a submandibular swelling',
              'Skin over it: normal, stretched, red, ulcerated, or fungating',
              'Look for facial asymmetry AT REST — a drooping angle of the mouth, a lost nasolabial fold',
            ],
          },
          {
            label: 'Palpation and the three special examinations',
            description: '',
            checklist: [
              'Consistency: FIRM and lobulated in pleomorphic adenoma; soft/cystic in Warthin tumour; STONY HARD and fixed in carcinoma',
              'FIXITY — to skin, to the masseter (ask the patient to clench the teeth: if mobility reduces, it involves masseter), to the mandible',
              'BIMANUAL PALPATION — one finger inside the mouth, one outside, to feel the DEEP LOBE. A dumb-bell tumour through the stylomandibular tunnel presents as a parapharyngeal swelling pushing the tonsil medially',
              "BIDIGITAL EXAMINATION OF STENSEN'S DUCT — the duct opens opposite the crown of the upper second molar. Palpate along its course for a calculus and look at the orifice for pus",
              'FACIAL NERVE — all five branches. Wrinkle the forehead (temporal), close the eyes tightly against resistance (zygomatic), show the teeth / blow out the cheeks (buccal), purse the lips (marginal mandibular), tense the neck (cervical)',
              'Examine the OTHER parotid, the submandibular glands, the whole oral cavity, and the neck nodes (preauricular, upper deep cervical)',
              'Trismus — measure the inter-incisor distance',
            ],
          },
        ],
      },
      {
        title: '4. Differential diagnosis',
        items: [
          {
            label: 'By what the swelling is',
            description: 'Remember the 80% rule: 80% of salivary tumours are in the parotid, 80% of those are benign, and 80% of the benign ones are pleomorphic adenoma.',
            checklist: [
              'BENIGN — pleomorphic adenoma (the commonest, firm, lobulated, slow); Warthin tumour / adenolymphoma (older men, smokers, often bilateral, soft and cystic, takes up technetium-99m so it is hot on a scan); oncocytoma; basal cell adenoma',
              'MALIGNANT — mucoepidermoid carcinoma (commonest salivary malignancy overall); adenoid cystic carcinoma (perineural spread, so pain and facial palsy early, and late pulmonary metastases); acinic cell carcinoma; carcinoma ex pleomorphic adenoma; adenocarcinoma; squamous cell carcinoma',
              'NON-NEOPLASTIC — acute and chronic sialadenitis, sialolithiasis, parotid abscess, mumps, tuberculosis, sarcoidosis, Sjögren syndrome, sialosis in diabetics and alcoholics, HIV-associated lymphoepithelial cysts',
              'NOT PAROTID AT ALL — a pre-auricular lymph node, a sebaceous cyst, a lipoma, a neurofibroma of the great auricular nerve, a mandibular or masseteric swelling, a temporomandibular joint swelling',
            ],
          },
        ],
      },
      {
        title: '5. Investigations and treatment',
        items: [
          {
            label: 'Investigations',
            description: 'FNAC and cross-sectional imaging. Not an incisional biopsy.',
            checklist: [
              'FNAC of the swelling — safe, accurate for pleomorphic adenoma, and the first specific test',
              'NEVER an incisional or open biopsy of a parotid mass: it seeds the tumour along the tract and risks a permanent facial nerve injury and a salivary fistula',
              'CT or MRI — MRI is better for soft tissue and for the deep lobe and parapharyngeal extension; CT for bone involvement',
              'Ultrasound — for a superficial swelling and to guide FNAC',
              'Sialography if a duct obstruction is suspected — contraindicated in acute infection',
              'Chest X-ray and routine bloods',
            ],
          },
          {
            label: 'Treatment',
            description: 'And the reason enucleation is wrong.',
            checklist: [
              'PLEOMORPHIC ADENOMA — SUPERFICIAL PAROTIDECTOMY with preservation of the facial nerve, taking a cuff of normal gland. Enucleation is condemned: the tumour has microscopic pseudopodia through an incomplete capsule, so enucleation leaves tumour and it recurs multifocally, which is then very difficult to clear without sacrificing the nerve',
              'WARTHIN TUMOUR — superficial parotidectomy, or enucleation with a margin, as it is truly encapsulated',
              'MALIGNANT — total conservative parotidectomy with nerve preservation if the nerve is free; total radical parotidectomy WITH nerve sacrifice and grafting if the nerve is involved; plus neck dissection for node-positive disease and post-operative radiotherapy for high-grade tumours, close margins or perineural invasion',
              'Deep lobe tumour — total parotidectomy',
            ],
          },
          {
            label: 'Complications of parotidectomy to know',
            description: '',
            checklist: [
              'Facial nerve injury — temporary neurapraxia is common, permanent palsy is the feared one',
              "FREY'S SYNDROME (gustatory sweating) — aberrant regeneration of secretomotor parasympathetic fibres into the divided sympathetic supply of the skin's sweat glands, so the patient sweats over the cheek while eating. Confirmed by Minor's starch-iodine test; treated with antiperspirants or botulinum toxin",
              'Greater auricular nerve division — numbness of the ear lobule, and a common complaint',
              'Salivary fistula and sialocele',
              'Haematoma, infection, flap necrosis',
              'First bite syndrome after deep lobe or parapharyngeal surgery',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Why is enucleation of a pleomorphic adenoma condemned?',
        answer:
          'Because its capsule is incomplete and the tumour sends microscopic pseudopodia through it. Enucleation therefore leaves tumour behind and it recurs — typically multifocally, which is far harder to clear and much more likely to cost the facial nerve. Superficial parotidectomy with a cuff of normal gland is the operation.',
        examinerTip: 'The word the examiner wants is "pseudopodia".',
      },
      {
        question: 'How do you know clinically that a parotid swelling is malignant?',
        answer:
          'Facial nerve palsy, pain, rapid recent growth, fixity to skin or to deeper structures, skin ulceration, trismus, and palpable cervical lymph nodes. Facial nerve involvement is the single most reliable of them — a benign parotid tumour does not paralyse the seventh nerve however large it gets.',
      },
      {
        question: "What is Frey's syndrome?",
        answer:
          'Gustatory sweating after parotidectomy. Divided postganglionic parasympathetic secretomotor fibres to the gland regenerate aberrantly into the sympathetic supply of the sweat glands of the overlying skin, so the stimulus to salivate produces sweating and flushing over the cheek instead. Diagnosed with Minor\'s starch-iodine test; treated with topical antiperspirant, botulinum toxin, or prevented by interposing a fascial or SMAS flap at surgery.',
      },
      {
        question: 'What is the 80% rule of salivary gland tumours?',
        answer:
          '80% of salivary gland tumours arise in the parotid; 80% of parotid tumours are benign; 80% of benign parotid tumours are pleomorphic adenoma. The corollary is the useful one: the SMALLER the gland, the more likely a tumour in it is malignant — so a minor salivary gland tumour of the palate is malignant in about half of cases.',
      },
      {
        question: 'Which salivary malignancy spreads perineurally, and why does that matter?',
        answer:
          'Adenoid cystic carcinoma. Perineural spread means it presents early with pain and facial palsy, it extends far beyond its apparent margin along nerves, local recurrence is common, and it metastasises late to the lungs — so patients can live many years with pulmonary metastases. It is the reason margins are so hard to clear and why post-operative radiotherapy is usual.',
      },
      {
        question: 'Which salivary tumour is bilateral and hot on a technetium scan?',
        answer:
          'Warthin tumour (adenolymphoma, papillary cystadenoma lymphomatosum). It occurs in older male smokers, is bilateral in about 10%, is soft and cystic, and concentrates technetium-99m pertechnetate because it contains oncocytes rich in mitochondria — so it appears as a hot spot, which almost no other salivary tumour does.',
      },
    ],
  },

  {
    id: 'short_diabetic_ulcer',
    title: 'Diabetic Foot Ulcer',
    system: 'General Surgery',
    caseType: 'short',
    department: 'General Surgery',
    source: 'Short_cases-1.pdf',
    summary:
      'A punched-out, painless ulcer over a pressure point in a diabetic foot. The ulcer is the presentation; neuropathy and ischaemia are the disease.',
    examPearl:
      'Examine the ULCER, then the FOOT, then the LIMB, then the PATIENT — in that order, and never stop at the ulcer. Two things decide everything about management and neither is in the wound: is there ISCHAEMIA (peripheral pulses, ankle-brachial index) and is there NEUROPATHY (10 g monofilament, vibration, ankle jerk). A neuropathic foot is warm with bounding pulses; an ischaemic one is cold and pulseless, and they are treated in opposite directions.',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'The ulcer',
            description: '',
            checklist: [
              'Duration, mode of onset — spontaneous, or after trivial trauma the patient did not feel (a stone in the shoe, a hot water bottle, walking barefoot)',
              'PAINLESS is the point. A painless ulcer in a diabetic means neuropathy. A PAINFUL one means ischaemia or infection',
              'Progression in size and depth; discharge — serous, purulent, foul-smelling',
              'Previous ulcers, previous amputations, previous healing',
            ],
          },
          {
            label: 'The diabetes and its complications',
            description: 'A diabetic foot case is a diabetes case.',
            checklist: [
              'Duration of diabetes, treatment, compliance, and whether control has ever been monitored (HbA1c)',
              'NEUROPATHY — numbness, tingling, burning feet, loss of sensation, night pain, unsteadiness in the dark',
              'ISCHAEMIA — intermittent claudication and its distance, rest pain, night pain relieved by hanging the leg down',
              'RETINOPATHY — blurred vision, laser treatment, cataract',
              'NEPHROPATHY — frothy urine, swelling of the face, known renal impairment',
              'AUTONOMIC — postural dizziness, gastroparesis, diarrhoea, impotence, ANHIDROSIS of the feet (dry, cracked skin, which is how the portal of entry forms)',
              'Cardiac and cerebrovascular disease, hypertension, dyslipidaemia',
              'Smoking — the single most important modifiable factor for the ischaemic component',
            ],
          },
        ],
      },
      {
        title: '2. Examination of the ULCER',
        items: [
          {
            label: 'Inspection — the ulcer scheme',
            description:
              'Describe an ulcer in this order every time. The EDGE and the FLOOR are what carry the diagnosis.',
            checklist: [
              'SITE — and in a diabetic foot the site is a pressure point: the plantar surface under the metatarsal heads (especially the first and fifth), the heel, the tips of the toes, the interdigital clefts',
              'SIZE and SHAPE in centimetres',
              'NUMBER — single or multiple',
              'EDGE — PUNCHED OUT in a neuropathic (trophic) ulcer; sloping in a healing ulcer; undermined in a tuberculous ulcer; everted/rolled in a squamous carcinoma (Marjolin); beaded and rolled in a basal cell carcinoma',
              'MARGIN — the junction of edge and normal skin: callus (hyperkeratosis) around a neuropathic ulcer is characteristic',
              'FLOOR — what you see: healthy granulation (red, granular, bleeds on touch), pale unhealthy granulation, slough, necrotic tissue, exposed tendon or bone',
              'BASE — what you feel: indurated, soft, fixed to bone',
              'DISCHARGE — serous, purulent, foul (anaerobes)',
              'SURROUNDING SKIN — cellulitis, oedema, pigmentation, dryness and fissuring, callosity, previous scars',
            ],
          },
          {
            label: 'Palpation of the ulcer',
            description: '',
            checklist: [
              'Temperature and tenderness',
              'Base — induration suggests chronicity or malignancy',
              'PROBE TO BONE — a sterile probe reaching bone through the ulcer has a high positive predictive value for OSTEOMYELITIS. This is a bedside test and it is worth a great deal',
              'Mobility of the ulcer over the deeper structures',
              'Regional (inguinal) lymph nodes',
            ],
          },
        ],
      },
      {
        title: '3. Examination of the FOOT and the LIMB',
        items: [
          {
            label: 'Vascular assessment',
            description: 'Never omit this. It decides whether the foot can heal at all.',
            checklist: [
              'Colour, temperature, capillary refill (normal under 2 seconds)',
              'Hair loss, shiny atrophic skin, thickened brittle nails',
              'ALL PULSES — femoral, popliteal, posterior tibial, dorsalis pedis, both sides. Absent pedal pulses change the plan completely',
              'ANKLE-BRACHIAL PRESSURE INDEX — normal 0.9–1.3; 0.5–0.9 claudication; below 0.5 critical ischaemia. FALSELY HIGH (above 1.3) in diabetics because of medial calcification of the vessels, which is why a toe-brachial index or a Doppler waveform is preferred',
              "Buerger's test — elevate the limb to 45° and note the angle of pallor, then hang it down and time the reactive hyperaemia",
              'Venous refilling time, capillary refilling time',
            ],
          },
          {
            label: 'Neurological assessment',
            description: 'Three tests. All three are quick and all three are asked for.',
            checklist: [
              '10 g SEMMES-WEINSTEIN MONOFILAMENT — applied at ten sites on the plantar surface until it buckles. Inability to feel it means loss of protective sensation and identifies the foot at risk of ulceration',
              'VIBRATION — a 128 Hz tuning fork on the medial malleolus and the tip of the great toe; or a biothesiometer, where a threshold above 25 volts predicts ulceration',
              'ANKLE JERK — lost early in diabetic neuropathy',
              'Also: fine touch, pinprick, temperature, joint position sense, and a stocking distribution of loss',
              'MOTOR — wasting of the small muscles of the foot, clawing of the toes, high arch, prominent metatarsal heads. The intrinsic minus foot is what shifts pressure onto the metatarsal heads and makes the ulcer',
              'AUTONOMIC — dry, cracked, anhidrotic skin; distended dorsal veins; a warm foot with bounding pulses',
              'CHARCOT JOINT — a hot, swollen, deformed, but relatively painless foot with a rocker-bottom deformity. It is a neuroarthropathy and it is commonly mistaken for infection',
            ],
          },
        ],
      },
      {
        title: '4. Neuropathic vs ischaemic — the comparison that decides treatment',
        items: [
          {
            label: 'The two feet',
            description:
              'Most diabetic feet are NEUROISCHAEMIC, i.e. both. But you must be able to give the pure forms.',
            checklist: [
              'NEUROPATHIC — warm foot, bounding pulses, distended veins, dry skin, painless ulcer, ulcer at a PRESSURE point (plantar, under the metatarsal heads), surrounding callus, sensation lost, ankle jerk absent, ABPI normal or high',
              'ISCHAEMIC — cold foot, absent pulses, pale or dusky, atrophic shiny skin with hair loss, PAINFUL ulcer, ulcer at the MARGINS and tips (toes, heel, lateral border), no callus, rest pain, ABPI low',
              'NEUROISCHAEMIC — the commonest in practice, and it is managed as the ischaemic one, because perfusion has to be restored before anything will heal',
            ],
          },
        ],
      },
      {
        title: '5. Investigations and treatment',
        items: [
          {
            label: 'Investigations',
            description: '',
            checklist: [
              'Blood sugar (fasting and post-prandial), HbA1c',
              'Complete blood count, ESR and CRP — ESR above 70 supports osteomyelitis',
              'Renal function, electrolytes, urine for ketones and protein',
              'PUS CULTURE AND SENSITIVITY — from a deep tissue or bone sample, not a superficial swab, which grows colonisers',
              'X-RAY OF THE FOOT — osteomyelitis (periosteal reaction, cortical erosion, sequestrum — but it lags 2–3 weeks behind the disease), gas in the tissues, Charcot changes, foreign body',
              'MRI — the best test for osteomyelitis and for deep abscess',
              'DOPPLER ARTERIAL STUDY, and CT or MR angiography if revascularisation is being considered',
              'Fundus examination, ECG, chest X-ray — because the patient is a vasculopath',
            ],
          },
          {
            label: 'Treatment — the six components',
            description: 'Wagner grade selects the surgical part; the rest is the same for everyone.',
            checklist: [
              '1. GLYCAEMIC CONTROL — insulin, not oral agents, in an infected or septic patient',
              '2. INFECTION — broad-spectrum antibiotics covering Gram-positives, Gram-negatives and anaerobes, then narrowed to culture. Urgent drainage of any abscess and debridement of all dead tissue',
              '3. OFFLOADING — total contact cast, removable walker, crutches, bed rest. An ulcer that is walked on does not heal, and this is the step most often skipped',
              '4. VASCULAR — revascularisation (angioplasty or bypass) if ischaemic. Nothing heals without perfusion',
              '5. WOUND CARE — regular debridement, appropriate dressings, negative pressure wound therapy for a large granulating wound, skin grafting when clean',
              '6. AMPUTATION — toe, ray, transmetatarsal, below-knee or above-knee, by extent and by the level at which the tissue is perfused. For Wagner grade 4 and 5',
              'PREVENTION AND EDUCATION, which is what stops the next one: daily foot inspection including between the toes and with a mirror for the sole, never walking barefoot, well-fitting footwear, no hot water bottles, professional nail and callus care, stop smoking',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'What is a trophic ulcer, and why is a diabetic plantar ulcer one?',
        answer:
          'A trophic (neuropathic) ulcer is one caused by loss of protective sensation and impaired tissue nutrition, so that repeated unnoticed pressure at a bony prominence causes tissue breakdown. It is classically painless, punched-out, at a pressure point, surrounded by callus, and it penetrates deeply — which is why it is also called a penetrating ulcer. In diabetes, sensory neuropathy removes the warning, motor neuropathy claws the toes and shifts load onto the metatarsal heads, and autonomic neuropathy dries and cracks the skin to provide the portal of entry.',
      },
      {
        question: 'Why may the ankle-brachial pressure index be misleading in a diabetic?',
        answer:
          'Because diabetes causes medial (Mönckeberg) calcification of the arterial wall, which makes the vessels incompressible. The cuff cannot occlude them, so the ankle pressure reads falsely high and an index above 1.3 can coexist with severe ischaemia. Use a toe-brachial index (the digital arteries are usually spared), a Doppler waveform, or transcutaneous oxygen measurement instead.',
        examinerTip: 'The word to use is "incompressible".',
      },
      {
        question: 'Describe the edges of an ulcer and what each means.',
        answer:
          'SLOPING — a healing ulcer or a venous ulcer. PUNCHED OUT — a trophic/neuropathic ulcer, a syphilitic gumma, and a deep ischaemic ulcer. UNDERMINED — tuberculous ulcer and a pressure sore. EVERTED or ROLLED OUT — squamous cell carcinoma, including a Marjolin ulcer. BEADED / ROLLED IN with pearly telangiectatic margins — basal cell carcinoma (rodent ulcer).',
      },
      {
        question: 'What is a Charcot joint, and how would you tell it from infection?',
        answer:
          'A neuropathic arthropathy: progressive destruction of the bones and joints of an insensate foot, producing a hot, swollen, deformed but relatively painless foot with a rocker-bottom sole. It is distinguished from infection by the disproportionate lack of pain and of systemic upset, the absence of a portal of entry, the typical midfoot deformity, and the fact that elevating the limb for ten minutes reduces the warmth and swelling markedly in a Charcot foot but much less in infection. It is treated by total contact casting and offloading, not by antibiotics.',
      },
      {
        question: 'What is a probe-to-bone test?',
        answer:
          'Passing a sterile blunt metal probe through the ulcer. If it reaches bone, osteomyelitis is very likely — in a high-prevalence setting it has a high positive predictive value. It is a bedside test that needs no imaging and it is worth doing in every deep diabetic ulcer.',
      },
    ],
  },

  {
    id: 'short_carcinoma_tongue',
    title: 'Oral Malignancy — Carcinoma Tongue',
    system: 'General Surgery',
    caseType: 'short',
    department: 'General Surgery / Head & Neck Oncology',
    source: 'Short_cases-1.pdf',
    summary:
      'A non-healing ulcer with everted edges on the lateral border of the tongue, in a tobacco chewer. Examine the ulcer, the tongue\'s mobility, and both sides of the neck.',
    examPearl:
      'Two findings change the stage and the operation, and both are bedside findings. Is the tongue FIXED (ankyloglossia) — which makes it T4 and often inoperable? And are the nodes BILATERAL — because the tip and the anterior third of the tongue drain bilaterally, so a midline or tip lesion needs both necks treated. Palpate the tongue bidigitally; a carcinoma is always larger to the finger than to the eye.',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'The lesion',
            description: '',
            checklist: [
              'Duration of the ulcer or swelling, mode of onset, progression',
              'PAIN — early carcinoma of the tongue is often painless; pain suggests deep infiltration or secondary infection',
              'REFERRED OTALGIA — pain in the ear from a tongue lesion means the lingual nerve is involved (via the auriculotemporal nerve), and it is a sinister symptom',
              'Bleeding from the ulcer, foul-smelling discharge, excessive salivation (drooling)',
              'Difficulty in speech (dysarthria), in chewing, in protruding the tongue, in swallowing (dysphagia)',
              'Neck swelling — duration, and whether it appeared before or after the ulcer',
              'Loss of weight and appetite; difficulty in opening the mouth (trismus — suggests pterygoid involvement)',
            ],
          },
          {
            label: 'The risk factors — this is where the marks are',
            description: 'Every one of these should be asked and quantified.',
            checklist: [
              'TOBACCO CHEWING — pan, betel quid, gutkha, khaini, zarda; how many a day, for how many years, and WHERE THE QUID IS HELD (the site of the quid is the site of the cancer)',
              'REVERSE SMOKING — the burning end inside the mouth; causes palatal carcinoma',
              'SMOKING and ALCOHOL — synergistic, not merely additive',
              'SHARP TOOTH, ill-fitting denture, chronic dental sepsis — chronic irritation at the lateral border',
              'Pre-malignant lesions: leukoplakia, erythroplakia (higher malignant potential than leukoplakia), oral submucous fibrosis (from areca nut — causes trismus and a blanched, leathery mucosa), lichen planus, chronic hyperplastic candidiasis',
              'Syphilitic glossitis, Plummer-Vinson syndrome, chronic iron deficiency',
              'HPV 16 — particularly for the oropharynx and base of tongue',
              'Family history, previous head and neck malignancy, previous radiotherapy',
            ],
          },
        ],
      },
      {
        title: '2. Examination of the oral cavity',
        items: [
          {
            label: 'Preparation and inspection',
            description: 'Good light, gloves, a tongue depressor, and gauze to hold the tongue.',
            checklist: [
              'Ask the patient to remove any dentures',
              'Inspect systematically: lips, labial mucosa, gingivobuccal sulci, buccal mucosa, teeth and gums, hard palate, soft palate, the tongue (dorsum, tip, both lateral borders, ventral surface), the floor of the mouth, the tonsils and the posterior pharyngeal wall',
              'THE ULCER — site (lateral border of the middle third is the commonest site for tongue carcinoma), size, shape, EDGE (everted, rolled out — the malignant edge), FLOOR (necrotic slough, exuberant granulation), base, discharge, bleeding on touch',
              'Or the lesion may be an ULCERO-PROLIFERATIVE growth, a fissure, or an infiltrative plaque rather than an ulcer',
              'PROTRUSION — ask the patient to put the tongue out and move it side to side. Restricted protrusion or deviation means deep muscle infiltration. Complete fixity is ankyloglossia',
              'Dental hygiene, sharp teeth, and any leukoplakia or erythroplakia elsewhere (field change — the whole mucosa has had the same exposure)',
            ],
          },
          {
            label: 'Palpation',
            description: 'With a gloved finger. This is the part candidates skip and examiners notice.',
            checklist: [
              'BIDIGITAL palpation of the tongue and the floor of mouth — one finger inside, one under the chin. Feel the true extent and the INDURATION, which always exceeds the visible ulcer',
              'Base, fixity, extension across the midline, extension to the floor of mouth, to the alveolus, to the tonsil',
              'Bleeding on palpation',
              'Feel the mandible for erosion',
              'Then examine the NECK: all levels, both sides, from behind. Level I (submental, submandibular), II, III, IV, V. Size, consistency, number, mobility, fixity',
              'Look for a second primary — synchronous tumours occur in around 10% of head and neck cancers',
            ],
          },
        ],
      },
      {
        title: '3. Lymphatic drainage — the anatomy the staging depends on',
        items: [
          {
            label: 'Why the site of the primary decides which neck you treat',
            description: '',
            checklist: [
              'TIP of tongue — submental (level Ia) nodes, BILATERALLY, then to the deep cervical chain',
              'ANTERIOR TWO-THIRDS, lateral border — submandibular (level Ib) and upper deep cervical (level II), IPSILATERALLY',
              'POSTERIOR THIRD (base) — upper and lower deep cervical, BILATERALLY, and early, because of the rich bilateral lymphatic network',
              'CENTRAL or midline lesions — bilateral drainage',
              'The JUGULO-OMOHYOID node is called the lymph node of the tongue',
              'Practical consequence: a lesion crossing or near the midline, and any base-of-tongue lesion, needs BOTH necks addressed',
            ],
          },
        ],
      },
      {
        title: '4. TNM staging (oral cavity, AJCC 8th edition)',
        items: [
          {
            label: 'T stage — note that DEPTH OF INVASION now counts',
            description:
              'The 8th edition added depth of invasion (DOI) to T, because depth predicts nodal spread better than surface size does. This is the change examiners ask about.',
            checklist: [
              'T1 — tumour 2 cm or less AND depth of invasion 5 mm or less',
              'T2 — 2 cm or less with DOI >5 but ≤10 mm; OR >2 cm but ≤4 cm with DOI ≤10 mm',
              'T3 — >4 cm; OR any size with DOI >10 mm',
              'T4a — moderately advanced local disease: invades cortical bone of the mandible or maxilla, the maxillary sinus, the skin of the face; for tongue, invades the extrinsic muscles',
              'T4b — very advanced: invades the masticator space, pterygoid plates, skull base, or encases the internal carotid artery',
            ],
          },
          {
            label: 'N stage — and extranodal extension',
            description: 'The 8th edition also added extranodal extension (ENE), which upstages.',
            checklist: [
              'N0 — no regional node metastasis',
              'N1 — a single ipsilateral node, 3 cm or less, ENE negative',
              'N2a — a single ipsilateral node >3 cm but ≤6 cm, ENE negative',
              'N2b — multiple ipsilateral nodes, all ≤6 cm, ENE negative',
              'N2c — bilateral or contralateral nodes, all ≤6 cm, ENE negative',
              'N3a — any node >6 cm, ENE negative',
              'N3b — any node with clinically overt EXTRANODAL EXTENSION',
              'M0 / M1 — distant metastasis, most often to lung, then bone and liver',
            ],
          },
        ],
      },
      {
        title: '5. Investigations and treatment',
        items: [
          {
            label: 'Investigations',
            description: '',
            checklist: [
              'INCISIONAL / WEDGE BIOPSY from the edge of the ulcer including adjacent normal tissue — NEVER from the necrotic centre, which yields only slough. This is the diagnostic test',
              'FNAC of the neck node',
              'CONTRAST CT or MRI of the head and neck — MRI for soft tissue extent and depth of invasion, CT for mandibular cortical erosion',
              'Orthopantomogram (OPG) for mandibular involvement',
              'Chest X-ray or CT chest — lung metastasis and a second primary',
              'PET-CT for advanced disease and for an unknown primary',
              'Panendoscopy (direct laryngoscopy, bronchoscopy, oesophagoscopy) to look for synchronous second primaries',
              'Routine bloods, nutritional assessment, dental assessment BEFORE radiotherapy (extractions must be done first, or osteoradionecrosis follows)',
            ],
          },
          {
            label: 'Treatment',
            description: 'Single-modality for early disease, combined for advanced.',
            checklist: [
              'EARLY (T1–T2, N0) — single modality: wide local excision with a 1 cm margin (partial glossectomy), OR radiotherapy including brachytherapy. Plus elective neck treatment (supraomohyoid neck dissection, levels I–III) when the depth of invasion exceeds 4 mm, because occult nodal disease then exceeds 20%',
              'ADVANCED (T3–T4 or node positive) — composite resection (the primary plus the involved mandible plus the neck in continuity — the "commando" operation) with modified radical or radical neck dissection, reconstruction with a pedicled (pectoralis major) or free flap (radial forearm, fibula, anterolateral thigh), followed by adjuvant radiotherapy',
              'CONCURRENT CHEMORADIOTHERAPY — for positive margins or extranodal extension',
              'Palliative — for unresectable disease: radiotherapy, chemotherapy, pain control, feeding (nasogastric or gastrostomy), tracheostomy if the airway is threatened',
              'The FIRST step in an emergency is the AIRWAY — a large tongue or floor-of-mouth tumour with bleeding can obstruct',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Where do you take the biopsy from, and why not the centre?',
        answer:
          'From the EDGE of the ulcer, including a rim of adjacent normal-looking mucosa, so the pathologist sees the transition from normal to malignant epithelium. The centre of a malignant ulcer is necrotic slough and yields a non-diagnostic specimen.',
        examinerTip: 'Say "wedge biopsy from the edge including normal tissue" — the phrase is what is being marked.',
      },
      {
        question: 'What is the commonest site of carcinoma of the tongue and why?',
        answer:
          'The lateral border of the middle third (the anterior two-thirds). It is where a tobacco quid is habitually held and where a sharp tooth or an ill-fitting denture chronically irritates the mucosa.',
      },
      {
        question: 'Why does a tip-of-tongue carcinoma need both sides of the neck treated?',
        answer:
          'Because the lymphatics of the tip cross the midline and drain to the submental nodes of BOTH sides. Any lesion at or crossing the midline, and any base-of-tongue lesion, therefore has bilateral nodal risk and needs both necks addressed.',
      },
      {
        question: 'What is ankyloglossia in this context, and what does it signify?',
        answer:
          'Fixity of the tongue — the patient cannot protrude it. It indicates deep infiltration of the extrinsic muscles and the floor of mouth, making the tumour T4 and usually meaning the disease is advanced and often inoperable. It is a bedside finding that changes the stage.',
      },
      {
        question: 'What is the difference between leukoplakia and erythroplakia?',
        answer:
          'Leukoplakia is a white patch that cannot be rubbed off and cannot be characterised as any other disease — a clinical diagnosis of exclusion, with a malignant transformation rate of roughly 3–5%. Erythroplakia is a red velvety patch, is much less common, and carries a far higher risk — around 50% already show carcinoma in situ or invasive carcinoma at biopsy. Erythroplakia is the more dangerous lesion and is always biopsied.',
      },
      {
        question: 'What is a commando operation?',
        answer:
          'COMbined MANDibulectomy, Neck Dissection and Oral resection — an en-bloc composite resection of the primary oral tumour with the adjacent mandible and the cervical lymph nodes in continuity, for advanced oral cavity carcinoma involving bone. The defect is reconstructed with a pedicled or free flap.',
      },
      {
        question: 'Why must dental extractions be done before radiotherapy?',
        answer:
          'Because irradiated mandible is hypovascular, hypocellular and hypoxic, so an extraction afterwards risks osteoradionecrosis, which is very difficult to treat. Any teeth of doubtful viability are extracted before radiotherapy begins, with time allowed for healing.',
      },
    ],
  },

  {
    id: 'short_testicular_tumour',
    title: 'Testicular Tumour',
    system: 'General Surgery',
    caseType: 'short',
    department: 'General Surgery / Urology',
    source: 'Short_cases-1.pdf',
    summary:
      'A painless, hard, heavy testicular swelling with loss of testicular sensation, that you can get above. Never biopsied through the scrotum.',
    examPearl:
      'Two rules, and both are absolute. LOSS OF TESTICULAR SENSATION — gentle compression of a normal testis produces a sickening ache; a tumour-replaced testis has lost it. And NEVER approach a suspected testicular tumour through the scrotum: not for biopsy, not for aspiration, not for orchidectomy. A scrotal incision changes the lymphatic drainage from para-aortic to inguinal, converting a curable stage I into a staging and radiotherapy problem.',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'What to ask',
            description: '',
            checklist: [
              'Duration; painless enlargement of the testis is the classic presentation. Pain occurs in about 10%, from haemorrhage or infarction within the tumour',
              'HEAVINESS or dragging sensation in the scrotum — very characteristic',
              'Rate of growth; a sudden increase suggests haemorrhage',
              'Trauma — often reported, and it is almost always the event that drew attention to a tumour that was already there, not a cause',
              'Undescended or maldescended testis, or previous orchidopexy — the single strongest risk factor',
              'Previous tumour in the other testis; family history',
              'GYNAECOMASTIA and loss of libido — beta-hCG-secreting tumours',
              'Back pain — para-aortic nodal mass',
              'Cough, haemoptysis, breathlessness — pulmonary metastases',
              'Neck swelling — supraclavicular nodes via the thoracic duct',
              'Loss of weight and appetite',
              'Infertility, and previous semen analysis',
            ],
          },
        ],
      },
      SWELLING_SCHEME,
      {
        title: '3. Scrotal examination',
        items: [
          {
            label: 'Inspection and palpation',
            description: '',
            checklist: [
              'Examine standing and lying, and always compare with the other side',
              'Skin of the scrotum: usually normal; rugosity may be lost if the swelling is large. Skin involvement is rare and late',
              'CAN YOU GET ABOVE IT — yes, it is a scrotal swelling',
              'The testis is ENLARGED, HARD or firm, with a smooth or nodular surface, and it is HEAVY out of proportion to its size',
              'LOSS OF TESTICULAR SENSATION — the sign to demonstrate',
              'The epididymis may be felt separately and flattened posteriorly early on; later it is indistinguishable',
              'FLUCTUATION and TRANSILLUMINATION negative — unless there is a secondary hydrocele, which occurs in about 10% and can mask the whole testis',
              'The spermatic cord: thickened if involved',
              'Examine the OTHER testis carefully',
            ],
          },
          {
            label: 'The rest of the examination — for spread',
            description: 'A testicular tumour case is a staging examination.',
            checklist: [
              'ABDOMEN — a para-aortic nodal mass, hepatomegaly',
              'SUPRACLAVICULAR NODES, especially the LEFT (via the thoracic duct)',
              'INGUINAL NODES — NORMALLY NOT INVOLVED, because the testis drains to para-aortic nodes along its embryological origin. Inguinal nodes are involved only if the scrotal skin is invaded or a previous scrotal operation has altered the drainage',
              'CHEST — pleural effusion, signs of pulmonary metastasis',
              'BREASTS — gynaecomastia',
            ],
          },
        ],
      },
      {
        title: '4. Classification and markers',
        items: [
          {
            label: 'Germ cell tumours (about 95%)',
            description: '',
            checklist: [
              'SEMINOMA — 40%, peak age 30–40, homogeneous and uniform on section ("potato tumour"), spreads by lymphatics, EXQUISITELY RADIOSENSITIVE. AFP is NEVER raised in a pure seminoma; beta-hCG may be mildly raised in about 10%',
              'NON-SEMINOMATOUS GERM CELL TUMOURS — embryonal carcinoma, yolk sac (endodermal sinus) tumour, choriocarcinoma, teratoma, and mixed tumours. Peak age 20–30, heterogeneous with haemorrhage and necrosis, spread early by BLOOD as well as lymph, less radiosensitive but highly CHEMOSENSITIVE',
              'Yolk sac tumour — AFP markedly raised; the commonest testicular tumour of infancy',
              'Choriocarcinoma — beta-hCG very high, gynaecomastia, early haematogenous spread, worst prognosis',
            ],
          },
          {
            label: 'Non-germ cell (about 5%)',
            description: '',
            checklist: [
              'Leydig cell tumour — precocious puberty in a boy, gynaecomastia in an adult',
              'Sertoli cell tumour — gynaecomastia, loss of libido',
              'Gonadoblastoma — in dysgenetic gonads',
              'Lymphoma — the commonest testicular tumour OVER the age of 60, and usually bilateral',
              'Secondaries — prostate, lung, kidney, melanoma',
            ],
          },
          {
            label: 'Tumour markers — the three, and why all three',
            description: 'Taken BEFORE orchidectomy and repeated after, because the half-life tells you whether disease remains.',
            checklist: [
              'AFP — half-life 5–7 days. Raised in yolk sac and embryonal elements. NEVER raised in a pure seminoma — a raised AFP means the tumour is not a pure seminoma however the histology reads',
              'BETA-hCG — half-life 24–36 hours. Raised in choriocarcinoma, and in about 10% of seminomas',
              'LDH — a marker of tumour bulk rather than of type; used for staging and prognosis',
              'Markers that do not fall as predicted by their half-lives after orchidectomy mean residual disease',
            ],
          },
        ],
      },
      {
        title: '5. Investigations and treatment',
        items: [
          {
            label: 'Investigations',
            description: '',
            checklist: [
              'ULTRASOUND OF BOTH TESTES with Doppler — the first investigation; a hypoechoic intratesticular mass',
              'SERUM MARKERS before orchidectomy: AFP, beta-hCG, LDH',
              'CT CHEST, ABDOMEN AND PELVIS — for para-aortic nodes and lung metastases',
              'Chest X-ray as a baseline',
              'SEMEN ANALYSIS AND SPERM BANKING — offered BEFORE chemotherapy or radiotherapy. This is part of the answer, not an afterthought',
              'NEVER a percutaneous or trans-scrotal biopsy',
            ],
          },
          {
            label: 'Treatment',
            description: '',
            checklist: [
              'HIGH INGUINAL ORCHIDECTOMY with early clamping and high ligation of the cord at the deep inguinal ring (Chevassu manoeuvre) — this is both the diagnostic and the first therapeutic step, in every case',
              'SEMINOMA, stage I — surveillance, or a single dose of carboplatin, or para-aortic radiotherapy (it is radiosensitive)',
              'SEMINOMA, advanced — chemotherapy (BEP: bleomycin, etoposide, cisplatin) with or without radiotherapy',
              'NSGCT, stage I — surveillance, or adjuvant BEP, or retroperitoneal lymph node dissection (nerve-sparing, to preserve ejaculation)',
              'NSGCT, advanced — BEP chemotherapy, then RETROPERITONEAL LYMPH NODE DISSECTION for any residual mass, because a residual mass may contain differentiated teratoma which is chemoresistant and can grow',
              'Testicular prosthesis if the patient wishes',
              'Follow-up with markers and CT — these are among the most curable of solid tumours, with over 90% cure even with metastases',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Why is a trans-scrotal approach to a testicular tumour condemned?',
        answer:
          'Because the testis drains to the PARA-AORTIC nodes, following its embryological descent from the posterior abdominal wall. A scrotal incision breaches that and opens drainage to the INGUINAL nodes, so tumour can spread to a nodal basin that would otherwise never be involved and that lies outside the standard radiotherapy and dissection fields. It converts a straightforward stage I into a much larger problem. The approach is always a high inguinal one with early cord control.',
        examinerTip: 'Lead with the embryology — that is the reason, not a rule of thumb.',
      },
      {
        question: 'A patient has a histologically pure seminoma but a raised AFP. What do you conclude?',
        answer:
          'That it is NOT a pure seminoma. Pure seminoma never produces AFP, so a raised AFP means non-seminomatous elements are present somewhere — either missed on sampling of the primary or present in a metastasis — and the patient must be treated as having a non-seminomatous germ cell tumour.',
      },
      {
        question: 'What is the strongest risk factor for testicular tumour?',
        answer:
          'Cryptorchidism. An undescended testis carries roughly a 5–10 fold increased risk, higher for an intra-abdominal than an inguinal testis. Orchidopexy reduces but does not abolish the risk, and it makes the testis examinable, which is its other value. The CONTRALATERAL, normally descended testis also carries an increased risk, which tells you the association is with the underlying dysgenesis rather than with the position alone.',
      },
      {
        question: 'Why do you examine for supraclavicular nodes but not expect inguinal nodes?',
        answer:
          'Because para-aortic lymph drains via the cisterna chyli and thoracic duct to the left supraclavicular region, so advanced disease presents there. Inguinal nodes drain the scrotal SKIN, not the testis, so they are involved only if the skin is invaded or a previous scrotal operation has altered the drainage.',
      },
      {
        question: 'What are the components of BEP, and what is the important toxicity to warn about?',
        answer:
          'Bleomycin, Etoposide and cisPlatin. The toxicity to warn about is bleomycin-induced pulmonary fibrosis — which is dose-related and can be precipitated by high inspired oxygen concentrations, so any future anaesthetic must be given with the lowest tolerable FiO2. Also cisplatin nephrotoxicity, ototoxicity and peripheral neuropathy, and infertility, which is why sperm banking is offered first.',
      },
    ],
  },

  {
    id: 'short_undescended_testis',
    title: 'Undescended Testis',
    system: 'General Surgery',
    caseType: 'short',
    department: 'Paediatric Surgery / Urology',
    source: 'Short_cases-1.pdf',
    summary:
      'An empty, poorly developed hemiscrotum. The whole case is separating a true undescended testis from a retractile one and from an ectopic one — three different answers.',
    examPearl:
      'Examine with WARM HANDS, in a WARM ROOM, with the child relaxed and preferably cross-legged or squatting — a cold hand triggers the cremasteric reflex and turns a normal testis into an "undescended" one. Milk the testis down from the deep ring towards the scrotum: a RETRACTILE testis can be brought to the bottom of the scrotum and STAYS there for a moment; an undescended one cannot be brought down, or springs straight back.',
    sections: [
      {
        title: '1. Definitions — get these right first',
        items: [
          {
            label: 'The four things it could be',
            description: 'They are treated differently, so the distinction is the case.',
            checklist: [
              'UNDESCENDED (cryptorchid) — the testis has stopped somewhere ALONG the normal line of descent: intra-abdominal, at the deep ring, in the inguinal canal, or at the superficial ring. It cannot be brought into the scrotum',
              'INCOMPLETELY DESCENDED — synonymous with undescended in most texts; arrested along the normal path',
              'ECTOPIC — the testis has left the normal path after emerging from the superficial ring and lies in an abnormal site: superficial inguinal pouch (of Denis Browne — the commonest ectopic site), perineum, femoral triangle, root of the penis, or the opposite scrotum. It is usually of NORMAL size and function, because it escaped the abnormal temperature',
              'RETRACTILE — a normally descended testis pulled up by an overactive cremaster. It CAN be manipulated into the scrotum and stays. It is normal and needs no operation, only follow-up',
              'ABSENT / VANISHING — atrophied after antenatal torsion; the "vanishing testis"',
            ],
          },
        ],
      },
      {
        title: '2. History',
        items: [
          {
            label: 'What to ask',
            description: '',
            checklist: [
              'Age of the child, and whether the testis has EVER been seen or felt in the scrotum — a testis that has been in the scrotum is retractile or ascending, not undescended',
              'Was the child PREMATURE? — 30% of preterm and 3–4% of term male infants have an undescended testis at birth; most descend spontaneously by 3 months, and descent after 6 months is rare',
              'Birth weight, antenatal history',
              'Any swelling in the groin — an associated hernia is present in most cases, because the processus vaginalis stays patent',
              'Pain, or episodes of pain and swelling — torsion, which is commoner in an undescended testis',
              'Any previous surgery in the groin',
              'Hypospadias or other genital anomaly — the combination of bilateral impalpable testes WITH hypospadias demands a karyotype and endocrine workup for a disorder of sexual development',
              'Family history of cryptorchidism or infertility',
            ],
          },
        ],
      },
      {
        title: '3. Examination',
        items: [
          {
            label: 'Preparation, which is most of the examination',
            description: '',
            checklist: [
              'Warm room, warm hands, calm child, adequate exposure, privacy, and a chaperone',
              'Position: supine first, then cross-legged (tailor position) or squatting — both inhibit the cremasteric reflex',
              'Inspect BOTH hemiscrotums: the affected side is POORLY DEVELOPED and the rugae are absent, which tells you the testis has never been there',
            ],
          },
          {
            label: 'Palpation — the milking technique',
            description: '',
            checklist: [
              'Start ABOVE and LATERAL, at the anterior superior iliac spine, and sweep your flat hand along the line of the inguinal canal towards the pubic tubercle — this milks the testis distally and is how an intracanalicular testis is found',
              'When you feel it, hold it with the other hand and try to bring it into the scrotum',
              'RECORD THE LOWEST POINT it reaches WITHOUT TENSION, and whether it stays there when you let go',
              'Feel for the SIZE and consistency — an undescended testis is usually small and soft',
              'Search the ECTOPIC SITES if it is not in the canal: superficial inguinal pouch (just above and lateral to the superficial ring, superficial to the external oblique aponeurosis), femoral triangle, perineum, root of penis, opposite scrotum',
              'Examine for an associated HERNIA — cough impulse, reducible swelling',
              'Examine the OTHER testis. A contralateral testis that is HYPERTROPHIED (over about 2 cm in a young child) suggests the impalpable one is ABSENT',
              'Assess secondary sexual characteristics in an older boy; look for hypospadias, micropenis, a bifid scrotum',
            ],
          },
        ],
      },
      {
        title: '4. Complications — the reason it is operated on',
        items: [
          {
            label: 'Six, and the order matters',
            description: '',
            checklist: [
              'INFERTILITY — the seminiferous tubules are damaged by the higher intra-abdominal temperature; changes begin by the second year of life, which is why surgery is done early. Bilateral untreated cryptorchidism causes azoospermia in most',
              'MALIGNANCY — a 5–10 fold increased risk, chiefly seminoma, and highest for an intra-abdominal testis. Orchidopexy reduces but does not abolish the risk; its main value is making the testis palpable and examinable. The CONTRALATERAL descended testis also carries increased risk',
              'TORSION — commoner, because of the abnormal attachments, and easily mistaken for an acute abdomen or an irreducible hernia',
              'ASSOCIATED INGUINAL HERNIA — present in most, because of the patent processus vaginalis. It is repaired at the same operation',
              'TRAUMA — a testis lying against the pubic bone is easily injured',
              'PSYCHOLOGICAL — an empty scrotum, particularly at school age',
            ],
          },
        ],
      },
      {
        title: '5. Investigations and treatment',
        items: [
          {
            label: 'Investigations',
            description: 'A PALPABLE testis needs no imaging. An impalpable one needs a laparoscopy, not a scan.',
            checklist: [
              'ULTRASOUND — of limited value; it misses intra-abdominal testes and its main role is excluding a superficial inguinal pouch testis in an obese child. A negative scan never excludes an intra-abdominal testis, so it must not delay surgery',
              'MRI — better than ultrasound but still not reliable enough to avoid surgery',
              'DIAGNOSTIC LAPAROSCOPY — the GOLD STANDARD for an impalpable testis: it locates the testis, or demonstrates blind-ending vessels (a vanishing testis), and can proceed directly to treatment',
              'For BILATERAL IMPALPABLE testes: karyotype, serum testosterone, LH, FSH, and an hCG stimulation test — a rise in testosterone confirms functioning testicular tissue somewhere',
              'Ultrasound of the abdomen and pelvis to look for Müllerian structures if a disorder of sexual development is suspected',
            ],
          },
          {
            label: 'Treatment',
            description: 'Timing is the examined point.',
            checklist: [
              'TIMING — orchidopexy between 6 and 12 months (some guidelines say 6–18 months), and certainly before 2 years. Before 6 months spontaneous descent may still occur; after 2 years irreversible germ cell damage has begun. "Early" is the answer, and the reason is fertility',
              'ORCHIDOPEXY — mobilise the testis and cord, ligate and divide the patent processus vaginalis (which is also the hernia sac), gain length, and fix the testis in a subdartos pouch without tension',
              'For a HIGH or intra-abdominal testis — a staged FOWLER-STEPHENS procedure: the testicular vessels are divided (in one or two stages) and the testis survives on the collateral supply from the artery to the vas and the cremasteric artery',
              'MICROVASCULAR AUTOTRANSPLANTATION — rarely, for a very high testis',
              'ORCHIDECTOMY — for an atrophic testis, or for a post-pubertal unilateral undescended testis with a normal contralateral testis, because it contributes nothing to fertility and carries a malignant risk',
              'HORMONAL therapy (hCG or GnRH) — of limited and disputed benefit; it may help a RETRACTILE testis, which needs no treatment anyway, so it is not recommended for a true undescended testis',
              'Counsel about self-examination for life, and about fertility',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'How do you distinguish a retractile from an undescended testis?',
        answer:
          'A retractile testis can be manipulated into the bottom of the scrotum and STAYS there, at least briefly, once released; the scrotum on that side is normally developed and rugose. An undescended testis cannot be brought down at all, or springs back immediately, and the hemiscrotum is small and poorly rugose because a testis has never occupied it. Examine with warm hands in a warm room, with the child cross-legged, to abolish the cremasteric reflex.',
        examinerTip: 'The development of the hemiscrotum is the clue candidates forget — mention it.',
      },
      {
        question: 'Why operate at 6–12 months rather than waiting?',
        answer:
          'Because histological damage to the germ cells begins in the second year of life and is irreversible. Spontaneous descent is essentially complete by 6 months, so waiting beyond that gains nothing and loses fertility. Early orchidopexy also places the testis where it can be examined for the rest of the patient\'s life, which is its contribution to the cancer risk.',
      },
      {
        question: 'What is the commonest site of an ectopic testis?',
        answer:
          'The superficial inguinal pouch of Denis Browne — a space between the external oblique aponeurosis and Scarpa\'s fascia, just above and lateral to the superficial inguinal ring. Other sites are the femoral triangle, the perineum, the root of the penis, and the contralateral scrotum (transverse testicular ectopia).',
      },
      {
        question: 'What is the investigation of choice for an impalpable testis?',
        answer:
          'Diagnostic LAPAROSCOPY. Ultrasound and MRI are unreliable — a negative scan does not exclude an intra-abdominal testis, so it cannot change management and only delays surgery. Laparoscopy locates the testis, or shows blind-ending vessels proving a vanished testis, and allows the first stage of a Fowler-Stephens procedure at the same sitting.',
      },
      {
        question: 'Does orchidopexy remove the risk of malignancy?',
        answer:
          'No. It reduces it, especially when done early, but does not abolish it — which tells you the risk is partly intrinsic to the dysgenetic gonad rather than purely due to its position. Its major benefits are fertility and making the testis palpable so that a tumour is detected early. The contralateral, normally descended testis also carries a slightly increased risk.',
      },
    ],
  },

  {
    id: 'short_fibroadenoma',
    title: 'Fibroadenoma Breast',
    system: 'General Surgery',
    caseType: 'short',
    department: 'General Surgery',
    source: 'Short_cases-1.pdf',
    summary:
      'A firm, smooth, highly mobile, painless breast lump in a young woman — the "breast mouse". The triple assessment is the whole answer.',
    examPearl:
      'Palpate with the FLAT of the fingers against the chest wall, quadrant by quadrant, never pinching the tissue between finger and thumb — normal breast pinched that way feels nodular and invents a lump. Then say TRIPLE ASSESSMENT, and say what the three are: clinical, imaging (ultrasound under 35, mammogram over 35), and pathological (FNAC or core biopsy).',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'The lump',
            description: '',
            checklist: [
              'Age — fibroadenoma is a disease of 15 to 30; a discrete lump over 35 is carcinoma until proved otherwise',
              'Duration, onset, and rate of growth — slow and often static, or slowly enlarging',
              'PAINLESS — and NO variation with the menstrual cycle. A lump that becomes tender and larger premenstrually is fibrocystic change, not a fibroadenoma',
              'Mobility noticed by the patient ("it slips away when I try to feel it")',
              'NO nipple discharge, NO nipple retraction, NO skin change, NO ulceration',
              'NO axillary swelling',
              'NO loss of weight or appetite, no bone pain, no cough or breathlessness (the metastasis questions)',
            ],
          },
          {
            label: 'The rest of the breast history',
            description: 'Ask it even in an obviously benign case — it is what is being marked.',
            checklist: [
              'Menstrual history: age of menarche, cycle regularity, LMP, age at menopause',
              'Obstetric: parity, age at first childbirth, breastfeeding and its duration',
              'Oral contraceptive or hormone replacement use and duration',
              'FAMILY HISTORY of breast or ovarian cancer — first-degree relatives, and the age at which they were affected',
              'Previous breast lump, biopsy, or surgery; previous chest radiotherapy',
            ],
          },
        ],
      },
      {
        title: '2. Examination of the breast',
        items: [
          {
            label: 'Inspection — four positions',
            description:
              'Patient sitting, undressed to the waist, in good light, with a chaperone. Each position reveals something a different one hides.',
            checklist: [
              '1. ARMS BY THE SIDE — size, symmetry, contour, the level of the two nipples, any visible lump, skin changes, dilated veins',
              '2. ARMS RAISED ABOVE THE HEAD — reveals tethering and a dimple in the lower half of the breast that is invisible at rest',
              '3. HANDS PRESSED ON THE HIPS (contracting pectoralis major) — reveals fixity to the pectoral fascia',
              '4. LEANING FORWARD — the breasts fall free, so a tethered area is pulled in and any asymmetry of contour is exaggerated',
              'Look specifically for: skin dimpling, PEAU D\'ORANGE (dermal lymphatic oedema — the skin pits at the hair follicles), nipple retraction (recent and NOT congenital), nipple destruction or eczema (Paget disease), ulceration, satellite nodules, cancer en cuirasse',
            ],
          },
          {
            label: 'Palpation',
            description: 'Patient lying at 45° with the hand behind the head on the side being examined.',
            checklist: [
              'Use the FLAT of the fingers, pressing the breast tissue against the chest wall. Palpate all four quadrants plus the central area plus the AXILLARY TAIL OF SPENCE',
              'Examine the NORMAL breast first',
              'The lump: site (quadrant, and distance from the nipple), size in centimetres, shape, surface (SMOOTH in fibroadenoma, irregular in carcinoma), margins (well defined), consistency (FIRM, rubbery), tenderness (absent)',
              'MOBILITY — a fibroadenoma is extremely mobile within the breast tissue, which is why it is called a "breast mouse". Fix the lump and try to move it',
              'FIXITY TO SKIN — pinch the skin over the lump and try to lift it off',
              'FIXITY TO PECTORALIS MAJOR — test mobility with the muscle relaxed and again with the patient pressing her hands on her hips. Reduced mobility on contraction means it is attached to the pectoral fascia',
              'FIXITY TO THE CHEST WALL — mobility absent in both positions',
              'NIPPLE AND AREOLA — retraction, deviation, eczema; express for discharge and note its character',
              'AXILLA — all five groups, with the arm supported on your own forearm so the pectorals relax. Then the supraclavicular and infraclavicular fossae, and the OTHER axilla',
              'Complete with: chest (effusion), abdomen (hepatomegaly), spine (tenderness) — the metastatic survey',
            ],
          },
        ],
      },
      {
        title: '3. Differential diagnosis of a discrete breast lump',
        items: [
          {
            label: 'By age, which is the most useful axis',
            description: '',
            checklist: [
              'UNDER 30 — fibroadenoma, fibrocystic change, breast abscess, lactating adenoma, juvenile giant fibroadenoma',
              '30–50 — fibrocystic change and cysts, fibroadenoma, phyllodes tumour, duct ectasia, fat necrosis, CARCINOMA',
              'OVER 50 — CARCINOMA until proved otherwise; also cysts and fat necrosis',
              'ANY age — traumatic fat necrosis (a history of trauma, and it mimics carcinoma exactly — hard, irregular, may tether skin), tuberculosis of the breast, granulomatous mastitis, lipoma, sebaceous cyst of the overlying skin',
              'PHYLLODES TUMOUR — the one to distinguish from a fibroadenoma: larger, grows rapidly, in an older woman (40s), may ulcerate the overlying skin by pressure necrosis, and needs wide excision with a 1 cm margin because it recurs',
            ],
          },
        ],
      },
      {
        title: '4. Investigations — the triple assessment',
        items: [
          {
            label: 'The three components, and the scoring',
            description:
              'Each component is scored 1 to 5. Concordance of all three is what allows a benign lump to be left alone; any discordance means excision biopsy.',
            checklist: [
              '1. CLINICAL — P1 normal, P2 benign, P3 uncertain/probably benign, P4 suspicious, P5 malignant',
              '2. IMAGING — ULTRASOUND under 35 (dense young breast tissue makes a mammogram unreadable); MAMMOGRAM (craniocaudal and mediolateral oblique views) over 35; MRI for dense breasts, implants, and to assess extent in lobular carcinoma. Scored U1–U5 / M1–M5',
              '3. PATHOLOGY — FNAC (C1 inadequate, C2 benign, C3 atypia probably benign, C4 suspicious, C5 malignant) or CORE BIOPSY (B1–B5), which is preferred because it distinguishes invasive from in situ disease and provides receptor status',
              'ULTRASOUND OF A FIBROADENOMA — a well-defined, homogeneous, hypoechoic lesion, wider than it is tall, with smooth margins and no posterior acoustic shadowing',
            ],
          },
        ],
      },
      {
        title: '5. Treatment',
        items: [
          {
            label: 'When to leave it and when to take it out',
            description: '',
            checklist: [
              'A fibroadenoma under 3 cm in a woman under 30, with a concordant benign triple assessment, may be OBSERVED — a third regress, a third stay the same and a third enlarge slowly',
              'EXCISION for: size over 3 cm, rapid growth, age over 35, patient preference or anxiety, any discordance in the triple assessment, or a suspicious cytology',
              'Excision is an ENUCLEATION through a cosmetically placed incision — a circumareolar or submammary crease incision, following Langer\'s lines',
              'GIANT (juvenile) fibroadenoma — over 5 cm, in adolescents; needs excision with reconstruction of the breast contour',
              'PHYLLODES TUMOUR — WIDE local excision with a 1 cm margin, because enucleation leads to recurrence; mastectomy for a very large or malignant phyllodes. AXILLARY DISSECTION IS NOT DONE, because phyllodes spreads haematogenously (to the lung), not by lymphatics',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Why is a fibroadenoma called a "breast mouse"?',
        answer:
          'Because it is so freely mobile within the breast tissue that it slips away from the examining finger, like a mouse. It is mobile because it is a well-encapsulated, discrete benign lesion lying loose within the surrounding breast stroma.',
      },
      {
        question: 'Is a fibroadenoma a tumour?',
        answer:
          'Strictly it is an ABERRATION OF NORMAL DEVELOPMENT AND INVOLUTION (ANDI) — a hyperplasia of a single lobule rather than a true neoplasm. It is hormone-dependent, which is why it appears in the reproductive years, enlarges in pregnancy and with the oral contraceptive, and regresses after the menopause.',
        examinerTip: 'The ANDI classification is what the examiner is fishing for.',
      },
      {
        question: 'How would you distinguish a phyllodes tumour from a fibroadenoma?',
        answer:
          'Clinically: a phyllodes tumour occurs in an older woman (typically 40s), is larger, grows rapidly, may have a bosselated surface, and can cause pressure necrosis and ulceration of the overlying stretched skin — but it does not INVADE the skin. Radiologically they are similar. The distinction is histological: phyllodes has a hypercellular stroma with a leaf-like architecture. It is treated by wide excision with a 1 cm margin, and the axilla is not dissected because it spreads by blood.',
      },
      {
        question: 'Why ultrasound under 35 and mammography over 35?',
        answer:
          'Because the young breast is dense and glandular, so a mammogram is largely white and a lesion cannot be seen against it — and because it exposes a young breast to radiation for little information. Ultrasound distinguishes solid from cystic well in dense tissue. After about 35 the breast becomes fattier, so mammography can show microcalcification and architectural distortion, which ultrasound cannot.',
      },
      {
        question: 'What are the components of triple assessment and why must all three agree?',
        answer:
          'Clinical examination, imaging, and pathology (FNAC or core biopsy). Each alone has a false-negative rate; combined and CONCORDANT, their accuracy approaches 100%. If any one component is discordant — for instance a clinically benign lump with a suspicious ultrasound — the lesion is excised regardless of the other two, because the discordance is the finding.',
      },
    ],
  },

  {
    id: 'short_ganglion',
    title: 'Ganglion',
    system: 'General Surgery',
    caseType: 'short',
    department: 'General Surgery / Orthopaedics',
    source: 'Short_cases-1.pdf',
    summary:
      'A smooth, tense, cystic swelling near a joint or tendon sheath, classically on the dorsum of the wrist, that becomes FIXED when the tendon is contracted.',
    examPearl:
      'The test that names it: find the swelling, then ask the patient to contract the underlying tendon (for a dorsal wrist ganglion, extend the wrist and fingers against resistance). A ganglion arising from a tendon sheath becomes LESS MOBILE or fixed, because the structure it is attached to is now taut. That, plus a site next to a joint, plus cystic consistency, is the diagnosis.',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'What to ask',
            description: '',
            checklist: [
              'Duration, onset — often noticed suddenly, though it has been growing slowly',
              'Fluctuation in SIZE — a ganglion characteristically waxes and wanes, and may disappear and return. That history alone is close to diagnostic',
              'Painless usually; a dull ache on use, or pain only when it compresses a nerve',
              'Relation to activity and occupation — repetitive wrist use, typing, manual work',
              'Weakness or paraesthesiae — a ganglion in Guyon\'s canal compresses the ulnar nerve; one in the carpal tunnel compresses the median nerve; one at the fibular neck compresses the common peroneal nerve and causes foot drop',
              'Trauma',
              'Previous aspiration or excision, and recurrence — recurrence is the rule rather than the exception after aspiration',
            ],
          },
        ],
      },
      SWELLING_SCHEME,
      {
        title: '3. The findings that make it a ganglion',
        items: [
          {
            label: 'Site — which is most of the diagnosis',
            description: '',
            checklist: [
              'DORSUM OF THE WRIST over the scapholunate ligament — 60–70% of all ganglia, and the one you will be shown',
              'Volar wrist, over the radial artery and the scaphotrapezial joint — care, because it lies on the artery',
              'Flexor tendon sheath at the base of a finger (a "seed" or pearl ganglion) — a small, very hard, tender pea',
              'Dorsum of the distal interphalangeal joint (a mucous cyst, associated with osteoarthritis and Heberden nodes; may groove the nail)',
              'Dorsum of the foot, peroneal tendons, and the popliteal fossa (where a ganglion must be distinguished from a Baker cyst and from a popliteal aneurysm)',
            ],
          },
          {
            label: 'Signs',
            description: '',
            checklist: [
              'Smooth, spherical or ovoid, well defined margins, 1–3 cm',
              'CYSTIC and often TENSE — a small tense ganglion can feel bony hard, and that is a common source of error',
              'Fluctuation positive in a large one, and difficult to elicit in a small one',
              'TRANSILLUMINATION positive — the contents are clear gelatinous fluid',
              'Skin over it free, pinchable, and normal; no punctum',
              'MOBILITY REDUCED when the underlying tendon is made taut — the key test',
              'NOT pulsatile, NOT compressible, NOT reducible',
              'Non-tender unless compressing a nerve',
              'Regional lymph nodes NOT palpable',
              'Examine the joint it lies over: range of movement, effusion, instability',
              'Examine the nerve distal to it: Tinel sign, sensation, motor power',
              'Check the ALLEN TEST before treating a volar wrist ganglion — it may be adherent to the radial artery',
            ],
          },
        ],
      },
      {
        title: '4. Differential diagnosis',
        items: [
          {
            label: 'What else sits on the dorsum of the wrist',
            description: '',
            checklist: [
              'Bursa — over a bony prominence; larger and more diffuse',
              'Compound palmar ganglion — a tuberculous tenosynovitis of the flexor sheath, hourglass-shaped across the flexor retinaculum, with CROSS-FLUCTUATION between the palmar and forearm components and palpable melon-seed bodies',
              'Extensor tenosynovitis, De Quervain tenosynovitis (radial styloid, Finkelstein test positive)',
              'Giant cell tumour of the tendon sheath — firm, lobulated, does not transilluminate',
              'Lipoma — soft, lobulated, not transilluminating, slip sign positive',
              'Rheumatoid nodule, gouty tophus',
              'Carpal boss — a bony prominence at the second and third carpometacarpal joints; hard and immobile',
              'Aneurysm of the radial artery (volar) — pulsatile and expansile',
            ],
          },
        ],
      },
      {
        title: '5. Investigations and treatment',
        items: [
          {
            label: 'Investigations',
            description: 'Almost none needed; imaging only when the diagnosis is in doubt.',
            checklist: [
              'Clinical diagnosis in the great majority',
              'ULTRASOUND — confirms a cyst and distinguishes it from a solid lesion or an aneurysm; useful for an occult volar ganglion',
              'MRI — for a deep, occult, or atypical ganglion, and for one causing nerve compression',
              'X-ray of the joint — to exclude an underlying bony lesion or osteoarthritis (relevant for a mucous cyst)',
              'Nerve conduction study if there is a neurological deficit',
            ],
          },
          {
            label: 'Treatment',
            description: 'And the honest recurrence rates.',
            checklist: [
              'REASSURANCE AND OBSERVATION — a large proportion resolve spontaneously, particularly in children, and an asymptomatic ganglion needs nothing',
              'ASPIRATION, with or without steroid instillation — simple, but recurrence is 50–70%, because the stalk connecting it to the joint is left behind',
              'The old treatment of rupturing it with a blow from a heavy book is of historical interest and should not be offered; it recurs and it can fracture a carpal bone',
              'SURGICAL EXCISION — the definitive treatment, and it must include the STALK AND A CUFF OF THE JOINT CAPSULE at its origin, or it recurs. Recurrence after proper excision is still 5–15%',
              'Open or arthroscopic excision; arthroscopic has a lower morbidity for a dorsal wrist ganglion',
              'Indications for excision: pain, nerve compression, interference with function, cosmesis, or diagnostic doubt',
              'Warn about the specific risks of a VOLAR wrist ganglion excision: injury to the radial artery and to the palmar cutaneous branch of the median nerve',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'What is a ganglion, and what is in it?',
        answer:
          'A cystic swelling arising from a joint capsule or a tendon sheath, containing clear, viscid, gelatinous fluid rich in hyaluronic acid, glucosamine and albumin. It is lined not by true synovium or epithelium but by compressed collagen fibres — so it is a pseudocyst, which is why the term "cyst" is loose.',
      },
      {
        question: 'How do you prove a swelling on the dorsum of the wrist is a ganglion?',
        answer:
          'Site over the scapholunate ligament; smooth, well-defined, cystic and transilluminant; skin free over it; and, critically, its mobility is REDUCED when the underlying tendon is contracted, because it is attached to the tendon sheath or capsule. Fluctuation may be hard to elicit if it is small and tense.',
      },
      {
        question: 'Why does a ganglion recur after aspiration?',
        answer:
          'Because aspiration removes the contents but leaves the cyst wall and, more importantly, the STALK connecting it to the joint or tendon sheath, which continues to secrete. Definitive treatment requires excision of the ganglion together with its stalk and a cuff of the underlying capsule.',
      },
      {
        question: 'What is a compound palmar ganglion?',
        answer:
          'Not a ganglion at all — it is a tuberculous tenosynovitis of the common flexor sheath of the hand and forearm. It forms an hourglass swelling constricted by the flexor retinaculum, so pressing one half fills the other: CROSS-FLUCTUATION. It contains melon-seed bodies (fibrin bodies) which can be felt as crepitus. Treatment is antitubercular therapy with synovectomy.',
      },
      {
        question: 'Which nerves can a ganglion compress, and where?',
        answer:
          'The ULNAR nerve in Guyon\'s canal at the wrist (a volar ulnar ganglion), causing wasting of the interossei and hypothenar eminence; the MEDIAN nerve in the carpal tunnel; the COMMON PERONEAL nerve at the neck of the fibula (a ganglion of the superior tibiofibular joint), causing foot drop; and the posterior tibial nerve in the tarsal tunnel.',
      },
    ],
  },
];
