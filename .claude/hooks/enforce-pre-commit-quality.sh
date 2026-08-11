#!/usr/bin/env bash
set -euo pipefail

payload="$(cat)"

command="$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')"
[[ "$command" != *"git commit"* ]] && exit 0

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[[ -z "$repo_root" ]] && exit 0

client="$repo_root/umit-mobilya-client"
server="$repo_root/umit-mobilya-server"

staged="$(git -C "$repo_root" diff --cached --name-only 2>/dev/null || true)"
[[ -z "$staged" ]] && exit 0

failures=""
logs=""

run_gate() {
  local dir="$1" script="$2" log="$3"
  if ! (cd "$dir" && yarn --silent "$script" >"$log" 2>&1); then
    failures="${failures}  ($(basename "$dir")) yarn ${script}\n"
    logs="${logs} ${log}"
  fi
}

if printf '%s\n' "$staged" | grep -q '^umit-mobilya-client/src/' \
  && [[ -d "$client/node_modules" ]]; then
  run_gate "$client" lint /tmp/umb-client-lint.log
  run_gate "$client" type-check /tmp/umb-client-tsc.log
fi

if printf '%s\n' "$staged" | grep -qE '^umit-mobilya-server/(src|test)/' \
  && [[ -d "$server/node_modules" ]]; then
  run_gate "$server" type-check /tmp/umb-server-tsc.log
  run_gate "$server" test /tmp/umb-server-test.log
fi

if [[ -n "$failures" ]]; then
  {
    echo "BLOCKED: quality gates failed before commit"
    echo
    printf "%b" "$failures"
    echo
    echo "--- last 25 lines ---"
    # shellcheck disable=SC2086
    tail -25 $logs 2>/dev/null || true
    echo
    echo "Fix these, or say explicitly that you are committing a known-red state."
    echo "See .claude/rules/done-checklist.md"
  } >&2
  exit 2
fi

exit 0
