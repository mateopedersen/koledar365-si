require 'set';require 'time';require 'json';require 'fileutils';require 'digest';require 'pathname'
root=Pathname.new(File.expand_path('..',__dir__));site=root.join('site')
# The two independent sets of checks must both be complete before release.
reports=Dir[root.join('evidence/release*-catalog-[0-9].json')].map { |file|JSON.parse(File.read(file)) }
raise 'Catalogues are still running.' unless reports.size==4&&reports.all? { |r|r['completed']==r['expected']&&r['results'].all? { |row|row['status']=='passed' } }
rows=reports.flat_map { |report|report['results'] };expected=rows.map { |row|row['fingerprint'] }.uniq
checks=Dir[root.join('evidence/release*-verification-[0-9].json')].flat_map { |file|JSON.parse(File.read(file))['results'] }
verified=checks.select { |row|row['passed'] }.map { |row|row['fingerprint'] }.uniq
raise 'Second raster checks are incomplete.' unless (expected-verified).empty?&&checks.all? { |row|row['passed'] }
files={};Dir.glob(site.join('**/*').to_s,File::FNM_DOTMATCH).select { |file|File.file?(file) }.sort.each do |file|
 relative=Pathname.new(file).relative_path_from(site).to_s;next if relative=='release-manifest.json'
 files[relative]={size:File.size(file),sha256:Digest::SHA256.file(file).hexdigest}
end
source_patterns=%w[app/**/* config/**/* lib/**/* data/editorial/*.json functions/**/* Gemfile Gemfile.lock .node-version script/**/* test/**/* .github/workflows/**/* cloudflare/free/**/* package.json pnpm-lock.yaml playwright.config.mjs]
tracked=IO.popen(['git','-C',root.to_s,'ls-files','-z'],&:read).split("\0").to_set
sources=source_patterns.flat_map { |pattern|Dir[root.join(pattern)] }.select { |file|File.file?(file)&&tracked.include?(Pathname.new(file).relative_path_from(root).to_s)&&!file.match?(%r{/(?:master\.key|credentials/.*\.key)\z}) }.sort.to_h { |file|[Pathname.new(file).relative_path_from(root).to_s,Digest::SHA256.file(file).hexdigest] }
record={built_at:Time.now.utc.iso8601,pairs:expected.size,verified_pairs:verified.size,files:files,sources:sources}
site.join('release-manifest.json').write(JSON.generate(record));puts({files:files.size+1,pairs:expected.size,verified:verified.size}.to_json)
