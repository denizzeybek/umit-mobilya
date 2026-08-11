#!/usr/bin/env bash
# Runs the spec that covers the file just written, and reports the bar.
# Reports rather than blocks: during Red -> Green the spec is SUPPOSED to fail.
# See .claude/rules/00-tdd-discipline.md
set -uo pipefail

payload="$(cat)"
file_path="$(printf '%s' "$payload" | jq -r '.tool_response.filePath // .tool_input.file_path // ""')"

[[ -z "$file_path" ]] && exit 0

case "$file_path" in
  */umit-mobilya-server/src/*.ts) ;;
  *) exit 0 ;;
esac

server_root="${file_path%%/umit-mobilya-server/*}/umit-mobilya-server"
[[ -d "$server_root/node_modules" ]] || exit 0

case "$file_path" in
  *.spec.ts) spec="$file_path" ;;
  *)
    spec="${file_path%.ts}.spec.ts"
    [[ -f "$spec" ]] || spec="${file_path%.ts}.characterization.spec.ts"
    ;;
esac

[[ -f "$spec" ]] || exit 0

log="$(mktemp)"
if (cd "$server_root" && node_modules/.bin/jest --silent --runTestsByPath "$spec") >"$log" 2>&1; then
  rm -f "$log"
  exit 0
fi

tail="$(tail -25 "$log")"
rm -f "$log"

jq -n --arg s "$(basename "$spec")" --arg t "$tail" '{
  systemMessage: ("Test kirmizi: " + $s),
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: ("Related spec " + $s + " is failing:\n\n" + $t + "\n\nIf you are in the Red step this is expected — write the minimum code to go green. If you were porting, the behaviour drifted; see .claude/rules/00-tdd-discipline.md.")
  }
}'
exit 0
