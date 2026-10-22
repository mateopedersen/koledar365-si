module CalendarExperienceHelper
  def calendar_download_type(view)
    {'year'=>'annual','week'=>'weekly','day'=>'daily'}.fetch(view,'monthly')
  end

  def calendar_print_path(year:,month:,date:nil,type:'monthly',design:nil)
    selected=date || Date.new(year,month,1)
    '/koledar-za-tiskanje/?'+{type:type,year:year,month:month,date:selected.iso8601,design:design}.compact.to_query
  end

  def calendar_editor_path(year:,month:,date:,view:)
    return calendar_print_path(year:year,month:month,date:date,type:calendar_download_type(view)) if %w[week day].include?(view)
    '/ustvari-koledar/?'+{year:year,month:month,view:view=='year' ? 'year' : 'month'}.to_query
  end

  def calendar_experience_data
    {
      years:CalendarEngine::INTERACTIVE_YEARS,iso_years:(2026..Date.new(2030,12,31).cwyear).to_a,months:CalendarEngine::MONTHS,days:CalendarEngine::DAYS,
      today:(@today || Time.zone.today).iso8601,min_date:'2026-01-01',max_date:'2030-12-31',
      # Adjacent dates are needed when an ISO week crosses a calendar-year edge.
      holidays:(2025..2031).flat_map { |year| CalendarEngine.statutory_work_free_events(year).map { |event| {date:event.fetch(:on).iso8601,title:event.fetch(:title)} } },
      source:'https://pisrs.si/pregledPredpisa?id=ZAKO865',checked_on:'2026-10-21'
    }
  end

  def calendar_hub_period(weekly:false)
    today=@today || Time.zone.today
    selected=Date.iso8601(params[:date].to_s) rescue nil
    selected=nil unless selected&.between?(Date.new(2026,1,1),Date.new(2030,12,31))
    year=@page&.year || params[:year].to_i
    years=weekly ? (2026..Date.new(2030,12,31).cwyear).to_a : CalendarEngine::INTERACTIVE_YEARS
    year=today.year unless years.include?(year)
    year=2027 unless years.include?(year)
    month=params[:month].to_i
    month=(today.year==year ? today.month : 1) unless month.between?(1,12)
    if weekly && params[:week].present?
      selected=Date.commercial(year,Integer(params[:week]),1) rescue selected
    end
    selected||=(today.year==year && (weekly || today.month==month) ? today : (weekly ? Date.commercial(year,1,1) : Date.new(year,month,1)))
    selected=selected.clamp(Date.new(2026,1,1),Date.new(2030,12,31))
    {year:weekly ? selected.cwyear : year,month:weekly ? selected.month : month,date:selected}
  end

  def calendar_layout_preview(kind)
    content_tag(:svg,viewBox:'0 0 150 96',aria:{hidden:true},focusable:false) do
      safe_join([
        tag.rect(x:9,y:5,width:132,height:86,rx:2,fill:'white',stroke:'currentColor'),
        tag.path(d:'M20 19H84 M20 26H55',stroke:'#0054b8','stroke-width':3),
        if kind=='list'
          safe_join((0..5).map { |i| tag.path(d:"M20 #{36+i*7}H130",stroke:'#d8e0eb') }+[tag.path(d:'M43 32V79',stroke:'#d8e0eb')])
        else
          right=kind=='notes' ? 103 : 130
          safe_join((0..4).map { |i| tag.path(d:"M20 #{34+i*10}H#{right}",stroke:'#d8e0eb') }+(0..7).map { |i| x=20+(right-20)*i/7.0;tag.path(d:"M#{x} 34V74",stroke:'#d8e0eb') }+(kind=='notes' ? [tag.path(d:'M112 36H131 M112 46H131 M112 56H131 M112 66H131',stroke:'#cf2439')] : []))
        end
      ])
    end
  end
end
