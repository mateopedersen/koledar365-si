#!/usr/bin/env python3
"""Serve compact gallery WebP previews without changing print downloads."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
TARGET = (212, 300)
PREVIEW_DIR = ROOT / "site" / "prenosi"
PREVIEW_PATHS = sorted(PREVIEW_DIR.glob("*/predogled.png"))
WEBP_PREVIEW_PATHS = sorted(PREVIEW_DIR.glob("*/predogled.webp"))
SAMPLE_PATHS = sorted((ROOT / "site" / "free" / "samples").glob("*.png"))
PATHS = PREVIEW_PATHS + WEBP_PREVIEW_PATHS + SAMPLE_PATHS
PREVIEW_TAG = re.compile(r"<(img|a)\b[^>]*>", re.IGNORECASE)
ATTRIBUTE = re.compile(r"\b(src|href|data-static-preview|data-preview-design|width|height)=(['\"])(.*?)\2", re.IGNORECASE)
PNG_PREVIEW_CACHE_VERSION = "212x300-v1"
WEBP_PREVIEW_CACHE_VERSION = "212x300-webp-v1"


def is_preview_url(value: str) -> bool:
    path = urlsplit(value).path
    return (
        (path.startswith("/prenosi/") and path.endswith(("/predogled.png", "/predogled.webp")))
        or path.startswith("/predogled/")
        or (path.startswith("/free/samples/") and path.lower().endswith(".png"))
    )


def version_preview_url(value: str) -> str:
    if not is_preview_url(value):
        return value
    parts = urlsplit(value)
    gallery_preview = parts.path.startswith("/prenosi/")
    path = parts.path
    version = PNG_PREVIEW_CACHE_VERSION
    if gallery_preview:
        path = path.rsplit("/", 1)[0] + "/predogled.webp"
        version = WEBP_PREVIEW_CACHE_VERSION
    query = [(key, val) for key, val in parse_qsl(parts.query, keep_blank_values=True)
             if key != "k365-preview"]
    query.append(("k365-preview", version))
    return urlunsplit((parts.scheme, parts.netloc, path, urlencode(query), parts.fragment))

if not PREVIEW_PATHS and not WEBP_PREVIEW_PATHS:
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

converted = 0
for path in PREVIEW_PATHS:
    webp_path = path.with_suffix(".webp")
    with Image.open(path) as source:
        source.load()
        if source.size != TARGET:
            raise SystemExit(f"Unexpected gallery preview dimensions at {path.relative_to(ROOT)}: {source.size}")
        image = source.convert("RGB")
        image.save(webp_path, format="WEBP", quality=88, method=6)
    with Image.open(webp_path) as check:
        check.load()
        if check.format != "WEBP" or check.size != TARGET:
            raise SystemExit(f"Invalid WebP gallery preview: {webp_path.relative_to(ROOT)}")
    path.unlink()
    converted += 1

for path in WEBP_PREVIEW_PATHS:
    with Image.open(path) as check:
        check.load()
        if check.format != "WEBP" or check.size != TARGET:
            raise SystemExit(f"Invalid WebP gallery preview: {path.relative_to(ROOT)}")

catalog_path = ROOT / "site" / "free" / "catalog.json"
catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
gallery_catalog_count = 0
catalog_preview_paths = set()
for row in catalog:
    preview = row.get("files", {}).get("preview", "")
    if preview.startswith("/prenosi/") and preview.endswith("/predogled.png"):
        row["files"]["preview"] = preview[:-4] + ".webp"
    elif preview.startswith("/prenosi/") and preview.endswith("/predogled.webp"):
        pass
    else:
        continue
    gallery_catalog_count += 1
    catalog_preview_paths.add(ROOT / "site" / row["files"]["preview"].lstrip("/"))
actual_preview_paths = {path.with_suffix(".webp") for path in PREVIEW_PATHS + WEBP_PREVIEW_PATHS}
if catalog_preview_paths != actual_preview_paths:
    raise SystemExit(
        f"Gallery catalog and preview files differ: {len(catalog_preview_paths)} entries, "
        f"{len(actual_preview_paths)} unique files"
    )
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

webp_output_paths = sorted(actual_preview_paths)
after_bytes = sum(path.stat().st_size for path in webp_output_paths + SAMPLE_PATHS)
for path in webp_output_paths + SAMPLE_PATHS:
    with Image.open(path) as image:
        expected_format = "WEBP" if path.parent == PREVIEW_DIR or path.parent.parent == PREVIEW_DIR else "PNG"
        if image.size != TARGET or image.format != expected_format:
            raise SystemExit(f"Thumbnail format or dimensions were not preserved: {path.relative_to(ROOT)} {image.format} {image.size}")

html_pages = 0
html_url_pages = 0
html_dimension_pages = 0
html_tags = [0]
html_url_tags = [0]
for html_path in sorted((ROOT / "site").rglob("*.html")):
    text = html_path.read_text(encoding="utf-8")
    urls_before = html_url_tags[0]
    dimensions_before = html_tags[0]

    def normalize_preview(match: re.Match[str]) -> str:
        tag = match.group(0)
        tag_name = match.group(1).lower()
        attributes = {match.group(1).lower(): match.group(3) for match in ATTRIBUTE.finditer(tag)}
        if tag_name == "a":
            source = attributes.get("href", "")
            replacement_value = version_preview_url(source)
            if replacement_value == source:
                return tag
            html_url_tags[0] += 1
            pattern = re.compile(r"\bhref=(['\"])[^'\"]*\1", re.IGNORECASE)
            return pattern.sub(lambda match: f'href="{replacement_value}"', tag, count=1)
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
            html_url_tags[0] += 1
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

    updated, count = PREVIEW_TAG.subn(normalize_preview, text)
    if updated != text:
        html_path.write_text(updated, encoding="utf-8")
        html_pages += 1
    if html_url_tags[0] > urls_before:
        html_url_pages += 1
    if html_tags[0] > dimensions_before:
        html_dimension_pages += 1

record = {
    "checked_at": datetime.now(timezone.utc).isoformat(),
    "gallery_previews": gallery_catalog_count,
    "gallery_previews_converted_to_webp": converted,
    "gallery_previews_already_webp": len(WEBP_PREVIEW_PATHS),
    "studio_sample_previews": len(SAMPLE_PATHS),
    "html_pages_with_updated_preview_dimensions": html_dimension_pages,
    "html_pages_with_versioned_preview_urls": html_url_pages,
    "html_preview_tags_normalized": html_tags[0],
    "html_preview_urls_updated": html_url_tags[0],
    "html_preview_dimensions": {"width": TARGET[0], "height": TARGET[1]},
    "preview_cache_version_png": PNG_PREVIEW_CACHE_VERSION,
    "preview_cache_version_webp": WEBP_PREVIEW_CACHE_VERSION,
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
