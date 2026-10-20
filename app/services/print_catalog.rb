class PrintCatalog
  VERSION='1.2.0'
  TYPES={'annual'=>'Letni koledar','monthly'=>'Mesečni koledar','weekly'=>'Tedenski koledar','lunar'=>'Lunin koledar','blank'=>'Prazen koledar','shift'=>'Razpored izmen','daily'=>'Dnevni planer','family'=>'Družinski planer','school'=>'Šolski urnik','birthday'=>'Rojstnodnevni koledar','name'=>'Koledar z imenom','holidays'=>'Prazniki in dela prosti dnevi'}.freeze
  def self.designs = @designs ||= PackageImporter.read('print-template-specification')['design_catalog']
  def self.normalize(raw)
    p=raw.to_h.stringify_keys
    design=p.fetch('design','min-01');type=p.fetch('type','annual')
    raise ArgumentError,'Neznana predloga.' unless designs.any? { |d| d['id']==design } && TYPES.key?(type)
    year=Integer(p.fetch('year',2027));month=Integer(p.fetch('month',1))
    raise ArgumentError,'Izberite leto med 2027 in 2030 ter veljaven mesec.' unless CalendarEngine::YEARS.include?(year)&&(1..12).cover?(month)
    name=p.fetch('name','').to_s.unicode_normalize(:nfc).strip
    raise ArgumentError,'Ime lahko vsebuje največ 100 znakov.' if name.length>100 || name.match?(/[\x00-\x1f]/)
    paper=p.fetch('paper','A4');orientation=p.fetch('orientation','portrait')
    raise ArgumentError,'Neveljavna velikost papirja.' unless %w[A3 A4 A5].include?(paper)&&%w[portrait landscape].include?(orientation)
    date=Date.iso8601(p.fetch('date',Date.new(year,month,1).iso8601))
    raise ArgumentError,'Datum mora biti v izbranem letu.' unless date.year==year
    entries=p.fetch('entries',[])
    raise ArgumentError,'Preveč vnosov.' unless entries.is_a?(Array)&&entries.size<=100
    entries=entries.map do |entry|
      raise ArgumentError,'Neveljaven vnos v načrt.' unless entry.respond_to?(:to_h)
      values=entry.to_h.stringify_keys.slice('title','date','time','person','code','end_time','break','notes').transform_values(&:to_s)
      raise ArgumentError,'Posamezno polje vnosa lahko vsebuje največ 200 znakov.' if values.values.any? { |v| v.length>200 || v.include?("\0") }
      Date.iso8601(values['date']) if values['date'].present?
      %w[time end_time].each do |key|
        raise ArgumentError,'Uro vnesite v obliki HH:MM.' if values[key].present? && !values[key].match?(/\A(?:[01]\d|2[0-3]):[0-5]\d\z/)
      end
      values
    end
    notes=p.fetch('notes','').to_s
    raise ArgumentError,'Osebni zapiski lahko vsebujejo največ 2000 znakov.' if notes.length>2000 || notes.include?("\0")
    {'type'=>type,'design'=>design,'year'=>year,'month'=>month,'date'=>date.iso8601,'name'=>name,'paper'=>paper,'orientation'=>orientation,'notes'=>notes,'entries'=>entries,'undated'=>p.fetch('undated','1')=='1'}
  end
  def self.fingerprint(options,owner:nil)
    data_files=%w[slovenia-localisation slovenia-additional-observances]
    data_files+=(2027..2030).map { |y| "usno-moon-#{y}" } if options['type']=='lunar'
    data_hash=data_files.map { |f| Digest::SHA256.file(Rails.root.join("data/source/#{f}.json")).hexdigest }
    font_hash=Dir[Rails.root.join('app/assets/fonts/*.ttf')].sort.map { |f| Digest::SHA256.file(f).hexdigest }
    Digest::SHA256.hexdigest([VERSION,'brand-v1',font_hash,data_hash,options.sort.to_h,owner].to_json)
  end
end
