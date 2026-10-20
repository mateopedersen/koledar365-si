module SeoHelper
  def site_origin = ENV.fetch("SITE_URL", "https://koledar365.si").delete_suffix("/")

  def seo_title
    title = @title.presence || "Slovenski koledar"
    title.include?("Koledar365") ? title : "#{title} · Koledar365"
  end

  def seo_photo
    @observance&.photo || (@section=='holidays' ? HolidayPhotoCatalog.find('pust') : nil)
  end

  def seo_image
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
    photos.concat(@observance.related.map { |event|HolidayPhotoCatalog.find(event.slug) }) if @observance
    photos.concat(@holiday_photos) if @holiday_photos
    photos.compact.uniq { |photo|photo['local_path'] }.each do |photo|
      graph << {"@type"=>"ImageObject","@id"=>"#{site_origin}#{photo['local_path']}#image",
        "contentUrl"=>"#{site_origin}#{photo['local_path']}","caption"=>photo['caption_sl'],
        "width"=>photo['width'],"height"=>photo['height'],"creditText"=>photo['author'],
        "license"=>photo['license_url'],"acquireLicensePage"=>photo['source']}
    end
    graph[1]['primaryImageOfPage']={"@id"=>"#{site_origin}#{seo_photo['local_path']}#image"} if seo_photo
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
    { "@context" => "https://schema.org", "@graph" => graph }
  end
end
