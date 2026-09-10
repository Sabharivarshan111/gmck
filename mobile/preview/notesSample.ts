import type { NotesContent } from '@/lib/handwrittenNotes';

/**
 * A fixture for reviewing the handwritten-notes renderer.
 *
 * PREVIEW ONLY. Nothing in `preview/` is bundled into the APK — Metro never
 * sees this file. It exists because the real notes come from the
 * generate-handwritten-notes edge function, which costs AI quota, takes minutes
 * for a large topic (batches of 10 with 25-second pauses), and is unreachable
 * from a sandbox. Reviewing a layout change should not require any of that.
 *
 * It deliberately exercises every branch in NotesContentView — definition,
 * text, bullets, steps, morphology, comparison, table, flowchart, outcome,
 * revision — plus the high-yield banner and the PYQ badges, so a regression in
 * any one of them shows up.
 *
 * **The item shapes here are the edge function's, not the renderer's.** This
 * file used to hold plain strings where the function emits objects — a bullet
 * is `{ label, description }`, a step is `{ title, description, keyTrigger? }`,
 * a flowchart node is `{ label, detail }` — and the renderer had been written
 * to match the fixture rather than the contract. The result was a demo screen
 * that looked perfect while real notes rendered the literal text
 * `[object Object]` on a phone. A fixture that agrees with the code it is
 * testing tests nothing; the shapes below are copied from the prompt schema in
 * supabase/functions/generate-handwritten-notes/index.ts, and
 * `npm run check:notes-schema` fails if they drift apart again.
 *
 * ## The diagram is a parameter, never a URL
 *
 * This fixture used to embed a `supabase.co/storage/...` link for its diagram
 * section. Nothing in a sandbox can reach that host, and the object it named
 * no longer exists in the bucket in any case, so `DiagramCard` fell to its
 * error branch and drew **"This diagram could not be loaded."** — inside the
 * screenshot the ad renderer uses for every note shot in every ad. It reached
 * a published cut and the app's owner reported it twice.
 *
 * The fix is that a fixture may not depend on the network. `sampleNotes()`
 * takes the picture to draw; `SAMPLE_NOTES` keeps the old name and passes a
 * drawn stand-in, so a caller that says nothing gets something that always
 * renders. `preview/main.tsx` hands it the real downloaded plate when the
 * harness is asked for `plates=real`, which is the mode the ad captures use.
 *
 * The content is standard textbook material on myocardial infarction, matching
 * the first essay in Final Year → General Medicine → Cardiology. It is a
 * rendering fixture, not teaching material, and is never shown to a user.
 */
/**
 * The picture the fixture draws when the caller does not supply one.
 *
 * A data URI rather than a file, for the same reason the chapter-diagram
 * stand-ins are drawn: it cannot 404, it cannot be blocked by an egress
 * gateway, and it renders identically in the harness and on a phone. It is
 * captioned as a stand-in on its face so that a stand-in can never be mistaken
 * for a real plate in a screenshot — which is the other half of the bug this
 * replaces, where a blank white box captioned "Types of synovial joint" went
 * out in an ad looking like a failed diagram.
 */
const DRAWN_STAND_IN =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420">' +
      '<rect width="640" height="420" fill="#0f172a"/>' +
      '<rect x="20" y="20" width="600" height="380" fill="none" stroke="#334155" stroke-width="2" stroke-dasharray="8 8"/>' +
      '<text x="320" y="200" font-family="Georgia,serif" font-size="26" text-anchor="middle" fill="#94a3b8">Renderer stand-in</text>' +
      '<text x="320" y="240" font-family="Georgia,serif" font-size="16" text-anchor="middle" fill="#64748b">pass a plate URL to draw a real one</text>' +
      '</svg>',
  );

