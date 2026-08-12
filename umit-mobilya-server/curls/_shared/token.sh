#!/usr/bin/env bash
# Prints a Bearer token, logging in only when the cached one is missing or old.
# Sourced by every mutating script; safe to run on its own.
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:3000}"
EMAIL="${EMAIL:-smoke@test.local}"
PASSWORD="${PASSWORD:-secret123}"
CACHE="/tmp/umit-mobilya-jwt"

# An hour is well inside the token's three-day life; the point of the cache is
# to avoid a login per call, not to track expiry precisely.
if [[ -f "$CACHE" ]] && [[ -n "$(find "$CACHE" -mmin -60 2>/dev/null)" ]]; then
  cat "$CACHE"
  exit 0
fi

response="$(curl -s -X POST "$API_BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")"

token="$(printf '%s' "$response" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("token",""))' 2>/dev/null || true)"

if [[ -z "$token" ]]; then
  echo "Giriş başarısız. Yanıt: $response" >&2
  echo "Kullanıcı yoksa önce: ./curls/auth/signup.sh" >&2
  exit 1
fi

printf '%s' "$token" > "$CACHE"
printf '%s' "$token"
