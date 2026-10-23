/**
 * ORBIT original teaching geometry. No competitor code, paths, meshes or text.
 * Arbitrary model units; x = patient left, y = superior, z = anterior.
 * This simplified surface/centreline model is NOT a segmented patient dataset.
 * Positive angles position the DETECTOR left-anterior / cranial; tube is opposite.
 */
export type Vec3 = readonly [number, number, number];
export type Dominance = 'right' | 'left';
export type CoronarySystem = 'left' | 'right';
export interface Vessel {
  id: string;
  name: string;
  parent?: string;
  system: CoronarySystem;
  points: Vec3[];
  radius: number;
  note: string;
}
export interface Angles {
  oblique: number;
  tilt: number;
}
const rad = Math.PI / 180;
export const dot = (a: Vec3, b: Vec3) =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const distance = (a: Vec3, b: Vec3) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : 0));
export const boundedAngles = (a: Angles): Angles => ({
  oblique: clamp(a.oblique, -90, 90),
  tilt: clamp(a.tilt, -45, 45),
});
export function basis(angles: Angles): { u: Vec3; v: Vec3; n: Vec3 } {
  const a = boundedAngles(angles),
    t = a.oblique * rad,
    p = a.tilt * rad;
  return {
    u: [Math.cos(t), 0, -Math.sin(t)],
    v: [-Math.sin(t) * Math.sin(p), Math.cos(p), -Math.cos(t) * Math.sin(p)],
    n: [Math.sin(t) * Math.cos(p), Math.sin(p), Math.cos(t) * Math.cos(p)],
  };
}
export function project(point: Vec3, angles: Angles): Vec3 {
  const b = basis(angles);
  return [dot(point, b.u), dot(point, b.v), dot(point, b.n)];
}
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
/** A tapered ventricular envelope, only for spatial orientation. */
export function surface(theta: number, y: number): Vec3 {
  const h = clamp(y, -1.57, 1.57),
    r = Math.sqrt(Math.max(0, 1 - (h / 1.57) ** 2));
  return [
    0.22 - 0.23 * h + 0.94 * r * Math.sin(theta * rad),
    h,
    0.67 * r * Math.cos(theta * rad),
  ];
}
function path(coords: Array<[number, number]>): Vec3[] {
  return coords.map(([t, y]) => surface(t, y));
}
/** Interpolate through (never replace) all authored branch attachment points. */
function smooth(points: Vec3[]): Vec3[] {
  const result: Vec3[] = [];
  for (let i = 0; i < points.length - 1; i++)
    for (let j = 0; j < 8; j++) {
      const a = points[Math.max(0, i - 1)],
        b = points[i],
        c = points[i + 1],
        d = points[Math.min(points.length - 1, i + 2)],
        t = j / 8;
      result.push(
        [0, 1, 2].map(
          k =>
            0.5 *
            (2 * b[k] +
              (-a[k] + c[k]) * t +
              (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t * t +
              (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t * t * t),
        ) as unknown as Vec3,
      );
    }
  result.push(points[points.length - 1]);
  return result;
}
export function coronaryTree(dominance: Dominance): Vessel[] {
  const add = (
    id: string,
    name: string,
    system: CoronarySystem,
    coords: Array<[number, number]>,
    note: string,
    parent?: string,
    radius = 0.026,
  ): Vessel => ({
    id,
    name,
    system,
    parent,
    radius,
    points: path(coords),
    note,
  });
  const tree: Vessel[] = [
    {
      id: 'LM',
      name: 'Left main coronary artery',
      system: 'left',
      radius: 0.046,
      points: [[0.04, 0.99, 0.28], surface(23, 0.79), surface(37, 0.61)],
      note: 'Arises from the left aortic sinus and divides into LAD and circumflex. A ramus intermedius is a variable third branch.',
    },
    add(
      'pLAD',
      'Proximal LAD',
      'left',
      [
        [37, 0.61],
        [27, 0.3],
        [20, 0.05],
      ],
      'Descends in the anterior interventricular groove. Diagonal branches run over the LV free wall.',
      'LM',
      0.037,
    ),
    add(
      'mLAD',
      'Mid LAD',
      'left',
      [
        [20, 0.05],
        [16, -0.3],
        [12, -0.64],
      ],
      'Continues towards the apex, giving diagonal and septal branches.',
      'pLAD',
      0.03,
    ),
    add(
      'dLAD',
      'Distal LAD',
      'left',
      [
        [12, -0.64],
        [9, -1],
        [3, -1.3],
        [-8, -1.48],
      ],
      'Approaches the apex; the extent of apical wraparound varies between people.',
      'mLAD',
      0.022,
    ),
    add(
      'D1',
      'First diagonal',
      'left',
      [
        [27, 0.3],
        [48, 0.05],
        [64, -0.28],
        [72, -0.65],
      ],
      'An oblique branch across the anterolateral left ventricle.',
      'pLAD',
    ),
    add(
      'D2',
      'Second diagonal',
      'left',
      [
        [16, -0.3],
        [35, -0.57],
        [52, -0.91],
      ],
      'A second illustrative diagonal; branch number and size are variable.',
      'mLAD',
      0.019,
    ),
    add(
      'LCx',
      'Circumflex artery',
      'left',
      [
        [37, 0.61],
        [65, 0.64],
        [95, 0.59],
        [124, 0.44],
        [145, 0.25],
      ],
      'Travels in the left atrioventricular groove and gives obtuse marginal branches.',
      'LM',
      0.034,
    ),
    add(
      'OM1',
      'First obtuse marginal',
      'left',
      [
        [95, 0.59],
        [90, 0.15],
        [81, -0.32],
        [69, -0.82],
      ],
      'Descends on the lateral LV wall from the circumflex.',
      'LCx',
    ),
    add(
      'OM2',
      'Second obtuse marginal',
      'left',
      [
        [124, 0.44],
        [121, 0.01],
        [112, -0.48],
        [98, -0.98],
      ],
      'A further illustrative lateral-wall branch.',
      'LCx',
      0.021,
    ),
    {
      id: 'pRCA',
      name: 'Proximal right coronary artery',
      system: 'right',
      radius: 0.038,
      points: [
        [-0.17, 1.02, 0.27],
        surface(-39, 0.82),
        surface(-64, 0.67),
        surface(-88, 0.5),
      ],
      note: 'Arises from the right aortic sinus, then follows the right atrioventricular groove.',
    },
    add(
      'mRCA',
      'Mid right coronary artery',
      'right',
      [
        [-88, 0.5],
        [-116, 0.35],
        [-143, 0.2],
      ],
      'Runs around the right atrioventricular groove.',
      'pRCA',
      0.032,
    ),
    add(
      'dRCA',
      'Distal right coronary artery',
      'right',
      [
        [-143, 0.2],
        [-164, 0.07],
        [-180, -0.02],
      ],
      'Approaches the crux. In this right-dominant model it supplies the PDA.',
      'mRCA',
      0.026,
    ),
    add(
      'AM',
      'Acute marginal branch',
      'right',
      [
        [-88, 0.5],
        [-78, 0.05],
        [-62, -0.45],
        [-43, -1.03],
      ],
      'Courses along the acute margin towards the RV apex.',
      'pRCA',
      0.024,
    ),
    add(
      'CON',
      'Conus branch',
      'right',
      [
        [-39, 0.82],
        [-27, 0.99],
        [-14, 1.1],
      ],
      'Illustrative conus branch. Its origin can be separate from the RCA.',
      'pRCA',
      0.019,
    ),
  ];
  // Septals leave the anterior surface and enter the septum rather than
  // pretending to be epicardial branches draped over the LV wall.
  for (const [id, t, y, parent] of [
    ['S1', 20, 0.05, 'pLAD'],
    ['S2', 16, -0.3, 'mLAD'],
  ] as const) {
    const start = surface(t, y);
    tree.push({
      id,
      name:
        id === 'S1' ? 'First septal perforator' : 'Second septal perforator',
      system: 'left',
      parent,
      radius: 0.016,
      points: [
        start,
        [start[0] - 0.12, y - 0.18, 0.26],
        [start[0] - 0.18, y - 0.36, 0.02],
      ],
      note: 'Enters the interventricular septum from the LAD; the deep course is simplified.',
    });
  }
  if (dominance === 'left') {
    tree.push(
      add(
        'dLCx',
        'Distal dominant circumflex',
        'left',
        [
          [145, 0.25],
          [164, 0.07],
          [180, -0.02],
        ],
        'Extends to the crux and supplies the PDA in this left-dominant example.',
        'LCx',
        0.028,
      ),
    );
    // A non-dominant RCA terminates before supplying the posterior IV groove.
    const distal = tree.find(v => v.id === 'dRCA')!;
    distal.points = path([
      [-143, 0.2],
      [-154, 0.12],
      [-164, 0.07],
    ]);
    distal.note =
      'This non-dominant RCA ends before the crux; the PDA comes from the circumflex.';
  }
  const system = dominance === 'right' ? 'right' : 'left';
  tree.push(
    add(
      'PDA',
      'Posterior descending artery',
      system,
      [
        [180, -0.02],
        [178, -0.42],
        [174, -0.84],
        [164, -1.24],
        [150, -1.46],
      ],
      'Descends in the posterior interventricular groove. Its parent artery defines dominance in this simplified two-pattern model.',
      dominance === 'right' ? 'dRCA' : 'dLCx',
      0.026,
    ),
  );
  tree.push(
    add(
      'PL',
      'Posterolateral branch',
      system,
      [
        [180, -0.02],
        [157, -0.26],
        [140, -0.62],
        [126, -1.02],
      ],
      'Illustrative branch supplying the posterior LV; real posterolateral branching varies.',
      dominance === 'right' ? 'dRCA' : 'dLCx',
      0.021,
    ),
  );
  return tree.map(v => ({ ...v, points: smooth(v.points) }));
}
export function arcLength(points: readonly Vec3[]) {
  return points.slice(1).reduce((sum, p, i) => sum + distance(p, points[i]), 0);
}
export function foreshortening(points: readonly Vec3[], angles: Angles) {
  const len = arcLength(points);
  if (len === 0) return 0;
  const projected = points.map(p => {
    const q = project(p, angles);
    return [q[0], q[1], 0] as Vec3;
  });
  return clamp(100 * (1 - arcLength(projected) / len), 0, 100);
}
/** Exclude shared junctions: apparent crossings are NOT lumen overlap %. */
export function crossingCount(
  target: Vessel,
  others: Vessel[],
  angles: Angles,
) {
  const a = target.points.map(p => project(p, angles));
  let count = 0;
  for (const other of others) {
    if (other.id === target.id) continue;
    const b = other.points.map(p => project(p, angles));
    let crosses = false;
    for (let i = 1; i < a.length; i++)
      for (let j = 1; j < b.length; j++) {
        const p = a[i - 1],
          q = a[i],
          r = b[j - 1],
          s = b[j];
        const dx = q[0] - p[0],
          dy = q[1] - p[1],
          ex = s[0] - r[0],
          ey = s[1] - r[1];
        const det = dx * ey - dy * ex;
        if (Math.abs(det) < 1e-9) continue;
        const u = ((r[0] - p[0]) * ey - (r[1] - p[1]) * ex) / det;
        const v = ((r[0] - p[0]) * dy - (r[1] - p[1]) * dx) / det;
        if (u > 0.025 && u < 0.975 && v > 0.025 && v < 0.975) crosses = true;
      }
    if (crosses) count++;
  }
  return count;
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
      'A near-AP cranial view is useful for separating LAD, diagonal and septal branches. Follow the selected branch in both images.',
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
    title: 'Di Mario & Sutaria · Heart, 2005',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1768997/',
  },
  {
    title: 'Tools & Techniques · EuroIntervention, 2010',
    url: 'https://eurointervention.pcronline.com/article/tools-and-techniques-angiographic-views',
  },
];
