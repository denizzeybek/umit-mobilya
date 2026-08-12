#!/usr/bin/env bash
# A brand-new spec must fail on its first run. A test that is green before the
# code exists is testing nothing.
# See .claude/rules/00-tdd-discipline.md
set -uo pipefail

payload="$(cat)"
file_path="$(printf '%s' "$payload" | jq -r '.tool_response.filePath // .tool_input.file_path // ""')"

[[ -z "$file_path" ]] && exit 0

case "$file_path" in
  */umit-mobilya-server/*.spec.ts) ;;
  *) exit 0 ;;
esac

# Characterization specs describe code that already works. Green on the first
# run is the expected result there, not a failure.
case "$file_path" in
  *.characterization.spec.ts) exit 0 ;;
esac

# The price net pins prices that already compute — the same claim a
# characterization spec makes, so the same exemption applies. A golden that had
# to fail first would mean the golden was wrong, not the code.
# See .claude/rules/13-price-net.md
case "$file_path" in
  */umit-mobilya-server/test/price-net/*) exit 0 ;;
esac

server_root="${file_path%%/umit-mobilya-server/*}/umit-mobilya-server"
[[ -d "$server_root/node_modules" ]] || exit 0
[[ -f "$file_path" ]] || exit 0

# Only brand-new specs are policed. Once a spec is committed, adding a case to
# it is ordinary work and the suite is supposed to be green.
if git -C "$server_root" ls-files --error-unmatch "$file_path" >/dev/null 2>&1; then
  exit 0
fi

log="$(mktemp)"
if (cd "$server_root" && node_modules/.bin/jest --silent --runTestsByPath "$file_path") >"$log" 2>&1; then
  rm -f "$log"
  cat >&2 <<EOF
BLOCKED: the new spec $(basename "$file_path") passes on its first run.

Red comes first. A spec that is green before the implementation exists is
asserting something that was already true — usually a mock agreeing with
itself, or an assertion weak enough to pass on anything.

Make it fail for the right reason, then write the code that turns it green.
If you are pinning behaviour that already works, name the file
*.characterization.spec.ts — that cycle is exempt, and it is exempt because it
is a different claim.

See umit-mobilya-server/.claude/rules/00-tdd-discipline.md
EOF
  exit 2
fi

rm -f "$log"
exit 0
