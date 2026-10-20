require_relative '../config/environment'
# Prefill independent annual Moon exports; the main resumable catalogue owns its report.
years=ENV.fetch('WARM_YEARS','2027,2028,2029,2030').split(',').map { |year|Integer(year) };raise 'Invalid warm year.' unless years.all? { |year|(2027..2030).cover?(year) }
years.reverse! unless ENV['WARM_FORWARD']=='1';designs=ENV['WARM_FORWARD']=='1' ? PrintCatalog.designs : PrintCatalog.designs.reverse
entries=years.flat_map { |year|designs.map { |design|{type:'lunar',lunar_scope:'year',year:year,design:design['id'],date:"#{year}-01-01"} } }
index=Integer(ENV.fetch('WARM_SHARD','0'));shards=Integer(ENV.fetch('WARM_SHARDS','2'))
entries.each_with_index do |raw,i|
 next unless i%shards==index
 options=PrintCatalog.normalize(raw);fingerprint=PrintCatalog.fingerprint(options)
 request=PrintRequest.create_or_find_by!(fingerprint:fingerprint) { |record|record.options=options }
 FileUtils.mkdir_p(Rails.root.join('tmp/catalog-locks'))
 File.open(Rails.root.join('tmp/catalog-locks',fingerprint),'w') do |lock|
  next if ENV['WARM_SKIP_BUSY']=='1'&&!lock.flock(File::LOCK_EX|File::LOCK_NB)
  lock.flock(File::LOCK_EX) unless ENV['WARM_SKIP_BUSY']=='1'
  RenderCalendarJob.new.perform(request.id) unless request.reload.available?
 end
 next if ENV['WARM_SKIP_BUSY']=='1'&&!request.reload.available?
 raise 'Annual Moon export incomplete.' unless request.reload.available?
 puts "#{index}: #{raw[:year]} #{raw[:design]} complete";STDOUT.flush
end
