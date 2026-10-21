module ApplicationHelper
  include IllustrationHelper
  def gallery_page?
    %w[planner name holidays].include?(@section) ||
      (@section == 'lunar' && !page_path.start_with?('/lunin-koledar/')) ||
      (@section == 'workdays' && @year != 2026) ||
      (@section == 'calendar' && @page&.year && @year.between?(2027,2030))
  end
  def gallery_description
    return 'Načrtujte družinski teden, delite pregled z domačimi v tem brskalniku in ustvarite koledar za tisk ali iCalendar.' if page_path == '/druzinski-planer/'
    'V galeriji izberite eno od 15 predlog: PDF za tisk in ujemajoči se WebP pri 600 ppi, s podpisom Koledar365 na vsaki strani. Večstranski WebP je v datoteki ZIP; PDF tiskajte v merilu 100 %.'
  end
  def page_path
    return @canonical if @canonical
    path=request&.path
    path.nil? || path=="/" ? "/" : path.delete_suffix("/")+"/"
  end
  def sl_date(d) = I18n.l(d.to_date,format: :long)
  def month_url(year,month,family='koledar') = "/#{family}/#{year}/#{CalendarEngine::MONTHS[month-1]}/"
  def calendar_path(date) = date.year==2026 ? "/?year=2026&month=#{date.month}" : month_url(date.year,date.month)
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
    year=(@year||2027).clamp(2027,2030)
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
