class PhotosController < ApplicationController
  rate_limit to:6,within:1.minute
  def create
    owner=session[:export_owner]||=SecureRandom.hex(24)
    render json:PrivatePhoto.save!(params[:photo],owner),status: :created
  rescue ArgumentError=>e
    render json:{error:e.message},status: :unprocessable_entity
  end
end
