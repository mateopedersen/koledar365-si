# Work / Astra 6 — Koledar365 üretim yayını

Aşağıdaki görevi uygula. Sadece plan veya komut önerisi verme; izinli erişimle yayını tamamla ve canlı doğrulama sonuçlarını raporla.

## Hedef ve hazırlanmış çalışma

- Site: https://koledar365.si/
- Depo: https://github.com/mateopedersen/koledar365-si
- Hazırlanan PR: https://github.com/mateopedersen/koledar365-si/pull/56
- Dal: `feat/advanced-calendar-expansion-20261021`
- Mevcut ücretsiz mimariyi koru: Ruby/Rails derlemesi GitHub'da yapılır; Cloudflare Pages doğrulanmış `site/` çıktısını yayımlar.
- Tasarım, içerik ve araçlar hazırdır. Profesyonel Slovence arayüzü, Slovenya'nın mavi/kırmızı/beyaz renkleri, özgün görseller, kaynak gösterimi ve SEO düzeni korunmalıdır.
- Ana dala sonradan eklenmiş 2027–2030 A3 takvim koleksiyonu da bu çalışmayla birleştirilmiştir. Koleksiyonu, özgün dosyalarını, 52 dönem × 15 tasarımı, görsel SEO verilerini ve eski dosyaların yönlendirmelerini koru.
- Ana dalın görünür aylar arası gezinmesi ve kaldırılmış isim adresleri için eklediği Cloudflare Functions korumaları da korunmalıdır. Emekli isim adreslerini, eski arama kaydını veya eski sitemap/robots önbelleğini geri getirme; mevcut 14 Functions include yolunu ve ilgili doğrulama kurallarını koru.

Önce `docs/advanced-calendar-release.md`, `docs/free-cloudflare.md`, `docs/advanced-calendar-research-and-seo.md`, `docs/advanced-calendar-metadata.md` ve `docs/education-calendar-2026-2027.md` dosyalarını oku. Geçerli PR başını, kontrolleri ve hazırlanmış yayın commitini GitHub'dan yeniden doğrula. Belgede yazan eski bir SHA'yı körlemesine yayımlama.

## Tamamlanmış kapsamı koru

Yeni 15 canonical sayfa:

1. `/setveni-koledar/`
2. `/izplacila-pokojnin/`
3. `/izplacila-socialnih-transferjev/`
4. `/solski-koledar/`
5. `/matura/2027/`
6. `/matura/2027/splosna/`
7. `/matura/2027/poklicna/`
8. `/npz/`
9. `/npz/3-razred/`
10. `/npz/6-razred/`
11. `/npz/9-razred/`
12. `/studijski-koledar/`
13. `/soncni-mrk/`
14. `/lunin-mrk/`
15. `/perzeidi/`

Mevcut aylık/haftalık takvim editörleri, gerçek XLSX çıktıları, 2026–2030 iş günü araçları, `/solski-urnik/`, Ay evreleri/dolunay/yeni ay sayfaları, `/viri-in-metodologija/` ve önceki `/premik-ure/` çalışması da korunacaktır. Kişisel planları sunucuya taşımayacak; tarayıcıda kayıt, JSON yedekleme ve gerçek ICS/PDF çıktıları mevcut biçimde kalacaktır.

Kaldırılmış `/imena/` ve `/koledar-z-imenom/` dizinlerini veya binlerce emekliye ayrılmış isim URL'sini yeniden açma. Doğrulanmamış godovi takvimi ve vergi takvimi üretme. Google Trends sayfası araştırma sırasında hata verdiği için arama hacmi veya trafik sonucu uydurma. Gelecek yılın resmî ödeme/okul tarihlerini kaynaksız üretme.

## Yayın sırası

1. PR #56'nın güncel başındaki tam kalite kontrolünü ve tam statik hazırlık sonucunu incele. Başka biri ana dalı ilerletmişse değişikliklerini koruyarak gerekli birleştirmeyi yap ve ilgili kontrolleri tekrar doğrula. Başarısız kontrolü atlama veya kabul ölçütlerini zayıflatma.
2. `Stage verified calendar expansion` çıktısında hazırlanmış `site/`, kaynak parmak izleri ve tam URL envanteri bulunmalıdır. Yerel bir kısmi önizlemeyi üretim çıktısı olarak kullanma.
3. Kontroller başarılıysa PR #56'yı ana dala birleştir. Kullanıcı bu son yayın görevini açıkça istemiştir; zaten yetkilendirilmiş rutin işlemler için tekrar onay isteme.
4. Ana dalda `Prepare verified Pages publication` işinin bitmesini bekle. Bu iş yeni bir yayın commiti oluşturabilir. Cloudflare'da yayımlanacak commit, kaynak merge commitinden sonra oluşan **en güncel doğrulanmış yayın commiti** olmalıdır.
5. Mevcut Cloudflare Pages projesini kullan. Gerekli ayarları doğrula:
   - Production branch: `main`
   - Root directory: depo kökü
   - Build command: `node script/verify_static.mjs`
   - Build output directory: `site`
   - Environment variable: `SKIP_DEPENDENCY_INSTALL=1`
   - Node sürümü: depodaki `.node-version`
   - Mevcut özel alan adı: `koledar365.si`
   - Mevcut Functions yönlendirmesi korunmalı; ücretli plan, R2, yeni veritabanı, VPS veya başka ücretli altyapı eklenmemeli.
