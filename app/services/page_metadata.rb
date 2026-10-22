class PageMetadata
  # Describe the actual tool/data on a page; do not append lists of SEO keywords.
  def self.description(page, year:)
    return ExpansionCatalog.page(page.path).fetch(:description) if ExpansionCatalog.page(page.path)
    return ClockChangeSchedule::DESCRIPTION if page.path=='/premik-ure/'
    return 'Ustvarite svoj letni ali mesečni koledar z imenom, fotografijami, logotipom in dogodki. Prilagodite pisave, barve in začetek tedna ter prenesite PDF, PNG ali SVG.' if page.path=='/ustvari-koledar/'
    return 'Pogoji uporabe Koledar365 pojasnjujejo rabo koledarjev in orodij, navajanje virov, avtorske pravice, omejitve podatkov ter prijavo napak.' if page.path=='/pogoji-uporabe/'
    return page.description if page.description.present?
    path = page.path
    fixed = JSON.parse(Rails.root.join("data/page_descriptions_sl.json").read)
    return fixed[path] if fixed.key?(path)
    period = page.month ? "#{CalendarEngine::MONTHS.fetch(page.month - 1)} #{year}" : year.to_s
    topic = TopicContent.find(path.split("/").last)
    return topic.split(/(?<=\.)\s+/).first(2).join(" ") if topic

    case path
    when %r{\A/koledar/}
      "Slovenski koledar za #{period}: datumi, številke tednov ISO in označeni dela prosti dnevi. Izberite prikaz ter prenesite koledar za tiskanje."
    when %r{\A/tedenski-koledar/}
      "Tedenski koledar #{year} s ponedeljkom na začetku tedna, številkami ISO in slovenskimi prazniki. Pripravite pregled za tiskanje."
    when %r{\A/lunin-koledar/}
      "Lunine mene za #{period}: mlaj, prvi krajec, polna luna in zadnji krajec. Natančni trenutki v slovenskem času iz podatkov USNO."
    when %r{\A/delovni-dnevi/}
      "Delovni dnevi in ure za #{period} v Sloveniji. Pregled po mesecih upošteva ponedeljek–petek, osemurni delovnik in zakonske dela proste dneve."
    when %r{\A/podaljsani-vikendi/}
      "Podaljšani vikendi #{year} v Sloveniji: primerjajte praznike, porabljene dni dopusta in skupno dolžino oddiha."
    when %r{\A/prazniki/}
      "Prazniki v Sloveniji za leto #{year}, z datumi in dnevi v tednu. Jasna ločitev državnih praznikov in zakonskih dela prostih dni."
    when %r{\A/pomembni-dnevi/}
      "Pomembni dnevi za #{period}: slovensko izročilo, mednarodni dnevi in obeležitve. Preverite datume, pravni status in izvirne vire."
    when %r{\A/solske-pocitnice/}
      "#{page.title}: objavljeni datumi in regionalne razlike po uradnem šolskem koledarju. Nepotrjeni termini so posebej označeni."
    when %r{\A/soncni-vzhod-in-zahod/}
      "#{page.title}: izberite datum in izračunajte krajevni čas vzhoda, zahoda ter dolžino dneva."
    when %r{\A/horoskop/}
      "#{page.title}. Preberite razvedrilno besedilo z datumom objave. Če današnje besedilo še ni objavljeno, je to jasno označeno."
    else
      page.description.presence || "#{page.title} – podatki, navodila in povezave za načrtovanje v Sloveniji."
    end
  end

  def self.name_description(person)
    "Koledar z imenom #{person.exact} za leta 2027–2030: 15 predlog PDF in WebP, izbira barv in podatki o pogostosti imena iz zbirke SURS."
  end
end
