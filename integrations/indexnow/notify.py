#!/usr/bin/env python3
"""Notify IndexNow only after canonical page revisions are publicly deployed."""
import argparse
import hashlib
import json
import re
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[2]
NS = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}

def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'Koledar365-IndexNow/1.0', 'Accept-Encoding': 'identity'})
    with urllib.request.urlopen(request, timeout=40) as response:
        if response.status != 200 or response.url != url:
            raise ValueError('Expected a direct HTTP 200: ' + url)
        return response.read()

def inventory(sitemap, revisions, origin):
    root = ET.fromstring(sitemap)
    if root.tag != '{' + NS['s'] + '}urlset':
        raise ValueError('Expected a sitemap urlset')
    pages = {}
    for node in root.findall('s:url/s:loc', NS):
        url = node.text or ''
        parsed = urlsplit(url)
        if parsed.scheme != 'https' or parsed.netloc != urlsplit(origin).netloc or parsed.query or parsed.fragment:
            raise ValueError('Invalid canonical URL: ' + url)
        if parsed.path.startswith(('/upravljanje/', '/free/')) or url in pages:
            raise ValueError('Private or duplicate sitemap URL: ' + url)
        digest = revisions.get(parsed.path, {}).get('sha256', '')
        if not re.fullmatch('[a-f0-9]{64}', digest):
            raise ValueError('Missing significant-content revision: ' + url)
        pages[url] = digest
    if not pages:
        raise ValueError('Empty sitemap')
    return pages

def changes(previous, current):
    return sorted(url for url in previous.keys() | current.keys() if previous.get(url) != current.get(url))

def submit(config, urls, sleeper=time.sleep):
    if not urls:
        return []
    statuses = []
    for offset in range(0, len(urls), 10000):
        batch = urls[offset:offset + 10000]
        payload = json.dumps({'host': urlsplit(config['origin']).netloc, 'key': config['key'],
                              'keyLocation': config['origin'] + '/' + config['key'] + '.txt', 'urlList': batch}).encode()
        for attempt in range(5):
            request = urllib.request.Request(config['endpoint'], data=payload,
                      headers={'Content-Type': 'application/json; charset=utf-8', 'User-Agent': 'Koledar365-IndexNow/1.0'}, method='POST')
            try:
                with urllib.request.urlopen(request, timeout=45) as response:
                    status = response.status
                    response.read()
            except urllib.error.HTTPError as error:
                status = error.code
                if status not in (429, 500, 502, 503, 504):
                    raise RuntimeError('IndexNow rejected submission: HTTP ' + str(status)) from error
            except urllib.error.URLError:
                if attempt == 4:
                    raise
                sleeper(15 * (attempt + 1))
                continue
            print(json.dumps({'batch_urls': len(batch), 'attempt': attempt + 1, 'http_status': status}), flush=True)
            if status == 200:
                statuses.append({'urls': len(batch), 'status': status})
                break
            if status not in (202, 429, 500, 502, 503, 504):
                raise RuntimeError('Unexpected IndexNow response: HTTP ' + str(status))
            if attempt == 4:
                raise RuntimeError('IndexNow has not confirmed acceptance; state retained for retry: HTTP ' + str(status))
            sleeper(15 * (attempt + 1))
    return statuses

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--state', type=Path, default=ROOT / '.indexnow/state.json')
    parser.add_argument('--report', type=Path, default=ROOT / '.indexnow/report.json')
    parser.add_argument('--wait', action='store_true')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    config = json.loads((ROOT / 'config/indexnow.json').read_text())
    if config['origin'] != 'https://koledar365.si' or config['endpoint'] != 'https://api.indexnow.org/indexnow':
        raise ValueError('Unexpected host or IndexNow endpoint')
    if not re.fullmatch('[a-f0-9]{32}', config['key']):
        raise ValueError('Invalid IndexNow key')
    expected = (ROOT / 'site/page-revisions.json').read_bytes()
    expected_sitemap = (ROOT / 'site/sitemap-pages.xml').read_bytes()
    for attempt in range(40 if args.wait else 1):
        try:
            revisions = fetch(config['origin'] + '/page-revisions.json')
            sitemap = fetch(config['origin'] + '/sitemap-pages.xml')
            key = fetch(config['origin'] + '/' + config['key'] + '.txt').decode().strip()
            if key != config['key'] or revisions != expected or sitemap != expected_sitemap:
                raise ValueError('Waiting for this publication and its verification key')
            break
        except (ValueError, urllib.error.URLError) as error:
            if not args.wait or attempt == 39:
                raise
            print(f'Waiting for deployed publication {attempt + 1}/40: {type(error).__name__}', flush=True)
            time.sleep(30)
    current = inventory(sitemap, json.loads(revisions), config['origin'])
    prior = json.loads(args.state.read_text()) if args.state.exists() else {}
    previous = prior.get('pages', {}) if prior.get('host') == config['origin'] else {}
    urls = changes(previous, current)
    report = {'checked_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'host': config['origin'],
              'canonical_pages': len(current), 'added': sum(u not in previous for u in urls),
              'updated': sum(u in previous and u in current for u in urls),
              'removed': sum(u not in current for u in urls), 'urls': urls, 'dry_run': args.dry_run}
    report['responses'] = [] if args.dry_run else submit(config, urls)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + '\n')
    if not args.dry_run:
        args.state.parent.mkdir(parents=True, exist_ok=True)
        temporary = args.state.with_suffix('.tmp')
        temporary.write_text(json.dumps({'host': config['origin'], 'pages': current}, sort_keys=True) + '\n')
        temporary.replace(args.state)
    print(json.dumps({k: v for k, v in report.items() if k != 'urls'}), flush=True)

if __name__ == '__main__':
    main()
