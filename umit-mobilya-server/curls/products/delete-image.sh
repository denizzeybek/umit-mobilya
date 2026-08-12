#!/usr/bin/env bash
# Removes one gallery image, from the record and the bucket.
#
# Takes the object KEY (imageName), never a URL. Membership is checked before
# anything is deleted — passing another product's key answers 404 and touches
# nothing, which was not always true.
#   ./curls/products/delete-image.sh <productId> <imageName>
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:3000}"
ID="${1:?ürün id gerekli}"
IMAGE_NAME="${2:?imageName (key, URL değil) gerekli}"
TOKEN="$("$(dirname "$0")/../_shared/token.sh")"

curl -s -X POST "$API_BASE/api/products/delete-image/$ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"imageName\":\"$IMAGE_NAME\"}" \
  -w "\n[HTTP %{http_code}]\n"
