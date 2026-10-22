# İşlevsel testler

Durum: yerel, önizleme ve canlı işlev kontrolleri tamamlandı. Sonuçlar ve ilk başarısız denemeler aşağıda ayrı kaydedilmiştir.

- Rails: 136 test, 13.873 assertion, sıfır hata; `tmp/final-audit/rails-tests-final.log`.
- İlk dört tarayıcı projesi turu: 462 geçti, 8 bilinçli kapsam tekrarı atlandı, 2 Safari test beklentisi hatası. Safari 1875, Chromium 1.875 biçimini seçer; ikisi de aynı doğru sonuçtur. Test iki geçerli biçimi kabul edecek şekilde düzeltildi; ilgili 24 test dört projede geçti. Başarısız ilk sonuçlar `current/first-browser-suite/` içinde saklandı.
- 8 skip: tüm sitemap taraması üç ek projede tekrarlanmaz; Chromium PDF üretimi üç ek projede tekrarlanmaz; tam 600 ppi WebP iki WebKit projesinde tekrarlanmaz. Bunların karşılıkları Chromium ve diğer akış testlerinde vardır; skip başarılı test olarak sayılmaz.
- 108 gerçek indirme/baskı etkileşimi ve bağımsız dosya açma kontrolü geçti.
- Klavye: 138 senaryo, 4.900 odak durağı, dört özel modal/navigasyon/indirme akışı geçti.
- Ay: 1.461 gün/198 olay; eğitim ve saat değişimi sözleşmeleri geçti.

Ana sayfadan yıl/aya, tasarım ve indirmeye; Ay yılı/ayı/tarih/evreye; çalışma günü ve kaydırma hesaplarına; stüdyo özelleştirme/önizleme/çıktıya; okul filtreleri/geri yükleme/takvim bağlantılarına; şehir/tarih/yerel güneş olaylarına yönelik mevcut regresyonlar korunur. Arama klavyesi, aksan duyarsızlığı, öneriler, boş/hatalı sorgular, çerez seçimleri, yerel kayıt ve sıfırlama da kapsamdadır.

İletişim formu: anonim yeni tarayıcıda HTTP 200, hesap oturumu zorunlu değil. E-posta, konu ve mesaj alanları görüldü. Boş alan denemesinde `To je obvezno vprašanje` mesajı doğrulandı. Test formResponse isteğini engelledi; yeni yanıt/mail gönderilmedi. Gmail veya Search Console açılmadı; bu tur e-posta teslimatını yeniden onayladığını iddia etmez. Kanıt `current/contact-public-form.json`.

Gerçek eksik URL için HTTP 404 kontrolü korunur. /404.html dosyasının Cloudflare tarafından /404'e yönlendirilip 200 ile sunulması hata sayılmaz; noindex hata belgesine doğrudan erişimdir. Önceki testin bu ikisini karıştıran sekiz başarısız ekran beklentisi düzeltildi.

Son tam dört proje turu: **468 geçti, 8 bilinçli skip, 0 başarısız**. Koordinat kaynak bağlantısı değişiminden sonra dört projede 28 güneş testi ayrıca geçti. Son Rails turunda ilk çağrı yanlış sistem Python sürümünü kullandığı için fotoğraf testi başarısız oldu; yayın yapılandırmasındaki Pillow içeren PYTHON_BIN ile tam tekrar 136/13.873 sıfır hata verdi. Her iki log korunur.

Ana dalın eşzamanlı otomatik yayınıyla normal birleştirme ve yeniden üretimden sonra 52 güneş/çalışma günü tarayıcı testi ve 6.556 dosya hash kontrolü yeniden geçti.

Gece yarısı regresyonu ilk denemede derleme gününün korunduğunu göstererek başarısız oldu. Varsayılan güneş tarihi Europe/Ljubljana bugünü kullanacak şekilde düzeltildi; açık tarih, 29 Şubat, geçersiz bağlantı ve tarayıcı geri dönüşü korunur. Son güneş turu: 32/32 geçti. Önizlemede 552 düzen bağlamından 551 geçti; Chromium çalıştırıcısında bir görüntü yükleme süresi doldu. Bu başarısızlık `current/preview-prior-layout.json` içinde saklandı. Tarayıcıların ön plandaki ziyaretçi gibi çalışması için arka plan kısıtlaması kapatıldı; görüntü çözme ve bütün doğrulamalar zorunlu kalır. Son tam önizleme tekrarında 552/552 düzen ve 138/138 erişilebilirlik kontrolü geçti.

Son çalıştırıcı kontrolü: 36 sentetik görüntü senaryosu geçti. Bozuk görüntülü sekiz negatif kontrol beklendiği gibi reddedildi; gerçek görsel çözme kapısı gevşetilmedi.

Gece yarısı düzeltmesini içeren tam 476 senaryolu son tur: **468 geçti, 8 gerekçeli skip, 0 hata** (`current/browser-final/results.json`, `current/logs/playwright-midnight-final.log`).

## Canlı üretim sonuçları

`https://koledar365.si` üzerinde tam 476 senaryo çalıştı: ilk tur 465 geçti, 8 gerekçeli skip, 3 başarısız kontrol. WebKit baskı testlerinde asenkron render mevcut tabloyu değiştirdiği anda eski DOM öğesinin stili okunmuştu. Bahçe fotoğrafı testinde ana sayfadan lisans sayfasına hemen geçiş, henüz devam eden ayrı hava durumu isteğini iptal etmişti; WebKit bunu erişim kontrolü hatası olarak raporladı. İz kayıtları `current/browser-production-first/` altında korunur.

Testler mevcut `data-free-ready` durumunu ve hava durumu isteğinin tamamlanmasını bekler; baskıda gerçek `display: table`, başlık yüksekliği, tüm fotoğraf/lisans hashleri ve sıfır sayfa hatası beklentileri korunur. İki etkilenen test dört tarayıcı profilinde üçer kez tekrarlandı: **24/24 geçti** (`current/browser-production-stability/results.json`). Uygulama dosyaları değiştirilmedi. Bu sonuç, ilk tam canlı turun hiç başarısız olmadığını iddia etmez; tespit edilen üç kontrolün düzeltilip tekrar doğrulandığını gösterir.

Canlıda ayrıca 1.200/1.200 düzen, 138/138 axe, 1.572/1.572 yönlendirme ve 8.014/8.014 dosya karşılaştırması geçti. Üretim doğrulama GitHub çalışması: https://github.com/mateopedersen/koledar365-si/actions/runs/39865775941 (success).

## Son tam canlı regresyon turu

Hazır olma düzeltmelerinden sonra bütün 476 senaryo canlı alan adında yeniden çalıştırıldı: **468 geçti, 8 gerekçeli skip, 0 başarısız** (8,3 dakika). Kanıt: `current/browser-production-final/results.json` ve `current/logs/playwright-production-final.log`. İlk üç zamanlama hatası önceki bölümde ve ham izlerde korunmuştur. Bu son tam tur yalnızca etkilenen iki testi değil, dört projenin tamamını tekrar doğrular.

Gerçek halka açık Ljubljana hava durumu yanıtı ayrıca HTTP 200/application-json, güncel saatlik model ve 12 sonraki saatle doğrulandı (`current/live-weather-check.json`). İlk urllib isteği 403 aldı; curl ile alınan başarılı yanıt ve bu fark birlikte kaydedildi. Herhangi bir erişim güvenliği veya uygulama davranışı değiştirilmedi.
