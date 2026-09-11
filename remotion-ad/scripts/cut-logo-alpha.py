"""
Matte the Orbit mark so it sits on any background with no box around it.

The logo ships as white rings and a cyan disc on a SOLID BLACK SQUARE, with no
alpha channel. Dropped onto the end card's dark ground it read as a pasted
rectangle — which the app's owner called out, correctly, as amateurish.

`mix-blend-mode: screen` was the first attempt and it is not good enough: the
square's ground sits a few per cent above pure black, so a faint box survives,
and the same trick inverts into a dark box the moment the card is light.

So the alpha is cut for real:

* **alpha = luminance.** For white-on-black artwork that IS the matte. It also
  turns the glow's falloff into genuine partial alpha rather than a hard edge,
  which is what makes it look placed rather than cut out.
* **A floor is subtracted**, because the ground is not actually black. Without
  it the whole square keeps a little alpha, which is the box.
* **Colour is unpremultiplied**, so the mark keeps its own white and cyan
  instead of staying darkened by the black it was sitting on.
* **Cropped to its own bounds**, so nothing is padded with invisible pixels
  that still take up layout.

Run only when the source artwork changes:

    python3 scripts/cut-logo-alpha.py mobile/artwork/orbit-logo.png
"""
import sys
from PIL import Image
import numpy as np

FLOOR = 0.10
OUT = 'public/orbit-logo.png'

src_path = sys.argv[1] if len(sys.argv) > 1 else '../mobile/artwork/orbit-logo.png'
src = Image.open(src_path).convert('RGB')
a = np.asarray(src).astype(np.float32) / 255.0

alpha = np.clip((a.max(axis=2) - FLOOR) / (1.0 - FLOOR), 0.0, 1.0)
rgb = np.clip(a / np.maximum(alpha, 1e-3)[..., None], 0.0, 1.0)

img = Image.fromarray(
    (np.concatenate([rgb, alpha[..., None]], axis=2) * 255).astype(np.uint8), 'RGBA'
)
img = img.crop(img.getbbox())
img.save(OUT)
print(f'{src_path} {src.size} -> {OUT} {img.size}, corner alpha {img.getpixel((0, 0))[3]}')
