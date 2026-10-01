import type { NotesContent } from '@/lib/handwrittenNotes';
// Fresh provider output with documented clinical corrections; preview only.
export const AF_GENERATED_NOTES: NotesContent = {
  "highYieldTip": "Assess stability, identify pre-excitation, and individualize stroke prevention and rate/rhythm control.",
  "pyqYears": [
    "Final Year MBBS General Medicine - Atrial Fibrillation"
  ],
  "sections": [
    {
      "type": "definition",
      "title": "Definition of Atrial Fibrillation",
      "icon": "📌",
      "payload": {
        "text": "Atrial Fibrillation (AF) is a supraventricular tachyarrhythmia characterized by uncoordinated atrial activation with consequent deterioration of atrial mechanical function. On ECG, it is defined by the replacement of consistent P waves by rapid oscillations or fibrillatory waves that vary in size, shape, and timing, associated with an irregularly irregular ventricular response."
      }
    },
    {
      "type": "table",
      "title": "Classification of Tachyarrhythmias",
      "icon": "📊",
      "payload": {
        "columns": [
          "Group",
          "Examples",
          "ECG approach"
        ],
        "rows": [
          [
            "Supraventricular",
            "Sinus tachycardia, atrial tachycardia, flutter/AF, AVNRT and AVRT",
            "Often narrow QRS; assess regularity and atrial activity. Aberrancy or pre-excitation can widen QRS."
          ],
          [
            "Ventricular",
            "Monomorphic VT, polymorphic VT including torsades de pointes, ventricular fibrillation",
            "Often wide QRS; unstable rhythms need urgent treatment. VF has no organized QRS pattern."
          ],
          [
            "Practical triage",
            "Regular or irregular; narrow or wide complex",
            "Treat uncertain wide-complex tachycardia cautiously as possible VT; identify pre-excited AF before using nodal blockers."
          ]
        ]
      }
    },
    {
      "type": "bullets",
      "title": "Classification of Atrial Fibrillation",
      "icon": "📋",
      "payload": {
        "items": [
          {
            "label": "Paroxysmal AF",
            "description": "Episodes that terminate spontaneously or with intervention within 7 days of onset."
          },
          {
            "label": "Persistent AF",
            "description": "AF continuously sustained for more than seven days. Cardioversion during an earlier episode does not by itself make AF persistent."
          },
          {
            "label": "Chronic/Permanent AF",
            "description": "Permanent AF means a shared decision to stop further attempts at rhythm restoration. Long-standing persistent AF is continuous AF lasting more than twelve months; it is a separate category."
          },
          {
            "label": "Lone AF",
            "description": "Historically described AF without recognized structural disease or triggers. This term is discouraged in modern classifications; assess underlying disease and thromboembolic risk explicitly."
          }
        ]
      }
    },
    {
      "type": "bullets",
      "title": "Etiology of Atrial Fibrillation",
      "icon": "🧬",
      "payload": {
        "items": [
          {
            "label": "Cardiac Causes",
            "description": "Rheumatic heart disease (especially mitral stenosis), hypertension (causing LV hypertrophy), coronary artery disease, myocardial infarction, cardiomyopathies (dilated), and congenital heart disease (e.g., ASD)."
          },
          {
            "label": "Valvular Disorders",
            "description": "Mitral valve prolapse, mitral regurgitation, and mechanical prosthetic valves."
          },
          {
            "label": "Endocrine/Metabolic",
            "description": "Hyperthyroidism (thyrotoxicosis is a classic reversible cause), electrolyte imbalances (hypokalemia, hypomagnesemia)."
          },
          {
            "label": "Lifestyle/Other",
            "description": "Alcohol abuse (holiday heart syndrome), stimulants (cocaine, amphetamines, excess caffeine), and postoperative states (especially post-CABG)."
          },
          {
            "label": "Idiopathic",
            "description": "Lone AF where no structural heart disease is found despite thorough investigation."
          }
        ]
      }
    },
    {
      "type": "flowchart",
      "title": "Pathophysiology of Atrial Fibrillation",
      "icon": "🔁",
      "payload": {
        "steps": [
          {
            "label": "Trigger",
            "detail": "Ectopic foci (often in pulmonary veins) trigger rapid atrial depolarization."
          },
          {
            "label": "Substrate",
            "detail": "Atrial structural remodeling (dilatation, fibrosis) creates conditions for multiple re-entrant wavelets."
          },
          {
            "label": "Conduction",
            "detail": "AV node is bombarded by rapid impulses; due to refractory periods, only some conduct to ventricles."
          },
          {
            "label": "Result",
            "detail": "Irregular ventricular rhythm (irregularly irregular pulse) and loss of atrial kick."
          }
        ]
      }
    },
    {
      "type": "bullets",
      "title": "Clinical Features",
      "icon": "🩺",
      "payload": {
        "items": [
          {
            "label": "Symptoms",
            "description": "Palpitations (most common), fatigue, reduced exercise tolerance, dizziness, or syncope if ventricular rate is extremely high."
          },
          {
            "label": "Pulse Examination",
            "description": "Irregularly irregular rhythm; pulse deficit (apical rate > peripheral pulse rate) may be present."
          },
          {
            "label": "JVP Findings",
            "description": "Absence of 'a' wave due to loss of effective atrial contraction."
          },
          {
            "label": "Cardiac Auscultation",
            "description": "Varying intensity of the first heart sound (S1) due to variable filling times; presystolic accentuation of murmurs (like in MS) is lost."
          },
          {
            "label": "Asymptomatic",
            "description": "AF can be silent and detected incidentally during routine physical exam or ECG."
          }
        ]
      }
    },
    {
      "type": "bullets",
      "title": "Complications of Atrial Fibrillation",
      "icon": "⚠️",
      "payload": {
        "items": [
          {
            "label": "Thromboembolism",
            "description": "Stasis in the left atrium leads to clot formation, which can embolize to the brain (stroke/TIA) or systemic circulation."
          },
          {
            "label": "Heart Failure",
            "description": "Tachycardia-induced cardiomyopathy or worsening of pre-existing heart failure due to loss of atrial kick and reduced diastolic filling."
          },
          {
            "label": "Hemodynamic Instability",
            "description": "Hypotension and syncope due to rapid ventricular response or loss of AV synchrony."
          },
          {
            "label": "Angina",
            "description": "Reduced coronary perfusion time during rapid tachycardia, especially in patients with underlying CAD."
          }
        ]
      }
    },
    {
      "type": "bullets",
      "title": "Management Strategy",
      "icon": "💊",
      "payload": {
        "items": [
          {
            "label": "Hemodynamic Stability",
            "description": "If AF is causing hemodynamic instability, use urgent synchronized electrical cardioversion. Treat accompanying illness and triggers; an unstable patient with AF may have another primary cause of shock."
          },
          {
            "label": "Rate Control",
            "description": "Beta blockers or diltiazem/verapamil can control rate when clinically suitable. Avoid verapamil/diltiazem in significant LV systolic dysfunction and avoid AV-nodal blockers in pre-excited AF. Digoxin is an option when other agents are unsuitable; it controls exertional rate less effectively."
          },
          {
            "label": "Rhythm Control",
            "description": "Discuss rhythm control using symptoms, AF duration, cardiac disease, patient preference and potential benefit of early treatment. Drug choice depends on structural heart disease and contraindications; flecainide is unsuitable after MI or with significant structural disease. Follow anticoagulation and thrombus-exclusion precautions before cardioversion."
          },
          {
            "label": "Anticoagulation",
            "description": "Base stroke prevention on individual risk and valve status. DOACs are generally preferred when eligible; warfarin is used with mechanical valves or moderate-to-severe rheumatic mitral stenosis and may be an alternative when DOACs are unsuitable. The usual AF INR range is 2.0–3.0; mechanical-valve targets depend on the prosthesis and risk factors."
          },
          {
            "label": "Surgical/Interventional",
            "description": "Catheter ablation for refractory cases or Maze procedure during cardiac surgery."
          }
        ]
      }
    },
    {
      "type": "table",
      "title": "Comparison: Rate vs. Rhythm Control",
      "icon": "⚖️",
      "payload": {
        "columns": [
          "Feature",
          "Rate Control",
          "Rhythm Control"
        ],
        "rows": [
          [
            "Primary Goal",
            "Symptom relief, prevent tachycardia-induced cardiomyopathy",
            "Restore and maintain sinus rhythm"
          ],
          [
            "Patient selection",
            "Based on symptoms, ventricular function and shared decisions",
            "Consider symptoms, early AF, cardiac disease and likely benefit; age alone is not decisive"
          ],
          [
            "Main Drugs",
            "Beta-blockers, CCBs, Digoxin",
            "Amiodarone, Flecainide, Ibutilide"
          ],
          [
            "Monitoring",
            "Heart rate, symptoms",
            "ECG, side effects of antiarrhythmics"
          ]
        ]
      }
    },
    {
      "type": "revision",
      "title": "Must-Write Points",
      "icon": "🏆",
      "payload": {
        "items": [
          "AF is defined by an irregularly irregular pulse and absence of P waves on ECG.",
          "Rate and rhythm control are individualized; early rhythm control may benefit selected patients.",
          "Stroke prevention follows thromboembolic risk; anticoagulation is not automatically indicated for every AF patient.",
          "Before elective cardioversion, use appropriate therapeutic anticoagulation or a thrombus-exclusion strategy; TEE is not mandatory in every case."
        ]
      }
    },
    {
      "type": "text",
      "title": "Mechanistic Basis of Irregularity",
      "icon": "🧠",
      "payload": {
        "paragraph": "The hallmark 'irregularly irregular' pulse in atrial fibrillation arises from the chaotic electrical activity in the atria. Multiple re-entrant wavelets circulate through the atrial myocardium, causing continuous, disorganized excitation. Because the AV node has a variable refractory period, it acts as a filter that allows only random impulses to penetrate to the ventricles. This stochastic conduction is why the ventricular response lacks a discernable pattern. Furthermore, the loss of the 'atrial kick'—the active contraction of the atria that contributes roughly 20-30% of ventricular filling—leads to reduced stroke volume, which is particularly detrimental in patients with diastolic dysfunction or stiff, non-compliant ventricles."
      }
    },
    {
      "type": "bullets",
      "title": "Decision Points in Anticoagulation",
      "icon": "⚖️",
      "payload": {
        "items": [
          {
            "label": "Risk Stratification",
            "description": "Utilize the CHA2DS2-VASc score to estimate annual stroke risk. Components include Congestive heart failure, Hypertension, Age (≥75 years=2 pts, 65-74=1 pt), Diabetes, Stroke/TIA/Thromboembolism history (2 pts), Vascular disease, and Sex (female=1 pt)."
          },
          {
            "label": "DOACs vs Warfarin",
            "description": "DOACs such as apixaban, rivaroxaban or dabigatran are generally preferred when eligible. Mechanical valves and moderate-to-severe rheumatic mitral stenosis require a vitamin K antagonist. Warfarin also remains an alternative when DOACs cannot be used or afforded; selection includes kidney function and interactions."
          },
          {
            "label": "Bleeding Risk Assessment",
            "description": "Before initiating anticoagulation, assess the HAS-BLED score to identify patients at high risk of major bleeding. While a high score does not contraindicate anticoagulation, it mandates closer monitoring and management of reversible bleeding factors."
          },
          {
            "label": "Bridging Therapy",
            "description": "Do not routinely bridge interrupted anticoagulation in most AF patients. Mechanical valves, recent stroke or other exceptional risks require individualized specialist planning. Interruption and resumption depend on the procedure, bleeding risk, agent and renal function; a therapeutic INR is not a universal preoperative target."
          }
        ]
      }
    },
    {
      "type": "text",
      "title": "Diagnostic Nuances and Differential Diagnosis",
      "icon": "🔍",
      "payload": {
        "paragraph": "While ECG is diagnostic, the clinical evaluation must distinguish AF from other tachyarrhythmias. Atrial flutter, for instance, typically shows a 'sawtooth' pattern on ECG, often with a 2:1 or 3:1 AV block. Multifocal Atrial Tachycardia (MAT) is characterized by at least three different P-wave morphologies and an irregular rhythm, commonly seen in severe COPD. Differentiating these is vital because the management of MAT focuses on treating the underlying respiratory distress, whereas AF management focuses on rate control and thromboembolic prophylaxis. Transthoracic echocardiography evaluates structure, valves and ventricular function. It does not reliably exclude left atrial appendage thrombus; transoesophageal imaging is used when thrombus exclusion is required for cardioversion."
      }
    },
    {
      "type": "bullets",
      "title": "Contraindications and Special Situations",
      "icon": "🚫",
      "payload": {
        "items": [
          {
            "label": "Pre-excitation Syndromes",
            "description": "In pre-excited AF, avoid AV-nodal blockers, including digoxin, verapamil, diltiazem, beta blockers, adenosine and IV amiodarone. Rapid accessory-pathway conduction can precipitate ventricular fibrillation. Use synchronized cardioversion when unstable; stable cases need specialist treatment such as procainamide or ibutilide."
          },
          {
            "label": "Post-operative AF",
            "description": "Common after cardiac surgery due to pericardial inflammation. It is often transient; management focuses on electrolyte correction (especially Potassium and Magnesium) and temporary beta-blockade, with a high likelihood of spontaneous conversion to sinus rhythm."
          },
          {
            "label": "Hyperthyroidism",
            "description": "In thyrotoxic AF, the high metabolic state makes the heart resistant to standard rate control. Beta-blockers are essential for symptom control, but the definitive treatment is the correction of the hyperthyroid state using antithyroid drugs or radioiodine."
          },
          {
            "label": "Heart Failure",
            "description": "Rate-control choice depends on ventricular function and stability. Avoid verapamil/diltiazem in significant systolic dysfunction. Beta blockers require caution during acute decompensation or hypotension; digoxin may be useful in selected patients. Rhythm control or ablation can benefit appropriately selected patients with AF and HFrEF."
          }
        ]
      }
    },
    {
      "type": "flowchart",
      "title": "Management Algorithm for Acute AF",
      "icon": "🔁",
      "payload": {
        "steps": [
          {
            "label": "Assessment",
            "detail": "Check hemodynamic stability (BP, mental status, signs of shock/ischemia)."
          },
          {
            "label": "Unstable Patient",
            "detail": "If AF is causing instability, perform urgent synchronized cardioversion; do not delay life-saving treatment to complete elective anticoagulation protocols."
          },
          {
            "label": "Stable Patient (Duration <48h)",
            "detail": "Recent onset does not eliminate stroke risk. Individualize cardioversion timing and anticoagulation using episode duration, risk factors and current guidance."
          },
          {
            "label": "Stable Patient (Duration >48h)",
            "detail": "For prolonged or uncertain-duration AF, use adequate preprocedural anticoagulation, commonly at least three weeks, or a thrombus-exclusion pathway before elective cardioversion."
          },
          {
            "label": "Maintenance",
            "detail": "Continue anticoagulation after cardioversion, generally at least four weeks, then according to ongoing risk. Correct triggers and reassess rate/rhythm goals."
          }
        ]
      }
    },
    {
      "type": "text",
      "title": "Complication Management and Long-term Follow-up",
      "icon": "🏥",
      "payload": {
        "paragraph": "The long-term sequelae of AF include tachycardia-induced cardiomyopathy, where persistent rapid rates lead to ventricular dilatation and systolic dysfunction. This is often reversible if the heart rate is controlled or sinus rhythm is restored. Follow-up for AF patients requires regular assessment of symptoms, adherence to anticoagulation, and periodic ECGs to monitor for rate control. In patients undergoing catheter ablation, follow-up focuses on the recurrence of arrhythmias. Patients must be educated on 'red flag' symptoms such as sudden onset of weakness, speech difficulty, or visual changes, which might indicate a thromboembolic event despite anticoagulation, necessitating urgent medical evaluation."
      }
    },
    {
      "type": "revision",
      "title": "Key Exam Takeaways",
      "icon": "🏆",
      "payload": {
        "items": [
          "Always calculate CHA2DS2-VASc for stroke risk and HAS-BLED for bleeding risk before starting anticoagulants.",
          "Avoid AV nodal blockers in WPW syndrome with AF; use procainamide or electrical cardioversion instead.",
          "Rhythm strategy depends on symptoms, AF duration, structural disease and patient goals; early rhythm control is not restricted to younger symptomatic patients.",
          "Thyrotoxicosis and alcohol abuse (Holiday Heart) are reversible causes that must be ruled out in new-onset AF."
        ]
      }
    }
  ]
};
