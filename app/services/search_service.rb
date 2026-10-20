class SearchService
  def self.call(query)
    return [] if query.blank?
    f=PersonName.fold(query);tokens=f.split
    pages=Page.where.not(status:'held').filter_map do |p|
      hay=PersonName.fold(p.title+' '+p.path)
      score=tokens.count { |w| hay.include?(w) }
      next if score==0
      {title:p.title,path:p.path,type:'Koledar in orodja',score:score*10-(p.path.count('/')/10.0)}
    end
    aliases={'lunine mene'=>'/lunine-mene/','polna luna'=>'/polna-luna/','izracun znamenja'=>'/horoskop/izracun-znamenja/'}
    if aliases[f]
      p=Page.find_by(path:aliases[f]);pages.unshift({title:p.title,path:p.path,type:'Orodje',score:100}) if p
    end
    names=PersonName.search(query).limit(25).map { |n| {title:"Ime: #{n.exact}",path:n.path,type:'Koledar z imenom',score:n.exact==query ? 200 : (n.folded==f ? 150 : 5)} }
    (pages+names).sort_by { |v| -v[:score] }.uniq { |r|r[:path] }.first(50)
  end
end
