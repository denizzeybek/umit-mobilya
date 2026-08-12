#!/usr/bin/env bash
set -uo pipefail

# `git push` oncesi e2e kapisi.
#
# Neden burada: `main` deploy ediliyor (Netlify + Railway), arada CI yok ve
# review adimi yok. Commit hook'u lint / type-check / sunucu testlerini zaten
# kosuyor; bu kapi onun goremedigi tek katmani kosuyor — TARAYICI.
#
# Ucu de hermetik: e2e kendi Nest sunucusunu bellek ici bir mongod ustunde
# kaldiriyor. Ayakta duran bir dev ortami, yerel Mongo ya da .env gerekmiyor,
# yani "bugun kosturamadim" diye atlanacak bir kapi degil.
#
# Kural: .claude/rules/done-checklist.md, git-workflow.md
#        umit-mobilya-client/.claude/rules/11-e2e-conventions.md
#        umit-mobilya-server/.claude/rules/13-price-net.md

payload="$(cat)"
command="$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')"

printf '%s' "$command" \
  | grep -Eq '(^|[;&|(][[:space:]]*)git([[:space:]]+-[cC][[:space:]]*[^[:space:]]+)*[[:space:]]+push([[:space:]]|$)' \
  || exit 0

case "$command" in
  *--dry-run*|*--help*) exit 0 ;;
esac

if [[ "${SKIP_E2E_GATE:-}" == "1" ]]; then
  printf 'e2e kapisi atlandi (SKIP_E2E_GATE=1).\n' >&2
  exit 0
fi

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[[ -z "$repo_root" ]] && exit 0

client="$repo_root/umit-mobilya-client"
server="$repo_root/umit-mobilya-server"

block() {
  {
    printf 'BLOCKED: e2e kapisi kirmizi — push yapilmadi.\n\n%s\n' "$1"
    if [[ -n "${2:-}" && -f "${2:-}" ]]; then
      printf '\n--- son 30 satir ---\n'
      tail -30 "$2"
    fi
    printf '\nDuzelt ve tekrar dene. Bilerek gecmek gerekiyorsa: SKIP_E2E_GATE=1\n'
    printf 'Kural: .claude/rules/done-checklist.md\n'
  } >&2
  exit 2
}

# Bagimliliklari kurulu olmayan bir makinede kapiyi sessizce gecirmek yerine
# ne eksik oldugunu soyleyip blokluyoruz: sessizce atlanan kapi, olmayan kapidir.
[[ -d "$server/node_modules" ]] || block "Sunucu bagimliliklari yok. cd umit-mobilya-server && yarn install"
[[ -d "$client/node_modules" ]] || block "Istemci bagimliliklari yok. cd umit-mobilya-client && yarn install"

if [[ ! -d "$client/node_modules/@playwright/test" ]]; then
  block "Playwright kurulu degil.
  cd umit-mobilya-client && yarn install && npx playwright install chromium"
fi

run() { # run <etiket> <dizin> <yarn-script>
  local label="$1" dir="$2" script="$3"
  local log="/tmp/umb-e2e-gate-${script//[^a-zA-Z0-9]/-}.log"

  printf '> %s ...\n' "$label" >&2
  if ! (cd "$dir" && yarn --silent "$script") >"$log" 2>&1; then
    block "$label BASARISIZ." "$log"
  fi
  rm -f "$log"
}

# Fiyat agi + characterization: hermetik, bellek ici mongod, ~35 sn.
# Commit hook'u da kosuyor ama bu kapi onun kosup kosmadigina bagli olamaz —
# her commit Claude uzerinden atilmiyor.
run "sunucu testleri (fiyat agi + characterization)" "$server" test

# Tarayici katmani: commit hook'unun goremedigi tek sey.
run "e2e:smoke (butun route'lar aciliyor)" "$client" e2e:smoke
run "e2e:journeys (fiyat round-trip, paylasim baglantisi, 3B)" "$client" e2e:journeys

printf 'e2e kapisi yesil.\n' >&2
exit 0
