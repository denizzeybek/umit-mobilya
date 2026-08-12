#!/usr/bin/env bash
# Deletes a product and every image key it owns.
#
# Refuses with 409 when another product uses this one as a module — the message
# names the product that is holding it.
#   ./curls/products/delete.sh <id>
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:3000}"
ID="${1:?ürün id gerekli}"
TOKEN="$("$(dirname "$0")/../_shared/token.sh")"

curl -s -X DELETE "$API_BASE/api/products/$ID" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n[HTTP %{http_code}]\n"
