# Koledar365 — devam ve canlı yayın durumu

Güncelleme: 20.10.2026 20:12 +0300. Takvim metni düzeltmesi: 7d49796b4; otomatik statik yayın: 1fe95b074; Cloudflare Pages dağıtımı: f7ca7688-c429-45f4-ab8b-82d42cab497e (başarılı).
Bu dosya birincil devam kaydıdır; önceki çalışma günlüğü docs/status-history-2026-10-20.md içinde korunur.

## PageSpeed ve erişilebilirlik — devam ediyor

- Mobil PageSpeed başlangıcı: 95 performans / 94 erişilebilirlik / 100 en iyi uygulamalar / 100 SEO. Gerçek rapor: https://pagespeed.web.dev/analysis/https-koledar365-si/gmd1vmgtnk?form_factor=mobile . Anahtarsız Google API günlük kotası 0 dönüyor; web arayüzü çalışıyor.
- Çalışma dalı `improve-pagespeed-accessibility`. Bu optimizasyonlar henüz canlıya yayımlanmadı. 69 gerçek şehir fotoğrafı için içerik özetli AVIF/WebP boyutları hazır; özgün lisanslı JPG'ler korunur. Ana sayfa CSS'i ilk HTML'de, iç sayfalarda tek önbellekli CSS varlığı; başlangıçtaki assets.json beklemesi kaldırıldı. Takvim bağlantıları 24 px hedef alanı ve daha yüksek kontrast alır.
- Cloudflare zone RUM ayarı AB dışı ziyaretçilere otomatik betik ekliyordu; Disable seçilip Update kaydedildi. Canlı HTML'de beacon.min.js artık yok. Pages Web Analytics zaten kapalıydı; CSP gevşetilmedi.
- İlk yerel mobil Lighthouse 13.5.0: 100 performans / 97 erişilebilirlik / 100 en iyi uygulamalar / 100 SEO; CLS 0. Kalan hava durumu metin rengi düzeltildi. Tüm kategoriler ve sayfa türleri için ölçüm devam ediyor; ölçülmemiş URL'ler 100 diye kabul edilmez.
- Yerel statik deneme: http://127.0.0.1:3655/ (tmp/qa/perf-site ve kaynak/public/site yedeği), `tmp/qa/rebuild_perf.sh`. Ölçüm: `tmp/qa/run_audits.py`, raporlar `tmp/qa/pagespeed/templates-round-1/`; çalışan ana süreç session 50542. İki QA sunucusu yalnız bu işe ait: 3654 ve 3655; asıl 3650 sunucusu korunur.
- Sonraki işler: sayfa türleri ve 52 dönem için mobil/masaüstü ölçümleri, kalan kontrast/işlev hatalarını giderme, tüm yayımlı URL'lerin denetimi, kaynakları ana dala taşıma, tam Ruby üretimi/Cloudflare yayını, gerçek PageSpeed'de mobil ve masaüstü son ölçüm ve kanıtları kaydetme.

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
