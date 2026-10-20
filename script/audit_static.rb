require 'time'
require 'nokogiri';require 'json';require 'pathname';require 'uri';require 'set'
root=Pathname.new(File.expand_path('..',__dir__));site=root.join('site');issues=[];targets=Set.new;html_count=0;indexable=0
Dir[site.join('**/*.html')].sort.each do |file|
 relative=Pathname.new(file).relative_path_from(site).to_s;next if relative.start_with?('free/')
 doc=Nokogiri::HTML(File.read(file));html_count+=1
 fail_with=->(message){issues << {path:relative,issue:message}}
 fail_with.call('Missing Slovene language') unless doc.at_css('html')['lang']=='sl'
 fail_with.call('Expected one main heading') unless doc.css('main h1').size==1
 fail_with.call('Missing title or description') unless doc.at_css('title')&.text.to_s.length>0 && doc.at_css('meta[name=description]')&.[]('content').to_s.length>0
 robots=doc.at_css('meta[name=robots]')&.[]('content').to_s
 unless robots.include?('noindex')
  indexable+=1;canonical=doc.at_css('link[rel=canonical]')&.[]('href').to_s
  fail_with.call('Canonical must use the production origin') unless canonical.start_with?('https://koledar365.si/')
 end
 fail_with.call('Server-only form or CSRF material leaked into static output') if doc.at_css('meta[name=csrf-token],input[name=authenticity_token]')
 doc.css('script[src],link[rel=stylesheet],img[src],a[href]').each do |node|
  raw=node['href']||node['src'];next if raw.nil?||raw.empty?||raw.start_with?('#','mailto:','tel:','data:','blob:')
  begin
   base='https://koledar365.si/'+relative.sub(%r{index\.html\z},'');uri=URI.join(base,raw)
   next unless uri.host=='koledar365.si'
   path=URI::DEFAULT_PARSER.unescape(uri.path);targets << path
  rescue URI::Error
   fail_with.call('Invalid URL: '+raw)
  end
 end
end
# These routes execute locally in the browser; weather is the sole read-only Function.
allowed_runtime=%w[/izracun/ /ics/izvoz/ /ics/uvoz/ /planer/ics/ /fotografija/]
targets.sort.each do |path|
 next if path.start_with?('/vreme/')||allowed_runtime.include?(path)
 target=site.join(path.delete_prefix('/'));target=target.join('index.html') if path.end_with?('/')
 issues << {path:path,issue:'Missing internal link or asset'} unless target.file?
end
sitemap_paths=Dir[site.join('sitemap-*.xml')].flat_map { |file|Nokogiri::XML(File.read(file)).remove_namespaces!.css('url loc').map(&:text) }
sitemap_paths.each do |url|
 path=URI(url).path;file=site.join(path.delete_prefix('/'),'index.html')
 if !file.file?||Nokogiri::HTML(file.read).at_css('meta[name=robots]')&.[]('content').to_s.include?('noindex')
  issues << {path:path,issue:'Sitemap contains absent or noindex page'}
 end
end
record={checked_at:Time.now.utc.iso8601,html:html_count,indexable:indexable,internal_targets:targets.size,sitemap_urls:sitemap_paths.size,passed:issues.empty?,issues:issues}
root.join('evidence/static-audit.json').write(JSON.pretty_generate(record));puts record.except(:issues).to_json;puts issues.first(30).to_json unless issues.empty?;exit(issues.empty? ? 0:1)
