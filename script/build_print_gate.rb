files={'exports'=>'export-file-verification.json','layouts'=>'print-layout-audit.json','names'=>'name-layout-audit.json'}
reports=files.transform_values { |file|JSON.parse(Rails.root.join('evidence',file).read) }
raise 'Različice dokazil se ne ujemajo.' unless reports.values.all? { |r|r['version']==PrintCatalog::VERSION }
raise 'Izvozna matrika ni končana.' unless reports['exports']['completed']==180 && reports['exports']['failures'].empty?
raise 'Postavitve niso preverjene.' unless reports['layouts']['total']==1080 && reports['layouts']['failures'].empty?
raise 'Pregled imen ni končan.' unless reports['names']['count']==8561
record={version:PrintCatalog::VERSION,passed:true,checked_at:Time.current.iso8601,export_pairs:180,layout_combinations:1080,name_candidates:8561,
 evidence:files.transform_values { |file|{file:file,sha256:Digest::SHA256.file(Rails.root.join('evidence',file)).hexdigest} },
 visual_review:'15 name layouts reviewed in print-v2-contact-sheet.jpg; A5 pagination checked. No CMYK/PDF-X certification.'}
Rails.root.join('evidence/print-gate.json').write(JSON.pretty_generate(record));puts record.except(:evidence).to_json
