"""One-off generator for RPG-themed pixel art icons used as decorative flair
on the quest pages. Draws each icon on a small grid (crisp, blocky shapes)
then upscales with NEAREST resampling to keep hard pixel edges.
"""
from PIL import Image
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "pixel-art")
os.makedirs(OUT_DIR, exist_ok=True)

GRID = 16          # logical pixel grid
SCALE = 20         # final px per grid cell
SIZE = GRID * SCALE

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


def new_canvas():
    return Image.new("RGBA", (GRID, GRID), (0, 0, 0, 0))


def px(img, x, y, color):
    if 0 <= x < GRID and 0 <= y < GRID:
        img.putpixel((x, y), color)


def mirror_row(img, y, left_to_center, colors):
    """Draw a symmetric row: left_to_center is list of x (0..7), mirrored to 15-x."""
    for x, c in zip(left_to_center, colors):
        px(img, x, y, c)
        px(img, GRID - 1 - x, y, c)


def save(img, name):
    big = img.resize((SIZE, SIZE), Image.NEAREST)
    path = os.path.join(OUT_DIR, name)
    big.save(path)
    print("saved", path)


# ---------------------------------------------------------------- SHIELD ---
def make_shield():
    img = new_canvas()
    # outline + fill per row, symmetric about x=7.5
    rows = {
        2: ([4, 5, 6, 7], [GOLD_DARK, GOLD, GOLD, GOLD]),
        3: ([3, 4, 5, 6, 7], [GOLD_DARK, GOLD, GOLD, GOLD, GOLD]),
        4: ([3, 4, 5, 6, 7], [GOLD_DARK, CREAM, CREAM, CRIMSON, CRIMSON]),
        5: ([3, 4, 5, 6, 7], [GOLD_DARK, CREAM, CRIMSON, CRIMSON, CRIMSON]),
        6: ([3, 4, 5, 6, 7], [GOLD_DARK, CREAM, CREAM, CRIMSON, CRIMSON]),
        7: ([3, 4, 5, 6, 7], [GOLD_DARK, CREAM, CREAM, CREAM, GOLD]),
        8: ([3, 4, 5, 6, 7], [GOLD_DARK, GOLD, GOLD, GOLD, GOLD]),
        9: ([4, 5, 6, 7], [GOLD_DARK, GOLD, GOLD, GOLD]),
        10: ([5, 6, 7], [GOLD_DARK, GOLD, GOLD]),
        11: ([6, 7], [GOLD_DARK, GOLD]),
        12: ([7], [GOLD_DARK]),
    }
    for y, (xs, colors) in rows.items():
        mirror_row(img, y, xs, colors)
    save(img, "shield.png")


# ------------------------------------------------------------------ STAR ---
def make_star():
    img = new_canvas()
    rows = {
        1: ([7], [GOLD_LIGHT]),
        2: ([7], [GOLD_LIGHT]),
        3: ([6, 7], [GOLD, GOLD_LIGHT]),
        4: ([5, 6, 7], [GOLD, GOLD, GOLD_LIGHT]),
        5: ([1, 2, 3, 4, 5, 6, 7], [GOLD, GOLD, GOLD, GOLD, GOLD, GOLD, GOLD_LIGHT]),
        6: ([2, 3, 4, 5, 6, 7], [GOLD_DARK, GOLD, GOLD, GOLD, GOLD, GOLD_LIGHT]),
        7: ([3, 4, 5, 6, 7], [GOLD_DARK, GOLD, GOLD, GOLD, GOLD_LIGHT]),
        8: ([4, 5, 6, 7], [GOLD_DARK, GOLD, GOLD, GOLD_LIGHT]),
        9: ([3, 4, 5, 6, 7], [GOLD_DARK, GOLD_DARK, GOLD, GOLD, GOLD_LIGHT]),
        10: ([2, 3, 4, 5, 6, 7], [GOLD_DARK, GOLD_DARK, GOLD, GOLD, GOLD, GOLD_LIGHT]),
        11: ([1, 2, 3, 4, 5, 6, 7], [GOLD_DARK, GOLD_DARK, GOLD_DARK, GOLD, GOLD, GOLD, GOLD_LIGHT]),
        12: ([2, 3], [GOLD_DARK, GOLD_DARK]),
        13: ([1, 2], [GOLD_DARK, GOLD_DARK]),
    }
    for y, (xs, colors) in rows.items():
        mirror_row(img, y, xs, colors)
    save(img, "star.png")


