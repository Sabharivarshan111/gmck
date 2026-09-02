// Pull the four real medical plates the ads show, out of the `diagrams` bucket.
//
// They are downloaded and bundled, never hotlinked at render time: a remote
// image that 404s mid-render produces a grey box reading "this diagram could
// not be loaded", and that has already reached a finished cut once.
//
// The agent sandbox is denied this host by proxy policy, so this is expected to
// run in CI. It fails loudly rather than leaving a zero-byte file behind.
import fs from 'node:fs/promises';
import path from 'node:path';

const BASE =
  'https://pmtgeydtqypwrypshhsx.supabase.co/storage/v1/object/public/diagrams/';

const PLATES = {
  'plate-brachial-plexus.jpg': 'anatomy/brachial_plexus_complete_scheme.jpg',
  'plate-ulnar-nerve.jpg': 'anatomy/ulnar_nerve_course_branches.jpg',
  'plate-calots-triangle.jpg': 'anatomy/extrahepatic_biliary_apparatus_calots.jpg',
  'plate-shoulder-joint.jpg': 'anatomy/shoulder_joint_rotator_cuff_muscles.jpg',
};

const outDir = path.join(process.cwd(), 'public', 'app_screens');
await fs.mkdir(outDir, { recursive: true });

let failed = 0;
for (const [local, remote] of Object.entries(PLATES)) {
  const url = BASE + remote;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 10_000) throw new Error(`only ${buf.length} bytes — not a plate`);
    await fs.writeFile(path.join(outDir, local), buf);
    process.stdout.write(`  ok   ${local}  ${(buf.length / 1024).toFixed(0)}KB\n`);
  } catch (err) {
    failed += 1;
    process.stdout.write(`  FAIL ${local}  ${err.message}\n`);
  }
}

if (failed > 0) {
  process.stdout.write(`\n${failed} plate(s) missing. A render must not start without them.\n`);
  process.exit(1);
}
process.stdout.write('\nAll plates bundled.\n');
