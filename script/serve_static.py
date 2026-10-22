from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import urlsplit, urlunsplit
import os
root=Path(__file__).resolve().parent.parent/'site'
os.chdir(root)
csp=next(line.split(':',1)[1].strip() for line in (root/'_headers').read_text().splitlines() if line.strip().startswith('Content-Security-Policy:'))
# Reproduce the exact Pages redirects before reading assets, including removed aliases.
redirects={}
for line in (root/'_redirects').read_text().splitlines():
 fields=line.split()
 if len(fields)==3 and fields[0].startswith('/') and '*' not in fields[0] and fields[2] in {'301','302','303','307','308'}:
  redirects[fields[0]]=(fields[1],int(fields[2]))
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  incoming=urlsplit(self.path)
  if incoming.path in redirects:
   location,status=redirects[incoming.path]
   destination=urlsplit(location)
   if incoming.query and not destination.query:
    location=urlunsplit((destination.scheme,destination.netloc,destination.path,incoming.query,destination.fragment))
   self.send_response(status);self.send_header('Location',location);self.end_headers()
   return
  if self.path.startswith('/vreme/'):
   try:
    with urlopen('http://127.0.0.1:3650'+self.path,timeout=15) as response:
     self.send_response(response.status);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(response.read())
   except Exception:self.send_error(503)
   return
  super().do_GET()
 def end_headers(self):
  self.send_header('Cache-Control','no-store')
  self.send_header('Content-Security-Policy',csp)
  super().end_headers()
class Server(ThreadingHTTPServer):
 request_queue_size=128
 daemon_threads=True
Server(('127.0.0.1',int(os.environ.get('K365_STATIC_PORT','3651'))),Handler).serve_forever()
