require 'prawn'
require 'prawn/table'

# Coordinates are relative to the printable body, above the reserved footer.
# Small paper causes pagination, never smaller calendar figures.
class PdfRenderer
  include PrintLayouts::Annual
  include PrintLayouts::Worksheet
  attr_reader :pdf, :options, :primary_dates, :measurements
  MM = 72.0 / 25.4
  PALETTE = {'min'=>%w[175AD7 26756A 171717], 'ele'=>%w[7A5B40 87374C 171717], 'nat'=>%w[386B43 327084 171717], 'pla'=>%w[21466C 146B6D 171717], 'geo'=>%w[215BD0 8642A0 171717]}.freeze

  def initialize(options)
    @options=options; @id=options.fetch('design'); @family,variant=@id.split('-'); @variant=variant.to_i
    @bw=@variant==3; @accent=PALETTE.fetch(@family)[@variant-1]; @primary_dates=[]; @measurements=[]
    @pdf=Prawn::Document.new(page_size:options['paper'],page_layout:options['orientation'].to_sym,margin:0,
      info:{Title:"#{PrintCatalog::TYPES.fetch(options['type'])} #{options['year']}",Author:'Koledar365',Creator:"Koledar365 #{PrintCatalog::VERSION}"})
    fonts=Rails.root.join('app/assets/fonts')
    pdf.font_families.update('Sans'=>{normal:fonts.join('DejaVuSans.ttf').to_s,bold:fonts.join('DejaVuSans-Bold.ttf').to_s},'Serif'=>{normal:fonts.join('DejaVuSerif.ttf').to_s,bold:fonts.join('DejaVuSerif-Bold.ttf').to_s})
    pdf.font('Sans')
    margin={'A3'=>15,'A4'=>12,'A5'=>10}.fetch(options['paper'])*MM
    @left=margin; @bottom=(options['paper']=='A5' ? 18 : 20)*MM
    @w=pdf.bounds.width-2*margin; @h=pdf.bounds.height-margin-@bottom
    @holidays=CalendarEngine.work_free_dates(Date.new(options['year'],1,1),Date.new(options['year'],12,31)).to_set
  end

  def ink(hex)
    return hex unless @bw
    rgb=hex.scan(/../).map { |n|n.to_i(16) }; gray=(rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722).round
    '%02X%02X%02X' % [gray,gray,gray]
  end

  def text(value,x,y,width,size:9,style: :normal,align: :left,color:'172B46',height:nil,role: :body)
    value=value.to_s; return if value.empty?
    height ||= pdf.height_of(value,width:width,size:size,style:style)+2
    raise "Neveljavna postavitev: #{value.first(50)}" if width<=0 || height<=0 || x < -0.1 || x+width>@w+0.2 || y>@h+0.2 || y-height< -0.2
    pdf.fill_color(ink(color))
    rest=pdf.text_box(value,at:[x+@left,y+@bottom],width:width,height:height,size:size,style:style,align:align,overflow: :truncate)
    raise "Besedilo se ne prilega: #{value.first(60)}" if rest.present?
    @measurements << {page:pdf.page_number,role:role,size_pt:size,x:x,y:y,width:width,height:height}
  end

  def line(x,y,x2,y2,color:'CBD2D9',width:0.45)
    pdf.stroke_color(ink(color));pdf.line_width=[width,0.35].max
    pdf.stroke_line([x+@left,y+@bottom],[x2+@left,y2+@bottom])
  end

  def box(x,y,w,h,color:'CBD2D9',fill:nil)
    raise 'Polje sega zunaj strani.' if x< -0.1 || x+w>@w+0.2 || y-h< -0.2 || y>@h+0.2 || w<=0 || h<=0
    if fill;pdf.fill_color(ink(fill));pdf.fill_rectangle([x+@left,y+@bottom],w,h);end
    pdf.stroke_color(ink(color));pdf.line_width=0.45;pdf.stroke_rectangle([x+@left,y+@bottom],w,h)
  end

  def short(value,width,size:9)
    value=value.to_s.gsub(/\s+/,' ')
    return value if pdf.width_of(value,size:size)<=width
    value=value.chop while value.present? && pdf.width_of(value+'…',size:size)>width
    value+'…'
  end

  def period
    return options['workday_scope']=='month' ? "#{CalendarEngine::MONTHS[options['month']-1].capitalize} #{options['year']}" : options['year'].to_s if options['type']=='workdays'
    return 'Datum / obdobje: ____________________' if options['type']=='blank' && options['undated']
    case options['type']
    when 'monthly','lunar','blank' then "#{CalendarEngine::MONTHS[options['month']-1].capitalize} #{options['year']}"
    when 'daily' then I18n.l(Date.iso8601(options['date']),format: :long)
    when 'weekly','shift','family','school'
      d=Date.iso8601(options['date']);d-=d.cwday-1
      "#{I18n.l(d)}–#{I18n.l(d+6)} · Teden #{d.cweek} / #{d.cwyear}"
    else options['year'].to_s
    end
  end

  def header(subtitle=nil)
    title=options['name'].presence ? "Ime: #{options['name']}" : PrintCatalog::TYPES.fetch(options['type'])
    pdf.font(@family=='ele' ? 'Serif' : 'Sans')
    size=options['name'].to_s.length>45 ? 16 : (@w<400 ? 20 : 24)
    title_width=options['photo'] ? @w-120 : (@id=='geo-03' ? @w-65 : @w)
    title_height=pdf.height_of(title,width:title_width,size:size,style: :bold)+3
    text(title,0,@h,title_width,size:size,style: :bold,height:title_height,color:@accent,align:@id=='ele-02' ? :center : :left,role: :title)
    if options['photo']
      pdf.image(PrivatePhoto.path(options['photo'],bw:@bw).to_s,at:[@left+@w-105,@bottom+@h],fit:[36*MM,24*MM])
      title_height=[title_height,24*MM].max
    end
    pdf.font('Sans'); y=@h-title_height-10
    text(subtitle || period,0,y,@w,size:10,height:28,align:@id=='ele-02' ? :center : :left)
    @top=y-42
    case @id
    when 'ele-02'
      line(0,@top+6,@w,@top+6,color:@accent,width:1.2);line(0,@top+3,@w,@top+3,color:@accent)
    when 'ele-03' then line(0,@top+6,@w,@top+6,color:@accent,width:2)
    when 'nat-01'
      4.times do |i|
        y=@top-18-i*27;line(3,y,13,y-20,color:@accent)
        pdf.stroke_color(ink(@accent));pdf.stroke_ellipse([@left+9,@bottom+y-6],5,2)
      end
    when 'nat-02'
      pdf.stroke_color(ink(@accent));pdf.line_width=0.6
      pdf.stroke { pdf.move_to([@left,@bottom+@top+2]);[[0.15,12],[0.21,5],[0.3,19],[0.38,3],[0.48,9],[0.55,2],[1,2]].each { |x,h| pdf.line_to([@left+@w*x,@bottom+@top+h]) } }
      @top-=6
    when 'geo-01' then box(0,@top+6,30,5,color:@accent,fill:@accent)
    when 'geo-02'
      pdf.fill_color(ink(@accent));pdf.fill_polygon([@left+@w-35,@bottom+@top+4],[@left+@w,@bottom+@top+4],[@left+@w,@bottom+@top+19])
    when 'geo-03'
      return if options['photo']
      pdf.stroke_color('171717');pdf.stroke_circle([@left+@w-23,@bottom+@h-22],21)
      badge=options['type']=='blank' && options['undated'] ? '—' : options['year'].to_s
      text(badge,@w-44,@h-16,42,size:9,align: :center,height:15)
    end
  end

  def notes(x,y,w,h,label='Zapiski',style: :lines)
    return if h<31 || w<40
    text(label,x,y,w,size:9,style: :bold,color:@accent)
    if style==:checks
      ((h-24)/20).floor.times { |i| box(x,y-23-i*20,7,7);line(x+14,y-30-i*20,x+w,y-30-i*20) }
    elsif style==:dots
      ((h-24)/18).floor.times { |r| (w/18).floor.times { |c| pdf.fill_color(ink('B8BDC3'));pdf.fill_circle([@left+x+c*18,@bottom+y-25-r*18],0.45) } }
    elsif style!=:plain
      ((h-24)/18).floor.times { |i|line(x,y-26-i*18,x+w,y-26-i*18) }
    end
  end

  def new_page(subtitle=nil)
    footer;pdf.start_new_page;header(subtitle)
  end

  def footer
    # Footer is physically separate from the body. Every style has a black signature.
    y=(options['paper']=='A5' ? 8 : 10)*MM
    pdf.stroke_color('000000');pdf.line_width=0.5
    pdf.stroke_rectangle([@left,y+8],9,9);pdf.stroke_line([@left,y+5],[@left+9,y+5])
    pdf.fill_color('000000')
    pdf.draw_text('Koledar365 · koledar365.si',at:[@left+16,y],size:8)
    pdf.draw_text(pdf.page_number.to_s,at:[@left+@w-15,y],size:8)
  end

  def flow_section(title,content)
    remaining=content
    while remaining.present?
      new_page(title)
      pdf.fill_color(ink('172B46'))
      rest=pdf.text_box(remaining,at:[@left,@bottom+@top],width:@w,height:@top,size:10,leading:4,overflow: :truncate)
      raise 'Besedila ni mogoče razporediti na stran.' if rest==remaining
      remaining=rest
    end
  end

  def render(path)
    header
    case options['type']
    when 'annual','name' then annual
    when 'workdays'
      options['workday_scope']=='month' ? monthly : annual
      selected=options['workday_scope']=='month' ? [options['month']] : (1..12).to_a
      totals=selected.map { |m| days=CalendarEngine.working_days(Date.new(options['year'],m,1),Date.new(options['year'],m,-1)); "#{CalendarEngine::MONTHS[m-1].capitalize}: #{days[:working_days]} delovnih dni / #{days[:calendar_days]} koledarskih dni / #{days[:working_days]*8} ur (8 ur na dan)." }
      sum=selected.sum { |m|CalendarEngine.working_days(Date.new(options['year'],m,1),Date.new(options['year'],m,-1))[:working_days] }
      flow_section('Delovni dnevi · povzetek',"Privzeti delovni teden: ponedeljek–petek. Zakonski dela prosti dnevi so izločeni enkrat; prazniki ob koncu tedna se ne prenašajo. Urni obseg je informativen.\n\n"+totals.join("\n\n")+"\n\nSkupaj: #{sum} delovnih dni. Vir: ZPDPD in ZPDPD-I; koledar365.si/viri-in-metodologija/")
    when 'monthly','blank' then options['type']=='blank' && options['blank_layout']=='weekly' ? planner : monthly
    when 'lunar' then lunar
    when 'holidays' then holidays
    else planner
    end
    if options['entries'].any?
      content=options['entries'].each_with_index.map do |e,i|
        fields=[e['date'],e['time'],e['person'],e['title'],e['code']].select(&:present?)
        details=[]
        {'end_time'=>'Konec','break'=>'Odmor v minutah','notes'=>'Opombe','room'=>'Učilnica'}.each { |k,v|details << "#{v}: #{e[k]}" if e[k].present? }
        details << 'Opravljeno' if e['done']=='1'
        "#{i+1}. #{fields.join(' · ')}#{details.any? ? "\n#{details.join(' · ')}" : ''}"
      end.join("\n\n")
      flow_section('Celoten seznam vnosov',content)
    end
    flow_section('Osebni zapiski',options['notes']) if options['notes'].present?
    footer;pdf.render_file(path)
    {fonts_used:pdf.font_registry.values.map { |font|File.basename(font.name) }.uniq,pages:pdf.page_count,primary_dates:primary_dates.compact.map(&:iso8601),layout:@id,
     color_mode:@bw ? 'monochrome_bw' : 'color',minimum_date_size_pt:measurements.select { |r|r[:role]==:date }.map { |r|r[:size_pt] }.min,
     printable_body_mm:{width:(@w/MM).round(2),height:(@h/MM).round(2)},footer_baseline_mm:options['paper']=='A5' ? 8 : 10}
  end
end
