---
name: urun-duzenle
description: Var olan bir konfigüratör ürününü (gardırop, vestiyer) değiştirir. İsteği önce KATMANA yerleştirir — görünüm mü, varsayılan mı, parça listesi mi, paylaşılan motor mu — çünkü dördünün riski aynı değil. Matematiğe dokunan her düzenlemede fiyat mutabakatını zorunlu kılar: değişiklikten sonra hangi golden'ın kaydığını ve kaymadıysa NEDEN kaymadığını kontrol eder. Var olan bir ürünü düzenlemek istendiğinde kullan.
---

# urun-duzenle

Var olan bir ürünü değiştirmenin yolu. Bu skill tek bir asimetri üstüne kurulu:

> **Görünüm bozulursa geri gelir. Matematik bozulursa sessizce bozulur.**

Bir düğme kaybolursa görülür ve bir sonraki istekte düzelir. Bir katsayı
kayarsa ekranda bir rakam durur, hiçbir şey patlamaz, ve müşteriye yanlış teklif
gider. O yüzden ilk iş kod yazmak değil, **isteği katmana yerleştirmek**.

## 1. Katmanı belirle

| Seviye | Dosya | Ne oynar | Golden |
|---|---|---|---|
| **0** görünüm | `_components/products/<slug>/*.vue`, `index.ts` metinleri | hiçbir tutar | kaymaz |
| **1** varsayılan | `_etc/products/<slug>/options.ts` | müşterinin gördüğü İLK tutar | `<slug>-varsayilan` kayar |
| **2** parça listesi | `_etc/products/<slug>/parts.ts` | o ürünün her tutarı + sahne | o ürünün golden'ları kayar |
| **3** paylaşılan motor | `_etc/pricing/*`, `_etc/geometry/*` | **BÜTÜN** ürünler | hepsi kayar |
| **4** fiyat kitabı | admin paneli — kod değil | canlı tutarlar | **kaymaz** (aşağıya bak) |

Seviyeyi yükseltmeden çözebiliyorsan yükseltme. "Vestiyerin oturağı biraz
yüksek olsun" seviye 1'dir; aynı isteği `parts.ts`'te çözmeye çalışmak seviye
2'ye çıkarır ve gereksiz risk alır.

### Seviye 4 ayrı bir şey — ve bunu söylemek önemli

Fiyat kitabındaki rakamlar (m² fiyatı, işçilik, menteşe, marj, KDV)
**admin panelinden** değişir: `/admin/fiyat-kitabi`. Kod işi değil, kimse kod
yazmaz.

Ve golden'lar bunu **görmez** — bilerek: fiyat ağı tohum kitabın üstünde koşuyor
(sürüm 0), yayınlanmış kitap onu oynatmıyor. Sebebi doğru: zam bir **karar**,
bir hata değil. Golden'ların koruduğu şey fiyat kitabı değil **motor** —
"aynı kitapla aynı tasarım hâlâ aynı tutarı veriyor mu" sorusu.

Biri "fiyatları güncelle" diyorsa cevap genellikle bu skill değil, admin paneli.

## 2. Değişiklik öncesi: yeşil olduğunu gör

```bash
cd umit-mobilya-server && yarn test
cd ../umit-mobilya-client && yarn test:unit:run
```

Bu adım atlanamaz. Düzenlemeden sonra kırmızı gördüğünde, kırmızının senin
yüzünden mi yoksa zaten öyle mi olduğunu bilmenin tek yolu bu.

## 3. Düzenle

Seviyeye göre:

- **Seviye 0** — `F*` ya da PrimeVue kontrolleri (Rule 09), 250 satır tavanı
  (Rule 08), SFC bölüm sırası (Rule 03).
- **Seviye 1** — `createDefaultConfig` / `createSection` / `PRESETS`. Varsayılan
  malzeme ve kapak tipi **fiyat kitabından okunur**, sabit yazılmaz.
- **Seviye 2** — `parts.ts` saf kalır: Vue yok, Three.js yok (sunucuya
  kopyalanıyor). Tek liste hem sahneyi hem fiyatı besliyor; birini düzeltip
  diğerini bozmak mümkün değil, çünkü ikisi aynı listeden çıkıyor.
- **Seviye 3** — başka bir ürünün de bundan etkileneceğini **önceden söyle**.
  Gardırop için yapılan bir düzeltme vestiyerin tutarını da oynatıyorsa bu
  kabul edilebilir olabilir ama bir karar, ve sahibinin bilmesi gerekir.

Seviye 2 ve 3'te sunucuya taşı:

```bash
cd umit-mobilya-server && yarn sync:pricing
```

## 4. Mutabakat — bu skill'in asıl işi

```bash
cd umit-mobilya-server && yarn test
cd ../umit-mobilya-client && yarn test:unit:run
```

Şimdi **beklentiyle sonucu karşılaştır**. Dört hâl var ve dördü ayrı şey söyler:

| Bekledin | Oldu | Anlamı |
|---|---|---|
| kaymayacak | kaymadı | ✅ seviye 0, temiz |
| kayacak | kaydı | ✅ `fiyat-degisikligi` skill'ine geç |
| **kayacak** | **kaymadı** | ⚠️ düzenleme fiyata HİÇ ULAŞMAMIŞ |
| **kaymayacak** | **kaydı** | 🛑 yan etki — dur, sebebi bul |

Üçüncü hâl en çok gözden kaçan: kullanılmayan bir `PRESETS` girdisini
değiştirmek, yanlış ürünün dosyasını düzenlemek, ya da `yarn sync:pricing`
koşmamak. "Test yeşil" burada iyi haber değil — **istediğin şeyin olmadığının**
haberi. İsteği tekrar oku ve düzenlemenin gerçekten o yola dokunduğunu doğrula.

Dördüncü hâl bir hata: sahibine onaylatma, sebebini bul.

Golden kırmızıysa:

```bash
cd umit-mobilya-server
yarn price-net:bless
```

sonra **`fiyat-degisikligi`** skill'i — tutarları Türkçe tabloya çevirip sahibine
soracak. Golden taşıyan commit onsuz geçmiyor.

## 5. Kanıtla ve bitir

- Seviye 1–3 ise dokunduğun saf fonksiyona **test yaz ya da var olanı güncelle**
  (`parts.spec.ts`, `_etc/pricing/*.spec.ts`).
- Sahne değiştiyse tarayıcıda gör: `yarn e2e:journeys` (`viewer-3d`,
  `quote-price-roundtrip` bu yolları geçiyor).
- Gerisi `done-checklist.md`; commit'te `e2e-decision` ve gerekirse
  `fiyat-degisikligi` kapıları soruyor.

## Korkuluklar

- **Kırmızı golden'ı bless'leyerek başlama.** İlk hamle diff'i okumak; bless bir
  onay adımı.
- **Bir vitest testini "artık geçerli değil" diye silme.** O test bir davranışı
  çiviliyordu; davranış gerçekten değiştiyse test GÜNCELLENİR ve neden
  değiştiği commit mesajına yazılır.
- Ürünler birbirini import etmez; bir üründeki düzeltmeyi diğerine de yapmak
  gerekiyorsa iki ayrı düzenleme olur (hook zaten bloklar).
- Seviye 3'e çıkmadan önce iki kez düşün: altı golden birden kırmızı olduğunda
  hepsinin **aynı** sebeple kaydığını doğrulamak zorundasın. Farklı sebeplerle
  kaydıysa içlerinden biri hata.
- `Configurator.vue` ve `_components/panel/*` ürün bilmez; oraya ürüne özel bir
  koşul eklemek soyutlamayı geri almaktır (Rule 10).
