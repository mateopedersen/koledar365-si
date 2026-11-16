require 'test_helper'
class AdvertisingConfigTest < ActiveSupport::TestCase
  test 'advertising never enters private tools, legal pages or editors' do
    %w[home planner school_timetable tool vacation calendar_studio about privacy cookie_policy terms methodology].each do |section|
      assert_not AdvertisingConfig.eligible?(section: section, path: '/')
    end
    %w[/kontakt/ /fotografije-in-licence/ /upravljanje/dogodki/].each do |path|
      assert_not AdvertisingConfig.eligible?(section: 'info', path: path)
    end
    assert_not AdvertisingConfig.eligible?(section: 'calendar', path: '/koledar/2027/', noindex: true)
    assert_not AdvertisingConfig.eligible?(section: 'calendar', path: '/koledar/2027/', not_found: true)
    assert AdvertisingConfig.eligible?(section: 'shopping_guide', path: '/pomembni-dnevi/crni-petek/')
    assert AdvertisingConfig.eligible?(section: 'calendar', path: '/koledar/2027/')
  end
end
