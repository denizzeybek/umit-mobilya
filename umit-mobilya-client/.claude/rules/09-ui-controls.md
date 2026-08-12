# Rule 09 — Form kontrolleri ve PrimeVue

> Bu projede bir metin kutusu yazmanın üç yolu var ve ikisi yanlış. Sıra: önce `F*` sarmalayıcısı, sonra PrimeVue, en son ham HTML — o da gerekçesiyle.

## Why this rule exists

Konfigüratör paneli baştan sona ham `<input>` ve `<select>` ile yazıldı. Sonuç:
aynı ekranda iki ayrı görsel dil. PrimeVue temasından gelen odak halkası,
devre dışı görünümü, hata durumu, klavye davranışı ve erişilebilirlik
öznitelikleri o kontrollerde **yok**. Hepsi elle, Tailwind sınıflarıyla,
eksik taklit edildi.

Daha kötüsü: `flexytheme.ts` içindeki preset bu kontrolleri hiç görmüyor.
Paleti değiştirdiğinde uygulamanın geri kalanı değişiyor, o panel değişmiyor —
tema tek kaynak olmaktan çıkıyor.

`.claude/hooks/enforce-ui-controls.sh` yazma anında engelliyor.

## Sıra

**1. `F*` sarmalayıcıları** — `src/components/ui/global/`

`<FInput>`, `<FSelect>`, `<FPassword>`. Global kayıtlılar, **import edilmezler**
([[03-vue-components]]). vee-validate + yup alan durumuna bağlıdırlar: `name`
prop'unu geçmek bağlamanın tamamıdır ([[05-forms-and-tables]]).

Form içindeki her alan bunlardan biri olmalı.

**2. PrimeVue bileşeni**

Form dışında kalan ya da `F*` karşılığı olmayan her kontrol:
`Slider`, `InputNumber`, `SelectButton`, `ToggleSwitch`, `RadioButton`,
`ColorPicker`, `Checkbox`...

`unplugin-vue-components` + `PrimeVueResolver` ile otomatik import edilirler —
**elle `import Slider from 'primevue/slider'` yazma.** Çalışma zamanında
çözülmezse `src/plugins/primeVue/primeVue.ts` içine kaydet, import ekleme.

**3. Ham HTML** — yalnızca gerekçeyle

Gerçekten karşılığı yoksa, kontrolün hemen üstüne:

```vue
<!-- raw-control: PrimeVue Slider iki uçlu aralık göstermiyor -->
<input type="range" ... />
```

Bu, `any` için kullanılan `// reason:` kalıbının şablon karşılığı: kaçış yolu
var ama iz bırakıyor.

## Bir form değil sadece bir kontrol lazımsa

`useForm` kurmak zorunda değilsin. Konfigüratör gibi doğrudan bir modele bağlı
ekranlarda PrimeVue bileşenini `v-model` ile kullan:

```vue
<Slider v-model="doorOpen" :min="0" :max="1" :step="0.01" />
<InputNumber v-model="width" :min="60" :max="400" suffix=" cm" showButtons />
<SelectButton v-model="sectionCount" :options="[1, 2, 3, 4]" />
```

Yapmaman gereken, vee-validate formu içindeki bir PrimeVue kontrolüne `v-model`
takmak — orada `name` prop'lu `F*` kullanılır ([[05-forms-and-tables]]).

## Do

- `InputNumber`'ın `suffix`, `min`, `max`, `showButtons` özelliklerini kullan;
  bunları elle `<span>cm</span>` ve `@change` ile kurmak, klavye ve
  erişilebilirlik davranışını kaybetmek demek.
- Renk için `constants/colors.ts` tokenlarını kullan; PrimeVue teması zaten
  aynı paletten besleniyor ([[03-vue-components]]).
- PrimeVue içine stil geçirmen gerekiyorsa Tailwind'in `!` önekini kullan.

## Don't

- ❌ `src/views/`, `src/components/`, `src/layouts/` altında gerekçesiz
  `<input>`, `<select>`, `<textarea>`.
- ❌ PrimeVue bileşenini elle import etmek.
- ❌ Bir PrimeVue kontrolünü ham HTML ile "yeniden derisini yüzerek" taklit
  etmek. Tema değiştiğinde taklit geride kalır.
- ❌ `F*` sarmalayıcısını `_components/` altına kopyalamak. Global olmayacaksa
  `components/ui/local/` altına gider ([[07-naming-and-files]]).

Related: [[03-vue-components]], [[05-forms-and-tables]], [[08-file-size-and-splitting]].
