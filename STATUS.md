# Koledar365 — devam ve canlı yayın durumu

## Güncel yayın doğrulaması — 20.10.2026

- Ana dalın güncel temel sürümü `1197d74df2`. Kaynak ve statik çıktı için son PageSpeed düzeltmesi hazırlanıyor; henüz Cloudflare production’a gönderilmedi.
- Google PSI’nin canlı aylık takvim ölçümünde bulunan tek puan kaybı, 15 galeride ekrana göre büyük indirilen önizlemelerdi. 2.820 galeri önizlemesi ve 15 düzenleyici örneği 425×600’den 212×300’e indirildi; 8.689 HTML sayfasında boyutlar eşleştirildi. Görsel aktarımı 12.719.024 bayt azaldı. PDF/WebP baskı dosyalarından hiçbirine dokunulmadı.
- Paylaşım görsellerinden 276 eski ve hiçbir sayfanın artık kullanmadığı PNG kaldırıldı. Güncel Open Graph görselleri korundu; statik çıktı Cloudflare Free sınırının altında: **19.720 dosya / 20.000**.
- Statik SEO/iç bağlantı denetimi geçti: 8.912 HTML, 8.888 indexlenebilir URL, 12.505 iç hedef, 8.888 sitemap girdisi ve 52 aylık/yıllık inline galeri. Dosya üretim doğrulaması: **2.820/2.820 PDF–WebP çifti**, Ay verisi 208 çift / 53 temel sayfa, sorun yok.
- Önceki canlı sürümde ana sayfa PSI mobil ve masaüstü 100’dü; Şubat 2027 mobil PSI 98’di. Yeni optimizasyon yayınlandıktan sonra aylık, yıllık ve boş takvim sayfalarında mobil/masaüstü Google PSI yeniden ölçülecek; raporlar tamamlanmadan tüm sayfaların 100 olduğu söylenmeyecek.
- Ücretsiz Cloudflare Pages/GitHub hattı kullanılıyor; yeni ücretli servis veya VPS açılmadı.

## Son tam denetim — 20.10.2026 21:40 +0300

- Yerel statik üretim tamamlandı ve doğrulandı: 19.670 dosya, 2.820/2.820 PDF–WebP çifti, 8.912 HTML, 8.888 indexlenebilir URL ve 52 aylık/yıllık galeri. `script/audit_static.rb`, `script/finalize_static.rb`, `script/verify_static.mjs` ve `script/verify_vector_identity.rb` geçti; vektör imzaları 9.638 sayfada 402.010 ikon örneğinde doğrulandı.
- Rails testleri: 58 test, 2.198 doğrulama, 0 hata/başarısızlık.
- Lighthouse 13.5: 35 sayfa ailesi mobil ve masaüstünde (70 kontrol) erişilebilirlik, iyi uygulamalar ve SEO kategorilerinin tamamında 100. Ayrı 13 sayfalık mobil/masaüstü performans matrisi: masaüstü performans 13/13 100; mobil performans 7/13 100 ve 6/13 99. Mobilde erişilebilirlik/iyi uygulamalar/SEO 13/13 100. Mobilde 99 kalan sayfalar: `/koledar/2027/`, `/prazniki/2027/`, `/prazniki/marijino-vnebovzetje/`, `/koledar-z-imenom/ana/`, `/lunin-koledar/`, `/solske-pocitnice/`. 99 değerleri 100 gibi sunulmuyor. Ham rapor özeti: `evidence/pagespeed-template-audits.json`; ayrıntılı Lighthouse raporları `tmp/qa/pagespeed/templates-final/` ve `tmp/qa/pagespeed/families-final/`.
- Yeni kontrast düzeltmeleri tarih hesaplayıcı ve okul tatili sayfasında uygulandı. Tüm 70 aile kontrolünde kontrast kusuru kalmadı.
- İlk GitHub CI tarayıcı kontrolü, 320 px genişlikte kök sayfanın 322 px taşması yüzünden Chromium/WebKit/Android/iPhone profillerinde başarısız olmuştu. 359 px ve altında kök yatay taşmayı kırpan dar kapsamlı CSS düzeltmesi eklendi. Bu düzeltme henüz CI’da doğrulanmadı; kaynaklar `main` dalına gönderilip yeni tarayıcı workflow’u bekleniyor. Önceki CI: https://github.com/mateopedersen/koledar365-si/actions/runs/39472164379 (başarısız dar ekran testi); aynı kaynakla statik yayın hazırlığı başarılı: https://github.com/mateopedersen/koledar365-si/actions/runs/39472164469.
- Bu son CSS değişiklikleri henüz canlıda değil. Canlıya gönderildikten sonra tarayıcı CI, Cloudflare dağıtımı ve sitemap’teki 8.888 URL’nin HTTPS yanıtı tekrar doğrulanacak. Sonuç gelmeden “bütün canlı URL’ler geçti” denmeyecek.

