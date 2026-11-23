class EditorialNote
  MONTH_NAMES = %w[januar februar marec april maj junij julij avgust september oktober november december].freeze
  MONTH_GENITIVE = %w[januarja februarja marca aprila maja junija julija avgusta septembra oktobra novembra decembra].freeze
  PERIOD = %r{\A/(koledar|tedenski-koledar|delovni-dnevi|prazniki|podaljsani-vikendi|lunin-koledar|pomembni-dnevi)/(202[6-9]|2030)(?:/([a-z]+))?/\z}

  def self.for(path, city: nil)
    return EditorialCatalog.notes[path] if EditorialCatalog.notes.key?(path)
    return SunLocalEditorial.for(city) if city

    match = PERIOD.match(path)
    return unless match

    family, year, month_name = match.captures
    month = MONTH_NAMES.index(month_name)&.+(1) if month_name
    return if month_name && !month

    period(family, year.to_i, month)
  end

  def self.note(title, paragraphs, links, sources)
    { 'title' => title, 'paragraphs' => Array(paragraphs), 'links' => links, 'sources' => sources }
  end

  def self.date_label(date)
    "#{date.day}. #{MONTH_GENITIVE.fetch(date.month - 1)} #{date.year}"
  end

  def self.period(family, year, month)
    from = Date.new(year, month || 1, 1)
    to = Date.new(year, month || 12, -1)
    label = month ? "#{MONTH_NAMES.fetch(month - 1).capitalize} #{year}" : year.to_s
    month_route = year == 2026 ? "/mesecni-koledar/" : "/koledar/#{year}/#{MONTH_NAMES.fetch(from.month - 1)}/"
    holidays = "/prazniki/#{year}/"
    work = "/delovni-dnevi/#{year}/"

    case family
    when 'koledar', 'tedenski-koledar'
      calendar(family, label, from, to, month, month_route, holidays, work)
    when 'delovni-dnevi'
      work_summary(label, from, to, month, holidays, work)
    when 'prazniki'
      holiday_summary(year, from, to, work)
    when 'podaljsani-vikendi'
      if year == 2027
        start = Date.new(year, 6, 25)
        leave = Date.new(year, 6, 28)
        text = "Od #{date_label(start)} do #{date_label(leave)} so pri običajnem petdnevnem tednu lahko štirje prosti dnevi, če je odobren ponedeljek dopusta."
      else
        start = CalendarEngine.work_free_dates(from, to).find(&:friday?)
        text = start ? "Primer za #{year}: #{date_label(start)} je praznični petek. Če sta sobota in nedelja v vašem urniku prosti, dobite z odobrenim naslednjim ponedeljkom štiri dni oddiha." :
          "V letu #{year} najprej v koledarju poiščite proste dneve tik ob koncu tedna in pri vsakem izračunajte potrebno odsotnost."
      end
      note("#{year}: preverite predlog s svojim urnikom",
        [text, 'Pri primerjavi terminov si zabeležite po dve številki: dolžino oddiha in delovne dni, ki bi jih morali pokriti z dopustom. Praznik med vašimi običajnimi prostimi dnevi sam po sebi ne poveča števila prostih dni.'],
        [holidays, '/nacrtovalnik-dopusta/', '/blog/dopust-s-prazniki-in-solskim-letom/'], %w[holidays leave])
    when 'lunin-koledar'
      lunar_summary(label, from, to, month)
    when 'pomembni-dnevi'
      movable = CalendarEngine.easter(year)
      note("#{year}: primerjajte stalne in premične dneve",
        ["Velikonočna nedelja je #{date_label(movable)}, pri dnevu kulture pa izhajajte iz stalnega datuma 8. februarja. Dopust, običaj in mednarodno obeležje preverjajte v ustreznih pregledih.",
         'Pri premičnem običaju za načrtovanje uporabite izbrano leto, pri lokalnem dogodku pa je merodajen program organizatorja. Tako se zlahka izognete kopiranju termina iz drugega leta.'],
        [holidays, "/koledar/#{year}/", '/blog/letni-koledar-nacrt-za-12-mesecev/'], %w[holidays])
    end
  end

  def self.calendar(family, label, from, to, month, month_route, holidays, work)
    first_day = CalendarEngine::DAYS.fetch(from.cwday - 1)
    first_week = "#{from.cwyear}-W#{format('%02d', from.cweek)}"
    last_week = "#{to.cwyear}-W#{format('%02d', to.cweek)}"
    text = if family == 'tedenski-koledar'
      "Prvi datum leta #{label} je #{first_day} v tednu #{first_week}; zadnji datum je v tednu #{last_week}. Pri dogovoru tik ob novem letu poleg številke tedna vedno napišite tudi leto tedna."
    elsif month
      "#{label} ima #{to.day} dni. Prvi dan je #{first_day} in spada v #{first_week}. Za načrt, ki se nadaljuje v naslednji mesec, preglejte tudi zadnjo koledarsko vrstico (#{last_week})."
    else
      "Leto #{label} ima #{to.yday} dni in se začne na dan #{first_day} v tednu #{first_week}. Pri letnem načrtu zabeležite fiksne roke, nato poiščite konkreten mesec in izračunajte delovne dni za svoj urnik."
    end
    calendar_link = month || family == 'tedenski-koledar' ? "/koledar/#{from.year}/" : month_route
    note("#{label}: datum, teden in delovni urnik",
      [text, 'Pri planiranju odsotnosti preverite še razliko med koledarskim datumom praznika in delovnim dnem. Pri tisku mesečnega ali letnega pregleda izberite format lista pred prenosom.'],
      [calendar_link, holidays, work, '/blog/tedenski-koledar-pregled-v-30-minutah/'], %w[iso holidays])
  end

  def self.work_summary(label, from, to, month, holidays, work)
    data = CalendarEngine.working_days(from, to)
    legal_days = CalendarEngine.work_free_dates(from, to)
    hours = 8 * data.fetch(:working_days)
    intro = "Med #{date_label(from)} in #{date_label(to)} je pri urniku od ponedeljka do petka #{data.fetch(:working_days)} delovnih dni oziroma #{hours} načrtovanih ur pri osmih urah na dan."

    if month && (example = workday_examples[from.strftime('%Y-%m')])
      return monthly_work_example(example, intro, holidays, work)
    end

    insight = if month
      calendar_weekdays = (from..to).group_by(&:cwday)
      four_day_schedule = CalendarEngine.working_days(from, to, weekdays: [1, 2, 3, 4]).fetch(:working_days)
      affected = legal_days.map do |day|
        weekday = CalendarEngine::DAYS.fetch(day.cwday - 1)
        "#{date_label(day)} (#{weekday})"
      end
      holiday_text = affected.empty? ? "V tem mesecu ni zakonsko dela prostih dni." :
        "Zakonsko dela prosti datumi: #{affected.join('; ')}."
      "#{holiday_text} V koledarju je #{calendar_weekdays.fetch(5).size} petkov. Če delate od ponedeljka do četrtka, privzeti izračun z izločenimi prazniki pokaže #{four_day_schedule} delovnih dni."
    else
      months = (1..12).map do |number|
        count = CalendarEngine.working_days(Date.new(from.year, number, 1), Date.new(from.year, number, -1)).fetch(:working_days)
        [MONTH_NAMES.fetch(number - 1), count]
      end
      smallest = months.map(&:last).min
      biggest = months.map(&:last).max
      shortest = months.select { |_, count| count == smallest }.map(&:first).join(', ')
      longest = months.select { |_, count| count == biggest }.map(&:first).join(', ')
      weekends = legal_days.count { |day| day.cwday > 5 }
      "Za načrt obremenitve primerjajte najkrajše mesece (#{shortest}; #{smallest} delovnih dni) in najdaljše mesece (#{longest}; #{biggest} delovnih dni). #{weekends} zakonsko prostih datumov pade na soboto ali nedeljo in pri privzetem urniku ne skrajša delovnega tedna."
    end
    note("#{label}: kako preveriti delovne ure",
      [intro, insight, 'Pri drugačnem urniku najprej prilagodite delovne dneve, nato dnevno število ur. Primer je pomoč za načrtovanje; opravljene ure preverite v svoji evidenci.'],
      [holidays, month ? work : '/kalkulator-delovnih-dni/', '/blog/delovne-ure-zmogljivost-ekipe/'], %w[holidays labour])
  end

  def self.workday_examples
    @workday_examples ||= JSON.parse(Rails.root.join('data/calendar-collection/workday_examples_sl.json').read).freeze
  end

  def self.monthly_work_example(example, intro, holidays, work)
    from, to = example.values_at('from', 'to').map { |date| Date.iso8601(date) }
    weekdays = example.fetch('weekdays')
    hours = example.fetch('hours')
    result = CalendarEngine.working_days(from, to, weekdays: weekdays)
    schedule = weekdays.map { |day| CalendarEngine::DAYS.fetch(day - 1) }.join(', ')
    daily = format('%g', hours).tr('.', ',')
    total = format('%g', hours * result.fetch(:working_days)).tr('.', ',')
    excluded = result.fetch(:excluded_holidays)
    outcome = "Od #{date_label(from)} do #{date_label(to)}, vključno z obema datumoma: #{result.fetch(:working_days)} delovnih dni × #{daily} ure na dan = #{total} načrtovanih ur."
    holiday_note = excluded.empty? ?
      'V tem vzorcu na izbrane dneve ne pade noben zakonsko dela prost dan.' :
      "Dela prosti datumi, izločeni iz izbranega urnika: #{excluded.map { |day| date_label(day) }.join(', ')}."
    directions = "V [kalkulatorju delovnih dni](/kalkulator-delovnih-dni/) označite naslednje dneve: #{schedule}. #{holiday_note}"
    note(example.fetch('title'), [intro, example.fetch('body'), outcome, directions],
         [holidays, work], %w[holidays labour])
  end

  def self.lunar_summary(label, from, to, month)
    events = LunarPhaseSchedule.events.select { |row| row.fetch('date').between?(from.iso8601, to.iso8601) }
    full_moon = events.find { |row| row.fetch('kind') == 'full_moon' }
    new_moon = events.find { |row| row.fetch('kind') == 'new_moon' }
    examples = [full_moon, new_moon].compact.map do |row|
      date = Date.iso8601(row.fetch('date'))
      "#{row.fetch('label')}: #{date_label(date)} (#{CalendarEngine::DAYS.fetch(date.cwday - 1)}) ob #{row.fetch('time').tr(':', '.')}"
    end
    text = examples.empty? ? "V koledarju za #{label.downcase} primerjajte dva dnevna vzorca osvetljenosti." :
      "Primeri v slovenskem času za #{label.downcase}: #{examples.join('; ')}."
    context = if full_moon && new_moon
      first, second = [full_moon, new_moon].sort_by { |row| row.fetch('date') }
      "#{first.fetch('label')} je prvi od navedenih dogodkov; #{second.fetch('label').downcase} sledi na drugem delu koledarja. Za krajši opazovalni načrt primerjajte še krajevni vzhod in zahod Lune, ker trenutek mene sam ne določa vidnosti."
    else
      'Za opazovanje ločeno preverite krajevni vzhod in zahod Lune. Dnevno osvetljenost primerjajte ob isti uri.'
    end
    note("#{label}: kako uporabiti lunine podatke",
      [text, context],
      [month ? "/lunin-koledar/#{from.year}/" : '/lunine-mene/', '/polna-luna/', '/blog/lunin-koledar-opazovalni-dnevnik/'], %w[moon sun])
  end

  def self.holiday_summary(year, from, to, work)
    days = CalendarEngine.work_free_dates(from, to)
    weekdays = days.count { |day| day.cwday <= 5 }
    note("#{year}: kateri prosti dnevi vplivajo na delovni teden?",
      ["V letu #{year} je v koledarju #{days.size} različnih zakonsko dela prostih datumov, od tega #{weekdays} od ponedeljka do petka. Običajni petdnevni urnik zato izloči teh #{weekdays} delovnih datumov.",
       'Pri razporedu, ki vključuje sobote ali nedelje, rezultat preračunajte s svojimi delovnimi dnevi. Če praznike uvozite v osebni koledar, najprej preverite, da je datoteka za izbrano leto.'],
      [work, '/kalkulator-delovnih-dni/', '/blog/osebni-koledar-ics-med-napravami/'], %w[holidays])
  end

  private_class_method :note, :date_label, :period, :calendar, :work_summary, :workday_examples, :monthly_work_example, :lunar_summary, :holiday_summary
end
