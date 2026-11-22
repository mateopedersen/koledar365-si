class LocalToolDeadlines
  CAPITAL = 'https://www.fu.gov.si/davki_in_druge_dajatve/podrocja/dohodnina/dohodnina_dohodek_iz_kapitala'.freeze
  RENT = 'https://www.fu.gov.si/davki_in_druge_dajatve/podrocja/dohodnina/dohodnina_dohodek_iz_oddajanja_premozenja_v_najem_in_iz_prenosa_premozenjske_pravice'.freeze
  BUSINESS = 'https://www.fu.gov.si/fileadmin/Internet/Davki_in_druge_dajatve/Podrocja/Dohodnina/Dohodek_iz_dejavnosti/Opis/Davki_za_zacetnike_-_fizicne_osebe_ki_opravljajo_dejavnost.pdf'.freeze
  TAX_LAW = 'https://pisrs.si/pregledPredpisa?id=ZAKO4703'.freeze
  E_DAVKI = 'https://edavki.durs.si/'.freeze

  def self.tax
    rules = [
      [2, 5, 'dohodnina', 'Vzdrževani družinski člani', 'Redni rok za vlogo za posebno olajšavo pri letni odmeri dohodnine. Morebitni ločeni rok za eDavke preverite pri FURS.', 'https://edavki.durs.si/OpenPortal/Dokumenti/doh_dejstr.i.sl.pdf'],
      [2, 28, 'najem', 'Napoved dohodka iz najema', 'Za fizične osebe, ki premoženje oddajajo drugi fizični osebi ali tuji pravni osebi, kadar napoved oddajo same.', RENT],
      [2, 28, 'kapital', 'Napoved dohodkov iz kapitala', 'Izbrane napovedi za preteklo leto: obresti, dividende in odsvojitve vrednostnih papirjev. Obveznost je odvisna od vrste dohodka in vašega statusa.', CAPITAL],
      [3, 31, 'dejavnost', 'Letni davčni obračun dejavnosti', 'Za fizične osebe, ki opravljajo dejavnost, za preteklo koledarsko leto. Preverite izjeme za prenehanje dejavnosti.', BUSINESS]
    ]
    CalendarEngine::YEARS.flat_map do |year|
      free_days=CalendarEngine.statutory_work_free_events(year).map { |event| event.fetch(:on) }.to_set
      rules.map do |month, day, category, title, detail, source|
        nominal = Date.new(year, month, day)
        adjusted = nominal
        adjusted += 1 while adjusted.saturday? || adjusted.sunday? || free_days.include?(adjusted)
        { date: adjusted.iso8601, nominal: nominal.iso8601, category: category, title: title, detail: detail, source: source }
      end
    end
  end

  ADMISSION_STAGES = {
    'razpis' => 'Razpis',
    'informativni' => 'Informativni dnevi',
    'prijava' => 'Prijava',
    'preizkus' => 'Preizkus',
    'rezultati' => 'Rezultati in prosta mesta',
    'vpis' => 'Vpis'
  }.freeze

  SECONDARY_PUBLICATION = 'https://www.gov.si/assets/ministrstva/MIZM/Dokumenti/Srednja-sola/Rokovniki/Rokovniki-2027-2028/Rokovnik-za-pripravo-in-objavo-razpisa-za-vpis-v-srednje-sole-in-dijaske-domove-za-solsko-leto-2027-2028.pdf'.freeze

  def self.admission
    [
      ['srednja', 'razpis', '2027-01-18', nil, 'Objava razpisa za srednje šole', 'Ministrstvo do tega datuma objavi razpis za srednje šole in dijaške domove.', SECONDARY_PUBLICATION],
      ['srednja', 'informativni', '2027-02-12', '2027-02-13', 'Informativna dneva', 'Program obiska in uro preverite pri izbrani šoli ali dijaškem domu.'],
      ['srednja', 'prijava', '2027-03-04', nil, 'Prijava na preizkus nadarjenosti', 'Rok za prijavo pri programih s posebnimi pogoji oziroma za oddajo dokazil o športnih dosežkih.'],
      ['srednja', 'preizkus', '2027-03-08', '2027-03-20', 'Preizkusi in posebni vpisni pogoji', 'Srednja šola, ki izvaja program, v tem obdobju določi svoj termin preizkusa.'],
      ['srednja', 'prijava', '2027-04-05', nil, 'Rok za prijavo v 1. letnik', 'Za prijavo v gimnazijo ter nižje in srednje poklicne ali srednje strokovne programe.'],
      ['srednja', 'prijava', '2027-05-13', nil, 'Prenos prijave', 'Prijavo lahko prenesete na drug program ali šolo do 14.00.'],
      ['srednja', 'vpis', '2027-06-16', '2027-06-21', 'Vpis ali prvi krog izbirnega postopka', 'Upoštevajte razpored šole. Rokovnik za to obdobje določa zaključek 21. junija do 13.00.'],
      ['srednja', 'rezultati', '2027-06-21', nil, 'Rezultati prvega kroga', 'Šole do 14.00 sporočijo rezultate in kandidate seznanijo z možnostmi za drugi krog.'],
      ['srednja', 'prijava', '2027-06-24', nil, 'Prijava v drugi krog', 'Kandidati, ki v prvem krogu niso bili izbrani, se lahko prijavijo do 15.00.'],
      ['srednja', 'rezultati', '2027-06-30', nil, 'Rezultati drugega kroga', 'Rezultati bodo objavljeni do 15.00. Nadaljnja navodila o vpisu da šola.'],
      ['srednja', 'vpis', '2027-07-02', nil, 'Vpis po drugem krogu', 'Sprejeti kandidati opravijo vpis po navodilih šole najpozneje do 14.00.'],
      ['srednja', 'rezultati', '2027-07-06', nil, 'Objava preostalih prostih mest', 'Ministrstvo do 12.00 objavi še prosta mesta po programih.'],
      ['visja', 'razpis', '2027-02-01', nil, 'Objava razpisa za višje strokovne šole', 'Ministrstvo do tega datuma objavi razpis za višješolske študijske programe.'],
      ['visja', 'informativni', '2027-02-12', '2027-02-13', 'Informativna dneva', 'Termin predstavitve in način udeležbe objavi izbrana višja strokovna šola.'],
      ['visja', 'prijava', '2027-02-18', '2027-03-18', 'Prvi prijavni rok', 'Prijavo oddate prek eVŠ. Po 18. marcu vrstnega reda želja ni več mogoče spremeniti.'],
      ['visja', 'rezultati', '2027-07-22', nil, 'Rezultati prvega roka', 'Sklep o izbiri je kandidatom do tega datuma na voljo v eVŠ.'],
      ['visja', 'vpis', '2027-08-18', nil, 'Vpis sprejetih v prvem roku', 'Sprejete kandidate k vpisu povabi šola. Vpis poteka do 18. avgusta.'],
      ['visja', 'rezultati', '2027-08-20', nil, 'Objava prostih mest za drugi rok', 'Seznam mest objavi Višješolska prijavna služba.'],
      ['visja', 'prijava', '2027-08-20', '2027-08-27', 'Drugi prijavni rok', 'V eVŠ se lahko prijavite na razpoložljiva mesta.'],
      ['visja', 'rezultati', '2027-09-21', nil, 'Rezultati drugega roka', 'Izid drugega roka je kandidatom do tega datuma na voljo v eVŠ.'],
      ['visja', 'vpis', '2027-10-01', nil, 'Vpis sprejetih v drugem roku', 'Šola povabi sprejete kandidate. Rokovnik določa vpis do 1. oktobra.']
    ].map do |category, stage, date, ended, title, detail, source|
      { category: category, stage: stage, date: date, end: ended, title: title, detail: detail,
        source: source || LocalTools::ADMISSION_SOURCES.fetch(category) }
    end.sort_by { |row| row.fetch(:date) }
  end
end
