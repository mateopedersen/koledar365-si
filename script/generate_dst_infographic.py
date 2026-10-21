#!/usr/bin/env python3
"""Regenerate the Slovenian daylight-saving-time infographic and WebP sizes.

Requirements: Python 3, Pillow, and either CairoSVG or the Inkscape CLI.
The SVG uses local DejaVu Sans / Liberation Sans, with a sans-serif fallback.
Run from any directory: python script/generate_dst_infographic.py
"""

from __future__ import annotations

import argparse
import html
import io
import json
import math
from pathlib import Path
import shutil
import subprocess
import tempfile

from PIL import Image


WIDTH = 1200
HEIGHT = 720
MOBILE_WIDTH = 640
MOBILE_HEIGHT = 1000
STEM = "premik-ure-slovenija-poletni-zimski-cas"
BLUE = "#005da4"
RED = "#c52d45"
INK = "#17344d"
MUTED = "#526a7d"


def text(x: float, y: float, content: str, size: int, *, weight: int = 400,
         fill: str = INK, anchor: str = "middle") -> str:
    return (
        f'<text x="{x:g}" y="{y:g}" font-size="{size}" '
        f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}">'
        f'{html.escape(content)}</text>'
    )


def clock(cx: float, cy: float, hour: int, accent: str) -> str:
    """Draw an exact hour: minute hand at 12, hour hand at the supplied hour."""
    shapes = [
        f'<g aria-label="{hour:02}:00">',
        f'<circle cx="{cx:g}" cy="{cy:g}" r="78" fill="#ffffff" '
        'stroke="#d4e0e9" stroke-width="2"/>',
    ]
    for tick in range(12):
        angle = math.radians(tick * 30 - 90)
        outer = 68
        inner = 62 if tick % 3 == 0 else 64
        x1, y1 = cx + inner * math.cos(angle), cy + inner * math.sin(angle)
        x2, y2 = cx + outer * math.cos(angle), cy + outer * math.sin(angle)
        shapes.append(
            f'<line x1="{x1:.3f}" y1="{y1:.3f}" '
            f'x2="{x2:.3f}" y2="{y2:.3f}" stroke="#7b91a4" '
            f'stroke-width="{2 if tick % 3 == 0 else 1.5}" '
            'stroke-linecap="round"/>'
        )
    for label, dx, dy in (("12", 0, -47), ("3", 51, 5),
                          ("6", 0, 58), ("9", -51, 5)):
        shapes.append(text(cx + dx, cy + dy, label, 15, fill=MUTED))
    hour_angle = math.radians((hour % 12) * 30 - 90)
    hx = cx + 38 * math.cos(hour_angle)
    hy = cy + 38 * math.sin(hour_angle)
    shapes.extend([
        f'<line class="minute-hand" x1="{cx:g}" y1="{cy:g}" '
        f'x2="{cx:g}" y2="{cy - 39:g}" stroke="{INK}" '
        'stroke-width="4" stroke-linecap="round"/>',
        f'<line class="hour-hand" x1="{cx:g}" y1="{cy:g}" '
        f'x2="{hx:.3f}" y2="{hy:.3f}" stroke="{accent}" '
        'stroke-width="6" stroke-linecap="round"/>',
        f'<circle cx="{cx:g}" cy="{cy:g}" r="5" fill="{accent}"/>',
        '</g>',
    ])
    return "\n".join(shapes)


def panel(x: int, accent: str, soft: str, heading: str, date_rule: str,
          first_hour: int, second_hour: int, instruction: str) -> str:
    cx = x + 262
    arrow_y = 355
    return "\n".join([
        '<g>',
        f'<rect x="{x}" y="158" width="524" height="468" rx="22" '
        'fill="#ffffff" stroke="#dbe5ec" stroke-width="1.5"/>',
        f'<path d="M {x + 24} 159 H {x + 500}" stroke="{accent}" '
        'stroke-width="4" stroke-linecap="round"/>',
        text(cx, 207, heading, 22, weight=700, fill=accent),
        text(cx, 245, date_rule, 21, fill=MUTED),
        clock(x + 143, 355, first_hour, accent),
        clock(x + 381, 355, second_hour, accent),
        f'<path d="M {cx - 24} {arrow_y} H {cx + 22} '
        f'M {cx + 12} {arrow_y - 10} L {cx + 22} {arrow_y} '
        f'L {cx + 12} {arrow_y + 10}" fill="none" stroke="{accent}" '
        'stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>',
        text(cx, 483, f"{first_hour:02}:00 → {second_hour:02}:00", 34, weight=700),
        f'<rect x="{x + 61}" y="521" width="402" height="58" rx="12" '
        f'fill="{soft}"/>',
        text(cx, 558, instruction, 22, weight=700, fill=accent),
        '</g>',
    ])