/**
 * The fixture, with a diagram of the caller's choosing.
 *
 * ## Why the alt text is a parameter too
 *
 * `formatDiagramHeading` picks the card's heading in three steps: an explicit
 * title, then the alt text, then — if both are generic — the image's own
 * filename, prettified. The edge function's alt text is literally
 * "High-Yield Exam Diagram", which that function is written to reject, so in
 * the app the heading a reader sees is almost always the **filename** of the
 * plate: `tca_cycle_amphibolic_anaplerosis.jpg` reads out as "Tca Cycle
 * Amphibolic Anaplerosis".
 *
 * The ad renderer's copies of those plates are renamed on the way down
 * (`plate-tca-cycle.jpg`), so the same code would head the card "Plate Tca
 * Cycle" — a name that exists only inside the capture pipeline and that no
 * reader of the app will ever see. Putting a real diagram title in the alt
 * text makes the screenshot show what the app shows, rather than what the
 * harness happens to have called the file.
 *
 * @param diagramUrl what the diagram section should draw. Anything `Image`
 *   accepts: a downloaded plate under `/plates/`, or the drawn stand-in.
 * @param diagramAlt the markdown alt text. Defaults to the generic string the
 *   edge function really emits, so the default fixture stays faithful to the
 *   contract it exists to test.
 */
