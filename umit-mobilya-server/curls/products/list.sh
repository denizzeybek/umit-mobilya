#!/usr/bin/env bash
# Every product in the READ shape: modules flattened, image URLs composed,
# totalPrice computed.
#
# Answers 201, not 200. That is current behaviour and the characterization
# suite pins it — if you see 200 here, something changed that should not have.
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:3000}"
curl -s "$API_BASE/api/products" -w "\n[HTTP %{http_code}]\n"
