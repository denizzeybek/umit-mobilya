#!/usr/bin/env bash
set -euo pipefail

payload="$(cat)"

command="$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')"
[[ "$command" != *"git commit"* ]] && exit 0

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[[ -z "$repo_root" ]] && exit 0

client="$repo_root/umit-mobilya-client"

staged="$(git -C "$repo_root" diff --cached --name-only 2>/dev/null || true)"
[[ -z "$staged" ]] && exit 0

printf '%s\n' "$staged" | grep -q '^umit-mobilya-client/src/' || exit 0
[[ -d "$client/node_modules" ]] || exit 0

failures=""

if ! (cd "$client" && yarn --silent lint >/tmp/umb-lint.log 2>&1); then
  failures="${failures}  yarn lint\n"
fi

if ! (cd "$client" && yarn --silent type-check >/tmp/umb-tsc.log 2>&1); then
  failures="${failures}  yarn type-check\n"
fi

if [[ -n "$failures" ]]; then
  {
    echo "BLOCKED: quality gates failed before commit"
    echo
    printf "%b" "$failures"
    echo
    echo "--- last 20 lines ---"
    tail -20 /tmp/umb-lint.log /tmp/umb-tsc.log 2>/dev/null || true
    echo
    echo "Fix these, or say explicitly that you are committing a known-red state."
    echo "See .claude/rules/done-checklist.md"
  } >&2
  exit 2
fi

exit 0
