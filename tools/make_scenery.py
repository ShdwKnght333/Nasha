"""Generator for the hero cover art: seamlessly tileable parallax ridges,
the two adventurer sprites, and the Open Graph share image.

The ridge lines are built from sine components with *integer* frequencies so
the silhouette wraps perfectly when the layer is repeated horizontally --
that is what lets the parallax scroll forever without a visible seam.

Run with:  npm run art
"""

from __future__ import annotations

import math
import os
import random

from PIL import Image

from pixelkit import (
    ASSET_DIR,
    GOLD,
    GOLD_DARK,
    GOLD_LIGHT,
    PIXEL_ART_DIR,
    RIDGE_FAR,
    RIDGE_FAR_LIT,
    RIDGE_FORE,
    RIDGE_FORE_LIT,
    RIDGE_NEAR,
    RIDGE_NEAR_LIT,
    SCENERY_DIR,
    SKY_HORIZON,
    SKY_LOW,
    SKY_MID,
    SKY_TOP,
    column,
    fill_below_ridge,
    from_ascii,
    gradient_stops,
    new_canvas,
    px,
    ridge_height,
    save,
)

W = 320    # logical width of each parallax layer
H = 120    # logical height
SCALE = 4  # upscale factor -> 1280 x 480

SILHOUETTE = {
    ".": None,
    "K": (24, 20, 34, 255),    # body
    "G": GOLD,                 # warm rim light
    "D": GOLD_DARK,
}

# The couple stand against a lit dusk sky, so they are drawn in full colour
# rather than as silhouettes.
COUPLE = {
    ".": None,
    "H": (46, 30, 24, 255),     # hair
    "S": (222, 166, 116, 255),  # skin
    "R": (186, 38, 50, 255),    # saree red
    "M": (132, 22, 38, 255),    # saree fold shadow
    "G": (240, 196, 74, 255),   # gold trim / jewellery
    "C": (244, 232, 206, 255),  # kurta cream
    "B": (198, 178, 140, 255),  # kurta shadow
}


# ------------------------------------------------------------- decorations --
def draw_gopuram(img, cx, base_y, color, lit):
    """A stepped South-Indian temple tower silhouette."""
    tiers = [(11, 4), (9, 4), (7, 4), (5, 4), (3, 3)]
    y = base_y
    for half_width, tier_height in tiers:
        y -= tier_height
        for x in range(cx - half_width, cx + half_width + 1):
            for ty in range(y, y + tier_height):
                px(img, x, ty, lit if ty == y else color)
    # finial
    column(img, cx, y - 3, y, color)
    px(img, cx, y - 4, lit)


