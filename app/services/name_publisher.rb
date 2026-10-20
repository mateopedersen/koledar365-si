class NamePublisher
  def self.run!(limit)
    raise 'Najprej preverite vseh 15 predlog.' unless Rails.root.join('evidence/print-gate.json').exist?
    gate=JSON.parse(Rails.root.join('evidence/print-gate.json').read)
    raise 'Predloge še niso preverjene.' unless gate['passed']==true&&gate['version']==PrintCatalog::VERSION
    font=TTFunk::File.open(Rails.root.join('app/assets/fonts/DejaVuSans.ttf').to_s)
    cmap=font.cmap.unicode.first
    counts=Hash.new(0)
    PersonName.order(:priority).limit(limit.clamp(1,8561)).each do |name|
      missing=name.exact.codepoints.reject { |c| cmap[c] && cmap[c]!=0 }
      status=missing.empty?&&name.exact.length<=100 ? 'published':'held'
      name.update!(status:status,qa:{glyphs:missing.empty?,missing:missing,checked_template_version:PrintCatalog::VERSION,priority:name.priority})
      counts[status]+=1
    end
    AuditLog.create!(action:'name_publication',actor:'quality_gate',details:counts)
    counts
  end
end
