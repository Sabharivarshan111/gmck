# Source anatomy and ultrasound physics investigation

Status: **experimental offline proof; not integrated into the app**.

Owner requirement: match the source-based standard of the 2,234-part anatomy
atlas. A textured SVG/canvas drawing or reference photograph is insufficient.
PR58 fixed controls and introduced separate reference media; it did **not**
satisfy this realism requirement. Do not describe the current app as complete.

## Software checked against primary sources

| Software | What it supplies | Decision |
| --- | --- | --- |
| [PyMUST](https://github.com/creatis-ULTIM/PyMUST) / SIMUS | Transducer delays, acoustic pressure and channel RF simulation, demodulation, delay-and-sum beamforming, B-mode and Doppler processing; LGPL-2.1 | Installed and exercised, pinned to 0.1.9; first offline proof |
| [k-Wave-python](https://github.com/waltsims/k-wave-python) | Time-domain wave propagation in heterogeneous media, absorption and nonlinearity, CPU/GPU backends | Candidate for propagation/reflection effects not represented by SIMUS; researched, not executed |
| Blender | Mesh preparation, registration and rendering | Suitable for anatomy preparation; rendering a mesh does not itself simulate ultrasound; not installed in this workspace |

Primary references:

- [PyMUST function overview and research citation](https://github.com/creatis-ULTIM/PyMUST#main-functions).
- Garcia, SIMUS Part I, [arXiv:2102.02738](https://arxiv.org/abs/2102.02738).
- [k-Wave 3D propagation documentation](https://k-wave-python.readthedocs.io/en/latest/kwave.kspaceFirstOrder3D.html).
- BodyParts3D source and licence: `public/models/ATTRIBUTION_BODYPARTS3D.md`.

## What was actually built

`scripts/generate-pocus-source-proof.py` reads real positions and triangles from
`public/models/atlas.json` and its gzipped chunks. It intersects those meshes
with a registered parasagittal plane in metres; no hand-drawn liver or kidney
geometry enters the phantom. Liver segments remain identified by source ID.
Seven source parts intersect the initial plane: FJ1858, FJ2409, FJ2821, FJ2822,
FJ2823, FJ2824 and FJ3147. Non-watertight source parts are recorded rather than
concealed; the test uses their closed section paths where available. This is
not proof that every section of those meshes is usable.

The source section controls the reflectivity distribution of seeded point
scatterers. SIMUS produces multichannel RF data for three diverging transmits
at -20, 0 and +20 degrees. PyMUST demodulates, compensates attenuation,
beamforms, coherently compounds, and log compresses the result. The output
contains physically computed interference speckle, not an overlay of cosmetic
noise on a drawing. The numerical experiment uses the P4-2v phased-array
parameter set, **not a clinical curvilinear FAST transducer**.

A preliminary HRA liver capsule test failed: the source mesh represents a
thin shell, not solid parenchyma. Filling its cross section left inadequate
internal tissue. That route was abandoned in favour of the atlas's liver
segment volumes. The HRA kidney meshes may be useful after verified
registration and selection of interior tissue, rather than assuming a capsule
is a solid organ.

Run:

```sh
python -m pip install -r scripts/pocus-physics-requirements.txt
python scripts/generate-pocus-source-proof.py --output /tmp/orbit-pocus-proof
```

Outputs: source reflectivity map, beamformed scan PNG, beamformed complex IQ
and last-transmit RF NPZ, and provenance/parameters/limitations JSON. The
script asserts finite RF/IQ and substantial liver/kidney plane coverage.
Dependency versions, random seed and atlas hash are recorded or pinned.
Neither the Python packages nor the RF arrays enter the mobile bundle.

## Limits and gates before app integration

The first section is an abdominal acoustic experiment, **not a validated
Morison's-pouch scanning pose**. Reflectivities and homogeneous sound speed
are teaching assumptions; the model omits refraction, multiple scattering,
nonlinear propagation and lung reverberation. No fluid pathology, cardiac
motion, Doppler velocities or pupil/face behaviour was built by this proof.
It would be misleading to ship it as a complete realistic POCUS simulator.

Next work:

1. Verify clinical probe planes and orientation against reliable acquired
   reference scans; derive the phantom from the registered structures.
2. Select the appropriate curved/phased/linear transducer and sufficient
   sampling and compounding; inspect sidelobes and depth compensation.
3. Establish tissue/acoustic parameter provenance and measurable pathology
   states. Do not map lactate alone to free fluid or CVP alone to tamponade.
4. Produce state-dependent cine/scan assets offline, preserving physical
   coordinates for gain, depth and calipers; implement bounded lazy loading.
5. Model lung interfaces with a propagation method that supports reverberation.
6. Compare output with reference scans, then test actual mobile rendering,
   Freeze, frame timing, measurement calibration and reduced motion.

The HRA face/pupil trainer and any obstetric amniotic-fluid module remain
separate outstanding requests. The uploaded fluid screenshot showed abdominal
Morison's pouch. No amniotic-fluid module was found in this checkout.
