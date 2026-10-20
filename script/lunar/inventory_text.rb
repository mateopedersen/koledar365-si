require_relative '../../config/environment'
require 'nokogiri'
require 'digest'
s=ActionDispatch::Integration::Session.new(Rails.application);s.host!('localhost');items=[]
paths=LunarCalendar.read('sayfa-plani.json')['pages'].map { |p|p['proposedPath'] }+['/viri-in-metodologija/']
paths.each do |path|
 s.get(path);raise path unless s.response.status==200;doc=Nokogiri::HTML(s.response.body)
 doc.css('title,h1,meta[name=description],meta[property^="og:"],meta[name^="twitter:"],.breadcrumbs,[data-lunar],main .prose').each_with_index do |node,i|
  next if node.name=='meta' && !node['content'].to_s.match?(/[[:alpha:]]/)
  value=node['content'] || node.text.gsub(/\s+/,' ').strip
  items<<{id:"#{path}text-#{i}",context:node.name,text:value,sha256:Digest::SHA256.hexdigest(value)}
 end
 doc.css('[data-lunar] [aria-label],[data-lunar] img[alt],[data-lunar] abbr[title]').each_with_index do |node,i|
  value=node['aria-label']||node['alt']||node['title'];next if value.blank?
  items<<{id:"#{path}accessible-#{i}",context:node.name,text:value,sha256:Digest::SHA256.hexdigest(value)}
 end
end
LunarCalendar.days.each do |d|
 text="#{LunarCalendar.date_label(d['date'])}, osvetljenost #{LunarCalendar.percent(d)}, #{d['phaseNameSl']}"
 items<<{id:"day-#{d['date']}",context:'dynamic day accessible name',text:text,sha256:Digest::SHA256.hexdigest(text)}
end
Rails.root.join('evidence/lunar/text-inventory.json').write(JSON.pretty_generate({items:items}))
puts({pages:paths.size,items:items.size}.to_json)
