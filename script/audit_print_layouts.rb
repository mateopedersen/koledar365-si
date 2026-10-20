require 'tmpdir'
rows=[]
Dir.mktmpdir('layout-audit') do |dir|
  %w[A3 A4 A5].product(%w[portrait landscape],PrintCatalog::TYPES.keys,PrintCatalog.designs.map { |d|d['id'] }).each do |paper,orientation,type,design|
    o=PrintCatalog.normalize(paper:paper,orientation:orientation,type:type,design:design,year:2028,month:2,date:'2028-02-29')
    begin
      r=PdfRenderer.new(o);result=r.render(File.join(dir,'render.pdf'))
      expected=case type
      when 'annual','name','birthday' then (Date.new(2028,1,1)..Date.new(2028,12,31)).map(&:iso8601)
      when 'monthly','lunar' then (Date.new(2028,2,1)..Date.new(2028,2,29)).map(&:iso8601)
      when 'weekly','school','family','shift' then (Date.new(2028,2,28)..Date.new(2028,3,5)).map(&:iso8601)
      when 'daily' then ['2028-02-29']
      when 'blank' then []
      when 'holidays' then HolidayYear.new(2028).events.map { |e|e.on.iso8601 }
      end
      raise 'Manjkajoči ali podvojeni datumi.' unless result[:primary_dates].sort==expected.sort
      raise 'Premajhne številke.' if result[:minimum_date_size_pt] && result[:minimum_date_size_pt]<8.5
      rows << {paper:paper,orientation:orientation,type:type,design:design,pages:result[:pages],issues:[]}
    rescue => e
      rows << {paper:paper,orientation:orientation,type:type,design:design,error:e.message,issues:[]}
    end
  end
end
report={version:PrintCatalog::VERSION,checked_at:Time.current.iso8601,total:rows.size,failures:rows.select { |r|r[:error]||r[:issues].any? }}
Rails.root.join('evidence/print-layout-audit.json').write(JSON.pretty_generate(report))
puts JSON.pretty_generate(report.except(:failures).merge(failed:report[:failures].size,examples:report[:failures].first(12)))
