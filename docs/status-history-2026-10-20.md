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
- Yerel kişisel olay, görev, not, ICS ve yedekleme arayüzleri mevcut. Yönetim ekranı parola korumalı; mateo hesabı oluşturuldu. Rastgele parola yalnız 0600 izinli, Git dışında storage/private-admin.txt dosyasında.
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
- Dockerfile düzeltildi. PostgreSQL + web + işçi + HTTPS proxy Compose tanımı var. Üretim yedek geri yükleme henüz denenmedi; dağıtım belgeleri tamamlanacak.
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

## Devam kaydı — 20 Ekim, baskı ve yönetim fazı
- Git deposu uygulama dizininde. Eski origin/main geçmişi korunarak rails-turnkey-2027-2030 dalı açıldı. Commitler: 3545d3c temel uygulama, 098213c eski geçmişi koruma, 19325c5 Docker/PostgreSQL/CI. Ana dal değiştirilmedi.
- Kullanıcının açık talimatıyla mateopedersen/koledar365-si deposu public yapıldı. Önce 463 geçmiş Git blob'u yaygın sır desenleri ve özel dosya adları için tarandı; eşleşme yok. Bu tarama mutlak sır-yok garantisi değildir.
- GitHub Actions ilk denemede hesap ödeme/limit engelinde başlamadı. Depo public olduktan sonra aynı kontrolün 2. denemesi geçti: PostgreSQL testleri, SEO/kaynak taraması, gerçek Docker build, production boot, 600 ppi çıktı. https://github.com/mateopedersen/koledar365-si/actions/runs/39417500303 . Bu 19325c5 sürümünü doğrular; sonraki değişiklikler yeniden doğrulanacak.
- Baskı v2 üzerinde çalışma sürüyor: fiziksel baskı payları, 9 punto yıllık tarihler, otomatik sayfalama, nötr siyah-beyaz raster kontrolü, tam manifest/README içeren ZIP ve anlamlı dosya adları. İlk 15 isimli raster + 180 tür/tasarım PDF üretildi. Görsel incelemede boşluk/yerleşim iyileştirmeleri uygulandı; yeni A5 hata düzeltmelerinin matrisi yeniden çalışıyor. Nihai baskı kapısı henüz geçmedi.
- Planlayıcı: ekle/düzenle/sil/tamamla, başlangıç-bitiş/mola, sınıf, JSON yedek/geri yükleme, gerçek ICS. Gece vardiyası ve DST süre testi. Rojstni dnevi için 29 Şubat seçimi ve 2027–2030 aktarımı. Canlı saatli geri sayım + tarih/saat/zone paylaşımı.
- Fotoğraf: gerçek dosya çözümleme, 20 MB/40 MP sınırı, EXIF kaldırma, seansa bağlı 7 günlük özel depolama, kişisel POST önizleme, diğer seansın erişimini reddetme. Rasterin yerleştirilen baskı ölçüsünde en az 600 etkili ppi hedefi; nihai PDF ölçüm kanıtı tamamlanacak.
- Yönetim: gerçek hesap, parola değişimi, sayfa başlık/metin/meta düzenleme, kaynak kapısını koruma, günlük burç düzenleme ve atomik JSON toplu içeri aktarma; sekiz günlük hazırlık/izleme tablosu. Üretim API anahtarı olmadığından gerçek editoryal giriş kullanılır. Otomatik eski metni yeni tarihli gösterme yok.
- Son yerel test: 45 test / 1.665 doğrulama / sıfır hata. evidence/tests-planners.txt. Tarayıcıda gece vardiyası ekleme+düzenleme ve kişisel 3 sayfalı önizleme geçti.
- İşçi PID 80366 kontrollü kapatıldı; v2 değişiklikleri bitince güncel kodla yeniden başlatılacak. Web halen 3650; filtre parametreleri değiştiği için web yeniden başlatılmalı.
- Sonraki somut işler: baskı son görsel/raster kapısı ve 8.561 ad glyph/sığma QA; popülerlik sırasıyla yayın; önemli gün merkezi filtreleri; üretim backup/restore ve docs; kabul matrisi; geniş tarayıcı/SEO/hız kanıtı; güncel kodu commit/push ve yeni CI.
- Canlı alan adı için hâlâ Rails çalıştıracak host ve yayımlanacak işletmeci iletişim e-postası gerekiyor. GitHub public değişikliği CI engelini çözdü, tek başına Rails hosting sağlamıyor.

