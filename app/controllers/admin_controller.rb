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
    @editing_horoscope=Horoscope.find_by(id:params[:horoscope_id])
    @editing_page=Page.find_by(id:params[:page_id])
    @coverage=(Time.zone.today..Time.zone.today+7).map { |date|[date,Horoscope.where(local_date:date,status:%w[scheduled published]).count] }
    @editorial_check=AuditLog.where(action:'horoscope_daily_check').order(created_at: :desc).first
    @title='Uredništvo';@noindex=true;@messages=ContactMessage.order(created_at: :desc).limit(100);@exports=PrintRequest.order(id: :desc).limit(30);@horoscopes=Horoscope.order(local_date: :desc).limit(48)
  end
  def horoscope
    d=Date.iso8601(params[:local_date]);sign=params[:sign];r=Horoscope.find_or_initialize_by(sign:sign,local_date:d,locale:'sl')
    status=params[:status];raise ArgumentError unless %w[draft scheduled published].include?(status)
    raise ArgumentError if status=='published'&&d>Time.zone.today
    r.update!(body:params[:body],status:status,editor:@admin.email,published_at:status=='published' ? Time.current : nil)
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
  rescue RuntimeError=>e
    redirect_to '/upravljanje/',alert:e.message
  end
  def import_horoscopes
    file=params[:file];raise ArgumentError,'Izberite datoteko JSON do 200 KB.' unless file.respond_to?(:read) && file.size<=200_000
    count=HoroscopeImporter.import!(file.read,actor:@admin.email)
    redirect_to '/upravljanje/',notice:"Uvožena besedila: #{count}."
  rescue ArgumentError=>e
    redirect_to '/upravljanje/',alert:e.message
  end
  def update_page
    page=Page.find(params[:id]);values=params.require(:page).permit(:title,:description,:body,:status)
    raise ArgumentError,'Naslov ali opis je predolg.' if values[:title].to_s.length>180 || values[:description].to_s.length>400 || values[:body].to_s.length>20_000
    raise ArgumentError,'Neveljavno stanje objave.' unless %w[draft published held].include?(values[:status])
    raise ArgumentError,'Stran čaka na preverjen vir; objava prek tega obrazca ni dovoljena.' if page.metadata['content_gate'].present? && values[:status]=='published'
    page.update!(values)
    AuditLog.create!(action:'page_edit',actor:@admin.email,details:{id:page.id,status:page.status})
    redirect_to "/upravljanje/?page_id=#{page.id}",notice:'Stran je shranjena. Spremembe so zabeležene.'
  rescue ArgumentError,ActiveRecord::RecordInvalid=>e
    redirect_to '/upravljanje/',alert:e.message
  end
  def password
    raise ArgumentError,'Trenutno geslo ni pravilno.' unless @admin.authenticate(params[:current_password])
    @admin.update!(password:params[:password],password_confirmation:params[:password_confirmation])
    reset_session;redirect_to '/upravljanje/prijava/',notice:'Geslo je spremenjeno. Prijavite se znova.'
  rescue ArgumentError,ActiveRecord::RecordInvalid
    redirect_to '/upravljanje/',alert:'Preverite trenutno geslo. Novo geslo mora imeti najmanj 14 znakov; potrditvi se morata ujemati.'
  end
  def require_admin
    @admin=Admin.find_by(id:session[:admin_id])
    redirect_to '/upravljanje/prijava/' unless @admin&&session[:admin_at].to_i>8.hours.ago.to_i
  end
end
