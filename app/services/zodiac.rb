class Zodiac
  SIGNS = {"oven"=>"Oven", "bik"=>"Bik", "dvojcka"=>"Dvojčka", "rak"=>"Rak", "lev"=>"Lev", "devica"=>"Devica", "tehtnica"=>"Tehtnica", "skorpijon"=>"Škorpijon", "strelec"=>"Strelec", "kozorog"=>"Kozorog", "vodnar"=>"Vodnar", "ribi"=>"Ribi"}.freeze
  STARTS = [[120,"vodnar"],[219,"ribi"],[321,"oven"],[420,"bik"],[521,"dvojcka"],[621,"rak"],[723,"lev"],[823,"devica"],[923,"tehtnica"],[1023,"skorpijon"],[1122,"strelec"],[1222,"kozorog"]].freeze
  def self.for_date(date) = (STARTS.reverse.find { |v,_| date.month*100+date.day>=v } || [0,"kozorog"]).last
end
