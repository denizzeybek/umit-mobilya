---
name: fiyat-degisikligi
description: Commit öncesi fiyat kararı. Sahnelenmiş golden dosyalarını okur, her tasarımın eski→yeni tutarını ve yüzde farkını Türkçe bir tabloya çevirir, farkın koddaki hangi değişiklikten çıktığını açıklar ve "bu bir karar mı yoksa hata mı" sorusunu iş diliyle sorar. Onay alınca o diff için kaydı yazar ve commit serbest kalır; açıklanamayan bir kayma varsa commit'i TUTAR. `enforce-price-decision.sh` hook'u golden taşıyan her commit'i bu karar olmadan bloklar.
---

# fiyat-degisikligi

Fiyat kapısının düşünen yarısı. Aptal yarısı
`.claude/hooks/enforce-price-decision.sh`: **golden dosyası taşıyan bir commit'i,
o tam diff için kayıtlı bir fiyat kararı yoksa bloklar.**

Bu reponun en pahalı sayısı bir teklifin tutarı. `yarn price-net:bless` onu
yeşile boyamanın en kısa yolu ve Rule 13 "önce diff'i oku" diyor — ama okunacak
şey ham JSON ve bu repoyu işleten kişi JSON okumak zorunda değil. Bu skill'in
tek işi: **okunamaz bir diff'i, sahibinin dünyada en iyi cevaplayabileceği bir
soruya çevirmek.**

Soru şu: *bu rakam senin kararınla mı değişti, yoksa bir şey mi bozuldu?*

## Ne zaman

- `git commit` fiyat kapısında bloklandığında.
- `yarn price-net:bless` çalıştırdıktan hemen sonra (kapıyı beklemeden).
- Fiyat motoruna, bir ürünün `parts.ts`/`options.ts`'ine ya da `cases.ts`'e
  dokunan bir işi bitirirken.

## Döngü

### 1. Neyin değiştiğini oku

```bash
cd "$(git rev-parse --show-toplevel)"
G=umit-mobilya-server/test/price-net/__goldens__

git diff --cached --name-status -- "$G"     # A = yeni golden, M = tutar oynadı
```

Her **M** için eski ve yeni hâli yan yana al:

```bash
git show "HEAD:$G/<id>.json" | jq '{t: .price.total, d: .displayTotal, l: [.price.lines[] | "\(.label): \(.amount)"]}'
git show ":$G/<id>.json"     | jq '{t: .price.total, d: .displayTotal, l: [.price.lines[] | "\(.label): \(.amount)"]}'
```

Tasarımın **adını** `umit-mobilya-server/test/price-net/cases.ts` içindeki
`title` alanından al — golden kimliğinden değil. Okuyan kişi "180×220×60, iki
bölüm, kulpsuz kapak" cümlesini anlar, `gardirop-standart` kimliğini anlamaz.

### 2. Farkı KODDAN açıkla

Tabloyu göstermeden önce kendine sor: **bu tutar neden oynadı?** Cevap
sahnelenmiş diff'te somut bir satır olmalı:

```bash
git diff --cached -- umit-mobilya-client/src/views/configurator/_etc \
                     umit-mobilya-server/test/price-net/cases.ts
```

- `İşçilik` kalemi oynadıysa → `labour` ayarı ya da alan hesabı değişmiş olmalı
- `Menteşeler` oynadıysa → kanat sayısı, kanat tavanı ya da menteşe kademesi
- `Gövde` oynadıysa → panel sayısı, ölçü ya da m² fiyatı
- Bütün kalemler aynı oranda oynadıysa → marj, KDV ya da fire

**Açıklayamıyorsan DUR.** Onay isteme, tabloyu bir karar gibi sunma. Açıklanamayan
bir kayma bir karar değil, henüz bulunmamış bir hatadır — ve bu skill'in var
olma sebebi tam olarak o kaymanın onaylanmasını engellemek.

Bu durumda: kaymayı anlatan tek cümleyi söyle, commit'i **tut**, ve sebebi bul.

