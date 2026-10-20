require 'prawn'
require 'open3'
pdf=Prawn::Document.new(page_size:[1200,630],margin:0)
fonts=Rails.root.join('app/assets/fonts')
pdf.font_families.update('Sans'=>{normal:fonts.join('DejaVuSans.ttf').to_s,bold:fonts.join('DejaVuSans-Bold.ttf').to_s})
pdf.font('Sans')
pdf.fill_color('F5F6F7');pdf.fill_rectangle([0,630],1200,630)
pdf.fill_color('FFFFFF');pdf.fill_rectangle([0,630],400,8)
pdf.fill_color('0054A4');pdf.fill_rectangle([400,630],400,8)
pdf.fill_color('CC2B40');pdf.fill_rectangle([800,630],400,8)
pdf.fill_color('1B304D');pdf.text_box('Koledar',at:[65,554],width:290,height:60,size:45,style: :bold)
pdf.fill_color('CC2B40');pdf.text_box('365',at:[268,554],width:140,height:60,size:45,style: :bold)
pdf.fill_color('1B304D');pdf.text_box("Vaš dan.\nVaši načrti.",at:[65,440],width:620,height:200,size:64,style: :bold,leading:8)
pdf.fill_color('5D697A');pdf.text_box('Slovenski koledar · 2027–2030',at:[68,215],width:600,height:45,size:23)
pdf.text_box('koledar365.si',at:[68,95],width:600,height:40,size:18)
pdf.fill_color('FFFFFF');pdf.fill_rectangle([785,495],340,370)
pdf.stroke_color('DBE1E9');pdf.stroke_rectangle([785,495],340,370)
pdf.fill_color('CC2B40');pdf.fill_rectangle([785,495],340,8)
pdf.fill_color('1B304D');pdf.text_box('2027',at:[813,456],width:285,height:62,size:48,style: :bold)
pdf.stroke_color('E4E8EE');pdf.stroke_horizontal_line(812,1098,at:375)
['P','T','S','Č','P','S','N'].each_with_index { |d,i| pdf.text_box(d,at:[814+i*42,350],width:30,height:20,size:14,align: :center) }
1.upto(28) do |n|
 x=814+((n-1)%7)*42;y=306-((n-1)/7)*39
 if n==15;pdf.fill_color('CC2B40');pdf.fill_circle([x+15,y-8],17);pdf.fill_color('FFFFFF');else;pdf.fill_color(n%7==0 ? 'CC2B40':'1B304D');end
 pdf.text_box(n.to_s,at:[x,y],width:30,height:20,size:15,align: :center)
end
file=Rails.root.join('tmp/social-image.pdf');pdf.render_file(file)
_,status=Open3.capture2e(ENV.fetch('PDFTOPPM_BIN','pdftoppm'),'-singlefile','-r','72','-png',file.to_s,Rails.root.join('public/og').to_s)
raise 'Social image render failed' unless status.success?
puts Rails.root.join('public/og.png')