## Son kalite kapısı ve yayın sayıları
- Şablon 2.0.1: 180 tür/tasarım PDF + eşleşen gerçek WebP üretimi bitti. Bağımsız Pillow/pypdf doğrulaması: 180/180; her sayfada marka, doğru A4 fiziksel boyutu, 4961×7016 px, sRGB, BW nötr pikseller, PDF gömülü font. Çok sayfalı ZIP'te bütün sayfalar + manifest + README. evidence/export-matrix-v2.json ve export-file-verification.json.
- Yerleşim: 1.080 kombinasyon, sıfır hata; bütün tarihlerin eksiksiz/tekil olması ve en az 8,5 punto kontrolü. Yıllık tarihler 9 punto. 15 isimli tasarım görsel olarak evidence/print-v2-contact-sheet.jpg üzerinde incelendi; kalabalık ve boşluk sorunları yeniden düzenlendi.
- 8.561 isimde dört font glyph kontrolü ve en dar iki başlık geometrisinde Sans/Serif sığma kontrolü sorunsuz: evidence/name-layout-audit.json. Gerçek isim havuzunun en uzun adları 16 karakter civarıdır. 100 karakter özel giriş ve fotoğraf ayrı sınır kontrolleri kapsamındadır.
- evidence/print-gate.json geçerli. 200 → 1.000 → 8.561 popülerlik sıralı isim yayını gerçekten çalıştı. 326 sayfa published, 17 held; 8.561 isim published. Bu yerel uygulama yayın durumudur; canlı alan adı veya Google indeksi iddiası değildir. evidence/publication.json.
- SEO: 343 plan yolu + 8.561 isim + lisans sayfası = 8.905 sayfa, sıfır sorun. evidence/seo-audit.json. Tatil 58 ayrıntı/232 konu-yıl ICS tekrar sorunsuz.
- 2029'un 12 ayı gerçek tarayıcıda açılıp görüntülendi. Nisan/Temmuz/Aralık altı satır; dış taşma yok. evidence/calendar-2029-browser.json ve calendar-2029-review.jpg.
- 8 sayfa ailesi × 7 genişlik (320/376/390/768/1024/1440/1920) = 56 tarayıcı görünümü, dış yatay taşma yok. Uygulama tarayıcısının ölçeği nedeniyle 375 yerine 376 px kullanıldı. evidence/responsive-final.json. Core Web Vitals saha doğrulaması değildir.
- Planlayıcıya tekrarlayan haftalık ders ekleme ve günlük saat aralığı seçimi eklendi. Desteklenmeyen özel glyph açık hata verir. İndirme dosya sözleşmesi 1.1, exact isim + SHA ve güvenli ayırt edici dosya adı taşır; baskı düzeni 2.0.1 değişmedi. Yeni sözleşme örneği istek 213: 2030, A5 yatay, BW, altı PDF/WebP sayfası; evidence/file-contract-v1.1.json. Eski 180 eşleşme sözleşme 1.0 ile gerçek raster kalite kanıtıdır.
- Yönetim hesabı mateo, parola yalnız storage/private-admin.txt (0600). Uygulama kaynak deposuna veya rapora parola yazılmadı.
- Son test (son pagination testi öncesi): 46 test / 1.670 doğrulama / sıfır hata. Yeni kaynak ve UI değişikliklerinin son CI commit'i henüz gönderilmedi.
- Mimari, veri kaynakları, SEO ve deployment belgeleri docs dizininde. Şifreli age yedeği ve izole DB geri yükleme kontrolü eklendi. Yedek görevi henüz gerçek üretim hostuna kurulmadı. CI'ya PostgreSQL dump/restore kontrolü eklendi, çalışması bekleniyor.

