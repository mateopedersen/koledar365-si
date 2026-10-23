require 'test_helper'

class TopicExperienceTest < ActionDispatch::IntegrationTest
  test 'all fifteen specialist pages have unique illustrations and complete readable editorial guides' do
    assert_equal 15, TopicExperience.paths.size
    assert_equal 15, TopicExperience.data.fetch('pages').values.map { |page| page.fetch('art') }.uniq.size
    travel_to Time.utc(2026,10,23,12) do
      TopicExperience.paths.each do |path|
        get path
        assert_response :success
        assert_select 'main h1', count:1
        assert_select 'article.topic-experience', count:1
        assert_select '.topic-snapshot .topic-fact', count:3
        assert_select '.topic-guide tbody tr', count:3
        assert_select '[data-topic-checklist] [data-topic-check]', count:3
        assert_select '.topic-guide a[href=?]', TopicExperience.page(path).fetch('sourceUrl')
        assert_select '.topic-art img[src=?]', "/topics/#{TopicExperience.page(path).fetch('art')}.svg", count:1
        assert_select 'link[href="/topics/experience.css"]', count:1
        assert_select 'link[rel=canonical][href=?]', "https://koledar365.si#{path}", count:1
        assert_select 'meta[name=robots][content=?]', Rails.env.production? ? 'index, follow, max-image-preview:large' : 'noindex, follow'
        assert File.file?(Rails.root.join('public/topics',"#{TopicExperience.page(path).fetch('art')}.svg"))
      end
    end
  end

  test 'specialist additions are scoped away from other pages and timetable tools' do
    ['/prestopno-leto/','/solski-urnik/','/'].each do |path|
      get path
      assert_response :success
      assert_select '.topic-experience', count:0
      assert_select 'link[href="/topics/experience.css"]', count:0
    end
  end
end
