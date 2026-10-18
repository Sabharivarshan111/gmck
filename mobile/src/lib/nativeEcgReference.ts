/** Metadata mirrored from the Vercel ECG teaching canvas; do not edit independently. */
export type NativeEcgSegmentId = 'all' | 'p' | 'pr' | 'qrs' | 'st' | 't' | 'qt';
export interface NativeEcgSegment {id: Exclude<NativeEcgSegmentId, 'all'>;name:string;shortName:string;phaseStart:number;phaseEnd:number;normalDurationMs:string;color:string;bandColor:string;lightTextColor:string;darkTextColor:string;physioOrigin:string;vectorExplanation:string;leadsAnalysis:string;clinicalPearls:string}
export const NATIVE_ECG_SEGMENTS: NativeEcgSegment[] = [
  {
    "id": "p",
    "name": "P Wave",
    "shortName": "P",
    "phaseStart": 0.12,
    "phaseEnd": 0.24,
    "normalDurationMs": "80 – 110 ms (< 0.25 mV)",
    "color": "#d97706",
    "physioOrigin": "Atrial Depolarization originating at Sinoatrial (SA) node in high Right Atrium, radiating across Bachmann bundle to Left Atrium.",
    "vectorExplanation": "Mean atrial vector directs down and left (+60°). Points directly toward Lead II (+60°) → upright rounded P wave; away from aVR (-150°) → inverted P wave.",
    "leadsAnalysis": "Positive in Leads I, II, aVF, V4–V6. Biphasic in V1 (initial positive RA component + terminal negative LA component).",
    "clinicalPearls": "P pulmonale (peaked > 2.5 mm in II): Right Atrial Enlargement (COPD, Cor Pulmonale). P mitrale (notched/bifid > 120 ms): Left Atrial Enlargement (Mitral Stenosis). Absent in Atrial Fibrillation.",
    "bandColor": "rgba(245, 158, 11, 0.22)",
    "lightTextColor": "#b45309",
    "darkTextColor": "#fcd34d"
  },
  {
    "id": "pr",
    "name": "PR interval",
    "shortName": "PR",
    "phaseStart": 0.12,
    "phaseEnd": 0.35,
    "normalDurationMs": "120 – 200 ms (3–5 small squares)",
    "color": "#059669",
    "physioOrigin": "Physiological conduction delay within the Atrioventricular (AV) node, Bundle of His, and bundle branches, allowing ventricular filling before systole.",
    "vectorExplanation": "Small localized potentials cancel out; produces an isoelectric (flat) voltage baseline on all surface limb and precordial leads.",
    "leadsAnalysis": "Isoelectric baseline across all 12 leads under normal conditions.",
    "clinicalPearls": "PR Prolongation (> 200 ms): 1st Degree AV Block. Short PR (< 120 ms): WPW Syndrome (Delta wave). PR Depression: Acute Pericarditis (hallmark sign in II, aVF with reciprocal PR elevation in aVR).",
    "bandColor": "rgba(16, 185, 129, 0.22)",
    "lightTextColor": "#047857",
    "darkTextColor": "#6ee7b7"
  },
  {
    "id": "qrs",
    "name": "QRS Complex",
    "shortName": "QRS",
    "phaseStart": 0.35,
    "phaseEnd": 0.48,
    "normalDurationMs": "70 – 100 ms (< 120 ms)",
    "color": "#0284c7",
    "physioOrigin": "Ventricular Depolarization: Initial left-to-right septal depolarization (Q wave), dominant apex-to-base LV mass activation (R wave), late posterobasal depolarization (S wave).",
    "vectorExplanation": "Mean QRS axis normally -30° to +90°. Left ventricular mass (3x RV) dominates the vector, pointing inferiorly and to the left (+60°).",
    "leadsAnalysis": "Precordial R-Wave Progression: V1 (small r, deep S) transitioning to equiphasic RS at V3–V4, becoming dominant tall R wave in V5–V6. aVR is deeply negative (QS).",
    "clinicalPearls": "Wide QRS (> 120 ms): LBBB (WiLLiaM), RBBB (MaRRoW), or Ventricular Pacing. Pathological Q Wave (> 40 ms or > 25% R): Transmural Myocardial Infarction. Low voltage (< 5mm in limb leads): Tamponade, Amyloid, Obesity.",
    "bandColor": "rgba(6, 182, 212, 0.25)",
    "lightTextColor": "#0e7490",
    "darkTextColor": "#67e8f9"
  },
  {
    "id": "st",
    "name": "ST Segment",
    "shortName": "ST",
    "phaseStart": 0.48,
    "phaseEnd": 0.6,
    "normalDurationMs": "Assess J-point and TP baseline",
    "color": "#dc2626",
    "physioOrigin": "Plateau phase (Phase 2) of ventricular cardiomyocyte action potential; all ventricular myocytes are uniformly depolarized with zero net trans-myocardial voltage gradient.",
    "vectorExplanation": "In normal myocardium, net dipole is zero → flat isoelectric segment continuous with TP baseline.",
    "leadsAnalysis": "Assess J-point elevation or depression in contiguous leads, using appropriate age and sex thresholds. Normal variants and nonischemic conditions can cause ST changes.",
    "clinicalPearls": "ST Elevation (STEMI): Acute transmural myocardial injury current pointing toward infarcted zone (Inferior: II, III, aVF; Anterior: V1-V4; Lateral: I, aVL, V5-V6). Reciprocal ST Depression in opposite leads. Diffuse concave elevation: Acute Pericarditis.",
    "bandColor": "rgba(239, 68, 68, 0.26)",
    "lightTextColor": "#be123c",
    "darkTextColor": "#fda4af"
  },
  {
    "id": "t",
    "name": "T Wave",
    "shortName": "T",
    "phaseStart": 0.6,
    "phaseEnd": 0.76,
    "normalDurationMs": "160 – 200 ms (Asymmetric, rounded)",
    "color": "#7c3aed",
    "physioOrigin": "Rapid Ventricular Repolarization (Phase 3 of action potential) via voltage-gated potassium channels (IKr, IKs). Epicardium repolarizes before endocardium!",
    "vectorExplanation": "Because repolarization propagates in reverse direction (epicardium to endocardium), the repolarization dipole has the SAME positive polarity as depolarization! Hence T wave is concordant with QRS.",
    "leadsAnalysis": "Upright in I, II, V3–V6. Inverted in aVR. Variable in III, aVL, V1.",
    "clinicalPearls": "Tall Peaked T Waves: Hyperkalemia (early, symmetrical, tented). Inverted T Waves: Myocardial Ischemia, Wellens Syndrome (biphasic/deep V2-V3), or LV Strain. Flat T with U wave: Hypokalemia.",
    "bandColor": "rgba(139, 92, 246, 0.24)",
    "lightTextColor": "#7e22ce",
    "darkTextColor": "#d8b4fe"
  },
  {
    "id": "qt",
    "name": "QT / QTc Interval",
    "shortName": "QT",
    "phaseStart": 0.35,
    "phaseEnd": 0.76,
    "normalDurationMs": "380 – 440 ms (Bazett QTc < 450ms ♂, < 460ms ♀)",
    "color": "#db2777",
    "physioOrigin": "Total Ventricular Electrical Systole: encompasses entire duration of ventricular depolarization (QRS) through complete repolarization (T wave).",
    "vectorExplanation": "Spans the complete ventricular activation cycle from septal onset to epicardial recovery.",
    "leadsAnalysis": "Measured in Lead II or V5 from onset of Q wave to point where terminal limb of T wave returns to baseline.",
    "clinicalPearls": "Long QT Syndrome (QTc > 480 ms): Risk of R-on-T phenomenon degenerating into Torsades de Pointes and VFib. Causes: Drugs (Macrolides, Antipsychotics, Antiarrhythmics), Hypokalemia, Hypocalcemia, Hypomagnesemia.",
    "bandColor": "rgba(236, 72, 153, 0.20)",
    "lightTextColor": "#be185d",
    "darkTextColor": "#f9a8d4"
  }
];
export interface NativeEcgLead {id:string; name:string; r:number; s:number; q:number; t:number;inv:number}
export const NATIVE_ECG_LEADS: NativeEcgLead[] = [
  {
    "id": "I",
    "name": "Lead I (0°)",
    "r": 18,
    "s": 4,
    "q": 1.5,
    "t": 7,
    "inv": 1
  },
  {
    "id": "II",
    "name": "Lead II (+60°)",
    "r": 28,
    "s": 4,
    "q": 1.5,
    "t": 10,
    "inv": 1
  },
  {
    "id": "III",
    "name": "Lead III (+120°)",
    "r": 10,
    "s": 5,
    "q": 0,
    "t": 4,
    "inv": 1
  },
  {
    "id": "aVR",
    "name": "aVR (-150°)",
    "r": 3,
    "s": 22,
    "q": 0,
    "t": 7,
    "inv": -1
  },
  {
    "id": "aVL",
    "name": "aVL (-30°)",
    "r": 12,
    "s": 6,
    "q": 1,
    "t": 5,
    "inv": 1
  },
  {
    "id": "aVF",
    "name": "aVF (+90°)",
    "r": 20,
    "s": 4,
    "q": 1.5,
    "t": 8,
    "inv": 1
  },
  {
    "id": "V1",
    "name": "V1 (4th ICS RSB)",
    "r": 4,
    "s": 24,
    "q": 0,
    "t": -3,
    "inv": 1
  },
  {
    "id": "V2",
    "name": "V2 (4th ICS LSB)",
    "r": 8,
    "s": 20,
    "q": 0,
    "t": 6,
    "inv": 1
  },
  {
    "id": "V3",
    "name": "V3 (Midway V2-V4)",
    "r": 14,
    "s": 14,
    "q": 0,
    "t": 8,
    "inv": 1
  },
  {
    "id": "V4",
    "name": "V4 (5th ICS MCL)",
    "r": 22,
    "s": 7,
    "q": 1,
    "t": 9,
    "inv": 1
  },
  {
    "id": "V5",
    "name": "V5 (Ant Axillary)",
    "r": 26,
    "s": 4,
    "q": 2.5,
    "t": 9,
    "inv": 1
  },
  {
    "id": "V6",
    "name": "V6 (Mid Axillary)",
    "r": 22,
    "s": 3,
    "q": 2.5,
    "t": 8,
    "inv": 1
  }
];
