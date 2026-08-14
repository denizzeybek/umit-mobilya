---
name: urun-ekle
description: Konfigüratöre yeni bir ürün tipi ekler (mutfak, kitaplık, TV ünitesi gibi). Gardırop ve vestiyeri şablon alır, sahibine ölçü ve içerik sorularını iş diliyle sorar, on sekiz adımın hiçbirini atlamaz ve her adımı doğrulayarak ilerler. Ürün eksiksizlik testi ile fiyat ağı golden'ı olmadan bitmez. Yeni ürün eklemek istendiğinde kullan.
---

# urun-ekle

Konfigüratöre yeni bir ürün tipi eklemenin tam yolu. Ölçüldü: on sekiz adım, ve
bunların yalnızca bir kısmı derleyici tarafından korunuyor. Bu skill'in işi
**hiçbirini atlamamak** ve sahibine yalnızca cevaplayabileceği soruları sormak.

Şablon uydurulmuyor: **gardırop ve vestiyer** zaten bu sözleşmeyi dolduruyor.
İkisini oku, hangisi yeni ürüne daha yakınsa onu taklit et.

| Şablon | Ne zaman yakın |
|---|---|
| `products/gardirop/` | kapaklı, bölümlü, raf/askı/çekmece taşıyan bir dolap |
| `products/vestiyer/` | açık, kapaksız, kendine özgü parçaları olan bir mobilya |

## Önce: bu gerçekten yeni bir ürün mü

Üç soru, sırayla:

1. **Var olan bir ürünün ayarı mı?** Mutfak üst dolabı ile alt dolabı farklı
   ölçü aralıkları olan aynı şey olabilir — o zaman bu `urun-duzenle` işi ya da
   fiyat kitabındaki bir sınır düzenlemesi.
2. **Yalnızca malzeme/kaplama/kapak tipi mi ekleniyor?** O admin panelinin işi
   (`/admin/fiyat-kitabi`), kod değil. Kimse kod yazmasın.
3. **Parça listesi gerçekten farklı mı?** Ürünü ayıran şey `parts.ts`:
   hangi paneller, hangi adette, nereye. Cevap "gardıropla aynı ama daha kısa"
   ise bu bir ürün değil, bir ölçü aralığı.

Üçüne de "hayır, gerçekten yeni bir mobilya" cevabı geliyorsa devam.

## Sahibine sorulacaklar

`AskUserQuestion` ile, atölye diliyle. Bunlar iş bilgisi — kod bilgisi değil:

- **Adı ne?** Menüde ve sayfa başlığında görünecek (örn. "Mutfak", "Kitaplık").
- **Ölçüler:** en dar / en geniş kaç cm? En alçak / en yüksek? En sığ / en derin?
  Panelde kaç cm'lik adımlarla değişsin (5 cm tipik, derinlikte 1 cm)?
- **Kaç bölüm olabilir?** En az, en fazla.
- **Bir bölümün içinde ne var?** Raf mı, askı çıtası mı, çekmece mi, oturak mı,
  tezgâh mı? Kaç tanesi olabilir? Bu, ürünün asıl tanımı.
- **Kapak var mı?** Varsa varsayılan tipi ne (fiyat kitabındaki kapak tiplerinden).
- **Hazır kurulumlar** ("Tam raflı", "Çift askılı" gibi) neler olsun?
- **Tanıtım yazısı:** sayfanın üst satırı, başlığı ve iki cümlelik açıklaması.

Cevap alınmadan kod yazma. Bir ölçü aralığını tahmin etmek, sonradan fiyat
kitabından düzeltilecek ama golden'ı da oynatacak bir borç yaratır.

## Adımlar

Sırayla; her blok bitince o bloğun doğrulamasını koştur.

### İstemci — ürün modülü

1. `_etc/types.ts` → `EProductType`'a bir üye: `Mutfak = 'mutfak'`. Slug adres
   çubuğuna giriyor (`/tasarla/mutfak`), o yüzden küçük harf ve Türkçe karaktersiz.
2. `_etc/productList.ts` → `PRODUCT_SUMMARIES`'e `{ id, label }`. **Ürün adının
   tek kaynağı burası**; tanım da adını buradan okuyor.
3. `_etc/pricing/defaults/index.ts` → `const MUTFAK: IProductSettings = {...}`
   ve `products` kaydına `mutfak: MUTFAK`. Ölçü sınırları, modül/kanat tavanı,
   varsayılan malzeme ve kapak tipi burada.
4. `_etc/products/<slug>/types.ts` → `I<Slug>Section extends IBaseSection`,
   `I<Slug>Config extends IBaseConfig`. Ortak olan yalnızca genişlik; gerisi
   ürünün kendi alanları.
5. `_etc/products/<slug>/options.ts` → `PRESETS`, `createSection`,
   `createDefaultConfig`. Varsayılan malzeme ve kapak tipi **fiyat kitabından
   okunur, sabit yazılmaz**; ve ayar yoksa erken düşen kontrol konur (gardırop
   ve vestiyerdeki gibi — sunucunun sıkı derleyicisi bunu zorunlu kılıyor).
