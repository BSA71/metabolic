#!/usr/bin/env python3
"""Generate ornate circular badge PNGs matching the First Step layout."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "client" / "public" / "badges"
FIRST_STEP = OUT_DIR / "first-step.png"

# id -> banner label (uppercase, fits curved ribbon)
BADGES: list[dict[str, str]] = [
    {"id": "first-day-complete", "label": "FIRST DAY", "theme": "calendar"},
    {"id": "baseline-captured", "label": "BASELINE", "theme": "camera"},
    {"id": "first-comparison", "label": "COMPARE", "theme": "compare"},
    {"id": "three-day-momentum", "label": "3-DAY", "theme": "flame3"},
    {"id": "seven-day-momentum", "label": "7-DAY", "theme": "flame7"},
    {"id": "week-one-complete", "label": "WEEK ONE", "theme": "calendar5"},
    {"id": "momentum-builder", "label": "MOMENTUM", "theme": "chart"},
    {"id": "four-week-foundation", "label": "4 WEEKS", "theme": "layers4"},
    {"id": "consistency-over-perfection", "label": "CONSISTENT", "theme": "heart"},
    {"id": "honest-tracker", "label": "HONEST", "theme": "pen"},
    {"id": "real-life-logged", "label": "REAL LIFE", "theme": "notebook"},
    {"id": "back-on-track", "label": "BACK ON", "theme": "refresh"},
    {"id": "snapshot-taken", "label": "SNAPSHOT", "theme": "photos"},
    {"id": "two-week-snapshot-streak", "label": "2 WEEKS", "theme": "camera2"},
    {"id": "measurement-streak", "label": "MEASURE", "theme": "ruler"},
    {"id": "progress-in-focus", "label": "FOCUS", "theme": "focus"},
    {"id": "pattern-finder", "label": "PATTERNS", "theme": "search"},
    {"id": "getting-consistent", "label": "ROUTINE", "theme": "repeat"},
    {"id": "metabolic-momentum", "label": "MOMENTUM", "theme": "sparkles"},
    {"id": "hydration-hero-bronze", "label": "HYDRATION", "theme": "water_bronze"},
    {"id": "hydration-hero-silver", "label": "HYDRATION", "theme": "water_silver"},
    {"id": "hydration-hero-gold", "label": "HYDRATION", "theme": "water_gold"},
    {"id": "daily-check-in-streak", "label": "CHECK-IN", "theme": "clipboard"},
]


def theme_svg(theme: str) -> str:
    """Center hero illustration (SVG group, centered ~512,512)."""
    t = {
        "calendar": """
          <rect x="402" y="360" width="220" height="200" rx="18" fill="#f8faf8" stroke="#94a3b8" stroke-width="4"/>
          <rect x="402" y="360" width="220" height="52" rx="18" fill="#1e6b4a"/>
          <path d="M462 340v40M562 340v40" stroke="#64748b" stroke-width="10" stroke-linecap="round"/>
          <circle cx="462" cy="470" r="16" fill="#22c55e"/><path d="M454 470l6 6 14-16" stroke="#fff" stroke-width="4" fill="none"/>
          <circle cx="512" cy="500" r="16" fill="#22c55e"/><path d="M504 500l6 6 14-16" stroke="#fff" stroke-width="4" fill="none"/>
          <ellipse cx="512" cy="560" rx="48" ry="22" fill="#86efac" opacity="0.9"/>
        """,
        "camera": """
          <rect x="420" y="400" width="180" height="130" rx="20" fill="#334155"/>
          <circle cx="510" cy="465" r="42" fill="#1e293b" stroke="#cbd5e1" stroke-width="6"/>
          <circle cx="510" cy="465" r="28" fill="#475569"/>
          <rect x="560" y="420" width="36" height="24" rx="6" fill="#64748b"/>
          <path d="M450 520h120" stroke="#fbbf24" stroke-width="8" stroke-linecap="round"/>
          <rect x="470" y="530" width="80" height="14" rx="4" fill="#eab308"/>
        """,
        "compare": """
          <rect x="390" y="380" width="110" height="150" rx="10" fill="#e2e8f0" stroke="#64748b" stroke-width="3"/>
          <rect x="524" y="380" width="110" height="150" rx="10" fill="#dcfce7" stroke="#166534" stroke-width="3"/>
          <circle cx="445" cy="430" r="22" fill="#94a3b8"/>
          <circle cx="579" cy="430" r="22" fill="#22c55e"/>
          <path d="M512 540v-30" stroke="#ca8a04" stroke-width="8"/>
        """,
        "flame3": """
          <g transform="translate(512,500)">
            <ellipse cx="-70" cy="30" rx="28" ry="50" fill="#f97316"/><ellipse cx="-70" cy="10" rx="16" ry="30" fill="#fde047"/>
            <ellipse cx="0" cy="30" rx="28" ry="55" fill="#ea580c"/><ellipse cx="0" cy="5" rx="18" ry="35" fill="#fef08a"/>
            <ellipse cx="70" cy="30" rx="28" ry="50" fill="#f97316"/><ellipse cx="70" cy="10" rx="16" ry="30" fill="#fde047"/>
          </g>
        """,
        "flame7": """
          <g transform="translate(512,490)">
            <ellipse cx="-120" cy="35" rx="18" ry="32" fill="#fb923c"/><ellipse cx="-80" cy="35" rx="18" ry="36" fill="#f97316"/>
            <ellipse cx="-40" cy="35" rx="18" ry="40" fill="#ea580c"/><ellipse cx="0" cy="35" rx="20" ry="44" fill="#dc2626"/>
            <ellipse cx="40" cy="35" rx="18" ry="40" fill="#ea580c"/><ellipse cx="80" cy="35" rx="18" ry="36" fill="#f97316"/>
            <ellipse cx="120" cy="35" rx="18" ry="32" fill="#fb923c"/>
          </g>
        """,
        "calendar5": """
          <rect x="400" y="370" width="224" height="190" rx="16" fill="#fff" stroke="#64748b" stroke-width="4"/>
          <rect x="400" y="370" width="224" height="48" rx="16" fill="#166534"/>
          <g fill="#22c55e">
            <rect x="420" y="440" width="28" height="28" rx="4"/><rect x="460" y="440" width="28" height="28" rx="4"/>
            <rect x="500" y="440" width="28" height="28" rx="4"/><rect x="540" y="440" width="28" height="28" rx="4"/>
            <rect x="580" y="440" width="28" height="28" rx="4"/>
          </g>
        """,
        "chart": """
          <path d="M400 540 L460 480 L520 500 L580 420 L620 450" stroke="#166534" stroke-width="12" fill="none" stroke-linecap="round"/>
          <circle cx="580" cy="420" r="14" fill="#22c55e"/>
          <rect x="430" y="550" width="180" height="20" rx="6" fill="#475569"/>
        """,
        "layers4": """
          <rect x="430" y="520" width="164" height="28" rx="6" fill="#78716c"/>
          <rect x="440" y="488" width="144" height="28" rx="6" fill="#a8a29e"/>
          <rect x="450" y="456" width="124" height="28" rx="6" fill="#d6d3d1"/>
          <rect x="460" y="424" width="104" height="28" rx="6" fill="#f5f5f4"/>
          <circle cx="512" cy="400" r="18" fill="#22c55e"/>
        """,
        "heart": """
          <path d="M512 420c-40-50-100-20-80 30 15 40 80 70 80 90s65-50 80-90c20-50-40-80-80-30z" fill="#ef4444"/>
          <path d="M462 500h100" stroke="#166534" stroke-width="6" stroke-linecap="round"/>
          <path d="M472 520h80" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
        """,
        "pen": """
          <rect x="420" y="400" width="180" height="140" rx="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
          <path d="M480 520 L560 420" stroke="#1e6b4a" stroke-width="10" stroke-linecap="round"/>
          <circle cx="560" cy="420" r="10" fill="#166534"/>
          <text x="450" y="470" font-size="28" fill="#64748b" font-family="Arial">~</text>
        """,
        "notebook": """
          <rect x="410" y="390" width="200" height="160" rx="10" fill="#fef3c7" stroke="#a16207" stroke-width="4"/>
          <line x1="460" y1="390" x2="460" y2="550" stroke="#ca8a04" stroke-width="3"/>
          <circle cx="520" cy="460" r="24" fill="#f97316" opacity="0.9"/>
          <rect x="500" y="500" width="60" height="36" rx="8" fill="#86efac"/>
        """,
        "refresh": """
          <path d="M420 500a92 92 0 1 1 60-80" fill="none" stroke="#166534" stroke-width="14" stroke-linecap="round"/>
          <polygon points="490,400 520,430 460,440" fill="#22c55e"/>
          <circle cx="512" cy="500" r="36" fill="#fef08a" stroke="#ca8a04" stroke-width="4"/>
          <path d="M500 500l10 10 20-24" stroke="#166534" stroke-width="5" fill="none"/>
        """,
        "photos": """
          <rect x="400" y="400" width="90" height="110" rx="8" fill="#fff" stroke="#64748b" stroke-width="3" transform="rotate(-12 445 455)"/>
          <rect x="470" y="390" width="90" height="110" rx="8" fill="#ecfccb" stroke="#166534" stroke-width="3"/>
          <rect x="540" y="400" width="90" height="110" rx="8" fill="#fff" stroke="#64748b" stroke-width="3" transform="rotate(12 585 455)"/>
        """,
        "camera2": """
          <rect x="440" y="410" width="144" height="100" rx="14" fill="#334155"/>
          <circle cx="512" cy="460" r="32" fill="#1e293b" stroke="#e2e8f0" stroke-width="5"/>
          <text x="470" y="560" font-size="48" font-weight="bold" fill="#166534" font-family="Arial">2</text>
        """,
        "ruler": """
          <rect x="400" y="450" width="224" height="36" rx="6" fill="#fbbf24" stroke="#a16207" stroke-width="3"/>
          <g stroke="#78350f" stroke-width="2">
            <line x1="420" y1="450" x2="420" y2="486"/><line x1="460" y1="450" x2="460" y2="486"/>
            <line x1="500" y1="450" x2="500" y2="486"/><line x1="540" y1="450" x2="540" y2="486"/>
            <line x1="580" y1="450" x2="580" y2="486"/>
          </g>
          <ellipse cx="512" cy="400" rx="70" ry="40" fill="none" stroke="#94a3b8" stroke-width="6" stroke-dasharray="8 6"/>
        """,
        "focus": """
          <circle cx="512" cy="470" r="80" fill="none" stroke="#ca8a04" stroke-width="12"/>
          <circle cx="512" cy="470" r="50" fill="#dcfce7" stroke="#166534" stroke-width="4"/>
          <path d="M400 540 L480 460 L540 500 L620 400" stroke="#22c55e" stroke-width="8" fill="none"/>
        """,
        "search": """
          <circle cx="490" cy="450" r="60" fill="none" stroke="#475569" stroke-width="10"/>
          <line x1="530" y1="490" x2="590" y2="550" stroke="#475569" stroke-width="12" stroke-linecap="round"/>
          <circle cx="470" cy="440" r="8" fill="#22c55e"/><circle cx="510" cy="460" r="8" fill="#22c55e"/>
          <circle cx="450" cy="470" r="8" fill="#f97316"/>
        """,
        "repeat": """
          <path d="M420 500a92 92 0 1 0 184 0" fill="none" stroke="#166534" stroke-width="12"/>
          <path d="M604 500a92 92 0 1 0-184 0" fill="none" stroke="#22c55e" stroke-width="12"/>
          <circle cx="512" cy="500" r="28" fill="#86efac"/>
        """,
        "sparkles": """
          <circle cx="512" cy="480" r="55" fill="#a7f3d0" opacity="0.6"/>
          <path d="M512 400 L522 450 L572 460 L522 470 L512 520 L502 470 L452 460 L502 450 Z" fill="#fbbf24"/>
          <circle cx="440" cy="440" r="8" fill="#fde047"/><circle cx="580" cy="520" r="10" fill="#fde047"/>
        """,
        "water_bronze": """
          <rect x="470" y="380" width="84" height="180" rx="28" fill="url(#bronze)"/>
          <ellipse cx="512" cy="380" rx="42" ry="14" fill="#a8a29e"/>
          <g fill="#38bdf8"><circle cx="470" cy="340" r="10"/><circle cx="500" cy="320" r="8"/><circle cx="530" cy="335" r="9"/><circle cx="555" cy="350" r="7"/><circle cx="485" cy="360" r="6"/></g>
        """,
        "water_silver": """
          <rect x="470" y="380" width="84" height="180" rx="28" fill="url(#silver)"/>
          <ellipse cx="512" cy="380" rx="42" ry="14" fill="#e2e8f0"/>
          <g fill="#38bdf8"><circle cx="450" cy="330" r="9"/><circle cx="480" cy="310" r="11"/><circle cx="512" cy="300" r="10"/><circle cx="545" cy="315" r="9"/><circle cx="570" cy="340" r="8"/><circle cx="460" cy="355" r="7"/></g>
        """,
        "water_gold": """
          <rect x="470" y="380" width="84" height="180" rx="28" fill="url(#goldBottle)"/>
          <ellipse cx="512" cy="380" rx="42" ry="14" fill="#fde047"/>
          <g fill="#38bdf8"><circle cx="440" cy="320" r="10"/><circle cx="470" cy="295" r="12"/><circle cx="505" cy="285" r="11"/><circle cx="540" cy="295" r="12"/><circle cx="575" cy="320" r="10"/><circle cx="555" cy="350" r="8"/><circle cx="485" cy="345" r="9"/></g>
        """,
        "clipboard": """
          <rect x="430" y="380" width="164" height="190" rx="14" fill="#f1f5f9" stroke="#64748b" stroke-width="4"/>
          <rect x="480" y="360" width="64" height="36" rx="10" fill="#94a3b8"/>
          <g fill="#22c55e"><rect x="450" y="430" width="24" height="24" rx="4"/><rect x="450" y="470" width="24" height="24" rx="4"/>
          <rect x="450" y="510" width="24" height="24" rx="4"/><rect x="490" y="430" width="24" height="24" rx="4"/>
          <rect x="490" y="470" width="24" height="24" rx="4"/><rect x="490" y="510" width="24" height="24" rx="4"/>
          <rect x="530" y="430" width="24" height="24" rx="4"/></g>
        """,
    }
    return t.get(theme, t["sparkles"])


def badge_svg(label: str, theme: str) -> str:
    hero = theme_svg(theme)
    font_size = 34 if len(label) <= 12 else 28 if len(label) <= 16 else 22
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="metal" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#5c6670"/>
      <stop offset="55%" stop-color="#2a3138"/>
      <stop offset="100%" stop-color="#14181c"/>
    </radialGradient>
    <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f5e6b8"/><stop offset="50%" stop-color="#d4af37"/><stop offset="100%" stop-color="#9a7b2e"/>
    </linearGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#b8dff5"/><stop offset="100%" stop-color="#eef6fb"/>
    </linearGradient>
    <linearGradient id="banner" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f8e8a8"/><stop offset="100%" stop-color="#c9a227"/>
    </linearGradient>
    <linearGradient id="bronze" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d4a574"/><stop offset="100%" stop-color="#8b5a2b"/>
    </linearGradient>
    <linearGradient id="silver" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f1f5f9"/><stop offset="100%" stop-color="#94a3b8"/>
    </linearGradient>
    <linearGradient id="goldBottle" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fde047"/><stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>
    <clipPath id="inner"><circle cx="512" cy="430" r="300"/></clipPath>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Scene (clipped) -->
  <g clip-path="url(#inner)">
    <rect width="1024" height="1024" fill="url(#sky)"/>
    <ellipse cx="512" cy="520" rx="340" ry="120" fill="#6b9b7a" opacity="0.5"/>
    <path d="M180 560 Q320 480 460 520 T700 500 T900 540 L900 700 L180 700 Z" fill="#4a7c59" opacity="0.7"/>
    <path d="M200 580 Q380 520 512 550 T820 530 L820 720 L200 720 Z" fill="#2d5a3d" opacity="0.85"/>
    <circle cx="512" cy="300" r="52" fill="#fde047" opacity="0.95"/>
    <g stroke="#fde047" stroke-width="4" opacity="0.5">
      <line x1="512" y1="200" x2="512" y2="250"/><line x1="512" y1="350" x2="512" y2="400"/>
      <line x1="412" y1="300" x2="462" y2="300"/><line x1="562" y1="300" x2="612" y2="300"/>
      <line x1="440" y1="228" x2="475" y2="263"/><line x1="549" y1="337" x2="584" y2="372"/>
    </g>
    <ellipse cx="512" cy="560" rx="200" ry="28" fill="#64748b" opacity="0.35"/>
    <g filter="url(#shadow)">{hero}</g>
  </g>

  <!-- Frame -->
  <circle cx="512" cy="512" r="470" fill="none" stroke="url(#metal)" stroke-width="56"/>
  <circle cx="512" cy="512" r="438" fill="none" stroke="url(#goldRing)" stroke-width="6"/>
  <polygon points="512,48 532,88 492,88" fill="#d4af37"/>
  <path d="M200 620 Q180 680 220 720" stroke="#22c55e" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M180 640 Q160 700 200 740" stroke="#166534" stroke-width="6" fill="none"/>
  <path d="M824 620 Q844 680 804 720" stroke="#22c55e" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M844 640 Q864 700 824 740" stroke="#166534" stroke-width="6" fill="none"/>

  <!-- Banner -->
  <path d="M260 720 Q512 800 764 720 L740 820 Q512 880 284 820 Z" fill="url(#banner)" stroke="#9a7b2e" stroke-width="3"/>
  <text x="512" y="788" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="bold"
        font-size="{font_size}" fill="#111827" letter-spacing="2">{label}</text>
  <path d="M502 830 Q512 850 522 830" stroke="#166534" stroke-width="3" fill="#22c55e"/>
  <circle cx="512" cy="842" r="6" fill="#22c55e"/>
</svg>
"""


