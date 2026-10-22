# Koledar365 yayın kabul raporu

Durum: Yerel doğrulama / yayın öncesi.

| Ölçüm | Gerçek sonuç |
|---|---|
| Sitemap / indekslenebilir HTML | 391 / 391 |
| Canonical hatası / düzeltilen canonical | 0 / 0 (başlangıç envanteri doğruydu) |
| llms bağlantı / Slovence bölüm | 53 / 10 |
| Temsilî örnek / ekran genişliği | 69 / 8 |
| Chromium temel + responsive | 1200 kontrol; 0 hata |
| WebKit | 138 kontrol; 0 hata |
| Axe | 138 kontrol; 0 hata |
| Klavye | 138 durum; 0 hata |
| İndirme dosyaları | 6556; 6556 başarılı, 0 başarısız |
| Katalog / yeni koleksiyon PDF-WebP çiftleri | 2820 / 780 |
| Yeni koleksiyon piksel kimliği | 780 çift; 0 hata |
| Gerçek XLSX/PDF/baskı akışı | 108; 0 hata |
| Canlı hash/MIME kontrolü | bekleniyor; — hata |

Sitemap index ve 391 özgün yıl/ay/şehir/konu URL'si korunur. Lastmod, içerikle eşleşen sayfa değişiklik kaydından gelir; tarihi bilinmeyen sayfalarda çıkarılır. Yeni sayfalar otomatik eklenir, silinen/noindex sayfalar ayıklanır. 790 image sitemap kaydı korunur. LLMS: https://koledar365.si/llms.txt . Kaynaklı kararlar: ../seo-research-2026-10-22.md.

Önceki 2026 içerikleri ve PR #58 korunmuştur. Mevcut ana dalın takvim dizini, mobil astronomi ve favicon değişiklikleri birleştirilmiştir. Uygulama testi: Ayrıntılar Rails test günlüğünde ve CI kanıtında. Son tarayıcı paketi: 408 geçti, 0 başarısız, 8 koşullu atlandı. Ayrıntılı JSON ve atlama gerekçeleri kanıtlar içindedir.

Açık üretim adımları varsa `build-production-parity.md` açıkça belirtir. Çalıştırılmamış kontrol başarılı sayılmaz. Ayrıntılar diğer raporlarda, test düzeltmeleri ve sınırlar `implementation-notes.md` içindedir.

