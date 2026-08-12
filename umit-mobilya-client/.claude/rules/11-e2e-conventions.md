# Rule 11 — e2e: bütçe ve yazım kuralları

> Tarayıcı testi ekranın **kurulu** olduğunu kanıtlar, matematiği DEĞİL. İki şey birden bağlanıyor: suite'in ne kadar büyüyebileceği (bütçe) ve tek bir spec'in nasıl yazılacağı (yazım). İkisi de yazma anında bir hook'la uygulanıyor.

## Why this rule exists

"e2e yazalım" her seferinde aynı yere gidiyor: her düğme, her doğrulama hatası,
her boş durum denenir; suite yüzlerce teste ve on dakikalara çıkar. On dakikalık
suite koşulmaz, koşulmayan suite çürür, çürüyen suite silinir.

Ama bütçe tek başına yetmez. Bütçeye sığan otuz test de, CSS sınıfına tutunmuş,
sabit uyku bekleyen, `try/catch` içinde hatayı yutan testlerse aynı yere gider —
bu sefer "flake veriyor, kapattık" diye. Suite'i öldüren iki şeyden biri
büyüklük, diğeri **yazım biçimi**.

Bu yüzden ikisi de kodlandı: izin verilen yolculukların işlenmiş bir listesi,
sert bir `globalTimeout`, ve `.claude/hooks/e2e-budget.sh`.

Ağır güvenlik yükü `umit-mobilya-server`'da: `yarn test` (characterization +
fiyat ağı) hermetik, saniyeler sürüyor. Tarayıcının kanıtlaması gereken tek şey
**kablolamanın doğru olduğu**, o yüzden küçük kalabiliyor.

---

# BÖLÜM 1 — Katman kararı ve bütçe

## Katman kararı (pazarlıksız)

- **Bir sayı / tutar / hesap** (m² fiyatı, kenar bandı, KDV, toplam) →
  `umit-mobilya-server/test/price-net/` goldenlarında ya da
  `_etc/pricing/*.spec.ts` vitest testlerinde. **Tarayıcıda asla.**
- **Bir ekran açılıyor ve çiziliyor** → `e2e/smoke.spec.ts`. Route başına bir
  gezinme + bir çizim iddiası + konsol hatası yok. Tıklama yok.
- **API seviyesinde yaşanamayan, yalnızca tarayıcıda olan bir akış** (Three.js
  sahnesinin gerçekten çizilmesi, URL'e kodlanmış tasarımın geri yüklenmesi,
  paneldeki rakamın sunucunun hesabıyla aynı çıkması) → `e2e/journeys/` altında
  **manifest'e yazılmış** bir yolculuk.

Bir değer API'den doğrulanabiliyorsa arayüzde TEKRAR doğrulanmaz.

### Fiyatın tek istisnası — kimlik iddiası, literal değil

Bu projenin en pahalı sessiz hatası şu: paneldeki `priceOf()` ile sunucudaki
`priceOf()` ayrışır, ekran bir rakam gösterir, admin panelinde başka bir rakam
durur, hiçbir test kırılmaz. `test/pricing-sync.spec.ts` motorun iki kopyasının
bayt bayt aynı olduğunu kanıtlıyor; kablolamanın da doğru olduğunu yalnızca
tarayıcı kanıtlayabilir.

Bir yolculuk şunu iddia EDEBİLİR:

```ts
/* Ekrandaki tutar, sunucunun aynı tasarım için hesapladığının aynısı. */
expect(shownTotal).toBe(Math.round(quote.price.total / 10) * 10);
```

Şunu iddia EDEMEZ — ve hook engeller:

```ts
expect(shownTotal).toBe(48_320);
```

Fark şu: birincisi **kablolamayı** kanıtlıyor ve fiyat kitabı değiştiğinde
kırılmıyor. İkincisi aritmetiği tarayıcıya taşıyor ve her fiyat güncellemesinde
sahte kırmızı veriyor.

## Bütçe (uygulanıyor)

