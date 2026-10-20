missing=%w[SITE_URL SECRET_KEY_BASE OPERATOR_CONTACT HOSTING_PROVIDER PRIVACY_HOSTING_NOTICE].select { |key|ENV[key].blank? }
errors=missing.map { |key|"Eksik üretim ayarı: #{key}" }
errors << 'Üretim PostgreSQL kullanmalıdır.' unless ActiveRecord::Base.connection.adapter_name=='PostgreSQL'
errors << 'Yönetici hesabı yok.' if Admin.count.zero?
gate=Rails.root.join('evidence/print-gate.json')
errors << 'Güncel baskı kalite kapısı yok.' unless gate.file? && JSON.parse(gate.read).values_at('version','passed')==[PrintCatalog::VERSION,true]
errors << 'İlk 200 isim yayımlanmamış.' if PersonName.published.count<200
puts({checked_at:Time.current.iso8601,ready:errors.empty?,errors:errors}.to_json)
exit(errors.empty? ? 0 : 1)