def build_svg() -> str:
    return "\n".join([
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" '
        'viewBox="0 0 1200 720" role="img" '
        'aria-labelledby="dst-title dst-description" xml:lang="sl">',
        '<title id="dst-title">Premik ure v Sloveniji</title>',
        '<desc id="dst-description">Zadnjo nedeljo v marcu uro premaknemo '
        'z 02:00 na 03:00, eno uro naprej. Zadnjo nedeljo v oktobru uro '
        'premaknemo s 03:00 na 02:00, eno uro nazaj. Prikazani so štirje '
        'analogni prikazi ur: 02:00, 03:00, 03:00 in 02:00. Lokalni čas '
        'v Sloveniji.</desc>',
        '<rect width="1200" height="720" fill="#f5f8fb"/>',
        '<g font-family="DejaVu Sans, Liberation Sans, sans-serif">',
        '<path d="M 60 39 H 111" stroke="#005da4" stroke-width="5" '
        'stroke-linecap="round"/>',
        '<path d="M 122 39 H 143" stroke="#c52d45" stroke-width="5" '
        'stroke-linecap="round"/>',
        text(60, 107, "Premik ure v Sloveniji", 44, weight=700, anchor="start"),
        panel(60, BLUE, "#edf5fc", "PREHOD NA POLETNI ČAS",
              "Zadnja nedelja v marcu", 2, 3, "ENO URO NAPREJ"),
        panel(616, RED, "#fceff2", "PREHOD NA ZIMSKI ČAS",
              "Zadnja nedelja v oktobru", 3, 2, "ENO URO NAZAJ"),
        text(600, 682, "Lokalni čas v Sloveniji · koledar365.si", 18, fill=MUTED),
        '</g>',
        '</svg>',
        '',
    ])


def mobile_clock(cx: float, cy: float, hour: int, accent: str) -> str:
    """A compact clock with numerals large enough for the mobile layout."""
    shapes = [
        f'<g aria-label="{hour:02}:00">',
        f'<circle cx="{cx:g}" cy="{cy:g}" r="70" fill="#ffffff" '
        'stroke="#d4e0e9" stroke-width="2"/>',
    ]
    for tick in range(12):
        if tick % 3 == 0:
            continue  # Leave the cardinal numerals unobstructed.
        angle = math.radians(tick * 30 - 90)
        x1, y1 = cx + 58 * math.cos(angle), cy + 58 * math.sin(angle)
        x2, y2 = cx + 62 * math.cos(angle), cy + 62 * math.sin(angle)
        shapes.append(
            f'<line x1="{x1:.3f}" y1="{y1:.3f}" '
            f'x2="{x2:.3f}" y2="{y2:.3f}" stroke="#7b91a4" '
            'stroke-width="2" stroke-linecap="round"/>'
        )
    for label, dx, dy in (("12", 0, -40), ("3", 48, 8),
                          ("6", 0, 59), ("9", -48, 8)):
        shapes.append(text(cx + dx, cy + dy, label, 24, fill=MUTED))
    hour_angle = math.radians((hour % 12) * 30 - 90)
    hx = cx + 29 * math.cos(hour_angle)
    hy = cy + 29 * math.sin(hour_angle)
    shapes.extend([
        f'<line class="minute-hand" x1="{cx:g}" y1="{cy:g}" '
        f'x2="{cx:g}" y2="{cy - 34:g}" stroke="{INK}" '
        'stroke-width="4" stroke-linecap="round"/>',
        f'<line class="hour-hand" x1="{cx:g}" y1="{cy:g}" '
        f'x2="{hx:.3f}" y2="{hy:.3f}" stroke="{accent}" '
        'stroke-width="6" stroke-linecap="round"/>',
        f'<circle cx="{cx:g}" cy="{cy:g}" r="5" fill="{accent}"/>',
        '</g>',
    ])
    return "\n".join(shapes)


def mobile_panel(y: int, accent: str, soft: str, heading: str, date_rule: str,
                 first_hour: int, second_hour: int, instruction: str) -> str:
    clock_y = y + 168
    return "\n".join([
        '<g>',
        f'<rect x="40" y="{y}" width="560" height="384" rx="22" '
        'fill="#ffffff" stroke="#dbe5ec" stroke-width="1.5"/>',
        f'<path d="M 64 {y + 1} H 576" stroke="{accent}" '
        'stroke-width="4" stroke-linecap="round"/>',
        text(320, y + 46, heading, 26, weight=700, fill=accent),
        text(320, y + 81, date_rule, 26, fill=MUTED),
        mobile_clock(180, clock_y, first_hour, accent),
        mobile_clock(460, clock_y, second_hour, accent),
        f'<path d="M 289 {clock_y} H 349 '
        f'M 337 {clock_y - 12} L 349 {clock_y} L 337 {clock_y + 12}" '
        f'fill="none" stroke="{accent}" stroke-width="4" '
        'stroke-linecap="round" stroke-linejoin="round"/>',
        text(320, y + 283, f"{first_hour:02}:00 → {second_hour:02}:00", 34, weight=700),
        f'<rect x="104" y="{y + 309}" width="432" height="50" rx="12" '
        f'fill="{soft}"/>',
        text(320, y + 343, instruction, 26, weight=700, fill=accent),
        '</g>',
    ])


