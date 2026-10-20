class ExpiryJob < ApplicationJob
  def perform
    PrivatePhoto.expire!
    DailyLogDevice.prune(Rails.root.join('log'))
    PrintRequest.where(private_file:true).where('expires_at < ?',Time.current).find_each do |r|
      FileUtils.rm_rf(Rails.root.join('storage/exports',r.fingerprint))
      r.update!(status:'expired',options:{},files:{},owner_token:nil)
    end
    ContactMessage.where('created_at < ?',90.days.ago).delete_all
  end
end
