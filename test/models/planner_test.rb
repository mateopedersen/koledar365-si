require 'test_helper'
class PlannerTest < ActiveSupport::TestCase
  test 'birthday recurrence has explicit non leap year policy and preserves original date' do
    base={type:'birthday',year:2027,entries:[{title:'Rojstni dan',person:'Preizkus',date:'2000-02-29'}]}
    %w[feb28 march1 leap_only].each do |policy|
      options=PrintCatalog.normalize(base.merge(leap_policy:policy))
      result=IcsService.import(PlannerCalendar.export(options))
      expected=case policy
      when 'feb28' then %w[2027-02-28 2028-02-29 2029-02-28 2030-02-28]
      when 'march1' then %w[2027-03-01 2028-02-29 2029-03-01 2030-03-01]
      else ['2028-02-29']
      end
      assert_equal expected,result.map { |e|e['date'] }
      assert_equal '2000-02-29',options['entries'][0]['date']
    end
  end
  test 'overnight shifts retain their actual interval including DST' do
    options=PrintCatalog.normalize(type:'shift',entries:[{title:'Nočna',date:'2027-03-27',time:'22:00',end_time:'06:00',break:'30'}])
    event=IcsService.import(PlannerCalendar.export(options)).first
    assert_equal 420,event['minutes']
    assert_includes event['notes'],'Odmor: 30 min'
    assert_raises(ArgumentError) { PlannerCalendar.export(PrintCatalog.normalize(type:'shift',entries:[{title:'Napaka',date:'2027-03-28',time:'02:30',end_time:'06:00'}])) }
  end
  test 'unsupported glyphs are rejected and normalized undated options remain stable' do
    assert_raises(ArgumentError) { PrintCatalog.normalize(name:"Ana 漢") }
    options=PrintCatalog.normalize(type:'blank',undated:true)
    assert_equal options,PrintCatalog.normalize(options)
    assert_match(/zan-/,PrintCatalog.filename(PrintCatalog.normalize(type:'name',name:'Žan')))
    assert_not_equal PrintCatalog.filename(PrintCatalog.normalize(name:'Žan')),PrintCatalog.filename(PrintCatalog.normalize(name:'Zan'))
  end
  test 'breaks cannot exceed elapsed shift time and zero duration is rejected' do
    assert_raises(ArgumentError) { PrintCatalog.normalize(entries:[{date:'2027-01-04',time:'08:00',end_time:'09:00',break:'61'}]) }
    assert_raises(ArgumentError) { PrintCatalog.normalize(entries:[{date:'2027-01-04',time:'08:00',end_time:'08:00'}]) }
    assert_equal 420,PlannerCalendar.minutes({'date'=>'2027-03-27','time'=>'22:00','end_time'=>'06:00'})
    assert_equal 540,PlannerCalendar.minutes({'date'=>'2027-10-30','time'=>'22:00','end_time'=>'06:00'})
  end
  test 'identical requests use the unique database index without validation failure' do
    fingerprint=SecureRandom.hex(32)
    a=PrintRequest.create_or_find_by!(fingerprint:fingerprint)
    b=PrintRequest.create_or_find_by!(fingerprint:fingerprint)
    assert_equal a.id,b.id
  end
  test 'edited calendar data changes print identity but horoscope edits do not' do
    options=PrintCatalog.normalize(year:2027)
    old=PrintCatalog.fingerprint(options)
    event=CalendarEvent.where(on:Date.new(2027,1,1)..Date.new(2027,12,31)).first
    event.update!(title:event.title+' popravek')
    assert_not_equal old,PrintCatalog.fingerprint(options)
    second=PrintCatalog.fingerprint(options)
    Horoscope.create!(sign:'oven',local_date:Date.new(2027,1,1),body:'Izvirno razvedrilno besedilo za preverjanje ločenosti od koledarskih podatkov.')
    assert_equal second,PrintCatalog.fingerprint(options)
  end
end
