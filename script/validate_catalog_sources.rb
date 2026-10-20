require_relative '../config/environment'
rows=JSON.parse(Rails.root.join('site/free/catalog.json').read)
rows.each do |row|
 raise "Outdated source: #{row['fingerprint']}" unless PrintCatalog.source_version(row['options'])==row.dig('manifest','source_data_version')
 raise 'Template needs a fresh print gate.' unless row.dig('manifest','template_version')==PrintCatalog::VERSION
 manifest=row.fetch('manifest');folder=Rails.root.join('site');pdf=folder.join(row['files'].fetch('pdf').delete_prefix('/'))
 raise 'Public PDF hash differs from verified manifest.' unless Digest::SHA256.file(pdf).hexdigest==manifest['pdf_sha256']
 raster=folder.join(row['files'].fetch('webp').delete_prefix('/'))
 if manifest['page_count']>1
  Zip::File.open(raster) do |zip|
   raise 'ZIP manifest differs.' unless JSON.parse(zip.read('manifest.json'))==manifest
   manifest['pages'].each { |page|raise 'ZIP image hash differs.' unless Digest::SHA256.hexdigest(zip.read(page['filename']))==page['sha256'] }
  end
 else
  raise 'Public WebP hash differs from verified manifest.' unless Digest::SHA256.file(raster).hexdigest==manifest['pages'].first['sha256']
 end
 %w[pdf webp preview].each do |key|
  file=Rails.root.join('site',row['files'].fetch(key).delete_prefix('/'));raise "Missing #{file}" unless file.file?
 end
end
puts "Catalogue source versions match (#{rows.size} pairs)."
