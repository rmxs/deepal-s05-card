"""Builds the top-view (plan) layers from dec_deepal (MIT) as WebP, in the five card colours.

Usage: python3 tools/build_planta.py <dec_deepal>/custom_components/dec_deepal/vehicles/vista_planta/s05_2024 dist/images/top
The project only ships the silver paint for the top view (750x750, same car position in every layer), so the other
colours are derived here from it:
  * every layer that shows paint (base, bonnet, tailgate, doors, and their open states, open windows with the door frame)
    goes to <out>/<colour>/,
  * the low beam, which does not depend on the paint, goes to <out>/common/.
Recolouring only touches the paint: pixels darker than the glass threshold (roof glass, shadows, mirrors) stay as they
were, so the result keeps the original reflections. The open-state layers carry a red warning tint baked in (the open
door, bonnet or tailgate look pink, the open window is red): there the grey part of every pixel is recoloured and the
red excess is added back on top, so the paint is the car's colour and the warning tint stays (open window glass in full, open doors/bonnet/tailgate at PANEL_TINT). The gains were measured on the project's own Car View renders:
the mean colour of the paint in <colour>/base.png divided by that of the silver one.
black is made with a steep gamma on the luminance (darken()), so only the brightest reflections survive.
"""
import os, sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
PAINT = ["base", "hood_closed", "trunk_closed"] + [f"door_{p}_{s}_closed" for p in ("front", "rear") for s in ("left", "right")]
OPEN = ["hood_open", "trunk_open"] + [f"door_{p}_{s}_open" for p in ("front", "rear") for s in ("left", "right")] + [f"window_{p}_{s}_open" for p in ("front", "rear") for s in ("left", "right")]
COMMON = ["low_beam_on"]
GAIN = {"blue": (0.55, 0.816, 1.009), "grey": (0.721, 0.734, 0.776)}  # per-channel gain of the paint relative to silver
PANEL_TINT = 0.45  # how much of the baked-in red warning tint an open door, bonnet or tailgate keeps (the glass of an open window keeps all of it)
WHITE_LIFT = 0.33  # moves the paint this fraction of the way to 255 (keeps the highlights from clipping)

def lum_of(rgb):
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]

def paint_weight(lum, lo=55.0, hi=130.0):
    x = np.clip((lum - lo) / (hi - lo), 0, 1)
    return x * x * (3 - 2 * x)

def darken(rgb, gamma=8.0, top=255.0):
    """Black paint from the (bright) silver one: a steep gamma on the luminance keeps the brightest reflections and sinks the rest."""
    lum = np.maximum(lum_of(rgb), 1.0)
    scale = (top * (np.clip(lum / top, 0, 1) ** gamma)) / lum
    return rgb * scale[..., None]

def paint_rgb(rgb, name):
    """Recolours an (h, w, 3) float array of silver paint pixels."""
    if name == "black":
        w = paint_weight(lum_of(rgb))[..., None]
        return rgb * (1 - w) + darken(rgb) * w
    w = paint_weight(lum_of(rgb))[..., None]
    if name == "white":
        return rgb + (255 - rgb) * WHITE_LIFT * w
    return rgb * (1 + (np.array(GAIN[name]) - 1) * w)

def recolour(im, name, tint=None):
    """tint=None: plain paint layer. Otherwise an open-state layer: the red warning tint is kept, scaled by `tint`."""
    if name == "silver" and tint is None:
        return im
    a = np.array(im).astype(np.float64)
    rgb = a[..., :3]
    if tint is not None:
        n = rgb.min(axis=-1, keepdims=True)  # grey part of the pixel; what is left (rgb - n) is the red warning tint
        base = np.repeat(n, 3, axis=-1) if name == "silver" else paint_rgb(np.repeat(n, 3, axis=-1), name)
        a[..., :3] = np.clip(base + (rgb - n) * tint, 0, 255)
    else:
        a[..., :3] = np.clip(paint_rgb(rgb, name), 0, 255)
    return Image.fromarray(a.round().astype(np.uint8), "RGBA")

def save(im, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, "WEBP", quality=88, alpha_quality=100, method=6)

for name in ("black", "blue", "grey", "silver", "white"):
    for n in PAINT:
        save(recolour(Image.open(f"{src}/{n}.png").convert("RGBA"), name), f"{out}/{name}/{n}.webp")
    for n in OPEN:
        save(recolour(Image.open(f"{src}/{n}.png").convert("RGBA"), name, tint=1.0 if n.startswith("window") else PANEL_TINT), f"{out}/{name}/{n}.webp")
for n in COMMON:
    save(Image.open(f"{src}/{n}.png").convert("RGBA"), f"{out}/common/{n}.webp")
