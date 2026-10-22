class EducationCalendar
  PAGES = {
    '/solski-koledar/' => {
      kind: 'school', title: 'Šolski koledar 2026/2027: pouk, počitnice in izpiti',
      heading: 'Šolski koledar 2026/2027', eyebrow: 'OD SEPTEMBRA DO AVGUSTA',
      description: 'Šolski koledar 2026/2027 za osnovne in srednje šole v Sloveniji. Pouk, počitnice, NPZ in izpitni roki z izbiro razreda, tiskom in izvozom ICS.',
      intro: 'Pouk, počitnice in pomembni roki v enem pregledu. Izberite šolo, razred in regijo ter sestavite koledar za svoje šolsko leto.'
    },
    '/matura/2027/' => {
      kind: 'matura', title: 'Matura 2027: datumi izpitov, prijav in rezultatov',
      heading: 'Matura 2027', eyebrow: 'OD PRIJAVE DO REZULTATOV',
      description: 'Koledar mature 2027 po uradnih datumih RIC. Ločena splošna in poklicna matura, izbor predmetov, spomladanski in jesenski rok, tisk ter ICS.',
      intro: 'Izberite vrsto mature, izpitni rok in svoje predmete. Prijave, pisni izpiti, ustna obdobja in rezultati ostanejo povezani v osebnem pregledu.'
    },
    '/matura/2027/splosna/' => {
      kind: 'matura', exam_type: 'general', title: 'Splošna matura 2027: koledar izpitov po predmetih',
      heading: 'Splošna matura 2027', eyebrow: 'URADNI ROKI RIC',
      description: 'Datumi splošne mature 2027: esej, pisni izpiti po predmetih, ustni roki, prijave in rezultati. Sestavite svoj pregled ter ga natisnite ali izvozite v ICS.',
      intro: 'Od eseja do objave rezultatov. Izberite svoje predmete za spomladanski ali jesenski rok in dodajte pomembne datume v svoj koledar.'
    },
    '/matura/2027/poklicna/' => {
      kind: 'matura', exam_type: 'vocational', title: 'Poklicna matura 2027: datumi izpitov in rezultatov',
      heading: 'Poklicna matura 2027', eyebrow: 'URADNI ROKI RIC',
      description: 'Koledar poklicne mature 2027: pisni izpiti, drugi in četrti predmet, ustno obdobje, prijave ter rezultati. Izbor predmetov, tisk in prenos ICS.',
      intro: 'Pregled datumov za vaš izobraževalni program. Izberite predmete in izpitni rok; osebni termin ustnih izpitov in četrtega predmeta preverite na šoli.'
    },
    '/npz/' => {
      kind: 'npz', title: 'NPZ 2027: datumi za 3., 6. in 9. razred',
      heading: 'NPZ 2027', eyebrow: 'NACIONALNO PREVERJANJE ZNANJA',
      description: 'Datumi NPZ 2027 za 3., 6. in 9. razred. Preverjanja, objava dosežkov, vpogledi in poizvedbe po razredih, s tiskom in koledarjem ICS.',
      intro: 'Izberite razred in preverite datume preizkusov, objave dosežkov ter vpogledov. Vsak razred ima svoj razpored rezultatov.'
    },
    '/npz/3-razred/' => {
      kind: 'npz', grade: '3', title: 'NPZ 2027 za 3. razred: datumi in rezultati',
      heading: 'NPZ 2027 · 3. razred', eyebrow: 'JEZIK IN MATEMATIKA',
      description: 'NPZ v 3. razredu 2027: jezik 22. marca, matematika 1. aprila in dosežki 6. maja. Uradni roki, vpogledi, tisk in prenos datumov v koledar.',
      intro: 'Jezikovni preizkus in matematika, nato vpogled v dosežke. Vsi datumi za tretješolce so zbrani v enem pregledu.'
    },
    '/npz/6-razred/' => {
      kind: 'npz', grade: '6', title: 'NPZ 2027 za 6. razred: predmeti, datumi in dosežki',
      heading: 'NPZ 2027 · 6. razred', eyebrow: 'JEZIK, TUJI JEZIK IN MATEMATIKA',
      description: 'NPZ za 6. razred 2027: jezik 22. marca, tuji jezik 24. marca, matematika 1. aprila in dosežki 3. maja. Tisk in izvoz uradnih datumov ICS.',
      intro: 'Preizkusi iz jezika, tujega jezika in matematike ter ločeni roki za dosežke in poizvedbe. Izberite datume, ki jih želite shraniti.'
    },
    '/npz/9-razred/' => {
      kind: 'npz', grade: '9', title: 'NPZ 2027 za 9. razred: tretji predmet in datumi',
      heading: 'NPZ 2027 · 9. razred', eyebrow: 'PREGLED ZA DEVETOŠOLCE',
      description: 'Datumi NPZ za 9. razred 2027: jezik, matematika, tretji predmet, dosežki in vpogledi. Preverite koledar in ga shranite kot PDF ali ICS.',
      intro: 'Jezik, matematika in tretji predmet po razporedu vaše šole. Preverite tudi zgodnejše termine objave dosežkov za devetošolce.'
    },
    '/studijski-koledar/' => {
      kind: 'study', title: 'Študijski koledar 2026/2027: semestri in izpitna obdobja',
      heading: 'Študijski koledar 2026/2027', eyebrow: 'OD OKTOBRA DO SEPTEMBRA',
      description: 'Študijski koledar 2026/2027 za slovenske univerze in izbrane članice. Primerjajte semestre ter izpitna obdobja in prenesite svoj koledar ICS.',
      intro: 'Izberite univerzo ali članico in razporedite študijsko leto. Semestri, izpitna obdobja in izrecno objavljeni prosti dnevi so prikazani ločeno.'
    }
  }.freeze
  TIMETABLE = {
    title: 'Šolski urnik: ustvarite in natisnite tedenski razpored',
    heading: 'Moj šolski urnik',
    description: 'Ustvarite šolski urnik s predmeti, urami, učilnicami in učitelji. Tedensko ponavljanje, pregled prekrivanj, tisk PDF ter izvoz ICS in varnostne kopije.'
  }.freeze
  LINKS = [
    ['Šolski koledar', '/solski-koledar/'], ['Šolske počitnice', '/solske-pocitnice/'],
    ['Matura 2027', '/matura/2027/'], ['NPZ 2027', '/npz/'],
    ['Študijski koledar', '/studijski-koledar/'], ['Šolski urnik', '/solski-urnik/']
  ].freeze

  def self.paths = PAGES.keys
  def self.page(path) = PAGES[path]
  def self.data = JSON.parse(Rails.root.join('public/education/data.json').read)

  attr_reader :config, :data, :path

  def initialize(path:)
    @path = path
    @config = PAGES.fetch(path)
    @data = self.class.data
  end

  def kind = config.fetch(:kind)
  def initial
    { 'level' => 'primary', 'region' => 'west', 'grade' => config[:grade] || 'all',
      'stage' => 'all', 'examType' => config[:exam_type] || 'general', 'session' => 'spring',
      'institution' => 'ul', 'category' => 'all', 'subjects' => [], 'upcoming' => false }
  end

  def events
    data.fetch('events').select do |e|
      matches = e['kind'] == kind || (kind == 'school' && e['kind'] == 'npz')
      matches && (!config[:exam_type] || e['examType'] == config[:exam_type]) &&
        (!config[:grade] || e.fetch('grades', []).include?(config[:grade].to_i))
    end
  end

  def filtered(state = initial, today: Time.current.in_time_zone('Europe/Ljubljana').to_date.iso8601)
    events.select do |e|
      next false if kind == 'school' && ((e['level'] || 'primary') != state['level'] || (e['region'] && e['region'] != state['region']))
      next false if state['grade'] != 'all' && e['grades'] && !e['grades'].include?(state['grade'].to_i)
      next false if kind == 'school' && state['level'] == 'secondary' && state['stage'] != 'all' && e['stage'] && e['stage'] != state['stage']
      next false if kind == 'matura' && (e['examType'] != state['examType'] || (state['session'] != 'all' && e['session'] != 'both' && e['session'] != state['session']))
      next false if kind == 'study' && state['institution'] != 'all' && e['institution'] != state['institution']
      next false if state['category'] != 'all' && e['category'] != state['category']
      next false if state['subjects'].any? && e['subjects'] && (state['subjects'] & e['subjects']).empty?
      next false if state['upcoming'] && e['end'] < today
      true
    end
  end

  def range = data.fetch(kind == 'study' ? 'studyRange' : kind == 'matura' ? 'maturaRange' : 'schoolRange')
  def sources = data.fetch('sources').select { |s| events.any? { |e| e['source'] == s['id'] } }
  def source(id) = data.fetch('sources').find { |s| s['id'] == id }
  def date_label(date) = Date.iso8601(date).strftime('%-d. %-m. %Y')
  def range_label(event) = event['start'] == event['end'] ? date_label(event['start']) : "#{date_label(event['start'])}–#{date_label(event['end'])}"
  def next_event(today: Time.current.in_time_zone('Europe/Ljubljana').to_date.iso8601)
    filtered.find { |e| e['start'] >= today }
  end
  def context(event)
    parts = []
    parts << (event['examType'] == 'general' ? 'Splošna matura' : 'Poklicna matura') if event['examType']
    parts << "#{event['grades'].join(', ')}. razred" if event['kind'] == 'npz'
    parts << data.fetch('institutions').find { |i| i['id'] == event['institution'] }&.fetch('name') if event['institution']
    parts.compact.join(' · ')
  end
  def payload
    { kind: kind, path: path, config: config, initial: initial, range: range,
      reviewedAt: data.fetch('reviewedAt'), categories: data.fetch('categories'), subjects: data.fetch('subjects'),
      institutions: data.fetch('institutions'), sources: sources, events: events }
  end

  def questions
    common = ['Ali se uvoženi koledar samodejno posodablja?', 'Datoteka ICS je enkraten posnetek izbranih datumov. Če RIC, ministrstvo ali ustanova spremeni razpored, ponovno preverite vir in prenesite posodobljen koledar.']
    own = case kind
    when 'school'
      [
        ['Zakaj šolsko leto sega čez dve koledarski leti?', 'Pregled šolskega leta 2026/2027 poteka od septembra 2026 do avgusta 2027. Srednješolski jesenski izpitni rok se nadaljuje do 27. septembra 2027 in je v seznamu prikazan v celoti.'],
        ['Ali imajo vsi učenci in dijaki enake datume?', 'Ne. Zimske počitnice so odvisne od lokacije šole. Pouk se v 9. razredu konča 15. junija 2027, v zaključnih letnikih srednje šole 21. maja, za druge učence in dijake pa 24. junija. Šola določi posamezne izpitne termine.']
      ]
    when 'matura'
      [
        ['Ali je obdobje ustnih izpitov moj osebni termin?', 'Ne. RIC objavi skupno obdobje, osebni dan in uro pa določi šola. V spomladanskem roku je redno obdobje od 9. do 23. junija 2027; izjemoma lahko šola izvede ustni izpit tudi 29. maja ali 5. junija.'],
        ['Kako dodam peti predmet ob poklicni maturi?', 'Peti predmet je izpit splošne mature. V pregledu splošne mature izberite ta predmet in izvozite njegove datume posebej; nato ga dodajte koledarju poklicne mature. Preverite tudi pogoje in prijavo na šoli.'],
        ['Zakaj imajo jesenski izbirni predmeti več možnih datumov?', 'Koledar RIC navaja več izpitnih dni za tuje jezike in izbirne predmete. Razpored posameznih predmetov preverite na šoli. Ti dnevi so zato označeni kot šolski razpored.']
      ]
    when 'npz'
      [
        ['Ali 3., 6. in 9. razred prejmejo dosežke isti dan?', 'Ne. Prva seznanitev z dosežki je za 9. razred 20. aprila 2027, za 6. razred 3. maja in za 3. razred 6. maja. Razlikujejo se tudi obdobja vpogledov in poizvedb.'],
        ['Kateri je tretji predmet v 9. razredu?', 'Predmet je določen za posamezno šolo. V koledarju je naveden skupni datum 24. marec 2027; ime predmeta preverite pri svoji šoli oziroma v uradni objavi.']
      ]
    else
      [
        ['Ali je izpitno obdobje čas počitnic?', 'Izpitna obdobja so namenjena izpitom in drugim študijskim obveznostim. Proste dneve prikazujemo le, kadar jih izbrana ustanova izrecno objavi.'],
        ['Ali univerzitetni koledar velja za vsako fakulteto?', 'Univerzitetni okvir se lahko po članicah in programih prilagodi. Pri Univerzi v Novem mestu sta prikazana ločena koledarja FIŠ in FEI. Za osebne obveznosti preverite še razpored svojega programa.']
      ]
    end
    own + [common]
  end
end
