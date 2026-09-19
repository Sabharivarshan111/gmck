// A software rasteriser for the BodyParts3D atlas.
//
// There is no emulator and no browser WebGL in an agent sandbox, and `npm ci`
// is refused by the egress proxy so there is no three.js either. But the atlas
// is plain data — `atlas.json` names every part's byte offsets, and the
// `body-N.bin.gz` chunks hold Float32 positions, Int16 normals and Uint32
// indices — and a z-buffered triangle fill is fifty lines.
//
// This is deliberately NOT a picture of the app. It is a picture of the data
// the resolver returns: no lighting rig, no tone mapping, no camera controls,
// no shader. So when an organ looks wrong here, the geometry or the lookup is
// wrong, and when it looks right here and wrong in the app, the renderer is.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

/** Colour per system, matching SYSTEMS in src/simulator/data/atlasTypes.ts. */
export const SYSTEM_COLOR = {
  skeletal: [226, 217, 186],
  muscular: [150, 67, 54],
  cardiac: [185, 28, 28],
  sensory: [2, 132, 199],
  arterial: [220, 38, 38],
  venous: [37, 99, 235],
  nervous: [234, 179, 8],
  respiratory: [56, 189, 248],
  digestive: [194, 65, 12],
  urinary: [154, 52, 18],
  lymphatic: [22, 163, 74],
  endocrine: [217, 70, 239],
  reproductive: [190, 24, 93],
  integumentary: [214, 158, 133],
  connective: [203, 213, 225],
};

export function loadAtlas(root) {
  const atlas = JSON.parse(fs.readFileSync(path.join(root, 'public/models/atlas.json'), 'utf8'));
  const chunks = atlas.chunks.map((c) =>
    zlib.gunzipSync(fs.readFileSync(path.join(root, 'public', c.gzip)))
  );
  return { atlas, chunks };
}

/** Every triangle of the named parts, as flat world-space arrays. */
export function collectTriangles(atlas, chunks, ids) {
  const wanted = ids instanceof Set ? ids : new Set(ids);
  const tris = [];
  for (const p of atlas.parts) {
    if (!wanted.has(p.id)) continue;
    const buf = chunks[p.chunk];
    const pos = new Float32Array(buf.buffer, buf.byteOffset + p.positions, p.vertexCount * 3);
    const idx = new Uint32Array(buf.buffer, buf.byteOffset + p.indices, p.indexCount);
    tris.push({ pos, idx, color: SYSTEM_COLOR[p.system] ?? [200, 200, 200] });
  }
  return tris;
}

/** Axis-aligned bounds of a set of parts, from the manifest rather than the mesh. */
export function boundsOf(atlas, ids) {
  const wanted = ids instanceof Set ? ids : new Set(ids);
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const p of atlas.parts) {
    if (!wanted.has(p.id) || !p.bounds) continue;
    for (let a = 0; a < 3; a++) {
      lo[a] = Math.min(lo[a], p.bounds[0][a]);
      hi[a] = Math.max(hi[a], p.bounds[1][a]);
    }
  }
  return lo[0] === Infinity ? null : { lo, hi };
}

/**
 * Orthographic render, z-buffered, Lambert-shaded from one key light.
 *
 * `view` is 'anterior' (looking along -z) or 'lateral' (along -x). Anything
 * fancier would be a renderer nobody asked for; these two are what an anatomy
 * plate uses.
 */
export function render(tris, box, { width = 480, height = 600, view = 'anterior', bg = [12, 17, 26], pad = 0.08 } = {}) {
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    rgb[i * 3] = bg[0]; rgb[i * 3 + 1] = bg[1]; rgb[i * 3 + 2] = bg[2];
  }
  if (!box) return rgb;
  // -Infinity, not Infinity: larger z is nearer the viewer here, so the test
  // below keeps the greatest z. Filled the other way, nothing ever passes and
  // every sheet comes out an empty rectangle.
  const depth = new Float32Array(width * height).fill(-Infinity);

  // Screen axes. y is up in the atlas, so it is negated on the way to pixels.
  const ax = view === 'lateral' ? 2 : 0;
  const ay = 1;
  const az = view === 'lateral' ? 0 : 2;
  const flipX = view === 'lateral' ? -1 : 1;

  const spanX = (box.hi[ax] - box.lo[ax]) || 1e-6;
  const spanY = (box.hi[ay] - box.lo[ay]) || 1e-6;
  const cx = (box.hi[ax] + box.lo[ax]) / 2;
  const cy = (box.hi[ay] + box.lo[ay]) / 2;
  // One scale for both axes, so nothing is stretched.
  const scale = Math.min(width * (1 - pad * 2) / spanX, height * (1 - pad * 2) / spanY);

  const project = (x, y, z) => [
    width / 2 + (x - cx) * flipX * scale,
    height / 2 - (y - cy) * scale,
    z,
  ];

  // Key light from the upper front left, like the app's rig.
  const L = [-0.45, 0.6, 0.66];
  const Ln = Math.hypot(...L);

  for (const { pos, idx, color } of tris) {
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
      const p0 = project(pos[a + ax], pos[a + ay], pos[a + az]);
      const p1 = project(pos[b + ax], pos[b + ay], pos[b + az]);
      const p2 = project(pos[c + ax], pos[c + ay], pos[c + az]);

      const minX = Math.max(0, Math.floor(Math.min(p0[0], p1[0], p2[0])));
      const maxX = Math.min(width - 1, Math.ceil(Math.max(p0[0], p1[0], p2[0])));
      const minY = Math.max(0, Math.floor(Math.min(p0[1], p1[1], p2[1])));
      const maxY = Math.min(height - 1, Math.ceil(Math.max(p0[1], p1[1], p2[1])));
      if (minX > maxX || minY > maxY) continue;

      // Face normal in world space, for flat shading.
      const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
      const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl; ny /= nl; nz /= nl;
      // Two-sided: these meshes are not reliably wound, and a black facet is
      // worse than a slightly flat one.
      const lambert = Math.abs((nx * L[0] + ny * L[1] + nz * L[2]) / Ln);
      const shade = 0.30 + 0.70 * lambert;

      const area = (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p2[0] - p0[0]) * (p1[1] - p0[1]);
      if (Math.abs(area) < 1e-12) continue;

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const px = x + 0.5, py = y + 0.5;
          const w0 = ((p1[0] - px) * (p2[1] - py) - (p2[0] - px) * (p1[1] - py)) / area;
          const w1 = ((p2[0] - px) * (p0[1] - py) - (p0[0] - px) * (p2[1] - py)) / area;
          const w2 = 1 - w0 - w1;
          if (w0 < 0 || w1 < 0 || w2 < 0) continue;
          const z = w0 * p0[2] + w1 * p1[2] + w2 * p2[2];
          const o = y * width + x;
          // Larger z is nearer the viewer for the anterior view.
          if (z <= depth[o]) continue;
          depth[o] = z;
          rgb[o * 3] = Math.min(255, color[0] * shade);
          rgb[o * 3 + 1] = Math.min(255, color[1] * shade);
          rgb[o * 3 + 2] = Math.min(255, color[2] * shade);
        }
      }
    }
  }
  return rgb;
}
