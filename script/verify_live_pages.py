"""Check every published sitemap URL without downloading the document bodies."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit
import argparse
import hashlib
import http.client
import json
import ssl
import threading
import time
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--origin', default='https://koledar365.si')
parser.add_argument('--output', default='evidence/pagespeed-live-url-check.json')
args = parser.parse_args()
origin = urlsplit(args.origin)
if origin.scheme != 'https':
    raise SystemExit('HTTPS is required for the live check.')
paths = sorted({urlsplit(node.text).path for name in ['sitemap-pages.xml']
                for node in ET.parse(ROOT / 'site' / name).getroot().iter()
                if node.tag.endswith('}loc')})
local = threading.local()
context = ssl.create_default_context()

def check(path):
    start = time.monotonic()
    for attempt in range(2):
        try:
            if not getattr(local, 'connection', None):
                local.connection = http.client.HTTPSConnection(origin.hostname, origin.port or 443, timeout=20, context=context)
            local.connection.request('HEAD', path, headers={'User-Agent': 'Koledar365-Publication-Check/1.0', 'Accept-Encoding': 'gzip'})
            response = local.connection.getresponse()
            status = response.status
            response.read()
            return {'path': path, 'status': status, 'milliseconds': round((time.monotonic() - start) * 1000)}
        except (OSError, http.client.HTTPException) as error:
            if getattr(local, 'connection', None):
                local.connection.close()
            local.connection = None
            if attempt:
                return {'path': path, 'status': None, 'error': type(error).__name__}
    raise AssertionError('Unreachable')

started = datetime.now(timezone.utc).isoformat()
rows = []
with ThreadPoolExecutor(max_workers=6) as pool:
    tasks = [pool.submit(check, path) for path in paths]
    for future in as_completed(tasks):
        rows.append(future.result())
        if len(rows) % 500 == 0:
            print(json.dumps({'checked': len(rows), 'total': len(paths), 'failed': sum(row['status'] != 200 for row in rows)}), flush=True)
record = {'started_at': started, 'finished_at': datetime.now(timezone.utc).isoformat(),
          'origin': args.origin, 'method': 'HEAD', 'url_count': len(paths),
          'passed': all(row['status'] == 200 for row in rows),
          'sitemap_sha256': {name: hashlib.sha256((ROOT / 'site' / name).read_bytes()).hexdigest()
                             for name in ['sitemap-pages.xml']},
          'results': sorted(rows, key=lambda row: row['path'])}
output = ROOT / args.output
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({key: value for key, value in record.items() if key != 'results'}), flush=True)
if not record['passed']:
    raise SystemExit(1)
