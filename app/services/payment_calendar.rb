class PaymentCalendar
  PAGES={
    '/izplacila-pokojnin/'=>{kind:'pension',title:'Izplačila pokojnin 2026: datumi in naslednje nakazilo',heading:'Izplačila pokojnin 2026',description:'Preverite naslednje izplačilo pokojnine in vseh 12 datumov ZPIZ za leto 2026. Pregled po mesecih, koledar za tisk in brezplačen prenos ICS.'},
    '/izplacila-socialnih-transferjev/'=>{kind:'social',title:'Izplačila socialnih transferjev 2026: koledar CSD',heading:'Izplačila socialnih transferjev 2026',description:'Datumi CSD za otroški in varstveni dodatek, socialno pomoč, štipendije ter druge prejemke. Filtrirajte izplačila in prenesite koledar ICS.'}
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
  def payload = self.class.data.merge('events'=>events,'categories'=>categories,'kind'=>kind)
  def faq
    if pension?
      [
        ['Kdaj bo naslednje izplačilo pokojnine?', 'Naslednji objavljeni datum je izpostavljen na vrhu strani. Upoštevamo lokalni datum v Sloveniji in izključno objavljeni koledar ZPIZ. Ko zmanjka potrjenih prihodnjih datumov, vas usmerimo na uradni vir.'],
        ['Ali je izplačilo vedno zadnji delovni dan v mesecu?', 'ZPIZ navaja, da je izplačilo najpozneje zadnji delovni dan tekočega meseca. Uporabljamo objavljene datume: decembrsko izplačilo za leto 2026 je na primer določeno za torek, 29. decembra.'],
        ['Ali so to tudi datumi letnega ali zimskega dodatka?', 'Pregled vsebuje redna mesečna izplačila pokojnin. O dodatkih, osebni upravičenosti in zneskih preverite ločena pojasnila ZPIZ.'],
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
