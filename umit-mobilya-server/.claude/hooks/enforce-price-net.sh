#!/usr/bin/env bash
set -euo pipefail

# Rule 13 — fiyat agi.
#
#   1. __goldens__/** elle duzenlenemez — `yarn price-net:bless` uretir
#   2. test/price-net/** icinde sabit uyku yok
#   3. test/price-net/** icinde Math.random / Date.now / ciplak new Date yok
#   4. olculen mutasyon HTTP'den gecer: gerekcesiz dogrudan koleksiyon yazimi yok
#
# Hepsi ayni seyi koruyor: golden ancak kod degistigi icin degisebilir.
# Baska bir sebeple oynayan golden, ertesi gun kimsenin bakmadigi bir dosyadir.

payload="$(cat)"

tool_name="$(printf '%s' "$payload" | jq -r '.tool_name // ""')"
file_path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // ""')"

[[ "$tool_name" != "Write" && "$tool_name" != "Edit" ]] && exit 0
[[ -z "$file_path" ]] && exit 0

RULE="umit-mobilya-server/.claude/rules/13-price-net.md"

deny() {
  printf 'BLOCKED (Rule 13 — fiyat agi): %s\n\n%s\n\nKural: %s\n' "$1" "$2" "$RULE" >&2
  exit 2
}

# --- 1: golden'lar uretilmis dosyalardir -----------------------------------
case "$file_path" in
  */umit-mobilya-server/test/price-net/__goldens__/*)
    deny "golden dosyasi elle duzenlenemez." \
"  dosya: $file_path

Golden'lar uretilmis. Elle duzenlemek kirmizi bir testi susturmanin en kisa yolu
ve tam olarak agi ise yaramaz hale getiren hareket.

  cd umit-mobilya-server
  yarn price-net:bless
  git diff test/price-net/__goldens__     # DEGISEN SAYIYI OKU

Bir tutar oynadiysa bu bir karardir: commit mesajinda hangi katsayinin neden
degistigini yaz. bless bir onaydir, temizlik adimi degil."
    ;;
esac

case "$file_path" in
  */umit-mobilya-server/test/price-net/*) ;;
  *) exit 0 ;;
esac

content="$(printf '%s' "$payload" | jq -r '.tool_input.content // .tool_input.new_string // ""')"
[[ -z "$content" ]] && exit 0

# Uyku ve determinizm icin kacis yolu YOK: ikisi de golden'i kod disi bir
# sebeple oynatir, ve "gerekcesi var" demek onu deterministik yapmaz.
hit() { printf '%s\n' "$content" | grep -nE "$1" | head -3 || true; }

# Dogrudan yazim icin var: API'nin gercekten yapamadigi hazirliklar oluyor.
# Gerekce, repo geleneginde oldugu gibi ayni satirda ya da HEMEN USTUNDEKI
# satirda aranir (bkz. comment-policy.md'deki `reason:` kacisi).
hit_unless_reasoned() {
  local matches out="" line number previous
  matches="$(printf '%s\n' "$content" | grep -nE "$1" | grep -v 'reason:' || true)"
  [[ -z "$matches" ]] && return 0

  while IFS= read -r line; do
    number="${line%%:*}"
    previous=""
    (( number > 1 )) && previous="$(printf '%s\n' "$content" | tail -n "+$((number - 1))" | head -1)"
    [[ "$previous" == *reason:* ]] && continue
    out+="$line"$'\n'
  done <<< "$matches"

  printf '%s' "$out" | head -3
}

# --- 2: sabit uyku ----------------------------------------------------------
found="$(hit 'setTimeout\(|setInterval\(|\bdelay\(|\bsleep\(')"
if [[ -n "$found" ]]; then
  deny "sabit uyku var." \
"  dosya: $file_path
$found

Bu sunucuda asenkron bir kuyruk yok: await ettigin cagrinin kendisi zaten o
bekleme. Sabit uyku bir tahmindir — yavas makinede flake verir, hizli makinede
saniye yakar, ve bir hatayi maskeler."
fi

# --- 3: determinizm ---------------------------------------------------------
found="$(hit 'Math\.random\(|Date\.now\(|new Date\(\)')"
if [[ -n "$found" ]]; then
  deny "deterministik olmayan deger uretilmis." \
"  dosya: $file_path
$found

Golden yalnizca KOD degistigi icin degismeli. Rastgele bir sayi ya da duvar
saati, goldeni her kosumda oynatir ve dosya bir gun sonra kimsenin bakmadigi
bir gurultuye doner.

Volatil alanlar yanittan normalize.ts icinde cikarilir; case'ler cases.ts
icinde SABIT degerlerle kurulur. Gercekten bir tarih gerekiyorsa sabit bir
capa yaz:  new Date('2026-01-01T00:00:00.000Z')"
fi

# --- 4: olculen mutasyon HTTP'den gecer -------------------------------------
found="$(hit_unless_reasoned '\.collection\([^)]*\)\.(insert|update|replace|delete|findOneAnd)|\bmodel\.(create|insertMany|updateOne|updateMany|findOneAndUpdate)\(')"
if [[ -n "$found" ]]; then
  deny "dogrudan koleksiyon/model yazimi var." \
"  dosya: $file_path
$found

Golden'in kanitladigi sey uc + ValidationPipe + guard + motor zincirinin
tamami. Mutasyonu Mongo'ya yazarak simule etmek o zincirin yarisini atlar ve
'endpoint calisiyor' iddiasini bosa cikarir.

  yerine:  await request(app.getHttpServer()).post('/api/quotes').send(...)
           await request(app.getHttpServer()).put('/api/pricebook').send(...)

API'nin GERCEKTEN yapamadigi bir hazirlik ise satirin ustune gerekcesini yaz:
  /* reason: pricebook DTO'sunun create yolu yok, taban kitap dogrudan yaziliyor */"
fi

exit 0
