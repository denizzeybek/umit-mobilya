#!/usr/bin/env bash
# Creates a user. Answers 201 with { user: "<id>", token } and sets an httpOnly
# jwt cookie carrying the same token.
#   ./curls/auth/signup.sh [email] [password]
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:3000}"
EMAIL="${1:-${EMAIL:-smoke@test.local}}"
PASSWORD="${2:-${PASSWORD:-secret123}}"

curl -s -X POST "$API_BASE/api/auth/signup" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  -w "\n[HTTP %{http_code}]\n"
