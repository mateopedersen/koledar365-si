# Slovence dil incelemesi

HTML'deki başlık, açıklama, paragraf, düğme, etiket, tablo başlığı, ALT, title ve aria-label metinlerinden 14.642 farklı ifade çıkarıldı. `current/language-scan.json`: belirgin İngilizce arayüz artıkları ve bozuk UTF-8 için otomatik taramada sıfır eşleşme. Bu tarama, insan ana dil editörünün bütün cümleleri onaylaması anlamına gelmez. Metadata, örnek sayfa metinleri ve işlevsel sonuçlar ayrıca incelendi.

## Düzeltilen hata

`app/assets/javascripts/workdays.js` yalnızca 1 ve 2–4 sayılarını ayırıyordu; 2 için yanlış `delovni dnevi`, 101/102 için yanlış çoğul üretebiliyordu. Artık Slovence CLDR kurallarını kullanan `Intl.PluralRules('sl-SI')` ile `delovni dan / delovna dneva / delovni dnevi / delovnih dni` seçilir. Gün sayıları da `dan / dneva / dnevi / dni` biçimindedir. Saat sonucu `Intl.NumberFormat` birim biçimlemesiyle ondalık virgül ve uygun saat çekimini kullanır. Kaydırma sonucundaki cümle bağımsız etiketlere bölündü; yalın çoğul şeklinin yanlış hâl bağlamına yerleştirilmesi önlendi.

Regresyon değerleri: 1, 2, 3, 4, 5, 101, 102, 103, 111 ve 1,5 saat. Günlük saat özeti de 8 h sabit metni yerine kullanıcı seçimiyle güncellenir. Önceki başarısız gerçek sayfa testi `baseline/workdays-regression-before.txt` içinde korunmuştur.

## Terminoloji ve tarih yazımı

`državni prazniki` ile `dela prosti dnevi` eş anlamlı sayılmadı. Meteorolojik mevsimler ayın ilk günü, astronomik mevsimler kaynaklı olay anı olarak anlatıldı. Kurum adları ve yasal gün adları resmî kaynaklarla karşılaştırıldı. Görsellerin telif sahipleri, bilimsel kurum adları, dosya uzantıları, UTC/CET/CEST ve teknik kimlikler çevrilmedi.

Bağımsız tarih etiketi ile cümle içinde tarih çekimi aynı değildir. [ZRC SAZU tarih açıklaması](https://svetovalnica.zrc-sazu.si/topic/155/sklon-meseca-za-vrstilnim-%C5%A1tevnikom-pri-zapisovanju-datumov) ve [tarih yazımı](https://svetovalnica.zrc-sazu.si/topic/3264/pravilen-zapis-datuma/1) doğrultusunda bütün ay adlarını topluca genitife çevirmekten kaçınıldı. [CLDR Slovence çoğul tablosu](https://unicode.org/cldr/charts/49/supplemental/language_plural_rules.html) ile sonuç biçimlemesi doğrulandı.

Yerleşik insan Slovence editör sertifikası veya kusursuz dil garantisi verilmez; önemli terimler ve bulunan somut çekim hataları kaynak/test kanıtıyla ele alınmıştır.
