# Yayın kuralları: 22 Ekim 2026

## Google Search Central

- XML sitemap UTF-8, mutlak canonical URL'ler ve doğru namespace kullanır. Tek dosya sınırı 50.000 URL / sıkıştırılmamış 50 MB. `priority` ve `changefreq` Google tarafından kullanılmaz. `lastmod` yalnız anlamlı içerik değişimini temsil ediyorsa yararlıdır; kayıt aktarımı, derleme zamanı veya telif yılı güvenilir gerekçe değildir. Sitemap gönderimi indeksleme garantisi vermez. [Sitemap oluşturma](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- Mevcut kök sitemap index korunur. 391 sayfalık envanteri sırf dosya sayısını artırmak için bölmeye gerek yoktur. Alt sitemap aynı sitenin kökünde kalır. [Sitemap index](https://developers.google.com/search/docs/crawling-indexing/sitemaps/large-sitemaps)
- Her özgün yıl/ay kendi canonical adresini korur. HTML, HTTP başlığı, sitemap ve iç bağlantılar çelişmemelidir. Parametreli araç durumları kalıcı sayfayı canonical gösterir. [Canonical yöntemleri](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [canonical seçimi](https://developers.google.com/search/docs/crawling-indexing/canonicalization)
- Navigasyon gerçek `a href` bağlantıları içerir; yalnız tıklama olayına bağlı adresler yeterli değildir. [Taranabilir bağlantılar](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- Google Search, llms.txt'yi özel optimizasyon/sıralama sinyali olarak kullanmadığını açıkça belirtir. Dosya diğer destekleyen araçlar içindir. [Üretken yapay zekâ rehberi](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- Güncelleme günlüğü 21 Ekim 2026'da paylaşım kontrolleri, 16 Ekim'de Indexing API kotası, 8 Ekim'de UGC programı ve 1 Ekim'de üretken içerik rehberi değişikliklerini listeliyordu. Bunlar yeni sitemap ya da llms.txt zorunluluğu oluşturmuyor. Canonical kavram belgesi 20 Ağustos 2026 tarihliydi; sitemap index belgesi 10 Aralık 2025 tarihliydi. [Resmî güncelleme günlüğü](https://developers.google.com/search/updates)

## Ayrı topluluk önerisi ve erişilebilirlik standardı

- llmstxt.org önerisinin 10 Ağustos 2026 tarihli v2 sürümü incelendi. Site adı H1, özet, H2 konu bölümleri ve açıklamalı bağlantılar kullanılır. `rel=describedby` keşfe yardımcı olur. Topluluğun Markdown kopyaları önerisi nedeniyle yüzlerce gereksiz içerik kopyası oluşturulmadı. Kullanıcının istediği kısa Slovence rehber, gerçek HTML canonical hedeflerini gösterir. [llms.txt topluluk önerisi](https://llmstxt.org/)
- Klavye erişimi, odak sırası/görünürlüğü, odağın örtülmemesi, etiketler, kontrast ve hedef boyutları WCAG 2.2 AA kapsamında incelenir. Otomatik tarama ve seçilmiş klavye görevleri tüm standarda uygunluk sertifikası değildir. [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

## Uygulama kararı

Yayın sitemap'i gerçek üretilmiş canonical HTML envanterinden tekrar oluşturulur. Kaynak sayfa silinirse önceki dışa aktarmaya ait HTML temizlenir. Sayfa bazında anlamlı içerik geçmişi bulunmadığından isteğe bağlı `lastmod` alanı çıkarılır. Takvim görsellerinin mevcut image sitemap kayıtları korunur. llms.txt bağlantıları aynı envantere karşı doğrulanır; eksik, noindex veya yanlış canonical hedefi derlemeyi durdurur.
