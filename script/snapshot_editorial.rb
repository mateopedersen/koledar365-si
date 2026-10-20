require_relative '../config/environment'
folder=Rails.root.join('data/editorial');FileUtils.mkdir_p(folder)
folder.join('pages.json').write(JSON.pretty_generate(Page.order(:path).map { |page|page.attributes.slice('path','title','description','body','status','created_at','updated_at') }))
folder.join('horoscopes.json').write(JSON.pretty_generate(Horoscope.order(:local_date,:sign).map { |item|item.attributes.slice('sign','local_date','body','status','editor','published_at','created_at','updated_at') }))
puts 'Public editorial records exported; no contacts or credentials.'
