require_relative '../../config/environment'
LunarCalendar.validate!
root=Rails.root
plans=LunarCalendar.read('sayfa-plani.json')['pages']
plans.each do |p|
 path=p['proposedPath'];record=Page.find_or_initialize_by(path:path)
 period=path.split('/');year=period[2]&.to_i;month=period[3] && LunarCalendar::MONTHS.index(period[3]).to_i+1
 record.family='lunar';record.year=year;record.month=month;record.title=month ? "Lunin koledar za #{LunarCalendar::MONTHS[month-1]} #{year}" : p['h1Sl'];record.description=p['metaDescriptionSl'];
 if month
  full=LunarCalendar.phases(year,month).select { |e|e['phaseKey']=='full_moon' }.map { |e|"#{LunarCalendar.date_label(e['localDate']).delete_suffix(" #{year}")} ob #{e['localTime'].tr(':','.')}" }.join(' in ')
  record.description="Lunin koledar za #{LunarCalendar::MONTHS[month-1]} #{year}: #{LunarCalendar.period(year,month).size} dnevnih prikazov Lune. Polna luna: #{full}. Štiri predloge PDF in WebP."
 end
 record.body='';record.status='published';record.metadata||={};record.save! if record.changed?
end
(2027..2030).each { |y| (1..12).each { |m|root.join('public/lunar/data/%04d-%02d.json' % [y,m]).write(JSON.generate(LunarCalendar.payload(y,m))) } }
# Bind editorial candidates to the inspected, preserved routes; metrics remain unknown.
queries=LunarCalendar.read('hedef-arama-eslemesi.json');queries['pages'].each { |p|p['currentPath']=p['proposedPath'];p['routeStatus']='existing_route_preserved' }
root.join('data/lunar/query-map.json').write(JSON.pretty_generate(queries))
method=Page.find_by!(path:'/viri-in-metodologija/')
addition="Luna: viri in metodologija\n\nDnevna osvetljenost je izračunana za 12.00 po času v Sloveniji (Europe/Ljubljana) z Astronomy Engine 2.1.19. Glavne mene so ločeni dogodki iz podatkov USNO z minutno ločljivostjo. Njihov čas UT je pri pretvorbi v krajevni čas obravnavan kot približek UTC. Pravila poletnega in zimskega časa temeljijo na zbirki IANA; ob spremembi pravil je treba prihodnje koledarje posodobiti.\n\nPrikazi so računalniške upodobitve, ne fotografije prihodnjih datumov. Površje: NASA's Scientific Visualization Studio, LROC in LOLA. Geocentrični pogled ima sever Lune zgoraj; libracija je izračunana z JPL DE440 in pripadajočim orientacijskim modelom. Model uporablja normale iz višinskega modela ter vzorčene sence reliefa. Fotometrični približek Lommel–Seeliger ne vključuje ozračja, Zemljinega sija ali videza mrkov. Ne prikazuje natančne lege Lune nad krajevnim obzorjem.\n\nViri: https://aa.usno.navy.mil/data/MoonPhases ; https://svs.gsfc.nasa.gov/4720/ ; https://ssd.jpl.nasa.gov/doc/de440_de441.html ; https://www.iana.org/time-zones\n\nPDF vsebuje vektorsko besedilo in barve CMYK z vključenim izhodnim profilom. WebP vsebuje isto postavitev v sRGB. Pisava za tisk je DejaVu Sans; Avenir se na spletu uporabi, kadar je nameščen na napravi."
method.update!(body:method.body.to_s+"\n\n"+addition) unless method.body.to_s.include?('Luna: viri in metodologija')
editorial=JSON.parse(root.join('data/editorial/pages.json').read)
(plans.map { |p|p['proposedPath'] }+[method.path]).each do |path|
 page=Page.find_by!(path:path);row=editorial.find { |e|e['path']==path };row.merge!(page.attributes.slice('title','description','body','status','updated_at')) if row
end
root.join('data/editorial/pages.json').write(JSON.pretty_generate(editorial))
puts({days:LunarCalendar.days.size,events:LunarCalendar.events.size,pages:plans.size,payloads:48}.to_json)
