# Durum — bekleyen cevaplar ve kararlar

Bu dosya **oturumlar arasında hatırlanması gereken şeyleri** tutar: sahibinin
söylediği ama koda henüz girmemiş bilgiler, atölyeden beklenen cevaplar, ve
alınmamış kararlar.

Kod hakkındaki bilgi buraya **yazılmaz** — o `CLAUDE.md` ve `.claude/rules/`
işidir. Buraya yalnızca şu üç şey girer:

1. **Atölyeden/sahibinden beklenen bir cevap** ve o cevap gelene kadar hangi
   varsayımla çalışıldığı.
2. **Alınmamış bir karar** ve alınmadığı için neyin olduğu gibi bırakıldığı.
3. **Cevaplanmış** bir soru ve tarihi — silinmez, arşive iner; altı ay sonra
   "bu sayı nereden geldi" sorusunun cevabı burada.

Bir madde cevaplandığında: cevabı yaz, tarihi yaz, **Arşiv**'e taşı, ve cevabın
koda/fiyat kitabına yansıdığı yeri belirt. Cevaplanan bir maddeyi silmek, aynı
soruyu altı ay sonra yeniden sordurur.

---

## Atölyeden teyit bekleyen — fiyat girdileri

`fiyat-dogrula` (2026-08-14) aritmetiğin doğru olduğunu kanıtladı: 2 kapaklı
gardırop ve vestiyerde her kalem girdilerden birebir çıkıyor. **Girdilerin
kendisi teyit edilmedi** — tohum değerler, `catalog.ts`'in kendi yorumunda
yazdığı gibi: *"Bu rakamlar TAHMİN; asıl veriyi admin paneli girecek."*

### A. Rakamlar

| Girdi | Bugünkü değer | Atölye teyidi |
|---|---|---|
| MDF High Gloss | 2.000 TL/m² | — |
| Lak Panel | 2.900 TL/m² | — |
| Akrilik | 3.400 TL/m² | — |
| Lake | 3.100 TL/m² | — |
| Kulpsuz kapak farkı | 450 TL/m² | — |
| Aynalı kapak farkı | 1.200 TL/m² | — |
| Cam kapak farkı | 1.500 TL/m² | — |
| Arkalık 4 / 8 / 18 mm | 180 / 260 / 520 TL/m² | — |
| Kenar bandı | 45 TL/m | — |
| Menteşe | 35 TL/adet | — |
| Kulp | 120 TL/adet | — |
| Çekmece (ray + malzeme dahil) | 950 TL/adet | — |
| Askılık borusu | 180 TL/m | — |
| İşçilik | 350 TL/m² + 1.500 TL montaj | — |
| Marj çarpanı | ×1,25 | — |
| KDV | %20 | — |
| Fire payı | %0 | — |

Bunlar geldiğinde **koda dokunulmaz**: `/admin/fiyat-kitabi`'ndan girilir, yeni
bir sürüm yazar, verilmiş teklifler değişmez.

### B. İmalat varsayımları — rakamdan daha önemli

Bunlar yanlışsa fiyat kalem kalem değil **topluca** kayar:

| # | Soru | Bugünkü varsayım | Cevap |
|---|---|---|---|
| 1 | Her modül ayrı kutu olarak mı imal ediliyor? | Evet — iki bölümlü dolapta **4** yan panel sayılıyor, 3 değil. Paylaşılıyorsa fiyat ~%9 yüksek. | — |
| 2 | Gövdenin ön kenarlarına bant vuruluyor mu? | Hayır — bant yalnızca kapak ve raf kenarlarında. Vuruluyorsa fiyat düşük. | — |
| 3 | Brüt mü net mi fiyatlanıyor? | Brüt (dış ölçü, fire içinde), ayrı fire payı yok. | — |
| 4 | Menteşe kademeleri doğru mu? | 100/160/200/240 cm → 2/3/4/5 adet, üstü 6. | — |
| 5 | Çekmece 950 TL'ye ray ve malzeme dahil mi? | Evet — ön panel ayrıca m² fiyatlanmıyor. | — |
| 6 | Vestiyerde 8 mm arkalık olmalı mı? | Var ve 728 TL ediyor. Açık bir mobilyada gerekli mi? | — |
| 7 | Köşe modülünün imalat farkı yüzde kaç? | %0 — köşe modül düz modülle aynı fiyatlanıyor. | — |

7. madde koda TODO olarak da yazılı (`priceBook.ts`, `cornerSurchargePercent`)
ve `gardirop-kose-modullu` golden'ı tam bu değişikliği yakalamak için var.

---

## Bekleyen kararlar

| Karar | Bugün ne oluyor | Neden bekliyor |
|---|---|---|
| `createDefaultConfig` **tohum** kitabı okuyor, yayınlanmış kitabı değil | Admin panelinden varsayılan malzeme değiştirilse konfigüratörün açılış seçimi değişmiyor | "Varsayılan malzeme" bir tasarım tercihi mi yoksa fiyat kitabı verisi mi — sahibinin kararı. İstemci ve sunucu birlikte değişmeli, fiyat kararı gerektirir. |
| GitHub Actions CI | Yok; bütün kapılar yerel | Ücret, gizli anahtarlar ve Playwright'ın CI kurulumu ayrı bir karar. Kapılar sağlam olduğu için acil değil. |
| Deploy | Bağlı host yok (AWS kapalı) | Netlify/Railway bağlanana kadar `main`'e push kodu yayınlar, siteyi güncellemez. |

---

## Arşiv — cevaplanmış

*(Henüz yok. İlk cevap geldiğinde buraya tarihiyle iner.)*
