#!/usr/bin/env bash
# The user behind the token. Answers { message: "Token is valid", user }.
# The password hash is never included — that is worth re-checking here.
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:3000}"
TOKEN="$("$(dirname "$0")/../_shared/token.sh")"

curl -s "$API_BASE/api/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n[HTTP %{http_code}]\n"
