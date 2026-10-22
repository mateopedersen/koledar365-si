#!/usr/bin/env python3
"""Wait for the exact checked-out publication; never accept a stale CDN build."""
import hashlib,time
from pathlib import Path
from urllib.request import Request,urlopen
expected=hashlib.sha256(Path('site/release-manifest.json').read_bytes()).hexdigest()
for attempt in range(40):
 try:
  with urlopen(Request('https://koledar365.si/release-manifest.json',headers={'Accept-Encoding':'identity','User-Agent':'Koledar365-Release-Parity/1.0'}),timeout=30) as response:
   if hashlib.sha256(response.read()).hexdigest()==expected:
    print('Cloudflare is serving the exact publication manifest.');break
 except Exception as error:
  print(type(error).__name__,flush=True)
 print(f'Waiting for publication: {attempt+1}/40',flush=True);time.sleep(30)
else:
 raise SystemExit('Cloudflare did not serve this publication within 20 minutes.')
