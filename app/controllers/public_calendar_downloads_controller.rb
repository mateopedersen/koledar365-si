class PublicCalendarDownloadsController < ApplicationController
  def show
    file = PublicCalendarGallery.public_file(request.path)
    raise ActiveRecord::RecordNotFound unless file
    response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    response.headers['X-Robots-Tag'] = 'noindex'
    mime = { '.pdf' => 'application/pdf', '.png' => 'image/png', '.webp' => 'image/webp', '.zip' => 'application/zip' }.fetch(file.extname)
    send_file file, type: mime, disposition: file.extname == '.zip' ? 'attachment' : 'inline'
  end
end
