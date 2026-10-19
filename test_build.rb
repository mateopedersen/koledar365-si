# frozen_string_literal: true

require 'digest'
require 'minitest/autorun'
require 'open3'
require 'pathname'
require 'rexml/document'

ROOT = Pathname.new(__dir__)
RUBY = ROOT.join('../tooling/ruby-current/bin/ruby').expand_path

class Koledar365SiBuildTest < Minitest::Test
  def setup
    build
  end

  def build
    stdout, stderr, status = Open3.capture3(RUBY.to_s, 'build.rb', chdir: ROOT.to_s)
    assert status.success?, "build failed:\n#{stdout}\n#{stderr}"
    stdout
  end

  def output_digests
    Dir.glob(ROOT.join('dist/**/*')).select { |path| File.file?(path) }.sort.to_h do |path|
      [Pathname.new(path).relative_path_from(ROOT.join('dist')).to_s, Digest::SHA256.file(path).hexdigest]
    end
  end

  def test_build_is_repeatable_and_contains_only_deployable_files
    build
    first = output_digests
    build
    assert_equal first, output_digests
    assert_equal %w[404.html _headers brand-mark.svg favicon-sk.svg index.html robots.txt style.css], first.keys
  end

  def test_home_page_is_localized_isolated_and_not_indexed_while_in_development
    html = ROOT.join('dist/index.html').read(encoding: 'UTF-8')
    assert_includes html, '<html lang="sl">'
    assert_includes html, '<link rel="canonical" href="https://koledar365.si/">'
    assert_includes html, '<meta name="robots" content="noindex, nofollow">'
    assert_includes html, 'Koledar se'
    assert_includes html, 'Ekipa že sestavlja koledar s slovaškim značajem.'
    assert_includes html, 'V GRADNJI · SLOVAŠKA'
    refute_match(/<script\b/i, html)
    assert_includes ROOT.join('dist/_headers').read(encoding: 'UTF-8'), "X-Robots-Tag: noindex, nofollow"
    assert_includes ROOT.join('dist/robots.txt').read(encoding: 'UTF-8'), 'Disallow: /'
  end

  def test_build_scene_has_three_accessible_workers_and_motion_support
    html = ROOT.join('dist/index.html').read(encoding: 'UTF-8')
    assert_includes html, 'id="scene-title">Ljudje skupaj gradijo velik koledar</title>'
    assert_includes html, 'Trije delavci v varnostnih čeladah'
    assert_equal 3, html.scan(/class="worker worker--/).length
    assert_equal 3, html.scan(/class="worker-stage worker-stage--/).length
    assert_equal 3, html.scan(/class="worker-figure worker-figure--/).length
    assert_equal 3, html.scan(/scale\(1\.85\)/).length
    assert_includes html, 'class="suspended-tile"'
    assert_includes html, 'class="tile-slot"'
    assert_equal 3, html.scan(/class="worker-head worker-head--/).length
    assert_equal 3, html.scan(/class="worker-eyes worker-eyes--/).length
    assert_includes html, 'preserveAspectRatio="xMidYMid slice"'
    assert_includes html, 'href="./favicon-sk.svg?v=sk-3"'
    assert_includes html, 'src="./favicon-sk.svg?v=sk-3"'
    assert_includes html, '#0b4ea2'
    assert_includes html, '#ee1c25'
    assert_equal 1, html.scan('<section ').length, 'the launch page should keep its copy focused'
    svg = html[/<svg\b.*?<\/svg>/m]
    refute_nil svg
    REXML::Document.new(svg)
    css = ROOT.join('dist/style.css').read(encoding: 'UTF-8')
    assert_includes css, '@keyframes hoist-travel'
    assert_includes css, '@keyframes cable-lift'
    assert_includes css, '@keyframes fit-tile'
    assert_includes css, '@keyframes work-left'
    assert_includes css, '@keyframes work-high'
    assert_includes css, '@keyframes work-front'
    assert_includes css, '@keyframes cartoon-blink'
    assert_includes css, '.worker-arm--left { transform-origin: 56% 18%; animation: reach-left 3.2s ease-in-out infinite; }'
    assert_includes css, '@media (prefers-reduced-motion: reduce)'
    assert_includes css, 'height: 100svh;'
    assert_includes css, 'transform: translate(-155px, 0) scale(.58);'
    assert_includes css, 'transform: translate(268px, 0) scale(.58);'
  end

  def test_local_brand_and_stylesheet_are_present_in_deploy_output
    html = ROOT.join('dist/index.html').read(encoding: 'UTF-8')
    assert_includes html, 'href="./style.css?v=sk-3"'
    assert_includes html, 'src="./favicon-sk.svg?v=sk-3"'
    assert ROOT.join('dist/style.css').file?
    assert ROOT.join('dist/brand-mark.svg').file?
    assert ROOT.join('dist/favicon-sk.svg').file?
    assert_includes ROOT.join('dist/style.css').read(encoding: 'UTF-8'), 'prefers-reduced-motion'
  end
end
