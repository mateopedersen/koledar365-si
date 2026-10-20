class NamePublisher
  def self.run!(limit)
    file=Rails.root.join('evidence/print-gate.json')
    raise 'Najprej preverite vseh 15 predlog.' unless file.file?
    gate=JSON.parse(file.read)
    raise 'Predloge še niso preverjene.' unless gate['passed']==true && gate['version']==PrintCatalog::VERSION
    audit_file=Rails.root.join('evidence/name-layout-audit.json')
    audit=JSON.parse(audit_file.read)
    raise 'Dokazilo o imenih se je spremenilo.' unless Digest::SHA256.file(audit_file).hexdigest==gate.dig('evidence','names','sha256') && audit['version']==PrintCatalog::VERSION
    checked=audit['rows'].index_by { |r|r['id'] };counts=Hash.new(0)
    PersonName.transaction do
      PersonName.order(:priority).limit(limit.clamp(1,8561)).each do |person|
        qa=checked[person.name_id]
        status=qa && qa['glyphs'] && qa['header_fits'] && person.exact.length<=100 ? 'published' : 'held'
        person.assign_attributes(status:status,qa:qa || {'reason'=>'Manjkajoče dokazilo o imenu.'})
        person.save! if person.changed?;counts[status]+=1
      end
      AuditLog.create!(action:'name_publication',actor:'quality_gate',details:{limit:limit,counts:counts,version:PrintCatalog::VERSION})
    end
    counts
  end
end
