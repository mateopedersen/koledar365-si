class SlovenianResourceEditorial
  GUIDES = {
    '/socialni-prejemki/' => {
      theme: 'family', action: 'Poišči prejemek', fact: ['CSD, ZRSZ in ZZZS', 'Vodnik do pristojnega organa in vloge'],
      question: 'Katere socialne prejemke lahko uveljavljam?',
      answer: 'Za vsako pravico najprej preverite, kateri organ jo obravnava. Če se vam je rodil otrok, primerjajte enkratno pomoč, mesečni otroški dodatek ter dopust in prejemke ob rojstvu. Ob izgubi zaposlitve najprej preverite zavarovalno dobo in rok za prijavo na ZRSZ.',
      heading: 'Tri pogoste poti',
      steps: [
        ['Rojstvo otroka', 'Pri CSD preverite državno pomoč ob rojstvu, otroški dodatek in prejemek glede na starševsko zavarovanje.'],
        ['Izguba zaposlitve', 'Na ZRSZ uredite prijavo in posebej vložite vlogo za nadomestilo.'],
        ['Izredni strošek', 'Če stroška ne morete pokriti iz dohodka, s predračunom ali računom preverite možnosti pri CSD.']
      ],
      routes: %w[/pomoc-ob-rojstvu-otroka/ /nadomestilo-za-brezposelnost/ /izplacila-socialnih-transferjev/]
    },
    '/otroski-dodatek/' => {
      theme: 'family', action: 'Izračunaj otroški dodatek',
      question: 'Koliko znaša otroški dodatek za dva otroka?',
      answer: 'Za primer vzemimo družino, ki ima po merilih CSD 650 € mesečnega dohodka na osebo in dva otroka v osnovni šoli. V 5. razredu je osnovni znesek za prvega 62,06 €, za drugega pa 72,42 €. Skupaj je to 134,48 € na mesec pred morebitnimi povečanji.',
      heading: 'Pred prvo vlogo',
      steps: [
        ['Izberite obrazec', 'Na eUpravi je poenostavljena vloga za otroški dodatek, vrtec in državno štipendijo. Če hkrati uveljavljate tudi denarno socialno pomoč, izberite splošni obrazec.'],
        ['Preberite odločbo', 'Preverite razred, vrstni red otrok in datum, od katerega je pravica priznana. Podaljšanje CSD praviloma preveri sam.']
      ],
      routes: %w[/znizano-placilo-vrtca/ /izplacila-socialnih-transferjev/]
    },
    '/pomoc-ob-rojstvu-otroka/' => {
      theme: 'family', action: 'Preveri rok za vlogo',
      question: 'Kdaj zaprositi za enkratno pomoč za novorojenčka?',
      answer: 'Če vlogo oddate pred porodom, prvi možni dan izračunajte iz predvidenega datuma. Če jo oddate po rojstvu, uporabite dejanski datum rojstva. Za otroka, rojenega 10. septembra, je 60. koledarski dan po rojstvu 9. november.',
      heading: 'Dve ločeni vlogi',
      steps: [
        ['Državna pomoč', 'Izberite vlogo za pravice ob rojstvu otroka na svojem CSD. Pravico za istega otroka uveljavlja eden od staršev.'],
        ['Pomoč občine', 'Na eUpravi izberite občino in preverite, ali ponuja pomoč, do kdaj sprejema vloge ter katera dokazila zahteva.']
      ],
      routes: %w[/starsevski-dopust/ /otroski-dodatek/]
    },
    '/starsevski-dopust/' => {
      theme: 'family', action: 'Načrtuj porodniški dopust',
      question: 'Kdaj se začne porodniška in koliko dni lahko prenesem?',
      answer: 'Če je predvideni porod 15. junija, je predvideni začetek materinskega dopusta 18. maja. Pri prenosu 40 dni z očeta na mater je razdelitev starševskega dopusta 200 dni za mater in 120 dni za očeta. Očetovski dopust se ureja posebej.',
      heading: 'Kaj uredita starša',
      steps: [
        ['Začetek odsotnosti', 'Uporabite predvideni datum poroda. Pri zgodnejšem rojstvu ali potrebi po podaljšanju preverite potek s CSD.'],
        ['Prenos in nadomestilo', 'Dogovorita se o prenosu dni in datumu izrabe. Na CSD preverita osnovo za nadomestilo in način izrabe neprenosljivega dela.']
      ],
      routes: %w[/starsevski-dodatek/ /pomoc-ob-rojstvu-otroka/]
    },
    '/starsevski-dodatek/' => {
      theme: 'family', action: 'Preveri datume za vlogo',
      question: 'Ali lahko dobim starševski dodatek, če sem študentka ali brezposelna?',
      answer: 'Če ob rojstvu nimate pravice do starševskega nadomestila, pri CSD preverite starševski dodatek. Najprej povejte, ali ste bili v zadnjih treh letih zavarovani za starševsko varstvo. To vpliva na to, kateri postopek je primeren.',
      heading: 'Kateri datum uporabiti?',
      steps: [
        ['Pred rojstvom', 'Uporabite predvideni datum poroda in pripravite vlogo pri CSD glede na materino prebivališče.'],
        ['Po rojstvu', 'Za priznanje od rojstva uporabite dejanski datum in oddajte vlogo v predpisanem roku. V odločbi preverite začetek in konec pravice.']
      ],
      routes: %w[/starsevski-dopust/ /izplacila-socialnih-transferjev/]
    },
    '/znizano-placilo-vrtca/' => {
      theme: 'family', action: 'Izračunaj plačilo vrtca',
      question: 'Koliko bom plačal za vrtec po subvenciji?',
      answer: 'Pri ceni programa 510 € in mesečnem dohodku 750 € na osebo je osnovni delež staršev v 6. razredu 43 %. Mesečni znesek pred morebitnimi občinskimi znižanji je 219,30 €. Oprostitev za mlajšega sorojenca lahko preverite v istem izračunu.',
      heading: 'Pred vstopom v vrtec',
      steps: [
        ['Poiščite ceno programa', 'Uporabite ceno za starostno skupino in program, v katerega je otrok sprejet. Različni občinski ceniki lahko dajo različne rezultate.'],
        ['Preverite odločbo in račun', 'Poglejte dohodkovni razred in morebitno oprostitev. Odbitek prehrane zaradi odsotnosti preverite pri vrtcu.']
      ],
      routes: %w[/otroski-dodatek/ /solski-koledar/]
    },
    '/nadomestilo-za-brezposelnost/' => {
      theme: 'work', action: 'Izračunaj bruto nadomestilo',
      question: 'Kolikšno je nadomestilo po izgubi službe?',
      answer: 'Pri osnovi 2200 € je v prvem obdobju 80 % osnove oziroma 1760 € bruto. V četrtem mesecu je pri isti osnovi 60 % oziroma 1320 € bruto, če je pravica priznana tudi za ta mesec. Pri višji osnovi izračun omeji zakonska zgornja meja za posamezno obdobje.',
      heading: 'Kako do uradne odmere?',
      steps: [
        ['Prijava in zahtevek', 'Pri Zavodu se prijavite v evidenco brezposelnih in oddajte vlogo. Preverite rok, če vmes nastopi bolezen ali nova zaposlitev.'],
        ['Osnova in trajanje', 'V uradnem kalkulatorju ZRSZ uporabite zavarovalno dobo in relevantno bruto osnovo. V odločbi preverite trajanje in bruto znesek.']
      ],
      routes: %w[/kalkulator-place/ /denarna-socialna-pomoc/]
    },
    '/bolnisko-nadomestilo/' => {
      theme: 'work', action: 'Preveri obračun bolniške',
      question: 'Kdo plača bolniško in kaj naj preverim na plačilni listi?',
      answer: 'Pri neprekinjeni lastni bolezni sta datum začetka staleža in prvi dan, ko bi morali opravljati delo, lahko različna. Če imate izmenski razpored, primerjajte potrdilo z dejanskim urnikom. Na obračunu mora biti jasno, za katere ure in po kateri osnovi je izračunano nadomestilo.',
      heading: 'Podatki za pregled obračuna',
      steps: [
        ['Potrdilo in urnik', 'Preverite razlog zadržanosti, obdobje od–do in koliko ur bi po urniku delali.'],
        ['Plačilna lista', 'Pri različnih osnovah ali odstotkih primerjajte posamezne vrstice in vprašajte delodajalca, kdo nosi breme izplačila.']
      ],
      routes: %w[/razpored-izmen/ /kalkulator-delovnih-dni/]
    },
    '/denarna-socialna-pomoc/' => {
      theme: 'work', action: 'Preveri možnosti pomoči',
      question: 'Kako zaprositi za pomoč pri stroških ogrevanja?',
      answer: 'Če pred zimo potrebujete drva in stroška ne zmorete sami, zabeležite predvideni znesek in priložite predračun, če ga imate. Na CSD vprašajte za izredno denarno socialno pomoč za ta strošek. Po odobritvi uporabite sredstva za navedeni namen in shranite dokazilo.',
      heading: 'Pripravite se na oddajo vloge',
      steps: [
        ['Opredelite strošek', 'Pri izredni pomoči opišite, zakaj je strošek povezan s preživljanjem in zakaj ga ne morete kriti iz dohodka.'],
        ['Shranite odločbo in račun', 'V odločbi poiščite rok za porabo in predložitev dokazil. Priložite dokazilo za strošek, ki je bil odobren.']
      ],
      routes: %w[/socialni-prejemki/ /izplacila-socialnih-transferjev/]
    },
    '/kalkulator-place/' => {
      theme: 'money', action: 'Izračunaj neto plačo',
      question: 'Koliko dobim neto pri 2500 € bruto?',
      answer: 'V modelu za leto 2026 znaša ocenjena neto plača 1594,83 €. Od bruto zneska odštejemo 577,50 € prispevkov zaposlenega, 39,36 € OZP in 288,31 € akontacije dohodnine. Prehrana, prevoz in posebne olajšave lahko nakazilo spremenijo.',
      heading: 'Primerjava z obračunom plače',
      steps: [
        ['Vzemite bruto plačo', 'Na plačilni listi poiščite bruto znesek iz rednega delovnega razmerja. Izločite povračila in samostojne postavke, ki jih model ne vključuje.'],
        ['Preverite odtegljaje', 'Primerjajte prispevke, OZP in mesečno akontacijo. Razlike pri vzdrževanih članih preverite pri računovodstvu, letno odmero pa pri FURS.']
      ],
      routes: %w[/kalkulator-dohodnine/ /davcni-koledar/ /delovni-dnevi/]
    },
    SlovenianResources::ANNUAL_TAX => {
      theme: 'money', action: 'Izračunaj letno dohodnino',
      question: 'Kako vem, ali dobim vračilo ali doplačilo?',
      answer: 'Primerjajte letno odmero s seštevkom akontacij na plačilnih listah. Če ste med letom plačali 3600 € akontacije in končna dohodnina znaša 3300 €, je razlika 300 € v vašo korist. Končni neto upošteva ta poračun samo enkrat.',
      heading: 'Od plačilnih list do eDavkov',
      steps: [
        ['Zberite letne zneske', 'Preverite bruto plače, prispevke in akontacijo v povzetkih vseh delodajalcev. Za načrt za 2027 lahko vnesete svoje predvidene zneske.'],
        ['Vnesite priznane olajšave', 'Splošno olajšavo upošteva kalkulator. Med dodatne vpišite samo zneske, ki jih lahko uveljavljate, na primer olajšavo za vzdrževane družinske člane.'],
        ['Preverite odmero', 'V eDavkih preverite informativni izračun in navodila za ugovor. Za plačilo oziroma vračilo velja rok iz vašega izračuna ali odločbe.']
      ],
      routes: %w[/kalkulator-place/ /davcni-koledar/]
    },
    '/kalkulator-ddv/' => {
      theme: 'money', action: 'Izračunaj DDV',
      question: 'Kako iz bruto cene izračunam DDV?',
      answer: 'Pri ceni 109,50 € z že vključenim 9,5-odstotnim DDV je osnova 100 € in davek 9,50 €. Bruto ceno delite z 1,095 in razliko zaokrožite na cente.',
      heading: 'Primerjajte obe smeri',
      steps: [
        ['Cena brez DDV', 'Za pripravo cene z davkom vnesite neto znesek in izberite Dodaj DDV.'],
        ['Cena na računu', 'Za razčlenitev končne cene vnesite bruto znesek in izberite Izloči DDV. Pri več stopnjah preračunajte vsako davčno osnovo posebej.']
      ],
      routes: %w[/davcni-koledar/ /kalkulator-place/]
    },
    '/predloge-urnikov/' => {
      theme: 'print', action: 'Izberi predlogo', fact: ['A4 ležeče', 'Tri predloge za ročni vpis'],
      question: 'Primer: urnik za šolski teden',
      answer: 'Izberite šolski urnik in kot datum vnesite sredo, 6. september 2028. Predogled izpiše datume od ponedeljka, 4. septembra, do petka, 8. septembra. Če želite isti list znova uporabiti, izberite »Počisti datum« in pustite prosto vrstico za obdobje.',
      heading: 'Kako pripraviti en list',
      steps: [
        ['Odprite predogled tiskanja', 'Kliknite »Natisni ali shrani PDF«. Izberite ležeči format A4 in preverite, ali je v predogledu celotna mreža.'],
        ['Natisnite ali shranite', 'V pogovornem oknu izberite tiskalnik ali možnost »Shrani kot PDF«. Če želite izkoristiti več prostora, v nastavitvah izklopite glavo in nogo brskalnika.']
      ],
      routes: %w[/razpored-izmen/ /solski-urnik/ /tedenski-koledar/]
    }
  }.freeze
end
