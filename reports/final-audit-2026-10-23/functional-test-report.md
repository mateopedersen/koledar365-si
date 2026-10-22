# İşlevsel testler

Durum: son yayın doğrulaması sürüyor. Bu dosya nihai canlı sonuçlarla güncellenecek. Son yayın paketinde tam tarayıcı tekrarına ek olarak binlerce statik dosya denetimi sürmektedir.

- Rails: 136 test, 13.873 assertion, sıfır hata; `tmp/final-audit/rails-tests-final.log`.
- İlk dört tarayıcı projesi turu: 462 geçti, 8 bilinçli kapsam tekrarı atlandı, 2 Safari test beklentisi hatası. Safari 1875, Chromium 1.875 biçimini seçer; ikisi de aynı doğru sonuçtur. Test iki geçerli biçimi kabul edecek şekilde düzeltildi; ilgili 24 test dört projede geçti. Başarısız ilk sonuçlar `current/first-browser-suite/` içinde saklandı.
- 8 skip: tüm sitemap taraması üç ek projede tekrarlanmaz; Chromium PDF üretimi üç ek projede tekrarlanmaz; tam 600 ppi WebP iki WebKit projesinde tekrarlanmaz. Bunların karşılıkları Chromium ve diğer akış testlerinde vardır; skip başarılı test olarak sayılmaz.
- 108 gerçek indirme/baskı etkileşimi ve bağımsız dosya açma kontrolü geçti.
- Klavye: 138 senaryo, 4.900 odak durağı, dört özel modal/navigasyon/indirme akışı geçti.
- Ay: 1.461 gün/198 olay; eğitim ve saat değişimi sözleşmeleri geçti.

Ana sayfadan yıl/aya, tasarım ve indirmeye; Ay yılı/ayı/tarih/evreye; çalışma günü ve kaydırma hesaplarına; stüdyo özelleştirme/önizleme/çıktıya; okul filtreleri/geri yükleme/takvim bağlantılarına; şehir/tarih/yerel güneş olaylarına yönelik mevcut regresyonlar korunur. Arama klavyesi, aksan duyarsızlığı, öneriler, boş/hatalı sorgular, çerez seçimleri, yerel kayıt ve sıfırlama da kapsamdadır.

İletişim formu: anonim yeni tarayıcıda HTTP 200, hesap oturumu zorunlu değil. E-posta, konu ve mesaj alanları görüldü. Boş alan denemesinde `To je obvezno vprašanje` mesajı doğrulandı. Test formResponse isteğini engelledi; yeni yanıt/mail gönderilmedi. Gmail veya Search Console açılmadı; bu tur e-posta teslimatını yeniden onayladığını iddia etmez. Kanıt `current/contact-public-form.json`.

Gerçek eksik URL için HTTP 404 kontrolü korunur. /404.html dosyasının Cloudflare tarafından /404'e yönlendirilip 200 ile sunulması hata sayılmaz; noindex hata belgesine doğrudan erişimdir. Önceki testin bu ikisini karıştıran sekiz başarısız ekran beklentisi düzeltildi.

Son tam dört proje turu: **464 geçti, 8 bilinçli skip, 0 başarısız**. Koordinat kaynak bağlantısı değişiminden sonra dört projede 28 güneş testi ayrıca geçti. Son Rails turunda ilk çağrı yanlış sistem Python sürümünü kullandığı için fotoğraf testi başarısız oldu; yayın yapılandırmasındaki Pillow içeren PYTHON_BIN ile tam tekrar 136/13.873 sıfır hata verdi. Her iki log korunur.
