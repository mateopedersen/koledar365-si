class PrintCatalog
  VERSION='2.0.1'
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
      values=entry.to_h.stringify_keys.slice('title','date','time','person','code','end_time','break','notes','room','done').transform_values(&:to_s)
      raise ArgumentError,'Posamezno polje vnosa lahko vsebuje največ 200 znakov.' if values.values.any? { |v| v.length>200 || v.include?("\0") }
      Date.iso8601(values['date']) if values['date'].present?
      %w[time end_time].each do |key|
        raise ArgumentError,'Uro vnesite v obliki HH:MM.' if values[key].present? && !values[key].match?(/\A(?:[01]\d|2[0-3]):[0-5]\d\z/)
      end
      if values['break'].present?
        raise ArgumentError,'Odmor mora biti med 0 in 1440 minutami.' unless values['break'].match?(/\A\d{1,4}\z/) && values['break'].to_i.between?(0,1440)
      end
      values
    end
    notes=p.fetch('notes','').to_s
    raise ArgumentError,'Osebni zapiski lahko vsebujejo največ 2000 znakov.' if notes.length>2000 || notes.include?("\0")
    PrintGlyphs.assert!([name,notes,*entries.flat_map(&:values)],design:design)
    first_hour=Integer(p.fetch('start_hour',7));last_hour=Integer(p.fetch('end_hour',21))
    raise ArgumentError,'Izberite ure med 0 in 23; konec ne sme biti pred začetkom.' unless first_hour.between?(0,23) && last_hour.between?(first_hour,23)
    {'start_hour'=>first_hour,'end_hour'=>last_hour,'type'=>type,'design'=>design,'year'=>year,'month'=>month,'date'=>date.iso8601,'name'=>name,'paper'=>paper,'orientation'=>orientation,'notes'=>notes,'entries'=>entries,'undated'=>[true,1,'1'].include?(p.fetch('undated','1')),'blank_layout'=>%w[monthly weekly].include?(p['blank_layout']) ? p['blank_layout'] : 'monthly','ruling'=>%w[lined plain dotted].include?(p['ruling']) ? p['ruling'] : 'lined','leap_policy'=>%w[feb28 march1 leap_only].include?(p['leap_policy']) ? p['leap_policy'] : 'feb28'}
  end
  def self.identity(options)
    period=case options['type']
    when 'monthly','lunar','blank' then options['type']=='blank' && options['undated'] ? 'undated' : '%04d-%02d' % [options['year'],options['month']]
    when 'weekly','shift','family','school','daily' then options['date']
    else options['year'].to_s
    end
    {'type'=>options['type'],'period'=>period,'template_id'=>options['design'],'paper'=>options['paper'],'orientation'=>options['orientation'],'color_mode'=>options['design'].end_with?('-03') ? 'monochrome_bw' : 'color','template_version'=>VERSION,'name_exact'=>options['name'].to_s,'name_sha256'=>Digest::SHA256.hexdigest(options['name'].to_s),'layout_options'=>options.slice('month','date','undated','blank_layout','ruling','leap_policy','start_hour','end_hour')}
  end
  def self.filename(options)
    i=identity(options)
    name=options['name'].to_s
    safe=PersonName.fold(name).gsub(/[^a-z0-9]+/,'-').gsub(/\A-+|-+\z/,'').first(40)
    personal=name.present? ? "-#{safe}-#{Digest::SHA256.hexdigest(name).first(10)}" : ''
    "koledar365-#{i['type']}#{personal}-#{i['period']}-#{i['template_id']}-#{i['paper']}-#{i['orientation']}-#{i['color_mode']}-v#{VERSION}"
  end
  def self.source_version(options)
    events=CalendarEvent.where(on:Date.new(options['year'],1,1)..Date.new(options['year'],12,31)).order(:on,:slug).pluck(:on,:slug,:title,:work_free,:state_holiday)
    moon=options['type']=='lunar' ? AstronomicalEvent.where(kind:'moon').order(:instant).pluck(:instant,:title) : []
    Digest::SHA256.hexdigest([events,moon].to_json)
  end
  def self.fingerprint(options,owner:nil)
    data_files=%w[slovenia-localisation slovenia-additional-observances]
    data_files+=(2027..2030).map { |y| "usno-moon-#{y}" } if options['type']=='lunar'
    data_hash=data_files.map { |f| Digest::SHA256.file(Rails.root.join("data/source/#{f}.json")).hexdigest }
    font_hash=Dir[Rails.root.join('app/assets/fonts/*.ttf')].sort.map { |f| Digest::SHA256.file(f).hexdigest }
    Digest::SHA256.hexdigest([VERSION,'brand-v1','file-contract-v1.1',font_hash,data_hash,source_version(options),options.sort.to_h,owner].to_json)
  end
end
