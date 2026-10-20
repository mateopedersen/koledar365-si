require_relative '../config/environment'
root=Rails.root.join('storage/release-catalog');FileUtils.mkdir_p(root)
entries=[]
(2027..2030).each do |year|
 PrintCatalog.designs.each do |design|
  entries << {type:'lunar',lunar_scope:'year',year:year,design:design['id']}
  entries << {type:'workdays',workday_scope:'year',year:year,design:design['id']}
  (1..12).each { |month|entries << {type:'workdays',workday_scope:'month',year:year,month:month,design:design['id']} }
 end
end
index=Integer(ENV.fetch('CATALOG_SHARD','0'));shards=Integer(ENV.fetch('CATALOG_SHARDS','1'))
rows=[];entries=entries.each_with_index.filter_map { |item,i|item if i%shards==index };report=Rails.root.join("evidence/release-extra-catalog-#{index}.json")
entries.each_with_index do |raw,i|
 options=PrintCatalog.normalize(raw.merge(date:'%04d-%02d-01' % [raw[:year],raw.fetch(:month,1)]));fingerprint=PrintCatalog.fingerprint(options)
 begin
  request=PrintRequest.create_or_find_by!(fingerprint:fingerprint) { |record|record.options=options }
  RenderCalendarJob.new.perform(request.id) unless request.reload.available?
  raise 'Pair incomplete' unless request.reload.available?
  source=Rails.root.join('storage/exports',fingerprint);target=root.join(fingerprint);FileUtils.mkdir_p(target)
  manifest=JSON.parse(source.join('manifest.json').read)
  [*request.files.values,*manifest['pages'].map { |p|p['filename'] },'README.txt'].uniq.each { |file|FileUtils.cp(source.join(file),target.join(file)) unless target.join(file).file? }
  rows << {options:options,fingerprint:fingerprint,files:request.files,page_count:manifest['page_count'],status:'passed'}
 rescue => error
  rows << {options:options,fingerprint:fingerprint,status:'failed',error:error.message}
 end
 report.write(JSON.pretty_generate({template_version:PrintCatalog::VERSION,shard:index,shards:shards,expected:entries.size,completed:rows.size,results:rows}))
 puts "#{index}: #{i+1}/#{entries.size} #{raw.values.join(' ')} #{rows.last[:status]}";STDOUT.flush
end
exit(rows.all? { |row|row[:status]=='passed' } ? 0:1)
