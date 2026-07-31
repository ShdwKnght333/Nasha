"""Generator for the four per-quest scene bands.

Each band is a wide, short strip of pixel art that sits *behind* a quest
header, masked so it dissolves into the parchment. The bands are positioned
absolutely in CSS, so they contribute no layout height and cannot break the
one-section-per-A4 print fit.

Every scene is drawn on the same 320x64 logical grid with a zone palette, so
the four read as a matched set rather than four unrelated illustrations.

Run with:  npm run art
"""

from __future__ import annotations

import math
import random

from pixelkit import (
    SCENERY_DIR,
    column,
    fill_below_ridge,
    new_canvas,
    px,
    rect,
    save,
)

W, H, SCALE = 320, 64, 4
GROUND = 52


class Zone:
    """A scene's four-step palette, dark to light."""

    def __init__(self, dark, body, lit, glow):
        self.dark = dark
        self.body = body
        self.lit = lit
        self.glow = glow


FORGE = Zone((74, 52, 18, 255), (122, 88, 19, 255), (179, 134, 43, 255), (255, 196, 92, 255))
STAGE = Zone((48, 30, 70, 255), (86, 52, 122, 255), (138, 79, 189, 255), (236, 186, 255, 255))
HOMA = Zone((72, 18, 12, 255), (140, 28, 19, 255), (198, 74, 30, 255), (255, 176, 74, 255))
COAST = Zone((26, 52, 84, 255), (46, 90, 138, 255), (58, 123, 213, 255), (255, 190, 128, 255))


