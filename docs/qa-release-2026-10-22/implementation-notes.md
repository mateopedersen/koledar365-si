# Uygulama ve kontrol notları

## Kaynak ve kapsam

Rails statik yayını; 2026 arşivi ve 2027–2030 dönemleri korunur. PR #58 ile eklenen 15 tasarım/52 dönem koleksiyonu değiştirilmez. 391 indekslenebilir canonical sayfa, 702 üretilmiş HTML dosyası; özel/parça/hata sayfaları sitemap dışında kalır. Test matrisi 69 temsilî URL/şablon-dönem örneğidir; 69 farklı kaynak partial olduğu iddia edilmez.

## Yapılan düzeltmeler

- Sitemap gerçek indexable HTML envanterinden üretilir; silinen kaynak sayfaların önceki dışa aktarıma ait HTML çıktıları ayıklanır. Sahte lastmod yerine alan çıkarılır. 790 image sitemap kaydı korunur.
- llms.txt: 53 doğrulanmış canonical bağlantı, 10 doğal Slovence konu bölümü; UTF-8 text/plain; build sırasında kapsam kontrolü.
- Koyu panellerde açık yazı ve küçük metinlerde kontrast; görünür odak göstergeleri; modalda Tab/Shift+Tab sınırları ve Escape sonrası odak dönüşü.
- Görünür metinle uyumlu erişilebilir adlar; tanım listesi ve vardiya tablosunun doğru semantiği; dekoratif işaretlerin erişilebilir addan çıkarılması.
- Okul seçicisinde 768 px taşması, Studio mobil sekme çakışması ve fotoğraf kaynak bağlantısının dokunma alanı düzeltildi.
- Baskıda kağıt/yön seçimi tarayıcıya bırakılır; aylık/yıllık hücre boyutları ayrılır; ay blokları bölünmez; Ay takvimi, aile ve okul baskıları sadeleştirilir.
- Kaynak commit ve SHA-256 manifesti; yayından önce kapsamlı kalite kapıları; yayından sonra Cloudflare manifesti, HTML, CSS/JS byte eşitliği kontrolü.

## Test düzeltmeleri ve sınırlar

1. Inline axe enjeksiyonu CSP tarafından doğru biçimde engellendi. Test, aynı origin üzerindeki geçici test rotasından axe yükler; sitenin CSP koruması gevşetilmedi.
2. Kişiselleştirilmiş PDF akışı iki adımlıdır: hazırlama ve görünür indirme bağlantısı. İlk test tek tıklama varsayımını düzeltti.
3. Yılın tasarımda `20` ve `27` olarak ayrı satırlarda yazılması, PDF metin kontrolünde yanlış alarm oluşturdu; test aradaki boşlukları doğru işler.
4. Tam sayfa ekran görüntüsü tek başına lazy görselleri yüklemez. Son tarama gerçek kaydırma ve görsel decode tamamlanmasını bekler.
5. Derleme dosyaları değiştirirken başlatılan dosya taramaları geçici eksik dosya bildirdi. Bu sonuçlar kabul kanıtı sayılmadı; tamamlanmış statik yayın üzerinde tekrar çalıştırıldı. CI sıralaması build → dosya testleri → tarayıcı şeklindedir.
6. Poppler'ın düşük çözünürlüklü CMYK→RGB çıktısı ile 600 ppi WebP'nin küçültülmüş görüntüsü, renk dönüşümü ve ince çizgi antialiasing nedeniyle piksel/kenar eşiğinde yanlış alarm verdi. Kimlik kontrolü her iki dosyanın SHA-256 değerini ve yeniden açılan 600 ppi RGB piksellerinin hashini mevcut PDF raster kanıtına bağlar. Poppler küçük görselleri ayrıca üretilir; renk/kenar farkları tanısal veridir. Yeni bir bağımsız 600 ppi PDF render eşitliği iddia edilmez.
7. İşletim sistemi yazıcı sürücüsü veya fiziksel baskı kontrol edilmez. Gerçek sayfa düğmeleri ve seçilen seçenekler çalıştırılır; Chromium baskı motorunun PDF çıktıları açılıp görsel olarak incelenir.
8. Otomatik WCAG taraması ve gerçek klavye görevleri tam WCAG sertifikası değildir. Ekran okuyucuyla kapsamlı insan testi yapılmış gibi gösterilmez.
9. Avenir font ailesi korunur. Kullanıcının sisteminde Avenir varsa kullanılır; diğer sistemlerde tanımlı fallback fontlar çalışır. Lisanslı Avenir dosyası dağıtıldığı iddia edilmez.

10. Aynı sekmede çok hızlı ardışık indirmelerde uygulama “Prenos pripravljen.” durumuna geçtiği halde Chromium download olayı üretmedi. Hata farklı aylarda görüldü; aynı aylar tekil yeniden kontrolde indi. Her export testine yeni sayfa verilerek tarayıcının sekme bazlı toplu indirme limiti ile ürün hatası ayrıldı. Güvenlik ayarı kapatılmadı. [Chromium DownloadRequestLimiter kaynak açıklaması](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/browser/download/download_request_limiter.cc)

11. Safari/WebKit gizli satırlardaki lazy görselleri istemediğinden tüm document.images için decode beklemek kilitleniyordu. Kaydırma sonrası yalnızca görüntülenen görseller decode edilir; görünür bozuk görsel hâlâ hatadır. 138 Safari kontrolü yeniden geçti.
12. Orijinal yıllık PDF tasarımındaki üç üst üste yıl katmanı pypdf tarafından `202720272027` gibi okunur. Kontrol yalnızca bir ila üç tam ve aynı yıl birimini kabul eder; başka yıl veya ek sayılar reddedilir. Sekiz gerçek dosya yeniden doğrulandı.
13. Cloudflare e-posta koruması HTML byte değerlerini değiştirir. Yalnızca gözlenen e-posta anchor/span ve bilinen decoder script dönüşümü geri alınır; elde edilen tüm HTML'nin SHA-256 değeri yerel dosyayla eşit olmalıdır. Beş regresyon testi yanlış e-posta ve ilgisiz HTML/script değişikliklerini reddeder. Ham ve düzeltilmiş hashler ayrı raporlanır.
14. Ay takviminin baskısında gün ve Ay simgesi dikey yerleştirildi; dikeyde dört, yatayda altı ay sütunu kullanılır. On iki ay ilk sayfadadır; faz tablosu ve açıklamalarda tek başına boş/açıklama sayfası engellenir.
15. Paralel tarayıcı testinde görev indeksi sayfa açma beklemesinden önce ayrılır; her test yeni sayfada çalışır. Okul günü adları görünür kısa ve tam adla uyumludur. Vardiya planlayıcısının iki sütunu yalnızca geniş ekrana uygulanır.
