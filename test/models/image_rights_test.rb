require 'test_helper'

class ImageRightsTest < ActiveSupport::TestCase
  test 'reviewed photographic attribution does not invent copyright ownership' do
    photo = HolidayPhotoCatalog.all.find { |item| item['author'].present? && item['license_url'].present? }
    object = {'@type' => 'ImageObject', 'contentUrl' => 'https://koledar365.si' + photo.fetch('local_path')}
    ImageRights.apply!([object], origin: 'https://koledar365.si')
    assert_equal photo['author'], object.dig('creator','name')
    assert_equal photo['license_url'], object['license']
    assert_equal photo['source'], object['acquireLicensePage']
    assert_includes object['copyrightNotice'], photo['license']
    assert_includes object['copyrightNotice'], photo['author']
    refute_includes object['copyrightNotice'], '©'
  end

  test 'owned calendar rights and AI illustration credit remain distinct' do
    own = {'@type' => 'ImageObject', 'contentUrl' => 'https://koledar365.si/koledarji/2027-2030/original/example.webp'}
    ai = {'@type' => 'ImageObject', 'contentUrl' => 'https://koledar365.si/garden/hero.webp', 'creditText' => 'Koledar365; ilustracija, ustvarjena z umetno inteligenco.'}
    foreign = {'@type' => 'ImageObject', 'contentUrl' => 'https://example.com/photo.jpg'}
    ImageRights.apply!({'@graph' => [own,ai,foreign]}, origin: 'https://koledar365.si')
    assert_equal 'Koledar365', own['copyrightNotice']
    assert_equal 'Organization', own.dig('creator','@type')
    assert_equal 'https://koledar365.si/pogoji-uporabe/#gradiva', own['license']
    assert_includes ai['copyrightNotice'], 'umetno inteligenco'
    refute_includes ai['copyrightNotice'], '©'
    assert_includes ai['creditText'], 'umetno inteligenco'
    assert_nil foreign['creator']
  end

  test 'public domain and CC0 notices preserve the reviewed rights status' do
    assert_includes ImageRights.rights_notice({'license' => 'Public domain'}), 'Javna domena'
    assert_includes ImageRights.rights_notice({'license' => 'CC0'}), 'brez pridržanih'
    assert_nil ImageRights.rights_notice({'author' => 'Unknown'})
    assert_equal 'Reviewed notice', ImageRights.rights_notice({'copyright_notice' => 'Reviewed notice', 'license' => 'CC0'})
  end

  test 'small photographs inherit the original reviewed source and license' do
    photo = HolidayPhotoCatalog.all.find { |item| item['small_path'].present? }
    object = {'@type' => 'ImageObject', 'contentUrl' => 'https://koledar365.si' + photo.fetch('small_path')}
    ImageRights.apply!(object, origin: 'https://koledar365.si')
    assert_equal photo['source'], object['acquireLicensePage']
    assert_equal ImageRights.rights_notice(photo), object['copyrightNotice']
  end

  test 'all catalog photographs publish a reviewed rights notice and license' do
    ImageRights.photos.each do |path, photo|
      object = {'@type' => 'ImageObject', 'contentUrl' => 'https://koledar365.si' + path}
      ImageRights.apply!(object, origin: 'https://koledar365.si')
      assert object['copyrightNotice'].present?, path
      assert object['license'].present?, path
      assert_equal photo['source'], object['acquireLicensePage'], path
    end
  end
end