## PageSpeed ve erişilebilirlik — devam ediyor

- Kaynak optimizasyonu yerel `582a7c76f2` commitinde; güncel `origin/main` (okul ve üniversite takvimleri + tarih hesaplayıcı rengi) `856fc5dd1f` ile korunarak birleştirildi. Henüz bu optimizasyon canlı değil.
- Gerçek mobil başlangıç: 95 / 94 / 100 / 100. Google raporu: https://pagespeed.web.dev/analysis/https-koledar365-si/gmd1vmgtnk?form_factor=mobile . Anahtarsız PSI API kota 0; web arayüzü çalışır.
- 69 şehir + 58 özel gün fotoğrafı için 856 içerik özetli AVIF/WebP web kopyası üretildi. Özgün lisanslı fotoğraflar, PDF/WebP 600 ppi katalog baytları korunur. Şehir fotoğrafında 256 KB JPG yerine uygun AVIF örneği 42 KB.
- Ana sayfa CSS'i HTML'de; iç sayfalarda tek CSS. assets.json başlangıç beklemesi kaldırıldı. Gerçek başlangıç hatasına neden olan TDZ düzeltildi; istemci hazırlığı tüm tanımlardan sonra başlar. Mobil galeri içeriği CSS ile ilk boyamada kararlı; no-JS yedeği korunur. Kontrast ve dokunma hedefleri düzeltildi.
- Cloudflare zone RUM otomatik betik ekliyordu; Disable + Update kaydedildi ve yeniden yüklemede Disable=1 doğrulandı. Canlı HTML'de beacon yok; CSP gevşetilmedi.
- Yerel ilk tur 26 Lighthouse raporu: `tmp/qa/pagespeed/templates-round-1/`. İkinci tur mobilde aylık/yıllık/isim/boş/ay/tatil detayı/hakkında/gizlilik türlerinde erişilebilirlik 100 oldu. Bazı ölçümler yerel HTTP sunucusunun dar bağlantı kuyruğundan reset aldı; bu sunucu 128 kuyrukla düzeltildi. Ham raporlar saklandı; 100 olmayan ölçümler gizlenmez.
- İkinci tur durduruldu; son kaynaklar ve yeni ana dal birleşimi için tam Ruby üretimi çalışıyor: session 27477, `tmp/qa/pagespeed/full-build.log`; Rails testleri session 36482, `tmp/qa/pagespeed/rails-tests.log`. Geliştirme DB'si `tmp/qa/pre-performance-development.sqlite3` yedeği alındı. Mevcut 3650 sunucusu korunur. Yeni QA gzip sunucusu 3655 session 50762; 3654 eski QA sunucusu da yalnız bu işe aittir.
- Sıradaki: tam üretimin/testlerin sonucunu denetle; son çıktıyı mobil/masaüstü ve bütün sayfa aileleri/52 dönem için ölç; kalan gerçek sorunları düzelt; kaynakları yayınla ve Cloudflare sonrasında resmi PSI + tüm URL/varlık taramasıyla doğrula. Henüz bütün URL'ler 100 olarak raporlanamaz.

## Aylık takvim metinleri — canlıda doğrulandı

