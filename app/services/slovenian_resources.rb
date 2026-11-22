class SlovenianResources
  CHECKED_ON = '2026-11-22'.freeze
  HUB = '/socialni-prejemki/'.freeze
  BIRTH_RIGHTS = ['GOV.SI – Pravice ob rojstvu otroka', 'https://www.gov.si/teme/pravice-ob-rojstvu-otroka/'].freeze
  CHILD = ['GOV.SI – Otroški dodatek', 'https://www.gov.si/teme/otroski-dodatek/'].freeze
  SOCIAL = ['GOV.SI – Denarna in izredna socialna pomoč', 'https://www.gov.si/teme/denarna-socialna-pomoc/'].freeze
  ZRSZ = ['ZRSZ – Denarno nadomestilo', 'https://www.ess.gov.si/iskalci-zaposlitve/koraki-ob-izgubi-zaposlitve/denarno-nadomestilo/'].freeze
  FURS = ['FURS – Lestvica in olajšave za leto 2026', 'https://www.fu.gov.si/davki_in_druge_dajatve/podrocja/dohodnina/letna_odmera_dohodnine/'].freeze
  PAYMENTS = '/izplacila-socialnih-transferjev/'.freeze
  ANNUAL_TAX = '/kalkulator-dohodnine/'.freeze
  TAX_INDEX_SOURCE = ['Ministrstvo za finance – Uskladitev dohodnine 2027', 'https://www.gov.si/novice/2026-11-18-tudi-prihodnje-leto-75-odstotna-uskladitev-olajsav-in-dohodninske-lestvice/'].freeze
  TAX_RETURN_SOURCE = ['eDavki – Napoved za odmero dohodnine in rok', 'https://edavki.durs.si/EdavkiPortal/OpenPortal/CommonPages/Opdynp/PageD.aspx?category=napoved_za_dohodnino_fo'].freeze

  PAGES = {
    HUB => {
      name: 'Socialni prejemki', title: 'Socialni prejemki v Sloveniji: pravice, vloge in izplačila', icon: 'social-rights',
      description: 'Poiščite otroški in starševski dodatek, pomoč ob rojstvu, znižano plačilo vrtca, bolniško nadomestilo ali pomoč ob izgubi dohodka.',
      sections: [
        ['Kateri organ je pristojen?', 'Center za socialno delo (CSD) obravnava družinske prejemke in socialno pomoč. Za nadomestilo za brezposelnost je pristojen ZRSZ, za pravice iz zdravstvenega zavarovanja pa ZZZS.'],
        ['Od vloge do nakazila v 2027', 'Po izbiri pravice najprej preverite obrazec in rok. V odločbi poiščite obdobje in znesek, ki sta vam bila priznana. V koledarju nakazil je za vsak mesec 2027 razvidno, ali je termin že objavljen.']
      ],
      sources: [['GOV.SI – Pravice in prejemki družine', 'https://www.gov.si/podrocja/druzina-otroci-in-zakonska-zveza/pravice-in-prejemki-druzine/'], SOCIAL],
      related: [PAYMENTS, '/izplacila-pokojnin/']
    },
    '/otroski-dodatek/' => {
      name: 'Otroški dodatek', title: 'Otroški dodatek 2026: lestvica in informativni izračun', icon: 'child-allowance',
      description: 'Ocenite osnovni mesečni otroški dodatek v Sloveniji po dohodkovnem razredu, vrstnem redu otroka in šolanju. Preverite pogoje in vlogo CSD.',
      metric: ['1328,28 €', 'Zgornja meja mesečnega dohodka na osebo'],
      calculator: :child, action: 'Ocenite dodatek za enega otroka',
      note: 'Lestvica za pravice od marca 2026. Vnesite dohodek na osebo po merilih CSD in vrstni red otroka, kot je naveden v odločbi. Prikazan je osnovni znesek brez povečanj.',
      sections: [
        ['Kdo lahko uveljavlja otroški dodatek?', 'Praviloma ga uveljavlja eden od staršev ali druga upravičena oseba za otroka do 18. leta, ki prebiva in dejansko živi v Sloveniji. CSD preveri materialni položaj družine in določi dohodkovni razred.'],
        ['Katero lestvico uporabiti?', 'Dohodkovne meje so enake za osnovno in srednjo šolo. V 7. in 8. razredu pa so zneski za srednješolce višji. Za prvega otroka v 7. razredu znaša osnovni dodatek 29,52 € oziroma 37,25 €, če obiskuje srednjo šolo.'],
        ['Prva vloga in spremembe', 'Prvo vlogo vložite na pristojnem CSD. Po rojstvu jo vložite v 30 dneh, če želite, da pravica velja od meseca rojstva. Spremembe, ki jih zahteva eUprava, sporočite CSD v osmih dneh.']
      ],
      sources: [CHILD, ['eUprava – Vloga za otroški dodatek', 'https://e-uprava.gov.si/si/podrocja/druzina-otroci-zakonska-zveza/pravice-prejemki-druzine/otroski-dodatek?lang=si']],
      related: [HUB, '/znizano-placilo-vrtca/', PAYMENTS]
    },
    '/pomoc-ob-rojstvu-otroka/' => {
      name: 'Pomoč ob rojstvu otroka', title: 'Pomoč ob rojstvu otroka 2026: znesek in roki', icon: 'birth-grant',
      description: 'Preverite enkratno državno pomoč za novorojenčka, rok za vlogo pred porodom ali po rojstvu in možnost ločene občinske pomoči.',
      metric: ['441,60 €', 'Državna pomoč od 1. marca 2026'],
      calculator: :birth, action: 'Preverite koledarska datuma za vlogo',
      note: 'Vnesite predvideni datum poroda za prvi možni dan vloge. Če je otrok že rojen, vnesite še dejanski datum rojstva za izračun 60. dne po rojstvu.',
      sections: [
        ['Državna pomoč za opremo novorojenčka', 'Pomoč ob rojstvu je enkratni prejemek za nakup opreme za otroka. Pravico uveljavlja eden od staršev. Vlogo lahko povežete z vlogo za pravice ob rojstvu ali jo vložite samostojno pri pristojnem CSD.'],
        ['Vloga pred porodom ali po rojstvu', 'Državno pomoč lahko uveljavljate od 60 dni pred predvidenim porodom do 60 dni po rojstvu. Za zadnji dan je pomemben dejanski datum rojstva. Če se rok približuje, pri CSD preverite način oddaje.'],
        ['Občinska pomoč', 'Nekatere občine ponujajo še svoj prejemek. Za občinsko pomoč lahko veljajo drugačni pogoji glede prebivališča, znesek in rok. Na eUpravi poiščite svojo občino in preverite njen postopek.']
      ],
      sources: [BIRTH_RIGHTS, ['eUprava – Občinska pomoč ob rojstvu', 'https://e-uprava.gov.si/si/podrocja/drzava-druzba/storitve-obcin/zaprosite-za-pomoc-ob-rojstvu-otroka.html?lang=si']],
      related: [HUB, '/starsevski-dopust/', '/starsevski-dodatek/', '/otroski-dodatek/']
    },
    '/starsevski-dopust/' => {
      name: 'Starševski dopust in nadomestilo', title: 'Materinski, očetovski in starševski dopust v Sloveniji', icon: 'parental-leave',
      description: 'Izračunajte predvideni začetek materinskega dopusta in primerjajte delitev starševskega dopusta. Pogoji za nadomestilo in oddajo vloge na CSD.',
      metric: ['320 dni', 'Osnovni skupni starševski dopust obeh staršev'],
      calculator: :leave, action: 'Načrtujte dopust ob rojstvu',
      note: 'Običajen primer brez podaljšanj. Vsak starš ima po 160 dni starševskega dopusta. Od teh lahko drugemu prenese do 100 dni.',
      sections: [
        ['Materinski in očetovski dopust', 'Materinski dopust praviloma začne teči 28 dni pred predvidenim porodom in traja 105 dni. Očetovski dopust traja 15 koledarskih dni. Vlogo zanj vložite po rojstvu, pravica pa se prizna z dnem vložitve.'],
        ['Kako si razdeliti starševski dopust?', 'Če oče materi prenese 100 dni, ima mati 260 dni, očetu pa ostane 60 neprenosljivih dni. Enako lahko mati prenese dneve očetu. Zaradi dvojčkov, nedonošenosti ali posebne nege lahko veljajo podaljšanja.'],
        ['Nadomestilo in rok za vlogo', 'Izhodišče je povprečna prispevna osnova v relevantnih 12 mesecih. Pri očetovskem in starševskem nadomestilu velja zgornja meja. Starševski dopust uredite skupaj z materinskim ali najpozneje 30 dni pred iztekom materinskega dopusta.']
      ],
      sources: [BIRTH_RIGHTS, ['eUprava – Vloga in delitev starševskega dopusta', 'https://e-uprava.gov.si/si/podrocja/druzina-otroci-zakonska-zveza/pravice-prejemki-druzine/starsevski-dopust?lang=si']],
      related: [HUB, '/pomoc-ob-rojstvu-otroka/', '/starsevski-dodatek/', '/druzinski-planer/']
    },
    '/starsevski-dodatek/' => {
      name: 'Starševski dodatek', title: 'Starševski dodatek 2026: znesek, trajanje in vloga', icon: 'parental-allowance',
      description: 'Preverite starševski dodatek za starše brez pravice do starševskega nadomestila. Objavljeni mesečni znesek, trajanje in roki za vlogo.',
      metric: ['507,43 €', 'Mesečni znesek od 1. marca 2026'],
      calculator: :parent, action: 'Preverite koledarska datuma za vlogo',
      note: 'Za priznanje od rojstva je pomembna vloga do 30. dne po rojstvu. Pred rojstvom se uporablja predvideni datum poroda.',
      sections: [
        ['Razlika med dodatkom in nadomestilom', 'Dodatek je namenjen staršem, ki po rojstvu niso upravičeni do starševskega nadomestila, denimo nekaterim študentkam in nezaposlenim materam. Če ste bili v zadnjih treh letih zavarovani vsaj 12 mesecev, pri CSD posebej preverite možnost nadomestila brez dopusta.'],
        ['Trajanje pravice', 'V polnem obsegu dodatek traja 365 dni od rojstva. Praviloma ga sprva uveljavlja mati, po prvih 77 dneh ga lahko pod določenimi pogoji uveljavlja tudi oče. Drugačna ureditev je mogoča v posebnih okoliščinah.'],
        ['Kje oddati vlogo?', 'Vlogo obravnava CSD glede na materino stalno ali začasno prebivališče. Če jo oddate več kot 30 dni po rojstvu, se lahko obdobje prejemanja skrajša.']
      ],
      sources: [BIRTH_RIGHTS, ['eUprava – Vloga za starševski dodatek', 'https://e-uprava.gov.si/si/podrocja/druzina-otroci-zakonska-zveza/pravice-prejemki-druzine/starsevski-dodatek?lang=si']],
      related: [HUB, '/starsevski-dopust/', '/pomoc-ob-rojstvu-otroka/', PAYMENTS]
    },
    '/znizano-placilo-vrtca/' => {
      name: 'Znižano plačilo vrtca', title: 'Znižano plačilo vrtca: kalkulator po dohodkovnem razredu', icon: 'kindergarten-fee',
      description: 'Izračunajte okvirno mesečno plačilo vrtca po slovenski lestvici. Primerjajte delež staršev, ceno programa in pogoje za oprostitev.',
      metric: ['0–77 %', 'Delež staršev po dohodkovni lestvici'],
      calculator: :kindergarten, action: 'Ocenite mesečno plačilo za enega otroka',
      note: 'Uporabljeni so dohodkovni razredi iz leta 2026. Vnesite ceno iz cenika vrtca in dohodek na osebo po merilih CSD. Po potrebi izberite državno oprostitev za sorojenca. Občinski popusti in individualni obračuni niso vključeni.',
      sections: [
        ['Od cene programa do plačila', 'Cena programa se lahko razlikuje glede na vrtec, občino in starostno obdobje otroka. CSD določi dohodkovni razred, iz katerega se izračuna vaš delež.'],
        ['Več otrok v vrtcu', 'Če sta hkrati vključena dva otroka, so starši oproščeni plačila za mlajšega. Za tretjega in vsakega nadaljnjega otroka iz iste družine oprostitev velja tudi brez hkratne vključitve sorojenca. Pri vrtcu preverite še občinske ugodnosti in obračun ob odsotnosti.'],
        ['Kdaj urediti vlogo?', 'Vlogo praviloma vložite v mesecu pred vključitvijo otroka v vrtec. Uporabite vlogo za pravice iz javnih sredstev pri CSD in preverite, ali vaš vrtec sodeluje v javnem financiranju.']
      ],
      sources: [['GOV.SI – Lestvica za plačilo vrtca', 'https://www.gov.si/teme/znizano-placilo-vrtca/'], ['eUprava – Vloga za znižano plačilo', 'https://e-uprava.gov.si/si/podrocja/druzina-otroci-zakonska-zveza/vrtci-varovanje-otrok/znizano-placilo-vrtca?lang=si']],
      related: [HUB, '/otroski-dodatek/', '/solski-koledar/']
    },
    '/nadomestilo-za-brezposelnost/' => {
      name: 'Nadomestilo za brezposelnost', title: 'Nadomestilo za brezposelnost 2026: bruto zneski in vloga', icon: 'unemployment',
      description: 'Ocenite bruto mesečno nadomestilo za brezposelnost za polni delovni čas po pravilih 2026. Preverite tudi rok za prijavo na Zavodu.',
      metric: ['30 dni', 'Običajni rok po prenehanju zavarovanja'],
      calculator: :unemployment, action: 'Primerjajte bruto znesek po mesecih',
      note: 'Informativni izračun za polno zavarovanje po osnovi in minimalni plači za leto 2026 (1481,88 €). Vrste prikazujejo zneske, če odločba pokriva ta mesec. Trajanja pravice ne določajo.',
      sections: [
        ['Katere pogoje preveri ZRSZ?', 'Zavod preveri razlog prenehanja zaposlitve, zavarovalno dobo in druge pogoje. Običajno potrebujete vsaj 10 mesecev zavarovanja v zadnjih 24 mesecih. Za mlajše od 30 let lahko zadostuje šest mesecev.'],
        ['Katero osnovo vnesti?', 'Pri zaposlenem je izhodišče praviloma povprečna bruto plača v osmih mesecih pred mesecem brezposelnosti. Za mlajše od 30 let z dvema priznanima mesecema velja petmesečno obdobje. Meseci prejemanja nekaterih nadomestil se obravnavajo posebej.'],
        ['Prijava in vloga', 'Prijavite se v evidenco in oddajte vlogo praviloma v 30 dneh po prenehanju zavarovanja. Pozna oddaja lahko skrajša izplačevanje. ZRSZ pojasnjuje tudi okoliščine, v katerih rok začasno ne teče.']
      ],
      sources: [ZRSZ, ['ZRSZ – Uradni informativni kalkulator', 'https://www.ess.gov.si/iskalci-zaposlitve/koraki-ob-izgubi-zaposlitve/denarno-nadomestilo/informativni-kalkulator-denarnega-nadomestila/'], ['GOV.SI – Minimalna plača 2026', 'https://www.gov.si/teme/minimalna-placa/']],
      related: [HUB, '/kalkulator-place/', '/denarna-socialna-pomoc/']
    },
    '/bolnisko-nadomestilo/' => {
      name: 'Bolniško nadomestilo', title: 'Bolniško nadomestilo: kdo plača in kako preveriti obračun', icon: 'sick-pay',
      description: 'Vodnik po bolniškem nadomestilu v Sloveniji. Razlika med delovnimi in koledarskimi dnevi, prehod na ZZZS in pregled potrebnih podatkov.',
      metric: ['31. delovni dan', 'Običajni prehod na breme ZZZS pri lastni bolezni'],
      sections: [
        ['Lastna bolezen ali poškodba', 'Pri običajni neprekinjeni odsotnosti zaradi lastne bolezni ali poškodbe prvih 30 delovnih dni praviloma bremeni delodajalca. Od 31. delovnega dne breme praviloma preide na ZZZS. Posebnosti veljajo pri ponovitvi iste bolezni ali izčrpanju letnega bremena delodajalca.'],
        ['Zakaj sta pomembni dve vrsti dni?', 'Pri vprašanju plačnika ZZZS navaja delovne dni. Pri odločanju o daljši zadržanosti zaradi bolezni pa se uporablja obdobje 30 koledarskih dni. Pri izmenskem delu upoštevajte svoj razpored in se o poteku staleža dogovorite z zdravnikom.'],
        ['Kaj preveriti na plačilni listi?', 'Pripravite razlog zadržanosti, datume iz potrdila, število ur odsotnosti, osnovo in odstotek nadomestila. Nega, izolacija in drugi primeri imajo drugačno ureditev, zato najprej potrdite razlog in plačnika pri delodajalcu ali ZZZS.']
      ],
      sources: [['ZZZS – Pogoji in prehod na zdravstveno zavarovanje', 'https://zavarovanec.zzzs.si/denarna-nadomestila/nadomestilo-place-med-zacasno-zadrzanostjo-od-dela/pogoji-ki-jih-je-potrebno-izpolnjevati/'], ['ZZZS – Vprašanja o osnovi in obračunu', 'https://zavarovanec.zzzs.si/pogosta-vprasanja-in-odgovori/zadrzanost-od-dela-in-nadomestilo-place/']],
      related: [HUB, '/kalkulator-delovnih-dni/', '/kalkulator-place/']
    },
    '/denarna-socialna-pomoc/' => {
      name: 'Denarna socialna pomoč', title: 'Denarna socialna pomoč in pomoč za ogrevanje: pogoji in vloga', icon: 'emergency-support',
      description: 'Preverite redno in izredno denarno socialno pomoč pri CSD, osnovni znesek minimalnega dohodka ter možnosti ob izrednih stroških ogrevanja.',
      metric: ['507,43 €', 'Osnovni znesek minimalnega dohodka od aprila 2026'],
      sections: [
        ['Redna pomoč za osnovne življenjske stroške', 'CSD presoja dohodek, družinske okoliščine, premoženje in druge pogoje. Osnovni znesek minimalnega dohodka je podlaga za izračun. Družinski cenzus je odvisen od sestave gospodinjstva in delovne aktivnosti posameznih članov.'],
        ['Izredna pomoč za drva ali poračun elektrike', 'Če izrednega stroška ne morete kriti sami, pri CSD preverite izredno denarno socialno pomoč. Med primeri so nakup drv za ogrevanje in poračun elektrike. V vlogi navedite namen in višino stroška ter pripravite račun ali predračun.'],
        ['Dokazila o porabi', 'Izredno pomoč porabite za odobren namen. eUprava določa rok za porabo po prejemu in rok za dokazila, zato shranite račun in preverite datume v odločbi. Za redno in izredno pomoč uporabite ustrezen obrazec.']
      ],
      sources: [SOCIAL, ['eUprava – Vlogi za redno in izredno pomoč', 'https://e-uprava.gov.si/si/podrocja/sociala-zdravje-smrt/socialne-pomoci/denarna-socialna-pomoc?lang=si']],
      related: [HUB, PAYMENTS, '/nadomestilo-za-brezposelnost/']
    },
    '/kalkulator-place/' => {
      name: 'Kalkulator bruto neto plače', title: 'Kalkulator plače 2026: bruto v neto v Sloveniji', icon: 'salary-slip',
      description: 'Izračunajte neto plačo iz bruto zneska za leto 2026. Pregled prispevkov, obveznega zdravstvenega prispevka in akontacije dohodnine.',
      metric: ['23,10 %', 'Prispevki delavca pred pavšalnim OZP'],
      calculator: :salary, action: 'Izračunajte neto plačo iz bruto zneska',
      note: 'Model velja za izplačila od marca do decembra 2026 pri glavnem delodajalcu v Sloveniji. Predpostavlja polni delovni čas, davčnega rezidenta in bruto znesek od 1521,62 € navzgor. Upošteva splošno olajšavo brez drugih olajšav, dodatkov ali povračil.',
      sections: [
        ['Kako nastane neto plača?', 'Od bruto plače odštejemo prispevke zaposlenega, vključno s prispevkom za dolgotrajno oskrbo, ter obvezni zdravstveni prispevek. Po splošni olajšavi se od preostale osnove izračuna akontacija dohodnine po mesečni lestvici FURS.'],
        ['Kaj primerjati s plačilno listo?', 'Neto plača in nakazilo na račun se lahko razlikujeta zaradi prevoza, prehrane, poračunov ali drugih postavk. Pri plači pod najnižjo prispevno osnovo se del prispevkov od razlike razporedi drugače. Za tak obračun se obrnite na računovodstvo.'],
        ['Mesečna akontacija in letni obračun', 'Mesečna akontacija je plačilo med letom. FURS letno odmero opravi iz skupnih dohodkov in priznanih olajšav. Če uveljavljate otroka ali imate več izplačevalcev, je lahko vaš rezultat drugačen.']
      ],
      sources: [FURS, ['SPOT – Prispevki pri pogodbi o zaposlitvi', 'https://spot.gov.si/sl/poslovanje/zaposlovanje-in-delovno-razmerje/socialna-varnost-in-zavarovanja/'], ['ZZZS – OZP in obdobje veljavnosti', 'https://zavezanec.zzzs.si/prispevki-za-obvezno-zdravstveno-zavarovanje/obvezni-zdravstveni-prispevek/'], ['FURS – Najnižja osnova prispevkov', 'https://www.fu.gov.si/novica/najnizja_osnova_za_obracun_prispevkov_za_socialno_varnost_za_osebe_v_delovnem_razmerju_1-16145/']],
      related: [ANNUAL_TAX, '/kalkulator-ddv/', '/davcni-koledar/', '/delovni-dnevi/', '/nadomestilo-za-brezposelnost/']
    },
    ANNUAL_TAX => {
      name: 'Letni izračun dohodnine', title: 'Kalkulator dohodnine 2027 in 2026 – koliko ostane od plače', icon: 'annual-tax',
      description: 'Iz bruto plač izračunajte letni neto, dohodnino ter predvideno vračilo ali doplačilo. Primerjajte uradno lestvico 2026 in projekcijo za 2027.',
      metric: ['+6,225 %', 'Napovedana uskladitev olajšav in mej razredov za 2027'],
      calculator: :annual_tax, action: 'Izračunajte letni neto po dohodnini',
      note: 'Za slovenskega davčnega rezidenta z rednimi plačami. Leta izberite po letu prejema plač. Za 2026 velja objavljena letna lestvica. Izračun 2027 je projekcija po sprejeti uskladitvi, do objave dokončnih vrednosti FURS. Prispevke in akontacijo vnesite po obračunih, za načrt pa po lastni oceni.',
      sections: [
        ['Kako izračunamo letni neto?', 'Od letnih bruto plač odštejemo plačane obvezne prispevke zaposlenega, vključno z OZP. Pri odmeri dohodnine nato upoštevamo splošno in morebitne vnesene dodatne olajšave. Letni neto je bruto, zmanjšan za prispevke in končno dohodnino. Olajšave zmanjšajo davčno osnovo.'],
        ['Kaj vnesti iz povzetka plač?', 'Seštejte plače, izplačane v izbranem letu, ter obvezne prispevke in že odtegnjeno akontacijo. Če ste imeli enako bruto plačo vseh 12 izplačil, je letni bruto 12-kratnik te plače. Prevoz, prehrano, regres, poslovno uspešnost in druge vire obravnavajte posebej.'],
        ['Kdaj FURS poračuna dohodnino?', 'Plače, prejete v 2026, se odmerjajo v 2027, plače iz 2027 pa v 2028. Če do 15. junija naslednjega leta nimate informativnega izračuna, pri FURS preverite, ali je bil izdan. Če ni bil, eDavki navajajo rok za napoved do 31. julija.'],
        ['Kako prejmem vračilo ali plačam razliko?', 'FURS vračilo po dokončnem informativnem izračunu nakaže na bančni račun. Morebitni zapadli dolg se lahko pobota. Če imate doplačilo, znesek in rok preverite v eDavkih ali na plačilnem nalogu, priloženem izračunu.']
      ],
      sources: [TAX_INDEX_SOURCE, FURS, TAX_RETURN_SOURCE, ['FURS – Informativni izračun, vračilo in doplačilo', 'https://www.fu.gov.si/zivljenjski_dogodki_prebivalci/informativni_izracun_dohodnine/'], ['FURS – Olajšava za vzdrževane družinske člane', 'https://www.fu.gov.si/zivljenjski_dogodki_prebivalci/vzdrzevani_druzinski_clani/']],
      related: ['/kalkulator-place/', '/davcni-koledar/', '/kalkulator-ddv/', HUB]
    },
    '/kalkulator-ddv/' => {
      name: 'Kalkulator DDV', title: 'Kalkulator DDV: izračun neto in bruto cene v Sloveniji', icon: 'vat-receipt',
      description: 'Dodajte ali izločite DDV po stopnjah 22 %, 9,5 % in 5 %. Izračun prikaže davčno osnovo, znesek DDV in končno ceno.',
      metric: ['22 %', 'Splošna stopnja DDV v Sloveniji'],
      calculator: :vat, action: 'Dodajte ali izločite DDV',
      note: 'Izberite stopnjo za obdavčljivo dobavo v Sloveniji. Kalkulator preračuna eno postavko in rezultat zaokroži na cente.',
      sections: [
        ['Cena brez DDV in cena z DDV', 'Pri dodajanju davka pomnožite neto ceno s stopnjo. Pri izločanju DDV bruto ceno delite z 1 plus stopnja in od bruto zneska odštejte osnovo.'],
        ['Katero stopnjo izbrati?', 'Poleg splošne stopnje veljata nižja stopnja 9,5 % za določeno blago in storitve ter posebna nižja stopnja 5 % za določene publikacije. Uvrstitev konkretne dobave preverite pri FURS.'],
        ['Več postavk in zaokroževanje', 'Na računu z različnimi stopnjami najprej ločite davčne osnove po stopnjah. Seštevek posamično zaokroženih postavk se lahko za cent razlikuje od zneska, zaokroženega na ravni skupne osnove.']
      ],
      sources: [['FURS – Davek na dodano vrednost', 'https://www.fu.gov.si/davki_in_druge_dajatve/podrocja/davek_na_dodano_vrednost_ddv/'], ['FURS – Primeri stopenj DDV', 'https://www.fu.gov.si/zivljenjski_dogodki_prebivalci/nakup_prek_spleta_iz_tretjih_drzav']],
      related: ['/kalkulator-place/', '/davcni-koledar/']
    },
    '/predloge-urnikov/' => {
      name: 'Predloge urnikov za tiskanje', title: 'Predloge urnikov za tiskanje: delovni, šolski in tedenski', icon: 'schedule-templates',
      description: 'Pripravite prazen delovni razpored, šolski urnik ali tedenski planer. Izberite začetek tedna in natisnite predlogo ali jo shranite kot PDF.',
      sections: [
        ['Delovni razpored', 'Vpišite predvideni začetek in konec izmene ter ime osebe ali ekipe. Za ponavljajoč se cikel uporabite razpored izmen. Predloga služi načrtovanju prihodnjih ur, podatke o dejansko opravljenem delu vodite v evidenci.'],
        ['Šolski urnik', 'V polja vpišite predmete in učilnice. Oštevilčene učne ure omogočajo uporabo pri različnih šolskih urnikih. Za shranjevanje ure začetka in prostora uporabite urejevalnik šolskega urnika.'],
        ['Tedenski planer', 'Zapišite obveznosti in pustite prostor med jutranjim, popoldanskim in večernim blokom. Za tedenski koledar z vpisanimi slovenskimi prazniki odprite ločeno orodje.']
      ],
      sources: [['GOV.SI – Razporejanje dela in evidenca delovnega časa', 'https://www.gov.si/teme/delovna-razmerja/']],
      related: ['/razpored-izmen/', '/solski-urnik/', '/tedenski-koledar/', '/koledar-za-tiskanje/']
    },
    '/astronomski-koledar/' => {
      name: 'Astronomski koledar', title: 'Astronomski koledar 2026–2030 za Slovenijo', icon: 'sky-calendar',
      description: 'Na enem mestu poglejte lunine mene, enakonočja, solsticije, mrke in opazovalne noči Perzeidov. Filtrirajte leto in vrsto dogodka.',
      sections: [
        ['Berite dogodke v slovenskem času', 'Lunine mene in začetki letnih časov so trenutki, preračunani v Europe/Ljubljana. Pozimi je ura prikazana v CET, poleti v CEST. Zato je lahko krajevni datum drugačen od datuma v viru UTC.'],
        ['Preverite vidnost pred odhodom', 'Pri mrku je označen globalni maksimum. Dogodek je lahko iz Slovenije viden le delno ali sploh ne. Izberite svoje mesto na strani mrka, kjer so prikazani lokalni časi in vidnost nad obzorjem.'],
        ['Opazovalne noči Perzeidov', 'Tri avgustovske noči so v koledarju prikazane kot predlogi za opazovanje. Podrobnosti o temi in mesečini so na strani Perzeidov.']
      ],
      sources: [['U.S. Naval Observatory – Lunine mene', 'https://aa.usno.navy.mil/data/MoonPhases'], ['U.S. Naval Observatory – Enakonočja in solsticiji', 'https://aa.usno.navy.mil/data/Earth_Seasons'], ['NASA – Sončni mrki 2021–2030', 'https://eclipse.gsfc.nasa.gov/SEdecade/SEdecade2021.html'], ['NASA – Lunini mrki 2021–2030', 'https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2021.html']],
      related: ['/lunine-mene/', '/letni-casi/', '/soncni-vzhod-in-zahod/', '/dolzina-dneva/']
    }
  }.freeze

  FAMILY_PATHS = %w[/otroski-dodatek/ /pomoc-ob-rojstvu-otroka/ /starsevski-dopust/ /starsevski-dodatek/ /znizano-placilo-vrtca/].freeze
  SUPPORT_PATHS = %w[/nadomestilo-za-brezposelnost/ /bolnisko-nadomestilo/ /denarna-socialna-pomoc/].freeze
  SEARCH_TERMS = {
    HUB => 'socialni prejemki socialni transferji pravice iz javnih sredstev vloga CSD',
    '/otroski-dodatek/' => 'izračun otroškega dodatka koliko znaša otroški dodatek dohodkovni razred',
    '/starsevski-dodatek/' => 'višina starševskega dodatka študentka brezposelna porodniška',
    '/nadomestilo-za-brezposelnost/' => 'izračun nadomestila za brezposelnost koliko znaša nadomestilo na zavodu',
    '/starsevski-dopust/' => 'porodniška porodniški dopust očetovski dopust',
    '/pomoc-ob-rojstvu-otroka/' => 'enkratna pomoč novorojenček',
    '/znizano-placilo-vrtca/' => 'subvencija vrtca plačilo cena oprostitev',
    '/denarna-socialna-pomoc/' => 'izredna denarna socialna pomoč drva ogrevanje poračun elektrike',
    '/bolnisko-nadomestilo/' => 'bolniška bolniški stalež',
    '/kalkulator-place/' => 'bruto neto plača prispevki akontacija dohodnine',
    ANNUAL_TAX => 'dohodnina 2027 2026 letni bruto neto letna plača odmera dohodnine vračilo doplačilo dohodnine davčna lestvica olajšava',
    '/kalkulator-ddv/' => 'izračun davka na dodano vrednost',
    '/predloge-urnikov/' => 'predloga urnika delovni urnik šolski urnik tedenski planer za tiskanje',
    '/astronomski-koledar/' => 'astronomski dogodki opazovanje neba meteorski roj'
  }.freeze

  def self.pages
    PAGES.transform_values { |page| page.slice(:title, :description).merge(family: 'slovenian_resource') }
  end

  def self.tool_rows(paths)
    paths.map do |path|
      page = PAGES.fetch(path)
      [path, page.fetch(:name), page.fetch(:icon), page.fetch(:description)]
    end
  end
end