def rasterize_svg(svg: str, out_path: Path) -> None:
    tmp = out_path.with_suffix(".svg")
    tmp.write_text(svg, encoding="utf-8")
    rsvg = "/opt/homebrew/bin/rsvg-convert"
    if not Path(rsvg).exists():
        rsvg = "rsvg-convert"
    subprocess.check_call(
        [rsvg, "-w", "1024", "-h", "1024", "-b", "#00000000", "-o", str(out_path), str(tmp)],
        stdout=subprocess.DEVNULL,
    )
    tmp.unlink(missing_ok=True)


def key_black_background(path: Path, threshold: int = 20) -> None:
    from PIL import Image
    import numpy as np

    im = Image.open(path).convert("RGBA")
    arr = np.array(im)
    rgb = arr[:, :, :3]
    mask = (rgb[:, :, 0] <= threshold) & (rgb[:, :, 1] <= threshold) & (rgb[:, :, 2] <= threshold)
    arr[:, :, 3] = np.where(mask, 0, 255)
    Image.fromarray(arr).save(path, "PNG", optimize=True)


def composite_first_step_frame(generated: Path) -> None:
    """Blend the photoreal frame from first-step over generated inner art."""
    if not FIRST_STEP.exists():
        return
    from PIL import Image
    import numpy as np

    base = np.array(Image.open(generated).convert("RGBA"))
    frame_src = np.array(Image.open(FIRST_STEP).convert("RGBA"))
    h, w = base.shape[:2]
    cx, cy = 512, 430
    y, x = np.ogrid[:h, :w]
    dist = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    # Keep outer metal ring, top chevron, side leaves from reference badge
    keep = (dist > 298) | ((y < 130) & (np.abs(x - cx) < 90))
    keep |= ((x < 250) | (x > 770)) & (y > 560) & (y < 760) & (dist < 470)
    alpha = frame_src[:, :, 3:4] / 255.0
    keep3 = keep[:, :, np.newaxis]
    overlay_alpha = alpha * keep3
    out = base.astype(float)
    fg = frame_src.astype(float)
    out[:, :, :3] = out[:, :, :3] * (1 - overlay_alpha) + fg[:, :, :3] * overlay_alpha
    out[:, :, 3:4] = np.maximum(base[:, :, 3:4], (overlay_alpha * 255 * keep3).astype(float))
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(generated, "PNG", optimize=True)


