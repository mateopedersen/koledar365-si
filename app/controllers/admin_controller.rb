class AdminController < ApplicationController
  before_action :require_admin,except:[:login,:authenticate]
  rate_limit to:5,within:5.minutes,only: :authenticate
  def login
    @title='Prijava v uredništvo';@noindex=true
  end
  def authenticate
    admin=Admin.find_by(email:params[:email].to_s.downcase)
    if admin&.authenticate(params[:password])
      reset_session;session[:admin_id]=admin.id;session[:admin_at]=Time.current.to_i;redirect_to '/upravljanje/'
    else
      @title='Prijava v uredništvo';@error='Prijava ni uspela. Preverite podatke.';render :login,status: :unprocessable_entity
    end
  end
  def logout
    reset_session;redirect_to '/'
  end
  def index
    @title='Uredništvo';@noindex=true;@messages=ContactMessage.order(created_at: :desc).limit(100);@exports=PrintRequest.order(id: :desc).limit(30);@horoscopes=Horoscope.order(local_date: :desc).limit(48)
  end
  def horoscope
    d=Date.iso8601(params[:local_date]);sign=params[:sign];r=Horoscope.find_or_initialize_by(sign:sign,local_date:d,locale:'sl')
    status=params[:status];raise ArgumentError unless %w[draft scheduled published].include?(status)
    raise ArgumentError if status=='published'&&d>Time.zone.today
    r.update!(body:params[:body],status:status,editor:'Mateo Pedersen',published_at:status=='published' ? Time.current : nil)
    AuditLog.create!(action:'horoscope_edit',actor:@admin.email,details:{id:r.id,status:r.status})
    redirect_to '/upravljanje/',notice:'Besedilo je shranjeno.'
  rescue ArgumentError,ActiveRecord::RecordInvalid
    redirect_to '/upravljanje/',alert:'Preverite datum, znamenje in dolžino besedila. Prihodnji datum lahko načrtujete.'
  end
  def message_status
    r=ContactMessage.find(params[:id]);r.update!(status:'read');redirect_to '/upravljanje/'
  end
  def retry_export
    r=PrintRequest.find(params[:id]);r.update!(status:'queued',attempts:0,error:nil);RenderCalendarJob.perform_later(r.id);redirect_to '/upravljanje/'
  end
  def import
    PackageImporter.run!;redirect_to '/upravljanje/',notice:'Uvoz je končan.'
  end
  def publish_names
    NamePublisher.run!(params[:limit].to_i);redirect_to '/upravljanje/',notice:'Preverjanje in objava sta končana.'
  end
  def require_admin
    @admin=Admin.find_by(id:session[:admin_id])
    redirect_to '/upravljanje/prijava/' unless @admin&&session[:admin_at].to_i>8.hours.ago.to_i
  end
end
