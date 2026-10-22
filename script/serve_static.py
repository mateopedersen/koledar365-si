from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import urlsplit,urlunsplit
import os,json
root=Path(__file__).resolve().parent.parent/'site'
os.chdir(root)
aliases=json.loads((root.parent/'config/public_page_redirects.json').read_text())
csp=next(line.split(':',1)[1].strip() for line in (root/'_headers').read_text().splitlines() if line.strip().startswith('Content-Security-Policy:'))
class Handler(SimpleHTTPRequestHandler):
 def redirect_alias(self):
  requested=urlsplit(self.path)
  destination=aliases.get(requested.path.rstrip('/')+'/')
  if not destination:return False
  target=urlsplit(destination)
  self.send_response(301)
  self.send_header('Location',urlunsplit(('', '', target.path, requested.query, target.fragment)))
  self.end_headers()
  return True
 def do_HEAD(self):
  if not self.redirect_alias():super().do_HEAD()
 def do_GET(self):
  if self.redirect_alias():return
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