- Ortak ay şablonunda uzun tatil ve özel gün adları dar gün hücrelerinde tek satırda üç noktayla kısalır; kelimeler bölünmez ve komşu hücreye taşmaz. Tam ad bağlantı metninde ve `title` niteliğinde korunur. Kural ana sayfanın takvim ızgarasında da geçerlidir. İki olaylı dar hücrede dikey kesme kaldırıldı.
- Cloudflare Pages dağıtımı `f7ca7688-c429-45f4-ab8b-82d42cab497e` başarılı oldu; `https://koledar365.si/` özel alan adı yeni yayını sunuyor. 2027–2030 arasındaki 48 aylık ve 4 yıllık canlı URL'nin tümü HTTP 200, her birinde 15 galeri tasarımı, yeni CSS varlıkları ve sürüm manifestiyle eşleşen kaynak SHA-256'ları doğrulandı. 48 aydaki 313 olay bağlantısının tam başlığı da korundu. Kanıt: `evidence/calendar-labels-live-verification.json`.
- Canlı tarayıcıda Şubat 2027 ve Nisan 2030 görsel olarak incelendi. Nisan 2030'da aynı dar hücredeki iki olay da ayrı satırda kalıyor; Şubat 2027'de uzun adlar kelime ortasında bölünmeden kısalıyor. 390 px telefon görünümü yerelde ayrıca ölçüldü. Kanıtlar: `evidence/calendar-labels-live-feb-2027.png`, `evidence/calendar-labels-live-apr-2030.png`, `evidence/calendar-labels-browser-layout.json`.
- Kaynak düzeltmesi `7d49796b4fb0a58f03595f174ded512900435291`; otomatik statik çıktı `1fe95b074ea999105e7cae0c2252d37eb383809d`. Tam CI ve yeniden üretim başarılı: https://github.com/mateopedersen/koledar365-si/actions/runs/39461414151. Ruby statik üretimi ve Cloudflare yayın hazırlığı başarılı: https://github.com/mateopedersen/koledar365-si/actions/runs/39461414134.

## Galeri düzeni — tamamlandı

- 2027–2030 arasındaki 48 aylık ve 4 yıllık sayfanın tamamında takvim ve 15 tasarımlı galeri yan yana başlar. Tam takvim genişletilebilir; galeriye dönüş tek düğmedir. Mobilde takvim/ayar paneli açılır bir özet satırıdır, galeri ilk ekranda görünür.
- Boş takvim, kişiselleştirme, isim, günlük/haftalık/aile/iş vardiyası/okul/doğum günü planlayıcıları, iş günü, ay ve tatil galerilerinde aynı düzen uygulanır. Uzun form ve tablolar galeriyi aşağı itmez; tatil galerisi kapalı alt bölümden çıkarıldı. Tek pratik Slovence paragraf PDF, 600 ppi WebP, ZIP ve marka imzasını açıklar.
- Statik denetim: 8.743 galerili sayfanın tamamında açık galeri, 15 tasarım, ortak düzen ve açıklama doğrulandı. 52 standart galerinin dosyaları tam yıl/ay kataloğuyla birebir eşleşir.
- Tarayıcı denetimi: yerelde 148, production üzerinde 134 görünüm geçti. 52 dönem masaüstü 1440×900 ve mobil 390×844 boyutlarında tek tek açıldı. Diğer 15 örnek galeri de iki boyutta doğrulandı; yerelde 376×668 telefon ve 768×1024 tablet sınırları ayrıca incelendi.
- Canlı dosya denetimi: 780 PDF + 780 WebP/ZIP + 780 önizleme = 2.340 bağlantı HTTP 200, doğru MIME ve katalog boyutlarıyla geçti. 52 canlı HTML'de 780 tasarım ve 1.560 doğrudan indirme eşleşti. Dokuz örneğin bayt özeti eşleşti. Tarayıcıdan indirilen 2030 yıllık PDF ve Şubat 2028 iki sayfalı WebP ZIP de SHA-256 ile doğrulandı.
- Filtreler (5 siyah-beyaz / 15 tüm tasarımlar), yıllık takvimi 12 ayla genişletme/daraltma, planlayıcı kayıt ekleme/silme ve kâğıt seçimi doğrulandı. Bu düzenlemeye ilişkin başarısız kontrol veya yayın erişim engeli kalmadı.
- Kanıtlar: evidence/gallery-workspace-local-ux.json, evidence/gallery-workspace-live-ux.json, evidence/gallery-live-assets.json, evidence/inline-calendar-live.json; canlı ekranlar evidence/inline-monthly-gallery-live.png ve evidence/inline-annual-gallery-live.png.
- Yeni tam CI başarılı: https://github.com/mateopedersen/koledar365-si/actions/runs/39456506993 . Otomatik yayın üretimi de başarılı: https://github.com/mateopedersen/koledar365-si/actions/runs/39456507000 .

## Canlı yayın

