import bpy
import json
import math
import os
import re
import sys
from mathutils import Vector

# Headless Blender exporter for ORBIT's mobile peripheral-nerve supplement.
# Source: Z-Anatomy NervousSystem100.fbx (CC BY-SA 4.0 aggregate; see repo NOTICE).
#
# Usage:
# blender -b --python scripts/export-zanatomy-peripheral-nerves.py -- \
#   --src /tmp/NervousSystem100.fbx \
#   --out public/models/zanatomy_peripheral_nerves.glb \
#   --manifest public/models/zanatomy_peripheral_nerves.manifest.json

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []

def arg(name, default=None):
    flag = f"--{name}"
    return argv[argv.index(flag) + 1] if flag in argv else default

src = arg("src")
out = arg("out")
manifest_path = arg("manifest")
if not src or not out or not manifest_path:
    raise SystemExit("--src, --out and --manifest are required")

INCLUDE = re.compile(
    r"(nerve|plexus|ganglion|ramus|rami|root|sympathetic|parasympathetic|"
    r"splanchnic|vagus|phrenic|intercostal|median|ulnar|radial|"
    r"musculocutaneous|axillary|sciatic|femoral|obturator|tibial|"
    r"fibular|peroneal|brachial|lumbosacral)",
    re.I,
)

# Brain/CNS and non-neural components are intentionally not duplicated here.
# Cranial nerves themselves remain included; the exclusions are tissue/organ
# surfaces and the separately licensed inner-ear geometry.
EXCLUDE = re.compile(
    r"(cerebr|cerebell|telenceph|dienceph|brainstem|brain_stem|medulla_oblongata|"
    r"pons\b|midbrain|spinal_cord|white_matter|grey_matter|gray_matter|"
    r"ventricle|choroid_plexus|cochlea|vestibule|semicircular|tympanic|"
    r"auditory_tube|hypophysis|pineal)",
    re.I,
)

TARGET_PATTERNS = {
    "vagus_nerve": r"vagus",
    "phrenic_nerve": r"phrenic",
    "brachial_plexus": r"brachial.*plexus|plexus.*brachial",
    "median_nerve": r"median.*nerve|nerve.*median",
    "ulnar_nerve": r"ulnar.*nerve|nerve.*ulnar",
    "radial_nerve": r"radial.*nerve|nerve.*radial",
    "musculocutaneous_nerve": r"musculocutaneous",
    "axillary_nerve": r"axillary.*nerve|nerve.*axillary",
    "intercostal_nerves": r"intercostal",
    "sympathetic_chain": r"sympathetic",
    "splanchnic_nerves": r"splanchnic",
    "femoral_nerve": r"femoral.*nerve|nerve.*femoral",
    "obturator_nerve": r"obturator.*nerve|nerve.*obturator",
    "sciatic_nerve": r"sciatic",
    "tibial_nerve": r"tibial.*nerve|nerve.*tibial",
    "common_fibular_nerve": r"(common.*(fibular|peroneal)|(fibular|peroneal).*common)",
}

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

bpy.ops.import_scene.fbx(filepath=src, use_anim=False, automatic_bone_orientation=True)
all_objects = [o for o in bpy.context.scene.objects if o.type in {"MESH", "CURVE"}]
if not all_objects:
    raise RuntimeError("Z-Anatomy FBX imported no mesh/curve objects")

