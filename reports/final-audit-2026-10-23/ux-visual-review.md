# Görsel, mobil ve erişilebilirlik incelemesi

52 URL ailesinden 69 temsilci şablon/dönem senaryosu seçildi. Bunlar 69 farklı Rails partial olduğu anlamına gelmez. 320, 360, 390, 430, 768, 1024, 1280 ve 1440 px ekranlar; tüm 391 canonical sayfa ayrıca 390/1440 px. Manifesti doğrulanan yerel yayın üzerinde 1.200 Chromium düzen kontrolü sıfır hata; 138 WebKit kontrolü sıfır hata. H1 sınırları, yatay taşma, gerçek görsel decode, Avenir varlığı ve JavaScript hataları kontrol edildi. 69 temsilcinin telefon ve masaüstü görüntüleri kaydedildi; toplu görüntü sayfaları ve odaklı tam boyut/kırpımlar görsel olarak incelendi.

138 axe WCAG 2 A/AA, 2.1 A/AA ve 2.2 AA kontrolünde sıfır otomatik ihlal. 138 klavye senaryosu 4.900 odak durağı; menü Enter/Escape, odak dönüşü, Ay takvimi ok/Home/End/Space, stüdyo modal odağı ve Enter ile gerçek PDF indirme geçti. Bu sonuçlar engelli kullanıcılarla insan kullanılabilirlik çalışmasının veya bütün WCAG ölçütleri için sertifikanın yerine geçmez. `incomplete` renk/ARIA sonuçları raporda korunur.

Canlı başlangıç sürümünde 49 ekran bağlamında kontrast veya görünür/erişilebilir ad uyuşmazlığı bulunmuştu. Ana dalda mevcut fakat henüz yayımlanmamış düzeltmeler son pakette korunmuştur. Yeni tasarım sistemi kurulmadı: Avenir, Slovenya mavi/beyaz/kırmızı kimliği, PR58 navigasyonu ve mevcut araçlar korunur.

Mevsim sayfası yeni CSS gerektirmeden mevcut tablo ve mobil kart davranışını kullanır. Gerçek 16 olay, okunabilir yerel saat/UTC başlıkları ve dört yıl bağlantısı görsel olarak kontrol edildi. Örnek: `tmp/final-audit/seasons-new-review.jpg`. Baskı kontrol sayfası: `tmp/final-audit/print-review/sheet.jpg`.

## Test ortamı sorunu da raporlandı

İlk tam yerel tur, dolu 19783 portunda başka checkout sunucusuna bağlanmıştı. Sonuçlar `invalidated-wrong-server/` altında saklandı ve final başarı toplamına katılmadı. Yayın kapısı artık başlatılan sürecin yaşadığını ve HTTP release-manifest dosyasının yerel dosyayla birebir aynı olduğunu doğrular. Geçerli tekrar port 19785 üzerinde çalıştı. Baseline canlı tarama ve ayrı 19784 kontrolü bu karışıklıktan etkilenmedi.

## Performans kapsamı

Başlangıçta gerçek HTTPS üzerinde Lighthouse 12.8.2 mobil simülasyonu, altı sayfada birer ölçüm: `baseline/performance.json`. Ana sayfa LCP yaklaşık 2,92 s ve okul sayfası yaklaşık 3,05 s ile 2,5 s hedefinin üzerindeydi. Bu laboratuvar gözlemidir; gerçek kullanıcı CrUX/INP verisine veya Search Console'a erişilmedi. Son canlı ölçümler yayın doğrulamasında ayrıca kaydedilecek. Performans puanı için mevcut işlev/görsel sistem kaldırılmadı.
