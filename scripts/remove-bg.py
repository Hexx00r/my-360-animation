"""Cut the background out of the 360° hero frames.

Reads   animation/frames-archive-v2/{center,frame_00..frame_63}.webp  (720x1030, opaque)
Writes  public/frames/<same name>.webp                                (720x1030, transparent)

Setup (once):
    uv venv scripts/rembg-venv --python 3.11
    uv pip install --python scripts/rembg-venv/Scripts/python.exe "rembg[cpu]" pillow numpy
Run:
    scripts/rembg-venv/Scripts/python.exe scripts/remove-bg.py            # reuses cached masks
    scripts/rembg-venv/Scripts/python.exe scripts/remove-bg.py --fresh    # re-run rembg

Pipeline
  1. rembg u2net_human_seg -> raw person mask per frame (cached in scripts/.rembg-cache/).
  2. Background plate: the camera and room are static, so average every pixel
     over the frames where rembg marks it confidently as background. u2net keeps
     some dark background objects (clothes on the rack) glued to the hair; mask
     pixels whose colour matches the plate are removed. Where the person and the
     room are both near-black the error is invisible on the black page anyway.
  3. Keep the largest connected region (the person); refill holes inside it
     from the raw mask so dark eyes or shirt folds are never punched out.
  4. Erode 1 px (drops the background ring rembg leaves on hair), Gaussian
     feather (~2-3 px), then fade the frame's bottom and sides so the shirt
     dissolves into black instead of ending on a straight frame edge.
  5. RGBA WebP, quality 88. Colour pixels are untouched.

Sanity checks: 65 frames, mean alpha > 0, and a warning when the head bbox
(opaque pixels above the shoulders) jumps more than 15 px between neighbouring
directional frames, which usually means a segmentation glitch.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "animation" / "frames-archive-v2"
DST = ROOT / "public" / "frames"
CACHE = ROOT / "scripts" / ".rembg-cache"
NAMES = ["center"] + [f"frame_{i:02d}" for i in range(64)]

MODEL = "u2net_human_seg"
# Plate cleanup
BG_CONFIDENT = 0.10  # raw mask below this = background, used to build the plate
PLATE_MIN_FRAMES = 6  # plate only trusted where >= this many frames saw background
PLATE_MATCH = 14.0  # RGB distance to the plate below which a mask pixel is a room pixel
# Only remove room pixels that would be visible on black: dark room (≈ dark hair)
# is left alone, because cutting it shreds the hair and hiding it gains nothing.
PLATE_MIN_LUMA = 22.0
BLOB_MIN_PX = 200  # removals smaller than this are speckle, ignored
# Edges
ERODE_PX = 1
FEATHER_SIGMA = 1.25  # visible feather ~2-3 px
FADE_BOTTOM, FADE_SIDES, FADE_TOP = 0.16, 0.08, 0.015  # fractions of the frame
WEBP_QUALITY = 88
# Sanity
HEAD_ZONE = 0.42  # head = opaque pixels above 42% of the height (eyes ~29%, chin ~45%)
DRIFT_WARN_PX = 15


def raw_masks(rgbs: list[Image.Image], fresh: bool) -> np.ndarray:
    CACHE.mkdir(parents=True, exist_ok=True)
    session = None
    out = []
    for name, rgb in zip(NAMES, rgbs):
        cached = CACHE / f"{name}.png"
        if cached.exists() and not fresh:
            m = Image.open(cached).convert("L")
        else:
            if session is None:
                from rembg import new_session

                session = new_session(MODEL)
            from rembg import remove

            m = remove(rgb, session=session, only_mask=True, post_process_mask=True).convert("L")
            m.save(cached)
            print(f"  rembg {name}", flush=True)
        out.append(np.asarray(m, dtype=np.float32) / 255)
    return np.stack(out)


def edge_fade(h: int, w: int) -> np.ndarray:
    y = np.arange(h, dtype=np.float32)[:, None] / (h - 1)
    x = np.arange(w, dtype=np.float32)[None, :] / (w - 1)
    smooth = lambda t: t * t * (3 - 2 * t)  # noqa: E731
    bottom = smooth(np.clip((1 - y) / FADE_BOTTOM, 0, 1))
    top = smooth(np.clip(y / FADE_TOP, 0, 1))
    sides = smooth(np.clip(np.minimum(x, 1 - x) / FADE_SIDES, 0, 1))
    return bottom * top * sides


def head_bbox(alpha: np.ndarray) -> tuple[int, int, int, int] | None:
    zone = alpha[: int(alpha.shape[0] * HEAD_ZONE)] > 0.5
    ys, xs = np.nonzero(zone)
    if not len(xs):
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def main() -> int:
    fresh = "--fresh" in sys.argv
    missing = [n for n in NAMES if not (SRC / f"{n}.webp").exists()]
    if missing:
        print(f"missing source frames: {missing}", file=sys.stderr)
        return 1
    DST.mkdir(parents=True, exist_ok=True)

    rgbs = [Image.open(SRC / f"{n}.webp").convert("RGB") for n in NAMES]
    rgb = np.stack([np.asarray(im, dtype=np.float32) for im in rgbs])  # (65, H, W, 3)
    masks = raw_masks(rgbs, fresh)  # (65, H, W) 0..1
    n, h, w = masks.shape

    # 2. Background plate from confidently-background pixels.
    bgvis = (masks < BG_CONFIDENT).astype(np.float32)
    count = bgvis.sum(0)
    plate = (rgb * bgvis[..., None]).sum(0) / np.maximum(count, 1)[..., None]
    plate_luma = plate @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    trusted = (count >= PLATE_MIN_FRAMES) & (plate_luma >= PLATE_MIN_LUMA)
    print(f"plate trusted (visible room) on {trusted.mean() * 100:.1f}% of pixels")

    fade = edge_fade(h, w)
    stats, warnings = [], []
    prev_bbox = None

    for i, name in enumerate(NAMES):
        m = masks[i]
        dist = np.sqrt(((rgb[i] - plate) ** 2).sum(-1))
        room = trusted & (m > 0.5) & (dist < PLATE_MATCH)
        room = ndimage.binary_opening(room, iterations=2)  # drop speckle and 1-2 px slivers
        labels, k = ndimage.label(room)
        if k:
            sizes = ndimage.sum(room, labels, range(1, k + 1))
            room = np.isin(labels, np.nonzero(sizes >= BLOB_MIN_PX)[0] + 1)
        room = ndimage.binary_dilation(room, iterations=1)
        cleaned = np.where(room, 0.0, m)
        removed = int(room.sum())

        # 3. Largest component + refill interior holes from the raw mask.
        solid = cleaned > 0.5
        labels, k = ndimage.label(solid)
        if k > 1:
            sizes = ndimage.sum(solid, labels, range(1, k + 1))
            solid = labels == (int(np.argmax(sizes)) + 1)
        filled = ndimage.binary_fill_holes(solid)
        holes = filled & ~solid
        region = ndimage.binary_dilation(filled, iterations=3)  # keep soft edge pixels
        alpha = np.where(holes, m, cleaned) * region

        # 4. Erode, feather, edge fade.
        a_img = Image.fromarray((alpha * 255).astype(np.uint8), "L")
        if ERODE_PX:
            a_img = a_img.filter(ImageFilter.MinFilter(ERODE_PX * 2 + 1))
        a_img = a_img.filter(ImageFilter.GaussianBlur(FEATHER_SIGMA))
        a = np.asarray(a_img, dtype=np.float32) / 255 * fade
        a8 = np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8)

        out_img = rgbs[i].copy()
        out_img.putalpha(Image.fromarray(a8, "L"))
        out = DST / f"{name}.webp"
        out_img.save(out, "WEBP", quality=WEBP_QUALITY, method=6)

        mean_alpha = float(a8.mean()) / 255
        bbox = head_bbox(a)
        if mean_alpha <= 0:
            warnings.append(f"{name}: mean alpha is 0 (empty cutout)")
        if bbox is None:
            warnings.append(f"{name}: no head found above {int(HEAD_ZONE * 100)}% of the height")
        if name != "center" and bbox and prev_bbox:
            drift = max(abs(b - p) for b, p in zip(bbox, prev_bbox))
            if drift > DRIFT_WARN_PX:
                warnings.append(f"{name}: head bbox moved {drift}px vs previous {prev_bbox} -> {bbox}")
        if name != "center":
            prev_bbox = bbox

        src_size = (SRC / f"{name}.webp").stat().st_size
        stats.append((src_size, out.stat().st_size, mean_alpha))
        print(f"{name:9} alpha_mean={mean_alpha:.3f} plate_removed={removed:>6}px bbox={bbox} "
              f"{src_size / 1024:5.1f}KB -> {out.stat().st_size / 1024:5.1f}KB", flush=True)

    before = sum(s[0] for s in stats) / len(stats) / 1024
    after = sum(s[1] for s in stats) / len(stats) / 1024
    print(f"\nframes written: {len(stats)} (expected 65)")
    print(f"mean alpha across frames: {sum(s[2] for s in stats) / len(stats):.3f}")
    print(f"avg file size: {before:.1f} KB -> {after:.1f} KB  "
          f"(total {before * len(stats) / 1024:.2f} MB -> {after * len(stats) / 1024:.2f} MB)")
    for msg in warnings:
        print(f"WARN {msg}")
    print(f"{len(warnings)} warning(s)")
    return 0 if len(stats) == 65 and all(s[2] > 0 for s in stats) else 1


if __name__ == "__main__":
    sys.exit(main())
