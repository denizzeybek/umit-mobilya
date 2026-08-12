#!/usr/bin/env bash
set -euo pipefail

# Rule 11 — e2e butcesi ve yazim kurallari.
#
# YOL KAPISI (e2e/ altindaki her dosya):
#   1. manifest'te olmayan journeys/<id>.spec.ts
#   2. e2e/ altinda dogrudan duran, smoke.spec.ts olmayan spec
#
# YAZIM KAPISI (yalnizca e2e/**/*.spec.ts):
#   3. @playwright/test'ten dogrudan import (fixtures nobetcisini kaybettirir)
#   4. CSS / yapisal secici (Tailwind sinifi, nth-child, xpath)
#   5. await'siz web-first iddia (sessizce hicbir sey kanitlamaz)
#   6. sabit uyku: waitForTimeout / waitForSelector
#   7. try/catch, test.only, test.skip
#   8. sabit URL
#   9. expect(...) icinde dort haneli sabit sayi (hesaplanmis tutar iddiasi)
#
# Neden yazma aninda: bu suite'in cokme bicimi tek bir buyuk hata degil, her
# biri makul gorunen kucuk eklemeler. Gozden gecirmede hatirlanmaz.

payload="$(cat)"

tool_name="$(printf '%s' "$payload" | jq -r '.tool_name // ""')"
file_path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // ""')"

[[ "$tool_name" != "Write" && "$tool_name" != "Edit" ]] && exit 0
[[ -z "$file_path" ]] && exit 0

