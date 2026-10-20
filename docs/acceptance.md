# Kabul kriterleri ve gerçek kanıtlar

20 Ekim 2026. Ücretsiz yayın uyarlaması; canlı doğrulama henüz bitmedi.

| Madde | Durum | Bulgular |
|---|---|---|
| K01 — Çerez politikası ve kabul butonu | verified | Slim alt şerit, ret/kabul/geri çekme; isteğe bağlı şehir hafızası kapalı. Karanlık tema kullanıcı tarafından kaldırıldı. Kanıt: test/integration/site_test.rb; evidence/cookie-mobile.png |
| K02 — Görsel SEO | verified | Gerçek yerel ve lisanslı fotoğraflar, boyut/srcset; sosyal görseller dönem/isme bağlı. Kanıt: evidence/photo-serving-audit.json; test/integration/seo_test.rb |
| K03 — ALT text | verified | Slovence konu/isim/dönem etiketleri; süs ikonları aria-hidden. Kanıt: evidence/seo-audit.json; test/integration/seo_test.rb |
| K04 — Özel 404 | verified | Özel tasarım ve gerçek HTTP 404; Slovence statik hata yanıtları. Kanıt: test/integration/site_test.rb; app/views/pages/not_found.html.erb |
| K05 — İletişim | verified | Kullanıcının doğrulanmış gerçek e-postası koledar365@gmail.com için mailto akışı. Ücretsiz sürüm gönderilmeyen/kaydedilmeyen mesaj için başarı iddiası göstermez. Native Rails gelen kutusu kaynakta korunur. Kanıt: script/export_pages.rb; site/kontakt/index.html |
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
| K16 — İç içe tablo ve kartlar | partial | 56 native görünüm ve 24 ücretsiz görünümde dış taşma yok; klavye atlama/Escape/odak dönüşü testli. Ayrı gerçek %200 tarayıcı zoom incelemesi henüz tamamlanmadı. Kanıt: evidence/responsive-final.json; evidence/free-responsive.json; evidence/free-browser-functional.json |
| K17 — OG görselleri | verified | 343 sayfa için gerçek PNG sosyal görsel. İsimlerde yanlış ad/yıl yerine nötr marka kartı; her HTML başlığı/açıklaması isme özgü. Kanıt: evidence/static-audit.json; script/package_social.rb |
| K18 — Meta title ve description | verified | 8.905 renderde benzersiz başlık/açıklama, tek H1 ve canonical sözleşmesi. Kanıt: evidence/seo-audit.json |
| K19 — Mobil ve responsive | verified | 320/376/390/768/1024/1440/1920 CSS px, sekiz sayfa ailesi. 375 yerine 376 ölçüldü. Kanıt: evidence/responsive-final.json |
| K20 — Tüm sayfalarda teknik SEO ve UX | verified | 343 plan yolu + 8.561 isim + lisans sayfası tarandı; kaynak kapıları açık. Canlı indeks iddiası yok. Kanıt: evidence/seo-audit.json; evidence/publication.json |
| K21 — Karanlık mod | overridden | Son kullanıcı talimatıyla dark/system modu tamamen kaldırıldı; yalnız açık tema. Kanıt: STATUS.md; app/assets/stylesheets/slovenia.css |
| K22 — Lunar Calendar | verified | USNO gerçek UTC anları, Ljubljana tarihi/DST ve PDF Ay fazları. Kanıt: test/models/calendar_test.rb; data/source/usno-moon-2028.json |
| K23 — Burç hesaplayıcı | verified | Geleneksel güneş burcu; sınır/29 Şubat/yıl geçişi ve yöntem açıklaması. Kanıt: test/models/calendar_test.rb; app/services/zodiac.rb |
| K24 — Bugünün tarihli burç yorumu | verified | 12 özgün gerçek tarihli yorum; API anahtarı olmadan tarihli GitHub editoryal hazırlama ve yayın build/izleme. Ljubljana gece yarısında eski yazı önceki tarihli olarak ayrılır; eksik gün açıkça söylenir. Kanıt: data/editorial/horoscopes.json; cloudflare/free/date-context.js; .github/workflows/pages-publication.yml |
| K25 — E E A T ve kullanıcı deneyimi | verified | Gerçek sorumlu Mateo Pedersen, kullanıcı tarafından verilen iletişim e-postası, Cloudflare/GitHub/Gmail açıklaması, yöntem/kaynak/düzeltme akışı. E-E-A-T puanı veya sıralama garantisi yok. Kanıt: app/views/pages/_privacy_free.html.erb; docs/free-cloudflare.md; evidence/static-audit.json |
| K26 — Özel Hakkımızda | verified | Özel O nas tasarımı, gerçek amaç ve kaynaklar. Kanıt: app/views/pages/_about.html.erb; evidence/responsive-final.json |
| K27 — Slovenya yerelleştirmesi | verified | Slovenya, Ljubljana saati, yerel tarih/ay/gün ve 69 resmî şehir. Kanıt: test/models/city_test.rb; test/models/calendar_test.rb |
| K28 — İsim başına 5 ana ailede 15 tasarım | verified | Beş aile/15 gerçek yerleşim, 10 renkli/5 BW; NFC ad ve dört yıl seçimi. Kanıt: evidence/print-gate.json; evidence/print-v2-contact-sheet.jpg |
| K29 — En güncel kararlı Ruby | verified | Native build Ruby 4.0.7/Rails 8.1.4. Ücretsiz tarayıcı motoru resmî ruby.wasm 2.10.1 içindeki Ruby 4.0.0 ile aynı hesap/Prawn servislerini çalıştırır; sürekli Rails sunucusu iddiası yok. Kanıt: docs/free-cloudflare.md; evidence/portable-engine.json; .github/workflows/ci.yml |
| K30 — Doğru yerel veri | partial | Tatil/astronomi/SURS verisi doğrulandı. 13 godovi + 4 gelecek okul yılı kaynağı/hakkı doğrulanmadığından held. Kanıt: docs/data-sources.md; evidence/publication.json |
| K31 — GitHub ve Cloudflare yayını | in_progress | Mevcut ücretsiz Cloudflare projesinin build/output değişkenleri ayarlandı; doğrulanmış 2820 çiftin son kontrolü ve Preview/canlı HTTPS yayını sürüyor. Ücretli kaynak yok. Kanıt: docs/free-cloudflare.md; STATUS.md |
| K32 — Gerçek 600 ppi PDF ve WebP kalitesi | verified | 180 gerçek eşleşme, bütün sayfalarda gerçek 600 ppi boyut, sRGB ve gömülü vektör font. Kanıt: evidence/export-file-verification.json; evidence/file-contract-v1.1.json |
| K33 — Kişisel kayıtlar ve ICS | verified | Ücretsiz sürümde özel veriler cihazda; gerçek JSON yedek/restore, ICS round trip, DST ve fotoğraf PDF işlemi. Fotoğraf/özel veriler için tarayıcı ağ kaydında POST yok. Kanıt: evidence/free-browser-functional.json; evidence/browser-photo-and-color.json |
| K34 — Font ve varlık lisansları | verified_with_fallback | Fotoğraf ve DejaVu lisansları kayıtlı. Avenir cihazda kuruluysa; dağıtılabilir webfont lisansı yok ve sistem fallback açıkça belirtilir. Kanıt: docs/data-sources.md; app/assets/fonts/LICENSE.txt; README.md |
| K35 — Kesintiye dayanıklı teslim | verified | STATUS, faz commitleri, özel sırlar Git dışında, kaynak/kanıt/yeniden başlatma belgeleri. Kanıt: STATUS.md; docs/architecture.md |
| K36 — 2030 dahil dört tam yıl | verified | 2027–2030, 48 ay, artık yıl/ISO/Easter/workdays testli. Kanıt: test/models/calendar_test.rb; evidence/print-layout-audit.json |
| K37 — Her indirilebilir türde 15 PDF ve 15 WebP | verified | 13 tür/ek scope için 2820 standart dönem çifti üretildi; adlar/özel dönemler 15 tasarımın gerçek Ruby motoruyla cihazda üretilir. Son bağımsız raster kontrol sayısı release raporlarından doğrulanır. Kanıt: evidence/release-catalog-0.json; evidence/release-extra-catalog-0.json; evidence/portable-engine.json |
| K38 — Her dosyada site marka imzası | verified | Her PDF sayfasında okunabilir marka; WebP aynı PDF sayfasından üretilir. ZIP tam sayfalı. Kanıt: evidence/export-file-verification.json; app/services/pdf_renderer.rb |
| K39 — En popüler isimlerden başlama | verified | Gerçek 200 →1.000 →8.561 kalite kapılı popülerlik sıralı yayın. Kanıt: evidence/publication.json; evidence/name-layout-audit.json |
| K40 — Son ana sayfa görselini referans alma | verified | Verilen üç sütunlu referans ve kullanıcının sade profesyonel/ulusal renk revizyonları uygulandı. Kanıt: evidence/home-final-desktop.png |
| K41 — Bütün önemli günler ve kutlamalar merkezi | verified | Önemli gün listesi/ay takvimi, kategori/ay/arama, yaklaşan tarih, seçimle aynı ICS ve 58 konu. Kanıt: app/views/pages/_important_days.html.erb; evidence/observance-audit.json |
| K42 — Anahtar teslim çalışan site | in_progress | Çalışan ücretsiz sürüm ve gerçek kişisel araçlar hazır. Nihai Cloudflare Preview/canlı doğrulaması ve temiz kurulum yayın workflow testi tamamlanmadan anahtar teslim yayın denmez. Kanıt: docs/free-cloudflare.md; STATUS.md |
| K43 — Uzman titizliğinde bütünsel Slovence | verified_with_limit | Slovence UI/admin/hatalar/PDF, CLDR ve bağlama uygun sayımlar incelendi. Bağımsız anadili editörü sertifikası veya hatasızlık garantisi verilmez. Kanıt: config/locales/sl.yml; evidence/tests-final.txt; docs/data-sources.md |
