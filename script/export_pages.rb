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
 # These generated atlases and photo variants must mirror their source directories.
 # Retaining superseded variants would eventually exceed the Pages Free file limit.
 %w[lunar/atlas images/responsive].each { |relative| FileUtils.rm_rf(out.join(relative)) }
 FileUtils.cp_r(Rails.root.join('public/.'),out)
end
SvgAssetReferences.materialize_fingerprinted_assets!(Rails.root.join('public'),out)
FileUtils.mkdir_p(out.join('free/views/home'));FileUtils.mkdir_p(out.join('free/names'))
FileUtils.cp_r(Rails.root.join('cloudflare/free/.'),out.join('free'))
FileUtils.rm_f(out.join('free/README.md'))
client_asset="client-#{Digest::SHA256.file(out.join('free/client.js')).hexdigest[0,16]}.js"
FileUtils.cp(out.join('free/client.js'),out.join('free',client_asset))
session=ActionDispatch::Integration::Session.new(Rails.application);session.host!('localhost')
assets=nil;processed=[];style_sets={}
transform=lambda do |body,path,indexable:true|
 doc=Nokogiri::HTML(body)
 sources=doc.css('script[src]').map { |node|node['src'] }
 assets||={scripts:sources.reject { |src|src.include?('holidays-')||src.include?('city_card-')||src.include?('vacation-')||src.include?('countdown-')||src.start_with?('/studio/','/horoscope/')||src.split('?',2).first=='/school/experience.mjs'||src.split('?',2).first=='/lunar/calendar.mjs' },holidays:ApplicationController.helpers.asset_path('holidays.js'),vacation:ApplicationController.helpers.asset_path('vacation.js'),countdown:ApplicationController.helpers.asset_path('countdown.js'),shift:ApplicationController.helpers.asset_path('shift_schedule.js')}
 doc.css('script[src]').each { |script|src=script['src'];script.remove unless src.include?('city_card-')||src.include?('sun-')||src.start_with?('/studio/','/horoscope/')||src.split('?',2).first=='/school/experience.mjs' }
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
elsif ['/delovni-dnevi/','/kalkulator-delovnih-dni/'].include?(path)
  workdays_scripts=sources.select { |src|src.match?(%r{(?:\A|/)workdays-[^/]+\.js(?:\?.*)?\z}) }
  page_assets=assets.merge(scripts:(assets[:scripts]+workdays_scripts).uniq)
 end
 config=Nokogiri::XML::Node.new('script',doc);config['type']='application/json';config['id']='k365-static-config';config.content=JSON.generate(page_assets);doc.at_css('head').add_child(config)
 (page_assets[:scripts]+[assets[:holidays]]+(doc.at_css('[data-vacation-planner]') ? [assets[:vacation]] : [])+(doc.at_css('[data-countdown-root]') ? [assets[:countdown]] : [])+(doc.at_css('#shift-form') ? [assets[:shift]] : [])).each do |src|
  next if src==assets[:holidays]&&!doc.at_css('#holiday-filters')
  preload=Nokogiri::XML::Node.new('link',doc);preload['rel']='preload';preload['as']='script';preload['href']=src;doc.at_css('head').add_child(preload)
 end
 %w[catalog-match.js date-context.js].each do |src|
  preload=Nokogiri::XML::Node.new('link',doc);preload['rel']='modulepreload';preload['href']="/free/#{src}";doc.at_css('head').add_child(preload)
 end
 doc.at_css('meta[name=robots]')['content']=indexable ? 'index, follow, max-image-preview:large':'noindex, follow'
 if path.start_with?('/koledar-z-imenom/') && path!='/koledar-z-imenom/'
   doc.css('meta[property="og:image"],meta[name="twitter:image"]').each { |node|node['content']='https://koledar365.si/og.png' }
   doc.at_css('meta[property="og:image:alt"]')['content']='Koledar365 – 15 predlog koledarjev za leta 2027–2030'
 end
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
 if path=='/kontakt/'
   panel=doc.at_css('main .prose');panel.inner_html='<h2>Pišite uredništvu</h2><p>Za vprašanje, popravek ali zahtevo glede zasebnosti pišite na <a href="mailto:koledar365@gmail.com">koledar365@gmail.com</a>. Navedite naslov strani in datum, na katerega se sporočilo nanaša.</p><a class="button primary" href="mailto:koledar365@gmail.com?subject=Koledar365%20%E2%80%93%20vpra%C5%A1anje">Odpri e-pošto</a><p>Povezava odpre vaš poštni program. Sporočilo pošljete sami; spletno mesto ga ne odda v ozadju. <a href="/zasebnost/">Obdelava podatkov in vaše pravice.</a></p>'
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
paths=Page.order(:path).map { |page|[page.path,page.status=='published'] }+PersonName.order(:priority).map { |name|[name.path,name.status=='published'] }+SunEngine::CITIES.keys.map { |city_id|["/soncni-vzhod-in-zahod/#{city_id}/",true] }+[['/fotografije-in-licence/',true],['/isci/',false]]
paths=paths.map { |path,indexable|path.match?(%r{\A/soncni-vzhod-in-zahod/[a-z0-9-]+/\z}) ? [path,true] : [path,indexable] }.uniq { |path,_|path }
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
 %w[koledar-z-imenom imena/najpogostejsa imena/moska imena/zenska imena/novorojencki].each_with_index do |group,group_index|
  (1..86).each do |page|
   session.get("/#{group}/",params:{page:page});doc=Nokogiri::HTML(session.response.body)
   file=out.join("free/names/#{group_index}-#{page}.html");file.write(transform.call(session.response.body,"/#{group}/",indexable:true))
  end
 end
