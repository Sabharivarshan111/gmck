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
  /*
   * The three below are not shown on their own — they go INTO the app screens,
   * so the note screens photograph a real plate instead of the preview
   * harness's drawn stand-in.
   *
   * That stand-in is right for the harness and was wrong in an advertisement:
   * it is a white rectangle reading "Types of synovial joint" over the words
   * "plane - hinge - pivot - saddle - ball and socket" and a blue line, and
   * that is what a finished cut showed while the caption underneath promised a
   * diagram. Each of these is the plate the bank really files against that
   * exact question, so the caption and the picture agree.
   */
  'plate-synovial-joints.jpg': 'anatomy/types_of_synovial_joints.jpg',
  'plate-axilla.jpg': 'anatomy/axilla_boundaries_axillary_artery.jpg',
  'plate-tca-cycle.jpg': 'biochemistry/tca_cycle_amphibolic_anaplerosis.jpg',
  /*
   * These two are named directly by `DiagramCardScreen` shots, under these
   * exact filenames, and NOTHING was producing them. `staticFile()` on a file
   * that is not there is a broken image in a finished ad, and preflight could
   * not see it: it only reads the `file:` entries in the SCREENS registry, and
   * these live in `plateImage=` props on components.
   *
   * `calots_triangle_anatomy.jpg` is the same plate as `plate-calots-triangle`
   * above under the name the component asks for — the download is cheap and a
   * rename here would mean editing a shot to fix a build.
   */
  'calots_triangle_anatomy.jpg': 'anatomy/extrahepatic_biliary_apparatus_calots.jpg',
  'stomach_lymphatics_anatomy.jpg': 'anatomy/stomach_lymphatics_clogs_areas_virchow.jpg',
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
