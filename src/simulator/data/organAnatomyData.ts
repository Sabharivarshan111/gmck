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
  histologyAndPhysiology: string;
  clinicalBedsideSigns: string[];
  nmcMbbssVivaPearls: string[];
  radiologicalCorrelation: string;
  surgicalApproaches: string;
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
};
