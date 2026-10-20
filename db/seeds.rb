PackageImporter.run!
JSON.parse(Rails.root.join('data/horoscopes-2026-10-20.json').read).each do |sign,body|
  Horoscope.find_or_create_by!(sign:sign,local_date:Date.new(2026,10,20),locale:'sl') do |h|
    h.body=body;h.status='published';h.editor='Začetna priprava s pomočjo UI';h.published_at=Time.current
  end
end
if ENV['ADMIN_EMAIL'].present? && ENV['ADMIN_PASSWORD'].to_s.length>=14
  Admin.find_or_initialize_by(email:ENV['ADMIN_EMAIL'].downcase).tap { |a| a.password=ENV['ADMIN_PASSWORD'];a.save! }
end
