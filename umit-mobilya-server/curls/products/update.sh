#!/usr/bin/env bash
# Patches a product. JSON, not multipart — there is no image field here.
# Fields you omit keep their stored value.
#   ./curls/products/update.sh <id> [name]
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:3000}"
ID="${1:?ürün id gerekli}"
NAME="${2:-Dörtlü Koltuk}"
TOKEN="$("$(dirname "$0")/../_shared/token.sh")"

curl -s -X PUT "$API_BASE/api/products/$ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"$NAME\"}" \
  -w "\n[HTTP %{http_code}]\n"
