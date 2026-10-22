require 'test_helper'

class ContactPageTest < ActionDispatch::IntegrationTest
  test 'contact uses the published Google Form without loading third party content on arrival' do
    get '/kontakt/'
    assert_response :success
    assert_select 'h1#contact-title', count: 1
    assert_select '[data-contact-topic][aria-pressed]', count: 4
    assert_select '[data-contact-topic][aria-pressed=true]', count: 1
    assert_select 'iframe', count: 0
    assert_select 'form[action="/kontakt/"]', count: 0
    assert_select 'a[data-contact-open][target="_blank"]' do |links|
      assert_equal 'https://docs.google.com/forms/d/e/1FAIpQLSed2Z0hsjbskNP2M8p9bQeuC9suQqlUU5WHbGBmxPdtHGodkQ/viewform?hl=sl', links.first['href']
    end
    assert_select 'a[data-contact-mail][href="mailto:koledar365@gmail.com"]', count: 1
    assert_select '[data-contact-load][hidden]', count: 1
    assert_select '#pogosta-vprasanja details', count: 6
    assert_select 'script[type=module][src="/contact/contact-v1.mjs"]', count: 1
    assert_includes response.headers['Content-Security-Policy'], 'frame-src https://docs.google.com/forms/'
  end
end
