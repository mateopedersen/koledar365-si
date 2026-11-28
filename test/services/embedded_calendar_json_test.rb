require 'test_helper'

class EmbeddedCalendarJsonTest < ActiveSupport::TestCase
  test 'calendar JSON cannot close its script data island' do
    attack = '</script><img src=x onerror="globalThis.injected=true">&\u2028'
    data = {'title' => attack, 'schoolRange' => [attack], 'events' => []}
    views = {
      '_garden_calendar' => {garden: Struct.new(:data).new(data)},
      '_school_timetable_period' => {timetable_data: data},
      '_school' => {school_data: data}
    }
    views.each do |name, locals|
      template = Rails.root.join("app/views/pages/#{name}.html.erb").read
      island = template.match(/<script\b[^>]*type="application\/json"[^>]*>.*?<\/script>/m)[0]
      html = ApplicationController.render(inline: island, locals: locals)
      doc = Nokogiri::HTML.fragment(html)
      assert_equal 1, doc.css('script[type="application/json"]').length, name
      assert_empty doc.css('img'), name
      decoded = JSON.parse(doc.at_css('script').text)
      value = name == '_school_timetable_period' ? decoded.fetch('schoolRange').first : decoded.fetch('title')
      assert_equal attack, value, name
    end
  end
end
