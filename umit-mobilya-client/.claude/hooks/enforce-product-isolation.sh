#!/usr/bin/env bash
set -euo pipefail

# Rule 10 — urun modulleri birbirini import edemez.
#
# Bir urun klasoru altindaki dosya (products/<slug>/...) baska bir urunun
# klasorunden import ederse engellenir. Ortak kod yalnizca geometry/,
# price/shared.ts, dimensionOps.ts, catalog.ts ve types.ts uzerinden akar.
#
# Amac: "gardirobu degistirdim, mutfak etkilenir mi?" sorusunu derleme
# zamaninda cevaplamak. Import yoksa etkilenemez.

payload="$(cat)"

tool_name="$(printf '%s' "$payload" | jq -r '.tool_name // ""')"
file_path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // ""')"

[[ "$tool_name" != "Write" && "$tool_name" != "Edit" ]] && exit 0
[[ -z "$file_path" ]] && exit 0

# Yalnizca KONFIGURATOR urun modulleri. views/products/ katalog ozelligidir,
# burayla ilgisi yok — yolu daraltmadan o da yakalaniyordu.
case "$file_path" in
  */views/configurator/_etc/products/*) ;;
  */views/configurator/_components/products/*) ;;
  *) exit 0 ;;
esac

# Yolun icindeki 'products/<slug>' parcasindan kendi urununu cikar.
own="$(printf '%s' "$file_path" | sed -n 's|.*/products/\([^/]*\)/.*|\1|p')"
[[ -z "$own" ]] && exit 0

content="$(printf '%s' "$payload" | jq -r '.tool_input.content // .tool_input.new_string // ""')"
[[ -z "$content" ]] && exit 0

# Satirdan import YOLUNU cikarip onun uzerinde karar veriyoruz; satirin
# tamaminda desen aramak "../../geometry" icindeki "../geometry"yi kardes urun
# sanmak gibi yanlislara yol aciyordu.
#
# Iki bicim de yakalanmali:
#   1. derin yol      -> '../../../_etc/products/mutfak/build'
#   2. kardes klasor  -> '../mutfak/build'
violations="$(printf '%s\n' "$content" | awk -v own="$own" '
  {
    line = $0
    if (!match(line, /["\x27][^"\x27]*["\x27]/)) next

    path = substr(line, RSTART + 1, RLENGTH - 2)
    hit = ""

    if (match(path, /products\/[A-Za-z0-9_-]+/)) {
      other = substr(path, RSTART + 9, RLENGTH - 9)
      if (other != own) hit = other
    }

    # Tam olarak bir seviye yukari cikip yan klasore giren yol: kardes urun.
    # Paylasilan kod her zaman en az iki seviye yukarida (../../geometry).
    else if (match(path, /^\.\.\/[A-Za-z0-9_-]+\//)) {
      other = substr(path, 4, RLENGTH - 4)
      if (other != own) hit = other
    }

    if (hit != "") printf "  %d: %s\n", NR, line
  }
')"

[[ -z "$violations" ]] && exit 0

cat >&2 <<EOF
BLOCKED: '$own' urunu baska bir urunun klasorunden import ediyor.

$violations
Urun modulleri birbirinden bagimsiz olmali; biri digerini import ederse
"birini degistirmek digerini bozamaz" garantisi kalmaz.

Ortak kod icin dogru yerler:
  _etc/geometry/      govde, kapak, kutu, bolum genisligi
  _etc/price/shared   govde/kapak/arkalik fiyat kalemleri
  _etc/dimensionOps   olcu islemleri
  _etc/catalog        malzeme ve kaplama katalogu
  _etc/types          ortak tipler ve IProductDefinition

Paylasmak istedigin sey bunlardan birine ait degilse, muhtemelen gercekten
paylasilmamali.

Kural: umit-mobilya-client/.claude/rules/10-product-modules.md
EOF
exit 2
