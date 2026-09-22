import bpy
import json
import os
import sys

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []

def arg(name, default=None):
    flag = f"--{name}"
    return argv[argv.index(flag) + 1] if flag in argv else default

src = arg("src")
label = arg("label")
out = arg("out")
if not src or not label or not out:
    raise SystemExit("--src, --label and --out are required")

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=src, use_anim=False, automatic_bone_orientation=True)

objects = []
for o in bpy.context.scene.objects:
    if o.type not in {"MESH", "CURVE"}:
        continue
    polygons = 0
    vertices = 0
    if o.type == "MESH":
        polygons = len(o.data.polygons)
        vertices = len(o.data.vertices)
    objects.append({
        "name": o.name,
        "type": o.type,
        "polygons": polygons,
        "vertices": vertices,
    })

payload = {
    "label": label,
    "sourceFile": os.path.basename(src),
    "objectCount": len(objects),
    "objects": sorted(objects, key=lambda x: x["name"].lower()),
}
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, "w", encoding="utf-8") as f:
    json.dump(payload, f, indent=2, ensure_ascii=False)

print(label, "objects:", len(objects))
for o in payload["objects"]:
    print(f"{o['name']} | {o['type']} | poly={o['polygons']} | verts={o['vertices']}")
