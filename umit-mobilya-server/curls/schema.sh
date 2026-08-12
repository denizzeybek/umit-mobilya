#!/usr/bin/env bash
# The OpenAPI document `yarn gcl` generates the frontend client from.
# Prints the path list rather than the whole schema; pass --full for everything.
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:3000}"

body="$(curl -s "$API_BASE/docs-json")"

if [[ "${1:-}" == "--full" ]]; then
  printf '%s\n' "$body"
  exit 0
fi

printf '%s' "$body" | python3 -c '
import sys, json
schema = json.load(sys.stdin)
for path, ops in sorted(schema["paths"].items()):
    for method in ops:
        print("%-7s %s" % (method.upper(), path))
count = len(schema.get("components", {}).get("schemas", {}))
print("")
print("%d model" % count)
'
