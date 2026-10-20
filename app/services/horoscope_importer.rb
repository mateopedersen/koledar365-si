class HoroscopeImporter
  def self.import!(input,actor:)
    raise ArgumentError,'Datoteka je prevelika.' if input.bytesize>200_000
    rows=JSON.parse(input)
    raise ArgumentError,'Pričakovan je seznam največ 120 besedil.' unless rows.is_a?(Array) && rows.size.between?(1,120) && rows.all? { |row|row.is_a?(Hash) }
    keys=rows.map { |r|[r['sign'],r['local_date']] }
    raise ArgumentError,'Datoteka vsebuje podvojeno znamenje in datum.' unless keys.uniq.size==keys.size
    Horoscope.transaction do
      rows.each do |row|
        date=Date.iso8601(row.fetch('local_date'));status=row.fetch('status','draft')
        raise ArgumentError,'Dovoljena sta osnutek in načrtovana objava.' unless %w[draft scheduled].include?(status)
        raise ArgumentError,'Načrtovani datum mora biti danes ali v prihodnosti.' if status=='scheduled' && date<Time.zone.today
        item=Horoscope.find_or_initialize_by(sign:row.fetch('sign'),local_date:date,locale:'sl')
        item.update!(body:row.fetch('body'),status:status,editor:actor,published_at:nil)
      end
      AuditLog.create!(action:'horoscope_import',actor:actor,details:{count:rows.size,dates:rows.map { |r|r['local_date'] }.uniq})
    end
    rows.size
  rescue JSON::ParserError,KeyError,Date::Error,ActiveRecord::RecordInvalid
    raise ArgumentError,'Preverite obliko JSON, datume, znamenja in dolžino besedil. Noben vnos ni bil uvožen.'
  end
end
