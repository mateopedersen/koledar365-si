class SunEngine
  CITIES={'ljubljana'=>['Ljubljana',46.0511,14.5051],'maribor'=>['Maribor',46.5547,15.6467],'celje'=>['Celje',46.2397,15.2677],'kranj'=>['Kranj',46.2389,14.3556],'koper'=>['Koper',45.5481,13.7302],'novo-mesto'=>['Novo mesto',45.8030,15.1689],'nova-gorica'=>['Nova Gorica',45.9560,13.6484],'murska-sobota'=>['Murska Sobota',46.6625,16.1664]}.freeze
  def self.calculate(date,city)
    name,lat,lon=CITIES.fetch(city)
    g=2*Math::PI/(Date.gregorian_leap?(date.year) ? 366:365)*(date.yday-1)
    eq=229.18*(0.000075+0.001868*Math.cos(g)-0.032077*Math.sin(g)-0.014615*Math.cos(2*g)-0.040849*Math.sin(2*g))
    dec=0.006918-0.399912*Math.cos(g)+0.070257*Math.sin(g)-0.006758*Math.cos(2*g)+0.000907*Math.sin(2*g)-0.002697*Math.cos(3*g)+0.00148*Math.sin(3*g)
    rad=lat*Math::PI/180;ha=Math.acos(Math.cos(90.833*Math::PI/180)/(Math.cos(rad)*Math.cos(dec))-Math.tan(rad)*Math.tan(dec))*180/Math::PI
    noon=720-4*lon-eq;day=Time.utc(date.year,date.month,date.day)
    {name:name,latitude:lat,longitude:lon,rise:(day+(noon-4*ha)*60).in_time_zone('Europe/Ljubljana'),set:(day+(noon+4*ha)*60).in_time_zone('Europe/Ljubljana'),minutes:(8*ha).round}
  end
end