6. `_etc/products/<slug>/parts.ts` → `partsOf(config, book): IPart[]`. **İşin
   asıl kısmı.** Tek liste hem sahneyi hem fiyatı besliyor; Vue ve Three.js
   bilmez, çünkü bu dosya sunucuya kopyalanıyor.
7. Gerekiyorsa `_etc/products/<slug>/configOps.ts` — ürüne özel config işlemleri.
8. `_etc/products/<slug>/index.ts` → `IProductDefinition` olarak dışa ver
   (`id`, `label`, `eyebrow`, `headline`, `lede`, `limits`, `createDefault`,
   `createSection`, `parts`, `fields`).
9. `_etc/registry.ts` → tek satır. Derleyici burayı koruyor: `Record<EProductType,
   IProductDefinition>` eksik üyeyi hata yapar.
10. `_components/products/<slug>/<Slug>Fields.vue` → panelin ürüne özel bölümü.
    Form kontrolleri `F*` ya da PrimeVue (Rule 09); ham `<input>` yok.
11. `_etc/products/<slug>/parts.spec.ts` → parça listesinin vitest testi.

**Değişmeyecekler:** `Configurator.vue`, `ProductViewer.vue`,
`_components/panel/*`. Bunlardan birini değiştirmek gerekiyorsa **dur** —
soyutlama yanlış yerden geçiyor ve ürünü eklemeden önce o düzeltilir (Rule 10).

Doğrulama:

```bash
cd umit-mobilya-client
yarn lint && yarn type-check && yarn test:unit:run
```

### Sunucu — fiyat motoru ve ağ

12. `umit-mobilya-server/scripts/sync-pricing.js` → `SOURCES`'a **üç** satır:
    `products/<slug>/types.ts`, `parts.ts`, `options.ts`.
13. `cd umit-mobilya-server && yarn sync:pricing`
14. `test/price-net/cases.ts` → `<slug>-varsayilan` case'i. Tasarım ürünün
    **kendi** `createDefaultConfig()`'inden gelir, elle kurulmaz (Rule 13 §7.7).
    `guards` alanına bu case'in hangi kırılmayı yakaladığını yaz.
15. `yarn price-net:bless` → yeni golden'ı **oku**, sonra `fiyat-degisikligi`
    skill'ini çalıştır. Golden taşıyan commit onsuz geçmiyor.

Doğrulama:

```bash
cd umit-mobilya-server
yarn type-check && yarn test
```

`test/product-completeness.characterization.spec.ts` dört şeyi birden soruyor:
senkron listesi, fiyat kitabı ayarı, fiyat ağı case'i, golden dosyası. Dördü
yeşilse ürün eksiksiz eklenmiş demektir.

### Tarayıcı

16. Smoke'un route envanteri `PRODUCT_SUMMARIES`'ten **kendiliğinden** türüyor —
    `e2e/routes.ts`'e elle satır eklemek gerekmez, ve eklenmemeli.
17. `cd umit-mobilya-client && yarn build && yarn size-check` — yeni ürün tembel
    parçaya girmeli, ana pakete değil. Tavanı aştıysa her zaman yüklenen bir
    dosya ürünü ya da `registry`'yi import ediyor (Rule 10, tembel sınır).
18. `yarn e2e:smoke` — yeni `/tasarla/<slug>` route'u açılıyor mu.

## Ne zaman durup geliştirici çağırmalı

Dürüst olmak gerekirse `parts.ts` gerçek bir geometri işi ve her mobilya kendi
imalat mantığını taşıyor. Şu üç durumda daha fazla zorlamak yerine dur ve söyle:

- Parça listesi bir türlü sahnede doğru görünmüyor (paneller havada duruyor,
  iç içe geçiyor, ölçüye oturmuyor).
- `Configurator.vue` ya da `_components/panel/*` değişmeden ürün panele
  sığmıyor — soyutlama yanlış yerden geçiyor.
- Fiyat kalemleri atölyenin verdiği rakamla tutmuyor ve fark hangi kalemden
  geldiği anlaşılmıyor.

Yarım bir ürünü commit etmek yerine dalı olduğu gibi bırak: eksiksizlik testi
neyin eksik olduğunu tek tek söylüyor, ve dal silinirse hiçbir şey olmamış olur.

## Korkuluklar

- Ürünler birbirini **import etmez** (Rule 10, hook uyguluyor). Paylaşmak
  istediğin şey `geometry/`, `pricing/`, `dimensionOps.ts` ya da `types.ts`'e ait
  değilse muhtemelen paylaşılmamalı.
- Paylaşılan koda `if (productType === ...)` **yazma**. Ayrım noktası tanım
  nesnesi; koşul eklemek soyutlamayı geri almaktır.
- Ölçü sınırları **parametre olarak geçer, import edilmez**.
- Fiyat kitabından okunabilecek hiçbir sayıyı koda gömme — atölyeden gelen bir
  rakam admin panelinden girilir.
- Bütün iş bir dalda: `main` üstünde yazma denemesi zaten bloklanıyor.
