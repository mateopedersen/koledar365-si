# Koledar365 — gerçek uygulama durumu

Güncelleme: 20 Ekim 2026, Europe/Istanbul. Bu dosya yeniden başlama kaydıdır; ithal kayıt sayıları yayın sayısı değildir.

## Korunan kullanıcı kararları
- Rails/Ruby uygulaması; 2027–2030, doğal Slovence, 15 PDF + 15 eşleşen WebP ve gerçek 600 ppi.
- Referansa uygun üç sütunlu ana sayfa; gerçek şehir fotoğrafları, kaynak/lisans sayfası ve şehre göre hava durumu.
- Avenir tercihli yazı sistemi, güçlü başlıklar, ölçülü beyaz/mavi/kırmızı Slovenya renkleri. Parlak oyuncak görünümlü ikonlar sadeleştirildi.
- Karanlık mod tamamen kaldırıldı; ilk paket K21 maddesinin karanlık mod kısmını son kullanıcı talimatı geçersiz kılıyor.
- Çerez bildirimi ekranı kapatan pencere değil, alt şerittir. Kabul, ret ve tercihi geri çekme vardır.
- Son talepler: 2027–2030 Prazniki bölümünü ve bütün tatil ayrıntılarını yeniden tasarlamak; ayrıntılarda günün gerçek törenini, geleneğini veya etkinliğini gösteren görseller kullanmak; fotoğraf sahibini ve lisansını bağlamak. Genel şehir fotoğrafı tatil ayrıntısında kullanılmaz.

## Çalışan ve doğrulanmış parçalar
- Ruby 4.0.7, Rails 8.1.4. Yerel adres: http://127.0.0.1:3650/ . Kesintide süreç kapanabiliyor; yeniden kontrol edilmelidir.
- 343 plan sayfası, 8.561 NFC isim kaydı, 283 takvim olayı, 264 astronomi kaydı ithal edildi.
- 43 kaynak dosyasının SHA256 değerleri ve son eklerle eşitliği, CSV/JSON kimlikleri, 200/1.000 isim önceliği, SURS bastırılmış değerleri ve çalışma kitabı okuması: evidence/package-review.json; 21 kontrol geçti.
- 69 resmî şehir: gerçek yerel fotoğraflar, kaynak/özgün sahip/lisans kayıtları; MET Norway hava verisi, önbellek ve güncellik durumu; Europe/Ljubljana saati.
- Yerel kişisel olay, görev, not, ICS ve yedekleme arayüzleri mevcut. Yönetim ekranı parola korumalı; gerçek yönetici hesabı henüz oluşturulmadı.
- Eski yol kontrolü: 343 + ilk 200 isim = 543 HTTP 200; evidence/route-audit.json. Bu yalnız HTTP kontrolüdür.
- Son tamamlanan test: 36 test, 1.571 doğrulama, sıfır hata (20 Ekim); evidence/tests-holidays.txt. Gerçek tarih, çakışan özel gün/yasal tatil statüsü, iki saat değişiminin ICS aktarımı, uzun metin reddi, kişisel veri ve şehir kontrollerini kapsar.
- SEO taraması: 544 sayfa, sıfır sorun; evidence/seo-audit.json. Yerel render, canonical, tek H1, metadata, JSON-LD ve iç bağlantı kontrolüdür; Google sıralama veya indeks garantisi değildir.
- Baskı yerleşim sınırları: 12 tür × 15 tasarım × A3/A4/A5 × iki yön = 1.080 kombinasyon, sıfır koordinat/sayfa sınırı hatası; evidence/print-layout-audit.json, sürüm 1.2.0. Bu kontrol tek başına 15 farklı tasarımın bütün editoryal kalite kriterlerini karşıladığını kanıtlamaz.
- Önceki 15 gerçek isim PDF + 600 ppi WebP üretimi evidence klasöründe korunur. Tüm ürünlerin nihai kalite kapısı tamamlanmadı.

