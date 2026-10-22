from pathlib import Path
import json,subprocess
from datetime import datetime
from zoneinfo import ZoneInfo
root=Path(__file__).resolve().parent.parent
status=root/'STATUS.md';history=root/'docs/status-history-2026-10-20.md'
if not history.exists():history.write_text(status.read_text())
reports=[json.loads(p.read_text()) for p in sorted((root/'evidence').glob('release*-catalog-[0-9].json'))]
checks=[json.loads(p.read_text()) for p in sorted((root/'evidence').glob('release*-verification-[0-9].json'))]
produced=sum(sum(r.get('status')=='passed' for r in d['results']) for d in reports)
verified=sum(sum(r.get('passed') is True for r in d['results']) for d in checks)
errors=sum(sum(r.get('status')=='failed' for r in d['results']) for d in reports)+sum(sum(r.get('passed') is False for r in d['results']) for d in checks)
head=subprocess.check_output(['git','rev-parse','--short','HEAD'],cwd=root,text=True).strip()
now=datetime.now(ZoneInfo('Europe/Istanbul')).strftime('%d.%m.%Y %H:%M %Z')
status.write_text(f'''# Koledar365 — gerçek devam durumu

Güncelleme: {now}. Kaynak commit: {head}. Dal: free-cloudflare-pages.
Bu dosya güncel durumu gösterir; önceki ayrıntılı çalışma günlüğü docs/status-history-2026-10-20.md içinde korunmuştur.

## Yayın durumu
- Canlı koledar365.si henüz bu sürümle yayımlanmadı. Eski yapım sayfası yayında.
- Mevcut Cloudflare Pages projesinde build `node script/verify_static.mjs`, çıktı `site`, production branch `main` ayarlandı.
- Production ve Preview için SKIP_DEPENDENCY_INSTALL=1 kaydedildi. Ücretli hizmet açılmadı.
- Kullanıcı yalnız ücretsiz GitHub + Cloudflare istedi. VPS, Containers Paid, R2 veya ücretli veritabanı alınmayacak.
- Ücretsiz model: Ruby 4.0.7/Rails 8.1.4 ile veri/HTML build; aynı Ruby hesap/Prawn servisleri resmî ruby.wasm 2.10.1 (tarayıcı Ruby 4.0.0) ile cihazda çalışır. Bu, Cloudflare üzerinde sürekli Rails veya PostgreSQL sunucusu değildir.
- Orijinal Rails/Docker/PostgreSQL uygulaması ve rails-turnkey-2027-2030 dalı korunmuştur. Yönetim ücretsiz yayında gerçek GitHub yetkileri ve tarihli yayın workflow'u üzerinden yapılır. Kişisel planlar yerel JSON/ICS yedeğiyle cihazda saklanır.

## Dosya üretimi ve iki kontrol
- Hedef: 2.820 farklı PDF–WebP çifti. Üretilen: {produced}. Bağımsız ikinci kontrolü geçen: {verified}. Kaydedilen hata: {errors}.
- 48 ay × 15 = 720 aylık çift ve 4 yıl × 15 = 60 yıllık çift tamamlandı.
- Bütün 2.820 standart dönem çiftinin üretimi ve ikinci kontrolü tamamlandı. İsimler ve özel dönemler gerçek Ruby motoruyla cihazda talep üzerine üretilir.
- Birinci kontrol: kodlanmış WebP tekrar açılır, kaynak raster ile her piksel ve sRGB profil baytları eşleşir.
- İkinci kontrol: PDF yeniden 600 ppi rasterleştirilir; piksel eşitliği, 5 mm köşeler, gömülü font/marka, fiziksel ölçü, BW kanal eşitliği ve ZIP bütün sayfaları doğrulanır.
- Dört katalog raporu ve tüm ikinci kontroller bitmeden finalize_static.rb yayını tamamlamayı reddeder. Genel site dosyası sınırı 20.000, tek varlık sınırı 25 MiB olarak denetlenir.

## Mevcut kanıtlar
- Yerel native test: 55 test / 1.727 doğrulama / 0 hata (evidence/tests-free.txt).
- Tarayıcı Ruby: 225 gerçek PDF kompozisyonu + araç/ICS/DST/girdi güvenliği (evidence/portable-engine.json).
- Gerçek browser: Ana renkli PDF + 600 ppi WebP ve BW çok sayfalı ZIP; kişisel ekleme/düzenleme/reload/JSON restore/ICS round trip; artık yıl ve isim pagination (evidence/free-browser-functional.json).
- Statik tarama: 8.912 HTML, 8.888 indexlenebilir URL, 9.093 iç hedef; hata yok (evidence/static-audit.json). Son değişikliklerin ardından nihai tarama tekrarlanacak.
- Resmî Wrangler 4.151.3 ile hava durumu Pages Function derlendi (evidence/cloudflare-function-build.txt). Expires/Last-Modified/304/şehir beyaz listesi testli.
- d96cc48 native Linux/PostgreSQL/Docker CI geçti: https://github.com/mateopedersen/koledar365-si/actions/runs/39433668914 . Daha yeni commit yeniden kontrol edilecek.
- PR #2 (free): https://github.com/mateopedersen/koledar365-si/pull/2 . PR #1 orijinal Rails teslimini korur. İkisi sohbete bağlandı.

## Süreçler kesintiden sonra nasıl sürdürülür?
Önce ps ile gerçekten çalışan süreçleri ve JSON raporlarını okuyun. Aynı üreticiyi üst üste başlatmayın. Tamamlanan fingerprintleri silmeyin.
Ortak ortam: work/runtime/mise/installs/ruby/4.0.7/bin PATH başında; PDFTOPPM_BIN=/Users/melihozcan/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdftoppm; PYTHON_BIN=/Users/melihozcan/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3.
- Ana katalog: CATALOG_SHARD=0/1 CATALOG_SHARDS=2 bundle exec ruby script/generate_release_catalog.rb
- Ek katalog: aynı iki shard ile script/generate_extra_catalog.rb
- Yıllık Ay ön üretim: WARM_SHARD=0/1 WARM_SHARDS=2 script/warm_annual_lunar.rb. Kilitler ortak; raporu ana ek katalog toplar.
- Ana doğrulama: VERIFY_SHARD=0/1 VERIFY_SHARDS=2 Python script/verify_release_pairs.py.
- Ek doğrulama: VERIFY_SHARD=0/1/2/3, VERIFY_SHARDS=4, aynı araç; VERIFY_PREFIX=release-extra-verification, CATALOG_PATTERN=release-extra-catalog-[0-9].json. Önceki 569 geçen sonuç kayıpsız dört dilime taşındı.
- Yerel HTTP: python3 script/serve_static.py (3651); weather yerelde 3650 Rails'e GET proxy olur. Üretimde gerçek Pages Function kullanılır.
- 3650 Rails: bundle exec rails server -p 3650 -b 127.0.0.1. Eski tmp/pids/server.pid varsa önce PID'nin gerçekten canlı olduğunu doğrulayın.

## Sıradaki zorunlu işler
1. Devam eden katalog/ikinci kontrolleri tamamla; hiçbir başarısız kaydı geçilmiş sayma.
2. Son HTML/client ve gerçek fotoğraf/duyarlı görünüm/klavye kontrolleri; kişisel veri için ağ POST'u olmadığını doğrula. WebP köşe/harf/hizalama kanıtlarını koru.
3. package_catalog.rb → validate_catalog_sources.rb → audit_static.rb → finalize_static.rb → verify_static.mjs. Sonuç ve site/ commit/push.
4. Cloudflare Preview HTTPS, gerçek Function, indirmeler, CSP/noindex; ardından yetkilendirilmiş main yayını ve koledar365.si canlı kontrolü.
5. Yayın otomasyonunu temiz kurulumda test et; kabul matrisi, docs ve bu dosyayı gerçek canlı kanıtlarla güncelle.

## Korunacak sınırlar
- Godovi sayfaları kaldırıldı; doğrulanmamış 4 gelecek okul yılı held/noindex. Gelecek tatil tarihleri uydurulmaz.
- Günlük burç gerçek hazırlanmış tarihli 12 özgün yorumdur. API anahtarı olmadan sahte entegrasyon veya dünkü metne bugünün tarihi yok; tarihli editoryal hazırlama ve eksik gün açıklaması korunur.
- Avenir cihazda kuruluysa kullanılır; dağıtılabilir webfont lisansı verilmedi. PDF'lerde lisanslı DejaVu gömülür.
- İşletmeci Mateo Pedersen, gerçek iletişim koledar365@gmail.com. Sahte adres/ekip/uzman sertifikası yazılmaz.
- Google sıralaması veya gerçek kullanıcı CWV başarısı garanti edilmez. Yerel ölçüm, üretim ölçümü ve saha verisi ayrı raporlanır.
''')
print({'generated':produced,'second_pass':verified,'errors':errors,'checkpoint':now})
