module AstronomyHelper
  def astro_date(value)
    date = Date.iso8601(value.to_s[0, 10])
    "#{date.day}. #{LunarCalendar::GENITIVE.fetch(date.month - 1)} #{date.year}"
  end

  def astro_time(value, zone: false)
    return '—' unless value
    # Nearest-minute presentation matches stated precision, avoiding false seconds.
    local = astro_local_time(value)
    label = local.strftime('%H:%M')
    zone ? "#{label} #{local.utc_offset == 7200 ? 'CEST' : 'CET'}" : label
  end

  def astro_local_time(value) = Time.at((Time.iso8601(value).to_f / 60).round * 60).in_time_zone('Europe/Ljubljana')

  def astro_interval(windows, dates: true)
    return 'Ni nad obzorjem' if windows.empty?
    windows.map do |window|
      start = astro_local_time(window.fetch('start')); finish = astro_local_time(window.fetch('end'))
      if dates && start.to_date != finish.to_date
        "#{start.day}. #{start.month}. #{start.strftime('%H:%M')}–#{finish.day}. #{finish.month}. #{finish.strftime('%H:%M')}"
      else
        "#{start.strftime('%H:%M')}–#{finish.strftime('%H:%M')}"
      end
    end.join(', ')
  end

  def astro_kind(value) = AstronomySchedule::KINDS[value] || 'Ni viden'

  def astro_contact_label(key, local)
    if local['geometric_kind'] == 'annular'
      return 'Začetek kolobarjaste faze' if key == 'total_begin'
      return 'Konec kolobarjaste faze' if key == 'total_end'
    end
    AstronomySchedule::CONTACTS.fetch(key)
  end

  def astro_countdown(utc, at: Time.current)
    seconds = [Time.iso8601(utc) - at, 0].max.to_i
    days, rest = seconds.divmod(86_400)
    hours, rest = rest.divmod(3_600)
    "#{days} #{days % 100 == 1 ? 'dan' : 'dni'} · #{hours} h · #{rest / 60} min"
  end
end