### 3. Tabloyu göster — iş dilinde, JSON değil

Para birimi ayrılmış, yüzde virgüllü, oynayan kalem adıyla:

```
Gardırop · 180 × 220 × 60, iki bölüm, kulpsuz kapak
  Eski   57.760 TL
  Yeni   61.240 TL      (+3.480 TL,  %6,0)
  Oynayan kalem: İşçilik  7.568 → 11.048 TL
  Sebebi: fiyat kitabındaki işçilik m² ücreti 350'den 510'a çıkarıldı

Vestiyer · 140 × 200 × 35, iki bölüm, kapaksız
  Eski   24.880 TL
  Yeni   24.880 TL      (değişmedi)
```

Yeni bir golden (**A**) için kıyas yok; o zaman tutarı ve kalemleri göster ve
soruyu "bu yeni tasarımın tutarı makul mü?" olarak kur.

Gösterilecek rakam `displayTotal` — **müşterinin ekranda gördüğü sayı**.
`netTotal` ve `vat` yalnızca fark oradan geliyorsa açılır.

### 4. Soruyu sor

`AskUserQuestion` ile sor, serbest metin bekleme — cevap iki şeyden biri:

- **"Evet, bu değişikliği ben istedim"** → karar. 5. adıma geç.
- **"Hayır, ben fiyat değiştirmedim"** → hata. Commit'i TUT, kaydı YAZMA,
  sebebi bul. Kullanıcı fiyatı değiştirmediğini söylüyorsa ve rakam oynadıysa,
  oynayan şey bir yan etkidir.

Soruyu mekanizmayla değil sonuçla kur: "işçilik katsayısı değişti" değil,
**"gardırop teklifleri %6 pahalılaşıyor — bunu sen mi istedin?"**

### 5. Kararı kaydet

```bash
cd "$(git rev-parse --show-toplevel)"
{ git diff --cached -- umit-mobilya-server/test/price-net/__goldens__ \
    | shasum -a 256 | cut -d' ' -f1
  echo "<karar tek satır: hangi tutar, ne kadar, neden>"
} > "$(git rev-parse --git-dir)/price-decision-pass"
```

Kayıt sahnelenmiş golden diff'inin özetine bağlı: **bir golden daha değişirse
özet değişir ve kapı yeniden kurulur.** Karar, gördüğün rakamlar için verildi.

Kararı commit mesajının gövdesine de yaz — Rule 13 bunu istiyor ve altı ay sonra
"bu tutar neden buradan buraya geldi" sorusunun tek cevabı o satır olacak.

## Korkuluklar

- **Açıklanamayan kaymayı onaylatma.** Bu skill'in tek gerçek işi bu. "Kullanıcı
  zaten bir şey istedi, o yüzden doğrudur" bir gerekçe değil: aynı düzenlemede
  kazara girmiş bir hata için de aynı cümle kurulabilir.
- Golden'ı elle düzenleme, marker'ı elle yazma, `--no-verify` kullanma. Kapı tam
  olarak bunları engelliyor.
- `bless` bir onay adımıdır, kırmızıyı susturma adımı değil. Kırmızı golden
  gördüğünde ilk hamle bless DEĞİL, diff'i okumak.
- Tutar oynamadıysa (yalnızca yeni golden eklendiyse) yine de sor — ama soruyu
  "makul mü" olarak kur, "onaylıyor musun" olarak değil.
- Bu kapı `ai-review`'in yerine geçmez: o kodu inceliyor, bu tutarı. İkisi de
  push'tan önce geçmek zorunda.

## Neden commit'te, bless'te değil

`bless` kilitlenirse tavuk-yumurta çıkıyor: kararı vermek için yeni rakamlar
gerekiyor, rakamları üretmek için bless. Kapı commit'te durduğu için bless
mekanik bir adım olarak kalıyor ve soru, değişikliğin **kalıcı olacağı** yerde
soruluyor — ayrıca `ai-review` push'ta hâlâ kodu görüyor.
