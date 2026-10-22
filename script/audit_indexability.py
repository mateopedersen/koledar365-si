#!/usr/bin/env python3
"""Audit exported HTML, sitemap coverage, duplicate content and optional live responses.

No third-party dependencies. --live requests every sitemap URL and representative
URL aliases; it checks technical eligibility, not search-engine index coverage.
"""
import argparse
from collections import defaultdict, deque
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, HTTPRedirectHandler, build_opener
from urllib.robotparser import RobotFileParser
import xml.etree.ElementTree as ET

ORIGIN = 'https://koledar365.si'
ROOT = Path(__file__).resolve().parent.parent
NS = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}


class Document(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.canonicals, self.robots, self.links, self.text = [], [], [], []
        self.titles, self.descriptions, self.headings = [], [], []
        self.in_main = self.ignored = 0
        self.in_title = self.in_h1 = False
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'main':
            self.in_main += 1
        if tag in ('script', 'style', 'svg'):
            self.ignored += 1
        if tag == 'title':
            self.in_title = True
        if tag == 'h1':
            self.in_h1 = True
        if tag == 'link' and 'canonical' in attrs.get('rel', '').split():
            self.canonicals.append(attrs.get('href', ''))
        if tag == 'meta':
            name = attrs.get('name', '').lower()
            if name in ('robots', 'googlebot'):
                self.robots.append(attrs.get('content', '').lower())
            if name == 'description':
                self.descriptions.append(attrs.get('content', ''))
        if tag == 'a' and attrs.get('href'):
            self.links.append(attrs['href'])

    def handle_endtag(self, tag):
        if tag == 'main':
            self.in_main = max(0, self.in_main - 1)
        if tag in ('script', 'style', 'svg'):
            self.ignored = max(0, self.ignored - 1)
        if tag == 'title':
            self.in_title = False
        if tag == 'h1':
            self.in_h1 = False

    def handle_data(self, data):
        if self.in_main and not self.ignored:
            self.text.append(data)
        if self.in_title and not self.ignored:
            self.titles.append(data)
        if self.in_h1 and not self.ignored:
            self.headings.append(data)

    @property
    def noindex(self):
        return any(re.search(r'\b(?:noindex|none)\b', value) for value in self.robots)

    @property
    def content(self):
        return ' '.join(' '.join(self.text).split())

    @property
    def title(self):
        return ' '.join(' '.join(self.titles).split())


def locs(xml):
    return [node.text for node in ET.fromstring(xml).findall('s:url/s:loc', NS)]


class Redirects(HTTPRedirectHandler):
    # macOS system Python 3.9 lacks the permanent-redirect handler.
    http_error_308 = HTTPRedirectHandler.http_error_302

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        # The auditor issues GETs. Older Python also rejects 308 in this method.
        compatible_code = 301 if code == 308 and req.get_method() in ('GET', 'HEAD') else code
        return super().redirect_request(req, fp, compatible_code, msg, headers, newurl)


def fetch(url):
    for attempt in range(3):
        try:
            with build_opener(Redirects).open(Request(url, headers={'User-Agent': 'Koledar365-Indexability-Audit/1.0'}), timeout=45) as response:
                return {'url': url, 'final_url': response.url, 'status': response.status,
                        'headers': dict(response.headers.items()), 'body': response.read().decode('utf-8', errors='replace')}
        except HTTPError as error:
            return {'url': url, 'final_url': error.url, 'status': error.code,
                    'headers': dict(error.headers.items()), 'body': error.read().decode('utf-8', errors='replace')}
        except (URLError, TimeoutError, OSError) as error:
            if attempt == 2:
                return {'url': url, 'error': str(error)}
            time.sleep(attempt + 1)


def audit(site, live=False):
    issues, warnings, rows = [], [], []
    sitemap = locs((site / 'sitemap-pages.xml').read_text())
    if len(sitemap) != len(set(sitemap)):
        issues.append('Duplicate URLs in sitemap')
    index = ET.fromstring((site / 'sitemap.xml').read_text())
    children = [node.text for node in index.findall('s:sitemap/s:loc', NS)]
    if children != [ORIGIN + '/sitemap-pages.xml']:
        issues.append('Unexpected sitemap index')
    robots_text = (site / 'robots.txt').read_text()
    robots = RobotFileParser()
    robots.parse(robots_text.splitlines())
    if ORIGIN + '/sitemap.xml' not in (robots.site_maps() or []):
        issues.append('robots.txt does not advertise the sitemap')
    documents, title_groups, content_groups = {}, defaultdict(list), defaultdict(list)
    for file in sorted(site.rglob('*.html')):
        relative = file.relative_to(site).as_posix()
        path = '/' + (relative[:-10] if relative.endswith('index.html') else relative)
        doc = Document(file.read_text())
        row = {'path': path, 'indexable': not doc.noindex, 'canonical': doc.canonicals,
               'title': doc.title, 'content_characters': len(doc.content)}
        rows.append(row)
        if doc.noindex:
            continue
        documents[path] = doc
        if not relative.endswith('index.html'):
            issues.append(path + ': unexpected indexable auxiliary HTML')
        if doc.canonicals != [ORIGIN + path]:
            issues.append(path + ': canonical is missing, duplicated or not self-referencing')
        if not doc.title or not any(value.strip() for value in doc.descriptions) or not doc.headings:
            issues.append(path + ': missing title, description or H1')
        if not doc.content:
            issues.append(path + ': empty server-rendered content')
        if ORIGIN + path not in sitemap:
            issues.append(path + ': indexable HTML absent from sitemap')
        if not all(robots.can_fetch(agent, ORIGIN + path) for agent in ('*', 'Googlebot')):
            issues.append(path + ': robots.txt blocks a public page')
        title_groups[doc.title].append(path)
        content_groups[hashlib.sha256(doc.content.encode()).hexdigest()].append(path)
    for url in sitemap:
        parsed = urlsplit(url)
        if parsed.scheme != 'https' or parsed.netloc != 'koledar365.si' or parsed.query or parsed.fragment:
            issues.append(url + ': invalid sitemap URL')
        if parsed.path not in documents:
            issues.append(url + ': sitemap target is absent or noindex')
    policy_file = site.parent / 'config/public_page_redirects.json'
    if policy_file.exists():
        policy = json.loads(policy_file.read_text())
        rules = {parts[0]: parts[1:] for line in (site / '_redirects').read_text().splitlines() if len(parts := line.split()) == 3 and not parts[0].startswith('#')}
        search_paths = {row.get('path') for row in json.loads((site / 'free/search.json').read_text())}
        for source, destination in policy.items():
            if (site / source.strip('/') / 'index.html').exists() or ORIGIN + source in sitemap or source in search_paths:
                issues.append(source + ': consolidated duplicate was republished')
            for alias in (source, source.rstrip('/')):
                if rules.get(alias) != [destination, '301']:
                    issues.append(alias + ': missing permanent consolidation redirect')
            parsed = urlsplit(destination)
            target = documents.get(parsed.path)
            if not target:
                issues.append(source + ': consolidation target is not indexable')
            elif parsed.fragment:
                target_file = site / parsed.path.strip('/') / 'index.html'
                if not re.search(r'\bid=["\']' + re.escape(parsed.fragment) + r'["\']', target_file.read_text()):
                    issues.append(source + ': destination section is missing')
    duplicate_content = [paths for paths in content_groups.values() if len(paths) > 1]
    duplicate_titles = [paths for paths in title_groups.values() if len(paths) > 1]
    for group in duplicate_content:
        issues.append('Duplicate main content: ' + ', '.join(group))
    for group in duplicate_titles:
        issues.append('Duplicate title: ' + ', '.join(group))
    # Compare word shingles after normalizing dates/numbers. High similarity is a
    # review candidate, never an automatic deletion: calendar periods differ.
    shingles = {}
    for path, doc in documents.items():
        words = re.sub(r'\d+', '#', doc.content.lower()).split()
        shingles[path] = {tuple(words[i:i+7]) for i in range(max(0, len(words)-6))}
    near_duplicates = []
    paths = sorted(documents)
    for i, first in enumerate(paths):
        a = shingles[first]
        if not a:
            continue
        for second in paths[i+1:]:
            b = shingles[second]
            if not b or min(len(a), len(b)) / max(len(a), len(b)) < .96:
                continue
            similarity = len(a & b) / len(a | b)
            if similarity >= .96:
                near_duplicates.append({'paths': [first, second], 'similarity': round(similarity, 4)})
    reachable, queue = set(), deque(['/'])
    while queue:
        path = queue.popleft()
        if path in reachable or path not in documents:
            continue
        reachable.add(path)
        for href in documents[path].links:
            url = urlsplit(urljoin(ORIGIN + path, href))
            if url.netloc == 'koledar365.si' and url.path in documents and url.path not in reachable:
                queue.append(url.path)
    orphans = sorted(set(documents) - reachable)
    if orphans:
        issues.append('Public pages not reachable from homepage links: ' + ', '.join(orphans))
    live_results = []
    if live:
        live_robots = fetch(ORIGIN + '/robots.txt')
        live_index = fetch(ORIGIN + '/sitemap.xml')
        live_sitemap = fetch(ORIGIN + '/sitemap-pages.xml')
        for result in (live_robots, live_index, live_sitemap):
            if result.get('status') != 200:
                issues.append(result['url'] + ': live file failed ' + str(result.get('error', result.get('status'))))
        if live_robots.get('status') == 200:
            robots.parse(live_robots['body'].splitlines())
            if ORIGIN + '/sitemap.xml' not in (robots.site_maps() or []):
                issues.append('Live robots.txt is missing sitemap declaration')
        if live_sitemap.get('status') == 200:
            live_urls = locs(live_sitemap['body'])
            if set(live_urls) != set(sitemap):
                issues.append('Live and exported sitemap URL sets differ')
        with ThreadPoolExecutor(max_workers=5) as pool:
            for result in pool.map(fetch, sitemap):
                url = result['url']
                if result.get('status') != 200:
                    issues.append(url + ': live status ' + str(result.get('error', result.get('status'))))
                    live_results.append({key: value for key, value in result.items() if key != 'body'})
                    continue
                doc = Document(result['body'])
                headers = {key.lower(): value for key, value in result['headers'].items()}
                if doc.noindex or re.search(r'\b(?:noindex|none)\b', headers.get('x-robots-tag', '').lower()):
                    issues.append(url + ': live noindex')
                if doc.canonicals != [url]:
                    issues.append(url + ': live canonical mismatch')
                if result['final_url'] != url:
                    issues.append(url + ': sitemap URL redirects')
                if not doc.content:
                    issues.append(url + ': empty live main content')
                if not all(robots.can_fetch(agent, url) for agent in ('*', 'Googlebot')):
                    issues.append(url + ': live robots disallows')
                live_results.append({'url': url, 'status': result['status'], 'canonical': doc.canonicals, 'title': doc.title})
        for path in ('/isci/', '/upravljanje/', '/solske-pocitnice/2028-2029/', '/free/views/home/2027-01-month.html'):
            result = fetch(ORIGIN + path)
            doc = Document(result.get('body', ''))
            headers = {key.lower(): value for key, value in result.get('headers', {}).items()}
            noindex = doc.noindex or bool(re.search(r'\b(?:noindex|none)\b', headers.get('x-robots-tag', '').lower()))
            live_results.append({'url': result['url'], 'status': result.get('status'), 'noindex': noindex})
            if result.get('status') != 200 or not noindex:
                issues.append(path + ': intentionally excluded page lost its noindex protection')
        redirects = [line.split() for line in (site / '_redirects').read_text().splitlines()] if (site / '_redirects').exists() else []
        for rule in redirects:
            if len(rule) != 3 or not rule[0].startswith('/solske-pocitnice/'):
                continue
            result = fetch(ORIGIN + rule[0])
            expected = urljoin(ORIGIN, rule[1])
            final = result.get('final_url', '').split('#')[0]
            live_results.append({'url': result['url'], 'status': result.get('status'), 'final_url': result.get('final_url'), 'expected_url': expected})
            if result.get('status') != 200 or final != expected.split('#')[0]:
                issues.append(rule[0] + ': consolidated school URL does not reach its destination')
        aliases = ['/kontakt', '/kontakt/index.html', '/lunin-koledar/2029/avgust',
                   '/lunin-koledar/2029/avgust/index.html', '/kontakt/?utm_source=indexability-audit',
                   '/neobstojeca-indexability-audit/', '/koledar-z-imenom/', '/imena/', '/godovi/']
        for path in aliases:
            result = fetch(ORIGIN + path)
            doc = Document(result.get('body', ''))
            live_results.append({'url': result['url'], 'status': result.get('status'), 'final_url': result.get('final_url'), 'canonical': doc.canonicals})
            if path in aliases[-4:]:
                if result.get('status') not in (404, 410):
                    issues.append(path + ': removed/missing page does not return 404/410')
            elif not doc.canonicals or doc.canonicals[0] not in (ORIGIN + '/kontakt/', ORIGIN + '/lunin-koledar/2029/avgust/'):
                issues.append(path + ': URL variant canonical mismatch')
        for origin in ('http://koledar365.si', 'https://www.koledar365.si'):
            result = fetch(origin + '/kontakt/')
            live_results.append({'url': result['url'], 'status': result.get('status'), 'final_url': result.get('final_url'), 'error': result.get('error')})
            if origin.startswith('https://www.') and result.get('error') and 'nodename nor servname' in result['error']:
                warnings.append(origin + ': hostname is not configured; no duplicate www content is served')
            elif result.get('final_url') != ORIGIN + '/kontakt/' or result.get('status') != 200:
                issues.append(origin + ': preferred-domain redirect failed')
    return {'checked_at': datetime.now(timezone.utc).isoformat(), 'mode': 'static+live' if live else 'static',
            'passed': not issues, 'html_files': len(rows), 'indexable_pages': len(documents),
            'sitemap_urls': len(sitemap), 'reachable_public_pages': len(reachable),
            'noindex_pages': [row['path'] for row in rows if not row['indexable']],
            'duplicate_content': duplicate_content, 'duplicate_titles': duplicate_titles,
            'near_duplicate_candidates': near_duplicates, 'issues': issues, 'warnings': warnings,
            'pages': rows, 'live_results': live_results}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--site', type=Path, default=ROOT / 'site')
    parser.add_argument('--live', action='store_true')
    parser.add_argument('--output', type=Path, default=ROOT / 'evidence/indexability-audit.json')
    args = parser.parse_args()
    report = audit(args.site, args.live)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: value for key, value in report.items() if key not in ('pages', 'live_results', 'noindex_pages', 'near_duplicate_candidates')}, ensure_ascii=False, indent=2))
    print('Near-duplicate candidates for review:', len(report['near_duplicate_candidates']))
    print('Report:', args.output)
    raise SystemExit(0 if report['passed'] else 1)
