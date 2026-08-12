#!/usr/bin/env bash
# Adds one product to another as a module.
#
# Stored as { productId, quantity }; the read path returns something quite
# different. Refuses a self-reference (400) and a duplicate (409).
#   ./curls/products/add-module.sh <productId> <moduleProductId> [quantity]
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:3000}"
PRODUCT_ID="${1:?ana ürün id gerekli}"
MODULE_ID="${2:?modül ürün id gerekli}"
QUANTITY="${3:-1}"
TOKEN="$("$(dirname "$0")/../_shared/token.sh")"

curl -s -X POST "$API_BASE/api/products/add-module" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"productId\":\"$PRODUCT_ID\",\"module\":{\"productId\":\"$MODULE_ID\",\"quantity\":$QUANTITY}}" \
  -w "\n[HTTP %{http_code}]\n"
