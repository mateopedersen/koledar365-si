require 'test_helper'

class CalendarStudioTest < ActionDispatch::IntegrationTest
  test 'calendar creator serves the dedicated editor and accurate metadata' do
    get '/ustvari-koledar/'
    assert_response :success
    assert_select 'main h1', text: 'Ustvarite svoj koledar za tisk', count: 1
    assert_select 'link[rel=canonical][href="https://koledar365.si/ustvari-koledar/"]', count: 1
    assert_select '#studio-guide a[href="/ustvari-koledar/?year=2028&month=2&view=month#studio-workspace"]', count: 1
    assert_select '#studio-guide .studio-guide__csv code', text: /2028-02-22/, count: 1
    assert_select '#calendar-studio #studio-paper', count: 1
    assert_select '#planner-options,.design-section', count: 0
    assert_select '[data-panel]', count: 6
    assert_select 'select[data-setting=weekStart] option[value="0"]', text: /Nedelja/
    assert_select 'script[type=module][src^="/studio/studio.mjs"]', count: 1
    assert_select 'link[rel=stylesheet][href^="/studio/studio.css"]', count: 1
    assert_select 'meta[name=description]' do |tags|
      assert_includes tags.first['content'], 'fotografijami'
      assert_includes tags.first['content'], 'SVG'
    end
    schema = JSON.parse(css_select('script[type="application/ld+json"]').first.text)['@graph']
    app = schema.find { |node| node['@type']=='WebApplication' }
    assert_equal 'DesignApplication', app['applicationCategory']
    questions = schema.find { |node| node['@type']=='FAQPage' }.fetch('mainEntity')
    visible = css_select('.studio-faq details').map { |detail| [detail.at_css('summary').text, detail.at_css('p').text] }
    assert_equal 5, visible.length
    assert_equal visible, questions.map { |question| [question.fetch('name'), question.dig('acceptedAnswer', 'text')] }
    refute css_select('body.gallery-page').any?
  end
end
