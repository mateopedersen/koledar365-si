# İçerik ve özgün fayda incelemesi

Envanter sitemap ile sınırlı değildir: 702 HTML dosyası, site içi bağlantılar, Rails sayfa kayıtları, yayın politikası ve 391 canonical URL karşılaştırıldı. 300 istemci render parçası ile 11 yönetim/arama/hata/yardımcı belge bilinçli noindex sınıfında. Bunları indexable yapmak duplicate ve özel işlev sorunları doğurur.

Kesin içerik veya başlık kopyası bulunmadı. 98 benzerlik adayı `current/duplicate-review.csv` içinde tek tek sınıflandırıldı: çoğu farklı yılların hesaplama sayfalarıdır. Sayıları normalleştiren benzerlik metriği aynı şablonu yakalar; farklı yılın gerçek takvim verisini gereksiz kopya yapmaz. Günlük/boş/doğum günü araçları da farklı niyet ve girdilere sahiptir. Meşru dönem sayfaları silinmedi veya tek canonical altında birleştirilmedi.

## Bulunan ve düzeltilen içerik hatası

`/letni-casi/` mevsim vaat eden başlık altında genel tatilleri sıralıyordu. `PagesController#section_for` ve yeni `_seasons.html.erb` ile bu yanlış liste 16 kaynaklı mevsim olayıyla değiştirildi. Dört yıl arasında bağlantılar, yerel/UTC saatleri, astronomik/meteorolojik açıklama ve ilgili güneş/tatil/saat değişikliği bağlantıları eklendi. Mevcut dört ayrıntı URL'si korundu. Çalışma saati özeti kullanıcı ayarına göre güncellenir; yanlış vaat kaldırıldı.

## Türlere göre inceleme

- Yıllık/aylık takvimler: doğru yıl/ay, ayın gün ve çalışma günü bilgileri, dönem bağlantıları ve gerçek PDF/WebP hedefleri. Ortak 300 kelimelik SEO dolgusu eklenmedi.
- Ay sayfaları: tarih, yerel saat, evre, yöntem ve hassasiyet; gerçek Ay görselleri. Astrolojik yorum ile hesaplanan astronomik olay ayrı tutulur.
- Tatil/çalışma: resmî bayram ile işten muaf gün ayrımı, döneme özgü tablolar, hesaplayıcı bağlantıları.
- Eğitim: resmî ilan ve kaynak, yayımlanmayan döneme belirsizlik etiketi. Üniversiteler için her kurumun aynı tatil takvimine sahip olduğu varsayılmaz.
- Şehirler: 69 farklı koordinat, tarih ve yerel güneş hesabı, şehir görseli/lisansı; sadece şehir adı değiştirilmiş makale üretimi yok.
- Araçlar/planlayıcılar: kullanım adımları, sonuç anlamı, sıfırlama, indirme ve sınırlar gerçek uçtan uca testlerle değerlendirilir.
- Hakkında, kaynak/yöntem, editör politikası, iletişim ve yasal sayfalar: gerçek ekip iletişimi, hesaplama açıklaması ve belirsizlik; sahte uzman veya deneyim eklenmedi.

Tam statik denetimde 2.598 farklı iç bağlantı hedefi, fragment kimlikleri, metadata, bir H1, sl-SI ve JSON-LD kontrol edildi. Baseline site içi bağlantı grafiğinde orphan yok, en fazla iki tıklama uzaklığı. Bu bulgular tek başına indekse girmiş olmayı veya içerik kalite puanı garantisini kanıtlamaz.
