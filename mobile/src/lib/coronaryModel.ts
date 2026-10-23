/** Select only source-backed mesh groups. No authored substitute anatomy. */
export interface CoronaryMeshGroup {
  id: string;
  name: string;
  system: 'left' | 'right';
  sourceIds: readonly string[];
  note: string;
}
export const CORONARY_MESH_GROUPS: CoronaryMeshGroup[] = [
  {
    id: 'LM',
    name: 'Left main coronary artery',
    system: 'left',
    sourceIds: ['FJ2737'],
    note: 'The source left coronary trunk divides into anterior interventricular and circumflex branches.',
  },
  {
    id: 'LAD',
    name: 'LAD / anterior interventricular artery',
    system: 'left',
    sourceIds: ['FJ2631'],
    note: 'The actual source trunk in the anterior interventricular groove. No invented proximal/mid/distal boundary is drawn.',
  },
  {
    id: 'DIAG',
    name: 'Diagonal branches',
    system: 'left',
    sourceIds: [
      'FJ2633',
      'FJ2634',
      'FJ2635',
      'FJ2636',
      'FJ2637',
      'FJ2638',
      'FJ2639',
      'FJ2640',
      'FJ2642',
      'FJ2648',
    ],
    note: 'Source-labelled diagonal branches. The atlas does not identify these as clinical D1 or D2, so ordinal labels are not invented.',
  },
  {
    id: 'LCx',
    name: 'Circumflex branches',
    system: 'left',
    sourceIds: ['FJ2649', 'FJ2650', 'FJ2651', 'FJ2652', 'FJ2653', 'FJ2654'],
    note: 'Source circumflex meshes wrap around the left atrioventricular groove. Source metadata does not reliably separate obtuse marginal branches.',
  },
  {
    id: 'LBR',
    name: 'Other left coronary branches',
    system: 'left',
    sourceIds: [
      'FJ2632',
      'FJ2641',
      'FJ2643',
      'FJ2644',
      'FJ2645',
      'FJ2646',
      'FJ2647',
    ],
    note: 'Additional source-labelled anterior and conus branches of the left coronary tree. Exact FMA names are retained in the model receipt.',
  },
  {
    id: 'RCA',
    name: 'Right coronary artery trunk',
    system: 'right',
    sourceIds: ['FJ2723'],
    note: 'The source right coronary trunk follows the right atrioventricular groove.',
  },
  {
    id: 'AM',
    name: 'Right marginal branches',
    system: 'right',
    sourceIds: ['FJ2667', 'FJ2668', 'FJ2672', 'FJ2674', 'FJ2675'],
    note: 'Actual source marginal-branch meshes on the right side of the heart.',
  },
  {
    id: 'CON',
    name: 'Right conus artery',
    system: 'right',
    sourceIds: ['FJ2670', 'FJ2676'],
    note: 'The atlas labels these source meshes right conus artery. Origins can vary between people.',
  },
  {
    id: 'RANT',
    name: 'Right anterior ventricular branches',
    system: 'right',
    sourceIds: ['FJ2671', 'FJ2673', 'FJ2677'],
    note: 'Source-labelled anterior ventricular branches of the right coronary artery.',
  },
  {
    id: 'PDA',
    name: 'Posterior descending artery branches',
    system: 'right',
    sourceIds: [
      'FJ2692',
      'FJ2693',
      'FJ2694',
      'FJ2695',
      'FJ2696',
      'FJ2697',
      'FJ2698',
      'FJ2699',
      'FJ2700',
    ],
    note: 'These source posterior interventricular branches belong to the RCA. This fixed reference does not morph into an invented left-dominant variant.',
  },
  {
    id: 'POST',
    name: 'Right posterior ventricular branches',
    system: 'right',
    sourceIds: [
      'FJ2714',
      'FJ2715',
      'FJ2716',
      'FJ2717',
      'FJ2718',
      'FJ2719',
      'FJ2720',
      'FJ2721',
      'FJ2722',
    ],
    note: 'Actual posterior ventricular branches from the source right coronary tree.',
  },
];
export interface CoronarySceneConfig {
  angles: { oblique: number; tilt: number };
  mode: 'anatomy' | 'projection' | 'room';
  selected: string;
  system: 'both' | 'left' | 'right';
  shell: boolean;
  labels: boolean;
  zoom: number;
  reset: number;
  active: boolean;
}
