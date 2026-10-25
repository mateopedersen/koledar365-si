module ApplicationHelper
  include IllustrationHelper
  def gallery_page?
    %w[planner school_timetable name holidays].include?(@section) ||
      (@section == 'lunar' && !page_path.start_with?('/lunin-koledar/')) ||
      (@section == 'workdays' && CalendarEngine::INTERACTIVE_YEARS.include?(@year)) ||
      (@section == 'calendar' && @page&.year && CalendarEngine::INTERACTIVE_YEARS.include?(@year))
  end
  def gallery_description
    return 'Načrtujte družinski teden, delite pregled z domačimi v tem brskalniku in prenesite koledar PDF ali WebP, pripravljen pri 600 ppi.' if page_path == '/druzinski-planer/'
    return 'Izberite med 15 izvirnimi slovenskimi oblikovanji za tisk. Vsak koledar je na voljo kot vektorski PDF A3 CMYK FOGRA39 in WebP celotne strani v sRGB pri 600 dpi.' if @section == 'calendar' && @page&.path&.start_with?('/koledar/') && @year.to_i.between?(2027, 2030)
    'V galeriji izberite eno od 15 predlog: PDF za tisk in ujemajoči se WebP pri 600 ppi, s podpisom Koledar365 na vsaki strani. Večstranski WebP je v datoteki ZIP; PDF tiskajte v merilu 100 %.'
  end
  def page_path
    return @canonical if @canonical
    path=request&.path
    path.nil? || path=="/" ? "/" : path.delete_suffix("/")+"/"
  end
  def sl_date(d) = I18n.l(d.to_date,format: :long)
  def compact_day_month(date) = "#{date.day}.#{date.month}."
  def month_url(year,month,family='koledar') = "/#{family}/#{year}/#{CalendarEngine::MONTHS[month-1]}/"
  def calendar_path(date) = date.year==2026 ? "/?year=2026&month=#{date.month}&date=#{date.iso8601}" : month_url(date.year,date.month)
  CALENDAR_EVENT_COMPACT_TITLES = {
    'Dan slovenske hrane' => 'Hrana',
    'Dan slovenskega krvodajalstva' => 'Kri',
    'Dan slovenskega znakovnega jezika' => 'Znaki',
    'Dan človekovih pravic' => 'Prav.',
    'Evropski dan jezikov' => 'Jeziki',
    'Evropski dan spomina na žrtve totalitarnih in avtoritarnih režimov' => 'Spomin',
    'Mednarodni dan družin' => 'Druž.',
    'Mednarodni dan invalidov' => 'Inv.',
    'Mednarodni dan maternega jezika' => 'Mater.',
    'Mednarodni dan miru' => 'Mir',
    'Mednarodni dan mladih' => 'Mladi',
    'Mednarodni dan pismenosti' => 'Branje',
    'Mednarodni dan spomina na žrtve holokavsta' => 'Spomin',
    'Mednarodni dan starejših' => 'Star.',
    'Marijino vnebovzetje' => 'Marija',
    'Noč čarovnic' => 'Čarov.',
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
    'dan Primoža Trubarja' => 'Trubar',
    'dan Rudolfa Maistra' => 'Mais.',
    'dan Triglava' => 'Trig.',
    'dan državnosti' => 'Država',
    'dan reformacije' => 'Reform.',
    'dan samostojnosti in enotnosti' => 'Enotn.',
    'dan spomina na mrtve' => 'Spomin',
    'dan suverenosti' => 'Suver.',
    'dan upora proti okupatorju' => 'Upor',
    'dan znanosti' => 'Znan.',
    'novo leto' => 'Novo',
    'praznik dela' => 'Delo',
    'binkoštna nedelja, binkošti' => 'Bink.',
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
    'Materinski dan' => 'Mati.',
    'Cvetna nedelja' => 'Cvetna',
    'Veliki petek' => 'Petek',
    'Svetovni dan Zemlje' => 'Zemlja',
    'Dan Evrope' => 'Evropa',
    'Svetovni dan čebel' => 'Čebele',
    'Advent' => 'Advent',
    'Martinovo' => 'Martin',
    'Miklavž' => 'Miklavž',
    'Silvestrovo' => 'Silv.',
    'Pomladno enakonočje' => 'Pomlad',
    'Poletni solsticij' => 'Poletje',
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
    return title if graphemes.length <= 7
    "#{graphemes.first(6).join}…"
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
    candidates=["/prazniki/#{event.slug}/","/pomembni-dnevi/#{event.slug}/","/letni-casi/#{event.slug}/"]
    candidates.find { |s| @all_page_paths.include?(s) } || "/pomembni-dnevi/#{event.on.year}/"
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
