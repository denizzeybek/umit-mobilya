#!/usr/bin/env bash
set -euo pipefail

payload="$(cat)"

tool_name="$(printf '%s' "$payload" | jq -r '.tool_name // ""')"
file_path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // ""')"

[[ "$tool_name" != "Write" && "$tool_name" != "Edit" ]] && exit 0
[[ -z "$file_path" ]] && exit 0

case "$file_path" in
  */umit-mobilya-client/src/client/*) exit 0 ;;
  */umit-mobilya-client/components.d.ts) exit 0 ;;
  */umit-mobilya-client/*.ts | */umit-mobilya-client/*.vue) ;;
  *) exit 0 ;;
esac

content="$(printf '%s' "$payload" | jq -r '.tool_input.content // .tool_input.new_string // ""')"
[[ -z "$content" ]] && exit 0

violations="$(printf '%s\n' "$content" | awk '
  {
    line = $0
    is_any = (line ~ /:[[:space:]]*any([^A-Za-z0-9_]|$)/) || (line ~ /(^|[^A-Za-z0-9_])as[[:space:]]+any([^A-Za-z0-9_]|$)/)
    has_reason = (prev ~ /\/\/[[:space:]]*reason:/)
    if (is_any && !has_reason) printf "  %d: %s\n", NR, line
    prev = line
  }
')"

if [[ -n "$violations" ]]; then
  cat >&2 <<EOF
BLOCKED: 'any' without a '// reason:' line in $file_path

$violations
Every 'any' needs a '// reason:' comment on the line directly above it,
naming why the type cannot be expressed. See:
  umit-mobilya-client/.claude/rules/01-typescript-strict.md

noImplicitAny is still false in this project, so the compiler will not catch
this for you. Type the value properly, or document why you cannot.
EOF
  exit 2
fi

exit 0
