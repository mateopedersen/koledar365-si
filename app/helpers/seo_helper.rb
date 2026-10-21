module SeoHelper
  def site_origin = ENV.fetch("SITE_URL", "https://koledar365.si").delete_suffix("/")

  def seo_title
    title = @title.presence || "Slovenski koledar"
    title.include?("Koledar365") ? title : "#{title} · Koledar365"
  end

  def seo_photo
    return nil if @clock_change
    @observance&.photo || (@section=='holidays' ? HolidayPhotoCatalog.find('pust') : nil)
  end

  def seo_image
    return {url:site_origin+ClockChangeSchedule::IMAGE_PATH,width:1200,height:720,alt:ClockChangeSchedule::IMAGE_ALT} if @clock_change
    if @section=='lunar' && page_path.start_with?('/lunin-koledar/') && (2027..2030).cover?(@year.to_i)
      day=LunarCalendar.period(@year,@page.month).max_by { |d|d['illuminationFraction'] }
      return {url:site_origin+"/lunar/atlas/#{day['date'][0,7]}-cover.webp",width:768,height:768,alt:"Luna #{LunarCalendar.date_label(day['date'])} ob 12.00 po času v Sloveniji"}
    end
    photo=seo_photo
    return {url:site_origin+photo['local_path'],width:photo['width'],height:photo['height'],alt:photo['alt_sl']} if photo
    record=@person || @page
    return {url:"#{site_origin}/og.png",width:1200,height:630,alt:'Koledar365 – slovenski koledarji za leta 2027–2030'} unless record
    kind=@person ? 'names' : 'pages'
    {url:"#{site_origin}/druzabno/#{kind}/#{record.id}/#{SocialImage.key(record)}.png",width:1200,height:630,alt:@title}
  end

  def breadcrumbs
    return [] if page_path == "/" || @not_found
    rows = [["Domov", "/"]]
    parent = "/#{page_path.split("/").reject(&:blank?).first}/"
    record = Page.find_by(path: parent) if parent != page_path
    rows << [record.title, record.path] if record
    rows << ["Lunin koledar #{@page.year}", LunarCalendar.path(@page.year)] if @section=='lunar' && @page&.month && page_path.start_with?('/lunin-koledar/')
    rows << [@title, page_path]
    rows
  end

  def date_calculator_faq
    [
      ["Kako izračunam število dni med datumoma?", "Vnesite začetni in končni datum ter izberite »Razlika med datumoma«. Rezultat pokaže skupno število koledarskih dni, tedne in preostale dni. Če vključite oba izbrana dneva, se všteta tudi začetni in končni datum."],
      ["Kako kalkulator prišteje mesece?", "Meseci se prištevajo po koledarju. Če ciljni mesec nima izbranega dne, kalkulator uporabi zadnji dan ciljnega meseca. Tako se 31. januar pri prištevanju enega meseca premakne na zadnji dan februarja."],
      ["Kako se štejejo delovni dnevi v Sloveniji?", "V načinu »Delovni dnevi« izberete dneve tedna, dnevne ure in ali naj kalkulator izloči zakonsko dela proste praznike. Podatki za praznike so na voljo za leta 2027–2030."],
      ["Ali lahko rezultat delim?", "Da. Gumb »Kopiraj povezavo« ustvari povezavo z izbranimi datumi in nastavitvami. Za datumske izračune račun ni potreben."]
    ]
  end

  def structured_data
    return nil if @not_found || controller_name.in?(%w[admin exports]) || action_name == "search"
    graph = [
      { "@type" => "WebSite", "@id" => "#{site_origin}/#website", "url" => "#{site_origin}/",
        "name" => "Koledar365", "inLanguage" => "sl" },
      { "@type" => "WebPage", "@id" => "#{canonical_url}#webpage", "url" => canonical_url,
        "name" => @title, "description" => @description,
        "inLanguage" => "sl", "isPartOf" => { "@id" => "#{site_origin}/#website" } }
    ]
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
              "inLanguage" => "sl" } }
        } }
    end
    graph[1]['primaryImageOfPage']={"@id"=>"#{site_origin}#{seo_photo['local_path']}#image"} if seo_photo
    if @clock_change
      image_url=site_origin+ClockChangeSchedule::IMAGE_PATH
      graph << {"@type"=>"ImageObject","@id"=>"#{image_url}#image",
        "contentUrl"=>image_url,"url"=>image_url,"width"=>1200,"height"=>720,
        "name"=>'Premik ure v Sloveniji – poletni in zimski čas',
        "caption"=>ClockChangeSchedule::IMAGE_ALT,"inLanguage"=>'sl',
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
        "isAccessibleForFree" => true, "inLanguage" => "sl",
        "featureList" => ["Razlika med datumoma", "Prištevanje in odštevanje dni, tednov in mesecev",
          "Štetje delovnih dni in slovenskih praznikov", "Deljiva povezava do nastavitev"] }
      graph << { "@type" => "FAQPage", "@id" => "#{canonical_url}#faq",
        "mainEntity" => date_calculator_faq.map { |question, answer|
          { "@type" => "Question", "name" => question,
            "acceptedAnswer" => { "@type" => "Answer", "text" => answer } }
        } }
    end
    if @horoscope_guide
      graph << { "@type" => "WebApplication", "@id" => "#{canonical_url}#ascendent",
        "name" => "Izračun vzhajajočega znamenja (ascendenta) in sončnega znamenja", "url" => "#{canonical_url}#ascendent",
        "applicationCategory" => "LifestyleApplication", "operatingSystem" => "Any",
        "isAccessibleForFree" => true, "inLanguage" => "sl",
        "featureList" => ["Izračun po datumu, uri in kraju rojstva", "Časovni pasovi in premiki ure", "Obdelava rojstnih podatkov samo na napravi"] }
      if @horoscope_guide.profile && @horoscope_guide.edition_date
        graph << { "@type" => "Article", "@id" => "#{canonical_url}#dnevni-zapis",
          "headline" => @horoscope_guide.reading['title'], "inLanguage" => "sl",
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
        "isAccessibleForFree" => true, "inLanguage" => "sl",
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
    { "@context" => "https://schema.org", "@graph" => graph }
  end
end
