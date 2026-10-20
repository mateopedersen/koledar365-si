module PrintLayouts
  module Annual
    def month(month,x,y,w,h,reference:false)
      weeks=CalendarEngine.weeks(options['year'],month);cw=w/8.0
      raise 'Mesečni blok je premajhen.' if cw<15 || h<128
      title=CalendarEngine::MONTHS[month-1].capitalize
      text(title,x,y,w,size:10,style: :bold,color:@accent)
      line(x,y-16,x+w,y-16,color:@accent)
      text('T',x,y-23,cw,size:8)
      CalendarEngine::SHORT_DAYS.each_with_index { |d,i|text(d,x+(i+1)*cw,y-23,cw,size:8,align: :center) }
      row=[(h-43)/6,18].min
      weeks.each_with_index do |week,r|
        yy=y-42-r*row
        text(week.first.cweek,x,yy,cw,size:8,color:'657386')
        week.each_with_index do |d,c|
          next unless d.month==month
          @primary_dates<<d unless reference
          color=@holidays.include?(d) ? 'A72B3E':'172B46'
          text(d.day,x+(c+1)*cw,yy,cw,size:9,align: :center,color:color,role: :date)
        end
      end
    end

    def months_grid(months,columns:3,notes_height:0,x:0,width:@w,top:@top,card:false,show_notes:true)
      gap=16.0;minimum=card ? 148 : 136
      columns=[columns,((width+gap)/minimum).floor].min.clamp(1,4)
      cellw=(width-(columns-1)*gap)/columns
      maxrows=[((top-notes_height+gap)/154).floor,1].max
      months.each_slice(maxrows*columns).with_index do |group,page|
        new_page if page>0;top=@top if page>0
        rows=(group.size.to_f/columns).ceil
        cellh=[(top-notes_height-(rows-1)*16)/rows,220].min
        group.each_with_index do |m,i|
          xx=x+(i%columns)*(cellw+gap);yy=top-(i/columns)*(cellh+16)
          if card
            box(xx,yy,cellw,cellh,color:@accent);month(m,xx+6,yy-6,cellw-12,cellh-12)
          else
            month(m,xx,yy,cellw,cellh)
          end
        end
        notes(x,notes_height-5,width,notes_height-10,'Načrti in pomembni datumi') if show_notes && notes_height>=42
      end
    end

    def annual
      case @id
      when 'min-02' then annual_timeline
      when 'min-03','nat-03'
        2.times do |half|
          new_page if half>0
          months_grid((half*6+1..half*6+6).to_a,columns:2,notes_height:80,card:@id=='nat-03')
        end
      when 'ele-01','nat-02' then quarter_bands
      when 'ele-02'
        months_grid((1..12).to_a,columns:4,x:8,width:@w-16,notes_height:55,card:true)
      when 'ele-03','geo-02' then half_year_panels
      when 'nat-01'
        months_grid((1..12).to_a,columns:3,x:24,width:@w-24,notes_height:48)
      when 'pla-01'
        4.times do |q|
          new_page if q>0
          text("#{q+1}. četrtletje",0,@top,@w,size:13,style: :bold)
          reserve=@top>400 ? 180 : 45
          months_grid((q*3+1..q*3+3).to_a,columns:3,top:@top-26,notes_height:reserve,show_notes:false)
          if @top>400
            3.times { |i|notes(i*@w/3,160,@w/3-12,125,["Cilj #{i+1}",'Rok','Pregled'][i],style: :checks) }
          end
        end
      when 'pla-02'
        coordination_matrix;new_page('Koledarski pregled · '+options['year'].to_s)
        months_grid((1..12).to_a,columns:3)
      when 'pla-03'
        3.times do |part|
          new_page if part>0
          months=(part*4+1..part*4+4).to_a
          months_grid(months,columns:2,notes_height:100,show_notes:false)
          months.each_with_index do |m,i|
            d=Date.new(options['year'],m,1);stats=CalendarEngine.working_days(d,d.end_of_month)
            text("#{CalendarEngine::MONTHS[m-1].capitalize}: #{stats[:working_days]} delovnih dni",0,90-i*18,@w,size:8)
          end
        end
      when 'geo-01'
        months_grid((1..12).to_a,columns:3,notes_height:45,card:true)
      when 'geo-03' then quarter_quadrants
      else
        months_grid((1..12).to_a,columns:options['orientation']=='landscape' ? 4:3,notes_height:35)
      end
    end

    def quarter_bands
      sidebar=@id=='ele-01' ? [@w*0.22,86].max : 0
      width=@w-(sidebar>0 ? sidebar+14 : 0)
      cols=[3,((width+16)/136).floor].min.clamp(1,3)
      band=(3.0/cols).ceil*144+20;y=@top
      4.times do |q|
        if y-band<35;new_page;y=@top;end
        text("#{q+1}. četrtletje",0,y,width,size:10,style: :bold)
        cw=(width-(cols-1)*16)/cols
        3.times { |i|month(q*3+i+1,(i%cols)*(cw+16),y-20-(i/cols)*144,cw,128) }
        notes(@w-sidebar,y,sidebar,[band-15,y].min,'Roki in poudarki') if sidebar>0
        y-=band+10
      end
      notes(0,y-4,@w,y-8,'Sezonski načrti') if y>40
    end

    def half_year_panels
      offset=@id=='geo-02' ? 20 : 0;width=@w-offset
      cols=[3,((width+16)/136).floor].min.clamp(1,3)
      panel=(6.0/cols).ceil*144+28;y=@top
      if panel>@top-15
        2.times do |half|
          new_page if half>0
          text(half==0 ? '01—06' : '07—12',offset,@top,95,size:18,style: :bold)
          months_grid((half*6+1..half*6+6).to_a,columns:cols,x:offset,width:width,top:@top-28,notes_height:20)
        end
        return
      end
      2.times do |half|
        if y-panel<15;new_page;y=@top;end
        text(half==0 ? '01—06' : '07—12',offset,y,95,size:18,style: :bold)
        line(3,y,3,y-panel+10,color:@accent,width:2) if offset>0
        cw=(width-(cols-1)*16)/cols
        6.times { |i|month(half*6+i+1,offset+(i%cols)*(cw+16),y-28-(i/cols)*144,cw,128) }
        y-=panel+18
      end
      notes(offset,y,width,y-2,'Pomembni datumi') if y>40
    end

    def quarter_quadrants
      if @top<475 || @w<300
        4.times do |q|
          new_page if q>0
          text("#{q+1}. četrtletje",0,@top,@w,size:11,style: :bold)
          months_grid((q*3+1..q*3+3).to_a,columns:3,top:@top-24,notes_height:45)
        end
      else
        2.times do |half|
          new_page if half>0
          2.times do |col|
            q=half*2+col;x=col*(@w/2+8);width=@w/2-8
            text("#{q+1}. četrtletje",x,@top,width,size:11,style: :bold)
            3.times { |i|month(q*3+i+1,x,@top-26-i*158,width,140) }
            notes(x,@top-508,width,@top-510,'Pregled') if @top>550
          end
        end
      end
    end

    def annual_timeline
      dates_per_band=[((@w-80)/19).floor,31].min.clamp(7,31)
      y=@top
      1.upto(12) do |m|
        (1..Date.new(options['year'],m,-1).day).each_slice(dates_per_band) do |days|
          if y<55;new_page;y=@top;end
          text(CalendarEngine::MONTHS[m-1].capitalize,0,y,77,size:9,style: :bold,color:@accent)
          days.each_with_index do |d,i|
            date=Date.new(options['year'],m,d);@primary_dates<<date
            x=80+i*19
            text(d,x,y,19,size:9,align: :center,role: :date)
            text(CalendarEngine::SHORT_DAYS[date.cwday-1],x,y-17,19,size:8,align: :center)
          end
          line(80,y-32,@w,y-32);y-=48
        end
      end
    end

    def coordination_matrix
      labels=options['entries'].map { |e|e['person'] }.select(&:present?).uniq.first(5)
      labels=Array.new(4,'Oseba / projekt') if labels.empty?
      first=80.0;cw=(@w-first)/12;row=[(@top-80)/(labels.size+1),75].min
      12.times { |i|text(CalendarEngine::MONTHS[i].first(3),first+cw*i,@top,cw,size:8,align: :center) }
      labels.each_with_index do |person,i|
        y=@top-24-i*row;text(short(person,first-6),3,y-5,first-6,size:9)
        12.times { |m|box(first+m*cw,y,cw,row) }
      end
      notes(0,@top-35-labels.size*row,@w,@top-40-labels.size*row,'Skupni načrti')
    end
  end
end
