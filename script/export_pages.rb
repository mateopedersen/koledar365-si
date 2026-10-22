require_relative '../config/environment'
require 'nokogiri'
require 'fileutils'
require 'digest'
require 'base64'
require_relative '../lib/svg_asset_references'
ENV['OPERATOR_CONTACT']='koledar365@gmail.com'
out=Rails.root.join(ENV.fetch('STATIC_OUT','site'));FileUtils.mkdir_p(out)
partial=ENV['STATIC_ONLY']&.split(',')
unless partial
 # Retire removed name-day and name-calendar pages plus their public preview fragments.
 %w[koledar-z-imenom imena free/names sitemap-names.xml godovi].each { |relative| FileUtils.rm_rf(out.join(relative)) }
 # These generated atlases and photo variants must mirror their source directories.
 # Retaining superseded variants would eventually exceed the Pages Free file limit.
 PublicPagePolicy::REDIRECTS.each_key { |path| FileUtils.rm_rf(out.join(path.delete_prefix('/'))) }
 %w[lunar/atlas images/responsive].each { |relative| FileUtils.rm_rf(out.join(relative)) }
 FileUtils.cp_r(Rails.root.join('public/.'),out)
end
SvgAssetReferences.materialize_fingerprinted_assets!(Rails.root.join('public'),out)
FileUtils.mkdir_p(out.join('free/views/home'))
FileUtils.cp_r(Rails.root.join('cloudflare/free/.'),out.join('free'))
FileUtils.rm_f(out.join('free/README.md'))
# Keep only the current browser adapter; old fingerprints can retain retired page logic.
Dir[out.join('free/client-*.js')].each { |file|FileUtils.rm_f(file) }
client_asset="client-#{Digest::SHA256.file(out.join('free/client.js')).hexdigest[0,16]}.js"
FileUtils.cp(out.join('free/client.js'),out.join('free',client_asset))
session=ActionDispatch::Integration::Session.new(Rails.application);session.host!('localhost')
assets=nil;processed=[];style_sets={}
transform=lambda do |body,path,indexable:true|
 doc=Nokogiri::HTML(body)
 sources=doc.css('script[src]').map { |node|node['src'] }
 kept_scripts=doc.css('script[type="module"][src],script[data-static-keep][src]').map { |node|node['src'] }
 assets||={scripts:sources.reject { |src|kept_scripts.include?(src)||src.include?('holidays-')||src.include?('city_card-')||src.include?('vacation-')||src.include?('countdown-')||src.start_with?('/studio/','/horoscope/','/premik-ure/')||src.split('?',2).first=='/school/experience.mjs'||src.split('?',2).first=='/lunar/calendar.mjs' },holidays:ApplicationController.helpers.asset_path('holidays.js'),vacation:ApplicationController.helpers.asset_path('vacation.js'),countdown:ApplicationController.helpers.asset_path('countdown.js'),shift:ApplicationController.helpers.asset_path('shift_schedule.js')}
 doc.css('script[src]').each { |script|src=script['src'];script.remove unless kept_scripts.include?(src)||src.include?('city_card-')||src.include?('sun-')||src.start_with?('/studio/','/horoscope/','/premik-ure/')||src.split('?',2).first=='/school/experience.mjs' }
 doc.css('meta[name="csrf-token"],meta[name="csrf-param"],meta[name="csp-nonce"],meta[http-equiv="Content-Security-Policy"],input[name="authenticity_token"]').remove
 if doc.at_css('[data-lunar]')
   lunar_script=Nokogiri::XML::Node.new('script',doc);lunar_script['type']='module';lunar_script['src']='/lunar/calendar.mjs';doc.at_css('head').add_child(lunar_script)
 end

 doc.css('[nonce]').each { |node|node.remove_attribute('nonce') }
 # One cached stylesheet on internal pages; the home screen renders immediately
 # with its complete CSS in the document, before any image or script completes.
 links=doc.css('link[rel="stylesheet"][href^="/"]')
 unless links.empty?
  key=links.map { |node|node['href'] }.join('|')
  styles=style_sets[key] ||= links.map { |node|out.join(node['href'].split('?',2).first.delete_prefix('/')).read }.join("\n")
  if path=='/'
   style=Nokogiri::XML::Node.new('style',doc);style['data-page-styles']='home';style.content=styles;links.first.add_previous_sibling(style)
  else
   css_path="/assets/web-#{Digest::SHA256.hexdigest(styles)[0,16]}.css"
   out.join(css_path.delete_prefix('/')).write(styles) unless out.join(css_path.delete_prefix('/')).exist?
   link=Nokogiri::XML::Node.new('link',doc);link['rel']='stylesheet';link['href']=css_path;links.first.add_previous_sibling(link)
  end
  links.each(&:remove)
 end
 # Keep the existing Ruby renderer as the source of truth for both content and UI.
 # Discover the small interactive scripts during HTML parsing, without an extra
 # assets.json round trip or a serial module dependency waterfall.
 page_assets=assets
 if path=='/druzinski-planer/'
  family_scripts=sources.select { |src|src.include?('/family_planner') }
  page_assets=assets.merge(scripts:(assets[:scripts]+family_scripts).uniq)
