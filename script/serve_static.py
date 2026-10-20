from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.request import urlopen
import os
root=Path(__file__).resolve().parent.parent/'site'
os.chdir(root)
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
  self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' blob:; connect-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self' mailto:; frame-ancestors 'none'")
  super().end_headers()
ThreadingHTTPServer(('127.0.0.1',3651),Handler).serve_forever()
