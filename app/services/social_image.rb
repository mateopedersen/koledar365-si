class SocialImage
  VERSION='1'
  def self.key(record)
    Digest::SHA256.hexdigest([VERSION,record.class.name,record.id,record.updated_at.to_i,record.respond_to?(:exact) ? record.exact : record.title].to_json).first(20)
  end
  def self.render(record,path)
    person=record.is_a?(PersonName);title=person ? "Koledar z imenom\n#{record.exact}" : record.title
    year=person ? nil : record.year;month=person ? nil : record.month
    label=year ? year.to_s : '2027–2030'
    subtitle=person ? '15 predlog PDF in WebP · 4 leta' : 'Slovenski koledar in osebno načrtovanje'
    pdf=Prawn::Document.new(page_size:[1200,630],margin:0)
    pdf.font_families.update('Sans'=>{normal:Rails.root.join('app/assets/fonts/DejaVuSans.ttf').to_s,bold:Rails.root.join('app/assets/fonts/DejaVuSans-Bold.ttf').to_s});pdf.font('Sans')
    pdf.fill_color('F5F5F2');pdf.fill_rectangle([0,630],1200,630)
    pdf.fill_color('FFFFFF');pdf.fill_rectangle([0,630],400,8)
    pdf.fill_color('164C86');pdf.fill_rectangle([400,630],400,8)
    pdf.fill_color('B72E43');pdf.fill_rectangle([800,630],400,8)
    pdf.fill_color('182E47');pdf.text_box('Koledar365',at:[65,555],width:700,height:70,size:40,style: :bold)
    rest=pdf.text_box(title,at:[65,435],width:665,height:245,size:46,style: :bold,leading:8)
    raise 'Naslov predolg za sliko.' if rest.present?
    pdf.fill_color('5C6978');pdf.text_box(subtitle,at:[65,155],width:680,height:60,size:21)
    pdf.text_box('koledar365.si',at:[65,74],width:600,height:35,size:20)
    pdf.fill_color('FFFFFF');pdf.fill_rectangle([785,505],350,380)
    pdf.stroke_color('D7DDE1');pdf.stroke_rectangle([785,505],350,380)
    pdf.fill_color('B72E43');pdf.fill_rectangle([785,505],350,8)
    pdf.fill_color('182E47');pdf.text_box(label,at:[810,464],width:300,height:70,size:year ? 56:40,style: :bold,align: :center)
    if year && CalendarEngine::YEARS.include?(year)
      m=month || 1
      pdf.text_box(CalendarEngine::MONTHS[m-1].capitalize,at:[810,385],width:300,height:35,size:22,align: :center)
      weeks=CalendarEngine.weeks(year,m)
      CalendarEngine::SHORT_DAYS.each_with_index { |d,c|pdf.text_box(d,at:[803+c*46,335],width:40,height:25,size:13,align: :center) }
      weeks.each_with_index do |week,r|
        week.each_with_index do |date,c|
          next unless date.month==m
          pdf.fill_color(c==6 ? 'B72E43':'182E47');pdf.text_box(date.day.to_s,at:[803+c*46,300-r*24],width:40,height:24,size:15,align: :center)
        end
      end
    else
      pdf.fill_color('182E47');pdf.text_box(person ? record.exact : "Vaš dan.\nVaši načrti.",at:[810,340],width:300,height:140,size:person ? 32:30,style: :bold,align: :center)
      pdf.fill_color('B72E43');pdf.text_box('Koledar365',at:[810,178],width:300,height:35,size:20,align: :center)
    end
    pdf_path=path.sub_ext('.pdf');pdf.render_file(pdf_path)
    RenderCommand.run!(ENV.fetch('PDFTOPPM_BIN','pdftoppm'),'-singlefile','-r','72','-png',pdf_path.to_s,path.sub_ext('').to_s,timeout:30)
    File.delete(pdf_path)
  end
end
