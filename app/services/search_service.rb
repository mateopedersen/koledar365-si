class SearchService
  def self.call(query)
    return [] if query.blank?
    f=PersonName.fold(query);tokens=f.split
    pages=Page.published.reject { |p| p.path.match?(PagesController::REMOVED_NAME_PATHS) || PublicPagePolicy.redirect(p.path) }.filter_map do |p|
      hay=PersonName.fold(p.title+' '+p.path)
      score=tokens.count { |w| hay.include?(w) }
      next if score==0
      {title:p.title,path:p.path,type:'Koledar in orodja',score:score*10-(p.path.count('/')/10.0)}
    end
    pages.concat(OccasionCatalog.festivals.filter_map do |festival|
      title=festival.fetch('title')
      hay=PersonName.fold([title,festival.fetch('place'),OccasionCatalog::KINDS.fetch(festival.fetch('kind')),
        *festival.fetch('editions').map { |edition| edition.fetch('start') }].join(' '))
      score=tokens.count { |word| hay.include?(word) }
      next if score==0
      {title:title,path:OccasionCatalog.festival_path(festival.fetch('slug')),type:'Festivali in prireditve',score:score*10}
    end)
    aliases={'lunine mene'=>'/lunine-mene/','polna luna'=>'/polna-luna/','izracun znamenja'=>'/horoskop/izracun-znamenja/'}
    if aliases[f]
      p=Page.find_by(path:aliases[f]);pages.unshift({title:p.title,path:p.path,type:'Orodje',score:100}) if p
    end
    pages.sort_by { |v| -v[:score] }.uniq { |r|r[:path] }.first(50)
  end
end
