"""去掉 ego browser 跟随光标的悬浮药丸（截图里那块深色「DeepSeek · …」提示）。

每张图拍三遍，光标停三个不同位置：药丸只会出现在其中一张，
逐像素取中位数（三取二）就能把它抹掉，其余像素不受影响。
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(r"C:\Users\19853\Documents\deepseek-harness\default-workspace\galizhajidanbaofan.github.io\docs\preview")
RAW = ROOT / "_raw2"

NAMES = [
    "01-desktop",
    "02-forum-modern",
    "03-post",
    "04-forum-retro",
    "05-chat",
    "06-mobile",
]


def clean(name: str) -> None:
    shots = [Image.open(RAW / f"{name}-{i}.png").convert("RGB") for i in range(3)]
    size = shots[0].size
    if any(s.size != size for s in shots):
        raise SystemExit(f"{name}: 三张尺寸不一致")

    stack = np.stack([np.asarray(s, dtype=np.uint8) for s in shots], axis=0)
    merged = np.median(stack, axis=0).astype(np.uint8)

    diff = int((np.abs(stack[0].astype(np.int16) - merged).sum(axis=2) > 20).sum())
    Image.fromarray(merged).save(ROOT / f"{name}.png", optimize=True)
    print(f"{name}: 抹掉 {diff} px")


def main() -> int:
    for name in NAMES:
        clean(name)
    return 0


if __name__ == "__main__":
    sys.exit(main())
