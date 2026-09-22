import bpy
import json
import math
import os
import sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []

def arg(name, default=None):
    flag = f"--{name}"
    return argv[argv.index(flag) + 1] if flag in argv else default

src = arg("src")
out = arg("out")
manifest_path = arg("manifest")
if not src or not out or not manifest_path:
    raise SystemExit("--src, --out and --manifest are required")

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=src, use_anim=False, automatic_bone_orientation=True)

all_objects = [o for o in bpy.context.scene.objects if o.type in {"MESH", "CURVE"}]
if not all_objects:
    raise RuntimeError("Z-Anatomy cardiovascular FBX imported no geometry")

mins = Vector((math.inf, math.inf, math.inf))
maxs = Vector((-math.inf, -math.inf, -math.inf))
for o in all_objects:
    for corner in o.bound_box:
        p = o.matrix_world @ Vector(corner)
        mins.x = min(mins.x, p.x); mins.y = min(mins.y, p.y); mins.z = min(mins.z, p.z)
        maxs.x = max(maxs.x, p.x); maxs.y = max(maxs.y, p.y); maxs.z = max(maxs.z, p.z)

height = maxs.z - mins.z
if height <= 0:
    raise RuntimeError("invalid cardiovascular source bounds")

wanted_names = {"Interatrial septum.j"}
selected = [o for o in all_objects if o.name in wanted_names]
if len(selected) != len(wanted_names):
    found = sorted(o.name for o in selected)
    raise RuntimeError(f"expected {sorted(wanted_names)}, found {found}")

for o in list(all_objects):
    if o not in selected:
        bpy.data.objects.remove(o, do_unlink=True)

for o in list(selected):
    if o.type == "CURVE":
        bpy.context.view_layer.objects.active = o
        o.select_set(True)
        bpy.ops.object.convert(target="MESH")
        o.select_set(False)

selected = [o for o in bpy.context.scene.objects if o.type == "MESH"]
root = bpy.data.objects.new("ORBIT_ZAnatomy_Heart_Internal", None)
bpy.context.collection.objects.link(root)

source_center_x = (mins.x + maxs.x) / 2.0
source_center_y = (mins.y + maxs.y) / 2.0
scale = 1.70 / height

for o in selected:
    world = o.matrix_world.copy()
    o.parent = root
    o.matrix_world = world

root.scale = (scale, scale, scale)
root.location = (-source_center_x * scale, -source_center_y * scale, -mins.z * scale)

mat = bpy.data.materials.new("ORBIT_Interatrial_Septum")
mat.diffuse_color = (0.95, 0.45, 0.46, 1.0)
mat.metallic = 0.0
mat.roughness = 0.42
for o in selected:
    o.data.materials.clear()
    o.data.materials.append(mat)

manifest = {
    "source": "https://github.com/LluisV/Z-Anatomy/blob/PC-Version/Resources/Models/FBX/CardioVascular41.fbx",
    "license": "Z-Anatomy models CC BY-SA 4.0 aggregate; component attribution reviewed in ORBIT model attribution",
    "canonicalHeightM": 1.70,
    "sourceObjectCount": len(all_objects),
    "sourceBounds": {"min": list(mins), "max": list(maxs)},
    "exported": [
        {
            "key": "interatrial_septum",
            "sourceName": o.name,
            "triangles": len(o.data.polygons),
            "vertices": len(o.data.vertices),
        }
        for o in selected
    ],
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
print(f"ORBIT heart supplement: {len(selected)} mesh, {size/1024:.1f} KiB")
if size > 2 * 1024 * 1024:
    raise RuntimeError(f"heart supplement unexpectedly large: {size/1024/1024:.2f} MiB")
