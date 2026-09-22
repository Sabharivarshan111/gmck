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
mode = arg("mode")
out = arg("out")
manifest_path = arg("manifest")
if not src or not mode or not out or not manifest_path:
    raise SystemExit("--src --mode --out --manifest are required")

MODE_PATTERNS = {
    "brain": re.compile(
        r"(gyrus|insula|caudate nucleus|putamen|globus pallidus|hippocamp|"
        r"amygdaloid body|corpus callosum|thalamus|hypothalamus|"
        r"lateral ventricle|third ventricle|fourth ventricle|"
        r"pons[.]|medulla oblongata[.]|midbrain[.]|"
        r"cerebellar peduncle|tonsil of cerebellum|lingula of cerebellum|"
        r"aqueduct of midbrain|lobule)",
        re.I,
    ),
    "stomach": re.compile(r"^(Stomach|Duodenum|Greater omentum|Lesser omentum)$", re.I),
    "pectoralis_major": re.compile(r"pectoralis major muscle", re.I),
    "deltoid": re.compile(r"(acromial|clavicular|scapular spinal) part of deltoid muscle", re.I),
    "joints": re.compile(
        r"(anterior cruciate ligament|posterior cruciate ligament|"
        r"lateral meniscus|medial meniscus|articular capsule of knee joint|"
        r"acetabular labrum|articular capsule of hip joint|"
        r"articular capsule of glenohumeral joint|glenohumeral ligament)",
        re.I,
    ),
}
REQUIRED = {
    "brain": [re.compile(r"thalamus", re.I), re.compile(r"hippocampus", re.I), re.compile(r"pons[.]", re.I)],
    "stomach": [re.compile(r"^Stomach$", re.I)],
    "pectoralis_major": [re.compile(r"clavicular head of pectoralis major", re.I), re.compile(r"sternocostal head of pectoralis major", re.I)],
    "deltoid": [re.compile(r"acromial part of deltoid", re.I), re.compile(r"clavicular part of deltoid", re.I), re.compile(r"scapular spinal part of deltoid", re.I)],
    "joints": [re.compile(r"anterior cruciate ligament", re.I), re.compile(r"lateral meniscus", re.I), re.compile(r"acetabular labrum", re.I), re.compile(r"glenohumeral", re.I)],
}
TARGET_TRIS = {
    "brain": 260_000,
    "stomach": 40_000,
    "pectoralis_major": 40_000,
    "deltoid": 50_000,
    "joints": 70_000,
}

if mode not in MODE_PATTERNS:
    raise RuntimeError(f"unknown mode {mode}")

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=src, use_anim=False, automatic_bone_orientation=True)

all_objects = [o for o in bpy.context.scene.objects if o.type == "MESH"]
selected = [
    o for o in all_objects
    if len(o.data.polygons) > 20 and MODE_PATTERNS[mode].search(o.name)
]

if not selected:
    raise RuntimeError(f"{mode}: no source meshes matched")

names = [o.name for o in selected]
for requirement in REQUIRED[mode]:
    if not any(requirement.search(name) for name in names):
        raise RuntimeError(f"{mode}: required source pattern missing: {requirement.pattern}")

for o in list(all_objects):
    if o not in selected:
        bpy.data.objects.remove(o, do_unlink=True)

raw_tris = sum(len(o.data.polygons) for o in selected)
target = TARGET_TRIS[mode]
ratio = min(1.0, target / max(raw_tris, 1))

# Preserve small/skinny structures. Only simplify large surfaces when needed.
if ratio < 0.98:
    for o in selected:
        tris = len(o.data.polygons)
        if tris < 1500:
            continue
        if o.data.users > 1:
            o.data = o.data.copy()
        local_ratio = max(0.32, ratio)
        mod = o.modifiers.new(name="ORBIT_mobile_decimate", type="DECIMATE")
        mod.ratio = local_ratio
        mod.use_collapse_triangulate = True
        bpy.context.view_layer.objects.active = o
        o.select_set(True)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        o.select_set(False)

material = bpy.data.materials.new(f"ORBIT_ZAnatomy_{mode}")
material.diffuse_color = (0.65, 0.38, 0.82, 1.0)
material.metallic = 0.0
material.roughness = 0.45

for o in selected:
    o.data.materials.clear()
    o.data.materials.append(material)

exported_tris = sum(len(o.data.polygons) for o in selected)
manifest = {
    "mode": mode,
    "sourceFile": os.path.basename(src),
    "source": "LluisV/Z-Anatomy PC-Version Resources/Models/FBX",
    "license": "CC BY-SA 4.0 aggregate; keep source/component attribution",
    "objectCount": len(selected),
    "rawTriangles": raw_tris,
    "exportedTriangles": exported_tris,
    "objects": [
        {
            "name": o.name,
            "triangles": len(o.data.polygons),
            "vertices": len(o.data.vertices),
        }
        for o in sorted(selected, key=lambda x: x.name.lower())
    ],
}

os.makedirs(os.path.dirname(out), exist_ok=True)
os.makedirs(os.path.dirname(manifest_path), exist_ok=True)
with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

bpy.ops.object.select_all(action="DESELECT")
for o in selected:
    o.select_set(True)
bpy.context.view_layer.objects.active = selected[0]

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
print(f"ORBIT {mode}: {len(selected)} objects, {raw_tris} -> {exported_tris} tris, {size/1024/1024:.2f} MiB")
if size > 14 * 1024 * 1024:
    raise RuntimeError(f"{mode}: mobile reference unexpectedly large: {size/1024/1024:.2f} MiB")
