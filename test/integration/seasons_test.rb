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
    assert_select '#letni-casi-2030 tr[data-season="jesensko-enakonocje"]' do
      assert_select 'time[datetime="2030-09-23T01:27:00+02:00"] span', text: '23.9.'
      assert_select 'time[datetime="2030-09-22T23:27:00Z"] span', text: '22.9.'
    end
    assert_select '.seasons-table a',text:'Novo leto',count:0
    assert_select '.seasons-table a[href="/letni-casi/poletni-solsticij/"]',count:4
    assert_select 'a[href=?]', 'https://meteo.arso.gov.si/met/sl/climate/current/climate_year/'
    assert_includes response.body,'Meteorološki letni časi'
    assert_includes response.body,'Europe/Ljubljana'
    assert_select 'a[href*=?]', 'tz_label=false', count:4
  end
end
