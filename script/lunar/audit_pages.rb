require_relative '../../config/environment'
require 'nokogiri'
LunarCalendar.validate!
s=ActionDispatch::Integration::Session.new(Rails.application);s.host!('localhost');checks=[]
LunarCalendar.read('sayfa-plani.json')['pages'].each do |p|
 path=p['proposedPath'];s.get(path);raise "HTTP #{path}" unless s.response.status==200
 doc=Nokogiri::HTML(s.response.body);raise "Metadata #{path}" unless doc.css('h1').size==1 && doc.css('title').size==1 && doc.css('meta[name=description]').size==1 && doc.css('link[rel=canonical]').size==1
 raise "Canonical #{path}" unless doc.at_css('link[rel=canonical]')['href']=='https://koledar365.si'+path
 record=Page.find_by!(path:path)
 if record.month
  days=LunarCalendar.period(record.year,record.month)
  raise "Missing days #{path}" unless doc.css('.lunar-day').map { |n|n['data-date'] }==days.map { |d|d['date'] }
  raise "Missing phases #{path}" unless doc.css('tr[data-phase]').size==LunarCalendar.phases(record.year,record.month).size
  days.each do |d|
   b=doc.at_css("[data-date='#{d['date']}']");raise 'Accessibility date missing' unless b['aria-label'].include?(LunarCalendar.date_label(d['date']))&&b['aria-label'].include?(LunarCalendar.percent(d))
  end
 end
 raise "Image alt #{path}" unless doc.css('img').all? { |n|n.key?('alt') }
 if ENV['REQUIRE_LUNAR_DOWNLOADS']=='1' && record.year
  raise "Four downloads #{path}" unless doc.css('.lunar-download-grid article').size==4
  doc.css('.lunar-download-actions a').each { |a|raise "Missing file #{a['href']}" unless Rails.root.join('public',a['href'].delete_prefix('/')).file? }
 end
 checks<<{path:path,status:200,days:doc.css('.lunar-day').size,phases:doc.css('tr[data-phase]').size,downloads:doc.css('.lunar-download-actions a').size}
end
%w[/lunin-koledar/2026/marec/ /lunin-koledar/2031/ /lunin-koledar/2027/neveljaven/].each { |path|s.get(path);raise "Expected 404 #{path}" unless s.response.status==404 }
s.get('/lunin-koledar/2027');raise 'Missing trailing slash redirect' unless s.response.status==301
Rails.root.join('evidence/lunar/pages-audit.json').write(JSON.pretty_generate({status:'passed',pages:checks,source_html_without_javascript:true,invalid_routes:3}))
puts({status:'passed',pages:checks.size,invalid_routes:3}.to_json)
