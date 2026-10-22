# A concrete URL inventory for the final operator; no requests to the live site.
require 'json'
require 'nokogiri'
require 'pathname'
require 'uri'
require 'time'
root=Pathname.new(File.expand_path('..',__dir__))
site=root.join('site')
urls=Dir[site.join('sitemap-*.xml')].flat_map do |file|
  Nokogiri::XML(File.read(file)).remove_namespaces!.css('url > loc').map(&:text)
end.uniq.sort
raise 'Public sitemap URL inventory is empty' if urls.empty?
rows=urls.map do |url|
  path=URI(url).path
  doc=Nokogiri::HTML(site.join(path.delete_prefix('/'),'index.html').read)
  raise "Inventory includes noindex page #{path}" if doc.at_css('meta[name=robots]')&.[]('content').to_s.include?('noindex')
  {url:url,path:path,title:doc.at_css('title').text,description:doc.at_css('meta[name=description]')['content'],
   h1:doc.css('main h1').map{|node|node.text.strip},image:doc.at_css('meta[property="og:image"]')&.[]('content')}
end
expanded=rows.select{|row|row[:path].match?(%r{\A/(?:setveni-koledar|izplacila-pokojnin|izplacila-socialnih-transferjev|solski-koledar|studijski-koledar|solski-urnik|matura|npz|soncni-mrk|lunin-mrk|perzeidi|polna-luna|mlaj|lunine-mene|mesecni-koledar|tedenski-koledar|delovni-dnevi|viri-in-metodologija)/})}
record={version:1,generated_at:Time.now.utc.iso8601,source_commit:ENV['GITHUB_SHA']||IO.popen(['git','rev-parse','HEAD'],&:read).strip,
  scope:'Every indexable canonical URL in the prepared publication; live verification happens after Cloudflare deployment.',
  count:rows.size,expanded_count:expanded.size,expanded_urls:expanded.map{|row|row[:url]},pages:rows}
site.join('release-urls.json').write(JSON.pretty_generate(record)+"\n")
root.join('docs/advanced-calendar-live-urls.txt').write(urls.join("\n")+"\n")
puts({url_inventory:rows.size,expanded_urls:expanded.size}.to_json)
