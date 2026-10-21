require 'icalendar'

# Explicit UTC instants make an imported event independent of the calendar
# application's default zone, including Slovenia's October DST transition.
class AstronomyIcalService
  def self.export(rows)
    calendar = Icalendar::Calendar.new
    calendar.prodid = '-//Koledar365//Astronomija SL//EN'
    calendar.x_wr_calname = 'Koledar365 · Astronomija'
    calendar.x_wr_timezone = 'Europe/Ljubljana'
    rows.each do |row|
      calendar.event do |event|
        event.uid = "#{row.fetch(:id)}@koledar365.si"
        event.dtstamp = Icalendar::Values::DateTime.new(Time.utc(2026, 10, 21), 'tzid' => 'UTC')
        event.dtstart = Icalendar::Values::DateTime.new(rounded(row.fetch(:start)), 'tzid' => 'UTC')
        event.dtend = Icalendar::Values::DateTime.new(rounded(row.fetch(:end)), 'tzid' => 'UTC')
        event.summary = row.fetch(:title)
        event.description = row.fetch(:description)
        event.url = row.fetch(:url)
        event.transp = 'TRANSPARENT'
      end
    end
    calendar.to_ical
  end

  def self.rounded(value) = Time.at((Time.iso8601(value).to_f / 60).round * 60).utc

  def self.moon_rows(schedule)
    schedule.for_year.map do |row|
      { id: row.fetch('id'), start: row.fetch('utc'), end: (Time.iso8601(row.fetch('utc')) + 60).iso8601,
        title: row.fetch('label'), description: 'Astronomski trenutek Lunine mene. Vir: USNO; čas UTC približno predstavlja UT1 na minuto. Enominutno trajanje je samo način prikaza trenutka v koledarju.',
        url: "https://koledar365.si#{schedule.path}?year=#{schedule.year}" }
    end
  end

  def self.event_rows(schedule)
    schedule.for_year.flat_map do |row|
      local = schedule.local(row)
      if schedule.kind == 'perseids'
        [{ id: "#{row['id']}-#{schedule.city['id']}", start: local.fetch('dark_start'), end: local.fetch('dark_end'),
          title: "Perzeidi: opazovalna noč · #{schedule.city['name']}",
          description: 'Načrtovana noč okoli običajnega avgustovskega viška aktivnosti, ne napoved točne ure maksimuma. Čas označuje astronomsko temo (Sonce pod −18°). Preverite mesečino, oblake in krajevno obzorje.',
          url: "https://koledar365.si#{schedule.path}?year=#{schedule.year}&city=#{schedule.city['id']}" }]
      else
        local.fetch('windows').each_with_index.map do |window, index|
          { id: "#{row['id']}-#{schedule.city['id']}-#{index}", start: window.fetch('start'), end: window.fetch('end'),
            title: "#{schedule.kind == 'solar' ? 'Sončni' : 'Lunin'} mrk · #{schedule.city['name']}",
            description: "Izračunano časovno okno, ko je vsaj del mrka nad ravnim obzorjem. Vrsta vidnega mrka: #{AstronomySchedule::KINDS.fetch(local.fetch('kind'))}. Ne vključuje vremena, hribov ali stavb. #{schedule.kind == 'solar' ? 'Sonce opazujte samo z ustreznim solarnim filtrom.' : 'Polsenčni del je lahko slabo opazen.'} Izračun: Astronomy Engine; lokalna ura Europe/Ljubljana.",
            url: "https://koledar365.si#{schedule.path}?year=#{schedule.year}&city=#{schedule.city['id']}" }
        end
      end
    end
  end
end
