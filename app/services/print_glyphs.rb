class PrintGlyphs
  def self.assert!(strings,design:)
    files=%w[DejaVuSans.ttf DejaVuSans-Bold.ttf]
    files << 'DejaVuSerif-Bold.ttf' if design.start_with?('ele-')
    codepoints=strings.compact.join.codepoints.uniq-[9,10,13]
    missing=files.flat_map do |file|
      @maps||={};map=@maps[file]||=TTFunk::File.open(Rails.root.join('app/assets/fonts',file).to_s).cmap.unicode.first
      codepoints.reject { |code|map[code] && map[code]!=0 }
    end.uniq
    raise ArgumentError,"Pisava ne podpira teh znakov: #{missing.first(8).map { |c|[c].pack('U') }.join(' ')}. Uporabite besedilni zapis brez slikovnih simbolov." if missing.any?
  end
end