def build_mobile_svg() -> str:
    return "\n".join([
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="1000" '
        'viewBox="0 0 640 1000" role="img" '
        'aria-labelledby="dst-mobile-title dst-mobile-description" xml:lang="sl">',
        '<title id="dst-mobile-title">Premik ure v Sloveniji</title>',
        '<desc id="dst-mobile-description">Zadnjo nedeljo v marcu uro '
        'premaknemo z 02:00 na 03:00, eno uro naprej. Zadnjo nedeljo v '
        'oktobru uro premaknemo s 03:00 na 02:00, eno uro nazaj. Prikazani '
        'so štirje analogni prikazi ur: 02:00, 03:00, 03:00 in 02:00. '
        'Lokalni čas v Sloveniji.</desc>',
        '<rect width="640" height="1000" fill="#f5f8fb"/>',
        '<g font-family="DejaVu Sans, Liberation Sans, sans-serif">',
        '<path d="M 40 31 H 91" stroke="#005da4" stroke-width="5" '
        'stroke-linecap="round"/>',
        '<path d="M 102 31 H 123" stroke="#c52d45" stroke-width="5" '
        'stroke-linecap="round"/>',
        text(40, 85, "Premik ure v Sloveniji", 36, weight=700, anchor="start"),
        mobile_panel(126, BLUE, "#edf5fc", "PREHOD NA POLETNI ČAS",
                     "Zadnja nedelja v marcu", 2, 3, "ENO URO NAPREJ"),
        mobile_panel(534, RED, "#fceff2", "PREHOD NA ZIMSKI ČAS",
                     "Zadnja nedelja v oktobru", 3, 2, "ENO URO NAZAJ"),
        text(320, 970, "Lokalni čas v Sloveniji · koledar365.si", 24, fill=MUTED),
        '</g>',
        '</svg>',
        '',
    ])


def render_svg(svg_path: Path, output_width: int = 2400,
               output_height: int = 1440) -> Image.Image:
    """Rasterize the actual vector source at the requested dimensions."""
    try:
        import cairosvg
    except ImportError:
        inkscape = shutil.which("inkscape")
        if not inkscape:
            raise SystemExit("Install CairoSVG or Inkscape to rasterize the SVG.")
        with tempfile.TemporaryDirectory(prefix="koledar365-dst-") as temp_dir:
            png_path = Path(temp_dir) / "dst.png"
            subprocess.run([
                inkscape, str(svg_path), "--export-type=png",
                f"--export-filename={png_path}", f"--export-width={output_width}",
                f"--export-height={output_height}",
            ], check=True, capture_output=True)
            with Image.open(png_path) as image:
                return image.convert("RGB")
    else:
        raster = cairosvg.svg2png(url=str(svg_path), output_width=output_width,
                                 output_height=output_height)
        with Image.open(io.BytesIO(raster)) as image:
            return image.convert("RGB")


def main() -> None:
    default_dir = Path(__file__).resolve().parents[1] / "public/images/premik-ure"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=default_dir)
    args = parser.parse_args()
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    svg_path = output_dir / f"{STEM}.svg"
    svg_path.write_text(build_svg(), encoding="utf-8")
    raster = render_svg(svg_path)
    artifacts = [{"file": str(svg_path), "width": WIDTH, "height": HEIGHT,
                  "bytes": svg_path.stat().st_size}]
    for width in (2400, 1200, 640):
        height = round(width * HEIGHT / WIDTH)
        image = raster if width == 2400 else raster.resize(
            (width, height), Image.Resampling.LANCZOS)
        path = output_dir / f"{STEM}-{width}.webp"
        image.save(path, format="WEBP", lossless=True, method=6)
        artifacts.append({"file": str(path), "width": width, "height": height,
                          "bytes": path.stat().st_size})
    mobile_svg_path = output_dir / f"{STEM}-mobile.svg"
    mobile_svg_path.write_text(build_mobile_svg(), encoding="utf-8")
    mobile_raster = render_svg(mobile_svg_path, MOBILE_WIDTH * 2,
                               MOBILE_HEIGHT * 2)
    mobile_image = mobile_raster.resize((MOBILE_WIDTH, MOBILE_HEIGHT),
                                        Image.Resampling.LANCZOS)
    mobile_webp_path = output_dir / f"{STEM}-mobile.webp"
    mobile_image.save(mobile_webp_path, format="WEBP", lossless=True, method=6)
    for path in (mobile_svg_path, mobile_webp_path):
        artifacts.append({"file": str(path), "width": MOBILE_WIDTH,
                          "height": MOBILE_HEIGHT, "bytes": path.stat().st_size})
    print(json.dumps(artifacts, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