- Ana adres: https://koledar365.si/ — HTTPS üzerinden erişilebilir.
- Cloudflare Pages projesi koledar365-si; production branch main; otomatik dağıtımlar açık.
- Son doğrulanmış uygulama dağıtımı başarılı: https://f7ca7688.koledar365-si.pages.dev/ — deployment f7ca7688-c429-45f4-ab8b-82d42cab497e; kaynak commit 1fe95b074. 20.10.2026 20:11 +0300 tarihinde başarılı; koledar365.si özel alanı da aynı yayını sunuyor.
- Repo herkese açık: https://github.com/mateopedersen/koledar365-si
- Cloudflare Preview: https://e689a94c.koledar365-si.pages.dev/
- Son yerel statik üretimde 18.750 dosya ve 2.820 eşleşmiş PDF/WebP çifti doğrulandı. 8.912 HTML, 8.888 indexlenebilir URL ve 11.434 iç hedefle statik/SEO kontrolü geçti.
- Ücretli ürün, VPS, ücretli Containers, R2 veya ücretli veritabanı açılmadı. Mevcut Cloudflare Pages Free kullanıldı.

## Uygulama ve işlevler

- Ruby 4.0.7 / Rails 8.1.4 kaynak uygulaması korunur ve Linux/PostgreSQL/Docker üzerinde CI'da gerçek test edilir. Ruby günlük ve tarihli içeriği derler; Pages'e statik Slovence HTML/asset yayınlanır.
- Ücretsiz prodüksiyonda sürekli Rails/DB sunucusu yoktur. İstemci tarafı gerçek Ruby/Wasm takvim ve Prawn çıktısı üretir; hava durumu için küçük Cloudflare Pages Function kullanılır. Kişisel not/olay/özel fotoğraf cihazda kalır.
- 69 Slovenya belediye merkezi seçilebilir; kaynak/lisansı gösterilen gerçek şehir fotoğrafları ve seçilen şehre göre MET Norway hava durumu çalışır. Canlı Bled görünümü doğrulandı.
- Dört yıl 2027–2030; her yılın 12 ayı, yıllık ve diğer standart takvim türleri için 15 PDF + 15 WebP tasarımı hazırdır. İsim sayfalarında 8.561 popüler isim için 15 tasarım; özel aralık ve kullanıcı planları tarayıcı Ruby motoruyla talep üzerine oluşturulur.
- Ana sayfa, özel gün/tatil ayrıntıları, Hakkımızda, gizlilik/çerez, lisans, özel 404 ve araç akışları yayımdadır. Karanlık mod yoktur; çerez tercihleri ince alt şerit olarak kalır.
- Canlı takvim galerileri: 52 sayfanın her birinde 15 dönem tasarımı, doğrudan PDF ve WebP/ZIP bağlantıları, gerçek dönem önizlemeleri ve renk filtreleri vardır. Takvim kompakt yan paneldedir; mobilde açılır. Ayrı bir printable sayfasına gitmek gerekmez.
- Admin/yayın yönetimi GitHub izinli workflow'ları ile yapılır; herkese açık bir admin paneli yoktur.

## Dosya üretimi ve doğrulama

