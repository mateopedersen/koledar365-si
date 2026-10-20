# Uygulama mimarisi

Ruby 4.0.7 / Rails 8.1.4; sunucuda HTML, küçük bağımsız JavaScript bileşenleri. Geliştirme SQLite, üretim PostgreSQL 17. Solid Queue aynı PostgreSQL veritabanında kalıcı iş kuyruğudur. Web ve tek işçi ayrı süreçtir. Görsel kodlama Python/Pillow ve Poppler; takvim ve uygulama mantığı Ruby'dir.

Page, CalendarEvent, AstronomicalEvent, Source, PersonName, Horoscope, PrintRequest, ContactMessage ve AuditLog kalıcı modellerdir. İsim NFC kimliği ve URL kaydı değiştirilmez. Sayfa ve isim yayın durumu ithal kayıttan ayrıdır. Kaynağı eksik okul/godovi sayfaları held/noindex kalır.

PDF işlemi Prawn ile vektör yazı/çizgi üretir. Poppler PDF'nin her sayfasını fiziksel ölçünün 600 ppi piksel boyutuna çevirir. Pillow kayıpsız, sRGB WebP kodlar; siyah-beyaz tasarımda R=G=B kontrolü zorunludur. Çok sayfalı çıktının ZIP'i bütün WebP sayfalarını, manifest.json ve README.txt dosyalarını içerir. İşler geçici dizinde hazırlanır ve tamamlandığında atomik taşınır. Dosya sahipliği seansa bağlıdır; kişisel isteklerin anahtarına sahiplik de katılır. Tek işçi büyük rasterlerin aynı anda belleğe yüklenmesini sınırlar.

Kişisel planlar kullanıcının tarayıcı profilinde saklanır. İstenilen ICS dönüşümü ve dosya üretimi sunucuda yapılır. Özel fotoğraflar en fazla 20 MB/40 MP, JPEG/PNG/WebP; EXIF temizliği, gerçek çözümleme, 7 günlük süre ve imzalı seans sahipliğiyle yönetilir. Web önizlemesi kişisel POST kullanır; kişi verisi URL'ye yazılmaz. Süre dolan dosyalar saatlik temizlenir. İletişim mesajları 90 gün, uygulama günlükleri 7 gün saklanır.

Public fotoğraf/varlıklar uygulamadan gelir. MET Norway istekleri sunucudan şehir koordinatlarıyla yapılır. Üçüncü taraf takip/analitik yoktur. Çerez tercih şeridi yalnız şehir seçimini hatırlama iznini yönetir; kişisel takvim işlevi kullanıcı talebiyle ayrı saklanır.

Üretim akışı: PostgreSQL sağlıklı → tek seferlik şema/ithal → web + worker → Caddy TLS. Cloudflare DNS/proxy kullanılabilir; Pages bu Rails sürecini çalıştırmaz. Gerçek host bilgisi beklenmektedir.
