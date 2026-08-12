#!/usr/bin/env bash
# Hook'larin kendi testleri. Vitest bunlari kosamaz (bash + stdin sozlesmesi),
# ama elle jq cagirmak da tekrarlanabilir degil.
#
#   bash .claude/hooks/hooks.test.sh
#
# Yeni bir hook davranisi eklerken once buraya bir satir yaz.

set -uo pipefail
cd "$(dirname "$0")/../.." || exit 1

ROOT="$(pwd)"
HOOKS="$ROOT/.claude/hooks"
pass=0
fail=0

# expect <beklenen_exit> <hook> <dosya_yolu> <icerik> <aciklama>
expect() {
  local want="$1" hook="$2" path="$3" body="$4" name="$5"
  local got
  jq -n --arg p "$path" --arg c "$body" \
    '{tool_name:"Write",tool_input:{file_path:$p,content:$c}}' \
    | bash "$HOOKS/$hook.sh" >/dev/null 2>&1
  got=$?

  if [[ "$got" == "$want" ]]; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
    printf 'FAIL  %-22s %s (beklenen %s, gelen %s)\n' "$hook" "$name" "$want" "$got"
  fi
}

C="$ROOT/src/views/configurator"

printf '\n— enforce-file-size —\n'
big="$(python3 -c "print('\n'.join(['const a = 1;'] * 300))")"
small="$(python3 -c "print('\n'.join(['const a = 1;'] * 100))")"
expect 2 enforce-file-size "$ROOT/src/views/x/y.ts" "$big" "300 satirlik yeni dosya"
expect 0 enforce-file-size "$ROOT/src/views/x/y.ts" "$small" "100 satirlik dosya"
expect 0 enforce-file-size "$ROOT/src/plugins/primeVue/flexytheme.ts" "$big" "muaf: flexytheme"
expect 0 enforce-file-size "$ROOT/src/client/core/request.ts" "$big" "muaf: uretilmis istemci"
expect 0 enforce-file-size "$ROOT/src/views/x/y.spec.ts" "$big" "muaf: spec"

printf '\n— enforce-ui-controls —\n'
expect 2 enforce-ui-controls "$ROOT/src/views/a/B.vue" '<template><input /></template>' "ham input"
expect 2 enforce-ui-controls "$ROOT/src/views/a/B.vue" '<template><select /></template>' "ham select"
expect 2 enforce-ui-controls "$ROOT/src/views/a/B.vue" '<template><textarea /></template>' "ham textarea"
expect 0 enforce-ui-controls "$ROOT/src/views/a/B.vue" \
  '<template>
  <!-- raw-control: PrimeVue karsiligi yok -->
  <input type="file" />
</template>' "gerekceli ham kontrol"
expect 0 enforce-ui-controls "$ROOT/src/views/a/B.vue" '<template><InputNumber /></template>' "PrimeVue bileseni"
expect 0 enforce-ui-controls "$ROOT/src/components/ui/global/Input.vue" '<template><input /></template>' "muaf: F* sarmalayici"

printf '\n— enforce-product-isolation —\n'
expect 2 enforce-product-isolation "$C/_etc/products/mutfak/build.ts" \
  "import { x } from '../gardirop/options';" "kardes urun importu"
expect 2 enforce-product-isolation "$C/_components/products/mutfak/F.vue" \
  "import { x } from '../../../_etc/products/gardirop/options';" "bilesenden capraz import"
expect 0 enforce-product-isolation "$C/_etc/products/mutfak/build.ts" \
  "import { x } from './options';" "kendi klasoru"
expect 0 enforce-product-isolation "$C/_etc/products/mutfak/build.ts" \
  "import { x } from '../../geometry/carcass';" "paylasilan geometry"
expect 0 enforce-product-isolation "$C/_etc/products/mutfak/build.ts" \
  "import { x } from '../../price/shared';" "paylasilan price"
expect 0 enforce-product-isolation "$C/_etc/products/mutfak/build.ts" \
  "import { x } from '../../types';" "paylasilan types"
