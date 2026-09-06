export interface VascularNodeReference {
  id: string;
  name: string;
  type: 'artery' | 'vein';
  parentVessel?: string;
  territory: string;
  clinicalNote: string;
  cameraPreset?: 'anterior' | 'head' | 'thorax' | 'abdomen';
}

export interface NerveNodeReference {
  id: string;
  name: string;
  roots: string;
  origin: string;
  motorSupply: string;
  sensorySupply: string;
  clinicalNote: string;
  cameraPreset?: 'anterior' | 'head' | 'thorax' | 'abdomen';
}

export interface OsseousLandmark {
  landmark: string;
  bone: string;
  details: string;
}

export interface MuscleAttachmentGraph {
  origins: OsseousLandmark[];
  insertions: OsseousLandmark[];
  action: string;
  synergists?: string;
  antagonists?: string;
  nerveSupply: string;
}

export interface OrthogonalRelations {
  anterior: string[];
  posterior: string[];
  superior: string[];
  inferior: string[];
  medial: string[];
  lateral: string[];
}

export interface DetailedOrganAnatomy {
  id: string;
  name: string;
  latinName: string;
  system: string;
  quadrantOrCavity: string;
  surfaceLandmarks: string;
  dimensionsAndWeight: string;
  arterialSupply: string[];
  arterialNodes?: VascularNodeReference[];
  venousDrainage: string[];
  venousNodes?: VascularNodeReference[];
  innervation: {
    sympathetic: string;
    parasympathetic: string;
    somaticOrSensory: string;
    referredPain: string;
  };
  nerveNodes?: NerveNodeReference[];
  lymphaticDrainage: string[];
  musculoskeletalRelations: string[];
  relationsStructured?: OrthogonalRelations;
  originsAndInsertions?: {
    origin: string[];
    insertion: string[];
    action: string[];
    nerveSupply: string;
  };
  muscleGraph?: MuscleAttachmentGraph;
  histologyAndPhysiology: string;
  clinicalBedsideSigns: string[];
  nmcMbbssVivaPearls: string[];
  radiologicalCorrelation: string;
  surgicalApproaches: string;
  parentStructureId?: string;
  breadcrumbs?: { id: string; label: string }[];
  supabaseTextbookReference?: {
    subtopic: string;
    keyPearls: string[];
    diagramUrl?: string;
  };
}