def write_badge_art_ts(ids: list[str]) -> None:
    art_path = ROOT / "client" / "src" / "components" / "gamification" / "badgeArt.ts"
    lines = [
        "/** Custom badge artwork — rendered as-is (no medal chrome). */",
        "export const BADGE_ART: Partial<Record<string, string>> = {",
    ]
    for bid in sorted(set(ids)):
        lines.append(f"  '{bid}': '/badges/{bid}.png',")
    lines.append("};")
    lines.append("")
    lines.append("export function badgeArtUrl(badgeId: string) {")
    lines.append("  return BADGE_ART[badgeId] ?? null;")
    lines.append("}")
    lines.append("")
    art_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ids = ["first-step"]

    if FIRST_STEP.exists():
        key_black_background(FIRST_STEP, threshold=20)

    for badge in BADGES:
        bid = badge["id"]
        out = OUT_DIR / f"{bid}.png"
        print(f"Generating {bid}...")
        svg = badge_svg(badge["label"], badge["theme"])
        rasterize_svg(svg, out)
        key_black_background(out)
        ids.append(bid)

    write_badge_art_ts(ids)
    manifest = OUT_DIR / "manifest.json"
    manifest.write_text(json.dumps(ids, indent=2), encoding="utf-8")
    print(f"Done. {len(ids)} badges -> {OUT_DIR}")


if __name__ == "__main__":
    main()
