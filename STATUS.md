# Koledar365 — devam ve canlı yayın durumu

Güncelleme: 20.10.2026 20:25 +03. Dal: finalize-production-documentation. Son doğrulanmış canlı kaynak commit'i: b6e0b7c (günlük yayın içeriği ve yayın belgeleri).
Bu dosya birincil devam kaydıdır; önceki çalışma günlüğü docs/status-history-2026-10-20.md içinde korunur.

## Canlı yayın

- Ana adres: https://koledar365.si/ — HTTPS üzerinden erişilebilir.
- Cloudflare Pages projesi koledar365-si; production branch main; otomatik dağıtımlar açık.
- Son doğrulanmış production dağıtımı başarılı: https://e71b55e5.koledar365-si.pages.dev/ — deployment e71b55e5-7b84-4a37-a42f-1c61e0c39674; kaynak commit b6e0b7c. Yıllık/aylık indirme görünürlüğü düzeltmesi bu kayıttan sonra hazırlandı; test edildi ve yayın kuyruğunda.
- Repo herkese açık: https://github.com/mateopedersen/koledar365-si
- Cloudflare Preview: https://e689a94c.koledar365-si.pages.dev/
- Son yerel statik üretimde 18.742 dosya ve 2.820 eşleşmiş PDF/WebP çifti doğrulandı. 8.912 HTML, 8.888 indexlenebilir URL ve 9.093 iç hedefle statik/SEO kontrolü geçti.
- Ücretli ürün, VPS, ücretli Containers, R2 veya ücretli veritabanı açılmadı. Mevcut Cloudflare Pages Free kullanıldı.

## Uygulama ve işlevler

- Ruby 4.0.7 / Rails 8.1.4 kaynak uygulaması korunur ve Linux/PostgreSQL/Docker üzerinde CI'da gerçek test edilir. Ruby günlük ve tarihli içeriği derler; Pages'e statik Slovence HTML/asset yayınlanır.
- Ücretsiz prodüksiyonda sürekli Rails/DB sunucusu yoktur. İstemci tarafı gerçek Ruby/Wasm takvim ve Prawn çıktısı üretir; hava durumu için küçük Cloudflare Pages Function kullanılır. Kişisel not/olay/özel fotoğraf cihazda kalır.
- 69 Slovenya belediye merkezi seçilebilir; kaynak/lisansı gösterilen gerçek şehir fotoğrafları ve seçilen şehre göre MET Norway hava durumu çalışır. Canlı Bled görünümü doğrulandı.
- Dört yıl 2027–2030; her yılın 12 ayı, yıllık ve diğer standart takvim türleri için 15 PDF + 15 WebP tasarımı hazırdır. İsim sayfalarında 8.561 popüler isim için 15 tasarım; özel aralık ve kullanıcı planları tarayıcı Ruby motoruyla talep üzerine oluşturulur.
- Ana sayfa, özel gün/tatil ayrıntıları, Hakkımızda, gizlilik/çerez, lisans, özel 404 ve araç akışları yayımdadır. Karanlık mod yoktur; çerez tercihleri ince alt şerit olarak kalır.
- Yıllık ve aylık takvimlerde PDF/WebP galerisinin görünür bağlantısı başlığın hemen altına alındı; yıllık bağlantı `annual`, her ayın bağlantısı doğru tarih ve `monthly` türüyle açılır. Eski takvim altı indirme bağlantısı da korunur.
- Admin/yayın yönetimi GitHub izinli workflow'ları ile yapılır; herkese açık bir admin paneli yoktur.

## Dosya üretimi ve doğrulama

- 2.820/2.820 eşleşmiş PDF/WebP çiftinin ikinci bağımsız raster kontrolü geçti; 6.452 sayfa, hata 0. 48×15 aylık = 720, 4×15 yıllık = 60 çift; kalan standart tür/scope'lar da sürüm kataloğunda yer alır.
- PDF'ler gerçek 600 ppi fiziksel sayfa ölçüsünde, gerçek sRGB WebP'ye dönüştürülmüş ve her sayfada Koledar365 marka imzasını taşır. PDF yeniden 600 ppi rasterleştirilip WebP ile karşılaştırılır; köşe boşluğu, hizalama ve imza da denetlenir.
- Canlı örnek PDF ve WebP ZIP 200 döndürdü; sunulan baytların SHA-256 değerleri release manifest ile birebir eşleşti. ZIP testinden geçti; 2 sayfa, 600 ppi, manifest ve README bulundu. İki biçim de bir yıllık immutable cache ve noindex alıyor.
- Statik release: 18.741 dosya, 2.820 çift, issues=[]; SEO taraması 8.912 HTML, 8.888 indexlenebilir URL ve 9.093 iç hedefte hata bulmadı.
- Yerel test: 56 test / 1.745 doğrulama / 0 hata. Ruby/Wasm testleri 225 gerçek PDF kompozisyonunu kapsar. Ücretsiz site için 24 responsive görünüm geçti. Yeni yıllık/aylık indirme CTA testleri geçti.
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
