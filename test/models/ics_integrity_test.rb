require 'test_helper'
class IcsIntegrityTest < ActiveSupport::TestCase
  def calendar(start, finish)
    "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:external@example.org\r\nDTSTART#{start}\r\nDTEND#{finish}\r\nSUMMARY:Preverjanje\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n"
  end
  test 'Slovenian timezone winter and summer preserve local time and duration' do
    %w[20270104 20270704].each do |date|
      row=IcsService.import(calendar(";TZID=Europe/Ljubljana:#{date}T093000",";TZID=Europe/Ljubljana:#{date}T111500")).first
      assert_equal '09:30',row['time']
      assert_equal 105,row['minutes']
      exported=IcsService.export([row])
      again=IcsService.import(exported).first
      assert_equal row,again
      assert_equal 1,exported.scan('UID:external@example.org').size
    end
  end
  test 'floating time means local time and UTC is converted' do
    assert_equal '09:30',IcsService.import(calendar(':20270704T093000',':20270704T103000')).first['time']
    assert_equal '11:30',IcsService.import(calendar(':20270704T093000Z',':20270704T103000Z')).first['time']
  end
  test 'multi day all day event preserves inclusive last day on roundtrip' do
    row=IcsService.import(calendar(';VALUE=DATE:20271230',';VALUE=DATE:20280103')).first
    assert_equal '2028-01-02',row['end_date']
    assert_equal row,IcsService.import(IcsService.export([row])).first
  end
  test 'nonexistent local time and unknown timezone are rejected without silent shift' do
    assert_raises(ArgumentError) { IcsService.import(calendar(';TZID=Europe/Ljubljana:20270328T023000',';TZID=Europe/Ljubljana:20270328T033000')) }
    assert_raises(ArgumentError) { IcsService.import(calendar(';TZID=Mars/Olympus:20270104T093000',';TZID=Mars/Olympus:20270104T103000')) }
  end
end
