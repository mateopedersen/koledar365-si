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

  def self.admission
    [
      ['srednja','2027-01-18',nil,'Objava razpisa za srednje šole','Najpoznejši datum, ki ga za objavo razpisa navaja ministrstvo.','https://www.gov.si/teme/vpis-v-srednjo-solo/'],
      ['srednja','2027-02-12','2027-02-13','Informativna dneva','Srednje šole in dijaški domovi. Program in uro objavi šola.'],
      ['srednja','2027-03-04',nil,'Prijava na preizkus nadarjenosti','Za programe s posebnim vpisnim pogojem.'],
      ['srednja','2027-04-05',nil,'Rok za prijavo v 1. letnik','Za programe NPI, SPI, SSI in gimnazije po objavljenem rokovniku.'],
      ['srednja','2027-05-13',nil,'Prenos prijave','Rok do 14.00 za prenos prijave na drug program ali šolo.'],
      ['srednja','2027-06-16','2027-06-21','Vpis ali prvi krog izbirnega postopka','Razpored objavi šola. Obdobje se po rokovniku zaključi do 13.00 zadnjega dne.'],
      ['srednja','2027-06-24',nil,'Prijava v drugi krog','Rok do 15.00 za kandidate, ki niso uspeli v prvem krogu.'],
      ['srednja','2027-06-30',nil,'Rezultati drugega kroga','Objava do 15.00. Vpis sprejetih kandidatov do 2. julija do 14.00.'],
      ['visja','2027-02-01',nil,'Objava razpisa za višje strokovne šole','Najpoznejši datum za objavo razpisa po rokovniku.'],
      ['visja','2027-02-12','2027-02-13','Informativna dneva','Za višje strokovne šole po uradnem rokovniku.'],
      ['visja','2027-02-18','2027-03-18','Prvi prijavni rok','Elektronska prijava v eVŠ.'],
      ['visja','2027-07-22',nil,'Rezultati prvega roka','Sklep o rezultatu izbirnega postopka v eVŠ.'],
      ['visja','2027-08-20','2027-08-27','Drugi prijavni rok','Elektronska prijava za prosta mesta v eVŠ.'],
      ['visja','2027-09-21',nil,'Rezultati drugega roka','Sklep o rezultatu izbirnega postopka v eVŠ.']
    ].map do |category, date, ended, title, detail, source|
      { category: category, date: date, end: ended, title: title, detail: detail, source: source || LocalTools::ADMISSION_SOURCES.fetch(category) }
    end.sort_by { |row| [row.fetch(:date),row.fetch(:category)] }
  end
end
