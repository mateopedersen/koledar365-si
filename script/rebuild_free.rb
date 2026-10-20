# Deterministic public build. PDF/WebP catalogue bytes have already passed both gates.
require 'json';require 'fileutils';require 'rbconfig'
root=File.expand_path('..',__dir__);Dir.chdir(root)
def run!(*command)
  raise "Build failed: #{command.first(3).join(' ')}" unless system(*command)
end
run!('bundle','exec','rails','db:prepare')
run!('bundle','exec','ruby','script/restore_editorial.rb')
run!('bundle','exec','rails','assets:precompile')
run!('bundle','exec','ruby','script/build_portable.rb')
current=JSON.parse(File.read('site/free/runtime.json'))
if current['payload_fingerprint']!=File.read('tmp/portable-fingerprint.txt').strip
  run!(ENV.fetch('PYTHON_BIN','python3'),'script/fetch_browser_runtime.py')
  run!('gem','install','ruby_wasm','-v','2.10.1','--no-document')
  run!('rbwasm','pack','tmp/browser/ruby+stdlib.wasm','--dir','tmp/portable-root::/app','--output','tmp/browser/koledar365.wasm')
  ENV['WASM_SOURCE']='tmp/browser/koledar365.wasm';run!('ruby','script/package_browser.rb')
end
run!('bundle','exec','ruby','script/export_pages.rb')
run!('bundle','exec','ruby','script/build_admin_page.rb')
run!('bundle','exec','ruby','script/package_social.rb')
# Reuse the verified public catalogue on CI; original rendering folders are private build caches.
run!('bundle','exec','ruby','script/validate_catalog_sources.rb')
run!('bundle','exec','ruby','script/audit_static.rb')
run!('ruby','script/finalize_static.rb')
run!('node','script/verify_static.mjs')
