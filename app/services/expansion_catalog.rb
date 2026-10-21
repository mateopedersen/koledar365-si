# Explicit editorial registry: one useful canonical page per distinct intent.
# New paths enter the same Rails, search, sitemap and static publication pipeline.
class ExpansionCatalog
  REVIEWED_ON='2026-10-21'
  FIXED={
    '/'=>{title:'Slovenski koledar 2026–2030: prazniki in načrtovanje',description:'Slovenski koledar s prazniki, številkami tednov in osebnimi zapiski. Izberite leto 2026–2030, mesec ali teden ter pripravite svoj koledar za tisk.'},
    '/mesecni-koledar/'=>{title:'Mesečni koledar za tiskanje: PDF in Excel',description:'Izberite leto in mesec, dodajte zapiske ter primerjajte postavitve mesečnega koledarja. Prenesite PDF ali pravi Excel XLSX s slovenskimi prazniki.'},
    '/tedenski-koledar/'=>{title:'Tedenski koledar in planer za tiskanje',description:'Tedenski koledar z izbiro datuma ali tedna ISO, slovenskimi prazniki in zapiski za vsak dan. Pripravite tedenski planer ter ga prenesite v PDF.'},
    '/odstevanje/'=>{title:'Odštevanje do datuma: prazniki in vaši dogodki',description:'Koliko dni je do izbranega datuma? Odštevajte do praznikov, šolskih počitnic ali svojega dogodka. Shranite seznam in prenesite datume v koledar ICS.'},
    '/nacrtovalnik-dopusta/'=>{title:'Načrtovalnik dopusta 2027–2030: prazniki in oddihi',description:'Načrtujte dopust ob slovenskih praznikih za leta 2027–2030. Primerjajte porabo dni dopusta, daljše oddihe ter prenesite osebni načrt v koledar.'},
    '/solske-pocitnice/'=>{title:'Šolske počitnice 2026/2027 v Sloveniji',description:'Preverjeni datumi šolskih počitnic 2026/2027 v Sloveniji, regionalne razlike, pouk in povezave do uradnih virov. Pripravite svoj pregled počitnic.'},
    '/delovni-dnevi/'=>{title:'Delovni dnevi in ure 2026–2030 v Sloveniji',description:'Letni pregled delovnih dni in ur za Slovenijo. Izberite leto 2026–2030, delovni teden in dnevne ure ter preverite vpliv dela prostih praznikov.'},
    '/polna-luna/'=>{title:'Polna luna: naslednji datum in čas v Sloveniji',description:'Kdaj je naslednja polna luna? Točen trenutek v slovenskem času, odštevanje, datumi za leta 2026–2030 in brezplačen koledar ICS.'},
    '/mlaj/'=>{title:'Mlaj: naslednji datum in čas v Sloveniji',description:'Preverite naslednji mlaj in njegove datume za leta 2026–2030. Trenutki v slovenskem času CET/CEST, odštevanje, razlaga in prenos koledarja ICS.'},
    '/lunine-mene/'=>{title:'Lunine mene 2026–2030: datumi in ure v Sloveniji',description:'Mlaj, prvi krajec, polna luna in zadnji krajec v slovenskem času. Naslednja Lunina mena, letni pregled, razlaga faz ter koledar za tisk in ICS.'},
    '/soncni-mrk/'=>{title:'Sončni mrk v Sloveniji: datumi in lokalna vidnost',description:'Sončni mrki 2026–2030: izberite slovensko mesto, preverite krajevni potek in vidnost nad obzorjem. Varno opazovanje, izračuni in koledar ICS.',family:'astronomy'},
    '/lunin-mrk/'=>{title:'Lunin mrk v Sloveniji: datumi, potek in vidnost',description:'Lunini mrki 2026–2030 v Sloveniji: začetek, maksimum, konec in vidnost za izbrano mesto. Lokalni čas, razlaga pojava in koledar za opazovanje.',family:'astronomy'},
    '/perzeidi/'=>{title:'Perzeidi v Sloveniji: opazovalne noči in razmere',description:'Načrtujte opazovanje Perzeidov: noči 12. in 13. avgusta, tema, mesečina in razmere za slovenska mesta. Razlaga rojev, pregled ter prenos ICS.',family:'astronomy'},
    '/viri-in-metodologija/'=>{title:'Viri in metodologija: kako preverjamo koledarske podatke',description:'Kako Koledar365 izbira vire, ločuje uradne datume od izračunov ter obravnava spremembe. Časovni pas, opombe o slikah, popravki in odgovornost.'}
  }.freeze
  def self.pages
    FIXED.merge(EducationCalendar::PAGES.transform_values{|page|page.merge(family:'education')})
      .merge('/solski-urnik/'=>EducationCalendar::TIMETABLE.merge(family:'education'))
      .merge(GardenCalendar::PATH=>{title:GardenCalendar::TITLE,description:GardenCalendar::DESCRIPTION,family:'garden'})
      .merge(PaymentCalendar::PAGES.transform_values{|page|page.merge(family:'payments')})
  end
  def self.page(path) = pages[path]
  def self.apply!
    pages.each do |path,metadata|
      page=Page.find_or_initialize_by(path:path)
      page.assign_attributes(title:metadata.fetch(:title),description:metadata.fetch(:description),family:metadata[:family]||page.family||'information',status:'published')
      page.metadata=(page.metadata||{}).merge('source_reviewed_on'=>REVIEWED_ON,'editorial_registry'=>'advanced-calendar-expansion')
      page.updated_at=Time.utc(2026,10,21,17,0,0) if page.changed?
      page.save! if page.changed?
    end
  end
  def self.image(path)
    return GardenCalendar.image if path==GardenCalendar::PATH
    if PaymentCalendar.paths.include?(path)
      pension=PaymentCalendar.page(path).fetch(:kind)=='pension'
      return {'path'=>"/images/payments/#{pension ? 'pokojnine-2026':'socialni-transferji-2026'}.webp",'width'=>1440,'height'=>900,'alt'=>pension ? 'Koledar izplačil pokojnin 2026 po uradnih datumih ZPIZ.' : 'Datumi izbranih socialnih transferjev v zadnjih treh mesecih leta 2026.','credit'=>'Koledar365'}
    end
    stem=case path
    when '/polna-luna/','/mlaj/','/lunine-mene/' then 'lunine-mene-slovenija'
    when '/soncni-mrk/' then 'soncni-mrk-slovenija'
    when '/lunin-mrk/' then 'lunin-mrk-slovenija'
    when '/perzeidi/' then 'perzeidi-opazovanje-slovenija'
    end
    return unless stem
    JSON.parse(Rails.root.join('data/astronomy/images.json').read).find{|row|row['stem']==stem}
  end
end