elsif path=='/kalkulator-delovnih-dni/' || path.match?(%r{\A/delovni-dnevi/(?:20(?:2[6-9]|30)/)?\z})
  workdays_scripts=sources.select { |src|src.match?(%r{(?:\A|/)workdays-[^/]+\.js(?:\?.*)?\z}) }
  page_assets=assets.merge(scripts:(assets[:scripts]+workdays_scripts).uniq)
elsif path=='/solski-urnik/'
  student_scripts=sources.select { |src|src.match?(%r{(?:\A|/)student_timetable(?:_core)?-[^/]+\.js(?:\?.*)?\z}) }
  page_assets=assets.merge(scripts:(assets[:scripts]+student_scripts).uniq)
 end
 config=Nokogiri::XML::Node.new('script',doc);config['type']='application/json';config['id']='k365-static-config';config.content=JSON.generate(page_assets);doc.at_css('head').add_child(config)
 (page_assets[:scripts]+[assets[:holidays]]+(doc.at_css('[data-vacation-planner]') ? [assets[:vacation]] : [])+(doc.at_css('[data-countdown-root]') ? [assets[:countdown]] : [])+(doc.at_css('#shift-form') ? [assets[:shift]] : [])).each do |src|
  next if src==assets[:holidays]&&!doc.at_css('#holiday-filters')
  preload=Nokogiri::XML::Node.new('link',doc);preload['rel']='preload';preload['as']='script';preload['href']=src;doc.at_css('head').add_child(preload)
 end
 # Internal navigation goes directly to the consolidated destination.
 doc.css('a[href]').each do |node|
  href=node['href']; clean=href.split(/[?#]/,2).first
  destination=clean.start_with?('/') ? PublicPagePolicy.redirect(clean) : nil
  node['href']=destination if destination
 end
 %w[catalog-match.js date-context.js].each do |src|
  preload=Nokogiri::XML::Node.new('link',doc);preload['rel']='modulepreload';preload['href']="/free/#{src}";doc.at_css('head').add_child(preload)
 end
 doc.at_css('meta[name=robots]')['content']=indexable ? 'index, follow, max-image-preview:large':'noindex, follow'
 # Public previews are a clearly marked sample; the private preview uses the same Ruby renderer locally.
 doc.css('[data-preview-design]').each do |node|
   design=node['data-preview-design'];node['src']="/free/samples/#{design}.png";node['data-static-preview']=node['src']
   node['alt']='Vzorec postavitve. Za izbrano ime, obdobje in vnose odprite Moj predogled.'
 end
 doc.css('.design-section > p.muted').each { |node|node.content='Sličica prikazuje vzorec postavitve. »Moj predogled« pripravi izbrano obdobje in vaše vnose na tej napravi. PDF vsebuje vektorsko besedilo, WebP pa celotno ločljivost 600 ppi. Večstranski prenos WebP je ZIP z vsemi stranmi in podatki za tisk.' }
 doc.css('p').each do |node|
  if node.text.include?('Za osebni predogled in prenos jih pošljemo strežniku')
   node.content='Vnosi se shranijo na tej napravi. Osebni predogled, PDF in WebP pripravimo v brskalniku. Fotografija ostane le do zaprtja strani; strežniku je ne pošljemo.'
  end
 end
 if (grid=doc.at_css('.horoscope-grid'))
  grid.parent['data-horoscope-day']=Time.zone.today.iso8601
  grid.css('article').each do |article|
   paragraph=article.element_children.find { |node|node.name=='p' };next unless paragraph&&!paragraph.text.include?('Današnji horoskop še ni pripravljen.')
   current=Nokogiri::XML::Node.new('div',doc);current['data-horoscope-current']=Time.zone.today.iso8601
   paragraph.add_previous_sibling(current);current.add_child(paragraph)
   stamp=article.element_children.find { |node|node.name=='small' };current.add_child(stamp) if stamp
  end
 end
 if path=='/piskotki/'
   doc.css('tr').find { |node|node.text.include?('_koledar365_session') }&.remove
   doc.css('p').each { |node|node.inner_html=node.inner_html.gsub('kontaktnega obrazca','e-pošte').gsub('obdelava podatkov na strežniku','tehnični podatki ob obisku') }
 end
 if path=='/zasebnost/'
   doc.at_css('main').inner_html=ApplicationController.render(partial:'pages/privacy_free')
 end
 if path.start_with?('/koledar/','/tedenski-koledar/')
  doc.css('.calendar-toolbar .tabs a').each { |node|node['href']='/'+node['href'] if node['href'].start_with?('?') }
 end
 # Version every referenced local SVG and add old-WebKit symbol fallbacks.
 SvgAssetReferences.rewrite_document!(doc, Rails.root.join('public'))
 script=Nokogiri::XML::Node.new('script',doc);script['type']='module';script['src']="/free/#{client_asset}";doc.at_css('head').add_child(script)
 doc.to_html
end
write=lambda do |path,html|
 file=out.join(path.delete_prefix('/'));file=file.join('index.html') if path.end_with?('/')
 FileUtils.mkdir_p(file.dirname);file.write(html)
end
removed_name_path=%r{\A/(?:koledar-z-imenom|imena|godovi)(?:/|\z)}
paths=Page.order(:path).reject { |page|page.path.match?(removed_name_path) || PublicPagePolicy.redirect(page.path) }.map { |page|[page.path,page.status=='published'] }+SunEngine::CITIES.keys.map { |city_id|["/soncni-vzhod-in-zahod/#{city_id}/",true] }+[['/fotografije-in-licence/',true],['/isci/',false]]
paths=paths.map { |path,indexable|path.match?(%r{\A/soncni-vzhod-in-zahod/[a-z0-9-]+/\z}) ? [path,true] : [path,indexable] }.uniq { |path,_|path }
unless partial || ENV['STATIC_LIMIT']
 # Remove only pages owned by the previous export. A deleted source must not
 # survive as indexable HTML in the next publication or its generated sitemap.
 previous=out.join('source-page-manifest.json')
 fallback=Rails.root.join('evidence/static-export.json')
 previous_paths=if previous.file?
   JSON.parse(previous.read).fetch('paths')
 elsif fallback.file?
   JSON.parse(fallback.read).fetch('paths',[])
 else
   []
 end
 (previous_paths-paths.map(&:first)).each do |old_path|
   next unless old_path.start_with?('/') && old_path.end_with?('/') && !old_path.include?('..') && !old_path.start_with?('/free/')
   FileUtils.rm_f(out.join(old_path.delete_prefix('/'),'index.html'))
 end
 out.join('source-page-manifest.json').write(JSON.pretty_generate({paths:paths.map(&:first).sort})+"\n")
end
paths=paths.select { |path,_|partial.include?(path) } if partial
limit=ENV['STATIC_LIMIT']&.to_i;paths=paths.first(limit) if limit
paths.each_with_index do |(path,indexable),index|
 session.get(path);raise "#{path}: #{session.response.status}" unless session.response.status==200
 html=transform.call(session.response.body,path,indexable:indexable);write.call(path,html);processed<<path
 puts "HTML #{index+1}/#{paths.size}" if index%200==0;STDOUT.flush
end
unless limit||partial
 (2026..2030).each do |year|
  (1..12).each do |month|
   %w[month week day list year].each do |view|
    session.get('/',params:{year:year,month:month,view:view,date:'%04d-%02d-01' % [year,month]})
    write.call('/free/views/home/%04d-%02d-%s.html' % [year,month,view],transform.call(session.response.body,'/',indexable:false))
   end
  end
 end
end
unless limit
 session.get('/te-strani-ni/');write.call('/404.html',transform.call(session.response.body,'/404.html',indexable:false))
end
out.join('free/assets.json').write(JSON.generate(assets))
search=Page.published.reject { |page|page.path.match?(removed_name_path) || PublicPagePolicy.redirect(page.path) }.map do |page|
 keywords=case page.path
 when %r{\A/prazniki/} then 'prazniki državni praznik dela prost dan dela prosti dnevi javni praznik'
 when %r{\A/solske-pocitnice/} then 'šolske počitnice šolski koledar zimske jesenske zimske prvomajske poletne počitnice osnovna šola srednja šola'
 when %r{\A/lunin-koledar/}, %r{\A/(?:lunine-mene|polna-luna|mlaj)/} then 'luna lunine mene mlaj polna luna ščip prvi krajec zadnji krajec lunacija'
 when %r{\A/delovni-dnevi/} then 'delovni dnevi delovne ure delovnik prazniki dela prost dan'
 when %r{\A/podaljsani-vikendi/}, %r{\A/nacrtovalnik-dopusta/} then 'podaljšani vikendi dopust prosti dnevi oddih prazniki'
 when %r{\A/soncni-vzhod-in-zahod/}, %r{\A/dolzina-dneva/} then 'sončni vzhod sončni zahod zlata ura dolžina dneva mesto'
 when '/premik-ure/' then 'premik ure prestavitev ure poletni čas zimski čas naprej nazaj menjava ure'
 when %r{\A/(?:solski-koledar|solski-urnik|studijski-koledar|matura|npz)/} then 'šolski študijski koledar urnik matura NPZ izpiti predmeti roki rezultati dosežki'
 when '/setveni-koledar/' then 'setveni koledar vrt vrtnarski setev sajenje sadike zelenjava moj vrt'
 when %r{\A/izplacila-} then 'izplačila nakazila pokojnine socialni transferji otroški dodatek CSD ZPIZ štipendije socialna pomoč'
 when '/soncni-mrk/' then 'sončni mrk sončev mrk delni popolni vidnost Slovenija opazovanje'
 when '/lunin-mrk/' then 'lunin mrk popolni delni polsenčni Luna vidnost Slovenija'
 when '/perzeidi/' then 'perzeidi meteorski roj utrinki avgust opazovanje Slovenija'
 when %r{\A/(?:koledar|mesecni-koledar|tedenski-koledar|prazen-koledar)/} then 'koledar datum dnevi mesec leto tedenski mesečni letni koledar'
 else ''
 end
 {title:page.title,path:page.path,type:'Koledar in orodja',folded:PersonName.fold([page.title,page.path,page.description,keywords].compact.join(' ')),priority:0}
end
search+=SunEngine::CITIES.map { |id,values|{title:"Sončni vzhod in zahod – #{values[0]}",path:"/soncni-vzhod-in-zahod/#{id}/",type:'Sončni časi',folded:PersonName.fold("#{values[0]} sončni vzhod sončni zahod zlata ura dolžina dneva mesto"),priority:1} }
# Retired name URLs stay out of public search, just as they stay out of the sitemap.
search+=CalendarEvent.ordered.map do |event|
 path=["/prazniki/#{event.slug}/","/pomembni-dnevi/#{event.slug}/","/letni-casi/#{event.slug}/"].find { |candidate|Page.exists?(path:candidate) }||"/pomembni-dnevi/#{event.on.year}/"
 tags=[event.title,event.on.iso8601,"#{event.on.day}. #{CalendarEngine::MONTHS.fetch(event.on.month-1)} #{event.on.year}",CalendarEngine::DAYS.fetch(event.on.cwday-1),event.category,'praznik']
 tags<<'dela prost dan dela prost dan' if event.work_free
 tags<<'državni praznik' if event.state_holiday
 {title:event.title.sub(/\A./) { |letter|letter.upcase },path:path,type:'Prazniki in dnevi',folded:PersonName.fold(tags.compact.join(' ')),priority:event.work_free ? -2 : 2}
end
out.join('free/search.json').write(JSON.generate(search))
events=CalendarEvent.all.map { |event|event.attributes.merge('path'=>['/prazniki/','/pomembni-dnevi/','/letni-casi/'].map { |prefix|prefix+event.slug+'/' }.find { |path|Page.exists?(path:path) }||"/pomembni-dnevi/#{event.on.year}/") }
out.join('free/events.json').write(events.to_json)
%w[sitemap.xml sitemap-pages.xml robots.txt].each { |path|session.get('/'+path);write.call('/'+path,session.response.body) }
(2027..2030).each { |year|session.get("/prazniki/#{year}.ics");write.call("/prazniki/#{year}.ics",session.response.body) }
css=Dir[out.join('assets/holidays-*.css')].first;FileUtils.cp(css,out.join('free/holidays.css')) if css
cities=CityCatalog.all.map { |city|city.slice('id','name','coordinates') }
Rails.root.join('functions/cities.js').write('export default '+cities.to_json+';')
# No server sessions, authentication material, contacts or private exports enter this directory.
cookie_script=File.read(Rails.root.join('app/views/layouts/_cookies.html.erb')).match(/<script nonce="<%= content_security_policy_nonce %>">(.*?)<\/script>/m).captures.fetch(0)
cookie_script_hash=Base64.strict_encode64(Digest::SHA256.digest(cookie_script))
headers=<<~HEADERS
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(self)
  Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'sha256-#{cookie_script_hash}'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' blob:; connect-src 'self' blob:; frame-src https://docs.google.com/forms/; object-src 'none'; base-uri 'self'; form-action 'self' mailto:; frame-ancestors 'none'
  Cache-Control: public, max-age=0, must-revalidate
/visuals/*
  ! Cache-Control
  Cache-Control: public, max-age=31536000, immutable
/horoscope/art/*
  ! Cache-Control
  Cache-Control: public, max-age=31536000, immutable
/school/*.svg
  ! Cache-Control
  Cache-Control: public, max-age=31536000, immutable
/school/logos/*.svg
  ! Cache-Control
  Cache-Control: public, max-age=31536000, immutable
/assets/*
  ! Cache-Control
  Cache-Control: public, max-age=31536000, immutable
/images/responsive/*
  ! Cache-Control
  Cache-Control: public, max-age=31536000, immutable
/free/#{client_asset}
  ! Cache-Control
  Cache-Control: public, max-age=31536000, immutable
/free/engine/*
  ! Cache-Control
  Cache-Control: public, max-age=31536000, immutable
/prenosi/*
  ! Cache-Control
  Cache-Control: public, max-age=31536000, immutable
  X-Robots-Tag: noindex
/koledarji/2027-2030/*
  ! Cache-Control
  Cache-Control: public, max-age=31536000, immutable
/prenosi/lunin-koledar/*
  ! Cache-Control
  Cache-Control: public, max-age=3600
  X-Robots-Tag: noindex
/free/views/*
  X-Robots-Tag: noindex
/404.html
  X-Robots-Tag: noindex
/llms.txt
  Content-Type: text/plain; charset=utf-8
  Cache-Control: public, max-age=0, must-revalidate
/upravljanje/*
  X-Robots-Tag: noindex
HEADERS
out.join('_headers').write(headers)
# Cloudflare redirects run before assets, including stale bookmarks to aliases.
redirect_file=out.join('_redirects')
redirect_lines=redirect_file.exist? ? redirect_file.readlines.map(&:strip) : []
redirect_sources=PublicPagePolicy::REDIRECTS.keys.flat_map { |path| [path,path.delete_suffix('/')] }
redirect_lines.reject! { |line| redirect_sources.include?(line.split.first) }
PublicPagePolicy::REDIRECTS.each do |source,destination|
 [source,source.delete_suffix('/')].each { |path| redirect_lines << "#{path} #{destination} 301" }
end
redirect_file.write(redirect_lines.join("\n")+"\n")
out.join('_routes.json').write(JSON.generate({version:1,include:['/vreme/*','/horoskop/*','/city-detect*','/koledar-z-imenom','/koledar-z-imenom/*','/imena','/imena/*','/godovi','/godovi/*','/free/names','/free/names/*','/free/search.json','/sitemap-names.xml','/sitemap.xml','/sitemap-pages.xml','/robots.txt'],exclude:[]}))
# Re-materialize after all page and asset transforms so the final static tree
# always contains every content-addressed SVG referenced by generated CSS/HTML.
SvgAssetReferences.materialize_fingerprinted_assets!(Rails.root.join('public'),out)
report={built_at:Time.current.iso8601,html_count:processed.size,paths:processed,output:out.relative_path_from(Rails.root).to_s}
Rails.root.join(partial ? 'evidence/static-export-partial.json':'evidence/static-export.json').write(JSON.pretty_generate(report));puts report.except(:paths).to_json
