#!/usr/bin/env bash
# Replaces the WHOLE module list. Sending [] empties it.
#   ./curls/products/update-modules.sh <productId> <moduleProductId> [quantity]
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:3000}"
PRODUCT_ID="${1:?ana ürün id gerekli}"
MODULE_ID="${2:?modül ürün id gerekli}"
QUANTITY="${3:-1}"
TOKEN="$("$(dirname "$0")/../_shared/token.sh")"

curl -s -X PUT "$API_BASE/api/products/update-modules/$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"modules\":[{\"productId\":\"$MODULE_ID\",\"quantity\":$QUANTITY}]}" \
  -w "\n[HTTP %{http_code}]\n"
