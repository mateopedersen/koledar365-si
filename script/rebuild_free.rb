# Deterministic public build. PDF/WebP catalogue bytes have already passed both gates.
require 'json';require 'fileutils';require 'rbconfig';require 'bundler'
root=File.expand_path('..',__dir__);Dir.chdir(root)
def run!(*command)
  raise "Build failed: #{command.first(3).join(' ')}" unless system(*command)
end
run!('bundle','exec','rails','db:prepare')
run!('bundle','exec','ruby','script/restore_editorial.rb')
run!('bundle','exec','ruby','script/lunar/prepare.rb')
run!('bundle','exec','rails','assets:precompile')
run!('bundle','exec','ruby','script/build_portable.rb')
current=JSON.parse(File.read('site/free/runtime.json'))
if current['payload_fingerprint']!=File.read('tmp/portable-fingerprint.txt').strip
  run!(ENV.fetch('PYTHON_BIN','python3'),'script/fetch_browser_runtime.py')
  Bundler.with_unbundled_env do
    # Some RubyGems installations ship a mise plugin that shells out to
    # `mise reshim` after every install. GitHub Actions and other direct Ruby
    # installs do not use mise, so provide only that harmless no-op hook there.
    shim_dir=File.expand_path('tmp/build-mise-shim')
    path_entries=ENV.fetch('PATH','').split(File::PATH_SEPARATOR)
    unless path_entries.any?{|entry| File.executable?(File.join(entry,'mise'))}
      FileUtils.mkdir_p(shim_dir)
      shim=File.join(shim_dir,'mise')
      File.write(shim,"#!/bin/sh\n[ \"$#\" -eq 1 ] && [ \"$1\" = reshim ] || exit 1\nexit 0\n")
      FileUtils.chmod(0755,shim)
      ENV['PATH']="#{shim_dir}#{File::PATH_SEPARATOR}#{ENV.fetch('PATH','')}"
    end
    begin
      run!('gem','install','ruby_wasm','-v','2.10.1','--no-document')
    ensure
      ENV['PATH']=ENV['PATH'].split(File::PATH_SEPARATOR).drop_while{|entry|entry==shim_dir}.join(File::PATH_SEPARATOR)
      FileUtils.rm_rf(shim_dir)
    end
    run!('rbwasm','pack','tmp/browser/ruby+stdlib.wasm','--dir','tmp/portable-root::/app','--output','tmp/browser/koledar365.wasm')
  end
  ENV['WASM_SOURCE']='tmp/browser/koledar365.wasm';run!('ruby','script/package_browser.rb')
end
# Make the replacement catalogue and immutable image assets available to the
# renderer before it generates the 52 public gallery pages and image sitemap.
run!(ENV.fetch('PYTHON_BIN','python3'),'script/prepare_calendar_collection.py')
run!('bundle','exec','ruby','script/export_pages.rb')
run!('bundle','exec','ruby','script/build_seo_publication.rb')
run!('bundle','exec','ruby','script/build_admin_page.rb')
run!('bundle','exec','ruby','script/package_social.rb')
run!('bundle','exec','ruby','script/build_release_inventory.rb')
# Reuse the verified public catalogue on CI; original rendering folders are private build caches.
run!('bundle','exec','ruby','script/validate_catalog_sources.rb')
run!(ENV.fetch('PYTHON_BIN','python3'),'script/optimize_gallery_previews.py')
run!('bundle','exec','ruby','script/audit_static.rb')
run!(ENV.fetch('PYTHON_BIN','python3'),'script/audit_indexability.py')
run!('ruby','script/finalize_static.rb')
run!('bundle','exec','ruby','script/audit_site_content.rb')
# Structural SEO checks stay reusable as new pages enter the publication.
ENV['SEO_STRICT']='1'
run!('bundle','exec','ruby','script/audit_full_seo.rb')
run!(ENV.fetch('NODE_BIN','node'),'script/verify_static.mjs')