end
unless limit
 session.get('/te-strani-ni/');write.call('/404.html',transform.call(session.response.body,'/404.html',indexable:false))
end
out.join('free/assets.json').write(JSON.generate(assets))
search=Page.published.map { |p|{title:p.title,path:p.path,type:'Koledar in orodja',folded:PersonName.fold(p.title+' '+p.path),priority:0} }+SunEngine::CITIES.map { |id,values|{title:"Sončni vzhod in zahod – #{values[0]}",path:"/soncni-vzhod-in-zahod/#{id}/",type:'Sončni časi',folded:PersonName.fold(values[0]+' sončni vzhod zahod mesto'),priority:1} }+PersonName.published.order(:priority).map { |p|{title:"Ime: #{p.exact}",path:p.path,type:'Koledar z imenom',folded:p.folded,priority:p.priority} }
out.join('free/search.json').write(JSON.generate(search))
events=CalendarEvent.all.map { |event|event.attributes.merge('path'=>['/prazniki/','/pomembni-dnevi/','/letni-casi/'].map { |prefix|prefix+event.slug+'/' }.find { |path|Page.exists?(path:path) }||"/pomembni-dnevi/#{event.on.year}/") }
out.join('free/events.json').write(events.to_json)
%w[sitemap.xml sitemap-pages.xml sitemap-names.xml robots.txt].each { |path|session.get('/'+path);write.call('/'+path,session.response.body) }
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
  Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'sha256-#{cookie_script_hash}'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' blob:; connect-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self' mailto:; frame-ancestors 'none'
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
/prenosi/lunin-koledar/*
  ! Cache-Control
  Cache-Control: public, max-age=3600
  X-Robots-Tag: noindex
/free/views/*
  X-Robots-Tag: noindex
/free/names/*
  X-Robots-Tag: noindex
/404.html
  X-Robots-Tag: noindex
/upravljanje/*
  X-Robots-Tag: noindex
HEADERS
out.join('_headers').write(headers)
out.join('_routes.json').write(JSON.generate({version:1,include:['/vreme/*','/horoskop/*','/city-detect*'],exclude:[]}))
# Re-materialize after all page and asset transforms so the final static tree
# always contains every content-addressed SVG referenced by generated CSS/HTML.
SvgAssetReferences.materialize_fingerprinted_assets!(Rails.root.join('public'),out)
report={built_at:Time.current.iso8601,html_count:processed.size,paths:processed,output:out.relative_path_from(Rails.root).to_s}
Rails.root.join(partial ? 'evidence/static-export-partial.json':'evidence/static-export.json').write(JSON.pretty_generate(report));puts report.except(:paths).to_json
