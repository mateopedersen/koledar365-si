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
vendor=File.join(out,'vendor')
load File.join(__dir__,'package_browser_vendors.rb')
FileUtils.cp_r(File.join(root,'cloudflare/free/.'),out)
Dir[File.join(out,'engine/*')].each { |path| FileUtils.rm_rf(path) if File.directory?(path) && File.basename(path)!=revision }
FileUtils.rm_rf(File.join(vendor,'webp/package'));FileUtils.rm_rf(File.join(vendor,'pdf-wasm/wasm'));FileUtils.rm_f(File.join(out,'README.md'))
puts JSON.generate({runtime:parts,compressed_bytes:compressed.bytesize})
