require_relative '../config/environment'
# GitHub protects writes and records their author. Only public content is restored.
Page.transaction do
  JSON.parse(Rails.root.join('data/editorial/pages.json').read).each do |row|
    page=Page.find_by!(path:row.fetch('path'))
    status=row.fetch('status');raise 'Neveljaven status strani.' unless %w[draft published held].include?(status)
    status='held' if page.metadata['content_gate'].present?
    attributes=row.slice('title','description','body','created_at','updated_at').merge('status'=>status)
    raise 'Predolgo besedilo strani.' if attributes['body'].to_s.length>100_000||attributes['title'].to_s.length>200
    page.update!(attributes)
  end
end
ExpansionCatalog.apply!
Horoscope.transaction do
  rows=JSON.parse(Rails.root.join('data/editorial/horoscopes.json').read)
  raise 'Preveč besedil.' unless rows.is_a?(Array)&&rows.length<=12000
  raise 'Podvojena znamenja in datum.' unless rows.map { |row|[row['sign'],row['local_date']] }.uniq.size==rows.size
  rows.each do |row|
    raise 'Neveljaven status horoskopa.' unless %w[draft scheduled published].include?(row['status'])
    date=Date.iso8601(row.fetch('local_date'))
    raise 'Prihodnje besedilo naj bo načrtovano.' if row['status']=='published'&&date>Time.zone.today
    raise 'Objavljeno besedilo potrebuje čas objave.' if row['status']=='published'&&row['published_at'].blank?
    item=Horoscope.find_or_initialize_by(sign:row.fetch('sign'),local_date:date,locale:'sl')
    item.update!(row.slice('body','status','editor','published_at','created_at','updated_at'))
  end
end
Horoscope.publish_due!
NamePublisher.run!(8561)
publication=JSON.parse(Rails.root.join('data/editorial/name-publication.json').read)
PersonName.find_each do |name|
 stamp=publication.fetch(name.name_id);current=Digest::SHA256.hexdigest([name.exact,name.slug,name.priority,name.observations].to_json)
 raise 'Podatki imena so se spremenili; obnovite zapis preverjanja.' unless stamp['content_hash']==current
 name.update_columns(updated_at:Time.iso8601(stamp['updated_at']),created_at:Time.iso8601(stamp['created_at']))
end
puts({pages:Page.group(:status).count,names:PersonName.group(:status).count,horoscopes:Horoscope.group(:status).count}.to_json)
