class PaymentCalendar
  OVERVIEW_YEAR = 2027
  REVIEWED_ON = '2026-11-22'.freeze
  ZPIZ_RULE = 'https://pisrs.si/pregledPredpisa?sop=2012-01-3693'.freeze
  PENSION_APPLICATION = 'https://ezpiz.zpiz.si/cms/content2019/starostna-pokojnina'.freeze
  WINTER_SUPPLEMENT = 'https://www.zpiz.si/cms/content2019/zimski-dodat'.freeze
  SOCIAL_PLANS = 'https://www.gov.si/podrocja/socialna-varnost/pravice-iz-javnih-sredstev-socialnovarstveni-programi-in-ukrepi-na-podrocju-socialnega-varstva/'.freeze
  CARE_ALLOWANCE = 'https://e-uprava.gov.si/si/podrocja/sociala-zdravje-smrt/socialne-pomoci/varstveni-dodatek?lang=si&view_mode=5'.freeze
  STUDY_ALLOWANCE = 'https://e-uprava.gov.si/podrocja/izobrazevanje-kultura/stipendije/drzavna-stipendija.html?lang=si&view_mode=4'.freeze
  ZOIS_FORMS = 'https://www.srips-rs.si/sl/stipendije/zois'.freeze
  PAGES={
    '/izplacila-pokojnin/'=>{kind:'pension',title:'Izplačila pokojnin 2027 – mesečni pregled in vloga ZPIZ',heading:'Izplačila pokojnin 2027',description:'Preverite okvir po mesecih za pokojnine 2027, naslednje potrjeno nakazilo, letni in zimski dodatek ter postopek za prvo starostno pokojnino pri ZPIZ.'},
    '/izplacila-socialnih-transferjev/'=>{kind:'social',title:'Izplačila socialnih transferjev 2027 – koledar CSD in vloge',heading:'Izplačila socialnih transferjev 2027',description:'Mesečni pregled objavljenih datumov CSD za 2027 in arhiv 2026. Otroški in varstveni dodatek, socialna pomoč, štipendije in vloge.'}
  }.freeze
  def self.data = @data ||= JSON.parse(Rails.root.join('public/payments/data.json').read)
  def self.paths = PAGES.keys
  def self.page(path) = PAGES[path]
  attr_reader :kind
  def initialize(path:,today:Time.zone.today)
    @kind=PAGES.fetch(path).fetch(:kind);@today=today
  end
  def pension? = kind=='pension'
  def source_id = pension? ? 'zpiz':'csd'
  def source = self.class.data.fetch('sources').fetch(source_id)
  def events = self.class.data.fetch('events').select{|event|event.fetch('source_id')==source_id}
  def categories = self.class.data.fetch('categories').select{|_,category|category.fetch('source_id')==source_id}
  def next_event = events.find{|event|event.fetch('date')>=@today.iso8601}
  def label(event) = categories.fetch(event.fetch('category')).fetch('label')
  def calendar_path(category=nil) = "/payments/#{category || (pension? ? 'pokojnine':'socialni-transferji')}-2026.ics"
  def payload = self.class.data.merge('events'=>events,'categories'=>categories,'kind'=>kind,'overview_year'=>OVERVIEW_YEAR)

  def year_overview
    year = OVERVIEW_YEAR
    by_month = events.select { |event| event.fetch('date').start_with?("#{year}-") }.group_by { |event| event.fetch('date')[0, 7] }
    holidays = pension? ? CalendarEngine.statutory_work_free_events(year).map { |event| event.fetch(:on) }.to_set : []
    (1..12).map do |month|
      start = Date.new(year, month, 1)
      confirmed = by_month.fetch(start.strftime('%Y-%m'), [])
      latest = start.end_of_month
      latest -= 1 while pension? && (latest.saturday? || latest.sunday? || holidays.include?(latest))
      { month: start, confirmed: confirmed, latest: pension? && confirmed.empty? ? latest : nil }
    end
  end

  def current_sources
    pension? ? [
      ['ZPIZ – Izplačilni dnevi', source.fetch('url')],
      ['PISRS – ZPIZ-2, členi 98, 98.a in 111', ZPIZ_RULE],
      ['ZPIZ – Zimski dodatek in naknadno izplačilo', WINTER_SUPPLEMENT],
      ['ZPIZ – Starostna pokojnina in oddaja zahteve', PENSION_APPLICATION]
    ] : [
      ['GOV.SI – Aktualni terminski plan socialnih transferjev', SOCIAL_PLANS],
      ['eUprava – Vloga za varstveni dodatek', CARE_ALLOWANCE],
      ['eUprava – Državna štipendija', STUDY_ALLOWANCE],
      ['Javni štipendijski sklad – Zoisove štipendije', ZOIS_FORMS]
    ]
  end

  def application_steps
    if pension?
      [
        ['Preverite pogoje in zavarovalno dobo', 'Za starostno pokojnino v 2027 praviloma potrebujete 65 let in najmanj 15 let zavarovalne dobe ali 60 let in 40 let pokojninske dobe brez dokupa. Pri ZPIZ preverite dobo v tujini, morebitna znižanja starosti in osebne posebnosti.', [['Izračun pogojev upokojitve', '/kalkulator-upokojitve/']]],
        ['Vložite zahtevo pri ZPIZ', 'ZPIZ priporoča oddajo približno dva meseca pred zaključkom dela. Zahtevo lahko vložite z eVloge ZA VSE, prek Moj eZPIZ, po pošti ali osebno. Preglejte tudi zahtevana dokazila za svoj primer.', [['Uradna zahteva in dokazila', PENSION_APPLICATION]]],
        ['Preverite odločbo in prvo nakazilo', 'Začetek pravice in način izplačevanja preverite v odločbi. Če čakate na prvo nakazilo, pri ZPIZ preverite stanje zadeve in podatke za izplačilo. Termini na tej strani veljajo za redne mesečne pokojnine.', [['ZPIZ – informacije o nakazilih', source.fetch('url')]]]
      ]
    else
      [
        ['Otroški dodatek in družinski prejemki', 'Za prvo vlogo za otroški dodatek se obrnite na CSD. Pri novorojenčku jo oddajte v 30 dneh, če želite priznanje od meseca rojstva. Pomoč ob rojstvu in pravice ob starševskem dopustu imajo ločene pogoje in roke.', [['Otroški dodatek in obrazec', '/otroski-dodatek/'], ['Pomoč ob rojstvu', '/pomoc-ob-rojstvu-otroka/'], ['Starševski dopust in nadomestilo', '/starsevski-dopust/']]],
        ['Denarna socialna pomoč in varstveni dodatek', 'Pristojni CSD preveri pogoje za vsako pravico. V odločbi preverite priznano obdobje in višino. Varstveni dodatek CSD po prvi vlogi ob izpolnjenih pogojih podaljšuje po uradni dolžnosti.', [['Denarna in izredna socialna pomoč', '/denarna-socialna-pomoc/'], ['Uradna vloga za varstveni dodatek', CARE_ALLOWANCE]]],
        ['Državna in Zoisova štipendija', 'Za državno štipendijo izberite ustrezno vlogo za pravice iz javnih sredstev pri CSD. Za Zoisovo štipendijo uporabite razpis in obrazec štipendijskega sklada za svoje šolsko ali študijsko leto.', [['Vloga za državno štipendijo', STUDY_ALLOWANCE], ['Razpisi in vloge za Zoisovo štipendijo', ZOIS_FORMS]]]
      ]
    end
  end

  def faq
    if pension?
      [
        ['Kdaj bo naslednje izplačilo pokojnine?', 'Naslednji objavljeni datum je izpostavljen na vrhu strani. Upoštevamo lokalni datum v Sloveniji in izključno objavljeni koledar ZPIZ. Ko zmanjka potrjenih prihodnjih datumov, vas usmerimo na uradni vir.'],
        ['Ali je izplačilo vedno zadnji delovni dan v mesecu?', 'ZPIZ navaja, da je izplačilo najpozneje zadnji delovni dan tekočega meseca. Uporabljamo objavljene datume: decembrsko izplačilo za leto 2026 je na primer določeno za torek, 29. decembra.'],
        ['Kdaj sta letni in zimski dodatek?', 'Zakon ju veže na junijsko in novembrsko pokojnino. Podrobnosti za leto 2027 so prikazane pod mesečnim pregledom. O osebni upravičenosti odloča ZPIZ.'],
        ['Kaj pomeni »najpozneje« v pregledu 2027?', 'Prikazan je zadnji delovni dan po slovenskem koledarju. ZPIZ lahko napove zgodnejši termin. Objavljeni datumi so vedno posebej označeni.'],
        ['Kaj se zgodi z opomniki, če se koledar spremeni?', 'Prenesena datoteka ICS je kopija objavljenega razporeda, ne naročnina. Po spremembi uradnega vira prenesite posodobljen koledar; pred uvozom preverite, kako vaš program obravnava obstoječe dogodke.']
      ]
    else
      [
        ['Kaj pomeni I. oziroma II. obdelava socialne pomoči?', 'Uradni plan navaja ločeni obdelavi in njuna datuma izplačila. Izberite ustrezno postavko iz svoje odločbe oziroma preverite pri pristojnem CSD; prikaz obeh terminov ne pomeni dveh izplačil za vsakega prejemnika.'],
        ['Ali prikazujete rok za oddajo vloge?', 'Ne. Prikazujemo stolpec »izplačilo«. Rok za zaključek vnosa na CSD je interna postavka v izvornem terminskem planu in ni datum nakazila ali splošni rok za oddajo vaše vloge.'],
        ['Zakaj se v planu za leto 2026 pojavi januar 2027?', 'Druga obdelava denarne socialne pomoči iz decembrskega plana 2026 ima objavljen datum izplačila 5. januar 2027. To je posamezen preneseni termin, ne celoten potrjeni koledar za leto 2027.'],
        ['Ali datum potrjuje mojo upravičenost ali uro nakazila?', 'Ne. Stran povzema objavljeni terminski plan. Vaš prejemek je odvisen od odločbe in obdelave zadeve; za svoj primer se obrnite na pristojni CSD. Ure priliva na bančni račun ne napovedujemo.']
      ]
    end
  end
end
