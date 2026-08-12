#!/usr/bin/env bash
# Appends gallery images.
#
# Every file goes up under the SINGULAR field name `image`, however many there
# are. That is the server's contract and the most common thing to get wrong.
# Answers the product's FULL key list, not just the new keys.
#   ./curls/products/upload-images.sh <id> [imagePath...]
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:3000}"
ID="${1:?ürün id gerekli}"
shift || true
TOKEN="$("$(dirname "$0")/../_shared/token.sh")"

files=("$@")
if [[ ${#files[@]} -eq 0 ]]; then
  tmp="$(mktemp)".jpg
  printf '/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAIAAgDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ALoAP//Z' | base64 --decode > "$tmp"
  files=("$tmp")
fi

args=()
for file in "${files[@]}"; do
  args+=(-F "image=@$file")
done

curl -s -X PUT "$API_BASE/api/products/create-images/$ID" \
  -H "Authorization: Bearer $TOKEN" \
  "${args[@]}" \
  -w "\n[HTTP %{http_code}]\n"
