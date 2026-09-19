// Draw every isolation target the simulator has, from the real atlas geometry.
//
//   npm run sheets:simulator [outDir]
//
// One PNG per target per view, plus one per anatomical system, plus an
// index.html contact sheet. Default output: docs/simulator-organ-sheets/.
//
// WHY THIS IS NOT A SCREENSHOT OF THE APP, and is better evidence than one:
//
// There is no emulator here and the egress proxy refuses npm registry
// tarballs, so there is no `node_modules`, no three.js and no way to run
// `vite build`. What there IS, in the repo, is the data the app renders:
// `public/models/atlas.json` names every part's byte offsets and
// `body-N.bin.gz` holds the Float32 positions and Uint32 indices. So these
// sheets run the REAL resolver over the REAL geometry and rasterise it in
// plain Node.
//
// That means no lighting rig, no tone mapping, no camera, no shader stands
// between the picture and the lookup. If an organ is missing a part here, the
// lookup is wrong. If it looks right here and wrong on screen, the renderer
// is. Those are different bugs and this separates them, which a screenshot of
// the finished app cannot.
//
// The counts printed beside each sheet are the ones `npm run check:simulator`
// asserts, so the picture and the check cannot disagree about what is in an
// organ.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodePng } from './lib/png.mjs';
import { loadAtlas, collectTriangles, boundsOf, render, SYSTEM_COLOR } from './lib/atlas-raster.mjs';
import { glbTriangles } from './lib/glb.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(process.argv[2] ?? path.join(root, 'docs/simulator-organ-sheets'));

const { describeAtlasTarget, correctPartSystem } = await import(path.join(root, 'src/simulator/data/atlasResolver.ts'));
const { atlas, chunks } = loadAtlas(root);

// The same system correction the chunk loader applies, so the sheets are
// coloured the way the app colours them rather than the way the ontology
// mislabels them — the liver is a digestive organ, not a vein.
atlas.parts.forEach(correctPartSystem);

// -- Every target, read from the dossier database rather than typed here -----

