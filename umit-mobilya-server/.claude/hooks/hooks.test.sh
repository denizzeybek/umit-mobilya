#!/usr/bin/env bash
# Hook'larin kendi testleri. Jest bunlari kosamaz (bash + stdin sozlesmesi),
# ama elle jq cagirmak da tekrarlanabilir degil.
#
#   bash .claude/hooks/hooks.test.sh
#
# Yeni bir hook davranisi eklerken once buraya bir satir yaz.

set -uo pipefail
cd "$(dirname "$0")/../.." || exit 1

ROOT="$(pwd)"
HOOKS="$ROOT/.claude/hooks"
pass=0
fail=0

# expect <beklenen_exit> <hook> <dosya_yolu> <icerik> <aciklama>
expect() {
  local want="$1" hook="$2" path="$3" body="$4" name="$5"
  local got
  jq -n --arg p "$path" --arg c "$body" \
    '{tool_name:"Write",tool_input:{file_path:$p,content:$c}}' \
    | bash "$HOOKS/$hook.sh" >/dev/null 2>&1
  got=$?

  if [[ "$got" == "$want" ]]; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
    printf 'FAIL  %-22s %s (beklenen %s, gelen %s)\n' "$hook" "$name" "$want" "$got"
  fi
}

P="$ROOT/test/price-net"

printf '\n— enforce-price-net: golden dokunulmazligi —\n'
expect 2 enforce-price-net "$P/__goldens__/gardirop-standart.json" '{"total":1}' "golden elle duzenleme"
expect 0 enforce-price-net "$P/cases.ts" "export const CASES = [];" "case dosyasi"
expect 0 enforce-price-net "$ROOT/src/quote/quote.service.ts" "const now = new Date();" "muaf: uygulama kodu"
expect 0 enforce-price-net "$ROOT/test/characterization/quote.characterization.spec.ts" \
  "await collection.insertOne({ createdAt: new Date() });" "muaf: characterization suite"

printf '\n— enforce-price-net: determinizm —\n'
expect 2 enforce-price-net "$P/price-net.spec.ts" "const seed = Math.random();" "Math.random"
expect 2 enforce-price-net "$P/price-net.spec.ts" "const stamp = Date.now();" "Date.now"
expect 2 enforce-price-net "$P/price-net.spec.ts" "createdAt: new Date()," "ciplak new Date"
expect 0 enforce-price-net "$P/price-net.spec.ts" \
  "const ANCHOR = new Date('2026-01-01T00:00:00.000Z');" "sabit capa"
# Gerekce yazmak bir seyi deterministik yapmaz — kacis yolu yok.
expect 2 enforce-price-net "$P/price-net.spec.ts" \
  "const stamp = Date.now(); /* reason: gerekli */" "gerekceli Date.now yine bloklu"

printf '\n— enforce-price-net: sabit uyku —\n'
expect 2 enforce-price-net "$P/price-freeze.spec.ts" \
  "await new Promise((resolve) => setTimeout(resolve, 500));" "setTimeout uykusu"
expect 2 enforce-price-net "$P/price-freeze.spec.ts" "await delay(500);" "delay yardimcisi"
expect 0 enforce-price-net "$P/price-freeze.spec.ts" \
  "const response = await request(app.getHttpServer()).post('/api/quotes');" "await edilen cagri"

printf '\n— enforce-price-net: mutasyon HTTP dan gecer —\n'
expect 2 enforce-price-net "$P/price-freeze.spec.ts" \
  "await db.collection('quotes').insertOne(row);" "dogrudan koleksiyon yazimi"
expect 2 enforce-price-net "$P/price-freeze.spec.ts" \
  "await model.create({ code: 'X' });" "dogrudan model yazimi"
expect 0 enforce-price-net "$P/price-freeze.spec.ts" \
  "/* reason: pricebook DTO'sunun create yolu yok */
await db.collection('pricebooks').insertOne(book);" "gerekceli dogrudan yazim"
expect 0 enforce-price-net "$P/price-freeze.spec.ts" \
  "await request(app.getHttpServer()).put('/api/pricebook').send({ data: book });" "HTTP mutasyonu"

printf '\n— block-skip-and-only —\n'
expect 2 block-skip-and-only "$P/price-net.spec.ts" "it.only('x', () => {});" "it.only"
expect 0 block-skip-and-only "$P/price-net.spec.ts" "it('x', () => {});" "duz it"

printf '\n%d gecti, %d kaldi\n' "$pass" "$fail"
[[ "$fail" -eq 0 ]]