6. Geçerli bağlantı/oturumu kullan. Giriş duvarı varsa güvenli giriş devrini uygula; kullanıcıdan parola veya tokenı sohbet içine yazmasını isteme. Sırf varsayımsal risk nedeniyle yeni bir onay aşaması ekleme.
7. Üretim dağıtımının tamamlanmasını ve özel alan adının bu dağıtımı sunmasını doğrula. Yalnızca build'in yeşil olması yayının tamamlandığı anlamına gelmez. Gerekirse eski HTML önbelleğini mevcut projenin mekanizmasıyla temizle ve tekrar kontrol et.

## Canlı doğrulama — zorunlu

Tam olarak yayımlanan commitin çalışma kopyasında çalıştır:

```bash
node script/verify_static.mjs
node script/verify_expansion_live.mjs --origin https://koledar365.si
```

İkinci komut herkese açık adreslere salt okunur istek gönderir. Hazırlanmış `site/release-urls.json` envanterindeki tüm indekslenebilir canonical sayfaları, HTTP 200 durumlarını, sayfa başlıklarını, canonical değerlerini, tek H1'i, istenmeyen noindex'i, yeni sayfalardaki statik modülleri/yapılandırılmış veriyi, örnek görsel/ICS dosyalarını, kaldırılmış iki dizinin 404/410 kalmasını ve canlı kaynak parmak izlerini denetler. Başarısızlıkta sıfır olmayan çıkış kodu üretir.

Üretilen raporlar:

- `evidence/advanced-calendar-live-verification.json`
- `evidence/all-live-page-links.txt`
- Derleme sırasında üretilmiş düz URL listesi: `docs/advanced-calendar-live-urls.txt`
- Makine tarafından okunabilir envanter: `site/release-urls.json`

Ayrıca gerçek üretim alan adında masaüstü ve mobil tarayıcıyla ana sayfa, ekim takvimi, okul takvimi, ders programı, bir ödeme sayfası, bir tutulma sayfası, aylık/haftalık editör ve saat değişimi sayfasını kontrol et. Tarih seçimi, kayıt/geri yükleme ve indirmelerin çalıştığını; önemli görsellerin yüklenip alt metinlerinin bulunduğunu; yatay taşma ve JavaScript hatası olmadığını doğrula. En az bir gerçek XLSX ve ICS dosyasını açarak içeriğini kontrol et. Mevcut A3 koleksiyon doğrulayıcısını koru.

Üretimde gerçek bir gerileme çıkarsa önce sorunu düzeltip yeniden doğrula; gerekirse önceki doğrulanmış Cloudflare dağıtımına dön. Başarısız kontrolü başarılı diye raporlama. Çözülemeyen erişim engelini, kalan adımı ve o ana kadar tamamlanan işleri açıkça belirt.

## Son cevapta mutlaka ver

1. Türkçe, açık yayın durumu: gerçekten canlı mı, hangi kontroller geçti, varsa ne kaldı.
2. Birleştirilen PR bağlantısı, kaynak/merge commit SHA'sı ve **Cloudflare'da gerçekten yayımlanan commit SHA'sı**.
3. Cloudflare production deployment bağlantısı ve https://koledar365.si/ adresi.
4. **Yeni eklenen 15 sayfanın tamamının tıklanabilir canlı bağlantıları.**
5. **Sitedeki bütün canlı indekslenebilir canonical sayfaların tam bağlantı listesi.** Yalnızca yeni sayfaları vererek işi bitirme. `evidence/all-live-page-links.txt` dosyasını indirilebilir olarak sun; ayrıca mümkünse tam Markdown liste ver. Liste çok uzunsa kategori bazında düzenle, hiçbir adresi sessizce atlama. Bilinçli noindex/özel/retired adreslerin bu SEO envanterine dahil olmadığını belirt.
6. URL sayısı ve kaçının başarılı doğrulandığı; rapor dosyası/linki. Sayıyı tahmin etme, envanter ve gerçek test sonucundan al.
7. Kısa mobil/masaüstü test özeti ve indirme kontrolleri.

Google sıralaması, indekslenme veya Görseller'de görünme garantisi verme. Gerçek uygulama ve doğrulama sonuçlarını bildir.
