#!/usr/bin/env bash
# Creates a category. Answers 201 with the stored document.
#   ./curls/categories/create.sh [name]
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:3000}"
NAME="${1:-Koltuk Takımı}"
TOKEN="$("$(dirname "$0")/../_shared/token.sh")"

curl -s -X POST "$API_BASE/api/categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"$NAME\"}" \
  -w "\n[HTTP %{http_code}]\n"
