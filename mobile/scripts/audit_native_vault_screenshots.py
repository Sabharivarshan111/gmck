#!/usr/bin/env python3
"""Assemble genuine native + Vercel screenshots. Never report visual parity solely from image similarity."""
from __future__ import annotations
import json, sys
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
folder=Path(sys.argv[1]) if len(sys.argv)>1 else Path('artifacts/native-vault-parity')
folder.mkdir(parents=True,exist_ok=True)
pairs=[
 ('studio','00-vercel-studio-393x852.png','01-android-native-clinical-studio.png'),
 ('case','00-vercel-case-393x852.png','03-android-native-stemi-case.png'),
 ('icu','00-vercel-icu-393x852.png','05-android-native-icu-waveforms.png'),
 ('studio-light','00-vercel-studio-light-393x852.png','01b-native-clinical-studio-light.png'),
 ('case-choices','00-vercel-case-choices-393x852.png','02-android-native-case-choices.png'),
 ('xray','00-vercel-xray-393x852.png','12-android-offline-native-xray.png'),
 ('xray-case','00-vercel-xray-case-393x852.png','13-android-native-xray-case.png'),
 ('mri-axial','00-vercel-mri-axial-393x852.png','14-android-offline-native-mri-axial.png'),
 ('mri-coronal','00-vercel-mri-coronal-393x852.png','15-android-offline-native-mri-coronal.png'),
 ('mri-sagittal','00-vercel-mri-sagittal-393x852.png','16-android-offline-native-mri-sagittal.png'),
 ('radiology-fullscreen','00-vercel-radiology-fullscreen-393x852.png','17-android-native-radiology-fullscreen.png'),
 ('clubbing','00-vercel-clubbing-393x852.png','18-android-offline-native-clubbing.png'),
 ('clubbing-viva','00-vercel-clubbing-viva-393x852.png','19-android-native-clubbing-viva.png')
]
result={"status":"NOT_CERTIFIED","pairs":[],"notes":"Different platforms have system chrome and font rendering differences. Visual review of screenshots AND functional tests is required; 3D/POCUS/sound not fully native."}
for label,web,native in pairs:
    w,n=folder/web,folder/native
    item={"label":label,"web":web,"native":native,"captured_both":w.exists() and n.exists()}
    if item["captured_both"]:
        with Image.open(w) as aa,Image.open(n) as bb:
            a=ImageOps.exif_transpose(aa).convert('RGB')
            b=ImageOps.exif_transpose(bb).convert('RGB')
            item["dimensions"]={"web":list(a.size),"native":list(b.size)}
            a.thumbnail((393,852))
            b.thumbnail((393,852))
            canvas=Image.new('RGB',(800,920),'#171821')
            canvas.paste(a,(0,35))
            canvas.paste(b,(406,35))
            dr=ImageDraw.Draw(canvas)
            dr.text((8,10),f"VERCEL - {label}",fill='white')
            dr.text((415,10),f"REAL ANDROID - {label}",fill='white')
            dr.text((8,900),"Side-by-side human review REQUIRED; NOT pixel-identical certified",fill='#ff9a9a')
            path=folder/f"comparison-{label}.png"
            canvas.save(path)
            item["side_by_side"]=path.name
    result["pairs"].append(item)
(folder/"native-visual-audit.json").write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
# Fail the audit as incomplete when visual evidence is missing, but preserve artifacts.
if not all(p["captured_both"] for p in result["pairs"]):
    raise SystemExit("INCOMPLETE: one or more actual Vercel/Android screenshots missing")
