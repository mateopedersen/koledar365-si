module ApplicationHelper
  include IllustrationHelper

  def site_operator_name = 'Filip Horvat'

  def legacy_lunar_gallery?
    @section == 'lunar' && (!page_path.start_with?(LunarCalendar.path) ||
      (page_path != LunarCalendar.path && !LunarCalendar::YEARS.cover?(@year.to_i)))
  end

  def gallery_page?
    %w[planner school_timetable name holidays].include?(@section) ||
      legacy_lunar_gallery? ||
      (@section == 'workdays' && CalendarEngine::INTERACTIVE_YEARS.include?(@year)) ||
      (@section == 'calendar' && @page&.year && CalendarEngine::INTERACTIVE_YEARS.include?(@year))
  end
  def gallery_description
    return 'Preverite datume luninih men in čas v Sloveniji. Med predlogami izberite koledar za tisk v obliki PDF ali sliko pri 600 ppi.' if legacy_lunar_gallery?
    return 'Načrtujte družinski teden, delite pregled z domačimi v tem brskalniku in prenesite koledar PDF ali sliko, pripravljen pri 600 ppi.' if page_path == '/druzinski-planer/'
    'V galeriji izberite eno od 15 predlog: PDF za tisk in ujemajočo se sliko pri 600 ppi, s podpisom Koledar365 na vsaki strani. Večstranski slikovni izvoz je v datoteki ZIP; PDF tiskajte v merilu 100 %.'
  end
  def page_path
    return @canonical if @canonical
    path=request&.path
    path.nil? || path=="/" ? "/" : path.delete_suffix("/")+"/"
  end
  def editorial_route_title(route)
    if (match = route.match(%r{\A/soncni-vzhod-in-zahod/([a-z0-9-]+)/\z}))
      return "Sončni vzhod in zahod – #{SunEngine::CITIES.fetch(match[1]).first}"
    end
    return 'Fotografije in licence' if route == '/fotografije-in-licence/'

    @editorial_route_titles ||= Page.pluck(:path, :title).to_h
    @editorial_route_titles.fetch(route)
  end

  def editorial_recommendation(route)
    @editorial_tools ||= ToolsDirectory::GROUPS.values.flat_map(&:last).index_by(&:first)
    tool = @editorial_tools[route]
    icon = case route.split('/')[1]
    when 'horoskop' then route == '/horoskop/izracun-znamenja/' ? 'compass' : 'zodiac'
    when 'lunin-koledar', 'lunine-mene', 'lunin-vzhod-in-zahod', 'polna-luna', 'mlaj', 'lunin-mrk' then 'moon'
    when 'soncni-vzhod-in-zahod', 'soncni-mrk', 'dolzina-dneva', 'letni-casi' then 'sun'
    when 'prazniki', 'pomembni-dnevi', 'festivali' then 'holidays'
    when 'delovni-dnevi', 'razpored-izmen', 'izplacila-pokojnin', 'izplacila-socialnih-transferjev' then 'briefcase'
    when 'datumski-kalkulator', 'kalkulator-delovnih-dni', 'kalkulator-upokojitve' then 'calculator'
    when 'podaljsani-vikendi', 'nacrtovalnik-dopusta' then 'vacation'
    when 'stevilka-tedna', 'tedenski-koledar' then 'week'
    when 'premik-ure', 'odstevanje' then 'clock'
    when 'matura', 'npz', 'studijski-koledar', 'vpisni-koledar', 'solski-koledar', 'solski-urnik', 'solske-pocitnice' then 'school'
    when 'koledar-za-tiskanje' then 'print'
    when 'blog' then 'note'
    when 'setveni-koledar' then 'sprout'
    when 'perzeidi' then 'star'
    when 'zasebnost', 'piskotki', 'pogoji-uporabe' then 'shield'
    when 'fotografije-in-licence' then 'image'
    when 'viri-in-metodologija', 'uredniska-politika', 'kontakt' then 'info'
    else 'calendar'
    end

    [route, tool ? tool[1] : editorial_route_title(route), tool&.last, icon]
  end

  def editorial_paragraph(paragraph)
    parts = []
    offset = 0
    paragraph.scan(%r{\[([^\]\n]+)\]\((/(?:[a-z0-9-]+/)*|@[a-z0-9-]+)\)}) do |label, target|
      match = Regexp.last_match
      parts << paragraph[offset...match.begin(0)]
      destination = target.start_with?('@') ? EditorialCatalog.sources.fetch(target.delete_prefix('@')).last : target
      parts << link_to(label, destination)
      offset = match.end(0)
    end
    parts << paragraph[offset..]
    safe_join(parts)
  end

  def editorial_date(article)
    date = Date.iso8601(article.fetch('editorial_date'))
    tag.time(date.strftime('%-d. %-m. %Y'), datetime: date.iso8601)
  end

  def sl_date(d) = I18n.l(d.to_date,format: :long)
  def compact_day_month(date) = "#{date.day}.#{date.month}."
  def month_url(year,month,family='koledar') = "/#{family}/#{year}/#{CalendarEngine::MONTHS[month-1]}/"
  def calendar_path(date) = date.year==2026 ? "/?year=2026&month=#{date.month}&date=#{date.iso8601}" : month_url(date.year,date.month)
  CALENDAR_EVENT_COMPACT_TITLES = {
    'Dan slovenske hrane' => 'Hrana',
    'Dan slovenskega krvodajalstva' => 'Kri',
    'Dan slovenskega znakovnega jezika' => 'Znaki',
    'Dan človekovih pravic' => 'Pravice',
    'Evropski dan jezikov' => 'Jeziki',
    'Evropski dan spomina na žrtve totalitarnih in avtoritarnih režimov' => 'Spom.',
    'Mednarodni dan družin' => 'Družine',
    'Mednarodni dan invalidov' => 'Inv.',
    'Mednarodni dan maternega jezika' => 'Mater.',
    'Mednarodni dan miru' => 'Mir',
    'Mednarodni dan mladih' => 'Mladi',
    'Mednarodni dan pismenosti' => 'Branje',
    'Mednarodni dan spomina na žrtve holokavsta' => 'Spom.',
    'Mednarodni dan starejših' => 'Star.',
    'Marijino vnebovzetje' => 'Marija',
    'Noč čarovnic' => 'Čar.',
    'Prešernov dan, slovenski kulturni praznik' => 'Preš.',
    'Spomin vseh vernih rajnih' => 'Rajni',
    'Svetovni dan hrane' => 'Hrana',
    'Svetovni dan knjige in avtorskih pravic' => 'Knjiga',
    'Svetovni dan okolja' => 'Okolje',
    'Svetovni dan otrok' => 'Otroci',
    'Svetovni dan učiteljev' => 'Učit.',
    'Svetovni dan voda' => 'Voda',
    'Svetovni dan živali' => 'Živali',
    'Ta veseli dan kulture' => 'Kult.',
    'Teden otroka®' => 'Teden',
    'Dan slovenskega športa' => 'Šport',
    'Dan Maribora – praznik Mestne občine Maribor' => 'Marib.',
    'December v Ljubljani' => 'Dec.',
    'dan Primoža Trubarja' => 'Trubar',
    'dan Rudolfa Maistra' => 'Mais.',
    'dan Triglava' => 'Trig.',
    'dan državnosti' => 'Država',
    'dan reformacije' => 'Reform',
    'dan samostojnosti in enotnosti' => 'Enot.',
    'dan spomina na mrtve' => 'Spom.',
    'dan suverenosti' => 'Suver.',
    'dan upora proti okupatorju' => 'Upor',
    'dan znanosti' => 'Znan.',
    'novo leto' => 'Novo',
    'praznik dela' => 'Delo',
    'binkoštna nedelja, binkošti' => 'Binkoš.',
    'velikonočna nedelja' => 'V. noč',
    'velikonočni ponedeljek' => 'V. noč',
    'vrnitev Primorske k matični domovini' => 'Prim.',
    'združitev prekmurskih Slovencev z matičnim narodom' => 'Prekm.',
    'Velikonočna nedelja in ponedeljek, velika noč' => 'V. noč',
    'Božič' => 'Božič',
    'Sveti trije kralji' => 'Kralji',
    'Valentinovo' => 'Val.',
    'Pust' => 'Pust',
    'Dan žena' => 'Žena',
    'Gregorjevo' => 'Greg.',
    'Materinski dan' => 'Mater.',
    'Cvetna nedelja' => 'Cvetna',
    'Veliki petek' => 'Petek',
    'Svetovni dan Zemlje' => 'Zemlja',
    'Dan Evrope' => 'Evrop.',
    'Svetovni dan čebel' => 'Čebele',
    'Advent' => 'Adv.',
    'Martinovo' => 'Martin',
    'Miklavž' => 'Miklavž',
    'Silvestrovo' => 'Silv.',
    'Pomladno enakonočje' => 'Pomlad',
    'Poletni solsticij' => 'Polet.',
    'Jesensko enakonočje' => 'Jesen',
    'Zimski solsticij' => 'Zima',
    'Premik ure' => 'Ura',
  }.transform_keys { |title| title.sub(/\A./, &:upcase) }.freeze

  def calendar_event_compact_title(event)
    title = event.title
    normalized_title = title.sub(/\A./, &:upcase)
    compact_title = CALENDAR_EVENT_COMPACT_TITLES[normalized_title]
    return compact_title if compact_title

    # Calendar sources include editorial observances as well as legal holidays.
    # Bound any future unmapped title so a narrow day cell can never become a paragraph.
    graphemes = normalized_title.scan(/\X/)
    return title if graphemes.length <= 5
    "#{graphemes.first(4).join}…"
  end

  # Keep the visible compact label in the accessible name while preserving
  # every event's exact full title for screen readers.
  def calendar_event_accessible_title(event)
    title = event.title
    compact_title = calendar_event_compact_title(event)
    compact_title == title ? title : "#{compact_title} – #{title}"
  end

  def canonical_url
    site_origin+page_path
  end
  def event_path(event)
    return OccasionCatalog.festival_path(event.slug) if event.category=='festival'
    candidates=["/prazniki/#{event.slug}/","/pomembni-dnevi/#{event.slug}/","/letni-casi/#{event.slug}/"]
    candidates.find { |s| @all_page_paths.include?(s) } || "/pomembni-dnevi/#{event.on.year}/"
  end
  def occasion_date_label(first, last = first)
    return I18n.l(first) if first == last
    return "#{first.day}.–#{I18n.l(last)}" if first.year == last.year && first.month == last.month
    "#{I18n.l(first)}–#{I18n.l(last)}"
  end

  def festival_photo_label(photo)
    { 'dogodek' => 'Arhiv prireditve', 'prizorisce' => 'Prizorišče', 'kraj' => 'Fotografija kraja',
      'motiv' => 'Fotografija iz okolice' }.fetch(photo.fetch('kind'))
  end
  def page_links(prefix)
    Page.where('path LIKE ?',"#{prefix}%").order(:path)
  end
  def calendar_month(year,month,mini:false)
    render 'pages/month',year:year,month:month,mini:mini
  end
  def export_options(type='annual')
    year=CalendarEngine::INTERACTIVE_YEARS.include?(@year) ? @year : 2027
    date=@selected&.year==year ? @selected : Date.new(year,@month||1,1)
    values={type:type,year:year,month:@month||1,date:date.iso8601,name:@person&.exact.to_s}
    values[:lunar_scope]='year' if type=='lunar' && !@page&.month
    values[:workday_scope]=@page&.month ? 'month' : 'year' if type=='workdays'
    values
  end
  def source_link(url,label='Vir')
    link_to(label,url,rel:'noopener') if url.present? && url.start_with?('https://')
  end
end
