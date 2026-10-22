require 'test_helper'

class CalendarDirectoryTest < ActionDispatch::IntegrationTest
  test 'directory keeps every existing year and month destination in a chronological matrix' do
    get '/koledar/'
    assert_response :success
    assert_select 'h1', text:'Koledarji 2027–2030', count:1
    assert_select '.cd-period-table thead th', count:5
    assert_select '.cd-period-table tbody tr', count:13
    assert_select '.cd-period-table tbody a', count:52
    doc=Nokogiri::HTML(response.body)
    links=doc.css('.calendar-directory a').map{|a|a['href']}
    Page.where('path LIKE ?', '/koledar/%').where.not(path:'/koledar/').pluck(:path).each do |path|
      assert_includes links,path,"Existing calendar destination disappeared: #{path}"
    end
    assert_equal (0..12).to_a,doc.css('[data-directory-row]').map{|row|row['data-directory-row'].to_i}
    assert_select '[data-directory-column="2028"] small', text:/366 dni.*prestopno leto/
    assert_select 'script[type=module][src="/calendar-tools/directory.mjs"]',count:1
    assert_select '.cd-tool-table tbody tr',count:7
  end

  test 'year page retains its calendar and downloads' do
    get '/koledar/2028/'
    assert_response :success
    assert_select '[data-calendar-directory]', count:0
    assert_select '.calendar-month-index__links a',count:12
    assert_select '#calendar-designs',minimum:1
  end
end