expect 0 enforce-product-isolation "$C/_components/products/mutfak/F.vue" \
  "import { x } from '../../../_etc/products/mutfak/options';" "bilesenden kendi urunu"
expect 0 enforce-product-isolation "$C/_components/products/mutfak/F.vue" \
  "import { x } from '../../../_etc/dimensionOps';" "paylasilan ops"
# views/products/ katalog ozelligi; bu hook onu hic gormemeli
expect 0 enforce-product-isolation "$ROOT/src/views/products/_views/ProductsList.vue" \
  "import ProductCard from '../_components/ProductCard.vue';" "katalog ozelligi kapsam disi"

printf '\n— enforce-lazy-boundary —\n'
expect 2 enforce-lazy-boundary "$ROOT/src/composables/useSiteNav.ts" \
  "import { PRODUCTS } from '@/views/configurator/_etc/registry';" "registry importu"
expect 2 enforce-lazy-boundary "$ROOT/src/router/index.ts" \
  "import { x } from '@/views/configurator/_etc/products/gardirop';" "urun modulu importu"
expect 0 enforce-lazy-boundary "$ROOT/src/composables/useSiteNav.ts" \
  "import { PRODUCT_SUMMARIES } from '@/views/configurator/_etc/productList';" "hafif liste"
expect 0 enforce-lazy-boundary "$ROOT/src/composables/useSiteNav.ts" \
  "import { EProductType } from '@/views/configurator/_etc/types';" "hafif tipler"
expect 0 enforce-lazy-boundary "$ROOT/src/router/routes.ts" \
  "component: () => import('@/views/configurator/_views/ConfiguratorRoute.vue')," "tembel route tanimi"
expect 0 enforce-lazy-boundary "$ROOT/src/views/configurator/_views/Configurator.vue" \
  "import { PRODUCTS } from '../_etc/registry';" "konfiguratorun kendi ici"

# Three.js sinirinin kendisi: kural bugune kadar YALNIZCA konfigurator
# yollarini ariyordu, `three` paketini hic gormuyordu. Ana sayfaya
# `import * as THREE from 'three'` yazilabiliyordu ve hicbir sey otmuyordu.
expect 2 enforce-lazy-boundary "$ROOT/src/views/dashboard/_components/HomeHero.vue" \
  "import * as THREE from 'three';" "ana sayfada three importu"
expect 2 enforce-lazy-boundary "$ROOT/src/layouts/default/DefaultLayout.vue" \
  "import { Group } from 'three';" "layout'ta three importu"
expect 2 enforce-lazy-boundary "$ROOT/src/composables/useSiteNav.ts" \
  "import { useThreeScene } from '@/composables/useThreeScene';" "sahne composable importu"
# Dinamik import ve type import zaten kapsam disi.
expect 0 enforce-lazy-boundary "$ROOT/src/views/dashboard/_components/HomeHero.vue" \
  "const THREE = await import('three');" "dinamik three importu"
expect 0 enforce-lazy-boundary "$ROOT/src/views/dashboard/_components/HomeHero.vue" \
  "import type { Group } from 'three';" "three tip importu"
# Sahneye ayrilmis tembel klasor serbest.
expect 0 enforce-lazy-boundary "$ROOT/src/components/three/lazy/HeroScene.vue" \
  "import * as THREE from 'three';" "tembel sahne klasoru"

printf '\n— mevcut kaynak agaci —\n'
while IFS= read -r file; do
  body="$(cat "$file")"
  for hook in enforce-file-size enforce-ui-controls enforce-product-isolation enforce-lazy-boundary; do
    expect 0 "$hook" "$ROOT/${file#./}" "$body" "${file#./}"
  done
done < <(find src -type f \( -name '*.vue' -o -name '*.ts' \) -not -path 'src/client/*')

printf '\n%d gecti, %d kaldi\n' "$pass" "$fail"
[[ "$fail" -eq 0 ]]
