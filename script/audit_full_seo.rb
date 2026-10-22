# Extended SEO inventory of the actual export. No ranking or language-certification claims.
require 'nokogiri'
require 'json'
require 'csv'
require 'uri'
require 'set'
require 'time'
require 'pathname'
root = Pathname.new(File.expand_path('..', __dir__))
site = root.join(ENV.fetch('SEO_SITE', 'site'))
out = root.join(ENV.fetch('SEO_REPORT_DIR', 'reports/seo-2026-10-22/current'))
out.mkpath
origin = 'https://koledar365.si'
clean = ->(s) { s.to_s.gsub(/\s+/, ' ').strip }
rows = []
external = Hash.new { |h,k| h[k] = Set.new }
Dir[site.join('**/*.html')].sort.each do |file|
  rel = Pathname.new(file).relative_path_from(site).to_s
  path = '/' + rel.sub(/index\.html\z/, '')
  doc = Nokogiri::HTML(File.read(file))
  main = doc.at_css('main')
  indexable = !doc.css('meta[name=robots],meta[name=googlebot]').any? { |n| n['content'].to_s.match?(/noindex|none/i) }
  schema = []; issues = []
  doc.css('script[type="application/ld+json"]').each do |s|
    begin
      data = JSON.parse(s.text); schema.concat(data.is_a?(Hash) ? data.fetch('@graph', [data]) : data)
    rescue JSON::ParserError
      issues << {code: 'invalid_json_ld'}
    end
  end
  heading_nodes = (main || doc).css('h1,h2,h3,h4,h5,h6')
  headings = heading_nodes.map { |h| {level:h.name.delete_prefix('h').to_i, text:clean.call(h.text)} }
  images = (main || doc).css('img').map { |im| {src:im['src'], alt:im['alt'], width:im['width'],height:im['height'],loading:im['loading']} }
  links = doc.css('a[href]').map { |a| {href:a['href'],text:clean.call(a['aria-label'] || a.text)} }
  links.each do |a|
    begin
      u=URI.join(origin+path,a[:href]); external[u.to_s.split('#').first] << path if %w[http https].include?(u.scheme) && u.host != 'koledar365.si'
    rescue URI::Error
      issues << {code:'invalid_href',detail:a[:href]}
    end
  end
  if indexable
    issues << {code:'language_region',detail:doc.at_css('html')&.[]('lang')} unless doc.at_css('html')&.[]('lang') == 'sl-SI'
    headings.each_cons(2) { |a,b| issues << {code:'heading_level_skip',detail:b} if b[:level]>a[:level]+1 }
    images.each do |im|
      issues << {code:'missing_alt',detail:im[:src]} if im[:alt].nil?
      issues << {code:'image_dimensions',detail:im[:src]} if im[:src] && (im[:width].to_i<1 || im[:height].to_i<1)
    end
    (main || doc).css('table').each_with_index do |t,i|
      issues << {code:'table_accessible_name',detail:i} unless t.at_css('caption') || t['aria-label'] || t['aria-labelledby']
      issues << {code:'table_header_scope',detail:i} if t.css('th').any? { |th| !th['scope'] && !th['id'] }
    end
    schema.select { |n| n['@id'] }.group_by { |n| n['@id'] }.each { |id,n| issues << {code:'duplicate_schema_id',detail:id} if n.size>1 }
    schema.select { |n| n['@type']=='FAQPage' }.each do |faq|
      Array(faq['mainEntity']).each do |q|
        issues << {code:'faq_not_in_html',detail:q['name']} unless clean.call(main&.text).include?(clean.call(q['name'])) && clean.call(main&.text).include?(clean.call(q.dig('acceptedAnswer','text')))
      end
    end
    preloads=doc.css('link[rel=preload][as=image]').map { |n| n['imagesrcset'] || n['href'] }
    issues << {code:'duplicate_image_preload'} if preloads.uniq.size != preloads.size
  end
  main_copy = main&.dup
  main_copy&.css('script,style,svg,nav')&.remove
  family = path.split('/').reject(&:empty?).first || 'home'
  row = {url:origin+path,path:path,classification:indexable ? 'public_indexable' : (rel.start_with?('free/') ? 'private_render_fragment' : 'intentional_noindex'),family:family,
    indexable:indexable,title:clean.call(doc.at_css('title')&.text),description:doc.at_css('meta[name=description]')&.[]('content'),
    canonical:doc.at_css('link[rel=canonical]')&.[]('href'),h1:headings.select{|h|h[:level]==1}.map{|h|h[:text]},headings:headings,
    language:doc.at_css('html')&.[]('lang'),main_characters:clean.call(main_copy&.text).size,html_bytes:File.size(file),
    images:images,links:links,schemas:schema.map{|n|{type:n['@type'],id:n['@id']}},issues:issues,
    review:'Automated structural inspection; content reviewed by template and exceptions, not native-speaker certification.'}
  rows << row
end
public_rows=rows.select{|r|r[:indexable]}
paths=public_rows.map{|r|r[:path]}.to_set
edges={};inbound=Hash.new{|h,k|h[k]=Set.new}
public_rows.each do |r|
  targets=r[:links].filter_map do |a|
    begin
      u=URI.join(origin+r[:path],a[:href]); u.path if u.host=='koledar365.si' && paths.include?(u.path) && u.path!=r[:path]
    rescue URI::Error; nil; end
  end.uniq
  edges[r[:path]]=targets; targets.each{|p|inbound[p]<<r[:path]}
end
depth={'/'=>0};queue=['/'];until queue.empty?; p=queue.shift; (edges[p]||[]).each{|t|next if depth.key?(t);depth[t]=depth[p]+1;queue<<t};end
rows.each{|r|r[:inbound_pages]=inbound[r[:path]].size;r[:click_depth]=depth[r[:path]]}
summary={checked_at:Time.now.utc.iso8601,html_pages:rows.size,public_pages:public_rows.size,
  issue_counts:public_rows.flat_map{|r|r[:issues]}.map{|x|x[:code]}.tally,
  orphan_pages:public_rows.reject{|r|depth.key?(r[:path])}.map{|r|r[:path]},max_click_depth:depth.values.max,
  external_urls:external.size,scope:'Exported HTML; separate HTTP and rendered-browser reports are required.'}
rows.each { |r| r.delete(:links) }
out.join('full-audit.json').write(JSON.pretty_generate(summary.merge(pages:rows))+"\n")
out.join('external-links.json').write(JSON.pretty_generate(external.map{|url,p|{url:url,pages:p.to_a}})+"\n")
out.join('internal-links.json').write(JSON.pretty_generate({edges:edges,depth:depth,orphan_pages:summary[:orphan_pages]})+"\n")
out.join('live-urls.txt').write(public_rows.map{|r|r[:url]}.join("\n")+"\n")
CSV.open(out.join('metadata.csv'),'w') do |csv|
 keys=%i[url classification family title description canonical h1 language inbound_pages click_depth html_bytes main_characters]
 csv<<keys;rows.each{|r|csv<<keys.map{|k|r[k].is_a?(Array) ? r[k].join(' | ') : r[k]}}
end
puts JSON.pretty_generate(summary)
exit(ENV['SEO_STRICT']=='1' && public_rows.any?{|r|r[:issues].any?} ? 1 : 0)
