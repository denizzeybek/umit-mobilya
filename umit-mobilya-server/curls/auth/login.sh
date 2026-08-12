#!/usr/bin/env bash
# Raw login — prints the whole response. Does not touch the cached token.
# Use _shared/token.sh when you just want the token.
#   ./curls/auth/login.sh [email] [password]
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:3000}"
EMAIL="${1:-${EMAIL:-smoke@test.local}}"
PASSWORD="${2:-${PASSWORD:-secret123}}"

curl -s -X POST "$API_BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  -w "\n[HTTP %{http_code}]\n"