## Son yapılan düzenlemeler
- Ana sayfa istatistikleri semantik açıklama listesi; rakam 24 px, etiket 14 px, eşit kolon ve satırlar; mobil 22/12 px. Yıl kartları, saat, güneş sonuçları, yardımcı yazılar ve kontroller dengelendi.
- Kanıt: evidence/home-typography-desktop.png ve home-typography-mobile.png. Ana sayfa ve yeni tatil ayrıntıları masaüstü ile mobilde görsel kontrol edildi.
- About ve gerçek HTTP 404 sayfaları yeniden tasarlandı. 26 tutarlı SVG ikon, düz yüzeyler ve daha az mavi kullanılıyor.
- Gizlilik/çerez metinleri gerçek veri akışına göre yazıldı. Uygulama günlükleri UTC günü bazında tutulup en geç yedi gün içinde temizlenecek şekilde DailyLogDevice eklendi; süre testi geçti. Üretim sağlayıcısı/işletmeci iletişim bilgileri olmadan politika tamamen yayıma hazır sayılamaz.
- SEO: 47 özel sayfa açıklaması + veri türü/dönem bazlı açıklamalar; marka başlığı tekrarını giderme; canonical; WebSite/WebPage/BreadcrumbList JSON-LD; OG/Twitter; 1200×630 paylaşım görseli. Kayıp sayfalarda canonical yok. Arama ve özel indirmeler noindex. Taslaklar sitemap dışında.
- Yeni SEO uygulaması 544 sayfalık taramadan geçti. Tatil görseli OG/Twitter paylaşımına bağlandı; ImageObject içinde gerçek kaynak, kredi, lisans ve boyutlar yer alır. Google Image metadata belgesi 20 Ekim 2026'da yeniden incelendi: https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata .
- Yerel araştırma: Gregorjevo (Ljubljana belediyesi), Pust/Martinovo (STO), Sloven yemek günü (GOV.SI), spor günü ve 17.10.2026 yürürlük tarihli ZPDPD-I. Kaynaklar ilgili sayfalarda. evidence/local-research.json ve ZPDPD-I-2026.pdf. Gelecek festival programları tahmin edilmedi.

## Tatil bölümü ve gerçek görseller — son uygulama
- /prazniki/ ile /prazniki/2027/–2030/: yıl seçimi, 23 yasal tarih, 15 işten serbest tarih, hafta içi/hafta sonu ayrımı, ay/statü/aksan bağımsız arama, seçime uygun ICS, tek olay ICS, yıllar arası karşılaştırma ve bir gün izinle tatil önerileri.
- Mevcut 58 tatil/özel gün/mevsim/saat değişimi ayrıntısının ortak yeni tasarımı: konuya göre renkler, gerçek görsel, dört yıllık tarih kartları, kaynağa/lisansa bağlantı, takvimi açma ve yıla özel ICS. Tarih içindeki nokta giriş cümlesini artık kesmez.
- data/holiday_photos_sl.json: 56 fotoğraf + Trubar ve Dalmatin kitaplarının iki gerçek tarihî reproduksiyonu. Kaynaklar ve görseller temasına göre tek tek incelendi; 58 özgün kaynak kaydı evidence/holiday-photo-sources.json içinde. Arşiv fotoğrafının yılı ve dış ülkedeki etkinliğin yeri açıklamada belirtilir; tematik görsel gelecekteki etkinliğin fotoğrafı olarak sunulmaz.
- /fotografije-in-licence/: 58 konu görselinin ve 69 şehrin ayrı kaynak kartları; yazar, lisans/izin, özgün dosya bağlantısı ve WebP/boyutlandırma açıklaması. Tatil ayrıntılarında /images/cities/ görseli yoktur. Ana Prazniki kapak görseli de Ptuj Kurentovanje fotoğrafıdır.
- evidence/observance-audit.json: 58 mevcut ayrıntı sayfası, 232 yıla/konuya özgü ICS; tarihler, fotoğraf dosyası/SHA256, lisans kartı, paylaşım görseli ve ImageObject kontrolleri sorunsuz. Takvim verisinde ayrıca ayrıntı sayfası planında olmayan yedi uluslararası gün bulunur; bu rapor bunları ayrı listeler, 65 ayrıntı sayfası varmış gibi davranmaz.
- evidence/photo-serving-audit.json: 116 WebP dosyası gerçek yerel HTTP sunucusunda 200 + image/webp + doğru SHA256 ile sunuluyor. Tüm görseller yerelden sunulur.
- Tarayıcı kanıtları: observance-mary-desktop.png, observance-mary-mobile.png, observance-pust-desktop.png, observance-320.png, observance-photo-credit-mobile.png. 320/390/1376–1378 px görünümde taşma yok. Tarayıcı ekran emülasyonu kontrollerden sonra kaldırıldı.
- İşçi eski 1.1.0 kodundan yeniden başlatıldı; mevcut işçi oturumu 55808, web oturumu 4814. Süreçler kesintide kapanabilir. Arayüzden istek 17 üretildi: tatil türü, A5 yatay, 23 tarih, dokuz PDF sayfası ve dokuz eşleşen 4961×3496 WebP, sRGB profili ve her sayfada marka. evidence/holiday-export-verification.json. Bu A5 düzeni fazla uzundur ve kompakt tasarım gerektirir; tamamlanmış baskı kalite kapısı olarak sunulmaz.

