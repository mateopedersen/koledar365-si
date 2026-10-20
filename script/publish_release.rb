# Only verified pages are released. Source-gated and manually held pages stay held.
raise 'Manjka tiskovna kakovostna zapora.' unless JSON.parse(Rails.root.join('evidence/print-gate.json').read).values_at('version','passed')==[PrintCatalog::VERSION,true]
Page.where(status:'draft').find_each do |page|
  next if page.metadata['content_gate'].present?
  page.update!(status:'published')
end
stages=[200,1000,8561].map do |limit|
  {limit:limit,result:NamePublisher.run!(limit),published_total:PersonName.published.count}
end
report={checked_at:Time.current.iso8601,version:PrintCatalog::VERSION,page_statuses:Page.group(:status).count,name_statuses:PersonName.group(:status).count,stages:stages,held_pages:Page.where(status:'held').pluck(:path)}
Rails.root.join('evidence/publication.json').write(JSON.pretty_generate(report));puts report.to_json
