class LocalTools
  CHECKED_ON = '2026-11-22'.freeze
  ZPIZ = 'https://www.zpiz.si/content2019/starostna-pokojnina'.freeze
  LAW = 'https://pisrs.si/pregledNpb?idPredpisa=ZAKO6280&idPredpisaChng=ZAKO9245'.freeze
  ZPIZ_CALCULATOR = 'https://www.zpiz.si/cms/content2019vsebina/sploni-informativni-pokojninski-kalkulator'.freeze
  FLAGS_SOURCE = 'https://www.gov.si/teme/drzavni-prazniki-in-dela-prosti-dnevi/'.freeze
  SAINTS_SOURCE = 'https://katoliska-cerkev.si/media/datoteke/2026/KOLEDAR%202026.pdf'.freeze
  ADMISSION_SOURCES = {
    'srednja' => 'https://www.gov.si/assets/ministrstva/MIZM/Dokumenti/Srednja-sola/Rokovniki/Rokovniki-2027-2028/Rokovnik-za-prijavo-kandidatov-in-izvedbo-vpisa-v-1-letnik-programov-NPI-in-SPI-SSI-ter-GIM-za-solsko-leto-2027-2028.pdf',
    'visja' => 'https://www.gov.si/teme/vpis-v-visje-strokovne-sole/',
    'fakulteta' => 'https://www.gov.si/teme/vpis-v-visoko-solstvo/'
  }.freeze
  PAGES = {
    '/dnevi-za-zastavo/' => ['dnevi', 'Dnevi za slovensko zastavo 2027–2030', 'Kdaj izobesimo zastavo Republike Slovenije? Preverite šest obveznih datumov za javne organe, ostale državne praznike in pravila izobešanja.', 'flag', 'Prazniki in simboli'],
    '/koledar-svetnikov/' => ['godovi', 'Izbrani godovi in osebni koledar godov', 'Poiščite izbrane godove iz koledarja Slovenske škofovske konference in dodajte datum, ki ga praznujete v svoji družini.', 'gift', 'Slovensko izročilo'],
    '/studijski-nacrtovalnik/' => ['studij', 'Študijski načrtovalnik in načrt učenja za izpit', 'Izberite rok, zahtevane ure in dneve učenja. Preverite, koliko časa potrebujete na dan, ter vodite seznam izpitov in oddaj.', 'school', 'Šola in študij'],
    '/vpisni-koledar/' => ['vpis', 'Vpisni koledar 2027/2028: srednje šole in študij', 'Preverite uradne informativne dneve, prijavne roke in rezultate za vpis v srednje in višje strokovne šole. Spremljajte tudi objave eVŠ.', 'school', 'Izobraževanje'],
    '/davcni-koledar/' => ['davki', 'Davčni koledar 2027–2030: izbrani roki FURS', 'Preverite izbrane roke za dohodnino, najemnine, kapital in obračun dejavnosti. Uporabite koledar za lastne roke in opomnike.', 'note', 'Davčni roki'],
    '/sezonski-opomniki/' => ['sezone', 'Sezonski opomniki za dom in vrt', 'Izberite pomladanska, poletna, jesenska ali zimska opravila, določite datum in prenesite osebne opomnike v koledar.', 'sprout', 'Načrtovanje po letnih časih'],
    '/lunin-vzhod-in-zahod/' => ['luna', 'Lunin vzhod in zahod v Sloveniji', 'Izberite datum in slovensko mesto ter preverite, kdaj Luna vzide in zaide, kolikšen delež je osvetljen in kako se časi spreminjajo ta teden.', 'moon', 'Opazovanje neba'],
    '/kalkulator-upokojitve/' => ['pokojnina', 'Kalkulator upokojitve: datum in okvirna pokojnina', 'Izračunajte okvirni datum izpolnitve pogojev za starostno pokojnino v Sloveniji in odmerni odstotek po pokojninski reformi ZPIZ-2O.', 'briefcase', 'Starostna pokojnina']
  }.freeze

  def self.pages
    PAGES.transform_values do |_, title, description, *|
      { title: title, description: description, family: 'local_tools' }
    end
  end

  def self.for(path)
    kind, title, description, icon, group = PAGES.fetch(path)
    { kind: kind, title: title, description: description, icon: icon, group: group }
  end

  FLAGS_REQUIRED = %w[presernov-dan dan-upora-proti-okupatorju praznik-dela dan-drzavnosti dan-samostojnosti-in-enotnosti].freeze
  FLAGS_OPTIONAL = %w[dan-primoza-trubarja dan-triglava zdruzitev-prekmurskih-slovencev vrnitev-primorske dan-slovenskega-sporta dan-suverenosti dan-znanosti dan-rudolfa-maistra].freeze

  def self.flags
    CalendarEvent.where(slug: FLAGS_REQUIRED + FLAGS_OPTIONAL, on: Date.new(2027, 1, 1)..Date.new(2030, 12, 31)).ordered.map do |event|
      { date: event.on.iso8601, title: event.title.sub(/\A./, &:upcase), type: FLAGS_REQUIRED.include?(event.slug) ? 'required' : 'optional', url: "/prazniki/#{event.slug}/" }
    end
  end

  def self.saints
    [
      ['01-31','Janez','Janez Bosko'], ['02-14','Valentin','Sv. Valentin'], ['02-24','Matija','Sv. Matija'],
      ['03-19','Jožef','Sv. Jožef'], ['04-16','Bernardka','Sv. Bernardka Lurška'],
      ['05-04','Florijan','Sv. Florijan'], ['05-17','Jošt','Sv. Jošt'], ['06-09','Primož, Felicijan','Sv. Primož in Felicijan'],
      ['06-13','Anton','Sv. Anton Padovanski'], ['06-15','Vid','Sv. Vid'], ['06-27','Ema','Sv. Ema Krška'],
      ['06-29','Peter, Pavel','Sv. Peter in Pavel'], ['07-04','Urh, Ulrik','Sv. Urh'], ['07-05','Ciril, Metod','Sv. Ciril in Metod'],
      ['07-24','Krištof','Sv. Krištof'], ['08-16','Rok','Sv. Rok'], ['12-06','Nikolaj, Miklavž','Sv. Nikolaj — Miklavž'],
      ['12-26','Štefan','Sv. Štefan']
    ].map { |date, names, title| { date: date, names: names, title: title } }
  end
end
