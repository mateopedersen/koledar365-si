require 'test_helper'

class ObservancesTest < ActionDispatch::IntegrationTest
  test 'every published observance keeps one brand separator across page and social titles' do
    slugs=CalendarEvent.where(on:Date.new(2027,1,1)..Date.new(2030,12,31)).distinct.pluck(:slug)
    pages=Page.where("path LIKE ? OR path LIKE ? OR path LIKE ?",'/prazniki/%/','/pomembni-dnevi/%/','/letni-casi/%/').select { |page|slugs.include?(page.path.split('/').last) }
    assert_operator pages.length,:>,50
    pages.each do |page|
      page.update!(status:'published')
      get page.path
      assert_response :success
      title=css_select('title').sole.text
      assert_match(/\A[^|]+ \| Koledar365\z/,title,page.path)
      assert_includes title,'datumi 2027–2030',page.path
      assert_select 'section[data-occasion-planner]', count: 1
      assert_select 'select[data-occasion-select] option', minimum: 4
      assert_select 'a[data-occasion-ics][download]', count: 1
      assert_select 'meta[property="og:title"]',count:1 do |tags|
        assert_equal title,tags.sole['content'],page.path
      end
      assert_select 'meta[name="twitter:title"]',count:1 do |tags|
        assert_equal title,tags.sole['content'],page.path
      end
    end
  end

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
