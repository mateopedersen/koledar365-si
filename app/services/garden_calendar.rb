class GardenCalendar
  PATH='/setveni-koledar/'
  TITLE='Setveni koledar: setev, sajenje in načrt vrta'
  DESCRIPTION='Kdaj sejati, presajati in pobirati zelenjavo? Pregled za 16 vrtnin, filtri po mesecih in opravilih ter vaš načrt vrta za tisk in koledar ICS.'
  MONTHS=%w[januar februar marec april maj junij julij avgust september oktober november december].freeze
  def self.data = @data ||= JSON.parse(Rails.root.join('public/garden/data.json').read)
  def self.plants = data.fetch('plants')
  def self.sources = data.fetch('sources')
  def self.image = data.fetch('image')
  def self.photo_catalog = @photo_catalog ||= JSON.parse(Rails.root.join('public/garden/photos.json').read)
  def self.photos = photo_catalog.fetch('photos')
  def self.photo(id) = photos.find { |photo|photo.fetch('id')==id }
  def self.faq
    [
      ['Ali je to setveni koledar po Mariji Thun?', 'Ne. Pregled prikazuje praktične sezonske okvire za vrtnine. Biodinamični koledar po Mariji Thun temelji na drugem pristopu; povezavo do izvirnega koledarja najdete med viri. Njegovih avtorskih dnevnih razporedov ne prepisujemo.'],
      ['Ali termini veljajo tudi na Primorskem?', 'Osnovna preglednica je namenjena predvsem kontinentalni Sloveniji. Na Primorskem, v višjih legah in v rastlinjaku so razmere drugačne. Izbor območja prikaže ustrezno pojasnilo, svojih datumov pa ne premakne samodejno.'],
      ['Zakaj ne priporočate enega natančnega dneva za setev?', 'Mesec je okvir. Odločitev je odvisna tudi od sorte, vremenske napovedi, ogretosti tal, svetlobe in razvoja sadik. V osebnem načrtu izberete datum, ki ustreza vašemu vrtu.'],
      ['Kako shranim svoj setveni načrt?', 'Dodajte vrtnino, opravilo, datum in po želji opombo. Načrt se shrani v tem brskalniku. Prenesete ga lahko kot datoteko JSON za ponovno odpiranje, kot ICS za koledar ali ga natisnete oziroma shranite v PDF.']
    ]
  end
end
