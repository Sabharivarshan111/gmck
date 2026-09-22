# Z-Anatomy peripheral nerves — imported; two genuine source gaps remain

**Status:** the Z-Anatomy peripheral nerve import is complete and live on
`main`. This file used to say the work was blocked on network access; that is
no longer true.

## What is in the repo now

Runtime asset:

- `public/models/zanatomy_peripheral_nerves.glb`
- `public/models/zanatomy_peripheral_nerves.manifest.json`
- resolver/runtime mapping: `src/simulator/data/peripheralNerves.ts`

Source recorded by the manifest:

- Z-Anatomy `NervousSystem100.fbx`
- source URL:
  `https://github.com/LluisV/Z-Anatomy/blob/PC-Version/Resources/Models/FBX/NervousSystem100.fbx`
- licence: **CC BY-SA 4.0 aggregate**; the cranial-nerve component credit is
  documented separately in the attribution file.

Current exported inventory:

- 712 source objects inspected
- 272 named nerve objects exported
- 1,192,806 true source loop-triangles before mobile decimation
- 193,875 true triangulated faces in the mobile-decimated shipped peripheral-nerve GLB

The supplement is lazy-loaded. BodyParts3D remains the core body atlas and is
not falsely treated as containing these nerves.

## Source-backed nerve targets now available

The Z-Anatomy layer currently supplies real source geometry for:

- vagus nerves
- brachial plexus
- medial and lateral pectoral nerves
- musculocutaneous nerves
- axillary nerves
- median nerves and named branches
- ulnar nerves and named branches
- radial nerves and named branches
- intercostal nerves
- sympathetic trunks / ganglia / sympathetic nerves
- femoral nerves and anterior cutaneous branches
- obturator nerves and anterior/posterior branches
- sciatic nerves
- tibial nerves
- common fibular (peroneal) nerves and sural communicating branches

Smaller named source meshes remain inspectable through deterministic
`zanerve__...` keys rather than being replaced with hand-authored aliases.

## The two genuine gaps

The shipped Z-Anatomy `NervousSystem100` source contains **no mesh named for**
either of these targets:

1. `phrenic_nerve`
2. `splanchnic_nerves`

The generated manifest therefore records empty target arrays for both.

These are deliberately **not** resolved to a nearby artery, vein, autonomic
trunk, ocular nerve, or other plausible-looking structure. A wrong anatomical
answer is worse than a clearly labelled gap.

Current simulator behavior:

- `phrenic_nerve` may use the explicitly labelled
  **HRA/Z-Anatomy landmark-derived phrenic schematic**.
- `splanchnic_nerves` may use the explicitly labelled
  **autonomic schematic overlay**.
- Neither schematic is allowed to masquerade as source-derived mesh anatomy.

The all-organ audit now fails closed: merely being absent from BodyParts3D is
not enough to pass. Every target must have a verified source supplement, an
explicit schematic classification, or an intentional non-anatomical clinical
overlay.

## What would close the remaining gaps

Replace either schematic only when a genuine reusable 3D source is found that:

1. explicitly contains the phrenic nerve and/or thoracic/abdominopelvic
   splanchnic nerves as identifiable geometry;
2. has a licence compatible with distribution in ORBIT and is attributed;
3. can be registered to the same anatomical coordinate system without an
   arbitrary visual fudge factor;
4. preserves left/right course and major anatomical relations;
5. passes the simulator integrity and visual checks after import.

If a candidate needs an unexplained scale/translation/rotation to look right,
treat the registration as unverified rather than forcing it into place.

## Verification commands

```sh
npm run check:simulator
npm run check:simulator-assets
node scripts/all-organ-anatomy-audit.mjs
npm run check:deploy
```

The `ORBIT Simulator Integrity` GitHub Actions workflow runs these checks on
relevant pushes to `main`.

## What NOT to do

**Do not hand-draw a nerve and call it anatomy.** Procedural lines are acceptable
only as visibly labelled teaching schematics.

**Do not loosen resolver matching to fill a blank.** The historical failure mode
was exactly this: the vagus resolved to nerves of the orbit and the phrenic
nerve could collide with phrenic vessels.

**Do not merge male/female or unrelated donor reference models as though they
were one internally registered body.** HRA reference sex is kept explicit.

**Do not remove the Z-Anatomy share-alike attribution.** Derived Z-Anatomy mesh
assets remain subject to CC BY-SA 4.0.
