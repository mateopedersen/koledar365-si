class CitiesController < ApplicationController
  rate_limit to:90,within:1.minute,only: :weather
  def weather
    city=CityCatalog.find(params[:id]);data=WeatherService.call(city)
    response.headers['Cache-Control']='public, max-age=60, stale-if-error=300'
    render json:data
  rescue WeatherService::Unavailable
    render json:{error:'Vremenski podatki trenutno niso na voljo. Poskusite znova pozneje.',server_now:Time.current.iso8601},status: :service_unavailable
  end
  def licenses
    @title='Fotografije in licence';@description='Avtorji, izvirniki in licence fotografij vrtnin, praznikov, slovenskih običajev in 69 mest ter podatkov o vremenu.';@canonical='/fotografije-in-licence/'
    @cities=CityCatalog.all
    @holiday_photos=HolidayPhotoCatalog.all.select { |photo|photo['reviewed']==true }
  end
end