- İzin verilen TEK Playwright dosyaları:
  - `e2e/smoke.spec.ts` — bütün route'ların yükleme testi.
  - `e2e/journeys/<id>.spec.ts` — onaylı yolculuk başına bir dosya; `<id>`
    **`e2e/journeys.manifest.ts`** içindeki `APPROVED_JOURNEYS`'de geçmek
    zorunda.
- **Yeni yolculuk = önce manifest.** Kimliği ve yanına tek satırlık, kullanıcı
  diliyle gerekçesi yazılır. Manifest kaydı yoksa hook spec'i bloklar.
- **Duvar saati tavanı, `globalTimeout` ile:** smoke **120 sn**
  (`playwright.smoke.config.ts`), yolculuklar **300 sn**
  (`playwright.journeys.config.ts`) altında bitmek zorunda. Bir koşum tavana
  yaklaşıyorsa oradaki sayı iddiasını fiyat ağına indir — **tavanı kullanıcının
  onayı olmadan yükseltme.**
- Bu bütçe `src/**/*.spec.ts` vitest yüzeyini YÖNETMEZ; o ayrı bir konu.

## Ortam hermetiktir — kendi API'sini kendi kaldırır

`playwright.journeys.config.ts` iki `webServer` çalıştırıyor: sunucuyu
`yarn --cwd ../umit-mobilya-server e2e:api` ile (Nest + `mongodb-memory-server`)
ve vite'ı `VITE_API_URL` bu API'ye bakacak şekilde. Yerel Mongo, `.env` ya da
ayakta duran bir dev ortamı gerekmiyor.

Bu bilinçli: gerçek bir kümeye bağlı bir kapı, çalıştırılamadığı gün sessizce
atlanır — ve sessizce atlanan kapı, olmayan kapıdır. Tohum veri sabit
ObjectId'lerle yazılıyor, çünkü `/product-details/:id` gibi parametreli
route'lar smoke envanterine ancak öngörülebilir bir kimlikle girebilir.

---

# BÖLÜM 2 — Yazım kuralları

Bir spec'in nasıl yazıldığı, kaç tane olduğu kadar belirleyici. Aşağıdakilerin
büyük kısmı hook'la uygulanıyor; kalanı gözden geçirmede aranır.

## 2.1 Dosya iskeleti — `test` fixtures'tan gelir

Her spec **`./fixtures`**'tan (yolculuklarda `../fixtures`) import eder,
`@playwright/test`'ten değil:

```ts
import { expect, test } from '../fixtures';
```

Sebep mekanik: `fixtures.ts` her teste konsol hatası nöbetçisi ve API
istemcisi bağlıyor. Doğrudan `@playwright/test`'ten import eden bir spec o
nöbetçiyi kaybediyor ve sayfa konsola kırmızı basarken yeşil kalıyor — hook
bunu bloklar.

## 2.2 Seçiciler — `data-testid`, sonra rol; asla CSS

```ts
page.getByTestId('price-total')          /* ✅ sözleşme */
page.getByRole('button', { name: /.../ })/* ✅ erişilebilirlik ağacı */
page.locator('.mt-7.bg-f-bone')          /* ❌ Tailwind sınıfı — hook bloklar */
page.locator('div > section:nth-child(2)')/* ❌ yapıya tutunma */
```

Bu ekranlardaki metinlerin çoğu **sabit Türkçe** ve düzenli değişiyor
([[06-routing-and-config]] §9: i18n bağlı değil). Metne tutunan bir seçici, bir
kopya düzenlemesinde kırılır ve testi yazan kişi orada değildir.

`data-testid` değerleri `kebab-case` ve **kullanıcıya görünen şeyi** adlandırır
(`price-total`, `quote-code`, `viewer-canvas`), DOM'daki yerini değil
(`panel-div-2`). Bileşene testid eklemek bilinçli bir sözleşme adımıdır: eklerken
o adın kalıcı olduğunu kabul ediyorsun.

## 2.3 Bekleme — web-first iddia, asla sabit uyku