const organSrc = fs.readFileSync(path.join(root, 'src/simulator/data/organAnatomyData.ts'), 'utf8');
const dbBody = organSrc.slice(organSrc.indexOf('export const ORGAN_ANATOMY_DATABASE'));
const organKeys = [...dbBody.matchAll(/^ {2}([a-zA-Z_][\w]*):\s*\{/gm)].map((m) => m[1]);
const nodeIds = [...dbBody.matchAll(/^ {4,}id: '([^']+)',$/gm)].map((m) => m[1]);
const targets = [...new Set([...organKeys, ...nodeIds])];

const W = 440, H = 560;
fs.mkdirSync(outDir, { recursive: true });

/**
 * The lung parenchyma the app adds on top of the atlas.
 *
 * This atlas has NO lung tissue — its respiratory parts are the airway, the
 * nasal cartilages and the pharyngeal constrictors — so `AnatomicalBody3D`
 * loads lobes from a Z-Anatomy mesh separately. A lungs sheet without them
 * would show an airway hanging in space and misreport the app.
 */
const LUNG_MESH = path.join(root, 'public/models/lungs_candidate_zanatomy_full.glb');
const lungExtra = fs.existsSync(LUNG_MESH)
  ? glbTriangles(LUNG_MESH).map((m) => ({ pos: m.pos, idx: m.idx, color: SYSTEM_COLOR.respiratory }))
  : [];

function draw(name, ids, label, extra = []) {
  const tris = [...collectTriangles(atlas, chunks, ids), ...extra];
  let box = boundsOf(atlas, ids);
  for (const e of extra) {
    for (let i = 0; i < e.pos.length; i += 3) {
      if (!box) box = { lo: [Infinity, Infinity, Infinity], hi: [-Infinity, -Infinity, -Infinity] };
      for (let a = 0; a < 3; a++) {
        box.lo[a] = Math.min(box.lo[a], e.pos[i + a]);
        box.hi[a] = Math.max(box.hi[a], e.pos[i + a]);
      }
    }
  }
  const triCount = tris.reduce((s, t) => s + t.idx.length / 3, 0);
  const files = [];
  for (const view of ['anterior', 'lateral']) {
    const rgb = render(tris, box, { width: W, height: H, view });
    const file = `${name}-${view}.png`;
    fs.writeFileSync(path.join(outDir, file), encodePng(W, H, rgb));
    files.push(file);
  }
  const systems = {};
  for (const p of atlas.parts) if (ids.has(p.id)) systems[p.system] = (systems[p.system] ?? 0) + 1;
  console.log(`  ${label.padEnd(28)} ${String(ids.size).padStart(4)} parts  ${String(triCount).padStart(7)} tris`);
  return { name, label, parts: ids.size, triangles: triCount, systems, files };
}

const rows = [];

console.log('\n  Whole body');
rows.push({ group: 'Whole body', ...draw('all-parts', new Set(atlas.parts.map((p) => p.id)), 'every part') });

console.log('\n  Isolation targets (what the simulator resolves)');
const absent = [];
for (const t of targets) {
  const r = describeAtlasTarget(t, atlas);
  if (r.status === 'absent' || r.ids.size === 0) {
    absent.push({ group: 'Isolation target', name: t, label: t, parts: 0, triangles: 0, systems: {}, files: [], reason: r.reason ?? 'nothing matched' });
    console.log(`  ${t.padEnd(28)}    0 parts  — ${r.status === 'absent' ? 'not in this atlas' : 'UNMATCHED'}`);
    continue;
  }
  const extra = t === 'lungs' ? lungExtra : [];
  rows.push({ group: 'Isolation target', ...draw(`target-${t}`, r.ids, t, extra) });
}

console.log('\n  Anatomical systems (every mesh the atlas files under each)');
const systemIds = new Map();
for (const p of atlas.parts) {
  if (!systemIds.has(p.system)) systemIds.set(p.system, new Set());
  systemIds.get(p.system).add(p.id);
}
for (const [sys, ids] of [...systemIds].sort((a, b) => b[1].size - a[1].size)) {
  rows.push({ group: 'System', ...draw(`system-${sys}`, ids, sys, sys === 'respiratory' ? lungExtra : []) });
}

// -- The contact sheet -------------------------------------------------------

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const swatch = (sys) => {
  const c = SYSTEM_COLOR[sys] ?? [150, 150, 150];
  return `<span class="sw" style="background:rgb(${c.join(',')})"></span>`;
};

const card = (r) => `
  <figure>
    <div class="views">${r.files.map((f) => `<img src="${f}" alt="${esc(r.label)}" loading="lazy">`).join('')}</div>
    <figcaption>
      <b>${esc(r.label)}</b>
      <span class="n">${r.parts} parts &middot; ${r.triangles.toLocaleString('en-GB')} triangles</span>
      <span class="sys">${Object.entries(r.systems).sort((a, b) => b[1] - a[1]).map(([s, n]) => `${swatch(s)}${esc(s)} ${n}`).join(' ')}</span>
    </figcaption>
  </figure>`;

const absentCard = (r) => `
  <figure class="absent">
    <div class="views"><div class="none">not in this atlas</div></div>
    <figcaption><b>${esc(r.label)}</b><span class="n">${esc(r.reason)}</span></figcaption>
  </figure>`;

const group = (name, items, extra = '') => `
  <h2>${esc(name)}</h2>${extra}
  <div class="grid">${items.join('')}</div>`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Simulator organ sheets</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; padding:24px; background:#0b0f16; color:#e2e8f0;
         font:14px/1.6 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif; }
  h1 { font-size:22px; margin:0 0 4px; }
  h2 { font-size:15px; letter-spacing:.08em; text-transform:uppercase; color:#7dd3fc;
       margin:36px 0 10px; border-bottom:1px solid #1e293b; padding-bottom:6px; }
  p.lede { max-width:70ch; color:#94a3b8; margin:0 0 8px; }
  .grid { display:grid; gap:16px; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); }
  figure { margin:0; background:#111827; border:1px solid #1f2937; border-radius:12px; overflow:hidden; }
  .views { display:flex; background:#0c111a; }
  .views img { width:50%; height:auto; display:block; }
  .none { width:100%; padding:64px 12px; text-align:center; color:#64748b; font-style:italic; }
  figcaption { padding:10px 12px; display:flex; flex-direction:column; gap:3px; }
  figcaption b { font-size:14px; }
  .n { color:#94a3b8; font-size:12px; font-variant-numeric:tabular-nums; }
  .sys { color:#64748b; font-size:11px; display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  .sw { width:9px; height:9px; border-radius:2px; display:inline-block; margin-right:4px;
        vertical-align:-1px; }
  figure.absent { border-style:dashed; }
</style></head><body>
<h1>Simulator organ sheets</h1>
<p class="lede">Every isolation target the simulator has, drawn from the real
BodyParts3D geometry in <code>public/models/</code> by the real resolver in
<code>src/simulator/data/atlasResolver.ts</code>. Left is anterior, right is
lateral. Colour is the anatomical system, matching the app.</p>
<p class="lede">No lighting rig, no tone mapping, no shader: if a part is
missing here the lookup is wrong, and if a sheet is right but the app is not
the renderer is. Regenerate with <code>npm run sheets:simulator</code>.</p>
${group('Whole body', rows.filter((r) => r.group === 'Whole body').map(card))}
${group('Isolation targets', rows.filter((r) => r.group === 'Isolation target').map(card))}
${absent.length ? group('Not in this atlas', absent.map(absentCard),
  `<p class="lede">BodyParts3D models the CNS and the nerves of the orbit and holds
   <b>no peripheral nerves at all</b>. These resolve to nothing on purpose — a plausible
   substitute is worse than a blank, because a student cannot tell them apart.</p>`) : ''}
${group('Anatomical systems', rows.filter((r) => r.group === 'System').map(card))}
<p class="lede" style="margin-top:32px">${atlas.parts.length} parts &middot;
${atlas.triangles.toLocaleString('en-GB')} triangles &middot; ${atlas.version} &middot; CC BY 4.0</p>
</body></html>`;

fs.writeFileSync(path.join(outDir, 'index.html'), html);

const bytes = fs.readdirSync(outDir).reduce((s, f) => s + fs.statSync(path.join(outDir, f)).size, 0);
console.log(`\n  ${rows.length} sheets + ${absent.length} absent, ${(bytes / 1024 / 1024).toFixed(1)} MB`);
console.log(`  open ${path.relative(root, path.join(outDir, 'index.html'))}\n`);
