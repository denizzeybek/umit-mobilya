#!/usr/bin/env bash
set -euo pipefail

# Rule 08 — dosya boyutu tavani.
# .vue ve .ts dosyalari 250 satiri gecemez.
#
# Zaten tavanin ustunde olan dosyalarda KUCULTEN duzenlemelere izin verilir:
# aksi halde ihlal eden bir dosyayi refactor etmek imkansiz olurdu.

LINE_CAP=250

payload="$(cat)"

tool_name="$(printf '%s' "$payload" | jq -r '.tool_name // ""')"
file_path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // ""')"

[[ "$tool_name" != "Write" && "$tool_name" != "Edit" ]] && exit 0
[[ -z "$file_path" ]] && exit 0

case "$file_path" in
  */umit-mobilya-client/src/client/*) exit 0 ;;
  */umit-mobilya-client/components.d.ts) exit 0 ;;
  *.spec.ts | *.test.ts | *.spec.vue) exit 0 ;;
  # Duz veri tablolari: satir sayisi mantikla degil katalogla buyuyor.
  */umit-mobilya-client/src/plugins/primeVue/flexytheme.ts) exit 0 ;;
  */umit-mobilya-client/src/*.vue | */umit-mobilya-client/src/*.ts) ;;
  *) exit 0 ;;
esac

content="$(printf '%s' "$payload" | jq -r '.tool_input.content // ""')"

if [[ -n "$content" ]]; then
  line_count="$(printf '%s\n' "$content" | wc -l | tr -d ' ')"
  on_disk=0
  [[ -f "$file_path" ]] && on_disk="$(wc -l < "$file_path" | tr -d ' ')"
else
  [[ -f "$file_path" ]] || exit 0
  old_str="$(printf '%s' "$payload" | jq -r '.tool_input.old_string // ""')"
  new_str="$(printf '%s' "$payload" | jq -r '.tool_input.new_string // ""')"
  on_disk="$(wc -l < "$file_path" | tr -d ' ')"
  old_lines=0
  new_lines=0
  [[ -n "$old_str" ]] && old_lines="$(printf '%s' "$old_str" | grep -c $'\n' || true)"
  [[ -n "$new_str" ]] && new_lines="$(printf '%s' "$new_str" | grep -c $'\n' || true)"
  line_count=$(( on_disk + new_lines - old_lines ))
fi

(( line_count <= LINE_CAP )) && exit 0

# Tavanin ustundeki bir dosyayi kucultuyorsan gecersin.
if (( on_disk > LINE_CAP )) && (( line_count < on_disk )); then
  exit 0
fi

cat >&2 <<EOF
BLOCKED: '$file_path' bu duzenlemeden sonra $line_count satir olacak (tavan: $LINE_CAP).

Nasil duzeltilir:
  - Sablonun kendi basina duran bir parcasini alt bilesene tasi (_components/).
  - Reaktif bir dilimi composable'a cikar (src/composables/use<Sey>.ts).
  - Reaktif olmayan saf yardimcilari ayri bir .ts dosyasina tasi (_etc/).

Kural: umit-mobilya-client/.claude/rules/08-file-size-and-splitting.md

Not: zaten tavan ustunde olan bir dosyayi KUCULTEN duzenlemeler serbesttir,
yani ihlal eden dosyayi adim adim bolebilirsin.
EOF
exit 2
