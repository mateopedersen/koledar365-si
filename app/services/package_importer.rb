require "digest"
class PackageImporter
  def self.read(name) = JSON.parse(Rails.root.join("data/source/#{name}.json").read)
  def self.run!
    data=read('slovenia-localisation')
    ActiveRecord::Base.transaction do
      data['sources'].each do |key,v|
        Source.find_or_initialize_by(key: key).tap { |r| r.assign_attributes(url:v['url'],title:v['title']||key,accessed_on:Date.new(2026,10,20),version:Digest::SHA256.hexdigest(v.to_json),metadata:v); r.save! if r.changed? }
      end
      read('sayfa-plani')['pages'].each do |v|
        r=Page.find_or_initialize_by(path:v['path'])
        r.assign_attributes(title:v['title_sl'],family:v['family'],year:v['year'],month:v['month'],metadata:v.except('status'),status:v['content_gate'].present? ? 'held' : 'draft') if r.new_record?
        r.save! if r.changed?
      end
      observations=read('slovenia-names')['candidates'].index_by { |r| r['name_id'] }
      read('isim-url-kaydi')['records'].each do |v|
        r=PersonName.find_or_initialize_by(name_id:v['name_id'])
        raise "Kalıcı isim URLsi değiştirilemez: #{r.name_id}" if r.persisted? && r.slug!=v['canonical_slug']
        raise 'NFC kimliği uyuşmuyor' unless Digest::SHA256.hexdigest(v['name_exact'].unicode_normalize(:nfc))==v['name_sha256']
        r.assign_attributes(exact:v['name_exact'],slug:v['canonical_slug'],folded:PersonName.fold(v['name_exact']),priority:v['recommended_candidate_order'],observations:observations.fetch(v['name_id']))
        r.save! if r.changed?
      end
      data['years'].each do |y,items|
        items['events'].each { |e| store_event(e.merge('key'=>"legal:#{e['id']}:#{e['date']}",'category'=>'legal','source_url'=>data['sources']['law']['url'])) }
      end
      data['bridge_2026']['legal_events'].each { |e| store_event(e.merge('key'=>"legal:#{e['id']}:#{e['date']}",'category'=>'legal','source_url'=>data['sources']['law']['url'])) }
      data['editorial']['pages'].reject { |r| r['tier']=='core' }.each do |topic|
        CalendarEngine::YEARS.each do |y|
          CalendarEngine.rule_dates(topic['rule'],y).each do |d|
            store_event('key'=>"topic:#{topic['slug']}:#{d}",'date'=>d.to_s,'name_sl'=>topic['title_sl'],'id'=>topic['slug'],'category'=>topic['type'],'work_free'=>false,'source_url'=>data['sources'].fetch(topic['source_ids'].first)['url'])
          end
        end
      end
      read('slovenia-additional-observances')['observances'].each do |topic|
        topic['dates_2027_2030'].each do |year,row|
          date=row['date']||row['start_date']
          next unless date
          store_event('key'=>"obs:#{topic['slug']}:#{date}",'date'=>date,'ends_on'=>row['end_date'],'name_sl'=>topic['title_sl'],'id'=>topic['slug'],'category'=>topic['category'],'work_free'=>false,'source_url'=>topic['source']['url'])
        end
      end
      (2026..2030).each do |y|
        read("usno-moon-#{y}")['phasedata'].each do |v|
          instant=Time.utc(y,v['month'],v['day'],*v['time'].split(':').map(&:to_i))
          r=AstronomicalEvent.find_or_initialize_by(key:"moon:#{instant.iso8601}")
          r.assign_attributes(kind:'moon',title:data['astronomy']['phase_names_sl'].fetch(v['phase']),instant:instant,source_url:"https://aa.usno.navy.mil/api/moon/phases/year?year=#{y}");r.save! if r.changed?
        end
      end
      season_names={3=>['pomladno-enakonocje','Pomladno enakonočje'],6=>['poletni-solsticij','Poletni solsticij'],9=>['jesensko-enakonocje','Jesensko enakonočje'],12=>['zimski-solsticij','Zimski solsticij']}
      (2027..2030).each do |y|
        read("usno-seasons-#{y}")['data'].select { |v| %w[Equinox Solstice].include?(v['phenom']) }.each do |v|
          slug,title=season_names.fetch(v['month']);instant=Time.utc(y,v['month'],v['day'],*v['time'].split(':').map(&:to_i))
          r=AstronomicalEvent.find_or_initialize_by(key:"season:#{y}:#{slug}")
          r.assign_attributes(kind:slug,title:title,instant:instant,source_url:"https://aa.usno.navy.mil/api/seasons?year=#{y}");r.save! if r.changed?
          store_event('key'=>r.key,'date'=>r.local_time.to_date.to_s,'name_sl'=>title,'id'=>slug,'category'=>'astronomical','source_url'=>r.source_url)
        end
      end
    end
    {pages:Page.count,names:PersonName.count,events:CalendarEvent.count,astronomy:AstronomicalEvent.count}
  end
  def self.store_event(v)
    r=CalendarEvent.find_or_initialize_by(key:v['key'])
    r.assign_attributes(slug:v['id'],title:v['name_sl'],on:v['date'],ends_on:v['ends_on'],category:v['category'],work_free:v.fetch('work_free',false),state_holiday:v.fetch('state_holiday',false),source_url:v['source_url']);r.save! if r.changed?
  end
end
