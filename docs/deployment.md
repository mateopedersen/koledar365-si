# Üretime kurulum ve işletim

## Doğrulanmış durum

`rails-turnkey-2027-2030` dalı gerçek Rails uygulamasıdır. `main` eski statik sayfanın geçmişini korur. GitHub deposu kullanıcı talimatıyla public yapıldı. 19325c5 için GitHub Actions 39417500303 / attempt 2: PostgreSQL, Docker build, production boot ve 600 ppi çıktı geçti. Güncel commitin kontrolü ayrıca izlenmelidir. Yerel makinede Docker yoktur; CI gerçek Linux Docker ortamıdır.

Cloudflare Pages Ruby/Rails uygulama sunucusu değildir. Bu proje için HTTPS destekli Docker host, kalıcı disk, PostgreSQL ve çalışan worker gerekir. Tercih: 2 CPU, en az 4 GB RAM, çıktı hacmine göre en az 20 GB kalıcı disk. İşçi tek eşzamanlı raster üretir. Daha küçük ortama kapasite ölçmeden geçmeyin. Henüz canlı Rails hostu veya ücretli kaynak yetkisi sağlanmadı.

## Kurulum

1. Hostta Git, Docker Engine + Compose, age kurun. Repo dalını alın. `main` üzerine eski Pages üretim otomasyonunu körlemesine taşımayın.
2. `.env.production.example` → `.env.production`; dosya izni 0600. `SECRET_KEY_BASE` için 64 bayt rastgele hex, `POSTGRES_PASSWORD` için güçlü URL uyumlu rastgele değer kullanın. Gerçek dosya Git dışında kalmalıdır.
3. `SITE_URL`, `DOMAIN`, `OPERATOR_CONTACT`, `HOSTING_PROVIDER` ve `PRIVACY_HOSTING_NOTICE` alanlarını gerçek bilgilerle doldurun. Sonuncu alan sağlayıcı, işlem yeri ve varsa uluslararası aktarım güvencesini açıklar. İletişim adresini tahmin etmeyin.
4. `docker compose --env-file .env.production build`
5. `docker compose --env-file .env.production up -d db migrate web worker`
6. `docker compose --env-file .env.production exec web bin/rails runner script/create_admin.rb` İlk giriş dosyası container içindeki `/rails/storage/private-admin.txt`; güvenli şekilde alın, yöneticiye iletin, parola yöneticisine kaydedin. `mateo` kullanıcı adı oluşturulur, var olan hesap sıfırlanmaz.
7. Önce `docker compose --env-file .env.production exec web bin/rails runner script/publish_release.rb` ile kanıtlı sayfaları ve isimleri açın. Ardından `docker compose --env-file .env.production exec web bin/rails runner script/release_preflight.rb` Yayın bilgileri ve kalite kapılarını doğrulayın.
8. DNS apex A/AAAA ve www yönlendirmesini gerçek hosta bağlayın. TLS için `docker compose --env-file .env.production --profile https up -d proxy`. Caddy'nin sertifika alabilmesi için 80/443 ulaşılır olmalı; Cloudflare kullanılırsa Full (strict), uçtan uca geçerli sertifika.
9. Canlı HTTPS `/up`, ana sayfa, 2027–2030, isim, yönetim, iletişim, private export ve 600 ppi indirmeyi doğrulayın. Worker durumunu ve disk alanını izleyin. Sitemap'i Search Console'a ancak doğru host ve canonical doğrulandıktan sonra gönderin.

## Yedek ve geri yükleme

`AGE_RECIPIENT` sadece açık age alıcı anahtarıdır. Özel anahtar sunucudan ayrı güvenli yerde tutulur. `bin/backup` PostgreSQL custom dump, kalıcı storage ve commit kaydını şifreli arşive alır; açık geçici dosyaları temizler. Kişisel veriler içerdiğinden arşiv public depoya/çıktıya yüklenmez. Yedi günlük rotasyonu, şifreli ayrı depoya aktarımı ve günlük görevi host işletmecisi etkinleştirmelidir. Sistem bakım otomasyonu bu sohbet içinde kurulmuş gibi gösterilmez.

`bin/restore-check <archive> <age-private-key-file>` yeni geçici veritabanına geri yükler, tabloları ve storage arşivini kontrol eder ve sadece oluşturduğu deneme veritabanını kaldırır. Canlı DB değişmez. CI'da PostgreSQL dump/restore bağımsız yeni veritabanına ayrıca denenir.

Gerçek felaket kurtarmada önce web/worker durdurulur, mevcut DB+storage korunur, aynı uygulama commitine ait yedek yeni veritabanına ve yeni volume'a yüklenir. Yeni DATABASE_URL/volume ile ağ açılmadan önce `ExpiryJob.perform_now` çalıştırılarak süresi geçmiş özel veriler kaldırılır. Sayımlar, oturum gizliliği ve gerçek dosya kontrollerinden sonra trafik yeni ortama alınır. DB migration'ını körlemesine geri çevirmeyin; eski kod şemayla uyumsuzsa birlikte alınmış yedeği kullanın.

## Cache ve geri alma

Statik varlıklar Rails digest hashleriyle değişir. Public PDF anahtarı şablon sürümü + fontlar + gerçek yıl verisi + seçeneklerdir; eski dosyalar değişmez. Özel çıktı anahtarı ayrıca seans sahibini içerir. HTML, yönetim, kişisel önizleme ve iletişim yanıtları public CDN cache'e girmez. Cloudflare Cache Everything kuralı eklemeyin.

Bir önceki doğrulanmış imaj etiketi ve Git SHA saklanır. Deploy öncesi yedek alın; web/worker aynı sürüme geçsin. Geri alırken sadece bu imajı yeniden başlatın, şema uyumluluğunu kontrol edin. Tarayıcıdaki kişisel kayıtları veya çerez tercihlerini cache temizliği bahanesiyle silmeyin. Service worker etkin değildir.

## Editoryal bakım

Yönetim sekiz günlük burç hazırlık tablosu, düzenleme, JSON toplu ithal ve planlama sağlar. Worker her beş dakikada Ljubljana tarihine göre hazır metni yayımlar. İçerik yoksa eski metne yeni gün yazmaz. Gelecek içerik üretim API anahtarı bulunmadığından editör özgün metni hazırlamalıdır. Kaynak değişiklikleri, hukuk ve okul takvimi düzenli yeniden incelenmelidir; otomatik doğrulanmış hukuk güncellemesi vaadi yoktur.
