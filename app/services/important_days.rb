class ImportantDays
  CATEGORIES={'all'=>'Vsi pomembni dnevi','legal'=>'Prazniki po zakonu','local'=>'Slovenski in krajevni dnevi','tradition'=>'Izročilo in verski dnevi','international'=>'Mednarodni in evropski dnevi','nature'=>'Narava, letni časi in ura','culture'=>'Kultura in družba','festival'=>'Festivali in prireditve'}.freeze
  def self.category(event)
    value=event.category.to_s
    return 'legal' if value=='legal'
    return 'festival' if value=='festival'
    return 'local' if value.start_with?('slovenian_')
    return 'nature' if value.match?(/environment|astronomical|civil_time/)
    return 'international' if value.match?(/international|european/)
    return 'tradition' if value.match?(/religious|folk|traditional/)
    'culture'
  end
  def self.period(year, month = 0)
    return Date.new(year, 1, 1)..Date.new(year, 12, 31) unless month.to_i.between?(1, 12)
    first = Date.new(year, month.to_i, 1)
    first..first.end_of_month
  end

  def self.overlaps?(event, dates)
    event.on <= dates.end && (event.ends_on || event.on) >= dates.begin
  end

  def self.events_in(dates)
    continued = CalendarEvent.where(category: 'festival').select do |event|
      event.on < dates.begin && overlaps?(event, dates)
    end
    (continued + CalendarEvent.where(on: dates).ordered.to_a).sort_by { |event| [event.on, event.title] }
  end

  def self.by_date(events, dates)
    events.each_with_object({}) do |event, result|
      first = [event.on, dates.begin].max
      last = [event.ends_on || event.on, dates.end].min
      (first..last).each { |date| (result[date] ||= []) << event }
    end
  end

  def self.filter(events,year:,month:0,category:'all',query:'')
    needle=PersonName.fold(query.to_s.first(100))
    dates=period(year, month)
    events.select do |event|
      next false unless overlaps?(event, dates)
      next false if CATEGORIES.key?(category) && category!='all' && self.category(event)!=category
      next true if needle.blank?
      haystack=[event.title,event.metadata&.fetch('place',nil)].compact.join(' ')
      PersonName.fold(haystack).include?(needle)
    end
  end
end
