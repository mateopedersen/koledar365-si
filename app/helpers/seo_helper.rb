module SeoHelper
  def site_origin = ENV.fetch("SITE_URL", "https://koledar365.si").delete_suffix("/")

  def seo_title
    return "Prestopno leto: kalkulator in pravilo 29. februarja · Koledar365" if page_path == "/prestopno-leto/"
    title = @title.presence || "Slovenski koledar"
    title.include?("Koledar365") ? title : "#{title} · Koledar365"
  end

  def seo_photo
    return nil if @clock_change
    @observance&.photo || (@section=='holidays' ? HolidayPhotoCatalog.find('pust') : nil)
  end

  def seo_image
    return {url:site_origin+ClockChangeSchedule::IMAGE_PATH,width:1200,height:720,alt:ClockChangeSchedule::IMAGE_ALT} if @clock_change
    if (image=ExpansionCatalog.image(page_path))
      return {url:site_origin+image.fetch('path'),width:image.fetch('width'),height:image.fetch('height'),alt:image.fetch('alt')}
    end
    if @section=='lunar' && page_path.start_with?('/lunin-koledar/') && (2027..2030).cover?(@year.to_i)
      day=LunarCalendar.period(@year,@page.month).max_by { |d|d['illuminationFraction'] }
      return {url:site_origin+"/lunar/atlas/#{day['date'][0,7]}-cover.webp",width:768,height:768,alt:"Luna #{LunarCalendar.date_label(day['date'])} ob 12.00 po času v Sloveniji"}
    end
    photo=seo_photo
    return {url:site_origin+photo['local_path'],width:photo['width'],height:photo['height'],alt:photo['alt_sl']} if photo
    record=@person || @page
    return {url:"#{site_origin}/og.png",width:1200,height:630,alt:'Koledar365 – slovenski koledarji in načrtovanje'} unless record
    kind=@person ? 'names' : 'pages'
    {url:"#{site_origin}/druzabno/#{kind}/#{record.id}/#{SocialImage.key(record)}.png",width:1200,height:630,alt:@title}
  end

  def breadcrumbs
    return [] if page_path == "/" || @not_found
    rows = [["Domov", "/"]]
    parent = "/#{page_path.split("/").reject(&:blank?).first}/"
    record = Page.find_by(path: parent) if parent != page_path
    rows << [record.title, record.path] if record
    if @page&.month && @page.year
      year_path="/#{page_path.split('/').reject(&:blank?).first}/#{@page.year}/"
      year_page=Page.published.find_by(path:year_path)
      rows << [year_page.title,year_path] if year_page && rows.none? { |_,path| path==year_path }
    end
    rows << [@title, page_path]
    rows
  end

  def date_calculator_faq
    [
      ["Kako izračunam število dni med datumoma?", "Vnesite začetni in končni datum ter izberite »Razlika med datumoma«. Rezultat pokaže skupno število koledarskih dni, tedne in preostale dni. Če vključite oba izbrana dneva, se vštejeta tudi začetni in končni datum."],
      ["Kako kalkulator prišteje mesece?", "Meseci se prištevajo po koledarju. Če ciljni mesec nima izbranega dne, kalkulator uporabi zadnji dan ciljnega meseca. Tako se 31. januar pri prištevanju enega meseca premakne na zadnji dan februarja."],
      ["Kako se štejejo delovni dnevi v Sloveniji?", "V načinu »Delovni dnevi« izberete dneve tedna, dnevne ure in ali naj kalkulator izloči zakonsko dela proste praznike. Podatki za praznike so na voljo za leta 2026–2030."],
      ["Ali lahko rezultat delim?", "Da. Gumb »Kopiraj povezavo« ustvari povezavo z izbranimi datumi in nastavitvami. Za datumske izračune račun ni potreben."]
    ]
  end

  def leap_year_faq
    [
      ["Kdaj je leto prestopno?", "V gregorijanskem koledarju je prestopno leto deljivo s 4, razen stoletnih let, ki niso deljiva s 400. Leto 2000 je bilo prestopno, 1900 pa ne."],
      ["Zakaj 1900 ni prestopno, leto 2000 pa je?", "Obe leti sta deljivi s 100, zato običajno pravilo s štiri ne zadošča. Stoletno leto je prestopno samo, če je deljivo tudi s 400: 1900 ni, 2000 pa je."],
      ["Ali bo leto 2100 prestopno?", "Ne. Leto 2100 je deljivo s 100, ni pa deljivo s 400, zato bo februar imel 28 dni."],
      ["Kaj se zgodi 29. februarja?", "V prestopnem letu ima februar 29 namesto 28 dni. Dodatni datum je med 28. februarjem in 1. marcem; leto ima zato skupaj 366 dni."],
      ["Zakaj prestopnih let ne določimo samo vsaka štiri leta?", "Tropsko leto traja približno 365,2422 dni, zato preprosto dodajanje dneva vsaka štiri leta sčasoma doda preveč časa. Gregorijansko pravilo izpusti večino stoletnih let in ohrani vsako štiristoletno izjemo."],
      ["Koliko dni ima prestopno leto?", "Prestopno leto ima 366 koledarskih dni. Vsi meseci razen februarja ohranijo običajno dolžino; februar ima 29 dni."],
      ["Ali lahko s kalkulatorjem preverim tudi zgodovinsko leto?", "Kalkulator uporabi gregorijansko pravilo za leta od 1 do 9999. Pri zgodovinskih datumih se je dejanska uporaba civilnega koledarja razlikovala po kraju in obdobju, zato preverite tudi lokalni zgodovinski vir."]
    ]
  end

  def structured_data
    return nil if @not_found || controller_name.in?(%w[admin exports]) || action_name == "search"
    graph = [
      { "@type" => "WebSite", "@id" => "#{site_origin}/#website", "url" => "#{site_origin}/",
        "name" => "Koledar365", "inLanguage" => "sl-SI" },
      { "@type" => "WebPage", "@id" => "#{canonical_url}#webpage", "url" => canonical_url,
        "name" => @title, "description" => @description,
        "inLanguage" => "sl-SI", "isPartOf" => { "@id" => "#{site_origin}/#website" } }
    ]
    organization={"@type"=>"Organization","@id"=>"#{site_origin}/#organization","name"=>"Koledar365","url"=>"#{site_origin}/","email"=>"koledar365@gmail.com"}
    graph << organization
    graph[0]['publisher']={"@id"=>organization.fetch('@id')}
    graph[1]['publisher']={"@id"=>organization.fetch('@id')}
    if ExpansionCatalog.page(page_path)
      graph[1]['author']={"@id"=>organization.fetch('@id')}
      citations=expansion_citations
      graph[1]['citation']=citations unless citations.empty?
    end
    if (illustration=ExpansionCatalog.image(page_path))
      image_url=site_origin+illustration.fetch('path')
      graph << {"@type"=>"ImageObject","@id"=>"#{image_url}#image","contentUrl"=>image_url,"url"=>image_url,
        "width"=>illustration.fetch('width'),"height"=>illustration.fetch('height'),"name"=>illustration.fetch('alt'),
        "caption"=>illustration['caption']||illustration.fetch('alt'),"inLanguage"=>'sl-SI',
        "creditText"=>illustration['credit']||illustration['creator']||'Koledar365'}
      graph[1]['primaryImageOfPage']={"@id"=>"#{image_url}#image"}
    end
    if (features=expansion_tool_features)
      graph << {"@type"=>'WebApplication',"@id"=>"#{canonical_url}#application","name"=>@title,"description"=>@description,
        "url"=>canonical_url,"applicationCategory"=>'UtilitiesApplication',"operatingSystem"=>'Any',
        "isAccessibleForFree"=>true,"inLanguage"=>'sl-SI',"featureList"=>features,"publisher"=>{"@id"=>organization.fetch('@id')}}
    end
    questions=expansion_questions
    if questions.any?
      graph << {"@type"=>'FAQPage',"@id"=>"#{canonical_url}#faq","mainEntity"=>questions.map{|question,answer|
        {"@type"=>'Question',"name"=>question,"acceptedAnswer"=>{"@type"=>'Answer',"text"=>answer}}
      }}
    end
    photos=[seo_photo]
    photos.concat(@observance.related.map { |event|HolidayPhotoCatalog.find(event.slug) }) if @observance && !@clock_change
    photos.concat(@holiday_photos) if @holiday_photos
    photos.compact.uniq { |photo|photo['local_path'] }.each do |photo|
      graph << {"@type"=>"ImageObject","@id"=>"#{site_origin}#{photo['local_path']}#image",
        "contentUrl"=>"#{site_origin}#{photo['local_path']}","caption"=>photo['caption_sl'],
        "width"=>photo['width'],"height"=>photo['height'],"creditText"=>photo['author'],
        "license"=>photo['license_url'],"acquireLicensePage"=>photo['source']}
    end
    if @section == 'calendar' && @page && page_path.start_with?('/koledar/') && (2027..2030).cover?(@year.to_i)
      collection_rows = PublicCalendarGallery.rows_for(year: @year, month: @page.month)
      graph << { "@type" => "ItemList", "name" => @title, "numberOfItems" => collection_rows.size,
        "itemListElement" => collection_rows.each_with_index.map { |row, index|
          image = row.fetch('collection_seo')
          { "@type" => "ListItem", "position" => index + 1,
            "item" => { "@type" => "ImageObject", "name" => image.fetch('title'),
              "description" => image.fetch('alt'), "contentUrl" => site_origin + row.dig('files', 'webp'),
              "url" => site_origin + row.dig('files', 'preview'),
              "width" => row.dig('manifest', 'width_px'), "height" => row.dig('manifest', 'height_px'),
              "inLanguage" => "sl-SI" } }
        } }
    end
    graph[1]['primaryImageOfPage']={"@id"=>"#{site_origin}#{seo_photo['local_path']}#image"} if seo_photo
    if @clock_change
      image_url=site_origin+ClockChangeSchedule::IMAGE_PATH
      graph << {"@type"=>"ImageObject","@id"=>"#{image_url}#image",
        "contentUrl"=>image_url,"url"=>image_url,"width"=>1200,"height"=>720,
        "name"=>'Premik ure v Sloveniji – poletni in zimski čas',
        "caption"=>ClockChangeSchedule::IMAGE_ALT,"inLanguage"=>'sl-SI',
        "creditText"=>'Koledar365',"creator"=>{"@type"=>'Organization',"name"=>'Koledar365'}}
      graph[1]['primaryImageOfPage']={"@id"=>"#{image_url}#image"}
    end
    unless breadcrumbs.empty?
      graph << { "@type" => "BreadcrumbList", "itemListElement" => breadcrumbs.each_with_index.map { |(name, path), i|
        { "@type" => "ListItem", "position" => i + 1, "name" => name, "item" => "#{site_origin}#{path}" }
      } }
    end
    if page_path == "/datumski-kalkulator/"
      graph << { "@type" => "WebApplication", "@id" => "#{canonical_url}#application",
        "name" => @title, "url" => canonical_url, "description" => @description,
        "applicationCategory" => "UtilitiesApplication", "operatingSystem" => "Any",
        "isAccessibleForFree" => true, "inLanguage" => "sl-SI",
        "featureList" => ["Razlika med datumoma", "Prištevanje in odštevanje dni, tednov in mesecev",
          "Štetje delovnih dni in slovenskih praznikov", "Deljiva povezava do nastavitev"] }
      graph << { "@type" => "FAQPage", "@id" => "#{canonical_url}#faq",
        "mainEntity" => date_calculator_faq.map { |question, answer|
          { "@type" => "Question", "name" => question,
            "acceptedAnswer" => { "@type" => "Answer", "text" => answer } }
        } }
    end
    if page_path == "/prestopno-leto/"
      graph << { "@type" => "WebApplication", "@id" => "#{canonical_url}#application",
        "name" => "Kalkulator prestopnega leta", "url" => canonical_url,
        "description" => @description, "applicationCategory" => "UtilitiesApplication",
        "operatingSystem" => "Any", "isAccessibleForFree" => true, "inLanguage" => "sl-SI",
        "featureList" => ["Preverjanje let od 1 do 9999", "Gregorijansko pravilo deljivosti s 4, 100 in 400",
          "Število dni v februarju", "Primeri stoletnih let"] }
      graph << { "@type" => "FAQPage", "@id" => "#{canonical_url}#faq",
        "mainEntity" => leap_year_faq.map { |question, answer|
          { "@type" => "Question", "name" => question,
            "acceptedAnswer" => { "@type" => "Answer", "text" => answer } }
        } }
    end
    if @horoscope_guide
      graph << { "@type" => "WebApplication", "@id" => "#{canonical_url}#ascendent",
        "name" => "Izračun vzhajajočega znamenja (ascendenta) in sončnega znamenja", "url" => "#{canonical_url}#ascendent",
        "applicationCategory" => "LifestyleApplication", "operatingSystem" => "Any",
        "isAccessibleForFree" => true, "inLanguage" => "sl-SI",
        "featureList" => ["Izračun po datumu, uri in kraju rojstva", "Časovni pasovi in premiki ure", "Obdelava rojstnih podatkov samo na napravi"] }
      if @horoscope_guide.profile && @horoscope_guide.edition_date
        graph << { "@type" => "Article", "@id" => "#{canonical_url}#dnevni-zapis",
          "headline" => @horoscope_guide.reading['title'], "inLanguage" => "sl-SI",
          "datePublished" => @horoscope_guide.edition['generated_at'],
          "dateModified" => @horoscope_guide.edition['generated_at'],
          "author" => { "@type" => "Organization", "name" => "Koledar365", "url" => site_origin+'/' },
          "mainEntityOfPage" => { "@id" => "#{canonical_url}#webpage" },
          "description" => "Razvedrilna slovenska izdaja za #{@horoscope_guide.edition_date.iso8601}." }
      elsif page_path == '/horoskop/'
        graph << { "@type" => "ItemList", "numberOfItems" => 12,
          "itemListElement" => @horoscope_guide.profiles.each_with_index.map { |profile,index|
            { "@type" => "ListItem", "position" => index+1, "name" => profile['name'], "url" => "#{site_origin}/horoskop/#{profile['slug']}/" }
          } }
      end
    end
    if page_path == "/ustvari-koledar/"
      graph << { "@type" => "WebApplication", "@id" => "#{canonical_url}#application",
        "name" => "Koledar365 Ustvarjalni studio", "url" => canonical_url, "description" => @description,
        "applicationCategory" => "DesignApplication", "operatingSystem" => "Any",
        "isAccessibleForFree" => true, "inLanguage" => "sl-SI",
        "featureList" => ["Letni in mesečni koledar", "Imena, fotografije, logotipi in besedilni elementi",
          "Pisave, barve in postavitev", "Začetek tedna v ponedeljek ali nedeljo",
          "Dogodki in uvoz ICS ali CSV", "Prenos PDF, PNG in SVG", "Shranjevanje in odpiranje projektov"] }
      questions = [
        ["Ali lahko dodam svoje ime, fotografije in logotip?", "Da. Uredite naslov, ime ali podjetje, podnaslov in nogo. Dodajte glavno fotografijo ter samostojne slike in besedila, ki jih lahko premikate, vrtite in povečujete."],
        ["Ali se lahko teden začne v nedeljo?", "V zavihku Postavitev izberite ponedeljek ali nedeljo. Spremenite lahko tudi jezik koledarja, leto, mesec, velikost papirja in usmerjenost."],
        ["Kako shranim koledar in nadaljujem pozneje?", "Osnutek se samodejno shranjuje v tem brskalniku, če je shramba na voljo. Z možnostjo Projekt → Shrani projekt prenesete datoteko JSON z nastavitvami, dogodki in fotografijami. Pozneje jo odprete z možnostjo Odpri projekt."],
        ["Kateri format je najboljši za tisk?", "PDF je pripravljen v izbrani velikosti papirja, pri 150 ali 300 dpi. Mesečni PDF lahko vsebuje vseh 12 mesecev in dodaten seznam vaših dogodkov. Za vektorsko urejanje izberite SVG; PNG je primeren za deljenje posamezne strani. Pri tisku izberite merilo 100 % in enako velikost papirja."],
        ["Kam se pošljejo moje fotografije?", "Fotografije in projekt se obdelajo v brskalniku. Urejevalnik jih ne pošlje na strežnik. Osnutek lahko izbrišete v meniju Projekt; prenesene datoteke ostanejo tam, kamor jih shranite sami."]
      ]
      graph << { "@type" => "FAQPage", "@id" => "#{canonical_url}#faq", "mainEntity" => questions.map { |question, answer|
        { "@type" => "Question", "name" => question, "acceptedAnswer" => { "@type" => "Answer", "text" => answer } }
      } }
    end
    ImageRights.apply!(graph, origin: site_origin)
    { "@context" => "https://schema.org", "@graph" => graph }
  end

  # Only questions rendered in the same page are eligible for FAQ markup.
  def expansion_questions
    return GardenCalendar.faq if @section=='garden_calendar'
    return @payment_calendar.faq if @section=='payment_calendar' && @payment_calendar
    return @education_calendar.questions if @section=='education_calendar' && @education_calendar
    []
  end

  def expansion_citations
    return GardenCalendar.sources.values.map{|source|source.fetch('url')} if @section=='garden_calendar'
    return [@payment_calendar.source.fetch('url')] if @section=='payment_calendar' && @payment_calendar
    return @education_calendar.sources.map{|source|source.fetch('url')} if @section=='education_calendar' && @education_calendar
    if @section=='astronomy_events'
      kind=AstronomySchedule::PATHS.key(page_path)
      return AstronomySchedule.new(kind:kind).sources.map(&:last)
    end
    []
  end

  def expansion_tool_features
    case @section
    when 'garden_calendar' then ['Pregled 16 vrtnin po mesecih in opravilih','Osebni setveni načrt v brskalniku','Tisk, varnostna kopija JSON in izvoz ICS']
    when 'payment_calendar' then ['Uradno objavljeni datumi izplačil','Filtri po prejemkih in mesecih','Koledar za tisk in izvoz ICS']
    when 'education_calendar' then ['Uradni roki z izbiro šole, razreda ali izpita','Seznam in dvanajstmesečni pregled','Osebni izbor datumov, tisk in izvoz ICS']
    when 'school_timetable' then ['Predmeti, ure, učilnice in učitelji','Opozorila ob prekrivanju ur','Tedensko ponavljanje, tisk, JSON in ICS']
    when 'moon_phases' then ['Lunine mene v času Europe/Ljubljana','Naslednji trenutek in letni pregled','Tisk in koledar ICS']
    when 'astronomy_events' then ['Lokalne razmere za osem slovenskih krajev','Prikaz nad obzorjem in časovni potek','Koledar za tisk in izvoz ICS']
    when 'calendar'
      return ['Izbira leta, meseca ali tedna ISO','Osebni zapiski','PDF in urejevalna preglednica XLSX'] if page_path=='/mesecni-koledar/'
      return ['Izbira datuma ali tedna ISO','Osebni zapiski za vsak dan','Tedenski planer za tisk in PDF'] if page_path=='/tedenski-koledar/'
      nil
    end
  end
end
