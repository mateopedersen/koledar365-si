require 'test_helper'

class ImageRightsTest < ActiveSupport::TestCase
  test 'reviewed photographic attribution does not invent copyright ownership' do
    photo = HolidayPhotoCatalog.all.find { |item| item['author'].present? && item['license_url'].present? }
    object = {'@type' => 'ImageObject', 'contentUrl' => 'https://koledar365.si' + photo.fetch('local_path')}
    ImageRights.apply!([object], origin: 'https://koledar365.si')
    assert_equal photo['author'], object.dig('creator','name')
    assert_equal photo['license_url'], object['license']
    assert_equal photo['source'], object['acquireLicensePage']
    assert_nil object['copyrightNotice']
  end

  test 'owned calendar rights and AI illustration credit remain distinct' do
    own = {'@type' => 'ImageObject', 'contentUrl' => 'https://koledar365.si/koledarji/2027-2030/original/example.webp'}
    ai = {'@type' => 'ImageObject', 'contentUrl' => 'https://koledar365.si/garden/hero.webp', 'creditText' => 'Koledar365; ilustracija, ustvarjena z umetno inteligenco.'}
    foreign = {'@type' => 'ImageObject', 'contentUrl' => 'https://example.com/photo.jpg'}
    ImageRights.apply!({'@graph' => [own,ai,foreign]}, origin: 'https://koledar365.si')
    assert_equal 'Koledar365', own['copyrightNotice']
    assert_equal 'Organization', own.dig('creator','@type')
    assert_equal 'https://koledar365.si/pogoji-uporabe/#gradiva', own['license']
    assert_nil ai['copyrightNotice']
    assert_includes ai['creditText'], 'umetno inteligenco'
    assert_nil foreign['creator']
  end
end
