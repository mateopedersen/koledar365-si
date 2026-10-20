module HolidaysHelper
  def holiday_title(event) = event.title.sub(/\A./, &:upcase)
  def holiday_ics_url(year, month: 0, kind: 'all', query: '')
    "/prazniki/#{year}.ics?#{ {month: month, kind: kind, q: query}.to_query }"
  end

  def holiday_status(event)
    event.work_free ? 'Dela prost dan' : 'Ni dela prost dan'
  end

  def holiday_origin(event)
    event.state_holiday ? 'Državni praznik' : 'Drug zakonsko določen dela prost dan'
  end

  def holiday_date_count(count)
    ending = case count % 100
             when 1 then 'datum'
             when 2 then 'datuma'
             when 3, 4 then 'datumi'
             else 'datumov'
             end
    "#{count} #{ending}"
  end

  def holiday_break_label(count)
    case count % 100
    when 1 then 'zaporedni prosti dan'
    when 2 then 'zaporedna prosta dneva'
    when 3, 4 then 'zaporedni prosti dnevi'
    else 'zaporednih prostih dni'
    end
  end
end
