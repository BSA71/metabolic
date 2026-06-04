#!/usr/bin/env python3
"""Copy badge assets and key out black JPEG mattes."""

from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path(
    os.environ.get(
        "BADGE_ASSETS_DIR",
        Path.home() / ".cursor/projects/Users-derekfowler-repo-metabolic/assets",
    )
)
OUT = ROOT / "client" / "public" / "badges"


def key_background(path: Path, dark_threshold: int = 22, light_threshold: int = 248) -> None:
    im = Image.open(path).convert("RGBA")
    arr = np.array(im)
    h, w = arr.shape[:2]
    rgb = arr[:, :, :3]
    cx, cy = w // 2, h // 2
    y, x = np.ogrid[:h, :w]
    dist = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    outer = dist > (min(w, h) * 0.46)

    dark = (rgb[:, :, 0] <= dark_threshold) & (rgb[:, :, 1] <= dark_threshold) & (rgb[:, :, 2] <= dark_threshold)
    light = (rgb[:, :, 0] >= light_threshold) & (rgb[:, :, 1] >= light_threshold) & (rgb[:, :, 2] >= light_threshold)
    mask = dark | light | outer
    arr[:, :, 3] = np.where(mask, 0, arr[:, :, 3])
    Image.fromarray(arr).save(path, "PNG", optimize=True)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    names = sys.argv[1:] if len(sys.argv) > 1 else [p.name for p in ASSETS.glob("*.png")]
    for name in names:
        filename = name if name.endswith(".png") else f"{name}.png"
        src = ASSETS / filename
        in_place = OUT / filename
        if src.exists():
            dest = in_place
            shutil.copy2(src, dest)
        elif in_place.exists():
            dest = in_place
        else:
            print(f"skip missing {filename}")
            continue
        key_background(dest)
        print(f"processed {dest.name}")


if __name__ == "__main__":
    main()
