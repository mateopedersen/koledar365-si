require 'test_helper'

class SeasonsTest < ActionDispatch::IntegrationTest
  test 'season hub contains sixteen sourced astronomical instants instead of general holidays' do
    get '/letni-casi/'
    assert_response :success
    assert_select 'h1', count:1
    assert_select 'tr[data-season]', count:16
    (2027..2030).each do |year|
      assert_select "#letni-casi-#{year} tr[data-season]",count:4
      assert_select "a[href='#letni-casi-#{year}']",count:1
    end
    assert_select "tr[data-season='pomladno-enakonocje'] time[datetime='2027-03-20T21:25:00+01:00']"
    assert_select "tr[data-season='pomladno-enakonocje'] time[datetime='2027-03-20T20:25:00Z']"
    assert_select '.data-table a',text:'Novo leto',count:0
    assert_select '.data-table a[href="/letni-casi/poletni-solsticij/"]',count:4
    assert_includes response.body,'Meteorološki letni časi'
    assert_includes response.body,'Europe/Ljubljana'
  end
end
