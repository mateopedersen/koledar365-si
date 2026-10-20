# Kabul raporu

Bu rapor gerçek yerel uygulama ve çalıştırılan kontrolleri kaydeder. Canlı yayın ve saha performansı tamamlanmış değildir. Son kullanıcı talimatı karanlık modu kaldırır.

| Madde | Durum | Bulgular ve kanıt |
|---|---|---|
| K01 — Çerez politikası ve kabul butonu | verified | Slim alt şerit, ret/kabul/geri çekme; isteğe bağlı şehir hafızası kapalı. Karanlık tema kullanıcı tarafından kaldırıldı. Kanıt: test/integration/site_test.rb; evidence/cookie-mobile.png |
| K02 — Görsel SEO | verified | Gerçek yerel ve lisanslı fotoğraflar, boyut/srcset; sosyal görseller dönem/isme bağlı. Kanıt: evidence/photo-serving-audit.json; test/integration/seo_test.rb |
| K03 — ALT text | verified | Slovence konu/isim/dönem etiketleri; süs ikonları aria-hidden. Kanıt: evidence/seo-audit.json; test/integration/seo_test.rb |
| K04 — Özel 404 | verified | Özel tasarım ve gerçek HTTP 404; Slovence statik hata yanıtları. Kanıt: test/integration/site_test.rb; app/views/pages/not_found.html.erb |
| K05 — İletişim | verified | Kalıcı yönetici gelen kutusu, doğrulama/CSRF/honeypot/rate limit. SMTP gönderildi iddiası yok. Kanıt: test/integration/site_test.rb; app/controllers/tools_controller.rb |
| K06 — XML sitemap | verified | Sadece yayımlanan canonical kayıtlar; held ve arama dışarıda. Kanıt: test/integration/seo_test.rb; evidence/publication.json |
| K07 — İç linkleme | verified | Merkez/yıl/ay/kaynak/konu bağlantıları; 86 sayfalı isim gezinmesi, ayrı pagination canonical. Kanıt: evidence/seo-audit.json; test/integration/seo_test.rb |
| K08 — Dış linkleme | verified | Konu yanında birincil kaynak ve fotoğraf sahibi/lisansı. Kanıt: evidence/observance-audit.json; docs/data-sources.md |
| K09 — Eski cache temizliği | implemented | Digest varlık ve gerçek veri/font/şablon anahtarı; kişisel veriyi silmeyen rollback belgesi. Canlı hostta cutover henüz yapılmadı. Kanıt: docs/deployment.md; test/models/planner_test.rb |
| K10 — Tüm takvimler tıklanabilir | verified | Dört yıl/48 ay ve gün bağlantıları; tarih ve tatil kapsamı testli. Kanıt: test/models/calendar_test.rb; evidence/calendar-2029-browser.json |
| K11 — Genel tasarım | verified | Referans üç sütun, canlı gerçek fotoğraflar, dengeli tipografi ve ulusal renkler. Kanıt: evidence/home-final-desktop.png; evidence/responsive-final.json |
| K12 — Buton işlevleri | verified | Gerçek planlayıcı CRUD, ICS/yedek/hesaplama/kişisel önizleme ve indirmeler. Kanıt: test/integration/planner_test.rb; evidence/tests-final.txt |
| K13 — Hız ve performans | partial | Yerel HTTP ölçümü var. Kontrollü Lighthouse/Core Web Vitals ve saha verisi henüz yok; performans hedefinin geçtiği iddia edilmez. Kanıt: evidence/http-performance.json; docs/seo.md |
| K14 — Site içi arama | verified | Aksan toleransı, exact isim önceliği, araç/yıl/ay sorguları ve noindex sonuçlar. Kanıt: test/integration/site_test.rb; app/services/search_service.rb |
| K15 — 2029 takvim bozuklukları | verified | 2029 12 ay doğrudan tarayıcıda; 5/6 satır ve 1 Ocak Pazartesi. Kanıt: evidence/calendar-2029-browser.json; evidence/calendar-2029-review.jpg |
| K16 — İç içe tablo ve kartlar | partial | CSS grid/flex; takvim semantik tablo, veri tablosunda yerel kaydırma. 56 görünümde dış taşma yok. 200% zoom için genişlik eşdeğeri test; ayrı tam klavye/zoom audit tamamlanmadı. Kanıt: evidence/responsive-final.json |
| K17 — OG görselleri | verified | İsim/yıl/ay için gerçek 1200×630 sosyal görsel; tatil fotoğrafı konuya bağlı. Kanıt: test/integration/seo_test.rb; app/services/social_image.rb |
| K18 — Meta title ve description | verified | 8.905 renderde benzersiz başlık/açıklama, tek H1 ve canonical sözleşmesi. Kanıt: evidence/seo-audit.json |
| K19 — Mobil ve responsive | verified | 320/376/390/768/1024/1440/1920 CSS px, sekiz sayfa ailesi. 375 yerine 376 ölçüldü. Kanıt: evidence/responsive-final.json |
| K20 — Tüm sayfalarda teknik SEO ve UX | verified | 343 plan yolu + 8.561 isim + lisans sayfası tarandı; kaynak kapıları açık. Canlı indeks iddiası yok. Kanıt: evidence/seo-audit.json; evidence/publication.json |
| K21 — Karanlık mod | overridden | Son kullanıcı talimatıyla dark/system modu tamamen kaldırıldı; yalnız açık tema. Kanıt: STATUS.md; app/assets/stylesheets/slovenia.css |
| K22 — Lunar Calendar | verified | USNO gerçek UTC anları, Ljubljana tarihi/DST ve PDF Ay fazları. Kanıt: test/models/calendar_test.rb; data/source/usno-moon-2028.json |
| K23 — Burç hesaplayıcı | verified | Geleneksel güneş burcu; sınır/29 Şubat/yıl geçişi ve yöntem açıklaması. Kanıt: test/models/calendar_test.rb; app/services/zodiac.rb |
| K24 — Bugünün tarihli burç yorumu | verified | Bugün 12 özgün kayıt; gerçek tarihli planlama, JSON ithal, izleme ve eksik gün durumu. API anahtarı olmadan editoryal giriş kullanılır. Kanıt: test/models/editorial_test.rb; app/views/admin/index.html.erb |
| K25 — E E A T ve kullanıcı deneyimi | partial | Gerçek işletmeci Mateo Pedersen, yöntem ve düzeltme yolu var. Yayımlanacak işletmeci iletişimi/üretim sağlayıcısı henüz gelmedi. Kanıt: app/views/pages/_privacy.html.erb; docs/seo.md |
| K26 — Özel Hakkımızda | verified | Özel O nas tasarımı, gerçek amaç ve kaynaklar. Kanıt: app/views/pages/_about.html.erb; evidence/responsive-final.json |
| K27 — Slovenya yerelleştirmesi | verified | Slovenya, Ljubljana saati, yerel tarih/ay/gün ve 69 resmî şehir. Kanıt: test/models/city_test.rb; test/models/calendar_test.rb |
| K28 — İsim başına 5 ana ailede 15 tasarım | verified | Beş aile/15 gerçek yerleşim, 10 renkli/5 BW; NFC ad ve dört yıl seçimi. Kanıt: evidence/print-gate.json; evidence/print-v2-contact-sheet.jpg |
| K29 — En güncel kararlı Ruby | verified | Ruby 4.0.7/Rails 8.1.4; Linux Docker/PostgreSQL gerçek CI. Son commitin CI sonucu raporda güncellenir. Kanıt: evidence/production-ci.json; .github/workflows/ci.yml |
| K30 — Doğru yerel veri | partial | Tatil/astronomi/SURS verisi doğrulandı. 13 godovi + 4 gelecek okul yılı kaynağı/hakkı doğrulanmadığından held. Kanıt: docs/data-sources.md; evidence/publication.json |
| K31 — GitHub ve Cloudflare yayını | blocked | GitHub public ve kaynak dalı/PR hazır. Cloudflare DNS/Pages var; kalıcı Rails hostu verilmedi. Canlı Rails yayını yok. Kanıt: evidence/pull-request.json; docs/deployment.md |
| K32 — Gerçek 600 ppi PDF ve WebP kalitesi | verified | 180 gerçek eşleşme, bütün sayfalarda gerçek 600 ppi boyut, sRGB ve gömülü vektör font. Kanıt: evidence/export-file-verification.json; evidence/file-contract-v1.1.json |
| K33 — Kişisel kayıtlar ve ICS | verified | Seansa özel dosyalar/fotoğraf; local CRUD, yedek, gerçek ICS ve DST/gece vardiyası/29 Şubat politikası. Kanıt: test/models/planner_test.rb; test/integration/planner_test.rb |
| K34 — Font ve varlık lisansları | verified_with_fallback | Fotoğraf ve DejaVu lisansları kayıtlı. Avenir cihazda kuruluysa; dağıtılabilir webfont lisansı yok ve sistem fallback açıkça belirtilir. Kanıt: docs/data-sources.md; app/assets/fonts/LICENSE.txt; README.md |
| K35 — Kesintiye dayanıklı teslim | verified | STATUS, faz commitleri, özel sırlar Git dışında, kaynak/kanıt/yeniden başlatma belgeleri. Kanıt: STATUS.md; docs/architecture.md |
| K36 — 2030 dahil dört tam yıl | verified | 2027–2030, 48 ay, artık yıl/ISO/Easter/workdays testli. Kanıt: test/models/calendar_test.rb; evidence/print-layout-audit.json |
| K37 — Her indirilebilir türde 15 PDF ve 15 WebP | verified | 12 indirilebilir tür ×15 tasarımın PDF+WebP gerçek üretimi ve doğrulaması; on-demand sürdürülebilir cache. Kanıt: evidence/export-matrix-v2.json; evidence/export-file-verification.json |
| K38 — Her dosyada site marka imzası | verified | Her PDF sayfasında okunabilir marka; WebP aynı PDF sayfasından üretilir. ZIP tam sayfalı. Kanıt: evidence/export-file-verification.json; app/services/pdf_renderer.rb |
| K39 — En popüler isimlerden başlama | verified | Gerçek 200 →1.000 →8.561 kalite kapılı popülerlik sıralı yayın. Kanıt: evidence/publication.json; evidence/name-layout-audit.json |
| K40 — Son ana sayfa görselini referans alma | verified | Verilen üç sütunlu referans ve kullanıcının sade profesyonel/ulusal renk revizyonları uygulandı. Kanıt: evidence/home-final-desktop.png |
| K41 — Bütün önemli günler ve kutlamalar merkezi | verified | Önemli gün listesi/ay takvimi, kategori/ay/arama, yaklaşan tarih, seçimle aynı ICS ve 58 konu. Kanıt: app/views/pages/_important_days.html.erb; evidence/observance-audit.json |
| K42 — Anahtar teslim çalışan site | blocked | Yerelde çalışan uygulama, Docker/Compose, yönetim ve bakım hazır. Canlı host, işletmeci iletişimi ve üretim backup görevi olmadan anahtar teslim yayın tamamlandı denmez. Kanıt: docs/deployment.md; STATUS.md |
| K43 — Uzman titizliğinde bütünsel Slovence | verified_with_limit | Slovence UI/admin/hatalar/PDF, CLDR ve bağlama uygun sayımlar incelendi. Bağımsız anadili editörü sertifikası veya hatasızlık garantisi verilmez. Kanıt: config/locales/sl.yml; evidence/tests-final.txt; docs/data-sources.md |
