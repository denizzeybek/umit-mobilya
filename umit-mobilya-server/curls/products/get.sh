#!/usr/bin/env bash
# One product in the read shape. Also answers 201.
#   ./curls/products/get.sh <id>
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:3000}"
ID="${1:?ürün id gerekli}"
curl -s "$API_BASE/api/products/$ID" -w "\n[HTTP %{http_code}]\n"
