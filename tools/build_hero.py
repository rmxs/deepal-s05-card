#!/usr/bin/env python3
"""Build the colour hero images from the Car View layers.

Usage: python3 tools/build_hero.py dist/images/iso dist/images/car

The black hero images in dist/images/car/ are studio photos and are not touched.
For the other colours this script composites the closed car from the iso layers,
places it on a dark studio background and writes hero_<colour>.jpg (1000x556).

The car is aligned so the charge port sits where the card's charging animation
expects it (399,117 in the 500x278 hero coordinate system).
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

# Output is 2x the 500x278 hero canvas, so it stays sharp on high-DPI screens.
S = 2
W, H = 500 * S, 278 * S
COLORS = ("blue", "grey", "silver", "white")

# Bottom to top: the same order the card uses in _isoRender(), with every door,
# window, hood and trunk closed.
CLOSED = [
    "window_rear_right_closed",
    "door_rear_right_closed",
    "window_front_right_closed",
    "door_front_right_closed",
    "trunk_closed",
    "base",
    "hood_closed",
    "window_rear_left_closed",
    "door_rear_left_closed",
    "window_front_left_closed",
    "door_front_left_closed",
]

# The charge port is at (560,230) in the 750x500 iso render and at (399,117) in
# the hero canvas. Scale 0.68 makes the car match the black studio photos.
SCALE = 0.64 * S
PORT = (560, 230)
TARGET = (399 * S, 117 * S)


def background() -> Image.Image:
    """Dark studio backdrop with a soft spotlight and vignette."""
    bg = Image.new("RGB", (W, H), (4, 5, 7))
    draw = ImageDraw.Draw(bg)
    for y in range(H):
        value = int(5 + 18 * (y / H) ** 1.4)
        draw.line([(0, y), (W, y)], fill=(value, value + 1, value + 3))

    glow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(glow).ellipse([80 * S, -90 * S, 420 * S, 290 * S], fill=70)
    glow = glow.filter(ImageFilter.GaussianBlur(55 * S))
    bg = Image.composite(Image.new("RGB", (W, H), (22, 25, 31)), bg, glow)

    vignette = Image.new("L", (W, H), 0)
    ImageDraw.Draw(vignette).ellipse(
        [-W * 0.35, -H * 0.6, W * 1.35, H * 1.6], fill=255
    )
    vignette = vignette.filter(ImageFilter.GaussianBlur(55 * S))
    return Image.composite(bg, Image.new("RGB", (W, H), (0, 0, 0)), vignette)


def layer(iso: Path, colour: str, name: str) -> Image.Image:
    """Load a colour layer, falling back to the shared common/ folder."""
    path = iso / colour / f"{name}.webp"
    if not path.exists():
        path = iso / "common" / f"{name}.webp"
    if not path.exists():
        raise SystemExit(f"missing layer: {path}")
    return Image.open(path).convert("RGBA")


def car(iso: Path, colour: str) -> Image.Image:
    """Composite the closed car for one colour."""
    out = Image.new("RGBA", (750, 500), (0, 0, 0, 0))
    for name in CLOSED:
        out.alpha_composite(layer(iso, colour, name))
    return out.resize((int(750 * SCALE), int(500 * SCALE)), Image.LANCZOS)


def make(iso: Path, colour: str) -> Image.Image:
    """Render one colour hero image."""
    image = car(iso, colour)
    width, height = image.size
    x = int(TARGET[0] - SCALE * PORT[0])
    y = int(TARGET[1] - SCALE * PORT[1])

    out = background()

    # Faded mirror image under the car.
    reflection = image.transpose(Image.FLIP_TOP_BOTTOM)
    alpha = reflection.getchannel("A")
    fade = Image.new("L", (width, height), 0)
    fade_draw = ImageDraw.Draw(fade)
    for row in range(height):
        fade_draw.line(
            [(0, row), (width, row)],
            fill=int(70 * (1 - row / height) ** 1.8),
        )
    alpha = Image.composite(alpha, Image.new("L", (width, height), 0), fade)
    reflection.putalpha(alpha)
    reflection = reflection.filter(ImageFilter.GaussianBlur(1.6 * S))
    out.paste(reflection, (x, y + height - 6 * S), reflection)
    out.paste(image, (x, y), image)
    return out


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    iso, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)
    for colour in COLORS:
        path = out_dir / f"hero_{colour}.jpg"
        make(iso, colour).save(path, "JPEG", quality=90, optimize=True)
        print(path)
    print(f"OK: {len(COLORS)} hero images -> {out_dir}")


if __name__ == "__main__":
    main()
