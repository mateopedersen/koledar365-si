class CalendarEngine
  YEARS = (2027..2030).to_a.freeze
  MONTHS = %w[januar februar marec april maj junij julij avgust september oktober november december].freeze
  DAYS = %w[ponedeljek torek sreda četrtek petek sobota nedelja].freeze
  SHORT_DAYS = %w[pon tor sre čet pet sob ned].freeze
  def self.easter(year)
    a=year%19; b=year/100; c=year%100; d=b/4; e=b%4; f=(b+8)/25; g=(b-f+1)/3
    h=(19*a+b-d-g+15)%30; i=c/4; k=c%4; l=(32+2*e+2*i-h-k)%7; m=(a+11*h+22*l)/451
    v=h+l-7*m+114
    Date.new(year,v/31,v%31+1)
  end
  def self.rule_dates(rule,year)
    case rule['kind']
    when 'fixed' then rule['days'].map { |d| Date.new(year,rule['month'],d) }
    when 'gregorian_easter' then rule['offsets_days'].map { |d| easter(year)+d }
    when 'first_sunday_advent'
      christmas=Date.new(year,12,25); [christmas-((christmas.wday+6)%7+1)-21]
    when 'last_sunday' then rule['months'].map { |m| d=Date.new(year,m,-1); d-d.wday }
    else []
    end
  end
  def self.weeks(year,month)
    first=Date.new(year,month,1); last=Date.new(year,month,-1)
    ((first-(first.cwday-1))..(last+(7-last.cwday))).to_a.each_slice(7).to_a
  end
  def self.working_days(from,to,weekdays: [1,2,3,4,5], exclude_holidays: true, include_start: true, include_end: true)
    raise ArgumentError,'Končni datum mora biti po začetnem datumu.' if to<from
    raise ArgumentError,'Izberite obdobje med letoma 2027 in 2030.' unless YEARS.include?(from.year) && YEARS.include?(to.year)
    days=(from..to).to_a
    days.delete(from) unless include_start; days.delete(to) unless include_end
    holidays=exclude_holidays ? CalendarEvent.where(on: from..to,work_free: true).pluck(:on).uniq : []
    working=days.select { |d| weekdays.include?(d.cwday) && !holidays.include?(d) }
    {calendar_days: days.size, working_days: working.size, dates: working, excluded_holidays: holidays.select { |d| days.include?(d)&&weekdays.include?(d.cwday) }}
  end
  def self.vacations(year,budget)
    free=CalendarEvent.where(on: Date.new(year,1,1)..Date.new(year,12,31),work_free: true).pluck(:on).to_set
    dates=(Date.new(year,1,1)..Date.new(year,12,31)).to_a
    options=[]
    dates.each_with_index do |start,i|
      next if start.cwday<6&&!free.include?(start)
      used=0
      dates[i,32].each do |finish|
        used+=1 if finish.cwday<6&&!free.include?(finish)
        break if used>budget
        next if (finish-start)<2 || (finish.cwday<6&&!free.include?(finish))
        options << {from:start,to:finish,leave:used,total:(finish-start).to_i+1}
      end
    end
    options.sort_by { |o| [-o[:total],o[:leave],o[:from]] }.uniq { |o| [o[:from],o[:leave]] }.first(20)
  end
end