- 2.820/2.820 eşleşmiş PDF/WebP çiftinin ikinci bağımsız raster kontrolü geçti; 6.452 sayfa, hata 0. 48×15 aylık = 720, 4×15 yıllık = 60 çift; kalan standart tür/scope'lar da sürüm kataloğunda yer alır.
- PDF'ler gerçek 600 ppi fiziksel sayfa ölçüsünde, gerçek sRGB WebP'ye dönüştürülmüş ve her sayfada Koledar365 marka imzasını taşır. PDF yeniden 600 ppi rasterleştirilip WebP ile karşılaştırılır; köşe boşluğu, hizalama ve imza da denetlenir.
- Canlı örnek PDF ve WebP ZIP 200 döndürdü; sunulan baytların SHA-256 değerleri release manifest ile birebir eşleşti. ZIP testinden geçti; 2 sayfa, 600 ppi, manifest ve README bulundu. İki biçim de bir yıllık immutable cache ve noindex alıyor.
- Statik release manifestinde 18.749 dosya (manifest ile toplam 18.750), 2.820 çift, issues=[]; SEO taraması 8.912 HTML, 8.888 indexlenebilir URL ve 11.434 iç hedefte hata bulmadı.
- Canlı Şubat 2028 galerisinden tarayıcı aracılığıyla PDF, WebP ve çok sayfalı WebP ZIP doğrudan indirildi. SHA-256 değerleri release manifest ile aynı; WebP 4961 × 7016 piksel ve sRGB, ZIP iki 600 ppi sayfa içeriyor. 2030 yıllık sayfasında 12 normal ay tablosu ve ardından 15 yıllık tasarım doğrulandı. Kanıt: evidence/inline-calendar-live.json, evidence/inline-gallery-ui-downloads.json ve evidence/inline-monthly-gallery-live.png.
- Yerel test: 58 test / 2.194 doğrulama / 0 hata. Yeni 52 inline galeri kontrolü de geçti. Yeni yerel SEO denetimi 8.905 sayfada ve özel gün denetimi 58 sayfa / 232 ICS çıktısında geçti. İlk yeni CI çalışması (39452494100), SEO sayfa bağlantısı denetiminin yeni /prenosi/ dosyalarını tanımaması nedeniyle durdu. Denetim şimdi yalnızca katalogda izin verilen ve gerçekten mevcut dosyaları kabul eder; düzeltilmiş sürümün tam CI tekrarı başarılı: https://github.com/mateopedersen/koledar365-si/actions/runs/39453842264. Önceki sürümün  GitHub CI: SEO/tatil sözleşmeleri, PostgreSQL, yedekleme/geri yükleme, Docker production imajı, gerçek 600 ppi çıktı ve temiz SQLite yayın üretimi başarılı: https://github.com/mateopedersen/koledar365-si/actions/runs/39447819630. Ruby/Wasm testleri 225 gerçek PDF kompozisyonunu kapsar. Ücretsiz site için 24 responsive görünüm geçti. Yeni yıllık/aylık indirme CTA testleri geçti.
- GitHub PR #2 ana dala alındı: https://github.com/mateopedersen/koledar365-si/pull/2
- Temiz üretim doğrulamaları geçti: https://github.com/mateopedersen/koledar365-si/actions/runs/39442489071 (Ruby ile temiz HTML yayın üretimi); https://github.com/mateopedersen/koledar365-si/actions/runs/39442489088 (Rails/PostgreSQL, backup/restore, Docker imajı, 600 ppi PDF ve temiz SQLite statik üretimi).
- Canlı doğrulama ayrıntısı: evidence/production-verification.json. Release/SEO/responsive/kabul raporları evidence/ altında.

## Bilinçli kısıtlar ve açık kalemler

- 13 godovi ay sayfası ve 2027–2031'e uzanan 4 okul tatili dönemi kaynak/hak veya resmî tarih doğrulaması yetersiz olduğundan noindex/held kalır; tarih ya da hak uydurulmadı.
- İşletmeci Mateo Pedersen; doğrulanmış iletişim koledar365@gmail.com. Gönderim almayan ücretsiz mailto akışı başarılı iletildi mesajı varmış gibi göstermez.
- Avenir lisanslı olarak cihazda mevcutsa seçilir; dağıtılabilir webfont lisansı olmadığı için font dosyası siteye eklenmez. PDF'de lisanslı DejaVu gömülüdür.
- Kontrollü Lighthouse/Core Web Vitals saha verisi, gerçek %200 zoom incelemesi ve bağımsız Slovence anadili editörü sertifikası yoktur; tamamlanmış gibi raporlanmaz. Google sıralaması garantisi verilmez.
- Cloudflare Pages bu ücretsiz mimaride Rails sürecini sürekli çalıştırmaz; yönetim, veritabanı, dosya depolama talebi varsa ayrıca ücretli altyapı gerekebilir. Ücretli servis izinsiz açılmayacak.

## Kesintiden sonra devam

Önce gerçek çalışan süreçleri, git durumu ve bu dosyayı kontrol et. Katalog üreticilerini üst üste başlatma; tamamlanmış fingerprintleri silme.
Ruby ve yerel test ortamı için repo kökünde:
PATH="/Users/melihozcan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PWD/../../work/runtime/mise/installs/ruby/4.0.7/bin:$PATH"
PDFTOPPM_BIN=/Users/melihozcan/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdftoppm
PYTHON_BIN=/Users/melihozcan/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3
Daha ayrıntılı kurtarma komutları ve faz kayıtları: docs/status-history-2026-10-20.md.