# ------------------------------------------------------------------ HEART --
def make_heart():
    img = new_canvas()
    rows = {
        3: ([2, 3, 4], [CRIMSON_LIGHT, CRIMSON, CRIMSON]),
        4: ([1, 2, 3, 4, 5, 6, 7], [CRIMSON, CRIMSON_LIGHT, CRIMSON, CRIMSON, CRIMSON, CRIMSON, CRIMSON]),
        5: ([0, 1, 2, 3, 4, 5, 6, 7], [CRIMSON, CRIMSON_LIGHT, CRIMSON, CRIMSON, CRIMSON, CRIMSON, CRIMSON, CRIMSON]),
        6: ([0, 1, 2, 3, 4, 5, 6, 7], [CRIMSON, CRIMSON, CRIMSON, CRIMSON, CRIMSON, CRIMSON, CRIMSON, CRIMSON]),
        7: ([0, 1, 2, 3, 4, 5, 6, 7], [CRIMSON_DARK if False else GOLD_DARK, CRIMSON, CRIMSON, CRIMSON, CRIMSON, CRIMSON, CRIMSON, CRIMSON]),
        8: ([1, 2, 3, 4, 5, 6, 7], [GOLD_DARK, CRIMSON, CRIMSON, CRIMSON, CRIMSON, CRIMSON, CRIMSON]),
        9: ([2, 3, 4, 5, 6, 7], [GOLD_DARK, CRIMSON, CRIMSON, CRIMSON, CRIMSON, CRIMSON]),
        10: ([3, 4, 5, 6, 7], [GOLD_DARK, CRIMSON, CRIMSON, CRIMSON, CRIMSON]),
        11: ([4, 5, 6, 7], [GOLD_DARK, CRIMSON, CRIMSON, CRIMSON]),
        12: ([5, 6, 7], [GOLD_DARK, CRIMSON, CRIMSON]),
        13: ([6, 7], [GOLD_DARK, CRIMSON]),
        14: ([7], [GOLD_DARK]),
    }
    for y, (xs, colors) in rows.items():
        mirror_row(img, y, xs, colors)
    save(img, "heart.png")


# --------------------------------------------------------------- FIREWORK --
def make_firework():
    img = new_canvas()
    colors_cycle = [GOLD_LIGHT, CRIMSON_LIGHT, GOLD, CRIMSON_LIGHT, GOLD_LIGHT]
    # 8 rays radiating from center (7,7) using simple diagonal/straight lines
    center = 7
    rays = [
        [(0, -6), (0, -5), (0, -4), (0, -2)],   # up
        [(0, 6), (0, 5), (0, 4), (0, 2)],       # down
        [(-6, 0), (-5, 0), (-4, 0), (-2, 0)],   # left
        [(6, 0), (5, 0), (4, 0), (2, 0)],       # right
        [(-4, -4), (-3, -3), (-2, -2)],         # up-left
        [(4, -4), (3, -3), (2, -2)],            # up-right
        [(-4, 4), (-3, 3), (-2, 2)],            # down-left
        [(4, 4), (3, 3), (2, 2)],               # down-right
    ]
    for ray in rays:
        for i, (dx, dy) in enumerate(ray):
            color = GOLD_LIGHT if i >= len(ray) - 2 else GOLD
            px(img, center + dx, center + dy, color)
    # sparkle center
    for dx, dy, c in [(0, 0, CREAM), (-1, 0, CRIMSON_LIGHT), (1, 0, CRIMSON_LIGHT), (0, -1, CRIMSON_LIGHT), (0, 1, CRIMSON_LIGHT)]:
        px(img, center + dx, center + dy, c)
    save(img, "firework.png")


# --------------------------------------------------------- CROSSED SWORDS --
def make_crossed_swords():
    img = new_canvas()
    # Sword going from bottom-left to top-right
    diag1 = [
        (1, 14, BROWN_DARK), (2, 13, BROWN), (3, 12, BROWN),
        (4, 11, GOLD_DARK), (5, 10, GOLD),  # crossguard-ish
        (6, 9, STEEL_DARK), (7, 8, STEEL), (8, 7, STEEL), (9, 6, STEEL),
        (10, 5, STEEL), (11, 4, STEEL_DARK), (12, 3, STEEL_DARK), (13, 2, GOLD_LIGHT),
    ]
    for x, y, c in diag1:
        px(img, x, y, c)
        px(img, x + 1, y, c if c not in (STEEL, STEEL_DARK) else STEEL_DARK)

    # Sword going from bottom-right to top-left (mirror of diag1 across vertical axis)
    for x, y, c in diag1:
        mx = GRID - 1 - x
        px(img, mx, y, c)
        px(img, mx - 1, y, c if c not in (STEEL, STEEL_DARK) else STEEL_DARK)

    save(img, "crossed-swords.png")


if __name__ == "__main__":
    make_shield()
    make_star()
    make_heart()
    make_firework()
    make_crossed_swords()