## Bilinen açıklar — tamamlandı denmemeli
- Yayın: Cloudflare alanı ve mevcut Pages projesi var; Rails çalıştıracak sunucu/PG hesabı bildirilmedi. Yerel Docker ve PostgreSQL yok. Ücretli kaynak açılmadı. Canlı alan adı yayını yapılmadı.
- Avenir sadece kullanıcının kurulu yerel fontu olarak kullanılıyor; diğer ziyaretçilere dağıtılacak webfont lisansı yok. PDF DejaVu gömülü font kullanır.
- İsimler draft. 17 kaynak koşullu sayfa held/noindex (godovi ve doğrulanmamış gelecek okul yılları). Yayın kalite kapısı tamamlanmadı.
- Baskı önizlemeleri tür/döneme bağlandı. Yoğun özel içerik ek sayfalarda korunur; uzun/geçersiz metin ve tarihler açık hata ile reddedilir. Ancak 15 gerçek farklı düzen, bütün tür/yıl çiftlerinin gerçek raster üretimi, siyah-beyaz renk tutarlılığı, kompakt tatil baskısı, ZIP içi manifest/README ve son görsel kalite kapısı hâlâ tamamlanacak. Fotoğraf yükleme ve bazı gelişmiş planlama seçenekleri eksik.
- ICS UTC/TZID, çok günlük süre ve yaz saati belirsizlikleri doğrulanır; desteklenmeyen tekrar kuralı sessiz veri kaybı yerine reddedilir. Ay/yıl filtreli ve konuya özel tatil ICS aktarımları doğrulandı.
- Günlük burç sadece gerçekten hazırlanmış tarihte mevcut; sonraki günlerin editoryal üretimi ve yayın akışı tamamlanmadı.
- Dockerfile bin/thrust referansı ve dağıtım belgeleri düzenlenecek; üretim yedek geri yükleme henüz denenmedi. Git deposuna aktarım henüz yok.
- 43 kabul maddesinin tamamı henüz geçmiş değildir; kalan maddeler gerçek kanıtla işaretlenecek.

## Yeniden başlatma
Çalışma alanının work/runtime/mise/installs/ruby/4.0.7/bin dizinini PATH başına ekleyin. Uygulama outputs/koledar365 altında.
- Web: bundle exec rails server -p 3650 -b 127.0.0.1
- İşçi: bundle exec ruby bin/jobs
- PDFTOPPM_BIN: /Users/melihozcan/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdftoppm
- PYTHON_BIN: /Users/melihozcan/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3
- Test: bundle exec rails test
Ara scripts: work/professional_design.py ve work/metadata_and_editorial.py bir kez uygulandı; yeniden çalıştırmayın (son tipografi düzeltmelerini koruyun).

## İlk kurulum hatası
İlk scaffold çağrısındaki --skip-active-mailbox yerine desteklenen seçenek --skip-action-mailbox. Oluşmuş dosyalar korunarak engine kaldırıldı, scaffold tekrar çalıştırılmadı. Kurulu yardım çıktısı work/rails-new-help-8.1.4.txt içinde.
