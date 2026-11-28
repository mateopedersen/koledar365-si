require 'test_helper'

class PublicCalendarGalleryTest < ActiveSupport::TestCase
  test 'only catalog-owned paths resolve to downloadable files' do
    row = PublicCalendarGallery.rows_for(year: 2027).first
    path = row.fetch('files').fetch('pdf')
    assert_equal Rails.root.join('site', path.delete_prefix('/')), PublicCalendarGallery.public_file(path)
    [path + '/../../../../config/database.yml', '/../../config/database.yml', '/free/../../config/database.yml', path + '?download=1'].each do |invalid|
      assert_nil PublicCalendarGallery.public_file(invalid)
    end
  end
end
