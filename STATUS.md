# Koledar365 — devam ve canlı yayın durumu

Güncelleme: 20.10.2026 19:18 +0300. Son bağımsız doğrulanan uygulama yayını: dadefcb (52 inline galeri); son otomatik statik üretim: 5e9afe3.
Bu dosya birincil devam kaydıdır; önceki çalışma günlüğü docs/status-history-2026-10-20.md içinde korunur.

## Devam eden galeri UX düzenlemesi

- Yeni istek: 48 aylık + 4 yıllık sayfada ve diğer bütün galeri türlerinde takvim/ayarlar ile galeri ilk ekranda birlikte görülecek. Uzun takvim, tablo ve formlar galeriyi aşağı itmeyecek.
- Kaynakta ortak iki sütunlu workspace, kompakt takvim/ayar paneli, erişilebilir genişletme/daraltma düğmesi ve tek pratik Slovence dosya açıklaması uygulandı. Tatil galerisi de kapalı alt bölümden çıkarılıp üstte açık gösteriliyor.
- Yerel testler: 58 test / 2.194 doğrulama / 0 hata. Tam yeniden üretim, 8.743 galerili sayfanın ortak düzen/15 tasarım denetimi, 8.905 sayfalık SEO kontrolü ve 148 gerçek tarayıcı görünümü geçti. 52 dönem masaüstü 1440×900 ve mobil 390×844 boyutlarında tek tek kontrol edildi; diğer türler ayrıca 376×668 ve 768×1024 boyutlarında incelendi. Kanıt: evidence/gallery-workspace-local-ux.json. Yeni düzen henüz canlı sürüm olarak doğrulanmadı; aşağıdaki canlı kayıt önceki düzen içindir.
- Sıradaki iş: kaynak ve doğrulanmış statik çıktıyı ana dala yayımlamak; Cloudflare deployment ve yeni GitHub CI sonucunu bekleyip production üzerinde 52 dönemi tekrar doğrulamak. Takvim genişletme/daraltma, planlayıcı kayıt ekleme/silme ve kâğıt seçimi yerelde başarılı.

## Canlı yayın

- Ana adres: https://koledar365.si/ — HTTPS üzerinden erişilebilir.
- Cloudflare Pages projesi koledar365-si; production branch main; otomatik dağıtımlar açık.
- Son doğrulanmış production dağıtımı başarılı: https://87f6980d.koledar365-si.pages.dev/ — deployment 87f6980d-f807-4150-950d-2add3a343f0e; kaynak commit dadefcb. Koledar365.si özel alanında takvim altında 15 tasarımlı inline galeri canlıda doğrulandı.
- Repo herkese açık: https://github.com/mateopedersen/koledar365-si
- Cloudflare Preview: https://e689a94c.koledar365-si.pages.dev/
- Son yerel statik üretimde 18.744 dosya ve 2.820 eşleşmiş PDF/WebP çifti doğrulandı. 8.912 HTML, 8.888 indexlenebilir URL ve 11.434 iç hedefle statik/SEO kontrolü geçti.
- Ücretli ürün, VPS, ücretli Containers, R2 veya ücretli veritabanı açılmadı. Mevcut Cloudflare Pages Free kullanıldı.

## Uygulama ve işlevler

- Ruby 4.0.7 / Rails 8.1.4 kaynak uygulaması korunur ve Linux/PostgreSQL/Docker üzerinde CI'da gerçek test edilir. Ruby günlük ve tarihli içeriği derler; Pages'e statik Slovence HTML/asset yayınlanır.
- Ücretsiz prodüksiyonda sürekli Rails/DB sunucusu yoktur. İstemci tarafı gerçek Ruby/Wasm takvim ve Prawn çıktısı üretir; hava durumu için küçük Cloudflare Pages Function kullanılır. Kişisel not/olay/özel fotoğraf cihazda kalır.
- 69 Slovenya belediye merkezi seçilebilir; kaynak/lisansı gösterilen gerçek şehir fotoğrafları ve seçilen şehre göre MET Norway hava durumu çalışır. Canlı Bled görünümü doğrulandı.
- Dört yıl 2027–2030; her yılın 12 ayı, yıllık ve diğer standart takvim türleri için 15 PDF + 15 WebP tasarımı hazırdır. İsim sayfalarında 8.561 popüler isim için 15 tasarım; özel aralık ve kullanıcı planları tarayıcı Ruby motoruyla talep üzerine oluşturulur.
- Ana sayfa, özel gün/tatil ayrıntıları, Hakkımızda, gizlilik/çerez, lisans, özel 404 ve araç akışları yayımdadır. Karanlık mod yoktur; çerez tercihleri ince alt şerit olarak kalır.
- Canlı uygulama: 2027–2030 arasındaki dört yıllık ve 48 aylık sayfada üstte normal takvim, altta o dönemin 15 tasarımlı galerisi bulunur. Her kart gerçek dönem önizlemesi, doğrudan PDF ve WebP/ZIP bağlantısı içerir; üst/alt indirme düğmeleri aynı sayfadaki galeriye kaydırır. Renk filtreleri 10 barvne / 5 črno-bele olarak çalışır. Yayın öncesi 52 galerinin bütün bağlantıları katalogla karşılaştırıldı; eksik ya da yanlış dönem dosyası yok. 52 canlı URL de ayrıca tarandı: 780 doğru dönem tasarımı ve 1.560 doğrudan indirme bağlantısı geçti. PDF/WebP indirmek için ayrı bir printable sayfasına gitmek gerekmez.
- Admin/yayın yönetimi GitHub izinli workflow'ları ile yapılır; herkese açık bir admin paneli yoktur.

