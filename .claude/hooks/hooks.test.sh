#!/usr/bin/env bash
# Kok hook'larin kendi testleri — dort commit/push kapisi + dal muhafizi.
#
#   bash .claude/hooks/hooks.test.sh
#
# Neden var: bu dort kapi hicbir testin kapsaminda degildi, oysa hepsi bir
# `case`/`grep` desenine dayaniyor ve bozuk bir desen FAIL-OPEN olur — kapi
# sessizce acilir ve kimse fark etmez. done-checklist.md bunu kendisi yaziyor:
# "sessizce atlanan kapi, olmayan kapidir."
#
# Kapilar git DURUMUNA bakiyor (sahnelenmis dosya, aktif dal, marker), o yuzden
# testler gecici bir depoda kuruluyor — bu reponun kendi durumuna dokunmadan.
#
# Yeni bir hook davranisi eklerken once buraya bir satir yaz.

set -uo pipefail
cd "$(dirname "$0")/../.." || exit 1

ROOT="$(pwd)"
HOOKS="$ROOT/.claude/hooks"
pass=0
fail=0
FIXTURES=()

cleanup() {
  local d
  for d in ${FIXTURES+"${FIXTURES[@]}"}; do
    [[ -n "$d" && "$d" == /*/* ]] && rm -rf "$d"
  done
}
trap cleanup EXIT

check() { # check <beklenen> <gelen> <hook> <ad>
  if [[ "$2" == "$1" ]]; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
    printf 'FAIL  %-26s %s (beklenen %s, gelen %s)\n' "$3" "$4" "$1" "$2"
  fi
}

# bash_hook <dizin> <beklenen> <hook> <komut> <ad> [ENV=deger ...]
bash_hook() {
  local dir="$1" want="$2" hook="$3" cmd="$4" name="$5"
  shift 5
  local got=0
  if jq -n --arg c "$cmd" '{tool_name:"Bash",tool_input:{command:$c}}' \
    | (cd "$dir" && env "$@" bash "$HOOKS/$hook.sh") >/dev/null 2>&1; then
    got=0
  else
    got=$?
  fi
  check "$want" "$got" "$hook" "$name"
}

# write_hook <dizin> <beklenen> <hook> <dosya> <ad> [ENV=deger ...]
write_hook() {
  local dir="$1" want="$2" hook="$3" path="$4" name="$5"
  shift 5
  local got=0
  if jq -n --arg p "$path" \
    '{tool_name:"Write",tool_input:{file_path:$p,content:"x"}}' \
    | (cd "$dir" && env "$@" bash "$HOOKS/$hook.sh") >/dev/null 2>&1; then
    got=0
  else
    got=$?
  fi
  check "$want" "$got" "$hook" "$name"
}

GOLDENS='umit-mobilya-server/test/price-net/__goldens__'

# Gercek reponun agac yapisini taklit eden, tek commit'lik bos bir depo.
fixture() {
  local d
  d="$(mktemp -d)"
  FIXTURES+=("$d")
  git -C "$d" init -q -b main >/dev/null 2>&1
  git -C "$d" config user.email 'test@example.com'
  git -C "$d" config user.name 'Test'
  mkdir -p "$d/$GOLDENS" "$d/umit-mobilya-client/src/views" \
    "$d/umit-mobilya-server/src/quote" "$d/umit-mobilya-client/src/client"
  printf 'x\n' >"$d/README.md"
  git -C "$d" add -A >/dev/null 2>&1
  git -C "$d" commit -qm init >/dev/null 2>&1
  printf '%s' "$d"
}

stage() { # stage <depo> <yol> <icerik>
  mkdir -p "$(dirname "$1/$2")"
  printf '%s\n' "$3" >"$1/$2"
  git -C "$1" add "$2" >/dev/null 2>&1
}

# ---------------------------------------------------------------- dal muhafizi

printf '\n— enforce-branch —\n'
fx="$(fixture)"

write_hook "$fx" 2 enforce-branch "$fx/umit-mobilya-client/src/views/A.vue" \
  'main uzerinde kod yazimi'
write_hook "$fx" 2 enforce-branch "$fx/README.md" \
  'main uzerinde dokuman yazimi da bloklu'
write_hook "$fx" 2 enforce-branch "$fx/.claude/rules/x.md" \
  'main uzerinde kural yazimi da bloklu'
write_hook "$fx" 0 enforce-branch '/tmp/scratch-not-in-repo.txt' \
  'repo disi dosya kapsam disi'
write_hook "$fx" 0 enforce-branch "$fx/README.md" \
  'kacis: SKIP_BRANCH_GUARD' SKIP_BRANCH_GUARD=1

git -C "$fx" checkout -q -b feat/deneme
write_hook "$fx" 0 enforce-branch "$fx/umit-mobilya-client/src/views/A.vue" \
  'dal uzerinde yazim serbest'

# ------------------------------------------------------------- fiyat karari

printf '\n— enforce-price-decision —\n'
fx="$(fixture)"
git -C "$fx" checkout -q -b feat/fiyat

bash_hook "$fx" 0 enforce-price-decision 'yarn build' \
  'commit olmayan komut'
bash_hook "$fx" 0 enforce-price-decision 'git commit -m x' \
  'golden sahnelenmemis'

stage "$fx" "$GOLDENS/gardirop-standart.json" '{"displayTotal": 57760}'
bash_hook "$fx" 2 enforce-price-decision 'git commit -m x' \
  'golden var, karar yok'
bash_hook "$fx" 0 enforce-price-decision 'git commit -m x' \
  'kacis: SKIP_PRICE_DECISION' SKIP_PRICE_DECISION=1

# Karari kaydet — skill'in yazdigi bicimin aynisi.
{
  git -C "$fx" diff --cached -- "$GOLDENS" | shasum -a 256 | cut -d' ' -f1
  echo 'yeni golden, kiyas yok'
} >"$fx/.git/price-decision-pass"
bash_hook "$fx" 0 enforce-price-decision 'git commit -m x' \
  'karar kayitli, ayni diff'

# Bir golden daha degisince ozet bayatlar ve kapi yeniden kurulur.
stage "$fx" "$GOLDENS/vestiyer-standart.json" '{"displayTotal": 24880}'
bash_hook "$fx" 2 enforce-price-decision 'git commit -m x' \
  'diff degisti, karar bayat'

# ---------------------------------------------------------------- e2e karari

printf '\n— enforce-e2e-decision —\n'
fx="$(fixture)"
git -C "$fx" checkout -q -b feat/e2e

bash_hook "$fx" 0 enforce-e2e-decision 'yarn test' 'commit olmayan komut'
bash_hook "$fx" 0 enforce-e2e-decision 'git commit -m x' 'hicbir sey sahnelenmemis'

stage "$fx" 'README.md' 'yeni satir'
bash_hook "$fx" 0 enforce-e2e-decision 'git commit -m x' \
  'yalnizca dokuman: kapi tetiklenmez'

stage "$fx" 'umit-mobilya-client/src/client/index.ts' 'export const a = 1;'
bash_hook "$fx" 0 enforce-e2e-decision 'git commit -m x' \
  'uretilmis istemci kapsam disi'

stage "$fx" 'umit-mobilya-server/src/quote/quote.service.spec.ts' 'it("x", () => {});'
bash_hook "$fx" 0 enforce-e2e-decision 'git commit -m x' \
  'spec kapsam disi'

stage "$fx" 'umit-mobilya-client/src/views/A.vue' '<template>x</template>'
bash_hook "$fx" 2 enforce-e2e-decision 'git commit -m x' \
  'davranisa dokunan dosya, karar yok'
bash_hook "$fx" 0 enforce-e2e-decision 'git commit -m x' \
  'kacis: SKIP_E2E_DECISION' SKIP_E2E_DECISION=1

{
  git -C "$fx" diff --cached | shasum -a 256 | cut -d' ' -f1
  echo 'saf hesap, vitest kapsiyor'
} >"$fx/.git/e2e-decision-pass"
bash_hook "$fx" 0 enforce-e2e-decision 'git commit -m x' 'karar kayitli'

# ------------------------------------------------------------- ai inceleme

printf '\n— pre-push-ai-review —\n'
fx="$(fixture)"

bash_hook "$fx" 0 pre-push-ai-review 'git status' 'push olmayan komut'
bash_hook "$fx" 0 pre-push-ai-review 'echo git push' \
  'metnin icindeki "git push" tetiklemez'
bash_hook "$fx" 2 pre-push-ai-review 'git push' 'onay yok'
bash_hook "$fx" 2 pre-push-ai-review 'git push origin feat/x' \
  'onay yok (uzak + dal)'
bash_hook "$fx" 0 pre-push-ai-review 'git push --dry-run' 'dry-run muaf'
bash_hook "$fx" 0 pre-push-ai-review 'git push' \
  'kacis: SKIP_AI_REVIEW' SKIP_AI_REVIEW=1

git -C "$fx" rev-parse HEAD >"$fx/.git/ai-review-pass"
bash_hook "$fx" 0 pre-push-ai-review 'git push' 'onay HEAD ile eslesiyor'

printf 'stale\n' >"$fx/.git/ai-review-pass"
bash_hook "$fx" 2 pre-push-ai-review 'git push' 'onay bayat'

# ----------------------------------------- matcher-only: suite kosturmuyoruz

printf '\n— pre-push-e2e-gate (yalnizca matcher) —\n'
fx="$(fixture)"
bash_hook "$fx" 0 pre-push-e2e-gate 'git status' 'push olmayan komut'
bash_hook "$fx" 0 pre-push-e2e-gate 'git push --dry-run' 'dry-run muaf'
bash_hook "$fx" 0 pre-push-e2e-gate 'git push' \
  'kacis: SKIP_E2E_GATE' SKIP_E2E_GATE=1

printf '\n— enforce-pre-commit-quality (yalnizca matcher) —\n'
bash_hook "$fx" 0 enforce-pre-commit-quality 'yarn lint' 'commit olmayan komut'
bash_hook "$fx" 0 enforce-pre-commit-quality 'git commit -m x' \
  'hicbir sey sahnelenmemis'

# ---------------------------------------------------------------------- ozet

printf '\n%s\n' '────────────────────────'
printf 'gecti: %d   kirildi: %d\n' "$pass" "$fail"
[[ "$fail" -eq 0 ]] || exit 1