export const sampleNotes = (
  diagramUrl: string = DRAWN_STAND_IN,
  diagramAlt: string = 'High-Yield Exam Diagram',
): NotesContent => ({

  highYieldTip:
    '**Troponin** is the most sensitive and specific marker. It rises at 3–4 hours, peaks at 24 hours and stays elevated for up to 10 days — so it is the marker of choice for late presentation.',
  pyqYears: ['2023', '2021', '2019', '2017'],
  sections: [
    {
      // Exactly what generate-handwritten-notes prepends when it finds a match
      // in the question_diagrams table: a *definition* section whose text is
      // image markdown followed by a caption. It is not a 'diagram' section,
      // so the renderer only shows the picture if prose handles markdown —
      // which is why this sits in the fixture rather than a diagram section.
      type: 'definition',
      title: 'High-Yield Visual Exam Diagram',
      icon: '🎨',
      payload: {
        text: '![' + diagramAlt + '](' + diagramUrl + ')\n\n💡 High-Yield Continuous Visual Mnemonic (Standard Textbook Grounded)',
      },
    },
    {
      type: 'definition',
      title: 'Definition',
      payload: {
        text: 'Myocardial infarction is irreversible necrosis of heart muscle resulting from prolonged ischaemia, usually caused by acute thrombotic occlusion of a coronary artery following atherosclerotic plaque rupture.',
      },
    },
    {
      type: 'bullets',
      title: 'Risk factors',
      pyqYears: ['FEB 23', 'AUG 21', 'FEB 19'],
      payload: {
        items: [
          {
            label: 'Modifiable',
            description:
              'Smoking, hypertension, diabetes mellitus, dyslipidaemia, obesity, sedentary lifestyle.',
          },
          {
            label: 'Non-modifiable',
            description:
              'Age, male sex, family history of premature coronary artery disease.',
          },
          {
            label: 'Strongest in India',
            description:
              '**Smoking** and **diabetes** carry the highest attributable risk in the Indian population.',
          },
        ],
      },
    },
    {
      type: 'flowchart',
      title: 'Pathogenesis',
      payload: {
        steps: [
          {
            label: 'Plaque formation',
            detail: 'An atherosclerotic plaque builds up in a coronary artery.',
          },
          {
            label: 'Rupture',
            detail: 'The plaque becomes unstable and its fibrous cap tears.',
          },
          {
            label: 'Platelet aggregation',
            detail: 'Platelets adhere to and aggregate over the exposed lipid core.',
          },
          { label: 'Thrombosis', detail: 'An occlusive thrombus forms.' },
          {
            label: 'Necrosis',
            detail: 'Ischaemia causes myocyte necrosis within 20–40 minutes.',
          },
        ],
      },
    },
    {
      type: 'comparison',
      title: 'STEMI vs NSTEMI',
      pyqYears: ['AUG 22', 'FEB 18'],
      payload: {
        left: 'STEMI',
        right: 'NSTEMI',
        rows: [
          { label: 'Occlusion', left: 'Complete', right: 'Partial' },
          {
            label: 'ECG',
            left: 'ST elevation, later Q waves',
            right: 'ST depression or T inversion',
          },
          { label: 'Depth', left: 'Transmural necrosis', right: 'Subendocardial necrosis' },
          {
            label: 'Management',
            left: 'Immediate reperfusion',
            right: 'Risk-stratify, then angiography',
          },
        ],
      },
    },
    {
      type: 'table',
      title: 'Cardiac markers',
      payload: {
        columns: ['Marker', 'Rises', 'Peaks', 'Returns'],
        rows: [
          ['Troponin I/T', '3–4 h', '24 h', '7–10 days'],
          ['CK-MB', '4–6 h', '24 h', '48–72 h'],
          ['Myoglobin', '1–2 h', '6–8 h', '24 h'],
          ['LDH', '12–24 h', '3 days', '10–14 days'],
        ],
      },
    },
    {
      type: 'morphology',
      title: 'Morphology',
      payload: {
        subtitle: 'Gross and microscopic changes with time',
        items: [
          {
            title: '0–12 hours',
            details: ['No gross change', 'Wavy fibres microscopically'],
          },
          {
            title: '12–24 hours',
            tag: 'CLASSIC',
            details: ['Pallor', 'Contraction band necrosis', 'Early neutrophils'],
          },
          {
            title: '1–3 days',
            details: ['Yellow centre', 'Dense neutrophilic infiltrate'],
          },
          {
            title: '3–7 days',
            tag: 'COMMON',
            details: ['Hyperaemic border', 'Macrophages clear necrotic myocytes'],
          },
          { title: '1–2 weeks', details: ['Granulation tissue at the margins'] },
          { title: 'Over 2 months', details: ['Dense collagenous scar'] },
        ],
      },
    },
    {
      type: 'steps',
      title: 'Immediate management',
      payload: {
        items: [
          {
            title: 'Stabilise',
            description: 'Airway, breathing, circulation; continuous ECG monitoring and IV access.',
          },
          {
            title: 'Antiplatelets',
            description:
              'Aspirin 300 mg chewed, plus a second antiplatelet (clopidogrel or ticagrelor).',
          },
          {
            title: 'Analgesia',
            description: 'Sublingual nitrate for pain, morphine if pain persists.',
          },
          {
            title: 'Oxygen',
            description: 'Only if saturation is below 90 per cent.',
            keyTrigger: 'SpO2 under 90%',
          },
          {
            title: 'Reperfusion',
            description: 'Primary PCI within 90 minutes, or thrombolysis if PCI is unavailable.',
            keyTrigger: 'Door-to-balloon 90 minutes',
          },
          {
            title: 'Secondary prevention',
            description: 'Start a beta blocker, statin and ACE inhibitor once stable.',
          },
        ],
      },
    },
    {
      type: 'bullets',
      title: 'Complications',
      payload: {
        items: [
          {
            label: 'Arrhythmias',
            description: 'Ventricular fibrillation is the commonest cause of early death.',
          },
          {
            label: 'Pump failure',
            description: 'Cardiogenic shock and acute left ventricular failure.',
          },
          {
            label: 'Mechanical',
            description:
              'Papillary muscle rupture, ventricular septal rupture, free wall rupture.',
          },
          {
            label: 'Dressler syndrome',
            description: 'Autoimmune pericarditis weeks after the event.',
          },
          {
            label: 'Late',
            description: 'Ventricular aneurysm and mural thrombus.',
          },
        ],
      },
    },
    {
      type: 'outcome',
      title: 'Prognosis',
      payload: {
        text: 'Early reperfusion is the single strongest determinant of outcome. Mortality falls sharply when the artery is opened within the first two hours — hence "time is muscle".',
      },
    },
    {
      type: 'revision',
      title: 'Last-minute revision',
      payload: {
        items: [
          'Troponin — most sensitive and specific; CK-MB is best for re-infarction',
          'VF is the commonest cause of death in the first hour',
          'Door-to-balloon target is 90 minutes',
          'Free wall rupture occurs 3–7 days in, when the infarct is softest',
        ],
      },
    },
  ],
});

/**
 * The fixture with the drawn stand-in, under the name every existing caller
 * already imports.
 *
 * Kept as a value rather than made a function call at each site so that
 * `check:notes-schema`, which reads this file as text and asserts every
 * section key is exercised, keeps working unchanged.
 */
export const SAMPLE_NOTES: NotesContent = sampleNotes();
