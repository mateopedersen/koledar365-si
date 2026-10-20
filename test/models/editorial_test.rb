require 'test_helper'
class EditorialTest < ActiveSupport::TestCase
  test 'batch import is atomic and scheduled text stays in its original day' do
    travel_to Time.zone.local(2028,3,25,23,59) do
      body='Preden se lotite nove obveznosti, dokončajte eno že začeto nalogo. Zvečer si vzemite čas za miren pogovor.'
      row={sign:'oven',local_date:'2028-03-26',body:body,status:'scheduled'}
      assert_difference('Horoscope.count',1) { HoroscopeImporter.import!([row].to_json,actor:'Test') }
      Horoscope.publish_due!
      assert_equal 'scheduled',Horoscope.find_by(sign:'oven',local_date:'2028-03-26').status
      assert_raises(ArgumentError) { HoroscopeImporter.import!([row.merge(sign:'bik'),row.merge(sign:'no-such-sign')].to_json,actor:'Test') }
      assert_not Horoscope.exists?(sign:'bik',local_date:'2028-03-26')
      travel 2.minutes
      Horoscope.publish_due!
      assert_equal body,Horoscope.visible.find_by!(sign:'oven',local_date:Time.zone.today).body
      assert_equal 1,Horoscope.where(sign:'oven',local_date:Time.zone.today).count
    end
  end
end
