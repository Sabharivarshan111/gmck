/**
 * ENT case proformas.
 *
 * Built from the ENT case sheets the app's owner sent — the Dynamic Diagnosers
 * set — cross-read against Dhingra and PL Dhingra's examination sequences, and
 * written to the same shape as the twelve proformas already in
 * `clinicalProformas.ts` so the picker, the clerking tab and the viva tab need
 * no special case for them.
 *
 * They live in their own file because `clinicalProformas.ts` had already grown
 * past 290 KB in one array, and a department per file is the smallest change
 * that stops it growing further. The array is spread back in there, so nothing
 * that reads CLINICAL_PROFORMAS changes.
 *
 * One thing worth knowing before editing any of these: the general examination
 * is NOT repeated in each case's sections. Every one of the source sheets
 * recites the same "Pallor, Icterus, Cyanosis, Clubbing, Oedema,
 * Lymphadenopathy" list, and the app draws that once, from
 * `generalExamSigns.ts`, with a photograph of each sign. Copying it into
 * fourteen proformas would be fourteen copies to keep in step.
 */
import type { ClinicalProforma } from '@/lib/clinicalProformas';

export const ENT_PROFORMAS: ClinicalProforma[] = [
  {
    id: 'csom_proforma',
    title: 'Chronic Suppurative Otitis Media (CSOM)',
    system: 'ENT',
    department: 'Otology / ENT',
    summary:
      'The commonest ENT long case in an Indian medical school. Covers the tubotympanic (safe) and atticoantral (unsafe) types, the full otoscopic description of a perforation, the tuning fork battery, and the complications that make this a surgical emergency rather than a chronic nuisance.',
    examPearl:
      'The whole case turns on safe versus unsafe. A central perforation with mucoid, odourless discharge is tubotympanic; an attic or marginal perforation with scanty, foul-smelling discharge and granulation is atticoantral, and that one erodes bone. Never present a CSOM case without saying which type and naming the evidence for it.',
    diagramPath: '/diagrams/ent/cholesteatoma_types_pathogenesis.jpg',
    diagramTitle: 'Cholesteatoma: types, pathogenesis and bone erosion',
    sections: [
      {
        title: '1. Demographics and Presenting Complaints',
        items: [
          {
            label: 'Demographics',
            description: 'Recorded in the patient’s own words, with the duration of each complaint.',
            checklist: [
              'Name, age, sex, occupation, address, socioeconomic status',
              'Ear discharge since ___ ; hard of hearing since ___ ; the order they appeared in matters',
              'Which ear, and whether the other ear has ever discharged',
            ],
          },
          {
            label: 'Ear discharge (otorrhoea)',
            description: 'The single most discriminating symptom between the two types.',
            checklist: [
              'Side, onset, duration, whether continuous or intermittent',
              'Amount: profuse (tubotympanic) versus scanty (atticoantral)',
              'Colour and nature: mucoid or mucopurulent versus purulent',
              'ODOUR: odourless in tubotympanic; foul, offensive smell suggests bone erosion and is the atticoantral marker',
              'Blood-stained discharge — granulation tissue, polyp, or malignancy in the elderly',
              'Relation to upper respiratory infection and to water entering the ear',
              'Stage at presentation: active, inactive or quiescent',
            ],
            clinicalSign:
              'Scanty foul-smelling discharge is the finding that should make you look at the attic before anything else.',
          },
          {
            label: 'Hearing loss',
            description: 'Conductive in uncomplicated disease; a sensorineural component means the labyrinth is involved.',
            checklist: [
              'Side, onset, duration, progression',
              'Does hearing worsen WHEN the ear is discharging, or improve? (Discharge filling the middle ear worsens it)',
              'Difficulty in a crowded place — paracusis willisii in otosclerosis, not in CSOM',
              'Fluctuation of deafness',
              'Effect on schooling, work and the telephone',
            ],
          },
          {
            label: 'Pain, tinnitus and vertigo',
            description: 'Each one of these three is a warning symptom in an ear that has discharged for years.',
            checklist: [
              'EARACHE in longstanding CSOM is never dismissed — it suggests extradural abscess, coalescent mastoiditis or malignancy',
              'Tinnitus: side, nature, subjective or objective',
              'VERTIGO: true rotatory vertigo means a labyrinthine fistula until proved otherwise',
              'Onset, duration, number of episodes and the last one',
            ],
            clinicalSign:
              'Pain, vertigo and facial weakness in a chronically discharging ear are the triad that turns a ward case into a theatre case.',
          },
          {
            label: 'Complication screen (the negative history that must be positive to ask)',
            description:
              'Asked deliberately and recorded even when negative, because the examiner will ask what you excluded.',
            checklist: [
              'Headache, fever, neck rigidity, vomiting — meningitis, brain abscess',
              'Diplopia — Gradenigo syndrome (petrositis: otorrhoea, retro-orbital pain, sixth nerve palsy)',
              'Facial asymmetry, inability to close the eye — facial nerve involvement',
              'Convulsions, altered sensorium, behavioural change — temporal lobe abscess',
              'Postauricular swelling and pinna pushed forward — mastoid abscess',
              'Tooth ache, recent sore throat, common cold',
            ],
          },
        ],
      },
      {
        title: '2. Past, Personal and Family History',
        items: [
          {
            label: 'Past history',
            description: 'Aimed at the cause and at anaesthetic fitness.',
            checklist: [
              'Previous similar episodes and their treatment; previous ear surgery',
              'Recurrent upper respiratory infection, adenoiditis, tonsillitis in childhood',
              'Measles, whooping cough, exanthematous fever — classical antecedents',
              'Diabetes, hypertension, tuberculosis, epilepsy, asthma',
              'Bleeding disorder; blood transfusion',
            ],
          },
          {
            label: 'Personal and family history',
            description: 'Includes the habit that keeps the ear discharging.',
            checklist: [
              'Diet, appetite, sleep, bowel and bladder',
              'Smoking, alcohol, tobacco chewing',
              'SELF-CLEANING: matchsticks, hairpins, cotton buds, oil instillation — ask directly, nobody volunteers it',
              'Swimming, bathing in ponds, water entering the ear',
              'Overcrowding and poor housing; similar complaints in the family',
              'Menstrual history where relevant',
            ],
          },
        ],
      },
      {
        title: '3. Examination of the Ear — both sides, normal ear first',
        items: [
          {
            label: 'Preauricular and postauricular region',
            description: 'Before the otoscope, and on both sides.',
            checklist: [
              'Preauricular sinus, accessory tragus, scar of previous surgery',
              'Pinna: size (macrotia, microtia, anotia), position, congenital anomaly, cauliflower deformity',
              'PINNA PUSHED FORWARD, DOWNWARD AND OUTWARD — mastoid abscess',
              'Postauricular groove: normal, deepened, or OBLITERATED (a mastoid abscess obliterates it)',
              'Swelling, oedema, sinus from a mastoid fistula, lymph nodes',
              'Palpate the mastoid process for thickening and tenderness; tenderness over the mastoid antrum, the tip, and the posterior border',
            ],
            clinicalSign:
              'Obliteration of the postauricular groove is the sign that distinguishes a mastoid abscess from a simple postauricular lymph node.',
          },
          {
            label: 'External auditory canal and tympanic membrane',
            description: 'Under good illumination after clearing discharge, with the pinna pulled up and back in an adult.',
            checklist: [
              'Canal: discharge, wax, granulation, polyp, swelling, sagging of the posterosuperior meatal wall (coalescent mastoiditis)',
              'Tympanic membrane colour; cone of light present or lost',
              'PERFORATION — describe type, number, size, margin, shape and SITE: central (pars tensa, safe) versus attic or marginal (unsafe)',
              'Middle ear mucosa through the perforation: pale and healthy, or oedematous, polypoidal and granular',
              'Handle of malleus, incudostapedial joint, and the quadrant involved',
              'Cholesteatoma flakes, granulation tissue, aural polyp, retraction pocket',
              'Mobility of the drum on Siegel pneumatic speculum',
            ],
            clinicalSign:
              'An attic or posterosuperior marginal perforation, granulation and pearly-white flakes together are cholesteatoma — the unsafe ear.',
          },
          {
            label: 'Bedside functional tests',
            description: 'Done in order, and reported as a battery rather than as isolated results.',
            checklist: [
              'Tragal sign — tenderness on pressing the tragus suggests otitis externa rather than CSOM',
              'Three-finger test: middle finger over the mastoid antrum, index over the zygoma, thumb over the mastoid tip',
              'FISTULA TEST — pressure on the tragus produces vertigo and nystagmus; a positive test means a labyrinthine fistula. A FALSE NEGATIVE occurs when the labyrinth is already dead',
              'Rinne test at 512 Hz (AC > BC positive, BC > AC negative)',
              'Weber test at 512 Hz — lateralises to the WORSE ear in conductive loss',
              'Absolute bone conduction — reduced in sensorineural loss, the same as the examiner’s in conductive',
              'Facial nerve: all five branches, and the forehead',
              'Vestibular: spontaneous nystagmus, Romberg, gait',
            ],
            normal: 'Rinne positive, Weber central, ABC equal to the examiner’s.',
          },
          {
            label: 'Nose, throat and neck',
            description: 'The ear is never examined alone — the eustachian tube begins in the nasopharynx.',
            checklist: [
              'Anterior rhinoscopy: septum, turbinates, discharge, polyp',
              'Postnasal space and adenoids in a child',
              'Oral cavity, oropharynx and tonsils',
              'Neck nodes, especially jugulodigastric',
            ],
          },
        ],
      },
      {
        title: '4. Diagnosis, Investigations and Management',
        items: [
          {
            label: 'Provisional diagnosis',
            description: 'Stated as side, type, stage, and the state of hearing.',
            checklist: [
              'Example: "Left chronic suppurative otitis media, tubotympanic type, active mucosal disease, with moderate conductive hearing loss"',
              'Differential: otitis externa, otomycosis, tuberculous otitis media, malignancy of the middle ear, granulomatous disease (Wegener)',
            ],
          },
          {
            label: 'Investigations',
            description: 'Each one with the reason it is asked for.',
            checklist: [
              'Routine blood and urine; blood sugar (a diabetic ear behaves differently)',
              'Discharge for culture and sensitivity — before starting drops',
              'PURE TONE AUDIOMETRY: type and degree of loss; an air-bone gap greater than 45 dB suggests ossicular discontinuity',
              'Tuning fork tests recorded alongside',
              'X-ray mastoid, Schuller view, BOTH sides — sclerotic in longstanding disease; the normal side is the control',
              'HRCT temporal bone — mandatory when cholesteatoma, complication or revision surgery is suspected',
              'Examination under microscope',
            ],
          },
          {
            label: 'Management',
            description: 'Medical first in the safe ear; the unsafe ear is surgical from the start.',
            checklist: [
              'Aural toilet — dry mopping or suction clearance, which is the single most effective step',
              'Topical antibiotic drops; avoid aminoglycoside drops where the drum is open and the labyrinth at risk',
              'Treat the focus: adenoidectomy, tonsillectomy, sinusitis, allergy',
              'WATER PRECAUTIONS and stop all self-instrumentation',
              'Tubotympanic: myringoplasty or tympanoplasty once dry for 6 weeks',
              'Atticoantral: canal wall down (modified radical) mastoidectomy — the aim is a safe, dry ear, and hearing comes second',
              'Complication present: urgent surgery with neurosurgical opinion',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'What makes an ear "unsafe" in CSOM?',
        answer:
          'The atticoantral (squamosal) type is unsafe because it is associated with cholesteatoma and granulation tissue, both of which erode bone through osteoclastic activity and enzymatic bone resorption. The perforation is attic or posterosuperior marginal, the discharge is scanty and foul-smelling, and complications — facial palsy, labyrinthine fistula, mastoid abscess, extradural and brain abscess, lateral sinus thrombophlebitis, meningitis — are the rule rather than the exception. The tubotympanic (mucosal) type has a central perforation, profuse odourless mucoid discharge and does not erode bone, so it is called safe.',
        examinerTip:
          'Say "safe" and "unsafe" but then immediately give the evidence: the site of the perforation and the character of the discharge. Examiners fail candidates who use the labels without the findings.',
      },
      {
        question: 'What is a cholesteatoma, and why is the name wrong?',
        answer:
          'It is a sac of keratinising stratified squamous epithelium in the middle ear cleft with accumulated keratin debris. The name is a misnomer three times over: it contains no cholesterol, it is not a tumour, and "-oma" implies neoplasia. It is better called keratoma. Congenital cholesteatoma arises behind an intact drum from an epidermoid rest; acquired cholesteatoma arises by retraction pocket invagination (primary), or by epithelial migration through a marginal perforation, basal cell hyperplasia, or squamous metaplasia (secondary).',
        examinerTip:
          'The bone destruction is the examinable point: pressure necrosis plus osteoclast activation plus collagenase from the matrix.',
      },
      {
        question: 'Why is the fistula test unreliable?',
        answer:
          'It is positive when intact labyrinthine function exists behind an eroded bony labyrinth — pressure transmitted through the fistula displaces perilymph and produces vertigo with nystagmus. It is FALSELY NEGATIVE when the labyrinth is already dead ("dead labyrinth"), which is precisely the advanced case you are most worried about, and it can be falsely positive in a congenitally dehiscent horizontal canal. So a negative test never excludes a fistula.',
        examinerTip:
          'Mention Hennebert sign — a positive fistula test with an intact drum, seen in congenital syphilis and Ménière disease.',
      },
      {
        question: 'Name the complications of CSOM in order.',
        answer:
          'Intratemporal (extracranial): mastoiditis, petrositis (Gradenigo syndrome), facial nerve palsy, labyrinthitis and labyrinthine fistula, and conductive or mixed hearing loss. Extracranial soft tissue: postauricular (mastoid) abscess, Bezold abscess tracking into the neck under sternomastoid, Luc abscess, and Citelli abscess. Intracranial: extradural abscess, subdural abscess, meningitis, brain abscess (temporal lobe and cerebellum), lateral sinus thrombophlebitis, and otitic hydrocephalus.',
        examinerTip:
          'Meningitis is the commonest intracranial complication; brain abscess carries the highest mortality. Say both.',
      },
      {
        question: 'Interpret Rinne and Weber in a patient with left-sided CSOM.',
        answer:
          'Left conductive loss gives a NEGATIVE Rinne on the left (bone conduction better than air) with a positive Rinne on the right, and Weber lateralised to the LEFT — the worse ear, because the conductive block removes masking by ambient noise and improves bone conduction on that side. Absolute bone conduction is equal to the examiner’s on both sides, which is what tells you the cochlea is intact. A false negative Rinne occurs in severe unilateral sensorineural loss, where the sound crosses to the opposite cochlea by bone.',
        examinerTip:
          'Always do all three — Rinne, Weber and ABC. Any two alone can be made to give a wrong answer.',
      },
    ],
  },

  {
    id: 'dns_sinusitis_proforma',
    title: 'Deviated Nasal Septum with Chronic Sinusitis',
    system: 'ENT',
    department: 'Rhinology / ENT',
    summary:
      'Nasal obstruction is the commonest ENT complaint and the DNS case is how it is examined. Covers the history of obstruction, the anterior rhinoscopy findings, the sinus tenderness points, and the distinction between a deviation that needs surgery and one that is an incidental finding.',
    examPearl:
      'A deviated septum is only a diagnosis if it is symptomatic — most septa are deviated. Present the obstruction, the side, whether it alternates, and only then the septum, or the examiner will ask you why you are operating on an asymptomatic anatomical variant.',
    sections: [
      {
        title: '1. Presenting Complaints and History',
        items: [
          {
            label: 'Nasal obstruction',
            description: 'The symptom that brings the patient, described in full before anything else.',
            checklist: [
              'Side: unilateral, bilateral, or ALTERNATING (alternating obstruction suggests the normal nasal cycle made noticeable, or vasomotor rhinitis)',
              'Onset: insidious or sudden; progressive or static',
              'Duration',
              'Aggravating factors: lying on one side, cold air, dust, early morning, exercise',
              'Relieving factors: decongestant drops — and for how long they have been used (rhinitis medicamentosa)',
              'Mouth breathing, snoring, disturbed sleep, daytime somnolence',
            ],
          },
          {
            label: 'Nasal discharge and postnasal drip',
            description: 'Its character separates allergy from infection.',
            checklist: [
              'Side, duration, quantity',
              'Watery and profuse with sneezing and itching — allergic',
              'Mucopurulent, thick, yellow-green — bacterial sinusitis',
              'FOUL-SMELLING and unilateral — foreign body in a child, fungal sinusitis, or dental origin',
              'Blood-stained — must exclude neoplasm in an adult',
              'Postnasal drip, throat clearing, chronic cough worse on lying down',
            ],
          },
          {
            label: 'Headache and facial pain',
            description: 'Located by sinus, and distinguished from migraine and tension headache.',
            checklist: [
              'Site: over the cheek (maxillary), above the medial canthus and forehead (frontal), between and behind the eyes (ethmoid), vertex and occiput (sphenoid)',
              'Timing: frontal sinusitis characteristically gives office headache — starts on waking, peaks at midday, subsides by evening',
              'Aggravated by bending forward, coughing or straining',
              'Relieved by decongestants and by discharge of pus',
            ],
            clinicalSign:
              'Pain that worsens on stooping is the classic sinus feature and is worth asking for explicitly.',
          },
          {
            label: 'Associated and negative history',
            description: 'Asked and recorded, because the examiner asks what you excluded.',
            checklist: [
              'Epistaxis: side, quantity, anterior or posterior, trauma or nose-picking, frequency',
              'Loss of smell (hyposmia, anosmia) and change in voice (rhinolalia clausa)',
              'Sneezing, itching of nose, eyes and palate, watery eyes — allergic rhinitis',
              'Ear symptoms: blocking, decreased hearing, discharge (eustachian dysfunction)',
              'Throat pain, cough, fever',
              'H/O trauma to the nose, previous nasal surgery',
              'H/O asthma and aspirin sensitivity — Samter triad with nasal polyposis',
            ],
          },
        ],
      },
      {
        title: '2. Examination of the Nose and Sinuses',
        items: [
          {
            label: 'External examination',
            description: 'From the front, the side, and from above and behind the seated patient.',
            checklist: [
              'Dorsum: deviation, hump, saddle deformity, broadening',
              'Skin over the nose and sinuses: swelling, redness, scar',
              'Nasal vestibule: vestibulitis, furuncle, crusting',
              'Columella and nasal tip; alar collapse on deep inspiration (Cottle test)',
              'PATENCY: cold spatula misting test, or occlude each nostril in turn and ask the patient to breathe',
            ],
          },
          {
            label: 'Anterior rhinoscopy',
            description: 'With a Thudichum speculum and headlight, before and after decongestion.',
            checklist: [
              'SEPTUM: side and site of deviation — C-shaped, S-shaped, spur, dislocation of the caudal end, thickening',
              'Cottle classification of the deviation and its relation to the nasal valve',
              'Inferior and middle turbinates: hypertrophy, compensatory hypertrophy on the concave side, congestion, pale and boggy (allergy)',
              'Middle meatus: pus, polyp, oedema — the ostiomeatal complex is the key area',
              'Polyps: pale, insensitive to probing, do NOT bleed on touch (versus a neoplasm, which does)',
              'Discharge: site and character',
              'REPEAT after decongestion — mucosal swelling can hide a spur and mimic a deviation',
            ],
            clinicalSign:
              'Insensitivity to probing and failure to bleed is what separates a polyp from an angiofibroma or a malignancy. Never probe aggressively in a young male with a bleeding nasal mass.',
          },
          {
            label: 'Sinus examination and posterior rhinoscopy',
            description: 'Tenderness elicited at the named points, gently and symmetrically.',
            checklist: [
              'Maxillary: pressure over the canine fossa and the anterior wall below the orbit',
              'Frontal: upward pressure on the floor of the frontal sinus at the medial end of the supraorbital ridge (NOT over the forehead)',
              'Ethmoid: pressure over the medial canthus',
              'Transillumination of maxillary and frontal sinuses in a dark room — of historic interest but still asked',
              'Posterior rhinoscopy or nasal endoscopy: choanae, eustachian tube openings, fossa of Rosenmüller, adenoids, postnasal discharge',
              'Oral cavity: dental caries and periapical abscess of upper premolars and molars (dental sinusitis)',
              'Throat and ear examination',
            ],
          },
        ],
      },
      {
        title: '3. Diagnosis, Investigations and Management',
        items: [
          {
            label: 'Investigations',
            description: 'CT has replaced plain films, and the reason matters.',
            checklist: [
              'Routine blood; absolute eosinophil count and serum IgE if allergy is suspected',
              'Nasal smear for eosinophils',
              'Skin prick testing for aeroallergens',
              'X-ray paranasal sinuses (Water view) — mucosal thickening, fluid level, opacity; poor for ethmoids',
              'CT PARANASAL SINUSES, coronal cuts — the investigation of choice, because it shows the ostiomeatal complex, which is where the disease actually is',
              'Diagnostic nasal endoscopy',
              'Culture of middle meatal pus',
            ],
          },
          {
            label: 'Management',
            description: 'Medical management first, and surgery for what medicine cannot fix.',
            checklist: [
              'Allergen avoidance; intranasal steroid spray, which is the mainstay',
              'Oral antihistamine; short-course topical decongestant only (never beyond 5–7 days)',
              'Antibiotics for acute bacterial exacerbation, with adequate duration',
              'Saline nasal douching',
              'SEPTOPLASTY — conservative, preserves the L-strut; for symptomatic deviation',
              'Submucous resection (SMR) — largely superseded; risks saddle nose and septal perforation',
              'FESS for persistent sinus disease, correcting the ostiomeatal complex',
              'Turbinate reduction where hypertrophy persists',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Why is septoplasty preferred over submucous resection?',
        answer:
          'SMR (Killian) removes most of the cartilaginous and bony septum, leaving only a small dorsal and caudal strut, and it is done under mucoperichondrial flaps raised on both sides. Its complications are saddle nose from loss of dorsal support, columellar retraction, flapping septum, and septal perforation where both flaps are torn opposite each other. Septoplasty (Cottle, Freer) is conservative: the deviated portion is mobilised, scored, repositioned or partially resected, and the mucoperichondrium is elevated on ONE side only wherever possible, preserving the L-strut of at least 1 cm dorsally and caudally. It can also be done in children, where SMR is contraindicated because it interferes with midfacial growth.',
        examinerTip:
          'The 1 cm L-strut is the number the examiner wants. Say it.',
      },
      {
        question: 'What is the ostiomeatal complex and why does FESS target it?',
        answer:
          'It is the final common drainage pathway of the anterior ethmoid, maxillary and frontal sinuses, comprising the maxillary ostium, the infundibulum, the uncinate process, the ethmoidal bulla, the hiatus semilunaris and the middle meatus. Mucociliary clearance in these sinuses is directed towards their natural ostia regardless of gravity or of any surgically created window, so obstruction here causes disease in all three sinuses, and relieving it allows all three to ventilate and drain normally. That is the entire physiological basis of functional endoscopic sinus surgery — the disease is treated by restoring ventilation, not by stripping mucosa.',
        examinerTip:
          'This is why the old Caldwell-Luc inferior meatal antrostomy failed: cilia still beat towards the natural ostium, not towards the new window.',
      },
      {
        question: 'A young boy has unilateral nasal obstruction and repeated profuse epistaxis. What must you not do?',
        answer:
          'Do not biopsy or vigorously probe the mass. This is juvenile nasopharyngeal angiofibroma until proved otherwise — a highly vascular, locally invasive benign tumour of the nasopharynx occurring almost exclusively in adolescent males, arising near the sphenopalatine foramen. Biopsy in the outpatient department can cause torrential, life-threatening haemorrhage. Diagnosis is by contrast CT and MRI, which show the pathognomonic anterior bowing of the posterior maxillary wall (Holman-Miller sign), with angiography for the feeding vessel — usually the internal maxillary artery — and preoperative embolisation.',
        examinerTip:
          'The trap is being asked "would you like to biopsy it?". The answer is no, and the reason is the marks.',
      },
    ],
  },

  {
    id: 'nasal_polyp_proforma',
    title: 'Bilateral Ethmoidal Nasal Polyposis',
    system: 'ENT',
    department: 'Rhinology / ENT',
    summary:
      'The short case that tests whether you can tell a polyp from everything else that fills a nose. Covers the history of obstruction with anosmia, the anterior rhinoscopy appearance, the antrochoanal versus ethmoidal distinction, and the associations that have to be asked about.',
    examPearl:
      'A polyp is pale, glistening, mobile, INSENSITIVE TO PROBING and does not bleed on touch. Every one of those four is what a neoplasm is not, and reciting them is how you earn the right to call it a polyp.',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'Nasal obstruction with loss of smell',
            description: 'Bilateral, progressive and associated with anosmia is the ethmoidal pattern.',
            checklist: [
              'Side: bilateral in ethmoidal polyposis, unilateral in antrochoanal polyp',
              'Onset insidious, progressive, continuous rather than alternating',
              'Duration; aggravating and relieving factors',
              'LOSS OF SMELL — hyposmia then anosmia; ask about taste too, since most "taste" loss is smell',
              'Mouth breathing, snoring, change in voice (rhinolalia clausa)',
              'Watery nasal discharge, sneezing, itching, watery eyes — the allergic background',
              'Headache; facial pressure; postnasal drip',
            ],
          },
          {
            label: 'Associations that must be asked',
            description: 'Polyposis is rarely an isolated finding.',
            checklist: [
              'ASTHMA and ASPIRIN sensitivity — Samter triad (aspirin sensitivity, asthma, nasal polyposis)',
              'Allergic rhinitis and atopy; allergic fungal rhinosinusitis',
              'CYSTIC FIBROSIS — polyps in a child demand this be excluded',
              'Kartagener syndrome (primary ciliary dyskinesia, situs inversus, bronchiectasis)',
              'Previous nasal surgery and recurrence — polyposis recurs, and the patient should be told so',
            ],
            clinicalSign:
              'Nasal polyps in a child are cystic fibrosis until proved otherwise; simple allergic polyposis is rare before adolescence.',
          },
        ],
      },
      {
        title: '2. Examination',
        items: [
          {
            label: 'Anterior rhinoscopy',
            description: 'The four features that make it a polyp.',
            checklist: [
              'Smooth, glistening, GRAPE-LIKE pale masses; may be sessile or pedunculated',
              'INSENSITIVE TO PROBING — the patient feels nothing',
              'DOES NOT BLEED on gentle touch',
              'MOBILE on probing, and the probe can be passed all round a pedunculated one',
              'A polyp protruding from the nostril may look pink and vascular and mimic a neoplasm — that is the trap',
              'State of the septum, turbinates and middle meatus',
              'Examine both sides and both the nasal cavity and the postnasal space',
            ],
          },
          {
            label: 'Distinguishing what else fills a nose',
            description: 'The differential is the examination.',
            checklist: [
              'Hypertrophied middle turbinate — sensitive to probing, bleeds, cannot be moved separately from the lateral wall',
              'Concha bullosa (pneumatised middle turbinate)',
              'Antrochoanal polyp — unilateral, single, arises from the maxillary antrum, grows backwards to the choana and nasopharynx',
              'Angiofibroma — adolescent male, profuse epistaxis, firm and vascular',
              'Inverted papilloma — unilateral, fleshy, recurs, may harbour malignancy',
              'Malignancy — unilateral, bleeds, associated pain, numbness, loose teeth, proptosis',
              'Encephalocele or meningocele — pulsatile, expands on crying, NEVER biopsy',
              'Rhinosporidiosis — friable, strawberry-like, bleeds readily',
            ],
            clinicalSign:
              'A pulsatile nasal mass in an infant that swells on crying or straining (Furstenberg sign) is a meningoencephalocele. Biopsying it causes a CSF leak and meningitis.',
          },
        ],
      },
      {
        title: '3. Investigations and Treatment',
        items: [
          {
            label: 'Investigations',
            description: 'Imaging is for the extent and the anatomy, not for the diagnosis.',
            checklist: [
              'CT PARANASAL SINUSES — the investigation of choice; shows extent, the ostiomeatal complex, bone erosion and the skull base before surgery',
              'Diagnostic nasal endoscopy',
              'Absolute eosinophil count, serum IgE, skin prick tests',
              'Sweat chloride test in a child',
              'Histopathology of the excised specimen — always, because inverted papilloma and malignancy present this way',
            ],
          },
          {
            label: 'Treatment',
            description: 'Medical first; surgery for what medicine leaves behind; and the recurrence is discussed in advance.',
            checklist: [
              'Early polypoidal change with oedematous mucosa can revert on antihistamine and control of allergy',
              'INTRANASAL STEROID SPRAY — the mainstay, long term',
              'Short course of oral steroids — "medical polypectomy" — to shrink before surgery',
              'Antileukotrienes where asthma coexists; treat the asthma',
              'FUNCTIONAL ENDOSCOPIC SINUS SURGERY (FESS) for ethmoidal polyposis',
              'Simple avulsion for an antrochoanal polyp is inadequate — the antral attachment must be removed or it recurs',
              'Counsel about recurrence and the need for continued topical steroid — leaving this out is why patients feel the surgery failed',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Ethmoidal versus antrochoanal polyp — give the differences.',
        answer:
          'Ethmoidal polyps are BILATERAL, multiple, arise from the ethmoid sinuses, middle turbinate and middle meatus, are usually allergic or from eosinophilic inflammation, occur in adults, grow anteriorly towards the nostril, and RECUR commonly. The antrochoanal polyp (Killian polyp) is UNILATERAL and SINGLE, arises from the mucosa of the maxillary antrum near its accessory ostium, is usually infective and typically occurs in children and young adults, has a trilobed structure (antral, nasal and choanal parts), grows BACKWARDS through the choana into the nasopharynx where it may be seen on posterior rhinoscopy, and recurs only if the antral part is left behind.',
        examinerTip:
          'The direction of growth is the memorable discriminator: ethmoidal forwards out of the nostril, antrochoanal backwards into the nasopharynx.',
      },
      {
        question: 'Why must nasal polyps in a child be taken seriously?',
        answer:
          'Simple allergic ethmoidal polyposis is rare in children, so a polyp in a child must be investigated rather than simply removed. The three to exclude are cystic fibrosis (sweat chloride test), meningoencephalocele (a pulsatile mass that expands on crying — Furstenberg sign — which must never be biopsied or avulsed, since that produces a CSF leak and meningitis), and antrochoanal polyp. Juvenile nasopharyngeal angiofibroma also enters the differential in adolescent males.',
        examinerTip:
          'If asked to remove a polyp in a child in the exam, the correct answer begins with imaging, not with forceps.',
      },
    ],
  },

  {
    id: 'tonsillitis_proforma',
    title: 'Chronic Tonsillitis and Adenotonsillar Hypertrophy',
    system: 'ENT',
    department: 'Laryngology / ENT',
    summary:
      'The commonest ENT short case in paediatric and adult practice. Covers the sore throat history, the grading of tonsillar enlargement, the oropharyngeal examination sequence, the indications for tonsillectomy and the complications that are asked about every time.',
    examPearl:
      'Tonsillar size does NOT decide tonsillectomy — the frequency of documented attacks does. A grade 4 tonsil in a child with two sore throats a year is not an operation; four sore throats a year for two years in a small tonsil is.',
    diagramPath: '/diagrams/ent/acute_tonsillitis_types_clinicopathological.jpg',
    diagramTitle: 'Tonsillitis: clinicopathological types and grading',
    sections: [
      {
        title: '1. History',
        items: [
          {
            label: 'Fever, throat pain and dysphagia',
            description: 'Each fully characterised, in that order.',
            checklist: [
              'FEVER: onset sudden or insidious, duration, continuous / intermittent / remittent, associated malaise, lethargy, chills',
              'THROAT PAIN: onset, duration, continuous or intermittent, character, aggravated by swallowing, relieved by medication',
              'DIFFICULTY IN SWALLOWING: for solids, liquids or both; odynophagia versus true dysphagia',
              'REFERRED EARACHE, usually bilateral — via the glossopharyngeal nerve (tympanic branch, Jacobson nerve). This is the examinable association',
              'Change in voice; muffled "hot potato" voice suggests peritonsillar abscess',
              'Snoring, mouth breathing, disturbed sleep, witnessed apnoea, daytime somnolence, poor school performance',
            ],
            clinicalSign:
              'Referred otalgia with a normal ear examination is the classic tonsillitis finding, and the nerve is the mark.',
          },
          {
            label: 'Frequency of attacks — the part that decides management',
            description: 'Counted, dated and documented, because the indication for surgery is a number.',
            checklist: [
              'How many episodes in the last year? In each of the last two or three years?',
              'How many needed antibiotics? How many days off school or work?',
              'Paradise criteria: 7 episodes in 1 year, or 5 per year for 2 years, or 3 per year for 3 years',
              'Previous peritonsillar abscess (quinsy) — one is an indication in most units',
              'Halitosis, tonsillar debris and recurrent foul taste',
            ],
          },
          {
            label: 'Negative history and past history',
            description: 'Asked deliberately and recorded.',
            checklist: [
              'No headache, cough, nasal discharge, epistaxis',
              'No ear discharge, decreased hearing, tinnitus',
              'Rheumatic fever, joint pains, chorea, skin rash — post-streptococcal sequelae',
              'Haematuria, puffiness of face — post-streptococcal glomerulonephritis',
              'Diabetes, tuberculosis, hypertension, asthma, allergy',
              'BLEEDING DIATHESIS and previous blood transfusion — essential before tonsillectomy',
              'Previous surgery and anaesthetic history',
            ],
          },
        ],
      },
      {
        title: '2. Examination of the Oral Cavity and Oropharynx',
        items: [
          {
            label: 'Oral cavity',
            description: 'Systematically, with a torch and a tongue depressor, before looking at the tonsils.',
            checklist: [
              'Mouth opening — adequate, or TRISMUS (which suggests peritonsillar or parapharyngeal abscess)',
              'Lips and oral commissures; angular stomatitis',
              'Tongue: coating, fissures, ulcers, size, movements',
              'Floor of mouth; buccal mucosa; gingivobuccal sulcus',
              'Dentition and dental hygiene; caries',
              'Hard palate',
            ],
          },
          {
            label: 'Oropharynx and the tonsils',
            description: 'The tonsil is described, not just measured.',
            checklist: [
              'Halitosis',
              'Uvula: position, congestion, oedema; DEVIATED to the opposite side in quinsy',
              'Soft palate: congestion, bulging (quinsy)',
              'Anterior pillars: congestion — persistent congestion of the anterior pillar is the most reliable sign of chronic tonsillitis',
              'TONSILS: size and grade, surface (smooth, cryptic, fibrosed), colour, membrane or exudate, debris in the crypts, ulceration',
              'GRADING — Grade 1: within the pillars. Grade 2: up to the pillars. Grade 3: beyond the pillars. Grade 4: reaching the midline (kissing tonsils)',
              'Posterior pillars; posterior pharyngeal wall congestion and granularity',
              'Tonsil expressed with a tongue depressor for cheesy debris',
            ],
            normal: 'Tonsils grade 1, pink, non-congested, crypts clear, pillars not congested.',
          },
          {
            label: 'Neck, ear and nose',
            description: 'A tonsillitis case is not finished at the tonsil.',
            checklist: [
              'JUGULODIGASTRIC (tonsillar) NODE — at the angle of the mandible; enlarged and tender in acute, firm and shotty in chronic tonsillitis',
              'All other cervical node groups',
              'Full ear examination including tuning fork tests — the earache must be shown to be referred',
              'Nose and postnasal space; adenoid facies in a child (open mouth, crowded teeth, high arched palate, pinched nose, vacant expression)',
              'Systemic: CVS for murmurs (rheumatic valvular disease), RS, CNS',
            ],
          },
        ],
      },
      {
        title: '3. Diagnosis, Investigations and Management',
        items: [
          {
            label: 'Investigations',
            description: 'Few, and each for a reason.',
            checklist: [
              'Complete blood count with differential; peripheral smear',
              'Throat swab for culture and sensitivity',
              'ASO titre where post-streptococcal sequelae are suspected',
              'Bleeding time, clotting time, prothrombin time — before tonsillectomy',
              'X-ray soft tissue neck lateral view for adenoid size in a child',
              'Sleep study where obstructive sleep apnoea is suspected',
            ],
          },
          {
            label: 'Management and the indications for tonsillectomy',
            description: 'Medical for the episode; surgery for the pattern.',
            checklist: [
              'Acute: bed rest, fluids, analgesia, and PENICILLIN or amoxicillin for a full 10 days to prevent rheumatic fever',
              'Avoid ampicillin where infectious mononucleosis is possible — it causes a florid rash',
              'ABSOLUTE indications: recurrent attacks by the Paradise criteria, peritonsillar abscess, obstructive sleep apnoea and cor pulmonale, suspicion of malignancy, tonsillitis causing febrile seizures',
              'RELATIVE: diphtheria carrier, recurrent streptococcal carriage, chronic tonsillitis with halitosis unresponsive to medical treatment',
              'CONTRAINDICATIONS: bleeding diathesis, active local infection, cleft palate, during an epidemic of polio, uncontrolled systemic disease, anaemia (haemoglobin below 10 g/dL)',
              'Adenoidectomy where adenoid hypertrophy coexists',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Why is the earache in tonsillitis felt in the ear when the ear is normal?',
        answer:
          'It is referred pain. The tonsil and the tonsillar fossa are supplied by the glossopharyngeal nerve, and the same nerve supplies the middle ear and the medial surface of the tympanic membrane through its tympanic branch — the nerve of Jacobson. Pain from the tonsil is therefore referred along the ninth nerve and perceived in the ear. This is why earache in tonsillitis is typically bilateral and why the ear examination is entirely normal. Referred otalgia can also come along the fifth (via the auriculotemporal nerve, from teeth and the temporomandibular joint) and the tenth (via the auricular branch, Arnold nerve, from the larynx and hypopharynx).',
        examinerTip:
          'Name the nerve of Jacobson and the nerve of Arnold. Those two names carry the answer.',
      },
      {
        question: 'What is quinsy and how is it managed?',
        answer:
          'Peritonsillar abscess — collection of pus between the tonsillar capsule and the superior constrictor muscle, usually unilateral and a complication of acute tonsillitis. It presents with severe unilateral throat pain, odynophagia, TRISMUS, drooling, a muffled "hot potato" voice, ipsilateral referred earache and fever. Examination shows a bulging congested soft palate, the tonsil pushed downwards and medially, and the UVULA DEVIATED TO THE OPPOSITE SIDE. Management is incision and drainage at the point of maximum bulge — classically at the junction of a horizontal line through the base of the uvula and a vertical line through the anterior pillar — with systemic antibiotics, analgesia and hydration. Interval tonsillectomy is performed 4 to 6 weeks later, or hot tonsillectomy during the acute episode in some units.',
        examinerTip:
          'Trismus plus uvular deviation is the pair that makes the diagnosis from the doorway.',
      },
      {
        question: 'Name the complications of tonsillectomy.',
        answer:
          'Immediate — primary haemorrhage during surgery, and reactionary haemorrhage within the first 24 hours, usually from slipping of a ligature or from the rise in blood pressure as the patient recovers; this needs return to theatre. Delayed — secondary haemorrhage, typically on the fifth to tenth day, caused by infection of the tonsillar fossa, usually managed with antibiotics and occasionally surgically. Others: injury to the tonsillar pillars, uvula or soft palate, damage to teeth and the temporomandibular joint, aspiration, scarring with velopharyngeal insufficiency, injury to the internal carotid artery (rare and catastrophic — it lies about 2.5 cm posterolateral to the tonsil), and Eagle syndrome from an elongated styloid process.',
        examinerTip:
          'The timing of the bleed is the question: reactionary within 24 hours, secondary from day 5 to 10.',
      },
    ],
  },

  {
    id: 'stridor_proforma',
    title: 'Stridor — Assessment of the Obstructed Airway',
    system: 'ENT',
    department: 'Laryngology / Emergency ENT',
    summary:
      'Not a diagnosis but an emergency sign, and the case tests whether you can localise the obstruction by the sound alone and act before investigating. Covers the phase of stridor and what it localises to, the signs of decompensation, and the causes by age.',
    examPearl:
      'The phase of the stridor localises the lesion: INSPIRATORY is supraglottic, BIPHASIC is glottic or subglottic, EXPIRATORY is tracheobronchial. Say the phase first — it is the one piece of information that changes what you do in the next five minutes.',
    diagramPath: '/diagrams/ent/ent_stridor_etiology_levels.jpg',
    diagramTitle: 'Stridor: level of obstruction and causes by site',
    sections: [
      {
        title: '1. History — taken while assessing the airway, not before',
        items: [
          {
            label: 'The sound itself',
            description: 'Its phase, onset and progression localise and grade the obstruction.',
            checklist: [
              'PHASE: inspiratory, expiratory or biphasic — ask the attendant to imitate it if necessary',
              'Onset: sudden (foreign body, angio-oedema, trauma) versus gradual (papilloma, malignancy, stenosis)',
              'Duration and progression',
              'Aggravating factors: crying, feeding, exertion, lying supine (laryngomalacia is worse supine and on crying)',
              'Relieving factors: position, prone posture, medication, nebulisation',
              'Change with sleep',
            ],
          },
          {
            label: 'Associated symptoms',
            description: 'Each points at a level.',
            checklist: [
              'Hoarseness or change in voice / weak cry — glottic lesion',
              'Aphonia — severe glottic involvement',
              'Dysphagia and drooling — supraglottic; epiglottitis, foreign body in the pharynx',
              'Barking cough — croup (laryngotracheobronchitis)',
              'Fever, toxic appearance — epiglottitis, bacterial tracheitis, retropharyngeal abscess',
              'HISTORY OF CHOKING while eating or playing — foreign body, and the single most important question',
              'Feeding difficulty, failure to thrive, recurrent chest infection in an infant',
              'Trauma, intubation, tracheostomy, neck surgery (thyroidectomy — recurrent laryngeal nerve)',
              'Nocturnal breathlessness, orthopnoea, diurnal variation',
            ],
            clinicalSign:
              'A clear history of choking, even with a normal chest examination and a normal X-ray, is an indication for bronchoscopy.',
          },
          {
            label: 'Past, family and personal history',
            description: 'Short, and aimed at causes and fitness.',
            checklist: [
              'Previous similar episodes; previous intubation and its duration',
              'Tuberculosis, diabetes, hypertension, allergy and asthma',
              'Previous surgery; pleural effusion; pneumonia; past respiratory infection',
              'Immunisation status, especially Hib and diphtheria',
              'Family history of similar complaints; consanguinity',
              'Smoking, alcohol, occupational exposure',
            ],
          },
        ],
      },
      {
        title: '2. Examination — grade the obstruction before you localise it',
        items: [
          {
            label: 'Signs of decompensation — looked for first',
            description: 'These decide whether the patient goes to theatre now or to the X-ray department.',
            checklist: [
              'Restlessness, anxiety, air hunger — early and reliable',
              'SUPRASTERNAL, INTERCOSTAL and SUBCOSTAL RETRACTION; tracheal tug',
              'Use of accessory muscles; nasal flaring; head bobbing in an infant',
              'Tachypnoea, tachycardia',
              'CYANOSIS and a FALLING respiratory rate with a QUIET chest are LATE and pre-terminal — a stridor that is getting softer in a tiring child is worse, not better',
              'Altered sensorium, drowsiness',
              'Pulse oximetry, though a normal saturation never reassures in obstruction',
              'Jackson grading of the obstruction',
            ],
            clinicalSign:
              'The dangerous moment is when the noise decreases. Decreasing stridor with increasing distress means the airflow has fallen, not the obstruction.',
          },
          {
            label: 'Do not do these in suspected acute epiglottitis',
            description: 'Actively contraindicated, and the examiner is checking you know.',
            checklist: [
              'Do NOT examine the throat with a spatula — it can precipitate complete obstruction',
              'Do NOT lay the child flat',
              'Do NOT separate the child from the parent or cause distress',
              'Examination is done in theatre with anaesthesia and intubation or tracheostomy facilities ready',
            ],
          },
          {
            label: 'Localising examination once the airway is safe',
            description: 'The ENT examination proper.',
            checklist: [
              'Voice and cry; cough character',
              'Neck: swelling, goitre, surgical emphysema, scar, lymph nodes, laryngeal crepitus',
              'Position of trachea; laryngeal framework',
              'Oral cavity and oropharynx',
              'INDIRECT LARYNGOSCOPY in a cooperative adult; flexible fibreoptic nasolaryngoscopy otherwise',
              'Vocal cord mobility and position; any mass, oedema or membrane',
              'Chest: symmetry, movement, indrawing, tracheal position, apical impulse',
              'Percussion and auscultation of all zones; added sounds; vocal resonance compared',
              'CVS and CNS briefly',
            ],
          },
        ],
      },
      {
        title: '3. Causes, Investigations and Management',
        items: [
          {
            label: 'Causes by age',
            description: 'The differential is age-dependent and that is how it is presented.',
            checklist: [
              'NEONATE and INFANT: laryngomalacia (much the commonest), vocal cord palsy, subglottic stenosis, laryngeal web, subglottic haemangioma, vascular ring, choanal atresia',
              'CHILD: croup, acute epiglottitis, FOREIGN BODY, retropharyngeal abscess, recurrent respiratory papillomatosis, diphtheria (membranous croup), angio-oedema',
              'ADULT: laryngeal carcinoma, bilateral abductor palsy (post-thyroidectomy), laryngeal trauma, angio-oedema, post-intubation stenosis, tuberculous laryngitis, foreign body',
            ],
          },
          {
            label: 'Investigations and management',
            description: 'Investigation never precedes securing the airway.',
            checklist: [
              'SECURE THE AIRWAY FIRST — humidified oxygen, nebulised adrenaline, systemic steroids, heliox where available',
              'Intubation, or tracheostomy where intubation is impossible',
              'X-ray soft tissue neck: thumb sign (epiglottitis), steeple sign (croup), radio-opaque foreign body, retropharyngeal widening',
              'Chest X-ray: obstructive emphysema and mediastinal shift in a bronchial foreign body',
              'Flexible laryngoscopy; direct laryngoscopy and bronchoscopy under anaesthesia — both diagnostic and therapeutic',
              'CT neck and chest where a mass or stenosis is suspected',
              'Treat the cause: antibiotics, steroids, foreign body removal, tumour management',
            ],
          },
        ],
      },
    ],
    vivaQuestions: [
      {
        question: 'Differentiate croup from acute epiglottitis.',
        answer:
          'Croup (acute laryngotracheobronchitis) is viral, usually parainfluenza, affects children of 6 months to 3 years, has a gradual onset over days preceded by coryza, produces a BARKING or seal-like cough with a hoarse voice and inspiratory stridor, the child is not toxic and can usually lie flat, and the neck X-ray shows the STEEPLE sign of subglottic narrowing. Acute epiglottitis is bacterial, classically Haemophilus influenzae type b, affects children of 2 to 6 years, has a rapid onset over hours, produces a MUFFLED voice with little or no cough, DROOLING, dysphagia and the tripod position, the child is toxic and sits leaning forward, and the lateral neck X-ray shows the THUMB sign. Epiglottitis is an airway emergency and the throat must not be examined outside theatre.',
        examinerTip:
          'Barking cough and hoarse voice versus drooling and muffled voice. That pair separates them at the bedside without any investigation.',
      },
      {
        question: 'What is the commonest cause of congenital stridor and how does it behave?',
        answer:
          'Laryngomalacia, accounting for around 60–75% of congenital stridor. The supraglottic structures — an omega-shaped epiglottis, short aryepiglottic folds and bulky arytenoids — collapse inwards on inspiration. The stridor is INSPIRATORY, appears in the first few weeks of life, is worse when the infant is supine, crying, feeding or has an upper respiratory infection, and improves in the prone position and with neck extension. The cry is NORMAL, which is the key point, since a weak or hoarse cry points to a glottic lesion instead. It is self-limiting and resolves by 18 to 24 months in the great majority; diagnosis is by flexible laryngoscopy in the awake infant, and supraglottoplasty is reserved for failure to thrive, apnoea or cor pulmonale.',
        examinerTip:
          'The normal cry is what the examiner is listening for you to say.',
      },
      {
        question: 'Why must you never perform a tracheostomy below the fourth tracheal ring?',
        answer:
          'Because of what lies there. A low tracheostomy risks injury to the great vessels — particularly the brachiocephalic (innominate) artery crossing the trachea — which can cause a tracheo-innominate fistula and fatal haemorrhage, and risks entering the pleura at the apex causing pneumothorax, and the mediastinum causing mediastinitis and surgical emphysema. A high tracheostomy through the first ring risks perichondritis of the cricoid and subglottic stenosis. The correct site is the second to third tracheal ring — the midtracheal tracheostomy.',
        examinerTip:
          'Second and third ring. Above it the cricoid, below it the innominate artery — name both hazards.',
      },
    ],
  },
];
