#!/usr/bin/env bash
# Filters products. A POST that performs a read, and public — both inherited,
# both relied on by the frontend product list.
#   ./curls/products/filter.sh [name] [categoryId]
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:3000}"
NAME="${1:-}"
CATEGORY="${2:-}"

body='{'
[[ -n "$NAME" ]] && body="$body\"name\":\"$NAME\""
[[ -n "$NAME" && -n "$CATEGORY" ]] && body="$body,"
[[ -n "$CATEGORY" ]] && body="$body\"category\":\"$CATEGORY\""
body="$body}"

curl -s -X POST "$API_BASE/api/products/filter" \
  -H 'Content-Type: application/json' \
  -d "$body" \
  -w "\n[HTTP %{http_code}]\n"
