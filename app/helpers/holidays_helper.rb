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
end
