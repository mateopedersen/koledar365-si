from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import urlopen
from urllib.parse import urlsplit,urlunsplit
import os,json
root=Path(__file__).resolve().parent.parent/'site'
os.chdir(root)
aliases=json.loads((root.parent/'config/public_page_redirects.json').read_text())
csp=next(line.split(':',1)[1].strip() for line in (root/'_headers').read_text().splitlines() if line.strip().startswith('Content-Security-Policy:'))
weather_port = int(os.environ.get('K365_WEATHER_PORT', '3650'))
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
  if self.redirect_alias():
   return
  path = urlsplit(self.path).path
  if path == '/city-detect/':
   # Cloudflare geolocation is unavailable on loopback.
   self.send_json(200, {'city': None, 'match': 'unavailable', 'approximate': True})
  elif path.startswith('/vreme/'):
   self.proxy_weather()
  else:
   super().do_GET()
 def send_json(self, status, data):
  self.send_body(status, 'application/json; charset=utf-8', json.dumps(data).encode('utf-8'))
 def send_body(self, status, content_type, body):
  self.send_response(status)
  self.send_header('Content-Type', content_type)
  self.send_header('Content-Length', str(len(body)))
  self.end_headers()
  self.wfile.write(body)
 def proxy_weather(self):
  try:
   try:
    response = urlopen(f'http://127.0.0.1:{weather_port}{self.path}', timeout=15)
   except HTTPError as error:
    response = error
   with response:
    status = response.code
    content_type = response.headers.get('Content-Type', 'application/json')
    body = response.read()
  except OSError as error:
   self.log_error('Local weather service on port %s: %s', weather_port, error)
   self.send_json(503, {'error': 'Vremenska napoved trenutno ni na voljo.'})
   return
  self.send_body(status, content_type, body)
 def end_headers(self):
  self.send_header('Cache-Control','no-store')
  self.send_header('Content-Security-Policy',csp)
  super().end_headers()
class Server(ThreadingHTTPServer):
 request_queue_size=128
 daemon_threads=True
Server(('127.0.0.1',int(os.environ.get('K365_STATIC_PORT','3651'))),Handler).serve_forever()
