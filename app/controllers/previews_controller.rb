require 'open3'
class PreviewsController < ApplicationController
  rate_limit to:120,within:1.minute
  def show
    person=PersonName.find_by(slug:params[:slug])
    raise ActiveRecord::RecordNotFound unless person||params[:slug]=='koledar'
    options=PrintCatalog.normalize(year:params[:year],design:params[:design],name:person&.exact.to_s,
      type:params[:type].presence || 'name',month:params[:month].presence || 1,
      paper:params[:paper].presence || 'A4',orientation:params[:orientation].presence || 'portrait',
      undated:params[:undated].presence || '1',date:params[:date].presence || "#{params[:year]}-01-01")
    key=PrintCatalog.fingerprint(options)
    dir=Rails.root.join('storage/previews',key);path=dir.join('preview.png')
    unless path.file?
      FileUtils.mkdir_p(dir)
      File.open(dir.join('lock'),'w') do |lock|
        lock.flock(File::LOCK_EX)
        unless path.file?
          PdfRenderer.new(options).render(dir.join('preview.pdf').to_s)
          _,status=Open3.capture2e(ENV.fetch('PDFTOPPM_BIN','pdftoppm'),'-f','1','-l','1','-singlefile','-scale-to','500','-png',dir.join('preview.pdf').to_s,dir.join('rendered').to_s)
          raise 'Predogled ni uspel.' unless status.success?
          File.rename(dir.join('rendered.png'),path)
        end
      end
    end
    response.headers['Cache-Control']='public, max-age=86400'
    send_file path,type:'image/png',disposition:'inline'
  rescue ArgumentError
    head :not_found
  end
  def og
    path=Rails.root.join('public/og.png')
    path.file? ? send_file(path,type:'image/png',disposition:'inline') : head(:not_found)
  end
end
