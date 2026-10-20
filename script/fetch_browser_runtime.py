import urllib.request,json,hashlib,base64,tarfile,pathlib
root=pathlib.Path(__file__).resolve().parent.parent
lock=json.loads((root/'data/browser-runtime-lock.json').read_text())
destination=root/'tmp/browser';destination.mkdir(parents=True,exist_ok=True)
archive=destination/'ruby-wasm.tgz'
if not archive.exists() or hashlib.sha512(archive.read_bytes()).hexdigest()!=lock['sha512']:
 urllib.request.urlretrieve(lock['tarball'],archive)
assert hashlib.sha512(archive.read_bytes()).hexdigest()==lock['sha512'],'Ruby runtime integrity mismatch'
with tarfile.open(archive) as package:
 source=package.extractfile('package/dist/ruby+stdlib.wasm')
 (destination/'ruby+stdlib.wasm').write_bytes(source.read())
print(destination/'ruby+stdlib.wasm')