# Yalnizca istemcinin Playwright yuzeyi. src/** altindaki vitest spec'leri
# baska bir konu ve bu butce onlari yonetmiyor.
case "$file_path" in
  */umit-mobilya-client/e2e/*) ;;
  *) exit 0 ;;
esac

fe_root="${file_path%%/e2e/*}"
manifest="$fe_root/e2e/journeys.manifest.ts"
base="$(basename "$file_path")"
id="${base%.spec.ts}"

RULE="umit-mobilya-client/.claude/rules/11-e2e-conventions.md"

deny() {
  printf 'BLOCKED (Rule 11 — e2e): %s\n\n%s\n\nKural: %s\n' "$1" "$2" "$RULE" >&2
  exit 2
}

# --- yol kapisi -------------------------------------------------------------
case "$file_path" in
  */e2e/journeys/*.spec.ts)
    if [[ ! -f "$manifest" ]] || ! grep -Eq "['\"]${id}['\"]" "$manifest"; then
      deny "'${id}' yolculugu manifest'te yok." \
"  spec:     $file_path
  manifest: $manifest

Once manifest'e ekle: APPROVED_JOURNEYS'e '${id}' kimligini ve yanina tek
satirlik, kullanici diliyle gerekcesini yaz. Sonra spec'i ac.

Gerekce yazamiyorsan yolculuk muhtemelen yolculuk degil: 'ekran yukleniyor mu'
sorusuysa smoke.spec.ts'e, bir sayi iddiasiysa sunucudaki fiyat agina ait."
    fi
    ;;
  */e2e/*.spec.ts)
    if [[ "$id" != "smoke" ]]; then
      deny "'${base}' e2e/ altinda dogrudan duramaz." \
"  spec: $file_path

e2e/ altinda yalnizca iki sey olabilir:
  e2e/smoke.spec.ts          butun route'larin yukleme testi
  e2e/journeys/<id>.spec.ts  manifest'e yazilmis yolculuk

Bunu journeys/ altina tasi ve kimligini manifest'e ekle, ya da smoke'a katla."
    fi
    ;;
esac

# --- yazim kapisi: yalnizca spec dosyalari ----------------------------------
# fixtures.ts, journeys.manifest.ts gibi yardimcilar disarida: nobetciyi kuran
# ve env varsayilanini tutan yer orasi, kurallarin uygulandigi yer degil.
[[ "$file_path" != *.spec.ts ]] && exit 0

content="$(printf '%s' "$payload" | jq -r '.tool_input.content // .tool_input.new_string // ""')"
[[ -z "$content" ]] && exit 0

hit() { printf '%s\n' "$content" | grep -nE "$1" | head -3 || true; }

# 3: fixtures'i atlayan import
found="$(hit "from '@playwright/test'")"
if [[ -n "$found" ]]; then
  deny "@playwright/test'ten dogrudan import edilmis." \
"  dosya: $file_path
$found

fixtures.ts her teste konsol hatasi nobetcisini ve API istemcisini bagliyor.
Dogrudan import eden spec o nobetciyi kaybeder: sayfa konsola kirmizi basarken
test yesil kalir.

  yerine:  import { expect, test } from '../fixtures';"
fi

# 4: CSS / yapisal secici
found="$(hit "locator\('[.#]|nth-child|xpath=|locator\('[^']*>|page\.\\\$\\\$?\(")"
if [[ -n "$found" ]]; then
  deny "CSS ya da yapisal secici kullanilmis." \
"  dosya: $file_path
$found

Bu ekranlardaki Tailwind siniflari ve DOM yapisi tasarim degistikce degisiyor;
onlara tutunan secici ilgisiz bir duzenlemede kirilir.

  yerine:  page.getByTestId('price-total')
           page.getByRole('button', { name: /teklif/i })

Testid yoksa bilesene ekle — kebab-case, kullaniciya gorunen seyi adlandirir."
fi

# 5: await'siz web-first iddia
found="$(printf '%s\n' "$content" \
  | grep -nE 'expect\(' \
  | grep -E 'page\.|getBy|locator\(' \
  | grep -v 'await' || true)"
if [[ -n "$found" ]]; then
  deny "await'siz web-first iddia var." \
"  dosya: $file_path
$found

expect(locator).toBeVisible() await edilmezse iddia hic calismaz ve test yesil
biter — bu suite'in en sinsi hatasi, cunku kirmizi vermez, sessizce hicbir sey
kanitlamaz.

  yerine:  await expect(page.getByTestId('...')).toBeVisible();"
fi

# 6: sabit uyku / eski bekleme API'si
found="$(hit 'waitForTimeout\(|waitForSelector\(')"
if [[ -n "$found" ]]; then
  deny "sabit uyku ya da eski bekleme API'si kullanilmis." \
"  dosya: $file_path
$found

Playwright'in expect(locator)... iddialari kendiliginden yeniden deniyor.
Sabit uyku yavas makinede flake verir, hizli makinede saniye yakar.

  yerine:  await expect(page.getByTestId('...')).toBeVisible()
           await page.waitForURL(/c=/)
           await page.waitForResponse((r) => r.url().includes('/api/quotes'))"
fi

# 7: yutulan hata / islenmis only-skip
found="$(hit '^[[:space:]]*try[[:space:]]*\{|\}[[:space:]]*catch[[:space:]]*\(|catch[[:space:]]*\(')"
if [[ -n "$found" ]]; then
  deny "spec icinde try/catch var." \
"  dosya: $file_path
$found

Yakalanan hata testin var olus sebebini siliyor: kirmizi olmasi gereken kosum
yesil biter.

Hata bekliyorsan bunu iddia et:
  await expect(promise).rejects.toThrow()
  expect(response.status()).toBe(400)"
fi

found="$(hit 'test\.only\(|test\.skip\(|describe\.only\(|describe\.skip\(|\.only\(')"
if [[ -n "$found" ]]; then
  deny "test.only / test.skip islenmis." \
"  dosya: $file_path
$found

only ile bir dosya islemek kalan butun yolculuklari sessizce kapatir: kapi
gecer, hicbir sey kosmaz. skip edilen yolculuk manifest'ten cikarilir ya da
duzeltilir — kapali halde birakilmaz."
fi

# 8: sabit base URL — spec'te goreli yol kullanilir, base config'ten gelir
found="$(hit 'https?://(localhost|127\.0\.0\.1)')"
if [[ -n "$found" ]]; then
  deny "sabit URL yazilmis." \
"  dosya: $file_path
$found

Base URL playwright.*.config.ts icinde, env varsayilanindan geliyor:
  baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3001'

Spec goreli yol kullanir:  await page.goto('/tasarla/gardirop')
Uc dosyada tekrarlanan bir localhost, sessizce ayrisan degerdir."
fi

# 9: expect(...) icinde dort haneli sabit sayi — hesaplanmis tutar iddiasi.
# `timeout` gecen satirlar ve `reason:` gerekcesi tasiyan satirlar disarida.
found="$(printf '%s\n' "$content" \
  | grep -nE 'expect\(' \
  | grep -v 'timeout' \
  | grep -v 'reason:' \
  | grep -E '[^0-9A-Za-z_.]([0-9]{4,}|[0-9]{1,3}(_[0-9]{3})+)' \
  | head -3 || true)"
if [[ -n "$found" ]]; then
  deny "expect(...) icinde sabit dort haneli sayi var — hesaplanmis tutar iddiasi." \
"  dosya: $file_path
$found

Aritmetik tarayicida dogrulanmaz. Bir tutarin KAC LIRA oldugu:
  umit-mobilya-server/test/price-net/                (golden)
  src/views/configurator/_etc/pricing/*.spec.ts      (vitest)

Tarayicida yalnizca KIMLIK iddia edilir — ekrandaki rakam, sunucunun ayni
tasarim icin hesapladiginin aynisi mi:
  expect(shownTotal).toBe(Math.round(quote.price.total / 10) * 10)

Gercekten sabit bir sayi gerekiyorsa (tutar degil, or. bir viewport genisligi)
satirin sonuna gerekcesini yaz:  /* reason: ... */"
fi

exit 0
