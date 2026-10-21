"""Verify that each sitemap URL uses the shared readable typography layer."""
from collections import Counter
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import hashlib
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / 'site'
MARKER = 'K365-site-readability-v1'
NS = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}


class StylesheetParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stylesheets = []
        self.inline_readability = False
        self.in_readability_style = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'link' and 'stylesheet' in attrs.get('rel', '').split():
            self.stylesheets.append(attrs.get('href', ''))
        if tag == 'style' and attrs.get('data-page-styles') == 'home':
            self.in_readability_style = True

    def handle_endtag(self, tag):
        if tag == 'style':
            self.in_readability_style = False

    def handle_data(self, data):
        if self.in_readability_style and MARKER in data:
            self.inline_readability = True


def local_file(path):
    relative = path.lstrip('/')
    if path == '/':
        return SITE / 'index.html'
    if path.endswith('/'):
        return SITE / relative / 'index.html'
    return SITE / relative


urls = []
sitemap_meta = {}
families = Counter()
for sitemap in ('sitemap-pages.xml',):
    sitemap_path = SITE / sitemap
    raw = sitemap_path.read_bytes()
    root = ET.fromstring(raw)
    entries = [node.text for node in root.findall('.//s:loc', NS) if node.text]
    sitemap_meta[sitemap] = {
        'url_count': len(entries),
        'sha256': hashlib.sha256(raw).hexdigest(),
    }
    for url in entries:
        path = urlsplit(url).path
        urls.append(path)
        family = path.strip('/').split('/', 1)[0] or 'home'
        families[family] += 1

missing_files = []
missing_readability = []
css_cache = {}
for path in urls:
    html_file = local_file(path)
    if not html_file.is_file():
        missing_files.append(path)
        continue
    parser = StylesheetParser()
    parser.feed(html_file.read_text(encoding='utf-8'))
    covered = parser.inline_readability
    for href in parser.stylesheets:
        if not href.startswith('/assets/') or not href.endswith('.css'):
            continue
        css_file = SITE / href.lstrip('/')
        if href not in css_cache:
            css_cache[href] = css_file.is_file() and MARKER in css_file.read_text(encoding='utf-8')
        covered = covered or css_cache[href]
    if not covered:
        missing_readability.append(path)

special_pages = {}
for filename in ('404.html',):
    html_file = SITE / filename
    parser = StylesheetParser()
    if html_file.is_file():
        parser.feed(html_file.read_text(encoding='utf-8'))
        covered = parser.inline_readability
        for href in parser.stylesheets:
            if not href.startswith('/assets/') or not href.endswith('.css'):
                continue
            css_file = SITE / href.lstrip('/')
            if href not in css_cache:
                css_cache[href] = css_file.is_file() and MARKER in css_file.read_text(encoding='utf-8')
            covered = covered or css_cache[href]
        special_pages['/' + filename] = {'exists': True, 'readability_covered': covered}
    else:
        special_pages['/' + filename] = {'exists': False, 'readability_covered': False}

record = {
    'checked_at': datetime.now(timezone.utc).isoformat(),
    'sitemaps': sitemap_meta,
    'url_count': len(urls),
    'unique_url_count': len(set(urls)),
    'route_families': dict(sorted(families.items())),
    'missing_html_count': len(missing_files),
    'missing_html_examples': missing_files[:20],
    'missing_readability_count': len(missing_readability),
    'missing_readability_examples': missing_readability[:20],
    'special_pages': special_pages,
    'css_bundles_checked': len(css_cache),
    'passed': not missing_files and not missing_readability and len(urls) == len(set(urls)) and
              all(page['exists'] and page['readability_covered'] for page in special_pages.values()),
}
output = ROOT / 'evidence/readability-sitewide-audit.json'
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(record, ensure_ascii=False, indent=2))
if not record['passed']:
    raise SystemExit(1)
