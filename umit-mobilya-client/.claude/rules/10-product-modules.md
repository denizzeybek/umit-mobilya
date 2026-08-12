# Rule 10 — Ürün modülleri

> Konfigüratör tek bir ürün için değil bir ürün ailesi için yazıldı. Gardırobu değiştirmek mutfağı bozamaz — çünkü aralarında import yok, ve bunu bir hook uyguluyor.

## Why this rule exists

İlk sürüm baştan sona gardıroba özeldi: kapak menteşesi, raf, askılık ve
çekmece tek bir `buildWardrobe` fonksiyonunda duruyordu. Vestiyeri veya mutfağı
oraya `if (productType === ...)` ile eklemek en kısa yoldu ve tam olarak
kaçınılmak istenen sonucu verirdi: birini denemek için diğerini de riske atmak.

Klasör ayrımı tek başına yetmez — biri diğerinden bir sabit import eder ve bağ
sessizce geri gelir. `.claude/hooks/enforce-product-isolation.sh` bunu yazma
anında engelliyor.

## Yapı

```
_etc/
  types.ts          IProductDefinition, IBaseConfig, IProductLimits
  registry.ts       EProductType -> tanım
  catalog.ts        malzeme, kaplama, arkalık, kapak — her üründe aynı
  dimensionOps.ts   ölçü işlemleri — her üründe aynı
  geometry/         gövde, kapak, kutu, bölüm genişliği matematiği
  price/shared.ts   gövde/kapak/arkalık fiyat kalemleri
  products/
    gardirop/       types, options, build, price, configOps, index
_components/
  panel/            ürün bilmeyen alanlar (malzeme, ölçü, gövde, fiyat)
  products/
    gardirop/       ürüne özel panel bölümleri
```

## Kural

**Bir ürün klasöründeki hiçbir dosya başka bir ürün klasöründen import
edemez.** Ortak kod yalnızca yukarıdaki paylaşılan yollardan akar.

Paylaşmak istediğin şey `geometry/`, `price/shared.ts`, `dimensionOps.ts`,
`catalog.ts` veya `types.ts`'ten birine ait değilse, muhtemelen gerçekten
paylaşılmamalı — iki ürünün tesadüfen benzeyen iki ayrı ihtiyacıdır.

## Yeni ürün eklemek

1. `_etc/products/<slug>/` — `types.ts`, `options.ts`, `build.ts`, `price.ts`,
   gerekiyorsa `configOps.ts`
2. `_components/products/<slug>/<Slug>Fields.vue` — panelin ürüne özel bölümleri
3. `index.ts` — `IProductDefinition` olarak dışa ver
4. `EProductType`'a bir üye, `registry.ts`'e bir satır

`Configurator.vue`, `ProductViewer.vue` ve `_components/panel/*` **değişmez**.
Değişmesi gerekiyorsa soyutlama yanlış yerden geçmiş demektir; ürünü eklemeden
önce onu düzelt.

## Tembel paket sınırı

Konfigüratör projedeki **tek tembel route**: Three.js ve ürün tanımları
yalnızca o sayfayı açanlara iniyor. Her zaman yüklenen bir dosya (layout,
composable, router) `registry.ts`'i ya da bir ürün modülünü import ederse bu
kazanç yok olur.

Ölçüldü: üst menüye ürün listesi eklerken `useSiteNav` registry'yi import etti
ve ana paket **1.741 kB → 2.237 kB** oldu. Hiçbir test kırılmadı, hiçbir uyarı
çıkmadı — bu yüzden `.claude/hooks/enforce-lazy-boundary.sh` var.

Menü, başlık gibi yerlerde ihtiyaç duyulan hafif veri için:

| Ne lazım | Nereden |
|---|---|
| Ürün kimliği ve adı | `_etc/productList.ts` |
| Ortak tipler, `EProductType` | `_etc/types.ts` |
| Tanımın kendisi (`build`, `price`, `fields`) | yalnızca tembel route'un içinden |

Dinamik `import()` ve `import type` kapsam dışı: ilki zaten tembel parçayı
oluşturan şey, ikincisi derlemede siliniyor.

## Sınırlar import edilmez, geçirilir

Ölçü aralıkları ürüne göre değişir — gardırop 160–280 cm yüksekliğinde, mutfak
alt dolabı 85 cm. Bu yüzden `geometry/sectionWidths.ts` ve `dimensionOps.ts`
sınırları **parametre olarak** alır, `LIMITS` import etmez.

Aynı sebeple `setSectionCount` yeni bölümü nasıl dolduracağını bilmez; ürünün
`createSection` fabrikasını parametre alır.

Paylaşılan bir dosyada bir ürünün adını görüyorsan, orada bir hata var.

## Do

- Ürünün saf fonksiyonlarına (`build`, `price`) test yaz. Soyutlamanın işe
  yaradığının kanıtı, bir ürünü değiştirince diğerinin testlerinin yeşil
  kalmasıdır.
- `IProductDefinition` alanlarını doldururken metinleri de oraya koy
  (`eyebrow`, `headline`, `lede`) — görünüm bunları ürüne sormalı.

## Don't

- ❌ Bir üründen diğerine import.
- ❌ Paylaşılan koda `if (productType === ...)` koymak. Ayrım noktası tanım
  nesnesidir; koşul eklemek soyutlamayı geri almaktır.
- ❌ Ürüne özel bir sabiti `catalog.ts`'e koymak çünkü "orası daha merkezi".

Related: [[07-naming-and-files]], [[08-file-size-and-splitting]].
