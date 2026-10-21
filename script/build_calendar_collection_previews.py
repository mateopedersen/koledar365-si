#!/usr/bin/env python3
"""Build compact full-page thumbnails for the verified 2027–2030 collection."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "calendar-collection"
ORIGINALS = DATA / "originals"
PREVIEWS = DATA / "previews"
SEO = json.loads((DATA / "seo-podatki.json").read_text(encoding="utf-8"))
QC = json.loads((DATA / "kontrola-kakovosti.json").read_text(encoding="utf-8"))
QC_BY_WEBP = {row["webp"]: row for row in QC["datoteke"]}


def main() -> None:
    if len(SEO["datoteke"]) != 780 or len(QC_BY_WEBP) != 780:
        raise SystemExit("Collection manifests must each contain exactly 780 pairs.")
    PREVIEWS.mkdir(parents=True, exist_ok=True)
    digest_rows = []
    for index, record in enumerate(SEO["datoteke"], 1):
        source = ORIGINALS / record["webp"]
        target = PREVIEWS / record["webp"]
        target.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(source) as opened:
            opened.load()
            image = ImageOps.exif_transpose(opened)
            image.thumbnail((300, 300), Image.Resampling.LANCZOS)
            if image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGB")
            icc = opened.info.get("icc_profile")
            image.save(target, format="WEBP", quality=86, method=6, icc_profile=icc)
            width, height = image.size
        with Image.open(target) as check:
            check.load()
            if check.format != "WEBP" or check.size != (width, height):
                raise SystemExit(f"Invalid full-page preview: {target.relative_to(ROOT)}")
        digest_rows.append({
            "source": record["webp"],
            "preview": str(target.relative_to(DATA)),
            "width": width,
            "height": height,
            "bytes": target.stat().st_size,
            "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
        })
        if index % 50 == 0:
            print(f"Previews {index}/780", flush=True)
    report = {
        "source_collection": "koledar365 2027–2030",
        "source_records": len(digest_rows),
        "max_dimension_px": 300,
        "previews": digest_rows,
    }
    (DATA / "preview-manifest.json").write_text(
        json.dumps(report, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"previews": len(digest_rows), "bytes": sum(row["bytes"] for row in digest_rows)}))


if __name__ == "__main__":
    main()
