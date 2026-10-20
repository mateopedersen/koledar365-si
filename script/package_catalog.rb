require 'json';require 'fileutils';require 'digest'
root=File.expand_path('..',__dir__);out=File.join(root,'site');rows=[]
Dir[File.join(root,'evidence/release*-catalog-[0-9].json')].sort.each do |report|
 JSON.parse(File.read(report))['results'].select { |row|row['status']=='passed' }.each do |row|
  source=File.join(root,'storage/release-catalog',row['fingerprint']);dest=File.join(out,'prenosi',row['fingerprint']);FileUtils.mkdir_p(dest)
  row['files'].except('manifest').values.uniq.each do |filename|
   target=File.join(dest,filename);original=File.join(source,filename)
   FileUtils.cp(original,target) unless File.file?(target)&&Digest::SHA256.file(target).hexdigest==Digest::SHA256.file(original).hexdigest
  end
  FileUtils.rm_f(File.join(dest,row['files']['manifest']))
  metadata=JSON.parse(File.read(File.join(source,row['files']['manifest'])))
  rows << row.slice('options','fingerprint','page_count').merge('manifest'=>metadata,'files'=>row['files'].except('manifest').transform_values { |file|'/prenosi/'+row['fingerprint']+'/'+file })
 end
end
FileUtils.mkdir_p(File.join(out,'free'));File.write(File.join(out,'free/catalog.json'),JSON.generate(rows))
FileUtils.mkdir_p(File.join(out,'free/samples'))
original=JSON.parse(File.read(File.join(root,'evidence/export-matrix-v2.json')))
original['results'].select { |row|row['type']=='annual' }.each do |row|
 FileUtils.cp(File.join(root,row['folder'],'predogled.png'),File.join(out,'free/samples',row['design']+'.png'))
end
puts JSON.generate({pairs:rows.size,monthly:rows.count { |row|row['options']['type']=='monthly' },annual:rows.count { |row|row['options']['type']=='annual' }})
