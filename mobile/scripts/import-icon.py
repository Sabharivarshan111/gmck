"""
Replace the launcher icon with a supplied image.

    python3 scripts/import-icon.py path/to/orbit.png

Use this instead of make-icon.py the moment the real artwork is available as a
file: make-icon.py *draws* the mark from measurements, which is a close
reproduction and nothing more.

What this does that dropping a PNG in by hand does not:

  * **Trims the empty margin, then adds a measured one back.** Artwork
    usually carries generous padding; trimming to the ink and stopping there
    is the opposite mistake, and the icon then sits visibly *larger* than
    every other app's because nothing on the home screen has zero margin.
    PAD is that margin, as a fraction of the square.
  * **Crops to the symbol** by default, dropping any wordmark below it. A
    lockup's text lands about three pixels tall in a 48dp icon while taking
    the room the symbol needs. Pass --keep-text to override.
  * **Writes every density**, plus the 108dp adaptive foreground with the art
    inside the 72dp safe zone so a circular or squircle mask cannot clip it.
"""
import os
import sys

from PIL import Image

DENSITIES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
RES = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "android", "app", "src", "main", "res",
)


def trim(img, tolerance=12):
    """Drop rows and columns that are essentially the background colour."""
    rgb = img.convert("RGB")
    w, h = rgb.size
    corner = rgb.getpixel((0, 0))

    def interesting(px):
        return sum(abs(a - b) for a, b in zip(px, corner)) > tolerance

    px = rgb.load()
    left, right, top, bottom = w, 0, h, 0
    for y in range(h):
        for x in range(w):
            if interesting(px[x, y]):
                left, right = min(left, x), max(right, x)
                top, bottom = min(top, y), max(bottom, y)
    if right <= left or bottom <= top:
        return img
    return img.crop((left, top, right + 1, bottom + 1))


def square(img, fill):
    """Pad to a square without stretching; stretching a logo is unforgivable."""
    w, h = img.size
    side = max(w, h)
    out = Image.new("RGBA", (side, side), fill)
    out.paste(img, ((side - w) // 2, (side - h) // 2), img if img.mode == "RGBA" else None)
    return out


# Breathing room around the trimmed art, as a fraction of the finished square
# per side. Android's own launcher icons sit at roughly this, and matching it
# is what makes an icon look like it belongs in the grid rather than shouting.
PAD = 0.07


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    source = sys.argv[1]
    keep_text = "--keep-text" in sys.argv

    img = Image.open(source).convert("RGBA")
    background = img.convert("RGB").getpixel((0, 0)) + (255,)
    art = trim(img)

    if not keep_text:
        # A lockup is symbol-above-words. Keeping the upper square of the
        # trimmed art drops the words without needing to find them.
        w, h = art.size
        if h > w * 1.12:
            art = art.crop((0, 0, w, w))
            art = trim(art)

    art = square(art, background)

    # The margin. Done after squaring so it is even on all four sides.
    side = art.size[0]
    padded_side = int(side / (1 - 2 * PAD))
    padded = Image.new("RGBA", (padded_side, padded_side), background)
    offset = (padded_side - side) // 2
    padded.paste(art, (offset, offset), art)
    art = padded

    root = os.path.abspath(RES)
    for name, px in DENSITIES.items():
        folder = os.path.join(root, f"mipmap-{name}")
        os.makedirs(folder, exist_ok=True)
        art.resize((px, px), Image.LANCZOS).save(os.path.join(folder, "ic_launcher.png"))

        # Round icon: the same art, clipped to a circle.
        big = art.resize((px * 4, px * 4), Image.LANCZOS)
        mask = Image.new("L", big.size, 0)
        from PIL import ImageDraw
        ImageDraw.Draw(mask).ellipse([0, 0, big.size[0], big.size[1]], fill=255)
        round_icon = big.copy()
        round_icon.putalpha(mask)
        round_icon.resize((px, px), Image.LANCZOS).save(
            os.path.join(folder, "ic_launcher_round.png")
        )

        # Adaptive foreground: transparent, art at 2/3 so the 72dp safe zone
        # holds it whatever shape the launcher masks to.
        side = int(px * 108 / 48)
        fg = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        inner = int(side * 0.66)
        fg.paste(art.resize((inner, inner), Image.LANCZOS), ((side - inner) // 2,) * 2)
        fg.save(os.path.join(folder, "ic_launcher_foreground.png"))
        print(f"wrote mipmap-{name}")

    print(
        "\nDone. The adaptive icon's plate colour is res/values/colors.xml "
        "(ic_launcher_background) — set it to the artwork's background."
    )


main()
