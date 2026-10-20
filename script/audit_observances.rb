require 'nokogiri'
require 'digest'

events=CalendarEvent.where(on:Date.new(2027,1,1)..Date.new(2030,12,31)).ordered.to_a.group_by(&:slug)
paths=Page.pluck(:path)
photos=HolidayPhotoCatalog.all
session=ActionDispatch::Integration::Session.new(Rails.application)
session.host! 'localhost'
issues=[];rows=[];without_detail=[]
events.each do |slug,entries|
  path=paths.find { |candidate|candidate.split('/').last==slug }
  unless path
    without_detail<<slug
    next
  end
  photo=photos.find { |candidate|candidate['slug']==slug }
  unless path && photo && photo['reviewed']==true
    issues<<{slug:slug,problem:'missing_page_or_reviewed_photo'}
    next
  end
  %w[author source license license_url alt_sl caption_sl].each { |key|issues<<{slug:slug,problem:"missing_#{key}"} if photo[key].blank? }
  %w[local_path small_path].each do |key|
    file=Rails.root.join('public',photo[key].delete_prefix('/'))
    hashkey=key=='local_path' ? 'sha256' : 'small_sha256'
    issues<<{slug:slug,problem:"invalid_#{key}"} unless file.file? && Digest::SHA256.file(file).hexdigest==photo[hashkey]
  end
  session.get(path)
  doc=Nokogiri::HTML(session.response.body)
  issues<<{slug:slug,problem:'page_status',status:session.response.status} unless session.response.status==200
  issues<<{slug:slug,problem:'missing_photo'} unless doc.at_css('.observance-photo img')&.[]('src')==photo['local_path']
  issues<<{slug:slug,problem:'city_photo_on_detail'} if doc.css('.observance-page img').any? { |image|image['src'].to_s.include?('/cities/') }
  issues<<{slug:slug,problem:'wrong_dates'} unless doc.css('[data-observance-date]').map { |node|node['data-observance-date'] }==entries.map { |event|event.on.iso8601 }
  issues<<{slug:slug,problem:'four_years'} unless doc.css('.observance-year-card').map { |node|node['id'] }==CalendarEngine::YEARS.map { |year|"datum-#{year}" }
  issues<<{slug:slug,problem:'attribution_link'} unless doc.at_css(".observance-photo a[href='/fotografije-in-licence/#praznik-#{slug}']")
  issues<<{slug:slug,problem:'sharing_image'} unless doc.at_css('meta[property="og:image"]')&.[]('content')=="https://koledar365.si#{photo['local_path']}"
  image_schemas=JSON.parse(doc.at_css('script[type="application/ld+json"]').text).fetch('@graph').select { |node|node['@type']=='ImageObject' }
  issues<<{slug:slug,problem:'photo_schema'} unless image_schemas.any? { |node|node['contentUrl']=="https://koledar365.si#{photo['local_path']}" && node['creditText']==photo['author'] && node['license']==photo['license_url'] }
  entries.group_by { |event|event.on.year }.each do |year,year_events|
    session.get("/prazniki/#{year}.ics",params:{all:'1',topic:slug})
    exported=IcsService.import(session.response.body)
    issues<<{slug:slug,year:year,problem:'ics_dates'} unless exported.map { |event|event['date'] }==year_events.map { |event|event.on.iso8601 }
    issues<<{slug:slug,year:year,problem:'ics_titles'} unless exported.map { |event|event['title'] }==year_events.map(&:title)
  end
  rows<<{slug:slug,path:path,photo:photo['local_path'],credit:photo['author'],license:photo['license'],dates:entries.map { |event|event.on.iso8601 }}
end
session.get('/fotografije-in-licence/')
license_doc=Nokogiri::HTML(session.response.body)
issues<<{problem:'license_page_status'} unless session.response.status==200
photos.each do |photo|
  card=license_doc.at_css("#praznik-#{photo['slug']}")
  issues<<{slug:photo['slug'],problem:'missing_license_card'} unless card && card.css('a').any? { |a|a['href']==photo['source'] } && card.text.include?(photo['author'])
end
result={checked_at:Time.current.iso8601,scope:'All existing holiday and observance detail pages; dates and topic-specific ICS for 2027–2030',passed:issues.empty?,calendar_topics:events.size,detail_pages:rows.size,photos:photos.size,calendar_topics_without_dedicated_detail_page:without_detail,ics_exports_checked:rows.size*4,issues:issues,rows:rows}
Rails.root.join('evidence/observance-audit.json').write(JSON.pretty_generate(result))
puts JSON.pretty_generate(result.except(:rows))
exit(issues.any? ? 1 : 0)
