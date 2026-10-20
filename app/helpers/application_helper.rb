module ApplicationHelper
  include IllustrationHelper
  def page_path = @canonical || (request.path == "/" ? "/" : request.path.delete_suffix("/")+"/")
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
    {type:type,year:@year||2027,month:@month||1,date:Date.new(@year||2027,@month||1,1).iso8601,name:@person&.exact.to_s}
  end
  def source_link(url,label='Vir')
    link_to(label,url,rel:'noopener') if url.present? && url.start_with?('https://')
  end
end
