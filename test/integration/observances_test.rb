require 'test_helper'

class ObservancesTest < ActionDispatch::IntegrationTest
  test 'a date inside the introduction remains a complete sentence' do
    assert_equal 'Marijino vnebovzetje, imenovano tudi veliki šmaren, obeležujemo 15. avgusta.',ObservancePage.new('marijino-vnebovzetje').lead
  end

  test 'an observance coinciding with a free holiday keeps its own legal status' do
    get '/prazniki/svetovni-dan-cebel/'
    assert_response :success
    assert_select '#datum-2029 .observance-date-status',text:'Ni dela prost dan'
    assert_select '#datum-2029 .observance-coincidence',text:/binkoštna nedelja/
    assert_select '.observance-photo img[src*="svetovni-dan-cebel"]',count:1
  end

  test 'topic export includes both clock changes and rejects an unknown topic' do
    get '/prazniki/2028.ics',params:{all:'1',topic:'premik-ure'}
    assert_response :success
    assert_equal ['2028-03-26','2028-10-29'],IcsService.import(response.body).map { |event|event['date'] }
    get '/prazniki/2028.ics',params:{all:'1',topic:'neznani-praznik'}
    assert_response :not_found
  end
end