## Sonraki commit için hazır kayıt
- ff2c15e GitHub'a gönderildi; PR: https://github.com/mateopedersen/koledar365-si/pull/1 (draft), sohbete bağlandı.
- ff2c15e gerçek üretim CI'sı geçti: https://github.com/mateopedersen/koledar365-si/actions/runs/39423386561 . PostgreSQL dump/izole restore, Docker build, production boot ve gerçek 600 ppi BW çıktı dahil. evidence/production-ci.json.
- Web güncel kodla yeniden açıldı: PID 97411, oturum 85699. İşçi yeniden açıldı: oturum 68129. Sürüm değişikliğinde işçi yeniden başlatılmalı.
- İlave düzenlemeler: sayıların bağlamına göre Slovence hâl eki, tarihli/isimli gerçek sosyal paylaşım PNG'si, eşit başlangıç/bitiş ve aşırı mola reddi, gerçek DST süreli vardiya toplamı. Zamanı olmayan vardiyalarda hesaplanmış sıfır yerine eksik saat açıklaması. Kişisel günlük görevler yalnız seçili gün için görünür.
- Güncel kaynak durumunda 49 test bekleniyor; evidence/tests-final.txt gerçek son çıktıdır. Yeni commit ve CI ile sayı kesinleşecek.
- 43 kabul maddesi evidence/acceptance.json ve docs/acceptance.md içinde dürüstçe işaretlendi. K13 kontrollü CWV lab/saha ve K16 tam ayrı klavye/200% zoom incelemesi tamamlanmadı; K31/K42 canlı Rails hostuna bağlı. Sadece yerel HTTP cevap ölçümü var; LCP/INP/CLS diye sunulmaz.
- Canlı yayın için sunucu ve yayımlanacak işletmeci iletişimi yeniden istendi; kullanıcı yanıtı bekleniyor. Yeni ücretli hizmet açılmadı.

## Kullanıcı yönlendirmesi — Cloudflare üzerinde yayın
Kullanıcı VPS istemiyor. GitHub + Cloudflare hedefi korundu: önce Workers Paid yetkisi ve Containers uygunluğu kontrol edilecek, Rails Docker korunacak, en küçük Worker yönlendirme katmanı kullanılabilecek. Kalıcı veritabanı için Cloudflare servisleriyle gerçek Rails CRUD/backup/restart testi; PDF/WebP için R2; GitHub otomatik deploy + HTTPS. İzin olmadan ücretli hizmet açılmaz. Herkese açık iletişim e-postası artık koledar365@gmail.com olarak kullanıcı tarafından sağlandı. Başka teknolojiye geçiş veya proje sıfırlama yetkisi yok. Containers uygun değilse somut test ve alternatif mimari onayı gerekli.

## Ücretsiz yayın yönü — son kullanıcı talimatı
Kullanıcı Kalendorius365 ile aynı ücretsiz GitHub + Cloudflare düzenini tekrar açıkça istedi; hiçbir ücretli hizmet açılmayacak. Mevcut Cloudflare hesabı Workers Free ($0); Containers ekranı “Workers Paid” satın alma kapısı gösteriyor. Ücretli Containers denenmiş/çalışıyor diye sunulmaz. Kalendorius365 deposu okundu: Ruby/Jekyll ile build, Pages statik HTML, kişisel veriler tarayıcıda, küçük salt okunur hava durumu Functions; sürekli Rails sunucusu yok. Yerel Rails kaynakları, testleri ve çıktı motoru korunacak. Ücretsiz hedef için Rails'te HTML üretimi + tarayıcıda Ruby baskı/hesap motoru fizibilitesi inceleniyor. Teknoloji değişikliği gizlenmeyecek; ücretsiz yayında yönetim ve saklama farkları açıkça kaydedilecek. Public iletişim: koledar365@gmail.com.
Son test çıktısı 50 test / 1696 doğrulama, 1 başarısız: strong parameters hatalı year dizisini düşürüp varsayılan yıla dönüyordu. Ham seçenekler yalnız normalize fonksiyonuna verilip skaler biçim denetlenerek düzeltildi; tekrar test edilecek.

