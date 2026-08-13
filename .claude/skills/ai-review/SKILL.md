---
name: ai-review
description: Push öncesi AI kod incelemesi kapısı. Push edilecek commit'leri BLOKLAYICI sorunlar için inceler (doğruluk / güvenlik / kırık derleme ya da sözleşme), makineyle doğrulanabilen blokerleri spec-first düzeltip commit'ler, düzeltmesi arayüzde denenmesi gereken bir şeyse somut bir test senaryosu verip push'u TUTAR. Temiz çıkınca o HEAD için onay kaydeder ve pre-push hook push'a izin verir. Her push'tan önce çağır; `pre-push-ai-review.sh` hook'u onayı olmayan her push'u bloklar.
---

# ai-review

Push kapısının düşünen yarısı. Aptal yarısı `.claude/hooks/pre-push-ai-review.sh`:
**HEAD'i için taze onayı olmayan her `git push`u bloklar.** Bu skill o onayı
üretiyor — ama yalnızca diff gerçekten temizse (ya da temizlendikten sonra).

**Altın kural:** gerçek bir inceleme o commit için sıfır BLOKLAYICI bulgu
doğrulamadan onay yazma, ve kapıyı asla atlatma (`--no-verify`, marker'ı elle
yazma, `git push -f`).

## Ne zaman

- Kullanıcı push isteyince ya da sen push etmek üzereyken.
- Pre-push hook push'u bloklayıp bu skill'i çağırmanı söyleyince.

## Döngü

### 1. Push kapsamını belirle

```bash
git rev-parse --abbrev-ref HEAD
git rev-parse --abbrev-ref --symbolic-full-name @{upstream} 2>/dev/null
```

- Upstream varsa: `git diff @{upstream}...HEAD`
- Yeni dal: `git diff origin/main...HEAD`

Push'a dahil olması gereken **işlenmemiş değişiklik** varsa önce commit et
(repo kuralları: dalda çalış, Türkçe commit mesajı, commit kapısı koşsun).
Push yalnızca commit'leri yayınlar; inceleme kapsamı commit'lenmiş aralıktır.

Dal zaten upstream ile eşitse söyle ve dur — incelenecek bir şey yok.

### 2. Rubriği YALNIZCA dokunulan uygulamaya daralt

Bu repoda iki bağımsız uygulama var ve her birinin kendi kural kitabı. Kökten
çalışırken hiçbiri bağlamda değil — ilgili olanı açıkça oku. **Değişen dosyası
olmayan bir uygulamanın kurallarını OKUMA.**

```bash
git diff --name-only <aralık> | cut -d/ -f1 | sort -u
```

| Değişen yol | Uygulama | Okunacak rubrik | Yerel kapı |
|---|---|---|---|
| `umit-mobilya-client/**` | İstemci | `umit-mobilya-client/CLAUDE.md` + `.claude/rules/01–11` | `yarn lint`, `yarn type-check`, `yarn build`, `yarn test:unit run` |
| `umit-mobilya-server/**` | Sunucu | `umit-mobilya-server/CLAUDE.md` + `.claude/rules/00–13` | `yarn type-check`, `yarn test` |
| kök dosyalar | mono | kök `CLAUDE.md` + `.claude/rules/*` | — |

Sonra o kurallara göre incele: her değişen hunk'ı **ve onu çevreleyen
fonksiyonu** oku, değişen sembollerin çağıranlarını izle, ve **silinen her
satırı** düşen bir değişmez var mı diye denetle.

Bu repoda özellikle bakılacak yerler:

- **Fiyat motoru iki kopya.** `_etc/pricing/**` ya da `products/*/parts.ts`
  değiştiyse `yarn sync:pricing` koşuldu mu, `test/pricing-sync.spec.ts` yeşil
  mi. Kopyalar ayrışırsa ekrandaki fiyatla teklifteki fiyat farklılaşır.
- **Fiyat goldenları.** `test/price-net/__goldens__` diff'i varsa bu bir KARAR:
  hangi katsayı neden değişti, commit mesajında yazıyor mu.
- **Katalog kimlikleri.** Bir kaplama/kapak tipi kimliği silindi ya da
  değiştirildiyse paylaşılmış bağlantılar ve dondurulmuş teklifler ne olur.
