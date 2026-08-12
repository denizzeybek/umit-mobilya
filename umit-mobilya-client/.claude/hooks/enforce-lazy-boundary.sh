#!/usr/bin/env bash
set -euo pipefail

# Rule 10 — tembel yuklenen konfiguratorun sinirini korur.
#
# Konfigurator tek tembel route: Three.js ve urun tanimlari yalnizca o sayfayi
# acanlara iniyor. Her zaman yuklenen bir dosya (layout, composable, router)
# registry'yi ya da bir urun modulunu import ederse o kazanc yok oluyor —
# olculdu: ana paket 1.741 kB'den 2.237 kB'ye cikti, hicbir test kirilmadi.
#
# Hafif olanlar serbest: types.ts ve productList.ts yalnizca kimlik ve ad
# tasiyor, agir hicbir sey import etmiyor.

payload="$(cat)"

tool_name="$(printf '%s' "$payload" | jq -r '.tool_name // ""')"
file_path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // ""')"

[[ "$tool_name" != "Write" && "$tool_name" != "Edit" ]] && exit 0
[[ -z "$file_path" ]] && exit 0

case "$file_path" in
  # Konfiguratorun kendisi zaten tembel parcanin icinde.
  */src/views/configurator/*) exit 0 ;;
  # 3D sahneler icin ayrilmis tembel klasor — her biri kendi parcasinda.
  */src/components/three/lazy/*) exit 0 ;;
  # Three.js sarmalayicilarinin KENDISI. Bunlar sahnenin ta kendisi ve
  # yalnizca tembel parcadan cagriliyorlar; kendilerini yasaklamak anlamsiz.
  # Kural, HER ZAMAN YUKLENEN bir dosyanin bunlari import etmesine karsi.
  */src/composables/useThreeScene.ts) exit 0 ;;
  */src/composables/useOrbitZoom.ts) exit 0 ;;
  */umit-mobilya-client/src/*.vue | */umit-mobilya-client/src/*.ts) ;;
  *) exit 0 ;;
esac

content="$(printf '%s' "$payload" | jq -r '.tool_input.content // .tool_input.new_string // ""')"
[[ -z "$content" ]] && exit 0

# Iki bicim kapsam disi:
#   `import type`  — derlemede siliniyor, pakete hic girmiyor
#   `import(...)`  — DINAMIK import; tembel parcayi olusturan sey zaten bu,
#                    routes.ts'teki route tanimi boyle yaziliyor
violations="$(printf '%s\n' "$content" | awk '
  /^[[:space:]]*import[[:space:]]+type[[:space:]]/ { next }
  /import[[:space:]]*\(/ { next }
  /configurator\/_etc\/registry|configurator\/_etc\/products|configurator\/_components|configurator\/_views/ {
    printf "  %d: %s\n", NR, $0
    next
  }
  # Three.js ve sahne kurulumu: 494 kB. Konfigurator disindaki her 3D de kendi
  # tembel parcasinda olmali, yoksa her sayfa o yuku indirir.
  /from[[:space:]]*['"'"'"]three['"'"'"]|from[[:space:]]*['"'"'"]three\/|useThreeScene|useOrbitZoom/ {
    printf "  %d: %s\n", NR, $0
  }
')"

[[ -z "$violations" ]] && exit 0

cat >&2 <<EOF
BLOCKED: her zaman yuklenen bir dosya konfiguratorun agir modullerini import ediyor.

$violations
Bu import Three.js'i ve urun tanimlarini ana pakete geri sokar; konfiguratorun
tembel yuklenmesi anlamsizlasir.

Menu, baslik gibi yerlerde ihtiyac duyulan kimlik ve ad icin:
  @/views/configurator/_etc/productList   PRODUCT_SUMMARIES, productLabel
  @/views/configurator/_etc/types         EProductType

Three.js icin de ayni kural: sahne kodu ya `src/components/three/lazy/`
altinda ya da tembel bir route'un icinde olmali, ve dinamik `import('three')`
ile yuklenmeli.

Urun tanimina gercekten ihtiyac varsa, o kodun kendisi tembel route'un
icinde olmali.

Kural: umit-mobilya-client/.claude/rules/10-product-modules.md
EOF
exit 2
