#!/usr/bin/env bash
set -euo pipefail

# Rule 09 — form kontrolleri.
# .vue sablonlarinda ham <input>/<select>/<textarea> kullanilamaz.
# Once F* sarmalayicilari (components/ui/global/), sonra PrimeVue.
#
# Kacinilmaz oldugunda hemen ustune su satir yazilir:
#   <!-- raw-control: neden gerekli -->
# Bu, 'any' icin kullanilan '// reason:' kaliginin sablon karsiligi.

payload="$(cat)"

tool_name="$(printf '%s' "$payload" | jq -r '.tool_name // ""')"
file_path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // ""')"

[[ "$tool_name" != "Write" && "$tool_name" != "Edit" ]] && exit 0
[[ -z "$file_path" ]] && exit 0

case "$file_path" in
  */umit-mobilya-client/src/client/*) exit 0 ;;
  # F* sarmalayicilarinin kendisi ham kontrolu sarmak zorunda.
  */umit-mobilya-client/src/components/ui/global/*.vue) exit 0 ;;
  */umit-mobilya-client/src/*.vue) ;;
  *) exit 0 ;;
esac

content="$(printf '%s' "$payload" | jq -r '.tool_input.content // .tool_input.new_string // ""')"
[[ -z "$content" ]] && exit 0

violations="$(printf '%s\n' "$content" | awk '
  {
    line = $0
    is_raw = (line ~ /<input([[:space:]]|>|$)/) ||
             (line ~ /<select([[:space:]]|>|$)/) ||
             (line ~ /<textarea([[:space:]]|>|$)/)
    allowed = (prev ~ /raw-control:/)
    if (is_raw && !allowed) printf "  %d: %s\n", NR, line
    prev = line
  }
')"

[[ -z "$violations" ]] && exit 0

cat >&2 <<EOF
BLOCKED: $file_path icinde ham form kontrolu var.

$violations
Once su sirayi dene:
  1. F* sarmalayicilari — <FInput>, <FSelect>, <FPassword>
     (src/components/ui/global/, global kayitli, import edilmez)
  2. PrimeVue bileseni — Slider, InputNumber, SelectButton, ToggleSwitch...
     (unplugin-vue-components ile otomatik import, elle import edilmez;
      cozulmezse src/plugins/primeVue/primeVue.ts icine kaydet)

Gercekten karsiligi yoksa, kontrolun hemen ustune gerekcesini yaz:
  <!-- raw-control: PrimeVue Slider iki uclu araligi desteklemiyor -->

Kural: umit-mobilya-client/.claude/rules/09-ui-controls.md
EOF
exit 2