Playwright'ın `expect(locator)...` iddiaları **kendiliğinden yeniden deniyor**.
Sabit uyku, yavaş makinede flake veren, hızlı makinede boşa saniye yakan tek en
büyük kaynak.

| Ne bekliyorsun | Nasıl |
|---|---|
| Bir öğe belirsin / değişsin | `await expect(locator).toBeVisible()` / `toHaveText(...)` |
| Gezinme | `await page.waitForURL(/c=/)` |
| Ağ | `await page.waitForResponse((r) => r.url().includes('/api/quotes'))` |
| Bir şeyin OLMAMASI | Tarayıcı yanlış katman — vitest'e ya da sunucu spec'ine taşı |

**Her web-first iddia `await` edilir.** `expect(locator).toBeVisible()`
await'siz yazıldığında test yeşil biter ve iddia hiç çalışmamış olur — bu
suite'in en sinsi hatası, çünkü kırmızı vermez, sessizce hiçbir şey kanıtlamaz.
Hook await'siz locator iddiasını bloklar.

### Don't
- ❌ `await page.waitForTimeout(1500)` — hook bloklar.
- ❌ `page.waitForSelector(...)` — eski API; `expect(locator)` kullan.
- ❌ Flake'i susturmak için `globalTimeout` ya da iddia timeout'u büyütmek.

## 2.4 Bir yolculuk = bir kullanıcı sonucu

Başlık **kullanıcının gördüğü olguyu** söyler, mekanizmayı değil:

```ts
test('teklif verilince ekrandaki tutar sunucunun hesabıyla aynı', ...)  /* ✅ */
test('POST /api/quotes 201 döner', ...)                                 /* ❌ sunucunun işi */
```

Gövde **Hazırla / Yap / Doğrula** olarak boş satırla ayrılır. Bir yolculuk tek
bir sonucu kanıtlar; "hazır gelmişken şunu da bakalım" kuyruğu eklenmez — o
kuyruk ilk kırıldığında testin ne hakkında olduğu belirsizleşir ve test silinir.

## 2.5 Hazırlık UI'dan değil API'den yapılır

Bir yolculuk giriş yapmayı test etmiyorsa giriş formunu **doldurmaz**;
`fixtures.ts`'in API istemcisiyle oturumu kurar. Aynı şekilde bir teklifin
listede göründüğünü test eden yolculuk, teklifi konfigüratörü sürükleyerek değil
`POST /api/quotes` ile yaratır.

Kurulumu UI'dan yapmak, testin konusu olmayan bir akışı testin kırılma yüzeyine
sokar: giriş formu değiştiğinde ilgisiz altı yolculuk birden kırmızıya döner.

## 2.6 Spec'ler birbirinden bağımsız

Her spec dosyası kendi durumunu kurar ve başka bir spec'in bıraktığına
güvenmez. `test.describe.serial` yalnızca gerçekten sıralı bir akış varsa
kullanılır ve **neden** olduğu yazılır — çünkü sıralı blok paralelliği
öldürür ve tek bir kırılma kalanları atlar.

Hermetik API bütün koşum boyunca **tek** bir bellek-içi Mongo kullanıyor; bir
yolculuğun yarattığı teklif diğerinin listesinde görünebilir. O yüzden liste
iddiaları "tam olarak 1 kayıt var" değil, "yarattığım kod listede" biçiminde
yazılır.

## 2.7 Hata yutulmaz

Spec içinde `try/catch` yok. Yakalanan bir hata, testin var oluş sebebini
siliyor: kırmızı olması gereken koşum yeşil biter. Bir çağrının hata vermesini
bekliyorsan `await expect(promise).rejects...` ya da yanıt kodunu doğrula.

`test.skip` / `test.only` işlenmez. `only` ile bir dosya işlemek, kalan bütün
yolculukları sessizce kapatır — kapıdan geçer, hiçbir şey koşmaz.

## 2.8 Three.js / WebGL — neyi kanıtlayabilir, neyi kanıtlayamaz