export const ORGAN_ANATOMY_DATABASE: Record<string, DetailedOrganAnatomy> = {
  heart: {
    id: 'heart',
    name: 'Heart & Great Vessels',
    latinName: 'Cor Humanum',
    system: 'Cardiovascular System',
    quadrantOrCavity: 'Middle Mediastinum (Thoracic Cavity)',
    surfaceLandmarks:
      'Apex beat at left 5th intercostal space, 0.5 inches medial to midclavicular line (9cm from midline). Base extends from T5-T8 vertebrae in recumbent posture.',
    dimensionsAndWeight: 'Weight ~300g (males) / 250g (females); Length ~12cm, Width ~9cm, Anteroposterior ~6cm.',
    arterialSupply: [
      'Right Coronary Artery (RCA): Arises from anterior aortic sinus. Supplies RA, RV, posterior 1/3 of interventricular septum, SA node (60%), and AV node (90%). Branches into Marginal and Posterior Interventricular (PDA) arteries.',
      'Left Coronary Artery (LCA): Arises from left posterior aortic sinus. Bifurcates into Left Anterior Descending (LAD - "widow maker") and Left Circumflex (LCx). Supplies LA, anterior 2/3 of septum, and LV anterolateral myocardium.',
    ],
    arterialNodes: [
      {
        id: 'lad_artery',
        name: 'Left Anterior Descending (LAD) Artery',
        type: 'artery',
        parentVessel: 'Left Main Coronary Artery (LCA)',
        territory: 'Anterior 2/3 of interventricular septum, apex, and anterior LV wall',
        clinicalNote: 'Occlusion causes Acute Anterior Wall STEMI (Leads V1-V4 elevation). Nicknamed the "Widow Maker".',
        cameraPreset: 'thorax',
      },
      {
        id: 'rca_artery',
        name: 'Right Coronary Artery (RCA)',
        type: 'artery',
        parentVessel: 'Ascending Aorta (Anterior Aortic Sinus)',
        territory: 'Right atrium, right ventricle, posterior 1/3 of septum, SA node (60%), AV node (90%)',
        clinicalNote: 'Occlusion causes Acute Inferior Wall STEMI (Leads II, III, aVF) and RV Infarction hypotension.',
        cameraPreset: 'thorax',
      },
      {
        id: 'lcx_artery',
        name: 'Left Circumflex (LCx) Artery',
        type: 'artery',
        parentVessel: 'Left Main Coronary Artery (LCA)',
        territory: 'Lateral and posterior walls of left ventricle, left atrium',
        clinicalNote: 'Occlusion causes Lateral Wall STEMI (Leads I, aVL, V5, V6).',
        cameraPreset: 'thorax',
      },
    ],
    venousDrainage: [
      'Coronary Sinus (opens into right atrium between IVC orifice and right AV orifice, guarded by Thebesian valve).',
      'Great Cardiac Vein (accompanies LAD in anterior interventricular groove).',
      'Middle Cardiac Vein (accompanies PDA in posterior interventricular groove).',
      'Small Cardiac Vein (accompanies marginal branch of RCA).',
    ],
    venousNodes: [
      {
        id: 'coronary_sinus',
        name: 'Coronary Sinus',
        type: 'vein',
        parentVessel: 'Right Atrium (Thebesian Valve)',
        territory: 'Receives ~75% of total cardiac venous drainage',
        clinicalNote: 'Key landmark in electrophysiology for biventricular pacemaker lead placement in cardiac resynchronization therapy.',
        cameraPreset: 'thorax',
      },
    ],
    innervation: {
      sympathetic: 'T1-T5 spinal segments via superficial and deep cardiac plexuses (increases heart rate, inotropy, dromotropy via Beta-1 adrenergic receptors).',
      parasympathetic: 'Right & Left Vagus Nerves (CN X) via cardiac branches (decreases SA nodal discharge and delays AV nodal conduction via M2 muscarinic receptors).',
      somaticOrSensory: 'Afferent cardiac visceral pain fibers travel retrogradely with T1-T4/T5 sympathetic nerves.',
      referredPain: 'Substernal chest pressure radiating along dermatomes T1-T4 to inner aspect of left arm, forearm, ulnar border, jaw, and epigastrium.',
    },
    nerveNodes: [
      {
        id: 'vagus_nerve',
        name: 'Vagus Nerve (Cranial Nerve X)',
        roots: 'Medulla oblongata (Nucleus ambiguus & Dorsal motor nucleus)',
        origin: 'Brainstem exiting via Jugular Foramen',
        motorSupply: 'Parasympathetic preganglionic fibers to SA & AV nodes (M2 receptors)',
        sensorySupply: 'Baroreceptor afferents from aortic arch (aortic nerve)',
        clinicalNote: 'Carotid sinus massage or Valsalva augments vagal tone, terminating AV nodal reentrant tachycardia (AVNRT).',
        cameraPreset: 'head',
      },
    ],
    lymphaticDrainage: [
      'Subepicardial lymphatic network drains into right anterior mediastinal and tracheobronchial (subcarinal) lymph nodes.',
    ],
    musculoskeletalRelations: [
      'Anterior: Body of sternum, costal cartilages of ribs 2-6, transversus thoracis muscle.',
      'Posterior: Esophagus, descending thoracic aorta, thoracic duct, azygos vein, T5-T8 vertebrae.',
      'Inferior: Central tendon of diaphragm (resting on diaphragm via fibrous pericardium).',
      'Lateral: Mediastinal pleura, phrenic nerve, and pericardiophrenic vessels on each side.',
    ],
    relationsStructured: {
      anterior: ['Body of Sternum', 'Costal Cartilages (Ribs 2-6)', 'Transversus Thoracis Muscle', 'Parietal Pleura'],
      posterior: ['Esophagus', 'Descending Thoracic Aorta', 'Thoracic Duct', 'Azygos Vein', 'T5-T8 Vertebrae'],
      superior: ['Aortic Arch', 'Bifurcation of Pulmonary Trunk', 'Superior Vena Cava (SVC)'],
      inferior: ['Central Tendon of Diaphragm', 'Inferior Vena Cava (IVC)'],
      medial: ['Interatrial Septum', 'Interventricular Septum'],
      lateral: ['Mediastinal Pleura', 'Phrenic Nerve (C3-C5)', 'Pericardiophrenic Vessels'],
    },
    histologyAndPhysiology:
      'Striated branched cardiomyocytes with intercalated discs and gap junctions forming functional syncytium. Excitation-contraction coupling governed by L-type calcium channels and RyR2 ryanodine receptors on sarcoplasmic reticulum.',
    clinicalBedsideSigns: [
      'First Heart Sound (S1): Closure of Mitral and Tricuspid valves at onset of systole. Loud in mitral stenosis; soft in mitral regurgitation.',
      'Second Heart Sound (S2): Aortic (A2) and Pulmonary (P2) valve closure. Physiological splitting widens on inspiration.',
      'Third Heart Sound (S3): Ventricular gallop in rapid passive filling phase (volume overload / dilated cardiomyopathy).',
      'Fourth Heart Sound (S4): Atrial gallop due to atrial kick against non-compliant ventricle (LVH / aortic stenosis).',
      'Pericardial Friction Rub: High-pitched superficial leathery scratch sound heard along left sternal border in acute pericarditis.',
    ],
    nmcMbbssVivaPearls: [
      'Q: Which is the dominant coronary circulation in 85-90% of humans? A: Right dominant (Posterior Interventricular Artery originates from RCA).',
      'Q: What forms the cardiac apex? A: Solely the left ventricle.',
      'Q: Where is the transverse pericardial sinus of Theile located? A: Lies posterior to aorta and pulmonary trunk, and anterior to superior vena cava and left atrium; crucial landmark in cardiac surgery for clamping aorta during bypass.',
      'Q: Koch Triangle landmarks? A: Tendon of Todaro, septal leaflet of tricuspid valve, and coronary sinus orifice; houses the AV Node.',
    ],
    radiologicalCorrelation:
      'Chest X-Ray PA view: Cardiothoracic ratio (CTR) should be <= 50%. Prominent left cardiac border with 4 bulges: Aortic knuckle, Pulmonary conus, Left atrial appendage, and Left ventricular apex.',
    surgicalApproaches:
      'Median sternotomy for open heart surgery / CABG; Left anterolateral thoracotomy in 5th ICS for emergency resuscitative thoracotomy; Pericardiocentesis through Larrey point (left infrasternal angle directed at 45 deg toward left shoulder).',
    breadcrumbs: [{ id: 'thorax', label: 'Thoracic Cavity' }, { id: 'heart', label: 'Heart & Great Vessels' }],
  },

  // 2. LEFT ANTERIOR DESCENDING ARTERY
  lad_artery: {
    id: 'lad_artery',
    name: 'Left Anterior Descending (LAD) Artery',
    latinName: 'Ramus Interventricularis Anterior Arteriae Coronariae Sinistrae',
    system: 'Cardiovascular System',
    quadrantOrCavity: 'Anterior Interventricular Sulcus of Heart',
    surfaceLandmarks: 'Runs from coronary sulcus down the anterior groove to notch just to the right of cardiac apex.',
    dimensionsAndWeight: 'Caliber: 3.5 - 4.5 mm at origin, length 10 - 13 cm.',
    arterialSupply: ['Arises as terminal bifurcation branch of the Left Main Coronary Artery (LMCA).'],
    arterialNodes: [
      {
        id: 'heart',
        name: 'Parent: Left Main Coronary Artery & Cor Humanum',
        type: 'artery',
        territory: 'Supplies 45-55% of left ventricular myocardium',
        clinicalNote: 'Critical bifurcation with LCx.',
        cameraPreset: 'thorax',
      },
    ],
    venousDrainage: ['Accompanied by the Great Cardiac Vein which ascends in anterior interventricular sulcus.'],
    innervation: {
      sympathetic: 'Superficial cardiac plexus (Alpha-1 vasoconstriction, Beta-2 vasodilation).',
      parasympathetic: 'Vagus nerve cholinergic branches.',
      somaticOrSensory: 'T1-T4 cardiac visceral pain afferents.',
      referredPain: 'Substernal chest heaviness radiating to left shoulder, inner arm, ulnar border.',
    },
    lymphaticDrainage: ['Anterior mediastinal lymph nodes.'],
    musculoskeletalRelations: ['Runs over anterior interventricular myocardium, covered by epicardial adipose tissue.'],
    relationsStructured: {
      anterior: ['Epicardium', 'Visceral Pericardium', 'Anterior Chest Wall'],
      posterior: ['Interventricular Septum (anterior 2/3)', 'Anterior Myocardium of Left Ventricle'],
      superior: ['Bifurcation of Left Main Coronary Artery', 'Pulmonary Trunk'],
      inferior: ['Cardiac Apex', 'Incisura Apicis Cordis'],
      medial: ['Right Ventricular Conus Arteriosus'],
      lateral: ['Left Ventricle Anterolateral Wall', 'Diagonal Branches (D1, D2)'],
    },
    histologyAndPhysiology: 'Muscular medium-sized artery with internal elastic lamina; highly susceptible to atherosclerosis and shear stress.',
    clinicalBedsideSigns: [
      'Acute Anterior Wall STEMI: Hyperacute T waves, ST elevation in Leads V1, V2, V3, V4.',
      'Reciprocal ST depression in inferior leads (II, III, aVF).',
      'Cardiogenic shock and ventricular septal rupture if proximal LAD occludes.',
    ],
    nmcMbbssVivaPearls: [
      'Q: Why is LAD called the "Widow Maker"? A: Supplies anterior LV wall and bundle branches; occlusion causes sudden massive pump failure or VFib.',
      'Q: Which vessel is the gold standard conduit for CABG to LAD? A: Left Internal Mammary Artery (LIMA).',
    ],
    radiologicalCorrelation: 'Coronary Angiography: Left anterior oblique (LAO) cranial view best profiles the proximal and mid LAD.',
    surgicalApproaches: 'Coronary Artery Bypass Grafting (CABG) via median sternotomy or minimally invasive direct coronary artery bypass (MIDCAB) through 4th left ICS.',
    parentStructureId: 'heart',
    breadcrumbs: [
      { id: 'thorax', label: 'Thoracic Cavity' },
      { id: 'heart', label: 'Heart & Great Vessels' },
      { id: 'lad_artery', label: 'LAD Artery' },
    ],
  },

  // 3. PECTORALIS MAJOR MUSCLE
  pectoralis_major: {
    id: 'pectoralis_major',
    name: 'Pectoralis Major Muscle',
    latinName: 'Musculus Pectoralis Major',
    system: 'Muscular System',
    quadrantOrCavity: 'Anterior Thoracic Wall',
    surfaceLandmarks: 'Forms anterior wall of axilla and prominent anterior chest muscular contour.',
    dimensionsAndWeight: 'Broad, thick, fan-shaped muscle; thickness ~1.5 - 2.5 cm.',
    arterialSupply: [
      'Pectoral branch of Thoracoacromial Trunk (from 2nd part of axillary artery).',
      'Lateral Thoracic Artery.',
      'Perforating branches of Internal Thoracic Artery.',
    ],
    arterialNodes: [
      {
        id: 'thoracoacromial',
        name: 'Thoracoacromial Trunk (Pectoral Branch)',
        type: 'artery',
        parentVessel: 'Axillary Artery (2nd Part)',
        territory: 'Pectoralis major and minor muscles and anterior chest wall',
        clinicalNote: 'Crucial vascular pedicle for deltopectoral and pectoralis major myocutaneous flaps in reconstructive surgery.',
        cameraPreset: 'thorax',
      },
    ],
    venousDrainage: [
      'Cephalic Vein (travels along lateral border in deltopectoral groove, piercing clavipectoral fascia).',
      'Axillary Vein.',
    ],
    innervation: {
      sympathetic: 'Vasomotor fibers to muscular arterioles.',
      parasympathetic: 'None.',
      somaticOrSensory: 'Medial and Lateral Pectoral Nerves from brachial plexus.',
      referredPain: 'Anterior chest wall and medial arm pain.',
    },
    nerveNodes: [
      {
        id: 'pectoral_nerves',
        name: 'Lateral & Medial Pectoral Nerves',
        roots: 'C5, C6, C7 (Lateral) & C8, T1 (Medial)',
        origin: 'Lateral and Medial Cords of Brachial Plexus',
        motorSupply: 'Clavicular head (C5, C6) and Sternocostal head (C7, C8, T1)',
        sensorySupply: 'Proprioception from muscle spindles',
        clinicalNote: 'Preserved in modified radical mastectomy; injured in radical mastectomy causing pectoralis atrophy.',
        cameraPreset: 'thorax',
      },
    ],
    lymphaticDrainage: [
      'Axillary lymph nodes (predominantly anterior / pectoral group) and parasternal internal mammary nodes.',
    ],
    musculoskeletalRelations: [
      'Anterior: Deep fascia, subcutaneous fat, platysma, mammary gland, skin.',
      'Posterior: Pectoralis minor, clavipectoral fascia, axillary vessels, brachial plexus cords, ribs 2-6, intercostal muscles.',
      'Superior: Clavicle, subclavius, deltopectoral triangle bounding cephalic vein.',
      'Lateral: Deltoid muscle, bicipital groove of humerus.',
    ],
    relationsStructured: {
      anterior: ['Mammary Gland (Breast)', 'Subcutaneous Fat', 'Platysma', 'Skin'],
      posterior: ['Pectoralis Minor', 'Clavipectoral Fascia', 'Axillary Artery & Vein', 'Ribs 2-6', 'Intercostal Muscles'],
      superior: ['Clavicle (Medial Half)', 'Subclavius Muscle', 'Deltopectoral Groove (Cephalic Vein)'],
      inferior: ['Anterior Rectus Sheath', 'External Abdominal Oblique Aponeurosis', 'Serratus Anterior'],
      medial: ['Sternum (Manubrium & Body)', 'Costal Cartilages 1-6'],
      lateral: ['Deltoid Muscle', 'Lateral Lip of Bicipital Groove of Humerus'],
    },
    originsAndInsertions: {
      origin: [
        'Clavicular head: Medial half of anterior border of clavicle.',
        'Sternocostal head: Anterior surface of sternum, upper 6 costal cartilages, and external oblique aponeurosis.',
      ],
      insertion: [
        'Lateral lip of bicipital groove (intertubercular sulcus) of humerus via U-shaped bilaminar flat tendon.',
      ],
      action: [
        'Adduction and medial rotation of arm at shoulder joint.',
        'Clavicular head flexes arm; sternocostal head extends flexed arm.',
        'Accessory muscle of inspiration during respiratory distress (arms fixed).',
      ],
      nerveSupply: 'Lateral Pectoral Nerve (C5-C7) and Medial Pectoral Nerve (C8-T1).',
    },
    muscleGraph: {
      origins: [
        { landmark: 'Medial Clavicle', bone: 'Clavicle', details: 'Anterior aspect of medial half' },
        { landmark: 'Sternum & Costal Cartilages', bone: 'Sternum', details: 'Anterior surface of manubrium, body, ribs 1-6' },
      ],
      insertions: [
        { landmark: 'Lateral Lip of Bicipital Groove', bone: 'Humerus', details: 'Crest of greater tubercle of humerus' },
      ],
      action: 'Adduction, medial rotation, flexion, and accessory inspiration',
      nerveSupply: 'Lateral (C5-C7) and Medial (C8-T1) Pectoral Nerves',
    },
    histologyAndPhysiology: 'Parallel fascicles of Type II fast-twitch and Type I slow-twitch striated muscle fibers; powerful adductor.',
    clinicalBedsideSigns: [
      'Climbing Muscle: Tested by asking patient to press hands against hips while palpating anterior axillary fold.',
      'Poland Syndrome: Congenital absence of sternocostal head of pectoralis major associated with syndactyly.',
    ],
    nmcMbbssVivaPearls: [
      'Q: What forms the anterior axillary fold? A: Lower rounded border of Pectoralis Major.',
      'Q: What pierces the clavipectoral fascia? A: Lateral pectoral nerve, Thoracoacromial artery, Cephalic vein, Lymphatics (acronym: L-T-C-L).',
    ],
    radiologicalCorrelation: 'Chest CT: Symmetrical soft tissue density on anterior thorax; asymmetry indicates Poland syndrome or post-mastectomy.',
    surgicalApproaches: 'Deltopectoral approach for shoulder arthroplasty; Pectoralis major myocutaneous flap for head and neck reconstruction.',
    breadcrumbs: [{ id: 'thorax', label: 'Thoracic Wall' }, { id: 'pectoralis_major', label: 'Pectoralis Major' }],
  },

  // 4. DELTOID MUSCLE
  deltoid: {
    id: 'deltoid',
    name: 'Deltoid Muscle',
    latinName: 'Musculus Deltoideus',
    system: 'Muscular System',
    quadrantOrCavity: 'Shoulder (Scapular Region)',
    surfaceLandmarks: 'Forms the rounded contour of the shoulder and lateral prominence of arm.',
    dimensionsAndWeight: 'Multipennate central part, unipennate anterior and posterior parts; high force generator.',
    arterialSupply: [
      'Posterior Circumflex Humeral Artery (from 3rd part of axillary artery, accompanies axillary nerve).',
      'Deltoid branch of Thoracoacromial Trunk.',
    ],
    arterialNodes: [
      {
        id: 'post_circumflex_humeral',
        name: 'Posterior Circumflex Humeral Artery',
        type: 'artery',
        parentVessel: 'Axillary Artery (3rd Part)',
        territory: 'Deltoid muscle, shoulder joint, head of humerus',
        clinicalNote: 'Passes through quadrangular space with axillary nerve; vulnerable in fractures of surgical neck of humerus.',
        cameraPreset: 'thorax',
      },
    ],
    venousDrainage: ['Cephalic Vein', 'Posterior Circumflex Humeral Vein draining into Axillary Vein.'],
    innervation: {
      sympathetic: 'Vasomotor adrenergic fibers.',
      parasympathetic: 'None.',
      somaticOrSensory: 'Axillary Nerve (C5, C6).',
      referredPain: 'Regimental badge area over upper lateral arm.',
    },
    nerveNodes: [
      {
        id: 'axillary_nerve',
        name: 'Axillary Nerve (Circumflex Nerve)',
        roots: 'C5, C6',
        origin: 'Posterior Cord of Brachial Plexus',
        motorSupply: 'Deltoid and Teres Minor muscles',
        sensorySupply: 'Upper Lateral Cutaneous Nerve of Arm ("Regimental Badge Area")',
        clinicalNote: 'Tested clinically by pinprick sensation over regimental badge area; paralysis causes flat shoulder silhouette.',
        cameraPreset: 'thorax',
      },
    ],
    lymphaticDrainage: ['Subscapular and central axillary lymph nodes.'],
    musculoskeletalRelations: [
      'Superficial: Skin, platysma, superficial fascia, lateral supraclavicular cutaneous nerves.',
      'Deep: Subdeltoid/subacromial bursa, rotator cuff tendons (supraspinatus, infraspinatus, teres minor, subscapularis), tendon of long head of biceps, quadrangular space, axillary nerve.',
    ],
    relationsStructured: {
      anterior: ['Cephalic Vein', 'Deltopectoral Triangle', 'Pectoralis Major'],
      posterior: ['Infraspinatus', 'Teres Major & Minor', 'Long Head of Triceps'],
      superior: ['Acromion Process', 'Clavicle (Lateral 1/3)', 'Spine of Scapula'],
      inferior: ['Brachialis', 'Lateral Head of Triceps'],
      medial: ['Subacromial Bursa', 'Supraspinatus Tendon', 'Head of Humerus'],
      lateral: ['Deltoid Tuberosity of Humerus', 'Subcutaneous Tissue & Skin'],
    },
    originsAndInsertions: {
      origin: [
        'Anterior fibers: Lateral third of anterior border of clavicle.',
        'Middle fibers: Lateral border of acromion process (multipennate).',
        'Posterior fibers: Lower lip of spine of scapula.',
      ],
      insertion: ['Deltoid tuberosity on lateral middle shaft of humerus.'],
      action: [
        'Multipennate acromial fibers abduct arm from 15 to 90 degrees (initiated 0-15 deg by Supraspinatus).',
        'Anterior fibers flex and medially rotate arm.',
        'Posterior fibers extend and laterally rotate arm.',
      ],
      nerveSupply: 'Axillary Nerve (C5, C6).',
    },
    muscleGraph: {
      origins: [
        { landmark: 'Lateral Clavicle', bone: 'Clavicle', details: 'Anterior lateral third' },
        { landmark: 'Acromion', bone: 'Scapula', details: 'Lateral border of acromion process' },
        { landmark: 'Spine of Scapula', bone: 'Scapula', details: 'Inferior lip of scapular spine' },
      ],
      insertions: [{ landmark: 'Deltoid Tuberosity', bone: 'Humerus', details: 'Middle lateral shaft of humerus' }],
      action: 'Primary abductor of arm (15° to 90°), flexion, extension',
      nerveSupply: 'Axillary Nerve (C5, C6)',
    },
    histologyAndPhysiology: 'Multipennate architecture allows short fiber length with massive physiological cross-sectional area and heavy lifting power.',
    clinicalBedsideSigns: [
      'Intramuscular Injection Safe Zone: 2-3 fingerbreadths below acromion process to avoid axillary nerve traversing deep surface 5cm below acromion.',
      'Loss of shoulder contour ("Square shoulder sign") in anterior shoulder dislocation and axillary nerve palsy.',
    ],
    nmcMbbssVivaPearls: [
      'Q: What muscle initiates shoulder abduction from 0 to 15 degrees? A: Supraspinatus; deltoid takes over from 15 to 90 degrees.',
      'Q: What muscles abduct beyond 90 degrees? A: Serratus anterior and Trapezius (overhead abduction via scapular upward rotation).',
    ],
    radiologicalCorrelation: 'MRI Shoulder: Coronal oblique view demonstrates deltoid muscle belly, subacromial bursa, and supraspinatus tendon integrity.',
    surgicalApproaches: 'Deltopectoral approach to shoulder joint; direct lateral deltoid-splitting approach (split <5cm to safeguard axillary nerve).',
    breadcrumbs: [{ id: 'upper_limb', label: 'Upper Limb' }, { id: 'deltoid', label: 'Deltoid Muscle' }],
  },

  // 5. LIVER & BILIARY TREE
  liver: {
    id: 'liver',
    name: 'Liver & Biliary Apparatus',
    latinName: 'Hepar',
    system: 'Digestive & Metabolic System',
    quadrantOrCavity: 'Right Hypochondrium, Epigastrium, extending into Left Hypochondrium',
    surfaceLandmarks:
      'Upper border at right 5th intercostal space (midclavicular line). Lower border follows right costal margin. Liver span normally 10-12 cm in midclavicular line.',
    dimensionsAndWeight: 'Weight ~1500g (largest visceral organ and gland in human body).',
    arterialSupply: [
      'Hepatic Artery Proper (branch of Celiac Trunk via Common Hepatic Artery): Delivers 25% of liver blood flow (oxygenated). Bifurcates into Right and Left Hepatic Arteries at porta hepatis.',
    ],
    arterialNodes: [
      {
        id: 'celiac_trunk',
        name: 'Celiac Trunk & Common Hepatic Artery',
        type: 'artery',
        parentVessel: 'Abdominal Aorta (at T12 level)',
        territory: 'Foregut structures: Liver, Gallbladder, Stomach, Spleen, Duodenum (upper half), Pancreas',
        clinicalNote: 'First major anterior branch of abdominal aorta. Essential landmark in hepatobiliary and pancreatic surgery.',
        cameraPreset: 'abdomen',
      },
    ],
    venousDrainage: [
      'Hepatic Portal Vein (formed by union of Superior Mesenteric Vein and Splenic Vein behind neck of pancreas): Delivers 75% of liver blood flow (nutrient-rich).',
      'Right, Middle, and Left Hepatic Veins: Drain directly into Inferior Vena Cava (IVC) at the superior bare area.',
    ],
    venousNodes: [
      {
        id: 'portal_vein',
        name: 'Hepatic Portal Vein',
        type: 'vein',
        parentVessel: 'Union of SMV + Splenic Vein behind Pancreatic Neck',
        territory: 'Drains all venous blood from stomach, intestines, colon, spleen, and pancreas into hepatic sinusoids',
        clinicalNote: 'Normal portal pressure 5-10 mmHg. In cirrhosis, portal HTN >12 mmHg drives bleeding esophageal varices and ascites.',
        cameraPreset: 'abdomen',
      },
    ],
    innervation: {
      sympathetic: 'Celiac plexus (T7-T10 splanchnic nerves).',
      parasympathetic: 'Anterior and Posterior Vagal Trunks (CN X).',
      somaticOrSensory: 'Right Phrenic Nerve (C3-C5) sensory fibers supply Glisson\'s capsule and peritoneal covering.',
      referredPain: 'Pain referred to right shoulder tip (dermatomes C3-C5) in hepatic distension, abscess, or cholecystitis.',
    },
    nerveNodes: [
      {
        id: 'phrenic_nerve',
        name: 'Right Phrenic Nerve (C3, C4, C5)',
        roots: 'C3, C4, C5',
        origin: 'Cervical Plexus traversing anterior scalene muscle',
        motorSupply: 'Right hemidiaphragm',
        sensorySupply: 'Diaphragmatic peritoneum, Glisson\'s capsule, fibrous pericardium',
        clinicalNote: 'Explains classic referred pain from gallbladder/liver capsule to the right shoulder tip.',
        cameraPreset: 'thorax',
      },
    ],
    lymphaticDrainage: [
      'Deep lymphatics follow portal tracts to hepatic nodes at porta hepatis, thence to celiac nodes. Superficial bare area lymphatics drain through diaphragm to posterior mediastinal nodes.',
    ],
    musculoskeletalRelations: [
      'Superior: Diaphragm, heart and pericardium, bilateral lungs and pleurae.',
      'Anterior: Anterior abdominal wall, xiphoid process, costal margin 7-10.',
      'Posterior: IVC, gallbladder bed, right kidney, right suprarenal gland, duodenum, stomach.',
      'Inferior: Hepatic flexure of colon, transverse colon, right kidney.',
    ],
    relationsStructured: {
      anterior: ['Anterior Abdominal Wall', 'Costal Margin (Ribs 7-10)', 'Xiphoid Process'],
      posterior: ['Inferior Vena Cava', 'Right Kidney & Adrenal', 'Stomach Bed', 'Vertebrae T10-T12'],
      superior: ['Diaphragm', 'Pericardium / Heart', 'Right Lung Base'],
      inferior: ['Hepatic Flexure of Colon', 'Duodenum (1st & 2nd parts)', 'Gallbladder'],
      medial: ['Lesser Omentum', 'Stomach (Lesser Curvature)'],
      lateral: ['Right Costal Margin', 'Diaphragm (Lateral Recess)'],
    },
    histologyAndPhysiology:
      'Hexagonal hepatic lobules with central vein and portal triads (hepatic artery, portal venule, bile ductule). Sinusoids lined by fenestrated endothelia and phagocytic Kupffer cells (macrophages). Space of Disse houses hepatic stellate cells (Ito cells) storing Vitamin A and producing fibrosis in cirrhosis.',
    clinicalBedsideSigns: [
      'Hepatomegaly: Liver palpable >2 cm below right costal margin with firm or irregular nodular edge.',
      'Stigmata of Chronic Liver Disease (PICCLED): Spider angiomas in SVC territory, palmar erythema, leuconychia (Muehrcke lines), Dupuytren contracture, asterixis (flapping tremor), caput medusae.',
      'Icterus / Jaundice: Scleral icterus detected when serum bilirubin > 2.5 mg/dL.',
    ],
    nmcMbbssVivaPearls: [
      'Q: What is Couinaud\'s hepatic segmentation based upon? A: 8 independent functional segments, each with its own dual vascular inflow, biliary drainage, and lymphatic pedicle; division line is Cantlie\'s line (IVC to gallbladder fossa).',
      'Q: What structures lie in the free edge of lesser omentum (hepatoduodenal ligament)? A: Portal vein (posterior), Hepatic artery proper (anterior-left), Common bile duct (anterior-right); acronym: D-A-V (Duct, Artery, Vein).',
      'Q: Where is the Epiploic Foramen of Winslow located? A: Passage between greater and lesser peritoneal sacs, bounded anteriorly by portal triad.',
    ],
    radiologicalCorrelation: 'Abdominal Ultrasound: Normal liver is homogeneous and slightly hyperechoic compared to renal cortex. Cirrhosis shows coarsened echotexture, surface nodularity, and portal vein dilatation (>13 mm).',
    surgicalApproaches: 'Right subcostal (Kocher\'s) incision or Mercedes-Benz incision for open hepatectomy and liver transplantation; Pringle maneuver (cross-clamping hepatoduodenal ligament for up to 60 mins to control hepatic hemorrhage).',
    breadcrumbs: [{ id: 'abdomen', label: 'Abdominal Cavity' }, { id: 'liver', label: 'Liver & Biliary Apparatus' }],
  },

  // 6. PULMONARY SYSTEM (LUNGS)
  lungs: {
    id: 'lungs',
    name: 'Pulmonary System (Bilateral Lungs & Bronchial Tree)',
    latinName: 'Pulmones',
    system: 'Respiratory System',
    quadrantOrCavity: 'Right & Left Pleural Cavities (Thorax)',
    surfaceLandmarks:
      'Apex extends 2.5 cm above medial third of clavicle into root of neck. Lower border at midclavicular line (rib 6), midaxillary line (rib 8), scapular line (rib 10); parietal pleura extends 2 ribs lower (8, 10, 12).',
    dimensionsAndWeight: 'Right lung ~625g (3 lobes: superior, middle, inferior; 2 fissures: oblique & horizontal); Left lung ~565g (2 lobes: superior & inferior; cardiac notch & lingula).',
    arterialSupply: [
      'Pulmonary Arteries (deoxygenated venous blood from RV for gas exchange; low pressure ~25/10 mmHg).',
      'Bronchial Arteries (oxygenated systemic blood supplying conducting airway parenchyma; left branches from descending aorta, right from 3rd posterior intercostal).',
    ],
    arterialNodes: [
      {
        id: 'pulmonary_trunk',
        name: 'Pulmonary Trunk & Bilateral Pulmonary Arteries',
        type: 'artery',
        parentVessel: 'Right Ventricle Conus Arteriosus',
        territory: 'Bilateral pulmonary lobar and segmental capillary alveolar networks',
        clinicalNote: 'Saddle embolus lodged at bifurcation causes acute right heart strain, catastrophic obstructive shock, and sudden death.',
        cameraPreset: 'thorax',
      },
    ],
    venousDrainage: [
      'Four Pulmonary Veins (two right, two left): Drain oxygenated blood directly into left atrium.',
      'Bronchial Veins: Drain into azygos vein on right and accessory hemiazygos vein on left.',
    ],
    venousNodes: [
      {
        id: 'pulmonary_veins',
        name: 'Bilateral Pulmonary Veins (Four)',
        type: 'vein',
        parentVessel: 'Left Atrium (Posterosuperior wall)',
        territory: 'Transports 100% of oxygenated alveolar blood back to left heart',
        clinicalNote: 'Ectopic electrical triggers inside pulmonary vein myocardial sleeves are the primary culprit initiating Atrial Fibrillation (target for radiofrequency catheter ablation).',
        cameraPreset: 'thorax',
      },
    ],
    innervation: {
      sympathetic: 'T2-T5 sympathetic ganglia (bronchodilation and vasoconstriction via Beta-2 receptors).',
      parasympathetic: 'Vagus nerve CN X (bronchoconstriction, vasodilation, and secretomotor to bronchial mucous glands via M3 receptors).',
      somaticOrSensory: 'Visceral pleura is insensitive to pain; parietal pleura is exquisitely sensitive via intercostal nerves and phrenic nerve.',
      referredPain: 'Diaphragmatic pleural irritation referred to right or left shoulder tip via phrenic nerve (C3-C5).',
    },
    nerveNodes: [
      {
        id: 'phrenic_nerve',
        name: 'Phrenic Nerve (C3, C4, C5)',
        roots: 'C3, C4, C5',
        origin: 'Cervical plexus',
        motorSupply: 'Diaphragm (sole motor innervation)',
        sensorySupply: 'Mediastinal and central diaphragmatic parietal pleura',
        clinicalNote: 'Irritation causes diaphragmatic referred pain to C3-C5 dermatomes over the shoulder tip (Kehr\'s sign).',
        cameraPreset: 'thorax',
      },
    ],
    lymphaticDrainage: [
      'Superficial subpleural and deep bronchopulmonary lymphatics drain into tracheobronchial (subcarinal) nodes, thence to paratracheal nodes and thoracic duct / right lymphatic duct.',
    ],
    musculoskeletalRelations: [
      'Anterior: Ribs 1-6, costal cartilages, sternum, internal thoracic vessels.',
      'Posterior: Thoracic spine T1-T12, sympathetic trunk, posterior intercostal neurovascular bundles.',
      'Inferior: Diaphragm, separating right lung from liver, and left lung from spleen, stomach, left kidney.',
      'Medial: Mediastinum (heart, great vessels, trachea, esophagus, vagus & phrenic nerves).',
    ],
    relationsStructured: {
      anterior: ['Ribs 1-6 & Intercostal Muscles', 'Sternum', 'Internal Thoracic Artery'],
      posterior: ['Thoracic Vertebrae T1-T12', 'Azygos Vein', 'Sympathetic Trunk'],
      superior: ['Suprapleural Membrane (Sibson\'s Fascia)', 'Subclavian Artery & Vein'],
      inferior: ['Diaphragm', 'Liver (Right)', 'Stomach & Spleen (Left)'],
      medial: ['Heart & Pericardium', 'Trachea & Carina', 'Esophagus', 'Thoracic Aorta'],
      lateral: ['Thoracic Cage', 'Ribs 1-10', 'Intercostal Neurovascular Bundles'],
    },
    histologyAndPhysiology:
      'Type I pneumocytes (95% of alveolar surface, thin squamous for gas exchange); Type II pneumocytes (surfactant synthesis via dipalmitoylphosphatidylcholine to prevent alveolar collapse). Blood-air barrier thickness ~0.2 - 0.5 um.',
    clinicalBedsideSigns: [
      'Consolidation: Dull percussion note, increased tactile vocal fremitus (TVF), bronchial breathing, whispering pectoriloquy.',
      'Pleural Effusion: Stony dull percussion note, absent breath sounds, reduced TVF, aegophony at upper border.',
      'Tension Pneumothorax: Hyperresonant percussion note, absent breath sounds on affected side, tracheal deviation to opposite side, obstructive shock.',
    ],
    nmcMbbssVivaPearls: [
      'Q: Why do inhaled foreign bodies preferentially lodge in the right main bronchus? A: Right bronchus is wider, shorter (2.5 cm vs 5 cm), and more vertical (25 deg vs 45 deg from tracheal axis).',
      'Q: What is the costodiaphragmatic recess? A: Potential space 2 ribs deep at the inferior pleural reflection (between ribs 8 and 10 in midaxillary line); primary site for thoracentesis needle insertion (8th ICS along superior border of 9th rib).',
    ],
    radiologicalCorrelation: 'Chest X-Ray: Trachea central, costophrenic angles sharp. Blunting of costophrenic angle requires >175 mL pleural fluid on PA view.',
    surgicalApproaches: 'Posterolateral thoracotomy through 5th intercostal space for lung resection; Video-assisted thoracoscopic surgery (VATS); Tube thoracostomy (chest drain) in safe triangle (5th ICS anterior to midaxillary line).',
    breadcrumbs: [{ id: 'thorax', label: 'Thoracic Cavity' }, { id: 'lungs', label: 'Pulmonary System' }],
  },


  // 7. RIGHT CORONARY ARTERY
  rca_artery: {
    id: 'rca_artery',
    name: 'Right Coronary Artery (RCA)',
    latinName: 'Arteria Coronaria Dextra',
    system: 'Cardiovascular System',
    quadrantOrCavity: 'Coronary Sulcus (Thorax)',
    surfaceLandmarks: 'Arises from anterior aortic sinus of ascending aorta; runs in right AV groove towards crux cordis.',
    dimensionsAndWeight: 'Caliber ~3.5 - 4.0 mm, length ~12 - 14 cm.',
    arterialSupply: ['Originates directly from the anterior aortic sinus (sinus of Valsalva) of the ascending aorta.'],
    arterialNodes: [
      {
        id: 'heart',
        name: 'Cor Humanum (Heart Base)',
        type: 'artery',
        territory: 'Right atrium, right ventricle, posteroinferior 1/3 of septum',
        clinicalNote: 'Supplies SA node in 60% and AV node in 90% of individuals.',
        cameraPreset: 'thorax'
      }
    ],
    venousDrainage: ['Accompanied by small cardiac vein in anterior atrioventricular groove and middle cardiac vein at apex.'],
    innervation: {
      sympathetic: 'Superficial and deep cardiac plexuses (T1-T5).',
      parasympathetic: 'Vagus nerve (CN X).',
      somaticOrSensory: 'T1-T5 visceral afferents.',
      referredPain: 'Epigastric discomfort, nausea, bradycardia, radiating to jaw or left arm in inferior STEMI.'
    },
    lymphaticDrainage: ['Anterior mediastinal lymph nodes.'],
    musculoskeletalRelations: ['Lies in the fatty atrioventricular groove between right atrium and right ventricle.'],
    relationsStructured: {
      anterior: ['Right Atrial Appendage', 'Anterior Chest Wall', 'Costal Cartilages'],
      posterior: ['Right Atrium', 'Interatrial Septum', 'Crux Cordis'],
      superior: ['Aortic Root', 'Superior Vena Cava'],
      inferior: ['Acute Margin of Heart', 'Diaphragmatic Surface of Heart'],
      medial: ['Ascending Aorta', 'Pulmonary Trunk'],
      lateral: ['Right Ventricle Free Wall', 'Right Phrenic Nerve']
    },
    histologyAndPhysiology: 'Muscular medium artery with elastic lamina; vascular tone regulated by endothelial NO, adenosine, and autonomic inputs.',
    clinicalBedsideSigns: [
      'Acute Inferior STEMI: ST elevation in Leads II, III, and aVF with reciprocal depression in I and aVL.',
      'Sinus Bradycardia / Complete Heart Block (supplies SA node in 60%, AV node in 90%).',
      'Right Ventricular Infarction: Hypotension, clear lung fields, elevated JVP (Kussmaul sign) — nitrates contraindicated!'
    ],
    nmcMbbssVivaPearls: [
      'Q: What is the clinical danger of giving nitroglycerin in inferior STEMI with RCA occlusion? A: Nitrates drop preload; RV infarction relies critically on high RV preload, so nitrates precipitate profound cardiogenic shock.',
      'Q: Which branch supplies the AV node? A: Arises at the crux cordis from the apex of the U-turn of RCA in right-dominant hearts.'
    ],
    radiologicalCorrelation: 'Coronary Angiography (LAO view): Visualizes RCA course, marginal branches, and posterior descending artery (PDA).',
    surgicalApproaches: 'Percutaneous Coronary Intervention (PCI) via right radial or femoral artery; CABG with saphenous vein graft.',
    breadcrumbs: [{ id: 'thorax', label: 'Thorax' }, { id: 'heart', label: 'Heart' }, { id: 'rca_artery', label: 'Right Coronary Artery' }]
  },

  // 8. VAGUS NERVE
  vagus_nerve: {
    id: 'vagus_nerve',
    name: 'Vagus Nerve (Cranial Nerve X)',
    latinName: 'Nervus Vagus',
    system: 'Nervous System (Autonomic / Parasympathetic)',
    quadrantOrCavity: 'Brainstem -> Carotid Sheath (Neck) -> Mediastinum -> Abdomen',
    surfaceLandmarks: 'Descends in neck within carotid sheath between internal jugular vein and internal/common carotid artery.',
    dimensionsAndWeight: 'Longest cranial nerve; extends from medulla to splenic flexure of colon (~75 cm).',
    arterialSupply: ['Supplied by ascending pharyngeal artery, superior and inferior thyroid arteries, and bronchial arteries.'],
    venousDrainage: ['Internal jugular vein, vertebral venous plexus.'],
    innervation: {
      sympathetic: 'Modulated by postganglionic sympathetic fibers from superior cervical ganglion.',
      parasympathetic: 'Main parasympathetic conduit of thorax and foregut/midgut.',
      somaticOrSensory: 'Auricular branch (Arnold\'s nerve) sensory to posterior EAC and tympanic membrane.',
      referredPain: 'Arnold\'s ear reflex: Cough induced by stimulating external auditory canal.'
    },
    lymphaticDrainage: ['Deep cervical lymph nodes (jugulodigastric and jugulo-omohyoid).'],
    musculoskeletalRelations: ['Carotid sheath behind common carotid artery and internal jugular vein; crosses anterior to subclavian artery on right.'],
    relationsStructured: {
      anterior: ['Common Carotid Artery', 'Internal Jugular Vein', 'Sternocleidomastoid Muscle'],
      posterior: ['Longus Colli Muscle', 'Prevertebral Fascia', 'Sympathetic Trunk'],
      superior: ['Jugular Foramen', 'Hypoglossal Nerve (CN XII)', 'Accessory Nerve (CN XI)'],
      inferior: ['Cardiac Plexus', 'Esophageal Plexus', 'Celiac Plexus'],
      medial: ['Trachea', 'Esophagus', 'Recurrent Laryngeal Nerve'],
      lateral: ['Internal Jugular Vein', 'Deep Cervical Lymph Nodes']
    },
    histologyAndPhysiology: '80-90% sensory/afferent fibers carrying visceral feedback to Nucleus Tractus Solitarius (NTS); 10-20% parasympathetic efferents from dorsal motor nucleus.',
    clinicalBedsideSigns: [
      'Uvula deviation to normal side and loss of gag reflex in unilateral vagal palsy.',
      'Hoarseness of voice in Recurrent Laryngeal Nerve palsy (Ortner syndrome in mitral stenosis).',
      'Neurocardiogenic (vasovagal) syncope triggered by excessive vagal tone / bradycardia / vasodilation.'
    ],
    nmcMbbssVivaPearls: [
      'Q: Why does the Left Recurrent Laryngeal nerve loop lower than the Right? A: Left loops under aortic arch (embryonic 6th aortic arch / ductus arteriosus), while Right loops under subclavian artery (4th aortic arch).',
      'Q: What is the vasovagal syncope reflex arc? A: Afferent via mechanoreceptors/C-fibers to NTS, efferent parasympathetic bradycardia via CN X and sympathoinhibition causing peripheral pooling.'
    ],
    radiologicalCorrelation: 'Neck/Thorax CT: Identifies mediastinal adenopathy or aortic arch aneurysms compressing left recurrent laryngeal nerve.',
    surgicalApproaches: 'Carotid endarterectomy incision along anterior border of SCM; vagus nerve identified and mobilized inside carotid sheath.',
    breadcrumbs: [{ id: 'head', label: 'Head & Neck' }, { id: 'brain', label: 'Brainstem' }, { id: 'vagus_nerve', label: 'Vagus Nerve' }]
  },

  // 9. PHRENIC NERVE
  phrenic_nerve: {
    id: 'phrenic_nerve',
    name: 'Phrenic Nerve (C3, C4, C5)',
    latinName: 'Nervus Phrenicus',
    system: 'Nervous System (Somatic & Visceral Afferent)',
    quadrantOrCavity: 'Cervical Root -> Superior Mediastinum -> Middle Mediastinum -> Diaphragm',
    surfaceLandmarks: 'Descends vertically across anterior surface of scalenus anterior muscle, deep to prevertebral fascia.',
    dimensionsAndWeight: 'Caliber ~2.0 mm; bilateral symmetry with right nerve shorter and more vertical.',
    arterialSupply: ['Supplied by pericardiophrenic artery (branch of internal thoracic artery) which accompanies the nerve.'],
    venousDrainage: ['Pericardiophrenic veins draining into internal thoracic vein or brachiocephalic vein.'],
    innervation: {
      sympathetic: 'Postganglionic sympathetic fibers from middle/inferior cervical ganglia.',
      parasympathetic: 'None.',
      somaticOrSensory: 'Sole motor supply to diaphragm; sensory to central tendon, mediastinal pleura, fibrous pericardium.',
      referredPain: 'Shoulder tip pain (dermatomes C3-C5) in subdiaphragmatic irritation, cholecystitis, or ruptured spleen (Kehr\'s sign).'
    },
    lymphaticDrainage: ['Phrenic and mediastinal lymph nodes.'],
    musculoskeletalRelations: ['Crosses scalenus anterior muscle from lateral to medial, deep to transverse cervical and suprascapular vessels.'],
    relationsStructured: {
      anterior: ['Sternocleidomastoid', 'Internal Jugular Vein', 'Subclavian Vein'],
      posterior: ['Scalenus Anterior Muscle', 'Brachial Plexus Roots', 'Subclavian Artery'],
      superior: ['C3-C5 Cervical Nerve Roots'],
      inferior: ['Diaphragm Dome (Central Tendon)'],
      medial: ['Ascending Cervical Artery', 'Pericardium', 'Superior Vena Cava (Right)'],
      lateral: ['Pleural Dome / Lung Apex', 'Pericardiophrenic Artery']
    },
    histologyAndPhysiology: 'Large myelinated A-alpha motor axons innervating hemidiaphragm; provides 75% of resting tidal volume ventilation.',
    clinicalBedsideSigns: [
      'Paradoxical respiration (inward abdominal motion during inspiration) in bilateral diaphragmatic paralysis.',
      'Hiccups (singultus): Involuntary spasmodic contraction of diaphragm terminated by sudden glottis closure.',
      'Heaving of opposite hemidiaphragm on sniffing under fluoroscopy (Sniff test for phrenic palsy).'
    ],
    nmcMbbssVivaPearls: [
      'Q: What is the classic medical mnemonic for phrenic nerve roots? A: "C3, C4, C5 keeps the diaphragm alive!"',
      'Q: Why does splenic rupture cause left shoulder tip pain? A: Free peritoneal blood irritates inferior surface of left hemidiaphragm; phrenic nerve afferents (C3-C5) enter dorsal horn where supraclavicular sensory fibers (C3-C4) synapse, causing referred pain (Kehr sign).'
    ],
    radiologicalCorrelation: 'Chest Radiograph: Elevated hemidiaphragm (>2 cm higher on right than left, or left higher than right). Fluoroscopic Sniff test confirms paralysis.',
    surgicalApproaches: 'Anterior scalene block in regional anesthesia; careful dissection during thymectomy or CABG to avoid thermal phrenic injury.',
    breadcrumbs: [{ id: 'neck', label: 'Cervical Spine' }, { id: 'thorax', label: 'Mediastinum' }, { id: 'phrenic_nerve', label: 'Phrenic Nerve' }]
  },

  // 10. CELIAC TRUNK & PORTAL VEIN
  celiac_trunk: {
    id: 'celiac_trunk',
    name: 'Celiac Trunk & Branches',
    latinName: 'Truncus Coeliacus',
    system: 'Cardiovascular System (Arterial)',
    quadrantOrCavity: 'Retroperitoneum (T12 Vertebral Level, Epigastrium)',
    surfaceLandmarks: 'Arises immediately below aortic hiatus of diaphragm at T12, just above upper border of pancreas.',
    dimensionsAndWeight: 'Length ~1.25 cm (very short, thick trunk); caliber 7-8 mm.',
    arterialSupply: ['Arises from anterior aspect of abdominal aorta at T12.'],
    venousDrainage: ['Drained via tributaries of the Hepatic Portal Vein and Splenic Vein.'],
    innervation: {
      sympathetic: 'Greater splanchnic nerve (T5-T9) via celiac ganglion.',
      parasympathetic: 'Posterior vagal trunk.',
      somaticOrSensory: 'Visceral epigastric afferents.',
      referredPain: 'Deep boring epigastric pain radiating directly to back (T12-L1) in pancreatitis or peptic ulcer perforation.'
    },
    lymphaticDrainage: ['Celiac lymph nodes surrounding the trunk, thence to cisterna chyli.'],
    musculoskeletalRelations: ['Surrounded by celiac plexus of nerves, retroperitoneal behind lesser sac.'],
    relationsStructured: {
      anterior: ['Lesser Omentum', 'Lesser Sac', 'Stomach Bed'],
      posterior: ['Abdominal Aorta', 'Crura of Diaphragm', 'T12 Vertebra'],
      superior: ['Median Arcuate Ligament of Diaphragm', 'Caudate Lobe of Liver'],
      inferior: ['Superior Border of Pancreas', 'Splenic Vein', 'Left Renal Vein'],
      medial: ['Celiac Ganglion', 'Inferior Vena Cava'],
      lateral: ['Left Gastric Artery', 'Splenic Artery', 'Common Hepatic Artery']
    },
    histologyAndPhysiology: 'Elastic-muscular large arterial conduit giving off the classic "tripod" trifurcation: Left Gastric, Splenic, and Common Hepatic arteries.',
    clinicalBedsideSigns: [
      'Median Arcuate Ligament Syndrome (Dunbar syndrome): Postprandial epigastric pain and weight loss caused by diaphragmatic crus compression.',
      'Epigastric systolic bruit heard over upper abdomen in high-grade celiac stenosis.'
    ],
    nmcMbbssVivaPearls: [
      'Q: What are the three classic terminal branches of the celiac trunk? A: Left Gastric Artery, Splenic Artery (tortuous course), and Common Hepatic Artery.',
      'Q: What is the boundary between foregut and midgut vascular territories? A: Major duodenal papilla (ampulla of Vater) in second part of duodenum (celiac trunk foregut meets SMA midgut via superior and inferior pancreaticoduodenal arcade).'
    ],
    radiologicalCorrelation: 'CT Angiography of Abdomen: Demonstrates seagull-wing appearance of celiac trifurcation.',
    surgicalApproaches: 'Midline laparotomy or laparoscopic celiac axis exposure for aneurysm repair or median arcuate ligament release.',
    breadcrumbs: [{ id: 'abdomen', label: 'Abdomen' }, { id: 'liver', label: 'Foregut' }, { id: 'celiac_trunk', label: 'Celiac Trunk' }]
  },

  portal_vein: {
    id: 'portal_vein',
    name: 'Hepatic Portal Vein',
    latinName: 'Vena Portae Hepatis',
    system: 'Cardiovascular System (Venous)',
    quadrantOrCavity: 'Transverse Mesocolon / Porta Hepatis / Liver (Abdomen)',
    surfaceLandmarks: 'Forms behind the neck of pancreas at L2 level; ascends in right free margin of lesser omentum to porta hepatis.',
    dimensionsAndWeight: 'Length ~8 cm, diameter ~10-12 mm; pressure normal 5-10 mmHg.',
    arterialSupply: ['Vascular conduit receiving deoxygenated nutrient-rich mesenteric blood; vasa vasorum supplied by hepatic artery branches.'],
    venousDrainage: ['Enters hepatic sinusoids, drains into hepatic veins thence into IVC.'],
    innervation: {
      sympathetic: 'Celiac plexus sympathetic vasoconstrictor fibers.',
      parasympathetic: 'Vagal fibers.',
      somaticOrSensory: 'Visceral afferents travel to celiac ganglion.',
      referredPain: 'Vague periumbilical and right hypochondrial dull ache in portal vein thrombosis.'
    },
    lymphaticDrainage: ['Hepatic and celiac lymph node chains.'],
    musculoskeletalRelations: ['Ascends in free edge of lesser omentum (hepatoduodenal ligament) posterior to bile duct and hepatic artery proper.'],
    relationsStructured: {
      anterior: ['Bile Duct (anterior-right)', 'Hepatic Artery Proper (anterior-left)', 'Neck of Pancreas'],
      posterior: ['Inferior Vena Cava (IVC)', 'Epiploic Foramen of Winslow', 'Right Crus of Diaphragm'],
      superior: ['Porta Hepatis', 'Right & Left Lobar Portal Branches'],
      inferior: ['Superior Mesenteric Vein', 'Splenic Vein Confluence', 'Duodenum (1st Part)'],
      medial: ['Celiac Axis', 'Abdominal Aorta'],
      lateral: ['Gallbladder Neck', 'Right Kidney (Posterolateral)']
    },
    histologyAndPhysiology: 'Large capacious venous trunk without valves; carries ~1000-1200 mL/min of blood rich in digested nutrients, amino acids, and pancreatic hormones to the liver.',
    clinicalBedsideSigns: [
      'Caput Medusae: Dilated tortuous subcutaneous veins radiating from umbilicus due to recanalization of umbilical vein in ligamentum teres.',
      'Splenomegaly: Massive congestive splenic enlargement due to backward pressure in splenic vein.',
      'Upper GI Bleeding: Hematemesis from ruptured esophageal varices (portosystemic anastomosis between left gastric vein and azygos vein).'
    ],
    nmcMbbssVivaPearls: [
      'Q: What are the 4 major sites of portosystemic (porto-caval) anastomosis? A: 1) Lower esophagus (Left Gastric vein with Azygos vein -> varices); 2) Anal canal (Superior Rectal vein with Middle/Inferior Rectal veins -> hemorrhoids); 3) Umbilicus (Paraumbilical veins with Epigastric veins -> Caput Medusae); 4) Retroperitoneum (Colic veins with Retroperitoneal veins of Retzius).',
      'Q: What forms the portal vein? A: Superior Mesenteric Vein (SMV) uniting with the Splenic Vein behind the neck of the pancreas.'
    ],
    radiologicalCorrelation: 'Doppler Ultrasound Abdomen: Assesses hepatopetal (normal forward) vs hepatofugal (reversed in severe cirrhosis) portal flow and checks for portal vein thrombosis.',
    surgicalApproaches: 'Transjugular Intrahepatic Portosystemic Shunt (TIPS) between hepatic vein and intrahepatic portal branch to decompress portal hypertension.',
    breadcrumbs: [{ id: 'abdomen', label: 'Abdomen' }, { id: 'liver', label: 'Hepatobiliary' }, { id: 'portal_vein', label: 'Hepatic Portal Vein' }]
  },

  // HEAD: BRAIN
  brain: {
    id: 'brain',
    name: 'Cerebrum, Cerebellum & Brainstem',
    latinName: 'Encephalon',
    system: 'Central Nervous System',
    quadrantOrCavity: 'Cranial Vault (Intracranial Compartment)',
    surfaceLandmarks:
      'Frontal pole lies behind forehead above superciliary arches; Occipital pole lies above external occipital protuberance (inion); Pterion located 3.5cm behind and 1.5cm above frontozygomatic suture (overlying anterior branch of middle meningeal artery).',
    dimensionsAndWeight: 'Weight ~1350g-1400g (males) / 1250g (females); Intracranial volume ~1400-1500 mL (80% brain tissue, 10% CSF, 10% blood).',
    arterialSupply: [
      'Circle of Willis (Circulus Arteriosus): Pentagonal arterial anastomotic ring at base of brain in interpeduncular fossa.',
      'Internal Carotid Arteries (ICA): Enter carotid canal, form carotid siphon, branch into Ophthalmic, Posterior Communicating (PCoA), Anterior Choroidal, and terminate as Anterior Cerebral (ACA) and Middle Cerebral (MCA).',
      'Vertebrobasilar System: Paired Vertebral Arteries join at pontomedullary junction to form Basilar Artery, which terminates into Posterior Cerebral Arteries (PCA).',
    ],
    venousDrainage: [
      'Superficial Cerebral Veins (Superior, Superficial Middle, Inferior) drain into Superior Sagittal Sinus and Cavernous Sinus.',
      'Deep Cerebral Veins: Internal Cerebral Veins join to form Great Cerebral Vein of Galen, which unites with inferior sagittal sinus to form Straight Sinus.',
      'Dural Venous Sinuses: Confluence of sinuses (Torcular Herophili) -> Transverse Sinus -> Sigmoid Sinus -> Internal Jugular Vein.',
    ],
    innervation: {
      sympathetic: 'Superior cervical ganglion postganglionic sympathetic fibers along internal and external carotid plexuses.',
      parasympathetic: 'Greater petrosal nerve (CN VII) and otic ganglion branches to cerebral vessels.',
      somaticOrSensory: 'Brain parenchyma is insensate. Dural meninges are innervated by Ophthalmic (V1), Maxillary (V2), Mandibular (V3) branches of Trigeminal nerve, and upper cervical nerves (C2-C3).',
      referredPain: 'Tentorium cerebelli inflammation refers pain to forehead and behind eyes (V1 ophthalmic distribution); posterior fossa dural irritation refers pain to occiput and nape of neck (C2-C3).',
    },
    lymphaticDrainage: [
      'Glymphatic System: Astrocytic end-feet aquaporin-4 (AQP4) dependent perivascular convective CSF-interstitial fluid exchange draining into deep cervical lymph nodes along cranial nerve sheaths and cribriform plate.',
    ],
    musculoskeletalRelations: [
      'Calvarium: Frontal, parietal, temporal, and occipital bones; base of skull with anterior, middle, and posterior cranial fossae.',
      'Meninges: Dura mater (outer endosteal, inner meningeal forming falx cerebri, tentorium cerebelli), arachnoid mater, pia mater.',
    ],
    histologyAndPhysiology:
      'Cerebral cortex composed of 6 histological layers (molecular, external granular, external pyramidal, internal granular, internal pyramidal containing Betz cells, multiform layer). Cerebral Blood Flow (CBF) autoregulated between MAP 60-150 mmHg: CBF = CPP / CVR, where CPP = MAP - ICP.',
    clinicalBedsideSigns: [
      'Glasgow Coma Scale (GCS): Standard 3-part neurological assessment (Eye Opening 1-4, Verbal Response 1-5, Motor Response 1-6; Total score 3 to 15).',
      'Cushing Triad (Impending Brainstem Herniation): Severe hypertension with widening pulse pressure, bradycardia, and irregular/Cheyne-Stokes respiration.',
      'Pupillary Light Reflex: Afferent limb: CN II (Optic nerve); Efferent limb: CN III (Oculomotor nerve parasympathetic Edinger-Westphal fibers). Unilateral uncal herniation causes ipsilateral Hutchinson pupil (dilated and fixed).',
      'Upper Motor Neuron (UMN) Signs: Spastic clasp-knife hypertonia, hyperreflexia (clonus), extensor plantar response (Babinski sign), and pronator drift.',
    ],
    nmcMbbssVivaPearls: [
      'Q: What is the Monro-Kellie Hypothesis? A: The cranial vault is a rigid, inelastic box of fixed volume (V_brain + V_blood + V_CSF = Constant). An increase in any one component must be compensated by a decrease in another, or ICP rises exponentially.',
      'Q: What artery is injured in extradural (epidural) hematoma? A: Anterior branch of the Middle Meningeal Artery beneath the pterion ("lucid interval" clinical hallmark).',
      'Q: What is the clinical difference between UMN and LMN facial nerve palsy? A: UMN facial palsy (e.g. stroke) spares the forehead/frontalis muscle due to bilateral cortical representation; LMN palsy (e.g. Bell palsy) paralyzes the entire half of the face including the forehead.',
      'Q: Normal opening pressure of CSF on lumbar puncture? A: 70-180 mmH2O (or 10-20 cmH2O) in lateral decubitus position.',
    ],
    radiologicalCorrelation:
      'Non-Contrast Brain CT (NCCT): Acute intracerebral hemorrhage appears hyperdense (bright white, 60-80 Hounsfield Units). Acute ischemic infarction shows early loss of insular ribbon, hypodense parenchymal swelling, and sulcal effacement.',
    surgicalApproaches:
      'Pterional (frontotemporal) craniotomy for Circle of Willis aneurysms; Suboccipital craniectomy for posterior fossa decompression; Emergency burr hole exploration at 3cm above and behind outer canthus for EDH evacuation.',
  },

  // HEAD: KIDNEY
  kidney: {
    id: 'kidney',
    name: 'Renal System (Right & Left Kidneys)',
    latinName: 'Renes',
    system: 'Genitourinary & Endocrine System',
    quadrantOrCavity: 'Retroperitoneal Cavity (Posterior Abdominal Wall, Paravertebral Gutters)',
    surfaceLandmarks:
      'Extends from T12 to L3 vertebrae. Right kidney is 1.25 cm lower than left kidney due to liver. Transpyloric plane (L1) passes through upper part of right hilum and lower part of left hilum.',
    dimensionsAndWeight: 'Weight ~150g (each); Dimensions: 11 cm length, 6 cm breadth, 3 cm anteroposterior thickness (11x6x3 cm rule).',
    arterialSupply: [
      'Renal Arteries: Arise directly from Abdominal Aorta at L1/L2 level immediately below superior mesenteric artery. Right renal artery is longer and passes posterior to IVC. Receive 20-25% of resting cardiac output (~1200 mL/min).',
      'Segmental Arteries: Divide into 5 end-arteries without anastomoses (Apical, Upper anterior, Middle anterior, Lower anterior, Posterior).',
    ],
    venousDrainage: [
      'Renal Veins drain into Inferior Vena Cava (IVC). Left renal vein is 3x longer (7.5cm vs 2.5cm), crosses anterior to aorta and posterior to SMA ("Nutcracker" phenomenon), and receives Left Gonadal and Left Suprarenal veins.',
    ],
    innervation: {
      sympathetic: 'T10-L1 spinal segments via renal plexus and least splanchnic nerve (causes vasoconstriction of afferent arterioles and stimulates renin release via Beta-1 receptors on juxtaglomerular cells).',
      parasympathetic: 'Vagus nerve (CN X) branches via coeliac plexus (physiological role minor).',
      somaticOrSensory: 'Renal capsule and pelvic sensory afferents enter T10-L1 spinal dorsal root ganglia.',
      referredPain: 'Renal colic radiates from the loin (renal angle) to the groin, scrotum/labia majora, and inner thigh along dermatome T10-L1 ("Loin to Groin").',
    },
    lymphaticDrainage: [
      'Renal lymphatics follow renal vessels to Para-aortic (Lumbar) lymph nodes situated around aorta and IVC.',
    ],
    musculoskeletalRelations: [
      'Posterior Relations (identical for both kidneys): Diaphragm, psoas major, quadratus lumborum, transversus abdominis, subcostal nerve/vessels (T12), iliohypogastric nerve (L1), ilioinguinal nerve (L1).',
      'Gerota Fascia: Renal fascia enclosing perirenal fat, kidney, and suprarenal gland.',
    ],
    histologyAndPhysiology:
      'Outer renal cortex containing ~1 million nephrons (glomeruli, proximal and distal convoluted tubules) and inner medulla containing 8-18 renal pyramids with loops of Henle and collecting ducts. Normal Glomerular Filtration Rate (GFR) is 120-125 mL/min/1.73m2.',
    clinicalBedsideSigns: [
      'Bimanual Ballotment of Kidney: Examiner places left hand posteriorly under 12th rib in renal angle and right hand anteriorly in lumbar region; lifting posterior hand allows renal mass to bounce against anterior hand.',
      'Renal Angle Tenderness (Murphy Punch Sign): Deep tenderness elicited in renal angle between 12th rib and lateral border of erector spinae (characteristic of acute pyelonephritis and hydronephrosis).',
      'Uremic Frost: White powdery crystalline urea deposits on skin in end-stage chronic kidney disease (CKD stage 5).',
    ],
    nmcMbbssVivaPearls: [
      'Q: How do you clinically differentiate an enlarged Spleen from an enlarged Left Kidney? A: 1) Spleen has a palpable splenic notch; kidney has no notch; 2) You cannot get above an enlarged spleen, but you can get above a kidney; 3) Spleen is dull to percussion; kidney is overlaid by resonant descending colon; 4) Kidney is bimanually ballotable; spleen is not; 5) Spleen moves inferomedially along axis of 10th rib toward RIF.',
      'Q: What are the 3 physiological anatomical constrictions of the ureter where calculi commonly lodge? A: 1) Pelviureteric Junction (PUJ); 2) Crossing over pelvic brim / iliac vessels; 3) Ureterovesical Junction (UVJ - narrowest point, intramural path ~2cm).',
      'Q: What is Brodel line? A: An avascular plane situated along the junction of anterior two-thirds and posterior one-third of lateral renal border; ideal incision line for nephrolithotomy.',
    ],
    radiologicalCorrelation:
      'Renal Ultrasound: Normal bipolar length 9-12 cm with cortical thickness >= 1.5 cm. Loss of corticomedullary differentiation and bilateral shrunken kidneys (< 8.5 cm) diagnostic of Chronic Kidney Disease (CKD).',
    surgicalApproaches:
      'Lumbotomy (flank incision through bed of 11th or 12th rib); Gibson incision in iliac fossa for renal transplantation (placing graft in iliac fossa with vascular anastomosis to external iliac vessels).',
  },

  // HEAD: SKELETAL
  skeletal: {
    id: 'skeletal',
    name: 'Human Skeletal Architecture & Thoracic Cage',
    latinName: 'Systema Skeletale',
    system: 'Musculoskeletal & Hematopoietic Framework',
    quadrantOrCavity: 'Axial & Appendicular Skeleton (Whole Body)',
    surfaceLandmarks:
      'Sternal Angle (Angle of Louis) lies at T4/T5 intervertebral disc level. Spine of scapula at T3; Inferior angle of scapula at T7; Highest point of iliac crest at L4/L5 vertebral level (Supracristal Tuffier line for Lumbar Puncture).',
    dimensionsAndWeight: '206 articulated bones in adult; accounts for ~14-15% of total body weight. Calcium reservoir (~1.2 kg total body calcium, 99% in bone matrix).',
    arterialSupply: [
      'Nutrient arteries entering through nutrient foramina directed away from growing ends ("Seek the elbow, flee the knee").',
      'Periosteal arteries derived from surrounding muscular branches supplying outer 1/3 of cortex.',
    ],
    venousDrainage: [
      'Batson Paravertebral Venous Plexus: Valveless longitudinal venous network communicating pelvic veins, intercostal veins, and dural venous sinuses (major route for prostatic and pelvic carcinoma spinal metastasis).',
    ],
    innervation: {
      sympathetic: 'Vasomotor fibers to vascular channels in bone marrow and periosteum.',
      parasympathetic: 'None.',
      somaticOrSensory: 'Periosteum is richly innervated by somatic sensory pain fibers (extremely sensitive to trauma, fracture, and subperiosteal hematoma). Bone marrow innervated by sensory fibers responsive to intraosseous pressure.',
      referredPain: 'Somatic sharp, exquisite focal bone pain with pinpoint tenderness over fracture or osteomyelitis site.',
    },
    lymphaticDrainage: [
      'Periosteal lymphatics drain into regional lymph node basins (axillary, inguinal, cervical). Intraosseous tissue lacks lymphatic channels.',
    ],
    musculoskeletalRelations: [
      'Thorax: 12 thoracic vertebrae, 12 pairs of ribs (true ribs 1-7, false ribs 8-10, floating ribs 11-12), costal cartilages, and sternum.',
      'Diaphragmatic attachments: Sternal part from xiphoid; Costal part from lower 6 ribs; Lumbar part from crura (Right crus L1-L3, Left crus L1-L2) and arcuate ligaments.',
    ],
    originsAndInsertions: {
      origin: [
        'Diaphragm: Sternal head (posterior xiphoid), Costal head (inner surfaces of lower 6 ribs & cartilages), Lumbar head (right crus L1-L3, left crus L1-L2, arcuate ligaments).',
        'Pectoralis Major: Clavicular head (medial half clavicle), Sternocostal head (anterior sternum & upper 6 costal cartilages).',
        'Rectus Abdominis: Pubic crest and pubic symphysis.',
      ],
      insertion: [
        'Diaphragm: Central tendon of diaphragm (pierced by IVC at T8).',
        'Pectoralis Major: Lateral lip of bicipital groove of humerus.',
        'Rectus Abdominis: 5th, 6th, 7th costal cartilages and xiphoid process.',
      ],
      action: [
        'Diaphragm: Primary muscle of inspiration (draws central tendon inferiorly, driving 75% of resting tidal volume).',
        'Pectoralis Major: Adduction and medial rotation of arm; clavicular head assists flexion.',
        'Rectus Abdominis: Trunk flexion, increases intra-abdominal pressure.',
      ],
      nerveSupply:
        'Diaphragm: Phrenic nerve (C3-C5); Pectoralis major: Medial & lateral pectoral nerves (C5-T1); Rectus abdominis: Intercostal nerves (T7-T12).',
    },
    supabaseTextbookReference: {
      subtopic: 'Shoulder Joint & Thoracic Framework',
      keyPearls: [
        'Glenohumeral joint is supported dynamically by rotator cuff muscles (SITS: Supraspinatus, Infraspinatus, Teres minor, Subscapularis).',
        'Axillary nerve (C5-C6) curves around surgical neck of humerus and is vulnerable in anterior shoulder dislocation.',
      ],
      diagramUrl: 'https://pmtgeydtqypwrypshhsx.supabase.co/storage/v1/object/public/diagrams/anatomy/shoulder_joint_articular_relations.jpg',
    },
    histologyAndPhysiology:
      'Cortical (compact) bone organized into Haversian systems (osteons) with concentric lamellae, osteocytes within lacunae, and central Haversian canals containing neurovascular bundles. Trabecular (cancellous) bone housing red hematopoietic bone marrow in flat bones (sternum, iliac crest, vertebrae).',
    clinicalBedsideSigns: [
      'Flail Chest: Segmental fractures of >= 3 consecutive ribs in >= 2 places causing paradoxical chest wall movement (inward during inspiration, outward during expiration).',
      'Lumbar Puncture Landmark: Puncture performed in L3/L4 or L4/L5 interspinous space along Tuffier supracristal line (safe because spinal cord ends at lower border of L1 in adults).',
      'Sternal Springing Test: Sternal compression eliciting sharp pain at lateral rib fracture site, differentiating rib fracture from muscular strain.',
    ],
    nmcMbbssVivaPearls: [
      'Q: Where does the spinal cord terminate in adults vs newborns? A: Lower border of L1 in adults (conus medullaris); L3 in newborns.',
      'Q: What structures pass under the Subcostal Groove of each rib? A: Intercostal Vein, Artery, Nerve (VAN from above downwards). Needle thoracostomy or chest drain must be placed along the upper border of the lower rib to avoid damaging the VAN bundle.',
      'Q: What is the primary site for diagnostic bone marrow aspiration and biopsy in adults? A: Posterior Superior Iliac Spine (PSIS); alternative site is Sternal body at 2nd/3rd intercostal space.',
      'Q: Primary ossification centers vs secondary ossification centers rule? A: Primary appear before birth (diaphysis); secondary appear after birth (epiphyses), EXCEPT distal femur (36 weeks) and proximal tibia (38 weeks - medico-legal indicator of full-term maturity).',
    ],
    radiologicalCorrelation:
      'CXR Rib Series: Radiographic detection of cortical disruption, displacement, and pneumothorax/hemothorax complications.',
    surgicalApproaches:
      'Median sternotomy splitting midline of manubrium and sternal body using electric oscillating saw; Thoracotomy through bed of non-resected or subperiosteally resected 5th/6th rib.',
  },

  // HEAD: AORTA
  aorta: {
    id: 'aorta',
    name: 'Aorta & Great Arterial System',
    latinName: 'Aorta Thoracica et Abdominalis',
    system: 'Cardiovascular Conduit System',
    quadrantOrCavity: 'Superior & Posterior Mediastinum, Retroperitoneum',
    surfaceLandmarks:
      'Ascending aorta begins at aortic orifice (left 3rd costal cartilage); Arch of aorta begins and ends at sternal angle (T4/T5); Abdominal aorta enters abdomen at T12 aortic hiatus and bifurcates into common iliac arteries at L4 (plane of iliac crests).',
    dimensionsAndWeight: 'Diameter ~2.5 - 3.0 cm at aortic root, tapering to 1.8 - 2.0 cm at bifurcation; Length ~30-40 cm.',
    arterialSupply: [
      'Vasa Vasorum: Microscopic nutrient vessels ramifying within tunica adventitia and outer half of tunica media.',
    ],
    venousDrainage: [
      'Venae Vasorum drain into azygos, hemiazygos, and intercostal veins.',
    ],
    innervation: {
      sympathetic: 'Aorticorenal and thoracic sympathetic plexuses governing smooth muscle tone.',
      parasympathetic: 'Vagus nerve sensory baroreceptors in aortic arch (Cyon nerve) responding to systemic mean arterial pressure.',
      somaticOrSensory: 'Aortic dissection tears media, causing excruciating tearing or ripping pain radiating to back between scapulae.',
      referredPain: 'Interscapular back pain (thoracic aorta) or severe mid-lumbar back/flank pain (abdominal aortic aneurysm leakage/rupture).',
    },
    lymphaticDrainage: [
      'Drains into anterior and posterior mediastinal, pre-aortic, and para-aortic lymph node chains.',
    ],
    musculoskeletalRelations: [
      'Arch of aorta arches over left main bronchus and bifurcation of pulmonary trunk; crossed on left side by left phrenic and left vagus nerves.',
      'Abdominal aorta descends along anterior surfaces of L1-L4 vertebral bodies, with IVC lying immediately on its right side.',
    ],
    histologyAndPhysiology:
      'Elastic artery dominated by 50-70 concentric fenestrated elastic lamellae in tunica media (Windkessel function: expands during systole, recoils during diastole to maintain steady capillary perfusion).',
    clinicalBedsideSigns: [
      'Radio-Femoral Delay: Simultaneous palpation of right radial and right femoral pulses. Delay or palpable absence diagnostic of Coarctation of Aorta.',
      'Expansile Pulsatile Abdominal Mass: Bimanual palpation in epigastrium showing expansile pulsation diagnostic of Abdominal Aortic Aneurysm (AAA).',
      'Water-Hammer Pulse (Corrigan pulse): Collapsing pulse with abrupt rise and rapid fall in aortic regurgitation and high-output states.',
    ],
    nmcMbbssVivaPearls: [
      'Q: What are the three major branches of the Aortic Arch from right to left? A: 1) Brachiocephalic (Innominate) Artery; 2) Left Common Carotid Artery; 3) Left Subclavian Artery.',
      'Q: Stanford Classification of Aortic Dissection? A: Type A involves Ascending Aorta (surgical emergency); Type B involves only Descending Aorta distal to left subclavian origin (medical management unless complicated).',
      'Q: Ligamentum Arteriosum? A: Fibrous remnant of fetal Ductus Arteriosus connecting left pulmonary artery to arch of aorta; Left Recurrent Laryngeal Nerve loops under it.',
    ],
    radiologicalCorrelation:
      'Contrast CT Angiography (CTA): Gold standard for detecting intimal flap, true and false lumens in aortic dissection, and measuring AAA luminal diameter (> 5.5 cm indicates elective surgical repair).',
    surgicalApproaches:
      'Transperitoneal midline laparotomy or retroperitoneal left flank approach for open AAA repair; Endovascular Aneurysm Repair (EVAR) via bilateral femoral artery percutaneous access.',
  },

  // HEAD: ASCITES
  ascites: {
    id: 'ascites',
    name: 'Peritoneal Ascitic Collection',
    latinName: 'Ascites Peritonei',
    system: 'Peritoneal & Fluid Dynamics',
    quadrantOrCavity: 'Peritoneal Cavity (Pelvic & Dependent Abdominal Recesses)',
    surfaceLandmarks:
      'Flanks full on inspection; shifting dullness detectable once fluid exceeds 1500 mL; fluid thrill positive with massive ascites > 2000 mL.',
    dimensionsAndWeight: 'Physiological peritoneal fluid ~50 mL; Pathological ascites can range from 1 Liter to over 15 Liters in tense ascites.',
    arterialSupply: [
      'Parietal and visceral peritoneal microvasculature; splanchnic arterial vasodilation mediated by Nitric Oxide (NO) in portal hypertension leads to decreased effective arterial blood volume (EABV) and hyperdynamic circulation.',
    ],
    venousDrainage: [
      'Portal venous system: Normal portal pressure 5-10 mmHg; Portal Hypertension defined as Portal Venous Pressure > 12 mmHg (or HVPG > 5 mmHg; clinically significant portal hypertension CSPH when HVPG >= 10 mmHg).',
    ],
    innervation: {
      sympathetic: 'Splanchnic sympathetic vasoconstrictor tone hyperactivated in hepatorenal syndrome.',
      parasympathetic: 'Vagal modulation.',
      somaticOrSensory: 'Parietal peritoneum is somatic sensory (intercostal and subcostal nerves, exquisitely sensitive to stretching and bacterial peritonitis); visceral peritoneum lacks somatic pain fibers.',
      referredPain: 'Spontaneous Bacterial Peritonitis (SBP) presents with diffuse abdominal tenderness, rebound tenderness, and fever (PMN count >= 250 cells/mm3).',
    },
    lymphaticDrainage: [
      'Thoracic Duct: Transports excess hepatic lymph (~20 L/day in cirrhosis vs 1-3 L/day normally) through aortic hiatus to left subclavian-internal jugular junction.',
    ],
    musculoskeletalRelations: [
      'Accumulates primarily in dependent spaces: Morison pouch (hepatorenal recess - lowest space in supine posture) and Pouch of Douglas (rectouterine pouch - lowest space in erect posture).',
    ],
    histologyAndPhysiology:
      'Starling forces equilibrium disruption: J_v = K_f [(P_c - P_i) - sigma (pi_c - pi_i)]. Marked elevation of sinusoidal capillary pressure (P_c) + profound hypoalbuminemia reducing oncotic pressure (pi_c) drives fluid transudation into peritoneal cavity.',
    clinicalBedsideSigns: [
      'Shifting Dullness (requires > 1500 mL): Percuss from resonant midline toward left flank to locate dullness; turn patient 45 deg right, wait 30 seconds; previously dull left flank becomes resonant as air-filled loops float up and fluid shifts downward.',
      'Fluid Thrill (requires > 2000 mL): Assistant places ulnar border of hand firmly along midline of abdomen to damp skin vibration; examiner taps one flank and feels transmitted fluid impulse on opposite flank.',
      'Diagnostic Paracentesis: Safe puncture at left lower quadrant 2 fingers (3 cm) medial and superior to anterior superior iliac spine (ASIS), avoiding inferior epigastric vessels.',
    ],
    nmcMbbssVivaPearls: [
      'Q: What is the cutoff value for SAAG (Serum-Ascites Albumin Gradient)? A: >= 1.1 g/dL indicates Portal Hypertension (Cirrhosis, CCF, Budd-Chiari, Constrictive pericarditis); < 1.1 g/dL indicates Peritoneal disease (Peritoneal TB, Carcinomatosis, Nephrotic syndrome).',
      'Q: Diagnostic criterion for Spontaneous Bacterial Peritonitis (SBP)? A: Ascitic fluid Absolute Neutrophil Count (ANC) >= 250 polymorphonuclear cells/mm3; Empiric DOC: IV Cefotaxime 2g Q8H + Albumin infusion (1.5 g/kg Day 1, 1.0 g/kg Day 3) to prevent Hepatorenal Syndrome.',
      'Q: Why is the left lower quadrant preferred over right lower quadrant for paracentesis? A: Left lower quadrant has a thinner abdominal wall and the descending colon is relatively fixed, whereas RLQ carries risk of perforating a distended cecum.',
    ],
    radiologicalCorrelation:
      'Abdominal POCUS: Minimal ascites (as small as 100 mL) easily seen as anechoic free fluid in Morison pouch (hepatorenal space) or splenorenal space.',
    surgicalApproaches:
      'Therapeutic large-volume paracentesis (LVP) with concurrent IV albumin replacement (8g albumin per liter of ascites removed beyond 5L); Transjugular Intrahepatic Portosystemic Shunt (TIPS) for refractory ascites.',
  },

  // HEAD: SNAKEBITE
  snakebite: {
    id: 'snakebite',
    name: "Russell's Viper Envenomation Site",
    latinName: 'Daboia russelii Morsus',
    system: 'Cutaneous, Hematotoxic & Microvascular Site',
    quadrantOrCavity: 'Right Distal Lower Extremity (Dorsum of Foot / Malleolar Region)',
    surfaceLandmarks:
      'Paired puncture wounds spaced 16-20 mm apart over right lateral malleolar soft tissue with rapid wooden inflammatory edema extending proximally beyond ankle.',
    dimensionsAndWeight: 'Envenomation volume ~0.1 - 0.3 mL venom containing up to 60-70 mg dry weight toxins (lethal human dose ~40-70 mg).',
    arterialSupply: [
      'Dorsalis Pedis and Peroneal Arteries: Microvascular thrombosis triggered by venom procoagulant enzymes (RVV-X Factor X activator and RVV-V Factor V activator) leads to consumption coagulopathy and microvascular necrosis.',
    ],
    venousDrainage: [
      'Dorsal venous arch of foot draining into Great Saphenous and Small Saphenous veins; rapid systemic venom absorption via venous and lymphatic channels.',
    ],
    innervation: {
      sympathetic: 'Vasomotor hyperactivation and severe sympathetic pain response.',
      parasympathetic: 'None.',
      somaticOrSensory: 'Superficial peroneal and sural nerves (severe burning somatic pain, hyperesthesia).',
      referredPain: 'Excruciating pain extending up the limb following ascending lymphangitis to tender inguinal lymphadenitis.',
    },
    lymphaticDrainage: [
      'Superficial and deep lymphatic channels of lower limb draining sequentially into Popliteal nodes and Superficial/Deep Inguinal lymph node basin.',
    ],
    musculoskeletalRelations: [
      'Anterior compartment of leg: Tibialis anterior, extensor hallucis longus, extensor digitorum longus, and peroneus tertius (innervated by deep peroneal nerve).',
      'Lateral compartment of leg: Peroneus longus and peroneus brevis; site highly vulnerable to acute anterior/lateral compartment syndrome under tense fascia.',
    ],
    histologyAndPhysiology:
      'Venom contains Phospholipase A2 (myotoxicity, hemolysis, nephrotoxicity), Metalloproteinases (hemorrhagins destroying endothelial basement membrane), and Serine Proteases causing Venom-Induced Consumption Coagulopathy (VICC) and acute tubular necrosis (ATN).',
    clinicalBedsideSigns: [
      '20-Minute Whole Blood Clotting Test (20WBCT): 2 mL freshly drawn venous blood placed in clean, dry glass tube; left undisturbed for 20 mins; tube tilted 90 deg: if blood remains liquid and uncoagulated, test is POSITIVE (pathognomonic for hemotoxic envenomation).',
      'Spontaneous Systemic Bleeding: Bleeding from puncture sites, gums (gingival sulcus), hematuria, epistaxis, subconjunctival hemorrhage, and hematemesis.',
      'Rapid Proximal Swelling: Measure limb circumference at marked bony landmarks every 2 hours; swelling advancing by > 15 cm in 2 hours indicates severe envenomation.',
    ],
    nmcMbbssVivaPearls: [
      'Q: What is the standard initial dose of Indian Polyvalent Anti-Snake Venom (ASV)? A: 10 vials (100 mL) reconstituted and infused in 500 mL normal saline over 1 hour. Works against the "Big Four": Russell viper, Saw-scaled viper, Common krait, and Indian cobra.',
      'Q: When do you repeat 20WBCT after ASV administration? A: Exactly 6 hours after initial ASV infusion (takes 6 hours for liver to synthesize new clotting factors). If still incoagulable, give second dose of 10 vials ASV.',
      'Q: What is the classic renal complication of Russell viper bite in South India? A: Acute Kidney Injury due to acute tubular necrosis (ATN) and cortical necrosis, compounded by myoglobinuria and disseminated intravascular coagulation (DIC).',
      'Q: Can tourniquets or arterial bands be applied? A: ABSOLUTELY CONTRAINDICATED; causes severe ischemia, gangrene, and massive venom surge upon release.',
    ],
    radiologicalCorrelation:
      'Duplex Ultrasound: Demonstrates patent deep venous system with profound subcutaneous wooden edema and cobblestone appearance, ruling out acute DVT.',
    surgicalApproaches:
      'Fasciotomy for Compartment Syndrome (indicated ONLY after coagulopathy is corrected with ASV and FFP, and compartment pressure > 30 mmHg or within 30 mmHg of diastolic BP).',
  },

  // HEAD: STOMACH
  stomach: {
    id: 'stomach',
    name: 'Stomach & Gastric Apparatus',
    latinName: 'Gaster / Ventriculus',
    system: 'Gastrointestinal & Digestive System',
    quadrantOrCavity: 'Left Hypochondrium, Epigastrium & Umbilical Region',
    surfaceLandmarks:
      'Cardiac orifice lies behind 7th costal cartilage 2.5 cm from sternum (T11 level). Pyloric orifice lies 1.2 cm right of midline on transpyloric plane (L1). Greater curvature arches from 5th intercostal space down to L3.',
    dimensionsAndWeight: 'Capacity ~30 mL at birth, 1000-1500 mL in adults; J-shaped muscular reservoir.',
    arterialSupply: [
      'Left Gastric Artery (direct branch of Celiac Trunk at T12): Supplies upper lesser curvature and lower esophagus.',
      'Right Gastric Artery (branch of Proper Hepatic Artery): Anastomoses with left gastric along lesser curvature.',
      'Left Gastroepiploic / Gastroomental (branch of Splenic Artery): Traverses gastrosplenic ligament to supply upper greater curvature.',
      'Right Gastroepiploic (branch of Gastroduodenal Artery): Traverses greater omentum along lower greater curvature.',
      'Short Gastric Arteries (5-7 branches from Splenic Artery): Supply the gastric fundus.',
    ],
    venousDrainage: [
      'Right and Left Gastric Veins: Drain directly into the Portal Vein (Left gastric forms important site of Porto-Systemic Anastomosis at lower esophagus -> esophageal varices).',
      'Right Gastroepiploic Vein: Drains into Superior Mesenteric Vein (SMV).',
      'Left Gastroepiploic & Short Gastric Veins: Drain into Splenic Vein.',
      'Prepyloric Vein of Mayo: Ascends vertically across anterior surface of gastroduodenal junction into right gastric vein (surgeon landmark for pylorus).',
    ],
    innervation: {
      sympathetic: 'T6-T9/T10 spinal segments via greater splanchnic nerve and celiac plexus (inhibitory to motility, motor to pyloric sphincter, vasoconstrictive).',
      parasympathetic: 'Anterior and Posterior Vagal Trunks (CN X): Anterior vagus gives Nerve of Latarjet along lesser curvature and hepatic branch; Posterior vagus gives posterior nerve of Latarjet and celiac branch (secretomotor to gastric glands, motor to muscular wall).',
      somaticOrSensory: 'Visceral pain afferents accompany sympathetic nerves to T6-T9 dorsal root ganglia.',
      referredPain: 'Epigastric burning or gnawing pain radiating to T6-T9 dermatomes and through to the back (especially in posterior peptic ulcer penetration into pancreas).',
    },
    lymphaticDrainage: [
      'Four anatomical territories draining along coronary, splenic, hepatic, and subpyloric chains to Celiac lymph nodes around celiac trunk.',
      'Virchow Node (Troisier sign): Metastatic enlargement of left supraclavicular lymph node via thoracic duct from gastric adenocarcinoma.',
    ],
    musculoskeletalRelations: [
      'Stomach Bed (structures separated from stomach by lesser sac / omental bursa): Pancreas (body and tail), Left kidney (upper pole), Left suprarenal gland, Spleen (gastric surface), Splenic artery (tortuous course), Transverse mesocolon, and Diaphragm (left crus).',
      'Anterior Relations: Anterior abdominal wall, left lobe of liver, and diaphragm.',
    ],
    histologyAndPhysiology:
      'Four layers: Mucosa, Submucosa, Muscularis externa (inner oblique, middle circular, outer longitudinal), and Serosa. Mucosa contains Parietal (oxyntic) cells secreting HCl and Intrinsic Factor (vital for Vit B12 absorption in terminal ileum), and Chief (peptic) cells secreting Pepsinogen.',
    clinicalBedsideSigns: [
      'Succussion Splash: Sloshing fluid sound heard on auscultation over epigastrium when gently rocking patient abdomen > 3-4 hours after meal (indicates Gastric Outlet Obstruction / Pyloric Stenosis).',
      'Sister Mary Joseph Nodule: Palpable nodule at umbilicus indicating transperitoneal metastasis from gastric cancer.',
      'Krukenberg Tumor: Bilateral metastatic mucinous signet-ring cell ovarian carcinoma from primary gastric adenocarcinoma.',
    ],
    nmcMbbssVivaPearls: [
      'Q: What forms the Stomach Bed? A: Pancreas body/tail, Left kidney, Left suprarenal, Spleen, Splenic artery, Transverse mesocolon, and Diaphragm.',
      'Q: Why is posterior peptic ulcer erosion life-threatening? A: Posterior duodenal/gastric ulcers erode into the Gastroduodenal Artery or Splenic Artery, causing catastrophic arterial hemorrhage.',
      'Q: What is the anatomical rationale for Highly Selective Vagotomy (HSV)? A: Denervates acid-secreting parietal cells by dividing branches of anterior and posterior nerves of Latarjet while preserving the "crow\'s foot" branches to pyloric antrum, avoiding need for drainage procedure.',
    ],
    radiologicalCorrelation:
      'Barium Meal Upper GI Series: Demonstrates normal gastric mucosal rugal folds, J-shape, and rapid passage of contrast through pyloric canal into duodenal bulb (C-loop).',
    surgicalApproaches:
      'Upper midline laparotomy or chevron incision; Laparoscopic sleeve gastrectomy / Roux-en-Y gastric bypass with port placement in upper abdomen.',
    supabaseTextbookReference: {
      subtopic: 'Stomach - location, relations, blood supply, stomach bed',
      keyPearls: [
        'Stomach bed consists of 7 structures separated by omental bursa: Pancreas, Left kidney, Left suprarenal gland, Spleen, Splenic artery, Transverse mesocolon, and Diaphragm.',
        'Left gastric artery is the smallest branch of celiac trunk; runs to cardiac orifice then along lesser curvature.',
      ],
      diagramUrl: 'https://pmtgeydtqypwrypshhsx.supabase.co/storage/v1/object/public/diagrams/physiology/gastric_hcl_secretion_parietal.jpg',
    },
  },

  // HEAD: PANCREAS
  pancreas: {
    id: 'pancreas',
    name: 'Pancreas & Duodenopancreatic Complex',
    latinName: 'Pancreas',
    system: 'Digestive & Endocrine System',
    quadrantOrCavity: 'Epigastrium and Left Hypochondrium (Retroperitoneal, along L1-L2 transpyloric plane)',
    surfaceLandmarks:
      'Head nestled inside C-shaped curve of duodenum over L2; Neck crosses L1 vertebra; Body ascends obliquely across aorta; Tail extends into splenorenal (lienorenal) ligament to splenic hilum.',
    dimensionsAndWeight: 'Length 12-15 cm, Weight ~80-100 g; soft lobulated retroperitoneal gland.',
    arterialSupply: [
      'Superior Pancreaticoduodenal Arteries (Anterior & Posterior): Arise from Gastroduodenal Artery (Celiac axis).',
      'Inferior Pancreaticoduodenal Arteries (Anterior & Posterior): Arise from Superior Mesenteric Artery (SMA). Form critical celiac-SMA collateral cascade around duodenal head.',
      'Arteria Pancreatica Magna & Caudal Pancreatic Arteries: Direct branches of tortuous Splenic Artery supplying body and tail.',
    ],
    venousDrainage: [
      'Splenic Vein: Runs in posterior groove along body/tail of pancreas.',
      'Superior Pancreaticoduodenal Vein: Drains into Portal Vein directly.',
      'Inferior Pancreaticoduodenal Vein: Drains into Superior Mesenteric Vein (SMV).',
      'Portal Vein Formation: Occurs directly behind the NECK of pancreas by the union of Splenic Vein and Superior Mesenteric Vein.',
    ],
    innervation: {
      sympathetic: 'T6-T10 spinal segments via greater and lesser splanchnic nerves and celiac/superior mesenteric plexuses (vasoconstriction and pain transmission).',
      parasympathetic: 'Vagus nerve (CN X) branches via celiac plexus (secretomotor control of exocrine pancreatic juice rich in bicarbonate and digestive enzymes).',
      somaticOrSensory: 'Visceral sensory pain fibers travel with sympathetic nerves to T6-T10 ganglia.',
      referredPain: 'Severe, agonizing epigastric pain boring directly through to the back, relieved characteristically by leaning forward ("Mohammedan prayer position").',
    },
    lymphaticDrainage: [
      'Follows arterial supply to Pancreaticosplenic, Celiac, and Superior Mesenteric lymph nodes.',
    ],
    musculoskeletalRelations: [
      'Anterior: Stomach, lesser sac (omental bursa), transverse mesocolon, and root of transverse colon.',
      'Posterior: Aorta, IVC, right and left renal veins, left kidney upper pole, left suprarenal gland, and vertebral column (L1-L2).',
      'Uncinate process: Hooks posterior to Superior Mesenteric Vein and Artery (SMA and SMV cross anterior to uncinate process but posterior to neck).',
    ],
    histologyAndPhysiology:
      'Dual organ: Exocrine (98%): Acinar cells secreting trypsinogen, chymotrypsinogen, amylase, and lipase stimulated by CCK; Duct cells secreting bicarbonate fluid stimulated by secretin. Endocrine (2%): Islets of Langerhans containing Alpha cells (Glucagon), Beta cells (Insulin), Delta cells (Somatostatin), and PP cells.',
    clinicalBedsideSigns: [
      'Cullen Sign: Periumbilical superficial ecchymosis indicating retroperitoneal hemorrhage in acute necrotizing pancreatitis.',
      'Grey Turner Sign: Flank bruising/ecchymosis due to tracking of hemorrhagic retroperitoneal fluid along transversalis fascia.',
      'Trousseau Sign of Malignancy: Migratory superficial thrombophlebitis associated with pancreatic adenocarcinoma.',
    ],
    nmcMbbssVivaPearls: [
      'Q: Behind which anatomical structure does the Portal Vein form? A: Behind the NECK of the pancreas, by confluence of Splenic Vein and Superior Mesenteric Vein.',
      'Q: What is the relationship of the SMA and SMV to the pancreas? A: They emerge from behind the lower border of the neck and pass ANTERIOR to the uncinate process and 3rd part of duodenum.',
      'Q: What is the embryological origin of the pancreas? A: Dual origin: Ventral pancreatic bud (forms uncinate process and inferior head) and Dorsal pancreatic bud (forms upper head, neck, body, tail). Main duct of Wirsung derives from ventral duct + distal dorsal duct.',
    ],
    radiologicalCorrelation:
      'Contrast-Enhanced CT (CECT) Abdomen: Gold standard for acute pancreatitis; demonstrates parenchymal necrosis, peripancreatic fluid collections, and pseudocyst formation.',
    surgicalApproaches:
      'Whipple Procedure (Pancreaticoduodenectomy): En bloc resection of pancreatic head, duodenum, gallbladder, distal bile duct, and distal stomach for periampullary carcinoma; Frey / Puestow procedure for chronic pancreatitis.',
    supabaseTextbookReference: {
      subtopic: 'Pancreas – location, parts, relations, duct system, blood supply',
      keyPearls: [
        'Portal vein is formed behind the neck of pancreas by junction of splenic vein and superior mesenteric vein.',
        'Uncinate process lies posterior to superior mesenteric vessels and anterior to abdominal aorta.',
      ],
      diagramUrl: 'https://pmtgeydtqypwrypshhsx.supabase.co/storage/v1/object/public/diagrams/anatomy/pancreas_duct_system_relations.jpg',
    },
  },

  // HEAD: SPLEEN
  spleen: {
    id: 'spleen',
    name: 'Spleen & Reticuloendothelial Reservoir',
    latinName: 'Lien / Splen',
    system: 'Lymphatic & Reticuloendothelial System',
    quadrantOrCavity: 'Left Hypochondrium (beneath Left 9th, 10th, and 11th ribs)',
    surfaceLandmarks:
      'Long axis lies parallel to 10th rib. Lies between fundus of stomach and diaphragm. Anterior border reaches midaxillary line; cannot be palpated clinically unless enlarged by at least 2 to 3 times its normal size.',
    dimensionsAndWeight: 'Harris Odd Numbers Rule: 1 inch thick, 3 inches broad, 5 inches long, 7 ounces weight (150-200g), related to ribs 9 to 11.',
    arterialSupply: [
      'Splenic Artery: Largest, highly tortuous branch of Celiac Trunk; travels along superior border of pancreas, enters splenorenal ligament, and divides into 5-6 segmental branches at splenic hilum (end-arteries without anastomoses -> prone to wedge-shaped splenic infarction).',
    ],
    venousDrainage: [
      'Splenic Vein: Formed at hilum by union of 5-6 tributaries; passes horizontally behind body and tail of pancreas; joins Superior Mesenteric Vein behind neck of pancreas to form the Portal Vein. Receives Short gastric, Left gastroepiploic, and Inferior Mesenteric veins.',
    ],
    innervation: {
      sympathetic: 'T6-T8 spinal segments via celiac plexus (governs splenic capsular smooth muscle contraction and arteriolar vasomotor tone).',
      parasympathetic: 'Vagus nerve (CN X) branches via celiac plexus.',
      somaticOrSensory: 'Splenic capsule innervated by pain fibers; splenic parenchyma is insensitive.',
      referredPain: 'Kehr Sign: Sharp referred pain to tip of left shoulder caused by blood in the left subdiaphragmatic space irritating the diaphragmatic peritoneum (C3-C5 phrenic nerve dermatome).',
    },
    lymphaticDrainage: [
      'Splenic lymphatics emerge from hilum and drain into Pancreaticosplenic (splenic) lymph nodes along splenic artery, thence to Celiac nodes.',
    ],
    musculoskeletalRelations: [
      'Diaphragmatic Surface: Smooth and convex, related to diaphragm which separates it from left costodiaphragmatic recess, left lung base, and ribs 9, 10, 11.',
      'Visceral Surface: Gastric impression (fundus of stomach), Renal impression (left kidney upper pole and lateral border), Colic impression (splenic flexure of colon), and Pancreatic impression (tail of pancreas in contact with hilum).',
      'Ligaments: Gastrosplenic ligament (contains short gastric and left gastroepiploic vessels); Splenorenal (lienorenal) ligament (contains splenic vessels and tail of pancreas).',
    ],
    histologyAndPhysiology:
      'White Pulp (20%): Periarteriolar lymphoid sheaths (PALS - rich in T cells) and lymphoid follicles (B cells) for humoral antibody production (IgM against encapsulated organisms). Red Pulp (80%): Splenic cords of Billroth and venous sinusoids for filtration of aged erythrocytes, platelet reservoir (30% of platelets), and iron recycling.',
    clinicalBedsideSigns: [
      'Castell Sign: Percuss in lowest intercostal space in left anterior axillary line (Castell space); percussion note changes from resonant to dull during full inspiration in mild splenomegaly.',
      'Nixon Method: Patient placed in right lateral decubitus; percussion starts at lower border of pulmonary resonance in posterior axillary line downward; dullness > 8 cm implies splenomegaly.',
      'Splenic Notch: Palpable notch on anterior border differentiates enlarged spleen from left renal mass.',
    ],
    nmcMbbssVivaPearls: [
      'Q: What are the contents of the Lienorenal (Splenorenal) ligament? A: Splenic artery, Splenic vein, Tail of pancreas, splenic lymph nodes, and autonomic nerves.',
      'Q: Why must vaccination against encapsulated bacteria be given after Splenectomy? A: Spleen is the primary site for opsonization and clearance of encapsulated bacteria (Streptococcus pneumoniae, Neisseria meningitidis, Haemophilus influenzae); loss of spleen risks Overwhelming Post-Splenectomy Infection (OPSI). Give pneumococcal, meningococcal, and Hib vaccines.',
      'Q: Why is the splenic artery so remarkably tortuous? A: Accommodates extensive distension of the stomach during meals and movements of the left hemidiaphragm without stretching or kinking the vessel.',
    ],
    radiologicalCorrelation:
      'Abdominal Ultrasound: Normal splenic length <= 12 cm; splenomegaly diagnosed when craniocaudal length exceeds 13 cm.',
    surgicalApproaches:
      'Left subcostal (Kocher) incision or upper midline laparotomy; Laparoscopic splenectomy with division of splenocolic, gastrosplenic, and splenorenal ligaments with vascular stapling at hilum.',
    supabaseTextbookReference: {
      subtopic: 'Spleen - external features, relations, histology, applied anatomy',
      keyPearls: [
        'Harris odd numbers rule: 1 x 3 x 5 inches, 7 ounces, ribs 9 to 11.',
        'Kehr sign is referred pain to left shoulder tip due to blood irritating phrenic nerve (C3-C5) under left diaphragm.',
      ],
      diagramUrl: 'https://pmtgeydtqypwrypshhsx.supabase.co/storage/v1/object/public/diagrams/anatomy/spleen_histology_plate.jpg',
    },
  },
};
