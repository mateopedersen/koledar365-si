require 'json'
FileUtils.mkdir_p(Rails.root.join('evidence/generated'))
results=[]
PrintCatalog::TYPES.keys.product(PrintCatalog.designs.map { |d|d['id'] }).each do |type,design|
  options=PrintCatalog.normalize(type:type,design:design,year:2028,month:2,date:'2028-02-29',name:type=='name' ? 'Žan Črt Špela' : '')
  request=PrintRequest.create_or_find_by!(fingerprint:PrintCatalog.fingerprint(options)) { |r|r.options=options }
  started=Process.clock_gettime(Process::CLOCK_MONOTONIC)
  begin
    RenderCalendarJob.new.perform(request.id)
    raise 'Export not complete' unless request.reload.available?
    folder=Rails.root.join('storage/exports',request.fingerprint)
    manifest=JSON.parse(folder.join('manifest.json').read)
    raise 'Contract mismatch' unless manifest['template_version']==PrintCatalog::VERSION && manifest['pages'].is_a?(Array) && manifest['page_count']==manifest['pages'].size
    raise 'Wrong PDF signature' unless folder.join(request.files['pdf']).binread.start_with?('%PDF-')
    manifest['pages'].each do |page|
      file=folder.join(page['filename'])
      raise 'WebP hash mismatch' unless Digest::SHA256.file(file).hexdigest==page['sha256']
      raise 'WebP magic mismatch' unless file.binread(12).start_with?('RIFF') && file.binread(12).end_with?('WEBP')
    end
    if manifest['page_count']>1
      Zip::File.open(folder.join(request.files['webp'])) do |zip|
        raise 'Missing paired pages or manifest' unless zip.entries.map(&:name).sort==[*manifest['pages'].map { |p|p['filename'] },'README.txt','manifest.json'].sort
      end
    end
    if type=='name'
      request.files.each do |kind,file|
        FileUtils.cp(folder.join(file),Rails.root.join('evidence/generated',"#{design}-#{kind}#{File.extname(file)}"))
      end
    end
    results << {type:type,design:design,request_id:request.id,folder:folder.relative_path_from(Rails.root).to_s,page_count:manifest['page_count'],seconds:(Process.clock_gettime(Process::CLOCK_MONOTONIC)-started).round(2),status:'passed'}
  rescue => e
    results << {type:type,design:design,status:'failed',error:e.message}
  end
  Rails.root.join('evidence/export-matrix-v2.json').write(JSON.pretty_generate({version:PrintCatalog::VERSION,expected:180,completed:results.size,results:results}))
  puts "#{type} / #{design}: #{results.last[:status]} (#{results.size}/180)";STDOUT.flush
end
