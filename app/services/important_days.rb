class ImportantDays
  CATEGORIES={'all'=>'Vsi pomembni dnevi','legal'=>'Prazniki po zakonu','tradition'=>'Izročilo in verski dnevi','international'=>'Mednarodni in evropski dnevi','nature'=>'Narava, letni časi in ura','culture'=>'Kultura in družba'}.freeze
  def self.category(event)
    value=event.category.to_s
    return 'legal' if value=='legal'
    return 'nature' if value.match?(/environment|astronomical|civil_time/)
    return 'international' if value.match?(/international|european/)
    return 'tradition' if value.match?(/religious|folk|traditional/)
    'culture'
  end
  def self.filter(events,month:0,category:'all',query:'')
    needle=PersonName.fold(query.to_s.first(100))
    events.select { |e|(!month.to_i.between?(1,12)||e.on.month==month.to_i) && (!CATEGORIES.key?(category)||category=='all'||self.category(e)==category) && (needle.blank?||PersonName.fold(e.title).include?(needle)) }
  end
end
