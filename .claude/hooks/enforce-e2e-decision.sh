#!/usr/bin/env bash
set -uo pipefail

# PreToolUse(Bash) kapisi — davranisa dokunan bir `git commit`i, sahnelenmis
# icerik icin kayitli bir e2e karari yoksa bloklar.
#
# Sozlesme:
#   - `e2e-decision` skill'i sahnelenmis diff'in ozetini ve tek satirlik kararini
#     su dosyaya yaziyor:
#       "$(git rev-parse --git-dir)/e2e-decision-pass"
#   - Sahnelenen icerik degisince ozet degisiyor ve kapi yeniden kuruluyor.
#   - Cikis 2 = blokla. Cikis 0 = izin ver.
#
# Kapinin KAPSAMI bilerek dar: yalnizca calisan kodun davranisi. Dokuman, kural,
# hook, test ve uretilmis dosya kapiyi tetiklemiyor — her commit'te bir karar
# istemek, karari bir formaliteye cevirirdi.
#
# Bu hook LLM CAGIRMIYOR: hook'lar deterministik kabuk komutlari. Dusunen taraf
# skill, bu taraf yalnizca "karar verildi mi" sorusunu soruyor.
#
# Kural: .claude/skills/e2e-decision/SKILL.md

payload="$(cat)"
command="$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')"

case "$command" in
  *"git commit"*) ;;
  *) exit 0 ;;
esac

if [[ "${SKIP_E2E_DECISION:-}" == "1" ]]; then
  printf 'e2e karar kapisi atlandi (SKIP_E2E_DECISION=1).\n' >&2
  exit 0
fi

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
staged="$(git -C "$repo_root" diff --cached --name-only 2>/dev/null)"
[[ -z "$staged" ]] && exit 0

# Davranisa dokunan yollar. Uretilmis kod ve testler disarida: ilki elle
# yazilmiyor, ikincisi zaten cevabin kendisi.
behavioural="$(printf '%s\n' "$staged" \
  | grep -E '^(umit-mobilya-client/src|umit-mobilya-server/src)/' \
  | grep -vE '^umit-mobilya-client/src/client/' \
  | grep -vE '/generated/' \
  | grep -vE '\.spec\.ts$' \
  || true)"

[[ -z "$behavioural" ]] && exit 0

marker="$(git -C "$repo_root" rev-parse --absolute-git-dir)/e2e-decision-pass"
current="$(git -C "$repo_root" diff --cached | shasum -a 256 | cut -d' ' -f1)"
recorded="$(head -1 "$marker" 2>/dev/null || true)"

if [[ "$recorded" == "$current" ]]; then
  exit 0
fi

cat >&2 <<EOF
BLOCKED: bu commit davranisa dokunuyor ama e2e karari kayitli degil.

Davranisa dokunan dosyalar:
$(printf '%s\n' "$behavioural" | sed 's/^/  /')

\`e2e-decision\` skill'ini calistir. Skill sahnelenmis kodu okuyup soruyu
cevaplayacak: bu degisiklik bozulursa hangi katman kirmizi olur?

  - Yalnizca tarayicida gorulebilen bir davranissa: manifest'e yolculugu
    ekleyip spec'i yazar ve SADECE o spec'i kosturur (butun suite push'ta
    kosuyor).
  - Baska bir katman kapsiyorsa: hangisi oldugunu gerekce olarak kaydeder.

Karar sahnelenmis ICERIGE bagli: bir dosya daha eklersen kapi yeniden kurulur.

Bilerek atlamak gerekiyorsa: SKIP_E2E_DECISION=1
Kural: .claude/skills/e2e-decision/SKILL.md
EOF
exit 2