3B görüntüleyici tarayıcıya özgü: `useThreeScene` WebGL bağlamı alamazsa
`supported` false'a düşüyor ve panel metin yedeğini gösteriyor. Bu iki dallı
davranış yalnızca gerçek tarayıcıda görülebilir, o yüzden yolculuk hakkı var.

Kanıtlanabilir olan: canvas'ın var olduğu, boyutlandığı, **boş olmadığı**
(okunan pikselde arka plan dışı renk var), ölçü değişince yeniden çizildiği,
WebGL kapalıyken yedek metnin belirdiği.

Kanıtlanamaz olan: sahnenin nasıl **göründüğü**. Ekran görüntüsü karşılaştırması
GPU'ya, sürücüye ve kenar yumuşatmaya bağlı — makineden makineye değişir. Bu
suite'te görsel regresyon YOK; geometri matematiği `_etc/geometry/*.spec.ts`'te
saf fonksiyon olarak test ediliyor, orada kalsın.

## 2.9 Config env'den gelir, sabit yazılmaz

- `playwright.*.config.ts`: `baseURL` → `process.env.E2E_BASE_URL ?? 'http://localhost:3001'`
- API portu → `process.env.E2E_API_PORT ?? '5055'`, aynı değer `e2e:api`'ye geçer
- Spec göreli yol kullanır: `await page.goto('/tasarla/gardirop')`

Üç dosyada tekrarlanan bir `localhost:3001` tam olarak sessizce ayrışan
değerdir — hook spec içindeki sabit URL'i bloklar.

---

## Do

- `smoke.spec.ts`'i route başına bir gezinme + bir çizim iddiası + konsol hatası
  yok seviyesinde tut.
- Yeni yolculuk gerektiğinde ÖNCE `e2e/journeys.manifest.ts`'e kimliğini ve
  gerekçesini yaz, sonra `e2e/journeys/<id>.spec.ts`'i aç.
- Öğeleri `data-testid` ile seç; testid'i bileşene bilinçli olarak ekle.
- Günlük hızlı kontrol `yarn e2e:smoke`; birleştirmeden önce `yarn e2e:journeys`.
- Bir yolculuk hesaplanmış bir sayı iddia etmek istiyorsa dur — o iddia
  `umit-mobilya-server/test/price-net/`'e ait.

## Don't

- ❌ `smoke.spec.ts` ya da manifest'li `journeys/<id>.spec.ts` dışında bir
  `e2e/**/*.spec.ts` eklemek.
- ❌ Playwright testinde aritmetik / toplam / sabit tutar iddia etmek.
- ❌ Smoke'u tıklama gezintisine çevirmek.
- ❌ CSS sınıfı / yapısal seçici / sabit Türkçe metin üzerinden öğe seçmek.
- ❌ Await'siz web-first iddia yazmak.
- ❌ Spec içinde `try/catch`, `test.only`, `test.skip`, `waitForTimeout`.
- ❌ 3B sahnenin görsel regresyonunu almak.
- ❌ Test edilen akış değilse hazırlığı UI'dan tıklayarak yapmak.

## Enforcement

`.claude/hooks/e2e-budget.sh` (client `.claude/settings.json`, `Write|Edit`)
şunları bloklar: manifest'te olmayan yolculuk spec'i, `e2e/` altında
`smoke.spec.ts` dışında düz spec, `@playwright/test`'ten doğrudan import,
CSS/yapısal seçici, await'siz locator iddiası, `waitForTimeout`,
`waitForSelector`, `try`/`catch`, `test.only`/`test.skip`, sabit URL, ve
`expect(...)` içinde dört haneli sabit sayı. Duvar saati tavanları koşum anında
Playwright config'lerinden geliyor.

Hook'un kendi testleri `.claude/hooks/hooks.test.sh` içinde — yeni bir davranış
eklerken önce oraya bir satır yaz.

Kardeş kural: `umit-mobilya-server/.claude/rules/13-price-net.md` (sayılar orada
donuyor). İlgili: [[06-routing-and-config]] (smoke'un saydığı route'lar),
[[10-product-modules]], [[08-file-size-and-splitting]] (spec dosyaları satır
tavanından muaf).
