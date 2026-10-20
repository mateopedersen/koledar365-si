FileUtils.mkdir_p(Rails.root.join('evidence/generated'))
records=[]
PrintCatalog.designs.each do |design|
  options=PrintCatalog.normalize(type:'name',name:'Žan Črt Špela',year:2029,design:design['id'])
  request=PrintRequest.create_or_find_by!(fingerprint:PrintCatalog.fingerprint(options)) { |r| r.options=options }
  started=Process.clock_gettime(Process::CLOCK_MONOTONIC)
  RenderCalendarJob.perform_now(request.id) unless request.available?
  seconds=Process.clock_gettime(Process::CLOCK_MONOTONIC)-started
  request.reload
  raise "Export failed #{design['id']} #{request.status}" unless request.available?
  source=Rails.root.join('storage/exports',request.fingerprint)
  manifest=JSON.parse(source.join('manifest.json').read)
  expected=(Date.new(2029,1,1)..Date.new(2029,12,31)).map(&:iso8601)
  raise "Dates missing #{design['id']}" unless manifest['primary_dates'].sort==expected
  request.files.each do |kind,file|
    next if kind=='manifest'
    FileUtils.cp(source.join(file),Rails.root.join('evidence/generated',"#{design['id']}-#{kind}#{File.extname(file)}"))
  end
  records << {id:design['id'],request_id:request.id,seconds:seconds.round(2),manifest:manifest.except('primary_dates'),files:request.files}
  puts "#{design['id']}: #{manifest['pages']} pages, #{seconds.round(2)}s"
  STDOUT.flush
end
Rails.root.join('evidence/print-renders.json').write(JSON.pretty_generate(records))
# Every supported product goes through every layout, including 2028 leap day.
products=[]
PrintCatalog::TYPES.keys.each do |type|
  PrintCatalog.designs.each do |design|
    o=PrintCatalog.normalize(type:type,year:2028,month:2,date:'2028-02-29',design:design['id'],name:'Črt Špela Žan')
    path=Rails.root.join('tmp',"matrix-#{type}-#{design['id']}.pdf")
    result=PdfRenderer.new(o).render(path.to_s)
    if %w[annual name].include?(type)
      raise 'Annual completeness failed' unless result[:primary_dates].sort==(Date.new(2028,1,1)..Date.new(2028,12,31)).map(&:iso8601)
    elsif %w[monthly lunar].include?(type)
      raise 'Monthly completeness failed' unless result[:primary_dates].sort==(Date.new(2028,2,1)..Date.new(2028,2,29)).map(&:iso8601)
    end
    products << {type:type,design:design['id'],pages:result[:pages],bytes:path.size}
  end
end
Rails.root.join('evidence/print-matrix.json').write(JSON.pretty_generate(products))
puts "Product matrix: #{products.size} rendered PDFs"