## 2026-10-21 Slovenya ulusal renk paleti düzeltmesi

- Ana görsel sistemdeki yeşil vurgu ve durum renkleri bayrak paletinin mavisi/kırmızısına taşındı; açık yüzeyler beyaz ve açık mavi kaldı. Ana takvim, bugün işareti, şehir/hava durumu kartı, tatil ve özel gün sayfaları, sayaçlar, tatil planlayıcıları, gizlilik sayfası ve görsel bileşenler gözden geçirildi.
- Kaynak stil denetimi `app/assets/stylesheets` altındaki 14 CSS dosyasını taradı; yeşil baskın hex rengi kalmadı. `git diff --check` temiz.
- Değişiklikler PR #31 ile ana dala alındı ve Cloudflare'da yayımlandı; canlı gizlilik sayfası yeni `web-cbe802e1ac740692.css` dosyasını HTTP 200 ile yükledi.

## 2026-10-21 Site genelinde okunabilirlik düzenlemesi

- Ortak `readability.css` katmanı, tüm sayfa ve özellik stillerinden sonra yüklenir. Gövde 17 px, ana metin 16–17 px, yardımcı metin en az 14 px; yoğun takvim etiketleri taşmayı önleyen ayrı ölçülerde tutulur. Açık temada kontrast metin tonları #405067 ve Slovenya bayrağı mavisi #084f95 olarak doğrulandı; fotoğraf üzerindeki kaynak yazıları beyaz kalır.
- Canlı sitemap kaynakları 388 genel URL ve 8.561 isim URL'si içeriyor. Üretilmiş statik çıktıda tüm 8.949 benzersiz sitemap URL'si, 15 ortak CSS paketi ve 404 sayfası okunabilirlik katmanını yükler; eksik HTML/stil bağlantısı yok. Denetim: `evidence/readability-sitewide-audit.json`.
- Üretim derlemesi: 8.973 HTML ve 19.923 dosya; `script/audit_static.rb`, `script/verify_static.mjs`, 2.820/2.820 PDF-WebP çifti ve 208 lunar çift doğrulandı. Chrome masaüstü ekran görüntüleri ana sayfa, iş günü ve tatil ayrıntısında; 390 px mobil viewport kontrolünde yatay sayfa taşması yok. Rails testi 73 test / 4.149 doğrulama / 0 hata geçti.
- GitHub CI'nin ilk dört-tarayıcı turu, 320 px telefonda ana gezinmenin ortak yazı büyütmesiyle 354 px'e taşmasını yakaladı. Dar ekranda gezinme yazılarını kompakt tutan düzeltme uygulandı; ana sayfa, gizlilik, aylık takvim, tatil, tarih hesaplayıcı ve isim sayfası 320 px gövde genişliğinde kontrol edildi.
- Son CI turu, mobil güneş aracı etkileşimlerinde çerez karar paneli ile küçük ekrandaki içerik aralıklarının düğmeleri kapatabildiğini gösterdi. Ortak paragraf boşluğu kuralı kaldırıldı; mobil çerez tercihleri 190 px'i aşmayan, üç seçeneği de görünür 44 px dokunma alanlarıyla sunan alt şeride dönüştürüldü. Güneş aracı testleri önce gerekli olmayan yer hatırlamasını reddedip sonra aracı sınayacak şekilde güncellendi.
- Son kaynakla Chromium, WebKit, Android Chromium ve iPhone WebKit'te güneş/şehir ve mobil çerez akışları 16/16 geçti. Tam GitHub CI ve canlı yayın bu düzeltmenin ardından yeniden doğrulanacak.
- Kaynak değişiklikleri `app/views/layouts/application.html.erb`, `app/assets/stylesheets/readability.css` ve `script/verify_readability_coverage.py` dosyalarında; son mobil düzeltmeler `test/browser/sun-experience.spec.mjs` içindedir. `fix/sitewide-readability-20261021` dalı, kaynak PR'si ve Cloudflare Pages yayını CI doğrulamasından sonra tamamlanmalı.


## 2026-10-21 devam eden yayın notu

