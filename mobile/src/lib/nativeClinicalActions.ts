/** Generated from src/simulator/controls/InterventionPanel.tsx. Same web intervention actions. */
export interface NativeClinicalAction { id: string; label: string; sub: string; icon: string; cat: string; color: string }
export const NATIVE_CLINICAL_ACTIONS: NativeClinicalAction[] = [
  {
    "id": "saline",
    "label": "IV Saline",
    "sub": "500 mL Bolus",
    "icon": "💧",
    "cat": "resus",
    "color": "sky"
  },
  {
    "id": "blood_transfusion",
    "label": "PRBC Transfusion",
    "sub": "Massive Transfusion",
    "icon": "🩸",
    "cat": "resus",
    "color": "rose"
  },
  {
    "id": "oxygen",
    "label": "High-Flow O2",
    "sub": "15 L/min NRB",
    "icon": "🫁",
    "cat": "resus",
    "color": "teal"
  },
  {
    "id": "ors_fluids",
    "label": "Pediatric Fluids",
    "sub": "20 mL/kg RL Bolus",
    "icon": "🍼",
    "cat": "resus",
    "color": "blue"
  },
  {
    "id": "defib",
    "label": "Defibrillator",
    "sub": "200J Biphasic Shock",
    "icon": "⚡",
    "cat": "resus",
    "color": "amber"
  },
  {
    "id": "adrenaline",
    "label": "Adrenaline",
    "sub": "1 mg IV / 0.5 IM",
    "icon": "⚡",
    "cat": "cardiac",
    "color": "rose"
  },
  {
    "id": "noradrenaline",
    "label": "Noradrenaline",
    "sub": "Infusion MAP>65",
    "icon": "🩸",
    "cat": "cardiac",
    "color": "red"
  },
  {
    "id": "aspirin_ticagrelor",
    "label": "Dual Antiplatelets",
    "sub": "ASA 325 + Tica 180",
    "icon": "💊",
    "cat": "cardiac",
    "color": "orange"
  },
  {
    "id": "heparin",
    "label": "Heparin Bolus",
    "sub": "5,000 IU IV",
    "icon": "💉",
    "cat": "cardiac",
    "color": "indigo"
  },
  {
    "id": "atropine",
    "label": "Atropine",
    "sub": "0.6 - 2.0 mg IV",
    "icon": "💉",
    "cat": "cardiac",
    "color": "purple"
  },
  {
    "id": "nitroglycerin",
    "label": "Nitroglycerin",
    "sub": "0.4 mg SL Tab",
    "icon": "💊",
    "cat": "cardiac",
    "color": "amber"
  },
  {
    "id": "furosemide",
    "label": "Furosemide",
    "sub": "40 mg IV Loop Diuretic",
    "icon": "🌊",
    "cat": "cardiac",
    "color": "blue"
  },
  {
    "id": "antivenom",
    "label": "Snake Antivenom",
    "sub": "10 Vials ASV IV",
    "icon": "🐍",
    "cat": "antidotes",
    "color": "emerald"
  },
  {
    "id": "pralidoxime",
    "label": "Pralidoxime",
    "sub": "2-PAM 2g IV",
    "icon": "🧪",
    "cat": "antidotes",
    "color": "indigo"
  },
  {
    "id": "nac",
    "label": "N-Acetylcysteine",
    "sub": "150 mg/kg IV Infusion",
    "icon": "🛡️",
    "cat": "antidotes",
    "color": "teal"
  },
  {
    "id": "insulin_iv",
    "label": "Regular Insulin",
    "sub": "10 Units IV + Dextrose",
    "icon": "💉",
    "cat": "antidotes",
    "color": "violet"
  },
  {
    "id": "calcium_gluconate",
    "label": "Calcium Gluconate",
    "sub": "10% 10 mL IV",
    "icon": "🦴",
    "cat": "antidotes",
    "color": "sky"
  },
  {
    "id": "magnesium_sulfate",
    "label": "Magnesium SO4",
    "sub": "4g IV Loading Dose",
    "icon": "⚡",
    "cat": "antidotes",
    "color": "amber"
  },
  {
    "id": "needle_decomp",
    "label": "Needle Decomp",
    "sub": "2nd ICS MCL",
    "icon": "🎯",
    "cat": "procedures",
    "color": "orange"
  },
  {
    "id": "pericardiocentesis",
    "label": "Pericardiocentesis",
    "sub": "Subxiphoid Tap",
    "icon": "🫀",
    "cat": "procedures",
    "color": "red"
  },
  {
    "id": "rtpa",
    "label": "r-tPA Alteplase",
    "sub": "0.9 mg/kg Thrombolysis",
    "icon": "🧠",
    "cat": "procedures",
    "color": "cyan"
  },
  {
    "id": "lorazepam",
    "label": "Lorazepam IV",
    "sub": "4 mg IV Anticonvulsant",
    "icon": "💤",
    "cat": "procedures",
    "color": "purple"
  },
  {
    "id": "oxytocin",
    "label": "Oxytocin 10 IU",
    "sub": "Uterotonic + Massage",
    "icon": "👶",
    "cat": "procedures",
    "color": "pink"
  },
  {
    "id": "ceftriaxone",
    "label": "Ceftriaxone 2g",
    "sub": "Broad-Spectrum IV",
    "icon": "💊",
    "cat": "procedures",
    "color": "emerald"
  },
  {
    "id": "fasciotomy",
    "label": "Emergent Fasciotomy",
    "sub": "Compartment Release",
    "icon": "🔪",
    "cat": "procedures",
    "color": "rose"
  },
  {
    "id": "traction_splint",
    "label": "Traction Splint",
    "sub": "Femoral Realignment",
    "icon": "🩼",
    "cat": "procedures",
    "color": "amber"
  },
  {
    "id": "laparotomy",
    "label": "Operative Laparotomy",
    "sub": "Surgical Hemostasis",
    "icon": "🏥",
    "cat": "procedures",
    "color": "red"
  }
];
