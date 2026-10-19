# frozen_string_literal: true

require 'erb'
require 'fileutils'
require 'pathname'

ROOT = Pathname.new(__dir__)
SOURCE = ROOT.join('src')
OUTPUT = ROOT.join('dist')

FileUtils.rm_rf(OUTPUT)
FileUtils.mkdir_p(OUTPUT)

%w[index.html.erb 404.html.erb].each do |template_name|
  output_name = template_name.delete_suffix('.erb')
  template = ERB.new(SOURCE.join(template_name).read(encoding: 'UTF-8'), trim_mode: '-')
  OUTPUT.join(output_name).write(template.result, encoding: 'UTF-8')
end

%w[style.css brand-mark.svg favicon-sk.svg].each do |asset_name|
  FileUtils.cp(SOURCE.join(asset_name), OUTPUT.join(asset_name))
end

OUTPUT.join('robots.txt').write("User-agent: *\nDisallow: /\n", encoding: 'UTF-8')
OUTPUT.join('_headers').write(<<~HEADERS, encoding: 'UTF-8')
  /*
    X-Robots-Tag: noindex, nofollow
    X-Content-Type-Options: nosniff
    Referrer-Policy: strict-origin-when-cross-origin
    Permissions-Policy: camera=(), microphone=(), geolocation=()
    Content-Security-Policy: default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'none'; img-src 'self' data:; style-src 'self'; script-src 'none'; connect-src 'none'; upgrade-insecure-requests

  /style.css
    Cache-Control: public, max-age=300, must-revalidate
  /brand-mark.svg
    Cache-Control: public, max-age=300, must-revalidate
  /favicon-sk.svg
    Cache-Control: public, max-age=300, must-revalidate
  HEADERS

required = {
  'home page' => OUTPUT.join('index.html'),
  '404 page' => OUTPUT.join('404.html'),
  'stylesheet' => OUTPUT.join('style.css'),
  'brand mark' => OUTPUT.join('brand-mark.svg'),
  'Slovak favicon' => OUTPUT.join('favicon-sk.svg'),
  'robots rules' => OUTPUT.join('robots.txt'),
  'Cloudflare response headers' => OUTPUT.join('_headers')
}
missing = required.select { |_label, path| !path.file? }.keys
abort "Build is incomplete: #{missing.join(', ')}" unless missing.empty?

html = OUTPUT.join('index.html').read(encoding: 'UTF-8')
abort 'The landing page must remain Slovenian and unpublished to search engines' unless html.include?('<html lang="sl">') && html.include?('noindex, nofollow')
abort 'The landing page canonical must stay on koledar365.si' unless html.include?('<link rel="canonical" href="https://koledar365.si/">')
abort 'Reduced-motion support is missing' unless OUTPUT.join('style.css').read(encoding: 'UTF-8').include?('prefers-reduced-motion')

puts "Built Koledar365.si into #{OUTPUT.relative_path_from(ROOT)}"
