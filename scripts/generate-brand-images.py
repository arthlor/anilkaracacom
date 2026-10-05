"""
Builds the favicon set and the default social image from the pixel character.

Reads the sprites straight from src/components/pixel-me/sprites.ts, so the
icons follow the character if it changes. Run from the repo root:

    python3 scripts/generate-brand-images.py

Needs Pillow (with WOFF2 support, which current wheels include).
"""

import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SPRITES = ROOT / "src/components/pixel-me/sprites.ts"
PUBLIC = ROOT / "public"
FONTS = ROOT / "node_modules/@fontsource-variable/inter/files"
MONO = ROOT / "node_modules/@fontsource/jetbrains-mono/files"

# Light-theme palette, matching PixelMe.astro.
PALETTE = {
    "H": "#2b211c",
    "h": "#5a4334",
    "S": "#f1c3a0",
    "s": "#d59c7c",
    "W": "#fbf8f2",
    "T": "#1f1e1f",
    "C": "#c3c7cc",
    "F": "#3a3534",
    "f": "#544c49",
    "O": "#2b84ea",
    "J": "#3f4b66",
    "j": "#2e374c",
}
TILE = "#2b84ea"
PAPER = "#faf9f7"
INK = "#1c1c1a"
MUTED = "#6a6760"
FLOOR = "#d9d5cd"


def read_sprite(name: str) -> list[str]:
    source = SPRITES.read_text()
    match = re.search(rf"export const {name} = sprite\((.*?)\);", source, re.S)
    if not match:
        raise SystemExit(f"sprite {name} not found in {SPRITES}")
    return re.findall(r'"([^"]*)"', match.group(1))


def paint(draw: ImageDraw.ImageDraw, rows: list[str], x: int, y: int, px: int):
    for ry, row in enumerate(rows):
        for rx, key in enumerate(row):
            if key in PALETTE:
                x0, y0 = x + rx * px, y + ry * px
                draw.rectangle((x0, y0, x0 + px - 1, y0 + px - 1), fill=PALETTE[key])


def icon(size: int, px: int, radius: float) -> Image.Image:
    """The head centred on a rounded blue tile, in whole-pixel steps."""
    head = read_sprite("headFront")
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=TILE)
    offset = (size - len(head[0]) * px) // 2
    paint(draw, head, offset, offset, px)
    return image


def favicon_svg() -> str:
    head = read_sprite("headFront")
    rects = []
    for y, row in enumerate(head):
        x = 0
        while x < len(row):
            key, w = row[x], 1
            while x + w < len(row) and row[x + w] == key:
                w += 1
            if key in PALETTE:
                rects.append(
                    f'<rect x="{x + 1}" y="{y + 1}" width="{w}" height="1" fill="{PALETTE[key]}"/>'
                )
            x += w
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" shape-rendering="crispEdges">'
        f'<rect width="12" height="12" rx="2.5" fill="{TILE}" shape-rendering="geometricPrecision"/>'
        + "".join(rects)
        + "</svg>\n"
    )


def inter(size: int, weight: int, latin_ext: bool = False) -> ImageFont.FreeTypeFont:
    subset = "latin-ext" if latin_ext else "latin"
    font = ImageFont.truetype(str(FONTS / f"inter-{subset}-opsz-normal.woff2"), size)
    font.set_variation_by_axes([32, weight])
    return font


# Fontsource splits Inter into subsets. "ı" ships in latin; these live in latin-ext.
TURKISH = set("İşŞğĞ")


def text(draw, xy, value, size, weight, fill, tracking=0.0):
    x, y = xy
    base, ext = inter(size, weight), inter(size, weight, latin_ext=True)
    for char in value:
        font = ext if char in TURKISH else base
        draw.text((x, y), char, font=font, fill=fill)
        x += font.getlength(char) + tracking * size


def og_image() -> Image.Image:
    width, height = 1200, 630
    image = Image.new("RGB", (width, height), PAPER)
    draw = ImageDraw.Draw(image)

    text(draw, (88, 150), "Anıl Karaca.", 96, 650, INK, tracking=-0.045)
    text(draw, (92, 272), "Communications. Data. Development.", 42, 500, MUTED, tracking=-0.03)
    text(draw, (92, 352), "Reporting with data. Apps, games", 30, 420, MUTED, -0.012)
    text(draw, (92, 396), "and digital products from İzmir.", 30, 420, MUTED, -0.012)

    mono = ImageFont.truetype(str(MONO / "jetbrains-mono-latin-400-normal.woff2"), 24)
    draw.rectangle((92, 503, 103, 514), fill=TILE)
    draw.text((120, 494), "anilkaraca.com", font=mono, fill=MUTED)

    # The character standing on a floor line, at 22 screen pixels per sprite pixel.
    px = 22
    head, torso, legs = (read_sprite(n) for n in ("headFront", "torsoFront", "legsFront"))
    figure_x, floor_y = 860, 530
    legs_y = floor_y - len(legs) * px
    torso_y = legs_y - len(torso) * px
    head_y = torso_y - len(head) * px
    paint(draw, legs, figure_x, legs_y, px)
    paint(draw, torso, figure_x, torso_y, px)
    paint(draw, head, figure_x, head_y, px)
    draw.rectangle((760, floor_y, 1180, floor_y + 5), fill=FLOOR)
    return image


def main():
    (PUBLIC / "favicon.svg").write_text(favicon_svg())

    icon(180, 15, 40).save(PUBLIC / "apple-touch-icon.png", optimize=True)
    icon(192, 16, 42).save(PUBLIC / "icon-192.png", optimize=True)
    icon(512, 42, 112).save(PUBLIC / "icon-512.png", optimize=True)

    sizes = {16: (1, 3), 32: (3, 4), 48: (4, 10)}
    frames = [icon(size, px, r) for size, (px, r) in sizes.items()]
    frames[-1].save(
        PUBLIC / "favicon.ico",
        sizes=[(s, s) for s in sizes],
        append_images=frames[:-1],
    )

    og_image().save(PUBLIC / "og-default.png", optimize=True)
    print("Wrote favicon.svg, favicon.ico, apple-touch-icon.png, icon-192/512.png, og-default.png")


if __name__ == "__main__":
    main()
