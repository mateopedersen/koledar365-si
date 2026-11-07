# Browser libraries are resolved from the repository lockfile, never a developer cache.
require 'json'
require 'fileutils'
root=File.expand_path('..',__dir__)
vendor=File.join(root,'site/free/vendor');FileUtils.mkdir_p(vendor)
node=File.expand_path(ENV.fetch('NODE_MODULES',File.join(root,'node_modules')))
{ 'pdfjs-dist'=>'6.2.108', 'jszip'=>'3.10.1', 'wasm-feature-detect'=>'1.9.0' }.each do |name,version|
  package=JSON.parse(File.read(File.join(node,name,'package.json')))
  raise "Unexpected browser library: #{name}" unless package.fetch('version')==version
end
%w[pdf.min.mjs pdf.worker.min.mjs].each { |name|FileUtils.cp(File.join(node,'pdfjs-dist/build',name),vendor) }
# Main, worker, codecs and non-WASM fallbacks must always come from one release.
FileUtils.rm_rf(File.join(vendor,'pdf-wasm'))
FileUtils.mkdir_p(File.join(vendor,'pdf-wasm'))
FileUtils.cp_r(File.join(node,'pdfjs-dist/wasm/.'),File.join(vendor,'pdf-wasm'))
FileUtils.cp(File.join(node,'pdfjs-dist/LICENSE'),File.join(vendor,'PDFJS_LICENSE'))
FileUtils.cp(File.join(node,'jszip/dist/jszip.min.js'),vendor)
FileUtils.cp(File.join(node,'jszip/LICENSE.markdown'),File.join(vendor,'JSZIP_LICENSE'))
feature=File.join(node,'wasm-feature-detect/dist/esm/index.js')
FileUtils.cp(feature,File.join(vendor,'wasm-feature-detect.js'))
packages=File.expand_path('../../work/free-runtime',root)
if File.directory?(File.join(packages,'4.0-wasm-wasi'))
  FileUtils.cp(File.join(packages,'4.0-wasm-wasi/package/dist/browser.umd.js'),File.join(vendor,'ruby.umd.js'))
  %w[LICENSE NOTICE].each { |name|FileUtils.cp(File.join(packages,'4.0-wasm-wasi/package/dist',name),File.join(vendor,'RUBY_'+name)) }
end
if File.directory?(File.join(packages,'webp/package'))
  FileUtils.mkdir_p(File.join(vendor,'webp'));FileUtils.cp_r(File.join(packages,'webp/package/.'),File.join(vendor,'webp'))
end
encode=File.join(vendor,'webp/encode.js')
if File.file?(encode)
  File.write(encode,File.read(encode).sub("from 'wasm-feature-detect'","from '../wasm-feature-detect.js'"))
end
