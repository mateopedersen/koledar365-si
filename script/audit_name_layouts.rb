fonts=Dir[Rails.root.join('app/assets/fonts/*.ttf')].sort.to_h do |path|
  [File.basename(path),TTFunk::File.open(path).cmap.unicode.first]
end
measurer=PdfRenderer.new(PrintCatalog.normalize(type:'name',paper:'A5'))
rows=[]
PersonName.order(:priority).find_each do |person|
  missing=fonts.transform_values { |map|person.exact.codepoints.reject { |c|map[c] && map[c]!=0 } }.reject { |_,values|values.empty? }
  fits=[]
  ['Sans','Serif'].product([128.0,190.0]).each do |font,width_mm|
    measurer.pdf.font(font)
    size=person.exact.length>45 ? 16 : (width_mm<140 ? 20:24)
    width=width_mm*PdfRenderer::MM-65
    height=measurer.pdf.height_of("Ime: #{person.exact}",width:width,size:size,style: :bold)+3
    body_height=(width_mm<140 ? 182 : 120)*PdfRenderer::MM
    fits << (body_height-height-52>=164)
  end
  rows << {id:person.name_id,priority:person.priority,length:person.exact.length,glyphs:missing.empty?,missing:missing,header_fits:fits.all?,version:PrintCatalog::VERSION}
end
report={version:PrintCatalog::VERSION,count:rows.size,failed:rows.count { |r|!r[:glyphs]||!r[:header_fits] },rows:rows}
Rails.root.join('evidence/name-layout-audit.json').write(JSON.pretty_generate(report))
puts report.except(:rows).to_json
