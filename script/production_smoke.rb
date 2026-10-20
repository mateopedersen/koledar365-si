require 'json'
raise 'Unexpected Ruby' unless RUBY_VERSION=='4.0.7'
raise 'Unexpected Rails' unless Rails.version=='8.1.4'
raise 'Production must use PostgreSQL' unless ActiveRecord::Base.connection.adapter_name=='PostgreSQL'
PackageImporter.run!
options=PrintCatalog.normalize(type:'name',design:'min-03',name:'Žan Črt Štefan',year:2028,paper:'A5',orientation:'portrait')
r=PrintRequest.create_or_find_by!(fingerprint:PrintCatalog.fingerprint(options)) { |row|row.options=options }
RenderCalendarJob.perform_now(r.id)
raise 'Export not complete' unless r.reload.available?
folder=Rails.root.join('storage/exports',r.fingerprint)
manifest=JSON.parse(folder.join('manifest.json').read)
raise 'Raster dimensions' unless manifest['width_px']==3496&&manifest['height_px']==4961
raise 'Missing files' unless r.files.values.all? { |file|folder.join(file).file? }
puts JSON.generate(production_smoke:'passed',ruby:RUBY_VERSION,rails:Rails.version,adapter:ActiveRecord::Base.connection.adapter_name,export:r.id,pages:manifest['pages']||manifest['page_count'])
