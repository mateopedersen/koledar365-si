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

Son kaynak değişikliklerinden sonra başarılı tam hazırlık: [39685521536](https://github.com/mateopedersen/koledar365-si/actions/runs/39685521536), kaynak `8ddbdad55cd710e217ded408b8f8ade9703034aa`, hazırlanmış yayın commiti `b505bb93698056d7c69621d7dbf22ab72cedbff1`. Bu yayından sonraki son dokümantasyon commiti yalnızca bu yayın devri kaydını ve mevcut 14 Functions yolunu açıklayan Cloudflare yönergesini günceller; üretim kaynaklarını veya `site/` çıktısını değiştirmez. Güncel PR başındaki tam CI sonucu ayrıca başarılı olmalıdır.

Bu tam hazırlıkta 397 indekslenebilir canonical URL, 421 HTML dosyası, 4.075 iç hedef, 52 takvim galerisi ve 126 galeri sayfası denetlendi. Yeni A3 koleksiyonu için 780 kayıt, 52 dönem sayfası, 1.560 yönlendirme ve 790 görsel sitemap kaydı kontrol edildi. Bunlar hazırlanmış çıktının sayılarıdır; canlı alan adının gerçekten bu çıktıyı sunduğu yayın sonrasında ayrıca doğrulanacaktır.

Ana dalın `6d5cc19fd8274cade36466e7a8ea372017b23a11` sürümü, genişleme dalına iki ebeveynli `8ddbdad55cd710e217ded408b8f8ade9703034aa` commitiyle dahil edildi. Mevcut A3 koleksiyonu, mobilde görünür önceki/sonraki ay gezinmesi, 12 aylık yıl indeksi ve kaldırılmış isim adreslerine ait Cloudflare Functions korumaları korunur. 2026 ayları mevcut ana sayfa sorgularına, 2027–2030 ayları kanonik aylık adreslerine gider. Functions için 14 include yolu ve eski arama/sitemap/robots içeriğinin geri dönmesini engelleyen denetimler pakete dahildir. Ana dalın okul tatili sayfalarına eklediği yedi Slovenya fotoğrafı, açıklayıcı alt metinleri, görünür yazar/lisans bilgileri ve ayrıntılı atıfları da genişlemenin SEO başlıkları ve okul/üniversite takvimi bağlantılarıyla birlikte korunmuştur. Seçili okul ayını tek başına yazdırma, takvim hücrelerinde tam tatil adları, yeni 404 kurtarma tasarımı ve 22 Ekim tarihli günlük yayın kayıtları da bu birleşime dahildir. 404 sayfasının hızlı arama önerisi aktif okul takvimine bağlanır.

Sonradan oluşan ana dal yayın commiti `8c5cddc4cc2604287317bb13008bd30c392c6be5`, son dokümantasyon commitinin ek ebeveynidir. Bu main farkı yalnızca üretilmiş `site/` dosyaları ve 53 mevcut `updated_at` alanından oluşur; yeni uygulama kaynağı içermez. Genişlemenin 358 editoryal kaydı, yukarıdaki tam hazırlıktan çıkan statik dosyalar ve bunların kaynak parmak izleri korunur.

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
- Dört profil kontrolünde bulunan galeri yerleşimi düzeltildi: Excel paneli ve galeri aynı sağ sütunda toplandı. 1280 piksel ekranda en dar indirme düğmesi 31,8 pikselden 125,8 piksele çıktı; 320/390/768/1280 piksel ölçümlerinde yatay taşma yok.
- Ders programında WebKit'in görünmez JSON dosya seçici içeriğini taşma hesabına katması, yalnız ilgili input'a `overflow:hidden` eklenerek giderildi. Aynı DOM'da 320 piksel viewport için scroll genişliği 339'dan 320'ye indi; görünür etiket ve klavye odağı korundu. Bu iki yerleşim düzeltmesinde testler veya işlev JavaScript'i değiştirilmedi.
- Son ana dal birleştirmesinde dört takvim sayfası 1280 ve 320 piksel genişlikte kontrol edildi: yatay taşma ve JavaScript hatası yok; ay gezinmesi mobilde görünür, yıllık indekslerin 12 bağlantısı doğru, Ocak 2026 ve Aralık 2030 sınırları korunuyor.
- Okul fotoğrafları 1280 ve 320 pikselde, batı/doğu bölgesi ve eğitim seviyesi seçimleriyle kontrol edildi: yedi yeni JPEG yükleniyor; görünür yazar/lisans kredileri, tek SEO H1 ve iki takvim bağlantısı korunuyor; yeni fotoğraflarda HTTP hatası veya yatay taşma yok. JPEG/alt metin/atıf assertion'larının dar kopyası dört tarayıcı profilinde 4/4 geçti. Raw Rails önizlemesi statik export'un SVG dönüşümlerini içermediği için tam SVG testi geçti diye sunulmadı; diğer sayfa ailelerinin ve okul filtresinin SVG kontrolleri kaynak testte korunarak tam statik CI'ye bırakıldı.

Son kabul kapısı PR başındaki tam GitHub CI'dır: PostgreSQL testleri, SEO, yedek/geri yükleme, üretim Docker imajı, 600 ppi çıktı, taze SQLite'dan tam statik derleme ve dört tarayıcı profili. En güncel sonucunu PR kontrollerinden okuyun.

## Yayından sonra tamamlanacak kontrol

`node script/verify_expansion_live.mjs --origin https://koledar365.si` komutunu tam yayımlanan committe çalıştırın. Hazırlanmış envanterdeki tüm indekslenebilir sayfalar ve canlı kaynak parmak izleri doğrulanmalıdır. Kullanıcıya yeni 15 bağlantıyı ve **bütün canlı canonical sayfaların tam listesini**, başarılı sayfa sayısını, kaynak/yayın commitlerini ve Cloudflare dağıtım bağlantısını teslim edin.

Mevcut kaldırılmış isim dizinleri, doğrulanmamış godovi verisi ve ertelenmiş vergi takvimiyle ilgili kararlar korunur. Ücretli servis veya yeni altyapı gerekmez.
