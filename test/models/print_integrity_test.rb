require 'test_helper'
require 'tmpdir'

class PrintIntegrityTest < ActiveSupport::TestCase
  test 'holiday reports preserve all 23 dates in every design and all four years' do
    Dir.mktmpdir do |dir|
      (2027..2030).each do |year|
        expected=HolidayYear.new(year).events.map { |e|e.on.iso8601 }
        PrintCatalog.designs.each do |design|
          options=PrintCatalog.normalize(type:'holidays',year:year,design:design['id'],paper:'A5',orientation:'landscape')
          result=PdfRenderer.new(options).render(File.join(dir,'holidays.pdf'))
          assert_equal expected,result[:primary_dates]
          assert_operator result[:pages],:>=,2
        end
      end
    end
  end

  test 'oversized print content is rejected without silently discarding text' do
    assert_raises(ArgumentError) { PrintCatalog.normalize(notes:'x'*2001) }
    assert_raises(ArgumentError) { PrintCatalog.normalize(entries:[{'title'=>'x'*201}]) }
    assert_raises(ArgumentError) { PrintCatalog.normalize(entries:[{'date'=>'2028-02-31'}]) }
    assert_raises(ArgumentError) { PrintCatalog.normalize(entries:[{'time'=>'25:30'}]) }
    assert_equal 'Ž'*2000,PrintCatalog.normalize(notes:'Ž'*2000)['notes']
    assert_equal 'Č'*200,PrintCatalog.normalize(entries:[{'title'=>'Č'*200}])['entries'][0]['title']
  end
end
