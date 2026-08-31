import type { NotesContent } from '@/lib/handwrittenNotes';

/**
 * The TCA cycle note, exactly as `handwritten_notes` holds it.
 *
 * PREVIEW ONLY — Metro never sees this file.
 *
 * It exists to review the one thing a screenshot can show and a check script
 * cannot: what the reader actually sees at the top of a note. This question is
 * the one that was reported — it opened with **three** diagram cards, headed
 * "High-Yield Visual Exam Diagram (1/3)" showing Glycolysis and "(2/3)"
 * showing Gluconeogenesis, before reaching its own.
 *
 * The body below is copied from the live row (`single::biochemistry::d6k6pc`)
 * rather than written by hand, for the reason `notesSample.ts` records: a
 * fixture written to match the code tests nothing. The diagram section is
 * **not** in it — the preview screen builds that with the app's own
 * `applyQuestionDiagrams`, so what is on screen is what the phone would draw.
 */
export const TCA_QUESTION =
  'TCA cycle – definition, sequence of reaction, energetics, regulation***';

/**
 * What `findDiagramsForQuestion` returns for that question against production.
 * One row, because `question_diagrams` holds one row for it. Hard-coded here
 * only because the sandbox is firewalled from Supabase; the real lookup is
 * exercised against these same rows by `npm run check:diagrams`.
 */
export const TCA_DIAGRAMS = [
  {
    url: 'https://pmtgeydtqypwrypshhsx.supabase.co/storage/v1/object/public/diagrams/biochemistry/tca_cycle_amphibolic_anaplerosis.jpg',
    title: TCA_QUESTION,
  },
];

export const TCA_NOTE: NotesContent = {
  highYieldTip:
    "Remember the 'Amphibolic' nature: it acts as both a catabolic pathway (energy generation) and an anabolic pathway (source of precursors like succinyl CoA for heme and oxaloacetate for amino acids).",
  pyqYears: ['ESSAY'],
  sections: [
    {
      icon: '📌',
      type: 'definition',
      title: 'Definition',
      payload: {
        text: 'The TCA cycle (also known as the Krebs cycle or Citric Acid cycle) is the final common oxidative pathway for the oxidation of carbohydrates, fats, and amino acids. It occurs in the mitochondrial matrix and involves the complete oxidation of acetyl CoA into two molecules of CO2, while trapping chemical energy.',
      },
    },
    {
      icon: '🔁',
      type: 'flowchart',
      title: 'Sequence of Reactions',
      payload: {
        steps: [
          {
            label: 'Condensation',
            detail:
              'Acetyl CoA (2C) + Oxaloacetate (4C) → Citrate (6C) catalyzed by Citrate Synthase.',
          },
          {
            label: 'Isomerization',
            detail:
              'Citrate → Isocitrate via Aconitase (involves cis-aconitate intermediate).',
          },
          {
            label: 'Oxidative Decarboxylation I',
            detail:
              'Isocitrate → alpha-Ketoglutarate + CO2 + NADH via Isocitrate Dehydrogenase.',
          },
          {
            label: 'Oxidative Decarboxylation II',
            detail:
              'alpha-Ketoglutarate → Succinyl CoA + CO2 + NADH via alpha-Ketoglutarate Dehydrogenase complex.',
          },
          {
            label: 'Substrate Level Phosphorylation',
            detail:
              'Succinyl CoA → Succinate + GTP (or ATP) via Succinyl CoA Synthetase.',
          },
          {
            label: 'Dehydrogenation',
            detail: 'Succinate → Fumarate + FADH2 via Succinate Dehydrogenase.',
          },
          { label: 'Hydration', detail: 'Fumarate → Malate via Fumarase.' },
          {
            label: 'Regeneration',
            detail: 'Malate → Oxaloacetate + NADH via Malate Dehydrogenase.',
          },
        ],
      },
    },
    {
      icon: '⚡',
      type: 'bullets',
      title: 'Energetics (Per Acetyl CoA)',
      payload: {
        items: [
          {
            label: 'NADH Production',
            description:
              '3 NADH molecules are produced (at steps 3, 4, and 8), yielding 3 x 2.5 = 7.5 ATP.',
          },
          {
            label: 'FADH2 Production',
            description:
              '1 FADH2 molecule is produced (at step 6), yielding 1.5 ATP.',
          },
          {
            label: 'Substrate Level Phosphorylation',
            description: '1 GTP (equivalent to 1 ATP) is produced at step 5.',
          },
          {
            label: 'Total Yield',
            description: 'Total energy yield per acetyl CoA is 10 ATP.',
          },
        ],
      },
    },
  ],
};
