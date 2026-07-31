"""Generator for the RPG-themed pixel art icons used on the quest pages.

Simple symmetric icons are declared as ASCII maps (see ``ICONS``); the two
radial/diagonal icons stay procedural because plotting them by formula is
clearer than hand-authoring the overlap. Everything is drawn on a small
logical grid and upscaled with NEAREST to keep hard pixel edges.

Run with:  npm run art
"""

from pixelkit import (
    CREAM,
    CRIMSON_LIGHT,
    GOLD,
    GOLD_DARK,
    GOLD_LIGHT,
    STEEL,
    STEEL_DARK,
    BROWN,
    BROWN_DARK,
    from_ascii,
    new_canvas,
    px,
    save,
)

GRID = 16   # logical pixel grid
SCALE = 20  # final px per grid cell

# Palette legend for the ASCII maps below:
#   .  transparent      G  gold          L  gold light     D  gold dark
#   R  crimson          H  crimson light C  cream
ICONS = {
    "shield.png": [
        "................",
        "................",
        "....DGGGGGGD....",
        "...DGGGGGGGGD...",
        "...DCCRRRRCCD...",
        "...DCRRRRRRCD...",
        "...DCCRRRRCCD...",
        "...DCCCGGCCCD...",
        "...DGGGGGGGGD...",
        "....DGGGGGGD....",
        ".....DGGGGD.....",
        "......DGGD......",
        ".......DD.......",
        "................",
        "................",
        "................",
    ],
    "star.png": [
        "................",
        ".......LL.......",
        ".......LL.......",
        "......GLLG......",
        ".....GGLLGG.....",
        ".GGGGGGLLGGGGGG.",
        "..DGGGGLLGGGGD..",
        "...DGGGLLGGGD...",
        "....DGGLLGGD....",
        "...DDGGLLGGDD...",
        "..DDGGGLLGGGDD..",
        ".DDDGGGLLGGGDDD.",
        "..DD........DD..",
        ".DD..........DD.",
        "................",
        "................",
    ],
    "heart.png": [
        "................",
        "................",
        "................",
        "..HRR......RRH..",
        ".RHRRRRRRRRRRHR.",
        "RHRRRRRRRRRRRRHR",
        "RRRRRRRRRRRRRRRR",
        "DRRRRRRRRRRRRRRD",
        ".DRRRRRRRRRRRRD.",
        "..DRRRRRRRRRRD..",
        "...DRRRRRRRRD...",
        "....DRRRRRRD....",
        ".....DRRRRD.....",
        "......DRRD......",
        ".......DD.......",
        "................",
    ],
}


# --------------------------------------------------------------- FIREWORK --
def make_firework():
    img = new_canvas(GRID, GRID)
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
    save(img, "firework.png", SCALE)


# --------------------------------------------------------- CROSSED SWORDS --
def make_crossed_swords():
    img = new_canvas(GRID, GRID)
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

    save(img, "crossed-swords.png", SCALE)


if __name__ == "__main__":
    print("Icons:")
    for filename, rows in ICONS.items():
        save(from_ascii(rows), filename, SCALE)
    make_firework()
    make_crossed_swords()
