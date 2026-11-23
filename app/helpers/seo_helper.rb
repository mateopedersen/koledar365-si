module SeoHelper
  def site_origin = ENV.fetch("SITE_URL", "https://koledar365.si").delete_suffix("/")

  def seo_title = "#{seo_page_title} | Koledar365"

  def seo_page_title
    return "#{SunEngine::CITIES.fetch(@sun_city_id).first}: sončni vzhod in zahod" if @sun_city_id
    return "#{@title} s 15 predlogami PDF za tisk" if @calendar_collection_designs
    return "#{@title} za tisk in prenos" if @calendar_collection
    return "Izdelava koledarja s fotografijami in izvozom PDF" if page_path == "/ustvari-koledar/"
    return "Predloge koledarjev PDF za tiskanje v formatih A4, A3 in A5" if page_path == "/koledar-za-tiskanje/"
    return "#{@title}: datumi 2027–2030" if @observance && !@clock_change
    return "Današnji horoskop za vseh 12 znamenj" if page_path == "/horoskop/"
    if @horoscope_guide&.profile
      return "Dnevni horoskop za #{@horoscope_guide.sign_editorial.fetch('accusative')}"
    end
    return "Prestopno leto: kalkulator in pravilo 29. februarja" if page_path == "/prestopno-leto/"

    title = (@title.presence || "Slovenski koledar").sub(/ +[·|] +Koledar365\z/, "")
    subject, detail = title.split(" – ", 2)
    return title unless detail

    case subject
    when "Koledar", "Lunin koledar", "Delovni dnevi in ure", "Pomembni dnevi"
      "#{subject} za #{detail}"
    when "Sončni vzhod in zahod"
      "#{detail}: sončni vzhod in zahod"
    when "Ustvari svoj koledar"
      "Spletni urejevalnik za izdelavo koledarja"
    else
      detail == "dnevni horoskop" ? "#{subject}: dnevni horoskop" : title
    end
  end

  def seo_photo
    return nil if @clock_change
    @observance&.photo || (@section=='holidays' ? HolidayPhotoCatalog.find('pust') : nil)
  end

  def seo_image
    if @festival || @section == 'festivals'
      image = OccasionCatalog.festival_photo(@festival || OccasionCatalog.festival('kurentovanje'))
      return { url: site_origin + image.fetch('local_path'), width: image.fetch('width'),
        height: image.fetch('height'), alt: image.fetch('alt') }
    end
    if @blog_article
      slug = page_path.delete_prefix(EditorialCatalog::HUB).delete_suffix('/')
      return {url: site_origin + EditorialCatalog.image(slug), width: 1200, height: 630, alt: @blog_article.fetch('image_alt')}
    end
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
    return {url:"#{site_origin}/og.png",width:1200,height:630,alt:'Slovenski koledarji in orodja Koledar365'} unless record
    kind=@person ? 'names' : 'pages'
    {url:"#{site_origin}/druzabno/#{kind}/#{record.id}/#{SocialImage.key(record)}.png",width:1200,height:630,alt:@title}
  end

  def breadcrumbs
    return [] if page_path == "/" || @not_found
    rows = [["Domov", "/"]]
    if (resource = SlovenianResources::PAGES[page_path])
      return rows + [['Orodja', '/orodja/'], [resource.fetch(:name), page_path]]
    end
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
        "name" => "Koledar365", "alternateName" => "koledar365.si", "inLanguage" => "sl-SI" },
      { "@type" => "WebPage", "@id" => "#{canonical_url}#webpage", "url" => canonical_url,
        "name" => seo_page_title, "description" => @description,
        "inLanguage" => "sl-SI", "isPartOf" => { "@id" => "#{site_origin}/#website" } }
    ]
    organization={"@type"=>"Organization","@id"=>"#{site_origin}/#organization","name"=>"Koledar365","url"=>"#{site_origin}/","email"=>"koledar365@gmail.com"}
    graph << organization
    graph[0]['publisher']={"@id"=>organization.fetch('@id')}
    graph[1]['publisher']={"@id"=>organization.fetch('@id')}
    if @blog_article
      photo = @blog_article.fetch('photo')
      image = seo_image
      image_id = "#{image.fetch(:url)}#image"
      graph << {
        '@type' => 'ImageObject', '@id' => image_id, 'contentUrl' => image.fetch(:url),
        'caption' => @blog_article.fetch('image_alt'), 'width' => image.fetch(:width), 'height' => image.fetch(:height),
        'creditText' => photo.fetch('credit'), 'license' => photo.fetch('license_url'), 'isBasedOn' => photo.fetch('source')
      }
      graph[1]['primaryImageOfPage'] = {'@id' => image_id}
      graph << {
        '@type' => 'BlogPosting', '@id' => "#{canonical_url}#article", 'mainEntityOfPage' => canonical_url,
        'headline' => @title, 'description' => @description, 'image' => {'@id' => image_id}, 'inLanguage' => 'sl-SI',
        'author' => {'@type' => 'Person', 'name' => site_operator_name, 'url' => site_origin + EditorialCatalog::AUTHOR_PATH},
        'publisher' => {'@id' => organization.fetch('@id')},
        'citation' => @blog_article.fetch('sources').map { |key| EditorialCatalog.sources.fetch(key).last }
      }
    end
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
      if page_path == LunarPhaseGuide::PATH
        graph.last.merge!('license'=>illustration.fetch('license_url'), 'acquireLicensePage'=>site_origin+LunarPhaseGuide::LICENSES_PATH)
      elsif page_path == SlovenianSkyCalendar::PATH
        graph.last.merge!('license'=>illustration.fetch('license_url'), 'isBasedOn'=>illustration.fetch('source'))
      end
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
    if @calendar_collection_designs
      graph << { "@type" => "ItemList", "name" => @title, "numberOfItems" => @calendar_collection_designs.size,
        "itemListElement" => @calendar_collection_designs.each_with_index.map { |row, index|
          image = row.fetch('collection_seo')
          { "@type" => "ListItem", "position" => index + 1,
            "item" => { "@type" => "ImageObject", "name" => "#{@title} (#{image.fetch('design_name')})",
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
      graph << { "@type" => "FAQPage", "@id" => "#{canonical_url}#faq", "mainEntity" => studio_faq.map { |question, answer|
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
    if page_path == LunarPhaseGuide::NEW_MOON_PATH
      return ['https://aa.usno.navy.mil/data/MoonPhases', 'https://aa.usno.navy.mil/faq/crescent', 'https://science.nasa.gov/eclipses/geometry/', 'https://science.nasa.gov/earth/earth-observatory/earthshine-83782/']
    end
    return ['https://aa.usno.navy.mil/data/MoonPhases', 'https://science.nasa.gov/moon/moon-phases/'] if page_path == LunarPhaseGuide::PATH
    return GardenCalendar.sources.values.map{|source|source.fetch('url')} if @section=='garden_calendar'
    if @section == 'payment_calendar' && @payment_calendar
      return [@payment_calendar.source.fetch('url'), *@payment_calendar.current_sources.map(&:last)].uniq
    end
    return @education_calendar.sources.map{|source|source.fetch('url')} if @section=='education_calendar' && @education_calendar
    if @section == 'slovenian_resource'
      return SlovenianResources::PAGES.fetch(page_path).fetch(:sources).map(&:last)
    end
    if @section=='astronomy_events'
      kind=AstronomySchedule::PATHS.key(page_path)
      return AstronomySchedule.new(kind:kind).sources.map(&:last)
    end
    []
  end

  def studio_faq
    [
      ['Kako izdelam koledar s svojo fotografijo?', 'V zavihku Fotografije naložite JPG, PNG ali WebP do 20 MB. Za glavno fotografijo izberite pas v glavi ali ozadje. Za logotip dodajte samostojno sliko in ji v zavihku Elementi nastavite položaj.'],
      ['Ali se lahko teden začne v nedeljo?', 'Da. V zavihku Postavitev izberite nedeljo ali ponedeljek. Za urnik, ki uporablja številke tednov ISO, je najpreglednejša postavitev s ponedeljkom v prvem stolpcu.'],
      ['Kako shranim koledar za poznejše urejanje?', 'Osnutek se shranjuje v tem brskalniku, ko je shramba na voljo. Za prenos med napravami v meniju Projekt izberite Shrani projekt (.json), nato na drugi napravi izberite Odpri projekt.'],
      ['Kako prenesem vseh 12 mesecev za tisk?', 'Izberite mesečno postavitev. V možnosti Prenesi koledar nastavite obseg PDF na Vseh 12 mesecev in prenesite PDF za tisk. Izvoz PNG ali SVG pripravi trenutno prikazani list.'],
      ['Kako se obdelajo moje fotografije?', 'Studio obdela fotografije v brskalniku. Fotografije se vključijo v shranjeni projekt JSON in v izvoz, če so del postavitve lista. Pred deljenjem preverite izbrano datoteko.']
    ]
  end

  def expansion_tool_features
    case @section
    when 'garden_calendar' then ['Pregled 16 vrtnin po mesecih in opravilih','Osebni setveni načrt v brskalniku','Tisk, varnostna kopija JSON in izvoz ICS']
    when 'payment_calendar' then ['Mesečni pregled za leto 2027','Uradno objavljeni termini in izvoz ICS','Pogoji in uradne vloge']
    when 'education_calendar' then ['Uradni roki z izbiro šole, razreda ali izpita','Seznam in dvanajstmesečni pregled','Osebni izbor datumov, tisk in izvoz ICS']
    when 'school_timetable' then ['Predmeti, ure, učilnice in učitelji','Opozorila ob prekrivanju ur','Tedensko ponavljanje, tisk, JSON in ICS']
    when 'moon_phases' then ['Lunine mene v času Europe/Ljubljana','Naslednji trenutek in letni pregled','Tisk in koledar ICS']
    when 'astronomy_events' then ['Lokalne razmere za osem slovenskih krajev','Prikaz nad obzorjem in časovni potek','Koledar za tisk in izvoz ICS']
    when 'slovenian_resource'
      return ['Filtriranje astronomskih dogodkov po letu, mesecu in vrsti', 'Krajevni čas Slovenije in povezave do vidnosti po krajih'] if page_path == SlovenianSkyCalendar::PATH
      return ['Delovni, šolski ali tedenski razpored', 'Izbirni datum tedna in tisk v PDF'] if page_path == '/predloge-urnikov/'
      resource = SlovenianResources::PAGES.fetch(page_path)
      [resource.fetch(:action)] if resource[:calculator]
    when 'calendar'
      return ['Izbira leta in meseca','Tedni ISO in dela prosti dnevi','Osebni zapiski','PDF in urejevalna preglednica XLSX'] if page_path=='/mesecni-koledar/'
      return ['Izbira datuma ali tedna ISO','Osebni zapiski za vsak dan','Tedenski planer za tisk in PDF'] if page_path=='/tedenski-koledar/'
      nil
    end
  end
end
