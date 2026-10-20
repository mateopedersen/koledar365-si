class ExportsController < ApplicationController
  rate_limit to:20,within:1.minute,only: :create
  def create
    options=PrintCatalog.normalize(params.require(:options).permit(:type,:design,:year,:month,:date,:name,:paper,:orientation,:notes,:undated,entries:[:title,:date,:time,:person,:code,:end_time,:break,:notes]).to_h)
    public_name=options['name'].blank?||PersonName.exists?(exact:options['name'])
    private_file=!public_name||options['notes'].present?||options['entries'].any?
    owner=private_file ? (session[:export_owner]||=SecureRandom.hex(24)) : nil
    fingerprint=PrintCatalog.fingerprint(options,owner:owner)
    request=PrintRequest.create_or_find_by!(fingerprint:fingerprint) do |r|
      r.options=options;r.private_file=private_file;r.owner_token=owner;r.expires_at=7.days.from_now if private_file
    end
    if request.status=='expired'
      request.update!(options:options,status:'queued',owner_token:owner,expires_at:7.days.from_now,attempts:0,error:nil,files:{})
    end
    RenderCalendarJob.perform_later(request.id) if request.status=='queued' && request.attempts==0
    render json:{id:request.id,status:request.status,url:"/izvozi/#{request.id}/"},status: :accepted
  rescue ArgumentError,ActionController::ParameterMissing=>e
    render json:{error:e.message},status: :unprocessable_entity
  end
  def show
    r=authorized_request
    render json:{id:r.id,status:r.status,error:r.error,files:r.available? ? r.files.keys.to_h { |k| [k,"/izvozi/#{r.id}/#{k}"] }: {}}
  end
  def download
    r=authorized_request;raise ActiveRecord::RecordNotFound unless r.available?&&r.files.key?(params[:kind])
    name=r.files.fetch(params[:kind]);path=Rails.root.join('storage/exports',r.fingerprint,name)
    raise ActiveRecord::RecordNotFound unless path.file?
    response.headers['Cache-Control']=r.private_file ? 'private, no-store':'public, max-age=31536000, immutable'
    response.headers['X-Robots-Tag']='noindex'
    types={'.pdf'=>'application/pdf','.webp'=>'image/webp','.png'=>'image/png','.zip'=>'application/zip','.json'=>'application/json'}
    send_file(path,type:types.fetch(File.extname(name)),disposition:params[:kind]=='preview' ? 'inline':'attachment',filename:"koledar365-#{r.options['year']}-#{r.options['type']}-#{r.options['design']}#{File.extname(name)}")
  end
  def authorized_request
    r=PrintRequest.find(params[:id])
    raise ActiveRecord::RecordNotFound if r.private_file && (session[:export_owner].blank?||!ActiveSupport::SecurityUtils.secure_compare(r.owner_token.to_s,session[:export_owner].to_s))
    r
  end
end
