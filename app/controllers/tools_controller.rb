class ToolsController < ApplicationController
  rate_limit to:30,within:1.minute,only:[:contact,:import_ics,:export_ics]
  rescue_from ArgumentError,Date::Error,KeyError, with: :bad_input
  def calculate
    type=params[:tool].to_s
    case type
    when 'zodiac'
      d=Date.iso8601(params[:birth_date]);sign=Zodiac.for_date(d)
      @result="#{Zodiac::SIGNS.fetch(sign)}. Meje znamenj so približne; izračun temelji na običajnih datumskih razponih."
    when 'shift'
      from=Date.iso8601(params[:from]);to=Date.iso8601(params[:to]);cycle=params[:cycle].to_s.split(',').map(&:strip)
      raise ArgumentError,'Izberite največ 100 dni in od 1 do 30 oznak v ciklu.' unless to>=from&&(to-from)<100&&cycle.size.between?(1,30)&&cycle.all? { |x|x.length.between?(1,20) }
      entries=(from..to).map.with_index { |d,i| {date:d.iso8601,code:cycle[i%cycle.size],title:cycle[i%cycle.size],person:params[:person].to_s.truncate(80)} }
      return render json:{result:"Razpored je pripravljen. Število dni: #{entries.size}.",entries:entries}
    when 'date'
      from=Date.iso8601(params[:from]);to=Date.iso8601(params[:to])
      difference=(to-from).to_i + (params[:inclusive]=='1' ? 1:0)
      delta=Integer(params[:delta].presence||0)
      shifted=case params[:unit];when 'months' then from>>delta;when 'weeks' then from+delta*7;else from+delta;end
      @result="Razlika: #{difference} dni (#{difference/7} tednov in #{difference%7} dni). Datum po premiku: #{I18n.l(shifted)}. Pri premiku po mesecih se dan omeji na zadnji dan ciljnega meseca."
    when 'workdays'
      from=Date.iso8601(params[:from]);to=Date.iso8601(params[:to]);week=Array(params[:weekdays]).map(&:to_i)
      raise ArgumentError,'Izberite vsaj en delovni dan.' if week.empty?||(week-[1,2,3,4,5,6,7]).any?
      hours=Float(params[:hours]);raise ArgumentError,'Dnevne ure morajo biti med 0 in 24.' unless (0..24).cover?(hours)
      v=CalendarEngine.working_days(from,to,weekdays:week,exclude_holidays:params[:exclude_holidays]=='1',include_start:params[:include_start]=='1',include_end:params[:include_end]=='1')
      @result="Koledarski dnevi: #{v[:calendar_days]}. Delovni dnevi: #{v[:working_days]}. Ure: #{v[:working_days]*hours}. Izločeni prazniki: #{v[:excluded_holidays].map { |d| I18n.l(d) }.join(', ').presence||'ni jih'}."
    when 'vacation'
      year=Integer(params[:year]);budget=Integer(params[:budget]);raise ArgumentError,'Izberite leto 2027–2030 in od 0 do 20 dni dopusta.' unless CalendarEngine::YEARS.include?(year)&&(0..20).cover?(budget)
      @result=CalendarEngine.vacations(year,budget).first(8).map { |o| "#{I18n.l(o[:from])}–#{I18n.l(o[:to])}: #{o[:total]} prostih dni, poraba dopusta: #{o[:leave]} dni." }.join("\n")
    when 'week','ordinal','leap','countdown'
      d=Date.iso8601(params[:date]);@result=case type
      when 'week' then "Teden ISO: #{d.cweek}. Leto ISO: #{d.cwyear}. Od #{I18n.l(d-d.cwday+1)} do #{I18n.l(d-d.cwday+7)}."
      when 'ordinal' then "Dan v letu: #{d.yday}. Do konca leta ostane #{Date.new(d.year,12,31).yday-d.yday} dni."
      when 'leap' then "Leto #{d.year} #{Date.gregorian_leap?(d.year) ? 'je':'ni'} prestopno. Februar ima #{Date.new(d.year,2,-1).day} dni."
      else "Do datuma #{I18n.l(d)} je #{(d-Time.zone.today).to_i} dni. Časovni pas: Europe/Ljubljana."
      end
    else raise ArgumentError,'Neznano orodje.'
    end
    render json:{result:@result}
  end
  def contact
    raise ArgumentError,'Sporočila ni bilo mogoče shraniti.' if params[:website].present?
    r=ContactMessage.new(params.permit(:name,:email,:message))
    if r.save
      render json:{result:'Sporočilo je shranjeno v uredniškem predalu. Hvala za vaše sporočilo.'}
    else render json:{error:'Preverite ime, e-poštni naslov in sporočilo (najmanj 10 znakov).'},status: :unprocessable_entity
    end
  end
  def export_ics
    raw=params.fetch(:events,[])
    raise ArgumentError,'Dogodki morajo biti seznam.' unless raw.is_a?(Array)
    entries=raw.map { |e|e.permit(:uid,:title,:date,:time,:minutes,:end_date,:notes,:repeat).to_h }
    raise ArgumentError,'Največ 500 dogodkov.' if entries.size>500
    send_data IcsService.export(entries),type:'text/calendar; charset=utf-8',filename:'koledar365-moj-koledar.ics'
  end
  def import_ics
    render json:{events:IcsService.import(params.require(:ics).to_s)}
  end
  def holidays_ics
    year=Integer(params[:year]);raise ArgumentError,'Leto ni podprto.' unless CalendarEngine::YEARS.include?(year)
    if params[:all]=='1'
      events=CalendarEvent.where(on:Date.new(year,1,1)..Date.new(year,12,31)).ordered.to_a
      events=events.select { |e| e.on.month==params[:month].to_i } if params[:month].to_i.between?(1,12)
    else
      events=HolidayYear.new(year).filter(month:params[:month],kind:params[:kind],query:params[:q])
    end
    if params[:topic].present?
      events=events.select { |event|event.slug==params[:topic] }
      raise ActiveRecord::RecordNotFound if events.empty?
    end
    if params[:event].present?
      events=events.select { |event| event.key==params[:event] }
      raise ActiveRecord::RecordNotFound if events.empty?
    end
    rows=events.map do |event|
      description=[event.work_free ? 'Dela prost dan' : 'Ni dela prost dan',
        event.state_holiday ? 'Državni praznik' : nil,
        "Vir: #{event.source_url}",'Koledar365 · koledar365.si'].compact.join("\n")
      {'uid'=>event.key,'date'=>event.on.iso8601,'title'=>event.title,'notes'=>description}
    end
    response.headers['X-Robots-Tag']='noindex'
    send_data IcsService.export(rows),type:'text/calendar; charset=utf-8',filename:"koledar365-#{params[:all]=='1' ? 'pomembni-dnevi' : 'prazniki'}-#{year}.ics"
  end
  def bad_input(e)
    render json:{error:e.is_a?(KeyError) ? 'Izpolnite vsa zahtevana polja.' : (e.is_a?(Date::Error) ? 'Vnesite veljaven datum.' : e.message)},status: :unprocessable_entity
  end
end