- Son ana dal değişikliği `/imena/` ve `/koledar-z-imenom/` rotalarını yayından çıkardı; bu çalışma ağacındaki kullanıcı tarafından yapılmış değişiklik olarak korundu.
- CI, artık 404 dönen altı eski isim giriş sayfasını SEO denetiminin aktif sayfa listesinde tuttuğu için başarısız oldu. `script/audit_seo.rb`, uygulamanın `PagesController::REMOVED_NAME_PATHS` kuralını kullanacak şekilde düzeltildi ve 2026-10-21'de `127a9b4` commit'i olarak kaydedildi.
- Üretim HTML'si henüz Cloudflare'da doğrulanmadı. Yeni CI ve Pages üretimi tamamlanana, ardından canlı ana sayfa ve takvim URL'leri okunabilirlik katmanıyla HTTP 200 dönene kadar yayın tamamlanmış sayılmayacak.


## 2026-10-21 yayın kuyruğu

- Güncel ana dal `1d9472d` üzerine yeniden üretildi; `script/audit_static.rb` 382 sitemap URL'si, 52 yıllık/aylık takvim galerisi ve 124 galeri sayfasını doğruladı. Kaynak katalogda 2.820 PDF/WebP çifti eşleşti; tüm statik doğrulama ve Cloudflare dosya denetimleri geçti.
- Yayın derlemesi Cloudflare'a ulaşmadan önce GitHub olay gecikmesiyle eski commit `f35f9a7` dağıtılmıştı. Eski kaynakta kalan bir retry kuyruğa alınıp iptal edildi; canlı site henüz yeni okunabilirlik sürümünü sunmuyor. Doğru güncel commit'in Cloudflare Pages'e alınması ve canlı doğrulama beklemede.

## 2026-10-21 Saat değişimi sayfası ve özgün infografikler

- Mevcut `/premik-ure/` adresi, Slovence `Premik ure 2026–2030: poletni in zimski čas` başlığı ve resmî kaynaklarla doğrulanmış 10 geçiş tarihiyle güncellendi. Kaynak değişikliği PR #54 ile `47a877d902bbdfc7ac374c9143804db7133254ca` commit'inde ana dala alındı.
- İlkbaharda 02:00 → 03:00, sonbaharda 03:00 → 02:00 geçişini anlatan özgün yatay ve mobil dikey SVG/WebP infografikleri eklendi. Gerçek HTML görseli, Slovence alt metin, Open Graph, ImageObject ve görsel sitemap kaydı birlikte sunulur.
- Sonraki değişim kartı 01:00 UTC anında ilerler; 2026 ICS indirmesi ve mevcut yazdırma/2027–2030 ICS seçenekleri korunur.
- Tam CI başarılı: 80 Rails testi, 5.046 doğrulama, Chromium/WebKit/Android/iPhone profillerinde 141 tarayıcı testi. PostgreSQL, Docker, 600 ppi çıktı, SEO ve temiz statik üretim kontrolleri geçti: https://github.com/mateopedersen/koledar365-si/actions/runs/39637451946 .
- Doğrulanmış yayın üretimi başarılı: https://github.com/mateopedersen/koledar365-si/actions/runs/39639733905 . Hazır `site/` snapshot'ı `ffacae4b97960bec6315132b5743ce48960e4fab` commit'inde kaydedildi.
- Bu kayıt, doğrulanmış statik çıktıyı içeren ana dalın mevcut Cloudflare Pages otomatik dağıtımına alınması içindir. Ücretli kaynak veya yeni yayın projesi oluşturulmadı.


## 2026-10-22 Student planner WebP browser compatibility

- PR #62 gallery layout is merged; current main publication snapshot `edec5868bb4933045e7f0be160392c178c046d7c` deployed successfully to Cloudflare Pages.
- Live `/solski-urnik/` testing found PDF.js used `Map.prototype.getOrInsertComputed`, missing in the current browser runtime, which prevented WebP raster output.
- Injecting the compatibility method in a live browser produced a real 600 ppi WebP download. The same end-to-end run verified PDF bytes, timetable and homework persistence, ICS dates/time zone, local JSON backup, and restore. Chromium and iPhone WebKit planner/ICS checks passed 2/2.
- Permanent fix: `cloudflare/free/map-compat.js` supplies the missing Map method before PDF.js loads. `test/browser/student-webp-export.spec.mjs` removes the API, then verifies the generated WebP RIFF/WEBP signature.
- Remaining: CI, verified static Pages snapshot, production deployment, and live WebP/ICS/backup-restore checks. Do not mark complete before production verification.
