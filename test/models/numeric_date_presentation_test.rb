require 'test_helper'

class NumericDatePresentationTest < ActiveSupport::TestCase
  test 'compact numeric dates agree with the shared Ruby and JavaScript contract' do
    JSON.parse(Rails.root.join('test/fixtures/files/numeric_dates.json').read).each do |row|
      assert_equal row.fetch('output'), NumericDatePresentation.compact(row.fetch('input')), row.fetch('input')
    end
  end

  test 'HTML presentation preserves stored and editable data and written month names' do
    source = <<~HTML
      <!DOCTYPE html><html lang="sl"><head><title>31. 10. 2026.</title>
      <script type="application/ld+json">{"date":"31. 10. 2026","startDate":"2026-10-31"}</script>
      <style>/* 31. 10. */</style></head><body>
      <p aria-label="Datum: 31. 10. 2026" title="31. 10."><time datetime="2026-10-31">31. 10.</time> 31. oktober 2026</p>
      <img src="/photo.webp" alt="Dogodek 31. 10. 2026"><input value="31. 10. 2026">
      <textarea>31. 10. 2026</textarea><code>31. 10. 2026</code><pre>31. 10. 2026</pre>
      <div contenteditable="true">31. 10. 2026</div></body></html>
    HTML
    document = Nokogiri::HTML(NumericDatePresentation.html(source))
    assert_equal '31.10.2026.', document.at_css('title').text
    assert_equal '31.10.', document.at_css('time').text
    assert_equal '2026-10-31', document.at_css('time')['datetime']
    assert_equal 'Datum: 31.10.2026', document.at_css('p')['aria-label']
    assert_equal '31.10.', document.at_css('p')['title']
    assert_equal 'Dogodek 31.10.2026', document.at_css('img')['alt']
    assert_includes document.at_css('p').text, '31. oktober 2026'
    assert_equal '31. 10. 2026', document.at_css('input')['value']
    %w[textarea code pre [contenteditable]].each { |selector| assert_equal '31. 10. 2026', document.at_css(selector).text }
    assert_includes document.at_css('script').text, '"date":"31. 10. 2026"'
    assert_includes document.at_css('style').text, '31. 10.'
  end
end
