require_relative '../config/environment'
require 'nokogiri'
session=ActionDispatch::Integration::Session.new(Rails.application);session.host!('localhost');session.get('/o-nas/')
doc=Nokogiri::HTML(session.response.body)
doc.at_css('title').content='Urejanje vsebine · Koledar365'
doc.at_css('meta[name=robots]')['content']='noindex, nofollow'
doc.css('script[src],script[type="application/ld+json"],meta[property^="og:"],meta[name^="twitter:"],link[rel=canonical],meta[name^="csrf-"]').remove
repo='https://github.com/mateopedersen/koledar365-si'
links={
 'Besedila strani'=>["#{repo}/edit/main/data/editorial/pages.json",'Uredite naslov, opis in besedilo obstoječe strani. Izvorno preverjanje zadrži strani, ki čakajo na vir.'],
 'Dnevni horoskop'=>["#{repo}/edit/main/data/editorial/horoscopes.json",'Uvozite zapise z znamenjem, datumom, besedilom in statusom draft ali scheduled. Objavljeni zapisi ohranijo pravi datum.'],
 'Objave in preverjanje'=>["#{repo}/actions",'Preverite izide kakovostnih pregledov in priprave izdaje. Neuspešen pregled ne sme postati javna izdaja.'],
 'Viri in podatki'=>["#{repo}/tree/main/data/source",'Preglejte vire, različice in javne agregirane podatke. Trajnih naslovov imen ne spreminjajte.'],
 'Zgodovina in obnovitev'=>["#{repo}/commits/main",'Git hrani različice javne vsebine. Prejšnjo spremembo obnovite z razveljavitvijo ustreznega commita.'],
 'Dokazila o datotekah'=>["#{repo}/tree/main/evidence",'Preverite obdobja, kontrolne vsote, 600 ppi, barve, pisave in PDF/WebP ujemanje.']}
body='<div class="page-heading"><span class="eyebrow">UREJNIŠTVO</span><h1>Urejanje vsebine</h1><p>Prijava in dovoljenja za objavo se upravljajo v GitHubu. Javni obiskovalci nimajo pravice spreminjati vsebine.</p></div><div class="feature-grid">'
links.each { |title,(href,text)|body+=%(<a class="feature panel" href="#{href}"><h2>#{ERB::Util.html_escape(title)}</h2><p>#{ERB::Util.html_escape(text)}</p><span>Odpri v GitHubu →</span></a>) }
body+='</div><section class="panel prose"><h2>Postopek objave</h2><ol><li>Uredite javno vsebino v GitHubu in predlagajte spremembo.</li><li>Preverite samodejne preglede ter predogled izdaje.</li><li>Združite preverjeno spremembo v glavno vejo; Cloudflare objavi pripravljeno izdajo.</li></ol><p>Osebni načrti obiskovalcev in njihove fotografije ostanejo na njihovih napravah. Uredništvo do njih nima dostopa. Kontaktna sporočila prejmete na <a href="mailto:koledar365@gmail.com">koledar365@gmail.com</a>.</p></section>'
doc.at_css('#vsebina').inner_html=body
script=Nokogiri::XML::Node.new('script',doc);script['type']='module';script['src']='/free/client.js';doc.at_css('head').add_child(script)
FileUtils.mkdir_p(Rails.root.join('site/upravljanje'));Rails.root.join('site/upravljanje/index.html').write(doc.to_html)
