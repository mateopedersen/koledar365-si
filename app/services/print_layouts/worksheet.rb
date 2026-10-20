module PrintLayouts
  module Worksheet
    def workspace
      side=%w[min-03 ele-01 geo-02].include?(@id) ? [@w*0.24,86].max : 0
      x=@id=='nat-01' ? 24 : (@id=='geo-02' ? 14 : 0)
      bottom=case @id
      when 'ele-02','pla-01' then @top>380 ? 106 : 48
      when 'nat-03','pla-03','geo-01','geo-03' then 58
      when 'nat-02' then 45
      else 30
      end
      width=@w-x-(side>0 ? side+14 : 0)
      if side>0
        sx=x+width+14;line(sx-7,@top,sx-7,0,color:@accent)
        notes(sx,@top,side,@top*0.5,@id=='ele-01' ? 'Prednostne naloge' : 'Zapiski')
        notes(sx,@top*0.46,side,@top*0.46,@id=='min-03' ? 'Opravljeno' : 'Naslednji koraki',style: :checks)
      end
      if @id=='ele-02'
        2.times { |i|notes(x+i*(width/2+4),bottom-4,width/2-8,bottom-8,i==0 ? 'Pomembno' : 'Pregled') }
      elsif @id=='pla-01'
        3.times { |i|notes(x+i*width/3,bottom-4,width/3-8,bottom-8,"Cilj #{i+1}",style: :checks) }
      elsif @id=='geo-01'
        box(x,bottom-2,width,bottom-4);notes(x+7,bottom-9,width-14,bottom-18,'Naloge in zapiski',style: :checks)
      else
        label={'nat-02'=>'Opombe ob koncu obdobja','nat-03'=>'Opažanja','pla-03'=>'Predaja in seštevek','geo-03'=>'Pregled obdobja'}.fetch(@id,'Zapiski')
        notes(x,bottom-3,width,bottom-6,label,style:options['ruling']=='dotted' ? :dots : (options['ruling']=='plain' ? :plain : :lines))
      end
      line(3,@top,3,0,color:@accent,width:2) if @id=='geo-02'
      {x:x,width:width,top:@top,bottom:bottom+10}
    end

    def monthly
      undated=options['type']=='blank' && options['undated'];m=options['month'];year=options['year']
      return monthly_ledger(undated) if %w[min-02 pla-02 pla-03].include?(@id)
      weeks=undated ? Array.new(6) { Array.new(7) } : CalendarEngine.weeks(year,m)
      area=workspace;capacity=[((area[:top]-area[:bottom]-24)/48).floor,1].max
      weeks.each_slice(capacity).with_index do |group,page|
        if page>0;new_page;area=workspace;end
        x=area[:x];w=area[:width];top=area[:top];cw=w/7.0;row=[(top-area[:bottom]-24)/group.size,100].min
        CalendarEngine::SHORT_DAYS.each_with_index { |d,i|text(d,x+i*cw,top,cw,size:9,align: :center,color:@accent) }
        group.each_with_index do |week,r|
          gap=%w[nat-03 geo-01].include?(@id) ? 4 : 0;yy=top-24-r*row
          week.each_with_index do |d,c|
            xx=x+c*cw
            if %w[min-01 min-03 ele-01 nat-01 nat-02].include?(@id)
              line(xx,yy,xx+cw-gap,yy,color:@accent);line(xx,yy-row+gap,xx+cw-gap,yy-row+gap);line(xx,yy,xx,yy-row+gap)
              line(xx+cw,yy,xx+cw,yy-row+gap) if c==6
            else
              box(xx,yy,cw-gap,row-gap,color:@id=='ele-02' ? @accent : 'CBD2D9')
            end
            next unless d && d.month==m
            @primary_dates<<d
            text(d.day,xx+4,yy-5,cw-gap-8,size:10,style: :bold,color:@holidays.include?(d) ? 'AA283B' : '172B46',role: :date)
            titles=options['entries'].select { |e|e['date']==d.iso8601 }.map { |e|e['title'] }.join(' · ')
            text(short(titles,cw-gap-8,size:8),xx+4,yy-22,cw-gap-8,size:8,height:12) if titles.present?
          end
        end
      end
    end

    def monthly_ledger(undated)
      days=undated ? Array.new(31) : (Date.new(options['year'],options['month'],1)..Date.new(options['year'],options['month'],-1)).to_a
      area=workspace;capacity=[((area[:top]-area[:bottom]-24)/26).floor,1].max
      days.each_slice(capacity).with_index do |group,page|
        if page>0;new_page;area=workspace;end
        x=area[:x];w=area[:width];top=area[:top]
        headings=case @id
        when 'pla-02' then ['Datum',*options['entries'].map { |e|e['person'] }.select(&:present?).uniq.first(3)]
        when 'pla-03' then ['Datum','Naloga / izmena','Ura','Opombe']
        else ['Datum','Načrt','Sprotni zapiski']
        end
        headings=['Datum','Oseba / projekt 1','Oseba / projekt 2'] if headings.size<2
        text(headings[0],x,top,65,size:8,style: :bold);cell=(w-65)/(headings.size-1)
        headings.drop(1).each_with_index { |v,i|text(short(v,cell-8,size:8),x+65+i*cell,top,cell-8,size:8,style: :bold) }
        group.each_with_index do |date,r|
          y=top-24-r*26;@primary_dates<<date if date
          text(date ? "#{date.day}. #{CalendarEngine::SHORT_DAYS[date.cwday-1]}" : '____',x,y,60,size:10,role: :date)
          line(x,y-20,x+w,y-20)
          headings.drop(1).each_index { |i|line(x+65+i*cell,y+3,x+65+i*cell,y-20) } if @id!='min-02'
          next unless date
          entries=options['entries'].select { |e|e['date']==date.iso8601 }
          if @id=='pla-02'
            headings.drop(1).each_with_index { |person,i|text(short(entries.select { |e|e['person']==person }.map { |e|e['title'] }.join(' · '),cell-8),x+69+i*cell,y,cell-8,size:9) }
          else
            text(short(entries.map { |e|e['title'] }.join(' · '),cell-8),x+69,y,cell-8,size:9)
          end
        end
      end
    end

    def planner
      return birthdays if options['type']=='birthday'
      return daily if options['type']=='daily'
      date=Date.iso8601(options['date']);monday=date-(date.cwday-1);undated=options['type']=='blank' && options['undated']
      @primary_dates.concat((monday..monday+6).to_a) unless undated
      %w[min-02 nat-02 nat-03 geo-01].include?(@id) ? day_lanes(monday,undated) : roster(monday,undated)
    end

    def day_lanes(monday,undated)
      area=workspace;capacity=[((area[:top]-area[:bottom])/77).floor,1].max
      (0..6).each_slice(capacity).with_index do |group,page|
        if page>0;new_page;area=workspace;end
        group.each_with_index do |day,r|
          date=monday+day;y=area[:top]-r*77;x=area[:x];w=area[:width]
          box(x,y,w,70) if %w[nat-03 geo-01].include?(@id)
          pad=%w[nat-03 geo-01].include?(@id) ? 7 : 0
          label=undated ? CalendarEngine::DAYS[day]+' · __________' : "#{CalendarEngine::DAYS[day]} · #{I18n.l(date)}"
          text(label,x+pad,y-5,w-2*pad,size:10,style: :bold,color:@accent,role: :date)
          text('Začetek: ______  Konec: ______  Odmor: ______',x+pad,y-25,w-2*pad,size:8)
          entries=options['entries'].select { |e|e['date']==date.iso8601 }
          text(short(entries.map { |e|[e['person'],e['time'],e['title'],e['code']].select(&:present?).join(' ') }.join(' · '),w-2*pad),x+pad,y-43,w-2*pad,size:9)
          line(x+pad,y-65,x+w-pad,y-65)
        end
      end
    end

    def roster(monday,undated)
      area=workspace;type=options['type'];people=options['entries'].map { |e|e['person'] }.select(&:present?).uniq
      labels=type=='school' ? (1..9).map { |n|"#{n}. ura" } : (people.any? ? people : Array.new(5,'________'))
      perpage=[((area[:top]-area[:bottom]-32)/49).floor,1].max
      labels.each_slice(perpage).with_index do |rows,page|
        if page>0;new_page;area=workspace;end
        x=area[:x];w=area[:width];y=area[:top];cw=w/8.0
        text(type=='school' ? 'Ura' : 'Oseba',x,y,cw,size:8,style: :bold)
        7.times { |i|text(CalendarEngine::SHORT_DAYS[i]+(undated ? '' : "\n#{(monday+i).day}."),x+(i+1)*cw,y,cw,size:8,align: :center,height:26) }
        rows.each_with_index do |person,r|
          yy=y-32-r*49;8.times { |c|box(x+c*cw,yy,cw,49) };text(short(person,cw-6,size:8),x+3,yy-7,cw-6,size:8)
          7.times do |day|
            entries=options['entries'].select { |e|e['date']==(monday+day).iso8601 && (people.empty? || type=='school' || e['person']==person) }
            entry=type=='school' ? entries[(page*perpage)+r] : entries.first
            next unless entry
            tx=x+(day+1)*cw+3
            text(short(entry['time'],cw-6,size:8),tx,yy-5,cw-6,size:8)
            text(short(entry['title'].presence || entry['code'],cw-6,size:8),tx,yy-18,cw-6,size:8)
            text(short(entry['end_time'].presence ? "–#{entry['end_time']}" : entry['room'],cw-6,size:8),tx,yy-31,cw-6,size:8)
          end
        end
      end
      shift_totals if type=='shift' && options['entries'].any?
    end

    def shift_totals
      totals=options['entries'].group_by { |e|e['person'].presence || 'Brez imena' }.map do |person,entries|
        complete=entries.select { |e|e['time'].present? && e['end_time'].present? }
        if complete.empty?
          "#{person}: ure niso izračunane. Vnosi brez začetka ali konca: #{entries.size}."
        else
          minutes=complete.sum { |e|PlannerCalendar.minutes(e)-e['break'].to_i }
          "#{person}: #{minutes/60} h #{minutes%60} min (#{complete.size} vnosov s časom). Brez časa: #{entries.size-complete.size}."
        end
      end
      flow_section('Seštevek vseh vnosov',"#{totals.join("\n")}\n\nKonec pred začetkom pomeni naslednji koledarski dan. Odmor se odšteje. Izračun upošteva dejansko trajanje v časovnem pasu Europe/Ljubljana, vključno s premikom ure. Vnosi brez začetka ali konca niso vključeni v seštevek.")
    end

    def daily
      date=Date.iso8601(options['date']);@primary_dates<<date
      area=workspace;capacity=[((area[:top]-area[:bottom])/28).floor,1].max
      (options.fetch('start_hour',7)..options.fetch('end_hour',21)).each_slice(capacity).with_index do |hours,page|
        if page>0;new_page;area=workspace;end
        hours.each_with_index do |hour,i|
          y=area[:top]-i*28;x=area[:x];w=area[:width]
          text('%02d:00' % hour,x,y,45,size:10,role: :date)
          entries=options['entries'].select { |e|e['date']==date.iso8601 && e['time'].present? && e['time'][0,2].to_i==hour }
          text(short(entries.map { |e|"#{e['done']=='1' ? '✓ ' : ''}#{e['title']}" }.join(' · '),w-55),x+55,y,w-55,size:9)
          line(x+50,y-20,x+w,y-20)
        end
      end
      tasks=options['entries'].select { |e|e['time'].blank? && e['date']==date.iso8601 }
      flow_section('Naloge brez določene ure',tasks.map { |e|"#{e['done']=='1' ? '☑' : '☐'} #{e['title']}" }.join("\n\n")) if tasks.any?
    end

    def birthdays
      entries=options['entries'].select { |e|e['date'].present? }.map do |e|
        original=Date.iso8601(e['date']);year=options['year']
        date=if original.month==2 && original.day==29 && !Date.gregorian_leap?(year)
          case options['leap_policy'];when 'march1' then Date.new(year,3,1);when 'leap_only' then nil;else Date.new(year,2,28);end
        else Date.new(year,original.month,original.day);end
        [date,e,original]
      end
      months_grid((1..12).to_a,columns:3,notes_height:35)
      if entries.any?
        lines=entries.sort_by { |d,e,o|[d || Date.new(options['year'],12,31),e['title'].to_s] }.map do |date,e,original|
          "#{date ? I18n.l(date) : 'Letos brez datuma'} · #{e['person']} #{e['title']}#{original.month==2 && original.day==29 ? ' (rojstni dan 29. februarja)' : ''}"
        end
        flow_section('Rojstni dnevi v izbranem letu',lines.join("\n\n"))
      end
    end

    def lunar
      monthly
      rows=AstronomicalEvent.where(kind:'moon',instant:Time.zone.local(options['year'],options['month'],1)...Time.zone.local(options['year'],options['month'],1).next_month).order(:instant)
      flow_section('Lunine mene · Europe/Ljubljana',rows.map { |e|"#{I18n.l(e.local_time)} · #{e.title}" }.join("\n\n")+"\n\nVir: USNO. Časi so preračunani iz UTC v slovenski krajevni čas.")
    end

    def holidays
      area=workspace;y=area[:top]
      HolidayYear.new(options['year']).events.each do |event|
        x=area[:x];w=area[:width];tw=w-67;title=event.title.sub(/\A./,&:upcase)
        height=pdf.height_of(title,width:tw-8,size:10,style: :bold)+28
        if y-height<area[:bottom];new_page;area=workspace;y=area[:top];end
        @primary_dates<<event.on;shade=event.work_free ? @accent : '657386'
        box(x,y,w,height+1) if %w[ele-02 nat-03 geo-01].include?(@id)
        text(event.on.strftime('%d. %m.'),x+4,y-4,58,size:10,style: :bold,color:shade,role: :date)
        text(CalendarEngine::SHORT_DAYS[event.on.cwday-1],x+4,y-20,58,size:8)
        text(title,x+67,y-4,tw-8,size:10,style: :bold)
        text(event.work_free ? 'Dela prost dan' : 'Ni dela prost dan',x+67,y-height+17,tw-8,size:8,color:shade)
        line(x,y-height-3,x+w,y-height-3);y-=height+9
      end
      source='Vir: ZPDPD in ZPDPD-I, veljavno od 17. 10. 2026. Preverjeno 20. 10. 2026. Prazniki ob koncu tedna se ne prenesejo na naslednji delovni dan. Datumi za prihodnja leta sledijo trenutno veljavnemu zakonu. Pravna podlaga: pisrs.si/pregledPredpisa?id=ZAKO865'
      height=pdf.height_of(source,width:area[:width],size:8)+4
      if y-height<area[:bottom];new_page;area=workspace;y=area[:top];end
      text(source,area[:x],y,area[:width],size:8,height:height)
    end
  end
end