def world_corners(obj):
    if obj.type == "MESH":
        return [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    # Curves can be empty before depsgraph eval; convert a copy if needed.
    return [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]

# Use the complete source bounds to register the supplement to the same body,
# instead of scaling only the selected nerves and accidentally stretching them.
mins = Vector((math.inf, math.inf, math.inf))
maxs = Vector((-math.inf, -math.inf, -math.inf))
for o in all_objects:
    for p in world_corners(o):
        mins.x = min(mins.x, p.x); mins.y = min(mins.y, p.y); mins.z = min(mins.z, p.z)
        maxs.x = max(maxs.x, p.x); maxs.y = max(maxs.y, p.y); maxs.z = max(maxs.z, p.z)

height = maxs.z - mins.z
if not (height > 0):
    raise RuntimeError("invalid Z-Anatomy source bounds")

selected = []
rejected = []
for o in all_objects:
    n = o.name.replace(" ", "_")
    if INCLUDE.search(n) and not EXCLUDE.search(n):
        selected.append(o)
    else:
        rejected.append(o)

if len(selected) < 20:
    raise RuntimeError(f"only {len(selected)} peripheral-nerve candidates matched; source naming changed")

# Remove everything not exported, which also keeps Blender's exporter fast.
for o in rejected:
    bpy.data.objects.remove(o, do_unlink=True)

# Curves are converted to meshes before export so every browser gets stable
# triangle geometry and does not depend on a curve extension.
for o in list(selected):
    if o.type == "CURVE":
        bpy.context.view_layer.objects.active = o
        o.select_set(True)
        bpy.ops.object.convert(target="MESH")
        o.select_set(False)

selected = [o for o in bpy.context.scene.objects if o.type == "MESH"]

# Geometry budget: preserve fine nerves by simplifying only meshes large enough
# to have redundant surface tessellation. The layer is lazy-loaded, but still
# needs to stay comfortably below the main atlas payload on mobile.
raw_tris = sum(len(o.data.polygons) for o in selected)
TARGET_TRIS = 180_000
if raw_tris > TARGET_TRIS:
    global_ratio = max(0.45, TARGET_TRIS / raw_tris)
    for o in selected:
        tris = len(o.data.polygons)
        if tris < 800:
            continue
        mod = o.modifiers.new(name="ORBIT_mobile_decimate", type="DECIMATE")
        mod.decimate_type = "COLLAPSE"
        mod.ratio = global_ratio
        mod.use_collapse_triangulate = True
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier=mod.name)

# Parent to one normalisation root. Blender's glTF exporter performs the
# Z-up -> Y-up conversion; the root handles scale and centring only.
root = bpy.data.objects.new("ORBIT_ZAnatomy_Peripheral_Nerves", None)
bpy.context.collection.objects.link(root)
source_center_x = (mins.x + maxs.x) / 2.0
source_center_y = (mins.y + maxs.y) / 2.0
scale = 1.70 / height
root.scale = (scale, scale, scale)
root.location = (-source_center_x * scale, -source_center_y * scale, -mins.z * scale)

for o in selected:
    world = o.matrix_world.copy()
    o.parent = root
    o.matrix_world = world

# Uniform clinical nerve material, small and GPU-cheap.
mat = bpy.data.materials.new("ORBIT_Nerve_Gold")
mat.diffuse_color = (0.95, 0.55, 0.08, 1.0)
mat.metallic = 0.0
mat.roughness = 0.45
for o in selected:
    o.data.materials.clear()
    o.data.materials.append(mat)

# Build target manifest from preserved source names.
names = sorted(o.name for o in selected)
targets = {}
for key, pattern in TARGET_PATTERNS.items():
    rx = re.compile(pattern, re.I)
    targets[key] = [n for n in names if rx.search(n.replace("_", " "))]

final_tris = sum(len(o.data.polygons) for o in selected)
manifest = {
    "source": "https://github.com/LluisV/Z-Anatomy/blob/PC-Version/Resources/Models/FBX/NervousSystem100.fbx",
    "sourceLicense": "CC BY-SA 4.0 aggregate; cranial-nerve component credit documented separately",
    "canonicalHeightM": 1.70,
    "sourceObjectCount": len(all_objects),
    "exportedObjectCount": len(selected),
    "rawTriangles": raw_tris,
    "exportedTriangles": final_tris,
    "objects": names,
    "targets": targets,
}

os.makedirs(os.path.dirname(out), exist_ok=True)
os.makedirs(os.path.dirname(manifest_path), exist_ok=True)
with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

bpy.ops.object.select_all(action="DESELECT")
root.select_set(True)
for o in selected:
    o.select_set(True)
bpy.context.view_layer.objects.active = root

bpy.ops.export_scene.gltf(
    filepath=out,
    export_format="GLB",
    use_selection=True,
    export_yup=True,
    export_apply=True,
    export_materials="EXPORT",
    export_cameras=False,
    export_lights=False,
    export_animations=False,
)

size = os.path.getsize(out)
print(f"ORBIT nerve export: {len(selected)} objects, {final_tris:,} triangles, {size/1024/1024:.2f} MiB")
print(json.dumps({k: len(v) for k, v in targets.items()}, indent=2))
if size > 12 * 1024 * 1024:
    raise RuntimeError(f"mobile nerve GLB is {size/1024/1024:.2f} MiB; 12 MiB budget exceeded")
