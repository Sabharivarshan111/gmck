"""Generate the experimental Morison-pouch pilot from atlas meshes and RF channels.

This is an offline source pipeline, not a clinical validator and not a raster drawing.
BodyParts3D: CC BY 4.0. PyMUST/SIMUS: LGPL-2.1.
"""
import argparse, gzip, hashlib, json, os, time
from pathlib import Path as FilePath
os.environ.setdefault("OPENBLAS_NUM_THREADS", "2")
import numpy as np
import pymust
import trimesh
from matplotlib.path import Path
from PIL import Image
from scipy.ndimage import binary_dilation, binary_erosion

ROOT = FilePath(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--output", type=FilePath, default=ROOT / "public/models/pocus/fast")
parser.add_argument("--scatterers", type=int, default=18000)
parser.add_argument("--inspect", action="store_true")
args = parser.parse_args(); args.output.mkdir(parents=True, exist_ok=True)

W = H = 384
x = np.linspace(-.13, .13, W); z = np.linspace(0, .22, H)
xx, zz = np.meshgrid(x, z); points = np.column_stack([xx.ravel(), zz.ravel()])
origin = np.array([-.06, 1.16, .12]); atlas_path = ROOT / "public/models/atlas.json"
atlas = json.loads(atlas_path.read_text()); cache = {}; masks = {}; source_parts = []
for part in atlas["parts"]:
    if not (part["name"].startswith("Hepatovenous segment") or part["name"] == "Right kidney"): continue
    if part["chunk"] not in cache:
        chunk_path = atlas["chunks"][part["chunk"]]["gzip"].lstrip("/")
        cache[part["chunk"]] = gzip.decompress((ROOT / "public" / chunk_path).read_bytes())
    raw = cache[part["chunk"]]
    vertices = np.frombuffer(raw, "<f4", part["vertexCount"] * 3, part["positions"]).reshape(-1, 3)
    faces = np.frombuffer(raw, "<u4", part["indexCount"], part["indices"]).reshape(-1, 3)
    mesh = trimesh.Trimesh(vertices, faces)
    section = mesh.section(plane_origin=origin, plane_normal=[1, 0, 0])
    if section is None: continue
    mask = np.zeros(H * W, dtype=bool)
    for polygon in section.discrete:
        coords = np.column_stack([origin[1] - polygon[:, 1], origin[2] - polygon[:, 2]])
        mask |= Path(coords).contains_points(points)
    masks[part["name"]] = mask.reshape(H, W)
    source_parts.append({"id": part["id"], "name": part["name"], "planePixels": int(mask.sum())})

liver = np.zeros((H, W), bool); kidney = np.zeros((H, W), bool)
for name, mask in masks.items():
    if name.startswith("Hepatovenous"): liver |= mask
    if name == "Right kidney": kidney |= mask
assert liver.sum() > 1000 and kidney.sum() > 1000
organs = liver | kidney
gap = binary_dilation(liver, iterations=28) & binary_dilation(kidney, iterations=28) & ~organs
gap &= (zz > .045) & (zz < .19)
assert gap.sum() > 100, f"insufficient hepatorenal gap pixels: {gap.sum()}"

amplitude = np.full((H, W), .035, dtype=np.float32)
amplitude[liver] = .50; amplitude[kidney] = .30
edge = (liver & ~binary_erosion(liver)) | (kidney & ~binary_erosion(kidney)); amplitude[edge] = 1
# The same seeded cloud is used for both states. Normal inter-organ tissue is
# present in one RF acquisition; the fluid state removes only those scatterers.
amplitude[gap] = .35
if args.inspect:
    preview = np.zeros((H, W, 3), dtype="uint8")
    preview[liver] = [170, 90, 40]; preview[kidney] = [80, 120, 190]; preview[gap] = [0, 255, 255]
    Image.fromarray(preview).save(args.output / "source-mask-inspection.png")
    print("MASK", {"liver": int(liver.sum()), "kidney": int(kidney.sum()), "gap": int(gap.sum())})
    raise SystemExit(0)
rng = np.random.default_rng(2234)
xs = rng.uniform(x[0], x[-1], args.scatterers); zs = rng.uniform(.005, .22, args.scatterers)
ix = np.clip(np.searchsorted(x, xs), 0, W - 1); iz = np.clip(np.searchsorted(z, zs), 0, H - 1)
inside = (np.abs(xs) < zs * np.tan(np.deg2rad(55)))
xs, zs, ix, iz = xs[inside], zs[inside], ix[inside], iz[inside]
noise = rng.normal(0, 1, len(xs)); in_gap = gap[iz, ix]
base_rc = noise * amplitude[iz, ix]; base_rc[in_gap] = 0
gap_rc = np.zeros_like(base_rc); gap_rc[in_gap] = noise[in_gap] * .35

probe = pymust.getparam("C5-2v"); probe.fs = 4 * probe.fc; probe.attenuation = .5
probe.TXapodization = np.hanning(probe.Nelements)
options = pymust.utils.Options(); options.dBThresh = -50
delays = pymust.txdelay(probe, 0.0)

def acquire(reflectivity, label):
    started = time.time(); print("SIMUS", label, len(xs), flush=True)
    rf, _ = pymust.simus(xs, zs, reflectivity, delays, probe, options)
    assert np.isfinite(rf).all()
    iq = pymust.rf2iq(rf, probe.fs, probe.fc)
    matrix = pymust.dasmtx(iq, xx, zz, delays, probe)
    beam = pymust.utils.applyDasMTX(matrix, iq, xx.shape)
    assert np.isfinite(beam).all(); print("DAS", label, time.time() - started, flush=True)
    return beam

base = acquire(base_rc, "base-without-gap")
normal = base + acquire(gap_rc, "normal-gap-tissue")
fluid = base
envelopes = {"normal": np.abs(normal), "fluid": np.abs(fluid)}
reference = max(float(value.max()) for value in envelopes.values())
frames = []
for state, envelope in envelopes.items():
    db = 20 * np.log10(np.maximum(envelope / reference, 1e-8))
    encoded = np.clip((db + 80) / 80 * 255, 0, 255).astype("uint8")
    encoded[np.abs(xx) > zz * np.tan(np.deg2rad(55))] = 0
    filename = f"fast-0-{state}.png"; Image.fromarray(encoded).save(args.output / filename, optimize=True)
    frames.append({"state": state, "plane": 0, "image": f"/models/pocus/fast/{filename}"})

normal_gap = envelopes["normal"][gap]; fluid_gap = envelopes["fluid"][gap]
gap_reduction = float(20 * np.log10((normal_gap.mean() + 1e-12) / (fluid_gap.mean() + 1e-12)))
manifest = {
  "status": "experimental source-anatomy RF teaching model; not clinically validated",
  "method": "BodyParts3D mesh section → seeded scatterers → SIMUS channel RF → IQ → delay-and-sum → shared-reference log compression",
  "anatomy": {"source": "BodyParts3D 4.0", "license": "CC BY 4.0", "atlasSha256": hashlib.sha256(atlas_path.read_bytes()).hexdigest(), "sourceParts": source_parts},
  "software": {"name": "PyMUST", "version": "0.1.9", "license": "LGPL-2.1"},
  "probe": {"model": "C5-2v", "geometry": "curvilinear", "elements": int(probe.Nelements), "centerFrequencyMHz": probe.fc / 1e6},
  "field": {"depthCm": 22, "sectorAngleDegrees": 110, "radiusMeters": float(probe.radius)},
  "plane": {"originMeters": origin.tolist(), "normal": [1, 0, 0]},
  "seed": 2234, "scatterers": int(len(xs)), "frames": frames,
  "qualityCheck": {"meanFluidGapEnvelopeReductionDb": gap_reduction, "finiteRfAndIq": True},
  "limitations": ["One experimental parasagittal source plane, not a clinically registered RUQ probe pose", "Generic teaching reflectivities; homogeneous sound speed; no refraction, nonlinear propagation, cine, or clinical validation"]
}
(args.output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print("DONE", json.dumps(manifest["qualityCheck"]), flush=True)
