require 'pathname'

root = Pathname.new(File.expand_path('..', __dir__))
headers_path = root.join('site/_headers')
abort "Missing generated Cloudflare Pages header file: #{headers_path}" unless headers_path.file?

blocks = {}
current = nil
headers_path.each_line do |raw|
  line = raw.chomp
  next if line.empty? || line.start_with?('#')
  if !line.start_with?(' ', "\t")
    current = line
    blocks[current] = []
  elsif current
    blocks[current] << line.strip
  end
end

global = blocks.fetch('/*') { abort 'Missing global security/header rule' }
abort 'HTML and unversioned content must revalidate' unless global.include?('Cache-Control: public, max-age=0, must-revalidate')

cache_rules = blocks.select { |_path, directives| directives.any? { |d| d.start_with?('Cache-Control:') } && _path != '/*' }
abort 'Expected several specialized asset cache rules' if cache_rules.size < 6
cache_rules.each do |path, directives|
  cache_controls = directives.grep(/\ACache-Control:/)
  unless directives.include?('! Cache-Control') && cache_controls.size == 1
    abort "#{path} must detach the global Cache-Control value before setting its own cache policy"
  end
end

immutable = %w[/visuals/* /assets/* /images/responsive/* /free/engine/* /prenosi/*]
immutable.each do |path|
  directives = blocks.fetch(path) { abort "Missing cache rule #{path}" }
  abort "#{path} must use long-lived immutable caching" unless directives.include?('Cache-Control: public, max-age=31536000, immutable')
end

lunar = blocks.fetch('/prenosi/lunin-koledar/*') { abort 'Missing lunar download cache rule' }
abort 'Lunar downloads must have their own hourly cache policy' unless lunar.include?('Cache-Control: public, max-age=3600')
puts "Cache header contract passed for #{cache_rules.size} specialized rules"
