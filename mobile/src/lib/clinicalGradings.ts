import type { LabValue } from './labValues';

export const CLUBBING_GRADES: LabValue = {
  name: 'Clubbing — bedside grading',
  conventional: 'Describe the findings as well as the grade',
  variants: [
    { label: 'Grade 1', value: 'Soft, spongy nail bed with increased fluctuation.' },
    { label: 'Grade 2', value: 'Loss of the normal nail-fold angle; the profile becomes straight or exceeds 180 degrees.' },
    { label: 'Grade 3', value: 'Increased nail curvature with bulbous enlargement of the fingertip: a drumstick appearance.' },
    { label: 'Associated finding', value: 'Hypertrophic osteoarthropathy: clubbing with painful swollen joints and periosteal new bone. Some bedside teaching schemes call this grade 4; it is an associated syndrome, not inevitable progression.' },
  ],
  note: 'Teaching schemes differ. Record the grading convention, fingers/toes affected, symmetry, nail-bed fluctuation, profile angle and Schamroth window. A lost diamond-shaped window supports clubbing; do not infer the cause from its grade.',
  source: 'https://www.ncbi.nlm.nih.gov/books/NBK539713/',
};
export const OEDEMA_GRADES: LabValue = {
  name: 'Pitting oedema — bedside grading',
  conventional: 'Use the same site, pressure and grading convention when comparing visits',
  variants: [
    { label: '1+', value: 'Shallow indentation, approximately 2 millimetres; resolves quickly.' },
    { label: '2+', value: 'Approximately 4 millimetres deep; takes longer to disappear.' },
    { label: '3+', value: 'Approximately 6 millimetres deep; persists, with visible swelling.' },
    { label: '4+', value: 'Deep indentation, approximately 8 millimetres, with marked swelling and prolonged recovery.' },
  ],
  note: 'This is a common descriptive convention, not a precise fluid-volume measurement. Record the site, extent, symmetry, whether pitting is present, and observed recovery time. Grading systems and recovery-time thresholds differ.',
  source: 'https://www.ncbi.nlm.nih.gov/books/NBK554452/',
};
export const CLINICAL_GRADINGS: LabValue[] = [
  {
    name: 'New York Heart Association functional classification',
    aliases: ['NYHA', 'dyspnoea', 'breathlessness'],
    conventional: 'Classes I–IV describe activity limitation in heart disease',
    variants: [
      { label: 'Class I', value: 'Usual daily activity causes no limiting breathlessness, fatigue or palpitations.' },
      { label: 'Class II', value: 'Comfortable at rest, but ordinary activity provokes symptoms: mild activity limitation.' },
      { label: 'Class III', value: 'Comfortable at rest; activities easier than the usual daily workload provoke symptoms: marked limitation.' },
      { label: 'Class IV', value: 'Symptoms are present even at rest, and exertion makes them worse.' },
    ],
    note: 'Ask how far the patient walks, how many stairs they manage and which daily tasks cause symptoms. Record an example, the class and whether this is their current or baseline state. These functional classes are different from heart-failure stages A–D.',
    source: 'https://www.heart.org/en/health-topics/heart-failure/what-is-heart-failure/classes-of-heart-failure',
  },
  CLUBBING_GRADES,
  OEDEMA_GRADES,
  {
    name: 'Glasgow Coma Scale — component scores',
    aliases: ['GCS', 'consciousness'],
    conventional: 'Record eye opening, verbal response and motor response separately',
    variants: [
      { label: 'Eye opening', value: '4: opens without stimulation; 3: opens to sound; 2: opens to pressure; 1: no opening.' },
      { label: 'Verbal response', value: '5: orientated; 4: confused conversation; 3: recognisable words; 2: sounds only; 1: no verbal response.' },
      { label: 'Motor response', value: '6: follows commands; 5: localises the stimulus; 4: normal flexion or withdrawal; 3: abnormal flexion; 2: extension; 1: no movement.' },
    ],
    note: 'Total range is 3–15 when all components can be tested. Record “not testable” with the reason, such as intubation, rather than assigning an invented score. Document sedation and other assessment limitations.',
    source: 'https://www.glasgowcomascale.org/what-is-gcs/',
  },
];
