class ToolsDirectory
  GROUPS = {
    'koledarji' => ['Koledarji in tisk', 'category-koledarji', [
      ['/koledar/', 'Letni koledarji', 'yearly-calendars', 'Leta, meseci in slovenski prazniki.'],
      ['/koledar-za-tiskanje/', 'Koledarji PDF', 'print-pdf', 'Predloge za tiskanje in prenos.'],
      ['/mesecni-koledar/', 'Mesečni koledar', 'monthly-calendar', 'Mesečni pregled z zapiski, PDF in Excel.'],
      ['/tedenski-koledar/', 'Tedenski koledar', 'weekly-calendar', 'Teden ISO in prostor za zapiske.'],
      ['/prazen-koledar/', 'Prazen koledar', 'blank-calendar', 'Prilagodljiva predloga za vaše datume.'],
      ['/ustvari-koledar/', 'Ustvari koledar', 'calendar-studio', 'Sestavite koledar s svojo sliko, datumi in barvami.'],
      *SlovenianResources.tool_rows(%w[/predloge-urnikov/])
    ]],
    'prazniki' => ['Prazniki in prireditve', 'category-prazniki', [
      ['/prazniki/', 'Prazniki in dela prosti dnevi', 'public-holidays', 'Zakonski prazniki in prosti dnevi v Sloveniji.'],
      ['/dnevi-za-zastavo/', 'Dnevi za izobešanje zastave', 'flag-days', 'Obvezno in dovoljeno izobešanje slovenske zastave po datumih.'],
      ['/pomembni-dnevi/', 'Pomembni dnevi', 'important-days', 'Tradicije, obeležitve in občinski prazniki.'],
      ['/koledar-svetnikov/', 'Izbrani godovi', 'saints-days', 'Poiščite izbrane godove ali dodajte svoj datum.'],
      ['/festivali/', 'Festivali in prireditve', 'festival-stage', 'Potrjeni termini prireditev in uradni programi.']
    ]],
    'sola' => ['Šola in študij', 'category-sola', [
      ['/solske-pocitnice/', 'Šolske počitnice', 'school-holidays', 'Počitnice po regijah za osnovne in srednje šole.'],
      ['/solski-koledar/', 'Šolski koledar', 'school-year', 'Pouk, počitnice in pomembni datumi šolskega leta.'],
      ['/solski-urnik/', 'Šolski urnik', 'school-timetable', 'Uredite predmete, ure in učilnice.'],
      ['/studijski-koledar/', 'Univerzitetni koledarji', 'university-term', 'Semestri in izpitna obdobja univerz.'],
      ['/matura/2027/', 'Matura', 'matura', 'Splošna in poklicna matura z uradnimi datumi.'],
      ['/npz/', 'Nacionalno preverjanje znanja', 'national-tests', 'Preizkusi in uradni termini NPZ.'],
      ['/studijski-nacrtovalnik/', 'Študijski načrtovalnik', 'study-plan', 'Pretvorite obseg učenja v tedenski načrt in roke.'],
      ['/vpisni-koledar/', 'Vpisni koledar', 'admissions', 'Informativni dnevi, prijavni roki in izbirni postopki.']
    ]],
    'delo' => ['Delo in dopust', 'category-delo', [
      ['/delovni-dnevi/', 'Delovni dnevi in ure', 'work-hours', 'Delovni dnevi, ure in prazniki po mesecih.'],
      ['/kalkulator-delovnih-dni/', 'Kalkulator delovnih dni', 'workday-counter', 'Preštejte delovne dni in ure v izbranem razponu.'],
      ['/nacrtovalnik-dopusta/', 'Načrtovalnik dopusta', 'holiday-planner', 'Primerjajte porabo dopusta in dolžino oddiha.'],
      ['/podaljsani-vikendi/', 'Podaljšani vikendi', 'long-weekend', 'Načrtujte oddih ob vikendih in praznikih.'],
      ['/razpored-izmen/', 'Razpored izmen', 'shift-cycle', 'Ponavljajoči se delovni cikli in osebni urnik.'],
      ['/davcni-koledar/', 'Davčni koledar', 'tax-deadlines', 'Izbrani roki FURS in lastni opomniki.'],
      *SlovenianResources.tool_rows(['/kalkulator-place/', SlovenianResources::ANNUAL_TAX, '/kalkulator-ddv/'])
    ]],
    'vsakdan' => ['Osebno in horoskop', 'category-vsakdan', [
      ['/druzinski-planer/', 'Družinski planer', 'family-plan', 'Dogodki, obroki in skupni opravki.'],
      ['/dnevni-planer/', 'Dnevni planer', 'day-plan', 'Opravila, zapiski in dnevni urnik.'],
      ['/rojstnodnevni-koledar/', 'Rojstnodnevni koledar', 'birthdays', 'Rojstni dnevi v letnem pregledu.'],
      ['/horoskop/', 'Dnevni horoskop', 'daily-horoscope', 'Dnevni horoskop za vseh 12 znamenj.'],
      ['/horoskop/izracun-znamenja/', 'Izračun znamenja in ascendenta', 'ascendant', 'Znamenje in ascendent po času in kraju rojstva.']
    ]],
    'prejemki' => ['Prejemki in upokojitev', 'category-prejemki', [
      ['/izplacila-pokojnin/', 'Izplačila pokojnin', 'pension-payment', 'ZPIZ in uradni koledar nakazil.'],
      ['/izplacila-socialnih-transferjev/', 'Izplačila socialnih transferjev', 'benefit-payment', 'Objavljeni datumi nakazil CSD po prejemkih.'],
      ['/kalkulator-upokojitve/', 'Kalkulator upokojitve', 'retirement', 'Okvirni datum upokojitve in odmerni odstotek po pravilih ZPIZ.'],
      *SlovenianResources.tool_rows([SlovenianResources::HUB, *SlovenianResources::SUPPORT_PATHS])
    ]],
    'druzinski-prejemki' => ['Družinski prejemki', 'category-family-benefits',
      SlovenianResources.tool_rows(SlovenianResources::FAMILY_PATHS)
    ],
    'kalkulatorji' => ['Datumi in odštevanje', 'category-kalkulatorji', [
      ['/datumski-kalkulator/', 'Datumski kalkulator', 'date-calculator', 'Dnevi med datumoma in premikanje datumov.'],
      ['/odstevanje/', 'Odštevanje do datuma', 'countdown', 'Koliko dni je do praznika, festivala ali vašega dne?'],
      ['/stevilka-tedna/', 'Številka tedna', 'iso-week', 'Številka, začetek in konec tedna ISO.'],
      ['/dan-v-letu/', 'Dan v letu', 'day-of-year', 'Zaporedna številka in število preostalih dni.'],
      ['/prestopno-leto/', 'Prestopno leto', 'leap-year', 'Preverite, ali ima februar 29 dni.'],
      ['/premik-ure/', 'Premik ure', 'clock-change', 'Prehod med poletnim in zimskim časom.']
    ]],
    'nebo' => ['Sonce, Luna in nebo', 'category-nebo', [
      ['/lunin-koledar/', 'Lunin koledar', 'moon-calendar', 'Lunine mene v mesečnem koledarju.'],
      ['/lunine-mene/', 'Lunine mene', 'moon-phases', 'Datumi in ure štirih glavnih faz.'],
      ['/polna-luna/', 'Polna luna', 'full-moon', 'Naslednja polna luna in letni pregled.'],
      ['/mlaj/', 'Mlaj', 'new-moon', 'Naslednji mlaj in začetek luninega cikla.'],
      ['/soncni-vzhod-in-zahod/', 'Sončni vzhod in zahod', 'sunrise-sunset', 'Sončni časi in zlata ura po slovenskih mestih.'],
      ['/lunin-vzhod-in-zahod/', 'Lunin vzhod in zahod', 'moonrise-moonset', 'Kdaj Luna vzide ali zaide v izbranem mestu?'],
      ['/dolzina-dneva/', 'Dolžina dneva', 'daylight', 'Primerjajte trajanje dnevne svetlobe.'],
      ['/soncni-mrk/', 'Sončni mrki', 'solar-eclipse', 'Časi mrkov in vidnost iz slovenskih mest.'],
      ['/lunin-mrk/', 'Lunini mrki', 'lunar-eclipse', 'Časovnica mrkov in vidnost nad obzorjem.'],
      ['/perzeidi/', 'Perzeidi', 'perseids', 'Opazovalne noči, tema in mesečina.'],
      *SlovenianResources.tool_rows([SlovenianSkyCalendar::PATH])
    ]],
    'narava' => ['Narava in letni časi', 'category-narava', [
      ['/letni-casi/', 'Letni časi', 'seasons', 'Enakonočji in solsticija v slovenskem času.'],
      ['/setveni-koledar/', 'Setveni koledar', 'sowing-calendar', 'Setev, sajenje in opravila po mesecih.'],
      ['/sezonski-opomniki/', 'Sezonski opomniki', 'season-reminders', 'Izberite opravila in si nastavite datume za vsak letni čas.']
    ]]
  }.freeze
end