## Dosya üretimi ve doğrulama

- 2.820/2.820 eşleşmiş PDF/WebP çiftinin ikinci bağımsız raster kontrolü geçti; 6.452 sayfa, hata 0. 48×15 aylık = 720, 4×15 yıllık = 60 çift; kalan standart tür/scope'lar da sürüm kataloğunda yer alır.
- PDF'ler gerçek 600 ppi fiziksel sayfa ölçüsünde, gerçek sRGB WebP'ye dönüştürülmüş ve her sayfada Koledar365 marka imzasını taşır. PDF yeniden 600 ppi rasterleştirilip WebP ile karşılaştırılır; köşe boşluğu, hizalama ve imza da denetlenir.
- Canlı örnek PDF ve WebP ZIP 200 döndürdü; sunulan baytların SHA-256 değerleri release manifest ile birebir eşleşti. ZIP testinden geçti; 2 sayfa, 600 ppi, manifest ve README bulundu. İki biçim de bir yıllık immutable cache ve noindex alıyor.
- Statik release manifestinde 18.743 dosya (manifest ile toplam 18.744), 2.820 çift, issues=[]; SEO taraması 8.912 HTML, 8.888 indexlenebilir URL ve 11.434 iç hedefte hata bulmadı.
- Canlı Şubat 2028 galerisinden tarayıcı aracılığıyla PDF, WebP ve çok sayfalı WebP ZIP doğrudan indirildi. SHA-256 değerleri release manifest ile aynı; WebP 4961 × 7016 piksel ve sRGB, ZIP iki 600 ppi sayfa içeriyor. 2030 yıllık sayfasında 12 normal ay tablosu ve ardından 15 yıllık tasarım doğrulandı. Kanıt: evidence/inline-calendar-live.json, evidence/inline-gallery-ui-downloads.json ve evidence/inline-monthly-gallery-live.png.
- Yerel test: 57 test / 2.114 doğrulama / 0 hata. Yeni 52 inline galeri kontrolü de geçti. Yeni yerel SEO denetimi 8.905 sayfada ve özel gün denetimi 58 sayfa / 232 ICS çıktısında geçti. İlk yeni CI çalışması (39452494100), SEO sayfa bağlantısı denetiminin yeni /prenosi/ dosyalarını tanımaması nedeniyle durdu. Denetim şimdi yalnızca katalogda izin verilen ve gerçekten mevcut dosyaları kabul eder; düzeltilmiş sürümün tam CI tekrarı başarılı: https://github.com/mateopedersen/koledar365-si/actions/runs/39453842264. Önceki sürümün  GitHub CI: SEO/tatil sözleşmeleri, PostgreSQL, yedekleme/geri yükleme, Docker production imajı, gerçek 600 ppi çıktı ve temiz SQLite yayın üretimi başarılı: https://github.com/mateopedersen/koledar365-si/actions/runs/39447819630. Ruby/Wasm testleri 225 gerçek PDF kompozisyonunu kapsar. Ücretsiz site için 24 responsive görünüm geçti. Yeni yıllık/aylık indirme CTA testleri geçti.
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
PATH="$PWD/../../work/runtime/mise/installs/ruby/4.0.7/bin:$PATH"
PDFTOPPM_BIN=/Users/melihozcan/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdftoppm
PYTHON_BIN=/Users/melihozcan/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3
Daha ayrıntılı kurtarma komutları ve faz kayıtları: docs/status-history-2026-10-20.md.
