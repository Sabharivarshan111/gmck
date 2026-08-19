"""
Rebuild the ORBIT MBBS QB mark as a launcher icon.

Drawn rather than resampled: the source is a wordmark lockup on a tall canvas,
and a launcher icon is a small square. Scaling that down puts "ORBIT MBBS QB"
at three pixels tall — unreadable, and it steals the room the symbol needs. So
the symbol is reproduced at icon proportions and the words are dropped, which
is what every app does with a lockup.

Everything is drawn at 4x and downsampled, because the strokes are thin rings
and Pillow does not antialias arcs.
"""
from PIL import Image, ImageDraw, ImageFilter

S = 4  # supersample

BLACK = (5, 5, 8, 255)
WHITE = (255, 255, 255, 255)
CYAN = (60, 214, 245, 255)


def draw_mark(size, inset=0.0, background=True):
    """
    The symbol on a square canvas. `inset` shrinks it for adaptive icons.

    Proportions read off the supplied artwork:

      * The big ring is the anchor, sitting just below centre.
      * Above it, the crest of a second circle — drawn as the top arc only,
        with its centre *below* the crest so the ends sweep down towards the
        big ring's shoulders. Placing that centre above the arc pushes the
        crest off the canvas, which is what a first attempt did.
      * The cyan body sits low inside the big ring, wrapped by its own white
        ring. That ring is only slightly larger than the ball: make it much
        larger and the mark reads as concentric circles — a target — instead
        of a body in an orbit.
    """
    w = size * S
    img = Image.new("RGBA", (w, w), BLACK if background else (0, 0, 0, 0))
    glow = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    d = ImageDraw.Draw(img)

    scale = 1.0 - inset
    cx = w / 2
    stroke = max(2, int(w * 0.046 * scale))

    r_big = w * 0.295 * scale
    cy_big = w * 0.560

    # Centre below the crest, so only the top sweeps into view.
    r_crest = w * 0.225 * scale
    cy_crest = w * 0.300

    def ring(draw, cy_, r, width, start=0, end=360):
        draw.arc([cx - r, cy_ - r, cx + r, cy_ + r], start, end, fill=WHITE, width=width)

    for target in (gd, d):
        ring(target, cy_crest, r_crest, stroke, 203, 337)
        ring(target, cy_big, r_big, stroke)

    r_body = w * 0.112 * scale
    cy_body = w * 0.655
    r_halo = r_body * 1.34
    for target in (gd, d):
        ring(target, cy_body + r_body * 0.06, r_halo, max(2, int(stroke * 1.05)))
    for target in (d, gd):
        target.ellipse(
            [cx - r_body, cy_body - r_body, cx + r_body, cy_body + r_body], fill=CYAN
        )

    glow = glow.filter(ImageFilter.GaussianBlur(w * 0.020))
    out = Image.alpha_composite(
        Image.new("RGBA", (w, w), BLACK if background else (0, 0, 0, 0)), glow
    )
    out = Image.alpha_composite(out, img)
    return out.resize((size, size), Image.LANCZOS)


def rounded(img):
    """Legacy round icon: the same mark clipped to a circle."""
    size = img.size[0]
    mask = Image.new("L", (size * S, size * S), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size * S, size * S], fill=255)
    mask = mask.resize((size, size), Image.LANCZOS)
    out = img.copy()
    out.putalpha(mask)
    return out


DENSITIES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
import os
import sys

# Default to the app's own res/ so this can be run with no arguments.
root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    '..', 'android', 'app', 'src', 'main', 'res',
)
for name, px in DENSITIES.items():
    folder = os.path.join(root, f"mipmap-{name}")
    os.makedirs(folder, exist_ok=True)
    mark = draw_mark(px)
    mark.save(os.path.join(folder, "ic_launcher.png"))
    rounded(mark).save(os.path.join(folder, "ic_launcher_round.png"))
    # Adaptive foreground: 108dp canvas, art inside the 72dp safe zone, so the
    # launcher can mask it to whatever shape the phone uses without clipping.
    fg = draw_mark(int(px * 108 / 48), inset=0.34, background=False)
    fg.save(os.path.join(folder, "ic_launcher_foreground.png"))
print("icons written")
