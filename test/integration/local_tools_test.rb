require 'test_helper'

class LocalToolsTest < ActionDispatch::IntegrationTest
  test 'the directory links each distinct tool and each new page has a useful heading and metadata' do
    get '/orodja/'
    assert_response :success
    assert_select 'h1', count: 1
    cards = css_select('[data-tool-card]').map { |card| card['href'] }
    assert_equal 66, cards.size
    assert_equal cards, cards.uniq
    assert_equal cards.sort, css_select('#site-tools-menu a[data-navigation-tool]').map { |link| link['href'] }.sort
    assert_empty LocalTools::PAGES.keys - cards
    assert_empty LocalTools::PAGES.keys - Page.published.pluck(:path)
    LocalTools::PAGES.each_key do |path|
      get path
      assert_response :success
      assert_select 'h1', count: 1
      assert_select 'link[rel=canonical][href=?]', "https://koledar365.si#{path}"
    end
  end

  test 'each tool, category, and shortcut use a distinct, defined icon' do
    get '/orodja/'
    assert_response :success
    assert_select '.tool-directory [data-tool-card] .tool-directory-icon use', count: 66
    assert_select '.tool-directory [data-tool-category] .tool-directory-icon use', count: ToolsDirectory::GROUPS.size + 1
    assert_select '.tool-directory .tool-picks .tool-directory-icon use', count: 3

    sprite_file = Rails.root.join('public', IllustrationHelper::UI_ICON_SPRITE.delete_prefix('/'))
    sprite = Nokogiri::XML(sprite_file.read)
    definitions = sprite.xpath('//*[local-name()="symbol"]').map { |symbol| symbol['id'] }
    used = css_select('.tool-directory .tool-directory-icon use')
    references = used.map { |icon| icon['href'] }
    assert_empty references.map { |reference| reference.split('#').last } - definitions
    assert_equal references, references.uniq
    used.each { |icon| assert_equal icon['href'], icon['xlink:href'] }
  end

  test 'the directory and each tool page have distinct hero artwork' do
    sources = ['/orodja/', *LocalTools::PAGES.keys].map do |path|
      get path
      assert_response :success
      assert_select 'img.page-hero-art[alt=""]', count: 1
      css_select('img.page-hero-art').first['src']
    end
    assert_equal sources.uniq, sources
    sources.each do |source|
      assert_match %r{\A/visuals/hero-[a-z-]+\.[a-f0-9]{16}\.svg\z}, source
      file = source.sub(/\.[a-f0-9]{16}\.svg\z/, '.svg').delete_prefix('/')
      assert Rails.root.join('public', file).file?
    end
  end

  test 'flag days, admissions, and statutory dates use their source-backed ranges' do
    get '/dnevi-za-zastavo/'
    assert_response :success
    assert_select '[data-tool-row][data-year="2027"][data-category="required"]', count: 6
    assert_select '[data-tool-row][data-year="2027"][data-category="optional"][data-date="2027-08-07"]', count: 1
    get '/vpisni-koledar/'
    assert_response :success
    assert_select '[data-tool-row][data-category="srednja"][data-date="2027-04-05"]', count: 1
    assert_select '[data-tool-row][data-category="visja"][data-date="2027-02-18"][data-end="2027-03-18"]', count: 1
    assert_select '[data-tool-row][data-category="fakulteta"]', count: 0
    get '/davcni-koledar/'
    assert_response :success
    assert_select '[data-tool-row][data-category="najem"][data-date="2027-03-01"]', text: /premik na delovnik/
    get '/godovi/'
    assert_response :not_found
  end

  test 'countdown includes actual sourced festival and local day dates' do
    events = CountdownCatalog.events(today: Date.new(2026, 11, 22))
    assert events.any? { |row| row[:path] == '/festivali/kurentovanje/' && row[:date] == '2027-02-03' && row[:end_date] == '2027-02-09' }
    assert events.any? { |row| row[:path] == '/pomembni-dnevi/praznik-ptuja/' && row[:date] == '2027-04-23' }
    refute events.any? { |row| row[:path] == '/festivali/#eurobasket-ljubljana-2029' }
  end
end
