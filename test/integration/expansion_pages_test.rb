require 'test_helper'

class ExpansionPagesTest < ActionDispatch::IntegrationTest
  test 'new sourced pages render one H1 unique metadata visible FAQs and honest organization schema' do
    travel_to Time.utc(2026,10,21,12) do
      paths=[GardenCalendar::PATH,*PaymentCalendar.paths,'/viri-in-metodologija/']
      titles=[];descriptions=[]
      paths.each do |path|
        get path
        assert_response :success
        assert_select 'main h1',count:1
        assert_select 'link[rel=canonical][href=?]',"https://koledar365.si#{path}"
        assert_select 'meta[name=description][content=?]',ExpansionCatalog.page(path).fetch(:description)
        titles<<css_select('title').first.text;descriptions<<css_select('meta[name=description]').first['content']
        graph=JSON.parse(css_select('script[type="application/ld+json"]').first.text).fetch('@graph')
        page=graph.find{|node|node['@type']=='WebPage'}
        assert_nil page['dateModified'], 'Content modification is tracked during publication, not copied from the source-review date'
        assert_equal 'https://koledar365.si/#organization',page.dig('publisher','@id')
        if path!='/viri-in-metodologija/'
          assert graph.any?{|node|node['@type']=='ImageObject' && node['width']>=1200}
          faq=graph.find{|node|node['@type']=='FAQPage'}
          assert faq
          faq.fetch('mainEntity').each{|q| assert_includes response.body,ERB::Util.html_escape(q.fetch('name'))}
          assert page['citation'].all?{|url|url.start_with?('https://')}
        end
      end
      assert_equal titles.uniq,titles;assert_equal descriptions.uniq,descriptions
    end
  end

  test 'all new topic pages are reachable in public discovery and removed name paths stay gone' do
    get '/orodja/'
    [GardenCalendar::PATH,*PaymentCalendar.paths,*EducationCalendar::LINKS.map(&:last),*AstronomySchedule::PATHS.values].uniq.each do |path|
      next if path=='/solske-pocitnice/'
      assert_select 'a[href=?]',path
    end
    ['/koledar-z-imenom/','/imena/'].each{|path|get path;assert_response :not_found}
  end

  test 'personal garden form cannot submit private notes without JavaScript and source data remains visible' do
    get GardenCalendar::PATH
    assert_select '[data-garden-plan-form] fieldset[disabled]'
    assert_select '[data-garden-row]',count:16
    assert_select '.garden-static-reference dd',count:16
    assert_select 'img[width="1200"][height="800"][alt]'
  end

  test 'garden photograph credits are on the existing license page reached from the home footer' do
    get GardenCalendar::PATH
    assert_response :success
    assert_select '.garden-plant-photo',count:16
    assert_select '.garden-detail-photo',count:16
    assert_select 'main a[href*="fotografije-in-licence"], main .garden-photo-credit',count:0
    get '/'
    assert_select 'footer a[href="/fotografije-in-licence/"]',count:1
    get '/fotografije-in-licence/'
    assert_response :success
    assert_select '#fotografije-vrtnin',text:'Fotografije vrtnin'
    assert_select '.garden-photo-license',count:16
    GardenCalendar.photos.each do |photo|
      assert_select "#vrtnina-#{photo.fetch('id')}" do
        assert_select 'a[href=?]',photo.fetch('source'),count:1
        assert_select 'a[href=?]',photo.fetch('license_url'),count:1
      end
    end
  end
end