## Ücretsiz tarayıcı Ruby denemesi ve toplu katalog
- Server/Rails dalı 9441c86 ile kaydedildi ve GitHub'a gönderildi. Güncel dal free-cloudflare-pages; eski kaynaklar silinmedi. Son yerel test: 50 test / 1697 doğrulama, 0 hata.
- Resmî ruby.wasm 2.10.1 (tarayıcı Ruby 4.0.0) ile gerçek Prawn motoru paketlendi. Rails build/runtime hâlâ Ruby 4.0.7. Slovence Špela Žan Črt adlı 2028 PDF'si, gerçek gömülü DejaVu fontlarıyla başarıyla üretildi (work/free-runtime/portable-sample.pdf). Bu henüz tarayıcı WebP veya canlı yayın kanıtı değildir.
- Tarayıcı yalnız gömülü TTF fontlarını destekler. BigDecimal yerel eklentisi bulunmadığından TTFunk kopyasında kullanılmayan CFF require satırı kaldırıldı; CFF font girişi yok. Takvim kuralları ve PdfRenderer kaynakları aynıdır.
- 1980 A4 dikey PDF/WebP çifti üretimi başladı: 48 aylık×15=720, 4 yıllık×15=60, 48 aylık Ay×15=720 ve diğer sekiz türün dört yıllık başlangıç örnekleri×15=480. Her seçili dönem için ayrıca Ruby motoruyla kişisel üretim hedefleniyor. İki dilimli süreç: 29780 ve 38852; raporlar evidence/release-catalog-0.json, -1.json. Yeniden başlatmada tamamlanmış fingerprintler korunur.
- Statik HTML ihracı: süreç 73306, script/export_pages.rb; sonuç site/ içine. Cloudflare Pages yayını henüz değiştirilmedi.
- Kişisel ücretsiz üretim dosyaları cloudflare/free; hava durumu için salt okunur Pages Function. Hiçbir ücretli kaynak açılmadı. Yeni ücretsiz gizlilik metni gerçek yerel işlem modelini ve Cloudflare/Gmail'i anlatır; eski sunucu seansı/7 günlük özel dosya saklama iddiaları ücretsiz sürümde yayımlanmaz.

## WebP ikinci bağımsız kontrol
Kullanıcı köşe, yazı ve hizalamaya özellikle iki kontrol istedi. Her yeni PNG→WebP kodlaması tekrar açılıp kaynak PNG ile piksel eşitliği ve sRGB profil baytları kontrol ediliyor. Ayrıca script/verify_release_pairs.py her dosya için PDF'den yeniden 600 ppi raster alır, gerçek WebP ile tam piksel eşitliği, dört 5 mm köşede mürekkep olmaması, gömülü font, marka, fiziksel ppi, ZIP içindeki sayfa baytlarını denetler. Devam eden süreçler 50750 / 3532; raporlar evidence/release-verification-0.json ve -1.json. Tamamlanmadan hepsi doğrulandı denmez.
Tarayıcı Ruby motorunun 180 gerçek PDF kompozisyonu + artık yıl / iş günü / ICS / DST / hatalı sayı testi geçti: evidence/portable-engine.json. Gerçek IAB tarayıcısında Ana 2027 min-01 önizlemesi ve 600 ppi WebP üretimi çalıştı; dosya Downloads içine indirildi ve Pillow ile 4961×7016 + sRGB kontrolü yapıldı. evidence/browser-name-webp.json. Üretimde/canlıda henüz test edilmiş değildir.

