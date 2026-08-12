#!/usr/bin/env bash
# Renames a category. Answers 200 with the document as it looks AFTER the change.
#
# This is the endpoint that used to answer 400 on every call while having
# already saved the rename — worth a glance whenever the category code moves.
#   ./curls/categories/update.sh <id> [newName]
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:3000}"
ID="${1:?kategori id gerekli: ./curls/categories/update.sh <id> [yeniAd]}"
NAME="${2:-Yeni Kategori Adı}"
TOKEN="$("$(dirname "$0")/../_shared/token.sh")"

curl -s -X PUT "$API_BASE/api/categories/$ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"$NAME\"}" \
  -w "\n[HTTP %{http_code}]\n"
