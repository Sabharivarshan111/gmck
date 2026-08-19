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
# The disc behind the mark: near-black with a blue cast, not pure black.
PLANET = (10, 10, 20, 255)
# The shadow under the ball.
SHADOW = (2, 2, 6, 255)


# Geometry measured off the supplied artwork, then normalised to the icon
# square. The square is the mark's bounding box (x 370..1065, y 205..1140 in
# the source) enlarged 14% so nothing touches the edge, centred on the mark.
#
# The one number that had to be solved rather than read is the crest's radius.
# Its ends have to land exactly on the big ring's shoulders — that meeting is
# what makes the two arcs read as a single orbit instead of two stacked
# shapes — so it comes from the source's chord and rise:
#
#     chord 450px, rise 165px  ->  r = (rise^2 + (chord/2)^2) / (2 * rise)
#                              ->  r = 236px
#
# and the check is that at y=370 the crest is 225px wide and the big ring is
# 220px wide. They meet. Getting this wrong is what made two earlier attempts
# look like a keyhole.
BIG_CY, BIG_R = 0.468, 0.3255
CREST_CY, CREST_R = 0.2833, 0.2140
CREST_FROM, CREST_TO = 199.0, 341.0
BALL_CX, BALL_CY, BALL_R = 0.495, 0.664, 0.130
HALO_CY, HALO_R = 0.722, 0.196
PLANET_CY, PLANET_R = 0.470, 0.460
LINE_W, HALO_W = 0.0394, 0.0516


def draw_mark(size, inset=0.0, background=True):
    """
    The ORBIT mark.

    Drawn from the constants above rather than by eye. Two things that are not
    obvious and are the difference between this and a rough likeness:

      * The **ball overlaps its ring**. The ring's centre is lower than the
        ball's (0.714 against 0.672), so white shows thickest below and the
        ball reads as resting in front of it. Concentric reads as a target.
      * There is a **dark rim** under the ball, the shadow that gives it depth
        in the source. Without it the ball looks pasted on.

    `background` is false for the adaptive-icon foreground, which must stay
    transparent so the launcher's own plate shows through — including the
    planet disc, which is part of the background layer conceptually even
    though it is drawn here.
    """
    w = size * S
    img = Image.new("RGBA", (w, w), BLACK if background else (0, 0, 0, 0))
    glow = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    d = ImageDraw.Draw(img)

    k = 1.0 - inset
    cx = w * 0.500
    line = max(2, int(w * LINE_W * k))

    def disc(draw, cy_, r, fill, cx_=None):
        x = cx if cx_ is None else cx_
        draw.ellipse([x - r, cy_ - r, x + r, cy_ + r], fill=fill)

    def ring(draw, cy_, r, width, start=0, end=360):
        draw.arc([cx - r, cy_ - r, cx + r, cy_ + r], start, end, fill=WHITE, width=width)

    def at(v):
        """A fraction of the square, about its centre, shrunk by `inset`."""
        return w * (0.5 + (v - 0.5) * k)

    if background:
        disc(d, at(PLANET_CY), w * PLANET_R * k, PLANET)

    for target in (gd, d):
        ring(target, at(CREST_CY), w * CREST_R * k, line, CREST_FROM, CREST_TO)
        ring(target, at(BIG_CY), w * BIG_R * k, line)
        ring(target, at(HALO_CY), w * HALO_R * k, max(2, int(w * HALO_W * k)))

    ball_x = w * (0.5 + (BALL_CX - 0.5) * k)
    r_ball = w * BALL_R * k
    disc(d, at(BALL_CY) + r_ball * 0.10, r_ball * 1.09, SHADOW, cx_=ball_x)
    disc(d, at(BALL_CY), r_ball, CYAN, cx_=ball_x)
    disc(gd, at(BALL_CY), r_ball, CYAN, cx_=ball_x)

    glow = glow.filter(ImageFilter.GaussianBlur(w * 0.017))
    base = Image.new("RGBA", (w, w), BLACK if background else (0, 0, 0, 0))
    out = Image.alpha_composite(base, glow)
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
