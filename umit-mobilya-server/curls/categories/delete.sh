#!/usr/bin/env bash
# Deletes a category. Answers a message, not the deleted document.
#   ./curls/categories/delete.sh <id>
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:3000}"
ID="${1:?kategori id gerekli}"
TOKEN="$("$(dirname "$0")/../_shared/token.sh")"

curl -s -X DELETE "$API_BASE/api/categories/$ID" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n[HTTP %{http_code}]\n"
