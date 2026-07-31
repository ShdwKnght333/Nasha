"""Shared helpers for generating the quest log's pixel art.

Two authoring styles are supported:

* ``from_ascii`` -- small icons are written as ASCII maps with a palette
  legend, which is far easier to read and tweak than row/colour tables.
* the drawing primitives -- wide parallax scenery is generated
  procedurally so the ridge lines stay seamlessly tileable.
"""

from __future__ import annotations

import math
import os

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ASSET_DIR = os.path.join(ROOT, "assets")
PIXEL_ART_DIR = os.path.join(ASSET_DIR, "pixel-art")
SCENERY_DIR = os.path.join(ASSET_DIR, "scenery")

# ------------------------------------------------------------------ colours --
GOLD = (179, 134, 43, 255)
GOLD_LIGHT = (255, 215, 0, 255)
GOLD_DARK = (122, 88, 19, 255)
CRIMSON = (110, 0, 0, 255)
CRIMSON_LIGHT = (163, 30, 30, 255)
STEEL = (216, 216, 224, 255)
STEEL_DARK = (150, 150, 160, 255)
BROWN = (92, 64, 33, 255)
BROWN_DARK = (58, 39, 18, 255)
CREAM = (247, 235, 211, 255)

# Dusk scenery palette
SKY_TOP = (26, 15, 2, 255)
SKY_MID = (61, 38, 58, 255)
SKY_LOW = (176, 96, 58, 255)
SKY_HORIZON = (232, 158, 74, 255)

RIDGE_FAR = (61, 58, 94, 255)
RIDGE_FAR_LIT = (94, 86, 134, 255)
RIDGE_NEAR = (41, 38, 63, 255)
RIDGE_NEAR_LIT = (66, 58, 96, 255)
RIDGE_FORE = (22, 19, 31, 255)
RIDGE_FORE_LIT = (44, 36, 56, 255)

PALETTE = {
    ".": None,
    "G": GOLD,
    "L": GOLD_LIGHT,
    "D": GOLD_DARK,
    "R": CRIMSON,
    "H": CRIMSON_LIGHT,
    "S": STEEL,
    "T": STEEL_DARK,
    "B": BROWN,
    "N": BROWN_DARK,
    "C": CREAM,
}


# ------------------------------------------------------------------- canvas --
def new_canvas(width: int, height: int) -> Image.Image:
    return Image.new("RGBA", (width, height), (0, 0, 0, 0))


def px(img: Image.Image, x: int, y: int, color) -> None:
    """Set a logical pixel, ignoring out-of-bounds writes."""
    if color is None:
        return
    w, h = img.size
    if 0 <= x < w and 0 <= y < h:
        img.putpixel((x, y), color)


def column(img: Image.Image, x: int, y0: int, y1: int, color) -> None:
    for y in range(y0, y1):
        px(img, x, y, color)


def from_ascii(rows, palette=None) -> Image.Image:
    """Build an image from a list of equal-length strings.

    Each character is looked up in ``palette``; ``.`` means transparent.
    """
    palette = palette or PALETTE
    rows = [r for r in rows if r != ""]
    width = len(rows[0])
    for y, row in enumerate(rows):
        if len(row) != width:
            raise ValueError(
                f"row {y} is {len(row)} chars, expected {width} -- "
                "every ASCII row must be the same width"
            )
    img = new_canvas(width, len(rows))
    for y, row in enumerate(rows):
        for x, char in enumerate(row):
            if char not in palette:
                raise KeyError(f"'{char}' at row {y} col {x} is not in the palette")
            px(img, x, y, palette[char])
    return img


def save(img: Image.Image, name: str, scale: int = 20, out_dir: str = None) -> str:
    """Upscale with NEAREST so pixel edges stay hard, then write to disk."""
    out_dir = out_dir or PIXEL_ART_DIR
    os.makedirs(out_dir, exist_ok=True)
    w, h = img.size
    big = img.resize((w * scale, h * scale), Image.NEAREST)
    path = os.path.join(out_dir, name)
    big.save(path)
    print(f"  saved {os.path.relpath(path, ROOT)}  ({w}x{h} @{scale}x)")
    return path


# -------------------------------------------------------------------- colour --
def lerp(a, b, t: float):
    t = max(0.0, min(1.0, t))
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(4))


def gradient_stops(t: float, stops):
    """Sample a list of ``(position, colour)`` stops at ``t`` in 0..1."""
    for i in range(len(stops) - 1):
        p0, c0 = stops[i]
        p1, c1 = stops[i + 1]
        if p0 <= t <= p1:
            span = (p1 - p0) or 1.0
            return lerp(c0, c1, (t - p0) / span)
    return stops[-1][1]


# ------------------------------------------------------------------ scenery --
def ridge_height(x: int, width: int, base: float, components) -> int:
    """Seamlessly tileable ridge line.

    ``components`` is a list of ``(amplitude, integer_frequency, phase)``.
    Integer frequencies guarantee the curve wraps cleanly at ``width``.
    """
    y = base
    for amplitude, frequency, phase in components:
        y += amplitude * math.sin(2 * math.pi * frequency * x / width + phase)
    return int(round(y))


def fill_below_ridge(img, width, height, base, components, body, lit, lit_rows=2):
    """Draw a filled silhouette under a ridge line with a lit top edge."""
    heights = [ridge_height(x, width, base, components) for x in range(width)]
    for x, top in enumerate(heights):
        top = max(0, min(height - 1, top))
        for y in range(top, height):
            px(img, x, y, lit if y - top < lit_rows else body)
    return heights
