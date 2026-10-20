# Verify the complete exported site, including lazy-loaded calendar/name fragments.
require 'nokogiri'
require 'json'
require 'set'
require 'digest'
root=File.expand_path('..',__dir__)
site=File.join(root,'site')
sprite='/visuals/ui-material-v3.svg'
xml=Nokogiri::XML(File.read(File.join(site,sprite))) { |c|c.strict }
ids=xml.xpath('//*[@id]').map { |n|n['id'] }
raise 'Duplicate SVG IDs' unless ids.uniq==ids
symbols=xml.xpath('//*[local-name()="symbol"]').map { |n|n['id'] }.to_set
raise 'Incomplete vector collection' unless symbols.size>=38
raise 'Executable SVG content' unless xml.xpath('//*[local-name()="script" or local-name()="foreignObject"]').empty?
xml.xpath('//*[@fill or @stroke]').each do |n|
  [n['fill'],n['stroke']].compact.each { |v| v.scan(/url\(#([^)]+)\)/).flatten.each { |id| raise "Missing material: #{id}" unless ids.include?(id) } }
end
files=Dir[File.join(site,'**/*.html')]
counts=Hash.new(0); failures=[];stylesheet_cache={}
files.each do |file|
 html=File.read(file)
 next unless html.include?('class="topbar"')
 counts[:pages]+=1
 doc=Nokogiri::HTML(html)
 fail_page=lambda { |reason|failures<<{path:file.delete_prefix(site),reason:reason} }
 %w[header footer].each do |tag|
  n=doc.at_css("#{tag} .brand-mark")
  fail_page.call("Missing #{tag} logo") unless n && n['src']=='/visuals/brand-calendar-v3.svg' && n['width'] && n['height']
 end
 fail_page.call('Missing fabric flag') unless doc.at_css('.country img.country-flag[src="/visuals/slovenia-fabric-v3.svg"]')
 fail_page.call('Legacy emoji flag') if doc.at_css('.country')&.text.to_s.include?('🇸🇮')
 styles=doc.css('style').map(&:text)+doc.css('link[rel=stylesheet]').filter_map do |node|
  href=node['href'].split('?',2).first;file=File.join(site,href)
  next unless href.start_with?('/') && File.file?(file)
  stylesheet_cache[href] ||= File.read(file)
 end
 fail_page.call('Missing optical stylesheet') unless styles.any? { |css|css.include?('.brand-mark{') && css.include?('.country-flag{') }
 doc.css('svg.ui-icon').each do |n|
  use=n.at_css('use');ref=use&.[]('href').to_s
  fail_page.call("Broken icon #{ref}") unless ref.start_with?(sprite+'#') && symbols.include?(ref.split('#',2).last)
  fail_page.call('Decorative icon exposed to assistive technology') unless n['aria-hidden']=='true'
  counts[:icon_instances]+=1
 end
 doc.css('use[href*="/visuals/"]').each do |n|
  ref=n['href'];fail_page.call("Unknown SVG symbol #{ref}") unless symbols.include?(ref.split('#',2).last)
 end
 counts[:home_fragments]+=1 if file.include?('/free/views/')
 counts[:name_fragments]+=1 if file.include?('/free/names/')
end
raise 'Site export is incomplete' unless counts[:pages]>8900
report={passed:failures.empty?,symbols:symbols.size,checked:counts,assets:Dir[File.join(site,'visuals/*.svg')].to_h { |p|[File.basename(p),{bytes:File.size(p),sha256:Digest::SHA256.file(p).hexdigest}] },failures:failures}
File.write(File.join(root,'evidence/vector-identity-audit.json'),JSON.pretty_generate(report))
puts JSON.generate(report.reject { |k,_|k==:assets })
abort 'Vector identity audit failed' unless failures.empty?
