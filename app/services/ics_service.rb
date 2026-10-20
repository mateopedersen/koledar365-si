class IcsService
  LIMIT=1_000_000
  ZONE='Europe/Ljubljana'

  def self.export(events)
    raise ArgumentError,'Največ 500 dogodkov.' unless events.is_a?(Array) && events.size<=500
    cal=Icalendar::Calendar.new
    cal.prodid='-//Koledar365//SL'
    events.each do |e|
      title=e.fetch('title').to_s.strip
      raise ArgumentError,'Dogodek potrebuje naslov.' if title.blank?
      date=Date.iso8601(e.fetch('date'))
      cal.event do |v|
        uid=e['uid'].presence || SecureRandom.uuid
        v.uid=uid.include?('@') ? uid : "#{uid}@koledar365.si"
        v.summary=title;v.description=e['notes'].to_s
        if e['time'].present?
          raise ArgumentError,'Vnesite veljavno uro.' unless e['time'].match?(/\A\d{2}:\d{2}(:\d{2})?\z/)
          h,m,s=e['time'].split(':').map(&:to_i);s||=0
          raise ArgumentError,'Vnesite veljavno uro.' unless (0..23).cover?(h)&&(0..59).cover?(m)&&(0..59).cover?(s)
          instant=local_time(date.year,date.month,date.day,h,m,s,ZONE)
          minutes=Integer(e['minutes'].presence || 60)
          raise ArgumentError,'Trajanje mora biti med 1 minuto in enim letom.' unless (1..525600).cover?(minutes)
          v.dtstart=Icalendar::Values::DateTime.new(instant.utc,'tzid'=>'UTC')
          v.dtend=Icalendar::Values::DateTime.new((instant+minutes.minutes).utc,'tzid'=>'UTC')
        else
          last=e['end_date'].present? ? Date.iso8601(e['end_date']) : date
          raise ArgumentError,'Konec dogodka je pred začetkom.' if last<date
          v.dtstart=Icalendar::Values::Date.new(date)
          v.dtend=Icalendar::Values::Date.new(last+1)
        end
        raise ArgumentError,'Podprto je le letno ponavljanje.' if e['repeat'].present? && e['repeat']!='yearly'
        v.rrule=Icalendar::Values::Recur.new('FREQ=YEARLY') if e['repeat']=='yearly'
      end
    end
    cal.to_ical
  end

  def self.local_time(y,m,d,h,minute,second,zone)
    tz=TZInfo::Timezone.get(zone)
    local=Time.utc(y,m,d,h,minute,second)
    tz.local_to_utc(local).in_time_zone(ZONE)
  rescue TZInfo::PeriodNotFound,TZInfo::AmbiguousTime
    raise ArgumentError,'Ura ob premiku na poletni ali zimski čas ni enolična. Uporabite datum in uro UTC.'
  rescue TZInfo::InvalidTimezoneIdentifier
    raise ArgumentError,"Časovni pas #{zone} ni podprt. Izvozite koledar s časom UTC."
  end

  def self.instant(value)
    raw=value.value
    zone=Array(value.ical_params['tzid']).first
    zone='UTC' if value.tz_utc
    local_time(raw.year,raw.month,raw.day,raw.hour,raw.minute,raw.second,zone.presence || ZONE)
  end

  def self.import(text)
    raise ArgumentError,'Datoteka ICS je prevelika (največ 1 MB).' if text.bytesize>LIMIT
    # Validate TZID wall clocks before the parser can normalize a nonexistent
    # DST time. Folded content lines are unfolded according to RFC 5545.
    text.gsub(/\r?\n[ \t]/,'').each_line do |line|
      next unless (match=line.match(/\ADT(?:START|END);[^:]*TZID="?([^";:]+)"?[^:]*:(\d{8}T\d{6})/))
      d=DateTime.strptime(match[2],'%Y%m%dT%H%M%S')
      local_time(d.year,d.month,d.day,d.hour,d.minute,d.second,match[1])
    end
    calendars=Icalendar::Calendar.parse(text)
    raise ArgumentError,'Datoteka ne vsebuje koledarja.' if calendars.empty?
    events=calendars.flat_map(&:events)
    raise ArgumentError,'Največ 500 dogodkov na uvoz.' if events.length>500
    events.map do |e|
      raise ArgumentError,'Podprto je le letno ponavljanje brez dodatnih pravil.' if e.rrule.any? { |r| r.value.to_h.reject { |_,v| v.nil? }!={frequency:'YEARLY'} }
      raise ArgumentError,'Izjeme ponavljanja niso podprte; uvozite posamezne dogodke.' if e.exdate.any? || e.recurrence_id || e.rdate.any?
      raise ArgumentError,'Dogodek nima datuma ali naslova.' if !e.dtstart || e.summary.to_s.blank?
      raise ArgumentError,'Koledar uporablja DURATION; izvozite dogodke z izrecnim končnim časom DTEND.' if e.duration
      all_day=e.dtstart.is_a?(Icalendar::Values::Date)
      t=all_day ? e.dtstart.value : instant(e.dtstart)
      raise ArgumentError,'Naslov dogodka presega 200 znakov ali opis presega 4000 znakov. Uvoz ni bil shranjen.' if e.summary.to_s.length>200 || e.description.to_s.length>4000
      row={'uid'=>e.uid.to_s.delete_suffix('@koledar365.si').presence||SecureRandom.uuid,'title'=>e.summary.to_s,'date'=>t.to_date.iso8601,'time'=>all_day ? '' : t.strftime(t.sec.zero? ? '%H:%M' : '%H:%M:%S'),'notes'=>e.description.to_s,'repeat'=>e.rrule.any? ? 'yearly' : '', 'kind'=>'event'}
      if e.dtend
        raise ArgumentError,'Začetek in konec dogodka morata uporabljati isti tip datuma.' unless e.dtend.is_a?(Icalendar::Values::Date)==all_day
        if all_day
          last=e.dtend.value-1
          raise ArgumentError,'Konec dogodka je pred začetkom.' if last<t
          row['end_date']=last.iso8601
        else
          seconds=(instant(e.dtend)-t).to_i
          raise ArgumentError,'Trajanje mora biti pozitivno in izraženo v celih minutah.' unless seconds.positive? && seconds%60==0
          row['minutes']=seconds/60
        end
      end
      row
    end.uniq { |e|e['uid'] }
  end
end
