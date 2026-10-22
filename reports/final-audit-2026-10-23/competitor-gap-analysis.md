# Rakip ve Google rehberi incelemesi — 23 Ekim 2026

Araştırma Slovence takvim, prazniki, PDF ve lunin koledar sorguları ile beş sitenin gerçek Chromium görünümlerine dayanır. Coğrafi olarak doğrulanmış Google Slovenya sıralaması iddia edilmez. Kanıt: `baseline/competitors/inspection.json` ve 390/1440 px ekran görüntüleri. Rakiplerdeki bilgileri resmî tarih kaynağı olarak kullanmadık.

| Site | Gözlenen yarar / sınırlılık | Koledar365 için karar |
|---|---|---|
| [Koledarček](https://www.koledarcek.com/) | Yoğun takvim ve doğrudan yıl seçimi; 390 px görüntüde masaüstü ızgara yatay kesiliyor. | 48 gerçek aylık ızgaranın dar ekranlarda taşmadan çalışmasını kontrol et; yoğun bilgiyi silme. |
| [Prazniki.si](https://prazniki.si/) | Basit ve taranabilir aylık/tatil listeleri. | Tatil ile işten muaf gün ayrımını, doğrudan çalışma günü hesabını ve yıl bağlantılarını koru. |
| [Koled.si](https://koled.si/koledar/2027) | Mobilde okunabilir modern takvim, ayrı çerez paneli. | Mevcut yıl/ay navigasyonunu koru; kullanıcının günlük saat değişikliğinin sonuç açıklamasına da yansımasını düzelt. |
| [Lunin.net](https://www.lunin.net/koledar/leto/2027/) | Evre takvimi mevcut; takvimden önce reklam alanları görüldü. | Gerçek Ay görsellerini, yerel saatleri ve bilimsel yöntem açıklamasını koru; yorumlarla astronomik gerçekleri karıştırma. |
| [JavniPodatki](https://javnipodatki.si/koledar) | Kaynak odaklı metin ve veri; üstte reklam/boşluk alanı var. | Resmî kaynakları verinin yanında tut. Mevsim sayfasını 16 gerçek astronomik başlangıç zamanı ile tamamla. |

Yeni işlevler icat ederek kapsam genişletilmedi. Kapatılan iki somut bilgi/işlev açığı: astronomik ve meteorolojik mevsimlerin açık ayrımı; özelleştirilen günlük çalışma süresiyle tutarlı sonuç metni. Mevcut PDF/WebP/XLSX, kişiselleştirme, okul takvimi ve hesaplayıcı akışlarının korunması regresyon testlerine bağlandı. Rakiplerin tüm işlevlerini test ettiğimiz veya hepsinden her ölçütte üstün olduğumuz iddia edilmez.

## Güncel Google rehberinden uygulanan ilkeler

[Search Essentials](https://developers.google.com/search/docs/essentials) ve [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide): taranabilir HTML, anlamlı bağlantılar ve doğru sayfa konusuna öncelik. [People-first içerik](https://developers.google.com/search/docs/fundamentals/creating-helpful-content): özgün hesaplama/çıktı yararı, kaynak açıklığı ve doğru belirsizlik; uydurma uzman yok. [Üretken yapay zekâ rehberi](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content): seri kelime doldurma yerine doğrulanabilir fayda.

[21 Ekim 2026 güncellemesi](https://developers.google.com/search/updates): robots meta, X-Robots-Tag, data-nosnippet ve Search generative AI control mevcut paylaşım kontrolleridir. Canonical ve sitemap tercih edilen URL'leri destekler; indeks garantisi değildir. [Canonical rehberi](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [sitemap rehberi](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

[AI optimizasyon rehberi](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide): llms.txt Google Search sıralama/indeksleme sinyali değildir; başka tüketiciler için tutulabilir. [Güncelleme kaydı](https://developers.google.com/search/updates) FAQ zengin sonuçlarının 7 Mayıs 2026'dan beri gösterilmediğini açıklar; mevcut soru-cevap içeriği için zengin sonuç sözü verilmez. [Yapılandırılmış veri kuralları](https://developers.google.com/search/docs/appearance/structured-data/sd-policies): görünen içerikle tutarlılık, sahte derecelendirme yok.

[Görsel SEO](https://developers.google.com/search/docs/appearance/google-images) ve [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals): anlaşılır ALT, gerçek görsel boyutları, yerleşim kararlılığı ve kullanıcı deneyimi; laboratuvar TBT değeri gerçek kullanıcı INP ölçümü olarak sunulmaz.
