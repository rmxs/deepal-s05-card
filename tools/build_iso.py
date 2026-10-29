"""Converts the Car View layers of dec_deepal (MIT) to WebP.

Usage: python3 tools/build_iso.py <dec_deepal>/custom_components/dec_deepal/vehicles/vista_isometrica/s05_2024 dist/images/iso
Colour-dependent layers come from <src>/<colour_id>/, the rest (glass, wheels, headlights) from <src>/.
"""
import os, sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
COLORS = {"deep_space_black": "black", "andromeda_blue": "blue", "ganymade_grey": "grey", "mercury_silver": "silver", "moonlight_white": "white"}
BODY = ["base", "hood_closed", "hood_open", "trunk_closed", "trunk_open"] + [f"door_{p}_{s}_{st}" for p in ("front", "rear") for s in ("left", "right") for st in ("closed", "open")]
COMMON = [f"window_{p}_{s}_closed{x}" for p in ("front", "rear") for s in ("left", "right") for x in ("", "_door_open")] + ["wheels_pro", "wheels_open", "low_beam_on"]

def deepen(im, s0=0.42, top=140.0, desat=0.4):
    """Makes the black paint blacker without touching highlights or edges.

    The dec_deepal black renders are lifted (median luminance ~36/255 with a blue cast). Every body layer of the
    black car goes through the SAME curve, so doors, bonnet and tailgate keep matching the base: shadows and mid-tones
    are multiplied by a factor that rises from s0 (black) to 1 (at luminance `top`, so reflections stay as they were),
    and the blue cast is pulled toward neutral only in the shadows. Alpha is not changed.
    """
    a = np.array(im).astype(np.float64)
    rgb = a[..., :3]
    lum = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    x = np.clip(lum / top, 0, 1)
    sm = x * x * (3 - 2 * x)
    s = s0 + (1 - s0) * sm
    out = rgb * s[..., None]
    out = out + ((lum * s)[..., None] - out) * (desat * (1 - sm))[..., None]
    a[..., :3] = np.clip(out, 0, 255)
    return Image.fromarray(a.round().astype(np.uint8), "RGBA")

def save(a, b, tone=False):
    os.makedirs(os.path.dirname(b), exist_ok=True)
    im = Image.open(a).convert("RGBA")
    if tone:
        im = deepen(im)
    im.save(b, "WEBP", quality=88, alpha_quality=100, method=6)

for cid, name in COLORS.items():
    for n in BODY:
        save(f"{src}/{cid}/{n}.png", f"{out}/{name}/{n}.webp", tone=(name == "black"))
for n in COMMON:
    save(f"{src}/{n}.png", f"{out}/common/{n}.webp")

def alert(a, b, rgb=(239, 68, 68), k=0.7):
    """Red copy of a window glass layer, used when that window is open: same shape, solid warning colour, alpha scaled by k."""
    im = np.array(Image.open(a).convert("RGBA")).astype(np.float64)
    im[..., :3] = rgb
    im[..., 3] = np.clip(im[..., 3] * k, 0, 255)
    Image.fromarray(im.round().astype(np.uint8), "RGBA").save(b, "WEBP", quality=88, alpha_quality=100, method=6)

for p in ("front", "rear"):
    for s in ("left", "right"):
        for x in ("", "_door_open"):
            alert(f"{src}/window_{p}_{s}_closed{x}.png", f"{out}/common/window_{p}_{s}_alert{x}.webp")
