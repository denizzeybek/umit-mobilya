#!/usr/bin/env bash
set -uo pipefail

# PreToolUse(Bash) kapisi — `git push`u, itilen HEAD icin taze bir AI inceleme
# onayi yoksa bloklar.
#
# Sozlesme:
#   - `ai-review` skill'i, o SHA icin SIFIR BLOKLAYICI bulgu dogruladiktan
#     SONRA incelenen commit'i su dosyaya yaziyor:
#       "$(git rev-parse --git-dir)/ai-review-pass"
#   - Her yeni commit HEAD'i degistirdigi icin marker bayatliyor ve kapi
#     yeniden kuruluyor.
#   - Cikis 2 = blokla (stderr Claude'a geri veriliyor). Cikis 0 = izin ver.
#
# Bu hook LLM CAGIRMIYOR ve cagiramaz: hook'lar deterministik kabuk komutlari.
# Dusunen taraf skill, bu taraf yalnizca "incelendi mi" sorusunu soruyor.
#
# Kural: .claude/skills/ai-review/SKILL.md

payload="$(cat)"
command="$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')"

printf '%s' "$command" \
  | grep -Eq '(^|[;&|(][[:space:]]*)git([[:space:]]+-[cC][[:space:]]*[^[:space:]]+)*[[:space:]]+push([[:space:]]|$)' \
  || exit 0

case "$command" in
  *--dry-run*|*--help*) exit 0 ;;
esac

if [[ "${SKIP_AI_REVIEW:-}" == "1" ]]; then
  printf 'AI inceleme kapisi atlandi (SKIP_AI_REVIEW=1).\n' >&2
  exit 0
fi

head_sha="$(git rev-parse HEAD 2>/dev/null)" || exit 0
marker="$(git rev-parse --git-dir 2>/dev/null)/ai-review-pass"

if [[ -f "$marker" && "$(cat "$marker" 2>/dev/null)" == "$head_sha" ]]; then
  exit 0
fi

short="${head_sha:0:12}"
recorded="yok"
[[ -f "$marker" ]] && recorded="$(cat "$marker" 2>/dev/null | cut -c1-12)"

cat >&2 <<EOF
BLOCKED: HEAD ${short} icin AI inceleme onayi yok — push yapilmadi.
  kayitli onay: ${recorded}

Push etmeden once \`ai-review\` skill'ini calistir. Skill:
  1. itilecek commit'leri BLOKLAYICI sorunlar icin inceler
     (dogruluk / guvenlik / kirik derleme ya da sozlesme),
  2. makineyle dogrulanabilen blokerleri spec-first duzeltip commit'ler,
  3. duzeltmenin arayuzde denenmesi gerekiyorsa somut bir test senaryosu
     verip push'u TUTAR,
  4. temiz cikinca son HEAD icin onay kaydeder ve push serbest kalir.

Bilerek atlamak gerekiyorsa: SKIP_AI_REVIEW=1
Kural: .claude/skills/ai-review/SKILL.md
EOF
exit 2
