class LocalTools
  CHECKED_ON = '2026-11-22'.freeze
  ZPIZ = 'https://www.zpiz.si/content2019/starostna-pokojnina'.freeze
  LAW = 'https://pisrs.si/pregledNpb?idPredpisa=ZAKO6280&idPredpisaChng=ZAKO9245'.freeze
  ZPIZ_CALCULATOR = 'https://www.zpiz.si/cms/content2019/splosni-informativni-izracun-visine-pokojnine'.freeze
  FLAGS_PATH = '/dnevi-za-zastavo/'.freeze
  FLAG_DAY_SLUG = 'dan-slovenske-zastave'.freeze
  FLAGS_SOURCE = 'https://www.gov.si/teme/drzavni-prazniki-in-dela-prosti-dnevi/'.freeze
  STATE_SYMBOLS = 'https://www.gov.si/teme/drzavni-simboli/'.freeze
  FLAG_PROTOCOL = 'https://www.gov.si/assets/vladne-sluzbe/UKOM/Promocija-Slovenije/Promocijske-publikacije/Simboli-Republike-Slovenije.pdf'.freeze
  SAINTS_SOURCE = 'https://katoliska-cerkev.si/media/datoteke/2026/KOLEDAR%202026.pdf'.freeze
  ADMISSION_SOURCES = {
    'srednja' => 'https://www.gov.si/assets/ministrstva/MIZM/Dokumenti/Srednja-sola/Rokovniki/Rokovniki-2027-2028/Rokovnik-za-prijavo-kandidatov-in-izvedbo-vpisa-v-1-letnik-programov-NPI-in-SPI-SSI-ter-GIM-za-solsko-leto-2027-2028.pdf',
    'visja' => 'https://www.gov.si/teme/vpis-v-visje-strokovne-sole/',
    'fakulteta' => 'https://www.gov.si/teme/vpis-v-visoko-solstvo/'
  }.freeze
  PAGES = {
    FLAGS_PATH => ['dnevi', 'Dnevi za izobešanje slovenske zastave 2027–2030', 'Kdaj se izobesi zastava Republike Slovenije? Preverite šest obveznih datumov za državne in občinske organe, osem drugih praznikov ter pomen dneva slovenske zastave.', 'flag', 'Prazniki in simboli'],
    '/koledar-svetnikov/' => ['godovi', 'Koledar svetnikov in godovi po imenih', 'Poiščite izbrane slovenske godove po imenu ali mesecu, preverite svetnika in datum ter shranite osebni zapis za voščilo ali ga prenesite kot ICS.', 'gift', 'Slovensko izročilo'],
    '/studijski-nacrtovalnik/' => ['studij', 'Študijski načrtovalnik: načrt učenja za izpit', 'Razporedite ure do izpita, kolokvija ali oddaje. Izberite dneve, preverite dnevno obremenitev in prenesite urnik učenja v koledar ICS.', 'school', 'Šola in študij'],
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

  def self.flag_rule(slug)
    return 'required' if FLAGS_REQUIRED.include?(slug)
    return 'optional' if FLAGS_OPTIONAL.include?(slug)
    'commemorative' if slug == FLAG_DAY_SLUG
  end

  def self.flags
    years = CalendarEngine::YEARS
    dates = Date.new(years.first, 1, 1)..Date.new(years.last, 12, 31)

    CalendarEvent.where(slug: FLAGS_REQUIRED + FLAGS_OPTIONAL, category: 'legal', on: dates).ordered.map do |event|
      {
        date: event.on,
        title: event.title.sub(/\A./, &:upcase),
        type: flag_rule(event.slug),
        url: "/prazniki/#{event.slug}/#datum-#{event.on}"
      }
    end
  end

  def self.saints
    [
      ['01-11', 'Pavlin', 'Sv. Pavlin Oglejski'],
      ['01-24', 'Frančišek', 'Sv. Frančišek Saleški'],
      ['01-27', 'Angela', 'Sv. Angela Merici'],
      ['01-31', 'Janez', 'Sv. Janez Bosko'],
      ['02-14', 'Valentin', 'Sv. Valentin'],
      ['02-24', 'Matija', 'Sv. Matija'],
      ['03-19', 'Jožef', 'Sv. Jožef, mož Device Marije'],
      ['04-16', 'Bernardka', 'Sv. Bernardka Lurška'],
      ['05-01', 'Jožef', 'Sv. Jožef Delavec'],
      ['05-04', 'Florijan', 'Sv. Florijan'],
      ['05-12', 'Leopold', 'Sv. Leopold Mandić'],
      ['05-16', 'Janez', 'Sv. Janez Nepomuk'],
      ['05-17', 'Jošt', 'Sv. Jošt'],
      ['06-09', 'Primož, Felicijan', 'Sv. Primož in Felicijan'],
      ['06-13', 'Anton', 'Sv. Anton Padovanski'],
      ['06-15', 'Vid', 'Sv. Vid'],
      ['06-27', 'Ema', 'Sv. Ema Krška'],
      ['06-29', 'Peter, Pavel', 'Sv. Peter in Pavel'],
      ['07-04', 'Urh, Ulrik', 'Sv. Ulrik (Urh)'],
      ['07-05', 'Ciril, Metod', 'Sv. Ciril in Metod'],
      ['07-12', 'Mohor, Fortunat', 'Sv. Mohor in Fortunat'],
      ['07-22', 'Marija Magdalena', 'Sv. Marija Magdalena'],
      ['07-24', 'Krištof', 'Sv. Krištof'],
      ['08-16', 'Rok', 'Sv. Rok'],
      ['09-01', 'Egidij, Tilen', 'Sv. Egidij (Tilen)'],
      ['09-24', 'Rupert', 'Sv. Rupert iz Salzburga'],
      ['10-04', 'Frančišek', 'Sv. Frančišek Asiški'],
      ['10-06', 'Bruno', 'Sv. Bruno'],
      ['10-12', 'Maksimilijan', 'Sv. Maksimilijan Celjski'],
      ['11-03', 'Viktorin', 'Sv. Viktorin Ptujski'],
      ['11-03', 'Just', 'Sv. Just Tržaški'],
      ['11-06', 'Lenart', 'Sv. Lenart'],
      ['12-06', 'Nikolaj, Miklavž', 'Sv. Nikolaj (Miklavž)'],
      ['12-26', 'Štefan', 'Sv. Štefan'],
      ['12-31', 'Silvester', 'Sv. Silvester']
    ].map { |date, names, title| { date: date, names: names, title: title } }
  end
end
