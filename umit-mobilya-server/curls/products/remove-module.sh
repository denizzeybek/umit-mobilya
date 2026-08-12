#!/usr/bin/env bash
# Removes a module from a product.
#   ./curls/products/remove-module.sh <productId> <moduleProductId>
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:3000}"
PRODUCT_ID="${1:?ana ürün id gerekli}"
MODULE_ID="${2:?modül ürün id gerekli}"
TOKEN="$("$(dirname "$0")/../_shared/token.sh")"

curl -s -X DELETE "$API_BASE/api/products/remove-module/$PRODUCT_ID/$MODULE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n[HTTP %{http_code}]\n"
