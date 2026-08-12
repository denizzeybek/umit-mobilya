# Rule 13 — Fiyat ağı: golden'lar, determinizm ve senaryo yazımı

> Bir teklifin tutarı bu repodaki en pahalı sayı. `test/price-net/` onu **dondurur**: kanonik tasarımların tutarı, kalemi kalemine, işlenmiş bir golden dosyasında durur. Ağ ancak deterministik, kendi kendini temizleyen ve neyi kanıtladığı konusunda dürüst olduğu sürece güvenilir.

## Why this rule exists

Fiyat motoru **iki yerde** çalışıyor: istemci ekrandaki rakamı anında göstersin,
sunucu teklifi kaydederken tutarı yeniden hesaplasın diye
(`scripts/sync-pricing.js`, `test/pricing-sync.spec.ts`). Bu ayrışmanın kırılma
biçimi sessiz: ekranda bir rakam, admin panelinde başka bir rakam, hiçbir test
kırmızı değil.

`pricing-sync.spec.ts` iki kopyanın **bayt bayt** aynı olduğunu kanıtlıyor. Ama
kopyaların aynı olması, sonucun **doğru** olduğunu kanıtlamıyor: `priceOf`'a
girilen bir katsayı yanlışsa iki taraf da aynı yanlış sayıyı üretir ve senkron
testi mutlu mesut yeşil kalır.

Golden ağının cevapladığı soru bu: *bu tasarımın tutarı bugün de dün verdiği
sayı mı?* Bir refactor, bir katalog düzenlemesi ya da bir yuvarlama değişikliği
tutarı oynattığında golden diff'i bunu bir karar haline getiriyor — sessiz bir
kayma olmaktan çıkarıyor.

Aşağıdaki maddelerin her biri gerçek bir tuzağın karşılığı, ve tarayıcı tarafının
kardeşi `umit-mobilya-client/.claude/rules/11-e2e-conventions.md`. İkisi bir
çift — birlikte tutarlı kalsınlar.

## Katman kararı (istemci bütçesinin aynası)

- **Bir sayı / tutar / hesap** → **burada**, golden ya da senaryo olarak.
  Tarayıcıda asla.
- **Bir kaydın hangi tutarla dondurulduğu, fiyat kitabı değişince ne olduğu** →
  burada, davranışsal senaryo.
- **Bir ekran açılıyor mu, paneldeki rakam sunucununkiyle aynı mı** → istemcinin
  Playwright suite'i (Rule 11), burada değil.

Bir değer API/DB seviyesinde doğrulanabiliyorsa tarayıcı onu TEKRAR doğrulamaz.

---

## 1. Determinizm — golden koda bağlı olmayan bir sebeple oynayamaz

Bir golden, kod değişmediği hâlde değişiyorsa normalizasyondan bir alan kaçmış
demektir. Çözüm normalizeri düzeltmektir, goldeni her gün yeniden basmak değil.

Yanıttan **çıkarılan** alanlar (`test/price-net/normalize.ts`):

| Alan | Neden |
|---|---|
| `code` | `generateQuoteCode` rastgele; kayıt başına değişir |
| `createdAt` | duvar saati |
| `_id`, `__v` | ObjectId |
| `contact` | teklifin konusu değil |

**Kalan** her şey golden'ın konusudur: `productType`, `configSchemaVersion`,
`priceBookVersion`, `config` (golden'ı okuyan hangi tasarımın kaç lira ettiğini
tek dosyada görebilmeli), `price.lines`, `price.netTotal`, `price.vat`,
`price.total` — ve `displayTotal`, yani `Math.round(total / 10) * 10`,
**müşterinin ekranda gördüğü rakam**. O sayı golden'da açıkça duruyor, çünkü
kayan şey oydu.

Donmuş `parts` listesi kayıtta var ama `QuoteResponseDto` onu döndürmüyor, o
yüzden golden de içermiyor: golden yalnızca **ağdan geçen** şeyi çiviler. Parça
listesinin kendisi istemcideki vitest spec'lerinin konusu.

### Do
- Yeni bir volatil alan çıktığında normalizere ekle ve **neden** volatil
  olduğunu golden'a değil normalizere yaz.
- Kanonik case'leri `test/price-net/cases.ts` içinde sabit değerlerle kur.

### Don't
- ❌ Golden'a ham ObjectId, zaman damgası ya da teklif kodu sızdırmak.
- ❌ Golden'ı düzeltmek için normalizeri, iddia edilen alanı da gizleyecek kadar
  geniş yapmak.
- ❌ `Math.random()`, `Date.now()`, çıplak `new Date()` — hook bloklar.

## 2. Golden elle düzenlenmez

`test/price-net/__goldens__/**` **üretilmiş** dosyalardır. Elle düzenlemek,
kırmızı bir testi susturmanın en kısa yolu ve tam olarak ağı işe yaramaz hâle
getiren hareket.

```bash
yarn price-net:bless      # goldenları yeniden basar
git diff test/price-net/__goldens__   # DEĞİŞEN SAYIYI OKU
```

`bless` bir onaydır, bir temizlik adımı değil. Diff'te bir tutar oynadıysa
commit mesajında **neden** oynadığı yazılır: hangi katsayı, hangi karar. Hook
bu dosyalara `Write`/`Edit` ile dokunmayı bloklar.

## 3. Ölçülen mutasyon gerçek HTTP ucundan geçer

Bir teklifin tutarı `POST /api/quotes` üzerinden üretilir — servis doğrudan
çağrılarak değil. Golden'ın kanıtladığı şey uç + `ValidationPipe` + guard +
motor zincirinin tamamı; servisi elle çağırmak o zincirin yarısını atlar.

