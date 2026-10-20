class PlannerCalendar
  def self.minutes(entry)
    date=Date.iso8601(entry.fetch('date'))
    h,m=entry.fetch('time').split(':').map(&:to_i);hh,mm=entry.fetch('end_time').split(':').map(&:to_i)
    ending=date+(entry['end_time']<entry['time'] ? 1 : 0)
    start=IcsService.local_time(date.year,date.month,date.day,h,m,0,IcsService::ZONE)
    finish=IcsService.local_time(ending.year,ending.month,ending.day,hh,mm,0,IcsService::ZONE)
    value=((finish-start)/60).to_i
    raise ArgumentError,'Konec mora biti po začetku. Enaka ura ne pomeni samodejno 24-urne izmene.' unless value.positive?
    value
  end
  def self.export(options)
    entries=options['entries'];type=options['type']
    rows=entries.flat_map.with_index do |entry,index|
      raise ArgumentError,'Vsak vnos za ICS potrebuje datum in naslov.' if entry['date'].blank? || entry['title'].blank?
      original=Date.iso8601(entry['date'])
      years=type=='birthday' ? (2027..2030).to_a : [original.year]
      years.filter_map do |year|
        date=if type=='birthday' && original.month==2 && original.day==29 && !Date.gregorian_leap?(year)
          case options['leap_policy'];when 'leap_only' then next;when 'march1' then Date.new(year,3,1);else Date.new(year,2,28);end
        else Date.new(year,original.month,original.day);end
        row={'uid'=>Digest::SHA256.hexdigest([index,entry,year].to_json).first(32),'date'=>date.iso8601,'title'=>[entry['person'],entry['title']].select(&:present?).join(' · '),'time'=>entry['time'],'notes'=>[entry['notes'],entry['code'].presence && "Izmena: #{entry['code']}",entry['room'].presence && "Učilnica: #{entry['room']}",entry['break'].presence && "Odmor: #{entry['break']} min"].compact.join("\n")}
        if entry['time'].present? && entry['end_time'].present?
          row['minutes']=minutes(entry.merge('date'=>date.iso8601))
        end
        row
      end
    end
    IcsService.export(rows)
  end
end
