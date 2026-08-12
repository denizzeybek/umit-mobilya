#!/usr/bin/env bash
# Every category. Public.
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:3000}"
curl -s "$API_BASE/api/categories" -w "\n[HTTP %{http_code}]\n"
