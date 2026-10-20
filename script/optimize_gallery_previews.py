#!/usr/bin/env python3
"""Resize public gallery thumbnails without changing downloadable print files."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
TARGET = (212, 300)
PREVIEW_PATHS = sorted((ROOT / "site" / "prenosi").glob("*/predogled.png"))
SAMPLE_PATHS = sorted((ROOT / "site" / "free" / "samples").glob("*.png"))
PATHS = PREVIEW_PATHS + SAMPLE_PATHS
IMAGE_TAG = re.compile(r"<img\b[^>]*>", re.IGNORECASE)
ATTRIBUTE = re.compile(r"\b(src|data-static-preview|data-preview-design|width|height)=(['\"])(.*?)\2", re.IGNORECASE)
PREVIEW_CACHE_VERSION = "212x300-v1"


def is_preview_url(value: str) -> bool:
    path = urlsplit(value).path
    return (
        (path.startswith("/prenosi/") and path.endswith("/predogled.png"))
        or path.startswith("/predogled/")
        or (path.startswith("/free/samples/") and path.lower().endswith(".png"))
    )


def version_preview_url(value: str) -> str:
    if not is_preview_url(value):
        return value
    parts = urlsplit(value)
    query = [(key, val) for key, val in parse_qsl(parts.query, keep_blank_values=True)
             if key != "k365-preview"]
    query.append(("k365-preview", PREVIEW_CACHE_VERSION))
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))

if not PREVIEW_PATHS:
    raise SystemExit("No release-catalog gallery previews found under site/prenosi")

before_bytes = sum(path.stat().st_size for path in PATHS)
resized = 0
already_optimized = 0
for path in PATHS:
    with Image.open(path) as source:
        source.load()
        if source.size == TARGET:
            already_optimized += 1
            continue
        if source.size != (425, 600):
            raise SystemExit(f"Unexpected preview dimensions at {path.relative_to(ROOT)}: {source.size}")
        image = ImageOps.exif_transpose(source).resize(TARGET, Image.Resampling.LANCZOS)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGB")
        image.save(path, format="PNG", optimize=True, compress_level=9)
        resized += 1

after_bytes = sum(path.stat().st_size for path in PATHS)
for path in PATHS:
    with Image.open(path) as image:
        if image.size != TARGET:
            raise SystemExit(f"Thumbnail dimensions were not preserved: {path.relative_to(ROOT)} {image.size}")

html_pages = 0
html_tags = [0]
for html_path in sorted((ROOT / "site").rglob("*.html")):
    text = html_path.read_text(encoding="utf-8")

    def normalize_preview(match: re.Match[str]) -> str:
        tag = match.group(0)
        attributes = {match.group(1).lower(): match.group(3) for match in ATTRIBUTE.finditer(tag)}
        source = attributes.get("src", "")
        is_preview = (
            is_preview_url(source)
            or is_preview_url(attributes.get("data-static-preview", ""))
            or "data-preview-design" in attributes
        )
        if not is_preview:
            return tag
        if attributes.get("width") != str(TARGET[0]) or attributes.get("height") != str(TARGET[1]):
            html_tags[0] += 1
        changed = tag
        for name in ("src", "data-static-preview"):
            source_value = attributes.get(name, "")
            replacement_value = version_preview_url(source_value)
            if replacement_value == source_value:
                continue
            pattern = re.compile(rf"\b{name}=(['\"])[^'\"]*\1", re.IGNORECASE)
            changed, count = pattern.subn(f'{name}="{replacement_value}"', changed, count=1)
            if count:
                attributes[name] = replacement_value
        for name, value in (("width", str(TARGET[0])), ("height", str(TARGET[1]))):
            pattern = re.compile(rf"\b{name}=(['\"])[^'\"]*\1", re.IGNORECASE)
            replacement = f'{name}="{value}"'
            changed, count = pattern.subn(replacement, changed, count=1)
            if count == 0:
                changed = changed[:-1].rstrip() + f' {replacement}>'
        return changed

    updated, count = IMAGE_TAG.subn(normalize_preview, text)
    if updated != text:
        html_path.write_text(updated, encoding="utf-8")
        html_pages += 1

record = {
    "checked_at": datetime.now(timezone.utc).isoformat(),
    "gallery_previews": len(PREVIEW_PATHS),
    "studio_sample_previews": len(SAMPLE_PATHS),
    "html_pages_with_updated_preview_dimensions": html_pages,
    "html_pages_with_versioned_preview_urls": html_pages,
    "html_preview_tags_normalized": html_tags[0],
    "html_preview_dimensions": {"width": TARGET[0], "height": TARGET[1]},
    "preview_cache_version": PREVIEW_CACHE_VERSION,
    "resized": resized,
    "already_optimized": already_optimized,
    "dimensions": {"width": TARGET[0], "height": TARGET[1]},
    "bytes_before": before_bytes,
    "bytes_after": after_bytes,
    "bytes_saved": before_bytes - after_bytes,
    "print_pdf_webp_files_modified": 0,
}
evidence = ROOT / "evidence" / "gallery-preview-optimization.json"
evidence.parent.mkdir(parents=True, exist_ok=True)
evidence.write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
print(json.dumps(record))
