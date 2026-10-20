# SEO ve yayın

Tek gerçek canonical HTML yolu, Slovence dil etiketi, sayfaya özgü title/description, tek H1, breadcrumb, uygun WebSite/WebPage/ImageObject yapılandırılmış verisi. Takvim tablosuna sahte Event/Review verisi eklenmez. Tatil fotoğrafı paylaşımı gerçek kaynağı/lisansıyla eşleşir. İsme özgü yıl/tasarım seçenekleri ayrı indekslenebilir milyonlarca HTML oluşturmaz.

Sitemap sadece published sayfaları/isimleri içerir. held/draft, arama, kişisel önizlemeler ve indirmeler noindex olur. lastmod gerçek kayıt değişimidir. İsim sıklığı kamusal kaynak verisidir, doğum günü veya godov eşleştirmesi değildir. Kaynağı ve işlevi olmayan sayfa yayın kapısından geçirilmez.

Tüm sayfalar sunucuda anlamlı HTML üretir. JavaScript planlama ve canlı kontrolleri geliştirir. Responsive görseller, gerçek alt metin, yerel varlıklar, gecikmeli aşağı katman görselleri ve içerik hashli statik varlıklar kullanılır. Karanlık tema kullanıcı talimatıyla kaldırılmıştır.

Kontroller: `bundle exec ruby -r ./config/environment script/audit_seo.rb`; `bundle exec rails runner script/audit_observances.rb`. Kaynak araştırması Google Search Central title links, snippets, helpful people-first content, canonical ve image-license-metadata belgelerine dayanır. Taranabilirlik/metadata doğruluğu sıralama veya indeks garantisi değildir.

LCP 2,5 sn, INP 200 ms, CLS 0,1 hedefleri saha ölçümü gerektirir. İlk teslimde laboratuvar ölçümü ayrı raporlanır; tek Lighthouse yüklemesi gerçek kullanıcı INP kanıtı değildir. Canlı alan adı açılmadan Search Console doğrulama ve alan adına özgü saha verisi yoktur.

E-E-A-T bir sayısal puan değildir. Gerçek işletmeci Mateo Pedersen, metodoloji, tarihli kaynaklar ve düzeltme formu kullanılır. Bağımsız Slovence uzman tarafından incelendiği iddia edilmez. İşletmeci iletişimi ve üretim sağlayıcıları doğrulanmadan gizlilik metni son yayın onayı almış sayılmaz.

Son yerel HTTP ölçümü: altı temsilci rota, her biri üç ardışık istek, geliştirme Rails/loopback, ağ/CPU kısıtlaması yok. Sıcak HTML cevapları yaklaşık 6,5–20,7 ms; ilk ana sayfa cevabı 200,3 ms. Bunlar sunucu HTML süreleridir; LCP/INP/CLS değildir. Tam koşullar `evidence/http-performance.json` içinde. Gerçek üretim ağında kontrollü lab ve sonraki saha ölçümü ayrıca yapılmalıdır.