## Son teknik durum — ücretsiz uyarlama devamı
- 720 aylık ve 60 yıllık gerçek PDF/WebP çifti üretildi. Toplam ilk katalog 1980 çift; iki kontrol devam ediyor, bitiş iddiası yok. Son sayım için JSON raporlarına bakın.
- Eksik yıllık Ay PDF'si ve iş günü indirmeleri fark edildi ve eklendi. Ek katalog 840 çift: yıllık Ay 4×15=60; yıllık iş günü 4×15=60; aylık iş günü 48×15=720. Süreçler 23050 / 53632 (script/generate_extra_catalog.rb), raporlar evidence/release-extra-catalog-0/1.json. Bu çiftlerin bağımsız doğrulaması henüz başlatılmadı. İlk katalog süreçleri 29780 / 38852 sürüyor.
- Baskı motoru eski dönemlerin çizimini değiştirmedi; ek tür/scope parametreleri koşullu. Var olan fingerprintler korunur. Yeni tür workdays; lunar_scope=year yıllık Ayı 12 ay + gerçek USNO faz listeleri olarak üretir. Son yerel test 52 test/1707 doğrulama/0 hata (iki yeni gezinme testi bundan sonra eklendi, tekrar çalışacak).
- Browser engine 225 gerçek PDF düzeni/tür/scope + araçlar + ICS + DST + Ruby interpolation saldırısının literal metin kalması testi geçti (evidence/portable-engine.json). Ruby VM'ye girdiler Base64 ile geçirilir; kullanıcı metni eval içine Ruby çift tırnaklı dize olarak interpolasyonla konmaz.
- Ücretsiz site localhost:3651 üzerinde, statik dosyalar site/ altında. Web servisi süreç 8200; hava durumu yerel testte 3650 Rails'e salt okunur proxy olur; üretimde functions/vreme/[id].js kullanılacak. Public preview ilk örnekten sonra görünür oldukça aynı Ruby motoruyla gerçek isim/dönem görseline dönüşür. Browser PDF/PDF.js/libwebp, kayıpsız 600 ppi + sRGB, sonrasında yeniden decode piksel eşitliği eklenmiş durumda; son yeniden-decode yolu tarayıcıda henüz yeniden test edilmedi.
- Ücretsiz yönetim GitHub'ın gerçek yazma yetkilerini kullanır; site/upravljanje source düzenleme/Actions/geçmiş bağlantıları verir, sahte Rails login yayımlanmaz. Public içerik data/editorial/pages.json, horoscopes.json ve gerçek lastmod koruması name-publication.json ile snapshot. Kontakt gerçek mailto koledar365@gmail.com; sunucu inbox saklama iddiası kaldırıldı.
- Site export yeniden çalışıyor (17689), yeni iş günü/yıllık Ay seçenekleri ve haftalık/günlük gezinme dahil. Sonrasında sosyal PNG üretimi başlayacak. Cloudflare ayarları hâlâ değişmedi: build ruby build.rb, dist, production main. Free uyarlama henüz canlı değil.
- Finalize script'i 4 katalog raporu + bütün bağımsız ikinci kontroller bitmeden manifest üretmeyi reddeder. Public global catalog.json her çiftin tam manifestini taşır; ayrıca binlerce ayrı manifest URL'si ile ücretsiz Pages 20k dosya sınırı aşılmayacak. Çok sayfalı ZIP'in kendi manifest/README'si korunur. Mevcut site/prenosi altındaki önceki manifest.json kopyaları script/package_catalog.rb ile kaldırılır.
- Sonraki zorunlu işler: ek 840 çiftin ikinci doğrulaması; ücretsiz UI ve CSP altında gerçek indirme/ICS/fotoğraf/kaydet-reload testleri; native test+CI; reproducible GitHub günlük build ve kaynak hash kapısı; final public dosya sayımı/hash/gizli dosya taraması; commit/push ve Pages preview/canlı HTTPS doğrulaması; kabul raporu/docs/STATUS gerçeğe göre güncelleme. Ücretli plan veya yeni kaynak alınmadı.
