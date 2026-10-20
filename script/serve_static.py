from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.request import urlopen
import os
root=Path(__file__).resolve().parent.parent/'site'
os.chdir(root)
csp=next(line.split(':',1)[1].strip() for line in (root/'_headers').read_text().splitlines() if line.strip().startswith('Content-Security-Policy:'))
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
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
