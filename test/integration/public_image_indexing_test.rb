require 'test_helper'
require 'tempfile'

class PublicImageIndexingTest < ActionDispatch::IntegrationTest
  test 'public image downloads can be indexed in production while duplicate PDFs remain excluded' do
    original_env = Rails.env
    original_lookup = PublicCalendarGallery.method(:public_file)
    Rails.env = 'production'
    {'.webp' => 'image/webp', '.pdf' => 'application/pdf'}.each do |extension, mime|
      Tempfile.create(['koledar-image-', extension]) do |file|
        file.write('fixture'); file.flush
        PublicCalendarGallery.define_singleton_method(:public_file) { |_path| Pathname(file.path) }
        get '/prenosi/' + ('a' * 64) + '/koledar' + extension
        assert_response :success
        assert_equal mime, response.media_type
        if extension == '.webp'
          refute_match(/noindex/, response.headers['X-Robots-Tag'].to_s)
        else
          assert_equal 'noindex', response.headers['X-Robots-Tag']
        end
      end
    end
  ensure
    Rails.env = original_env
    PublicCalendarGallery.define_singleton_method(:public_file, original_lookup)
  end
end
