require 'prawn'
require 'prawn/table'
class PdfRenderer
  attr_reader :pdf, :options, :primary_dates
  PALETTE={'min'=>['175AD7','26756A','171717'],'ele'=>['7A5B40','87374C','171717'],'nat'=>['386B43','327084','171717'],'pla'=>['21466C','146B6D','171717'],'geo'=>['215BD0','8642A0','171717']}.freeze
  def initialize(options)
    @options=options;@id=options.fetch('design');@family,@variant=@id.split('-');@variant=@variant.to_i
    @accent=PALETTE.fetch(@family)[@variant-1];@primary_dates=[]
    @pdf=Prawn::Document.new(page_size:options['paper'],page_layout:options['orientation'].to_sym,margin:34,info:{Title:"#{PrintCatalog::TYPES[options['type']]} #{options['year']}",Author:'Koledar365',Creator:"Koledar365 #{PrintCatalog::VERSION}"})
    fonts=Rails.root.join('app/assets/fonts')
    pdf.font_families.update('Sans'=>{normal:fonts.join('DejaVuSans.ttf').to_s,bold:fonts.join('DejaVuSans-Bold.ttf').to_s},'Serif'=>{normal:fonts.join('DejaVuSerif.ttf').to_s,bold:fonts.join('DejaVuSerif-Bold.ttf').to_s})
    pdf.font('Sans');@w=pdf.bounds.width;@h=pdf.bounds.height
    @holidays=CalendarEvent.where(work_free:true,on:Date.new(options['year'],1,1)..Date.new(options['year'],12,31)).pluck(:on).to_set
  end
  def text(s,x,y,width,size:9,style: :normal,align: :left,color:'172B46',height:30)
    pdf.fill_color(color);pdf.text_box(s.to_s,at:[x,y],width:width,height:height,size:size,style:style,align:align,overflow: :shrink_to_fit,min_font_size:[size-2,5].max)
  end
  def line(x,y,x2,y2,color:'CBD2D9',width:0.45)
    pdf.stroke_color(color);pdf.line_width=width;pdf.stroke_line([x,y],[x2,y2])
  end
  def box(x,y,w,h,color:'CBD2D9',fill:nil)
    if fill;pdf.fill_color(fill);pdf.fill_rectangle([x,y],w,h);end
    pdf.stroke_color(color);pdf.line_width=0.45;pdf.stroke_rectangle([x,y],w,h)
  end
  def header(subtitle=nil)
    pdf.fill_color('FFFFFF');pdf.fill_rectangle([0,@h],@w,@h)
    title=options['name'].presence ? "Ime: #{options['name']}" : PrintCatalog::TYPES.fetch(options['type'])
    serif=@family=='ele';pdf.font(serif ? 'Serif':'Sans')
    text(title,0,@h-6,@w-20,size:options['name'].to_s.length>35 ? 20:27,style: :bold,height:60,color:@accent)
    pdf.font('Sans')
    label=options['type']=='blank'&&options['undated'] ? 'Mesec / leto: ____________________' : "#{options['year']} · #{subtitle || PrintCatalog.designs.find { |d| d['id']==@id }['name_sl']}"
    text(label,0,@h-68,@w,size:10,height:20)
    case @family
    when 'ele'
      line(0,@h-94,@w,@h-94,color:@accent,width:1.2)
      box(-12,@h+12,@w+24,@h+24,color:@accent) if @variant==2
    when 'nat'
      if @variant==2
        pdf.fill_color('DCEAF0');pdf.fill_polygon([@w-160,@h-84],[@w-110,@h-24],[@w-65,@h-70],[@w-32,@h-38],[@w,@h-84])
      else
        6.times do |i|
          x=@w-14-i*7;y=@h-18-i*10;line(x,y,x-8,y-20,color:@accent)
          pdf.stroke_color(@accent);pdf.stroke_ellipse([x-7,y-8],5,2)
        end
      end
    when 'geo'
      if @variant==3
        pdf.stroke_color(@accent);pdf.stroke_circle([@w-25,@h-71],19)
      else
        pdf.fill_color(@accent);pdf.fill_polygon([@w-70,@h-80],[@w,@h-80],[@w,@h-25])
      end
    end
    @top=@h-112
  end
  def notes(x,y,w,h,label='Zapiski')
    text(label,x,y,w,size:10,style: :bold,color:@accent)
    ((h-25)/18).to_i.times { |i| line(x,y-25-i*18,x+w,y-25-i*18) }
  end
  def month(month,x,y,w,h,reference:false)
    date=Date.new(options['year'],month,1)
    text(CalendarEngine::MONTHS[month-1].capitalize,x,y,w,size:11,style: :bold,color:@accent)
    weeks=CalendarEngine.weeks(date.year,month);cw=w/8.0;row=(h-26)/(weeks.size+1)
    text('T',x,y-19,cw,size:6)
    CalendarEngine::SHORT_DAYS.each_with_index { |d,i| text(d,x+(i+1)*cw,y-19,cw,size:6,align: :center) }
    weeks.each_with_index do |week,r|
      yy=y-26-(r+1)*row
      text(week.first.cweek,x,yy,cw,size:6,color:'68768A')
      week.each_with_index do |d,c|
        next unless d.month==month
        @primary_dates << d unless reference
        color=@variant==3 ? '171717' : (@holidays.include?(d) ? 'AA283B':'172B46')
        text(d.day,x+(c+1)*cw,yy,cw,size:[row*0.55,9].min,align: :center,color:color)
      end
    end
    line(x,y-16,x+w,y-16,color:@accent)
    box(x-5,y+5,w+10,h+2) if @id=='ele-02'||@id=='geo-01'||@id=='nat-03'
  end
  def months_grid(months,columns:3,notes_height:0,x:0,width:@w,top:@top)
    rows=(months.size.to_f/columns).ceil;gap=17.0;cellw=(width-(columns-1)*gap)/columns;cellh=(top-35-notes_height-(rows-1)*16)/rows
    months.each_with_index { |m,i| month(m,x+(i%columns)*(cellw+gap),top-(i/columns)*(cellh+16),cellw,cellh) }
    notes(x,notes_height+25,width,notes_height) if notes_height>0
  end
  def annual
    case @id
    when 'min-02'
      cw=(@w-66)/31.0; row=(@top-50)/12
      1.upto(12) do |m|
        y=@top-(m-1)*row;text(CalendarEngine::MONTHS[m-1],0,y,64,size:8,color:@accent)
        1.upto(Date.new(options['year'],m,-1).day) do |d|
          date=Date.new(options['year'],m,d);@primary_dates<<date;x=66+(d-1)*cw
          text(d,x,y,cw,size:6,align: :center);text(CalendarEngine::SHORT_DAYS[date.cwday-1],x,y-15,cw,size:5,align: :center)
        end
        line(0,y-34,@w,y-34)
      end
    when 'min-03' then months_grid((1..12).to_a,columns:2)
    when 'nat-03'
      [1,7].each_with_index { |s,i| new_page if i>0;months_grid((s..s+5).to_a,columns:2,notes_height:65) }
    when 'pla-01'
      [1,4,7,10].each_with_index { |s,i| new_page if i>0;months_grid((s..s+2).to_a,columns:1,notes_height:125);text("#{i+1}. četrtletje · Cilji in roki",0,140,@w,size:12,style: :bold) }
    when 'pla-02'
      coordination_matrix
      new_page;months_grid((1..12).to_a,columns:3)
    when 'pla-03'
      [1,5,9].each_with_index { |s,i| new_page if i>0;months_grid((s..s+3).to_a,columns:2,notes_height:150) }
    when 'ele-03','geo-02'
      half=(@top-40)/2
      [1,7].each_with_index do |s,i|
        y=@top-i*half;text(i==0 ? '01–06':'07–12',0,y,42,size:12,style: :bold,color:@accent)
        (s..s+5).each_with_index { |m,k| month(m,52+(k%3)*((@w-52)/3),y-(k/3)*(half/2),(@w-75)/3,half/2-15) }
      end
    when 'geo-03'
      [1,4,7,10].each_with_index do |s,i|
        x=(i%2)*(@w/2+6);y=@top-(i/2)*((@top-30)/2)
        3.times { |j| month(s+j,x,y-j*((@top-30)/6),@w/2-19,(@top-30)/6-12) }
      end
    when 'nat-01' then months_grid((1..12).to_a,columns:3,x:22,width:@w-22)
    when 'ele-02' then months_grid((1..12).to_a,columns:4)
    else months_grid((1..12).to_a,columns: options['orientation']=='landscape' ? 4:3)
    end
  end
  def coordination_matrix
    text('Skupni načrt · Oseba ali projekt: __________________',0,@top,@w,size:11,style: :bold)
    per_page=@top<400 ? 6 : 12
    (0...12).each_slice(per_page).with_index do |months,page|
      new_page if page>0
      row=[(@top-130)/months.size,35].min
      months.each_with_index do |month,i|
        y=@top-30-i*row;text(CalendarEngine::MONTHS[month],0,y,78,size:9)
        4.times { |c| box(80+c*((@w-80)/4),y+4,(@w-80)/4,row) }
      end
      notes(0,90,@w,65,'Skupne naloge')
    end
  end
  def monthly
    undated=options['type']=='blank'&&options['undated']
    m=options['month'];year=options['year'];first=Date.new(year,m,1)
    if %w[min-02 nat-02 pla-02 pla-03].include?(@id)
      days=undated ? Array.new(31) : (first..Date.new(year,m,-1)).to_a
      row=(@top-70)/days.size
      text(undated ? 'Datum · Načrt · Opombe' : "#{CalendarEngine::MONTHS[m-1].capitalize} · Načrt · Opombe",0,@top,@w,size:11,style: :bold)
      days.each_with_index do |d,i|
        y=@top-24-i*row;@primary_dates<<d if d
        text(d ? "#{d.day}. #{CalendarEngine::SHORT_DAYS[d.cwday-1]}" : '____',0,y,60,size:8)
        line(65,y-11,@w,y-11)
        if @id=='pla-02';[0.35,0.65].each { |f| line(@w*f,y+3,@w*f,y-row+3) };end
      end
    else
      side=%w[min-03 ele-01 nat-01 geo-02].include?(@id) ? 110 : 0
      width=@w-side;bottom=%w[pla-01 nat-03 ele-02].include?(@id) ? 160 : 100
      weeks=undated ? Array.new(6) { Array.new(7) } : CalendarEngine.weeks(year,m)
      row=(@top-bottom-30)/weeks.size;cw=width/7
      CalendarEngine::SHORT_DAYS.each_with_index { |d,i| text(d,i*cw,@top,cw,size:10,align: :center,color:@accent) }
      weeks.each_with_index do |week,r|
        week.each_with_index do |d,c|
          y=@top-25-r*row;x=c*cw;box(x,y,cw,row)
          if d && d.month==m
            @primary_dates<<d;text(d.day,x+5,y-6,cw-10,size:11,style: :bold,color:@holidays.include?(d)&&@variant!=3 ? 'AA283B':'172B46')
            event=options['entries'].select { |e| e['date']==d.iso8601 }.map { |e| e['title'] }.join(' · ')
            text(event,x+5,y-25,cw-10,size:7,height:row-29) if event.present?
          end
        end
      end
      notes(width+15,@top,side-15,@top-35) if side>0
      notes(0,bottom-15,width,bottom-35, @id=='pla-01' ? 'Cilji · Roki · Naloge':'Zapiski')
    end
  end
  def planner
    type=options['type'];date=Date.iso8601(options['date']);monday=date-(date.cwday-1)
    if type=='daily'
      text(I18n.l(date,format: :long),0,@top,@w,size:15,style: :bold)
      15.times do |i|
        y=@top-34-i*((@top-110)/15.0);text("#{(i+7).to_s.rjust(2,'0')}:00",0,y,45,size:9);line(50,y-10,@w*0.65,y-10)
        rows=options['entries'].select { |e| e['date']==date.iso8601 && e['time'].to_s.split(':').first.to_i==i+7 }
        text(rows.map { |e| "#{e['time']} #{e['title']}" }.join(' · '),55,y,@w*0.6-10,size:8,height:18) if rows.any?
      end
      notes(@w*0.7,@top-34,@w*0.3,@top-75,'Naloge in zapiski')
    elsif type=='birthday'
      months_grid((1..12).to_a,columns:3)
      options['entries'].each { |e| @primary_dates<<Date.iso8601(e['date']) rescue nil }
    else
      text(type=='school' ? 'Predmet · Ura · Učilnica' : "#{I18n.l(monday)}–#{I18n.l(monday+6)} · Teden ISO #{monday.cweek} / #{monday.cwyear}",0,@top,@w,size:11,style: :bold)
      if %w[min-02 nat-02 nat-03 geo-01].include?(@id)
        7.times do |i|
          y=@top-30-i*((@top-100)/7.0);d=monday+i
          text("#{CalendarEngine::DAYS[i]} · #{I18n.l(d)}",0,y,@w,size:10,style: :bold,color:@accent)
          text('Začetek: ______  Konec: ______  Odmor: ______',0,y-21,@w,size:9)
          entries=options['entries'].select { |e| e['date']==d.iso8601 };text(entries.map { |e| "#{e['person']} #{e['time']} #{e['title']} #{e['code']}" }.join(' · '),0,y-38,@w,size:9)
          line(0,y-55,@w,y-55)
        end
      else
        cw=@w/8; row=(@top-130)/9
        text('Oseba / ura',0,@top-28,cw,size:8)
        7.times { |i| text(CalendarEngine::SHORT_DAYS[i],(i+1)*cw,@top-28,cw,size:9,align: :center) }
        9.times do |r|
          y=@top-48-r*row
          8.times { |c| box(c*cw,y,cw,row) }
          text(type=='school' ? "#{r+1}. ura" : '________',4,y-8,cw-8,size:8)
          7.times do |day|
            e=options['entries'].select { |item| item['date']==(monday+day).iso8601 }[r]
            next unless e
            text("#{e['person']} #{e['time']} #{e['title']} #{e['code']}",(day+1)*cw+3,y-7,cw-6,size:7,height:row-10)
          end
        end
      end
      notes(0,70,@w,45,'Predaja · Opombe')
    end
  end
  def lunar
    rows=AstronomicalEvent.where(kind:'moon',instant:Time.zone.local(options['year'],options['month'],1)...Time.zone.local(options['year'],options['month'],1).next_month).order(:instant)
    monthly
    new_page
    text('Lunine mene · Europe/Ljubljana',0,@top,@w,size:17,style: :bold)
    rows.each_with_index { |e,i| text("#{I18n.l(e.local_time)} · #{e.title}",0,@top-40-i*40,@w,size:12) }
    text('Vir: USNO. Časi so preračunani iz UTC v slovenski krajevni čas.',0,75,@w,size:9)
  end
  def holidays
    events=HolidayYear.new(options['year']).events
    y=@top
    title_width=@w-162
    events.each do |event|
      label=event.title.sub(/\A./,&:upcase)
      height=[pdf.height_of(label,width:title_width,size:10,style: :bold)+29,49].max
      if y-height<75
        new_page
        y=@top
      end
      @primary_dates<<event.on
      shade=event.work_free ? @accent : '657386'
      text(event.on.strftime('%d. %m.'),0,y,54,size:11,style: :bold,color:shade)
      text(CalendarEngine::SHORT_DAYS[event.on.cwday-1],0,y-18,54,size:9,color:shade)
      text(label,66,y,title_width,size:10,style: :bold,height:height-22)
      text(event.state_holiday ? 'Državni praznik' : 'Drug zakonsko določen dela prost dan',
        66,y-height+19,title_width,size:7,height:16,color:'657386')
      text(event.work_free ? 'Dela prost dan' : 'Ni dela prost dan',@w-88,y,88,size:8,height:30,color:shade)
      line(0,y-height+7,@w,y-height+7)
      y-=height+7
    end
    new_page if y<130
    y=@top if y<130
    text("Vir: ZPDPD in ZPDPD-I, veljavno od 17. 10. 2026. Preverjeno 20. 10. 2026.\nPrazniki ob koncu tedna se ne prenesejo na naslednji delovni dan.\nDatumi za prihodnja leta sledijo trenutno veljavnemu zakonu.\nPravna podlaga: pisrs.si/pregledPredpisa?id=ZAKO865",0,y-10,@w,size:8,height:75)
  end
  def new_page
    footer;pdf.start_new_page;header
  end
  def footer
    line(0,16,@w,16,color:@accent)
    pdf.stroke_color(@accent);pdf.stroke_rectangle([0,9],9,8)
    text('Koledar365 · koledar365.si',16,10,@w-70,size:8,color:@accent,height:16)
    text(pdf.page_number.to_s,@w-30,10,30,size:8,align: :right,height:16)
  end
  # The compact grids are planning overviews. Preserve every submitted field
  # in a paginated, readable ledger instead of silently clipping dense cells.
  def flow_section(title, content)
    remaining=content
    while remaining.present?
      new_page
      text(title,0,@top,@w,size:16,style: :bold)
      pdf.fill_color('172B46')
      unprinted=pdf.text_box(remaining,at:[0,@top-34],width:@w,height:@top-65,
        size:10,leading:4,overflow: :truncate)
      raise 'Besedila ni mogoče razporediti na stran.' if unprinted==remaining
      remaining=unprinted
    end
  end
  def render(path)
    header
    case options['type']
    when 'annual','name' then annual
    when 'monthly','blank' then monthly
    when 'lunar' then lunar
    when 'holidays' then holidays
    else planner
    end
    if options['entries'].any?
      content=options['entries'].each_with_index.map do |entry,i|
        fields=[entry['date'],entry['time'],entry['person'],entry['title'],entry['code']].select(&:present?)
        details=[]
        details << "Konec: #{entry['end_time']}" if entry['end_time'].present?
        details << "Odmor: #{entry['break']}" if entry['break'].present?
        details << "Opombe: #{entry['notes']}" if entry['notes'].present?
        "#{i+1}. #{fields.join(' · ')}#{details.any? ? "\n#{details.join(' · ')}" : ''}"
      end.join("\n\n")
      flow_section('Celoten seznam vnosov',content)
    end
    if options['notes'].present?
      flow_section('Osebni zapiski',options['notes'])
    end
    footer;pdf.render_file(path)
    {pages:pdf.page_count,primary_dates:primary_dates.compact.map(&:iso8601)}
  end
end
