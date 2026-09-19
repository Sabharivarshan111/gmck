# Import the peripheral nerves from Z-Anatomy

**Blocked on:** a route to the internet. No agent sandbox has one for this —
the egress proxy refuses `github.com`, `raw.githubusercontent.com` (connection
closed), `codeload.github.com` (403) and `dbarchive.biosciencedbc.jp`
(connection closed). A **GitHub Actions runner does**, which is how
`supabase-tasks.yml` and `exam-sign-images.yml` do their network work.

**Owner:** anyone who can run a workflow on this repo, or the app owner with a
laptop and Blender.

## What is missing, and how it is known

The BodyParts3D 4.0 export in `public/models/` has **no peripheral nerves at
all**. Not "few" — none. Search the 2,234 part names for vagus, phrenic,
splanchnic, sympathetic, recurrent laryngeal, intercostal, pectoral, axillary,
median, ulnar, radial, sciatic, femoral or peroneal and every count is zero.
Its 139 `nervous` parts are the cerebrum, cerebellum, brainstem, deep grey
matter, the optic pathway and the nerves of the orbit.

```sh
node -e "const a=require('./public/models/atlas.json');
for (const w of ['vagus','phrenic','splanchnic','sympathetic','median nerve'])
  console.log(w, a.parts.filter(p=>p.name.toLowerCase().includes(w)).length)"
```

Look at `docs/simulator-organ-sheets/system-nervous-anterior.png`: the entire
nervous system of this atlas is a brain on a stalk.

Until this lands, `vagus_nerve`, `phrenic_nerve`, `pectoral_nerves`,
`splanchnic_nerves` and `axillary_nerve` resolve to **nothing**, and the view
says why. That is deliberate. The old resolver substituted the ciliary ganglia
and the oculomotor nerve for the vagus, which is worse than a blank: the
student looking at it is the one person who cannot tell.

## The source

**Z-Anatomy** — a modified, extended BodyParts3D that adds vessels and nerves
(nerves converted to curves), 5,000+ structures, **CC BY-SA 4.0**.

- Models: https://github.com/Z-Anatomy/Models-of-human-anatomy
- Blender template: https://github.com/Z-Anatomy/The-blend
- Project: https://simtk.org/projects/z-anatomy

It is **already partly in use here**: `lungs_candidate_zanatomy_full.glb` is a
Z-Anatomy export, because the atlas has no lung tissue either.

## The licence consequence, which is not optional

BodyParts3D is **CC BY 4.0** (attribution). Z-Anatomy is **CC BY-SA 4.0**
(attribution *and* share-alike). Anything derived from a Z-Anatomy mesh carries
share-alike forward, and `public/models/ATTRIBUTION_BODYPARTS3D.md` has to name
Z-Anatomy, its licence and the adaptation — the same way it already names
BodyParts3D and the HuBMAP female reference set. Check this with the app owner
before shipping, because it is a term on the app's own assets and not a
detail.

## What to do

1. Fetch the Z-Anatomy model repository on a runner (or locally, with Blender).
2. Export **only the peripheral nerves** to `.glb`, in the same coordinate
   space the atlas uses: **metres, Y-up, standing on the stage at y = 0**, body
   height ≈ 1.73. `ATTRIBUTION_BODYPARTS3D.md` records the conversion
   BodyParts3D needed (mm/Z-up → m/Y-up) — Z-Anatomy is itself derived from
   BodyParts3D, so the two should register without a fudge factor. **If a
   fudge factor seems necessary, the export is wrong**: check it against a
   landmark both sets have, such as the manubrium or the hyoid.
3. Decimate to a budget. The whole current atlas is 2.29M triangles and
   34 MB gzipped; the nerve set must be a small fraction of that. Curves
   tubed at low radial segments are cheap — aim under 150k triangles for the
   whole peripheral nervous system.
4. Name the meshes so the resolver can find them: the rules in
   `src/simulator/data/atlasResolver.ts` match on whole words, so a mesh named
   `Left vagus nerve` is found by the key `vagus_nerve` with no code change.
5. Delete the `absent-peripheral-nerve` rule's `when` entries for whatever now
   exists, add a rule that selects them, and run `npm run check:simulator` —
   it asserts those keys are absent today, so it will fail and tell you which
   ones to update. That failure is the handshake, not a problem.
6. Re-run `npm run sheets:simulator` and look at
   `system-nervous-anterior.png`. If the vagus does not run from the jugular
   foramen to the abdomen, the import is wrong.
7. `npm run check:deploy` — the upload budget is 60 MB and the deploy is
   currently 37.3 MB, so there is about 20 MB of headroom and no more.

## What NOT to do

**Do not hand-draw a nerve.** `createAutonomicNervousSystem()` in
`AnatomicalBody3D.tsx` already generates a synthetic sympathetic chain and
cardiac plexus procedurally, and that is defensible for an *overlay* that is
labelled as a schematic. It is not a substitute for anatomy, and it must never
be returned by the element resolver as though it came from the atlas.

**Do not loosen a resolver rule to fill the blank.** That is how the vagus
became the nerves of the eye.