Doğrudan Mongo'ya yazmak yalnızca API'nin **yapamadığı** hazırlık için
serbesttir ve satırın üstünde `/* reason: ... */` ile gerekçesi yazılır — hook
gerekçesizini bloklar.

## 4. Her senaryo kendi kendini temizler

Ağ tekrar tekrar koşuyor (yerel, pre-push kapısı). Durum değiştiren bir senaryo
onu geri almak zorunda, yoksa bir sonraki koşum başka bir golden'ı oynatır.

- `clearCollections()` `beforeEach`'te koşar; ona güven ama üstüne yatma.
- Fiyat kitabı yayınlayan bir senaryo (`PUT /api/pricebook`) kendi kitabını
  yaratıp bitirir; başka bir spec'in kitabına dokunmaz.
- Senaryo suite'i koştuktan sonra `price-net` goldenları hâlâ TEMİZ olmalı —
  tenant'ın taban duruma döndüğünün kanıtı budur.

## 5. Bekleme — koşulu yokla, süre uyuma

Bu sunucuda asenkron bir kuyruk yok, o yüzden kural kısa: **sabit uyku yasak.**
`await new Promise((r) => setTimeout(r, 500))` bir tahmindir; yavaş makinede
flake verir, hızlı makinede saniye yakar, ve bir hatayı maskeler. Bir şeyin
olmasını bekliyorsan `await` ettiğin çağrının kendisi zaten o bekleme.

## 6. Golden mi, davranışsal mı

- **Golden** — normalize edilmiş yanıtı işlenmiş bir dosyayla bayt bayt
  karşılaştır: deterministik yanıt gövdeleri için (bir tasarımın fiyat dökümü).
- **Davranışsal** — bir etkinin gerçekleştiğini iddia et: fiyat kitabı v2
  yayınlandığında **eski teklifin tutarı değişmedi**, yenisininki değişti. Bunun
  sabit bir golden'ı olamaz, çünkü iddia iki koşum arasındaki **ilişki**.

Sonuç bir ilişki ya da bir yan etkiyse davranışsal yaz; deterministik bir gövdeyse
golden yaz.

## 7. Yazım kuralları

Rule 08'in üstüne, bu ağa özel olanlar:

1. **Case adı tasarımı anlatır**, kimliği değil: `'180x220 iki bölüm, sürgü
   kapak, MDF'` — `'case-3'` değil. Golden dosyasının adı da o kimlikten türer.
2. **Bir case = bir tasarım.** Bir case içinde iki farklı config denenmez;
   golden diff'i o zaman hangi tasarımın kaydığını söylemez.
3. **İddia goldenın kendisi.** `expect(normalized).toEqual(golden)` — yanında
   "total pozitif olmalı" gibi ikinci bir iddia yazma; golden zaten onu içeriyor
   ve zayıf iddia okuyucuyu yanıltıyor.
4. **Sınır case'leri kataloğun sınırlarından türet**, elle yazılmış sayılardan
   değil: en dar/en geniş gövde `book.products[type].width` aralığından okunur.
   Katalog değiştiğinde case birlikte hareket eder.
5. **Kanonik case listesi kısa kalır.** Her case bir golden dosyası ve her
   golden bir bakım yükü. Yeni bir case ekliyorsan hangi kırılmayı yakalayacağını
   söyleyebilmelisin; söyleyemiyorsan o bir vitest testidir
   (`_etc/pricing/*.spec.ts`), golden değil.
6. **Yeni spec kırmızı başlamak zorunda değil.** `test/price-net/**` var olan
   davranışı çiviliyor — characterization ile aynı iddia — ve
   `enforce-spec-failing` bu yolu bu yüzden muaf tutuyor.

## Do

- Golden diff'ini **oku**. Bir kalem eklendiyse veya bir tutar oynadıysa bu bir
  karardır; commit mesajı onu anlatır.
- Fiyat motoruna dokunan her değişiklikten sonra `yarn test` + `yarn --cwd
  ../umit-mobilya-client test:unit run` — iki kopya da aynı anda kanıtlanır.
- Kalemleri değil, kalemin **anlamını** koru: `price.lines[].label` golden'ın
  parçası, çünkü admin paneli o metni gösteriyor.

## Don't

- ❌ Golden dosyasını elle düzenlemek.
- ❌ `bless` çalıştırıp diff'e bakmadan commit'lemek.
- ❌ Ölçülen mutasyonu servis çağrısıyla ya da doğrudan Mongo yazımıyla
  simüle etmek.
- ❌ Sabit uyku, `Math.random()`, çıplak `new Date()`.
- ❌ Bir tarayıcı iddiasını buraya taşımak (ekranda görünüyor mu). O Rule 11'e
  ait.

## Enforcement

`.claude/hooks/enforce-price-net.sh` (`Write|Edit`) şunları bloklar: golden
dosyalarına elle dokunma, `test/price-net/**` içinde sabit uyku,
`Math.random()`/`Date.now()`/çıplak `new Date()`, ve gerekçesiz doğrudan
koleksiyon yazımı. Ek olarak `block-skip-and-only` ve `run-related-tests` bu
dosyalar için de koşuyor.

Kök `.claude/hooks/pre-push-e2e-gate.sh` `git push` öncesi bütün ağı koşuyor —
kırmızıysa push bloklanıyor.

Related: [[00-tdd-discipline]] (characterization suite'in aynı iddiası),
[[08-testing-patterns]] (spec yazımının tabanı), [[09-mocking-discipline]],
[[12-coverage-gates]]. İstemci karşılığı:
`umit-mobilya-client/.claude/rules/11-e2e-conventions.md`.
