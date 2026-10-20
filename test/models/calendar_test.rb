require 'test_helper'
class CalendarTest < ActiveSupport::TestCase
  test 'all four years contain each date once in Monday first grids' do
    (2027..2030).each do |y|
      dates=[]
      (1..12).each do |m|
        weeks=CalendarEngine.weeks(y,m)
        assert (4..6).cover?(weeks.size)
        assert weeks.all? { |w|w.size==7&&w.first.cwday==1&&w.last.cwday==7 }
        dates += weeks.flatten.select { |d|d.month==m }
      end
      assert_equal (Date.new(y,1,1)..Date.new(y,12,31)).to_a,dates
    end
    assert_equal 1,Date.new(2029,1,1).cwday
    assert_equal 2,Date.new(2030,1,1).cwday
    assert_equal 2026,Date.new(2027,1,1).cwyear
  end
  test 'workdays use statutory free days without weekend double subtraction' do
    {2027=>255,2028=>250,2029=>248,2030=>249}.each do |y,expected|
      assert_equal expected,CalendarEngine.working_days(Date.new(y,1,1),Date.new(y,12,31))[:working_days]
    end
    assert_equal 0,CalendarEngine.working_days(Date.new(2028,1,1),Date.new(2028,1,2))[:working_days]
    assert_equal 1,CalendarEngine.working_days(Date.new(2027,8,9),Date.new(2027,8,9))[:working_days]
  end
  test 'movable holidays and Ljubljana date boundary' do
    assert_equal Date.new(2028,2,29),CalendarEngine.easter(2028)-47
    assert_equal Date.new(2030,4,21),CalendarEngine.easter(2030)
    phase=AstronomicalEvent.find_by!(instant:Time.utc(2030,4,2,22,2))
    assert_equal '2030-04-03 00:02 +0200',phase.local_time.strftime('%F %H:%M %z')
    assert_equal '+0100',Time.utc(2027,3,28,0,59).in_time_zone('Europe/Ljubljana').strftime('%z')
    assert_equal '+0200',Time.utc(2027,3,28,1,0).in_time_zone('Europe/Ljubljana').strftime('%z')
  end
  test 'names preserve exact Unicode identities and popularity order' do
    assert_equal 8561,PersonName.count
    assert_equal 8561,PersonName.distinct.count(:slug)
    assert_equal 'Marija',PersonName.order(:priority).first.exact
    refute_equal PersonName.find_by!(exact:'Žan').slug,PersonName.find_by!(exact:'Zan').slug
    assert PersonName.search('zan').pluck(:exact).include?('Žan')
    assert PersonName.find_by!(exact:'Marija').observations['resident_male_count'].nil?
  end
  test 'Slovene one two few other and decimals' do
    {1=>'1 dan',2=>'2 dneva',3=>'3 dnevi',4=>'4 dnevi',5=>'5 dni',101=>'101 dan',102=>'102 dneva',103=>'103 dnevi',111=>'111 dni',1.5=>'1.5 dnevi'}.each { |n,s| assert_equal s,I18n.t('days',count:n) }
  end
  test 'zodiac leap day and year transition' do
    assert_equal 'kozorog',Zodiac.for_date(Date.new(2028,1,1))
    assert_equal 'ribi',Zodiac.for_date(Date.new(2028,2,29))
    assert_equal 'oven',Zodiac.for_date(Date.new(2028,3,21))
    assert_raises(Date::Error) { Date.new(2029,2,29) }
  end
  test 'ICS all day roundtrip and exclusive end' do
    entries=[{'uid'=>'test','date'=>'2028-02-29','title'=>'Čas za Žana','repeat'=>'yearly'}]
    text=IcsService.export(entries)
    assert_includes text,'DTEND;VALUE=DATE:20280301'
    parsed=IcsService.import(text)
    assert_equal '2028-02-29',parsed.first['date']
    assert_equal 'Čas za Žana',parsed.first['title']
    assert_equal 'test',parsed.first['uid']
  end
  test 'calendar name is part of content fingerprint but horoscopes are not' do
    a=PrintCatalog.normalize(name:'Žan',year:2029)
    refute_equal PrintCatalog.fingerprint(a),PrintCatalog.fingerprint(a.merge('name'=>'Zan'))
    assert_equal PrintCatalog.fingerprint(a),PrintCatalog.fingerprint(a.dup)
    assert_raises(ArgumentError) { PrintCatalog.normalize(year:2031) }
  end
end
