require_relative '../config/environment'
require 'json'
# Resume by the content fingerprint. Never replace an existing completed pair.
root=Rails.root.join('storage/release-catalog');FileUtils.mkdir_p(root)
entries=[]
(2027..2030).each do |year|
  PrintCatalog.designs.each do |design|
    entries << {type:'annual',year:year,design:design['id']}
    (1..12).each { |month| entries << {type:'monthly',year:year,month:month,design:design['id']} }
  end
end
%w[weekly lunar blank shift daily family school birthday holidays].each do |type|
  (2027..2030).each do |year|
    PrintCatalog.designs.each { |design|entries << {type:type,year:year,design:design['id']} }
  end
end
# The complete dated monthly lunar catalogue is part of the public release too.
(2027..2030).each do |year|
  (2..12).each do |month|
    PrintCatalog.designs.each { |design|entries << {type:'lunar',year:year,month:month,design:design['id']} }
  end
end
index=Integer(ENV.fetch('CATALOG_SHARD','0'));shards=Integer(ENV.fetch('CATALOG_SHARDS','1'))
entries=entries.each_with_index.select { |_,i|i%shards==index }.map(&:first)
report_path=Rails.root.join("evidence/release-catalog-#{index}.json")
rows=[]
entries.each_with_index do |raw,i|
  options=PrintCatalog.normalize(raw.merge(date:'%04d-%02d-01' % [raw[:year],raw.fetch(:month,1)]))
  fingerprint=PrintCatalog.fingerprint(options)
  begin
    # Atomic lock also prevents duplicate work with an application export job.
    request=PrintRequest.create_or_find_by!(fingerprint:fingerprint) { |r|r.options=options }
    folder=Rails.root.join('storage/exports',fingerprint)
    FileUtils.mkdir_p(Rails.root.join('tmp/catalog-locks'))
    File.open(Rails.root.join('tmp/catalog-locks',fingerprint),'w') do |lock|
      lock.flock(File::LOCK_EX)
      RenderCalendarJob.new.perform(request.id) unless request.reload.available?
    end
    raise 'Pair is incomplete' unless request.reload.available?
    manifest=JSON.parse(folder.join(request.files.fetch('manifest')).read)
    raise 'Wrong period' unless manifest.dig('identity_fields','period')==PrintCatalog.identity(options)['period']
    target=root.join(fingerprint);FileUtils.mkdir_p(target)
    [*request.files.values,*manifest.fetch('pages').map { |p|p.fetch('filename') },'README.txt'].uniq.each do |file|
      FileUtils.cp(folder.join(file),target.join(file)) unless target.join(file).file? && Digest::SHA256.file(target.join(file)).hexdigest==Digest::SHA256.file(folder.join(file)).hexdigest
    end
    rows << {options:options,fingerprint:fingerprint,files:request.files,page_count:manifest['page_count'],status:'passed'}
  rescue => error
    rows << {options:options,fingerprint:fingerprint,status:'failed',error:error.message}
  end
  temporary=Pathname.new(report_path.to_s+'.tmp')
  temporary.write(JSON.pretty_generate({template_version:PrintCatalog::VERSION,shard:index,shards:shards,expected:entries.size,completed:rows.size,results:rows}));File.rename(temporary,report_path)
  puts "#{index}: #{i+1}/#{entries.size} #{raw.values.join(' ')} #{rows.last[:status]}";STDOUT.flush
end
exit(rows.any? { |row|row[:status]!='passed' } ? 1:0)
