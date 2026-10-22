require 'nokogiri'
require 'json'
sun_city_paths=SunEngine::CITIES.keys.map { |city_id| "/soncni-vzhod-in-zahod/#{city_id}/" }
removed_name_path=PagesController::REMOVED_NAME_PATHS
active_page_paths=Page.order(:path).pluck(:path).reject { |path| path.match?(removed_name_path) }
paths=(active_page_paths+sun_city_paths+['/fotografije-in-licence/']).uniq
known=Set.new(active_page_paths+sun_city_paths+['/','/isci/','/fotografije-in-licence/'])
session=ActionDispatch::Integration::Session.new(Rails.application)
session.host! 'localhost'
rows=[];issues=[];links=Set.new
paths.each do |path|
 session.get(path)
 doc=Nokogiri::HTML(session.response.body)
 title=doc.at_css('title')&.text.to_s
 description=doc.at_css('meta[name=description]')&.[]('content').to_s
 schemas=doc.css('script[type="application/ld+json"]').map { |el| JSON.parse(el.text) }
 row={path:path,status:session.response.status,title:title,description:description,h1:doc.css('h1').map(&:text),canonical:doc.css('link[rel=canonical]').map { |n|n['href'] },robots:doc.at_css('meta[name=robots]')&.[]('content'),schema_types:schemas.flat_map { |s|s.fetch('@graph',[]).map { |n|n['@type'] } }}
 rows<<row
 issues<<{path:path,problem:'status'} unless row[:status]==200
 issues<<{path:path,problem:'h1_count'} unless row[:h1].size==1
 issues<<{path:path,problem:'canonical'} unless row[:canonical]==["https://koledar365.si#{path}"]
 issues<<{path:path,problem:'empty_metadata'} if title.blank? || description.blank?
 issues<<{path:path,problem:'fallback_description'} if description.include?('podatki, navodila in povezave za načrtovanje v Sloveniji')
 issues<<{path:path,problem:'template_variable'} if description.match?(/%\{|\{\{/)
 doc.css('a[href]').each do |a|
  href=a['href'];next unless href.start_with?('/')&&!href.start_with?('//')
  clean=href.split(/[?#]/).first;links<<clean unless clean.blank? || clean.start_with?('/predogled/','/izvozi/','/images/')
 end
end
[:title,:description].each do |key|
 rows.group_by { |r|r[key] }.select { |_,v|v.size>1 }.each { |text,items|issues<<{problem:"duplicate_#{key}",paths:items.map { |r|r[:path] },text:text} }
end
unknown=links.reject do |path|
 known.include?(path) || path.match?(%r{\A/prazniki/20(?:27|28|29|30)\.ics\z}) ||
  (path.match?(%r{\A/(?:premik-ure|astronomy|payments|garden|education)/[^.].*\.(?:ics|webp|svg|json)\z}) && Rails.root.join('public',path.delete_prefix('/')).file?) ||
  (path.start_with?('/prenosi/') && PublicCalendarGallery.public_file(path)) ||
  (path.start_with?('/koledarji/2027-2030/') && PublicCalendarGallery.public_file(path)) ||
  (path.match?(%r{\A/(?:prenosi|slike)/lunin-koledar/}) && Rails.root.join('public',path.delete_prefix('/')).file?)
end
issues<<{problem:'unresolved_internal_links',paths:unknown.to_a} if unknown.any?
result={checked_at:Time.current.iso8601,kind:'local render audit; not a Google ranking or indexing certification',tested:rows.size,passed:issues.empty?,issues:issues,rows:rows}
Rails.root.join('evidence/seo-audit.json').write(JSON.pretty_generate(result))
puts JSON.pretty_generate(result.except(:rows))
exit(issues.any? ? 1 : 0)
