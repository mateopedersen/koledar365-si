# frozen_string_literal: true

require 'digest'
require 'minitest/autorun'
require 'open3'
require 'pathname'

ROOT = Pathname.new(__dir__)
RUBY = ROOT.join('../tooling/ruby-current/bin/ruby').expand_path

class Koledar365SiBuildTest < Minitest::Test
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
    assert_equal %w[404.html _headers brand-mark.svg index.html robots.txt style.css], first.keys
  end

  def test_home_page_is_localized_isolated_and_not_indexed_while_in_development
    html = ROOT.join('dist/index.html').read(encoding: 'UTF-8')
    assert_includes html, '<html lang="sl">'
    assert_includes html, '<link rel="canonical" href="https://koledar365.si/">'
    assert_includes html, '<meta name="robots" content="noindex, nofollow">'
    assert_includes html, 'PRAZNIKI'
    assert_includes html, 'NAČRTI'
    refute_match(/<script\b/i, html)
    assert_includes ROOT.join('dist/_headers').read(encoding: 'UTF-8'), "X-Robots-Tag: noindex, nofollow"
    assert_includes ROOT.join('dist/robots.txt').read(encoding: 'UTF-8'), 'Disallow: /'
  end

  def test_local_brand_and_stylesheet_are_present_in_deploy_output
    html = ROOT.join('dist/index.html').read(encoding: 'UTF-8')
    assert_includes html, 'href="./style.css"'
    assert_includes html, 'src="./brand-mark.svg"'
    assert ROOT.join('dist/style.css').file?
    assert ROOT.join('dist/brand-mark.svg').file?
    assert_includes ROOT.join('dist/style.css').read(encoding: 'UTF-8'), 'prefers-reduced-motion'
  end
end
