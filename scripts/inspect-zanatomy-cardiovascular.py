import bpy
import json
import os
import re
import sys

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []

def arg(name, default=None):
    flag = f"--{name}"
    return argv[argv.index(flag) + 1] if flag in argv else default

src = arg("src")
out = arg("out")
if not src or not out:
    raise SystemExit("--src and --out are required")

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=src, use_anim=False, automatic_bone_orientation=True)

objects = []
for o in bpy.context.scene.objects:
    if o.type not in {"MESH", "CURVE"}:
        continue
    poly = 0
    verts = 0
    if o.type == "MESH":
        poly = len(o.data.polygons)
        verts = len(o.data.vertices)
    objects.append({
        "name": o.name,
        "type": o.type,
        "polygons": poly,
        "vertices": verts,
    })

patterns = {
    "chordae_tendineae": r"chord|tendine",
    "interatrial_septum": r"interatrial.*sept|sept.*interatrial|atrial.*sept",
    "interventricular_septum": r"interventricular.*sept|sept.*interventricular|ventricular.*sept",
    "trabeculae_carneae": r"trabeculae.*carneae|trabecular.*ventric",
    "moderator_band": r"moderator band|septomarginal",
    "fossa_ovalis": r"fossa ovalis|oval fossa",
    "crista_terminalis": r"crista terminalis|terminal crest|sulcus terminalis",
    "right_auricle": r"right (?:auricle|atrial appendage)",
    "left_auricle": r"left (?:auricle|atrial appendage)",
    "pericardium": r"pericard",
    "sa_node": r"sinoatrial|sinus node|\bsa node\b",
    "av_node": r"atrioventricular node|\bav node\b",
    "bundle_of_his": r"bundle of his|atrioventricular bundle|his bundle",
    "purkinje": r"purkinje",
    "valve": r"valve|leaflet|cusp",
    "papillary": r"papillary",
    "atrium": r"atrium|atrial",
    "ventricle": r"ventricle|ventricular",
    "coronary": r"coronary",
}

matches = {}
for key, pattern in patterns.items():
    rx = re.compile(pattern, re.I)
    matches[key] = [o for o in objects if rx.search(o["name"])]

heartish = re.compile(
    r"heart|cardiac|atri|ventric|valve|leaflet|cusp|papillary|chord|trabec|"
    r"septomarginal|moderator|septum|fossa ovalis|crista terminalis|"
    r"sinoatrial|atrioventricular|bundle of his|purkinje|pericard|auricle|appendage|coronary",
    re.I,
)
heart_objects = [o for o in objects if heartish.search(o["name"])]

payload = {
    "source": "https://github.com/LluisV/Z-Anatomy/blob/PC-Version/Resources/Models/FBX/CardioVascular41.fbx",
    "license": "Z-Anatomy models CC BY-SA 4.0 aggregate; review component attribution before runtime import",
    "objectCount": len(objects),
    "heartRelatedObjectCount": len(heart_objects),
    "heartRelatedObjects": heart_objects,
    "matches": matches,
}

os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, "w", encoding="utf-8") as f:
    json.dump(payload, f, indent=2, ensure_ascii=False)

print("Imported", len(objects), "mesh/curve objects")
print("Heart-related", len(heart_objects))
for key, vals in matches.items():
    print(f"{key}: {len(vals)}")
