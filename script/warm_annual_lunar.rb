require_relative '../config/environment'
# Prefill independent annual Moon exports; the main resumable catalogue owns its report.
entries=(2027..2030).to_a.reverse.flat_map { |year|PrintCatalog.designs.reverse.map { |design|{type:'lunar',lunar_scope:'year',year:year,design:design['id'],date:"#{year}-01-01"} } }
index=Integer(ENV.fetch('WARM_SHARD','0'));shards=Integer(ENV.fetch('WARM_SHARDS','2'))
entries.each_with_index do |raw,i|
 next unless i%shards==index
 options=PrintCatalog.normalize(raw);fingerprint=PrintCatalog.fingerprint(options)
 request=PrintRequest.create_or_find_by!(fingerprint:fingerprint) { |record|record.options=options }
 FileUtils.mkdir_p(Rails.root.join('tmp/catalog-locks'))
 File.open(Rails.root.join('tmp/catalog-locks',fingerprint),'w') do |lock|
  lock.flock(File::LOCK_EX)
  RenderCalendarJob.new.perform(request.id) unless request.reload.available?
 end
 raise 'Annual Moon export incomplete.' unless request.reload.available?
 puts "#{index}: #{raw[:year]} #{raw[:design]} complete";STDOUT.flush
end
