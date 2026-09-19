/**
 * Ophthalmology case proformas.
 *
 * Built from the two ophthalmology sheets the app's owner sent — the "Agam"
 * case proforma and the general case-taking sheet — which between them give
 * the history, the full ocular examination sequence in the order it is
 * performed, and the viva differentials by mode of visual loss.
 *
 * The same rule as the ENT file: the general examination (PICCLE) is not
 * repeated here. It is drawn once, with a photograph of each sign, from
 * `generalExamSigns.ts`.
 *
 * One structural point taken straight from the source sheets and worth keeping:
 * the ocular examination is recorded RIGHT EYE THEN LEFT EYE, as two columns,
 * for every single line. A finding is almost never interpretable on its own —
 * it is interpretable against the other eye — and a proforma that loses that
 * pairing loses the comparison the whole examination is built on.
 */
import type { ClinicalProforma } from '@/lib/clinicalProformas';

export const OPHTHALMOLOGY_PROFORMAS: ClinicalProforma[] = [
  {
    id: 'cataract_proforma',
    title: 'Senile Cataract — Gradual Painless Loss of Vision',
    system: 'Ophthalmology',
    department: 'Ophthalmology',
    summary:
      'The commonest ophthalmology long case. Covers the history of gradual painless dimness of vision, the full anterior segment examination, the maturity grading of the lens opacity, the biometry and the intraocular lens decision, and the complications that turn a routine case into an emergency.',
    examPearl:
      'Gradual, painless, progressive dimness of vision with a normal pupillary reaction and a white lens is a cataract. The pupillary light reflex is what tells you the retina and the optic nerve behind that cataract still work — never present a cataract case without it, because it is the one finding that predicts whether surgery will restore sight.',
    diagramPath: '/diagrams/ophthalmology/cornea_microscopic_layers.jpg',
    diagramTitle: 'Cornea and anterior segment: microscopic layers',
    sections: [
      {
        title: '1. Demographics and History',
        items: [
          {
            label: 'Demographics — each item earns its place',
            description:
              'In ophthalmology the demographic details are diagnostic, not clerical, and the source sheet says why for each one.',
            checklist: [
              'AGE: young — squint, amblyopia, congenital problems, vitamin A deficiency. Middle age — presbyopia. Old age — cataract, diabetic and hypertensive retinopathy, glaucoma',
              'SEX: male — workplace injury; female — thyroid eye disease',
              'OCCUPATION: welders and stone cutters — corneal foreign body; outdoor workers — cataract, pterygium, lid malignancy; AGRICULTURAL WORKERS — fungal corneal ulcer; glass industry — glass-blower’s cataract',
              'Occupation also decides TIMING: cataract surgery is done early in drivers and pilots',
              'Locality and address — endemic disease, and follow-up feasibility',
            ],
          },
          {
            label: 'Diminution of vision',
            description: 'The presenting complaint, fully characterised.',
            checklist: [
              'Which eye, or both; onset and duration',
              'Progressive or non-progressive',
              'For DISTANCE or NEAR or both — second sight (improved near vision) occurs in nuclear sclerosis from an index myopia',
              'PAINFUL or PAINLESS — this single question divides the whole differential',
              'Diurnal variation: cortical cataract is worse in bright light (the pupil constricts onto the opacity); central nuclear cataract is worse in dim light',
              'Aggravating and relieving factors',
              'FREQUENT CHANGE OF GLASSES — the classic early history of nuclear sclerosis',
            ],
            clinicalSign:
              'Gradual, painless, progressive is the cataract pattern. Sudden, or painful, and it is a different case entirely.',
          },
          {
            label: 'Other visual and non-visual symptoms',
            description: 'Asked in full, and each one localises.',
            checklist: [
              'COLOURED HALOS — intumescent cataract and acute angle-closure glaucoma',
              'Glare; photopsia (flashes of light); floaters',
              'Micropsia, macropsia, metamorphopsia — macular disease',
              'DIPLOPIA: uniocular (double pupil, keratoconus, incipient cataract — persists when the other eye is covered) versus binocular (paralytic squint — disappears on covering either eye)',
              'Night blindness (nyctalopia) or day blindness (hemeralopia)',
              'Redness, watering, discharge, itching, foreign body sensation, dryness',
              'PHOTOPHOBIA — conjunctivitis, keratitis, anterior uveitis',
              'Pain in the eye; PAIN ON EYE MOVEMENT — optic neuritis',
              'Drooping of the lid, protrusion of the eye, growth in or around the eye',
            ],
          },
          {
            label: 'Past, personal, family and drug history',
            description: 'Aimed at the cause of the cataract and at fitness for surgery under local anaesthesia.',
            checklist: [
              'H/O similar complaints in the OTHER eye, and any previous ocular surgery',
              'DIABETES MELLITUS — duration, control, and whether on insulin; diabetic cataract and retinopathy both matter',
              'Hypertension, asthma, tuberculosis, epilepsy, coronary artery disease; duration, treatment, and whether taken regularly',
              'LONG-TERM STEROIDS, topical or systemic — posterior subcapsular cataract and steroid-induced glaucoma',
              'Miotic eye drops; topical medication, especially in glaucoma',
              'H/O trauma and H/O ocular surgery',
              'Use of glasses for distance or near, and the current prescription',
              'Diet, appetite, sleep, bowel and bladder',
              'SMOKING and ALCOHOL — toxic and nutritional amblyopia',
              'Family history of similar complaints; any infective disease in family members',
            ],
          },
        ],
      },
      {
        title: '2. Ocular Examination — right eye then left eye, every line',
        items: [
          {
            label: 'Vision and head posture',
            description: 'Recorded before anything is touched.',
            checklist: [
              'VISION UNAIDED in Snellen notation, for distance; then WITH PINHOLE',
              'Improvement on pinhole means a refractive component; no improvement suggests media opacity or a posterior segment cause',
              'Near vision (N notation); and with the patient’s own glasses',
              'In dense cataract: counting fingers, hand movements, PERCEPTION OF LIGHT and PROJECTION OF RAYS in four quadrants — accurate projection is a prerequisite for surgery',
              'Head posture: face turn (squint), chin elevation or depression, head tilt',
              'Ocular posture — Hirschberg corneal reflex test',
              'Facial symmetry; forehead',
            ],
            clinicalSign:
              'Absent light perception, or inaccurate projection, means the retina or optic nerve is at fault and cataract surgery alone will not restore vision. That is the finding that changes the counselling.',
          },
          {
            label: 'Adnexa, lids and lacrimal apparatus',
            description: 'From the outside in, which is the order the sheet uses.',
            checklist: [
              'Eyebrows: present, extent from medial to lateral canthus; MADAROSIS (loss of eyebrow) — tuberculosis, leprosy, radiation; POLIOSIS (whitening) — senile, Vogt-Koyanagi-Harada',
              'Eyelids closed: lagophthalmos (seventh nerve palsy), Bell phenomenon, scar, swelling (chalazion, hordeolum), ulcer',
              'Eyelids open: INTERPALPEBRAL FISSURE, normally 9–11 mm. Below 9 mm is ptosis; above 11 mm is lid retraction',
              'Lid margin: ectropion, entropion, crusting, scaling, ulcerative blepharitis; anterior border rounded, posterior border angulated; meibomian gland openings',
              'Eyelashes: madarosis, poliosis, TRICHIASIS (trachoma), distichiasis',
              'LACRIMAL APPARATUS: lower punctum visible, signs of dacryocystitis, and the REGURGITATION TEST (ROPLAS — regurgitation on pressure over the lacrimal sac)',
              'Orbit: inspect the orbital margin for scar, irregularity, swelling; palpate for tenderness',
            ],
          },
          {
            label: 'Conjunctiva, cornea, anterior chamber and iris',
            description: 'The anterior segment proper, with a torch and then the slit lamp.',
            checklist: [
              'CONJUNCTIVA — bulbar: colour, CONGESTION (conjunctival versus ciliary), chemosis, discharge, subconjunctival haemorrhage, fleshy vascular mass (pterygium), BITOT SPOT',
              'Palpebral conjunctiva by eversion; forniceal by double eversion with a Desmarres retractor: follicles, papillae, concretions, ulcer, scarring',
              'CORNEA: size, shape, curvature, transparency, sheen, surface, SENSATION (before instilling any drop), staining with fluorescein and rose bengal',
              'Vascularisation — superficial versus deep; pannus; keratic precipitates on slit lamp',
              'Active ulcer — location, size, depth; scarring — peripheral or pupillary, and its size',
              'ANTERIOR CHAMBER: depth by oblique torch beam — normal, shallow or deep; Van Herick on slit lamp; contents normally clear; HYPOPYON, HYPHAEMA, flare and cells',
              'IRIS: colour, pattern, nodules (iridocyclitis), SYNECHIAE, new vessels (rubeosis), IRIDODONESIS',
              'PUPIL: number, size, shape, location; direct and consensual light reflex; near reflex; RAPD',
            ],
            normal:
              'Conjunctiva clear, cornea transparent with normal sensation, anterior chamber of normal depth and clear, iris normal pattern, pupil round regular and reacting.',
          },
          {
            label: 'Lens — and the maturity of the cataract',
            description: 'The point of the case, examined by oblique illumination and by distant direct ophthalmoscopy.',
            checklist: [
              'Present, absent (aphakia) or an intraocular lens (pseudophakia)',
              'Colour of the opacity: greyish white, milky white, pearly white, dirty white — and each means something',
              'IRIS SHADOW: present in immature cataract (a crescentic shadow of the pupillary margin falls on the lens), ABSENT in mature cataract. This is how maturity is graded at the bedside',
              'Position; PHACODONESIS (subluxation)',
              'Distant direct ophthalmoscopy for the RED REFLEX — black opacities against the red glow in immature cataract; no red reflex in mature',
              'Type of opacity: nuclear sclerosis, cortical (cuneiform, spokes), posterior subcapsular (steroids, diabetes), Christmas-tree, coronary',
              'Stages: incipient, immature, MATURE, HYPERMATURE (Morgagnian — liquefied cortex with a sunken nucleus; or sclerotic)',
              'DIGITAL TENSION, and applanation tonometry',
              'Extraocular movements: versions (binocular) and ductions (uniocular)',
              'Fundus if the media permit; B-scan ultrasound if they do not',
            ],
            clinicalSign:
              'A hypermature Morgagnian cataract can leak lens protein and cause phacolytic glaucoma or phacoanaphylactic uveitis. That is why a mature cataract is not something to leave indefinitely.',
          },
        ],
      },
      {
        title: '3. Diagnosis, Investigations and Management',
        items: [
          {
            label: 'Investigations',
            description: 'Divided into the eye and the patient.',
            checklist: [
              'Vision, refraction, intraocular pressure',
              'Slit lamp examination; fundus examination after dilatation',
              'B-SCAN ULTRASOUND where the fundus cannot be seen — to exclude retinal detachment, vitreous haemorrhage and posterior segment mass before promising a visual result',
              'BIOMETRY: keratometry and axial length, for intraocular lens power by the SRK-T or Hoffer Q formula',
              'Sac syringing — a blocked or infected lacrimal sac must be dealt with BEFORE intraocular surgery, or it seeds endophthalmitis',
              'Blood sugar (fasting and postprandial), HbA1c, blood pressure, ECG; urine routine',
              'Conjunctival swab where infection is suspected',
            ],
          },
          {
            label: 'Management',
            description: 'Surgery, and the counselling that goes with it.',
            checklist: [
              'No medical treatment arrests or reverses a cataract — say this plainly',
              'PHACOEMULSIFICATION with a foldable posterior chamber IOL through a small self-sealing incision — the procedure of choice',
              'Manual small incision cataract surgery (MSICS) — the workhorse in high-volume Indian settings, and appropriate for hard and mature cataracts',
              'Extracapsular cataract extraction; intracapsular only where the zygote is subluxated and no capsular support exists',
              'Postoperative: topical steroid and antibiotic in a tapering regimen, cycloplegic where indicated, and eye protection',
              'COUNSEL on the outcome where the posterior segment is unknown or diseased — an unmet expectation is the commonest complaint after technically perfect surgery',
              'Complications: posterior capsular rupture with vitreous loss, ENDOPHTHALMITIS, cystoid macular oedema, posterior capsular opacification (treated by Nd:YAG capsulotomy), and retinal detachment',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Classify loss of vision by mode of onset and pain.',
        answer:
          'SUDDEN PAINFUL: acute angle-closure glaucoma, iridocyclitis, and trauma (chemical or mechanical). SUDDEN PAINLESS loss: central retinal artery occlusion, massive vitreous haemorrhage, ischaemic central retinal vein occlusion, and retinal detachment involving the macula. SUDDEN PAINLESS DEFECTIVE vision (rather than total loss): optic neuritis, methyl alcohol amblyopia, central serous chorioretinopathy, non-ischaemic central retinal vein occlusion. GRADUAL PAINFUL defective vision: chronic iridocyclitis and corneal ulceration. GRADUAL PAINLESS defective vision: progressive pterygium, corneal degeneration and dystrophy, developmental and senile cataract, optic atrophy, chorioretinal degeneration, age-related macular degeneration, diabetic retinopathy, and uncorrected refractive error.',
        examinerTip:
          'This grid is the single most-asked ophthalmology viva question. Learn it as four boxes: sudden or gradual, crossed with painful or painless.',
      },
      {
        question: 'How do you tell an immature from a mature cataract at the bedside?',
        answer:
          'By the IRIS SHADOW and the red reflex, without any instrument beyond a torch and a direct ophthalmoscope. In an immature cataract, clear cortex remains between the pupillary margin of the iris and the opacity, so oblique torch illumination throws a crescentic shadow of the iris onto the lens — the iris shadow is PRESENT — and distant direct ophthalmoscopy shows black opacities silhouetted against a red reflex. In a mature cataract the entire cortex is opaque, the opacity reaches the anterior capsule, no clear zone remains to cast a shadow — iris shadow ABSENT — and there is NO red reflex. In hypermature Morgagnian cataract the cortex has liquefied, the lens appears milky with a sunken brown nucleus, and the anterior chamber deepens with iridodonesis.',
        examinerTip:
          'Iris shadow present means immature. It is one of the few clinical signs where the mnemonic is simply the logic.',
      },
      {
        question: 'Why is sac syringing done before cataract surgery?',
        answer:
          'Because a chronically infected lacrimal sac is a reservoir of organisms sitting immediately adjacent to the conjunctival sac, and opening the eye in that setting risks ENDOPHTHALMITIS — the one complication of cataract surgery that blinds. Regurgitation of mucopurulent material on pressure over the sac (a positive ROPLAS) or a blocked syringing indicates chronic dacryocystitis, and cataract surgery is DEFERRED until it is treated — by dacryocystorhinostomy, or dacryocystectomy where the patient is unsuitable for DCR. It is the reason the lacrimal apparatus is examined as part of a cataract workup and not treated as an unrelated complaint.',
        examinerTip:
          'The examiner is checking whether you understand that the pre-operative examination exists to find reasons NOT to operate today.',
      },
      {
        question: 'What is the difference between conjunctival and ciliary congestion?',
        answer:
          'Conjunctival (superficial) congestion involves the posterior conjunctival vessels: it is brick-red, most marked in the fornices and fading towards the limbus, the vessels MOVE with the conjunctiva when it is shifted with a cotton bud, and it BLANCHES with topical adrenaline or phenylephrine. It indicates conjunctivitis. Ciliary (deep) congestion involves the anterior ciliary vessels in the episclera: it is violaceous or purple, forms a circumcorneal ring that is most marked AT THE LIMBUS and fades towards the fornices, the vessels do NOT move with the conjunctiva, and it does not blanch with adrenaline. It indicates keratitis, iridocyclitis or acute glaucoma — that is, disease of the cornea or of the anterior uvea, which is serious.',
        examinerTip:
          'Where it is maximum is the answer: fornix for conjunctival, limbus for ciliary. A red eye with circumcorneal congestion is never "just conjunctivitis".',
      },
    ],
  },

  {
    id: 'corneal_ulcer_proforma',
    title: 'Infective Corneal Ulcer — the Painful Red Eye',
    system: 'Ophthalmology',
    department: 'Cornea / Ophthalmology',
    summary:
      'The ophthalmology emergency short case. Covers the history that separates fungal from bacterial and viral keratitis, the slit lamp description of the ulcer, the hypopyon, and why the corneal scraping is taken before any drop is started.',
    examPearl:
      'Agricultural work plus injury with vegetative matter is a FUNGAL ulcer until proved otherwise — dry raised slough, feathery margins, satellite lesions and an immobile hypopyon. Starting a steroid on that eye perforates it, and that is the reason the scraping comes before the treatment.',
    diagramPath: '/diagrams/ophthalmology/hypopyon_corneal_ulcer_ulcus_serpens.jpg',
    diagramTitle: 'Hypopyon corneal ulcer (ulcus serpens)',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'Pain, redness and defective vision',
            description: 'The triad, with the sequence in which they appeared.',
            checklist: [
              'Which eye; onset, duration, progression',
              'PAIN: severe, aching, with a foreign body sensation; worse on blinking',
              'Redness: onset and distribution',
              'Defective vision: degree, and whether it followed the pain or preceded it',
              'PHOTOPHOBIA, lacrimation, blepharospasm — the irritative triad of keratitis',
              'Discharge: watery (viral), mucopurulent (bacterial), scanty and sticky',
              'Coloured halos; glare',
            ],
          },
          {
            label: 'The history that names the organism',
            description: 'Almost every corneal ulcer has an antecedent, and finding it is most of the diagnosis.',
            checklist: [
              'INJURY — and WITH WHAT. Vegetative matter (paddy, sugarcane leaf, straw, a twig, a thorn) points at FUNGUS. Mud, soil, a fingernail or a stone points at bacteria',
              'OCCUPATION: agricultural worker — fungal ulcer; welder and stone cutter — foreign body',
              'CONTACT LENS wear, its hygiene, overnight wear, and use of tap water — Pseudomonas and ACANTHAMOEBA',
              'Preceding fever with vesicles, recurrent attacks, decreased corneal sensation — HERPES SIMPLEX keratitis',
              'Vesicular rash in the trigeminal distribution, Hutchinson sign at the nose tip — herpes zoster ophthalmicus',
              'USE OF TOPICAL STEROIDS or indigenous medicines before presentation — the single most important question, and the commonest reason an ulcer worsens',
              'Prior ocular surgery; dry eye; lid abnormality; trichiasis; chronic dacryocystitis',
              'Diabetes, immunosuppression, vitamin A deficiency and malnutrition',
            ],
            clinicalSign:
              'Ask directly what was put into the eye before arrival. Patients rarely volunteer indigenous remedies or a borrowed steroid drop, and both change the case.',
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'Vision and the lids',
            description: 'Recorded first, and the lids examined for the cause.',
            checklist: [
              'Vision in both eyes, with pinhole; it is often reduced to counting fingers',
              'Blepharospasm may need a topical anaesthetic before the eye can be opened — record that you used one',
              'Lid oedema; lid margin for blepharitis, trichiasis, entropion, ectropion, lagophthalmos',
              'LACRIMAL SAC — ROPLAS. Chronic dacryocystitis is a standing source of infection and a contraindication to any intraocular procedure',
              'Corneal SENSATION tested BEFORE instilling any anaesthetic — reduced in herpes simplex and in neurotrophic keratitis',
            ],
          },
          {
            label: 'The ulcer itself, on the slit lamp',
            description: 'Described completely — the description is what identifies the organism.',
            checklist: [
              'CONGESTION: ciliary or mixed, maximal at the limbus',
              'Site of the ulcer: central, paracentral or peripheral; and its size in two meridia',
              'SHAPE and MARGINS: regular with sharply defined margins (bacterial) versus FEATHERY, hyphate, irregular margins (fungal); DENDRITIC with terminal bulbs (herpes simplex); geographic (steroid-treated herpes)',
              'FLOOR and SLOUGH: wet, necrotic, yellowish (bacterial) versus DRY, raised, greyish-white slough that can be scraped as a sheet (fungal)',
              'SATELLITE LESIONS and an immune ring — fungal',
              'DEPTH and infiltration; any descemetocele; PERFORATION and iris prolapse',
              'FLUORESCEIN staining to delineate the epithelial defect; Seidel test if perforation is suspected',
              'ANTERIOR CHAMBER: depth, flare, cells, and HYPOPYON — record its height in millimetres, and whether it is MOBILE (shifts with head position; bacterial, sterile) or IMMOBILE and thick (fungal, often with fungal elements in it)',
              'Iris: pattern, posterior synechiae; pupil: size, shape, reaction',
              'Lens and fundus if visible; intraocular pressure (digital, since applanation on an ulcerated cornea is avoided)',
              'Examine the OTHER eye fully — it is the control and may share the predisposing cause',
            ],
            clinicalSign:
              'ULCUS SERPENS — a central greyish-white ulcer with a spreading, undermined serpiginous margin and a large hypopyon, classically pneumococcal, often arising with chronic dacryocystitis and after a trivial injury.',
          },
        ],
      },
      {
        title: '3. Investigations and Management',
        items: [
          {
            label: 'Corneal scraping — before treatment, not after',
            description: 'The one investigation that decides everything, and it is done at the slit lamp.',
            checklist: [
              'Topical anaesthetic (preservative-free), then scrape the base and the ADVANCING MARGIN of the ulcer with a Kimura spatula or a 15 number blade',
              'Smears: GRAM stain (bacteria), KOH wet mount or calcofluor white (FUNGAL hyphae), Giemsa',
              'Cultures: blood agar, chocolate agar, SABOURAUD DEXTROSE AGAR for fungus, thioglycollate broth; non-nutrient agar with E. coli overlay for Acanthamoeba',
              'Take the scraping BEFORE any antimicrobial is started — once treatment begins the yield falls and the organism may never be identified',
              'Confocal microscopy and PCR where available',
              'Sac syringing; blood sugar; HIV where clinically indicated',
              'B-scan if the fundus cannot be seen, to exclude endophthalmitis',
            ],
          },
          {
            label: 'Treatment',
            description: 'Intensive topical therapy, and the drug that must not be given.',
            checklist: [
              'BACTERIAL: fortified antibiotics hourly round the clock initially — fortified cefazolin 5% with fortified tobramycin or gentamicin 1.3%, or monotherapy with a fluoroquinolone; taper on clinical response',
              'FUNGAL: topical natamycin 5% for filamentary fungi, or voriconazole 1%; oral ketoconazole or voriconazole in severe disease. Response is slow and worsening in the first week is common',
              'HERPES SIMPLEX: topical acyclovir 3% ointment five times daily, or ganciclovir gel; oral acyclovir in severe or recurrent disease',
              'ACANTHAMOEBA: polyhexamethylene biguanide (PHMB) with propamidine, prolonged',
              'CYCLOPLEGIC — atropine or homatropine, to relieve ciliary spasm and prevent posterior synechiae',
              'NO TOPICAL STEROID until the organism is known and the infection controlled; in fungal keratitis a steroid can perforate the eye',
              'Treat the source: dacryocystectomy or DCR for a septic sac, correct trichiasis and entropion, stop contact lens wear',
              'Therapeutic penetrating keratoplasty for perforation or unresponsive disease; cyanoacrylate glue with a bandage contact lens for a small perforation',
              'Never pad an infected discharging eye',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'How do you distinguish fungal from bacterial keratitis clinically?',
        answer:
          'FUNGAL: history of injury with vegetative matter, often in an agricultural worker; slow, indolent course; DRY, raised, greyish-white slough that can be lifted as a sheet; FEATHERY or hyphate irregular margins; SATELLITE lesions; an immune ring; an endothelial plaque; and a thick, IMMOBILE hypopyon that may contain fungal elements. Pain is often less than the clinical appearance suggests. BACTERIAL: rapid onset over hours to days, often after minor trauma with mud or a fingernail, or with contact lens wear; a wet, yellowish, necrotic floor; sharply defined regular margins; surrounding stromal infiltrate and marked oedema; a smaller, MOBILE, sterile hypopyon that shifts with head position; and severe pain with mucopurulent discharge.',
        examinerTip:
          'Dry slough and feathery margins for fungus, wet slough and defined margins for bacteria. The mobility of the hypopyon is the extra mark.',
      },
      {
        question: 'Why is the hypopyon in a bacterial corneal ulcer sterile?',
        answer:
          'Because it is an outpouring of inflammatory cells and fibrin from the iris and ciliary body vessels in response to toxins diffusing across an INTACT Descemet membrane and endothelium — the organisms themselves remain in the cornea and do not enter the anterior chamber. That is why it is a sterile hypopyon, why it is mobile and shifts with head position, and why it resolves as the corneal infection is controlled without any need to drain it. In FUNGAL keratitis the hyphae can penetrate an intact Descemet membrane, so that hypopyon may genuinely contain organisms and is characteristically thick and immobile. A hypopyon that appears or grows after intraocular surgery, by contrast, is endophthalmitis and is an emergency.',
        examinerTip:
          'Say "toxins cross, organisms do not" — that single clause is the whole answer.',
      },
      {
        question: 'A patient with a corneal ulcer was given steroid drops elsewhere. What has that done?',
        answer:
          'Steroids suppress the local immune response and inhibit collagen synthesis while promoting collagenase activity, so they allow the organism to proliferate and simultaneously weaken the stroma. In FUNGAL keratitis they enhance fungal growth and are a recognised cause of progression to perforation. In HERPES SIMPLEX epithelial keratitis they convert a dendritic ulcer into a large GEOGRAPHIC ulcer. In bacterial keratitis given without adequate antibiotic cover they cause rapid worsening and stromal melting. They can also raise intraocular pressure and accelerate cataract. The immediate steps are to stop the steroid, take a corneal scraping, and start the appropriate antimicrobial — the eye typically looks worse before it looks better.',
        examinerTip:
          'Dendritic becoming geographic is the classic answer for herpes, and perforation is the classic answer for fungus.',
      },
    ],
  },
];
