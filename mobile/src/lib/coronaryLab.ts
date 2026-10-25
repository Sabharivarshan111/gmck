/** Detector angle controls and teaching presets; anatomy comes from the licensed GLB. */
export type CoronarySystem = 'left' | 'right';
export interface Angles {
  oblique: number;
  tilt: number;
}
export const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : 0));
export const boundedAngles = (a: Angles): Angles => ({
  oblique: clamp(a.oblique, -90, 90),
  tilt: clamp(a.tilt, -45, 45),
});
export function angleLabel(a: Angles) {
  const b = boundedAngles(a);
  return `${
    b.oblique === 0
      ? 'AP'
      : `${b.oblique > 0 ? 'LAO' : 'RAO'} ${Math.abs(b.oblique)}°`
  } · ${
    b.tilt === 0
      ? 'level'
      : `${b.tilt > 0 ? 'cranial' : 'caudal'} ${Math.abs(b.tilt)}°`
  }`;
}
export const CORONARY_VIEWS: Array<
  Angles & {
    id: string;
    title: string;
    system: CoronarySystem;
    teaching: string;
  }
> = [
  {
    id: 'bifurcation',
    title: 'Left main bifurcation',
    system: 'left',
    oblique: 45,
    tilt: -30,
    teaching:
      'An LAO caudal projection is commonly used to open the left main bifurcation. Compare the LAD and circumflex origins as you adjust the angle.',
  },
  {
    id: 'lateral-wall',
    title: 'Circumflex & marginals',
    system: 'left',
    oblique: -30,
    tilt: -30,
    teaching:
      'RAO caudal views help examine the circumflex and obtuse marginal branches. A useful angle in one person may be suboptimal in another.',
  },
  {
    id: 'anterior',
    title: 'LAD & diagonals',
    system: 'left',
    oblique: -10,
    tilt: 40,
    teaching:
      'A near-AP cranial view is useful for separating LAD, diagonal and septal branches. Follow the selected branch in the anatomy and projection views.',
  },
  {
    id: 'proximal',
    title: 'Proximal LAD',
    system: 'left',
    oblique: 40,
    tilt: 30,
    teaching:
      'LAO cranial is a useful complementary LAD view. Multiple projections help reveal vessel course hidden by a single image.',
  },
  {
    id: 'right-course',
    title: 'RCA course',
    system: 'right',
    oblique: 50,
    tilt: 0,
    teaching:
      'LAO commonly displays the proximal and mid RCA course. Switch to RAO to compare how the same artery changes apparent shape.',
  },
  {
    id: 'right-distal',
    title: 'RCA complementary view',
    system: 'right',
    oblique: -30,
    tilt: 0,
    teaching:
      'RAO provides a complementary view of the RCA. Dominance determines which system continues into the posterior descending artery.',
  },
];
export const CORONARY_REFERENCES = [
  {
    title: '3D source · OrganUI Heart',
    url: 'https://github.com/organui/heart-3d',
  },
  {
    title: 'BodyParts3D · DBCLS attribution and licence',
    url: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
  },
  {
    title: 'Model licence · CC BY 4.0',
    url: 'https://creativecommons.org/licenses/by/4.0/',
  },
  {
    title: 'Di Mario & Sutaria · Heart, 2005',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1768997/',
  },
  {
    title: 'Tools & Techniques · EuroIntervention, 2010',
    url: 'https://eurointervention.pcronline.com/article/tools-and-techniques-angiographic-views',
  },
];