# ------------------------------------------------------------- primitives --
def hut(img, x, base_y, width, height, zone):
    """A small tiled-roof dwelling."""
    rect(img, x, base_y - height, x + width, base_y, zone.body)
    for i in range(width // 2 + 2):
        span = width // 2 + 1 - i
        for dx in range(-span, span + 1):
            px(img, x + width // 2 + dx, base_y - height - i, zone.dark)
    # lit doorway
    rect(img, x + width // 2 - 1, base_y - 4, x + width // 2 + 1, base_y, zone.glow)


def tower(img, cx, base_y, zone, tiers=((7, 3), (5, 3), (3, 3), (2, 3))):
    """Stepped temple tower."""
    y = base_y
    for half, tier_h in tiers:
        y -= tier_h
        rect(img, cx - half, y, cx + half + 1, y + tier_h, zone.body)
        rect(img, cx - half, y, cx + half + 1, y + 1, zone.lit)
    column(img, cx, y - 3, y, zone.lit)


def palm(img, x, base_y, height, zone):
    for i in range(height):
        lean = i // 8
        px(img, x + lean, base_y - i, zone.dark)
        px(img, x + lean + 1, base_y - i, zone.body)
    tx, ty = x + height // 8, base_y - height
    # (dx, dy, length) per frond; the squared term makes them droop
    for sx, sy, length in ((-1, 0, 8), (1, 0, 8), (-1, -1, 5), (1, -1, 5),
                           (-1, 1, 6), (1, 1, 6)):
        for k in range(1, length + 1):
            fx = tx + sx * k
            fy = ty + sy * k + (k * k) // 9
            px(img, fx, fy, zone.body)
            px(img, fx, fy + 1, zone.dark)
    rect(img, tx - 1, ty - 1, tx + 2, ty + 1, zone.dark)
    px(img, tx - 2, ty + 1, zone.glow)
    px(img, tx + 2, ty + 1, zone.glow)


def dragon(img, zone, x0=86, x1=228, top=15):
    """The Marriage Dragon, arcing over the fire with a tapering body."""
    span = x1 - x0
    spine = []
    for t in range(span):
        f = t / span
        y = top + int(round(math.sin(f * math.pi * 1.35) * -7 + 7))
        spine.append((x0 + t, y))

    # Body thickens from tail to shoulder
    for i, (x, y) in enumerate(spine):
        thick = 1 + int((i / span) * 3)
        for d in range(-thick, thick + 1):
            px(img, x, y + d, zone.dark if abs(d) == thick else zone.body)

    # Spines along the back
    for i in range(6, span - 20, 11):
        x, y = spine[i]
        height = 2 + i // 40
        for s in range(height):
            px(img, x, y - 2 - s, zone.dark)

    # A single swept wing
    wx, wy = spine[int(span * 0.66)]
    for k in range(16):
        reach = max(1, 8 - k // 2)
        for d in range(reach):
            px(img, wx - k, wy - 4 - d, zone.body if d < reach - 1 else zone.dark)

    # Head, snout and horn
    hx, hy = spine[-1]
    rect(img, hx - 3, hy - 4, hx + 6, hy + 4, zone.dark)
    rect(img, hx + 6, hy - 1, hx + 11, hy + 3, zone.dark)
    px(img, hx + 2, hy - 2, zone.glow)
    px(img, hx + 3, hy - 2, zone.glow)
    for s in range(4):
        px(img, hx - 2 - s, hy - 5 - s, zone.dark)
    # A wisp of breath
    for s in range(5):
        px(img, hx + 12 + s, hy + 1 + s // 2, zone.glow)


def flame(img, cx, base_y, height, zone):
    """A layered fire: dark core outline, body, then a bright heart."""
    for i in range(height):
        span = max(0, int((height - i) * 0.55) - abs(int(math.sin(i * 0.9) * 2)))
        for dx in range(-span, span + 1):
            edge = abs(dx) >= span - 1
            px(img, cx + dx, base_y - i, zone.lit if edge else zone.glow)
    for i in range(height - 3):
        span = max(0, int((height - i) * 0.28))
        for dx in range(-span, span + 1):
            px(img, cx + dx, base_y - i, zone.glow)


def pillar(img, x, base_y, height, zone):
    rect(img, x, base_y - height, x + 4, base_y, zone.body)
    rect(img, x - 1, base_y - height - 2, x + 5, base_y - height, zone.lit)
    rect(img, x - 1, base_y - 2, x + 5, base_y, zone.lit)


def figure(img, x, base_y, zone, arms_up=False):
    """A tiny dancing silhouette."""
    px(img, x, base_y - 8, zone.dark)
    rect(img, x - 1, base_y - 7, x + 2, base_y - 3, zone.dark)
    px(img, x - 1, base_y - 2, zone.dark)
    px(img, x + 1, base_y - 2, zone.dark)
    px(img, x - 1, base_y - 1, zone.dark)
    px(img, x + 1, base_y - 1, zone.dark)
    if arms_up:
        px(img, x - 2, base_y - 8, zone.dark)
        px(img, x + 2, base_y - 8, zone.dark)
    else:
        px(img, x - 2, base_y - 6, zone.dark)
        px(img, x + 2, base_y - 6, zone.dark)


def burst(img, cx, cy, radius, zone):
    """A firework: eight rays with a bright core."""
    for angle in range(0, 360, 45):
        rad = math.radians(angle)
        for r in range(2, radius):
            x = cx + int(round(math.cos(rad) * r))
            y = cy + int(round(math.sin(rad) * r))
            px(img, x, y, zone.glow if r > radius - 3 else zone.lit)
    px(img, cx, cy, zone.glow)


# ----------------------------------------------------------------- scenes --
def scene_forge():
    """Quest 1 — dawn over the Western Ghats: farm, temple and the anvil."""
    img = new_canvas(W, H)
    fill_below_ridge(img, W, H, base=30,
                     components=[(7, 1, 0.3), (3, 2, 1.4), (1.5, 4, 2.1)],
                     body=FORGE.body, lit=FORGE.lit, lit_rows=1)
    rect(img, 0, GROUND, W, H, FORGE.dark)

    hut(img, 40, GROUND, 18, 10, FORGE)
    hut(img, 74, GROUND, 12, 7, FORGE)
    tower(img, 150, GROUND, FORGE)

    # The anvil, throwing sparks
    rect(img, 232, GROUND - 5, 248, GROUND - 2, FORGE.dark)
    rect(img, 237, GROUND - 2, 243, GROUND, FORGE.dark)
    rect(img, 228, GROUND - 6, 252, GROUND - 5, FORGE.dark)
    rng = random.Random(11)
    for _ in range(16):
        px(img, rng.randint(226, 254), rng.randint(GROUND - 18, GROUND - 8), FORGE.glow)

    for x in (14, 100, 118, 196, 280, 300):
        h = 6 + (x % 4)
        for i in range(h):
            span = max(0, (h - i) // 3)
            for dx in range(-span, span + 1):
                px(img, x + dx, GROUND - i, FORGE.dark)
    save(img, "scene-forge.png", SCALE, SCENERY_DIR)


def scene_stage():
    """Quest 2 — the Sangeet: night skyline, stage rig and dancers."""
    img = new_canvas(W, H)
    rng = random.Random(5)

    x = 0
    while x < W:
        bw = rng.randint(10, 22)
        bh = rng.randint(10, 26)
        rect(img, x, GROUND - bh, min(W, x + bw), GROUND, STAGE.dark)
        for wy in range(GROUND - bh + 3, GROUND - 2, 4):
            for wx in range(x + 2, min(W, x + bw) - 2, 4):
                if rng.random() < 0.5:
                    px(img, wx, wy, STAGE.glow)
        x += bw + rng.randint(1, 3)

    rect(img, 0, GROUND, W, H, STAGE.body)

    # Lighting truss with beams fanning down
    rect(img, 0, 6, W, 9, STAGE.dark)
    for lx in range(16, W, 32):
        rect(img, lx - 2, 9, lx + 2, 12, STAGE.lit)
        for i in range(14):
            spread = i // 3
            for dx in range(-spread, spread + 1):
                if rng.random() < 0.35:
                    px(img, lx + dx, 12 + i, STAGE.glow)

    for fx, up in ((96, True), (118, False), (140, True), (206, False), (228, True)):
        figure(img, fx, GROUND + 8, STAGE, arms_up=up)

    for nx, ny in ((60, 26), (76, 18), (250, 24), (268, 16), (170, 20)):
        px(img, nx, ny, STAGE.glow)
        px(img, nx, ny + 1, STAGE.glow)
        px(img, nx, ny + 2, STAGE.glow)
        px(img, nx + 1, ny + 2, STAGE.glow)
        px(img, nx - 1, ny + 3, STAGE.glow)
        px(img, nx, ny + 3, STAGE.glow)
    save(img, "scene-stage.png", SCALE, SCENERY_DIR)


def scene_homa():
    """Quest 3 — the boss arena: mandapa pillars, the sacred fire, the dragon."""
    img = new_canvas(W, H)
    rect(img, 0, GROUND, W, H, HOMA.dark)

    for x in (24, 60, 236, 272):
        pillar(img, x, GROUND, 30, HOMA)
    rect(img, 18, 18, 80, 21, HOMA.body)
    rect(img, 230, 18, 292, 21, HOMA.body)

    # Fire pit and flame at centre stage
    rect(img, 146, GROUND - 3, 174, GROUND, HOMA.body)
    flame(img, 160, GROUND - 3, 20, HOMA)

    rng = random.Random(17)
    for _ in range(26):
        px(img, rng.randint(140, 180), rng.randint(GROUND - 34, GROUND - 20), HOMA.glow)

    dragon(img, HOMA)
    save(img, "scene-homa.png", SCALE, SCENERY_DIR)


def scene_coast():
    """Quest 4 — the epilogue: Kundapur coast, boats, palms and fireworks."""
    img = new_canvas(W, H)

    # Horizon sits high so the palms stand on the sand, not in the water.
    sea_top, shore = 30, 44
    sand = (214, 178, 118, 255)
    foam = (236, 226, 200, 255)

    rect(img, 0, sea_top, W, shore, COAST.body)
    for row in range(sea_top, shore, 3):
        for x in range(W):
            if (x + row * 5) % 11 < 3:
                px(img, x, row, COAST.lit)

    # Sand rather than another dark slab, so the palms read as silhouettes.
    rect(img, 0, shore, W, H, sand)
    for x in range(W):
        if (x * 7) % 13 < 6:
            px(img, x, shore, foam)
        if (x * 5) % 17 < 4:
            px(img, x, shore + 1, foam)

    for bx in (72, 210):
        rect(img, bx, sea_top - 3, bx + 14, sea_top, COAST.dark)
        column(img, bx + 7, sea_top - 12, sea_top - 3, COAST.dark)
        for i in range(8):
            rect(img, bx + 8, sea_top - 12 + i, bx + 8 + (8 - i) // 2 + 1,
                 sea_top - 11 + i, COAST.lit)

    for x, h in ((22, 17), (46, 13), (272, 15), (298, 11)):
        palm(img, x, 62, h, COAST)

    for cx, cy, r in ((110, 12, 9), (168, 7, 7), (238, 15, 8)):
        burst(img, cx, cy, r, COAST)
    save(img, "scene-coast.png", SCALE, SCENERY_DIR)


if __name__ == "__main__":
    print("Quest scenes:")
    scene_forge()
    scene_stage()
    scene_homa()
    scene_coast()
