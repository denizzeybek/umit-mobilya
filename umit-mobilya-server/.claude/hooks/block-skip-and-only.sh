#!/usr/bin/env bash
# Denies landing a focused or skipped test.
# See .claude/rules/00-tdd-discipline.md
set -euo pipefail

payload="$(cat)"
file_path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // ""')"

[[ -z "$file_path" ]] && exit 0

case "$file_path" in
  */umit-mobilya-server/*.spec.ts) ;;
  *) exit 0 ;;
esac

content="$(printf '%s' "$payload" | jq -r '
  [.tool_input.content // "", .tool_input.new_string // ""] | join("\n")
')"

[[ -z "$content" ]] && exit 0

offenders="$(printf '%s' "$content" \
  | grep -nE '(^|[^.[:alnum:]_])(it|test|describe)\.(only|skip|todo)\(|(^|[^.[:alnum:]_])(xit|xdescribe|fit|fdescribe)\(' \
  || true)"

[[ -z "$offenders" ]] && exit 0

cat >&2 <<EOF
BLOCKED: focused or skipped test in $(basename "$file_path")

$offenders

.only silently stops every other test in the file from running, and a green
bar then means nothing. .skip / .todo leave an untested behaviour behind a
line that looks deliberate. Delete the test or make it pass.

See umit-mobilya-server/.claude/rules/00-tdd-discipline.md
EOF
exit 2
