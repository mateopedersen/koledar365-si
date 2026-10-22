# Görsel, mobil ve erişilebilirlik incelemesi

52 URL ailesinden 69 temsilci şablon/dönem senaryosu seçildi. Bunlar 69 farklı Rails partial olduğu anlamına gelmez. 320, 360, 390, 430, 768, 1024, 1280 ve 1440 px ekranlar; tüm 391 canonical sayfa ayrıca 390/1440 px. Manifesti doğrulanan yerel yayın üzerinde 1.200 Chromium düzen kontrolü sıfır hata; 138 WebKit kontrolü sıfır hata. H1 sınırları, yatay taşma, gerçek görsel decode, Avenir varlığı ve JavaScript hataları kontrol edildi. 69 temsilcinin telefon ve masaüstü görüntüleri kaydedildi; toplu görüntü sayfaları ve odaklı tam boyut/kırpımlar görsel olarak incelendi.

138 axe WCAG 2 A/AA, 2.1 A/AA ve 2.2 AA kontrolünde sıfır otomatik ihlal. 138 klavye senaryosu 4.900 odak durağı; menü Enter/Escape, odak dönüşü, Ay takvimi ok/Home/End/Space, stüdyo modal odağı ve Enter ile gerçek PDF indirme geçti. Bu sonuçlar engelli kullanıcılarla insan kullanılabilirlik çalışmasının veya bütün WCAG ölçütleri için sertifikanın yerine geçmez. `incomplete` renk/ARIA sonuçları raporda korunur.

Canlı başlangıç sürümünde 49 ekran bağlamında kontrast veya görünür/erişilebilir ad uyuşmazlığı bulunmuştu. Ana dalda mevcut fakat henüz yayımlanmamış düzeltmeler son pakette korunmuştur. Yeni tasarım sistemi kurulmadı: Avenir, Slovenya mavi/beyaz/kırmızı kimliği, PR58 navigasyonu ve mevcut araçlar korunur.

Mevsim sayfası yeni CSS gerektirmeden mevcut tablo ve mobil kart davranışını kullanır. Gerçek 16 olay, okunabilir yerel saat/UTC başlıkları ve dört yıl bağlantısı görsel olarak kontrol edildi. Örnek: `current/seasons-mobile.jpg`. Baskı kontrol sayfası: `current/print-review.jpg`.

## Test ortamı sorunu da raporlandı

İlk tam yerel tur, dolu 19783 portunda başka checkout sunucusuna bağlanmıştı. Sonuçlar `invalidated-wrong-server/` altında saklandı ve final başarı toplamına katılmadı. Yayın kapısı artık başlatılan sürecin yaşadığını ve HTTP release-manifest dosyasının yerel dosyayla birebir aynı olduğunu doğrular. Geçerli tekrar port 19785 üzerinde çalıştı. Baseline canlı tarama ve ayrı 19784 kontrolü bu karışıklıktan etkilenmedi.

## Performans kapsamı

Başlangıçta gerçek HTTPS üzerinde Lighthouse 12.8.2 mobil simülasyonu, altı sayfada birer ölçüm: `baseline/performance.json`. Ana sayfa LCP yaklaşık 2,92 s ve okul sayfası yaklaşık 3,05 s ile 2,5 s hedefinin üzerindeydi. Bu laboratuvar gözlemidir; gerçek kullanıcı CrUX/INP verisine veya Search Console'a erişilmedi. Son canlı ölçümler `current/performance-after.json` içinde kaydedildi. Performans puanı için mevcut işlev/görsel sistem kaldırılmadı.

## Canlı görsel doğrulama

Aynı kapsam üretim alan adında tekrarlandı: 1.200/1.200 Chromium düzen ve 138/138 axe kontrolü geçti (`current/production-browser/`). 390 px mevsim, Ljubljana güneş, çalışma günü hesaplayıcı ve hakkında sayfalarının canlı ekranları ayrıca birlikte incelendi (`current/production-mobile-review.jpg`); taşan başlık, kesilen kontrol veya okunamayan ana içerik görülmedi. Önceki 49 erişilebilirlik bağlamındaki sorun son canlı turda görülmedi.

## Önce / sonra mobil laboratuvar ölçümü

| Sayfa | Önce puan | Sonra puan | Önce LCP | Sonra LCP |
|---|---:|---:|---:|---:|
| / | 92 | 97 | 2.92 s | 2.42 s |
| /koledar/2028/februar/ | 97 | 95 | 2.14 s | 2.35 s |
| /lunin-koledar/2029/avgust/ | 95 | 98 | 2.52 s | 1.90 s |
| /delovni-dnevi/2028/ | 96 | 95 | 2.28 s | 2.21 s |
| /solske-pocitnice/ | 90 | 93 | 3.05 s | 2.66 s |
| /datumski-kalkulator/ | 98 | 98 | 1.91 s | 2.06 s |

Son altı ölçümde erişilebilirlik ve SEO Lighthouse puanı 100; CLS 0 ve TBT 0. Bu puanlar tüm SEO koşullarını veya gerçek kullanıcı INP değerini kanıtlamaz. Beş sayfada laboratuvar LCP ≤2,5 s; okul tatili sayfası 2,66 s ile hedefin biraz üzerinde (başlangıçta 3,05 s). Bu P2 performans izleme notu açık tutulur; indekslemeyi veya temel kullanımı engelleyen bir hata değildir. Tek ölçümlü önce/sonra sonuçları ağ ve makine varyasyonundan etkilenir; farkın tamamı kod değişikliğine atfedilmez. Avenir, görseller veya işlevler puan yükseltmek amacıyla kaldırılmadı.
