---
name: e2e-decision
description: Commit öncesi e2e kararı. Commit'e giren kodu okur ve "bu değişikliğin tarayıcıda kanıtlanması gerekiyor mu" sorusunu cevaplar; gerekiyorsa manifest'e yolculuğu ekleyip spec'i yazar ve YALNIZCA o yeni spec'i koşturur, geçince commit'e izin veren kaydı yazar. Gerekmiyorsa gerekçesini kaydeder. `enforce-e2e-decision.sh` hook'u, davranışa dokunan her commit'i bu karar olmadan bloklar.
---

# e2e-decision

Commit kapısının düşünen yarısı. Aptal yarısı
`.claude/hooks/enforce-e2e-decision.sh`: **davranışa dokunan bir commit'i, o
tam içerik için kayıtlı bir e2e kararı yoksa bloklar.**

Amaç yeni test yazdırmak değil; **soruyu sordurmak**. Cevabın "gerekmiyor"
olması tamamen geçerli — ama gerekçesiyle kayda geçiyor.

## Ne zaman

- `git commit` bloklandığında.
- Davranış değiştiren bir şeyi commit'lemek üzereyken (kapının tetiklenmesini
  beklemeden çağırabilirsin).

## Döngü

### 1. Commit'e gireni oku

```bash
git diff --cached --stat
git diff --cached
```

Sahnelenmiş **içerik** okunur, dosya adları değil. Bir `.vue` dosyasının
değişmesi tek başına bir şey söylemez; değişen şeyin ne olduğu söyler.

### 2. Katman kararını uygula

Ölçüt Rule 11'in katman kararı (`umit-mobilya-client/.claude/rules/11-e2e-conventions.md`)
ve karşılığı Rule 13. Sorulacak tek soru: **bu değişiklik bozulursa, hangi
katman kırmızıya döner?**

**e2e GEREKİR** — yalnızca gerçek tarayıcıda görülebilen bir davranış:

- bir ekranın açılması / route kablolaması / yönlendirme,
- 3B sahne, WebGL, canvas, doku yükleme,
- adres çubuğuna yazılan ya da adresten geri yüklenen tasarım,
- indirme, yeni sekme, pano, dosya seçme,
- ekranda gösterilen bir değerin sunucudaki karşılığıyla aynı olduğu iddiası,
- async bir zincirin ucu (bir şey geldiğinde arayüzün tepki vermesi).

**e2e GEREKMEZ** — başka bir katman bunu daha ucuza ve daha kesin kanıtlıyor:

- saf fonksiyon / hesap / dönüşüm → vitest,
- fiyat tutarı → sunucudaki golden ağı (Rule 13),
- HTTP sözleşmesi, durum kodu, auth sınırı → characterization spec,
- yalnızca metin, stil, hizalama, yorum, doküman, kural, hook,
- üretilmiş dosya (`src/client/**`, `generated/**`, `components.d.ts`),
- var olan bir yolculuğun zaten kapsadığı davranış — **hangisi olduğunu yaz.**

Kararsızsan: bu değişiklik sessizce bozulsaydı fark eder miydik? Fark
etmezsek ve tek görünür yeri tarayıcıysa, e2e gerekir.

### 3a. Gerekiyorsa: yaz ve YALNIZCA onu koştur

1. `umit-mobilya-client/e2e/journeys.manifest.ts` içine kimliği ve tek satırlık,
   kullanıcı diliyle gerekçesini ekle. (Hook manifest'siz spec'i zaten bloklar.)
2. `e2e/journeys/<id>.spec.ts` yaz — Rule 11'in yazım kurallarına uyarak:
   fixtures'tan import, `data-testid` ile seçim, await'li web-first iddia, sabit
   uyku yok, sabit tutar yok.
3. **Yalnızca yeni spec'i koştur:**
   ```bash
   cd umit-mobilya-client
   npx playwright test --config playwright.journeys.config.ts <id>
   ```
   Bütün suite'i koşturma — pre-push kapısı zaten hepsini koşuyor. Burada
   sorulan soru "bu yeni test geçiyor mu".
4. Yeni testin gerçekten bir şey kanıtladığını doğrula: düzeltmeyi/özelliği
   geçici olarak bozup testin KIRMIZI olduğunu gör, sonra geri al. Yeşil doğan
   bir e2e, çoğu zaman hiçbir şey iddia etmiyordur.

### 3b. Gerekmiyorsa: gerekçeyi yaz

Tek cümle, somut. "Gerekmiyor" yetmez; hangi katmanın kapsadığını söyle:

- `saf hesap, colorValue.spec.ts kapsıyor`
- `yalnızca hizalama ve metin; davranış değişmedi`
- `HTTP sözleşmesi, quote.characterization.spec.ts'e eklendi`
- `viewer-3d yolculuğu bu yolu zaten geçiyor`

### 4. Kararı kaydet

```bash
cd "$(git rev-parse --show-toplevel)"
{ git diff --cached | shasum -a 256 | cut -d' ' -f1
  echo "<karar tek satır>"
} > "$(git rev-parse --git-dir)/e2e-decision-pass"
```

Kayıt sahnelenmiş içeriğin özetine bağlı: **bir dosya daha eklersen ya da bir
satır değiştirirsen özet değişir ve kapı yeniden kurulur.** Bu bilinçli — karar,
incelediğin içerik için verildi.

Sonra commit et.

## Korkuluklar

- Marker'ı elle yazma, `--no-verify` kullanma. Kapı tam olarak bunu engelliyor.
- Yeni yolculuk eklemek bir bütçe kararı: Rule 11'in tavanları (smoke 120 sn,
  yolculuklar 300 sn) ve manifest disiplini geçerli. Var olan bir yolculuk
  kapsıyorsa YENİSİNİ YAZMA, onu göster.
- Yeni spec'i koşturmadan karar kaydetme. Yazılmış ama koşulmamış bir test,
  olmayan bir testtir.
- Bu kapı pre-push e2e kapısının yerine geçmez: burada yalnızca YENİ spec
  koşuyor, bütün suite push'ta koşuyor.
