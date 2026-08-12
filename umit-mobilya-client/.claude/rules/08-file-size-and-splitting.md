# Rule 08 — Dosya boyutu ve bölme

> Bir dosya 250 satırı geçtiğinde artık okunmuyor, gözden geçirilmiyor ve güvenle değiştirilemiyor. Tavan bir üslup tercihi değil; bir `PreToolUse` hook'u uyguluyor.

## Why this rule exists

Bu repoda tavan olmadan yazılan ilk büyük özellik konfigüratördü ve sonuç
ortada: `ConfiguratorPanel.vue` **539** satır, `WardrobeViewer.vue` **395**
satır. İkisi de tek bir dosyada üç iş birden yapıyor — panel hem form
durumunu, hem genişlik dağıtma mantığını, hem fiyat sunumunu taşıyor.

Böyle bir dosyada tek bir davranışı değiştirmek için tamamını okumak gerekiyor,
ve bir şeyi bozup bozmadığını anlamanın tek yolu elle denemek. Test yazmak da
mümkün değil: içeride ayrıştırılabilir bir birim yok.

`.claude/hooks/enforce-file-size.sh` yazma anında engelliyor, çünkü bu sınır
gözden geçirmede hatırlanacak bir şey değil.

## Tavan

**250 satır**, hem `.vue` hem `.ts` için, `src/` altındaki her şeye.

Muaf olanlar:

- `src/client/**` — üretilmiş ([[04-generated-code]])
- `components.d.ts` — üretilmiş
- `*.spec.ts`, `*.test.ts` — kurgu hazırlığı doğal olarak uzun
- `src/plugins/primeVue/flexytheme.ts` — düz renk tablosu; satır sayısı
  mantıkla değil paletle büyüyor

Yeni bir muafiyet, hook'taki `case` bloğuna eklenerek ve **sebebi yazılarak**
tanımlanır. "Şimdilik uzun" bir muafiyet gerekçesi değildir.

## Zaten ihlal eden dosyalar

Hook, tavanın üstündeki bir dosyayı **küçülten** düzenlemelere izin verir.
Yoksa ihlal eden dosyayı bölmek imkânsız olurdu: ilk düzenleme de engellenirdi.

Yani 539 satırlık bir dosyayı 400'e indirebilirsin, 400'den 300'e, 300'den
250'nin altına. Her adım geçer. Ama 539'dan 545'e çıkamazsın.

Bu, borcu ödemenin yolunu açık tutmak için; kalıcı bir muafiyet değil.

## Nasıl bölünür

Öncelik sırasıyla:

1. **Sunum alt bileşeni çıkar.** `<template>` içinde kendi başına duran bir
   parça varsa — bir kart, bir liste satırı, bir panel bölümü — onu
   `_components/` altına al. Veri prop ile iner, niyet emit ile çıkar.
2. **Composable çıkar.** `<script setup>` içinde tutarlı bir durum + yaşam
   döngüsü dilimi varsa `src/composables/use<Şey>.ts` altına al. Reaktifliği
   composable tutar, bileşen yalnızca render eder.
3. **Saf yardımcıları `.ts`'e taşı.** Reaktiflik yoksa — hesap, dönüşüm,
   biçimlendirme — `_etc/` altına ayrı dosya. Vue çalışma zamanı olmadan test
   edilebilir hale gelir; bölmenin asıl kazancı budur.
4. **Pinia store'a çıkar** yalnızca durum gerçekten birden fazla ekran
   arasında paylaşılıyorsa. Tek ekranda kalan bir şey store adayı değildir.

Şablonu 200 satır, script'i 30 satır olan bir `.vue` sağlıklıdır. Şablonu 30
satır, script'i 200 satır olan bir `.vue` bozuktur — ikincisinde çıkarılacak
bir composable var demektir.

## Do

- Bölmeyi dosya tavana dayandığında değil, ikinci sorumluluk belirdiğinde yap.
- Çıkardığın saf yardımcıya test yaz. Bölmenin gerekçesi zaten buydu.
- Bir dosyayı bölerken adını da gözden geçir: iki iş yapıyorsa adı da muhtemelen
  ikisini birden anlatmaya çalışıyordur ([[07-naming-and-files]]).

## Don't

- ❌ Tavanı geçmemek için satırları sıkıştırmak. 250 satır bir ölçü birimi,
  hedef değil; okunurluğu bozarak sayıyı düşürmek amacı ters çevirir.
- ❌ Hook'u atlamak için dosyayı ikiye bölüp ikisini de birbirine `import`
  ettirmek ama sorumlulukları ayırmamak. Bölme sınırı bir sorumluluk sınırı
  olmalı.
- ❌ Muafiyet listesine "geçici olarak" bir kaynak dosyası eklemek.

Related: [[03-vue-components]], [[07-naming-and-files]], [[09-ui-controls]].
