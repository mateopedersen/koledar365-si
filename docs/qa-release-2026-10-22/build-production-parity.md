# Kaynak → build → production

Kaynak commit: `35ea4a5365f019f6656228392e5deeeb06477d92`. Build: `2026-10-22T16:03:31Z`. Manifestte 11980 dosya ve 4277 kaynak SHA-256 kaydı.

Kaynak değişikliği build'e yansımadıysa `verify_static.mjs` yayını durdurur. Fingerprintli CSS/JS referansları, kaynak hashleri, HTML ve katalog doğrulanır. Üretim kontrolü normal URL'leri kullanır; cache-bypass parametresi eklemez; HTTP içerik kodlaması çözüldükten sonra SHA-256 karşılaştırır ve MIME/cache başlıklarını kaydeder.

Canlı durum: Henüz doğrulanmadı; bu rapor yayın öncesi kanıttır.
Canlı kontrol: bekleniyor dosya, — fark/hata, — bayt.

PR: https://github.com/mateopedersen/koledar365-si/pull/91
Cloudflare e-posta korumasında yalnızca kanıtlanan dönüşüm geri alınır ve tüm HTML SHA-256 değeri doğrulanır. Diğer HTML farkları ve CSS/JS farkları başarısızdır. Deployment ve yayın commit bilgileri canlı doğrulama tamamlanınca bu rapora eklenir.

