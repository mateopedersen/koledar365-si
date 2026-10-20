# Koledar365

Slovenya için 2027–2030 dönemini kapsayan, sunucuda HTML üreten tek Rails uygulaması. Ruby **4.0.7**, Rails **8.1.4**. Takvim, tatiller, iş günü ve astronomi araçları, cihazda kişisel planlar, isimli takvimler, yönetim ve kalıcı kuyrukla PDF/WebP üretimi içerir.

Gerçek tamamlanma durumu ve bilinen engeller **STATUS.md** içinde tutulur. Yerel uygulamanın çalışması canlı alan adına yayın yapıldığı anlamına gelmez.

## Yerelde başlatma

Ruby 4.0.7, Bundler, PostgreSQL istemci kütüphanesi, Poppler ve Pillow/WebP desteği gerekir. Geliştirme ve testte SQLite kullanılabilir.

```sh
bundle install
bundle exec rails db:prepare
bundle exec rails server -b 127.0.0.1 -p 3650
```

Ayrı terminalde işçiyi başlatın:

```sh
PDFTOPPM_BIN=/usr/bin/pdftoppm PYTHON_BIN=/usr/bin/python3 bundle exec ruby bin/jobs
```

Platformunuzdaki gerçek yürütülebilir dosya yollarını kullanın. Yönetim adresi `/upravljanje/`; dışa aktarma için işçi zorunludur.

## Doğrulama

```sh
bundle exec rails test
bundle exec ruby -r ./config/environment script/audit_seo.rb
bundle exec ruby -r ./config/environment script/audit_observances.rb
bundle exec ruby -r ./config/environment script/audit_print_layouts.rb
```

JSON kanıtları `evidence/` altındadır. Dosya koordinat kontrolü, metin/görsel kalite kontrolünün tamamının yerine geçmez. Sadece gerçekten çalıştırılmış kontrollerin sonuçları raporlanır.

## Üretim

Üretim imajı Poppler, Python/Pillow ve PostgreSQL bağımlılıklarını içerir. Web ve Solid Queue işçisi aynı imajı kullanır. PostgreSQL ile çıktıların bulunduğu `storage` dizini kalıcıdır. Geçici dosyalar yalnız `tmp` içindedir. Kullanıcı notları/fotoğrafları içeren çıktılar sahiplik kontrollüdür.

```sh
cp .env.production.example .env.production
# Gerçek sırları ve işletmeci/sağlayıcı bilgilerini dosyaya girin.
docker compose --env-file .env.production build
docker compose --env-file .env.production up -d db migrate web worker
```

Docker kurulumu ve yetkili sunucu gerekir. Cloudflare Pages standart bir Rails sunucusu değildir. HTTPS, yedek, geri yükleme, cache ve yayın adımları `docs/deployment.md` belgesindedir. Onaysız ücretli kaynak açılmaz; eski ana dal korunur.

## Kaynaklar ve lisanslar

Kaynak veri `data/source/` içinde, fotoğraf atıfları `data/cities_sl.json` ve `data/holiday_photos_sl.json` içindedir. Sitede `/fotografije-in-licence/` adresinden kaynaklara ulaşılır. Avenir yalnız kullanıcı cihazında kuruluysa kullanılır; dağıtılacak lisanslı webfont sağlanmamıştır. Baskıdaki DejaVu fontlarının lisansı font dizininde bulunur.