def draw_palm(img, x, ground_y, height, color, lit):
    """A coconut palm: slightly leaning trunk with a fan of fronds."""
    for i in range(height):
        px(img, x + i // 6, ground_y - i, color)
    top_x, top_y = x + height // 6, ground_y - height
    for dx, dy in [(-4, 0), (-3, -1), (-2, -2), (4, 0), (3, -1), (2, -2),
                   (-3, 1), (3, 1), (-1, -3), (1, -3), (0, -3)]:
        px(img, top_x + dx, top_y + dy, lit if dy < -1 else color)


def draw_conifer(img, x, ground_y, height, color, lit):
    """A simple triangular hill tree."""
    for i in range(height):
        half = max(0, (height - i) // 3)
        for dx in range(-half, half + 1):
            px(img, x + dx, ground_y - i, lit if i == height - 1 else color)


# ----------------------------------------------------------------- layers --
def make_far_layer():
    img = new_canvas(W, H)
    fill_below_ridge(
        img, W, H,
        base=62,
        components=[(10, 1, 0.4), (5, 2, 1.9), (2.5, 4, 0.2)],
        body=RIDGE_FAR, lit=RIDGE_FAR_LIT, lit_rows=2,
    )
    save(img, "ridge-far.png", SCALE, SCENERY_DIR)


def make_near_layer():
    img = new_canvas(W, H)
    components = [(11, 1, 2.5), (6, 3, 0.7), (3, 5, 1.1)]
    heights = fill_below_ridge(
        img, W, H,
        base=82, components=components,
        body=RIDGE_NEAR, lit=RIDGE_NEAR_LIT, lit_rows=2,
    )
    # Temple tower nestled on the ridge, away from the tiling seam
    gopuram_x = 232
    draw_gopuram(img, gopuram_x, heights[gopuram_x] + 1, RIDGE_NEAR, RIDGE_NEAR_LIT)
    # Scattered conifers, kept clear of the seam and the temple
    rng = random.Random(7)
    for _ in range(26):
        x = rng.randrange(8, W - 8)
        if abs(x - gopuram_x) < 16:
            continue
        draw_conifer(img, x, heights[x] + 1, rng.randint(5, 9), RIDGE_NEAR, RIDGE_NEAR_LIT)
    save(img, "ridge-near.png", SCALE, SCENERY_DIR)


def make_fore_layer():
    img = new_canvas(W, H)
    components = [(5, 2, 1.2), (3, 3, 2.8)]
    heights = fill_below_ridge(
        img, W, H,
        base=104, components=components,
        body=RIDGE_FORE, lit=RIDGE_FORE_LIT, lit_rows=1,
    )
    rng = random.Random(21)
    # Coastal palms
    for x in (30, 74, 196, 268):
        draw_palm(img, x, heights[x] + 1, rng.randint(16, 22), RIDGE_FORE, RIDGE_FORE_LIT)
    # Grass tufts, held back from both edges so the tile still wraps
    for _ in range(120):
        x = rng.randrange(4, W - 4)
        column(img, x, heights[x] - rng.randint(1, 3), heights[x] + 1, RIDGE_FORE)
    save(img, "ridge-fore.png", SCALE, SCENERY_DIR)


# ---------------------------------------------------------------- sprites --
ADVENTURER_A = [
    "....HHHH....",
    "...HHHHHH...",
    "..HHSSSSHH..",
    "..HHSSSSHH..",
    "...HSSSSH...",
    "....GSSG....",
    "...GRRRRG...",
    "..SRRRRRRS..",
    "..SRRRRRRS..",
    "...RRRRRR...",
    "...GGGGGG...",
    "..RRRRRRRR..",
    "..RRRRRRRR..",
    ".RRRRRRRRRR.",
    ".RRRRRRRRRR.",
    ".RRMMRRMMRR.",
    ".RRRRRRRRRR.",
    "GGGGGGGGGGGG",
    "..SS....SS..",
    "..HH....HH..",
]

ADVENTURER_B = [
    "....HHHH....",
    "...HHHHHH...",
    "...HSSSSH...",
    "...HSSSSH...",
    "....SSSS....",
    ".....SS.....",
    "..GCCCCCCG..",
    ".SGCCCCCCGS.",
    ".SGCCCCCCGS.",
    "..GCCCCCCG..",
    "...CCCCCC...",
    "...CGGGGC...",
    "...CCCCCC...",
    "...CBBBBC...",
    "...CC..CC...",
    "...CC..CC...",
    "...CC..CC...",
    "...BB..BB...",
    "..HHH..HHH..",
    "..HHH..HHH..",
]


def make_adventurers():
    save(from_ascii(ADVENTURER_A, COUPLE), "adventurer-a.png", 4, PIXEL_ART_DIR)
    save(from_ascii(ADVENTURER_B, COUPLE), "adventurer-b.png", 4, PIXEL_ART_DIR)
    # A gold-lit variant: full colour reads poorly against the dark night map.
    map_palette = {
        ".": None,
        "H": GOLD_DARK,
        "S": GOLD_LIGHT,
        "R": GOLD,
        "M": GOLD_DARK,
        "G": GOLD_LIGHT,
        "C": GOLD,
        "B": GOLD_DARK,
    }
    save(from_ascii(ADVENTURER_B, map_palette), "adventurer-map.png", 4, PIXEL_ART_DIR)


# --------------------------------------------------------------- OG image --
SKY_STOPS = [
    (0.00, SKY_TOP),
    (0.45, SKY_MID),
    (0.78, SKY_LOW),
    (1.00, SKY_HORIZON),
]


def sky_gradient(width, height, stops=SKY_STOPS):
    img = Image.new("RGBA", (width, height))
    for y in range(height):
        color = gradient_stops(y / max(1, height - 1), stops)
        for x in range(width):
            img.putpixel((x, y), color)
    return img


def make_og_image():
    """1200x630 share card: dusk sky, the three ridges, and the sigil."""
    ow, oh = 1200, 630
    card = sky_gradient(ow, oh)

    rng = random.Random(3)
    for _ in range(90):
        x, y = rng.randrange(ow), rng.randrange(int(oh * 0.5))
        shade = rng.randint(170, 255)
        card.putpixel((x, y), (shade, shade, 230, 255))

    for name, offset, scale_to in (
        ("ridge-far.png", 250, 1.0),
        ("ridge-near.png", 150, 1.05),
        ("ridge-fore.png", 20, 1.15),
    ):
        layer = Image.open(os.path.join(SCENERY_DIR, name)).convert("RGBA")
        target_w = int(ow * scale_to)
        target_h = int(layer.height * target_w / layer.width)
        layer = layer.resize((target_w, target_h), Image.NEAREST)
        card.alpha_composite(layer, (int((ow - target_w) / 2), oh - target_h - offset + 250))

    sigil = Image.open(os.path.join(PIXEL_ART_DIR, "crossed-swords.png")).convert("RGBA")
    sigil = sigil.resize((260, 260), Image.NEAREST)
    card.alpha_composite(sigil, ((ow - 260) // 2, 120))

    # Gold double frame
    for inset, color in ((14, GOLD_DARK), (20, GOLD), (23, GOLD_LIGHT)):
        for x in range(inset, ow - inset):
            card.putpixel((x, inset), color)
            card.putpixel((x, oh - inset - 1), color)
        for y in range(inset, oh - inset):
            card.putpixel((inset, y), color)
            card.putpixel((ow - inset - 1, y), color)

    os.makedirs(ASSET_DIR, exist_ok=True)
    path = os.path.join(ASSET_DIR, "og-quest-log.png")
    card.convert("RGB").save(path)
    print(f"  saved {os.path.relpath(path, os.path.dirname(ASSET_DIR))}  (1200x630)")


if __name__ == "__main__":
    print("Scenery:")
    make_far_layer()
    make_near_layer()
    make_fore_layer()
    make_adventurers()
    make_og_image()
