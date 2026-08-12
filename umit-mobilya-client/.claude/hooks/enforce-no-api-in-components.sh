#!/usr/bin/env bash
# Generated API services belong to stores, not to components.
# See .claude/rules/02-api-layer.md
set -euo pipefail

payload="$(cat)"
file_path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // ""')"

[[ -z "$file_path" ]] && exit 0

case "$file_path" in
  */umit-mobilya-client/src/components/*|*/umit-mobilya-client/src/views/*|*/umit-mobilya-client/src/layouts/*) ;;
  *) exit 0 ;;
esac

content="$(printf '%s' "$payload" | jq -r '
  [.tool_input.content // "", .tool_input.new_string // ""] | join("\n")
')"

# Importing a *type* from @/client is fine and expected — that is the whole
# point of codegen. Calling a service from a component is not.
offenders="$(printf '%s' "$content" \
  | grep -nE "(^|[^A-Za-z])[A-Z][A-Za-z]*Service\.[a-zA-Z]" \
  || true)"

[[ -z "$offenders" ]] && exit 0

cat >&2 <<EOF
BLOCKED: generated API service called from a component in $(basename "$file_path")

$offenders

Components render; stores talk to the backend. A call placed here has no
loading flag, no shared cache and no single place to change when the endpoint
does — and the next component that needs the same data will fetch it again.

Add an action to the relevant store and call that instead. Importing a *type*
from @/client here is fine; calling a service is not.

See umit-mobilya-client/.claude/rules/02-api-layer.md
EOF
exit 2
