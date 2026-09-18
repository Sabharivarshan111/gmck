// Read a binary glTF far enough to rasterise it. No dependency.
//
// A .glb is a 12-byte header, a JSON chunk and a BIN chunk. Everything needed
// to draw it — which accessor holds POSITION, which holds the indices, where
// each sits in the buffer — is in that JSON. Materials, animations, skins and
// textures are ignored: these sheets are flat-shaded geometry, and the point is
// what IS there, not how it is lit.
import fs from 'node:fs';

const COMPONENT = {
  5120: Int8Array, 5121: Uint8Array, 5122: Int16Array,
  5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array,
};
const COUNT = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

export function readGlb(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error(`${file} is not a .glb`);
  let off = 12;
  let json = null, bin = null;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off);
    const type = buf.readUInt32LE(off + 4);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 0x4e4f534a) json = JSON.parse(data.toString('utf8'));
    else if (type === 0x004e4942) bin = data;
    off += 8 + len + ((4 - (len % 4)) % 4) % 4;
  }
  if (!json || !bin) throw new Error(`${file}: missing JSON or BIN chunk`);
  return { json, bin };
}

function readAccessor(json, bin, index) {
  const acc = json.accessors[index];
  const view = json.bufferViews[acc.bufferView];
  const Ctor = COMPONENT[acc.componentType];
  const n = COUNT[acc.type];
  const base = (view.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  // byteStride only matters for interleaved data; these exports are not.
  return new Ctor(bin.buffer, bin.byteOffset + base, acc.count * n);
}

/**
 * Every primitive in the file as { pos, idx }, with node transforms applied.
 *
 * Only translation/rotation/scale and matrices on the node path are honoured —
 * enough for an exported mesh, which is what these are.
 */
export function glbTriangles(file) {
  const { json, bin } = readGlb(file);
  const out = [];

  const compose = (node) => {
    if (node.matrix) return node.matrix.slice();
    const m = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
    const [x, y, z, w] = node.rotation ?? [0, 0, 0, 1];
    const [sx, sy, sz] = node.scale ?? [1, 1, 1];
    const [tx, ty, tz] = node.translation ?? [0, 0, 0];
    m[0] = (1 - 2 * (y*y + z*z)) * sx; m[1] = (2 * (x*y + z*w)) * sx; m[2] = (2 * (x*z - y*w)) * sx;
    m[4] = (2 * (x*y - z*w)) * sy;     m[5] = (1 - 2 * (x*x + z*z)) * sy; m[6] = (2 * (y*z + x*w)) * sy;
    m[8] = (2 * (x*z + y*w)) * sz;     m[9] = (2 * (y*z - x*w)) * sz;     m[10] = (1 - 2 * (x*x + y*y)) * sz;
    m[12] = tx; m[13] = ty; m[14] = tz;
    return m;
  };

  const mul = (a, b) => {
    const r = new Array(16).fill(0);
    for (let c = 0; c < 4; c++) for (let rw = 0; rw < 4; rw++)
      for (let k = 0; k < 4; k++) r[c * 4 + rw] += a[k * 4 + rw] * b[c * 4 + k];
    return r;
  };

  const visit = (nodeIndex, parent) => {
    const node = json.nodes[nodeIndex];
    const world = mul(parent, compose(node));
    if (node.mesh !== undefined) {
      for (const prim of json.meshes[node.mesh].primitives) {
        if (prim.attributes?.POSITION === undefined) continue;
        const src = readAccessor(json, bin, prim.attributes.POSITION);
        const pos = new Float32Array(src.length);
        for (let i = 0; i < src.length; i += 3) {
          const x = src[i], y = src[i + 1], z = src[i + 2];
          pos[i]     = world[0] * x + world[4] * y + world[8]  * z + world[12];
          pos[i + 1] = world[1] * x + world[5] * y + world[9]  * z + world[13];
          pos[i + 2] = world[2] * x + world[6] * y + world[10] * z + world[14];
        }
        const idx = prim.indices !== undefined
          ? Uint32Array.from(readAccessor(json, bin, prim.indices))
          : Uint32Array.from({ length: pos.length / 3 }, (_, i) => i);
        out.push({ name: json.meshes[node.mesh].name ?? `mesh${node.mesh}`, pos, idx });
      }
    }
    for (const child of node.children ?? []) visit(child, world);
  };

  const scene = json.scenes?.[json.scene ?? 0];
  for (const n of scene?.nodes ?? json.nodes.map((_, i) => i)) {
    visit(n, [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  }
  return out;
}
