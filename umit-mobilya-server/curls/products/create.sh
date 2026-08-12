#!/usr/bin/env bash
# Creates a product. multipart/form-data — the image is required.
#
# Answers the STORED document, not the read shape: no totalPrice, no imageUrl,
# no flattened modules. Refetch through list.sh/get.sh to see those.
#
# The category is validated BEFORE the upload, so a bad category id leaves
# nothing behind in the bucket.
#   ./curls/products/create.sh <categoryId> [name] [price] [imagePath]
set -euo pipefail
API_BASE="${API_BASE:-http://localhost:3000}"
CATEGORY="${1:?kategori id gerekli}"
NAME="${2:-Üçlü Koltuk}"
PRICE="${3:-1000}"
IMAGE="${4:-}"
TOKEN="$("$(dirname "$0")/../_shared/token.sh")"

if [[ -z "$IMAGE" ]]; then
  IMAGE="$(mktemp)".jpg
  # A real 8x8 jpeg, so the script runs with no arguments and no fixture on
  # disk. It has to decode cleanly: sharp resizes every upload and rejects
  # anything that is not an image.
  printf '/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAIAAgDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ALoAP//Z' | base64 --decode > "$IMAGE"
fi

curl -s -X POST "$API_BASE/api/products" \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=$NAME" \
  -F "price=$PRICE" \
  -F "category=$CATEGORY" \
  -F "image=@$IMAGE" \
  -w "\n[HTTP %{http_code}]\n"
