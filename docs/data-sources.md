# Veri, kaynaklar ve yayın kapıları

Verilen 43 dosyanın SHA256 ve JSON/CSV/workbook eşleşme raporu: `evidence/package-review.json`. Kaynak paket `data/source`, gerçek takvim açıklamaları `data/topics_sl.json`, konuya özgü ek kaynaklar `data/topic_references_sl.json` içindedir. İthal idempotenttir: `bin/rails data:import`.

- Tatiller: PISRS ZPDPD ve 2 Ekim 2026 tarihli ZPDPD-I; değişiklik 17 Ekim 2026'da yürürlüktedir. 7 Ağustos Triglav günü yeni, işten serbest olmayan devlet tatilidir. 2027–2030 her yıl 23 yasal tarih/15 işten serbest tarih. Resmî tatil, işten serbest gün ve özel gün ayrı alanlardır. Hafta sonuna gelen tarih pazartesiye taşınmaz.
- İş günü referansı: pazartesi–cuma ve yasal serbest günler çıkarıldığında 255/250/248/249.
- Okul: GOV.SI resmî 2026/27 takvimi. 20 Ekim 2026 tekrar araştırmasında 2027/28 ve sonraki takvimler doğrulanamadı; bu, yayımlanmadığına dair mutlak iddia değildir. Dört gelecek okul yılı sayfası held durumundadır. Kaynak: https://www.gov.si/teme/solski-koledar-za-osnovne-sole/ .
- İsim: SURS halka açık toplulaştırılmış istatistik; bastırılan değerler sayı olarak tahmin edilmez. 8.561 tekil NFC aday. İlk 200 ve ilk 1.000 popülerlik sırası paketten gelir. SURS isim günü kaynağı değildir.
- Godovi: Ognjišče kaynağının kapsamı ve toplu yeniden kullanım hakkı doğrulanamadı. Kişilere rastgele gün atanmıyor; 13 sayfa held. Satış koşulları veri lisansı kabul edilmez; yayıncıdan hak doğrulaması gerekir.
- Ay/mevsimler: USNO ham yanıtları, kaynak URLleri ve UTC anları; gösterim Europe/Ljubljana. Güneş hesabı Ruby algoritmasıdır, model varsayımları kaynak sayfasında.
- Fotoğraf: 69 gerçek şehir ve 58 konu varlığı. `data/cities_sl.json`, `data/holiday_photos_sl.json`; tam yazar/lisans/orijinal URL ve adaptasyon açıklaması `/fotografije-in-licence/`. İki konu varlığı tarihî kitap reproduksiyonudur. Arşiv fotoğrafları gelecekteki etkinlik diye sunulmaz.
- Günlük burç: bilimsel tahmin olmayan özgün eğlence metinleri. Tarihli kayıt ve gerçek yayın zamanı. Anahtarı olmayan içerik API'si taklit edilmez; yönetimde manuel düzenleme, JSON ithali ve planlı yayın bulunur. Hazır metin yoksa açık eksik durumu gösterilir.

Veri düzeltmesinde kaynağı doğrulayın, kaynak dosyasını ve açıklamayı aynı committe değiştirin, ithali çalıştırın, tarih/SEO/baskı testlerini tekrarlayın. Ham veri değişikliği API cache anahtarına yansır. Basılı tarih kaynağı değişikliği çıktı fingerprintini değiştirir. Günlük burç değişikliği bütün PDF önbelleğini geçersiz kılmaz.
