#!/usr/bin/env bash
set -uo pipefail

# PreToolUse(Bash) kapisi — golden dosyasi tasiyan bir `git commit`i, o tam diff
# icin kayitli bir FIYAT KARARI yoksa bloklar.
#
# Neden bu kapi var:
#   `yarn price-net:bless` bir golden'i yesile boyamanin en kisa yolu ve hicbir
#   sey onu tutmuyordu. Kural "ONCE DIFF'I OKU" diyor — okunacak sey ham JSON,
#   ve bu repoyu isleten kisi JSON okumak zorunda kalmamali. Daha kotusu: bless
#   `ai-review` devreye girmeden ONCE kaniti yok ediyor; inceleyen taraf
#   kirmizinin hic olmadigi bir dunyaya bakiyor.
#
#   Kapi bless'i DEGIL commit'i tutuyor, bilerek: karari vermek icin yeni
#   rakamlar gerekiyor, rakamlari uretmek icin de bless. Tavuk-yumurta yerine
#   soru, degisikligin kalici olacagi yerde soruluyor.
#
# Sozlesme:
#   - `fiyat-degisikligi` skill'i tutarlari Turkce bir tabloya cevirip ONAY
#     aldiktan SONRA sahnelenmis golden diff'inin ozetini su dosyaya yaziyor:
#       "$(git rev-parse --git-dir)/price-decision-pass"
#   - Bir golden daha degisirse ozet degisiyor ve kapi yeniden kuruluyor.
#   - Cikis 2 = blokla (stderr Claude'a geri veriliyor). Cikis 0 = izin ver.
#
# Bu hook LLM CAGIRMIYOR ve cagiramaz: hook'lar deterministik kabuk komutlari.
# Dusunen taraf skill, bu taraf yalnizca "karar verildi mi" sorusunu soruyor.
#
# Kural: umit-mobilya-server/.claude/rules/13-price-net.md
#        .claude/skills/fiyat-degisikligi/SKILL.md

payload="$(cat)"
command="$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')"

case "$command" in
  *"git commit"*) ;;
  *) exit 0 ;;
esac

if [[ "${SKIP_PRICE_DECISION:-}" == "1" ]]; then
  printf 'Fiyat karar kapisi atlandi (SKIP_PRICE_DECISION=1).\n' >&2
  exit 0
fi

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0

GOLDENS='umit-mobilya-server/test/price-net/__goldens__'

changed="$(git -C "$repo_root" diff --cached --name-only -- "$GOLDENS" 2>/dev/null || true)"
[[ -z "$changed" ]] && exit 0

marker="$(git -C "$repo_root" rev-parse --absolute-git-dir)/price-decision-pass"
current="$(git -C "$repo_root" diff --cached -- "$GOLDENS" | shasum -a 256 | cut -d' ' -f1)"
recorded="$(head -1 "$marker" 2>/dev/null || true)"

[[ "$recorded" == "$current" ]] && exit 0

# Kapi blokluyor ama kor bırakmıyor: hangi dosyanin hangi tutari oynadigini
# burada gostermek, skill'in isini hizlandiriyor ve insanin okuyacagi rakamin
# gercekten diff'te oldugunu kanitliyor.
moved="$(git -C "$repo_root" diff --cached -U0 -- "$GOLDENS" \
  | grep -E '^[-+].*"(total|displayTotal)"' \
  | head -20 || true)"

{
  printf 'BLOCKED: bu commit fiyat golden(lari) tasiyor ama fiyat karari kayitli degil.\n\n'
  printf 'Degisen golden dosyalari:\n'
  printf '%s\n' "$changed" | sed 's|.*/||; s|^|  |'

  if [[ -n "$moved" ]]; then
    printf '\nOynayan tutarlar (- eski / + yeni):\n'
    printf '%s\n' "$moved" | sed 's|^|  |'
  else
    printf '\nToplamlarda oynama gorunmuyor — yeni bir golden eklenmis olabilir.\n'
  fi

  cat <<'EOF'

`fiyat-degisikligi` skill'ini calistir. Skill:
  1. her golden icin eski -> yeni tutari ve yuzde farkini Turkce bir tabloya
     cevirir (ham JSON okutmaz),
  2. bu bir KARAR mi (zam/indirim/yeni tasarim) yoksa bir HATA mi diye sorar,
  3. hata ise commit'i tutar ve sebebi bulunur,
  4. karar ise onayi alip kaydeder ve commit serbest kalir.

Bir tutarin oynamasi her zaman bir karardir: musteriye giden rakam degisiyor.
Bilerek atlamak gerekiyorsa: SKIP_PRICE_DECISION=1
Kural: umit-mobilya-server/.claude/rules/13-price-net.md
EOF
} >&2

exit 2
