require 'test_helper'

class SocialShareTest < ActionDispatch::IntegrationTest
  test 'calendar and horoscope sharing use their canonical public page' do
    {
      '/koledar/2030/februar/' => 'https://koledar365.si/koledar/2030/februar/',
      '/horoskop/dvojcka/' => 'https://koledar365.si/horoskop/dvojcka/'
    }.each do |path, canonical|
      get path, params: {view: 'week'}
      assert_response :success
      assert_select ".site-share[data-share-url='#{canonical}']", count: 1
      assert_select '.site-share__target', count: 8
      assert_select '.site-share__target--whatsapp[href^="https://wa.me/?text="]', count: 1
      assert_select '.site-share__target--bluesky[href^="https://bsky.app/intent/compose?text="]', count: 1
      assert_select '.site-share__target--pinterest img[src="/social/pinterest.png"]', count: 1
      assert_select '[data-share-native][hidden]', count: 1
    end
  end

  test 'missing pages do not show a sharing control' do
    get '/neobstojeca-stran-za-deljenje/'
    assert_response :not_found
    assert_select '.site-share', count: 0
  end
end
