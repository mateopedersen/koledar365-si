class PublicCalendarDownloadsController < ApplicationController
  def show
    file = PublicCalendarGallery.public_file(request.path)
    raise ActiveRecord::RecordNotFound unless file
    response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    # Public raster previews and downloadable images belong in image search.
    # Keep duplicate PDF/ZIP documents out of the regular web index.
    response.headers['X-Robots-Tag'] = 'noindex' unless %w[.png .webp].include?(file.extname)
    mime = { '.pdf' => 'application/pdf', '.png' => 'image/png', '.webp' => 'image/webp', '.zip' => 'application/zip' }.fetch(file.extname)
    send_file file, type: mime, disposition: file.extname == '.zip' ? 'attachment' : 'inline'
  end
end
