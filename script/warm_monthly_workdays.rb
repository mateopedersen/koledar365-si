require_relative '../config/environment'
# Prefill the still-running even catalogue shard without rewriting its checkpoint.
entries=(2028..2030).to_a.reverse.flat_map do |year|
 PrintCatalog.designs.reverse.flat_map do |design|
  [11,9,7,5,3,1].map { |month|{type:'workdays',workday_scope:'month',year:year,month:month,design:design['id'],date:'%04d-%02d-01' % [year,month]} }
 end
end
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
 raise 'Monthly workday export incomplete.' unless request.reload.available?
 puts "#{index}: #{raw[:year]}-#{raw[:month]} #{raw[:design]} complete";STDOUT.flush
end
