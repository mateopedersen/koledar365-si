class CountdownCatalog
  LAST_CALENDAR_YEAR=2030
  SCHOOL_SOURCE='https://www.gov.si/teme/solski-koledar-za-osnovne-sole/'.freeze
  SECONDARY_SCHOOL_SOURCE='https://www.gov.si/teme/solski-koledar-za-srednje-sole/'.freeze
  SCHOOL_DATA_PATH=File.expand_path('../../public/school/data.json',__dir__).freeze

  def self.events(today:)
    through=Date.new([LAST_CALENDAR_YEAR,today.year].max,12,31)
    holidays=CalendarEvent.where(category:'legal',on:today..through).ordered.map do |event|
      {id:"holiday-#{event.slug}-#{event.on.iso8601}",title:event.title.sub(/\A./,&:upcase),date:event.on.iso8601,category:'holiday',work_free:event.work_free,state_holiday:event.state_holiday,source:'holiday'}
    end
    school=school_events
    (holidays+school).sort_by { |event| [event[:date],event[:title]] }
  end

  def self.school_events
    data=JSON.parse(File.read(SCHOOL_DATA_PATH))
    events=data.fetch('breaks').flat_map do |break_data|
      %w[primary secondary].map do |level|
        dates=level=='secondary' && break_data['secondary'] ? break_data['secondary'] : [break_data.fetch('start'),break_data.fetch('end')]
        region=break_data['region']
        tag=break_data['tag']
        title=region ? [break_data.fetch('name'),tag].compact.uniq.join(' · ') : break_data.fetch('name')
        date=dates.first
        if break_data['id']=='may' && (free_day=data.fetch('freeDays',[]).select { |value| value<date }.last)
          date=free_day
        end
        label=level=='primary' ? 'osnovno šolo' : 'srednjo šolo'
        detail="Uradni termin za #{label} v šolskem letu #{data.fetch('schoolYear')} · #{Date.iso8601(dates.first).strftime('%-d. %-m.')}–#{Date.iso8601(dates.last).strftime('%-d. %-m. %Y')}"
        detail+=". Začetek je premaknjen na 26. april, ko je pouka prost dan." if break_data['id']=='may' && date!=dates.first
        {id:"school-#{level}-#{break_data.fetch('id')}",title:title,date:date,end_date:dates.last,detail:detail,region:region||'all',school_level:level,category:'school',source:'school',source_url:data.dig('sources',level)}
      end
    end
    events.concat(%w[primary secondary].map do |level|
      label=level=='primary' ? 'osnovno šolo' : 'srednjo šolo'
      {id:"school-#{level}-return-2027-28",title:'Začetek pouka · šolsko leto 2027/28',date:'2027-09-01',detail:"Pouk se praviloma začne 1. septembra; datum za #{label} je predviden. Uradni koledar za 2027/28 še ni objavljen.",region:'all',school_level:level,category:'school',source:'school',source_url:data.dig('sources',level),provisional:true}
    end)
    events.concat([
      {id:'school-primary-end-grade-9-2027',title:'Konec pouka · 9. razred',date:'2027-06-15',detail:'Zaključek 2. ocenjevalnega obdobja in razdelitev spričeval za 9. razred.',region:'all',school_level:'primary',category:'school',source:'school',source_url:data.dig('sources','primary')},
      {id:'school-primary-end-grades-1-8-2027',title:'Konec pouka · 1.–8. razred',date:'2027-06-24',detail:'Zaključek 2. ocenjevalnega obdobja za učence od 1. do 8. razreda.',region:'all',school_level:'primary',category:'school',source:'school',source_url:data.dig('sources','primary')},
      {id:'school-secondary-info-days-2027',title:'Informativna dneva za srednje šole',date:'2027-02-12',end_date:'2027-02-13',detail:'Informativna dneva za vpis v srednje šole.',region:'all',school_level:'secondary',category:'school',source:'school',source_url:'https://www.gov.si/teme/solski-koledar-za-osnovne-sole/'},
      {id:'school-return-2027',title:'Vrnitev v šolske klopi',date:'2027-01-04',detail:'Po novoletnih počitnicah se pouk nadaljuje v ponedeljek, 4. januarja.',region:'all',school_level:'all',category:'school',source:'school',source_url:data.dig('sources','primary')}
    ])
  end
end
