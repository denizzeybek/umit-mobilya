#!/usr/bin/env bash
# Filters categories by a case-insensitive substring.
#
# Note the shape: this is a GET that reads its criteria from the request BODY.
# Unusual, inherited from the Express version, and preserved because callers
# depend on it. Some HTTP clients silently drop a GET body — if this returns
# everything, that is why.
#   ./curls/categories/filter.sh [name]
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:3000}"
NAME="${1:-koltuk}"

curl -s -X GET "$API_BASE/api/categories/filter" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"$NAME\"}" \
  -w "\n[HTTP %{http_code}]\n"
