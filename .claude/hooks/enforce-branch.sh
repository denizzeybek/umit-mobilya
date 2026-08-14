#!/usr/bin/env bash
set -uo pipefail

# PreToolUse(Write|Edit) kapisi — `main` uzerindeyken repo icindeki hicbir
# dosyaya yazilmasina izin vermez.
#
# Neden:
#   `main` deploy edilen dal (Netlify + Railway) ve arada CI yok. git-workflow.md
#   "dalda calis" diyor ama bugun bunu uygulayan hicbir sey yoktu: yalnizca
#   `git push` aninda soran bir uyari vardi — yani is bittikten SONRA, degisiklik
#   zaten main'e yazilmisken.
#
#   Dal, geri almanin en ucuz yolu. Bir dalda yapilan is begenilmezse dal
#   silinir ve hicbir sey olmamis olur; main'e yazilmis is icin ayni sey
#   dogru degil.
#
# Kapsam bilerek geniş: kod, test, kural, doküman — hepsi. Bir dal acmak iki
# saniye, ve "sadece dokuman" diye baslayan bir oturum kod yazarak devam ediyor.
#
# Kacis: SKIP_BRANCH_GUARD=1 (bir karardir, sebebini soyle)
#
# Kural: .claude/rules/git-workflow.md

payload="$(cat)"
file_path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // ""')"

[[ -z "$file_path" ]] && exit 0

if [[ "${SKIP_BRANCH_GUARD:-}" == "1" ]]; then
  exit 0
fi

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[[ -z "$repo_root" ]] && exit 0

# Repo disindaki dosyalar kapsam disi: scratchpad, gecici dosyalar, ev dizini.
#
# Onek karsilastirmasi ("$repo_root"/*) YAPILMIYOR, cunku macOS'ta yollar
# simgesel bag uzerinden geliyor: `mktemp -d` /var/... verirken
# `rev-parse --show-toplevel` /private/var/... donuyor ve onek tutmuyordu —
# yani muhafiz sessizce ACIK kaliyordu. Bunu kok hook testi yakaladi.
#
# Bunun yerine dosyanin BULUNDUGU yerin depo kokunu git'e soruyoruz: iki tarafi
# da git cozumluyor, ve dosya baska bir depodaysa da dogru cevap cikiyor.
target_dir="$(dirname "$file_path")"
while [[ ! -d "$target_dir" && "$target_dir" == */* ]]; do
  target_dir="$(dirname "$target_dir")"
done

file_root="$(git -C "$target_dir" rev-parse --show-toplevel 2>/dev/null || true)"
[[ "$file_root" != "$repo_root" ]] && exit 0

branch="$(git -C "$repo_root" rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
[[ "$branch" != "main" ]] && exit 0

relative="${file_path#"$repo_root"/}"

cat >&2 <<EOF
BLOCKED: \`main\` uzerindesin — repo icine yazilamaz.

  yazilmak istenen: $relative

\`main\` deploy edilen dal ve arada CI yok: buraya yazilan her sey, gozden
gecirilmeden yayina giden sey demek. Once bir dal ac, sonra ayni duzenlemeyi
tekrar dene:

  git checkout -b <tur>/<kisa-ad>

Tur onegi niyeti soyler: feat/ yeni ozellik, fix/ hata, chore/ bakim,
refactor/ davranis degistirmeyen duzenleme. Ad degisikligi anlatir, numarayi
degil — ornek: feat/mutfak-modulu, fix/teklif-pdf-bos.

Is bitince \`yayinla\` skill'i dali kapilardan gecirip main'e alir.

Bilerek atlamak gerekiyorsa: SKIP_BRANCH_GUARD=1
Kural: .claude/rules/git-workflow.md
EOF

exit 2
