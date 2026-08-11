#!/usr/bin/env bash
# Denies writing a NestJS source file before its spec exists.
# See .claude/rules/00-tdd-discipline.md
set -euo pipefail

payload="$(cat)"
file_path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // ""')"

[[ -z "$file_path" ]] && exit 0

# Only police the Nest source tree.
case "$file_path" in
  */umit-mobilya-server/src/*) ;;
  *) exit 0 ;;
esac

# A spec is its own justification; so are declarative files.
case "$file_path" in
  *.spec.ts) exit 0 ;;
  *.controller.ts|*.service.ts|*.guard.ts|*.strategy.ts|*.interceptor.ts|*.pipe.ts) ;;
  *) exit 0 ;;
esac

spec_path="${file_path%.ts}.spec.ts"
char_path="${file_path%.ts}.characterization.spec.ts"

if [[ -f "$spec_path" || -f "$char_path" ]]; then
  exit 0
fi

cat >&2 <<EOF
BLOCKED: spec first. Neither of these exists yet:
  $spec_path
  $char_path

Porting existing Express behaviour? Write the characterization spec, run it,
and watch it go green against the CURRENT code before touching this file.
New behaviour? Write the failing spec first.

See umit-mobilya-server/.claude/rules/00-tdd-discipline.md
EOF
exit 2
