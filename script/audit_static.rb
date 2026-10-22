require 'time'
require 'nokogiri';require 'json';require 'pathname';require 'uri';require 'set'
root=Pathname.new(File.expand_path('..',__dir__));site=root.join('site');issues=[];targets=Set.new;html_count=0;indexable=0
catalog=JSON.parse(site.join('free/catalog.json').read);stylesheet_cache={}
months=%w[januar februar marec april maj junij julij avgust september oktober november december]
calendar_galleries=0;gallery_pages=0;gallery_families=Hash.new(0)
Dir[site.join('**/*.html')].sort.each do |file|
 relative=Pathname.new(file).relative_path_from(site).to_s;next if relative.start_with?('free/')
 doc=Nokogiri::HTML(File.read(file));html_count+=1
 fail_with=->(message){issues << {path:relative,issue:message}}
 fail_with.call('Missing Slovene language') unless doc.at_css('html')['lang']=='sl'
 fail_with.call('Expected one main heading') unless doc.css('main h1').size==1
 fail_with.call('Missing title or description') unless doc.at_css('title')&.text.to_s.length>0 && doc.at_css('meta[name=description]')&.[]('content').to_s.length>0
 preview_images=doc.css('img[src^="/prenosi/"][src*="/predogled.webp"],img[src^="/predogled/"],img[data-static-preview^="/free/samples/"],img[data-preview-design]')
 fail_with.call('Calendar design previews must declare the optimized 212 × 300 dimensions') unless preview_images.all? { |node|node['width']=='212'&&node['height']=='300' }
 collection_previews=doc.css('img[src^="/koledarji/2027-2030/preview/"]')
 fail_with.call('Collection thumbnails must declare their full-page 300 px dimensions') unless collection_previews.all? { |node|node['width'].to_i<=300&&node['height'].to_i<=300&&node['width'].to_i.positive?&&node['height'].to_i.positive? }
 fail_with.call('Optimized preview URLs must bypass old immutable CDN cache entries') unless preview_images.all? do |node|
  [node['src'],node['data-static-preview']].compact.any? do |url|
   if url.start_with?('/prenosi/')
    url.include?('/predogled.webp')&&url.include?('k365-preview=212x300-webp-v1')
   else
    url.include?('k365-preview=212x300-v1')
   end
  end
 end
 photo_links=doc.css('a.sp-building-photo')
 fail_with.call('Building photo accessible names must retain their visible captions') unless photo_links.all? do |node|
  visible=node.at_css('span')&.text.to_s.gsub(/\s+/,' ').strip.downcase
  label=node['aria-label'].to_s.gsub(/\s+/,' ').strip.downcase
  visible.empty?||label.empty?||label.include?(visible)
 end
 robots=doc.at_css('meta[name=robots]')&.[]('content').to_s
 unless robots.include?('noindex')
  indexable+=1;canonical=doc.at_css('link[rel=canonical]')&.[]('href').to_s
  fail_with.call('Canonical must use the production origin') unless canonical.start_with?('https://koledar365.si/')
 end
 fail_with.call('Server-only form or CSRF material leaked into static output') if doc.at_css('meta[name=csrf-token],input[name=authenticity_token]')
 if relative=='ustvari-koledar/index.html'
  fail_with.call('Calendar Studio editor is missing') unless doc.at_css('#calendar-studio #studio-paper') && doc.css('[data-panel]').size==6
  fail_with.call('Calendar Studio module was removed during export') unless doc.at_css('script[type=module][src^="/studio/studio.mjs"]')
  fail_with.call('Legacy planner gallery replaced the editor') if doc.at_css('#planner-options,.design-section')
  fail_with.call('Calendar Studio engine is missing') unless site.join('studio/engine.mjs').file?
 end
 if (gallery=doc.at_css('[data-calendar-gallery],.design-section')) && !relative.start_with?('lunin-koledar/2026/')
  gallery_pages+=1;family=gallery['data-gallery-type'] || JSON.parse(gallery['data-export-options']).fetch('type');gallery_families[family]+=1
  if relative=='delovni-dnevi/index.html'
   dashboard=doc.at_css('body.gallery-page .workdays-dashboard[data-workdays-dashboard][data-year="2027"]')
   fail_with.call('Workdays landing page must keep its interactive annual dashboard') unless dashboard && doc.css('[data-workdays-card]').size==12
   fail_with.call('Workdays dashboard must expose weekday, hours and holiday controls') unless doc.at_css('[data-workdays-controls] input[type=number][data-workdays-hours]') && doc.css('[data-workdays-controls] input[type=checkbox]').size==8
   static_scripts=JSON.parse(doc.at_css('#k365-static-config')&.text.to_s).fetch('scripts',[]) rescue []
   has_workdays_script=static_scripts.any? { |src|File.basename(URI(src).path).match?(/\Aworkdays(?:-|\.)/) }
   has_workdays_styles=doc.css('link[rel=stylesheet][href^="/"]').any? do |node|
    href=node['href'].split('?',2).first
    file=site.join(href.delete_prefix('/'))
    file.file? && file.read.include?('.workdays-dashboard')
   end
   fail_with.call('Workdays dashboard assets must be present') unless has_workdays_styles && has_workdays_script
   fail_with.call('Workdays gallery must remain visible below the annual dashboard') unless doc.at_css('#design-gallery .gallery-format-label')&.text.to_s.include?('600 ppi') && gallery.css('.design-card').size==15
   fail_with.call('Workdays dashboard should use its full-width layout') if dashboard&.ancestors&.any? { |parent|parent['class'].to_s.split.include?('download-workspace') }
  else
   fail_with.call('Gallery must share a workspace with its calendar or settings') unless doc.at_css('body.gallery-page .download-workspace > .gallery-context #gallery-context-content') && gallery.ancestors.any? { |parent|parent['class'].to_s.split.include?('download-workspace') }
   if relative=='solski-urnik/index.html'
    gallery_description=doc.at_css('#design-gallery .student-gallery-copy')&.text.to_s
    fail_with.call('Student planner must expose its labelled workspace and one practical PDF/WebP gallery paragraph') unless doc.at_css('#student-schedule[aria-labelledby="student-workspace-title"]') && doc.at_css('#design-gallery[aria-labelledby="design-gallery-title"]') && doc.css('#design-gallery .student-gallery-copy').size==1 && %w[PDF WebP 600\ ppi].all? { |term|gallery_description.include?(term) }
   else
    description=doc.at_css('.page-heading > p')&.text.to_s
    fail_with.call('Expected one practical download paragraph and an accessible context control') unless doc.css('.page-heading > p').size==1 && (description.include?('600 ppi')||description.include?('600 dpi')) && doc.at_css('[data-context-expand][aria-expanded=false][aria-controls=gallery-context-content]')
   end
   if relative.match?(%r{\Akoledar/20(?:27|28|29|30)/})
    fail_with.call('Collection gallery description must state A3, CMYK FOGRA39 and 600 dpi') unless description.include?('A3')&&description.include?('CMYK FOGRA39')&&description.include?('600 dpi')
   end
  end
  fail_with.call('Gallery must stay open and contain all 15 designs') unless gallery.css('[data-calendar-design],.design-card').size==15 && !gallery.ancestors.any? { |parent|parent.name=='details'||parent.key?('hidden') }
  has_gallery_styles=doc.css('link[rel=stylesheet]').any? do |node|
   href=node['href'].split('?',2).first
   next false unless href.start_with?('/') && site.join(href.delete_prefix('/')).file?
   css=stylesheet_cache[href] ||= site.join(href.delete_prefix('/')).read
   css.include?('.download-workspace') && css.include?('.calendar-gallery-grid')
  end
  fail_with.call('Gallery layout stylesheet is missing') unless has_gallery_styles
 end
 if relative=='kalkulator-delovnih-dni/index.html'
  fail_with.call('Workday calculator must retain both interactive modes') unless doc.at_css('[data-workday-calculator]') && doc.css('[data-wdc-mode]').map { |node|node['data-wdc-mode'] }.sort==%w[range shift] && doc.css('[data-wdc-form]').map { |node|node['data-wdc-form'] }.sort==%w[range shift]
  static_scripts=JSON.parse(doc.at_css('#k365-static-config')&.text.to_s).fetch('scripts',[]) rescue []
  workdays_script=static_scripts.find { |src|File.basename(URI(src).path).match?(/\Aworkdays(?:-|\.)/) }
  fail_with.call('Workday calculator script must be emitted and available') unless workdays_script && site.join(URI(workdays_script).path.delete_prefix('/')).file?
 end
 if (period=relative.match(%r{\Akoledar/(202[7-9]|2030)/(?:([a-z]+)/)?index\.html\z}))
  year=period[1].to_i;month=period[2] && months.index(period[2]).to_i+1;type=month ? 'monthly':'annual'
  gallery=doc.at_css('#calendar-designs[data-calendar-gallery]');calendar_galleries+=1
  expected=catalog.select { |row|row.dig('options','type')==type && row.dig('options','year')==year && (!month||row.dig('options','month')==month) }
  fail_with.call('Expected an inline gallery with 15 period-specific designs') unless gallery && gallery.css('[data-calendar-design]').size==15 && expected.size==15
  if gallery
   %w[pdf webp].each do |format|
    actual=gallery.css("a[data-calendar-download=#{format}][download]").map { |node|node['href'] }.sort
    fail_with.call("Inline #{format} downloads do not match this page's exact year/month") unless actual==expected.map { |row|row.fetch('files').fetch(format) }.sort
   end
   previews=gallery.css('.calendar-design-image img')
   fail_with.call('Inline previews do not match the actual download files') unless previews.map { |node|URI(node['src']).path }.sort==expected.map { |row|row.fetch('files').fetch('preview') }.sort
   if expected.all? { |row|row['collection']=='calendar-2027-2030' }
    expected_by_preview=expected.to_h { |row|[row.dig('files','preview'),[row['preview_width'].to_s,row['preview_height'].to_s]] }
    fail_with.call('Collection preview dimensions do not match their uncropped full-page thumbnails') unless previews.all? { |node|expected_by_preview[URI(node['src']).path]==[node['width'],node['height']] }
    fail_with.call('Collection cards must preserve supplied Slovene alt text') unless previews.all? { |node|expected.any? { |row|row.dig('files','preview')==URI(node['src']).path&&row.dig('collection_seo','alt')==node['alt'] } }
    fail_with.call('Collection gallery must describe A3 orientation and full-resolution downloads') unless gallery.css('.calendar-design-meta').all? { |node|node.text.include?('A3')&&node.text.include?('600 dpi') }
   else
    fail_with.call('Gallery previews must use the optimized 212 × 300 thumbnail dimensions') unless previews.all? { |node|node['width']=='212'&&node['height']=='300' }
   end
  end
 end
 doc.css('source[srcset],img[srcset]').each do |node|
  node['srcset'].split(',').each do |candidate|
   raw=candidate.strip.split.first
   targets << URI::DEFAULT_PARSER.unescape(raw) if raw&.start_with?('/')
  end
 end
 doc.css('script[src],link[rel=stylesheet],img[src],a[href],meta[property="og:image"],meta[name="twitter:image"]').each do |node|
  raw=node['href']||node['src']||node['content'];next if raw.nil?||raw.empty?||raw.start_with?('#','mailto:','tel:','data:','blob:')
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
sitemap_paths=Dir[site.join('sitemap-*.xml')].flat_map { |file|Nokogiri::XML(File.read(file)).remove_namespaces!.css('url > loc').map(&:text) }
sitemap_paths.each do |url|
 path=URI(url).path;file=site.join(path.delete_prefix('/'),'index.html')
 if !file.file?||Nokogiri::HTML(file.read).at_css('meta[name=robots]')&.[]('content').to_s.include?('noindex')
  issues << {path:path,issue:'Sitemap contains absent or noindex page'}
 end
end
issues << {path:'/koledar/',issue:'Expected inline galleries on all four years and 48 months'} unless calendar_galleries==52
record={checked_at:Time.now.utc.iso8601,html:html_count,indexable:indexable,internal_targets:targets.size,sitemap_urls:sitemap_paths.size,calendar_galleries:calendar_galleries,gallery_pages:gallery_pages,gallery_families:gallery_families,passed:issues.empty?,issues:issues}
root.join('evidence/static-audit.json').write(JSON.pretty_generate(record));puts record.except(:issues).to_json;puts issues.first(30).to_json unless issues.empty?;exit(issues.empty? ? 0:1)
