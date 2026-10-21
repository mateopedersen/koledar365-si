# Koledar365 — ileri takvim paketi ve yayın devri

Hazırlık tarihi: 21 Ekim 2026. Üretim yayını, kullanıcının son Work / Astra 6 görevidir.

## Bağlantılar ve doğrulama kaydı

- [Hazırlanan PR #56](https://github.com/mateopedersen/koledar365-si/pull/56)
- [PR'nin güncel kontrolleri](https://github.com/mateopedersen/koledar365-si/pull/56/checks)
- [Kaynak ve hazırlanmış site dalı](https://github.com/mateopedersen/koledar365-si/tree/feat/advanced-calendar-expansion-20261021)
- [Tam Work / Astra 6 yayın talimatı](WORK-ASTRA6-DEPLOY-PROMPT.md)
- [Tasarım önizlemeleri](previews/README.md)
- [Araştırma, kaynaklar ve SEO kararları](advanced-calendar-research-and-seo.md)
- [27 sayfanın gerçek HTML başlıkları ve meta açıklamaları](advanced-calendar-metadata.md)
- [Eğitim verilerinin ayrıntılı kaydı](education-calendar-2026-2027.md)
- [Tam canonical URL envanteri](advanced-calendar-live-urls.txt)

PR açıklaması son doğrulanmış kaynak, yayın commitleri ve test çalıştırmalarının güncel kaydını taşır. PR'de daha yeni commit varsa yalnızca önceki bir yeşil çalıştırmaya dayanarak yayın yapmayın; güncel kaynakla hazırlanmış statik çıktının parmak izleri uyuşmalıdır. PR bu hazırlık sırasında ana dala birleştirilmez ve Cloudflare üretim dağıtımı yapılmaz.

Son kaynak değişikliklerinden sonra başarılı tam hazırlık: [39670661700](https://github.com/mateopedersen/koledar365-si/actions/runs/39670661700), kaynak `67369487f6d06923b44633eaef0331e0c052fe8f`, hazırlanmış yayın commiti `915ecbdee49a48537f76d6771eae195afcbaf2a8`. Bu yayından sonraki son dokümantasyon commiti yalnızca bu kayıt ile metadata tablosunu tamamlar; üretim kaynaklarını veya `site/` çıktısını değiştirmez. Güncel PR başındaki tam CI sonucu ayrıca başarılı olmalıdır.

Bu tam hazırlıkta 397 indekslenebilir canonical URL, 421 HTML dosyası, 4.073 iç hedef, 52 takvim galerisi ve 126 galeri sayfası denetlendi. Yeni A3 koleksiyonu için 780 kayıt, 52 dönem sayfası, 1.560 yönlendirme ve 790 görsel sitemap kaydı kontrol edildi. Bunlar hazırlanmış çıktının sayılarıdır; canlı alan adının gerçekten bu çıktıyı sunduğu yayın sonrasında ayrıca doğrulanacaktır.

## Hazırlanan kullanıcı deneyimi

| Alan | Hazırlanan işlev ve tasarım |
| --- | --- |
| Ekim takvimi | Özgün görsel, 16 bitki, 36 kaynaklı iş/mevsim kaydı, 12 aylık matris, filtreler, kişisel bahçe planı, JSON yedekleme, ICS ve yazdırma |
| Okul ve sınavlar | Dokuz yeni sayfa, 239 olay, 13 Slovence birincil kaynak, okul yılı/kurum/sınıf/bölge/oturum filtreleri, 12 aylık görünüm, seçili tarihler için gerçek ICS |
| Ders programı | Derse özgü alanlar, saat çakışması kontrolü, haftalık/tek seferlik ders, dönem aralığı, tatilleri dışlama, yerel kayıt, yedekleme/geri yükleme ve DST uyumlu ICS |
| Emekli ve sosyal ödemeler | ZPIZ/CSD'nin yayımladığı toplam 163 tarih, sonraki doğrulanmış ödeme, ay/kategori filtreleri, tarih kaynakları, infografikler ve takvime aktarma |
| Astronomi | Sekiz Slovenya şehri için 2026–2030 görünürlük hesapları, yerel ufuk/zaman ayrımı, özgün SVG/WebP çizimler, 135 gerçek ICS dosyası; Ay evreleri ve üç yeni astronomi sayfası |
| Takvim editörleri | Aylık/haftalık dönem seçimi, notlar, gerçek PDF ve OOXML XLSX, açık dönem seçiminin eski kayıtlar tarafından ezilmemesi, 2026–2030 iş günü desteği |
| Güven ve kaynaklar | Özel metodoloji sayfası, gerçek yayıncı bilgisi, kaynak ve inceleme tarihleri, hesaplanan/resmî/kişisel veri ayrımı, açık veri sınırları |

## Yeni sayfalar ve yayından sonraki adresleri

Bu bağlantılar hedef üretim adresleridir. Canlı doğrulama tamamlanmadan yeni sürümün yayımlandığı iddia edilmez.

- https://koledar365.si/setveni-koledar/
- https://koledar365.si/izplacila-pokojnin/
- https://koledar365.si/izplacila-socialnih-transferjev/
- https://koledar365.si/solski-koledar/
- https://koledar365.si/matura/2027/
- https://koledar365.si/matura/2027/splosna/
- https://koledar365.si/matura/2027/poklicna/
- https://koledar365.si/npz/
- https://koledar365.si/npz/3-razred/
- https://koledar365.si/npz/6-razred/
- https://koledar365.si/npz/9-razred/
- https://koledar365.si/studijski-koledar/
- https://koledar365.si/soncni-mrk/
- https://koledar365.si/lunin-mrk/
- https://koledar365.si/perzeidi/

## Tasarım ve SEO

Slovenya'nın mavi/kırmızı/beyaz renkleri mevcut Koledar365 arayüzüyle ortak kullanılır. Her bölüm kendi işine uygun bir düzen taşır: bitki matrisi, yıllık okul görünümü, ödeme takvimi veya astronomi görünürlük grafiği. Mobil yerleşimler, gerçek form durumları, yazdırma ve indirilebilir dosyalar birlikte ele alınmıştır.

27 sayfanın ayrı Slovence başlık/açıklama kaydı hazırlanmıştır. Denetlenen 28 gerçek statik örnekte tek H1, doğru canonical ve benzersiz başlık/açıklama doğrulanmıştır. Kaynaklar, kapsam sınırları, görsel boyutları/alt metinleri, sosyal paylaşım görselleri, image sitemap ve içerikle uyumlu yapılandırılmış veri hazırlanmıştır. E-E-A-T için sahte uzman veya sertifika üretilmemiştir. Yapay zekâ ile oluşturulmuş bahçe görselinin kökeni açıklanır; kesin bilgi grafikleri veriden çizilir.

Google Trends Slovence arayüzü Slovenya/12 ay ve 5 yıl karşılaştırmalarında hata verdi. Bu nedenle arama hacmi veya büyüme tahmini veriymiş gibi raporlanmaz. Google sıralaması, indekslenme veya Görseller'de görünme garantisi verilmez.

## Yerel kontroller ve tam CI kapısı

- Eğitim/astronomi/takvim/genişleme için odaklı Ruby doğrulaması: 35 test, 6.546 assertion, sıfır hata.
- Yeni bahçe/ödeme davranışları: masaüstü Chromium ve Android'de 8 tarayıcı senaryosu geçti.
- Yenilenen aylık/haftalık araçların 10, eğitim bölümünün 10 tarayıcı senaryosu uygulama sırasında geçti.
- 12 tasarım önizlemesi: görünür eksik görsel, sayfa hatası veya yatay taşma yok.
- Gerçek yıllık/aylık XLSX dosyaları bağımsız olarak açılarak tarih, formül ve hücre türleri kontrol edildi.
- WebKit'in ilk Ruby-WASM hesaplamasında mevcut yoğun durumun bitmesini bekleyen test düzeltmesi, sonuç değerleri/timeout/retry kuralları değiştirilmeden eklendi.

Son kabul kapısı PR başındaki tam GitHub CI'dır: PostgreSQL testleri, SEO, yedek/geri yükleme, üretim Docker imajı, 600 ppi çıktı, taze SQLite'dan tam statik derleme ve dört tarayıcı profili. En güncel sonucunu PR kontrollerinden okuyun.

## Yayından sonra tamamlanacak kontrol

`node script/verify_expansion_live.mjs --origin https://koledar365.si` komutunu tam yayımlanan committe çalıştırın. Hazırlanmış envanterdeki tüm indekslenebilir sayfalar ve canlı kaynak parmak izleri doğrulanmalıdır. Kullanıcıya yeni 15 bağlantıyı ve **bütün canlı canonical sayfaların tam listesini**, başarılı sayfa sayısını, kaynak/yayın commitlerini ve Cloudflare dağıtım bağlantısını teslim edin.

Mevcut kaldırılmış isim dizinleri, doğrulanmamış godovi verisi ve ertelenmiş vergi takvimiyle ilgili kararlar korunur. Ücretli servis veya yeni altyapı gerekmez.