- **DB'de anahtar, URL değil** (Rule 10). Yeni bir görsel alanı URL saklıyorsa
  bloklayıcı.
- **Tembel paket sınırı.** Her zaman yüklenen bir dosya `registry` / ürün
  modülü / `three` import ediyorsa ana paket şişer (`yarn size-check`).
- **e2e katman kararı** (Rule 11): tarayıcıya taşınmış bir aritmetik iddiası
  ya da sunucuya taşınmış bir ekran iddiası.

### 3. Her bulguyu sınıflandır

- **BLOKLAYICI** — uzağa gitmemeli:
  - doğruluk hatası (yanlış çıktı, çökme, veri kaybı, yarış),
  - güvenlik açığı (auth atlatma, enjeksiyon, sır sızıntısı, yol kaçışı),
  - kırık derleme / tip hatası / düşen test,
  - kırık public sözleşme (OpenAPI, üretilmiş istemci, golden),
  - davranışı değiştiren bir kural ihlali.
- **BLOKLAYICI DEĞİL** — tekrar kullanım / sadeleştirme / isimlendirme / doküman
  / üslup. Kullanıcıya not olarak söyle; push'u TUTMAZ.

Sıfır bloklayıcı varsa 5. adıma geç.

### 4. Her bloklayıcıyı çöz

Her biri için: düzeltmesi **kullanıcı olmadan doğrulanabilir mi?**

- **Kodla düzeltilebilir + makineyle doğrulanabilir** (spec / type-check /
  mevcut testlerle kanıtlanır): **spec-first** düzelt (önce kırmızı test, sonra
  düzeltme — Rule 00), testleri koştur, açık bir mesajla **commit et**. Sonra
  **1. adıma dön** — HEAD değişti, yeni aralığı yeniden incelemeden onaylama.

- **Arayüzde denenmesi gerekiyor** (doğruluğu ancak çalışan uygulamada
  görülebilir — görsel/etkileşim/uçtan uca bir davranış): **kendi başına
  onaylama.**
  1. Düzeltmen varsa uygula ve commit et, ama sonucu *doğrulanmamış* say.
  2. Kullanıcıya **somut bir test senaryosu** ver: hangi ekran/adres, adımlar,
     girdi, **beklenen sonuç**, ve başarısızlığın neye benzediği.
  3. **Push'u TUT** (onay yazma). "Bunu arayüzde dene; geçtiğini söyle
     onaylayıp push edeyim, ya da neyin bozulduğunu söyle düzelteyim" de.
  4. Kullanıcı geçtiğini söyleyince 1. adımdan devam et, sonra onayla.

Hangi kovada olduğu konusunda dürüst ol. Emin değilsen arayüz doğrulaması say —
sahte bir "düzelttim ve push ettim", bir fazladan elle kontrolden kötüdür.

### 5. Onayla + push

Yalnızca **son** HEAD sıfır bloklayıcı taşıyorsa ve uygulanan düzeltmeler
doğrulandıysa (test ya da kullanıcının arayüz onayı):

```bash
git rev-parse HEAD > "$(git rev-parse --git-dir)/ai-review-pass"
```

Sonra push et. Hook marker'ı okuyup HEAD ile eşleştiğini görecek ve izin
verecek. Kullanıcıya raporla: push edilen commit, ertelediğin BLOKLAYICI OLMAYAN
notlar, ve hâlâ borçlu olduğu arayüz testleri.

## Korkuluklar

- Onay marker'ı **commit başına** (çıplak SHA). Yeni commit kapıyı yeniden
  kuruyor — skill'i tekrar koş. Az önce temiz incelemediğin bir SHA için asla
  marker yazma.
- `git push -f` / `--no-verify` / marker'ı elle düzenleme yok. Kapı tam olarak
  bunu engellemek için var.
- BLOKLAYICI OLMAYAN bulgular push'u tutmaz; BLOKLAYICI bulgular "sonra
  hallederiz" olmaz.
- İncelemenin kendisi koşamıyorsa (derleme kırık, testler başlamıyor) bu
  BLOKLAYICI bir durumdur: önce aleti düzelt, körlemesine onaylama.
- Bu kapı e2e kapısının YERİNE geçmez. `pre-push-e2e-gate.sh` testleri koşar,
  bu skill kodu okur; ikisi ayrı sorulara cevap veriyor.
