require 'json'
require 'fileutils'
require 'digest'
require 'zlib'
require 'stringio'
root=File.expand_path('..',__dir__);out=File.join(root,'site/free');FileUtils.mkdir_p(out)
source=File.expand_path(ENV.fetch('WASM_SOURCE','../../work/free-runtime/koledar365.wasm'),root)
buffer=StringIO.new;zip=Zlib::GzipWriter.new(buffer,Zlib::BEST_COMPRESSION);zip.mtime=0;zip.write(File.binread(source));zip.close;compressed=buffer.string
revision=Digest::SHA256.hexdigest(compressed).slice(0,20);folder=File.join(out,'engine',revision);FileUtils.mkdir_p(folder)
parts=[];compressed.bytes.each_slice(20*1024*1024).with_index do |values,index|
 bytes=values.pack('C*');filename="engine-#{index}.gz";File.binwrite(File.join(folder,filename),bytes);parts << {path:"/free/engine/#{revision}/#{filename}",sha256:Digest::SHA256.hexdigest(bytes),size:bytes.bytesize}
end
File.write(File.join(out,'runtime.json'),JSON.generate({runtime:'official ruby.wasm 4.0.0 / package 2.10.1',encoding:'gzip',parts:parts,raw_bytes:File.size(source),payload_fingerprint:File.read(File.join(root,'tmp/portable-fingerprint.txt')).strip}))
vendor=File.join(out,'vendor');FileUtils.mkdir_p(vendor)
packages=File.expand_path('../../work/free-runtime',root)
if File.directory?(File.join(packages,'4.0-wasm-wasi'))
FileUtils.cp(File.join(packages,'4.0-wasm-wasi/package/dist/browser.umd.js'),File.join(vendor,'ruby.umd.js'))
%w[LICENSE NOTICE].each { |name|FileUtils.cp(File.join(packages,'4.0-wasm-wasi/package/dist',name),File.join(vendor,'RUBY_'+name)) }
end
node=ENV.fetch('NODE_MODULES','/Users/melihozcan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')
if File.directory?(node)
%w[pdf.min.mjs pdf.worker.min.mjs].each { |name|FileUtils.cp(File.join(node,'pdfjs-dist/build',name),vendor) }
FileUtils.mkdir_p(File.join(vendor,'pdf-wasm'));FileUtils.cp_r(File.join(node,'pdfjs-dist/wasm/.'),File.join(vendor,'pdf-wasm'))
FileUtils.cp(File.join(node,'pdfjs-dist/LICENSE'),File.join(vendor,'PDFJS_LICENSE'))
FileUtils.cp(File.join(node,'jszip/dist/jszip.min.js'),vendor)
FileUtils.cp(File.join(node,'jszip/LICENSE.markdown'),File.join(vendor,'JSZIP_LICENSE'))
if File.directory?(File.join(packages,'webp/package'));FileUtils.mkdir_p(File.join(vendor,'webp'));FileUtils.cp_r(File.join(packages,'webp/package/.'),File.join(vendor,'webp'));end
encode=File.join(vendor,'webp/encode.js');File.write(encode,File.read(encode).sub("from 'wasm-feature-detect'","from '../wasm-feature-detect.js'"))
feature=Dir[File.join(node,'wasm-feature-detect/dist/esm/index.js')].first || Dir[File.join(node,'wasm-feature-detect/dist/esm/*.js')].first
FileUtils.cp(feature,File.join(vendor,'wasm-feature-detect.js'))
end
FileUtils.cp_r(File.join(root,'cloudflare/free/.'),out)
Dir[File.join(out,'engine/*')].each { |path| FileUtils.rm_rf(path) if File.directory?(path) && File.basename(path)!=revision }
FileUtils.rm_rf(File.join(vendor,'webp/package'));FileUtils.rm_rf(File.join(vendor,'pdf-wasm/wasm'));FileUtils.rm_f(File.join(out,'README.md'))
puts JSON.generate({runtime:parts,compressed_bytes:compressed.bytesize})
