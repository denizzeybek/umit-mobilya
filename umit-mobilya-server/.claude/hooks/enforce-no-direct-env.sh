#!/usr/bin/env bash
# `process.env` belongs to the config slice. Everywhere else, inject ConfigService.
# See .claude/rules/07-config-and-secrets.md
set -euo pipefail

payload="$(cat)"
file_path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // ""')"

[[ -z "$file_path" ]] && exit 0

case "$file_path" in
  */umit-mobilya-server/src/*.ts) ;;
  *) exit 0 ;;
esac

# The bootstrap reads PORT before the container exists; the config slice is the
# whole point of the rule; tools and specs run outside the app.
case "$file_path" in
  */src/config/*|*/src/main.ts|*/src/setup-app.ts|*/src/tools/*|*.spec.ts) exit 0 ;;
esac

content="$(printf '%s' "$payload" | jq -r '
  [.tool_input.content // "", .tool_input.new_string // ""] | join("\n")
')"

# NODE_ENV is the one exception, and it is a real one: it decides how
# ConfigModule itself is loaded, so it has to be readable before the container
# exists. It is also not a secret. Every other variable goes through
# ConfigService.
offenders="$(printf '%s' "$content" \
  | grep -nE "process\.env" \
  | grep -vE "process\.env(\['NODE_ENV'\]|\[\"NODE_ENV\"\]|\.NODE_ENV)" \
  || true)"
[[ -z "$offenders" ]] && exit 0

cat >&2 <<EOF
BLOCKED: process.env in $(basename "$file_path")

$offenders

Reading the environment here puts a value on the module that no test can
substitute and no boot check can validate. Inject ConfigService and read it
through that, so a missing variable fails at startup with a name attached
instead of surfacing as undefined inside an R2 call.

If this genuinely belongs to bootstrap, it belongs in src/config/ or main.ts.

See umit-mobilya-server/.claude/rules/07-config-and-secrets.md
EOF
exit 2
