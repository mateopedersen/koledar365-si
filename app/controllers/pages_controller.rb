class PagesController < ApplicationController
  REMOVED_NAME_PATHS = %r{\A/(?:koledar-z-imenom|imena)(?:/|\z)}
  before_action :context
  def context
    @all_page_paths=Page.pluck(:path).to_set
    @today=Time.zone.today
    @year=params[:year].to_i.nonzero? || 2027
    @year=2027 unless (2026..2030).cover?(@year)
    @year=2027 if request.path=='/prazniki/' && !CalendarEngine::YEARS.include?(@year)
    @month=params[:month].to_i.clamp(1,12)
  end
  def show
    path=request.original_fullpath.split('?').first;path='/' if path.blank?
    raise ActiveRecord::RecordNotFound if path.match?(REMOVED_NAME_PATHS)
    return redirect_to("#{path}/",status: :moved_permanently) unless path.end_with?('/')
    @canonical=path
    @person=PersonName.find_by!(slug:path.split('/')[2]) if path.start_with?('/koledar-z-imenom/')&&path.split('/').length==3
    sun_city_match=path.match(%r{\A/soncni-vzhod-in-zahod/([a-z0-9-]+)/\z})
    @sun_city_id=sun_city_match[1] if sun_city_match && SunEngine.city?(sun_city_match[1])
    @page=@person ? nil : Page.find_by(path:path)
    raise ActiveRecord::RecordNotFound unless @page || @person || @sun_city_id
    @noindex=if @sun_city_id
      false
    else
      (@person ? @person.status : @page.status)!='published'
    end
    @title=if @person
      "Koledar z imenom #{@person.exact}"
    elsif @sun_city_id
      "Sončni vzhod in zahod – #{SunEngine::CITIES.fetch(@sun_city_id).first}"
    else
      @page.title
    end
    @title='Ustvari svoj koledar – spletni urejevalnik' if path=='/ustvari-koledar/'
    @title=ExpansionCatalog.page(path).fetch(:title) if ExpansionCatalog.page(path)
    if %w[/ /mesecni-koledar/ /tedenski-koledar/].include?(path)
      @year=params[:year].present? ? @year : @today.year.clamp(2026,2030)
      @month=params[:month].present? ? @month : @today.month
    elsif path=='/delovni-dnevi/'
      @year=params[:year].present? ? @year : @today.year.clamp(2026,2030)
    elsif @page
      @year=@page.year if @page.year.to_i.between?(2026,2030)
      @month=@page.month if @page.month
    end
    if path=='/prazniki/'
      @year=CalendarEngine::YEARS.include?(params[:year].to_i) ? params[:year].to_i : 2027
    end
    @description=if @person
      PageMetadata.name_description(@person)
    elsif @sun_city_id
      city_name=SunEngine::CITIES.fetch(@sun_city_id).first
      "Preverite sončni vzhod in zahod, zlato uro ter dolžino dneva za mesto #{city_name}. Izberite datum in si oglejte izračunano pot Sonca po lokalnem času."
    else
      PageMetadata.description(@page,year:@year)
    end
    if path=='/premik-ure/'
      @clock_change=ClockChangeSchedule.new
      @title=ClockChangeSchedule::TITLE
    end
    @selected=Date.iso8601(params[:date].to_s) rescue nil
    if path=='/'
      @selected=nil if @selected && !(@selected.between?(Date.new(2026,1,1),Date.new(2030,12,31)))
      @year,@month=@selected.year,@selected.month if @selected
    end
    if path.start_with?('/tedenski-koledar/') && @selected&.between?(Date.new(2026,1,1),Date.new(2030,12,31))
      @year,@month=@selected.year,@selected.month
    end
    @selected||=(@today.year==@year&&@today.month==@month ? @today : Date.new(@year,@month,1))
    @view=%w[month week day list year].include?(params[:view]) ? params[:view] : (path.match?(%r{^/koledar/\d{4}/$}) ? 'year':'month')
    range_start=[Date.new(@year,1,1),@selected-(@selected.cwday-1)].min
    range_end=[Date.new(@year,12,31),@selected+(7-@selected.cwday)].max
    @events=CalendarEvent.where(on:range_start..range_end).ordered.to_a
    (range_start.year..range_end.year).each do |year|
      CalendarEngine.statutory_work_free_events(year).each do |attributes|
        next unless attributes[:on].between?(range_start,range_end)
        @events<<CalendarEvent.new(attributes) unless @events.any?{|event|event.key==attributes[:key]}
      end
    end
    @event_map=@events.group_by(&:on)
    @upcoming=CalendarEvent.where(on:@today..).where(category:'legal').ordered.limit(3)
    @section=section_for(path)
    @education_calendar=EducationCalendar.new(path:path) if @section=='education_calendar'
    @payment_calendar=PaymentCalendar.new(path:path,today:@today) if @section=='payment_calendar'
    @horoscope_guide=HoroscopeGuide.new(@today,path.split('/')[2].to_s) if @section=='horoscope'
    if @section=='events' && CalendarEvent.exists?(slug:path.split('/').last)
      @observance=ObservancePage.new(path.split('/').last)
      @section='observance'
    end
    if @section=='holidays'
      @holidays=HolidayYear.new(@year)
      @holiday_kind=HolidayYear::KINDS.include?(params[:kind]) ? params[:kind] : 'all'
      @holiday_month=params[:month].to_i.between?(1,12) ? params[:month].to_i : 0
      @holiday_query=params[:q].to_s.first(100)
      @filtered_holidays=@holidays.filter(month:@holiday_month,kind:@holiday_kind,query:@holiday_query)
      @holiday_comparison=CalendarEngine::YEARS.map { |year| year==@year ? @holidays : HolidayYear.new(year) }
      @holiday_breaks=@holidays.breaks
    end
    if @section=='names' && params[:page].to_i>1
      number=params[:page].to_i.clamp(1,86)
      @canonical="#{path}?page=#{number}"
      @title+=" – stran #{number}"
      @description+=" Stran #{number} seznama imen."
    end
    @designs=PrintCatalog.designs
    @countdown_events=CountdownCatalog.events(today:@today) if path=='/odstevanje/'
    @children=Page.where('path LIKE ?',"#{path}%").where.not(path:path).order(:path) if path!='/'
    render :show
  end
  def section_for(path)
    return 'name' if @person
    return 'home' if path=='/'
    return 'about' if path=='/o-nas/'
    return 'privacy' if path=='/zasebnost/'
    return 'cookie_policy' if path=='/piskotki/'
    return 'methodology' if path=='/viri-in-metodologija/'
    return 'garden_calendar' if path==GardenCalendar::PATH
    return 'payment_calendar' if PaymentCalendar.paths.include?(path)
    return 'education_calendar' if EducationCalendar.paths.include?(path)
    return 'school_timetable' if path=='/solski-urnik/'
    return 'moon_phases' if LunarPhaseSchedule::PATHS.value?(path)
    return 'astronomy_events' if AstronomySchedule::PATHS.value?(path)
    return 'calendar' if path.start_with?('/koledar/')||path=='/mesecni-koledar/'||path.start_with?('/tedenski-koledar/')
    return 'horoscope' if path.start_with?('/horoskop/')
    return 'school' if path.start_with?('/solske-pocitnice/')
    return 'held' if path.start_with?('/godovi/')
    return 'lunar' if path.start_with?('/lunin-koledar/')||%w[/lunine-mene/ /polna-luna/ /mlaj/].include?(path)
    return 'sun' if path.start_with?('/soncni-vzhod-in-zahod/')||path=='/dolzina-dneva/'
    return 'workdays' if path.start_with?('/delovni-dnevi/')
    return 'vacation' if path.start_with?('/podaljsani-vikendi/')
    return 'holidays' if path=='/prazniki/' || path.match?(%r{\A/prazniki/20(?:27|28|29|30)/\z})
    return 'important_days' if path.start_with?('/pomembni-dnevi/') && !CalendarEvent.exists?(slug:path.split('/').last)
    return 'events' if path.start_with?('/prazniki/','/pomembni-dnevi/','/letni-casi/')||path=='/premik-ure/'
    return 'tool' if %w[/datumski-kalkulator/ /kalkulator-delovnih-dni/ /nacrtovalnik-dopusta/ /odstevanje/ /stevilka-tedna/ /dan-v-letu/ /prestopno-leto/].include?(path)
    return 'calendar_studio' if path=='/ustvari-koledar/'
    return 'planner' if %w[/ustvari-koledar/ /prazen-koledar/ /razpored-izmen/ /solski-urnik/ /rojstnodnevni-koledar/ /dnevni-planer/ /druzinski-planer/ /koledar-za-tiskanje/].include?(path)
    return 'tools_index' if path=='/orodja/'
    'info'
  end
  def search
    @title='Iskanje';@noindex=true;@description='Poiščite koledar, praznik, dogodek ali orodje na Koledar365.';@q=params[:q].to_s.strip.truncate(120)
    @results=SearchService.call(@q)
  end
  def sitemap
    response.headers['Cache-Control']='public, max-age=3600'
    base=ENV.fetch('SITE_URL','https://koledar365.si')
    render xml: %(<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>#{base}/sitemap-pages.xml</loc></sitemap></sitemapindex>)
  end
  def sitemap_part
    raise ActiveRecord::RecordNotFound unless params[:kind]=='pages'
    base=ENV.fetch('SITE_URL','https://koledar365.si')
    page_rows=Page.published.reject { |p| p.path.match?(REMOVED_NAME_PATHS) }
    rows=page_rows.map { |p| [p.path,p.updated_at] }
    if params[:kind]=='pages'
      rows.concat(SunEngine::CITIES.keys.map { |city_id| ["/soncni-vzhod-in-zahod/#{city_id}/",Date.new(2026,10,21)] })
      rows=rows.uniq { |path,_| path }
    end
    rows << ['/fotografije-in-licence/',Date.new(2026,10,20)] if params[:kind]=='pages' && Page.published.exists?(path:'/')
    xml=Nokogiri::XML::Builder.new(encoding:'UTF-8') do |x|
      x.urlset('xmlns'=>'http://www.sitemaps.org/schemas/sitemap/0.9','xmlns:image'=>'http://www.google.com/schemas/sitemap-image/1.1') do
          collection_pages=page_rows.select { |p| p.path.start_with?('/koledar/') && (2027..2030).cover?(p.year.to_i) }.index_by(&:path)
          rows.each do |path,time|
          x.url do
            x.loc(base+path);x.lastmod(time.iso8601)
            x['image'].image { x['image'].loc(base+ClockChangeSchedule::IMAGE_PATH) } if path=='/premik-ure/'
            image=ExpansionCatalog.image(path)
            x['image'].image { x['image'].loc(base+image.fetch('path')) } if image
              if (calendar_page=collection_pages[path])
                PublicCalendarGallery.rows_for(year: calendar_page.year, month: calendar_page.month).each do |row|
                  seo=row.fetch('collection_seo')
                  x['image'].image do
                    x['image'].loc(base+row.dig('files','webp'))
                    x['image'].title(seo.fetch('title'))
                    x['image'].caption(seo.fetch('alt'))
                  end
                end
              end
          end
        end
      end
    end
    render xml:xml.to_xml
  end
  def robots
    render plain:"User-agent: *\nDisallow: /upravljanje/\nSitemap: #{ENV.fetch('SITE_URL','https://koledar365.si')}/sitemap.xml\n"
  end
end
