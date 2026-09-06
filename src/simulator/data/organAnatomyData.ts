export interface DetailedOrganAnatomy {
  id: string;
  name: string;
  latinName: string;
  system: string;
  quadrantOrCavity: string;
  surfaceLandmarks: string;
  dimensionsAndWeight: string;
  arterialSupply: string[];
  venousDrainage: string[];
  innervation: {
    sympathetic: string;
    parasympathetic: string;
    somaticOrSensory: string;
    referredPain: string;
  };
  lymphaticDrainage: string[];
  musculoskeletalRelations: string[];
  originsAndInsertions?: {
    origin: string[];
    insertion: string[];
    action: string[];
    nerveSupply: string;
  };
  histologyAndPhysiology: string;
  clinicalBedsideSigns: string[];
  nmcMbbssVivaPearls: string[];
  radiologicalCorrelation: string;
  surgicalApproaches: string;
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
    venousDrainage: [
      'Coronary Sinus (opens into right atrium between IVC orifice and right AV orifice, guarded by Thebesian valve).',
      'Great Cardiac Vein (accompanies LAD in anterior interventricular groove).',
      'Middle Cardiac Vein (accompanies PDA in posterior interventricular groove).',
      'Small Cardiac Vein (accompanies marginal branch of RCA).',
      'Anterior Cardiac Veins & Venae Cordis Minimae (Thebesian veins directly into cardiac chambers).',
    ],
    innervation: {
      sympathetic: 'T1-T5 spinal segments via superficial and deep cardiac plexuses (increases heart rate, inotropy, dromotropy via Beta-1 adrenergic receptors).',
      parasympathetic: 'Right & Left Vagus Nerves (CN X) via cardiac branches (decreases SA nodal discharge and delays AV nodal conduction via M2 muscarinic receptors).',
      somaticOrSensory: 'Afferent cardiac visceral pain fibers travel retrogradely with T1-T4/T5 sympathetic nerves.',
      referredPain: 'Substernal chest pressure radiating along dermatomes T1-T4 to inner aspect of left arm, forearm, ulnar border, jaw, and epigastrium.',
    },
    lymphaticDrainage: [
      'Subepicardial lymphatic network drains into right anterior mediastinal and tracheobronchial (subcarinal) lymph nodes.',
    ],
    musculoskeletalRelations: [
      'Anterior: Body of sternum, costal cartilages of ribs 2-6, transversus thoracis muscle.',
      'Posterior: Esophagus, descending thoracic aorta, thoracic duct, azygos vein, T5-T8 vertebrae.',
      'Inferior: Central tendon of diaphragm (resting on diaphragm via fibrous pericardium).',
      'Lateral: Mediastinal pleura, phrenic nerve, and pericardiophrenic vessels on each side.',
    ],
    histologyAndPhysiology:
      'Striated branched cardiomyocytes with intercalated discs and gap junctions (nexus) forming functional syncytium. Excitation-contraction coupling governed by L-type calcium channels and RyR2 ryanodine receptors on sarcoplasmic reticulum.',
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
  },

  lungs: {
    id: 'lungs',
    name: 'Pulmonary System (Bilateral Lungs & Bronchial Tree)',
    latinName: 'Pulmones',
    system: 'Respiratory System',
    quadrantOrCavity: 'Right & Left Pleural Cavities (Thorax)',
    surfaceLandmarks:
      'Apex rises 2.5cm above medial 1/3 of clavicle. Lower borders: 6th rib at midclavicular line, 8th rib at midaxillary line, 10th rib at scapular line. Pleural reflection drops two ribs lower (8th, 10th, 12th ribs).',
    dimensionsAndWeight: 'Right lung ~625g (heavier, 3 lobes: superior, middle, inferior); Left lung ~565g (2 lobes: superior and inferior, with lingula and cardiac notch).',
    arterialSupply: [
      'Pulmonary Arteries: Deoxygenated blood from right ventricle at low pressure (mean ~15 mmHg) into extensive capillary alveolar bed.',
      'Bronchial Arteries: High-pressure oxygenated systemic nutrition. Left bronchial arteries (2) arise directly from thoracic aorta; Right bronchial artery (1) arises from 3rd posterior intercostal artery.',
    ],
    venousDrainage: [
      '4 Pulmonary Veins (2 superior, 2 inferior) drain oxygenated blood into Left Atrium.',
      'Bronchial Veins: Right bronchial vein drains into Azygos vein; Left bronchial vein drains into Accessory Hemiazygos vein.',
    ],
    innervation: {
      sympathetic: 'T2-T5 spinal sympathetic ganglia via pulmonary plexuses (bronchodilation and mild vasoconstriction via Beta-2 adrenergic receptors).',
      parasympathetic: 'Vagus Nerve (CN X) fibers causing bronchoconstriction and glandular secretomotor mucus secretion (M3 receptors).',
      somaticOrSensory: 'Visceral pleura has no somatic pain sensation. Parietal pleura is acutely sensitive to pain (costal pleura via intercostal nerves, diaphragmatic/mediastinal pleura via phrenic nerve C3-C5).',
      referredPain: 'Diaphragmatic pleural inflammation refers sharp pain to the ipsilateral shoulder tip (supraclavicular nerves C3-C4 dermatome).',
    },
    lymphaticDrainage: [
      'Superficial subpleural and deep broncho-pulmonary lymphatic vessels -> Hilum bronchopulmonary (hilar) nodes -> Tracheobronchial (carinal) nodes -> Bronchomediastinal lymph trunks.',
    ],
    musculoskeletalRelations: [
      'Thoracic cage: 12 pairs of ribs, external/internal intercostal muscles, serratus anterior, pectoralis minor.',
      'Diaphragm: Right dome higher than left dome due to underlying liver; innervated by Phrenic nerve (C3, C4, C5 keep the diaphragm alive).',
    ],
    histologyAndPhysiology:
      'Alveoli lined by Type I pneumocytes (95% of alveolar surface, thin for gas exchange) and Type II pneumocytes (synthesize dipalmitoylphosphatidylcholine DPPC pulmonary surfactant). Gas diffusion governed by Fick law across 0.2-0.5 um blood-air barrier.',
    clinicalBedsideSigns: [
      'Vesicular Breath Sounds: Soft, rustling sound with inspiratory:expiratory duration ratio 3:1, without inspiratory-expiratory pause.',
      'Bronchial Breathing: Harsh, hollow tubular sound with audible expiration longer or equal to inspiration, separated by distinct pause (heard over consolidation or above pleural effusion).',
      'Crepitations (Crackles): Intermittent non-musical crackling sounds due to explosive reopening of small airways. Fine crackles in pulmonary edema/fibrosis; coarse in bronchiectasis/bronchitis.',
      'Stony Dull Percussion Note: Diagnostic hallmark of pleural effusion.',
      'Aegophony (E-to-A transition): Nasal bleating quality over compressed lung at superior margin of pleural effusion.',
    ],
    nmcMbbssVivaPearls: [
      'Q: Why are aspirated foreign bodies more likely to lodge in the right main bronchus? A: Right bronchus is wider, shorter (2.5cm vs 5cm), and runs more vertically (25 deg vs 45 deg angle with trachea).',
      'Q: Surface landmark for chest tube (ICD) insertion? A: Triangle of Safety in 5th intercostal space anterior to midaxillary line (bounded by anterior border of latissimus dorsi, lateral border of pectoralis major, apex in axilla, and base at horizontal level of 5th ICS).',
      'Q: What is the anatomical dead space volume? A: Approximately 150 mL (or 2.2 mL/kg).',
      'Q: What structure passes through the diaphragm at T8, T10, and T12? A: T8: Caval opening (IVC, right phrenic); T10: Esophageal hiatus (esophagus, vagus nerves); T12: Aortic hiatus (aorta, thoracic duct, azygos vein). Remember: "I (IVC 8) Ate (8) Ten (10) Eggs (Esophagus 10) At (Aorta 12) Twelve (12)".',
    ],
    radiologicalCorrelation:
      'Normal PA CXR demonstrates clear radiolucent lung fields with sharp lateral and cardiophrenic angles. Blunting of costophrenic angle requires >= 175-200 mL of pleural fluid on erect film.',
    surgicalApproaches:
      'Posterolateral thoracotomy (5th or 6th ICS) for lung resection/lobectomy; Video-Assisted Thoracoscopic Surgery (VATS) using 3-port triangular access.',
  },

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

  liver: {
    id: 'liver',
    name: 'Liver & Biliary System',
    latinName: 'Hepar',
    system: 'Digestive & Metabolic System',
    quadrantOrCavity: 'Right Hypochondrium, Epigastrium & Left Hypochondrium (Abdomen)',
    surfaceLandmarks:
      'Upper border: 5th intercostal space at right midclavicular line. Lower border: Crosses midline midway between xiphisternum and umbilicus. Normal liver span is 8-12 cm in right midclavicular line.',
    dimensionsAndWeight: 'Weight ~1.4 - 1.6 kg (largest internal organ and exocrine gland).',
    arterialSupply: [
      'Dual blood supply: Total hepatic blood flow ~1500 mL/min (25% of cardiac output).',
      'Hepatic Artery Proper (30% of blood flow, 50% of oxygen supply): Branch of Common Hepatic from Coeliac Trunk (vertebral level T12/L1). Divides into Right and Left Hepatic Arteries in porta hepatis.',
      'Portal Vein (70% of blood flow, 50% of oxygen supply): Formed by union of Superior Mesenteric Vein (SMV) and Splenic Vein behind neck of pancreas at L2 level. Nutrient-rich deoxygenated blood from gut.',
    ],
    venousDrainage: [
      'Right, Middle, and Left Hepatic Veins exit posterior surface of liver and drain directly into Inferior Vena Cava (IVC) immediately below diaphragm. (Budd-Chiari syndrome = hepatic vein thrombosis).',
    ],
    innervation: {
      sympathetic: 'Coeliac plexus (T7-T10 splanchnic nerves).',
      parasympathetic: 'Hepatic branches of anterior and posterior Vagal trunks.',
      somaticOrSensory: 'Liver parenchyma and Glisson capsule visceral sensory. Parietal peritoneum and right diaphragmatic surface innervated by right Phrenic nerve (C3-C5).',
      referredPain: 'Hepatic inflammation or subdiaphragmatic abscess stretching diaphragmatic peritoneum refers pain to the right shoulder tip (C4 dermatome).',
    },
    lymphaticDrainage: [
      'Deep lymphatic vessels accompany hepatic portal triads to hepatic nodes at porta hepatis, thence to coeliac lymph nodes. Superficial lymphatics from bare area pass through diaphragm to posterior mediastinal nodes.',
    ],
    musculoskeletalRelations: [
      'Anterior/Superior: Diaphragm, right costal margin (ribs 7-11), xiphoid process, anterior abdominal wall.',
      'Posteroinferior Visceral Surface: Stomach (gastric impression), duodenum (duodenal impression), gallbladder (cystic fossa), hepatic flexure of colon (colic impression), right kidney and right suprarenal gland.',
    ],
    histologyAndPhysiology:
      'Classic hexagonal lobule centered on terminal hepatic venule (central vein) with portal triads at periphery. Couinaud anatomical division into 8 independent functional segments, each with its own vascular and biliary pedicle (Segment I: Caudate lobe; Segments II-VIII).',
    clinicalBedsideSigns: [
      'Liver Span Percussion: Upper border determined by heavy percussion from lung resonance to dullness in 5th ICS; lower border by light percussion moving upward from right iliac fossa (normal 8-12cm).',
      'Hepatomegaly: Palpable below right costal margin moving with respiration. Tender and soft in acute hepatitis/congestive heart failure; hard, irregular, and nodular in hepatocellular carcinoma.',
      'Stigmata of Chronic Liver Disease: Spider naevi (superior vena caval distribution), palmar erythema, leuconychia (Terry nails), Dupuytren contracture, gynecomastia, caput medusae, and parotid enlargement.',
      'Asterixis (Flapping Tremor): Negative myoclonus elicited by dorsiflexing wrists with outstretched fingers and eyes closed (hallmark of Grade II Hepatic Encephalopathy).',
    ],
    nmcMbbssVivaPearls: [
      'Q: What is the Pringle Maneuver? A: Temporary digital or vascular clamp compression of the hepatoduodenal ligament (free border of lesser omentum) containing the Hepatic Artery, Portal Vein, and Common Bile Duct to control catastrophic hepatic hemorrhage during surgery (safe ischemic time ~15-20 mins).',
      'Q: What are the 5 major Portosystemic Anastomotic sites? A: 1) Lower esophagus (Left gastric vein <-> Azygos vein -> Esophageal varices); 2) Umbilicus (Paraumbilical veins <-> Epigastric veins -> Caput medusae); 3) Anal canal (Superior rectal vein <-> Middle/Inferior rectal veins -> Hemorrhoids); 4) Retroperitoneum (Colic veins <-> Retroperitoneal veins of Retzius); 5) Bare area of liver.',
      'Q: What is SAAG and its diagnostic significance? A: Serum-Ascites Albumin Gradient = Serum Albumin - Ascitic Fluid Albumin. SAAG >= 1.1 g/dL indicates Portal Hypertension (Cirrhosis, Cardiac failure, Budd-Chiari); SAAG < 1.1 g/dL indicates Non-portal causes (Peritoneal carcinomatosis, TB peritonitis, Nephrotic syndrome).',
      'Q: Cantlie Line? A: Line from IVC fossa to gallbladder fossa separating functional right and left lobes of liver (supplied by right and left branches of hepatic artery and portal vein).',
    ],
    radiologicalCorrelation:
      'Abdominal Ultrasound: Normal liver echogenicity is equal or slightly greater than renal cortex. Fatty liver shows hyperechoic "bright" liver with posterior acoustic attenuation. Cirrhosis shows surface nodularity, coarse parenchymal texture, and attenuated hepatic veins.',
    surgicalApproaches:
      'Kocher right subcostal incision (2 fingers below and parallel to right costal margin); Mercedes-Benz or Chevron roof-top incision for orthotopic liver transplantation and major hepatic resections.',
  },

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

