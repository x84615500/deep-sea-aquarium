#!/usr/bin/env python3
"""Create recolored, derived mermaid sprite sheets; source artwork stays intact.

Palette masks are spatially constrained and only target the source artwork's
pink hair/tail pixels or turquoise clothing pixels. Alpha and source canvases
are preserved for the existing animation compositor.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFile
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
FISH = ROOT / "assets" / "fish"
ImageFile.LOAD_TRUNCATED_IMAGES = True

def polygon_mask(size, polygons):
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    for poly in polygons:
        draw.polygon(poly, fill=255)
    return np.asarray(mask, dtype=np.uint8) > 0

def tiles(w, h, cols, rows, hair_local, tail_local):
    out_hair, out_tail = [], []
    tw, th = w // cols, h // rows
    for yy in range(rows):
        for xx in range(cols):
            ox, oy = xx * tw, yy * th
            out_hair.append([(x + ox, y + oy) for x, y in hair_local])
            out_tail.append([(x + ox, y + oy) for x, y in tail_local])
    return out_hair, out_tail

def recolor(path, dest, hair_hue, tail_hue, bikini_hue, black_hair=False,
            hair_polys=None, tail_polys=None, bikini_polys=None):
    im = Image.open(path).convert("RGBA")
    rgba = np.asarray(im).copy()
    hsv = np.asarray(im.convert("HSV")).copy()
    h, s, v = [hsv[:, :, i].astype(np.int16) for i in range(3)]
    source_h, source_s = h.copy(), s.copy()
    alpha = rgba[:, :, 3] > 8
    # The supplied hair spans magenta through violet (PIL hue 200–255).
    # Faces and blush fall around hue 0–20 and are excluded from this mask.
    pink = (h >= 200) & (s >= 28) & alpha
    if hair_polys:
        hm = polygon_mask(im.size, hair_polys) & pink
        if black_hair:
            v[hm] = np.clip(v[hm] * 0.37, 22, 155).astype(np.int16)
            s[hm] = np.minimum(s[hm], 68)
        else:
            h[hm] = hair_hue
            s[hm] = np.maximum(s[hm], 80)
        # Fish-tail stripes are coral/red or rose (hue 0–20 or 190–229),
        # while hair is 230–255. This keeps the tail recolor off the hair.
        tail_colors = (((h <= 40) & (s >= 65)) | ((h >= 200) & (s >= 65))) & alpha
        tail_m = polygon_mask(im.size, tail_polys or []) & tail_colors
        if tail_hue == "silver":
            h[tail_m] = 145
            s[tail_m] = np.minimum(s[tail_m], 54)
        else:
            h[tail_m] = tail_hue
            s[tail_m] = np.maximum(s[tail_m], 175)
        if bikini_polys:
            clothing = polygon_mask(im.size, bikini_polys)
            # Turquoise swimwear is isolated by its source hue and body-region ROI.
            bikini = clothing & alpha & (source_h >= 105) & (source_h <= 190) & (source_s >= 42)
            h[bikini] = bikini_hue
            s[bikini] = np.maximum(s[bikini], 190)
            v[bikini] = np.maximum(v[bikini], 130)
    hsv[:, :, 0] = np.clip(h, 0, 255).astype(np.uint8)
    hsv[:, :, 1] = np.clip(s, 0, 255).astype(np.uint8)
    hsv[:, :, 2] = np.clip(v, 0, 255).astype(np.uint8)
    recolored = Image.fromarray(hsv, "HSV").convert("RGB")
    recolored.putalpha(im.getchannel("A"))
    dest.parent.mkdir(parents=True, exist_ok=True)
    recolored.save(dest, optimize=True)

def regular(src_name, dest_name, hair_hue, tail_hue, bikini_hue, black=False):
    src = FISH / src_name
    im = Image.open(src)
    w, h = im.size
    # The sheets have two views across and two expression rows. Polygon ROIs
    # cover the flowing hair and tail; hue checks keep faces and skin untouched.
    hair_local = [(0, 0), (630, 0), (650, 110), (600, 180), (520, 230), (430, 270), (360, 340), (280, 430), (0, 470)]
    tail_local = [(460, 270), (w // 2 - 1, 200), (w // 2 - 1, h // 2 - 1), (460, h // 2 - 1)]
    bikinis = []
    for oy in (0, h // 2):
        for ox in (0, w // 2):
            # Focus on the swimsuit area below each face, excluding the hair.
            bikinis.append([(ox+210,oy+185),(ox+430,oy+190),(ox+460,oy+360),(ox+230,oy+370)])
    hairs, tails = tiles(w, h, 2, 2, hair_local, tail_local)
    recolor(src, FISH / dest_name, hair_hue, tail_hue, bikini_hue,
            black_hair=black, hair_polys=hairs, tail_polys=tails, bikini_polys=bikinis)

def monster(src_name, tail_name, dest_name, hair_hue, tail_hue, bikini_hue, black=False):
    src = FISH / src_name
    im = Image.open(src).convert("RGBA")
    im.load()
    w, h = im.size
    # Four poses: side/front, then wink side/front. Each view is 768x512.
    hair_local = [(18, 8), (620, 8), (680, 145), (580, 240), (480, 275), (390, 340), (240, 365), (18, 270)]
    tail_local = [(330, 280), (767, 185), (767, 511), (330, 511), (250, 440)]
    hairs, tails = tiles(w, h, 2, 2, hair_local, tail_local)
    bikinis = []
    for oy in (0, 512):
        for ox in (0, 768):
            bikinis.append([(ox+210,oy+160),(ox+485,oy+160),(ox+495,oy+360),(ox+210,oy+360)])
    full_out = FISH / dest_name.replace("-body-v1", "-full-v1")
    recolor(src, full_out, hair_hue, tail_hue, bikini_hue,
            black_hair=black, hair_polys=hairs, tail_polys=tails, bikini_polys=bikinis)
    # Derive the animated body layer from the complete source sheet by cutting
    # out the already-separated tail-fin pixels. Original supplied files stay intact.
    full = Image.open(full_out).convert("RGBA")
    tail_source = Image.open(FISH / tail_name).convert("RGBA")
    tail_source.load()
    if tail_source.size == full.size:
        alpha = full.getchannel("A")
        clear = np.asarray(tail_source.getchannel("A")) > 4
        alpha_array = np.asarray(alpha).copy()
        alpha_array[clear] = 0
        full.putalpha(Image.fromarray(alpha_array, "L"))
    full.save(FISH / dest_name, optimize=True)
    full_out.unlink(missing_ok=True)

def main():
    # Regular mermaid keys: coral=jade curls; pearl=gold straight; star=black curls.
    regular("mermaid-sheet.png", "mermaid-palette-jade-v1.png", 104, "silver", 0)
    regular("mermaid-sheet-pearl-v30.png", "mermaid-palette-gold-straight-v1.png", 35, 8, 36)
    regular("mermaid-sheet.png", "mermaid-palette-black-v1.png", 0, "silver", 12, black=True)
    # Monster keys: black/red/silver, ice-blue/gold/silver, teal/orange/red.
    monster("monster-mermaid-sheet-v38-loose-plum.png", "monster-mermaid-sheet-v38-loose-plum-tail.png", "monster-palette-abyss-black-body-v1.png", 0, 12, 0, black=True)
    monster("monster-mermaid-sheet-v37-pony-teal.png", "monster-mermaid-sheet-v37-pony-teal-tail.png", "monster-palette-ice-blue-body-v1.png", 145, "silver", 36)
    monster("monster-mermaid-sheet-v37-pony-coral.png", "monster-mermaid-sheet-v37-pony-coral-tail.png", "monster-palette-sea-teal-body-v1.png", 116, 12, 12)
    # Fin-only sheets contain no body/face. Hue mapping therefore stays local.
    for src_name, dest_name, tail_hue in [
        ("monster-mermaid-sheet-v38-loose-plum-tail.png", "monster-palette-abyss-black-tail-v1.png", 12),
        ("monster-mermaid-sheet-v37-pony-teal-tail.png", "monster-palette-ice-blue-tail-v1.png", "silver"),
        ("monster-mermaid-sheet-v37-pony-coral-tail.png", "monster-palette-sea-teal-tail-v1.png", 12),
    ]:
        src = FISH / src_name
        im = Image.open(src).convert("RGBA")
        rgba = np.asarray(im).copy()
        hsv = np.asarray(im.convert("HSV")).copy()
        h, s = hsv[:, :, 0], hsv[:, :, 1]
        mask = (rgba[:, :, 3] > 8) & (s > 20)
        hsv[:, :, 0][mask] = 145 if tail_hue == "silver" else tail_hue
        if tail_hue == "silver": hsv[:, :, 1][mask] = np.minimum(s[mask], 54)
        else: hsv[:, :, 1][mask] = np.maximum(s[mask], 145)
        fin = Image.fromarray(hsv, "HSV").convert("RGB")
        fin.putalpha(im.getchannel("A"))
        fin.save(FISH / dest_name, optimize=True)

if __name__ == "__main__":
    main()
